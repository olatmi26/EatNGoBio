<?php

namespace App\Services;
use App\Models\PayrollSetting;

class PayrollCalculator
{
    private array $taxBrackets;
    private float $consolidatedRelief;
    private float $pensionEmployeeRate;
    private float $pensionEmployerRate;
    private float $nhfRate;
    private float $workDaysPerMonth;
    private float $workHoursPerDay;
    private float $overtimeMultiplier;
    private float $weekendMultiplier;
    private float $holidayMultiplier;
    private bool $taxEnabled;
    private bool $pensionEnabled;
    private bool $nhfEnabled;

    public function __construct()
    {
        $this->loadSettings();
    }

    /**
     * Load all payroll settings from database
     */
    private function loadSettings(): void
    {
        // Tax Settings
        $this->taxEnabled = PayrollSetting::getBool('tax.enabled', true);
        $this->taxBrackets = PayrollSetting::getArray('tax.brackets', [
            ['min' => 0, 'max' => 300000, 'rate' => 7],
            ['min' => 300001, 'max' => 600000, 'rate' => 11],
            ['min' => 600001, 'max' => 1100000, 'rate' => 15],
            ['min' => 1100001, 'max' => 1600000, 'rate' => 19],
            ['min' => 1600001, 'max' => 3200000, 'rate' => 21],
            ['min' => 3200001, 'max' => null, 'rate' => 24],
        ]);
        $this->consolidatedRelief = PayrollSetting::getFloat('tax.consolidated_relief', 200000);

        // Pension Settings
        $this->pensionEnabled = PayrollSetting::getBool('pension.enabled', true);
        $this->pensionEmployeeRate = PayrollSetting::getFloat('pension.employee_rate', 8);
        $this->pensionEmployerRate = PayrollSetting::getFloat('pension.employer_rate', 10);

        // NHF Settings
        $this->nhfEnabled = PayrollSetting::getBool('nhf.enabled', true);
        $this->nhfRate = PayrollSetting::getFloat('nhf.rate', 2.5);

        // General Payroll Settings
        $this->workDaysPerMonth = PayrollSetting::getFloat('payroll.work_days_per_month', 22);
        $this->workHoursPerDay = PayrollSetting::getFloat('payroll.work_hours_per_day', 8);
        $this->overtimeMultiplier = PayrollSetting::getFloat('payroll.overtime.multiplier', 1.5);
        $this->weekendMultiplier = PayrollSetting::getFloat('payroll.weekend.multiplier', 2.0);
        $this->holidayMultiplier = PayrollSetting::getFloat('payroll.holiday.multiplier', 2.5);
    }

    /**
     * Refresh settings (call this after settings are updated)
     */
    public function refreshSettings(): void
    {
        $this->loadSettings();
    }

    /**
     * Calculate tax based on annual income (PAYE)
     */
    public function calculateTax(float $annualBasic): float
    {
        if (!$this->taxEnabled) {
            return 0;
        }

        // Apply consolidated relief
        $taxableIncome = max(0, $annualBasic - $this->consolidatedRelief);

        $annualTax = 0;
        $remainingIncome = $taxableIncome;

        foreach ($this->taxBrackets as $bracket) {
            $min = $bracket['min'];
            $max = $bracket['max'] ?? PHP_FLOAT_MAX;
            $rate = $bracket['rate'] / 100;

            if ($remainingIncome <= 0) {
                break;
            }

            $bracketAmount = min($remainingIncome, $max - $min + 1);
            $annualTax += $bracketAmount * $rate;
            $remainingIncome -= $bracketAmount;
        }

        return round($annualTax, 2);
    }

    /**
     * Calculate monthly tax from annual tax
     */
    public function calculateMonthlyTax(float $annualBasic): float
    {
        return round($this->calculateTax($annualBasic) / 12, 2);
    }

    /**
     * Calculate pension contribution (employee portion)
     */
    public function calculatePensionEmployee(float $basicSalary): float
    {
        if (!$this->pensionEnabled) {
            return 0;
        }

        $minimumThreshold = PayrollSetting::getFloat('pension.minimum_threshold', 0);
        
        if ($basicSalary < $minimumThreshold) {
            return 0;
        }

        return round($basicSalary * ($this->pensionEmployeeRate / 100), 2);
    }

    /**
     * Calculate pension contribution (employer portion)
     */
    public function calculatePensionEmployer(float $basicSalary): float
    {
        if (!$this->pensionEnabled) {
            return 0;
        }

        return round($basicSalary * ($this->pensionEmployerRate / 100), 2);
    }

    /**
     * Calculate NHF contribution
     */
    public function calculateNHF(float $basicSalary): float
    {
        if (!$this->nhfEnabled) {
            return 0;
        }

        $minimumThreshold = PayrollSetting::getFloat('nhf.minimum_threshold', 3000);
        
        if ($basicSalary < $minimumThreshold) {
            return 0;
        }

        return round($basicSalary * ($this->nhfRate / 100), 2);
    }

    /**
     * Calculate NSITF contribution (employer only)
     */
    public function calculateNSITF(float $basicSalary): float
    {
        if (!PayrollSetting::getBool('deductions.nsitf.enabled', true)) {
            return 0;
        }

        $rate = PayrollSetting::getFloat('deductions.nsitf.rate', 1);
        return round($basicSalary * ($rate / 100), 2);
    }

    /**
     * Calculate daily rate
     */
    public function calculateDailyRate(float $basicSalary, ?int $workDays = null): float
    {
        $days = $workDays ?? $this->workDaysPerMonth;
        return $days > 0 ? round($basicSalary / $days, 2) : 0;
    }

    /**
     * Calculate hourly rate
     */
    public function calculateHourlyRate(float $basicSalary, ?int $workDays = null): float
    {
        $dailyRate = $this->calculateDailyRate($basicSalary, $workDays);
        return $this->workHoursPerDay > 0 ? round($dailyRate / $this->workHoursPerDay, 2) : 0;
    }

    /**
     * Calculate overtime pay
     */
    public function calculateOvertimePay(float $hourlyRate, float $hours, string $type = 'normal'): float
    {
        $multiplier = match ($type) {
            'weekend' => $this->weekendMultiplier,
            'holiday' => $this->holidayMultiplier,
            default => $this->overtimeMultiplier,
        };

        return round($hourlyRate * $hours * $multiplier, 2);
    }

    /**
     * Calculate late deduction
     */
    public function calculateLateDeduction(float $hourlyRate, int $lateMinutes): float
    {
        return round(($hourlyRate / 60) * $lateMinutes, 2);
    }

    /**
     * Calculate absent deduction
     */
    public function calculateAbsentDeduction(float $dailyRate, int $absentDays): float
    {
        return round($dailyRate * $absentDays, 2);
    }

    /**
     * Get all current settings as array
     */
    public function getSettings(): array
    {
        return [
            'tax' => [
                'enabled' => $this->taxEnabled,
                'brackets' => $this->taxBrackets,
                'consolidated_relief' => $this->consolidatedRelief,
            ],
            'pension' => [
                'enabled' => $this->pensionEnabled,
                'employee_rate' => $this->pensionEmployeeRate,
                'employer_rate' => $this->pensionEmployerRate,
            ],
            'nhf' => [
                'enabled' => $this->nhfEnabled,
                'rate' => $this->nhfRate,
            ],
            'general' => [
                'work_days_per_month' => $this->workDaysPerMonth,
                'work_hours_per_day' => $this->workHoursPerDay,
                'overtime_multiplier' => $this->overtimeMultiplier,
                'weekend_multiplier' => $this->weekendMultiplier,
                'holiday_multiplier' => $this->holidayMultiplier,
            ],
        ];
    }

    /**
     * Calculate complete payroll for an employee
     */
    public function calculatePayroll(
        float $basicSalary,
        int $daysWorked,
        int $daysAbsent,
        int $lateMinutes,
        float $overtimeHoursNormal = 0,
        float $overtimeHoursWeekend = 0,
        float $overtimeHoursHoliday = 0,
        ?int $workDays = null
    ): array {
        $annualBasic = $basicSalary * 12;
        $dailyRate = $this->calculateDailyRate($basicSalary, $workDays);
        $hourlyRate = $this->calculateHourlyRate($basicSalary, $workDays);

        // Deductions
        $absentDeduction = $this->calculateAbsentDeduction($dailyRate, $daysAbsent);
        $lateDeduction = $this->calculateLateDeduction($hourlyRate, $lateMinutes);
        $taxDeduction = $this->calculateMonthlyTax($annualBasic);
        $pensionDeduction = $this->calculatePensionEmployee($basicSalary);
        $nhfDeduction = $this->calculateNHF($basicSalary);

        // Additions
        $overtimePay = $this->calculateOvertimePay($hourlyRate, $overtimeHoursNormal, 'normal')
            + $this->calculateOvertimePay($hourlyRate, $overtimeHoursWeekend, 'weekend')
            + $this->calculateOvertimePay($hourlyRate, $overtimeHoursHoliday, 'holiday');

        // Totals
        $grossPay = $basicSalary + $overtimePay - $absentDeduction - $lateDeduction;
        $totalDeductions = $taxDeduction + $pensionDeduction + $nhfDeduction;
        $netPay = $grossPay - $totalDeductions;

        // Employer contributions
        $pensionEmployer = $this->calculatePensionEmployer($basicSalary);
        $nsitf = $this->calculateNSITF($basicSalary);
        $totalEmployerCost = $basicSalary + $pensionEmployer + $nsitf + $overtimePay;

        return [
            'basic_salary' => round($basicSalary, 2),
            'daily_rate' => $dailyRate,
            'hourly_rate' => $hourlyRate,
            
            'days_worked' => $daysWorked,
            'days_absent' => $daysAbsent,
            'late_minutes' => $lateMinutes,
            
            'overtime_hours_normal' => $overtimeHoursNormal,
            'overtime_hours_weekend' => $overtimeHoursWeekend,
            'overtime_hours_holiday' => $overtimeHoursHoliday,
            'overtime_pay' => round($overtimePay, 2),
            
            'absent_deduction' => round($absentDeduction, 2),
            'late_deduction' => round($lateDeduction, 2),
            'tax_deduction' => round($taxDeduction, 2),
            'pension_deduction' => round($pensionDeduction, 2),
            'nhf_deduction' => round($nhfDeduction, 2),
            'total_deductions' => round($totalDeductions, 2),
            
            'gross_pay' => round($grossPay, 2),
            'net_pay' => round($netPay, 2),
            
            'pension_employer' => round($pensionEmployer, 2),
            'nsitf_employer' => round($nsitf, 2),
            'total_employer_cost' => round($totalEmployerCost, 2),
        ];
    }
}