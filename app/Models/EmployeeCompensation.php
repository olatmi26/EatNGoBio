<?php
// app/Models/EmployeeCompensation.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmployeeCompensation extends Model
{
    protected $fillable = [
        'employee_id', 'salary_structure_id', 'basic_salary',
        'effective_date', 'end_date', 'status', 'remarks',
        'approved_by', 'approved_at'
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'effective_date' => 'date',
        'end_date' => 'date',
        'approved_at' => 'datetime',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function salaryStructure(): BelongsTo
    {
        return $this->belongsTo(SalaryStructure::class);
    }

    public function components(): HasMany
    {
        return $this->hasMany(EmployeeSalaryComponent::class);
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function getTotalAllowancesAttribute(): float
    {
        return $this->components()
            ->whereHas('salaryComponent', fn($q) => $q->where('type', 'allowance'))
            ->where('is_active', true)
            ->get()
            ->sum(function ($component) {
                return $component->calculation_type === 'percentage'
                    ? $this->basic_salary * ($component->value / 100)
                    : $component->value;
            });
    }

    public function getTotalDeductionsAttribute(): float
    {
        return $this->components()
            ->whereHas('salaryComponent', fn($q) => $q->where('type', 'deduction'))
            ->where('is_active', true)
            ->get()
            ->sum(function ($component) {
                return $component->calculation_type === 'percentage'
                    ? $this->basic_salary * ($component->value / 100)
                    : $component->value;
            });
    }

    public function getGrossSalaryAttribute(): float
    {
        return $this->basic_salary + $this->total_allowances;
    }

    public function getNetSalaryAttribute(): float
    {
        return $this->gross_salary - $this->total_deductions;
    }
}