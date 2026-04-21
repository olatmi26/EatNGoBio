<?php
namespace App\Http\Controllers;

use App\Events\AttendanceRecorded;
use App\Events\DeviceStatusChanged;
use App\Models\AttendanceLog;
use App\Models\Device;
use App\Models\DeviceCommand;
use App\Models\DeviceSyncLog;
use App\Models\Employee;
use App\Models\PendingDevice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ADMSController extends Controller
{
    /**
     * GET  /iclock/cdata  — Device registration / handshake
     * POST /iclock/cdata  — Device pushes attendance / user data
     */
    public function cdata(Request $request)
    {
        try {
            $sn = $request->query('SN') ?? $request->input('SN');

            Log::channel('daily')->info('=== ZK ADMS REQUEST ===', [
                'timestamp'    => now()->toDateTimeString(),
                'method'       => $request->method(),
                'sn'           => $sn,
                'ip'           => $request->ip(),
                'query_params' => $request->query->all(),
                'input_data'   => $request->input(),
                'raw_content'  => substr($request->getContent(), 0, 2000),
            ]);

            if (! $sn) {
                Log::warning('ZK ADMS: Missing SN in request');
                return response('ERROR: Missing SN', 400)->header('Content-Type', 'text/plain');
            }

            $ip       = $request->ip();
            $firmware = $request->query('Ver') ?? $request->input('Ver') ?? 'Unknown';
            $model    = $request->query('Model') ?? $request->input('Model') ?? 'ZKTeco';
            $options  = $request->query('options') ?? $request->input('options');

            $device = Device::where('serial_number', $sn)->first();

            // Handle unknown device
            if (! $device) {
                return $this->handleUnknownDevice($sn, $ip, $firmware, $model, $options);
            }

            // Track previous status for event firing
            $wasOnline = $device->status === 'online';

            // Update device with latest data
            $device->update([
                'last_seen'  => now(),
                'ip_address' => $ip,
                'firmware'   => $firmware,
                'user_count' => (int) ($request->query('Cnt') ?? $request->input('Cnt', $device->user_count)),
                'fp_count'   => (int) ($request->query('FPCnt') ?? $request->input('FPCnt', $device->fp_count)),
                'face_count' => (int) ($request->query('FaceCnt') ?? $request->input('FaceCnt', $device->face_count)),
                'status'     => 'online',
            ]);

            Log::info('📊 Device counts updated', [
                'sn'         => $sn,
                'user_count' => $device->user_count,
                'fp_count'   => $device->fp_count,
                'face_count' => $device->face_count,
            ]);

            // Fire status change event (throttled to max once per minute)
            $this->fireDeviceStatusEvent($device, $wasOnline);

            // Handle POST data (attendance logs or user info)
            if ($request->isMethod('POST')) {
                return $this->handlePostData($request, $device);
            }

            // GET request - Handshake response
            if ($options === 'all') {
                return $this->sendHandshakeResponse($device);
            }

            // Record heartbeat in sync log
            $this->writeSyncLog($device, 'heartbeat', 0, 'success', '0.1s', 'Heartbeat OK');

            return response("OK", 200)->header('Content-Type', 'text/plain');

        } catch (\Exception $e) {
            Log::error('❌ ZK ADMS Error: ' . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response("ERROR", 500)->header('Content-Type', 'text/plain');
        }
    }

    /**
     * Handle unknown device - save to pending
     */
    private function handleUnknownDevice(string $sn, string $ip, string $firmware, string $model, ?string $options)
    {
        $pending                 = PendingDevice::firstOrNew(['serial_number' => $sn]);
        $pending->ip_address     = $ip;
        $pending->firmware       = $firmware;
        $pending->model          = $model;
        $pending->last_heartbeat = now();
        $pending->request_count  = ($pending->request_count ?? 0) + 1;

        if (! $pending->exists) {
            $pending->status         = 'pending';
            $pending->first_seen     = now();
            $pending->suggested_name = $model . ' - ' . substr($sn, -6);
        }
        $pending->save();

        Log::info('🔍 ZK ADMS: Unknown device saved as pending', ['sn' => $sn, 'ip' => $ip]);

        if ($options === 'all') {
            $response = implode("\r\n", [
                "GET OPTION FROM: {$sn}",
                "Stamp=9999", "OpStamp=9999", "ErrorDelay=30", "Delay=10",
                "TransTimes=00:00;14:05", "TransInterval=1",
                "TransFlag=TransData AttLog OpLog EnrollUser ChkWork",
                "Realtime=1", "Encrypt=None", "ServerVer=2.4.1",
                "PushProtVer=2.4.1", "PushOptionsFlag=1", "TimeZone=Etc/GMT-1",
                "ATTLOGStamp=None", "OPERLOGStamp=9999", "ATTPHOTOStamp=None", "",
            ]);
            return response($response, 200)->header('Content-Type', 'text/plain');
        }

        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * Fire device status changed event (throttled)
     */
    private function fireDeviceStatusEvent(Device $device, bool $wasOnline): void
    {
        $cacheKey = "device_event_{$device->id}";

        if (! $wasOnline || ! Cache::has($cacheKey)) {
            event(new DeviceStatusChanged($device, 'online'));
            Cache::put($cacheKey, true, now()->addMinute());
            Log::info('📡 DeviceStatusChanged event fired', ['device' => $device->serial_number]);
        }
    }

    /**
     * Handle POST data from device
     */
    private function handlePostData(Request $request, Device $device)
    {
        $table   = $request->query('table') ?? $request->input('table');
        $rawBody = $request->getContent();

        if ($table === 'ATTLOG') {
            $count = $this->processAttendanceLogs($device, $rawBody);
            $this->writeSyncLog($device, 'attendance', $count, 'success', null, "{$count} attendance records synced");
            Log::info('✅ ZK ADMS ATTLOG processed', ['sn' => $device->serial_number, 'records' => $count]);
            return response("OK: {$count}", 200)->header('Content-Type', 'text/plain');
        }

        if ($table === 'USERINFO') {
            $count = $this->processUserInfo($device->serial_number, $rawBody);
            $this->writeSyncLog($device, 'user', $count, 'success', null, "{$count} users synchronized");
            Log::info('✅ ZK ADMS USERINFO processed', ['sn' => $device->serial_number, 'records' => $count]);
            return response("OK: {$count}", 200)->header('Content-Type', 'text/plain');
        }

        if ($table === 'OPERLOG') {
            $this->processOperationLog($device, $rawBody);
            return response("OK", 200)->header('Content-Type', 'text/plain');
        }

        Log::warning('⚠️ ZK ADMS: Unknown table', ['sn' => $device->serial_number, 'table' => $table]);
        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * Send handshake response to device
     */
    private function sendHandshakeResponse(Device $device)
    {
        $response = implode("\r\n", [
            "GET OPTION FROM: {$device->serial_number}",
            "Stamp=9999",
            "OpStamp=9999",
            "ErrorDelay=30",
            "Delay={$device->heartbeat_interval}",
            "TransTimes=00:00;14:05",
            "TransInterval=1",
            "TransFlag=TransData AttLog OpLog EnrollUser ChkWork",
            "Realtime=1",
            "Encrypt=None",
            "ServerVer=2.4.1",
            "PushProtVer=2.4.1",
            "PushOptionsFlag=1",
            "TimeZone=Etc/GMT-1",
            "ATTLOGStamp=None",
            "OPERLOGStamp=9999",
            "ATTPHOTOStamp=None",
            "",
        ]);

        Log::info('🤝 ZK ADMS Handshake sent', ['sn' => $device->serial_number]);
        return response($response, 200)->header('Content-Type', 'text/plain');
    }

    /**
     * Process attendance logs from device
     */
    private function processAttendanceLogs(Device $device, string $body): int
    {
        $lines = array_filter(explode("\n", trim($body)));
        if (empty($lines)) {
            return 0;
        }

        $saved = 0;

        // Pre-fetch employees for this batch
        $pins = [];
        foreach ($lines as $line) {
            $parts = preg_split('/[\t ]+/', trim($line));
            if (count($parts) >= 3) {
                $pins[] = $parts[0];
            }
        }

        $employees = Employee::whereIn('employee_id', array_unique($pins))
            ->pluck('id', 'employee_id')
            ->toArray();

        foreach ($lines as $line) {
            $line = trim($line);
            if (! $line) {
                continue;
            }

            $parts = preg_split('/[\t ]+/', $line);
            if (count($parts) < 3) {
                continue;
            }

            $pin      = $parts[0];
            $dateTime = trim(($parts[1] ?? '') . ' ' . ($parts[2] ?? ''));
            $status   = (int) ($parts[3] ?? 0);
            $verify   = (int) ($parts[4] ?? 1);
            $workCode = $parts[5] ?? '0';

            // Sanitize punch_type - ZKTeco standard is 0-5
            // 255 typically means "Check-In" on some firmware
            $punchType = $status;
            if ($punchType > 5) {
                $punchType = 0;
                Log::debug('🔄 Sanitized punch_type', ['original' => $status, 'sanitized' => $punchType]);
            }

            try {
                $punchTime = Carbon::createFromFormat('Y-m-d H:i:s', $dateTime);
            } catch (\Exception $e) {
                Log::warning('⚠️ Invalid datetime format', ['datetime' => $dateTime, 'line' => $line]);
                continue;
            }

            // Check for duplicate using cache
            $cacheKey = "attlog_{$device->serial_number}_{$pin}_{$punchTime->timestamp}";
            if (Cache::has($cacheKey)) {
                Log::debug('⏭️ Skipping duplicate record', ['pin' => $pin, 'time' => $punchTime->toDateTimeString()]);
                continue;
            }

            // Check database for duplicate
            $exists = AttendanceLog::where('device_sn', $device->serial_number)
                ->where('employee_pin', $pin)
                ->where('punch_time', $punchTime)
                ->exists();

            if ($exists) {
                Cache::put($cacheKey, true, now()->addHours(24));
                continue;
            }

            // Find or create employee
            $employeeId = $employees[$pin] ?? null;
            if (! $employeeId) {
                $employee = Employee::firstOrCreate(
                    ['employee_id' => $pin],
                    [
                        'first_name'       => 'Employee',
                        'last_name'        => $pin,
                        'active'           => true,
                        'employee_status'  => 'active',
                        'source_device_sn' => $device->serial_number,
                    ]
                );
                $employeeId      = $employee->id;
                $employees[$pin] = $employeeId;
                Log::info('👤 Auto-created employee', ['pin' => $pin, 'employee_id' => $employeeId]);
            }

            // Create attendance record
            $log = AttendanceLog::create([
                'device_id'     => $device->id,
                'device_sn'     => $device->serial_number,
                'employee_pin'  => $pin,
                'employee_id'   => $employeeId,
                'punch_time'    => $punchTime,
                'punch_type'    => $punchType,
                'verify_type'   => $verify,
                'work_code'     => $workCode,
                'raw_line_data' => $line,
            ]);

            Cache::put($cacheKey, true, now()->addHours(24));
            $saved++;

            // Fire real-time event
            event(new AttendanceRecorded($log));

            Log::info('✅ Attendance saved', [
                'pin'         => $pin,
                'employee_id' => $employeeId,
                'punch_type'  => $punchType,
                'punch_time'  => $punchTime->toDateTimeString(),
            ]);
        }

        return $saved;
    }

    /**
     * Process user info from device
     */
    public function processUserInfo(string $sn, string $body): int
    {
        $lines = preg_split("/\r\n|\n|\r/", trim($body));
        $count = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            $parts = explode("\t", $line);
            if (count($parts) < 2) {
                continue;
            }

            $pin  = $parts[0];
            $name = $parts[1] ?? '';

            // Parse name into first/last
            $nameParts = explode(' ', trim($name), 2);
            $firstName = $nameParts[0] ?? '';
            $lastName  = $nameParts[1] ?? '';

            Employee::updateOrCreate(
                ['employee_id' => $pin],
                [
                    'first_name'       => $firstName ?: 'Employee',
                    'last_name'        => $lastName ?: $pin,
                    'card'             => $parts[3] ?? null,
                    'source_device_sn' => $sn,
                    'active'           => true,
                    'employee_status'  => 'active',
                ]
            );
            $count++;
        }

        Log::info('👥 USERINFO processed', ['sn' => $sn, 'users' => $count]);
        return $count;
    }

    /**
     * Process operation log from device
     */
    private function processOperationLog(Device $device, string $body): void
    {
        Log::info("📋 ZK ADMS OPERLOG {$device->serial_number}: " . substr($body, 0, 200));
        $this->writeSyncLog($device, 'operation', 0, 'success', null, 'Operation log received');
    }

    /**
     * Write sync log entry
     */
    private function writeSyncLog(Device $device, string $type, int $records, string $status, ?string $duration, string $message): void
    {
        $now = now();
        DeviceSyncLog::create([
            'device_sn'  => $device->serial_number,
            'device_id'  => $device->id,
            'type'       => $type,
            'records'    => $records,
            'status'     => $status,
            'duration'   => $duration,
            'message'    => $message,
            'synced_at'  => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
    }

    /**
     * GET /iclock/getrequest — Device polls for pending commands
     */
    public function getRequest(Request $request)
    {
        try {
            $sn = $request->query('SN');
            Log::info('📥 ZK ADMS getrequest', ['sn' => $sn]);

            if (! $sn) {
                return response('ERROR', 400)->header('Content-Type', 'text/plain');
            }

            $device = Device::where('serial_number', $sn)->first();
            if ($device) {
                $device->update(['last_seen' => now(), 'status' => 'online']);
            }

            // Check for pending commands
            $command = DeviceCommand::where('device_sn', $sn)
                ->where('status', 'pending')
                ->oldest()
                ->first();

            if ($command) {
                $command->update(['status' => 'sent', 'sent_at' => now()]);
                $cmdStr = "C:{$command->id}:{$command->command}";
                if ($command->params) {
                    $cmdStr .= " {$command->params}";
                }
                Log::info('📤 Command sent to device', ['sn' => $sn, 'command' => $cmdStr]);
                return response($cmdStr, 200)->header('Content-Type', 'text/plain');
            }

            return response("OK", 200)->header('Content-Type', 'text/plain');

        } catch (\Exception $e) {
            Log::error('❌ ZK ADMS getrequest Error: ' . $e->getMessage());
            return response("ERROR", 500)->header('Content-Type', 'text/plain');
        }
    }

    /**
     * POST /iclock/devicecmd — Device sends command execution result
     */
    public function deviceCmd(Request $request)
    {
        $sn   = $request->query('SN');
        $body = $request->getContent();

        Log::info('📨 ZK ADMS devicecmd', ['sn' => $sn, 'body' => $body]);

        parse_str($body, $params);

        if (! empty($params['ID'])) {
            DeviceCommand::where('id', $params['ID'])->update([
                'status'       => (isset($params['Return']) && $params['Return'] === '0') ? 'success' : 'failed',
                'return_code'  => $params['Return'] ?? null,
                'response'     => $body,
                'completed_at' => now(),
            ]);
            Log::info('✅ Command result saved', ['id' => $params['ID'], 'status' => $params['Return'] ?? 'unknown']);
        }

        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * POST /iclock/upload — Device uploads user/fingerprint data
     */
    public function upload(Request $request)
    {
        $sn    = $request->query('SN');
        $table = $request->query('table');
        $body  = $request->getContent();

        Log::info('📤 ZK ADMS Upload', ['sn' => $sn, 'table' => $table, 'size' => strlen($body)]);

        if ($table === 'USERINFO' && $sn) {
            $device = Device::where('serial_number', $sn)->first();
            if ($device) {
                $count = $this->processUserInfo($sn, $body);
                $this->writeSyncLog($device, 'upload', $count, 'success', null, "Uploaded {$count} users");
            }
        }

        return response("OK: 0", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * GET /iclock/fdata — Firmware data endpoint
     */
    public function fdata(Request $request)
    {
        Log::info('📦 ZK ADMS fdata', ['query' => $request->query()]);
        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * GET /iclock/getrequest — Device polls for pending commands
     * THIS IS WHERE WE SEND COMMANDS TO PULL DATA!
     */
    public function getRequest(Request $request)
    {
        try {
            $sn = $request->query('SN');
            Log::info('📥 ZK ADMS getrequest', ['sn' => $sn]);

            if (! $sn) {
                return response('ERROR', 400)->header('Content-Type', 'text/plain');
            }

            $device = Device::where('serial_number', $sn)->first();
            if ($device) {
                $device->update(['last_seen' => now(), 'status' => 'online']);

                // 🔥 CRITICAL: Check if we need to pull user data
                $needsUserSync = $this->shouldSyncUsers($device);

                if ($needsUserSync) {
                    $command = $this->queueUserSyncCommand($device);
                    if ($command) {
                        Log::info('📤 Sending user sync command', ['sn' => $sn, 'command_id' => $command->id]);
                        return response("C:{$command->id}:DATA QUERY USERINFO", 200)
                            ->header('Content-Type', 'text/plain');
                    }
                }

                // Check for other pending commands
                $pendingCommand = DeviceCommand::where('device_sn', $sn)
                    ->where('status', 'pending')
                    ->oldest()
                    ->first();

                if ($pendingCommand) {
                    $pendingCommand->update(['status' => 'sent', 'sent_at' => now()]);
                    $cmdStr = "C:{$pendingCommand->id}:{$pendingCommand->command}";
                    if ($pendingCommand->params) {
                        $cmdStr .= " {$pendingCommand->params}";
                    }
                    Log::info('📤 Sending queued command', ['sn' => $sn, 'command' => $cmdStr]);
                    return response($cmdStr, 200)->header('Content-Type', 'text/plain');
                }
            }

            return response("OK", 200)->header('Content-Type', 'text/plain');

        } catch (\Exception $e) {
            Log::error('❌ ZK ADMS getrequest Error: ' . $e->getMessage());
            return response("ERROR", 500)->header('Content-Type', 'text/plain');
        }
    }

    /**
     * Check if device needs user data synchronization
     */
    private function shouldSyncUsers(Device $device): bool
    {
        $cacheKey = "device_user_sync_{$device->id}";

        // Sync if never synced or last sync was > 1 hour ago
        if (! Cache::has($cacheKey)) {
            return true;
        }

        // Also sync if user count is 0 (likely needs initial sync)
        if ($device->user_count == 0) {
            return true;
        }

        return false;
    }

    /**
     * Queue a command to pull user info from device
     */
    private function queueUserSyncCommand(Device $device): ?DeviceCommand
    {
        // Check if there's already a pending user sync command
        $existing = DeviceCommand::where('device_sn', $device->serial_number)
            ->where('command', 'DATA QUERY USERINFO')
            ->where('status', 'pending')
            ->exists();

        if ($existing) {
            return null;
        }

        return DeviceCommand::create([
            'device_id' => $device->id,
            'device_sn' => $device->serial_number,
            'command'   => 'DATA QUERY USERINFO',
            'params'    => 'ALL',
            'status'    => 'pending',
        ]);
    }

    /**
     * Handle USERINFO response from device
     */
    public function processUserInfo(string $sn, string $body): int
    {
        $lines = preg_split("/\r\n|\n|\r/", trim($body));
        $count = 0;

        Log::info('👥 Processing USERINFO from device', ['sn' => $sn, 'lines' => count($lines)]);

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }

            $parts = explode("\t", $line);
            if (count($parts) < 2) {
                continue;
            }

            $pin       = $parts[0];
            $name      = $parts[1] ?? '';
            $password  = $parts[2] ?? '';
            $card      = $parts[3] ?? '';
            $group     = $parts[4] ?? '';
            $timezone  = $parts[5] ?? '';
            $privilege = $parts[6] ?? '0';
            $enabled   = $parts[7] ?? '1';

            // Parse name into first/last
            $nameParts = explode(' ', trim($name), 2);
            $firstName = $nameParts[0] ?? '';
            $lastName  = $nameParts[1] ?? '';

            $employee = Employee::updateOrCreate(
                ['employee_id' => $pin],
                [
                    'first_name'       => $firstName ?: 'Employee',
                    'last_name'        => $lastName ?: $pin,
                    'card'             => $card ?: null,
                    'source_device_sn' => $sn,
                    'active'           => $enabled === '1',
                    'employee_status'  => 'active',
                ]
            );

            Log::debug('✅ Employee synced', [
                'pin'         => $pin,
                'name'        => $name,
                'employee_id' => $employee->id,
            ]);

            $count++;
        }

        // Update device user count
        $device = Device::where('serial_number', $sn)->first();
        if ($device) {
            $device->update(['user_count' => $count]);

            // Mark sync as complete
            Cache::put("device_user_sync_{$device->id}", true, now()->addHours(6));

            // Log successful sync
            $this->writeSyncLog($device, 'user_sync', $count, 'success', null, "Synced {$count} users from device");
        }

        Log::info('✅ USERINFO sync complete', ['sn' => $sn, 'users' => $count]);
        return $count;
    }

    /**
     * Process fingerprint template data
     */
    private function processFingerprintData(Device $device, string $pin, string $fingerData, int $fingerIndex): void
    {
        Log::info('🖐️ Processing fingerprint', [
            'sn'    => $device->serial_number,
            'pin'   => $pin,
            'index' => $fingerIndex,
            'size'  => strlen($fingerData),
        ]);

        $employee = Employee::where('employee_id', $pin)->first();
        if (! $employee) {
            Log::warning('Employee not found for fingerprint', ['pin' => $pin]);
            return;
        }

        // Store fingerprint template
        // Note: You may want to create a fingerprints table
        // For now, we just log it
        Log::info('Fingerprint template received', [
            'employee_id'   => $employee->id,
            'finger_index'  => $fingerIndex,
            'template_size' => strlen($fingerData),
        ]);

        // Update device fp_count
        $device->increment('fp_count');
    }
}
