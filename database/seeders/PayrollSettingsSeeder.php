<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PayrollSetting;

class PayrollSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = $this->getPayrollSettings();
        foreach ($settings as $setting) {
            PayrollSetting::updateOrCreate(
                ['key' => $setting['key']],
                $this->sanitizeSetting($setting)
            );
        }

        if (property_exists($this, 'command') && $this->command) {
            $this->command->info('Payroll settings seeded successfully!');
        }
    }

    /**
     * Get all payroll settings configuration.
     */
    private function getPayrollSettings(): array
    {
        return array_merge(
            $this->getTaxSettings(),
            $this->getPensionSettings(),
            $this->getNhfSettings(),
            $this->getDeductionSettings(),
            $this->getGeneralSettings()
        );
    }

    /**
     * Get tax related settings.
     */
    private function getTaxSettings(): array
    {
        return [
            [
                'key'         => 'tax.enabled',
                'value'       => true,
                'group'       => 'tax',
                'type'        => 'boolean',
                'label'       => 'Enable Tax Calculation',
                'description' => 'Enable or disable tax deductions',
                'sort_order'  => 1,
            ],
            [
                'key'         => 'tax.calculation_method',
                'value'       => 'graduated',
                'group'       => 'tax',
                'type'        => 'select',
                'options'     => [
                    ['value' => 'flat', 'label' => 'Flat Rate'],
                    ['value' => 'graduated', 'label' => 'Graduated (PAYE)'],
                ],
                'label'       => 'Tax Calculation Method',
                'description' => 'Choose how tax is calculated',
                'sort_order'  => 2,
            ],
            [
                'key'         => 'tax.flat_rate',
                'value'       => 10,
                'group'       => 'tax',
                'type'        => 'number',
                'label'       => 'Flat Tax Rate (%)',
                'description' => 'Percentage for flat tax calculation',
                'sort_order'  => 3,
            ],
            [
                'key'         => 'tax.brackets',
                'value'       => $this->getTaxBrackets(),
                'group'       => 'tax',
                'type'        => 'json',
                'label'       => 'Tax Brackets',
                'description' => 'Graduated tax brackets (annual income)',
                'sort_order'  => 4,
            ],
            [
                'key'         => 'tax.consolidated_relief',
                'value'       => 200000,
                'group'       => 'tax',
                'type'        => 'number',
                'label'       => 'Consolidated Relief Allowance (₦)',
                'description' => 'Annual consolidated relief allowance',
                'sort_order'  => 5,
            ],
        ];
    }

    /**
     * Get tax brackets configuration.
     */
    private function getTaxBrackets(): array
    {
        return [
            ['min' => 0, 'max' => 300000, 'rate' => 7],
            ['min' => 300001, 'max' => 600000, 'rate' => 11],
            ['min' => 600001, 'max' => 1100000, 'rate' => 15],
            ['min' => 1100001, 'max' => 1600000, 'rate' => 19],
            ['min' => 1600001, 'max' => 3200000, 'rate' => 21],
            ['min' => 3200001, 'max' => null, 'rate' => 24],
        ];
    }

    /**
     * Get pension related settings.
     */
    private function getPensionSettings(): array
    {
        return [
            [
                'key'         => 'pension.enabled',
                'value'       => true,
                'group'       => 'pension',
                'type'        => 'boolean',
                'label'       => 'Enable Pension Deduction',
                'description' => 'Enable or disable pension contributions',
                'sort_order'  => 10,
            ],
            [
                'key'         => 'pension.employee_rate',
                'value'       => 8,
                'group'       => 'pension',
                'type'        => 'number',
                'label'       => 'Employee Contribution (%)',
                'description' => 'Percentage of basic salary contributed by employee',
                'sort_order'  => 11,
            ],
            [
                'key'         => 'pension.employer_rate',
                'value'       => 10,
                'group'       => 'pension',
                'type'        => 'number',
                'label'       => 'Employer Contribution (%)',
                'description' => 'Percentage of basic salary contributed by employer',
                'sort_order'  => 12,
            ],
            [
                'key'         => 'pension.minimum_threshold',
                'value'       => 0,
                'group'       => 'pension',
                'type'        => 'number',
                'label'       => 'Minimum Salary Threshold (₦)',
                'description' => 'Minimum monthly salary for pension contribution',
                'sort_order'  => 13,
            ],
        ];
    }

    /**
     * Get NHF related settings.
     */
    private function getNhfSettings(): array
    {
        return [
            [
                'key'         => 'nhf.enabled',
                'value'       => true,
                'group'       => 'nhf',
                'type'        => 'boolean',
                'label'       => 'Enable NHF Deduction',
                'description' => 'Enable or disable National Housing Fund',
                'sort_order'  => 20,
            ],
            [
                'key'         => 'nhf.employee_rate',
                'value'       => 2.5,
                'group'       => 'nhf',
                'type'        => 'number',
                'label'       => 'NHF Rate (%)',
                'description' => 'Percentage of basic salary for NHF',
                'sort_order'  => 21,
            ],
            [
                'key'         => 'nhf.minimum_threshold',
                'value'       => 3000,
                'group'       => 'nhf',
                'type'        => 'number',
                'label'       => 'Minimum Salary Threshold (₦)',
                'description' => 'Minimum monthly salary for NHF contribution',
                'sort_order'  => 22,
            ],
        ];
    }

    /**
     * Get other deduction related settings.
     */
    private function getDeductionSettings(): array
    {
        return [
            [
                'key'         => 'deductions.nsitf.enabled',
                'value'       => true,
                'group'       => 'deductions',
                'type'        => 'boolean',
                'label'       => 'Enable NSITF',
                'description' => 'Nigeria Social Insurance Trust Fund',
                'sort_order'  => 30,
            ],
            [
                'key'         => 'deductions.nsitf.rate',
                'value'       => 1,
                'group'       => 'deductions',
                'type'        => 'number',
                'label'       => 'NSITF Rate (%)',
                'description' => 'Employer contribution rate for NSITF',
                'sort_order'  => 31,
            ],
        ];
    }

    /**
     * Get general payroll settings.
     */
    private function getGeneralSettings(): array
    {
        return [
            [
                'key'         => 'work_days_per_month',
                'value'       => 22,
                'group'       => 'general',
                'type'        => 'number',
                'label'       => 'Working Days per Month',
                'description' => 'Standard working days for salary calculation',
                'sort_order'  => 40,
            ],
            [
                'key'         => 'work_hours_per_day',
                'value'       => 8,
                'group'       => 'general',
                'type'        => 'number',
                'label'       => 'Working Hours per Day',
                'description' => 'Standard working hours for overtime calculation',
                'sort_order'  => 41,
            ],
            [
                'key'         => 'overtime.multiplier',
                'value'       => 1.5,
                'group'       => 'general',
                'type'        => 'number',
                'label'       => 'Overtime Multiplier',
                'description' => 'Hourly rate multiplier for overtime',
                'sort_order'  => 42,
            ],
            [
                'key'         => 'weekend.multiplier',
                'value'       => 2,
                'group'       => 'general',
                'type'        => 'number',
                'label'       => 'Weekend Multiplier',
                'description' => 'Hourly rate multiplier for weekend work',
                'sort_order'  => 43,
            ],
            [
                'key'         => 'holiday.multiplier',
                'value'       => 2.5,
                'group'       => 'general',
                'type'        => 'number',
                'label'       => 'Holiday Multiplier',
                'description' => 'Hourly rate multiplier for holiday work',
                'sort_order'  => 44,
            ],
        ];
    }

    /**
     * Sanitize setting data before insertion
     */
    private function sanitizeSetting(array $setting): array
    {
        // Convert boolean and numeric to string for DB (if necessary)
        if (isset($setting['type'])) {
            if ($setting['type'] === 'boolean') {
                $setting['value'] = (bool) $setting['value'] ? 1 : 0;
            }
            if ($setting['type'] === 'number') {
                $setting['value'] = is_numeric($setting['value']) ? (string) $setting['value'] : $setting['value'];
            }
            if ($setting['type'] === 'json' || $setting['type'] === 'array') {
                // always encode arrays/objects
                $setting['value'] = json_encode($setting['value']);
            }
            if (isset($setting['options']) && is_array($setting['options'])) {
                $setting['options'] = json_encode($setting['options']);
            }
        }
        // Default fields if not provided
        $defaults = [
            'options' => null,
            'sort_order' => 0,
            'label' => '',
            'description' => '',
            'group' => 'general'
        ];
        return array_merge($defaults, $setting);
    }
}
