<?php
// app/Http/Controllers/PayrollSettingsController.php

namespace App\Http\Controllers;

use App\Models\EmployeeCompensation;
use App\Models\PayrollSetting;
use App\Models\SalaryComponent;
use App\Models\SalaryStructure;
use App\Services\NotificationService;
use App\Services\PayrollCalculator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayrollSettingsController extends Controller
{
    public function __construct(
        private PayrollCalculator $calculator,
        private NotificationService $notifs
    ) {}

    public function index(Request $request): Response
    {
        $user = auth()->user();
        $tab  = $request->input('tab', 'payroll-config');
        $page = $request->input('page', 1);

        $data = [
            'unreadCount' => $this->notifs->unreadCount($user->id),
            'departments' => \App\Models\Department::orderBy('name')->pluck('name')->toArray(),
            'locations'   => \App\Models\Location::orderBy('name')->pluck('name')->toArray(),
        ];

        // Payroll config data
        $settings = PayrollSetting::whereIn('group', [
            'payroll_tax', 'payroll_pension', 'payroll_nhf',
            'payroll_deductions', 'payroll_general',
        ])->orderBy('group')->orderBy('sort_order')->get()->groupBy('group');

        $data['settings']        = $settings;
        $data['currentSettings'] = $this->calculator->getSettings();

        // Employee compensation data
        $compensations = EmployeeCompensation::with(['employee', 'salaryStructure'])
            ->when($request->department, fn($q) => $q->whereHas('employee', fn($eq) => $eq->where('department', $request->department)))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->search, fn($q) => $q->where(function ($sq) use ($request) {
                $sq->whereHas('employee', fn($eq) => $eq->where('first_name', 'like', "%{$request->search}%")
                        ->orWhere('last_name', 'like', "%{$request->search}%")
                        ->orWhere('employee_id', 'like', "%{$request->search}%"));
            }))
            ->orderBy('effective_date', 'desc')
            ->paginate(20);

        $compensations->getCollection()->transform(function ($comp) {
            return [
                'id'                    => $comp->id,
                'employee_id'           => $comp->employee_id,
                'employee_name'         => $comp->employee->full_name ?? 'Unknown',
                'department'            => $comp->employee->department ?? '-',
                'location'              => $comp->employee->area ?? '-',
                'basic_salary'          => $comp->basic_salary,
                'effective_date'        => $comp->effective_date->format('Y-m-d'),
                'end_date'              => $comp->end_date?->format('Y-m-d'),
                'status'                => $comp->status,
                'salary_structure_name' => $comp->salaryStructure->name ?? null,
                'total_allowances'      => $comp->total_allowances,
                'total_deductions'      => $comp->total_deductions,
                'gross_salary'          => $comp->gross_salary,
                'net_salary'            => $comp->net_salary,
            ];
        });

        $data['employeeCompensations'] = $compensations;

        // Salary structures data
        $data['salaryStructures'] = SalaryStructure::withCount(['components', 'employeeCompensations'])
            ->orderBy('name')
            ->get()
            ->map(fn($s) => [
                'id'               => $s->id,
                'name'             => $s->name,
                'code'             => $s->code,
                'description'      => $s->description,
                'basic_salary_min' => $s->basic_salary_min,
                'basic_salary_max' => $s->basic_salary_max,
                'is_active'        => $s->is_active,
                'components_count' => $s->components_count,
                'employees_count'  => $s->employee_compensations_count,
            ]);

        $data['salaryComponents'] = SalaryComponent::orderBy('sort_order')->get();

        return Inertia::render('Settings/Payroll/Index', $data);
    }

    /**
     * Update payroll settings.
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings'         => 'required|array',
            'settings.*.key'   => 'required|string',
            'settings.*.value' => 'present',
        ]);

        foreach ($validated['settings'] as $settingData) {
            $setting = PayrollSetting::where('key', $settingData['key'])->first();

            if ($setting) {
                $setting->value = $settingData['value'];
                $setting->save();
            }
        }

        // Refresh calculator cache
        $this->calculator->refreshSettings();

        return redirect()
            ->route('settings.payroll.index')
            ->with('success', 'Payroll settings updated successfully.');
    }

    /**
     * Update tax brackets.
     */
    public function updateTaxBrackets(Request $request)
    {
        $validated = $request->validate([
            'brackets'        => 'required|array',
            'brackets.*.min'  => 'required|numeric|min:0',
            'brackets.*.max'  => 'nullable|numeric|gt:brackets.*.min',
            'brackets.*.rate' => 'required|numeric|min:0|max:100',
        ]);

        // Sort brackets by min value
        $brackets = collect($validated['brackets'])
            ->sortBy('min')
            ->values()
            ->toArray();

        PayrollSetting::set('tax.brackets', $brackets);

        // Refresh calculator cache
        $this->calculator->refreshSettings();

        return redirect()
            ->route('settings.payroll.index')
            ->with('success', 'Tax brackets updated successfully.');
    }

    public function preview(Request $request)
    {
        $request->validate([
            'basic_salary'   => 'required|numeric|min:0',
            'days_worked'    => 'nullable|integer|min:0',
            'days_absent'    => 'nullable|integer|min:0',
            'late_minutes'   => 'nullable|integer|min:0',
            'overtime_hours' => 'nullable|numeric|min:0',
        ]);

        $calculation = $this->calculator->calculatePayroll(
            basicSalary: (float) $request->basic_salary,
            daysWorked: (int) ($request->days_worked ?? 22),
            daysAbsent: (int) ($request->days_absent ?? 0),
            lateMinutes: (int) ($request->late_minutes ?? 0),
            overtimeHoursNormal: (float) ($request->overtime_hours ?? 0)
        );

        // Return as Inertia response, not JSON
        return Inertia::render('Settings/Payroll/Index', [
            'calculation' => $calculation,
            'settings'    => $this->calculator->getSettings(),
        ]);
    }
}
