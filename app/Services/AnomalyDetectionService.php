<?php
namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;

class AnomalyDetectionService
{
    private array $scoreCache = [];

    /**
     * Detect buddy punching (one employee punching for another)
     */
    public function detectBuddyPunching(?Carbon $date = null): array
    {
        $date = $date ?? Carbon::today();

        $logs = AttendanceLog::whereDate('punch_time', $date)
            ->with('employee')
            ->get()
            ->groupBy('device_sn');

        $anomalies = [];

        foreach ($logs as $deviceSn => $deviceLogs) {
            $sortedLogs    = $deviceLogs->sortBy('punch_time');
            $previousPunch = null;

            foreach ($sortedLogs as $log) {
                if ($previousPunch && $log->employee) {
                    $timeDiff = $previousPunch->punch_time->diffInSeconds($log->punch_time);

                    // If two different employees punch within 5 seconds on same device
                    if ($timeDiff <= 5 && $previousPunch->employee_pin !== $log->employee_pin) {
                        $anomalies[] = [
                            'type'              => 'buddy_punching',
                            'severity'          => 'high',
                            'device'            => $deviceSn,
                            'employee1'         => [
                                'pin'  => $previousPunch->employee_pin,
                                'name' => $previousPunch->employee?->full_name ?? 'Unknown',
                                'time' => $previousPunch->punch_time->format('H:i:s'),
                            ],
                            'employee2'         => [
                                'pin'  => $log->employee_pin,
                                'name' => $log->employee->full_name ?? 'Unknown',
                                'time' => $log->punch_time->format('H:i:s'),
                            ],
                            'time_diff_seconds' => $timeDiff,
                        ];
                    }
                }
                $previousPunch = $log;
            }
        }

        return $anomalies;
    }

    /**
     * Detect ghost employees (employees who never punch but are active)
     */
    public function detectGhostEmployees(int $daysThreshold = 30, int $limit = 50): array
    {
        $cutoffDate = Carbon::now()->subDays($daysThreshold);

        return Employee::where('active', true)
            ->whereDoesntHave('attendanceLogs', function ($q) use ($cutoffDate) {
                $q->where('punch_time', '>=', $cutoffDate);
            })
            ->limit($limit)
            ->get()
            ->map(fn($e) => [
                'employee_id'        => $e->employee_id,
                'name'               => $e->full_name,
                'department'         => $e->department ?? '-',
                'area'               => $e->area ?? '-',
                'hired_date'         => $e->hired_date?->format('Y-m-d'),
                'days_without_punch' => $e->latestLog?->punch_time
                    ? $e->latestLog->punch_time->diffInDays(now())
                    : ($e->hired_date ? $e->hired_date->diffInDays(now()) : 'Unknown'),
            ])
            ->toArray();
    }

    /**
     * Calculate employee attendance score (0-100)
     */
    public function calculateAttendanceScore(Employee $employee, int $days = 30): array
    {
        $cacheKey = "attendance_score_{$employee->id}_{$days}";

        if (isset($this->scoreCache[$cacheKey])) {
            return $this->scoreCache[$cacheKey];
        }

        return Cache::remember($cacheKey, 3600, function () use ($employee, $days) {
            $from = Carbon::now()->subDays($days);
            $to   = Carbon::now();

            $logs = AttendanceLog::where('employee_pin', $employee->employee_id)
                ->whereBetween('punch_time', [$from, $to])
                ->get()
                ->groupBy(fn($log) => $log->punch_time->format('Y-m-d'));

            $workDays = $this->calculateWorkDays($from, $to);

            $presentDays      = 0;
            $lateDays         = 0;
            $earlyDepartures  = 0;
            $totalWorkMinutes = 0;

            $shift = $employee->shift;

            foreach ($logs as $date => $dayLogs) {
                $checkIn  = $dayLogs->where('punch_type', 0)->first();
                $checkOut = $dayLogs->where('punch_type', 1)->last();

                if ($checkIn) {
                    $presentDays++;

                    if ($shift) {
                        $expectedStart = Carbon::parse($date . ' ' . $shift->start_time);
                        $lateThreshold = $shift->late_threshold ?? 15;

                        if ($checkIn->punch_time->gt($expectedStart->addMinutes($lateThreshold))) {
                            $lateDays++;
                        }
                    }

                    if ($checkOut && $shift) {
                        $expectedEnd = Carbon::parse($date . ' ' . $shift->end_time);

                        if ($checkOut->punch_time->lt($expectedEnd->subMinutes(15))) {
                            $earlyDepartures++;
                        }

                        $totalWorkMinutes += $checkIn->punch_time->diffInMinutes($checkOut->punch_time);
                    }
                }
            }

            $attendanceRate   = $workDays > 0 ? ($presentDays / $workDays) * 100 : 0;
            $punctualityScore = $presentDays > 0 ? max(0, 100 - (($lateDays / $presentDays) * 50)) : 0;
            $stayScore        = $presentDays > 0 ? max(0, 100 - (($earlyDepartures / $presentDays) * 30)) : 0;

            $overallScore = round(($attendanceRate * 0.4) + ($punctualityScore * 0.4) + ($stayScore * 0.2), 1);

            $result = [
                'employee'          => $employee->full_name,
                'period_days'       => $days,
                'work_days'         => $workDays,
                'present_days'      => $presentDays,
                'late_days'         => $lateDays,
                'early_departures'  => $earlyDepartures,
                'attendance_rate'   => round($attendanceRate, 1),
                'punctuality_score' => round($punctualityScore, 1),
                'stay_score'        => round($stayScore, 1),
                'overall_score'     => $overallScore,
                'grade'             => $this->getScoreGrade($overallScore),
                'trend'             => $this->calculateTrend($employee, $days),
            ];

            $this->scoreCache[$cacheKey] = $result;
            return $result;
        });
    }

    private function getScoreGrade(float $score): string
    {
        return match (true) {
            $score >= 95 => 'A+ (Excellent)',
            $score >= 90 => 'A (Great)',
            $score >= 85 => 'B+ (Good)',
            $score >= 80 => 'B (Satisfactory)',
            $score >= 75 => 'C+ (Fair)',
            $score >= 70 => 'C (Needs Improvement)',
            default      => 'D (Poor)',
        };
    }

    private function calculateTrend(Employee $employee, int $days): string
    {
        $currentScore  = $this->calculateAttendanceScore($employee, $days)['overall_score'];
        $previousScore = $this->calculateAttendanceScore($employee, $days * 2)['overall_score'];

        if ($currentScore > $previousScore + 5) {
            return 'improving';
        }

        if ($currentScore < $previousScore - 5) {
            return 'declining';
        }

        return 'stable';
    }

    private function calculateWorkDays(Carbon $from, Carbon $to): int
    {
        $days    = 0;
        $current = $from->copy();

        while ($current->lte($to)) {
            if (! $current->isWeekend()) {
                $days++;
            }
            $current->addDay();
        }

        return $days;
    }
}
