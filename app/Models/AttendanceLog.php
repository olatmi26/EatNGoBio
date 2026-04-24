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
        'failure_reason',
    ];

    protected $casts = [
        'punch_time'  => 'datetime',
        'punch_type'  => 'integer',
        'verify_type' => 'integer',
        'status'      => 'string',
    ];

    /**
     * punch_type mapping based on your system's configuration:
     * 0 = Check-In
     * 1 = Check-Out
     * 2 = Break Out
     * 3 = Break In
     * 4 = Overtime In
     * 5 = Overtime Out
     */
    public function getPunchTypeLabelAttribute(): string
    {
        return match ((int) $this->punch_type) {
            0       => 'Check-In',
            1       => 'Check-Out',
            2       => 'Break Out',
            3       => 'Break In',
            4       => 'Overtime In',
            5       => 'Overtime Out',
            default => 'Unknown (' . $this->punch_type . ')',
        };
    }

    /**
     * Get punch type for display (IN/OUT format for live monitor)
     */
    public function getPunchDirectionAttribute(): string
    {
        return match ((int) $this->punch_type) {
            0, 3, 4 => 'IN',  // Check-In, Break In, Overtime In
            1, 2, 5 => 'OUT', // Check-Out, Break Out, Overtime Out
            default => 'UNKNOWN',
        };
    }

    /**
     * verify_type mapping (ZKTeco standard):
     * 0 = Fingerprint
     * 1 = Fingerprint
     * 2 = Fingerprint
     * 3 = Password
     * 4 = Face
     * 15 = Card
     */
    public function getVerifyTypeLabelAttribute(): string
    {
        return match ((int) $this->verify_type) {
            0, 1, 2 => 'fingerprint',
            3       => 'password',
            4       => 'face',
            15      => 'card',
            default => 'fingerprint',
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
