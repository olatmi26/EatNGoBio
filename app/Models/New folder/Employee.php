<?php

// app/Models/Employee.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    protected $fillable = [
        'pin', 'name', 'card', 'department', 'source_device_sn',
    ];

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class, 'employee_pin', 'pin');
    }
}