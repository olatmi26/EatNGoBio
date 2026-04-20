<?php

namespace Database\Seeders;

use App\Models\Device;
use App\Models\Location;
use Illuminate\Database\Seeder;

/**
 * Seeds all 87 EatNGo store biometric devices.
 * Data sourced from: Update_on_Clock_in_device_installation_eatngo
 *
 * Run: php artisan db:seed --class=DeviceSeeder
 */
class DeviceSeeder extends Seeder
{
    public function run(): void
    {
        $devices = [
            // ── Already connected to ZKBioTime (keep syncing to our server too) ──
            ['serial_number' => 'BQC2235300158', 'name' => 'HEAD OFFICE BIOMETRICS',     'area' => 'Central Support Unit',      'ip_address' => '172.16.1.196'],
            ['serial_number' => 'ECV3235300053', 'name' => 'MAGBORO COMMISSARY BIOMETRICS',        'area' => 'Magboro Commissary',   'ip_address' => '192.168.150.2'],
            ['serial_number' => 'BQC2254800046', 'name' => 'AGIDINGBI BIOMETRICS',      'area' => 'AGIDINGBI',            'ip_address' => '192.168.19.199'],
            ['serial_number' => 'BQC2254800045', 'name' => 'OGUDU BIOMETRICS',          'area' => 'OGUDU',                'ip_address' => '192.168.104.199'],
            ['serial_number' => 'BQC2254800021', 'name' => 'IKOTUN BIOMETRICS',         'area' => 'IKOTUN',               'ip_address' => '192.168.105.199'],
            ['serial_number' => 'BQC2254800020', 'name' => 'AROMIRE BIOMETRICS',        'area' => 'AROMIRE',        'ip_address' => '192.168.101.199'],
            ['serial_number' => 'BQC2254800166', 'name' => 'EGBEDA STORE BIOMETRICS',   'area' => 'EGBEDA',         'ip_address' => '192.168.25.199'],
            ['serial_number' => 'BQC2254800169', 'name' => 'ILUPEJU BIOMETRICS',  'area' => 'ILUPEJU',              'ip_address' => '192.168.108.199'],
            ['serial_number' => 'BQC2254800320', 'name' => 'TOYIN-STORE BIOMETRICS',    'area' => 'TOYIN',          'ip_address' => '192.168.3.199'],
            ['serial_number' => 'BQC2254800346', 'name' => 'MARYLAND BIOMETRICS',       'area' => 'MARYLAND',             'ip_address' => '192.168.115.199'],

            // ── PDF Store List — All Remaining Devices ──
            ['serial_number' => 'BQC2254800326', 'name' => 'BIOMETRICS SAKA',              'area' => 'SAKA',           'ip_address' => '192.168.155.199'],
            ['serial_number' => 'BQC2254800342', 'name' => 'BIOMETRICS ADMIRALTY',         'area' => 'ADMIRALTY',      'ip_address' => '192.168.2.199'],
            ['serial_number' => 'BQC2254800364', 'name' => 'BIOMETRICS OGUNNAIKE',         'area' => 'OGUNNAIKE',      'ip_address' => '192.168.4.199'],
            ['serial_number' => 'BQC2254800319', 'name' => 'BIOMETRICS APAPA',             'area' => 'APAPA',          'ip_address' => '192.168.5.199'],
            ['serial_number' => 'BQC2254800366', 'name' => 'BIOMETRICS RING ROAD',         'area' => 'RING ROAD',      'ip_address' => '192.168.6.199'],
            ['serial_number' => 'BQC2254800396', 'name' => 'BIOMETRICS AGUNGI',            'area' => 'AGUNGI',         'ip_address' => '192.168.7.199'],
            ['serial_number' => 'BQC2254800378', 'name' => 'BIOMETRICS FESTAC',            'area' => 'FESTAC',         'ip_address' => '192.168.8.199'],
            ['serial_number' => 'BQC2254800363', 'name' => 'BIOMETRICS BODIJA',            'area' => 'BODIJA',         'ip_address' => '192.168.10.199'],
            ['serial_number' => 'BQC2254800397', 'name' => 'BIOMETRICS BODE THOMAS',       'area' => 'BODE THOMAS',    'ip_address' => '192.168.9.199'],
            ['serial_number' => 'BQC2254800023', 'name' => 'BIOMETRICS AJAO',              'area' => 'AJAO',           'ip_address' => '192.168.11.199'],
            ['serial_number' => 'BQC2254800343', 'name' => 'BIOMETRICS AJOSE',             'area' => 'AJOSE',          'ip_address' => '192.168.106.199'],
            ['serial_number' => 'BQC2254800356', 'name' => 'BIOMETRICS GBAGADA',           'area' => 'GBAGADA',        'ip_address' => '192.168.13.199'],
            ['serial_number' => 'BQC2254800355', 'name' => 'BIOMETRICS WUSE 2',            'area' => 'WUSE 2',         'ip_address' => '192.168.14.199'],
            ['serial_number' => 'BQC2254800107', 'name' => 'BIOMETRICS MAGODO',            'area' => 'MAGODO',         'ip_address' => '192.168.15.199'],
            ['serial_number' => 'BQC2254800354', 'name' => 'BIOMETRICS CHEVRON',           'area' => 'CHEVRON',        'ip_address' => '192.168.102.199'],
            ['serial_number' => 'BQC2254800382', 'name' => 'BIOMETRICS GWARINPA',          'area' => 'GWARINPA',       'ip_address' => '192.168.17.199'],
            ['serial_number' => 'BQC2254800047', 'name' => 'BIOMETRICS YABA',              'area' => 'YABA',           'ip_address' => '192.168.18.199'],
            ['serial_number' => 'BQC2254800032', 'name' => 'BIOMETRICS ADMIRALTY II',      'area' => 'ADMIRALTY II',   'ip_address' => '192.168.103.199'],
            ['serial_number' => 'BQC2254800174', 'name' => 'BIOMETRICS OKOTA',             'area' => 'OKOTA',          'ip_address' => '192.168.24.199'],
            ['serial_number' => 'BQC2254800168', 'name' => 'BIOMETRICS SANGOTEDO',         'area' => 'SANGOTEDO',      'ip_address' => '192.168.107.199'],
            ['serial_number' => 'BQC2254800170', 'name' => 'BIOMETRICS IKORODU',           'area' => 'IKORODU',        'ip_address' => '192.168.109.199'],
            ['serial_number' => 'BQC2254800167', 'name' => 'BIOMETRICS IDIMU',             'area' => 'IDIMU',          'ip_address' => '192.168.110.199'],
            ['serial_number' => 'BQC2254800362', 'name' => 'BIOMETRICS OKO OBA',           'area' => 'OKO OBA',        'ip_address' => '192.168.112.199'],
            ['serial_number' => 'BQC2254800345', 'name' => 'BIOMETRICS IJU',               'area' => 'IJU',            'ip_address' => '192.168.113.199'],
            ['serial_number' => 'BQC2254800321', 'name' => 'BIOMETRICS GARKI',             'area' => 'GARKI',          'ip_address' => '192.168.114.199'],
            ['serial_number' => 'BQC2254800347', 'name' => 'BIOMETRICS ABEOKUTA',          'area' => 'ABEOKUTA',       'ip_address' => '192.168.116.199'],
            ['serial_number' => 'BQC2254800360', 'name' => 'BIOMETRICS JAKANDE',           'area' => 'JAKANDE',        'ip_address' => '192.168.120.199'],
            ['serial_number' => 'BQC2254800197', 'name' => 'BIOMETRICS OTA',               'area' => 'OTA',            'ip_address' => '192.168.121.199'],
            ['serial_number' => 'BQC2254800323', 'name' => 'BIOMETRICS IKOYI',             'area' => 'IKOYI',          'ip_address' => '192.168.123.199'],
            ['serial_number' => 'BQC2254800198', 'name' => 'BIOMETRICS PH',                'area' => 'PH',             'ip_address' => '192.168.125.199'],
            ['serial_number' => 'BQC2254800200', 'name' => 'BIOMETRICS Satellite',         'area' => 'Satellite',      'ip_address' => '192.168.126.199'],
            ['serial_number' => 'BQC2254800203', 'name' => 'BIOMETRICS Jabi Mall',         'area' => 'Jabi Mall',      'ip_address' => '192.168.132.199'],
            ['serial_number' => 'BQC2254800201', 'name' => 'BIOMETRICS Gateway Mall',      'area' => 'Gateway Mall',   'ip_address' => '192.168.133.199'],
            ['serial_number' => 'BQC2254800202', 'name' => 'BIOMETRICS Itire',             'area' => 'Itire',          'ip_address' => '192.168.136.199'],
            ['serial_number' => 'BQC2254800068', 'name' => 'BIOMETRICS Apo Mall',          'area' => 'Apo Mall',       'ip_address' => '192.168.137.199'],
            ['serial_number' => 'BQC2254800058', 'name' => 'BIOMETRICS Polo Park',         'area' => 'Polo Park',      'ip_address' => '192.168.138.199'],
            ['serial_number' => 'BQC2254800067', 'name' => 'BIOMETRICS Kubwa',             'area' => 'Kubwa',          'ip_address' => '192.168.139.199'],
            ['serial_number' => 'BQC2254800065', 'name' => 'BIOMETRICS Akure',             'area' => 'Akure',          'ip_address' => '192.168.140.199'],
            ['serial_number' => 'BQC2254800066', 'name' => 'BIOMETRICS Ilorin',            'area' => 'Ilorin',         'ip_address' => '192.168.141.199'],
            ['serial_number' => 'BQC2254800124', 'name' => 'BIOMETRICS Calabar',           'area' => 'Calabar',        'ip_address' => '192.168.142.199'],
            ['serial_number' => 'BQC2254800122', 'name' => 'BIOMETRICS Shell Gate PH 2',   'area' => 'SHELL PH 2','ip_address' => '192.168.143.199'],
            ['serial_number' => 'BQC2254800115', 'name' => 'BIOMETRICS Jara Mall',         'area' => 'Jara Mall',      'ip_address' => '192.168.144.199'],
            ['serial_number' => 'BQC2254800123', 'name' => 'BIOMETRICS Badore',            'area' => 'Badore',         'ip_address' => '192.168.145.199'],
            ['serial_number' => 'BQC2254800103', 'name' => 'BIOMETRICS Uyo',               'area' => 'Uyo',            'ip_address' => '192.168.146.199'],
            ['serial_number' => 'BQC2254800071', 'name' => 'BIOMETRICS Peter-Odili',       'area' => 'Peter Odili',    'ip_address' => '192.168.147.199'],
            ['serial_number' => 'BQC2254800256', 'name' => 'BIOMETRICS Asaba',             'area' => 'Asaba',          'ip_address' => '192.168.148.199'],
            ['serial_number' => 'BQC2254800121', 'name' => 'BIOMETRICS Benin Sapele',      'area' => 'Benin Sapele',   'ip_address' => '192.168.149.199'],
            ['serial_number' => 'BQC2254800373', 'name' => 'BIOMETRICS Benin Ugbowo',      'area' => 'Benin Ugbowo',   'ip_address' => '192.168.151.199'],
            ['serial_number' => 'BQC2254800331', 'name' => 'BIOMETRICS Aba',               'area' => 'Aba',            'ip_address' => '192.168.153.199'],
            ['serial_number' => 'BQC2254800328', 'name' => 'BIOMETRICS Kano Bompai',       'area' => 'Kano Bompai',    'ip_address' => '192.168.154.199'],
            ['serial_number' => 'BQC2254800329', 'name' => 'BIOMETRICS Warri',             'area' => 'Warri',          'ip_address' => '192.168.156.199'],
           
            ['serial_number' => 'BQC2254800348', 'name' => 'BIOMETRICS Challenge',         'area' => 'Challenge',      'ip_address' => '192.168.158.199'],
            ['serial_number' => 'BQC2254800349', 'name' => 'BIOMETRICS Nyanya',            'area' => 'Nyanya',         'ip_address' => '192.168.159.199'],
            ['serial_number' => 'BQC2254800086', 'name' => 'BIOMETRICS Choba',             'area' => 'Choba',          'ip_address' => '192.168.160.199'],
            ['serial_number' => 'BQC2254800088', 'name' => 'BIOMETRICS Barnawa',           'area' => 'Barnawa',        'ip_address' => '192.168.161.199'],
            ['serial_number' => 'BQC2254800087', 'name' => 'BIOMETRICS Minna',             'area' => 'Minna',          'ip_address' => '192.168.162.199'],
            ['serial_number' => 'BQC2254800091', 'name' => 'BIOMETRICS Ali Akilu',         'area' => 'Ali Akilu',      'ip_address' => '192.168.163.199'],
            ['serial_number' => 'BQC2254800090', 'name' => 'BIOMETRICS Awka',              'area' => 'Awka',           'ip_address' => '192.168.164.199'],
            ['serial_number' => 'BQC2254800085', 'name' => 'BIOMETRICS Owerri',            'area' => 'Owerri',         'ip_address' => '192.168.165.199'],
            ['serial_number' => 'BQC2254800358', 'name' => 'BIOMETRICS Jos',               'area' => 'Jos',            'ip_address' => '192.168.167.199'],
            ['serial_number' => 'BQC2254800359', 'name' => 'BIOMETRICS Yenagoa',           'area' => 'Yenagoa',        'ip_address' => '192.168.168.199'],
            ['serial_number' => 'BQC2254800392', 'name' => 'BIOMETRICS Abiola Way',        'area' => 'Abiola Way',     'ip_address' => '192.168.169.199'],
            ['serial_number' => 'BQC2254800357', 'name' => 'BIOMETRICS Akobo',             'area' => 'Akobo',          'ip_address' => '192.168.170.199'],
            ['serial_number' => 'BQC2254800394', 'name' => 'BIOMETRICS Lasu Iba',          'area' => 'Lasu Iba',       'ip_address' => '192.168.166.199'],
            ['serial_number' => 'BQC2254800393', 'name' => 'BIOMETRICS Sawmill Ikorodu',   'area' => 'Sawmill Ikorodu','ip_address' => '192.168.171.199'],
            ['serial_number' => 'BQC2254800251', 'name' => 'BIOMETRICS Onitsha',           'area' => 'Onitsha',        'ip_address' => '192.168.172.199'],
            ['serial_number' => 'BQC2254800261', 'name' => 'BIOMETRICS Ikota',             'area' => 'Ikota',          'ip_address' => '192.168.173.199'],
            ['serial_number' => 'BQC2254800254', 'name' => 'BIOMETRICS Awoyaya',           'area' => 'Awoyaya',        'ip_address' => '192.168.174.199'],
            ['serial_number' => 'BQC2254800252', 'name' => 'BIOMETRICS Prime Mall',        'area' => 'Prime Mall',     'ip_address' => '192.168.175.199'],
            ['serial_number' => 'BQC2254800255', 'name' => 'BIOMETRICS Freedom',           'area' => 'Freedom',        'ip_address' => '192.168.176.199'],
            ['serial_number' => 'BQC2254800012', 'name' => 'BIOMETRICS Mowe Warehouse',    'area' => 'Mowe Warehouse', 'ip_address' => '192.168.177.199'],
        ];

        $this->command->info('Seeding ' . count($devices) . ' devices...');

        foreach ($devices as $device) {
            Device::updateOrCreate(
                ['serial_number' => $device['serial_number']],
                array_merge($device, [
                    'status'        => 'unknown',
                    'location_id' => Location::where('name', $device['area'])->first()?->id,
                    'approved'      => true,
                ])
            );
        }

        $this->command->info('Done! All ' . count($devices) . ' EatNGo biometric devices registered.');
    }
}
