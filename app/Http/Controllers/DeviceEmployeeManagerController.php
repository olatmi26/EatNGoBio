<?php
namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Employee;
use App\Services\DeviceCommandService;
use App\Services\EmployeeSyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DeviceEmployeeManagerController extends Controller
{
    public function __construct(
        private EmployeeSyncService $syncService,
        private DeviceCommandService $commandService
    ) {}

    public function syncToDevice(Request $request)
    {
        try {
            $data = $request->validate([
                'device_id'      => 'required|exists:devices,id',
                'employee_ids'   => 'required|array',
                'employee_ids.*' => 'exists:employees,id',
            ]);

            $device       = Device::findOrFail($data['device_id']);
            $employees    = Employee::whereIn('id', $data['employee_ids'])->get();
            $successCount = 0;
            $errors       = [];

            foreach ($employees as $employee) {
                try {
                    // Use the correct sync method that sends SET_USER command
                    $result = $this->syncService->syncEmployeeToDevice($employee, $device);
                    if ($result) {
                        $successCount++;
                    } else {
                        $errors[] = "Failed to sync employee: {$employee->employee_id}";
                    }
                } catch (\Exception $e) {
                    Log::error('Sync employee failed', [
                        'employee_id' => $employee->employee_id,
                        'device_id'   => $device->id,
                        'error'       => $e->getMessage(),
                    ]);
                    $errors[] = "Error syncing {$employee->employee_id}: " . $e->getMessage();
                }
            }

            $message = $successCount > 0
                ? "{$successCount} of {$employees->count()} employee(s) synced to {$device->name}"
                : "Failed to sync employees to {$device->name}";

            if ($request->wantsJson()) {
                return response()->json([
                    'success'      => $successCount > 0,
                    'message'      => $message,
                    'synced_count' => $successCount,
                    'errors'       => $errors,
                ]);
            }

            return back()->with($successCount > 0 ? 'success' : 'error', $message);
        } catch (\Exception $e) {
            Log::error('Sync to device failed', ['error' => $e->getMessage()]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to sync employees: ' . $e->getMessage(),
                ], 500);
            }
            return back()->with('error', 'Failed to sync employees: ' . $e->getMessage());
        }
    }

    public function syncFromDevice(Request $request, int $deviceId)
    {
        try {
            $device = Device::findOrFail($deviceId);

            // Send SYNC_USER command to pull users from device
            $command = $this->commandService->sendCommand($device, 'SYNC_USER');

            $message = $command
                ? "Sync command sent to {$device->name}. Users will be pulled automatically."
                : "Failed to send sync command to {$device->name}";

            if ($request->wantsJson()) {
                return response()->json([
                    'success'    => (bool) $command,
                    'message'    => $message,
                    'command_id' => $command?->id,
                ]);
            }

            return back()->with((bool) $command ? 'success' : 'error', $message);
        } catch (\Exception $e) {
            Log::error('Sync from device failed', ['device_id' => $deviceId, 'error' => $e->getMessage()]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send sync command: ' . $e->getMessage(),
                ], 500);
            }
            return back()->with('error', 'Failed to send sync command: ' . $e->getMessage());
        }
    }
}
