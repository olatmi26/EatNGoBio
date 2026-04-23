<?php
namespace App\Services;

use App\Models\Employee;
use App\Models\Payroll;
use App\Models\PayrollPeriod;
use Carbon\Carbon;

class PayrollService
{
    private PayrollCalculator $calculator;

    public function __construct(
        private AttendanceService $attendanceService
    ) {$this->calculator = new PayrollCalculator();}

    /**
     * Generate payroll for a period
     */
    public function generatePayroll(Carbon $startDate, Carbon $endDate, array $filters = []): array
    {
        // Get attendance data
        $attendanceReport = $this->attendanceService->payrollReport($startDate, $endDate, $filters);

        // Calculate work days in period
        $workDays = $startDate->diffInDaysFiltered(fn($d) => ! $d->isWeekend(), $endDate) + 1;

        $payrollData = [];
        foreach ($attendanceReport as $row) {
            $employee = Employee::where('employee_id', $row['employeeId'])->first();

            if (! $employee || ! $employee->basic_salary) {
                continue;
            }

            // Use the calculator for all payroll calculations
            $calculation = $this->calculator->calculatePayroll(
                basicSalary: $row['basicSalary'],
                daysWorked: $row['presentDays'],
                daysAbsent: $row['absentDays'],
                lateMinutes: $row['lateMinutes'],
                overtimeHoursNormal: $row['overtimeHours'] ?? 0,
                overtimeHoursWeekend: 0, // You can add weekend overtime tracking
                overtimeHoursHoliday: 0, // You can add holiday overtime tracking
                workDays: $workDays
            );

            $payrollData[] = array_merge([
                'employee_id'   => $row['employeeId'],
                'employee_name' => $row['employeeName'],
                'department'    => $row['department'],
                'shift'         => $row['shift'] ?? null,
            ], $calculation);
        }

        return $payrollData;
    }

     /**
     * Get current calculator settings
     */
    public function getCalculatorSettings(): array
    {
        return $this->calculator->getSettings();
    }

     /**
     * Refresh calculator settings (call after settings update)
     */
    public function refreshSettings(): void
    {
        $this->calculator->refreshSettings();
    }

    private function calculateTax(float $annualIncome): float
    {
        // Simplified Nigerian PAYE tax calculation
        // You can implement the proper tax brackets
        if ($annualIncome <= 300000) {
            return $annualIncome * 0.07;
        } elseif ($annualIncome <= 600000) {
            return 21000 + ($annualIncome - 300000) * 0.11;
        } elseif ($annualIncome <= 1100000) {
            return 54000 + ($annualIncome - 600000) * 0.15;
        } elseif ($annualIncome <= 1600000) {
            return 129000 + ($annualIncome - 1100000) * 0.19;
        } elseif ($annualIncome <= 3200000) {
            return 224000 + ($annualIncome - 1600000) * 0.21;
        } else {
            return 560000 + ($annualIncome - 3200000) * 0.24;
        }
    }

    public function getPayrollSummary(): array
    {
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth    = Carbon::now()->subMonth()->startOfMonth();

        $currentPeriod = PayrollPeriod::where('start_date', $currentMonth)->first();
        $lastPeriod    = PayrollPeriod::where('start_date', $lastMonth)->first();

        $totalEmployees      = Employee::where('active', true)->count();
        $totalMonthlyPayroll = $currentPeriod ? $currentPeriod->total_net_pay : 0;
        $avgSalary           = $totalEmployees > 0 ? $totalMonthlyPayroll / $totalEmployees : 0;

        // Pending approvals
        $pendingPayrolls = Payroll::where('status', 'draft')->count();

        // Year to date
        $ytdStart   = Carbon::now()->startOfYear();
        $ytdPayroll = PayrollPeriod::whereBetween('start_date', [$ytdStart, Carbon::now()])
            ->sum('total_net_pay');

        return [
            'total_employees'   => $totalEmployees,
            'monthly_payroll'   => $totalMonthlyPayroll,
            'average_salary'    => $avgSalary,
            'pending_approvals' => $pendingPayrolls,
            'ytd_payroll'       => $ytdPayroll,
            'current_period'    => $currentPeriod,
            'last_period'       => $lastPeriod,
        ];
    }

    public function getPayrollTrend(): array
    {
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date   = Carbon::now()->subMonths($i)->startOfMonth();
            $period = PayrollPeriod::where('start_date', $date)->first();

            $months[] = [
                'month'          => $date->format('M Y'),
                'total_payroll'  => $period ? $period->total_net_pay : 0,
                'employee_count' => $period ? $period->total_employees : 0,
                'avg_salary'     => $period && $period->total_employees > 0
                    ? $period->total_net_pay / $period->total_employees
                    : 0,
            ];
        }

        return $months;
    }

    public function getDepartmentPayrollSummary(): array
    {
        $currentPeriod = PayrollPeriod::where('status', 'approved')
            ->latest('start_date')
            ->first();

        if (! $currentPeriod) {
            return [];
        }

        $payrolls = Payroll::with('employee')
            ->where('payroll_period_id', $currentPeriod->id)
            ->get();

        $deptSummary = [];
        foreach ($payrolls as $payroll) {
            $dept = $payroll->employee->department ?? 'Unknown';
            if (! isset($deptSummary[$dept])) {
                $deptSummary[$dept] = [
                    'department'       => $dept,
                    'employee_count'   => 0,
                    'total_basic'      => 0,
                    'total_allowances' => 0,
                    'total_deductions' => 0,
                    'total_net_pay'    => 0,
                ];
            }

            $deptSummary[$dept]['employee_count']++;
            $deptSummary[$dept]['total_basic']   += $payroll->basic_salary;
            $deptSummary[$dept]['total_net_pay'] += $payroll->net_pay;
        }

        return array_values($deptSummary);
    }
}
