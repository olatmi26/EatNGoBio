<?php
// app/Http/Controllers/EmployeeCompensationController.php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeCompensation;
use App\Models\EmployeeSalaryHistory;
use App\Models\SalaryStructure;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\EmployeeCompensationExport;
use App\Imports\EmployeeCompensationImport;

class EmployeeCompensationController extends Controller
{
    public function __construct(
        private NotificationService $notifs
    ) {}

    /**
     * Download import template
     */
    public function downloadTemplate()
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="salary_import_template.csv"',
            'Cache-Control' => 'no-cache',
        ];

        $columns = [
            'Employee ID',
            'Basic Salary (₦)',
            'Effective Date (YYYY-MM-DD)',
            'Salary Structure Code',
            'Allowances (JSON)',
            'Deductions (JSON)',
            'Status',
            'Remarks',
        ];

        $sampleData = [
            ['EMP001', '50000', date('Y-m-d'), 'GL01', '[{"name":"Housing","amount":10000},{"name":"Transport","amount":5000}]', '[{"name":"Loan","amount":2000}]', 'active', 'Initial salary'],
            ['EMP002', '75000', date('Y-m-d'), 'GL02', '[{"name":"Housing","amount":15000}]', '[]', 'active', ''],
            ['EMP003', '100000', date('Y-m-d'), 'GL03', '[]', '[]', 'active', 'Promotion increment'],
        ];

        $callback = function() use ($columns, $sampleData) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $columns);
            foreach ($sampleData as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Import employee compensations from Excel/CSV
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv|max:10240',
        ]);

        try {
            Excel::import(new EmployeeCompensationImport, $request->file('file'));
            
            return back()->with('success', 'Employee compensation data imported successfully.');
        } catch (\Exception $e) {
            return back()->with('error', 'Import failed: ' . $e->getMessage());
        }
    }

    /**
     * Export employee compensations to Excel
     */
    public function export(Request $request)
    {
        $filters = $request->only(['department', 'status', 'search']);
        
        return Excel::download(
            new EmployeeCompensationExport($filters),
            'employee_compensations_' . date('Y-m-d_His') . '.xlsx'
        );
    }

    /**
     * Bulk update employee salaries
     */
    public function bulkUpdate(Request $request)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,employee_id',
            'increase_type' => 'required|in:percentage,fixed',
            'increase_value' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'reason' => 'nullable|string|max:500',
        ]);

        $updated = 0;
        $skipped = 0;

        foreach ($validated['employee_ids'] as $employeeId) {
            $employee = Employee::where('employee_id', $employeeId)->first();
            if (!$employee) {
                $skipped++;
                continue;
            }

            // Get current active compensation
            $currentComp = EmployeeCompensation::where('employee_id', $employeeId)
                ->where('status', 'active')
                ->first();

            $oldSalary = $currentComp ? $currentComp->basic_salary : 0;
            
            // Calculate new salary
            $newSalary = $validated['increase_type'] === 'percentage'
                ? $oldSalary * (1 + $validated['increase_value'] / 100)
                : $oldSalary + $validated['increase_value'];

            $newSalary = round($newSalary, 2);

            if ($newSalary <= 0) {
                $skipped++;
                continue;
            }

            // Deactivate old compensation if exists
            if ($currentComp) {
                $currentComp->update([
                    'status' => 'inactive',
                    'end_date' => now()->subDay(),
                ]);
            }

            // Create new compensation record
            $compensation = EmployeeCompensation::create([
                'employee_id' => $employeeId,
                'salary_structure_id' => $currentComp?->salary_structure_id,
                'basic_salary' => $newSalary,
                'effective_date' => $validated['effective_date'],
                'status' => 'active',
                'remarks' => $validated['reason'] ?? 'Bulk salary update',
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            // Log salary history
            EmployeeSalaryHistory::create([
                'employee_id' => $employeeId,
                'old_basic_salary' => $oldSalary,
                'new_basic_salary' => $newSalary,
                'change_amount' => $newSalary - $oldSalary,
                'change_percentage' => $oldSalary > 0 ? round((($newSalary - $oldSalary) / $oldSalary) * 100, 2) : 100,
                'change_type' => $validated['increase_type'] === 'percentage' ? 'increment' : 'adjustment',
                'reason' => $validated['reason'] ?? 'Bulk salary update',
                'effective_date' => $validated['effective_date'],
                'changed_by' => auth()->id(),
            ]);

            $updated++;
        }

        return back()->with('success', "Updated {$updated} employees. " . ($skipped > 0 ? "Skipped {$skipped}." : ""));
    }

    /**
     * Update single employee compensation
     */
    public function update(Request $request, EmployeeCompensation $compensation)
    {
        $validated = $request->validate([
            'basic_salary' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
            'status' => 'required|in:active,inactive,pending',
            'remarks' => 'nullable|string|max:500',
        ]);

        $oldSalary = $compensation->basic_salary;
        $newSalary = $validated['basic_salary'];

        $compensation->update($validated);

        // Log salary history if salary changed
        if ($oldSalary != $newSalary) {
            EmployeeSalaryHistory::create([
                'employee_id' => $compensation->employee_id,
                'old_basic_salary' => $oldSalary,
                'new_basic_salary' => $newSalary,
                'change_amount' => $newSalary - $oldSalary,
                'change_percentage' => $oldSalary > 0 ? round((($newSalary - $oldSalary) / $oldSalary) * 100, 2) : 100,
                'change_type' => 'adjustment',
                'reason' => $validated['remarks'] ?? 'Manual adjustment',
                'effective_date' => $validated['effective_date'],
                'changed_by' => auth()->id(),
            ]);
        }

        return back()->with('success', 'Employee compensation updated successfully.');
    }

    /**
     * Delete employee compensation
     */
    public function destroy(EmployeeCompensation $compensation)
    {
        $compensation->delete();
        return back()->with('success', 'Compensation record deleted.');
    }

    /**
     * Get employee salary history
     */
    public function history(Request $request)
    {
        $employeeId = $request->input('employee_id');
        
        $history = EmployeeSalaryHistory::with('changer')
            ->where('employee_id', $employeeId)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json($history);
    }
}