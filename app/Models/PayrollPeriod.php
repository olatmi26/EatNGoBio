<?php
// app/Models/PayrollPeriod.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PayrollPeriod extends Model
{
    use HasFactory;
    protected $table    = 'payroll_periods';
    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'payment_date',
        'status',
        'total_employees',
        'total_basic_salary',
        'total_allowances',
        'total_deductions',
        'total_net_pay',
        'processed_by',
        'remarks',
    ];

    protected $casts = [
        'start_date'         => 'date',
        'end_date'           => 'date',
        'payment_date'       => 'date',
        'total_basic_salary' => 'decimal:2',
        'total_allowances'   => 'decimal:2',
        'total_deductions'   => 'decimal:2',
        'total_net_pay'      => 'decimal:2',
    ];

    // Status Constants
    const STATUS_DRAFT      = 'draft';
    const STATUS_PROCESSING = 'processing';
    const STATUS_APPROVED   = 'approved';
    const STATUS_PAID       = 'paid';
    const STATUS_CLOSED     = 'closed';

    public static function getStatuses(): array
    {
        return [
            self::STATUS_DRAFT      => 'Draft',
            self::STATUS_PROCESSING => 'Processing',
            self::STATUS_APPROVED   => 'Approved',
            self::STATUS_PAID       => 'Paid',
            self::STATUS_CLOSED     => 'Closed',
        ];
    }

    public function payrolls(): HasMany
    {
        return $this->hasMany(Payroll::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(PayrollPeriodApproval::class);
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    // Scopes
    public function scopeDraft($query)
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    public function scopeProcessing($query)
    {
        return $query->where('status', self::STATUS_PROCESSING);
    }

    public function scopeApproved($query)
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopePaid($query)
    {
        return $query->where('status', self::STATUS_PAID);
    }

    public function scopeClosed($query)
    {
        return $query->where('status', self::STATUS_CLOSED);
    }

    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('start_date', [$startDate, $endDate]);
    }

    // Helper Methods
    public function canBeProcessed(): bool
    {
        return in_array($this->status, [self::STATUS_DRAFT, self::STATUS_PROCESSING]);
    }

    public function canBeApproved(): bool
    {
        return $this->status === self::STATUS_PROCESSING;
    }

    public function canBePaid(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function canBeClosed(): bool
    {
        return $this->status === self::STATUS_PAID;
    }

    public function updateTotals(): void
    {
        $this->total_employees    = $this->payrolls()->count();
        $this->total_basic_salary = $this->payrolls()->sum('basic_salary');
        $this->total_allowances   = $this->payrolls()->sum('allowances_total');
        $this->total_deductions   = $this->payrolls()->sum('deductions_total');
        $this->total_net_pay      = $this->payrolls()->sum('net_pay');
        $this->saveQuietly();
    }

    public function isFullyApproved(): bool
    {
        $requiredLevels = PayrollApprovalLevel::whereHas('workflow', function ($query) {
            $query->where('is_active', true);
        })->where('is_required', true)->count();

        $completedApprovals = $this->approvals()
            ->whereNotNull('approved_at')
            ->whereNull('rejected_at')
            ->count();

        return $requiredLevels > 0 && $completedApprovals >= $requiredLevels;
    }

    public function getApprovalProgress(): array
    {
        $workflow = PayrollApprovalWorkflow::getDefault();
        if (! $workflow) {
            return ['percentage' => 0, 'approved' => 0, 'total' => 0, 'levels' => []];
        }

        $levels        = $workflow->levels;
        $approved      = 0;
        $levelStatuses = [];

        foreach ($levels as $level) {
            $approval = $this->approvals()
                ->where('approval_level_id', $level->id)
                ->first();

            $status = [
                'level'       => $level->name,
                'code'        => $level->code,
                'order'       => $level->order,
                'is_required' => $level->is_required,
                'status'      => 'pending',
                'approved_by' => null,
                'approved_at' => null,
                'remarks'     => null,
            ];

            if ($approval) {
                // Fix: Do not call isApproved() or isRejected() on stdClass
                // Use raw column checks for approval/rejection logic
                if (! is_null($approval->approved_at) && is_null($approval->rejected_at)) {
                    $status['status']      = 'approved';
                    $status['approved_by'] = isset($approval->user) ? $approval->user?->name : null;
                    $status['approved_at'] = $approval->approved_at ? (method_exists($approval->approved_at, 'format') ? $approval->approved_at->format('Y-m-d H:i:s') : (string) $approval->approved_at) : null;
                    $status['remarks']     = $approval->remarks;
                    if ($level->is_required) {
                        $approved++;
                    }
                } elseif (! is_null($approval->rejected_at)) {
                    $status['status']  = 'rejected';
                    $status['remarks'] = $approval->remarks;
                }
            }

            $levelStatuses[] = $status;
        }

        $totalRequired = $levels->where('is_required', true)->count();
        $percentage    = $totalRequired > 0 ? round(($approved / $totalRequired) * 100) : 0;

        return [
            'percentage'        => $percentage,
            'approved'          => $approved,
            'total'             => $totalRequired,
            'levels'            => $levelStatuses,
            'is_fully_approved' => $approved === $totalRequired,
        ];
    }

    public function canBeApprovedBy(int $userId): array
    {
        $progress      = $this->getApprovalProgress();
        $pendingLevels = array_filter($progress['levels'], fn($l) => $l['status'] === 'pending' && $l['is_required']);

        if (empty($pendingLevels)) {
            return ['can' => false, 'level' => null, 'reason' => 'No pending approval levels'];
        }

        $nextLevel = $pendingLevels[0];
        $level     = PayrollApprovalLevel::where('code', $nextLevel['code'])->first();

        if (! $level) {
            return ['can' => false, 'level' => null, 'reason' => 'Approval level not found'];
        }

        $isApprover = $level->routes()
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        return [
            'can'    => $isApprover,
            'level'  => $isApprover ? $level : null,
            'reason' => $isApprover ? null : 'You are not authorized for this approval level',
        ];
    }

    public function markAsPaid(): void
    {
        $this->update(['status' => self::STATUS_PAID]);
    }

    public function submitForApproval(): void
    {
        $this->update(['status' => self::STATUS_PROCESSING]);
    }

    public function markAsApproved(): void
    {
        $this->update(['status' => self::STATUS_APPROVED]);
    }

    public function getPendingApprovalLevels(): array
    {
        $progress = $this->getApprovalProgress();
        return array_column(
            array_filter($progress['levels'], fn($l) => $l['status'] === 'pending' && $l['is_required']),
            'code'
        );
    }

    public function isApprovedByLevel(string $code): bool
    {
        $level = PayrollApprovalLevel::where('code', $code)->first();
        if (! $level) {
            return false;
        }

        return $this->approvals()
            ->where('approval_level_id', $level->id)
            ->whereNotNull('approved_at')
            ->whereNull('rejected_at')
            ->exists();
    }

    public function addApproval(int $userId, string $levelCode, ?int $routeId = null, ?string $remarks = null): void
    {
        $level = PayrollApprovalLevel::where('code', $levelCode)->first();
        if (! $level) {
            return;
        }

        $this->approvals()->updateOrCreate(
            [
                'approval_level_id' => $level->id,
            ],
            [
                'user_id'     => $userId,
                'approved_at' => now(),
                'remarks'     => $remarks,
            ]
        );
    }
}
