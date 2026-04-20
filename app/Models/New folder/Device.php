<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Device extends Model
{
    protected $fillable = [
        'serial_number',
        'name',
        'location_id',
        'ip_address',
        'firmware',
        'user_count',
        'fp_count',
        'face_count',
        'last_seen',
        'status',
        'notes',
        'extra_data',

    ];

    protected $casts = [
        'last_seen'  => 'datetime',

        'user_count' => 'integer',

        'fp_count'   => 'integer',

        'face_count' => 'integer',

        'online'     => 'boolean',

        'status'     => 'enum:online,
        offline,
        unknown',
        'extra_data' => 'array',

    ];

    public function attendanceLogs()
    {
        return $this->hasMany(AttendanceLog::class, 'device_id');
    }

    public function commands()
    {
        return $this->hasMany(DeviceCommand::class, 'device_id');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class, 'source_device_sn', 'serial_number');
    }
}
