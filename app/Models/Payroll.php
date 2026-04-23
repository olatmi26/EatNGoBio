<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payroll extends Model
{
    use HasFactory;

    protected $table = 'payrolls';

    protected $fillable = [
        'employee_id',
        'payroll_period_id',
        'basic_salary',
        'allowances',
        'deductions',
        'overtime_pay',
        'late_deduction',
        'absent_deduction',
        'tax_deduction',
        'pension_deduction',
        'nhf_deduction',
        'net_pay',
        'gross_pay',
        'days_worked',
        'days_absent',
        'late_minutes',
        'overtime_hours',
        'status', // draft, approved, paid
        'approved_by',
        'approved_at',
        'paid_at',
        'remarks',
    ];

    protected $casts = [
        'allowances'        => 'array',
        'deductions'        => 'array',
        'basic_salary'      => 'decimal:2',
        'overtime_pay'      => 'decimal:2',
        'late_deduction'    => 'decimal:2',
        'absent_deduction'  => 'decimal:2',
        'tax_deduction'     => 'decimal:2',
        'pension_deduction' => 'decimal:2',
        'nhf_deduction'     => 'decimal:2',
        'net_pay'           => 'decimal:2',
        'gross_pay'         => 'decimal:2',
        'approved_at'       => 'datetime',
        'paid_at'           => 'datetime',
    ];

    protected $attributes = [
        'basic_salary'      => 0,
        'overtime_pay'      => 0,
        'late_deduction'    => 0,
        'absent_deduction'  => 0,
        'tax_deduction'     => 0,
        'pension_deduction' => 0,
        'nhf_deduction'     => 0,
        'net_pay'           => 0,
        'gross_pay'         => 0,
        'status'            => 'draft',
    ];

    // Status Constants
    public const STATUS_DRAFT    = 'draft';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_PAID     = 'paid';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT    => 'Draft',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_PAID     => 'Paid',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class, 'payroll_period_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Accessors
    public function getAllowancesTotalAttribute(): float
    {
        return empty($this->allowances) ? 0.0 : collect($this->allowances)->sum('amount');
    }

    public function getDeductionsTotalAttribute(): float
    {
        return empty($this->deductions) ? 0.0 : collect($this->deductions)->sum('amount');
    }

    public function getTotalDeductionsAttribute(): float
    {
        return (float)($this->late_deduction +
            $this->absent_deduction +
            $this->tax_deduction +
            $this->pension_deduction +
            $this->nhf_deduction +
            $this->getDeductionsTotalAttribute());
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    public function scopeByPeriod($query, $periodId)
    {
        return $query->where('payroll_period_id', $periodId);
    }

    public function scopeByEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    // Helper Methods
    public function calculateGrossPay(): float
    {
        return (float)($this->basic_salary + $this->overtime_pay + $this->getAllowancesTotalAttribute());
    }

    public function calculateNetPay(): float
    {
        return (float)($this->gross_pay - $this->getTotalDeductionsAttribute());
    }

    public function recalculate(): void
    {
        // Use string conversion to ensure MySQL decimal? columns don't get assigned float directly
        $this->gross_pay = number_format($this->calculateGrossPay(), 2, '.', '');
        $this->net_pay   = number_format($this->calculateNetPay(), 2, '.', '');
        $this->saveQuietly();
    }

    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function canBePaid(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function approve(User $approver, ?string $remarks = null): void
    {
        if (! $this->canBeApproved()) {
            throw new \Exception('Payroll cannot be approved in current status: ' . $this->status);
        }

        $this->update([
            'status'      => self::STATUS_APPROVED,
            'approved_by' => $approver->id,
            'approved_at' => now(),
            'remarks'     => $remarks ?? $this->remarks,
        ]);
    }

    public function markAsPaid(?string $remarks = null): void
    {
        if (! $this->canBePaid()) {
            throw new \Exception('Payroll cannot be marked as paid in current status: ' . $this->status);
        }

        $this->update([
            'status'  => self::STATUS_PAID,
            'paid_at' => now(),
            'remarks' => $remarks ?? $this->remarks,
        ]);
    }

    public function addAllowance(string $name, float $amount, ?string $description = null): void
    {
        $allowances = $this->allowances ?? [];
        $allowances[] = [
            'name'        => $name,
            'amount'      => $amount,
            'description' => $description,
            'created_at'  => now()->toISOString(),
        ];

        $this->allowances = $allowances;
        $this->recalculate();
        $this->save();
    }

    public function addDeduction(string $name, float $amount, ?string $description = null): void
    {
        $deductions = $this->deductions ?? [];
        $deductions[] = [
            'name'        => $name,
            'amount'      => $amount,
            'description' => $description,
            'created_at'  => now()->toISOString(),
        ];

        $this->deductions = $deductions;
        $this->recalculate();
        $this->save();
    }

    /**
     * Helper to get config values from config/payrollsetting.php using dot notation.
     */
    private static function payrollSetting(string $key, $default = null)
    {
        return config('payrollsetting.' . $key, $default);
    }

    public function getHourlyRate(): float
    {
        $workDaysPerMonth = self::payrollSetting('work_days_per_month', 22);
        $workHoursPerDay  = self::payrollSetting('work_hours_per_day', 8);

        $monthlyHours = $workDaysPerMonth * $workHoursPerDay;

        return $monthlyHours > 0 ? $this->basic_salary / $monthlyHours : 0;
    }

    public function calculateOvertimePay(float $hours, string $type = 'normal'): float
    {
        $hourlyRate = $this->getHourlyRate();

        $multipliers = [
            'weekend' => self::payrollSetting('weekend.multiplier', 2.0),
            'holiday' => self::payrollSetting('holiday.multiplier', 2.5),
            'normal'  => self::payrollSetting('overtime.multiplier', 1.5),
        ];

        $multiplier = $multipliers[$type] ?? $multipliers['normal'];

        return $hourlyRate * $hours * $multiplier;
    }

    public function calculatePensionDeduction(): float
    {
        if (!self::payrollSetting('pension.enabled', true)) {
            return 0;
        }

        $rate             = self::payrollSetting('pension.employee_rate', 8);
        $minimumThreshold = self::payrollSetting('pension.minimum_threshold', 0);

        if ($this->basic_salary < $minimumThreshold) {
            return 0;
        }

        return $this->basic_salary * ($rate / 100);
    }

    public function calculateNhfDeduction(): float
    {
        if (!self::payrollSetting('nhf.enabled', true)) {
            return 0;
        }

        $rate             = self::payrollSetting('nhf.employee_rate', 2.5);
        $minimumThreshold = self::payrollSetting('nhf.minimum_threshold', 3000);

        if ($this->basic_salary < $minimumThreshold) {
            return 0;
        }

        return $this->basic_salary * ($rate / 100);
    }
}
