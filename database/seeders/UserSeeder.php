<?php
namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name'            => 'Taiwo Hassan',
                'email'           => 'olaiya.hassan@eatngo-africa.com',
                'password'        => Hash::make('password'),
                'department_id'   => \App\Models\Department::where('name', 'Information Technology')->first()?->id,
                'avatar_initials' => 'JS',
                'status'          => 'Active',
                'role'            => 'Super Admin',
                'phone'           => '080' . rand(1, 9) . str_pad(strval(mt_rand(0, 99999999)), 8, '0', STR_PAD_LEFT),
                'location_id'     => \App\Models\Location::inRandomOrder()->first()?->id,

            ],
            [
                'name'            => 'Emeka Okafor',
                'email'           => 'emeka.okafor@eatngo-africa.com',
                'password'        => Hash::make('password'),
                'department_id'   => \App\Models\Department::where('name', 'Information Technology')->first()?->id,
                'avatar_initials' => 'EO',
                'status'          => 'Active',
                'phone'           => '081' . rand(1, 9) . str_pad(strval(mt_rand(0, 99999999)), 8, '0', STR_PAD_LEFT),
                'role'            => 'IT Officer',
                'location_id'     => \App\Models\Location::inRandomOrder()->first()?->id,
            ],
            [
                'name'            => 'Ngozi Adeyemi',
                'email'           => 'ngozi.adeyemi@eatngo-africa.com',
                'password'        => Hash::make('password'),
                'department_id'   => \App\Models\Department::where('name', 'Information Technology')->first()?->id,
                'avatar_initials' => 'NA',
                'status'          => 'Active',
                'role'            => 'IT Admin',
                'phone'           => '081' . rand(1, 9) . str_pad(strval(mt_rand(0, 99999999)), 8, '0', STR_PAD_LEFT),
                'location_id'     => \App\Models\Location::inRandomOrder()->first()?->id,
            ],
            [
                'name'            => 'Chidi Eze',
                'email'           => 'chidi.eze@eatngo-africa.com',
                'password'        => Hash::make('password'),
                'department_id'   => \App\Models\Department::where('name', 'Information Technology')->first()?->id,
                'avatar_initials' => 'CE',
                'status'          => 'Active',
                'role'            => 'IT Officer',
                'phone'           => '090' . rand(1, 9) . str_pad(strval(mt_rand(0, 99999999)), 8, '0', STR_PAD_LEFT),
                'location_id'     => \App\Models\Location::inRandomOrder()->first()?->id,
            ],
            [
                'name'            => 'Seun Afolabi',
                'email'           => 'seun.afolabi@eatngo-africa.com',
                'password'        => Hash::make('password'),
                'department_id'   => \App\Models\Department::where('name', 'Information Technology')->first()?->id,
                'avatar_initials' => 'SA',
                'status'          => 'Active',
                'role'            => 'IT Officer',
                'phone'           => '080' . rand(1, 9) . str_pad(strval(mt_rand(0, 99999999)), 8, '0', STR_PAD_LEFT),
                'location_id'     => \App\Models\Location::inRandomOrder()->first()?->id,
            ],
            [
                'name'            => 'Adaeze Nwosu',
                'email'           => 'adaeze.nwosu@eatngo-africa.com',
                'password'        => Hash::make('password'),
                'department_id'   => \App\Models\Department::where('name', 'Finance')->first()?->id,
                'avatar_initials' => 'AN',
                'status'          => 'Active',
                'role'            => null,
                'phone'           => '081' . rand(1, 9) . str_pad(strval(mt_rand(0, 99999999)), 8, '0', STR_PAD_LEFT),
                'location_id'     => \App\Models\Location::inRandomOrder()->first()?->id,
            ],
            [
                'name'            => 'Tunde Bakare',
                'email'           => 'tunde.bakare@eatngo-africa.com',
                'password'        => Hash::make('password'),
                'department_id'   => \App\Models\Department::where('name', 'Executives')->first()?->id,
                
                'avatar_initials' => 'TB',
                'status'          => 'Active',
                'role'            => null,
                'phone'           => '070' . rand(1, 9) . str_pad(strval(mt_rand(0, 99999999)), 8, '0', STR_PAD_LEFT),
                'location_id'     => \App\Models\Location::inRandomOrder()->first()?->id,
            ],
            [
                'name'            => 'Kemi Adebayo',
                'email'           => 'kemi.adebayo@eatngo-africa.com',
                'password'        => Hash::make('password'),
                'department_id'   => \App\Models\Department::where('name', 'Marketing / Brand Management')->first()?->id,
                'avatar_initials' => 'KA',
                'status'          => 'Active',
                'role'            => null,
                'phone'           => '090' . rand(1, 9) . str_pad(strval(mt_rand(0, 99999999)), 8, '0', STR_PAD_LEFT),
                'location_id'     => \App\Models\Location::inRandomOrder()->first()?->id,

            ],
            [
                'name'            => 'Blessing Okonkwo',
                'email'           => 'blessing.okonkwo@eatngo-africa.com',
                'password'        => Hash::make('password'),
                'department_id'   => \App\Models\Department::where('name', 'Operation')->first()?->id,                
                'avatar_initials' => 'BO',
                'status'          => 'Active',
                'role'            => null,
                'phone'           => '070' . rand(1, 9) . str_pad(strval(mt_rand(0, 99999999)), 8, '0', STR_PAD_LEFT),
                'location_id'     => \App\Models\Location::inRandomOrder()->first()?->id,
            ],
            [
                'name'            => 'Amaka Obi',
                'email'           => 'amaka.obi@eatngo-africa.com',
                'password'        => Hash::make('password'),
                'department_id'   => \App\Models\Department::where('name', 'Human Resources')->first()?->id,
                'avatar_initials' => 'AO',
                'status'          => 'Inactive',
                'role'            => null,
                'phone'           => '080' . rand(1, 9) . str_pad(strval(mt_rand(0, 99999999)), 8, '0', STR_PAD_LEFT),
                'location_id'     => \App\Models\Location::inRandomOrder()->first()?->id,
            ],
        ];

        foreach ($users as $data) {
            $role = $data['role'];
            unset($data['role']);

            $user = User::firstOrCreate(['email' => $data['email']], $data);

            if ($role) {
                $user->syncRoles([$role]);
            }
        }
    }
}
