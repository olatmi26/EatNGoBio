<?php

namespace Database\Seeders;

use App\Models\Location;
use Illuminate\Database\Seeder;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $stores = [
            'SAKA',
            'ADMIRALTY',
            'TOYIN',
            'OGUNNAIKE',
            'APAPA',
            'RINGROAD',
            'AGUNGI',            
            'FESTAC',
            'BODIJA',
            'Bode Thomas',
            'AJAO',
            'AJOSE',
            'GBAGADA',
            'WUSE 2',
            'MAGODO',
            'GWARINPA',
            'YABA',
            'AGIDINGBI',
            'OGUDU',
            'IKOTUN',
            'AROMIRE',
            'ADMIRALTY II',
            'OKOTA',
            'EGBEDA',
            'SANGOTEDO',
            'ILUPEJU',
            'IKORODU',
            'IDIMU',
            'OKO OBA',
            'IJU',
            'GARKI',
            'MARYLAND',
            'ABEOKUTA',
            'JAKANDE',
            'OTA',
            'IKOYI',
            'PH',
            'SATELLITE',
            'JABI MALL',
            'GATEWAY MALL',
            'ITIRE',
            'APO MALL',
            'POLO PARK',
            'KUBWA',
            'AKURE',
            'ILORIN',
            'CALABAR',
            'PH 2',
            'BADORE',
            'UYO',
            'Peter Odili',
            'ASABA',
            'BENIN-SAPELE',
            'BENIN-UGBOWO',
            'ABA',
            'WARRI',
            'KANO BOMPAI',
            'CHALLENGE',
            'NYANYA',
            'CHOBA',
            'BARNAWA',
            'MINNA',
            'ALI AKILU',
            'AWKA',
            'OWERRI',
            'JOS',
            'ABIOLA WAY',
            'AKOBO',
            'LASU',
            'SAWMILL Ikorodu',
            'ONITSHA',
            'IKOTA',
            'AWOYAYA',
            'PRIME MALL',
            'FREEDOM WAY',
            'SURULERE',
            'SHELL PH 2',
            'PALMS Ibadan',
            'ICM',
            'Aggrey Road',
            'Kano Zoo',
            'Ikeja',
            'CHEVRON',

        ];

        $others = [
            ['name' => 'Central Support Unit',
             'type' => 'Head Office',
             'city' => 'Lagos'],
            ['name' => 'Magboro Commissary',     'type' => 'Commissary',  'city' => 'Ogun'],
            ['name' => 'Portharcourt Commissary','type' => 'Commissary', 'city' => 'Port Harcourt'],
            ['name' => 'Abuja Commissary',       'type' => 'Commissary',  'city' => 'Abuja'],
            ['name' => 'LAGOS COMMISSARY',       'type' => 'Commissary',  'city' => 'Lagos'],
            ['name' => 'MOWE Warehouse', 'type' => 'Ware House', 'city' => 'Ogun'],
   
        ];

        

        foreach ($stores as $name) {
            Location::firstOrCreate([
                'name' => $name], [
                'type' => 'Store',
                'city' => 'Nigeria',
                'asset_count' => 0,
                'code' => str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT),
           
                'timezone' => 'Africa/Lagos',
                'color' => '#16a34a',
            ]);
        }

        foreach ($others as $loc) {
            Location::firstOrCreate(['name' => $loc['name']], [
                'type'        => $loc['type'],
                'city'        => $loc['city'],
                'asset_count' => 0,
                'code' => str_pad((string)random_int(0, 9999), 4, '0', STR_PAD_LEFT),
                'timezone' => 'Africa/Lagos',
                'color' => '#16a34a',
            ]);
        }
    }
}
