<?php
namespace Database\Seeders;

use App\Models\Department;
use App\Models\Position;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class PositionSeeder extends Seeder
{
    public function run(): void
    {
        $positions = [
            'CEO',
            'pizza maker',
            'Security Officer',
            'Internal Control officer',
            'Finance',
            'Human Resources',
            'Commissary Officer',
            'Legal & Compliance',
            'Maintenance Manager',
            'HR Manager',
            'Marketing manager',
            'Marketing Officer',
            'Operations Manager',
            'Maintenance Officer',
            'Maintenance Manaager',
            'Logistics & Fleet manager',
            'Logistics & Fleet officer',
            'Dispatch Rider',
            'Store keeper',
            'House Keeping',
            'Technician',
            'Driver',
            'Group Head overnance & Control',
            'Supply Chain officer',
            'Executives',
            'CSC General',           
            'DP-Commissary',
            'DP General',
            'Field Governance Manager',
            'HR Admin Officer',
            'Learning Operations Compliance Officer',
            'Assistance IT Manager',
            'Network and Cybersecurity Officer',
            'Network Admin Executive',
            'Software Nav App Officer',
            'National IT Support Executive',
            'IT Support Officer',
            'Hardware and System Admin',
            'Store CSC',
            'IT Operational Lead',
            'Web Manager',
            'Software Microsoft Navition App Admin',
            'Head of IT',
            'Operations (PB, CSC, DP, SB)'

        ];
        // Freshly update or create, to always set slug and code using model events
        foreach ($positions as $name) {
            // Always ensure we assign a code before saving (unique + not null constraint)
            $position = Position::firstOrNew(['name' => $name]);
            $position->name = $name;
            $position->slug = Str::slug($position->name);

            // Ensure a unique, non-null code BEFORE saving
            if (empty($position->code) || ! preg_match('/^\d+$/', $position->code)) {
                // Find maximum numeric code in the database
                $maxNumber = Position::whereRaw('code REGEXP "^[0-9]+$"')
                    ->pluck('code')
                    ->map(function ($code) {
                        return is_numeric($code) ? intval($code) : null;
                    })
                    ->filter()
                    ->max() ?? 999;

                $position->code = strval($maxNumber + 1);
            }

            $position->save();
        }
    }

}
