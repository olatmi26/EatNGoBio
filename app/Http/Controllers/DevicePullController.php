<?php
    namespace App\Http\Controllers;

    use App\Models\Device;
    use App\Services\ScheduledPullService;
    use Illuminate\Http\JsonResponse;
    use Illuminate\Http\RedirectResponse;
    use Illuminate\Http\Request;

    class DevicePullController extends Controller
    {
    public function __construct(
        private ScheduledPullService $pullService
    ) {}

    /**
     * Pull data from a specific device
     */
    public function pullDevice(Request $request, int $id): JsonResponse
    {
        $device = Device::findOrFail($id);
        $types  = $request->input('types', ['attendance', 'users']);

        $results = $this->pullService->pullFromDevice($device, $types);

        return response()->json([
            'success' => true,
            'message' => 'Pull commands queued',
            'results' => $results,
        ]);
    }

    /**
     * Pull from all devices in an area
     */
    public function pullArea(Request $request): JsonResponse
    {
        $area    = $request->input('area');
        $results = $this->pullService->pullFromArea($area);

        return response()->json([
            'success' => true,
            'message' => "Pull commands queued for area: {$area}",
            'results' => $results,
        ]);
    }

    /**
     * Get pull status for a device
     */
    public function pullStatus(int $id): JsonResponse
    {
        $device = Device::findOrFail($id);

        return response()->json([
            'status' => $this->pullService->getPullStatus($device),
        ]);
    }

    /**
     * Execute scheduled pull now (admin only)
     */
    public function executeNow(): RedirectResponse
    {
        $results = $this->pullService->executeScheduledPull();

        return back()->with('success', "Pull completed: {$results['attendance_pulled']} attendance, {$results['users_pulled']} users");
    }


    
}