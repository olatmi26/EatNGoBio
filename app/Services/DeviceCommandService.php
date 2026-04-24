<?php
namespace App\Services;

use App\Models\Device;
use App\Models\DeviceCommand;
use Illuminate\Support\Facades\Log;

class DeviceCommandService
{
    public const COMMANDS = [
        'RESTART'         => [
            'protocol'        => 'REBOOT',
            'description'     => 'Restart the device',
            'requires_params' => false,
            'timeout'         => 60,
        ],
        'SYNC_USER'       => [
            'protocol'        => 'DATA QUERY USERINFO',
            'description'     => 'Sync all users to device',
            'requires_params' => false,
            'timeout'         => 120,
        ],
        'GET_ATTLOG'      => [
            'protocol'        => 'DATA QUERY ATTLOG',
            'description'     => 'Pull attendance logs',
            'requires_params' => false,
            'timeout'         => 180,
        ],
        'CLEAR_ATTLOG'    => [
            'protocol'        => 'CLEAR ATTLOG',
            'description'     => 'Clear attendance logs on device',
            'requires_params' => false,
            'timeout'         => 60,
        ],
        'CLEAR_DATA'      => [
            'protocol'        => 'CLEAR DATA',
            'description'     => 'Clear all data on device',
            'requires_params' => false,
            'timeout'         => 120,
        ],
        'CHECK_FIRMWARE'  => [
            'protocol'        => 'GET INFO',
            'description'     => 'Get device firmware version',
            'requires_params' => false,
            'timeout'         => 30,
        ],
        'ENABLE_DEVICE'   => [
            'protocol'        => 'ENABLE DEVICE',
            'description'     => 'Enable device',
            'requires_params' => false,
            'timeout'         => 30,
        ],
        'DISABLE_DEVICE'  => [
            'protocol'        => 'DISABLE DEVICE',
            'description'     => 'Disable device',
            'requires_params' => false,
            'timeout'         => 30,
        ],
        'SET_TIME'        => [
            'protocol'        => 'SET OPTION',
            'params'          => 'DateTime=%s',
            'description'     => 'Sync time with server',
            'requires_params' => true,
            'timeout'         => 30,
        ],
        'SET_USER'        => [
            'protocol'        => 'DATA UPDATE USERINFO',
            'description'     => 'Update user on device',
            'requires_params' => true,
            'timeout'         => 30,
        ],
        'DELETE_USER'     => [
            'protocol'        => 'DATA DELETE USERINFO',
            'description'     => 'Delete user from device',
            'requires_params' => true,
            'timeout'         => 30,
        ],
        'SET_FINGERPRINT' => [
            'protocol'          => 'DATA UPDATE FINGERPTN',
            'description'       => 'Update fingerprint template',
            'requires_params'   => true,
            'timeout'           => 60,
            'max_template_size' => 2048,
        ],
        'SET_FACE'        => [
            'protocol'          => 'DATA UPDATE FACE',
            'description'       => 'Update face template',
            'requires_params'   => true,
            'timeout'           => 60,
            'max_template_size' => 10240,
        ],
        'SYNC_ALL_USERS'  => [
            'protocol'        => 'DATA QUERY USERINFO',
            'description'     => 'Sync all users',
            'requires_params' => false,
            'timeout'         => 300,
        ],
    ];

    /**
     * Send a command to a device
     */
    public function sendCommand(Device $device, string $command, ?string $params = null): ?DeviceCommand
    {
        if (! $device->approved) {
            Log::warning('⚠️ Cannot send command to unapproved device', [
                'device'  => $device->serial_number,
                'command' => $command,
            ]);
            return null;
        }

        if (! isset(self::COMMANDS[$command])) {
            Log::error('❌ Unknown command', ['command' => $command]);
            throw new \InvalidArgumentException("Unknown command: {$command}");
        }

        $commandConfig   = self::COMMANDS[$command];
        $protocolCommand = $commandConfig['protocol'];

        // Validate template size if applicable
        if ($command === 'SET_FINGERPRINT' && $params) {
            if (strlen($params) > $commandConfig['max_template_size']) {
                throw new \InvalidArgumentException("Fingerprint template too large");
            }
        }

        if ($command === 'SET_FACE' && $params) {
            if (strlen($params) > $commandConfig['max_template_size']) {
                throw new \InvalidArgumentException("Face template too large");
            }
        }

        // Build full command string
        $fullCommand = $protocolCommand;
        if ($params) {
            $fullCommand .= ' ' . $params;
        }

        // Set expiration time
        $expiresAt = now()->addSeconds($commandConfig['timeout'] * 2);

        // Create command record
        $deviceCommand = DeviceCommand::create([
            'device_id'  => $device->id,
            'device_sn'  => $device->serial_number,
            'command'    => $protocolCommand,
            'params'     => $params,
            'status'     => 'pending',
            'expires_at' => $expiresAt,
        ]);

        Log::info('📤 Command queued', [
            'device'       => $device->serial_number,
            'command'      => $command,
            'full_command' => $fullCommand,
            'command_id'   => $deviceCommand->id,
            'expires_at'   => $expiresAt->toDateTimeString(),
        ]);

        return $deviceCommand;
    }

    /**
     * Send sync time command
     */
    public function syncTime(Device $device): ?DeviceCommand
    {
        $dateTime = now()->format('Y-m-d H:i:s');
        return $this->sendCommand($device, 'SET_TIME', "DateTime={$dateTime}");
    }

    /**
     * Send user to device
     */
    public function sendUser(Device $device, string $pin, string $name, ?string $card = null, int $privilege = 0): ?DeviceCommand
    {
        $params = sprintf(
            "PIN=%s\tName=%s\tPri=%d\tPasswd=\tCard=%s",
            $pin,
            $this->sanitizeName($name),
            $privilege,
            $card ?? ''
        );

        return $this->sendCommand($device, 'SET_USER', $params);
    }

    /**
     * Delete user from device
     */
    public function deleteUser(Device $device, string $pin): ?DeviceCommand
    {
        return $this->sendCommand($device, 'DELETE_USER', "PIN={$pin}");
    }

    /**
     * Send fingerprint template to device
     */
    public function sendFingerprint(Device $device, string $pin, int $fingerId, string $template, int $size): ?DeviceCommand
    {
        if ($fingerId < 0 || $fingerId > 9) {
            throw new \InvalidArgumentException("Finger ID must be between 0 and 9");
        }

        $params = sprintf(
            "PIN=%s\tFID=%d\tSize=%d\tValid=1\tTMP=%s",
            $pin,
            $fingerId,
            $size,
            $template
        );

        return $this->sendCommand($device, 'SET_FINGERPRINT', $params);
    }

    /**
     * Send face template to device
     */
    public function sendFace(Device $device, string $pin, string $template, int $size): ?DeviceCommand
    {
        $params = sprintf(
            "PIN=%s\tFID=0\tSize=%d\tValid=1\tTMP=%s",
            $pin,
            $size,
            $template
        );

        return $this->sendCommand($device, 'SET_FACE', $params);
    }

    /**
     * SYNC USERS FROM DEVICE TO SYSTEM
     * Required by DeviceController.php (see code context line 60).
     */
    public function syncUsersFromDevice(Device $device): ?DeviceCommand
    {
        // Calls the supported command for SYNC_USER (which issues a "DATA QUERY USERINFO" protocol).
        return $this->sendCommand($device, 'SYNC_USER');
    }

    /**
     * PULL ATTLOG (attendance logs) FROM DEVICE TO SYSTEM
     * Required by DeviceController.php (see code context line 60).
     */
    public function pullAttendanceLogs(Device $device): ?DeviceCommand
    {
        // Calls the supported command for GET_ATTLOG (which issues a "DATA QUERY ATTLOG" protocol).
        return $this->sendCommand($device, 'GET_ATTLOG');
    }

    /**
     * Process command response from device
     */
    public function processResponse(int $commandId, string $response, int $returnCode): void
    {
        $command = DeviceCommand::find($commandId);

        if (! $command) {
            Log::warning('⚠️ Command not found', ['command_id' => $commandId]);
            return;
        }

        $status = $returnCode === 0 ? 'success' : 'failed';

        // DO NOT process data here - it comes via POST /iclock/cdata?table=ATTLOG
        // This is just an acknowledgment from the device
        if ($status === 'failed') {
            Log::warning('⚠️ Command failed on device', [
                'command_id'  => $commandId,
                'command'     => $command->command,
                'device'      => $command->device_sn,
                'return_code' => $returnCode,
            ]);
        } else {
            Log::info('✅ Command successful', [
                'command_id' => $commandId,
                'command'    => $command->command,
                'device'     => $command->device_sn,
            ]);
        }

        $command->update([
            'status'       => $status,
            'response'     => substr($response, 0, 65535),
            'return_code'  => $returnCode,
            'completed_at' => now(),
        ]);
    }

    /**
     * Get pending commands for a device
     */
    public function getPendingCommands(Device $device): array
    {
        // Expire old pending commands
        DeviceCommand::where('device_sn', $device->serial_number)
            ->where('status', 'pending')
            ->where('expires_at', '<', now())
            ->update(['status' => 'expired']);

        return DeviceCommand::where('device_sn', $device->serial_number)
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->get()
            ->toArray();
    }

    /**
     * Clean up old completed commands
     */
    public function cleanupOldCommands(int $days = 7): int
    {
        $deleted = DeviceCommand::where('status', '!=', 'pending')
            ->where('created_at', '<', now()->subDays($days))
            ->delete();

        Log::info('🧹 Cleaned up old commands', ['deleted' => $deleted]);
        return $deleted;
    }

    /**
     * Sanitize name for device transmission
     */
    private function sanitizeName(string $name): string
    {
        // Remove special characters that might break the protocol
        $name = preg_replace('/[^\x20-\x7E]/', '', $name);
        return substr(trim($name), 0, 50); // Limit to 50 chars
    }

    /**
     * Get available commands list for frontend
     */
    public function getAvailableCommands(): array
    {
        return array_map(fn($cmd, $key) => [
            'key'             => $key,
            'label'           => $this->getCommandLabel($key),
            'description'     => $cmd['description'],
            'icon'            => $this->getCommandIcon($key),
            'color'           => $this->getCommandColor($key),
            'danger'          => in_array($key, ['CLEAR_ATTLOG', 'CLEAR_DATA', 'DELETE_USER']),
            'requires_params' => $cmd['requires_params'],
        ], self::COMMANDS, array_keys(self::COMMANDS));
    }

    private function getCommandLabel(string $command): string
    {
        return match ($command) {
            'RESTART'         => 'Restart Device',
            'SYNC_USER'       => 'Sync Users',
            'GET_ATTLOG'      => 'Pull Attendance',
            'CLEAR_ATTLOG'    => 'Clear Attendance',
            'CLEAR_DATA'      => 'Clear All Data',
            'CHECK_FIRMWARE'  => 'Check Firmware',
            'ENABLE_DEVICE'   => 'Enable Device',
            'DISABLE_DEVICE'  => 'Disable Device',
            'SET_TIME'        => 'Sync Time',
            'SET_USER'        => 'Add User',
            'DELETE_USER'     => 'Delete User',
            'SET_FINGERPRINT' => 'Set Fingerprint',
            'SET_FACE'        => 'Set Face',
            'SYNC_ALL_USERS'  => 'Sync All Users',
            default           => $command,
        };
    }

    private function getCommandIcon(string $command): string
    {
        return match ($command) {
            'RESTART'         => 'ri-restart-line',
            'SYNC_USER', 'SYNC_ALL_USERS' => 'ri-user-shared-line',
            'GET_ATTLOG'      => 'ri-download-cloud-line',
            'CLEAR_ATTLOG', 'DELETE_USER' => 'ri-delete-bin-line',
            'CLEAR_DATA'      => 'ri-database-2-line',
            'CHECK_FIRMWARE'  => 'ri-cpu-line',
            'ENABLE_DEVICE'   => 'ri-toggle-line',
            'DISABLE_DEVICE'  => 'ri-toggle-fill',
            'SET_TIME'        => 'ri-time-line',
            'SET_USER'        => 'ri-user-add-line',
            'SET_FINGERPRINT' => 'ri-fingerprint-line',
            'SET_FACE'        => 'ri-user-smile-line',
            default           => 'ri-terminal-box-line',
        };
    }

    private function getCommandColor(string $command): string
    {
        return match ($command) {
            'RESTART'        => '#f59e0b',
            'SYNC_USER', 'GET_ATTLOG', 'SYNC_ALL_USERS' => '#16a34a',
            'CLEAR_ATTLOG', 'CLEAR_DATA', 'DELETE_USER' => '#dc2626',
            'CHECK_FIRMWARE' => '#7c3aed',
            'ENABLE_DEVICE'  => '#16a34a',
            'DISABLE_DEVICE' => '#6b7280',
            'SET_TIME'       => '#0891b2',
            'SET_USER', 'SET_FINGERPRINT', 'SET_FACE'   => '#0891b2',
            default          => '#6b7280',
        };
    }

    /**
     * Get the command history for a device.
     *
     * @param Device $device
     * @return \Illuminate\Support\Collection
     */
    public function getCommandHistory(Device $device): array
    {
        return DeviceCommand::where('device_id', $device->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($c) => [
                'id'       => $c->id,
                'command'  => $c->command,
                'sentAt'   => $c->created_at->format('Y-m-d H:i:s'),
                'status'   => $c->status,
                'response' => $c->response ?? '-',
            ])
            ->toArray();
    }

    /**
     * Queue sync all users command(s) for a device.
     * If the device supports mass user sync, only one command is queued.
     * Otherwise, one command per user is queued.
     *
     * @param Device $device
     * @return array
     */
    public function syncAllUsers(Device $device): array
    {
        // Example logic -- you may want to adjust to match your device's user resolution logic
        $commands = [];

        // Here, we assume all devices just queue one SYNC_USER command.
        $cmd = DeviceCommand::create([
            'device_id' => $device->id,
            'command'   => 'SYNC_USER',
            'params'    => null,
            'status'    => 'pending',
        ]);
        $commands[] = $cmd;

        return $commands;
    }

    /**
     * Retry failed commands for a device by re-queuing.
     *
     * @param Device $device
     * @return array
     */
    public function retryFailedCommands(Device $device): array
    {
        $failed = DeviceCommand::where('device_id', $device->id)
            ->where('status', 'failed')
            ->get();

        $newCommands = [];
        foreach ($failed as $command) {
            $newCommand = DeviceCommand::create([
                'device_id' => $device->id,
                'command'   => $command->command,
                'params'    => $command->params,
                'status'    => 'pending',
            ]);
            $newCommands[] = $newCommand;
        }

        return $newCommands;
    }

}
