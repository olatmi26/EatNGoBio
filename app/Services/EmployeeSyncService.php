<?php
namespace App\Services;

use App\Models\BiometricTemplate;
use App\Models\Device;
use App\Models\Employee;
use Illuminate\Support\Facades\Log;

class EmployeeSyncService
{
    public function __construct(
        private DeviceCommandService $commandService
    ) {}

    /**
     * Sync a newly created employee to all relevant devices.
     * Returns an array mapping device serial numbers to the result of the sync attempt.
     */
    public function syncEmployeeToDevices(Employee $employee): array
    {
        $devices = $this->getDevicesForEmployee($employee);
        $results = [];

        foreach ($devices as $device) {
            $results[$device->serial_number] = $this->syncEmployeeToSingleDevice($employee, $device);
        }

        Log::info('👤 Employee synced to devices', [
            'employee_id' => $employee->employee_id,
            'devices'     => count($devices),
        ]);

        return $results;
    }

    /**
     * Sync an employee to a single device.
     * Returns true on success or false on error.
     */
    public function syncEmployeeToSingleDevice(Employee $employee, Device $device): bool
    {
        try {
            // Format the user data according to ZKTeco ADMS protocol
            $params = sprintf(
                "PIN=%s\tName=%s\tPri=0\tPasswd=\tCard=%s",
                $employee->employee_id,
                $this->sanitizeName($employee->full_name ?: "{$employee->first_name} {$employee->last_name}"),
                $employee->card ?? ''
            );

            Log::info('Sending SET_USER command', [
                'device'      => $device->serial_number,
                'employee_id' => $employee->employee_id,
                'params'      => $params,
            ]);

            $command = $this->commandService->sendCommand($device, 'SET_USER', $params);

            if ($command) {
                Log::info('✅ Employee sync command queued', [
                    'employee_id' => $employee->employee_id,
                    'device'      => $device->serial_number,
                    'command_id'  => $command->id,
                ]);

                // Update employee source device if not set
                if (! $employee->source_device_sn) {
                    $employee->update(['source_device_sn' => $device->serial_number]);
                }

                // Add device area to biometric areas if missing
                $areas = $employee->biometric_areas ?? [];
                if ($device->area && ! in_array($device->area, $areas)) {
                    $areas[] = $device->area;
                    $employee->update(['biometric_areas' => $areas]);
                }

                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('❌ Failed to sync employee to device', [
                'employee_id' => $employee->employee_id,
                'device'      => $device->serial_number,
                'error'       => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Sync multiple employees to the given device.
     */
    public function syncEmployeesToDevice(Device $device, array $employeeIds = []): array
    {
        $query = Employee::where('active', true);

        if (! empty($employeeIds)) {
            $query->whereIn('id', $employeeIds);
        } else {
            $query->where(function ($q) use ($device) {
                $q->where('area', $device->area)
                    ->orWhereJsonContains('biometric_areas', $device->area);
            });
        }

        $employees = $query->get();
        $results   = [];

        foreach ($employees as $employee) {
            if (! ($employee instanceof Employee)) {
                $employee = Employee::find($employee->id);
            }
            if (! $employee) {
                continue;
            }
            $results[$employee->employee_id] = $this->syncEmployeeToSingleDevice($employee, $device);
        }

        Log::info('📤 Bulk employee sync completed', [
            'device'  => $device->serial_number,
            'total'   => count($employees),
            'success' => count(array_filter($results)),
        ]);

        return $results;
    }

    /**
     * Delete employee from all devices relevant to that employee.
     */
    public function deleteEmployeeFromDevices(Employee $employee): array
    {
        $devices = $this->getDevicesForEmployee($employee);
        $results = [];

        foreach ($devices as $device) {
            $results[$device->serial_number] = $this->deleteEmployeeFromDevice($employee, $device);
        }

        Log::info('🗑️ Employee deleted from devices', [
            'employee_id' => $employee->employee_id,
            'devices'     => count($devices),
        ]);

        return $results;
    }

    /**
     * Delete employee from a specific device.
     */
    public function deleteEmployeeFromDevice(Employee $employee, Device $device): bool
    {
        try {
            $command = $this->commandService->sendCommand($device, 'DELETE_USER', "PIN={$employee->employee_id}");

            Log::info('✅ Employee delete command queued', [
                'employee_id' => $employee->employee_id,
                'device'      => $device->serial_number,
                'command_id'  => $command->id,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('❌ Failed to delete employee from device', [
                'employee_id' => $employee->employee_id,
                'device'      => $device->serial_number,
                'error'       => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Sync fingerprint for the employee to all relevant devices.
     */
    public function syncFingerprintToDevices(Employee $employee, int $fingerId, string $template, int $size): array
    {
        $devices = $this->getDevicesForEmployee($employee);
        $results = [];

        foreach ($devices as $device) {
            $results[$device->serial_number] = $this->syncFingerprintToDevice(
                $employee, $device, $fingerId, $template, $size
            );
        }
        return $results;
    }

    /**
     * Sync a fingerprint to a specific device.
     */
    public function syncFingerprintToDevice(Employee $employee, Device $device, int $fingerId, string $template, int $size): bool
    {
        try {
            $command = $this->commandService->sendFingerprint(
                $device,
                $employee->employee_id,
                $fingerId,
                $template,
                $size
            );

            BiometricTemplate::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'device_sn'   => $device->serial_number,
                    'type'        => 'fingerprint',
                    'finger_id'   => $fingerId,
                ],
                [
                    'template_size' => $size,
                    'template_data' => $template,
                    'is_valid'      => true,
                ]
            );

            Log::info('✅ Fingerprint sync queued', [
                'employee_id' => $employee->employee_id,
                'device'      => $device->serial_number,
                'finger_id'   => $fingerId,
                'command_id'  => $command->id,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('❌ Failed to sync fingerprint to device', [
                'employee_id' => $employee->employee_id,
                'device'      => $device->serial_number,
                'error'       => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Sync face template for an employee to all their devices.
     */
    public function syncFaceToDevices(Employee $employee, string $template, int $size): array
    {
        $devices = $this->getDevicesForEmployee($employee);
        $results = [];

        foreach ($devices as $device) {
            $results[$device->serial_number] = $this->syncFaceToDevice(
                $employee, $device, $template, $size
            );
        }
        return $results;
    }

    /**
     * Sync face template for an employee to a specific device.
     */
    public function syncFaceToDevice(Employee $employee, Device $device, string $template, int $size): bool
    {
        try {
            $command = $this->commandService->sendFace(
                $device,
                $employee->employee_id,
                $template,
                $size
            );

            BiometricTemplate::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'device_sn'   => $device->serial_number,
                    'type'        => 'face',
                    'finger_id'   => 0,
                ],
                [
                    'template_size' => $size,
                    'template_data' => $template,
                    'is_valid'      => true,
                ]
            );

            Log::info('✅ Face sync queued', [
                'employee_id' => $employee->employee_id,
                'device'      => $device->serial_number,
                'command_id'  => $command->id,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('❌ Failed to sync face to device', [
                'employee_id' => $employee->employee_id,
                'device'      => $device->serial_number,
                'error'       => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get all approved devices the employee should be present on.
     */
    public function getDevicesForEmployee(Employee $employee): array
    {
        $areas = $employee->biometric_areas ?? [];
        if ($employee->area && ! in_array($employee->area, $areas)) {
            $areas[] = $employee->area;
        }

        if (empty($areas)) {
            return [];
        }

        return Device::where('approved', true)
            ->where(function ($query) use ($areas) {
                foreach ($areas as $area) {
                    $query->orWhere('area', $area);
                }
            })
            ->get()
            ->all();
    }

    /**
     * Check if employee exists on device.
     */
    public function employeeExistsOnDevice(Employee $employee, Device $device): bool
    {
        return $employee->source_device_sn === $device->serial_number ||
        in_array($device->area, $employee->biometric_areas ?? []);
    }

    /**
     * Get local sync status for an employee.
     */
    public function getEmployeeSyncStatus(Employee $employee): array
    {
        $devices = $this->getDevicesForEmployee($employee);
        $status  = [];

        foreach ($devices as $device) {
            $status[$device->serial_number] = [
                'device_name'  => $device->name,
                'device_area'  => $device->area,
                'synced'       => $this->employeeExistsOnDevice($employee, $device),
                'last_command' => $this->getLastSyncCommand($employee, $device),
            ];
        }

        return $status;
    }

    /**
     * Get the most recently queued command for this employee and device.
     */
    private function getLastSyncCommand(Employee $employee, Device $device): ?array
    {
        $command = \App\Models\DeviceCommand::where('device_sn', $device->serial_number)
            ->where('command', 'SET_USER')
            ->where('params', 'LIKE', "%PIN={$employee->employee_id}%")
            ->orderByDesc('created_at')
            ->first();

        if (! $command) {
            return null;
        }

        return [
            'id'           => $command->id,
            'status'       => $command->status,
            'sent_at'      => $command->sent_at?->toDateTimeString(),
            'completed_at' => $command->completed_at?->toDateTimeString(),
        ];
    }

    /**
     * Sanitize name for device transmission.
     */
    private function sanitizeName(string $name): string
    {
        $name = preg_replace('/[^\x20-\x7E]/', '', $name);
        return substr(trim($name), 0, 30);
    }
}
