<?php

namespace App\Console\Commands;

use App\Models\DeviceCommand;
use Illuminate\Console\Command;

class CleanupDeviceCommands extends Command
{
    protected $signature = 'device:cleanup-commands {--days=7 : Days to keep completed commands}';
    protected $description = 'Clean up old device commands';

    

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = $this->option('days');
        
        $deleted = DeviceCommand::where('status', '!=', 'pending')
            ->where('created_at', '<', now()->subDays($days))
            ->delete();
        
        $this->info("✅ Deleted {$deleted} old device commands.");
        
        return \Symfony\Component\Console\Command\Command::SUCCESS;
   
    }
}
