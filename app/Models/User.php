<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles, HasApiTokens;

    protected $fillable = [
        'name', 'email',
        'password',
        'department_id',
        'avatar_initials',
        'status',
        'location_id',
        'phone',
        'address',
        'city',
        'avatar',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class);
    }

    public function getAvatarInitialsAttribute(): string
    {
        if ($this->attributes['avatar_initials'] ?? null) {
            return $this->attributes['avatar_initials'];
        }
        $parts = explode(' ', $this->name);
        return strtoupper(substr($parts[0], 0, 1) . (isset($parts[1]) ? substr($parts[1], 0, 1) : ''));
    }

    public function getPrimaryRoleAttribute(): string
    {
        return $this->roles->first()?->name ?? 'Staff';
    }

    /**
     * Locations this user can manage
     */
    public function managedLocations(): BelongsToMany
    {
        return $this->belongsToMany(Location::class, 'user_locations')
            ->withPivot('is_primary')
            ->withTimestamps();
    }

    /**
     * Areas this user can manage (more granular than locations)
     */
    public function managedAreas()
    {
        return $this->hasMany(UserArea::class);
    }

    /**
     * Check if user can manage a specific location
     */
    public function canManageLocation(int $locationId): bool
    {
        if ($this->hasRole('Super Admin')) {
            return true;
        }

        return $this->managedLocations()->where('location_id', $locationId)->exists();
    }

    /**
     * Check if user can manage a specific area
     */
    public function canManageArea(string $area): bool
    {
        if ($this->hasRole('Super Admin')) {
            return true;
        }

        return $this->managedAreas()->where('area_name', $area)->exists();
    }

    /**
     * Check if user can manage a specific device
     */
    public function canManageDevice(Device $device): bool
    {
        if ($this->hasRole('Super Admin')) {
            return true;
        }

        // Check by location
        if ($device->location_id && $this->canManageLocation($device->location_id)) {
            return true;
        }

        // Check by area
        if ($device->area && $this->canManageArea($device->area)) {
            return true;
        }

        return false;
    }

    /**
     * Get all accessible location IDs for this user
     */
    public function getAccessibleLocationIds(): array
    {
        if ($this->hasRole('Super Admin')) {
            return Location::pluck('id')->toArray();
        }

        return $this->managedLocations()->pluck('location_id')->toArray();
    }

    /**
     * Get all accessible area names for this user
     */
    public function getAccessibleAreas(): array
    {
        if ($this->hasRole('Super Admin')) {
            return Location::pluck('name')->toArray();
        }

        $locationAreas = $this->managedLocations()->pluck('name')->toArray();
        $directAreas   = $this->managedAreas()->pluck('area_name')->toArray();

        return array_unique(array_merge($locationAreas, $directAreas));
    }

    /**
     * Scope query to only include devices user can access
     */
    public function scopeAccessibleDevices($query, User $user)
    {
        if ($user->hasRole('Super Admin')) {
            return $query;
        }

        $accessibleAreas       = $user->getAccessibleAreas();
        $accessibleLocationIds = $user->getAccessibleLocationIds();

        return $query->where(function ($q) use ($accessibleAreas, $accessibleLocationIds) {
            $q->whereIn('area', $accessibleAreas)
                ->orWhereIn('location_id', $accessibleLocationIds);
        });
    }
}
