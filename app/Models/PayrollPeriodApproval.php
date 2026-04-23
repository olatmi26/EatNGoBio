<?php
// app/Models/PayrollPeriodApproval.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollPeriodApproval extends Model
{
    protected $fillable = [
        'payroll_period_id',
        'approval_level_id',
        'user_id',
        'approved_at',
        'rejected_at',
        'remarks',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function payrollPeriod(): BelongsTo
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    public function approvalLevel(): BelongsTo
    {
        return $this->belongsTo(PayrollApprovalLevel::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeApproved($query)
    {
        return $query->whereNotNull('approved_at')->whereNull('rejected_at');
    }

    public function scopeRejected($query)
    {
        return $query->whereNotNull('rejected_at');
    }

    public function scopePending($query)
    {
        return $query->whereNull('approved_at')->whereNull('rejected_at');
    }

    public function isApproved(): bool
    {
        return ! is_null($this->approved_at) && is_null($this->rejected_at);
    }

    public function isRejected(): bool
    {
        return ! is_null($this->rejected_at);
    }

    public function isPending(): bool
    {
        return is_null($this->approved_at) && is_null($this->rejected_at);
    }

    public function approve(?string $remarks = null): void
    {
        $this->update([
            'approved_at' => now(),
            'rejected_at' => null,
            'remarks'     => $remarks ?? $this->remarks,
        ]);
    }

    public function reject(?string $remarks = null): void
    {
        $this->update([
            'rejected_at' => now(),
            'approved_at' => null,
            'remarks'     => $remarks ?? $this->remarks,
        ]);
    }

    public function canBeApprovedBy(User $user): bool
    {
        return $this->approvalLevel->hasUser($user) && $this->isPending();
    }
}
