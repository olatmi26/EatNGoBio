<?php
namespace App\Services;

use App\Events\AttendanceRecorded;
use App\Models\AttendanceLog;
use App\Models\BiometricTemplate;
use App\Models\Device;
use App\Models\DeviceSyncLog;
use App\Models\Employee;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class DeviceOperationService
{
    /**
     * Process attendance logs from device
     */
    public function processAttendanceLogs(Device $device, string $body): int
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

            // Sanitize punch_type - ZKTeco standard is 0-5
            $punchType = $status > 5 ? 0 : $status;

            try {
                $punchTime = Carbon::createFromFormat('Y-m-d H:i:s', $dateTime);
            } catch (\Exception $e) {
                Log::warning('⚠️ Invalid datetime format', ['datetime' => $dateTime]);
                continue;
            }

            // Check duplicate via cache
            $cacheKey = "attlog_{$device->serial_number}_{$pin}_{$punchTime->timestamp}";
            if (Cache::has($cacheKey)) {
                continue;
            }

            // Check duplicate via database
            $exists = AttendanceLog::where('device_sn', $device->serial_number)
                ->where('employee_pin', $pin)
                ->where('punch_time', $punchTime)
                ->exists();

            if ($exists) {
                Cache::put($cacheKey, true, now()->addHours(24));
                continue;
            }

            // Find or create employee
            $employee = $this->findOrCreateEmployee($pin, $device);

            // Create attendance log
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

            Log::info('✅ Attendance saved', [
                'pin'  => $pin,
                'type' => $punchType,
                'time' => $punchTime->toDateTimeString(),
            ]);
        }

        return $saved;
    }

    /**
     * Process USERINFO data from device
     */
    public function processUserInfo(Device $device, string $body): int
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

            $this->syncEmployeeFromDevice($pin, $name, $card, $device, $enabled === '1');
            $count++;
        }

        $this->updateDeviceCounts($device);

        Log::info('✅ USERINFO processed', ['sn' => $device->serial_number, 'count' => $count]);
        return $count;
    }

    /**
     * Process OPERLOG - Contains USER, FP, FACE data
     */
    public function processOperationLog(Device $device, string $body): array
    {
        Log::info("📋 OPERLOG received", ['sn' => $device->serial_number, 'length' => strlen($body)]);

        $lines = preg_split("/\r\n|\n|\r/", trim($body));
        $stats = ['users' => 0, 'fingerprints' => 0, 'faces' => 0];

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line)) {
                continue;
            }

            // Process USER data
            if (strpos($line, 'USER') === 0) {
                if ($this->processUserLine($device, $line)) {
                    $stats['users']++;
                }
            }

            // Process Fingerprint data
            if (strpos($line, 'FP') === 0) {
                if ($this->processFingerprintLine($device, $line)) {
                    $stats['fingerprints']++;
                }
            }

            // Process Face data
            if (strpos($line, 'FACE') === 0) {
                if ($this->processFaceLine($device, $line)) {
                    $stats['faces']++;
                }
            }
        }

        // Update device counts if any data was processed
        if ($stats['users'] > 0 || $stats['fingerprints'] > 0 || $stats['faces'] > 0) {
            $this->updateDeviceCounts($device);
        }

        Log::info('📊 OPERLOG summary', array_merge(['sn' => $device->serial_number], $stats));
        return $stats;
    }

    /**
     * Process USER line from OPERLOG
     * Format: USER PIN=1 Name=taiwo Pri=14 Passwd= Card= Grp=1
     */
    public function processUserLine(Device $device, string $line): bool
    {
        $parsed = $this->parseUserLine($line);
        if (! $parsed) {
            return false;
        }

        Log::info('👤 Processing USER', ['pin' => $parsed['pin'], 'name' => $parsed['name']]);

        $this->syncEmployeeFromDevice(
            $parsed['pin'],
            $parsed['name'],
            $parsed['card'],
            $device,
            true
        );

        return true;
    }

    /**
     * Process Fingerprint line from OPERLOG
     * Format: FP PIN=1 FID=6 Size=1184 Valid=1 TMP=SjFTUzIxAAADcnM...
     */
    public function processFingerprintLine(Device $device, string $line): bool
    {
        $parsed = $this->parseFingerprintLine($line);
        if (! $parsed) {
            return false;
        }

        Log::info('🖐️ Processing Fingerprint', [
            'pin'  => $parsed['pin'],
            'fid'  => $parsed['fid'],
            'size' => $parsed['size'],
        ]);

        $employee = $this->findOrCreateEmployee($parsed['pin'], $device);

        BiometricTemplate::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'device_sn'   => $device->serial_number,
                'type'        => 'fingerprint',
                'finger_id'   => $parsed['fid'],
            ],
            [
                'template_size' => $parsed['size'],
                'template_data' => $parsed['template'],
                'is_valid'      => $parsed['valid'],
            ]
        );

        Log::info('✅ Fingerprint saved', ['pin' => $parsed['pin'], 'fid' => $parsed['fid']]);
        return true;
    }

    /**
     * Process Face line from OPERLOG
     * Format: FACE PIN=1 FID=0 SIZE=1648 VALID=1 TMP=AAAAAAAA...
     */
    public function processFaceLine(Device $device, string $line): bool
    {
        $parsed = $this->parseFaceLine($line);
        if (! $parsed) {
            return false;
        }

        Log::info('😊 Processing Face', ['pin' => $parsed['pin'], 'size' => $parsed['size']]);

        $employee = $this->findOrCreateEmployee($parsed['pin'], $device);

        BiometricTemplate::updateOrCreate(
            [
                'employee_id' => $employee->id,
                'device_sn'   => $device->serial_number,
                'type'        => 'face',
                'finger_id'   => 0,
            ],
            [
                'template_size' => $parsed['size'],
                'template_data' => $parsed['template'],
                'is_valid'      => $parsed['valid'],
            ]
        );

        Log::info('✅ Face saved', ['pin' => $parsed['pin']]);
        return true;
    }

    /**
     * Update device user, fp, and face counts
     */
    public function updateDeviceCounts(Device $device): void
    {
        $device->refresh(); 
        $userCount = Employee::where('source_device_sn', $device->serial_number)->count();
        $fpCount   = BiometricTemplate::where('device_sn', $device->serial_number)
                        ->where('type', 'fingerprint')->where('is_valid', true)->count();
        $faceCount = BiometricTemplate::where('device_sn', $device->serial_number)
                        ->where('type', 'face')->where('is_valid', true)->count();
    
        // If DB has no records yet, preserve what the device reported in its handshake
        $device->update([
            'user_count' => max($userCount, $device->getRawOriginal('user_count') ?? 0),
            'fp_count'   => max($fpCount,   $device->getRawOriginal('fp_count')   ?? 0),
            'face_count' => max($faceCount, $device->getRawOriginal('face_count') ?? 0),
        ]);

        Log::info('📊 Device counts updated', [
            'sn'    => $device->serial_number,
            'users' => $userCount,
            'fp'    => $fpCount,
            'face'  => $faceCount,
        ]);
    }

    /**
     * Find or create employee by PIN
     */
    public function findOrCreateEmployee(string $pin, Device $device): Employee
    {
        $employee = Employee::where('employee_id', $pin)->first();

        if ($employee) {
            // Update device association
            $employee->update(['source_device_sn' => $device->serial_number]);

            // Add area to biometric_areas if not present
            $areas = $employee->biometric_areas ?? [];
            if ($device->area && ! in_array($device->area, $areas)) {
                $areas[] = $device->area;
                $employee->update(['biometric_areas' => $areas]);
            }

            return $employee;
        }

        // Create new employee
        return Employee::create([
            'employee_id'      => $pin,
            'first_name'       => 'PIN',
            'last_name'        => $pin,
            'source_device_sn' => $device->serial_number,
            'biometric_areas'  => $device->area ? [$device->area] : [],
            'active'           => true,
            'employee_status'  => 'active',
            'app_status'       => true,
        ]);
    }

    /**
     * Sync employee data from device
     */
    public function syncEmployeeFromDevice(string $pin, string $name, ?string $card, Device $device, bool $active): Employee
    {
        $nameParts = explode(' ', trim($name), 2);
        $firstName = $nameParts[0] ?? '';
        $lastName  = $nameParts[1] ?? '';

        $employee = Employee::where('employee_id', $pin)->first();

        if ($employee) {
            // Update existing
            $employee->update([
                'source_device_sn' => $device->serial_number,
                'card'             => $card ?: $employee->card,
                'active'           => $active,
            ]);

            // Update name only if currently empty/generic
            if (empty($employee->first_name) || $employee->first_name === 'PIN') {
                $employee->update([
                    'first_name' => $firstName ?: 'Employee',
                    'last_name'  => $lastName ?: $pin,
                ]);
            }

            // Add area to biometric_areas
            $areas = $employee->biometric_areas ?? [];
            if ($device->area && ! in_array($device->area, $areas)) {
                $areas[] = $device->area;
                $employee->update(['biometric_areas' => $areas]);
            }

            Log::info('✅ Employee updated', ['pin' => $pin, 'name' => $employee->full_name]);
        } else {
            // Create new
            $employee = Employee::create([
                'employee_id'      => $pin,
                'first_name'       => $firstName ?: 'Employee',
                'last_name'        => $lastName ?: $pin,
                'card'             => $card,
                'source_device_sn' => $device->serial_number,
                'biometric_areas'  => $device->area ? [$device->area] : [],
                'active'           => $active,
                'employee_status'  => 'active',
                'app_status'       => true,
            ]);

            Log::info('🆕 Employee created', ['pin' => $pin, 'name' => $name]);
        }

        return $employee;
    }

    /**
     * Parse USER line from OPERLOG
     */
    private function parseUserLine(string $line): ?array
    {
        if (! preg_match('/PIN=(\d+)/i', $line, $matches)) {
            return null;
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

        return compact('pin', 'name', 'card');
    }

    /**
     * Parse Fingerprint line from OPERLOG
     */
    private function parseFingerprintLine(string $line): ?array
    {
        if (! preg_match('/PIN=(\d+)/i', $line, $matches)) {
            return null;
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

        return compact('pin', 'fid', 'size', 'valid', 'template');
    }

    /**
     * Parse Face line from OPERLOG
     */
    private function parseFaceLine(string $line): ?array
    {
        if (! preg_match('/PIN=(\d+)/i', $line, $matches)) {
            return null;
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

        // Also accept lowercase/mixed case for SIZE and VALID, just as in parseFingerprintLine
        if (preg_match('/size=(\d+)/i', $line, $matches)) {
            $size = (int) $matches[1];
        }

        if (preg_match('/valid=(\d+)/i', $line, $matches)) {
            $valid = $matches[1] === '1';
        }

        return compact('pin', 'size', 'valid', 'template');
    }

    /**
     * Write sync log entry
     */
    public function writeSyncLog(Device $device, string $type, int $records, string $status, ?string $duration, string $message): void
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
}
