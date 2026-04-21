<?php
namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Employee;
use App\Models\Location;
use App\Models\PendingDevice;
use App\Services\DeviceService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeviceController extends Controller
{
    public function __construct(
        private DeviceService $service,
        private NotificationService $notifs,
    ) {}

    public function index(Request $request): Response
    {
        $perPage = $request->input('per_page', 15);
        $search  = $request->input('search', '');
        $status  = $request->input('status', '');

        $devices         = $this->service->deviceListPaginated($search, $status, $perPage);
        $stats           = $this->service->getStats();
        $deviceAnalytics = $this->service->deviceStats();

        return Inertia::render('Devices/Index', [
            'devices'         => $devices,
            'pendingDevices'  => $this->service->pendingDevices(),
            'areas'           => Location::orderBy('name')->get(['id', 'name', 'code']),
            'unreadCount'     => $this->notifs->unreadCount(auth()->id()),
            'stats'           => $stats,
            'deviceAnalytics' => $deviceAnalytics,
            'filters'         => [
                'search'   => $search,
                'status'   => $status,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:100',
            'sn'           => 'required|string|unique:devices,serial_number',
            'ip'           => 'required|string',
            'area'         => 'required|string',
            'timezone'     => 'nullable|string',
            'transferMode' => 'nullable|string',
            'heartbeat'    => 'nullable|integer|min:10|max:3600',
        ]);

        $this->service->storeDevice($validated);

        return redirect()->route('devices.index')
            ->with('success', 'Device added successfully.');
    }

    public function show(Request $request, int $id): Response
    {
        $device = Device::with('location')->findOrFail($id);

        $perPage = $request->input('per_page', 15);
        $search  = $request->input('search', '');
        $status  = $request->input('status', '');

        // Get paginated employees
        $employeesPaginated = $this->service->getConnectedEmployeesPaginated($device, $search, $perPage);
        $employeesSummary   = $this->service->getConnectedEmployeesSummary($device);

        // Transform employee data
        $employeesPaginated->getCollection()->transform(fn($e) => [
            'id'         => $e->id,
            'employeeId' => $e->employee_id,
            'firstName'  => $e->first_name,
            'lastName'   => $e->last_name,
            'fullName'   => $e->full_name,
            'department' => $e->department ?? '-',
            'position'   => $e->position ?? '-',
            'area'       => $e->area ?? '-',
            'status'     => $e->employee_status ?? 'active',
            'initials'   => $e->initials,
        ]);

        return Inertia::render('Devices/Detail', [
            'device'             => $this->service->formatDevice($device),
            'punchLogs'          => $this->service->getPunchLogs($device),
            'syncHistory'        => $this->service->getSyncHistory($device),
            'commands'           => $this->service->getCommands($device),
            'connectedEmployees' => $employeesPaginated,
            'employeesSummary'   => $employeesSummary,
            'areas'              => Location::orderBy('name')->get(['id', 'name']),
            'unreadCount'        => $this->notifs->unreadCount(auth()->id()),
            'filters'            => [
                'search'   => $search,
                'status'   => $status,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $data = $request->validate([
            'name'         => 'sometimes|string|max:100',
            'sn'           => 'sometimes|string|unique:devices,serial_number,' . $id,
            'ip'           => 'sometimes|string',
            'area'         => 'sometimes|nullable|string',
            'location_id'  => 'sometimes|nullable|exists:locations,id',
            'timezone'     => 'sometimes|string',
            'transferMode' => 'sometimes|string',
            'heartbeat'    => 'sometimes|integer|min:10|max:3600',
            'notes'        => 'sometimes|nullable|string',
        ]);

        $this->service->updateDevice($id, $data);

        return back()->with('success', 'Device updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        Device::findOrFail($id)->delete();
        return redirect()->route('devices.index')->with('success', 'Device removed.');
    }

    public function sendCommand(Request $request, int $id): RedirectResponse
    {
        $data = $request->validate([
            'command' => 'required|string',
            'params'  => 'nullable|string',
        ]);

        $this->service->sendCommand($id, $data['command'], $data['params'] ?? null);

        return back()->with('success', "Command '{$data['command']}' queued.");
    }

    public function approve(Request $request, int $pendingId): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'area'        => 'nullable|string',
            'location_id' => 'nullable|exists:locations,id',
            'timezone'    => 'nullable|string',
        ]);

        $device = $this->service->approveDevice($pendingId, $data);

        return redirect()->route('devices.show', $device->id)
            ->with('success', 'Device approved and registered.');
    }

    public function reject(int $pendingId): RedirectResponse
    {
        PendingDevice::findOrFail($pendingId)->update(['status' => 'rejected']);
        return back()->with('success', 'Device rejected.');
    }

    public function reconsider(int $pendingId): RedirectResponse
    {
        PendingDevice::findOrFail($pendingId)->update(['status' => 'pending']);
        return back()->with('success', 'Device moved back to pending queue.');
    }

    public function batchApprove(): RedirectResponse
    {
        $count = $this->service->batchApprove();
        return back()->with('success', "{$count} devices approved.");
    }

    public function stats(): JsonResponse
    {
        return response()->json([
             ...$this->service->getStats(),
            'recentActivity' => $this->service->getRecentActivity(5),
        ]);
    }

    public function liveStats(): JsonResponse
    {
        $devices    = $this->service->deviceList();
        $heartbeats = collect($devices)->mapWithKeys(fn($d) => [$d['sn'] => $d['status'] === 'online' ? 1 : 0]);

        return response()->json([
            'heartbeats' => $heartbeats,
            'online'     => collect($devices)->where('status', 'online')->count(),
            'total'      => count($devices),
        ]);
    }

    /**
     * Get paginated employees for a device (AJAX).
     */
    public function employees(Request $request, int $id): JsonResponse
    {
        $device = Device::findOrFail($id);

        $perPage = $request->input('per_page', 15);
        $search  = $request->input('search', '');
        $status  = $request->input('status', '');

        $query = Employee::where('area', $device->area)
            ->where('active', true)
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%")
                        ->orWhere('department', 'like', "%{$search}%")
                        ->orWhere('position', 'like', "%{$search}%");
                });
            })
            ->when($status, function ($q) use ($status) {
                $q->where('employee_status', $status);
            })
            ->orderBy('first_name');

        $employees = $query->paginate($perPage);

        $employees->getCollection()->transform(fn($e) => [
            'id'         => $e->id,
            'employeeId' => $e->employee_id,
            'firstName'  => $e->first_name,
            'lastName'   => $e->last_name,
            'fullName'   => $e->full_name,
            'department' => $e->department ?? '-',
            'position'   => $e->position ?? '-',
            'area'       => $e->area ?? '-',
            'status'     => $e->employee_status ?? 'active',
            'initials'   => $e->initials,
        ]);

        return response()->json([
            'employees' => $employees,
        ]);
    }
}
