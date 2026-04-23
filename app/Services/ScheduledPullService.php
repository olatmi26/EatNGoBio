<?php
namespace App\Services;

use App\Models\Device;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ScheduledPullService
{
    public function __construct(
        private DeviceCommandService $commandService
    ) {}
    /**
     * Execute scheduled pull for all online devices
     */
    public function executeScheduledPull(): array
    {
        // FIXED: Get devices that are online based on last_seen timestamp
        $devices = Device::where('approved', true)
            ->get()
            ->filter(function ($device) {
                return $device->is_online; // Use computed status
            });

        $results = [
            'total'             => $devices->count(),
            'attendance_pulled' => 0,
            'users_pulled'      => 0,
            'failed'            => 0,
        ];

        foreach ($devices as $device) {
            try {
                // Pull attendance logs every 5 minutes
                if ($this->shouldPullAttendance($device)) {
                    $this->commandService->sendCommand($device, 'GET_ATTLOG');
                    $this->markAttendancePulled($device);
                    $results['attendance_pulled']++;
                }

                // Pull user data every hour
                if ($this->shouldPullUsers($device)) {
                    $this->commandService->sendCommand($device, 'SYNC_USER');
                    $this->markUsersPulled($device);
                    $results['users_pulled']++;
                }

            } catch (\Exception $e) {
                Log::error('Scheduled pull failed', [
                    'device' => $device->serial_number,
                    'error'  => $e->getMessage(),
                ]);
                $results['failed']++;
            }
        }

        Log::info('📊 Scheduled pull completed', $results);
        return $results;
    }

    /**
     * Pull data from a specific device immediately
     */
    public function pullFromDevice(Device $device, array $types = ['attendance', 'users']): array
    {
        $results = [];

        foreach ($types as $type) {
            $command        = $type === 'attendance' ? 'GET_ATTLOG' : 'SYNC_USER';
            $results[$type] = $this->commandService->sendCommand($device, $command);
        }

        return $results;
    }

    /**
     * Pull from all devices in an area
     */
    public function pullFromArea(string $area): array
    {
        $devices = Device::where('area', $area)
            ->where('approved', true)
            ->where('status', 'online')
            ->get();

        $results = [];
        foreach ($devices as $device) {
            $results[$device->serial_number] = $this->pullFromDevice($device);
        }

        return $results;
    }

    /**
     * Check if attendance should be pulled
     */
    private function shouldPullAttendance(Device $device): bool
    {
        $cacheKey = "attendance_pull_{$device->id}";
        return ! Cache::has($cacheKey);
    }

    /**
     * Check if users should be pulled
     */
    private function shouldPullUsers(Device $device): bool
    {
        $cacheKey = "users_pull_{$device->id}";
        return ! Cache::has($cacheKey);
    }

    /**
     * Mark attendance as pulled
     */
    private function markAttendancePulled(Device $device): void
    {
        $cacheKey = "attendance_pull_{$device->id}";
        Cache::put($cacheKey, now(), 300); // 5 minutes
    }

    /**
     * Mark users as pulled
     */
    private function markUsersPulled(Device $device): void
    {
        $cacheKey = "users_pull_{$device->id}";
        Cache::put($cacheKey, now(), 3600); // 1 hour
    }

    /**
     * Get pull status for a device
     */
    public function getPullStatus(Device $device): array
    {
        return [
            'attendance_last_pull' => Cache::get("attendance_pull_{$device->id}"),
            'users_last_pull' => Cache::get("users_pull_{$device->id}"),
            'can_pull_attendance' => $this->shouldPullAttendance($device),
            'can_pull_users' => $this->shouldPullUsers($device),
        ];
    }
}
