<?php
// app/Models/EmployeeSalaryHistory.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeSalaryHistory extends Model
{
    protected $fillable = [
        'employee_id',
        'old_basic_salary',
        'new_basic_salary',
        'change_amount',
        'change_percentage',
        'change_type',
        'reason',
        'effective_date',
        'changed_by',
    ];

    protected $casts = [
        'old_basic_salary' => 'decimal:2',
        'new_basic_salary' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'change_percentage' => 'decimal:2',
        'effective_date' => 'date',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'employee_id');
    }

    public function changer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by');
    }
}