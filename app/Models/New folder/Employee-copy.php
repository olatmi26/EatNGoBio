<?php

// app/Models/Employee.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'employee_id',
        'first_name',
        'last_name',
        'card',
        'department',
        'department_id',
        'position',
        'position_id',
        'employment_type',
        'hired_date',
        'area',
        'location_id',
        'shift_id',
        'date_of_birth',
        'gender',
        'email',
        'picture',
        'phone',
        'address',
        'city',
        'state',
        'zip',
        'app_status',
        'active',
        'employee_status',
        'basic_salary',
        'biometric_areas',
        'source_device_sn',
    ];


    protected $casts = [
        
    ];

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class, 'employee_pin', 'pin');
    }
}