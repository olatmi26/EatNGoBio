<?php
// app/Imports/EmployeeCompensationImport.php

namespace App\Imports;

use App\Models\Employee;
use App\Models\EmployeeCompensation;
use App\Models\SalaryStructure;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Carbon\Carbon;

class EmployeeCompensationImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        // Find employee
        $employee = Employee::where('employee_id', $row['employee_id'])->first();
        if (!$employee) {
            return null;
        }

        // Find salary structure if provided
        $structureId = null;
        if (!empty($row['salary_structure_code'])) {
            $structure = SalaryStructure::where('code', $row['salary_structure_code'])->first();
            $structureId = $structure?->id;
        }

        // Deactivate existing active compensation
        EmployeeCompensation::where('employee_id', $row['employee_id'])
            ->where('status', 'active')
            ->update(['status' => 'inactive', 'end_date' => now()->subDay()]);

        $compensation = new EmployeeCompensation([
            'employee_id' => $row['employee_id'],
            'salary_structure_id' => $structureId,
            'basic_salary' => $row['basic_salary'],
            'effective_date' => $row['effective_date'] ?? now()->format('Y-m-d'),
            'status' => $row['status'] ?? 'active',
            'remarks' => $row['remarks'] ?? 'Imported via Excel',
        ]);

        return $compensation;
    }

    public function rules(): array
    {
        return [
            'employee_id' => 'required|exists:employees,employee_id',
            'basic_salary' => 'required|numeric|min:0',
            'effective_date' => 'nullable|date',
            'status' => 'nullable|in:active,inactive,pending',
        ];
    }

    public function customValidationMessages()
    {
        return [
            'employee_id.required' => 'Employee ID is required',
            'employee_id.exists' => 'Employee not found in system',
            'basic_salary.required' => 'Basic salary is required',
            'basic_salary.numeric' => 'Basic salary must be a number',
        ];
    }
}