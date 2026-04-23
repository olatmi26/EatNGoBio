<?php
// app/Models/SalaryStructure.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalaryStructure extends Model
{
    protected $fillable = [
        'name', 'code', 'description', 
        'basic_salary_min', 'basic_salary_max', 'is_active'
    ];

    protected $casts = [
        'basic_salary_min' => 'decimal:2',
        'basic_salary_max' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function components(): HasMany
    {
        return $this->hasMany(SalaryStructureComponent::class);
    }

    public function employeeCompensations(): HasMany
    {
        return $this->hasMany(EmployeeCompensation::class);
    }
}