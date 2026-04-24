<?php
namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\Employee;
use App\Models\BiometricTemplate;
use App\Services\DeviceCommandService;
use App\Services\EmployeeSyncService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DeviceEmployeeManagerController extends Controller
{
    public function __construct(
        private EmployeeSyncService $syncService,
        private DeviceCommandService $commandService
    ) {}

    public function index(Request $request)
    {
        // Get all approved devices with their counts
        $devices = Device::where('approved', true)
            ->orderBy('status', 'desc')
            ->orderBy('name')
            ->get()
            ->map(fn($d) => [
                'id' => $d->id,
                'name' => $d->name ?? $d->serial_number,
                'sn' => $d->serial_number,
                'area' => $d->area ?? '-',
                'status' => $d->status,
                'is_online' => $d->is_online,
                'employeeCount' => Employee::where('source_device_sn', $d->serial_number)->count(),
                'fpCount' => (int) ($d->fp_count ?? 0),
                'faceCount' => (int) ($d->face_count ?? 0),
            ])
            ->values()
            ->toArray();
        
        // Get all active employees with biometric status
        $employees = Employee::where('active', true)
            ->orderBy('first_name')
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'employeeId' => $e->employee_id,
                'name' => $e->full_name ?: $e->employee_id,
                'department' => $e->department ?? '-',
                'area' => $e->area ?? '-',
                'status' => $e->employee_status ?? 'active',
                'hasBiometric' => BiometricTemplate::where('employee_id', $e->id)->exists(),
            ])
            ->values()
            ->toArray();
        
        // If AJAX request, return JSON
        if ($request->wantsJson() || $request->has('_ajax')) {
            return response()->json([
                'devices' => $devices,
                'employees' => $employees,
            ]);
        }
        
        // For Inertia render
        return Inertia::render('Devices/EmployeeManager', [
            'devices' => $devices,
            'employees' => $employees,
        ]);
    }
    
    public function syncToDevice(Request $request)
    {
        try {
            $data = $request->validate([
                'device_id' => 'required|exists:devices,id',
                'employee_ids' => 'required|array',
                'employee_ids.*' => 'exists:employees,id',
            ]);
            
            $device = Device::find($data['device_id']);
            $employees = Employee::whereIn('id', $data['employee_ids'])->get();
            $successCount = 0;
            
            foreach ($employees as $employee) {
                try {
                    // Ensure $employee is an instance of App\Models\Employee
                    if (!($employee instanceof Employee)) {
                        $employeeModel = Employee::find($employee->id);
                        if (!$employeeModel) {
                            throw new \Exception("Employee model not found for ID {$employee->id}");
                        }
                        $employee = $employeeModel;
                    }

                    $result = $this->syncService->syncEmployeeToDevice($employee, $device);
                    if ($result) $successCount++;
                } catch (\Exception $e) {
                    \Log::error('Sync employee failed', [
                        'employee_id' => $employee->employee_id,
                        'device_id' => $device->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }
  
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => "{$successCount} of {$employees->count()} employee(s) synced to device",
                    'synced_count' => $successCount
                ]);
            }
            
            return back()->with('success', "{$successCount} of {$employees->count()} employee(s) synced to device");
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to sync employees: ' . $e->getMessage()
                ], 500);
            }
            return back()->with('error', 'Failed to sync employees: ' . $e->getMessage());
        }
    }
    
    public function syncFromDevice(Request $request, int $deviceId)
    {
        try {
            $device = Device::findOrFail($deviceId);
            $command = $this->commandService->sendCommand($device, 'SYNC_USER');
            
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Sync command sent to device',
                    'command_id' => $command?->id
                ]);
            }
            
            return back()->with('success', 'Sync command sent to device');
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send sync command: ' . $e->getMessage()
                ], 500);
            }
            return back()->with('error', 'Failed to send sync command');
        }
    }
}