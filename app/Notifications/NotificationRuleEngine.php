<?php
namespace App\Services;

use App\Models\Employee;
use App\Models\SystemNotification;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class NotificationRuleEngine
{
    private array $rules          = [];
    private array $triggeredCache = [];

    public function __construct()
    {
        $this->loadRules();
    }

    private function loadRules(): void
    {
        $this->rules = [
            [
                'name'      => 'Consecutive Absence Alert',
                'condition' => fn($employee) => $this->checkConsecutiveAbsence($employee, 3),
                'action'    => fn($employee)    => $this->notifyHR("{$employee->full_name} has been absent for 3+ consecutive days"),
                'priority' => 'high',
            ],
            [
                'name'      => 'Perfect Attendance Reward',
                'condition' => fn($employee) => $this->checkPerfectAttendance($employee, 30),
                'action'    => fn($employee)    => $this->notifyHR("🎉 {$employee->full_name} has perfect attendance for 30 days!"),
                'priority' => 'low',
            ],
            [
                'name'      => 'Overtime Alert',
                'condition' => fn($employee) => $this->checkExcessiveOvertime($employee, 10),
                'action'    => fn($employee)    => $this->notifyManager("⚠️ {$employee->full_name} has accumulated 10+ overtime hours this week"),
                'priority' => 'medium',
            ],
            [
                'name'      => 'Late Pattern Detection',
                'condition' => fn($employee) => $this->checkLatePattern($employee),
                'action'    => fn($employee)    => $this->notifyHR("📊 {$employee->full_name} shows a pattern of late arrivals"),
                'priority' => 'medium',
            ],
            [
                'name'         => 'Birthday Reminder',
                'condition'    => fn($employee)    => $this->isBirthdayToday($employee),
                'action'       => fn($employee)       => $this->broadcastBirthday($employee),
                'priority'     => 'low',
                'once_per_day' => true,
            ],
            [
                'name'         => 'Work Anniversary',
                'condition'    => fn($employee)    => $this->isWorkAnniversary($employee),
                'action'       => fn($employee)       => $this->broadcastAnniversary($employee),
                'priority'     => 'low',
                'once_per_day' => true,
            ],
        ];
    }

    public function evaluateEmployee(Employee $employee): array
    {
        $triggered = [];

        foreach ($this->rules as $rule) {
            try {
                $cacheKey = "rule_{$rule['name']}_{$employee->id}_" . now()->format('Ymd');

                // Skip if already triggered today (for once_per_day rules)
                if (isset($rule['once_per_day']) && $rule['once_per_day']) {
                    if (isset($this->triggeredCache[$cacheKey])) {
                        continue;
                    }
                }

                if ($rule['condition']($employee)) {
                    $rule['action']($employee);
                    $triggered[] = $rule['name'];

                    if (isset($rule['once_per_day'])) {
                        $this->triggeredCache[$cacheKey] = true;
                    }
                }
            } catch (\Exception $e) {
                Log::error('Rule evaluation failed', [
                    'rule'     => $rule['name'],
                    'employee' => $employee->employee_id,
                    'error'    => $e->getMessage(),
                ]);
            }
        }

        return $triggered;
    }

    public function evaluateAll(): array
    {
        $employees = Employee::where('active', true)->get();
        $results   = [];

        foreach ($employees as $employee) {
            $triggered = $this->evaluateEmployee($employee);
            if (! empty($triggered)) {
                $results[$employee->employee_id] = $triggered;
            }
        }

        return $results;
    }

    private function checkConsecutiveAbsence(Employee $employee, int $days): bool
    {
        $recentLogs = $employee->attendanceLogs()
            ->where('punch_time', '>=', now()->subDays($days + 1))
            ->where('punch_type', 0)
            ->get()
            ->groupBy(fn($log) => $log->punch_time->format('Y-m-d'));

        $workDays   = 0;
        $absentDays = 0;

        for ($i = 1; $i <= $days; $i++) {
            $date = now()->subDays($i);
            if ($date->isWeekend()) {
                continue;
            }

            $workDays++;
            if (! $recentLogs->has($date->format('Y-m-d'))) {
                $absentDays++;
            }
        }

        return $workDays > 0 && $absentDays === $workDays;
    }

    private function checkPerfectAttendance(Employee $employee, int $days): bool
    {
        $logs = $employee->attendanceLogs()
            ->where('punch_time', '>=', now()->subDays($days))
            ->where('punch_type', 0)
            ->get()
            ->groupBy(fn($log) => $log->punch_time->format('Y-m-d'));

        $workDays = $this->calculateWorkDays(now()->subDays($days), now());

        return $logs->count() >= $workDays;
    }

    private function checkExcessiveOvertime(Employee $employee, int $hours): bool
    {
        $weekStart = now()->startOfWeek();

        $logs = $employee->attendanceLogs()
            ->whereBetween('punch_time', [$weekStart, now()])
            ->get()
            ->groupBy(fn($log) => $log->punch_time->format('Y-m-d'));

        $totalOvertime = 0;

        foreach ($logs as $dayLogs) {
            $checkIn  = $dayLogs->where('punch_type', 0)->first();
            $checkOut = $dayLogs->where('punch_type', 1)->last();

            if ($checkIn && $checkOut) {
                $workMinutes     = $checkIn->punch_time->diffInMinutes($checkOut->punch_time);
                $expectedMinutes = ($employee->shift?->work_hours ?? 8) * 60;

                if ($workMinutes > $expectedMinutes) {
                    $totalOvertime += ($workMinutes - $expectedMinutes) / 60;
                }
            }
        }

        return $totalOvertime >= $hours;
    }

    private function checkLatePattern(Employee $employee): bool
    {
        $weekStart = now()->startOfWeek();

        $lateCount = $employee->attendanceLogs()
            ->where('punch_time', '>=', $weekStart)
            ->where('punch_type', 0)
            ->get()
            ->filter(function ($log) use ($employee) {
                $shift = $employee->shift;
                if (! $shift) {
                    return false;
                }

                $expectedTime = Carbon::parse($log->punch_time->format('Y-m-d') . ' ' . $shift->start_time);
                return $log->punch_time->gt($expectedTime->addMinutes($shift->late_threshold ?? 15));
            })
            ->count();

        return $lateCount >= 3;
    }

    private function isBirthdayToday(Employee $employee): bool
    {
        if (! $employee->date_of_birth) {
            return false;
        }

        $today    = Carbon::today();
        $birthday = Carbon::parse($employee->date_of_birth);

        return $today->month === $birthday->month && $today->day === $birthday->day;
    }

    private function isWorkAnniversary(Employee $employee): bool
    {
        if (! $employee->hired_date) {
            return false;
        }

        $today = Carbon::today();
        $hired = Carbon::parse($employee->hired_date);

        return $today->month === $hired->month && $today->day === $hired->day;
    }

    private function notifyHR(string $message): void
    {
        $hrUsers = User::role('HR Manager')->get();

        foreach ($hrUsers as $user) {
            // Check for duplicate notification today
            $exists = SystemNotification::where('user_id', $user->id)
                ->where('message', $message)
                ->whereDate('created_at', today())
                ->exists();

            if (! $exists) {
                SystemNotification::create([
                    'user_id'  => $user->id,
                    'title'    => 'HR Alert',
                    'message'  => $message,
                    'category' => 'hr',
                    'severity' => 'info',
                ]);
            }
        }
    }

    private function notifyManager(string $message): void
    {
        Log::info('Manager notification: ' . $message);
    }

    private function broadcastBirthday(Employee $employee): void
    {
        $exists = SystemNotification::where('message', 'LIKE', "%{$employee->full_name}%birthday%")
            ->whereDate('created_at', today())
            ->exists();

        if (! $exists) {
            SystemNotification::create([
                'title'   => '🎂 Happy Birthday!',
                'message' => "Join us in wishing {$employee->full_name} a very happy birthday!",
                'category' => 'celebration',
                'severity' => 'info',
            ]);
        }
    }

    private function broadcastAnniversary(Employee $employee): void
    {
        $years = Carbon::parse($employee->hired_date)->diffInYears(now());

        $exists = SystemNotification::where('message', 'LIKE', "%{$employee->full_name}%anniversary%")
            ->whereDate('created_at', today())
            ->exists();

        if (! $exists) {
            SystemNotification::create([
                'title'   => '🎉 Work Anniversary!',
                'message' => "{$employee->full_name} celebrates {$years} year(s) with EatNGo today!",
                'category' => 'celebration',
                'severity' => 'info',
            ]);
        }
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
