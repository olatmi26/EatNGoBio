<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Location extends Model
{
    protected $fillable = [
        'code',
        'name',
        'type',
        'timezone',
        'color',
        'manager_id',
        'city',
    ];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'location_id');
    }
    public function devices(): HasMany
    {
        return $this->hasMany(Device::class, 'location_id');
    }
    public function manager(): BelongsTo
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function getOnlineDeviceCountAttribute(): int
    {
        return $this->devices()->get()->filter(fn($d) => $d->is_online)->count();
    }
}
