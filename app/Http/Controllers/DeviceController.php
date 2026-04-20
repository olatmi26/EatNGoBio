<?php
namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Location;
use App\Models\PendingDevice;
use App\Services\DeviceService;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeviceController extends Controller
{
    public function __construct(
        private DeviceService       $service,
        private NotificationService $notifs,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Devices/Index', [
            'devices'        => $this->service->deviceList(),
            'pendingDevices' => $this->service->pendingDevices(),
            'areas'          => Location::orderBy('name')->get(['id', 'name', 'code']),
            'unreadCount'    => $this->notifs->unreadCount(auth()->id()),
        ]);
    }

    public function show(int $id): Response
    {
        $detail = $this->service->deviceDetail($id);
        return Inertia::render('Devices/Detail', array_merge($detail, [
            'areas'      => Location::orderBy('name')->get(['id', 'name']),
            'unreadCount'=> $this->notifs->unreadCount(auth()->id()),
        ]));
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $device = Device::findOrFail($id);
        $data   = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'area'        => 'sometimes|nullable|string',
            'location_id' => 'sometimes|nullable|exists:locations,id',
            'timezone'    => 'sometimes|string',
            'notes'       => 'sometimes|nullable|string',
        ]);
        $device->update($data);
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
        $data   = $request->validate([
            'name'        => 'required|string|max:100',
            'area'        => 'nullable|string',
            'location_id' => 'nullable|exists:locations,id',
            'timezone'    => 'nullable|string',
        ]);
        $device = $this->service->approveDevice($pendingId, $data);
        return redirect()->route('devices.show', $device->id)->with('success', 'Device approved and registered.');
    }

    public function reject(int $pendingId): RedirectResponse
    {
        PendingDevice::findOrFail($pendingId)->update(['status' => 'rejected']);
        return back()->with('success', 'Device rejected.');
    }

    /** JSON poll endpoint for Live Monitor */
    public function liveStats(): \Illuminate\Http\JsonResponse
    {
        $devices    = $this->service->deviceList();
        $heartbeats = collect($devices)->mapWithKeys(fn($d) => [$d['sn'] => $d['status'] === 'online' ? 1 : 0]);
        return response()->json([
            'heartbeats' => $heartbeats,
            'online'     => collect($devices)->where('status', 'online')->count(),
            'total'      => count($devices),
        ]);
    }
}
