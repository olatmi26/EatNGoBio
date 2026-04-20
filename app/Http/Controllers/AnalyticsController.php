<?php
namespace App\Http\Controllers;

use App\Services\AttendanceService;
use App\Services\DeviceService;
use App\Services\NotificationService;
use Inertia\Inertia;
use Inertia\Response;

class AnalyticsController extends Controller
{
    public function __construct(
        private AttendanceService $attendance,
        private DeviceService $devices,
        private NotificationService $notifs,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Analytics/Index', [
            'deptStats'     => $this->attendance->deptStats(),
            'locationStats' => $this->devices->locationStats(),
            'deviceStats'   => $this->devices->deviceStats(),
            'weeklyTrend'   => $this->attendance->weeklyTrend(),
            'unreadCount'   => $this->notifs->unreadCount(auth()->id()),
        ]);
    }    
}
