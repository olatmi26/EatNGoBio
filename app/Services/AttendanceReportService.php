<?php
namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Employee;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AttendanceReportService
{
    /**
     * Generate comprehensive attendance summary report
     */
    public function generateSummaryReport(Carbon $from, Carbon $to, array $filters = []): array
    {
        $cacheKey = "attendance_summary_{$from->format('Ymd')}_{$to->format('Ymd')}_" . md5(json_encode($filters));

        return Cache::remember($cacheKey, 3600, function () use ($from, $to, $filters) {
            $employees = $this->getEmployeesForReport($filters);
            $workDays  = $this->calculateWorkDays($from, $to);

            // Pre-load all attendance logs for the period
            $allLogs = $this->loadAttendanceLogs($from, $to, $employees->pluck('employee_id')->toArray());

            $rows    = [];
            $summary = [
                'total_employees'         => $employees->count(),
                'total_present'           => 0,
                'total_absent'            => 0,
                'total_late'              => 0,
                'total_half_days'         => 0,
                'total_work_hours'        => 0,
                'total_overtime_hours'    => 0,
                'average_attendance_rate' => 0,
            ];

            foreach ($employees as $employee) {
                $row = $this->calculateEmployeeAttendance(
                    $employee,
                    $from,
                    $to,
                    $workDays,
                    $allLogs[$employee->employee_id] ?? collect()
                );

                $rows[] = $row;

                // Aggregate summary
                $summary['total_present']        += $row['present_days'];
                $summary['total_absent']         += $row['absent_days'];
                $summary['total_late']           += $row['late_days'];
                $summary['total_half_days']      += $row['half_days'];
                $summary['total_work_hours']     += $row['total_work_hours'];
                $summary['total_overtime_hours'] += $row['overtime_hours'];
            }

            if ($employees->count() > 0) {
                $summary['average_attendance_rate'] = round(
                    ($summary['total_present'] / ($employees->count() * $workDays)) * 100,
                    2
                );
            }

            return [
                'rows'       => $rows,
                'summary'    => $summary,
                'date_range' => [
                    'from'      => $from->toDateString(),
                    'to'        => $to->toDateString(),
                    'work_days' => $workDays,
                ],
            ];
        });
    }

    /**
     * Generate daily trend report
     */
    public function generateDailyTrend(Carbon $from, Carbon $to, array $filters = []): array
    {
        $employees      = $this->getEmployeesForReport($filters);
        $totalEmployees = $employees->count();
        $employeeIds    = $employees->pluck('employee_id')->toArray();

        $dailyData = [];
        $current   = $from->copy();

        while ($current->lte($to)) {
            if (! $current->isWeekend()) {
                $dateStr = $current->toDateString();

                $presentCount = AttendanceLog::whereDate('punch_time', $current)
                    ->where('punch_type', 0)
                    ->whereIn('employee_pin', $employeeIds)
                    ->distinct('employee_pin')
                    ->count();

                $lateCount   = $this->countLateOnDate($current, $employees);
                $absentCount = $totalEmployees - $presentCount;

                $dailyData[] = [
                    'date'            => $dateStr,
                    'day_name'        => $current->format('D'),
                    'total_employees' => $totalEmployees,
                    'present'         => $presentCount,
                    'absent'          => $absentCount,
                    'late'            => $lateCount,
                    'attendance_rate' => $totalEmployees > 0
                        ? round(($presentCount / $totalEmployees) * 100, 2)
                        : 0,
                ];
            }

            $current->addDay();
        }

        return $dailyData;
    }

    /**
     * Generate payroll report with precise calculations
     */
    public function generatePayrollReport(Carbon $from, Carbon $to, array $filters = []): array
    {
        $employees = $this->getEmployeesForReport($filters);
        $workDays  = $this->calculateWorkDays($from, $to);

        $allLogs = $this->loadAttendanceLogs($from, $to, $employees->pluck('employee_id')->toArray());

        $rows         = [];
        $totalPayroll = 0;

        foreach ($employees as $employee) {
            $basicSalary = $employee->basic_salary ?? 0;
            $dailyRate   = $workDays > 0 ? $basicSalary / $workDays : 0;
            $hourlyRate  = $dailyRate / 8;

            $attendance = $this->calculateEmployeeAttendance(
                $employee,
                $from,
                $to,
                $workDays,
                $allLogs[$employee->employee_id] ?? collect()
            );

            // Precise deductions and additions
            $absentDeduction  = round($dailyRate * $attendance['absent_days'], 2);
            $lateDeduction    = round(($hourlyRate / 60) * $attendance['late_minutes'], 2);
            $halfDayDeduction = round(($dailyRate / 2) * $attendance['half_days'], 2);
            $overtimePay      = round($hourlyRate * 1.5 * $attendance['overtime_hours'], 2);

            $totalDeductions = $absentDeduction + $lateDeduction + $halfDayDeduction;
            $netSalary       = $basicSalary - $totalDeductions + $overtimePay;

            $rows[] = [
                'employee_id'        => $employee->employee_id,
                'employee_name'      => $employee->full_name,
                'department'         => $employee->department ?? '-',
                'area'               => $employee->area ?? '-',
                'basic_salary'       => $basicSalary,
                'daily_rate'         => round($dailyRate, 2),
                'hourly_rate'        => round($hourlyRate, 2),
                'present_days'       => $attendance['present_days'],
                'absent_days'        => $attendance['absent_days'],
                'late_days'          => $attendance['late_days'],
                'late_minutes'       => $attendance['late_minutes'],
                'half_days'          => $attendance['half_days'],
                'work_hours'         => round($attendance['total_work_hours'], 2),
                'overtime_hours'     => round($attendance['overtime_hours'], 2),
                'absent_deduction'   => $absentDeduction,
                'late_deduction'     => $lateDeduction,
                'half_day_deduction' => $halfDayDeduction,
                'total_deductions'   => $totalDeductions,
                'overtime_pay'       => $overtimePay,
                'net_salary'         => round($netSalary, 2),
            ];

            $totalPayroll += $netSalary;
        }

        return [
            'rows'    => $rows,
            'summary' => [
                'total_employees' => count($rows),
                'total_payroll'   => round($totalPayroll, 2),
                'average_salary'  => count($rows) > 0 ? round($totalPayroll / count($rows), 2) : 0,
                'work_days'       => $workDays,
            ],
        ];
    }

    /**
     * Calculate individual employee attendance
     */
    private function calculateEmployeeAttendance(
        Employee $employee,
        Carbon $from,
        Carbon $to,
        int $workDays,
        Collection $logs
    ): array {
        $shift      = $employee->shift;
        $logsByDate = $logs->groupBy(fn($log) => $log->punch_time->format('Y-m-d'));

        $presentDays      = 0;
        $absentDays       = 0;
        $lateDays         = 0;
        $halfDays         = 0;
        $lateMinutes      = 0;
        $totalWorkMinutes = 0;
        $overtimeMinutes  = 0;

        $current = $from->copy();

        while ($current->lte($to)) {
            if (! $current->isWeekend()) {
                $dateStr = $current->toDateString();
                $dayLogs = $logsByDate->get($dateStr, collect());

                $checkIn  = $dayLogs->where('punch_type', 0)->sortBy('punch_time')->first();
                $checkOut = $dayLogs->where('punch_type', 1)->sortByDesc('punch_time')->first();

                if (! $checkIn) {
                    $absentDays++;
                } else {
                    $presentDays++;

                    // Calculate late arrival
                    $expectedStart = $shift?->start_time ?? '08:00';
                    $lateThreshold = $shift?->late_threshold ?? 15;
                    $expectedTime  = Carbon::parse($dateStr . ' ' . $expectedStart);
                    $lateDeadline  = $expectedTime->copy()->addMinutes($lateThreshold);

                    if ($checkIn->punch_time->gt($lateDeadline)) {
                        $lateDays++;
                        $lateMinutes += $checkIn->punch_time->diffInMinutes($expectedTime);
                    }

                    // Calculate work duration
                    if ($checkOut) {
                        $workMinutes       = $checkIn->punch_time->diffInMinutes($checkOut->punch_time);
                        $totalWorkMinutes += $workMinutes;

                        // Check half day
                        if ($workMinutes < 240) {
                            $halfDays++;
                        }

                        // Calculate overtime
                        $expectedWorkMinutes = ($shift?->work_hours ?? 8) * 60;
                        if ($workMinutes > $expectedWorkMinutes) {
                            $overtimeMinutes += ($workMinutes - $expectedWorkMinutes);
                        }
                    }
                }
            }

            $current->addDay();
        }

        return [
            'present_days'     => $presentDays,
            'absent_days'      => $absentDays,
            'late_days'        => $lateDays,
            'late_minutes'     => $lateMinutes,
            'half_days'        => $halfDays,
            'total_work_hours' => round($totalWorkMinutes / 60, 2),
            'overtime_hours'   => round($overtimeMinutes / 60, 2),
            'attendance_rate'  => $workDays > 0 ? round(($presentDays / $workDays) * 100, 2) : 0,
        ];
    }

    /**
     * Count late employees on a specific date
     */
    private function countLateOnDate(Carbon $date, Collection $employees): int
    {
        $lateCount = 0;
        $dateStr   = $date->toDateString();

        foreach ($employees as $employee) {
            $checkIn = AttendanceLog::where('employee_pin', $employee->employee_id)
                ->whereDate('punch_time', $date)
                ->where('punch_type', 0)
                ->first();

            if (! $checkIn) {
                continue;
            }

            $shift         = $employee->shift;
            $expectedStart = $shift?->start_time ?? '08:00';
            $lateThreshold = $shift?->late_threshold ?? 15;
            $expectedTime  = Carbon::parse($dateStr . ' ' . $expectedStart);
            $lateDeadline  = $expectedTime->copy()->addMinutes($lateThreshold);

            if ($checkIn->punch_time->gt($lateDeadline)) {
                $lateCount++;
            }
        }

        return $lateCount;
    }

    /**
     * Get employees for report with filters
     */
    private function getEmployeesForReport(array $filters): Collection
    {
        $query = Employee::with('shift')->where('active', true);

        if (! empty($filters['department'])) {
            $query->where('department', $filters['department']);
        }

        if (! empty($filters['area'])) {
            $query->where('area', $filters['area']);
        }

        if (! empty($filters['location'])) {
            $query->where('location_id', $filters['location']);
        }

        // Apply user access control
        if (! empty($filters['user_id'])) {
            $user = \App\Models\User::find($filters['user_id']);
            if ($user && ! $user->hasRole('Super Admin')) {
                $accessibleAreas = $user->getAccessibleAreas();
                $query->whereIn('area', $accessibleAreas);
            }
        }

        return $query->get();
    }

    /**
     * Load all attendance logs for a date range
     */
    private function loadAttendanceLogs(Carbon $from, Carbon $to, array $employeePins): Collection
    {
        return AttendanceLog::whereBetween('punch_time', [
            $from->copy()->startOfDay(),
            $to->copy()->endOfDay(),
        ])
            ->whereIn('employee_pin', $employeePins)
            ->orderBy('punch_time')
            ->get()
            ->groupBy('employee_pin');
    }

    /**
     * Calculate number of work days in a date range
     */
    private function calculateWorkDays(Carbon $from, Carbon $to): int
    {
        $workDays = 0;
        $current  = $from->copy();

        while ($current->lte($to)) {
            if (! $current->isWeekend()) {
                $workDays++;
            }
            $current->addDay();
        }

        return $workDays;
    }
}
