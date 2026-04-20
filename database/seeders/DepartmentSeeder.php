<?php
namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            'Production',
            'pizza maker',
            'Warehouse',
            'Quality Control',
            'Security',
            'Internal Control',
            'Finance',
            'Human Resources',
            'Information Technology',
            'Legal & Compliance',
            'Marketing / Brand Management',
            'Commissary (CSC & DP)',
            'Marketing',
            'Project Development',
            'Warehouse & Logistics',
            'LOC (DP, CSC & PB Training)',
            'Supply Chain',
            'Operations (PB, CSC, DP, SB)',
            'Maintenance',
            'Logistics & Fleet',
            'Dispatch Rider',
            'Store',
            'House Keeping',
            'Project & Development',
            'Supply Chain',
            'Executives',
            'CSC General',
            'Development',
            'DP-Commissary',
            'DP General',
            'Field Governance',
            'HR and Admin',
            'Learning Operations Compliance',
            
        ];
        // Freshly update or create, to always set slug and code using model events
        foreach ($departments as $name) {
            // Get or create, then always save so model boot events are triggered for slug/code
            $department = Department::firstOrNew(['name' => $name]);
            // Setting name here re-triggers booted to generate slug/code
            $department->name = $name;
            $department->slug = Str::slug($department->name);
            $department->save();

            // Ensure the latest format of code (DEPT-#####) if missing or out of sequence
            // If the code already exists and matches the pattern, respect it (don't overwrite)
            if (empty($department->code) || ! preg_match('/^DEPT-\d+$/', $department->code)) {
                // Find maximum DEPT-xxxxx code in database
                $maxNumber = Department::where('code', 'LIKE', 'DEPT-%')
                    ->pluck('code')
                    ->map(function ($code) {
                        if (preg_match('/DEPT-(\d+)/', $code, $m)) {
                            return intval($m[1]);
                        }
                        return null;
                    })
                    ->filter()
                    ->max() ?? 10000;

                $department->code = 'DEPT-' . ($maxNumber + 1);
            }
            $department->save();

        }
    }

}
