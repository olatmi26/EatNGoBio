<?php
namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Employee;
use App\Models\LeaveRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class EmployeeSelfService
{
    public function getDashboardSummary(Employee $employee): array
    {
        $cacheKey = "dashboard_{$employee->id}_" . now()->format('Ymd');

        return Cache::remember($cacheKey, 60, function () use ($employee) {
            $today      = Carbon::today();
            $monthStart = Carbon::today()->startOfMonth();

            $checkIn = AttendanceLog::where('employee_pin', $employee->employee_id)
                ->whereDate('punch_time', $today)
                ->where('punch_type', 0)
                ->first();

            $checkOut = AttendanceLog::where('employee_pin', $employee->employee_id)
                ->whereDate('punch_time', $today)
                ->where('punch_type', 1)
                ->first();

            $monthlyLogs = AttendanceLog::where('employee_pin', $employee->employee_id)
                ->whereBetween('punch_time', [$monthStart, now()])
                ->get();

            $presentDays = $monthlyLogs->where('punch_type', 0)
                ->groupBy(fn($l) => $l->punch_time->format('Y-m-d'))
                ->count();

            $totalWorkHours = $this->calculateMonthlyHours($monthlyLogs);

            return [
                'today'            => [
                    'checked_in'     => ! is_null($checkIn),
                    'checked_out'    => ! is_null($checkOut),
                    'check_in_time'  => $checkIn?->punch_time->format('H:i'),
                    'check_out_time' => $checkOut?->punch_time->format('H:i'),
                    'status'         => $this->getTodayStatus($checkIn, $checkOut),
                ],
                'monthly'          => [
                    'present_days'   => $presentDays,
                    'total_hours'    => round($totalWorkHours, 1),
                    'overtime_hours' => round(max(0, $totalWorkHours - ($presentDays * 8)), 1),
                ],
                'upcoming_shift'   => $this->getUpcomingShift($employee),
                'leave_balance'    => $this->getLeaveBalance($employee),
                'attendance_score' => app(AnomalyDetectionService::class)
                    ->calculateAttendanceScore($employee, 30),
                'recent_activity'  => $this->getRecentActivity($employee),
                'team_attendance'  => $this->getTeamAttendance($employee),
            ];
        });
    }

    public function submitLeaveRequest(Employee $employee, array $data): LeaveRequest
    {
        $leaveRequest = LeaveRequest::create([
            'employee_id' => $employee->id,
            'leave_type'  => $data['type'],
            'start_date'  => $data['start_date'],
            'end_date'    => $data['end_date'],
            'total_days'  => $this->calculateLeaveDays($data['start_date'], $data['end_date']),
            'reason'      => $data['reason'],
            'status'      => 'pending',
            'attachments' => $data['attachments'] ?? null,
        ]);

        return $leaveRequest;
    }

    private function getTodayStatus($checkIn, $checkOut): string
    {
        if (! $checkIn) {
            return 'Not Checked In';
        }

        if (! $checkOut) {
            return 'Checked In';
        }

        return 'Completed';
    }

    private function calculateMonthlyHours($logs): float
    {
        $totalMinutes = 0;
        $logsByDate   = $logs->groupBy(fn($l) => $l->punch_time->format('Y-m-d'));

        foreach ($logsByDate as $dayLogs) {
            $checkIn  = $dayLogs->where('punch_type', 0)->first();
            $checkOut = $dayLogs->where('punch_type', 1)->last();

            if ($checkIn && $checkOut) {
                $minutes = $checkIn->punch_time->diffInMinutes($checkOut->punch_time);
                // Handle overnight shifts
                if ($checkOut->punch_time->lt($checkIn->punch_time)) {
                    $minutes = $checkIn->punch_time->diffInMinutes($checkOut->punch_time->addDay());
                }
                $totalMinutes += $minutes;
            }
        }

        return $totalMinutes / 60;
    }

    private function getUpcomingShift(Employee $employee): ?array
    {
        $tomorrow = Carbon::tomorrow();
        $shift    = $employee->activeShiftAssignment?->shift;

        if (! $shift) {
            return null;
        }

        return [
            'date'            => $tomorrow->format('Y-m-d'),
            'day'             => $tomorrow->format('l'),
            'start_time'      => $shift->start_time,
            'end_time'        => $shift->end_time,
            'check_in_window' => Carbon::parse($shift->start_time)->subMinutes(30)->format('H:i') . ' - ' .
            Carbon::parse($shift->start_time)->addMinutes(15)->format('H:i'),
        ];
    }

    private function getLeaveBalance(Employee $employee): array
    {
        $currentYear = now()->year;

        $usedAnnual = LeaveRequest::where('employee_id', $employee->id)
            ->where('leave_type', 'annual')
            ->where('status', 'approved')
            ->whereYear('start_date', $currentYear)
            ->sum('total_days');

        $usedSick = LeaveRequest::where('employee_id', $employee->id)
            ->where('leave_type', 'sick')
            ->where('status', 'approved')
            ->whereYear('start_date', $currentYear)
            ->sum('total_days');

        return [
            'annual'           => 20,
            'annual_used'      => $usedAnnual,
            'annual_remaining' => 20 - $usedAnnual,
            'sick'             => 10,
            'sick_used'        => $usedSick,
            'sick_remaining'   => 10 - $usedSick,
        ];
    }

    private function getRecentActivity(Employee $employee): array
    {
        return AttendanceLog::where('employee_pin', $employee->employee_id)
            ->with('device')
            ->orderByDesc('punch_time')
            ->limit(5)
            ->get()
            ->map(fn($log) => [
                'type'   => $log->punch_type_label,
                'time'   => $log->punch_time->format('D, M d - H:i'),
                'device' => $log->device?->name ?? 'Unknown',
                'method' => $log->verify_type_label,
            ])
            ->toArray();
    }

    private function getTeamAttendance(Employee $employee): array
    {
        if (! $employee->department) {
            return [];
        }

        $today = Carbon::today();

        $teamMembers = Employee::where('department', $employee->department)
            ->where('id', '!=', $employee->id)
            ->where('active', true)
            ->limit(5)
            ->get();

        $teamStatus = [];

        foreach ($teamMembers as $member) {
            $hasCheckedIn = AttendanceLog::where('employee_pin', $member->employee_id)
                ->whereDate('punch_time', $today)
                ->where('punch_type', 0)
                ->exists();

            $teamStatus[] = [
                'name'     => $member->first_name,
                'initials' => $member->initials,
                'status'   => $hasCheckedIn ? 'present' : 'not_checked_in',
            ];
        }

        return $teamStatus;
    }

    private function calculateLeaveDays(string $start, string $end): float
    {
        $start = Carbon::parse($start);
        $end   = Carbon::parse($end);
        $days  = 0;

        while ($start->lte($end)) {
            if (! $start->isWeekend()) {
                $days++;
            }
            $start->addDay();
        }

        return $days;
    }
}
