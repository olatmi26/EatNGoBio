<?php
namespace App\Services;

use App\Models\AttendanceLog;
use App\Models\BiometricTemplate;
use App\Models\Device;
use App\Models\DeviceCommand;
use App\Models\DeviceSyncLog;
use App\Models\Employee;
use App\Models\Location;
use App\Models\PendingDevice;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;

class DeviceService
{
    /**
     * Get paginated device list with access control
     */
    public function deviceListPaginated(string $search = '', string $status = '', int $perPage = 15, ?User $user = null): LengthAwarePaginator
    {
        $query = Device::with('location')
            ->when($user && ! $user->hasRole('Super Admin'), function ($q) use ($user) {
                // Apply access control
                $accessibleAreas       = $user->getAccessibleAreas();
                $accessibleLocationIds = $user->getAccessibleLocationIds();

                $q->where(function ($subQ) use ($accessibleAreas, $accessibleLocationIds) {
                    if (! empty($accessibleAreas)) {
                        $subQ->whereIn('area', $accessibleAreas);
                    }
                    if (! empty($accessibleLocationIds)) {
                        $subQ->orWhereIn('location_id', $accessibleLocationIds);
                    }
                });
            })
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('serial_number', 'like', "%{$search}%")
                        ->orWhere('area', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%");
                });
            })
            ->when($status, function ($query, $status) {
                if ($status === 'online') {
                    $query->where('approved', true)
                        ->whereNotNull('last_seen')
                        ->whereRaw('last_seen > DATE_SUB(NOW(), INTERVAL (heartbeat_interval * 2 + 30) SECOND)');
                } elseif ($status === 'offline') {
                    $query->where('approved', true)
                        ->where(function ($q) {
                            $q->whereNull('last_seen')
                                ->orWhereRaw('last_seen <= DATE_SUB(NOW(), INTERVAL (heartbeat_interval * 2 + 30) SECOND)');
                        });
                } elseif ($status === 'unregistered') {
                    $query->where('approved', false);
                }
            })
            ->orderBy('name');

        $paginator = $query->paginate($perPage);
        $paginator->getCollection()->transform(fn($d) => $this->formatDevice($d));

        return $paginator;
    }

    /**
     * Get all devices (non-paginated) - for dropdowns, exports, etc.
     */
    public function deviceList(): array
    {
        return Device::with('location')
            ->orderBy('name')
            ->get()
            ->map(function ($d) {
                if (! ($d instanceof Device)) {
                    $d = Device::find($d->id);
                }
                return $this->formatDevice($d);
            })
            ->toArray();
    }

    public function forceSyncDeviceCounts(Device $device): array
    {
        // Count by device serial number
        $userCount = Employee::where('source_device_sn', $device->serial_number)->count();

        // Count fingerprints
        $fpCount = BiometricTemplate::where('device_sn', $device->serial_number)
            ->where('type', 'fingerprint')
            ->where('is_valid', true)
            ->count();

        // Count faces
        $faceCount = BiometricTemplate::where('device_sn', $device->serial_number)
            ->where('type', 'face')
            ->where('is_valid', true)
            ->count();

        $device->update([
            'user_count' => $userCount,
            'fp_count'   => $fpCount,
            'face_count' => $faceCount,
        ]);

        return [
            'users'        => $userCount,
            'fingerprints' => $fpCount,
            'faces'        => $faceCount,
        ];
    }

    /**
     * Format a single device for frontend display.
     */
    public function formatDevice(Device $d): array
    {
        return [
            'id'           => $d->id,
            'sn'           => $d->serial_number,
            'name'         => $d->name ?? $d->serial_number,
            'area'         => $d->area ?? $d->location?->name ?? '-',
            'ip'           => $d->ip_address ?? '-',
            'timezone'     => $d->timezone ?? 'Africa/Lagos',
            'transferMode' => $d->transfer_mode ?? 'Real-Time',
            'status'       => $d->computed_status, // This should be 'online' or 'offline'
            'lastActivity' => $d->last_seen?->format('Y-m-d H:i:s') ?? 'Never',
            'lastSeen'     => $d->last_seen_human,
            'users'        => $d->user_count ?? 0,
            'fp'           => $d->fp_count ?? 0,
            'face'         => $d->face_count ?? 0,
            'firmware'     => $d->firmware ?? 'Unknown',
            'heartbeat'    => $d->heartbeat_interval ?? 10,
            'punchesToday' => $d->todayPunchCount(),
            'location'     => $d->location?->name,
            'approved'     => (bool) $d->approved,
        ];
    }

    /**
     * Store a new device.
     */
    public function storeDevice(array $data): Device
    {
        $location = Location::where('name', $data['area'])->first();

        return Device::create([
            'serial_number'      => $data['sn'],
            'name'               => $data['name'],
            'area'               => $data['area'],
            'location_id'        => $location?->id,
            'ip_address'         => $data['ip'],
            'timezone'           => $data['timezone'] ?? 'Africa/Lagos',
            'transfer_mode'      => $data['transferMode'] ?? 'Real-Time',
            'heartbeat_interval' => $data['heartbeat'] ?? 60,
            'approved'           => true,
            'status'             => 'offline',
        ]);
    }

    /**
     * Update an existing device.
     */
    public function updateDevice(int $id, array $data): Device
    {
        $device = Device::findOrFail($id);

        $updateData = [
            'name'               => $data['name'] ?? $device->name,
            'area'               => $data['area'] ?? $device->area,
            'ip_address'         => $data['ip'] ?? $device->ip_address,
            'timezone'           => $data['timezone'] ?? $device->timezone,
            'transfer_mode'      => $data['transferMode'] ?? $device->transfer_mode,
            'heartbeat_interval' => $data['heartbeat'] ?? $device->heartbeat_interval,
        ];

        if (isset($data['sn'])) {
            $updateData['serial_number'] = $data['sn'];
        }

        if (isset($data['area'])) {
            $location                  = Location::where('name', $data['area'])->first();
            $updateData['location_id'] = $location?->id;
        }

        $device->update($updateData);

        return $device->fresh();
    }

    /**
     * Get device details with relations.
     */
    public function deviceDetail(int $id): array
    {
        $device = Device::with('location')->findOrFail($id);

        return [
            'device'             => $this->formatDevice($device),
            'punchLogs'          => $this->getPunchLogs($device),
            'syncHistory'        => $this->getSyncHistory($device),
            'commands'           => $this->getCommands($device),
            'connectedEmployees' => $this->getConnectedEmployees($device),
        ];
    }

    /**
     * Get punch logs for a device.
     */
    public function getPunchLogs(Device $device, int $limit = 50): array
    {
        return AttendanceLog::with('employee')
            ->where('device_sn', $device->serial_number)
            ->orderByDesc('punch_time')
            ->limit($limit)
            ->get()
            ->map(fn($log) => [
                'id'           => $log->id,
                'employeeId'   => $log->employee_pin,
                'employeeName' => $log->employee?->full_name ?? "PIN {$log->employee_pin}",
                'department'   => $log->employee?->department ?? '-',
                'timestamp'    => $log->punch_time->format('Y-m-d H:i:s'),
                'punchType'    => $log->verify_type_label,
                'verifyMode'   => $log->punch_type_label,
                'status'       => 'success',
            ])->toArray();
    }

    /**
     * Get sync history for a device.
     */
    public function getSyncHistory(Device $device, int $limit = 20): array
    {
        return DeviceSyncLog::where('device_id', $device->id)
            ->orderByDesc('synced_at')
            ->limit($limit)
            ->get()
            ->map(fn($s) => [
                'id'        => $s->id,
                'timestamp' => $s->synced_at->format('Y-m-d H:i:s'),
                'type'      => $s->type,
                'records'   => $s->records,
                'status'    => $s->status,
                'duration'  => $s->duration ?? '0.2s',
                'message'   => $s->message ?? '',
            ])->toArray();
    }

    /**
     * Get command history for a device.
     */
    public function getCommands(Device $device, int $limit = 20): array
    {
        return DeviceCommand::where('device_id', $device->id)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn($c) => [
                'id'       => $c->id,
                'command'  => $c->command,
                'sentAt'   => $c->created_at->format('Y-m-d H:i:s'),
                'status'   => $c->status,
                'response' => $c->response ?? '-',
            ])->toArray();
    }

    /**
     * Get connected employees for a device (same area).
     */
    public function getConnectedEmployees(Device $device): array
    {
        return Employee::where('area', $device->area)
            ->where('active', true)
            ->get()
            ->map(fn($e) => [
                'id'         => $e->id,
                'employeeId' => $e->employee_id,
                'firstName'  => $e->first_name,
                'lastName'   => $e->last_name,
                'department' => $e->department ?? '-',
                'position'   => $e->position ?? '-',
                'area'       => $e->area ?? '-',
                'status'     => $e->employee_status ?? 'active',
            ])->toArray();
    }

    /**
     * Send a command to a device.
     */
    public function sendCommand(int $deviceId, string $command, ?string $params = null): DeviceCommand
    {
        $device = Device::findOrFail($deviceId);

        return DeviceCommand::create([
            'device_id' => $device->id,
            'device_sn' => $device->serial_number,
            'command'   => $command,
            'params'    => $params,
            'status'    => 'pending',
        ]);
    }

    /**
     * Get pending devices awaiting approval.
     */
    public function pendingDevices(): array
    {
        return PendingDevice::where('status', 'pending')
            ->orderByDesc('last_heartbeat')
            ->get()
            ->map(fn($pd) => [
                'id'            => $pd->id,
                'sn'            => $pd->serial_number,
                'ip'            => $pd->ip_address,
                'model'         => $pd->model ?? 'ZKTeco',
                'firmware'      => $pd->firmware ?? '-',
                'firstSeen'     => $pd->first_seen?->format('Y-m-d H:i:s') ?? '-',
                'lastHeartbeat' => $pd->last_heartbeat?->format('Y-m-d H:i:s') ?? '-',
                'status'        => $pd->status,
                'requestCount'  => $pd->request_count,
                'suggestedName' => $pd->suggested_name ?? $pd->serial_number,
            ])->toArray();
    }

    /**
     * Approve a pending device.
     */
    public function approveDevice(int $pendingId, array $data): Device
    {
        $pending = PendingDevice::findOrFail($pendingId);

        $device = Device::create([
            'serial_number'      => $pending->serial_number,
            'name'               => $data['name'] ?? $pending->suggested_name ?? $pending->serial_number,
            'area'               => $data['area'] ?? null,
            'location_id'        => $data['location_id'] ?? null,
            'ip_address'         => $pending->ip_address,
            'firmware'           => $pending->firmware,
            'timezone'           => $data['timezone'] ?? 'Africa/Lagos',
            'transfer_mode'      => 'Real-Time',
            'heartbeat_interval' => 10,
            'approved'           => true,
            'status'             => 'offline',
        ]);

        $pending->update(['status' => 'approved']);

        return $device;
    }

    /**
     * Batch approve all unregistered devices.
     */
    public function batchApprove(): int
    {
        return Device::where('approved', false)
            ->orWhere('status', 'unregistered')
            ->update([
                'approved' => true,
                'status'   => 'offline',
            ]);
    }

    /**
     * Get stats with access control
     */
    public function getStats(?User $user = null): array
    {
        $query = Device::query();

        if ($user && ! $user->hasRole('Super Admin')) {
            $accessibleAreas       = $user->getAccessibleAreas();
            $accessibleLocationIds = $user->getAccessibleLocationIds();

            $query->where(function ($q) use ($accessibleAreas, $accessibleLocationIds) {
                if (! empty($accessibleAreas)) {
                    $q->whereIn('area', $accessibleAreas);
                }
                if (! empty($accessibleLocationIds)) {
                    $q->orWhereIn('location_id', $accessibleLocationIds);
                }
            });
        }

        $totalDevices  = $query->count();
        $onlineDevices = (clone $query)->where('approved', true)
            ->get()
            ->filter(fn($d) => $d->is_online)
            ->count();

        return [
            'total'      => $totalDevices,
            'online'     => $onlineDevices,
            'offline'    => $totalDevices - $onlineDevices,
            'totalUsers' => (clone $query)->sum('user_count'),
            'pending'    => PendingDevice::where('status', 'pending')->count(),
        ];
    }

    /**
     * Get recent activity for dashboard.
     */
    public function getRecentActivity(int $limit = 5): array
    {
        return AttendanceLog::with(['device', 'employee'])
            ->orderByDesc('punch_time')
            ->limit($limit)
            ->get()
            ->map(fn($log) => [
                'id'       => $log->id,
                'device'   => $log->device?->name ?? $log->device_sn,
                'employee' => $log->employee?->full_name ?? "PIN {$log->employee_pin}",
                'time'         => $log->punch_time->diffForHumans(),
                'type'         => $log->punch_type_label,
            ])->toArray();
    }

    /**
     * Get location statistics for analytics.
     */
    public function locationStats(): array
    {
        $today  = Carbon::today();
        $colors = ['#16a34a', '#0891b2', '#f59e0b', '#7c3aed', '#db2777', '#dc2626', '#d97706', '#65a30d'];

        $empByLocation = Employee::where('active', true)
            ->whereNotNull('location_id')
            ->selectRaw('location_id, COUNT(*) as total')
            ->groupBy('location_id')
            ->pluck('total', 'location_id');

        $presentByLocation = AttendanceLog::whereDate('punch_time', $today)
            ->where('punch_type', 0)
            ->join('employees as e', 'attendance_logs.employee_pin', '=', 'e.employee_id')
            ->whereNotNull('e.location_id')
            ->selectRaw('e.location_id, COUNT(DISTINCT attendance_logs.employee_pin) as cnt')
            ->groupBy('e.location_id')
            ->pluck('cnt', 'location_id');

        $devicesPerLocation = Device::where('approved', true)
            ->whereNotNull('location_id')
            ->selectRaw('location_id, COUNT(*) as total')
            ->groupBy('location_id')
            ->pluck('total', 'location_id');

        $locations = Location::orderBy('name')->get();
        $i         = 0;

        return $locations->map(function ($loc) use (
            &$i, $colors, $empByLocation, $presentByLocation, $devicesPerLocation
        ) {
            $total      = (int) ($empByLocation[$loc->id] ?? 0);
            $present    = (int) ($presentByLocation[$loc->id] ?? 0);
            $devs       = (int) ($devicesPerLocation[$loc->id] ?? 0);
            $onlineDevs = $loc->online_device_count;

            return [
                'id'             => $loc->id,
                'location'       => $loc->name,
                'totalEmployees' => $total,
                'presentToday'   => $present,
                'attendanceRate' => $total > 0 ? round(($present / $total) * 100, 1) : 0,
                'devices'        => $devs,
                'onlineDevices'  => $onlineDevs,
                'trend'          => [],
                'color'          => $colors[$i++ % count($colors)],
            ];
        })->toArray();
    }

    /**
     * Get device analytics stats.
     */
    public function deviceStats(): array
    {
        $today = Carbon::today();

        $todayCounts = AttendanceLog::whereDate('punch_time', $today)
            ->selectRaw('device_id, COUNT(*) as cnt')
            ->groupBy('device_id')
            ->pluck('cnt', 'device_id');

        $weekCounts = AttendanceLog::where('punch_time', '>=', $today->copy()->subDays(6)->startOfDay())
            ->selectRaw('device_id, DATE(punch_time) as day, COUNT(*) as cnt')
            ->groupBy('device_id', 'day')
            ->get()
            ->groupBy('device_id');

        return Device::where('approved', true)->get()->map(function ($d) use ($today, $todayCounts, $weekCounts) {
            $punchesToday = (int) ($todayCounts[$d->id] ?? 0);
            $devWeek      = $weekCounts->get($d->id, collect())->keyBy('day');
            $weekly       = [];

            for ($i = 6; $i >= 0; $i--) {
                $weekly[] = (int) ($devWeek->get($today->copy()->subDays($i)->toDateString())?->cnt ?? 0);
            }

            // Calculate dynamic success rate from sync logs
            $successRate = $this->calculateDeviceSuccessRate($d->id);

            return [
                'id'            => $d->id,
                'deviceName'    => $d->name ?? $d->serial_number,
                'location'      => $d->area ?? '-',
                'status'        => $d->computed_status,
                'punchesToday'  => $punchesToday,
                'lastSync'      => $d->last_seen?->format('Y-m-d H:i') ?? '-',
                'successRate'   => $successRate,
                'weeklyPunches' => $weekly,
            ];
        })->toArray();
    }

    /**
     * Calculate device success rate based on sync logs from the last 7 days.
     */
    private function calculateDeviceSuccessRate(int $deviceId): float
    {
        $logs = DeviceSyncLog::where('device_id', $deviceId)
            ->where('created_at', '>=', now()->subDays(7))
            ->get();

        if ($logs->isEmpty()) {
            return 100.0;
        }

        $successful = $logs->where('status', 'success')->count();
        return round(($successful / $logs->count()) * 100, 1);
    }

    /**
     * Get paginated connected employees for a device.
     */
    public function getConnectedEmployeesPaginated(Device $device, string $search = '', int $perPage = 15): LengthAwarePaginator
    {
        return Employee::where('area', $device->area)
            ->where('active', true)
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%")
                        ->orWhere('department', 'like', "%{$search}%")
                        ->orWhere('position', 'like', "%{$search}%");
                });
            })
            ->orderBy('first_name')
            ->paginate($perPage);
    }

/**
 * Get connected employees summary (for initial load).
 */
    public function getConnectedEmployeesSummary(Device $device): array
    {
        $total = Employee::where('area', $device->area)
            ->where('active', true)
            ->count();

        $activeCount = Employee::where('area', $device->area)
            ->where('active', true)
            ->where('employee_status', 'active')
            ->count();

        $probationCount = Employee::where('area', $device->area)
            ->where('active', true)
            ->where('employee_status', 'probation')
            ->count();

        return [
            'total'     => $total,
            'active'    => $activeCount,
            'probation' => $probationCount,
        ];
    }
}
