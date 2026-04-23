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

            // Update device with data from handshake
            $device->update([
                'last_seen'  => now(),
                'ip_address' => $ip,
                'firmware'   => $firmware,
                'user_count' => (int) ($request->query('Cnt') ?? $request->input('Cnt', $device->user_count)),
                'fp_count'   => (int) ($request->query('FPCnt') ?? $request->input('FPCnt', $device->fp_count)),
                'face_count' => (int) ($request->query('FaceCnt') ?? $request->input('FaceCnt', $device->face_count)),
                'status'     => 'online',
            ]);

            Log::info('📊 Device updated', [
                'sn'         => $sn,
                'user_count' => $device->user_count,
                'fp_count'   => $device->fp_count,
                'face_count' => $device->face_count,
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

        if ($table === 'ATTLOG') {
            $count = $this->processAttendanceLogs($device, $rawBody);
            $this->operationService->writeSyncLog($device, 'attendance', $count, 'success', null, "{$count} records");
            Log::info('✅ ATTLOG processed', ['sn' => $device->serial_number, 'count' => $count]);
            return response("OK: {$count}", 200)->header('Content-Type', 'text/plain');
        }

        if ($table === 'USERINFO') {
            $count = $this->operationService->processUserInfo($device, $rawBody);
            $this->operationService->writeSyncLog($device, 'user_sync', $count, 'success', null, "{$count} users");
            Log::info('✅ USERINFO processed', ['sn' => $device->serial_number, 'count' => $count]);
            return response("OK: {$count}", 200)->header('Content-Type', 'text/plain');
        }

        if ($table === 'OPERLOG') {
            $stats = $this->operationService->processOperationLog($device, $rawBody);
            $this->operationService->writeSyncLog($device, 'oplog', 0, 'success', null,
                "USER:{$stats['users']} FP:{$stats['fingerprints']} FACE:{$stats['faces']}");
            return response("OK", 200)->header('Content-Type', 'text/plain');
        }

        Log::warning('⚠️ Unknown table', ['sn' => $device->serial_number, 'table' => $table]);
        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * Process attendance logs with location validation
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

            // Parse ZK attendance log format
            // Format: PIN,YYYY-MM-DD HH:MM:SS,Verify Mode,In/Out Mode,Work Code
            $parts = explode(",", $line);
            if (count($parts) < 5) {
                Log::warning('⚠️ Invalid ATTLOG line format', ['line' => $line]);
                continue;
            }

            $pin       = trim($parts[0]);
            $dateTime  = trim($parts[1]);
            $verify    = trim($parts[2]);       // 0=fingerprint, 1=password, 2=card, etc.
            $punchType = (int) trim($parts[3]); // 0=check-in, 1=check-out, 2=break-out, 3=break-in
            $workCode  = trim($parts[4] ?? '');

            try {
                $punchTime = \Carbon\Carbon::parse($dateTime);
            } catch (\Exception $e) {
                Log::warning('⚠️ Invalid datetime format', ['line' => $line, 'datetime' => $dateTime]);
                continue;
            }

            // Find employee
            $employee = Employee::where('employee_id', $pin)->first();

            if ($employee) {
                // Validate location access
                $accessCheck = $this->locationAccess->canAccessDevice($employee, $device);

                if (! $accessCheck) {
                    Log::warning('🚫 Punch rejected: Location access denied', [
                        'employee_id' => $pin,
                        'device'      => $device->serial_number,
                        'device_area' => $device->area ?? 'N/A',
                    ]);

                    // Log as failed attempt
                    AttendanceLog::create([
                        'device_id'      => $device->id,
                        'device_sn'      => $device->serial_number,
                        'employee_pin'   => $pin,
                        'employee_id'    => $employee->id,
                        'punch_time'     => $punchTime,
                        'punch_type'     => $punchType,
                        'verify_type'    => $verify,
                        'work_code'      => $workCode,
                        'raw_line_data'  => $line,
                        'status'         => 'failed',
                        'failure_reason' => 'Location access denied',
                    ]);

                    continue;
                }

                // Validate shift timing
                $punchTypeStr = $punchType === 0 ? 'check_in' : ($punchType === 1 ? 'check_out' : 'other');
                $shiftCheck   = $this->locationAccess->validatePunch($employee, $device, $punchTypeStr);

                if (! $shiftCheck['valid']) {
                    Log::warning('🚫 Punch rejected: ' . $shiftCheck['error'], [
                        'employee_id' => $pin,
                        'device'      => $device->serial_number,
                    ]);

                    AttendanceLog::create([
                        'device_id'      => $device->id,
                        'device_sn'      => $device->serial_number,
                        'employee_pin'   => $pin,
                        'employee_id'    => $employee->id,
                        'punch_time'     => $punchTime,
                        'punch_type'     => $punchType,
                        'verify_type'    => $verify,
                        'work_code'      => $workCode,
                        'raw_line_data'  => $line,
                        'status'         => 'failed',
                        'failure_reason' => $shiftCheck['error'],
                    ]);

                    continue;
                }
            } else {
                Log::warning('⚠️ Employee not found for PIN', ['pin' => $pin, 'device' => $device->serial_number]);
            }

            // Save successful attendance log
            $attendanceLog = AttendanceLog::create([
                'device_id'      => $device->id,
                'device_sn'      => $device->serial_number,
                'employee_pin'   => $pin,
                'employee_id'    => $employee?->id,
                'punch_time'     => $punchTime,
                'punch_type'     => $punchType,
                'verify_type'    => $verify,
                'work_code'      => $workCode,
                'raw_line_data'  => $line,
                'status'         => 'success',
                'failure_reason' => null,
            ]);

            // Fire attendance recorded event
            event(new AttendanceRecorded($attendanceLog));

            $saved++;
        }

        Log::info('📝 Attendance logs processed', [
            'device_sn'   => $device->serial_number,
            'total_lines' => count($lines),
            'saved'       => $saved,
            'rejected'    => count($lines) - $saved,
        ]);

        return $saved;
    }

    /**
     * Send handshake response
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

        Log::info('🤝 Handshake sent', ['sn' => $device->serial_number]);
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
     */
    public function deviceCmd(Request $request)
    {
        $sn   = $request->query('SN');
        $body = $request->getContent();

        Log::info('📨 devicecmd', ['sn' => $sn, 'body' => $body]);

        parse_str($body, $params);

        if (! empty($params['ID']) && isset($params['Return'])) {
            $this->commandService->processResponse(
                (int) $params['ID'],
                $body,
                (int) $params['Return']
            );
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
