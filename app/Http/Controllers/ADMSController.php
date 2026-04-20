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

/**
 * ZKTeco ADMS Protocol Controller
 *
 * All routes under /iclock/* MUST:
 *   - Be excluded from CSRF (add to VerifyCsrfToken::$except)
 *   - Be accessible WITHOUT auth middleware
 *
 * Protocol: Reverse-engineered from ZKBioTime & open-source projects
 * (gatekeeper, zkserver, biostar-adms)
 */
class ADMSController extends Controller
{
    /**
     * GET  /iclock/cdata  — Device registration / handshake
     * POST /iclock/cdata  — Device pushes attendance / user data
     */
    public function cdata(Request $request): \Illuminate\Http\Response
    {
        $sn = $request->query('SN') ?? $request->input('SN');
        if (!$sn) {
            return response('ERROR', 400)->header('Content-Type', 'text/plain');
        }

        $ip       = $request->ip();
        $firmware = $request->query('Ver') ?? $request->input('Ver');

        // ── Resolve device ────────────────────────────────────────────────────
        $device = Device::where('serial_number', $sn)->first();

        if (!$device) {
            // Unknown — log as pending, still respond OK so device keeps checking in
            $pending = PendingDevice::firstOrNew(['serial_number' => $sn]);
            $pending->ip_address     = $ip;
            $pending->firmware       = $firmware;
            $pending->last_heartbeat = now();
            $pending->request_count  = ($pending->request_count ?? 0) + 1;
            if (!$pending->exists) {
                $pending->status     = 'pending';
                $pending->first_seen = now();
            }
            $pending->save();

            Log::info("ZK ADMS: Unknown device {$sn} from {$ip} — queued as pending");

            // Still respond with minimal handshake so device doesn't error
            return response("GET OPTION FROM: {$sn}\r\nServerVer=2.4.1\r\nRealtime=1\r\n\r\n", 200)
                ->header('Content-Type', 'text/plain');
        }

        // ── Update known device ───────────────────────────────────────────────
        $device->update([
            'last_seen'   => now(),
            'ip_address'  => $ip,
            'firmware'    => $firmware ?? $device->firmware,
            'user_count'  => (int)($request->query('Cnt')     ?? $request->input('Cnt',     $device->user_count)),
            'fp_count'    => (int)($request->query('FPCnt')   ?? $request->input('FPCnt',   $device->fp_count)),
            'face_count'  => (int)($request->query('FaceCnt') ?? $request->input('FaceCnt', $device->face_count)),
            'status'      => 'online',
        ]);

        // ── GET = Handshake ───────────────────────────────────────────────────
        if ($request->isMethod('GET')) {
            $this->writeSyncLog($device, 'heartbeat', 0, 'success', '0.1s', 'Heartbeat OK');

            if ($request->query('options') === 'all') {
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
                Log::info("ZK ADMS Handshake: {$sn} @ {$ip}");
                return response($response, 200)->header('Content-Type', 'text/plain');
            }

            return response("OK", 200)->header('Content-Type', 'text/plain');
        }

        // ── POST = Data push ──────────────────────────────────────────────────
        $table   = $request->query('table') ?? $request->input('table');
        $rawBody = $request->getContent();

        Log::debug("ZK ADMS Push: SN={$sn} table={$table}", ['preview' => substr($rawBody, 0, 300)]);

        switch ($table) {
            case 'ATTLOG':
                $count = $this->processAttendanceLogs($device, $rawBody);
                $this->writeSyncLog($device, 'attendance', $count, 'success', null, "{$count} attendance records synced");
                break;

            case 'OPERLOG':
                $this->processOperationLog($device, $rawBody);
                break;

            case 'USERINFO':
                $count = $this->processUserInfo($sn, $rawBody);
                $this->writeSyncLog($device, 'user', $count, 'success', null, "{$count} users synchronized");
                break;

            default:
                Log::warning("ZK ADMS: Unknown table '{$table}' from {$sn}");
        }

        return response("OK: 0", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * GET /iclock/getrequest — Device polls for pending commands (~every 10s)
     */
    public function getRequest(Request $request): \Illuminate\Http\Response
    {
        $sn = $request->query('SN');
        if (!$sn) {
            return response('ERROR', 400)->header('Content-Type', 'text/plain');
        }

        $device = Device::where('serial_number', $sn)->first();
        if ($device) {
            $device->update(['last_seen' => now(), 'status' => 'online']);
            $this->writeSyncLog($device, 'heartbeat', 0, 'success', '0.1s', 'Heartbeat OK');
        }

        // Check for pending commands
        $command = DeviceCommand::where('device_sn', $sn)
            ->where('status', 'pending')
            ->oldest()
            ->first();

        if ($command) {
            $command->update(['status' => 'sent', 'sent_at' => now()]);
            $cmdStr = "C:{$command->id}:{$command->command}";
            if ($command->params) $cmdStr .= " {$command->params}";
            Log::info("ZK ADMS Command sent to {$sn}: {$cmdStr}");
            return response($cmdStr, 200)->header('Content-Type', 'text/plain');
        }

        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * POST /iclock/devicecmd — Device sends command execution result
     */
    public function deviceCmd(Request $request): \Illuminate\Http\Response
    {
        $sn   = $request->query('SN');
        $body = $request->getContent();
        parse_str($body, $params);

        if (isset($params['ID'])) {
            DeviceCommand::where('id', $params['ID'])->update([
                'status'       => (($params['Return'] ?? '0') === '0') ? 'success' : 'failed',
                'return_code'  => $params['Return'] ?? null,
                'response'     => $body,
                'completed_at' => now(),
            ]);
        }

        Log::info("ZK ADMS Command result from {$sn}: " . substr($body, 0, 200));
        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * POST /iclock/upload — Device uploads user/fingerprint data
     */
    public function upload(Request $request): \Illuminate\Http\Response
    {
        $sn    = $request->query('SN');
        $table = $request->query('table');
        $body  = $request->getContent();

        $device = Device::where('serial_number', $sn)->first();
        Log::info("ZK ADMS Upload: SN={$sn} table={$table} size=" . strlen($body));

        if ($table === 'USERINFO') {
            $count = $this->processUserInfo($sn, $body);
            if ($device) $this->writeSyncLog($device, 'upload', $count, 'success', null, "Uploaded {$count} users");
        }

        return response("OK: 0", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * GET /iclock/fdata — Firmware data endpoint
     */
    public function fdata(): \Illuminate\Http\Response
    {
        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    // =========================================================================
    // Private Helpers
    // =========================================================================

    /**
     * Parse ATTLOG body and store attendance records.
     *
     * ZKTeco ATTLOG format (tab or space separated):
     *   PIN  Date        Time      Status  Verify  WorkCode  Reserved
     *   1027 2026-04-16  09:12:45  0       1       0         0
     *
     * Status:  0=Check In, 1=Check Out, 2=Break Out, 3=Break In, 4=OT In, 5=OT Out
     * Verify:  1/2/3=Fingerprint, 4=Face, 15=Password
     */
    private function processAttendanceLogs(Device $device, string $body): int
    {
        $lines = array_filter(explode("\n", trim($body)));
        $saved = 0;

        // Pre-load employee IDs for this batch to avoid N+1
        $pins      = [];
        $parsedRows = [];
        foreach ($lines as $line) {
            $line  = trim($line);
            if (!$line) continue;
            $parts = preg_split('/[\t ]+/', $line);
            if (count($parts) < 3) continue;
            $pins[] = $parts[0];
            $parsedRows[] = $parts;
        }

        $employees = Employee::whereIn('employee_id', array_unique($pins))
            ->pluck('id', 'employee_id');

        foreach ($parsedRows as $parts) {
            $pin      = $parts[0];
            $dateTime = trim(($parts[1] ?? '') . ' ' . ($parts[2] ?? ''));
            $status   = (int)($parts[3] ?? 0);
            $verify   = (int)($parts[4] ?? 1);
            $workCode = $parts[5] ?? '0';

            try {
                $punchTime = Carbon::createFromFormat('Y-m-d H:i:s', $dateTime);
            } catch (\Exception $e) {
                Log::warning("ZK ADMS: Bad datetime '{$dateTime}' from {$device->serial_number}");
                continue;
            }

            // Check duplicate (unique constraint also enforces this at DB level)
            $exists = AttendanceLog::where('device_sn', $device->serial_number)
                ->where('employee_pin', $pin)
                ->where('punch_time', $punchTime)
                ->exists();

            if (!$exists) {
                AttendanceLog::create([
                    'device_id'    => $device->id,
                    'device_sn'    => $device->serial_number,
                    'employee_pin' => $pin,
                    'employee_id'  => $employees[$pin] ?? 0,
                    'punch_time'   => $punchTime,
                    'punch_type'   => $status,
                    'verify_type'  => $verify,
                    'work_code'    => $workCode,
                ]);
                $saved++;
            }
        }

        Log::info("ZK ADMS ATTLOG {$device->serial_number}: " . count($parsedRows) . " lines, {$saved} new records saved");
        return $saved;
    }

    /**
     * Parse USERINFO body: PIN\tName\tPassword\tCard\tGroup\tTimeZone\tPrivilege\tEnabled
     */
    private function processUserInfo(string $sn, string $body): int
    {
        $lines = array_filter(explode("\n", trim($body)));
        $count = 0;

        foreach ($lines as $line) {
            $line  = trim($line);
            if (!$line) continue;
            $parts = explode("\t", $line);
            if (count($parts) < 2) continue;

            $pin  = $parts[0];
            $name = $parts[1] ?? '';

            // Auto-create employee if not exists (from device)
            Employee::firstOrCreate(
                ['employee_id' => $pin],
                [
                    'first_name'       => $name,
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

    private function processOperationLog(Device $device, string $body): void
    {
        Log::info("ZK ADMS OPERLOG {$device->serial_number}: " . substr($body, 0, 200));
    }

    private function writeSyncLog(Device $device, string $type, int $records, string $status, ?string $duration, string $message): void
    {
        DeviceSyncLog::create([
            'device_sn' => $device->serial_number,
            'device_id' => $device->id,
            'type'      => $type,
            'records'   => $records,
            'status'    => $status,
            'duration'  => $duration,
            'message'   => $message,
            'synced_at' => now(),
        ]);
    }
}
