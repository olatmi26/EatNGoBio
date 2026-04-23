<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Console\Scheduling\Schedule;

/**
 * Console command to display an inspiring quote.
 */
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Register placeholder commands for any additional manual scheduling ease/readability
Artisan::command('schedule:device-pull-attendance-morning', fn () => null)
    ->purpose('Schedule device attendance pull every 5 mins (morning)');
Artisan::command('schedule:device-pull-attendance-evening', fn () => null)
    ->purpose('Schedule device attendance pull every 5 mins (evening)');

app()->booted(function () {
    $schedule = app(Schedule::class);

    // Device attendance pull: 5-min intervals, morning/evening sessions, deduped log output
    foreach ([['6:20', '11:30'], ['16:30', '20:30']] as [$start, $end]) {
        $schedule->command('device:pull --type=attendance')
            ->everyFiveMinutes()
            ->between($start, $end)
            ->withoutOverlapping()
            ->appendOutputTo(storage_path('logs/device-pull-attendance.log'));
    }

    // Pull user data every hour except at night (active 7:00-23:00, deduped output)
    $schedule->command('device:pull --type=users')
        ->hourly()
        ->between('6:00', '21:00')
        ->withoutOverlapping()
        ->appendOutputTo(storage_path('logs/device-pull-users.log'));
 

    // Full sync at midnight and noon
    $schedule->command('device:pull --type=all')
        ->twiceDaily(0, 12)
        ->withoutOverlapping()
        ->appendOutputTo(storage_path('logs/device-pull-full.log'));

    // Clean up commands daily at 03:00
    $schedule->command('device:cleanup-commands')
        ->dailyAt('03:00')
        ->appendOutputTo(storage_path('logs/device-cleanup.log'));

    // Run notification rules hourly
    $schedule->call(fn () =>
        app(\App\Services\NotificationRuleEngine::class)->evaluateAll()
    )->hourly();
});
