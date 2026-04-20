<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Optional: Clear existing data (uncomment if you want to reset on every seed)
        // DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        // Permission::truncate();
        // Role::truncate();
        // DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // ==================== PERMISSIONS ====================

        $permissions = [
            // Dashboard
            'view_dashboard',

            // Devices
            'view_devices',
            'add_devices',
            'edit_devices',
            'delete_devices',
            'send_device_commands',

            // Employees
            'view_employees',
            'add_employees',
            'edit_employees',
            'delete_employees',
            'personnel_transfer',

            // Biometric Actions
            'biometric_actions',

            // Attendance
            'view_attendance',
            'edit_attendance',
            'export_attendance',

            // Shifts
            'view_shifts',
            'manage_shifts',
            'assign_shifts',

            // Reports
            'view_reports',
            'export_reports',
            'view_payroll',

            // Organization
            'view_organization',
            'manage_organization',

            // Settings
            'view_settings',
            'manage_settings',

            // User Management
            'view_users',
            'manage_users',
            'manage_roles',

            // Live Monitor
            'view_live_monitor',
        ];

        // Create permissions
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // ==================== ROLES ====================

        // Super Admin - Has ALL permissions
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin']);
        $superAdmin->syncPermissions(Permission::all());

        // Admin - Has almost everything (you can adjust)
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions([
            'view_dashboard',
            'view_devices', 'add_devices', 'edit_devices', 'delete_devices', 'send_device_commands',
            'view_employees', 'add_employees', 'edit_employees', 'delete_employees', 'personnel_transfer',
            'biometric_actions',
            'view_attendance', 'edit_attendance', 'export_attendance',
            'view_shifts', 'manage_shifts', 'assign_shifts',
            'view_reports', 'export_reports', 'view_payroll',
            'view_organization', 'manage_organization',
            'view_settings', 'manage_settings',
            'view_users', 'manage_users', 'manage_roles',
            'view_live_monitor',
        ]);

        // HR Manager (example role)
        $hrManager = Role::firstOrCreate(['name' => 'hr-manager']);
        $hrManager->syncPermissions([
            'view_dashboard',
            'view_employees', 'add_employees', 'edit_employees', 'delete_employees', 'personnel_transfer',
            'biometric_actions',
            'view_attendance', 'edit_attendance', 'export_attendance',
            'view_shifts', 'manage_shifts', 'assign_shifts',
            'view_reports', 'export_reports', 'view_payroll',
            'view_organization',
        ]);

        // Supervisor / Manager (limited access)
        $supervisor = Role::firstOrCreate(['name' => 'supervisor']);
        $supervisor->syncPermissions([
            'view_dashboard',
            'view_devices',
            'view_employees',
            'view_attendance',
            'view_shifts',
            'view_reports',
            'view_live_monitor',
        ]);

        // Employee (basic access - adjust as needed)
        $employee = Role::firstOrCreate(['name' => 'employee']);
        $employee->syncPermissions([
            'view_dashboard',
            'view_attendance',
            'view_shifts',
        ]);

        // Data Analyst Officer (role with access to reports and attendance, adjust as needed)
        $dataAnalyst = Role::firstOrCreate(['name' => 'data-analyst']);
        $dataAnalyst->syncPermissions([
            'view_dashboard',
            'view_attendance',
            'view_reports',
            'export_reports',
        ]);


        // Registerer (person who can enroll employee on the device)
        $registerer = Role::firstOrCreate(['name' => 'registerer']);
        $registerer->syncPermissions([
            'view_employees',
            'biometric_actions',
            'view_devices',
        ]);



        echo "Roles and Permissions seeded successfully!\n";
    }
}