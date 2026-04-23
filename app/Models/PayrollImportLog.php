<?php
// app/Models/PayrollImportLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollImportLog extends Model
{
    protected $fillable = [
        'filename',
        'total_rows',
        'success_rows',
        'failed_rows',
        'errors',
        'status',
        'imported_by',
    ];

    protected $casts = [
        'errors' => 'array',
        'total_rows' => 'integer',
        'success_rows' => 'integer',
        'failed_rows' => 'integer',
    ];

    public function importedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'imported_by');
    }
}