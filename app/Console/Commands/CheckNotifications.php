<?php
namespace App\Console\Commands;

use App\Services\NotificationService;
use Illuminate\Console\Command;

class CheckNotifications extends Command
{
    protected $signature   = 'notifications:check';
    protected $description = 'Run all notification checks: offline devices, consecutive absences, biometric pending';

    public function __construct(private NotificationService $service)
    {
        parent::__construct();
    }

    public function handle(): void
    {
        $this->info('Running notification checks...');
        $this->service->runChecks();
        $this->info('Done.');
    }
}

/*
|--------------------------------------------------------------------------
| SCHEDULE SETUP (routes/console.php or bootstrap/app.php)
|--------------------------------------------------------------------------
|
| Add to routes/console.php:
|
|   use Illuminate\Support\Facades\Schedule;
|
|   Schedule::command('devices:mark-offline')->everyMinute();
|   Schedule::command('notifications:check')->everyFifteenMinutes();
|
| Also register commands in bootstrap/app.php:
|
|   ->withCommands([
|       App\Console\Commands\MarkDevicesOffline::class,
|       App\Console\Commands\CheckNotifications::class,
|   ])
|
| Cron entry on server:
|   * * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
|
*/
