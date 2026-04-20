<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Shift extends Model
{
    protected $fillable = [
        'name',
        'code',
        'start_time',
        'checkin_start_at',    
        'end_time',
        'checkout_ends_at',   
        'work_hours',
        'late_threshold',
        'overtime_threshold',
        'breaks',
        'locations',
        'color',
        'employee_count',
        'active',
        'type',
    ];

    protected $casts = [
        'breaks'             => 'array',
        'locations'          => 'array',
        'active'             => 'boolean',
        'work_hours'         => 'decimal:1',
        'late_threshold'     => 'integer',
        'overtime_threshold' => 'integer',
        'employee_count'     => 'integer',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'shift_id');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(ShiftAssignment::class);
    }
}