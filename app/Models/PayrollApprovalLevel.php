<?php
// app/Models/PayrollApprovalLevel.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollApprovalLevel extends Model
{
    protected $fillable = [
        'workflow_id',
        'name',
        'code',
        'order',
        'is_required',
        'can_reject',
        'can_edit',
    ];

    protected $casts = [
        'order'       => 'integer',
        'is_required' => 'boolean',
        'can_reject'  => 'boolean',
        'can_edit'    => 'boolean',
    ];

    public function workflow(): BelongsTo
    {
        return $this->belongsTo(PayrollApprovalWorkflow::class);
    }

    public function routes(): HasMany
    {
        return $this->hasMany(PayrollApprovalRoute::class, 'approval_level_id');
    }

    public function getApprovers()
    {
        return $this->routes()->where('is_active', true)->with('user')->get();
    }

    public function hasUser(User $user): bool
    {
        return $this->routes()
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();
    }

    public function isApprovedForPeriod(PayrollPeriod $period): bool
    {
        return $this->approvals()
            ->where('payroll_period_id', $period->id)
            ->whereNotNull('approved_at')
            ->whereNull('rejected_at')
            ->exists();
    }

    public function isRejectedForPeriod(PayrollPeriod $period): bool
    {
        return $this->approvals()
            ->where('payroll_period_id', $period->id)
            ->whereNotNull('rejected_at')
            ->exists();
    }

    public function getApprovalForPeriod(PayrollPeriod $period): ?PayrollPeriodApproval
    {
        return $this->approvals()
            ->where('payroll_period_id', $period->id)
            ->first();
    }
    public function approvals(): HasMany
    {
        return $this->hasMany(PayrollPeriodApproval::class, 'approval_level_id');
    }
}
