<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\AttendanceLog;
use App\Models\Employee;
use App\Models\DeviceCommand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * ZKTeco ADMS Protocol Controller
 *
 * Implements the ZKTeco ADMS (Attendance Data Management System) protocol.
 * All ZKTeco biometric devices communicate via these HTTP endpoints.
 *
 * Protocol reference: Reverse-engineered from ZKBioTime & open-source projects
 * (gatekeeper, zkserver, biostar-adms)
 */
class ADMSController extends Controller
{
    /**
     * GET /iclock/cdata  — Device registration / handshake
     * POST /iclock/cdata — Device pushes attendance records
     *
     * The device sends SN (serial number) as a query param on every request.
     */
    public function cdata(Request $request)
    {
        $sn = $request->query('SN') ?? $request->input('SN');

        if (!$sn) {
            return response('ERROR', 400);
        }

        // Register or update the device
        $device = Device::updateOrCreate(
            ['serial_number' => $sn],
            [
                'last_seen'       => now(),
                'ip_address'      => $request->ip(),
                'firmware'        => $request->query('Ver') ?? $request->input('Ver'),
                'user_count'      => $request->query('Cnt') ?? $request->input('Cnt', 0),
                'fp_count'        => $request->query('FPCnt') ?? $request->input('FPCnt', 0),
                'face_count'      => $request->query('FaceCnt') ?? $request->input('FaceCnt', 0),
                'status'          => 'online',
            ]
        );

        // Handle GET — initial handshake / options request
        if ($request->isMethod('GET')) {
            $options = $request->query('options');

            if ($options === 'all') {
                // Device is asking for its configuration
                // Respond with server time and options
                $serverTime = Carbon::now()->format('Y-m-d H:i:s');
                $timezone   = 'Etc/GMT-1'; // WAT (West Africa Time) = UTC+1

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
                    "TimeZone={$timezone}",
                    "ATTLOGStamp=None",
                    "OPERLOGStamp=9999",
                    "ATTPHOTOStamp=None",
                    "ErrorDelay=30",
                    "Realtime=1",
                    "Encrypt=None",
                    "",
                ]);

                Log::info("ZK Handshake: Device {$sn} connected from {$request->ip()}");

                return response($response, 200)
                    ->header('Content-Type', 'text/plain');
            }

            return response("OK", 200)->header('Content-Type', 'text/plain');
        }

        // Handle POST — device is pushing data
        if ($request->isMethod('POST')) {
            $table    = $request->query('table') ?? $request->input('table');
            $rawBody  = $request->getContent();

            Log::debug("ZK Data Push: SN={$sn} table={$table}", ['body' => substr($rawBody, 0, 500)]);

            switch ($table) {
                case 'ATTLOG':
                    $this->processAttendanceLogs($sn, $rawBody);
                    break;

                case 'OPERLOG':
                    $this->processOperationLog($sn, $rawBody);
                    break;

                case 'ATTPHOTO':
                    // Attendance photos - store if needed
                    Log::info("ZK Photo received from {$sn}");
                    break;

                default:
                    Log::warning("ZK Unknown table '{$table}' from {$sn}");
            }

            return response("OK: 0", 200)->header('Content-Type', 'text/plain');
        }

        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * GET /iclock/getrequest — Device polls for pending commands
     *
     * The device calls this every ~10 seconds to check if the server
     * has any commands to send (e.g., enroll user, delete user, reboot).
     */
    public function getRequest(Request $request)
    {
        $sn = $request->query('SN');

        if (!$sn) {
            return response('ERROR', 400);
        }

        // Update device heartbeat
        Device::where('serial_number', $sn)->update([
            'last_seen' => now(),
            'status'    => 'online',
        ]);

        // Check for pending commands for this device
        $command = DeviceCommand::where('device_sn', $sn)
            ->where('status', 'pending')
            ->oldest()
            ->first();

        if ($command) {
            $command->update(['status' => 'sent', 'sent_at' => now()]);

            // ZKTeco command format: C:ID:COMMAND PARAMS
            $cmdStr = "C:{$command->id}:{$command->command}";
            if ($command->params) {
                $cmdStr .= " {$command->params}";
            }

            Log::info("ZK Command sent to {$sn}: {$cmdStr}");
            return response($cmdStr, 200)->header('Content-Type', 'text/plain');
        }

        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * POST /iclock/devicecmd — Device sends command execution result
     */
    public function deviceCmd(Request $request)
    {
        $sn   = $request->query('SN');
        $body = $request->getContent();

        // Parse: ID=<id>&Return=<code>&CMD=<command>
        parse_str($body, $params);

        if (isset($params['ID'])) {
            DeviceCommand::where('id', $params['ID'])->update([
                'status'      => ($params['Return'] ?? '0') === '0' ? 'success' : 'failed',
                'response'    => $body,
                'executed_at' => now(),
            ]);
        }

        Log::info("ZK Command result from {$sn}: {$body}");

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

        Log::info("ZK Upload from {$sn} table={$table}", ['size' => strlen($body)]);

        if ($table === 'USERINFO') {
            $this->processUserInfo($sn, $body);
        }

        return response("OK: 0", 200)->header('Content-Type', 'text/plain');
    }

    /**
     * GET /iclock/fdata — Firmware data (respond with empty/ok)
     */
    public function fdata(Request $request)
    {
        return response("OK", 200)->header('Content-Type', 'text/plain');
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Parse and store ATTLOG records.
     *
     * ATTLOG format (tab or space separated):
     * PIN  Date       Time     Status  Verify  WorkCode  Reserved
     * 1027 2026-04-16 09:12:45 0       1       0         0
     *
     * Status: 0=Check In, 1=Check Out, 2=Break Out, 3=Break In, 4=OT In, 5=OT Out
     * Verify: 1=Fingerprint, 4=Password, 15=Face
     */
    private function processAttendanceLogs(string $sn, string $body): void
    {
        $lines = array_filter(explode("\n", trim($body)));
        $saved = 0;

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // Handle both tab and space-separated formats
            $parts = preg_split('/[\t ]+/', $line);

            if (count($parts) < 3) continue;

            $pin       = $parts[0] ?? null;
            $dateTime  = ($parts[1] ?? '') . ' ' . ($parts[2] ?? '');
            $status    = (int)($parts[3] ?? 0);
            $verify    = (int)($parts[4] ?? 1);
            $workCode  = $parts[5] ?? '0';

            if (!$pin) continue;

            try {
                $punchTime = Carbon::createFromFormat('Y-m-d H:i:s', trim($dateTime));
            } catch (\Exception $e) {
                Log::warning("ZK Bad datetime '{$dateTime}' from {$sn}");
                continue;
            }

            // Avoid duplicate records
            $exists = AttendanceLog::where('device_sn', $sn)
                ->where('employee_pin', $pin)
                ->where('punch_time', $punchTime)
                ->exists();

            if (!$exists) {
                AttendanceLog::create([
                    'device_sn'    => $sn,
                    'employee_pin' => $pin,
                    'punch_time'   => $punchTime,
                    'punch_type'   => $status,
                    'verify_type'  => $verify,
                    'work_code'    => $workCode,
                ]);
                $saved++;
            }
        }

        Log::info("ZK ATTLOG from {$sn}: parsed " . count($lines) . " lines, saved {$saved} new records");
    }

    /**
     * Parse USERINFO records pushed by device
     */
    private function processUserInfo(string $sn, string $body): void
    {
        $lines = array_filter(explode("\n", trim($body)));

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) continue;

            // Format: PIN\tName\tPassword\tCard\tGroup\tTimeZone\tPrivilege\tEnabled
            $parts = explode("\t", $line);
            if (count($parts) < 2) continue;

            $pin  = $parts[0];
            $name = $parts[1] ?? '';

            Employee::updateOrCreate(
                ['pin' => $pin],
                [
                    'name'     => $name,
                    'card'     => $parts[3] ?? null,
                    'source_device_sn' => $sn,
                ]
            );
        }
    }

    /**
     * Process operation log (admin actions on device)
     */
    private function processOperationLog(string $sn, string $body): void
    {
        Log::info("ZK OPERLOG from {$sn}: " . substr($body, 0, 200));
    }
}
