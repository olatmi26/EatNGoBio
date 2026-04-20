<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Assets
            'assets.view', 'assets.create', 'assets.edit', 'assets.delete',
            'assets.allocate', 'assets.retire', 'assets.import', 'assets.export',
            // Tickets
            'tickets.view', 'tickets.create', 'tickets.manage', 'tickets.close',
            // Alerts
            'alerts.view', 'alerts.manage',
            // Maintenance
            'maintenance.view', 'maintenance.schedule', 'maintenance.log_cost',
            // Vendors
            'vendors.view', 'vendors.manage',
            // Reports
            'reports.view', 'reports.export',
            // Infrastructure
            'infrastructure.view', 'infrastructure.submit_check',
            // Locations
            'locations.view', 'locations.manage',
            // Users
            'users.view', 'users.manage',
            // Settings
            'settings.view', 'settings.manage',
            // Warranty
            'warranty.view', 'warranty.renew',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // Super Admin — all permissions
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin']);
        $superAdmin->syncPermissions(Permission::all());

        // IT Admin
        $itAdmin = Role::firstOrCreate(['name' => 'IT Admin']);
        $itAdmin->syncPermissions([
            'assets.view', 'assets.create', 'assets.edit', 'assets.allocate', 'assets.import', 'assets.export',
            'tickets.view', 'tickets.create', 'tickets.manage',
            'alerts.view', 'alerts.manage',
            'maintenance.view', 'maintenance.schedule', 'maintenance.log_cost',
            'vendors.view', 'vendors.manage',
            'reports.view', 'reports.export',
            'infrastructure.view', 'infrastructure.submit_check',
            'locations.view',
            'users.view',
            'settings.view',
            'warranty.view', 'warranty.renew',
        ]);

        // IT Officer
        $itOfficer = Role::firstOrCreate(['name' => 'IT Officer']);
        $itOfficer->syncPermissions([
            'assets.view',
            'tickets.view', 'tickets.create',
            'alerts.view',
            'maintenance.view', 'maintenance.schedule',
            'vendors.view',
            'reports.view',
            'infrastructure.view', 'infrastructure.submit_check',
            'locations.view',
            'warranty.view',
        ]);
    }
}
