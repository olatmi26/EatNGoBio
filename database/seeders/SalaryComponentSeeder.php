<?php
// database/seeders/SalaryComponentSeeder.php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SalaryComponentSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $components = [
            // Allowances
            [
                'name'             => 'Housing Allowance',
                'code'             => 'HA',
                'type'             => 'allowance',
                'calculation_type' => 'percentage',
                'default_value'    => 20,
                'is_taxable'       => false,
                'is_pensionable'   => true,
                'is_active'        => true,
                'sort_order'       => 1,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'name'             => 'Transport Allowance',
                'code'             => 'TA',
                'type'             => 'allowance',
                'calculation_type' => 'fixed',
                'default_value'    => 5000,
                'is_taxable'       => false,
                'is_pensionable'   => true,
                'is_active'        => true,
                'sort_order'       => 2,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'name'             => 'Meal Allowance',
                'code'             => 'MA',
                'type'             => 'allowance',
                'calculation_type' => 'fixed',
                'default_value'    => 3000,
                'is_taxable'       => false,
                'is_pensionable'   => true,
                'is_active'        => true,
                'sort_order'       => 3,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'name'             => 'Utility Allowance',
                'code'             => 'UA',
                'type'             => 'allowance',
                'calculation_type' => 'percentage',
                'default_value'    => 10,
                'is_taxable'       => false,
                'is_pensionable'   => true,
                'is_active'        => true,
                'sort_order'       => 4,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'name'             => 'Shift Allowance',
                'code'             => 'SA',
                'type'             => 'allowance',
                'calculation_type' => 'fixed',
                'default_value'    => 2000,
                'is_taxable'       => true,
                'is_pensionable'   => true,
                'is_active'        => true,
                'sort_order'       => 5,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'name'             => 'Hazard Allowance',
                'code'             => 'HZA',
                'type'             => 'allowance',
                'calculation_type' => 'percentage',
                'default_value'    => 5,
                'is_taxable'       => false,
                'is_pensionable'   => true,
                'is_active'        => true,
                'sort_order'       => 6,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],

            // Deductions
            [
                'name'             => 'Loan Repayment',
                'code'             => 'LR',
                'type'             => 'deduction',
                'calculation_type' => 'fixed',
                'default_value'    => 0,
                'is_taxable'       => false,
                'is_pensionable'   => false,
                'is_active'        => true,
                'sort_order'       => 7,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'name'             => 'Union Dues',
                'code'             => 'UD',
                'type'             => 'deduction',
                'calculation_type' => 'fixed',
                'default_value'    => 500,
                'is_taxable'       => false,
                'is_pensionable'   => false,
                'is_active'        => true,
                'sort_order'       => 8,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'name'             => 'Staff Welfare',
                'code'             => 'SW',
                'type'             => 'deduction',
                'calculation_type' => 'percentage',
                'default_value'    => 1,
                'is_taxable'       => false,
                'is_pensionable'   => false,
                'is_active'        => true,
                'sort_order'       => 9,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
            [
                'name'             => 'Salary Advance',
                'code'             => 'SAD',
                'type'             => 'deduction',
                'calculation_type' => 'fixed',
                'default_value'    => 0,
                'is_taxable'       => false,
                'is_pensionable'   => false,
                'is_active'        => true,
                'sort_order'       => 10,
                'created_at'       => $now,
                'updated_at'       => $now,
            ],
        ];

        foreach ($components as $component) {
            DB::table('salary_components')->updateOrInsert(
                ['code' => $component['code']],
                $component
            );
        }

        $this->command->info('Salary components seeded successfully!');
    }
}
