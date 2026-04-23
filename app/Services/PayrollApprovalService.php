<?php
// app/Services/PayrollApprovalService.php

namespace App\Services;

use App\Models\PayrollApprovalLevel;
use App\Models\PayrollApprovalRoute;
use App\Models\PayrollApprovalWorkflow;
use App\Models\PayrollPeriod;
use App\Models\PayrollPeriodApproval;
use App\Models\User;


class PayrollApprovalService
{
    public function __construct(
        private ?NotificationService $notificationService = null
    ) {}

    /**
     * Setup default approval routes for admin if none exist
     */
    public function setupDefaultRoutesForUser(User $user): void
    {
        // Only setup if user is Super Admin and no routes exist for them
        if (!$user->hasRole('Super Admin')) {
            return;
        }

        if (PayrollApprovalRoute::where('user_id', $user->id)->exists()) {
            return;
        }

        $workflow = PayrollApprovalWorkflow::getDefault();
        if (!$workflow) {
            return;
        }

        foreach ($workflow->levels as $level) {
            PayrollApprovalRoute::firstOrCreate(
                [
                    'approval_level_id' => $level->id,
                    'user_id'           => $user->id,
                ],
                [
                    'role'      => $this->getRoleForLevel($level->code),
                    'is_active' => true,
                ]
            );
        }
    }

    private function getRoleForLevel(string $code): string
    {
        return match ($code) {
            'preparer' => 'HR Manager',
            'reviewer' => 'Finance Manager',
            'approver' => 'Director',
            default    => 'Staff',
        };
    }

    /**
     * Submit payroll period for approval
     */
    public function submitForApproval(PayrollPeriod $period, int $submittedBy): bool
    {
        if ($period->status !== PayrollPeriod::STATUS_DRAFT) {
            throw new \Exception('Only draft payrolls can be submitted for approval.');
        }

        $period->update(['status' => PayrollPeriod::STATUS_PROCESSING]);

        $this->notifyNextApprovers($period);

        return true;
    }

    /**
     * Approve a payroll period at a specific level
     */
    public function approve(PayrollPeriod $period, int $userId, ?string $remarks = null): bool
    {
        if ($period->status !== PayrollPeriod::STATUS_PROCESSING) {
            throw new \Exception('Only payrolls in processing can be approved.');
        }

        $canApprove = $period->canBeApprovedBy($userId);
        if (!isset($canApprove['can']) || !$canApprove['can']) {
            throw new \Exception($canApprove['reason'] ?? 'Approval not permitted.');
        }

        $level = $canApprove['level'];

        PayrollPeriodApproval::updateOrCreate(
            [
                'payroll_period_id' => $period->id,
                'approval_level_id' => $level->id,
            ],
            [
                'user_id'     => $userId,
                'approved_at' => now(),
                'rejected_at' => null,
                'remarks'     => $remarks,
            ]
        );

        if ($period->isFullyApproved()) {
            $period->update(['status' => PayrollPeriod::STATUS_APPROVED]);

            if ($this->notificationService && $period->processed_by) {
                $this->notificationService->notifyUser(
                    $period->processed_by,
                    'Payroll Fully Approved',
                    "Payroll period {$period->name} has been fully approved.",
                    'success'
                );
            }
        } else {
            $this->notifyNextApprovers($period);
        }

        return true;
    }

    /**
     * Reject a payroll period
     */
    public function reject(PayrollPeriod $period, int $userId, string $reason): bool
    {
        if (!in_array($period->status, [PayrollPeriod::STATUS_DRAFT, PayrollPeriod::STATUS_PROCESSING])) {
            throw new \Exception('Only draft or processing payrolls can be rejected.');
        }

        $canApprove = $period->canBeApprovedBy($userId);
        if (!isset($canApprove['can']) || !$canApprove['can']) {
            throw new \Exception($canApprove['reason'] ?? 'Rejection not permitted.');
        }

        $level = $canApprove['level'];

        PayrollPeriodApproval::updateOrCreate(
            [
                'payroll_period_id' => $period->id,
                'approval_level_id' => $level->id,
            ],
            [
                'user_id'     => $userId,
                'rejected_at' => now(),
                'approved_at' => null,
                'remarks'     => "REJECTED: {$reason}",
            ]
        );

        $period->update(['status' => PayrollPeriod::STATUS_DRAFT]);

        if ($this->notificationService && $period->processed_by) {
            $this->notificationService->notifyUser(
                $period->processed_by,
                'Payroll Rejected',
                "Payroll period {$period->name} was rejected. Reason: {$reason}",
                'error'
            );
        }

        return true;
    }

    /**
     * Get user's approval level
     */
    public function getUserApprovalLevel(int $userId): ?string
    {
        return PayrollApprovalRoute::with('level')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->first()?->level?->code;
    }

    /**
     * Get pending approvals for a user
     */
    public function getPendingApprovalsForUser(int $userId): array
    {
        $routes = PayrollApprovalRoute::with('level')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->get();

        if ($routes->isEmpty()) {
            return [];
        }

        $userLevelCodes = $routes->pluck('level.code')->filter()->toArray();

        $pendingPeriods = PayrollPeriod::where('status', PayrollPeriod::STATUS_PROCESSING)
            ->with(['payrolls', 'approvals'])
            ->get()
            ->filter(function ($period) use ($userLevelCodes) {
                // Defensive: convert $period to PayrollPeriod if it's returned as stdClass
                $periodModel = $period instanceof PayrollPeriod ? $period : PayrollPeriod::find($period->id);
                if (!$periodModel) {
                    return false;
                }
                if (!method_exists($periodModel, 'getApprovalProgress')) {
                    return false;
                }
                $progress = $periodModel->getApprovalProgress();
                $pendingLevel = collect($progress['levels'] ?? [])
                    ->first(fn($l) => $l['status'] === 'pending' && $l['is_required']);

                return $pendingLevel && in_array($pendingLevel['code'], $userLevelCodes);
            })
            ->map(function ($period) {
                // Defensive: convert $period to PayrollPeriod if it's returned as stdClass
                $periodModel = $period instanceof PayrollPeriod ? $period : PayrollPeriod::find($period->id);
                if (!$periodModel || !method_exists($periodModel, 'getApprovalProgress')) {
                    return [
                        'period' => $period,
                        'level'  => null,
                        'code'   => null,
                    ];
                }
                $progress = $periodModel->getApprovalProgress();
                $pendingLevel = collect($progress['levels'] ?? [])
                    ->first(fn($l) => $l['status'] === 'pending' && $l['is_required']);

                return [
                    'period' => $periodModel,
                    'level'  => $pendingLevel['level'] ?? null,
                    'code'   => $pendingLevel['code'] ?? null,
                ];
            })
            ->values()
            ->toArray();

        return $pendingPeriods;
    }

    /**
     * Get approval status summary for a period
     */
    public function getApprovalStatus(PayrollPeriod $period): array
    {
        return $period->getApprovalProgress();
    }

    /**
     * Notify next approvers in the workflow
     */
    private function notifyNextApprovers(PayrollPeriod $period): void
    {
        if (!$this->notificationService) {
            return;
        }

        $progress = $period->getApprovalProgress();
        $pendingLevel = collect($progress['levels'] ?? [])
            ->first(fn($l) => $l['status'] === 'pending' && $l['is_required']);

        if (!$pendingLevel) {
            return;
        }

        $level = PayrollApprovalLevel::where('code', $pendingLevel['code'])->first();
        if (!$level) {
            return;
        }

        $approvers = $level->routes()->where('is_active', true)->pluck('user_id');
        if ($approvers->isEmpty()) {
            return;
        }

        foreach ($approvers as $approverId) {
            $this->notificationService->notifyUser(
                $approverId,
                'Payroll Awaiting Approval',
                "Payroll period {$period->name} is awaiting your approval.",
                'info',
                ['period_id' => $period->id, 'level' => $pendingLevel['code']]
            );
        }
    }


    /**
     * Notify a user with a given message.
     *
     * @param int $userId
     * @param string $title
     * @param string $message
     * @param string $severity
     * @param array $meta
     */
    public function notifyUser(
        int $userId,
        string $title,
        string $message,
        string $severity = 'info',
        array $meta = []
    ): void {
        if (!$this->notificationService) {
            return;
        }
        $this->notificationService->notifyUser($userId, $title, $message, $severity, $meta);
    }
}