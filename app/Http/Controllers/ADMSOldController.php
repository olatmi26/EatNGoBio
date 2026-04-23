<?php
namespace App\Http\Controllers;

use App\Events\AttendanceRecorded;
use App\Events\DeviceStatusChanged;
use App\Models\AttendanceLog;
use App\Models\BiometricTemplate;
use App\Models\Device;
use App\Models\DeviceCommand;
use App\Models\DeviceSyncLog;
use App\Models\Employee;
use App\Models\PendingDevice;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class ADMSOldController extends Controller
{
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
                'raw_content'  => substr($request->getContent(), 0, 1000),
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

            $this->writeSyncLog($device, 'heartbeat', 0, 'success', null, 'Heartbeat OK');
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
            $this->writeSyncLog($device, 'attendance', $count, 'success', null, "{$count} records");
            Log::info('✅ ATTLOG processed', ['sn' => $device->serial_number, 'count' => $count]);
            return response("OK: {$count}", 200)->header('Content-Type', 'text/plain');
        }

        if ($table === 'USERINFO') {
            $count = $this->processUserInfo($device, $rawBody);
            $this->writeSyncLog($device, 'user_sync', $count, 'success', null, "{$count} users");
            Log::info('✅ USERINFO processed', ['sn' => $device->serial_number, 'count' => $count]);
            return response("OK: {$count}", 200)->header('Content-Type', 'text/plain');
        }

        if ($table === 'OPERLOG') {
            $this->processOperationLog($device, $rawBody);
            return response("OK", 200)->header('Content-Type', 'text/plain');
        }

        Log::warning('⚠️ Unknown table', ['sn' => $device->serial_number, 'table' => $table]);
        return response("OK", 200)->header('Content-Type', 'text/plain');
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
     * Process OPERLOG - Contains USER, FP, FACE data
     */
    private function processOperationLog(Device $device, string $body): void
    {
        Log::info("📋 OPERLOG received", ['sn' => $device->serial_number, 'length' => strlen($body)]);

        $lines     = preg_split("/\r\n|\n|\r/", trim($body));
        $userCount = 0;
        $fpCount   = 0;
        $faceCount = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            // Process USER data
            if (strpos($line, 'USER') === 0) {
                if ($this->processUserLine($device, $line)) {
                    $userCount++;
                }
            }

            // Process Fingerprint data
            if (strpos($line, 'FP') === 0) {
                if ($this->processFingerprintLine($device, $line)) {
                    $fpCount++;
                }
            }

            // Process Face data
            if (strpos($line, 'FACE') === 0) {
                if ($this->processFaceLine($device, $line)) {
                    $faceCount++;
                }
            }
        }

        // Update device counts
        if ($userCount > 0 || $fpCount > 0 || $faceCount > 0) {
            $this->updateDeviceCounts($device);
        }

        $this->writeSyncLog($device, 'oplog', 0, 'success', null,
            "USER:{$userCount} FP:{$fpCount} FACE:{$faceCount}");

        Log::info('📊 OPERLOG summary', [
            'sn'           => $device->serial_number,
            'users'        => $userCount,
            'fingerprints' => $fpCount,
            'faces'        => $faceCount,
        ]);
    }

    /**
     * Process USER line from OPERLOG
     */
    private function processUserLine(Device $device, string $line): bool
    {
        if (! preg_match('/PIN=(\d+)/i', $line, $matches)) {
            return false;
        }
        $pin = $matches[1];

        $name = '';
        if (preg_match('/Name=([^\t\r\n]+)/i', $line, $nameMatches)) {
            $name = trim($nameMatches[1]);
        }

        $card = null;
        if (preg_match('/Card=([^\t\r\n]*)/i', $line, $cardMatches)) {
            $card = trim($cardMatches[1]) ?: null;
        }

        Log::info('👤 Processing USER', ['pin' => $pin, 'name' => $name]);

        $employee = Employee::where('employee_id', $pin)->first();

        if ($employee) {
            $employee->update([
                'source_device_sn' => $device->serial_number,
                'card'             => $card ?: $employee->card,
            ]);

            // Add device area to biometric_areas if not present
            $biometricAreas = $employee->biometric_areas ?? [];
            if ($device->area && ! in_array($device->area, $biometricAreas)) {
                $biometricAreas[] = $device->area;
                $employee->update(['biometric_areas' => $biometricAreas]);
            }

            if (empty($employee->first_name) || $employee->first_name === 'PIN') {
                $nameParts = explode(' ', trim($name), 2);
                $employee->update([
                    'first_name' => $nameParts[0] ?: 'Employee',
                    'last_name'  => $nameParts[1] ?: $pin,
                ]);
            }

            Log::info('✅ Employee updated', ['pin' => $pin]);
        } else {
            $nameParts = explode(' ', trim($name), 2);
            $employee  = Employee::create([
                'employee_id'      => $pin,
                'first_name'       => $nameParts[0] ?: 'Employee',
                'last_name'        => $nameParts[1] ?: $pin,
                'card'             => $card,
                'source_device_sn' => $device->serial_number,
                'biometric_areas'  => $device->area ? [$device->area] : [],
                'active'           => true,
                'employee_status'  => 'active',
                'app_status'       => true,
            ]);

            Log::info('🆕 Employee created', ['pin' => $pin, 'name' => $name]);
        }

        return true;
    }

    /**
     * Process Fingerprint line from OPERLOG
     */
    private function processFingerprintLine(Device $device, string $line): bool
    {
        if (! preg_match('/PIN=(\d+)/i', $line, $matches)) {
            return false;
        }
        $pin = $matches[1];

        $fid = 0;
        if (preg_match('/FID=(\d+)/i', $line, $matches)) {
            $fid = (int) $matches[1];
        }

        $size = 0;
        if (preg_match('/Size=(\d+)/i', $line, $matches)) {
            $size = (int) $matches[1];
        }

        $valid = true;
        if (preg_match('/Valid=(\d+)/i', $line, $matches)) {
            $valid = $matches[1] === '1';
        }

        $template = null;
        if (preg_match('/TMP=([^\r\n]+)/i', $line, $matches)) {
            $template = $matches[1];
        }

        Log::info('🖐️ Processing Fingerprint', ['pin' => $pin, 'fid' => $fid, 'size' => $size]);

        $employee = Employee::where('employee_id', $pin)->first();
        if (! $employee) {
            $employee = Employee::create([
                'employee_id'      => $pin,
                'first_name'       => 'PIN',
                'last_name'        => $pin,
                'source_device_sn' => $device->serial_number,
                'biometric_areas'  => $device->area ? [$device->area] : [],
                'active'           => true,
                'employee_status'  => 'active',
                'app_status'       => true,
            ]);
            Log::info('🆕 Employee auto-created for fingerprint', ['pin' => $pin]);
        }

        BiometricTemplate::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'device_sn'   => $device->serial_number,
                'type'        => 'fingerprint',
                'finger_id'   => $fid,
            ],
            [
                'template_size' => $size,
                'template_data' => $template,
                'is_valid'      => $valid,
            ]
        );

        Log::info('✅ Fingerprint saved', ['pin' => $pin, 'fid' => $fid]);
        return true;
    }

    /**
     * Process Face line from OPERLOG
     */
    private function processFaceLine(Device $device, string $line): bool
    {
        if (! preg_match('/PIN=(\d+)/i', $line, $matches)) {
            return false;
        }
        $pin = $matches[1];

        $size = 0;
        if (preg_match('/SIZE=(\d+)/i', $line, $matches)) {
            $size = (int) $matches[1];
        }

        $valid = true;
        if (preg_match('/VALID=(\d+)/i', $line, $matches)) {
            $valid = $matches[1] === '1';
        }

        $template = null;
        if (preg_match('/TMP=([^\r\n]+)/i', $line, $matches)) {
            $template = $matches[1];
        }

        Log::info('😊 Processing Face', ['pin' => $pin, 'size' => $size]);

        $employee = Employee::where('employee_id', $pin)->first();
        if (! $employee) {
            $employee = Employee::create([
                'employee_id'      => $pin,
                'first_name'       => 'PIN',
                'last_name'        => $pin,
                'source_device_sn' => $device->serial_number,
                'biometric_areas'  => $device->area ? [$device->area] : [],
                'active'           => true,
                'employee_status'  => 'active',
                'app_status'       => true,
            ]);
            Log::info('🆕 Employee auto-created for face', ['pin' => $pin]);
        }

        BiometricTemplate::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'device_sn'   => $device->serial_number,
                'type'        => 'face',
                'finger_id'   => 0,
            ],
            [
                'template_size' => $size,
                'template_data' => $template,
                'is_valid'      => $valid,
            ]
        );

        Log::info('✅ Face saved', ['pin' => $pin]);
        return true;
    }

    /**
     * Update device user, fp, and face counts
     */
    private function updateDeviceCounts(Device $device): void
    {
        $userCount = Employee::where('source_device_sn', $device->serial_number)->count();

        $fpCount = BiometricTemplate::where('device_sn', $device->serial_number)
            ->where('type', 'fingerprint')
            ->where('is_valid', true)
            ->count();

        $faceCount = BiometricTemplate::where('device_sn', $device->serial_number)
            ->where('type', 'face')
            ->where('is_valid', true)
            ->count();

        $device->update([
            'user_count' => $userCount,
            'fp_count'   => $fpCount,
            'face_count' => $faceCount,
        ]);

        Log::info('📊 Device counts updated', [
            'sn'    => $device->serial_number,
            'users' => $userCount,
            'fp'    => $fpCount,
            'face'  => $faceCount,
        ]);
    }

    /**
     * Process USERINFO data
     */
    private function processUserInfo(Device $device, string $body): int
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

            $pin     = $parts[0];
            $name    = $parts[1] ?? '';
            $card    = $parts[3] ?? null;
            $enabled = $parts[7] ?? '1';

            $employee = Employee::where('employee_id', $pin)->first();

            if ($employee) {
                $employee->update([
                    'source_device_sn' => $device->serial_number,
                    'card'             => $card ?: $employee->card,
                    'active'           => $enabled === '1',
                ]);
            } else {
                $nameParts = explode(' ', trim($name), 2);
                Employee::create([
                    'employee_id'      => $pin,
                    'first_name'       => $nameParts[0] ?: 'Employee',
                    'last_name'        => $nameParts[1] ?: $pin,
                    'card'             => $card,
                    'source_device_sn' => $device->serial_number,
                    'biometric_areas'  => $device->area ? [$device->area] : [],
                    'active'           => $enabled === '1',
                    'employee_status'  => 'active',
                    'app_status'       => true,
                ]);
            }
            $count++;
        }

        $this->updateDeviceCounts($device);
        return $count;
    }

    /**
     * Process attendance logs
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

            $punchType = $status > 5 ? 0 : $status;

            try {
                $punchTime = Carbon::createFromFormat('Y-m-d H:i:s', $dateTime);
            } catch (\Exception $e) {
                continue;
            }

            $cacheKey = "attlog_{$device->serial_number}_{$pin}_{$punchTime->timestamp}";
            if (Cache::has($cacheKey)) {
                continue;
            }

            $exists = AttendanceLog::where('device_sn', $device->serial_number)
                ->where('employee_pin', $pin)
                ->where('punch_time', $punchTime)
                ->exists();

            if ($exists) {
                Cache::put($cacheKey, true, now()->addHours(24));
                continue;
            }

            $employee = Employee::where('employee_id', $pin)->first();
            if (! $employee) {
                $employee = Employee::create([
                    'employee_id'      => $pin,
                    'first_name'       => 'PIN',
                    'last_name'        => $pin,
                    'source_device_sn' => $device->serial_number,
                    'biometric_areas'  => $device->area ? [$device->area] : [],
                    'active'           => true,
                    'employee_status'  => 'active',
                    'app_status'       => true,
                ]);
            } else {
                $employee->update(['source_device_sn' => $device->serial_number]);
            }

            $log = AttendanceLog::create([
                'device_id'     => $device->id,
                'device_sn'     => $device->serial_number,
                'employee_pin'  => $pin,
                'employee_id'   => $employee->id,
                'punch_time'    => $punchTime,
                'punch_type'    => $punchType,
                'verify_type'   => $verify,
                'work_code'     => $workCode,
                'raw_line_data' => $line,
            ]);

            Cache::put($cacheKey, true, now()->addHours(24));
            $saved++;

            event(new AttendanceRecorded($log));
        }

        return $saved;
    }

    /**
     * Write sync log entry
     */
    private function writeSyncLog(Device $device, string $type, int $records, string $status, ?string $duration, string $message): void
    {
        $typeMap = [
            'attendance' => 'att',
            'heartbeat'  => 'hb',
            'user_sync'  => 'usr',
            'oplog'      => 'op',
            'upload'     => 'up',
        ];

        $shortType = $typeMap[$type] ?? substr($type, 0, 10);

        $now = now();
        DeviceSyncLog::create([
            'device_sn'  => $device->serial_number,
            'device_id'  => $device->id,
            'type'       => $shortType,
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
     * GET /iclock/getrequest — Device polls for commands
     */
    public function getRequest(Request $request)
    {
        try {
            $sn = $request->query('SN');
            Log::info('📥 getrequest', ['sn' => $sn]);

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

        if (! empty($params['ID'])) {
            DeviceCommand::where('id', $params['ID'])->update([
                'status'       => (isset($params['Return']) && $params['Return'] === '0') ? 'success' : 'failed',
                'return_code'  => $params['Return'] ?? null,
                'response'     => $body,
                'completed_at' => now(),
            ]);
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
                $count = $this->processUserInfo($device, $body);
                $this->writeSyncLog($device, 'upload', $count, 'success', null, "Uploaded {$count} users");
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
