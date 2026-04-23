<?php
// app/Services/PayrollGenerationService.php

namespace App\Services;

use App\Models\Employee;
use App\Models\Payroll;
use Carbon\Carbon;

class PayrollGenerationService
{
    public function __construct(
        private AttendanceService $attendanceService,
        private PayrollCalculator $calculator
    ) {}

    /**
     * Generate payroll for a period
     */
    public function generatePayroll(Carbon $startDate, Carbon $endDate, array $filters = []): array
    {
        // Get employees with active compensation
        $query = Employee::with(['activeCompensation', 'activeCompensation.components.salaryComponent'])
            ->where('active', true)
            ->where('employee_status', 'active');

        if (! empty($filters['department'])) {
            $query->where('department', $filters['department']);
        }
        if (! empty($filters['location'])) {
            $query->where('area', $filters['location']);
        }

        $employees = $query->get();

        // Get attendance data for the period
        $attendanceReport = $this->attendanceService->payrollReport($startDate, $endDate, $filters);

        // Index attendance by employee ID
        $attendanceIndex = [];
        foreach ($attendanceReport as $row) {
            $attendanceIndex[$row['employeeId']] = $row;
        }

        $workDays    = $startDate->diffInDaysFiltered(fn($d) => ! $d->isWeekend(), $endDate) + 1;
        $payrollData = [];

        foreach ($employees as $employee) {
            $compensation = $employee->activeCompensation;

            if (! $compensation || ! $compensation->basic_salary) {
                continue;
            }

            $attendance = $attendanceIndex[$employee->employee_id] ?? [
                'presentDays'   => 0,
                'absentDays'    => $workDays,
                'lateMinutes'   => 0,
                'overtimeHours' => 0,
            ];

            // Calculate base payroll
            $calculation = $this->calculator->calculatePayroll(
                basicSalary: $compensation->basic_salary,
                daysWorked: $attendance['presentDays'] ?? 0,
                daysAbsent: $attendance['absentDays'] ?? 0,
                lateMinutes: $attendance['lateMinutes'] ?? 0,
                overtimeHoursNormal: $attendance['overtimeHours'] ?? 0,
                workDays: $workDays
            );

            // Add custom allowances and deductions
            $allowances = $compensation->components()
                ->whereHas('salaryComponent', fn($q) => $q->where('type', 'allowance'))
                ->where('is_active', true)
                ->get();

            $deductions = $compensation->components()
                ->whereHas('salaryComponent', fn($q) => $q->where('type', 'deduction'))
                ->where('is_active', true)
                ->get();

            $totalAllowances = 0;
            $allowancesData  = [];
            foreach ($allowances as $allowance) {
                $amount  = $allowance->calculation_type === 'percentage'
                    ? $compensation->basic_salary * ($allowance->value / 100)
                    : $allowance->value;
                $totalAllowances  += $amount;
                $allowancesData[]  = [
                    'name'   => $allowance->salaryComponent->name,
                    'amount' => round($amount, 2),
                ];
            }

            $totalCustomDeductions = 0;
            $deductionsData        = [];
            foreach ($deductions as $deduction) {
                $amount  = $deduction->calculation_type === 'percentage'
                    ? $compensation->basic_salary * ($deduction->value / 100)
                    : $deduction->value;
                $totalCustomDeductions += $amount;
                $deductionsData[]       = [
                    'name'   => $deduction->salaryComponent->name,
                    'amount' => round($amount, 2),
                ];
            }

            // Adjust gross and net pay
            $grossPay        = $calculation['gross_pay'] + $totalAllowances;
            $totalDeductions = $calculation['total_deductions'] + $totalCustomDeductions;
            $netPay          = $grossPay - $totalDeductions;

            $payrollData[] = [
                'employee_id'           => $employee->employee_id,
                'employee_name'         => $employee->full_name,
                'department'            => $employee->department,
                'basic_salary'          => $compensation->basic_salary,
                'allowances'            => $allowancesData,
                'deductions'            => $deductionsData,
                'days_worked'           => $calculation['days_worked'],
                'days_absent'           => $calculation['days_absent'],
                'late_minutes'          => $calculation['late_minutes'],
                'overtime_hours_normal' => $calculation['overtime_hours_normal'],
                'overtime_pay'          => $calculation['overtime_pay'],
                'late_deduction'        => $calculation['late_deduction'],
                'absent_deduction'      => $calculation['absent_deduction'],
                'tax_deduction'         => $calculation['tax_deduction'],
                'pension_deduction'     => $calculation['pension_deduction'],
                'nhf_deduction'         => $calculation['nhf_deduction'],
                'gross_pay'             => round($grossPay, 2),
                'net_pay'               => round($netPay, 2),
                'total_deductions'      => round($totalDeductions, 2),
            ];
        }

        return $payrollData;
    }
}
