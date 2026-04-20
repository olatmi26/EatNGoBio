<?php
// ====================================================================
// FILE: app/Http/Controllers/DashboardController.php
// ====================================================================
namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\DeviceSyncLog;
use App\Services\AttendanceService;
use App\Services\DeviceService;
use App\Services\NotificationService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        private AttendanceService   $attendance,
        private DeviceService       $devices,
        private NotificationService $notifs,
    ) {}

    public function index(): Response
    {
        $user  = auth()->user();
        $stats = $this->attendance->todayStats();

        $totalDevices  = Device::where('approved', true)->count();
        $onlineDevices = Device::where('approved', true)->get()->filter(fn($d) => $d->is_online)->count();
        $stats['totalDevices']       = $totalDevices;
        $stats['activeDevices']      = $onlineDevices;
        $stats['pendingSyncRecords'] = DeviceSyncLog::where('status', 'partial')->count();

        return Inertia::render('Dashboard/Index', [
            'stats'         => $stats,
            'devices'       => $this->devices->deviceList(),
            'liveFeed'      => $this->attendance->liveFeed(10),
            'weeklyTrend'   => $this->attendance->weeklyTrend(),
            'deptBreakdown' => $this->attendance->deptBreakdown(),
            'hourlyData'    => $this->attendance->hourlyActivity(),
            'notifications' => $this->notifs->forUser($user->id, 10),
            'unreadCount'   => $this->notifs->unreadCount($user->id),
        ]);
    }
}
