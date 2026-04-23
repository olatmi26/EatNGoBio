<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class PayrollSetting extends Model
{
    use HasFactory;
    protected $fillable = [
        'key',
        'value',
        'group',
        'type',
        'options',
        'label',
        'description',
        'is_public',
        'sort_order',
    ];

    protected $casts = [
        'is_public'  => 'boolean',
        'options'    => 'array',
        'sort_order' => 'integer',
    ];
    /**
     * Get a setting value by key
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember("payroll_setting.{$key}", 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();

            if (! $setting) {
                return $default;
            }

            return $setting->getValueAttribute();
        });
    }

    public static function getFloat(string $key, float $default = 0): float
    {
        return (float) static::get($key, $default);
    }

    /**
     * Get a setting value as boolean
     */
    public static function getBool(string $key, bool $default = false): bool
    {
        return (bool) static::get($key, $default);
    }

    /**
     * Get a setting value as array (JSON)
     */
    public static function getArray(string $key, array $default = []): array
    {
        $value = static::get($key, $default);
        return is_array($value) ? $value : json_decode($value, true) ?? $default;
    }

    /**
     * Set a setting value
     */
    public static function set(string $key, mixed $value, ?string $group = null): void
    {
        $setting = static::updateOrCreate(
            ['key' => $key],
            ['value' => $value] + ($group ? ['group' => $group] : [])
        );

        Cache::forget("payroll_setting.{$key}");
    }

    /**
     * Get all settings grouped
     */
    public static function getGrouped(?string $group = null): array
    {
        $query = static::query();
        if ($group !== null) {
            $query->where('group', $group);
        }
        // Retrieve full models instead of only selected columns
        $settings = $query->orderBy('sort_order')->get();

        if ($group !== null) {
            // Single group, flat array for this group
            $result = [];
            foreach ($settings as $setting) {
                $result[$setting->key] = $setting->value;
            }
            return $result;
        } else {
            // Multiple groups
            $grouped = [];
            foreach ($settings as $setting) {
                $grouped[$setting->group][$setting->key] = $setting->value;
            }
            return $grouped;
        }
    }

    /**
     * Get transformed value based on type
     */
    public function getValueAttribute(): mixed
    {
        $value = $this->attributes['value'] ?? null;

        return match ($this->type) {
            'boolean' => (bool) $value,
            'number'  => is_numeric($value) ? (float) $value : $value,
            'json', 'array' => json_decode($value, true) ?? [],
            default   => $value,
        };
    }

    /**
     * Set value with proper casting.
     */
    public function setValueAttribute(mixed $value): void
    {
        $this->attributes['value'] = match ($this->type) {
            'boolean' => $value ? '1' : '0',
            'json', 'array' => is_string($value) ? $value : json_encode($value),
            default   => (string) $value,
        };
    }

    /**
     * Boot the model.
     */
    protected static function booted(): void
    {
        static::saved(function ($setting) {
            Cache::forget("payroll_setting.{$setting->key}");
        });

        static::deleted(function ($setting) {
            Cache::forget("payroll_setting.{$setting->key}");
        });
    }

}
