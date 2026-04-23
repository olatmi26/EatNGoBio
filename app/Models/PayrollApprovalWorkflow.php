<?php
// app/Models/PayrollApprovalWorkflow.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollApprovalWorkflow extends Model
{
    use HasFactory;

    protected $table    = 'payroll_approval_workflows';
    protected $fillable = [
        'name',
        'description',
        'is_active',
        'is_default',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'is_default' => 'boolean',
    ];

    public function levels(): HasMany
    {
        return $this->hasMany(PayrollApprovalLevel::class, 'workflow_id')->orderBy('order');
    }

    public static function getDefault(): ?self
    {
        return static::where('is_default', true)->where('is_active', true)->first();
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    // Helper Methods
    public static function getActiveWorkflow(): ?self
    {
        return self::active()->default()->first() ?? self::active()->first();
    }

    public function getLevelsOrdered(): HasMany
    {
        return $this->levels()->orderBy('order');
    }

    public function getFirstLevel(): ?PayrollApprovalLevel
    {
        return $this->levels()->orderBy('order')->first();
    }

    public function getNextLevel($currentOrder): ?PayrollApprovalLevel
    {
        return $this->levels()
            ->where('order', '>', $currentOrder)
            ->orderBy('order')
            ->first();
    }

    public function hasRequiredLevels(): bool
    {
        return $this->levels()->where('is_required', true)->exists();
    }

}
