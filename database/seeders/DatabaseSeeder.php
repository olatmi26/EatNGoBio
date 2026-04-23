<?php

namespace Database\Seeders;


use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
           // RolesAndPermissionsSeeder::class, // must be first
            
            LocationSeeder::class,
            DeviceSeeder::class, 
           // DepartmentSeeder::class,
           // UserSeeder::class,               // needs roles
           // AssetCategorySeeder::class,
           //AssetSeeder::class,              // needs locations, categories, users
           // TicketAndAlertSeeder::class,     // needs assets, locations, users
           // VendorSeeder::class,
            //SettingsSeeder::class,
            // SalaryComponentSeeder::class,
        ]);
    }
}
