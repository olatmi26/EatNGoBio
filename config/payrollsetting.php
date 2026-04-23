<?php
return [
    // Payroll working days and hours default settings
    'work_days_per_month'     => 22,
    'work_hours_per_day'      => 8,

    // Overtime multipliers
    'weekend' => [
        'multiplier' => 2.0,
    ],
    'holiday' => [
        'multiplier' => 2.5,
    ],
    'overtime' => [
        'multiplier' => 1.5,
    ],

    // Pension settings
    'pension' => [
        'enabled'            => true,
        'employee_rate'      => 8,
        'minimum_threshold'  => 0,
    ],

    // NHF (National Housing Fund) settings
    'nhf' => [
        'enabled'           => true,
        'employee_rate'     => 2.5,
        'minimum_threshold' => 3000,
    ],
];