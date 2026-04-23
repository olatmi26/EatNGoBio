<?php
// app/Models/SalaryComponent.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalaryComponent extends Model
{
    protected $fillable = [
        'name', 'code', 'type', 'calculation_type',
        'default_value', 'is_taxable', 'is_pensionable',
        'is_active', 'sort_order'
    ];

    protected $casts = [
        'default_value' => 'decimal:2',
        'is_taxable' => 'boolean',
        'is_pensionable' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function structureComponents(): HasMany
    {
        return $this->hasMany(SalaryStructureComponent::class);
    }
}