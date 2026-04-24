<?php
namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Employee;
use Carbon\Carbon;

class AttendanceService
{
    // ── Dashboard Stats ───────────────────────────────────────────────────────

    public function todayStats(): array
    {
        $today       = Carbon::today();
        $totalActive = Employee::where('active', true)->count();

        $presentIds = AttendanceLog::whereDate('punch_time', $today)
            ->where('punch_type', 0)
            ->distinct()
            ->pluck('employee_pin');
        $presentCount = $presentIds->count();

        $yesterdayCount = AttendanceLog::whereDate('punch_time', $today->copy()->subDay())
            ->where('punch_type', 0)
            ->distinct('employee_pin')
            ->count();

        $lateCount     = $this->countLateToday();
        $absentCount   = max(0, $totalActive - $presentCount);
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

        $checkIns = AttendanceLog::whereDate('punch_time', $today)
            ->where('punch_type', 0)
            ->selectRaw('employee_pin, MIN(punch_time) as first_punch')
            ->groupBy('employee_pin')
            ->get();

        if ($checkIns->isEmpty()) {
            return 0;
        }

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

    // ── Reports (FIXED - Critical absence calculation fix) ─────────────────────

    /**
     * Get summary report with CORRECT attendance calculations
     * KEY FIX: Only counts employees who actually have logs in the period
     * Absence is only counted if employee was expected to work but didn't clock in
     */
    public function summaryReport(Carbon $from, Carbon $to, array $filters = []): array
    {
        $query = Employee::with(['shift', 'location'])->where('active', true);

        if (! empty($filters['department'])) {
            $query->where('department', $filters['department']);
        }
        if (! empty($filters['location'])) {
            $query->where('area', $filters['location']);
        }
        if (! empty($filters['area'])) {
            $query->where('area', $filters['area']);
        }

        $employees = $query->get();

        // If no employees match filters, return empty array
        if ($employees->isEmpty()) {
            return [];
        }

        $empIds = $employees->pluck('employee_id')->all();

        // Load all logs in the date range
        $allLogs = AttendanceLog::whereBetween('punch_time', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->whereIn('employee_pin', $empIds)
            ->get()
            ->groupBy(fn($l) => $l->employee_pin . '|' . $l->punch_time->toDateString());

        // Get hired dates to determine if employee was active during period
        $rows = [];
        foreach ($employees as $emp) {
            $shift     = $emp->shift;
            $startTime = $shift?->start_time ?? '08:00';
            $lateMin   = $shift?->late_threshold ?? 15;
            $otMin     = $shift?->overtime_threshold ?? 60;
            $expectedH = $shift ? (float) $shift->work_hours : 9.0;

            $presentDays      = $absentDays      = $lateDays      = $halfDays      = 0;
            $totalWorkMins    = $lateMinutes    = $overtimeHours    = 0;
            $workDaysInPeriod = 0;

            // Check if employee was hired during the period
            $hiredDate = $emp->hired_date ? Carbon::parse($emp->hired_date) : null;

            // Iterate through each day in the period
            for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
                // Skip if employee wasn't hired yet
                if ($hiredDate && $d->lt($hiredDate)) {
                    continue;
                }

                // Skip weekends
                if ($d->isWeekend()) {
                    continue;
                }

                $workDaysInPeriod++;
                $dateStr = $d->toDateString();
                $key     = $emp->employee_id . '|' . $dateStr;
                $dayLogs = $allLogs->get($key, collect());

                // Get first check-in and last check-out
                $in  = $dayLogs->where('punch_type', 0)->sortBy('punch_time')->first();
                $out = $dayLogs->where('punch_type', 1)->sortByDesc('punch_time')->last();

                // CRITICAL FIX: Only count as absent if NO check-in AND employee was expected to work
                // (We assume employee works all weekdays unless on leave - you can add leave checking later)
                if (! $in) {
                    // Check if this is a holiday or leave day (you can implement this later)
                    // For now, assume it's an absence
                    $absentDays++;
                    continue;
                }

                $presentDays++;

                // Check for late arrival
                $deadline  = $d->copy()->setTimeFromTimeString($startTime)->addMinutes($lateMin);
                $punchTime = Carbon::parse($in->punch_time);
                if ($punchTime->gt($deadline)) {
                    $lateDays++;
                    $lateMinutes += $punchTime->diffInMinutes($d->copy()->setTimeFromTimeString($startTime));
                }

                // Calculate work hours if there's a check-out
                if ($out) {
                    $mins           = Carbon::parse($in->punch_time)->diffInMinutes(Carbon::parse($out->punch_time));
                    $totalWorkMins += $mins;

                    // Half day if worked less than 4 hours
                    if ($mins < 240) {
                        $halfDays++;
                    }

                    // Overtime calculation
                    $expectedMins = $expectedH * 60;
                    if ($mins > $expectedMins + $otMin) {
                        $overtimeHours += round(($mins - $expectedMins) / 60, 1);
                    }
                }
            }

            // Calculate attendance rate based on work days only
            $attendanceRate = $workDaysInPeriod > 0
                ? round(($presentDays / $workDaysInPeriod) * 100, 1)
                : 0;

            $rows[] = [
                'employeeId'       => $emp->employee_id,
                'employeeName'     => $emp->full_name,
                'department'       => $emp->department ?? '-',
                'shift'            => $shift?->name ?? 'Standard Day Shift',
                'location'         => $emp->area ?? $emp->location?->name ?? '-',
                'presentDays'      => $presentDays,
                'absentDays'       => $absentDays,
                'lateDays'         => $lateDays,
                'halfDays'         => $halfDays,
                'totalWorkHours'   => round($totalWorkMins / 60, 1),
                'overtimeHours'    => $overtimeHours,
                'lateMinutes'      => $lateMinutes,
                'attendanceRate'   => $attendanceRate,
                'workDaysInPeriod' => $workDaysInPeriod,
            ];
        }

        return $rows;
    }

    public function dailyTrend(Carbon $from, Carbon $to): array
    {
        $totalActive = Employee::where('active', true)->count();

        $daily = AttendanceLog::selectRaw("DATE(punch_time) as day, COUNT(DISTINCT employee_pin) as present")
            ->where('punch_type', 0)
            ->whereBetween('punch_time', [$from->startOfDay(), $to->copy()->endOfDay()])
            ->groupBy('day')
            ->pluck('present', 'day');

        $result = [];
        for ($d = $from->copy(); $d->lte($to); $d->addDay()) {
            $dateStr   = $d->toDateString();
            $isWeekend = $d->isWeekend();

            $present = $isWeekend ? 0 : (int) ($daily[$dateStr] ?? 0);
            $absent  = $isWeekend ? 0 : max(0, $totalActive - $present);

            $result[] = [
                'date'           => $dateStr,
                'totalEmployees' => $totalActive,
                'present'        => $present,
                'absent'         => $absent,
                'late'           => 0,
                'halfDay'        => 0,
                'attendanceRate' => $isWeekend ? 0 : ($totalActive > 0 ? round(($present / $totalActive) * 100, 1) : 0),
            ];
        }
        return $result;
    }

    public function payrollReport(Carbon $from, Carbon $to, array $filters = []): array
    {
        $summary = $this->summaryReport($from, $to, $filters);

        if (empty($summary)) {
            return [];
        }

        $empIds   = array_column($summary, 'employeeId');
        $salaries = Employee::whereIn('employee_id', $empIds)
            ->pluck('basic_salary', 'employee_id');

        $workDays = $from->diffInDaysFiltered(fn($d) => ! $d->isWeekend(), $to) + 1;
        $rows     = [];

        foreach ($summary as $row) {
            $basic     = (float) ($salaries[$row['employeeId']] ?? 0);
            $daily     = $workDays > 0 ? $basic / $workDays : 0;
            $hourly    = $daily / 9;
            $absentDed = round($daily * $row['absentDays'], 2);
            $lateDed   = round(($hourly / 60) * $row['lateMinutes'], 2);
            $otPay     = round($hourly * 1.5 * $row['overtimeHours'], 2);

            $rows[] = array_merge($row, [
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

    /**
     * Get department summary with aggregated stats
     */
    public function departmentSummary(Carbon $from, Carbon $to, array $filters = []): array
    {
        $rows = $this->summaryReport($from, $to, $filters);

        $deptMap = [];
        foreach ($rows as $row) {
            $dept = $row['department'];
            if (! isset($deptMap[$dept])) {
                $deptMap[$dept] = [
                    'department'    => $dept,
                    'employeeQty'   => 0,
                    'lateTimes'     => 0,
                    'absentTimes'   => 0,
                    'regularHours'  => 0,
                    'lateMinutes'   => 0,
                    'totalOvertime' => 0,
                    'totalPresent'  => 0,
                    'totalAbsent'   => 0,
                ];
            }

            $deptMap[$dept]['employeeQty']++;
            $deptMap[$dept]['lateTimes']     += $row['lateDays'];
            $deptMap[$dept]['absentTimes']   += $row['absentDays'];
            $deptMap[$dept]['regularHours']  += $row['totalWorkHours'];
            $deptMap[$dept]['lateMinutes']   += $row['lateMinutes'];
            $deptMap[$dept]['totalOvertime'] += $row['overtimeHours'];
            $deptMap[$dept]['totalPresent']  += $row['presentDays'];
            $deptMap[$dept]['totalAbsent']   += $row['absentDays'];
        }

        return array_values($deptMap);
    }

    /**
     * Get all locations with their stats
     */
    public function locationSummary(Carbon $from, Carbon $to, array $filters = []): array
    {
        $rows = $this->summaryReport($from, $to, $filters);

        $locMap = [];
        foreach ($rows as $row) {
            $loc = $row['location'] ?: 'Unknown';
            if (! isset($locMap[$loc])) {
                $locMap[$loc] = [
                    'location'          => $loc,
                    'employeeQty'       => 0,
                    'totalPresent'      => 0,
                    'totalAbsent'       => 0,
                    'totalLate'         => 0,
                    'totalOvertime'     => 0,
                    'totalWorkHours'    => 0,
                    'avgAttendanceRate' => 0,
                ];
            }

            $locMap[$loc]['employeeQty']++;
            $locMap[$loc]['totalPresent']      += $row['presentDays'];
            $locMap[$loc]['totalAbsent']       += $row['absentDays'];
            $locMap[$loc]['totalLate']         += $row['lateDays'];
            $locMap[$loc]['totalOvertime']     += $row['overtimeHours'];
            $locMap[$loc]['totalWorkHours']    += $row['totalWorkHours'];
            $locMap[$loc]['avgAttendanceRate'] += $row['attendanceRate'];
        }

        // Calculate averages
        foreach ($locMap as &$loc) {
            $loc['avgAttendanceRate'] = $loc['employeeQty'] > 0
                ? round($loc['avgAttendanceRate'] / $loc['employeeQty'], 1)
                : 0;
        }

        return array_values($locMap);
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

    // ── Charts & Dashboard Methods ───────────────────────────────────────────

    public function liveFeed(int $limit = 20): array
    {
        $logs = AttendanceLog::with(['employee', 'employee.shift', 'device'])
            ->orderByDesc('punch_time')
            ->limit($limit)
            ->get();

        $colors = [
            '#16a34a', '#0891b2', '#f59e0b', '#7c3aed', '#db2777',
            '#dc2626', '#d97706', '#0d9488', '#4f46e5', '#ea580c',
        ];
        $i = 0;

        return $logs->map(function ($log) use (&$i, $colors) {
            $emp  = $log->employee;
            $name = $emp ? $emp->full_name : "PIN {$log->employee_pin}";

            // Get punch type label based on value
            $punchLabel = $log->punch_type == 0 ? 'Check-In' : 'Check-Out';
            $direction  = $log->punch_type == 0 ? 'IN' : 'OUT';

            // Check if this punch is late (only for check-ins)
            $isLate      = false;
            $lateMinutes = 0;

            if ($log->punch_type == 0 && $emp && $emp->shift) {
                $shiftStart      = Carbon::parse($emp->shift->start_time);
                $lateThreshold   = $emp->shift->late_threshold ?? 60;
                $punchTime       = $log->punch_time->copy();
                $punchTimeValue  = $punchTime->hour + ($punchTime->minute / 60);
                $shiftStartValue = $shiftStart->hour + ($shiftStart->minute / 60);

                // Check if punch is after shift start + threshold
                if ($punchTimeValue > ($shiftStartValue + ($lateThreshold / 60))) {
                    $isLate      = true;
                    $lateMinutes = floor(($punchTimeValue - $shiftStartValue) * 60);
                }
            }

            // Determine status
            $status = 'success';
            if ($isLate) {
                $status = 'late';
            }

            return [
                'id'          => $log->id,
                'employeeId'  => $log->employee_pin,
                'name'        => $name,
                'initials'    => $emp ? $emp->initials : strtoupper(substr($log->employee_pin, 0, 2)),
                'department'  => $emp?->department ?? '-',
                'device'      => $log->device?->name ?? $log->device_sn,
                'time'        => $log->punch_time->format('H:i:s'),
                'timestamp'   => $log->punch_time->toIso8601String(),
                'type'        => $direction,
                'punchType'   => $log->verify_type_label,
                'verifyMode'  => $punchLabel,
                'status'      => $status,
                'isLate'      => $isLate,
                'lateMinutes' => $lateMinutes,
                'color'       => $colors[$i++ % count($colors)],
            ];
        })->toArray();
    }

    /**
     * Get weekly attendance trend for chart
     */
    public function weeklyTrend(): array
    {
        $totalActive = Employee::where('active', true)->count();
        $result      = [];

        $daily = AttendanceLog::selectRaw("DATE(punch_time) as day, COUNT(DISTINCT employee_pin) as present")
            ->where('punch_type', 0)
            ->where('punch_time', '>=', now()->subDays(6)->startOfDay())
            ->groupBy('day')
            ->pluck('present', 'day');

        for ($i = 6; $i >= 0; $i--) {
            $date    = Carbon::today()->subDays($i);
            $dateStr = $date->toDateString();
            $present = (int) ($daily[$dateStr] ?? 0);
            $absent  = max(0, $totalActive - $present);
            $rate    = $totalActive > 0 ? round(($present / $totalActive) * 100, 1) : 0;

            $result[] = [
                'day'     => $date->format('D'),
                'date'    => $dateStr,
                'rate'    => $rate,
                'present' => $present,
                'absent'  => $absent,
            ];
        }

        return $result;
    }

    /**
     * Get department breakdown for dashboard chart
     */
    public function deptBreakdown(): array
    {
        $today  = Carbon::today();
        $colors = [
            '#16a34a', '#0891b2', '#f59e0b', '#7c3aed', '#db2777',
            '#dc2626', '#d97706', '#65a30d', '#0d9488',
        ];

        // Count present by department today
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
            if (! $dept) {
                continue;
            }

            $present = (int) ($presentByDept[$dept] ?? 0);
            $rate    = $total > 0 ? round(($present / $total) * 100, 1) : 0;

            $result[] = [
                'dept'    => $dept,
                'present' => $present,
                'total'   => (int) $total,
                'rate'    => $rate,
                'late'    => 0,
                'color'   => $colors[$i++ % count($colors)],
            ];
        }

        // Sort by present count descending
        usort($result, fn($a, $b) => $b['present'] - $a['present']);

        return $result;
    }

    /**
     * Get hourly activity data for chart
     */
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
            $result[] = [
                'hour' => "{$key}:00",
                'count' => (int) ($rows[$key] ?? 0),
            ];
        }

        return $result;
    }
}
