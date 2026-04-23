<?php
namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Device;
use App\Services\AttendanceService;
use App\Services\LiveMonitorService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LiveMonitorController extends Controller
{
    public function __construct(
        private AttendanceService   $attendance,
        private NotificationService $notifs,
        private LiveMonitorService $monitorService,
    ) {}

   /**
     * Render live monitor page
     */
    public function index(): Response
    {
        return Inertia::render('LiveMonitor/Index', [
            'initialFeed' => $this->monitorService->getLiveFeed(30),
            'devices' => $this->monitorService->getDeviceStatuses(),
            'stats' => $this->monitorService->getLiveStats(),
            'checkedIn' => $this->monitorService->getCurrentlyCheckedIn(),
            'activityBreakdown' => $this->monitorService->getActivityBreakdown(),
            'unreadCount' => $this->notifs->unreadCount(auth()->id()),
        ]);
    }

    /** Polled every 3–5s from frontend — returns new punches since $since API endpoint for polling new punches*/
    public function feed(Request $request): JsonResponse
    {
        $since = $request->input('since');
        $limit = $request->input('limit', 30);
        
        $feed = $this->monitorService->getLiveFeed($limit, $since);
        $heartbeats = $this->monitorService->getDeviceHeartbeats();
        $stats = $this->monitorService->getLiveStats();
        
        return response()->json([
            'feed' => $feed,
            'heartbeats' => $heartbeats,
            'stats' => $stats,
            'server_time' => now()->toIso8601String(),
        ]);
    }

    /**
     * Get device statuses
     */
    public function devices(): JsonResponse
    {
        return response()->json([
            'devices' => $this->monitorService->getDeviceStatuses(),
        ]);
    }

    /**
     * Get currently checked-in employees
     */
    public function checkedIn(): JsonResponse
    {
        return response()->json([
            'checked_in' => $this->monitorService->getCurrentlyCheckedIn(),
        ]);
    }

    /**
     * Get activity breakdown
     */
    public function activity(Request $request): JsonResponse
    {
        $minutes = $request->input('minutes', 10);
        
        return response()->json([
            'breakdown' => $this->monitorService->getActivityBreakdown($minutes),
        ]);
    }
}
