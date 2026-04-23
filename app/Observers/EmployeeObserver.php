<?php
namespace App\Observers;

use App\Models\Employee;
use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Services\EmployeeSyncService;

class EmployeeObserver
{
    public function __construct(
        private EmployeeSyncService $syncService
    ) {}

    /**
     * Handle the Employee "created" event.
     */
    public function created(Employee $employee): void
    {
        // Auto-sync newly created employee to relevant devices
        if ($employee->active) {
            $this->syncService->syncEmployeeToDevices($employee);
        }
    }

    /**
     * Handle the Employee "updated" event.
     */
    public function updated(Employee $employee): void
    {
        // Re-sync if critical fields changed
        $criticalChanges = ['first_name', 'last_name', 'card', 'area', 'biometric_areas', 'active'];

        if ($employee->wasChanged($criticalChanges)) {
            if ($employee->active) {
                $this->syncService->syncEmployeeToDevices($employee);
            } else {
                // If deactivated, remove from devices
                $this->syncService->deleteEmployeeFromDevices($employee);
            }
        }
    }

    /**
     * Handle the Employee "deleted" event.
     */
    public function deleted(Employee $employee): void
    {
        // Remove employee from all devices
        $this->syncService->deleteEmployeeFromDevices($employee);
    }

    /**
     * Handle the Employee "restored" event.
     */
    public function restored(Employee $employee): void
    {
        if ($employee->active) {
            $this->syncService->syncEmployeeToDevices($employee);
        }
    }

    /**
     * Auto-assign employee to all shifts that cover their area.
     */
    private function autoAssignToShifts(Employee $employee): void
    {
        if (! $employee->active || ! $employee->area) {
            return;
        }

        // Find all active shifts that include this employee's area
        $shifts = Shift::where('active', true)
            ->whereJsonContains('locations', $employee->area)
            ->get();

        $today = now()->toDateString();

        foreach ($shifts as $shift) {
            // Check if already assigned (active assignment)
            $existing = ShiftAssignment::where('employee_id', $employee->id)
                ->where('shift_id', $shift->id)
                ->where(function ($q) use ($today) {
                    $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
                })
                ->exists();

            if (! $existing) {
                ShiftAssignment::create([
                    'employee_id'    => $employee->id,
                    'shift_id'       => $shift->id,
                    'location'       => $employee->area,
                    'effective_date' => $today,
                    'end_date'       => null,
                ]);
            }
        }

        // Update employee_count for affected shifts
        foreach ($shifts as $shift) {
            $shift->update([
                'employee_count' => ShiftAssignment::where('shift_id', $shift->id)
                    ->where(function ($q) {
                        $q->whereNull('end_date')->orWhere('end_date', '>=', today());
                    })
                    ->distinct('employee_id')
                    ->count('employee_id'),
            ]);
        }
    }
}
