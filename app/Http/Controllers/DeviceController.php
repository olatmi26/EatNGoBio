<?php
namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Employee;
use App\Models\Location;
use App\Models\PendingDevice;
use App\Services\DeviceCommandService;
use App\Services\DeviceOperationService;
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
        private DeviceService $deviceService,
        private DeviceOperationService $operationService,
        private DeviceCommandService $commandService,
        private NotificationService $notifs,
    ) {}

    public function index(Request $request): Response
    {
        $perPage = $request->input('per_page', 15);
        $search  = $request->input('search', '');
        $status  = $request->input('status', '');

        $devices         = $this->deviceService->deviceListPaginated($search, $status, $perPage);
        $stats           = $this->deviceService->getStats();
        $deviceAnalytics = $this->deviceService->deviceStats();

        return Inertia::render('Devices/Index', [
            'devices'         => $devices,
            'pendingDevices'  => $this->deviceService->pendingDevices(),
            'areas'           => Location::orderBy('name')->get(['id', 'name', 'code']),
            'unreadCount'     => $this->notifs->unreadCount($request->user()->id),
            'stats'           => $stats,
            'deviceAnalytics' => $deviceAnalytics,
            'availableCommands' => $this->commandService->getAvailableCommands(),
            'filters'         => [
                'search'   => $search,
                'status'   => $status,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function show(int $id): Response
    {
        $device = Device::with('location')->findOrFail($id);
        $user=auth()->user();

        return Inertia::render('Devices/Detail', [
            'device'             => $this->deviceService->formatDevice($device),
            'punchLogs'          => $this->deviceService->getPunchLogs($device),
            'syncHistory'        => $this->deviceService->getSyncHistory($device),
            'commands'           => $this->commandService->getCommandHistory($device),
            'connectedEmployees' => $this->deviceService->getConnectedEmployeesPaginated($device),
            'employeesSummary'   => $this->deviceService->getConnectedEmployeesSummary($device),
            'availableCommands'  => $this->commandService->getAvailableCommands(),
            'areas'              => Location::orderBy('name')->get(['id', 'name']),
            'unreadCount'        => $this->notifs->unreadCount($user->id),
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

        $this->deviceService->storeDevice($validated);

        return redirect()->route('devices.index')
            ->with('success', 'Device added successfully.');
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

        $this->deviceService->updateDevice($id, $data);

        return back()->with('success', 'Device updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        Device::findOrFail($id)->delete();
        return redirect()->route('devices.index')->with('success', 'Device removed.');
    }

    /**
     * Send a command to a device
     */
    public function sendCommand(Request $request, int $id): RedirectResponse|JsonResponse
    {
        $device = Device::findOrFail($id);

        $data = $request->validate([
            'command' => 'required|string',
            'params'  => 'nullable|string',
        ]);

        try {
            $command = $this->commandService->sendCommand($device, $data['command'], $data['params'] ?? null);

            $message = "Command '{$data['command']}' queued successfully.";

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'command' => [
                        'id' => $command->id,
                        'command' => $command->command,
                        'status' => $command->status,
                    ],
                ]);
            }

            return back()->with('success', $message);
        } catch (\InvalidArgumentException $e) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
            }
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Sync time with device
     */
    public function syncTime(int $id): RedirectResponse|JsonResponse
    {
        $device = Device::findOrFail($id);
        $command = $this->commandService->syncTime($device);

        $message = 'Time sync command queued.';

        if (request()->expectsJson()) {
            return response()->json(['success' => true, 'message' => $message, 'command_id' => $command->id]);
        }

        return back()->with('success', $message);
    }

    /**
     * Sync all users to device
     */
    public function syncAllUsers(int $id): RedirectResponse|JsonResponse
    {
        $device = Device::findOrFail($id);
        $commands = $this->commandService->syncAllUsers($device);

        $message = count($commands) . ' user sync commands queued.';

        if (request()->expectsJson()) {
            return response()->json(['success' => true, 'message' => $message, 'count' => count($commands)]);
        }

        return back()->with('success', $message);
    }

    /**
     * Get pending commands for a device
     */
    public function pendingCommands(int $id): JsonResponse
    {
        $device = Device::findOrFail($id);
        return response()->json([
            'commands' => $this->commandService->getPendingCommands($device),
        ]);
    }

    /**
     * Get command history for a device
     */
    public function commandHistory(int $id): JsonResponse
    {
        $device = Device::findOrFail($id);
        return response()->json([
            'history' => $this->commandService->getCommandHistory($device),
        ]);
    }

    /**
     * Retry failed commands
     */
    public function retryFailed(int $id): RedirectResponse|JsonResponse
    {
        $device = Device::findOrFail($id);
        $commands = $this->commandService->retryFailedCommands($device);

        $message = count($commands) . ' failed commands queued for retry.';

        if (request()->expectsJson()) {
            return response()->json(['success' => true, 'message' => $message, 'count' => count($commands)]);
        }

        return back()->with('success', $message);
    }

    public function approve(Request $request, int $pendingId): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'area'        => 'nullable|string',
            'location_id' => 'nullable|exists:locations,id',
            'timezone'    => 'nullable|string',
        ]);

        $device = $this->deviceService->approveDevice($pendingId, $data);

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
        $count = $this->deviceService->batchApprove();
        return back()->with('success', "{$count} devices approved.");
    }

    public function stats(): JsonResponse
    {
        return response()->json([
            ...$this->deviceService->getStats(),
            'recentActivity' => $this->deviceService->getRecentActivity(5),
        ]);
    }

    public function liveStats(): JsonResponse
    {
        $devices    = $this->deviceService->deviceList();
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
