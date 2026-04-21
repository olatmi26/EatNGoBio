<?php

namespace App\Observers;

use App\Models\Employee;
use App\Models\Shift;
use App\Models\ShiftAssignment;

class EmployeeObserver
{
    /**
     * Handle the Employee "created" event.
     */
    public function created(Employee $employee): void
    {
        $this->autoAssignToShifts($employee);
    }

    /**
     * Handle the Employee "updated" event.
     */
    public function updated(Employee $employee): void
    {
        // If area changed, reassign
        if ($employee->isDirty('area')) {
            $this->autoAssignToShifts($employee);
        }
    }

    /**
     * Auto-assign employee to all shifts that cover their area.
     */
    private function autoAssignToShifts(Employee $employee): void
    {
        if (!$employee->active || !$employee->area) {
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

            if (!$existing) {
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