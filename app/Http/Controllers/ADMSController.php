<?php
namespace App\Http\Controllers;

use App\Events\AttendanceRecorded;
use App\Events\DeviceStatusChanged;
use App\Models\AttendanceLog;
use App\Models\Device;
use App\Models\DeviceCommand;
use App\Models\DeviceSyncLog;
use App\Models\Employee;
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
                'raw_content'  => substr($request->getContent(), 0, 2000), // Log first 2000 chars
            ]);

            if (! $sn) {
                return response('ERROR: Missing SN', 400)->header('Content-Type', 'text/plain');
            }

            $ip       = $request->ip();
            $firmware = $request->query('Ver') ?? $request->input('Ver') ?? 'Unknown';
            $model    = $request->query('Model') ?? $request->input('Model') ?? 'ZKTeco';
            $options  = $request->query('options') ?? $request->input('options');

            $device = Device::where('serial_number', $sn)->first();

            if (! $device) {
                // Save to pending...
                return response("GET OPTION FROM: {$sn}...", 200)->header('Content-Type', 'text/plain');
            }

            // Check if status actually changed before firing event
            $wasOnline = $device->status === 'online';
            $isOnline  = true; // Device just pinged, so it's online

            $device->update([
                'last_seen'  => now(),
                'ip_address' => $ip,
                'firmware'   => $firmware,
                'user_count' => (int) ($request->query('Cnt') ?? $request->input('Cnt', $device->user_count)),
                'fp_count'   => (int) ($request->query('FPCnt') ?? $request->input('FPCnt', $device->fp_count)),
                'face_count' => (int) ($request->query('FaceCnt') ?? $request->input('FaceCnt', $device->face_count)),
                'status'     => 'online',
            ]);

            Log::info('Device counts updated', [
                'sn'         => $sn,
                'user_count' => $device->user_count,
                'fp_count'   => $device->fp_count,
                'face_count' => $device->face_count,
            ]);

            // ONLY fire event if status changed OR throttled (max once per minute per device)
            $cacheKey = "device_event_{$device->id}";
            if (! $wasOnline || ! Cache::has($cacheKey)) {
                event(new DeviceStatusChanged($device, 'online'));
                Cache::put($cacheKey, true, now()->addMinute());
                Log::info('📡 DeviceStatusChanged event fired', ['device' => $sn]);
            }

            // Handle POST data (attendance logs)
            if ($request->isMethod('POST')) {
                $table   = $request->query('table') ?? $request->input('table');
                $rawBody = $request->getContent();

                if ($table === 'ATTLOG') {
                    $count = $this->processAttendanceLogs($device, $rawBody);
                    Log::info("ZK ADMS ATTLOG processed", ['sn' => $sn, 'records' => $count]);
                    return response("OK: {$count}", 200)->header('Content-Type', 'text/plain');
                }
            }

            // GET request - Handshake
            if ($options === 'all') {
                $response = implode("\r\n", [
                    "GET OPTION FROM: {$sn}",
                    "Stamp=9999", "OpStamp=9999", "ErrorDelay=30", "Delay={$device->heartbeat_interval}",
                    "TransTimes=00:00;14:05", "TransInterval=1", "TransFlag=TransData AttLog OpLog EnrollUser ChkWork",
                    "Realtime=1", "Encrypt=None", "ServerVer=2.4.1", "PushProtVer=2.4.1", "PushOptionsFlag=1",
                    "TimeZone=Etc/GMT-1", "ATTLOGStamp=None", "OPERLOGStamp=9999", "ATTPHOTOStamp=None", "",
                ]);
                return response($response, 200)->header('Content-Type', 'text/plain');
            }

            return response("OK", 200)->header('Content-Type', 'text/plain');
        } catch (\Exception $e) {
            Log::error('ZK ADMS Error: ' . $e->getMessage());
            return response("ERROR", 500)->header('Content-Type', 'text/plain');
        }
    }

    private function processAttendanceLogs(Device $device, string $body): int
    {
        $lines = array_filter(explode("\n", trim($body)));
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
            ->pluck('id', 'employee_id');

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

            try {
                $punchTime = Carbon::createFromFormat('Y-m-d H:i:s', $dateTime);
            } catch (\Exception $e) {
                continue;
            }

            // In processAttendanceLogs, add a cache check to prevent reprocessing failures:
            $cacheKey = "attlog_{$device->serial_number}_{$pin}_{$punchTime->timestamp}";

            if (Cache::has($cacheKey)) {
                continue; // Already processed this exact record
            }

            $exists = AttendanceLog::where('device_sn', $device->serial_number)
                ->where('employee_pin', $pin)
                ->where('punch_time', $punchTime)
                ->exists();

            if (! $exists) {
                $employeeId = $employees[$pin] ?? null;
                // If employee doesn't exist, auto-create them
                if (! $employeeId) {
                    $employee = Employee::firstOrCreate(
                        ['employee_id' => $pin],
                        [
                            'first_name'       => 'PIN',
                            'last_name'        => $pin,
                            'active'           => true,
                            'employee_status'  => 'active',
                            'source_device_sn' => $device->serial_number,
                        ]
                    );
                    $employeeId      = $employee->id;
                    $employees[$pin] = $employeeId;
                }
                $log = AttendanceLog::create([
                    'device_id'     => $device->id,
                    'device_sn'     => $device->serial_number,
                    'employee_pin'  => $pin,
                    'punch_time'    => $punchTime,
                    'punch_type'    => $status,
                    'verify_type'   => $verify,
                    'work_code'     => $workCode,
                    'raw_line_data' => $line,
                ]);
                event(new AttendanceRecorded($log));
                $saved++;

                // ... create the record ...
                Cache::put($cacheKey, true, now()->addHours(24));
            }
        }

        return $saved;

    }

    public function getRequest(Request $request)
    {
        try {
            $sn = $request->query('SN');
            Log::info('ZK ADMS getrequest', ['sn' => $sn]);

            if (! $sn) {
                return response('ERROR', 400)->header('Content-Type', 'text/plain');
            }

            $device = Device::where('serial_number', $sn)->first();
            if ($device) {
                $device->update(['last_seen' => now(), 'status' => 'online']);
            }

            return response("OK", 200)->header('Content-Type', 'text/plain');
        } catch (\Exception $e) {
            Log::error('ZK ADMS getrequest Error: ' . $e->getMessage());
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

        Log::info('ZK ADMS devicecmd', ['sn' => $sn, 'body' => $body]);

        // Efficiently parse parameters and update only if ID present
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
     * POST /iclock/upload — Device uploads user/fingerprint data
     */
    public function upload(Request $request)
    {
        $sn    = $request->query('SN');
        $table = $request->query('table');
        $body  = $request->getContent();

        Log::info(sprintf('ZK ADMS Upload: SN=%s table=%s size=%d', $sn, $table, strlen($body)));

        // Only query device if we need it (when table is USERINFO)
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
        Log::info('ZK ADMS fdata', ['query' => $request->query()]);
        return response("OK", 200)->header('Content-Type', 'text/plain');
    }
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

            Employee::firstOrCreate(
                ['employee_id' => $parts[0]],
                [
                    'first_name'       => $parts[1] ?? '',
                    'card'             => $parts[3] ?? null,
                    'source_device_sn' => $sn,
                    'active'           => true,
                    'employee_status'  => 'active',
                ]
            );
            $count++;
        }

        return $count;
    }

    public function processOperationLog(Device $device, string $body): void
    {
        Log::info("ZK ADMS OPERLOG {$device->serial_number}: " . substr($body, 0, 200));
    }

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
}
