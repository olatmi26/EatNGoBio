<?php
namespace App\Services;

use App\Models\Device;
use App\Models\DeviceCommand;
use Illuminate\Support\Facades\Log;

class DeviceCommandService
{
    /**
     * Available commands with their ZKTeco protocol equivalents
     */
    public const COMMANDS = [
        'RESTART'         => [
            'protocol'        => 'REBOOT',
            'description'     => 'Restart the device',
            'requires_params' => false,
        ],
        'SYNC_USER'       => [
            'protocol'        => 'DATA QUERY USERINFO',
            'description'     => 'Sync all users to device',
            'requires_params' => false,
        ],
        'GET_ATTLOG'      => [
            'protocol'        => 'DATA QUERY ATTLOG',
            'description'     => 'Pull attendance logs',
            'requires_params' => false,
        ],
        'CLEAR_ATTLOG'    => [
            'protocol'        => 'CLEAR ATTLOG',
            'description'     => 'Clear attendance logs on device',
            'requires_params' => false,
        ],
        'CLEAR_DATA'      => [
            'protocol'        => 'CLEAR DATA',
            'description'     => 'Clear all data on device',
            'requires_params' => false,
        ],
        'CHECK_FIRMWARE'  => [
            'protocol'        => 'GET INFO',
            'description'     => 'Get device firmware version',
            'requires_params' => false,
        ],
        'ENABLE_DEVICE'   => [
            'protocol'        => 'ENABLE DEVICE',
            'description'     => 'Enable device',
            'requires_params' => false,
        ],
        'DISABLE_DEVICE'  => [
            'protocol'        => 'DISABLE DEVICE',
            'description'     => 'Disable device',
            'requires_params' => false,
        ],
        'SET_TIME'        => [
            'protocol'        => 'SET OPTION',
            'params'          => 'DateTime=%s',
            'description'     => 'Sync time with server',
            'requires_params' => true,
        ],
        'SET_USER'        => [
            'protocol'        => 'DATA UPDATE USERINFO',
            'description'     => 'Update user on device',
            'requires_params' => true,
        ],
        'DELETE_USER'     => [
            'protocol'        => 'DATA DELETE USERINFO',
            'description'     => 'Delete user from device',
            'requires_params' => true,
        ],
        'SET_FINGERPRINT' => [
            'protocol'        => 'DATA UPDATE FINGERPTN',
            'description'     => 'Update fingerprint template',
            'requires_params' => true,
        ],
        'SET_FACE'        => [
            'protocol'        => 'DATA UPDATE FACE',
            'description'     => 'Update face template',
            'requires_params' => true,
        ],
    ];

    /**
     * Send a command to a device
     */
    public function sendCommand(Device $device, string $command, ?string $params = null): DeviceCommand
    {
        // Check if command is valid
        if (! isset(self::COMMANDS[$command])) {
            throw new \InvalidArgumentException("Unknown command: {$command}");
        }

        $commandConfig   = self::COMMANDS[$command];
        $protocolCommand = $commandConfig['protocol'];

        // Build full command string
        $fullCommand = $protocolCommand;
        if ($params) {
            $fullCommand .= ' ' . $params;
        }

        // Create command record
        $deviceCommand = DeviceCommand::create([
            'device_id' => $device->id,
            'device_sn' => $device->serial_number,
            'command'   => $protocolCommand,
            'params'    => $params,
            'status'    => 'pending',
        ]);

        Log::info('📤 Command queued', [
            'device'       => $device->serial_number,
            'command'      => $command,
            'full_command' => $fullCommand,
            'command_id'   => $deviceCommand->id,
        ]);

        return $deviceCommand;
    }

    /**
     * Send multiple commands to a device
     */
    public function sendCommands(Device $device, array $commands): array
    {
        $results = [];
        foreach ($commands as $cmd) {
            $results[] = $this->sendCommand(
                $device,
                $cmd['command'],
                $cmd['params'] ?? null
            );
        }
        return $results;
    }

    /**
     * Send sync time command
     */
    public function syncTime(Device $device): DeviceCommand
    {
        $dateTime = now()->format('Y-m-d H:i:s');
        return $this->sendCommand($device, 'SET_TIME', "DateTime={$dateTime}");
    }

    /**
     * Send user to device
     */
    public function sendUser(Device $device, string $pin, string $name, ?string $card = null, int $privilege = 0): DeviceCommand
    {
        // Format: PIN=123\tName=John Doe\tPri=0\tPasswd=\tCard=12345
        $params = sprintf(
            "PIN=%s\tName=%s\tPri=%d\tPasswd=\tCard=%s",
            $pin,
            $name,
            $privilege,
            $card ?? ''
        );

        return $this->sendCommand($device, 'SET_USER', $params);
    }

    /**
     * Delete user from device
     */
    public function deleteUser(Device $device, string $pin): DeviceCommand
    {
        return $this->sendCommand($device, 'DELETE_USER', "PIN={$pin}");
    }

    /**
     * Send fingerprint template to device
     */
    public function sendFingerprint(Device $device, string $pin, int $fingerId, string $template, int $size): DeviceCommand
    {
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
    public function sendFace(Device $device, string $pin, string $template, int $size): DeviceCommand
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
     * Sync all employees to device
     */
    public function syncAllUsers(Device $device): array
    {
        $employees = \App\Models\Employee::where('source_device_sn', $device->serial_number)
            ->orWhereJsonContains('biometric_areas', $device->area)
            ->get();

        $commands = [];
        foreach ($employees as $employee) {
            $commands[] = $this->sendUser(
                $device,
                $employee->employee_id,
                $employee->full_name,
                $employee->card
            );
        }

        Log::info('📤 Syncing all users', [
            'device' => $device->serial_number,
            'count'  => count($commands),
        ]);

        return $commands;
    }

    /**
     * Get pending commands for a device
     */
    public function getPendingCommands(Device $device): array
    {
        return DeviceCommand::where('device_sn', $device->serial_number)
            ->where('status', 'pending')
            ->orderBy('created_at')
            ->get()
            ->toArray();
    }

    /**
     * Get command history for a device
     */
    public function getCommandHistory(Device $device, int $limit = 50): array
    {
        return DeviceCommand::where('device_sn', $device->serial_number)
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn($cmd) => [
                'id'           => $cmd->id,
                'command'      => $cmd->command,
                'params'       => $cmd->params,
                'status'       => $cmd->status,
                'sent_at'      => $cmd->sent_at?->toDateTimeString(),
                'completed_at' => $cmd->completed_at?->toDateTimeString(),
                'response'     => $cmd->response,
                'return_code'  => $cmd->return_code,
            ])
            ->toArray();
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

        $command->update([
            'status'       => $status,
            'response'     => $response,
            'return_code'  => $returnCode,
            'completed_at' => now(),
        ]);

        Log::info('✅ Command response processed', [
            'command_id'  => $commandId,
            'device'      => $command->device_sn,
            'status'      => $status,
            'return_code' => $returnCode,
        ]);
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
     * Retry failed commands
     */
    public function retryFailedCommands(Device $device): array
    {
        $failedCommands = DeviceCommand::where('device_sn', $device->serial_number)
            ->where('status', 'failed')
            ->where('created_at', '>', now()->subHours(24))
            ->get();

        $results = [];
        foreach ($failedCommands as $cmd) {
            $newCmd    = $this->sendCommand($device, $cmd->command, $cmd->params);
            $results[] = $newCmd;

            Log::info('🔄 Retrying failed command', [
                'original_id' => $cmd->id,
                'new_id'      => $newCmd->id,
                'command'     => $cmd->command,
            ]);
        }

        return $results;
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

    /**
     * Get human-readable command label
     */
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
            default           => $command,
        };
    }

    /**
     * Get icon for command
     */
    private function getCommandIcon(string $command): string
    {
        return match ($command) {
            'RESTART'         => 'ri-restart-line',
            'SYNC_USER'       => 'ri-user-shared-line',
            'GET_ATTLOG'      => 'ri-download-cloud-line',
            'CLEAR_ATTLOG'    => 'ri-delete-bin-line',
            'CLEAR_DATA'      => 'ri-database-2-line',
            'CHECK_FIRMWARE'  => 'ri-cpu-line',
            'ENABLE_DEVICE'   => 'ri-toggle-line',
            'DISABLE_DEVICE'  => 'ri-toggle-fill',
            'SET_TIME'        => 'ri-time-line',
            'SET_USER'        => 'ri-user-add-line',
            'DELETE_USER'     => 'ri-user-delete-line',
            'SET_FINGERPRINT' => 'ri-fingerprint-line',
            'SET_FACE'        => 'ri-user-smile-line',
            default           => 'ri-terminal-box-line',
        };
    }

    /**
     * Get color for command
     */
    private function getCommandColor(string $command): string
    {
        return match ($command) {
            'RESTART'        => '#f59e0b',
            'SYNC_USER', 'GET_ATTLOG' => '#16a34a',
            'CLEAR_ATTLOG', 'CLEAR_DATA', 'DELETE_USER' => '#dc2626',
            'CHECK_FIRMWARE' => '#7c3aed',
            'ENABLE_DEVICE'  => '#16a34a',
            'DISABLE_DEVICE' => '#6b7280',
            'SET_TIME'       => '#0891b2',
            'SET_USER', 'SET_FINGERPRINT', 'SET_FACE'   => '#0891b2',
            default          => '#6b7280',
        };
    }
}
