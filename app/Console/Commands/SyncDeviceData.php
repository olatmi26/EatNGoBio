<?php
namespace App\Console\Commands;

use App\Models\Device;
use App\Services\DeviceOperationService;
use App\Services\DeviceService;
use Illuminate\Console\Command;

class SyncDeviceData extends Command
{
    protected $signature = 'device:sync-data {serial?} {--force}';
    protected $description = 'Force sync device counts and verify biometric data';

    public function __construct(
        private DeviceOperationService $operationService,
        private DeviceService $deviceService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $serial = $this->argument('serial');
        $force = $this->option('force');
        
        $query = Device::where('approved', true);
        if ($serial) {
            $query->where('serial_number', $serial);
        }
        
        $devices = $query->get();

        if ($devices->isEmpty()) {
            $this->error('No devices found.');
            return self::FAILURE;
        }   
        
        foreach ($devices as $device) {
            // Ensure $device is an Eloquent Device model (not stdClass)
            if (!($device instanceof Device)) {
                $device = Device::find($device->id);
                if (!$device) {
                    $this->error("Device with ID {$device->id} not found.");
                    continue;
                }
            }

            $this->info("Syncing device: {$device->name} ({$device->serial_number})");

            $counts = $this->deviceService->forceSyncDeviceCounts($device);

            $this->info("  Users: {$counts['users']}");
            $this->info("  Fingerprints: {$counts['fingerprints']}");
            $this->info("  Faces: {$counts['faces']}");

            // Optionally trigger a manual pull
            if ($force && $device->is_online) {
                $this->info("  Triggering manual data pull...");
                // You can add command sending here
            }
        }
        
        return \Symfony\Component\Console\Command\Command::SUCCESS;
   
    }
}