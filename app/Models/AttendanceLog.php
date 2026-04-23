<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceLog extends Model
{
    protected $fillable = [
        'device_id',
        'device_sn',
        'employee_id',
        'employee_pin',
        'punch_time',
        'punch_type',
        'verify_type',
        'work_code',
        'raw_line_data',
        'status',
    ];

    protected $casts = [
        'punch_time'  => 'datetime',
        'punch_type'  => 'integer',
        'verify_type' => 'integer',
        'status' => 'string', 
    ];

    /**
     * punch_type mapping (ZKTeco standard):
     * 0 = Check-In  | 1 = Check-Out | 2 = Break Out
     * 3 = Break In  | 4 = OT In     | 5 = OT Out
     */
    public function getPunchTypeLabelAttribute(): string
    {
        return match ($this->punch_type) {
            0       => 'Check-In',
            1       => 'Check-Out',
            2       => 'Break',
            3       => 'Return',
            4       => 'OT In',
            5       => 'OT Out',
            default => 'Unknown',
        };
    }

    /**
     * verify_type mapping (ZKTeco standard):
     * 1/2/3 = Fingerprint | 4 = Face | 15 = Password/Card
     */
    public function getVerifyTypeLabelAttribute(): string
    {
        return match ($this->verify_type) {
            1, 2, 3 => 'fingerprint',
            4       => 'face',
            15      => 'password',
            default => 'card',
        };
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class, 'device_id');
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_pin', 'employee_id');
    }
}
