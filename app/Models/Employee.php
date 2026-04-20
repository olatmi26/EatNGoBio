<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
        'biometric_areas' => 'array',
        'active'          => 'boolean',
        'app_status'      => 'boolean',
        'hired_date'      => 'date',
        'date_of_birth'   => 'date',
        'basic_salary'    => 'decimal:2',
    ];

    // ── Computed Attributes ──────────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function getInitialsAttribute(): string
    {
        return strtoupper(
            substr($this->first_name ?? '', 0, 1) .
            substr($this->last_name ?? '', 0, 1)
        );
    }

    /** ZK Protocol alias: employee_id IS the PIN */
    public function getPinAttribute(): string
    {
        return $this->employee_id;
    }

    // ── Relations ────────────────────────────────────────────────────────────

    public function dept(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function positionModel(): BelongsTo
    {
        return $this->belongsTo(Position::class, 'position_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function shift(): BelongsTo
    {
        return $this->belongsTo(Shift::class, 'shift_id');
    }

    public function shiftAssignments(): HasMany
    {
        return $this->hasMany(ShiftAssignment::class);
    }

    public function activeShiftAssignment(): HasOne
    {
        return $this->hasOne(ShiftAssignment::class)
            ->whereNull('end_date')
            ->latestOfMany('effective_date');
    }

    public function attendanceLogs(): HasMany
    {
        // ZK uses employee_id (PIN) as the link key
        return $this->hasMany(AttendanceLog::class, 'employee_pin', 'employee_id');
    }

    public function latestLog(): HasOne
    {
        return $this->hasOne(AttendanceLog::class, 'employee_pin', 'employee_id')
            ->latestOfMany('punch_time');
    }

    public function todayCheckIn(): HasOne
    {
        return $this->hasOne(AttendanceLog::class, 'employee_pin', 'employee_id')
            ->whereDate('punch_time', today())
            ->where('punch_type', 0)
            ->latestOfMany('punch_time');
    }

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true)->where('employee_status', 'active');
    }

    public function device(): BelongsTo
    {
        return $this->belongsTo(Device::class, 'source_device_sn', 'serial_number');
    }
}
