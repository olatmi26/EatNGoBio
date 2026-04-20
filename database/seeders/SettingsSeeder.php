<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'app_name',             'value' => 'Asset Management',                        'group' => 'general',       'is_public' => true],
            ['key' => 'company_name',         'value' => 'Eatngo Africa',              'group' => 'general',       'is_public' => true],
            ['key' => 'warranty_alert_days',  'value' => '30',                             'group' => 'notifications', 'is_public' => false],
            ['key' => 'license_alert_days',   'value' => '30',                             'group' => 'notifications', 'is_public' => false],
            ['key' => 'maintenance_reminder', 'value' => 'true',                           'group' => 'notifications', 'is_public' => false],
            ['key' => 'asset_prefix',         'value' => 'ITFRA',                          'group' => 'general',       'is_public' => false],
            ['key' => 'currency',             'value' => 'NGN',                            'group' => 'general',       'is_public' => true],
            ['key' => 'currency_symbol',      'value' => '₦',                              'group' => 'general',       'is_public' => true],
            ['key' => 'date_format',          'value' => 'Y-m-d',                          'group' => 'general',       'is_public' => true],
            ['key' => 'timezone',             'value' => 'Africa/Lagos',                   'group' => 'general',       'is_public' => true],
            ['key' => 'session_timeout',      'value' => '120',                            'group' => 'security',      'is_public' => false],
            ['key' => 'two_factor_auth',      'value' => 'false',                          'group' => 'security',      'is_public' => false],
            ['key' => 'annual_maint_budget',  'value' => '15000000',                        'group' => 'general',       'is_public' => false],
        ];

        foreach ($settings as $s) {
            Setting::firstOrCreate(['key' => $s['key']], $s);
        }
    }
}
