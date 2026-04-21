<?php
namespace App\Http\Controllers;

use App\Models\AttendanceLog;
use App\Models\Device;
use App\Models\DeviceCommand;
use App\Models\DeviceSyncLog;
use App\Models\Employee;
use App\Models\PendingDevice;
use Carbon\Carbon;
use Illuminate\Http\Request;
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

            // Log the incoming request
            Log::info('ZK ADMS cdata', [
                'method'  => $request->method(),
                'sn'      => $sn,
                'ip'      => $request->ip(),
                'options' => $request->query('options'),
            ]);

            if (! $sn) {
                return response('ERROR: Missing SN', 400)->header('Content-Type', 'text/plain');
            }

            $ip       = $request->ip();
            $firmware = $request->query('Ver') ?? $request->input('Ver') ?? 'Unknown';
            $model    = $request->query('Model') ?? $request->input('Model') ?? 'ZKTeco';
            $options  = $request->query('options') ?? $request->input('options');

            // Check if device exists
            $device = Device::where('serial_number', $sn)->first();

            if (! $device) {
                // Save to pending devices
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

                Log::info("ZK ADMS: Unknown device {$sn} saved as pending");

                // Return handshake response
                if ($options === 'all') {
                    $response = implode("\r\n", [
                        "GET OPTION FROM: {$sn}",
                        "Stamp=9999",
                        "OpStamp=9999",
                        "ErrorDelay=30",
                        "Delay=10",
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
                    return response($response, 200)->header('Content-Type', 'text/plain');
                }

                return response("OK", 200)->header('Content-Type', 'text/plain');
            }

            // Device exists - update last seen
            $device->update([
                'last_seen'  => now(),
                'ip_address' => $ip,
                'firmware'   => $firmware,
                'status'     => 'online',
            ]);

            Log::info("ZK ADMS: Device {$sn} online");

            if ($request->isMethod('GET')) {
                if ($options === 'all') {
                    $response = implode("\r\n", [
                        "GET OPTION FROM: {$sn}",
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
                    return response($response, 200)->header('Content-Type', 'text/plain');
                }
                return response("OK", 200)->header('Content-Type', 'text/plain');
            }

            return response("OK", 200)->header('Content-Type', 'text/plain');

        } catch (\Exception $e) {
            Log::error('ZK ADMS Error: ' . $e->getMessage(), [
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response("ERROR", 500)->header('Content-Type', 'text/plain');
        }
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

        if (!empty($params['ID'])) {
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

    // =========================================================================
    // Private Helpers
    // =========================================================================

    public function processAttendanceLogs(Device $device, string $body): int
    {
        $lines = preg_split("/\r\n|\n|\r/", trim($body));
        $saved = 0;
        $deviceSn = $device->serial_number;
        $deviceId = $device->id;
        $totalLines = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line === '') {
                continue;
            }
            $totalLines++;

            $parts = preg_split('/[\t ]+/', $line);
            if (count($parts) < 3) {
                continue;
            }

            $pin      = $parts[0];
            $dateTime = trim(($parts[1] ?? '') . ' ' . ($parts[2] ?? ''));
            $status   = isset($parts[3]) ? (int) $parts[3] : 0;
            $verify   = isset($parts[4]) ? (int) $parts[4] : 1;
            $workCode = $parts[5] ?? '0';

            try {
                $punchTime = Carbon::createFromFormat('Y-m-d H:i:s', $dateTime);
            } catch (\Exception $e) {
                Log::warning("ZK ADMS: Bad datetime '{$dateTime}' from {$deviceSn}");
                continue;
            }

            // Duplicate check via primary fields, only if required
            if (!AttendanceLog::where([
                ['device_sn', '=', $deviceSn],
                ['employee_pin', '=', $pin],
                ['punch_time', '=', $punchTime]
            ])->exists()) {
                AttendanceLog::create([
                    'device_id'     => $deviceId,
                    'device_sn'     => $deviceSn,
                    'employee_pin'  => $pin,
                    'punch_time'    => $punchTime,
                    'punch_type'    => $status,
                    'verify_type'   => $verify,
                    'work_code'     => $workCode,
                    'raw_line_data' => $line,
                ]);
                $saved++;
            }
        }

        Log::info("ZK ADMS ATTLOG {$deviceSn}: {$totalLines} lines, {$saved} new records");
        return $saved;
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
