<?php

namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Department;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AttendanceService
{
    // ── Dashboard Stats ───────────────────────────────────────────────────────

    public function todayStats(): array
    {
        $today = Carbon::today();

        // Total active employees
        $totalActive = Employee::where('active', true)->count();

        // Unique employees who checked in today
        $presentIds = AttendanceLog::whereDate('punch_time', $today)
            ->where('punch_type', 0)
            ->distinct()
            ->pluck('employee_pin');
        $presentCount = $presentIds->count();

        // Yesterday check-ins for trend
        $yesterdayCount = AttendanceLog::whereDate('punch_time', $today->copy()->subDay())
            ->where('punch_type', 0)
            ->distinct('employee_pin')
            ->count();

        $lateCount = $this->countLateToday();
        $absentCount = max(0, $totalActive - $presentCount);

        // Total punches today (all types)
        $checkInsToday = AttendanceLog::whereDate('punch_time', $today)->count();

        $attendanceRate = $totalActive > 0
            ? round(($presentCount / $totalActive) * 100, 1)
            : 0;

        return [
            'totalEmployees'      => $totalActive,
            'presentToday'        => $presentCount,
            'absentToday'         => $absentCount,
            'lateToday'           => $lateCount,
            'checkInsToday'       => $checkInsToday,
            'checkInsTrend'       => $presentCount - $yesterdayCount,
            'absentTrend'         => 0,
            'avgAttendanceRate'   => $attendanceRate,
            'attendanceRateTrend' => 0,
            'overtimeToday'       => 0,
        ];
    }

    public function countLateToday(): int
    {
        $today = Carbon::today();

        // Load first check-in per employee today — one query
        $checkIns = AttendanceLog::whereDate('punch_time', $today)
            ->where('punch_type', 0)
            ->selectRaw('employee_pin, MIN(punch_time) as first_punch')
            ->groupBy('employee_pin')
            ->get();

        if ($checkIns->isEmpty()) return 0;

        // Load all active employees with their shift in one query
        $employees = Employee::with('shift')
            ->whereIn('employee_id', $checkIns->pluck('employee_pin'))
            ->get()
            ->keyBy('employee_id');

        $late = 0;
        foreach ($checkIns as $row) {
            $emp       = $employees->get($row->employee_pin);
            $shift     = $emp?->shift;
            $start     = $shift?->start_time ?? '08:00';
            $threshold = $shift?->late_threshold ?? 15;
            $deadline  = $today->copy()->setTimeFromTimeString($start)->addMinutes($threshold);

            if (Carbon::parse($row->first_punch)->gt($deadline)) {
                $late++;
            }
        }

        return $late;
    }

    // ── Charts ────────────────────────────────────────────────────────────────

    public function hourlyActivity(): array
    {
        $rows = AttendanceLog::selectRaw("DATE_FORMAT(punch_time,'%H') as hr, COUNT(*) as cnt")
            ->where('punch_time', '>=', now()->subHours(24))
            ->groupBy('hr')
            ->orderBy('hr')
            ->pluck('cnt', 'hr');

        $result = [];
        for ($h = 0; $h < 24; $h++) {
            $key      = str_pad($h, 2, '0', STR_PAD_LEFT);
            $result[] = ['hour' => "{$key}:00", 'count' => (int)($rows[$key] ?? 0)];
        }
        return $result;
    }

    public function weeklyTrend(): array
    {
        $totalActive = Employee::where('active', true)->count();
        $result      = [];

        // Load all data in a single query grouped by date
        $daily = AttendanceLog::selectRaw("DATE(punch_time) as day, COUNT(DISTINCT employee_pin) as present")
            ->where('punch_type', 0)
            ->where('punch_time', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('day')
            ->pluck('present', 'day');

        for ($i = 6; $i >= 0; $i--) {
            $date    = Carbon::today()->subDays($i);
            $present = (int)($daily[$date->toDateString()] ?? 0);
            $absent  = max(0, $totalActive - $present);
            $rate    = $totalActive > 0 ? round(($present / $totalActive) * 100, 1) : 0;
            $result[] = [
                'day'     => $date->format('D'),
                'date'    => $date->toDateString(),
                'rate'    => $rate,
                'present' => $present,
                'absent'  => $absent,
            ];
        }
        return $result;
    }

    public function deptBreakdown(): array
    {
        $today  = Carbon::today();
        $colors = ['#16a34a','#0891b2','#f59e0b','#7c3aed','#db2777','#dc2626','#d97706','#65a30d','#0d9488'];

        // Count present by department in one query
        $presentByDept = AttendanceLog::whereDate('punch_time', $today)
            ->where('punch_type', 0)
            ->join('employees as e', 'attendance_logs.employee_pin', '=', 'e.employee_id')
            ->selectRaw('e.department as dept, COUNT(DISTINCT attendance_logs.employee_pin) as cnt')
            ->groupBy('e.department')
            ->pluck('cnt', 'dept');

        // Count totals by department
        $totals = Employee::where('active', true)
            ->selectRaw('department, COUNT(*) as total')
            ->groupBy('department')
            ->pluck('total', 'department');

        $i      = 0;
        $result = [];
        foreach ($totals as $dept => $total) {
            if (!$dept) continue;
            $present  = (int)($presentByDept[$dept] ?? 0);
            $result[] = [
                'dept'    => $dept,
                'present' => $present,
                'total'   => (int)$total,
                'rate'    => $total > 0 ? round(($present / $total) * 100, 1) : 0,
                'late'    => 0,
                'color'   => $colors[$i++ % count($colors)],
            ];
        }
        usort($result, fn($a, $b) => $b['present'] - $a['present']);
        return $result;
    }

    public function liveFeed(int $limit = 20): array
    {
        // Eager-load employee and device — no N+1
        $logs   = AttendanceLog::with(['employee', 'device'])
            ->orderByDesc('punch_time')
            ->limit($limit)
            ->get();

        $colors = ['#16a34a','#0891b2','#f59e0b','#7c3aed','#db2777','#dc2626','#d97706','#0d9488','#4f46e5','#ea580c'];
        $i      = 0;

        return $logs->map(function ($log) use (&$i, $colors) {
            $emp  = $log->employee;
            $name = $emp ? $emp->full_name : "PIN {$log->employee_pin}";
            return [
                'id'         => $log->id,
                'employeeId' => $log->employee_pin,
                'name'       => $name,
                'initials'   => $emp ? $emp->initials : strtoupper(substr($log->employee_pin, 0, 2)),
                'department' => $emp?->department ?? '-',
                'device'     => $log->device?->name ?? $log->device_sn,
                'time'       => $log->punch_time->format('H:i:s'),
                'timestamp'  => $log->punch_time->toIso8601String(),
                'type'       => $log->punch_type === 0 ? 'IN' : 'OUT',
                'punchType'  => $log->verify_type_label,
                'verifyMode' => $log->punch_type_label,
                'status'     => 'success',
                'color'      => $colors[$i++ % count($colors)],
            ];
        })->toArray();
    }

    // ── Attendance Page ───────────────────────────────────────────────────────

    public function attendanceList(Carbon $date, array $filters = []): array
    {
        // Load employees with their shift (avoid N+1)
        $empQuery = Employee::with(['shift', 'location'])
            ->where('active', true);

        if (!empty($filters['department'])) {
            $empQuery->where('department', $filters['department']);
        }
        if (!empty($filters['area'])) {
            $empQuery->where('area', $filters['area']);
        }
        if (!empty($filters['search'])) {
            $s = $filters['search'];
            $empQuery->where(fn($q) => $q
                ->where('first_name', 'like', "%{$s}%")
                ->orWhere('last_name',  'like', "%{$s}%")
                ->orWhere('employee_id','like', "%{$s}%")
            );
        }

        $employees = $empQuery->get();
        $empIds    = $employees->pluck('employee_id')->all();

        // Load ALL logs for the day in ONE query — no N+1
        $allLogs = AttendanceLog::with('device')
            ->whereDate('punch_time', $date)
            ->whereIn('employee_pin', $empIds)
            ->orderBy('punch_time')
            ->get()
            ->groupBy('employee_pin');

        $records = [];
        foreach ($employees as $emp) {
            $logs     = $allLogs->get($emp->employee_id, collect());
            $checkIn  = $logs->where('punch_type', 0)->first();
            $checkOut = $logs->where('punch_type', 1)->last();

            $status = 'absent';
            if ($checkIn) {
                $status = $this->isLate($emp, Carbon::parse($checkIn->punch_time)) ? 'late' : 'present';
            }

            $workHours = '-';
            if ($checkIn && $checkOut) {
                $diff      = Carbon::parse($checkIn->punch_time)->diff(Carbon::parse($checkOut->punch_time));
                $workHours = $diff->h . 'h ' . str_pad($diff->i, 2, '0', STR_PAD_LEFT) . 'm';
                // Flag half-day
                $mins = Carbon::parse($checkIn->punch_time)->diffInMinutes(Carbon::parse($checkOut->punch_time));
                if ($mins < 240) $status = 'half-day';
            }

            // Only include if no status filter, or matches
            if (!empty($filters['status']) && $filters['status'] !== 'all' && $status !== $filters['status']) {
                continue;
            }

            $records[] = [
                'id'           => $emp->id,
                'employeeId'   => $emp->employee_id,
                'employeeName' => $emp->full_name,
                'department'   => $emp->department ?? '-',
                'area'         => $emp->area ?? '-',
                'device'       => $checkIn?->device?->name ?? ($checkIn ? $checkIn->device_sn : '-'),
                'date'         => $date->toDateString(),
                'checkIn'      => $checkIn ? Carbon::parse($checkIn->punch_time)->format('H:i') : '',
                'checkOut'     => $checkOut ? Carbon::parse($checkOut->punch_time)->format('H:i') : '',
                'workHours'    => $workHours,
                'status'       => $status,
                'punchType'    => $checkIn ? $checkIn->verify_type_label : 'fingerprint',
            ];
        }
        return $records;
    }

    // ── Reports ───────────────────────────────────────────────────────────────

    public function summaryReport(Carbon $from, Carbon $to, array $filters = []): array
    {
        $query = Employee::with('shift')->where('active', true);
        if (!empty($filters['department'])) $query->where('department', $filters['department']);

        $employees = $query->get();
        $empIds    = $employees->pluck('employee_id')->all();

        // Load all logs in the date range in ONE query
        $allLogs = AttendanceLog::whereBetween('punch_time', [$from->startOfDay(), $to->copy()->endOfDay()])
            ->whereIn('employee_pin', $empIds)
            ->get()
            ->groupBy(fn($l) => $l->employee_pin . '|' . $l->punch_time->toDateString());

        $rows = [];
        foreach ($employees as $emp) {
            $shift     = $emp->shift;
            $startTime = $shift?->start_time ?? '08:00';
            $lateMin   = $shift?->late_threshold ?? 15;
            $otMin     = $shift?->overtime_threshold ?? 60;
            $expectedH = $shift ? (float)$shift->work_hours : 9.0;

            $presentDays = $absentDays = $lateDays = $halfDays = 0;
            $totalWorkMins = $lateMinutes = $overtimeHours = 0;

            for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
                if ($d->isWeekend()) continue;
                $key     = $emp->employee_id . '|' . $d->toDateString();
                $dayLogs = $allLogs->get($key, collect());
                $in      = $dayLogs->where('punch_type', 0)->sortBy('punch_time')->first();
                $out     = $dayLogs->where('punch_type', 1)->sortByDesc('punch_time')->first();

                if (!$in) { $absentDays++; continue; }
                $presentDays++;

                $deadline = $d->copy()->setTimeFromTimeString($startTime)->addMinutes($lateMin);
                if (Carbon::parse($in->punch_time)->gt($deadline)) {
                    $lateDays++;
                    $lateMinutes += Carbon::parse($in->punch_time)->diffInMinutes($d->copy()->setTimeFromTimeString($startTime));
                }

                if ($in && $out) {
                    $mins           = Carbon::parse($in->punch_time)->diffInMinutes(Carbon::parse($out->punch_time));
                    $totalWorkMins += $mins;
                    if ($mins < 240) $halfDays++;
                    if ($mins > ($expectedH * 60) + $otMin) {
                        $overtimeHours += round(($mins - $expectedH * 60) / 60, 1);
                    }
                }
            }

            $workDays = $from->diffInDaysFiltered(fn($d) => !$d->isWeekend(), $to) + 1;
            $rows[]   = [
                'employeeId'     => $emp->employee_id,
                'employeeName'   => $emp->full_name,
                'department'     => $emp->department ?? '-',
                'shift'          => $shift?->name ?? 'Standard Day Shift',
                'location'       => $emp->area ?? '-',
                'presentDays'    => $presentDays,
                'absentDays'     => $absentDays,
                'lateDays'       => $lateDays,
                'halfDays'       => $halfDays,
                'totalWorkHours' => round($totalWorkMins / 60, 1),
                'overtimeHours'  => $overtimeHours,
                'lateMinutes'    => $lateMinutes,
                'attendanceRate' => $workDays > 0 ? round(($presentDays / $workDays) * 100, 1) : 0,
            ];
        }
        return $rows;
    }

    public function dailyTrend(Carbon $from, Carbon $to): array
    {
        $totalActive = Employee::where('active', true)->count();

        // One query for the whole range
        $daily = AttendanceLog::selectRaw("DATE(punch_time) as day, COUNT(DISTINCT employee_pin) as present")
            ->where('punch_type', 0)
            ->whereBetween('punch_time', [$from->startOfDay(), $to->copy()->endOfDay()])
            ->groupBy('day')
            ->pluck('present', 'day');

        $result = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $present  = (int)($daily[$d->toDateString()] ?? 0);
            $absent   = max(0, $totalActive - $present);
            $result[] = [
                'date'           => $d->toDateString(),
                'totalEmployees' => $totalActive,
                'present'        => $present,
                'absent'         => $absent,
                'late'           => 0,
                'halfDay'        => 0,
                'attendanceRate' => $totalActive > 0 ? round(($present / $totalActive) * 100, 1) : 0,
            ];
        }
        return $result;
    }

    public function payrollReport(Carbon $from, Carbon $to, array $filters = []): array
    {
        $summary = $this->summaryReport($from, $to, $filters);

        // Load salaries in one query
        $empIds  = array_column($summary, 'employeeId');
        $salaries = Employee::whereIn('employee_id', $empIds)
            ->pluck('basic_salary', 'employee_id');

        $workDays = $from->diffInDaysFiltered(fn($d) => !$d->isWeekend(), $to) + 1;
        $rows     = [];

        foreach ($summary as $row) {
            $basic     = (float)($salaries[$row['employeeId']] ?? 0);
            $daily     = $workDays > 0 ? $basic / $workDays : 0;
            $hourly    = $daily / 9;
            $absentDed = round($daily * $row['absentDays'], 2);
            $lateDed   = round(($hourly / 60) * $row['lateMinutes'], 2);
            $otPay     = round($hourly * 1.5 * $row['overtimeHours'], 2);
            $rows[]    = array_merge($row, [
                'basicSalary'     => $basic,
                'absentDeduction' => $absentDed,
                'lateDeduction'   => $lateDed,
                'overtimePay'     => $otPay,
                'netPay'          => round($basic - $absentDed - $lateDed + $otPay, 2),
                'workHours'       => $row['totalWorkHours'],
            ]);
        }
        return $rows;
    }

    // ── Analytics ─────────────────────────────────────────────────────────────

    public function deptStats(): array
    {
        $today  = Carbon::today();
        $colors = ['#16a34a','#0891b2','#f59e0b','#7c3aed','#db2777','#dc2626','#d97706','#65a30d','#0d9488'];

        // Fetch dept totals and today's presents in 2 queries
        $totals  = Employee::where('active', true)
            ->selectRaw('department, COUNT(*) as total')
            ->groupBy('department')
            ->pluck('total', 'department');

        $presents = AttendanceLog::whereDate('punch_time', $today)
            ->where('punch_type', 0)
            ->join('employees as e', 'attendance_logs.employee_pin', '=', 'e.employee_id')
            ->selectRaw('e.department as dept, COUNT(DISTINCT attendance_logs.employee_pin) as cnt')
            ->groupBy('e.department')
            ->pluck('cnt', 'dept');

        // 7-day trend in ONE query (groupBy date+dept)
        $trendData = AttendanceLog::where('punch_type', 0)
            ->where('punch_time', '>=', $today->copy()->subDays(6)->startOfDay())
            ->join('employees as e', 'attendance_logs.employee_pin', '=', 'e.employee_id')
            ->selectRaw('e.department as dept, DATE(punch_time) as day, COUNT(DISTINCT attendance_logs.employee_pin) as cnt')
            ->groupBy('e.department', 'day')
            ->get()
            ->groupBy('dept');

        $i      = 0;
        $result = [];
        foreach ($totals as $dept => $total) {
            if (!$dept) continue;
            $present = (int)($presents[$dept] ?? 0);
            $absent  = max(0, $total - $present);
            $rate    = $total > 0 ? round(($present / $total) * 100, 1) : 0;

            $deptTrend = $trendData->get($dept, collect())->keyBy('day');
            $trend     = [];
            for ($di = 6; $di >= 0; $di--) {
                $date    = $today->copy()->subDays($di)->toDateString();
                $p       = (int)($deptTrend->get($date)?->cnt ?? 0);
                $trend[] = $total > 0 ? round(($p / $total) * 100, 1) : 0;
            }

            $result[] = [
                'id'             => $i + 1,
                'department'     => $dept,
                'totalEmployees' => (int)$total,
                'presentToday'   => $present,
                'absentToday'    => $absent,
                'lateToday'      => 0,
                'attendanceRate' => $rate,
                'trend'          => $trend,
                'topPerformers'  => [],
                'absenteeismTrend' => [],
                'color'          => $colors[$i++ % count($colors)],
            ];
        }
        return $result;
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private function isLate(Employee $emp, Carbon $punchTime): bool
    {
        $shift     = $emp->shift;
        $start     = $shift?->start_time ?? '08:00';
        $threshold = $shift?->late_threshold ?? 15;
        $deadline  = Carbon::today()->setTimeFromTimeString($start)->addMinutes($threshold);
        return $punchTime->gt($deadline);
    }
}
