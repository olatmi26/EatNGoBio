<?php
namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\Device;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class LiveMonitorService
{
    private array $avatarColors = [
        '#16a34a', '#0891b2', '#f59e0b', '#7c3aed',
        '#db2777', '#dc2626', '#d97706', '#0d9488',
        '#4f46e5', '#ea580c',
    ];

    /**
     * Get live feed of recent punches
     */
    public function getLiveFeed(int $limit = 50, ?string $since = null): array
    {
        $query = AttendanceLog::with(['employee', 'device'])
            ->orderByDesc('punch_time')
            ->limit($limit);

        if ($since) {
            $query->where('punch_time', '>', Carbon::parse($since));
        }

        $logs = $query->get();

        return $this->formatFeedItems($logs);
    }

    /**
     * Get device statuses for live monitor
     */
    public function getDeviceStatuses(): array
    {
        $cacheKey = 'live_monitor_devices';

        return Cache::remember($cacheKey, 10, function () {
            return Device::where('approved', true)
                ->get()
                ->map(fn($device) => [
                    'id'        => $device->id,
                    'sn'        => $device->serial_number,
                    'name'      => $device->name ?? $device->serial_number,
                    'area'      => $device->area ?? '-',
                    'ip'        => $device->ip_address ?? '-',
                    'status'    => $device->computed_status,
                    'users'     => $device->user_count ?? 0,
                    'fp'        => $device->fp_count ?? 0,
                    'face'      => $device->face_count ?? 0,
                    'last_seen' => $device->last_seen?->diffForHumans() ?? 'Never',
                    'is_online' => $device->status === 'online',
                ])
                ->toArray();
        });
    }

    /**
     * Get live statistics
     */
    public function getLiveStats(): array
    {
        $today = Carbon::today();

        $cacheKey = "live_stats_{$today->format('Ymd')}";

        return Cache::remember($cacheKey, 30, function () use ($today) {
            $totalDevices  = Device::where('approved', true)->count();
            $onlineDevices = Device::where('approved', true)
                ->where('status', 'online')
                ->count();

            $punchesToday  = AttendanceLog::whereDate('punch_time', $today)->count();
            $checkInsToday = AttendanceLog::whereDate('punch_time', $today)
                ->where('punch_type', 0)
                ->distinct('employee_pin')
                ->count();
            $checkOutsToday = AttendanceLog::whereDate('punch_time', $today)
                ->where('punch_type', 1)
                ->distinct('employee_pin')
                ->count();

            $failedAttempts = AttendanceLog::whereDate('punch_time', $today)
                ->where('status', 'failed')
                ->count();

            return [
                'total_devices'    => $totalDevices,
                'online_devices'   => $onlineDevices,
                'offline_devices'  => $totalDevices - $onlineDevices,
                'punches_today'    => $punchesToday,
                'check_ins_today'  => $checkInsToday,
                'check_outs_today' => $checkOutsToday,
                'failed_attempts'  => $failedAttempts,
                'last_updated'     => now()->toIso8601String(),
            ];
        });
    }

    /**
     * Get device heartbeats (for real-time status)
     */
    public function getDeviceHeartbeats(): array
    {
        return Device::where('approved', true)
            ->get()
            ->mapWithKeys(fn($device) => [
                $device->serial_number => $device->status === 'online' ? 1 : 0,
            ])
            ->toArray();
    }

    /**
     * Get recent activity by type
     */
    public function getActivityBreakdown(int $minutes = 10): array
    {
        $since = now()->subMinutes($minutes);

        $logs = AttendanceLog::where('punch_time', '>=', $since)->get();

        return [
            'check_in'     => $logs->where('punch_type', 0)->count(),
            'check_out'    => $logs->where('punch_type', 1)->count(),
            'break_out'    => $logs->where('punch_type', 2)->count(),
            'break_in'     => $logs->where('punch_type', 3)->count(),
            'overtime_in'  => $logs->where('punch_type', 4)->count(),
            'overtime_out' => $logs->where('punch_type', 5)->count(),
            'fingerprint'  => $logs->whereIn('verify_type', [1, 2, 3])->count(),
            'face'         => $logs->where('verify_type', 4)->count(),
            'card'         => $logs->where('verify_type', 15)->count(),
        ];
    }

    /**
     * Get employees currently checked in
     */
    public function getCurrentlyCheckedIn(): array
    {
        $today = Carbon::today();

        // Get all check-ins today
        $checkIns = AttendanceLog::whereDate('punch_time', $today)
            ->where('punch_type', 0)
            ->with('employee')
            ->get()
            ->groupBy('employee_pin');

        $checkedIn = [];

        foreach ($checkIns as $pin => $logs) {
            $lastCheckIn = $logs->sortByDesc('punch_time')->first();

            // Check if they have checked out after their last check-in
            $hasCheckedOut = AttendanceLog::where('employee_pin', $pin)
                ->whereDate('punch_time', $today)
                ->where('punch_type', 1)
                ->where('punch_time', '>', $lastCheckIn->punch_time)
                ->exists();

            if (! $hasCheckedOut && $lastCheckIn->employee) {
                $employee    = $lastCheckIn->employee;
                $checkedIn[] = [
                    'employee_id'   => $employee->employee_id,
                    'name'          => $employee->full_name,
                    'initials'      => $employee->initials,
                    'department'    => $employee->department ?? '-',
                    'check_in_time' => $lastCheckIn->punch_time->format('H:i:s'),
                    'duration'      => $lastCheckIn->punch_time->diffForHumans(now(), true),
                    'device'        => $lastCheckIn->device?->name ?? '-',
                ];
            }
        }

        return $checkedIn;
    }

    private function formatFeedItems(Collection $logs): array
    {
        $i = 0;

        return $logs->map(function ($log) use (&$i) {
            $employee = $log->employee;
            $device   = $log->device;
            $name     = $employee ? $employee->full_name : "PIN {$log->employee_pin}";
            $initials = $employee ? $employee->initials : strtoupper(substr($log->employee_pin, 0, 2));

            // Use the device's actual punch_type
            $direction      = $log->getPunchDirectionAttribute();
            $punchTypeLabel = $log->getPunchTypeLabelAttribute();

            return [
                'id'            => $log->id,
                'employee_id'   => $log->employee_pin,
                'employee_name' => $name,
                'initials'      => $initials,
                'department'    => $employee->department ?? '-',
                'device'        => $device->name ?? $log->device_sn,
                'timestamp'     => $log->punch_time->toIso8601String(),
                'time'          => $log->punch_time->format('H:i:s'),
                'date'          => $log->punch_time->format('Y-m-d'),
                'punch_type'    => $log->verify_type_label,
                'verify_mode'   => $punchTypeLabel,
                'type'          => $direction,
                'status'        => $log->status ?? 'success',
                'color'         => $this->avatarColors[$i++ % count($this->avatarColors)],
            ];
        })->toArray();
    }

    /**
     * Get consistent avatar color
     */
    private function getAvatarColor(string $name): string
    {
        $hash = 0;
        for ($i = 0; $i < strlen($name); $i++) {
            $hash = ord($name[$i]) + (($hash << 5) - $hash);
        }
        return $this->avatarColors[abs($hash) % count($this->avatarColors)];
    }

    /**
     * Clear cache for live monitor
     */
    public function clearCache(): void
    {
        Cache::forget('live_monitor_devices');
        Cache::forget('live_stats_' . Carbon::today()->format('Ymd'));
    }
}
