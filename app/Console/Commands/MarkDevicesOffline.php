<?php
namespace App\Console\Commands;

use App\Models\Device;
use Illuminate\Console\Command;

class MarkDevicesOffline extends Command
{
    protected $signature   = 'devices:mark-offline';
    protected $description = 'Mark devices as offline if they have not sent a heartbeat recently';

    public function handle(): void
    {
        $updated = Device::where('approved', true)
            ->where('status', 'online')
            ->where(function ($q) {
                $q->whereNull('last_seen')
                  ->orWhereRaw('last_seen < NOW() - INTERVAL (heartbeat_interval * 2 + 60) SECOND');
            })
            ->update(['status' => 'offline']);

        $this->info("Marked {$updated} device(s) offline.");
    }
}
