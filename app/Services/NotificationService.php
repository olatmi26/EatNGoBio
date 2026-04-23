<?php

namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Device;
use App\Models\Employee;
use App\Models\SystemNotification;
use Carbon\Carbon;

class NotificationService
{
    public function runChecks(): void
    {
        $this->checkOfflineDevices();
        $this->checkConsecutiveAbsences();
        $this->checkBiometricPending();
    }

    public function checkOfflineDevices(): void
    {
        $devices = Device::where('approved', true)->get()
            ->filter(fn($d) => !$d->is_online);

        foreach ($devices as $device) {
            $hours    = $device->last_seen ? (int)$device->last_seen->diffInHours(now()) : null;
            $hoursStr = $hours ? "{$hours}h" : 'Unknown';
            $exists   = SystemNotification::where('category', 'device')
                ->where('meta', 'like', "%SN:{$device->serial_number}%")
                ->where('read', false)
                ->where('created_at', '>=', Carbon::now()->subHours(6))
                ->exists();

            if (!$exists) {
                SystemNotification::create([
                    'category'     => 'device',
                    'severity'     => 'critical',
                    'title'        => 'Device Offline',
                    'message'      => "{$device->name} at " . ($device->area ?? 'unknown') .
                                      " has been offline for {$hoursStr}.",
                    'action_label' => 'View Device',
                    'action_path'  => "/devices/{$device->id}",
                    'meta'         => ($device->area ?? '-') . " · {$hoursStr} offline · SN:{$device->serial_number}",
                ]);
            }
        }
    }

    public function checkConsecutiveAbsences(): void
    {
        $employees = Employee::where('active', true)->get();
        foreach ($employees as $emp) {
            $absent = 0;
            for ($i = 1; $i <= 3; $i++) {
                $date = Carbon::today()->subDays($i);
                if ($date->isWeekend()) continue;
                $checked = AttendanceLog::where('employee_pin', $emp->employee_id)
                    ->whereDate('punch_time', $date)
                    ->where('punch_type', 0)
                    ->exists();
                if (!$checked) $absent++;
            }

            if ($absent >= 3) {
                $exists = SystemNotification::where('category', 'absence')
                    ->where('meta', 'like', "%PIN:{$emp->employee_id}%")
                    ->where('read', false)
                    ->where('created_at', '>=', Carbon::today())
                    ->exists();

                if (!$exists) {
                    SystemNotification::create([
                        'category'     => 'absence',
                        'severity'     => $emp->employee_status === 'probation' ? 'warning' : 'critical',
                        'title'        => '3+ Consecutive Absences',
                        'message'      => "{$emp->full_name} (EMP{$emp->employee_id}) has been absent for {$absent} consecutive days." .
                                          ($emp->employee_status === 'probation' ? ' Currently on probation.' : ' Immediate follow-up required.'),
                        'action_label' => 'View Employee',
                        'action_path'  => "/employees/{$emp->id}",
                        'meta'         => ($emp->department ?? '-') . " · {$absent} days · PIN:{$emp->employee_id}",
                    ]);
                }
            }
        }
    }

    public function checkBiometricPending(): void
    {
        // Employees with no attendance logs (never punched) = likely not enrolled
        $noPunch = Employee::where('active', true)
            ->whereDoesntHave('attendanceLogs')
            ->count();

        if ($noPunch >= 5) {
            $exists = SystemNotification::where('category', 'biometric')
                ->where('read', false)
                ->where('created_at', '>=', Carbon::now()->subDay())
                ->exists();

            if (!$exists) {
                SystemNotification::create([
                    'category'     => 'biometric',
                    'severity'     => 'warning',
                    'title'        => 'Biometric Enrollment Pending',
                    'message'      => "{$noPunch} employees have never punched in. Biometric enrollment may be incomplete.",
                    'action_label' => 'View Employees',
                    'action_path'  => '/employees',
                    'meta'         => "{$noPunch} employees pending",
                ]);
            }
        }
    }

    public function forUser(?int $userId, int $limit = 30): array
    {
        return SystemNotification::where(fn($q) => $q
            ->whereNull('user_id')
            ->orWhere('user_id', $userId)
        )
        ->orderByDesc('created_at')
        ->limit($limit)
        ->get()
        ->map(fn($n) => [
            'id'          => $n->id,
            'category'    => $n->category,
            'severity'    => $n->severity,
            'title'       => $n->title,
            'message'     => $n->message,
            'time'        => $n->created_at->diffForHumans(),
            'read'        => $n->read,
            'actionLabel' => $n->action_label,
            'actionPath'  => $n->action_path,
            'meta'        => $n->meta,
        ])->toArray();
    }

    public function markRead(int $id): void
    {
        SystemNotification::findOrFail($id)->update(['read' => true]);
    }

    public function markAllRead(?int $userId): void
    {
        SystemNotification::where(fn($q) => $q
            ->whereNull('user_id')
            ->orWhere('user_id', $userId)
        )->update(['read' => true]);
    }

    public function unreadCount(?int $userId): int
    {
        return SystemNotification::where('read', false)
            ->where(fn($q) => $q->whereNull('user_id')->orWhere('user_id', $userId))
            ->count();
    }



    /**
     * Notify a user with a notification entry.
     *
     * @param int $userId
     * @param string $title
     * @param string $message
     * @param string $severity
     * @param array $meta
     */
    public function notifyUser(
        int $userId,
        string $title,
        string $message,
        string $severity = 'info',
        array $meta = []
    ): void {
        SystemNotification::create([
            'user_id'     => $userId,
            'title'       => $title,
            'message'     => $message,
            'category'    => 'general',
            'severity'    => $severity,
            'meta'        => $meta,
            'read'        => false,
        ]);
    }
}
