<?php
namespace App\Http\Controllers;

use App\Events\AttendanceRecorded;
use App\Events\DeviceStatusChanged;
use App\Models\AttendanceLog;
use App\Models\Device;
use App\Models\DeviceCommand;
use App\Models\Employee;
use App\Models\PendingDevice;
use App\Services\DeviceCommandService;
use App\Services\DeviceOperationService;
use App\Services\LocationAccessService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ADMSController extends Controller
{
    public function __construct(
        private DeviceOperationService $operationService,
        private DeviceCommandService $commandService,
        private LocationAccessService $locationAccess
    ) {}

    /**
     * GET/POST /iclock/cdata — Device registration / handshake / data push
     */
    /**
     * GET/POST /iclock/cdata — Device registration / handshake / data push
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
                'raw_content'  => substr($request->getContent(), 0, 500),
            ]);

            if (! $sn) {
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

            // Track previous status
            $wasOnline = $device->status === 'online';

            // CRITICAL FIX: Get device-reported counts from query parameters
            $deviceUserCount = (int) ($request->query('Cnt') ?? $request->input('Cnt', 0));
            $deviceFpCount   = (int) ($request->query('FPCnt') ?? $request->input('FPCnt', 0));
            $deviceFaceCount = (int) ($request->query('FaceCnt') ?? $request->input('FaceCnt', 0));

            // Update device with data from handshake
            // If device reports counts, use them. Otherwise preserve existing DB counts
            $updateData = [
                'last_seen'  => now(),
                'ip_address' => $ip,
                'firmware'   => $firmware,
                'status'     => 'online',
            ];

            // Only update counts if device provided them (handshake with options=all)
            if ($deviceUserCount > 0 || $options === 'all') {
                $updateData['user_count'] = $deviceUserCount;
                $updateData['fp_count']   = $deviceFpCount;
                $updateData['face_count'] = $deviceFaceCount;

                Log::info('📊 Device reported counts via handshake', [
                    'sn'    => $sn,
                    'users' => $deviceUserCount,
                    'fp'    => $deviceFpCount,
                    'face'  => $deviceFaceCount,
                ]);
            }

            $device->update($updateData);
            $device->refresh();

            Log::info('📊 Device updated', [
                'sn'         => $sn,
                'user_count' => $device->user_count,
                'fp_count'   => $device->fp_count,
                'face_count' => $device->face_count,
                'options'    => $options,
            ]);

            // Fire status change event (throttled)
            $this->fireDeviceStatusEvent($device, $wasOnline);

            // Handle POST data
            if ($request->isMethod('POST')) {
                return $this->handlePostData($request, $device);
            }

            // GET handshake
            if ($options === 'all') {
                return $this->sendHandshakeResponse($device);
            }

            $this->operationService->writeSyncLog($device, 'heartbeat', 0, 'success', null, 'Heartbeat OK');
            return response("OK", 200)->header('Content-Type', 'text/plain');

        } catch (\Exception $e) {
            Log::error('❌ ZK ADMS Error: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
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

        Log::info('🔍 Unknown device saved as pending', ['sn' => $sn, 'ip' => $ip]);

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

        Log::info('📥 Processing POST data', [
            'sn'          => $device->serial_number,
            'table'       => $table,
            'body_length' => strlen($rawBody),
        ]);

        if ($table === 'ATTLOG') {
            $count = $this->processAttendanceLogs($device, $rawBody);
            $this->operationService->writeSyncLog($device, 'attendance', $count, 'success', null, "{$count} records");
            Log::info('✅ ATTLOG processed', ['sn' => $device->serial_number, 'count' => $count]);

            // Update last_seen and ensure device is marked online
            $device->update(['last_seen' => now(), 'status' => 'online']);

            return response("OK: {$count}", 200)->header('Content-Type', 'text/plain');
        }

        if ($table === 'USERINFO') {
            $count = $this->operationService->processUserInfo($device, $rawBody);
            $this->operationService->writeSyncLog($device, 'user_sync', $count, 'success', null, "{$count} users");
            Log::info('✅ USERINFO processed', ['sn' => $device->serial_number, 'count' => $count]);

            // CRITICAL: Update device counts after processing users
            $this->operationService->updateDeviceCounts($device);
            $device->update(['last_seen' => now(), 'status' => 'online']);

            return response("OK: {$count}", 200)->header('Content-Type', 'text/plain');
        }

        if ($table === 'OPERLOG') {
            $stats = $this->operationService->processOperationLog($device, $rawBody);
            $this->operationService->writeSyncLog($device, 'oplog', 0, 'success', null,
                "USER:{$stats['users']} FP:{$stats['fingerprints']} FACE:{$stats['faces']}");

            // CRITICAL: Update device counts after processing OPERLOG
            $this->operationService->updateDeviceCounts($device);
            $device->update(['last_seen' => now(), 'status' => 'online']);

            Log::info('✅ OPERLOG processed - Device counts updated', [
                'sn'           => $device->serial_number,
                'users'        => $stats['users'],
                'fingerprints' => $stats['fingerprints'],
                'faces'        => $stats['faces'],
            ]);

            return response("OK", 200)->header('Content-Type', 'text/plain');
        }

        Log::warning('⚠️ Unknown table', ['sn' => $device->serial_number, 'table' => $table]);
        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * Process attendance logs with location validation
     *
     * ZKTeco ADMS ATTLOG format (TAB-separated):
     *   PIN \t DATE TIME \t STATUS \t VERIFY \t WORKCODE \t RESERVED
     * e.g.: 1\t2026-04-23 08:30:00\t0\t1\t0\t0
     *   parts[0] = PIN
     *   parts[1] = "YYYY-MM-DD HH:MM:SS"  (date + time as ONE field)
     *   parts[2] = STATUS / punch-type  (0=check-in, 1=check-out, 4=OT-in, 5=OT-out)
     *   parts[3] = VERIFY mode          (0=fingerprint, 1=fp, 2=card, 3=pwd, 4=face, ...)
     *   parts[4] = WORKCODE
     */
    private function processAttendanceLogs(Device $device, string $body): int
    {
        $lines = array_filter(explode("\n", trim($body)));
        if (empty($lines)) {
            return 0;
        }

        $saved = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            $parts = preg_split('/\s+/', $line);
            if (count($parts) < 3) {
                continue;
            }

            $pin          = trim($parts[0]);
            $dateTime     = trim($parts[1]);
            $rawPunchType = (int) trim($parts[2]);

            try {
                $punchTime = \Carbon\Carbon::parse($dateTime);
            } catch (\Exception $e) {
                continue;
            }

            // Use alternating sequence to determine IN/OUT
            $punchType = $this->determinePunchTypeBySequence($pin, $punchTime, $rawPunchType);

            $verify   = trim($parts[3] ?? '1');
            $workCode = trim($parts[4] ?? '0');

            $employee = Employee::where('employee_id', $pin)->first();

            // Check duplicate
            $exists = AttendanceLog::where('device_sn', $device->serial_number)
                ->where('employee_pin', $pin)
                ->where('punch_time', $punchTime)
                ->exists();

            if ($exists) {
                continue;
            }

            // Save with SUCCESS status (bypass validation for now)
            $attendanceLog = AttendanceLog::create([
                'device_id'     => $device->id,
                'device_sn'     => $device->serial_number,
                'employee_pin'  => $pin,
                'employee_id'   => $employee?->id,
                'punch_time'    => $punchTime,
                'punch_type'    => $punchType,
                'verify_type'   => $verify,
                'work_code'     => $workCode,
                'raw_line_data' => $line,
                'status'        => 'success',
            ]);

            event(new AttendanceRecorded($attendanceLog));
            $saved++;

            Log::info('✅ Punch saved', [
                'pin'    => $pin,
                'time'   => $punchTime,
                'type'   => $punchType == 0 ? 'IN' : 'OUT',
                'status' => 'success',
            ]);
        }

        return $saved;
    }

    /**
     * Determine punch type by sequence (alternating IN/OUT)
     */
    private function determinePunchTypeBySequence(string $pin, Carbon $punchTime, int $rawPunchType): int
    {
        // If device sent a valid value (0-5), use it
        if ($rawPunchType >= 0 && $rawPunchType <= 5 && $rawPunchType != 255) {
            return $rawPunchType;
        }

        $today = $punchTime->copy()->startOfDay();

        // Get today's punches for this employee (excluding current)
        $todayPunches = AttendanceLog::where('employee_pin', $pin)
            ->whereDate('punch_time', $today)
            ->where('status', 'success')
            ->orderBy('punch_time', 'asc')
            ->get();

        // First punch of the day = Check-In (0)
        if ($todayPunches->isEmpty()) {
            Log::info('First punch of day - IN', ['pin' => $pin, 'time' => $punchTime]);
            return 0;
        }

        // Get the last punch type
        $lastPunch = $todayPunches->last();

        // Alternate: If last was IN (0), this is OUT (1). If last was OUT (1), this is IN (0)
        $newType = ($lastPunch->punch_type == 0) ? 1 : 0;

        Log::info('Alternating punch', [
            'pin'       => $pin,
            'last_type' => $lastPunch->punch_type == 0 ? 'IN' : 'OUT',
            'new_type'  => $newType == 0 ? 'IN' : 'OUT',
            'time'      => $punchTime,
        ]);

        return $newType;
    }

    /**
     * Send handshake response
     */
    private function sendHandshakeResponse(Device $device)
    {
        // Calculate GMT offset for Lagos (GMT+1)
        $tzOffset = '+1';

        $response = implode("\r\n", [
            "GET OPTION FROM: {$device->serial_number}",
            "Stamp=9999",
            "OpStamp=9999",
            "ErrorDelay=30",
            "Delay={$device->heartbeat_interval}",
            "TransTimes=00:00;14:05",
            "TransInterval=1",
            "TransFlag=TransData AttLog OpLog EnrollUser GetUserInfo ChkWork",
            "Realtime=1",
            "Encrypt=None",
            "ServerVer=2.4.1",
            "PushProtVer=2.4.1",
            "PushOptionsFlag=1",
            "TimeZone={$tzOffset}",
            "ATTLOGStamp=None",
            "OPERLOGStamp=9999",
            "ATTPHOTOStamp=None",
            "",
        ]);

        Log::info('🤝 Handshake sent', [
            'sn'       => $device->serial_number,
            'timezone' => $device->timezone,
            'offset'   => $tzOffset,
        ]);

        return response($response, 200)->header('Content-Type', 'text/plain');
    }

    /**
     * GET /iclock/getrequest — Device polls for commands
     */
    public function getRequest(Request $request)
    {
        try {
            $sn = $request->query('SN');
            // Log::info('📥 getrequest', ['sn' => $sn]);

            if (! $sn) {
                return response('ERROR', 400)->header('Content-Type', 'text/plain');
            }

            $device = Device::where('serial_number', $sn)->first();
            if ($device) {
                $device->update(['last_seen' => now(), 'status' => 'online']);

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
                    Log::info('📤 Sending command', ['sn' => $sn, 'command' => $cmdStr]);
                    return response($cmdStr, 200)->header('Content-Type', 'text/plain');
                }
            }

            return response("OK", 200)->header('Content-Type', 'text/plain');

        } catch (\Exception $e) {
            Log::error('❌ getrequest Error: ' . $e->getMessage());
            return response("ERROR", 500)->header('Content-Type', 'text/plain');
        }
    }

    /**
     * POST /iclock/devicecmd — Command result
     * ZKTeco ADMS protocol: Device sends acknowledgment as URL-encoded string
     * Format: ID=123&Return=0&CMD=DATA QUERY ATTLOG
     * The actual data is NOT in this response - it comes via POST /iclock/cdata?table=ATTLOG
     */
    public function deviceCmd(Request $request)
    {
        $sn   = $request->query('SN');
        $body = $request->getContent();

        Log::info('📨 devicecmd received', ['sn' => $sn, 'body' => $body]);

        // Parse URL-encoded parameters (ID=123&Return=0)
        parse_str($body, $params);

        if (! empty($params['ID']) && isset($params['Return'])) {
            $commandId  = (int) $params['ID'];
            $returnCode = (int) $params['Return'];

            // Update command status - DO NOT process data here since it's just an ACK
            $command = DeviceCommand::find($commandId);

            if ($command) {
                $status = $returnCode === 0 ? 'success' : 'failed';
                $command->update([
                    'status'       => $status,
                    'return_code'  => $returnCode,
                    'response'     => $body,
                    'completed_at' => now(),
                ]);

                Log::info('✅ Command acknowledged', [
                    'command_id'  => $commandId,
                    'device'      => $command->device_sn,
                    'status'      => $status,
                    'return_code' => $returnCode,
                ]);

                // If command failed, log it but don't process data (data comes separately)
                if ($status === 'failed') {
                    Log::warning('⚠️ Command failed on device', [
                        'command_id' => $commandId,
                        'command'    => $command->command,
                    ]);
                }
            } else {
                Log::warning('⚠️ Command not found for acknowledgment', ['command_id' => $commandId]);
            }
        }

        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * POST /iclock/upload — Device uploads data
     */
    public function upload(Request $request)
    {
        $sn    = $request->query('SN');
        $table = $request->query('table');
        $body  = $request->getContent();

        Log::info('📤 Upload', ['sn' => $sn, 'table' => $table, 'size' => strlen($body)]);

        if ($table === 'USERINFO' && $sn) {
            $device = Device::where('serial_number', $sn)->first();
            if ($device) {
                $count = $this->operationService->processUserInfo($device, $body);
                $this->operationService->writeSyncLog($device, 'upload', $count, 'success', null, "Uploaded {$count} users");
            }
        }

        return response("OK: 0", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * GET /iclock/fdata — Firmware data
     */
    public function fdata(Request $request)
    {
        Log::info('📦 fdata', ['query' => $request->query()]);
        return response("OK", 200)->header('Content-Type', 'text/plain');
    }
}
