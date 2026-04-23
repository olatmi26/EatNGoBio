<?php

namespace App\Console\Commands;

use App\Models\Device;
use App\Services\DeviceCommandService;
use App\Services\DeviceOperationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class PullDeviceData extends Command
{
    protected $signature = 'device:pull 
                            {--type=all : Data type to pull (all, attendance, users, fingerprints, faces)}
                            {--device= : Specific device serial number}
                            {--area= : Pull from all devices in an area}
                            {--force : Force pull even if recently synced}';

    protected $description = 'Actively pull data from ZKTeco devices';

    public function __construct(
        private DeviceCommandService $commandService,
        private DeviceOperationService $operationService
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $type = $this->option('type');
        $deviceSn = $this->option('device');
        $area = $this->option('area');
        $force = $this->option('force');

        // Get devices to pull from
        $devices = $this->getDevices($deviceSn, $area);
        
        if ($devices->isEmpty()) {
            $this->error('No devices found.');
            return Command::FAILURE;
        }

        $this->info("Starting data pull from {$devices->count()} device(s)...");
        
        $results = [
            'success' => 0,
            'failed' => 0,
            'skipped' => 0,
        ];

        foreach ($devices as $device) {
            $this->info("\n📱 Processing: {$device->name} ({$device->serial_number})");
            
            // Check if device is online
            if (!$device->is_online) {
                $this->warn("  ⚠️ Device is offline, skipping...");
                $results['skipped']++;
                continue;
            }

            // Check last sync time (skip if recently synced, unless forced)
            if (!$force && $this->wasRecentlySynced($device, $type)) {
                $this->info("  ℹ️ Recently synced, skipping (use --force to override)");
                $results['skipped']++;
                continue;
            }

            // Pull data based on type
            $pullResults = $this->pullDataFromDevice($device, $type);
            
            if ($pullResults['success']) {
                $results['success']++;
                $this->info("  ✅ Pull completed: {$pullResults['message']}");
            } else {
                $results['failed']++;
                $this->error("  ❌ Pull failed: {$pullResults['message']}");
            }
        }

        $this->displaySummary($results);
        
        return Command::SUCCESS;
    }

    /**
     * Get devices based on options
     */
    private function getDevices(?string $deviceSn, ?string $area)
    {
        $query = Device::where('approved', true);
        
        if ($deviceSn) {
            $query->where('serial_number', $deviceSn);
        }
        
        if ($area) {
            $query->where('area', $area);
        }
        
        return $query->get();
    }

    /**
     * Check if device was recently synced
     */
    private function wasRecentlySynced(Device $device, string $type): bool
    {
        $cacheKey = "device_pull_{$device->id}_{$type}";
        
        // Different cache TTL based on type
        $ttl = match($type) {
            'attendance' => 300,    // 5 minutes
            'users' => 3600,        // 1 hour
            'fingerprints' => 7200, // 2 hours
            'faces' => 7200,        // 2 hours
            default => 600,         // 10 minutes
        };
        
        return \Illuminate\Support\Facades\Cache::has($cacheKey);
    }

    /**
     * Mark device as synced
     */
    private function markAsSynced(Device $device, string $type): void
    {
        $cacheKey = "device_pull_{$device->id}_{$type}";
        
        $ttl = match($type) {
            'attendance' => 300,
            'users' => 3600,
            'fingerprints' => 7200,
            'faces' => 7200,
            default => 600,
        };
        
        \Illuminate\Support\Facades\Cache::put($cacheKey, now(), $ttl);
    }

    /**
     * Pull data from device
     */
    private function pullDataFromDevice(Device $device, string $type): array
    {
        try {
            $commands = $this->getCommandsForType($type);
            $queuedCommands = [];
            
            foreach ($commands as $command) {
                $queued = $this->commandService->sendCommand($device, $command);
                if ($queued) {
                    $queuedCommands[] = $queued;
                }
            }
            
            $count = count($queuedCommands);
            
            if ($count > 0) {
                $this->markAsSynced($device, $type);
                return [
                    'success' => true,
                    'message' => "Queued {$count} command(s)",
                    'commands' => $queuedCommands,
                ];
            }
            
            return [
                'success' => true,
                'message' => 'No commands needed',
            ];
            
        } catch (\Exception $e) {
            Log::error('Failed to pull data from device', [
                'device' => $device->serial_number,
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get commands for data type
     */
    private function getCommandsForType(string $type): array
    {
        return match($type) {
            'attendance' => ['GET_ATTLOG'],
            'users' => ['SYNC_USER'],
            'fingerprints' => ['SYNC_USER'], // Fingerprints come with user sync
            'faces' => ['SYNC_USER'],        // Faces come with user sync
            'all' => ['GET_ATTLOG', 'SYNC_USER'],
            default => ['GET_ATTLOG'],
        };
    }

    /**
     * Display summary
     */
    private function displaySummary(array $results): void
    {
        $this->newLine();
        $this->info('═══════════════════════════════════════');
        $this->info('           PULL SUMMARY                ');
        $this->info('═══════════════════════════════════════');
        $this->info("  ✅ Successful: {$results['success']}");
        $this->info("  ❌ Failed: {$results['failed']}");
        $this->info("  ⏭️  Skipped: {$results['skipped']}");
        $this->info('═══════════════════════════════════════');
    }
}