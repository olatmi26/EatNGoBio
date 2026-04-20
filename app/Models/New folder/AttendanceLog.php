<?php
// app/Models/AttendanceLog.php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AttendanceLog extends Model
{
    protected $fillable = [
        'device_id', 'device_sn', 'employee_id', 'employee_pin', 'punch_time',
        'punch_type', 'verify_type', 'work_code',
        'raw_line_data','status',
    ];

    protected $casts = [
        'punch_time'  => 'datetime',
        'punch_type'  => 'integer',
        'verify_type' => 'integer',
    ];

    public function device()
    {
        return $this->belongsTo(Device::class, 'device_id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_pin', 'pin');
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            0 => 'Check In',
            1 => 'Check Out',
            2 => 'Break Out',
            3 => 'Break In',
            4 => 'Overtime In',
            5 => 'Overtime Out',
            default => 'Unknown',
        };
    }

     // Verify label helpers
     public function getVerifyLabelAttribute(): string
     {
         return match ($this->verify_type) {
             1, 2, 3 => 'Fingerprint',
             4       => 'Face',
             15      => 'Password',
             default => 'Unknown',
         };
     }
}

