<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class PayrollApprovalWorkflowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();
        DB::table('payroll_approval_routes')->truncate();
        DB::table('payroll_period_approvals')->truncate();
        DB::table('payroll_approval_levels')->truncate();
        DB::table('payroll_approval_workflows')->truncate();
        Schema::enableForeignKeyConstraints();

        // Seed multiple workflow options
        $this->seedDefaultWorkflow();
        $this->seedSimpleWorkflow();
        $this->seedExtendedWorkflow();

        $this->command->info('Payroll approval workflows seeded successfully!');
    }

    /**
     * Seed the default approval workflow
     */
    private function seedDefaultWorkflow(): void
    {
        $workflowId = DB::table('payroll_approval_workflows')->insertGetId([
            'name'        => 'Standard Approval Workflow',
            'description' => 'Standard three-level approval workflow (Preparer → Reviewer → Approver)',
            'is_active'   => true,
            'is_default'  => true,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $levels = [
            ['name' => 'Payroll Preparer', 'code' => 'preparer_std', 'order' => 1, 'can_edit' => true],
            ['name' => 'Payroll Reviewer', 'code' => 'reviewer_std', 'order' => 2, 'can_edit' => false],
            ['name' => 'Payroll Approver', 'code' => 'approver_std', 'order' => 3, 'can_edit' => false],
        ];

        $this->createLevels($workflowId, $levels);
    }

    /**
     * Seed simple two-level workflow
     */
    private function seedSimpleWorkflow(): void
    {
        $workflowId = DB::table('payroll_approval_workflows')->insertGetId([
            'name'        => 'Simple Approval Workflow',
            'description' => 'Simple two-level approval workflow (Preparer → Approver)',
            'is_active'   => true,
            'is_default'  => false,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $levels = [
            ['name' => 'Payroll Preparer', 'code' => 'preparer_simple', 'order' => 1, 'can_edit' => true],
            ['name' => 'Payroll Approver', 'code' => 'approver_simple', 'order' => 2, 'can_edit' => false],
        ];

        $this->createLevels($workflowId, $levels);
    }

    /**
     * Seed extended five-level workflow
     */
    private function seedExtendedWorkflow(): void
    {
        $workflowId = DB::table('payroll_approval_workflows')->insertGetId([
            'name'        => 'Extended Approval Workflow',
            'description' => 'Extended five-level approval workflow for large organizations',
            'is_active'   => false, // Not active by default
            'is_default'  => false,
            'created_at'  => now(),
            'updated_at'  => now(),
        ]);

        $levels = [
            ['name' => 'Payroll Officer', 'code' => 'officer_ext', 'order' => 1, 'can_edit' => true],
            ['name' => 'Payroll Supervisor', 'code' => 'supervisor_ext', 'order' => 2, 'can_edit' => false],
            ['name' => 'HR Manager', 'code' => 'hr_manager_ext', 'order' => 3, 'can_edit' => false],
            ['name' => 'Finance Manager', 'code' => 'finance_manager_ext', 'order' => 4, 'can_edit' => false],
            ['name' => 'Director', 'code' => 'director_ext', 'order' => 5, 'can_edit' => false],
        ];

        $this->createLevels($workflowId, $levels);
    }

    /**
     * Helper method to create approval levels
     */
    private function createLevels(int $workflowId, array $levels): void
    {
        foreach ($levels as $level) {
            DB::table('payroll_approval_levels')->insert([
                'workflow_id' => $workflowId,
                'name'        => $level['name'],
                'code'        => $level['code'],
                'order'       => $level['order'],
                'is_required' => true,
                'can_reject'  => true,
                'can_edit'    => $level['can_edit'],
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }
    }
}
