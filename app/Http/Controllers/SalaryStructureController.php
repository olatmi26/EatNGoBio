<?php
// app/Http/Controllers/SalaryStructureController.php

namespace App\Http\Controllers;

use App\Models\SalaryComponent;
use App\Models\SalaryStructure;
use App\Models\SalaryStructureComponent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;

class SalaryStructureController extends Controller
{

  

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'                             => 'required|string|max:255',
            'code'                             => 'required|string|max:50|unique:salary_structures,code',
            'description'                      => 'nullable|string',
            'basic_salary_min'                 => 'required|numeric|min:0',
            'basic_salary_max'                 => 'required|numeric|min:0|gte:basic_salary_min',
            'components'                       => 'nullable|array',
            'components.*.salary_component_id' => 'required|integer',
            'components.*.calculation_type'    => 'required|in:fixed,percentage',
            'components.*.value'               => 'required|numeric|min:0',
            'components.*.name'                => 'nullable|string',
            'components.*.type'                => 'nullable|in:allowance,deduction',
        ]);

        $structure = SalaryStructure::create([
            'name'             => $validated['name'],
            'code'             => $validated['code'],
            'description'      => $validated['description'] ?? null,
            'basic_salary_min' => $validated['basic_salary_min'],
            'basic_salary_max' => $validated['basic_salary_max'],
            'is_active'        => true,
        ]);

        // Create structure components
        if (! empty($validated['components'])) {
            foreach ($validated['components'] as $component) {
                $componentId = (int) $component['salary_component_id'];

                // Check if this is a custom component (ID >= 1000000 or doesn't exist)
                $existingComponent = SalaryComponent::find($componentId);

                if (! $existingComponent || $componentId >= 1000000) {
                    // Create the salary component first
                    $newComponent = SalaryComponent::create([
                        'name'             => $component['name'] ?? 'Custom Component',
                        'code'             => 'CUSTOM_' . uniqid(),
                        'type'             => $component['type'] ?? 'allowance',
                        'calculation_type' => $component['calculation_type'],
                        'default_value'    => $component['value'],
                        'is_active'        => true,
                        'sort_order'       => 999,
                    ]);
                    $componentId = $newComponent->id;
                }

                SalaryStructureComponent::create([
                    'salary_structure_id' => $structure->id,
                    'salary_component_id' => $componentId,
                    'calculation_type'    => $component['calculation_type'],
                    'value'               => $component['value'],
                    'is_active'           => true,
                ]);
            }
        }

        return Redirect::to('/settings/payroll?tab=salary-structures')
            ->with('success', 'Salary structure created successfully.');
    }

    /**
     * Update salary structure
     */
    public function update(Request $request, SalaryStructure $structure)
    {
        $validated = $request->validate([
            'name'                             => 'required|string|max:255',
            'code'                             => 'required|string|max:50|unique:salary_structures,code,' . $structure->id,
            'description'                      => 'nullable|string',
            'basic_salary_min'                 => 'required|numeric|min:0',
            'basic_salary_max'                 => 'required|numeric|min:0|gte:basic_salary_min',
            'components'                       => 'nullable|array',
            'components.*.salary_component_id' => 'required',
            'components.*.calculation_type'    => 'required|in:fixed,percentage',
            'components.*.value'               => 'required|numeric|min:0',
        ]);

        $structure->update([
            'name'             => $validated['name'],
            'code'             => $validated['code'],
            'description'      => $validated['description'] ?? null,
            'basic_salary_min' => $validated['basic_salary_min'],
            'basic_salary_max' => $validated['basic_salary_max'],
        ]);

        // Update components if provided
        if (isset($validated['components'])) {
            // Remove existing components
            $structure->components()->delete();

            // Add new components
            foreach ($validated['components'] as $component) {
                $componentId = $component['salary_component_id'];

                // Handle custom components
                if (is_numeric($componentId) && $componentId >= 1000000) {
                    $newComponent = SalaryComponent::create([
                        'name'             => $component['name'] ?? 'Custom Component',
                        'code'             => 'CUSTOM_' . $componentId,
                        'type'             => 'allowance',
                        'calculation_type' => $component['calculation_type'],
                        'default_value'    => $component['value'],
                        'is_active'        => true,
                        'sort_order'       => 999,
                    ]);
                    $componentId = $newComponent->id;
                }

                SalaryStructureComponent::create([
                    'salary_structure_id' => $structure->id,
                    'salary_component_id' => $componentId,
                    'calculation_type'    => $component['calculation_type'],
                    'value'               => $component['value'],
                    'is_active'           => true,
                ]);
            }
        }

        return Redirect::to('/settings/payroll?tab=salary-structures')
            ->with('success', 'Salary structure updated successfully.');
    }

    /**
     * Toggle structure active status
     */
    public function toggle(SalaryStructure $structure)
    {
        $structure->update(['is_active' => ! $structure->is_active]);

        return Redirect::to('/settings/payroll?tab=salary-structures')
            ->with('success', 'Structure status updated.');
    }

    /**
     * Get structure details with components
     */
    public function show(SalaryStructure $structure)
    {
        $structure->load(['components.salaryComponent']);

        return response()->json([
            'structure'  => $structure,
            'components' => $structure->components->map(function ($comp) {
                return [
                    'id'               => $comp->id,
                    'name'             => $comp->salaryComponent->name,
                    'code'             => $comp->salaryComponent->code,
                    'type'             => $comp->salaryComponent->type,
                    'calculation_type' => $comp->calculation_type,
                    'value'            => $comp->value,
                    'is_active'        => $comp->is_active,
                ];
            }),
        ]);
    }

    /**
     * Delete salary structure
     */
    public function destroy(SalaryStructure $structure)
    {
        if ($structure->employeeCompensations()->count() > 0) {
            return back()->with('error', 'Cannot delete structure with active employees.');
        }

        $structure->components()->delete();
        $structure->delete();

        return Redirect::to('/settings/payroll?tab=salary-structures')
            ->with('success', 'Salary structure deleted.');
    }
}
