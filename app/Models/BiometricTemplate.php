<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BiometricTemplate extends Model
{
    protected $fillable = [
        'employee_id', 'device_sn', 'type', 'finger_id',
        'template_size', 'template_data', 'is_valid', 'is_duress',
        'major_version', 'minor_version'
    ];

    protected $casts = [
        'is_valid' => 'boolean',
        'is_duress' => 'boolean',
        'template_size' => 'integer',
        'finger_id' => 'integer',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}