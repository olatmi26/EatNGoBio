<?php
// app/Http/Controllers/PayrollController.php

namespace App\Http\Controllers;

use App\Exports\PayrollExport;
use App\Models\Payroll;
use App\Models\PayrollPeriod;
use App\Services\AttendanceService;
use App\Services\NotificationService;
use App\Services\PayrollApprovalService;
use App\Services\PayrollGenerationService;
use App\Services\PayrollService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class PayrollController extends Controller
{
    public function __construct(
        private PayrollService $payrollService,
        private PayrollGenerationService $generationService,
        private AttendanceService $attendanceService,
        private NotificationService $notifs,
        private PayrollApprovalService $approvalService
    ) {}

    /**
     * Display payroll dashboard.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();

        // Setup default routes for super admin if none exist
        $this->approvalService->setupDefaultRoutesForUser($user);

        $period    = $request->input('period', Carbon::now()->format('Y-m'));
        $startDate = Carbon::parse($period . '-01')->startOfMonth();
        $endDate   = Carbon::parse($period . '-01')->endOfMonth();

        $summary = $this->payrollService->getPayrollSummary();

        // Get current period
        $currentPeriod = PayrollPeriod::with(['approvals.user', 'approvals.approvalLevel'])
            ->where('start_date', $startDate)
            ->first();

        // Get payroll periods history
        $periods = PayrollPeriod::orderBy('start_date', 'desc')
            ->limit(12)
            ->get()
            ->map(function ($period) {
                $period->approval_progress = $period->getApprovalProgress();
                return $period;
            });

        // Calculate trend data
        $trend = $this->calculatePayrollTrend();

        // Department summary for current period
        $deptSummary = $currentPeriod ? $this->getDepartmentSummary($currentPeriod) : [];

        // Get pending approvals for current user
        $pendingApprovals  = $this->approvalService->getPendingApprovalsForUser($user->id);
        $userApprovalLevel = $this->approvalService->getUserApprovalLevel($user->id);

        // Check if user can approve current period
        $canApproveCurrentPeriod = false;
        $pendingApprovalLevel    = null;

        if ($currentPeriod && $currentPeriod->status === PayrollPeriod::STATUS_PROCESSING) {
            $canApprove              = $currentPeriod->canBeApprovedBy($user->id);
            $canApproveCurrentPeriod = $canApprove['can'];
            $pendingApprovalLevel    = $canApprove['level']?->code ?? null;
        }

        return Inertia::render('Payroll/Index', [
            'summary'                 => $summary,
            'trend'                   => $trend,
            'deptSummary'             => $deptSummary,
            'periods'                 => $periods,
            'currentPeriod'           => $currentPeriod,
            'selectedPeriod'          => $period,
            'pendingApprovals'        => $pendingApprovals,
            'userApprovalLevel'       => $userApprovalLevel,
            'canApproveCurrentPeriod' => $canApproveCurrentPeriod,
            'pendingApprovalLevel'    => $pendingApprovalLevel,
            'unreadCount'             => $this->notifs->unreadCount($user->id),
            'departments'             => $this->getDepartments(),
            'locations'               => $this->getLocations(),
        ]);
    }

    public function generate(Request $request)
    {
        $validated = $request->validate([
            'period'     => 'required|date_format:Y-m',
            'department' => 'nullable|string',
            'location'   => 'nullable|string',
        ]);

        $startDate = Carbon::parse($validated['period'] . '-01')->startOfMonth();
        $endDate   = Carbon::parse($validated['period'] . '-01')->endOfMonth();

        // Check if period already exists
        $existing = PayrollPeriod::where('start_date', $startDate)->first();
        if ($existing) {
            return back()->with('error', 'Payroll period already exists for ' . $startDate->format('F Y'));
        }

        // Generate payroll data using the new service
        $filters = array_filter([
            'department' => $validated['department'] ?? null,
            'location'   => $validated['location'] ?? null,
        ]);

        $payrollData = $this->generationService->generatePayroll($startDate, $endDate, $filters);

        if (empty($payrollData)) {
            return back()->with('error', 'No active employees with compensation found for this period.');
        }

        // Create payroll period
        $period = PayrollPeriod::create([
            'name'               => $startDate->format('F Y'),
            'start_date'         => $startDate,
            'end_date'           => $endDate,
            'payment_date'       => $endDate->copy()->addDays(5),
            'status'             => PayrollPeriod::STATUS_DRAFT,
            'total_employees'    => count($payrollData),
            'total_basic_salary' => array_sum(array_column($payrollData, 'basic_salary')),
            'total_allowances'   => array_sum(array_map(fn($d) => array_sum(array_column($d['allowances'], 'amount')), $payrollData)),
            'total_deductions'   => array_sum(array_column($payrollData, 'total_deductions')),
            'total_net_pay'      => array_sum(array_column($payrollData, 'net_pay')),
            'processed_by'       => auth()->id(),
        ]);

        // Create payroll records
        foreach ($payrollData as $data) {
            Payroll::create([
                'payroll_period_id' => $period->id,
                'employee_id'       => $data['employee_id'],
                'basic_salary'      => $data['basic_salary'],
                'allowances'        => $data['allowances'],
                'deductions'        => $data['deductions'],
                'overtime_pay'      => $data['overtime_pay'],
                'late_deduction'    => $data['late_deduction'],
                'absent_deduction'  => $data['absent_deduction'],
                'tax_deduction'     => $data['tax_deduction'],
                'pension_deduction' => $data['pension_deduction'],
                'nhf_deduction'     => $data['nhf_deduction'],
                'gross_pay'         => $data['gross_pay'],
                'net_pay'           => $data['net_pay'],
                'days_worked'       => $data['days_worked'],
                'days_absent'       => $data['days_absent'],
                'late_minutes'      => $data['late_minutes'],
                'overtime_hours'    => $data['overtime_hours_normal'],
                'status'            => Payroll::STATUS_DRAFT,
            ]);
        }

        return redirect()
            ->route('payroll.show', ['period' => $period->id])
            ->with('success', 'Payroll generated successfully for ' . $period->name);
    }

    public function show(PayrollPeriod $period): Response
    {
        $user = auth()->user();

        $period->load(['approvals.user', 'approvals.approvalLevel']);
        $period->approval_progress = $period->getApprovalProgress();

        $payrolls = Payroll::with('employee')
            ->where('payroll_period_id', $period->id)
            ->orderBy('employee_id')
            ->paginate(20);

        // Calculate summary statistics
        $stats = [
            'total_employees'        => $payrolls->total(),
            'total_basic'            => $payrolls->sum('basic_salary'),
            'total_overtime'         => $payrolls->sum('overtime_pay'),
            'total_late_deduction'   => $payrolls->sum('late_deduction'),
            'total_absent_deduction' => $payrolls->sum('absent_deduction'),
            'total_tax'              => $payrolls->sum('tax_deduction'),
            'total_pension'          => $payrolls->sum('pension_deduction'),
            'total_nhf'              => $payrolls->sum('nhf_deduction'),
            'total_net'              => $payrolls->sum('net_pay'),
            'total_gross'            => $payrolls->sum('gross_pay'),
        ];

        $canApprove        = $period->canBeApprovedBy($user->id);
        $userApprovalLevel = $this->approvalService->getUserApprovalLevel($user->id);

        return Inertia::render('Payroll/Show', [
            'period'               => $period,
            'payrolls'             => $payrolls,
            'stats'                => $stats,
            'canApprove'           => $canApprove['can'],
            'pendingApprovalLevel' => $canApprove['level']?->code ?? null,
            'userApprovalLevel'    => $userApprovalLevel,
            'unreadCount'          => $this->notifs->unreadCount($user->id),
        ]);
    }

    /**
     * Submit payroll for approval.
     */
    public function submitForApproval(Request $request, PayrollPeriod $period)
    {
        try {
            $this->approvalService->submitForApproval($period, auth()->id());
            return back()->with('success', 'Payroll submitted for approval successfully.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Approve payroll at current user's level.
     */
    public function approve(Request $request, PayrollPeriod $period)
    {
        $validated = $request->validate([
            'remarks' => 'nullable|string|max:500',
        ]);

        try {
            $this->approvalService->approve($period, auth()->id(), $validated['remarks'] ?? null);

            $message = $period->isFullyApproved()
                ? 'Payroll fully approved successfully.'
                : 'Payroll approved at your level successfully.';

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Reject payroll.
     */
    public function reject(Request $request, PayrollPeriod $period)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            $this->approvalService->reject($period, auth()->id(), $validated['reason']);
            return back()->with('success', 'Payroll rejected successfully.');
        } catch (\Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Mark payroll as paid.
     */
    public function markAsPaid(Request $request, PayrollPeriod $period)
    {
        if ($period->status !== PayrollPeriod::STATUS_APPROVED) {
            return back()->with('error', 'Only approved payrolls can be marked as paid.');
        }

        if (! $period->isFullyApproved()) {
            return back()->with('error', 'Payroll must be fully approved before marking as paid.');
        }

        $period->update(['status' => PayrollPeriod::STATUS_PAID]);

        Payroll::where('payroll_period_id', $period->id)
            ->update([
                'status'  => Payroll::STATUS_PAID,
                'paid_at' => now(),
            ]);

        return back()->with('success', 'Payroll marked as paid.');
    }

    /**
     * Export payroll to Excel.
     */
    public function export(PayrollPeriod $period)
    {
        $filename = sprintf(
            'payroll_%s_%s.xlsx',
            str_replace(' ', '_', $period->name),
            now()->format('Y-m-d')
        );

        return Excel::download(
            new PayrollExport($period->id),
            $filename
        );
    }

    /**
     * Generate and download payslip.
     */
    public function payslip(Payroll $payroll)
    {
        $payroll->load(['employee', 'period']);

        $pdf = Pdf::loadView('exports.payslip', [
            'payroll'      => $payroll,
            'generated_at' => now()->format('Y-m-d H:i:s'),
        ]);

        return $pdf->download(sprintf(
            'payslip_%s_%s_%s.pdf',
            $payroll->employee_id,
            str_replace(' ', '_', $payroll->employee->full_name ?? 'employee'),
            str_replace(' ', '_', $payroll->period->name ?? 'payroll')
        ));
    }

    /**
     * Delete a draft payroll period.
     */
    public function destroy(PayrollPeriod $period)
    {
        if ($period->status !== PayrollPeriod::STATUS_DRAFT) {
            return back()->with('error', 'Only draft payrolls can be deleted.');
        }

        Payroll::where('payroll_period_id', $period->id)->delete();
        $period->approvals()->delete();
        $period->delete();

        return redirect()
            ->route('payroll.index')
            ->with('success', 'Payroll period deleted successfully.');
    }

    /**
     * Calculate payroll trend for last 6 months
     */
    private function calculatePayrollTrend(): array
    {
        $months = [];
        for ($i = 5; $i >= 0; $i--) {
            $date   = Carbon::now()->subMonths($i)->startOfMonth();
            $period = PayrollPeriod::where('start_date', $date)->first();

            $months[] = [
                'month'          => $date->format('M Y'),
                'total_payroll'  => $period ? (float) $period->total_net_pay : 0,
                'employee_count' => $period ? $period->total_employees : 0,
                'avg_salary'     => ($period && $period->total_employees > 0)
                    ? round($period->total_net_pay / $period->total_employees, 2)
                    : 0,
            ];
        }
        return $months;
    }

    /**
     * Get department summary for a period
     */
    private function getDepartmentSummary(PayrollPeriod $period): array
    {
        $payrolls = Payroll::with('employee')
            ->where('payroll_period_id', $period->id)
            ->get();

        $deptSummary = [];
        foreach ($payrolls as $payroll) {
            $dept = $payroll->employee->department ?? 'Unknown';
            if (! isset($deptSummary[$dept])) {
                $deptSummary[$dept] = [
                    'department'     => $dept,
                    'employee_count' => 0,
                    'total_basic'    => 0,
                    'total_net_pay'  => 0,
                ];
            }

            $deptSummary[$dept]['employee_count']++;
            $deptSummary[$dept]['total_basic']   += $payroll->basic_salary;
            $deptSummary[$dept]['total_net_pay'] += $payroll->net_pay;
        }

        return array_values($deptSummary);
    }

    /**
     * Get list of departments for filter dropdown
     */
    public function getDepartments(): array
    {
        return \App\Models\Employee::query()
            ->select('department')
            ->whereNotNull('department')
            ->distinct()
            ->orderBy('department')
            ->pluck('department')
            ->toArray();
    }

    /**
     * Get list of locations for filter dropdown
     */
    public function getLocations(): array
    {
        return \App\Models\Employee::query()
            ->select('area')
            ->whereNotNull('area')
            ->distinct()
            ->orderBy('area')
            ->pluck('area')
            ->toArray();
    }
}