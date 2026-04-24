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
use Illuminate\Support\Facades\DB;
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

            $parts = preg_split('/\s+/', $line);

            if (count($parts) < 3) {
                Log::warning('⚠️ Invalid ATTLOG line format', ['line' => $line]);
                continue;
            }

            $pin      = trim($parts[0]);
            $dateTime = trim($parts[1]);
            $verify   = (int) trim($parts[3] ?? 1);
            $workCode = $parts[4] ?? '0';

            try {
                // Parse the datetime from device
                $punchTime = Carbon::createFromFormat('Y-m-d H:i:s', $dateTime);

                // CRITICAL: Convert to Lagos timezone if needed
                // Device might be sending UTC time
                if ($device->timezone && $device->timezone !== 'UTC') {
                    $punchTime = $punchTime->timezone($device->timezone);
                } else {
                    // Default to Africa/Lagos
                    $punchTime = $punchTime->timezone('Africa/Lagos');
                }
            } catch (\Exception $e) {
                Log::warning('⚠️ Invalid datetime format', ['datetime' => $dateTime]);
                continue;
            }

            // Determine punch type based on time of day
            $hour      = $punchTime->hour;
            $punchType = ($hour < 12) ? 0 : 1; // 0=IN, 1=OUT

            // Check duplicate
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

            $employee = $this->findOrCreateEmployee($pin, $device);

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
                'status'        => 'success',
            ]);

            Cache::put($cacheKey, true, now()->addHours(24));
            $saved++;

            event(new AttendanceRecorded($log));

            Log::info('✅ Attendance saved', [
                'pin'        => $pin,
                'punch_type' => $punchType,
                'time'       => $punchTime->toDateTimeString(),
            ]);
        }

        $device->update(['last_seen' => now()]);
        return $saved;
    }

/**
 * Determine the punch type (IN=0, OUT=1) from the raw data
 */
    private function determinePunchType(array $parts, string $pin, string $dateTime): int
    {
        // Method 1: Check if there's a field with value 0-5 (standard ZKTeco)
        for ($i = 2; $i < min(10, count($parts)); $i++) {
            $value = (int) $parts[$i];
            if (in_array($value, [0, 1, 2, 3, 4, 5])) {
                // Found a standard punch type value
                if ($value == 0 || $value == 3 || $value == 4) {
                    return 0;
                }
                // IN types
                if ($value == 1 || $value == 2 || $value == 5) {
                    return 1;
                }
                // OUT types
            }
        }

        // Method 2: Determine by time of day
        $time = Carbon::parse($dateTime);
        $hour = $time->hour;

        // Get employee's shift if available
        $employee   = Employee::where('employee_id', $pin)->first();
        $shiftStart = 8;  // Default 8 AM
        $shiftEnd   = 17; // Default 5 PM

        if ($employee && $employee->shift) {
            $shiftStart = (int) substr($employee->shift->start_time ?? '08:00', 0, 2);
            $shiftEnd   = (int) substr($employee->shift->end_time ?? '17:00', 0, 2);
        }

        // Morning punches (before 12 PM) are likely IN
        // Afternoon/evening punches (after 12 PM) are likely OUT
        $noonThreshold = 12;
        $inCutoffTime  = $shiftStart + 4; // 4 hours after shift start

        if ($hour < $noonThreshold) {
            return 0; // IN
        } else {
            return 1; // OUT
        }

        // Method 3: Default to IN for first punch of day, OUT for subsequent
        // This would require checking previous punches - implement if needed
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

        // CRITICAL FIX: Update device counts immediately after processing users
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

        // CRITICAL FIX: Always update device counts after processing OPERLOG
        $this->updateDeviceCounts($device);

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
            Log::warning('⚠️ Failed to parse fingerprint line', ['line' => $line]);
            return false;
        }

        Log::info('🖐️ Processing Fingerprint', [
            'pin'  => $parsed['pin'],
            'fid'  => $parsed['fid'],
            'size' => $parsed['size'],
        ]);

        $employee = $this->findOrCreateEmployee($parsed['pin'], $device);

        if (! $employee) {
            Log::warning('⚠️ Employee not found for fingerprint', ['pin' => $parsed['pin']]);
            return false;
        }

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
                'major_version' => 2,
                'minor_version' => 0,
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
            Log::warning('⚠️ Failed to parse face line', ['line' => $line]);
            return false;
        }

        Log::info('😊 Processing Face', ['pin' => $parsed['pin'], 'size' => $parsed['size']]);

        $employee = $this->findOrCreateEmployee($parsed['pin'], $device);

        if (! $employee) {
            Log::warning('⚠️ Employee not found for face', ['pin' => $parsed['pin']]);
            return false;
        }

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
                'major_version' => 2,
                'minor_version' => 0,
            ]
        );

        Log::info('✅ Face saved', ['pin' => $parsed['pin']]);
        return true;
    }

    /**
     * Update device user, fp, and face counts - FIXED with direct DB queries
     */
    public function updateDeviceCounts(Device $device): void
    {
        // Get unique employees associated with this device
        $userCount = Employee::where('source_device_sn', $device->serial_number)->count();

        // If no employees found via source_device_sn, try via area
        if ($userCount === 0 && $device->area) {
            $userCount = Employee::where('area', $device->area)
                ->where('active', true)
                ->count();
        }

        // Count valid fingerprints for this device
        $fpCount = BiometricTemplate::where('device_sn', $device->serial_number)
            ->where('type', 'fingerprint')
            ->where('is_valid', true)
            ->count();

        // Count valid faces for this device
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
     * Find or create employee by PIN - FIXED to properly associate with device
     */
    public function findOrCreateEmployee(string $pin, Device $device): Employee
    {
        $employee = Employee::where('employee_id', $pin)->first();

        if ($employee) {
            // Update device association if not set
            if (! $employee->source_device_sn) {
                $employee->update(['source_device_sn' => $device->serial_number]);
            }

            // Add area to biometric_areas if not present
            $areas = $employee->biometric_areas ?? [];
            if ($device->area && ! in_array($device->area, $areas)) {
                $areas[] = $device->area;
                $employee->update(['biometric_areas' => $areas]);
            }

            return $employee;
        }

        // Create new employee with proper device association
        return Employee::create([
            'employee_id'      => $pin,
            'first_name'       => 'Employee',
            'last_name'        => $pin,
            'source_device_sn' => $device->serial_number,
            'biometric_areas'  => $device->area ? [$device->area] : [],
            'active'           => true,
            'employee_status'  => 'active',
            'app_status'       => true,
        ]);
    }

    /**
     * Sync employee data from device - FIXED to track device association
     */
    public function syncEmployeeFromDevice(string $pin, string $name, ?string $card, Device $device, bool $active): Employee
    {
        $nameParts = explode(' ', trim($name), 2);
        $firstName = $nameParts[0] ?? '';
        $lastName  = $nameParts[1] ?? '';

        $employee = Employee::where('employee_id', $pin)->first();

        if ($employee) {
            // Update existing - preserve name if user has set a custom name
            $updateData = [
                'source_device_sn' => $device->serial_number,
                'card'             => $card ?: $employee->card,
                'active'           => $active,
            ];

            // Only update name if it's the default "PIN" value or empty
            if (empty($employee->first_name) || $employee->first_name === 'PIN' || $employee->first_name === 'Employee') {
                $updateData['first_name'] = $firstName ?: 'Employee';
                $updateData['last_name']  = $lastName ?: $pin;
            }

            $employee->update($updateData);

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
     * Parse USER line from OPERLOG - FIXED pattern
     */
    private function parseUserLine(string $line): ?array
    {
        // Pattern: USER PIN=123 Name=John Doe Card=12345
        if (! preg_match('/PIN=([^\s\t]+)/i', $line, $matches)) {
            return null;
        }
        $pin = $matches[1];

        $name = '';
        if (preg_match('/Name=([^\t\r\n]+)/i', $line, $nameMatches)) {
            $name = trim($nameMatches[1]);
        }

        $card = null;
        if (preg_match('/Card=([^\s\t]*)/i', $line, $cardMatches)) {
            $card = trim($cardMatches[1]) ?: null;
        }

        return compact('pin', 'name', 'card');
    }

    /**
     * Parse Fingerprint line from OPERLOG - FIXED pattern for binary data
     */
    private function parseFingerprintLine(string $line): ?array
    {
        if (! preg_match('/PIN=([^\s\t]+)/i', $line, $matches)) {
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

        // Extract template data (everything after TMP=)
        $template = null;
        if (preg_match('/TMP=(.+)$/i', $line, $matches)) {
            $template = trim($matches[1]);
        }

        return compact('pin', 'fid', 'size', 'valid', 'template');
    }

    /**
     * Parse Face line from OPERLOG - FIXED pattern
     */
    private function parseFaceLine(string $line): ?array
    {
        if (! preg_match('/PIN=([^\s\t]+)/i', $line, $matches)) {
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

        // Extract template data
        $template = null;
        if (preg_match('/TMP=(.+)$/i', $line, $matches)) {
            $template = trim($matches[1]);
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
