<?php
namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Device;
use App\Services\AttendanceService;
use App\Services\NotificationService;
use Inertia\Inertia;
use Inertia\Response;

class LiveMonitorController extends Controller
{
    public function __construct(
        private AttendanceService   $attendance,
        private NotificationService $notifs,
    ) {}

    public function index(): Response
    {
        $devices = Device::where('approved', true)->get()->map(fn($d) => [
            'id'     => $d->id,
            'sn'     => $d->serial_number,
            'name'   => $d->name ?? $d->serial_number,
            'area'   => $d->area ?? '-',
            'status' => $d->computed_status,
        ]);

        return Inertia::render('LiveMonitor/Index', [
            'initialFeed' => $this->attendance->liveFeed(30),
            'devices'     => $devices,
            'unreadCount' => $this->notifs->unreadCount(auth()->id()),
        ]);
    }

    /** Polled every 3–5s from frontend — returns new punches since $since */
    public function feed(): \Illuminate\Http\JsonResponse
    {
        $since = request()->input('since');

        $query = AttendanceLog::with(['employee', 'device'])
            ->orderByDesc('punch_time')
            ->limit(20);

        if ($since) {
            $query->where('punch_time', '>', $since);
        }

        $logs   = $query->get();
        $colors = ['#16a34a','#0891b2','#f59e0b','#7c3aed','#db2777','#dc2626','#d97706','#0d9488','#4f46e5','#ea580c'];
        $i      = 0;

        $feed = $logs->map(function ($log) use (&$i, $colors) {
            $emp = $log->employee;
            return [
                'id'         => $log->id,
                'employeeId' => $log->employee_pin,
                'employeeName'=> $emp?->full_name ?? "PIN {$log->employee_pin}",
                'initials'   => $emp ? $emp->initials : strtoupper(substr($log->employee_pin, 0, 2)),
                'department' => $emp?->department ?? '-',
                'device'     => $log->device?->name ?? $log->device_sn,
                'deviceName' => $log->device?->name ?? $log->device_sn,
                'timestamp'  => $log->punch_time->toIso8601String(),
                'time'       => $log->punch_time->format('H:i:s'),
                'punchType'  => $log->verify_type_label,
                'verifyMode' => $log->punch_type_label,
                'type'       => $log->punch_type === 0 ? 'IN' : 'OUT',
                'status'     => 'success',
                'color'      => $colors[$i++ % count($colors)],
            ];
        })->toArray();

        $heartbeats = Device::where('approved', true)->get()
            ->mapWithKeys(fn($d) => [$d->serial_number => $d->is_online ? 1 : 0]);

        return response()->json([
            'feed'       => $feed,
            'heartbeats' => $heartbeats,
            'serverTime' => now()->toIso8601String(),
        ]);
    }
}
