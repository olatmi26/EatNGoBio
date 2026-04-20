<?php
namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Device extends Model
{
    protected $fillable = [
        'serial_number',
        'name',
        'area',
        'location_id',
        'ip_address',
        'firmware',
        'user_count',
        'fp_count',
        'face_count',
        'last_seen',
        'status',
        'timezone',
        'transfer_mode',
        'heartbeat_interval',
        'approved',
        'notes',
        'extra_data',

    ];

    protected $casts = [
        'last_seen'          => 'datetime',
        'user_count'         => 'integer',
        'fp_count'           => 'integer',
        'face_count'         => 'integer',
        'approved'           => 'boolean',
        'heartbeat_interval' => 'integer',
        'extra_data'         => 'array',

    ];

    /**
     * Device is "online" if its last heartbeat arrived within:
     * (heartbeat_interval × 2) + 30 seconds grace.
     */
    public function getIsOnlineAttribute(): bool
    {
        if (! $this->last_seen || ! $this->approved) {
            return false;
        }

        $grace = ($this->heartbeat_interval ?? 10) * 2 + 30;
        return Carbon::parse($this->last_seen)->gte(now()->subSeconds($grace));
    }

    /** Status string aligned with UI: online | offline | syncing | unregistered */
    public function getComputedStatusAttribute(): string
    {
        if (! $this->approved) {
            return 'unregistered';
        }

        return $this->is_online ? 'online' : 'offline';
    }

    public function getLastSeenHumanAttribute(): string
    {
        return $this->last_seen ? $this->last_seen->diffForHumans() : 'Never';
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function attendanceLogs(): HasMany
    {
        return $this->hasMany(AttendanceLog::class,
            'device_id');
    }

    public function commands(): HasMany
    {
        return $this->hasMany(DeviceCommand::class,
            'device_id');
    }

    public function syncLogs(): HasMany
    {
        return $this->hasMany(DeviceSyncLog::class,
            'device_id');
    }

    /** Count punches today — used by DeviceService without loading all logs */
    public function todayPunchCount(): int
    {
        return $this->attendanceLogs()->whereDate('punch_time',
            today())->count();
    }

    public function employees()
    {
        return $this->hasMany(Employee::class, 'source_device_id', 'id');
    }
}
