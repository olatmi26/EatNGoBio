<?php
namespace App\Services;

use App\Models\Device;
use App\Models\Employee;
use App\Models\Location;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class LocationAccessService
{
    /**
     * Check if employee can access a device at a specific location
     */
    public function canAccessDevice(Employee $employee, Device $device): bool
    {
        if (! $employee->active || $employee->employee_status !== 'active') {
            Log::info('🚫 Access denied: Employee not active', [
                'employee_id' => $employee->employee_id,
                'device'      => $device->serial_number,
            ]);
            return false;
        }

        $cacheKey = "access_{$employee->id}_{$device->id}";

        return Cache::remember($cacheKey, 60, function () use ($employee, $device) {
            $allowedAreas = $this->getEmployeeAllowedAreas($employee);

            if (in_array($device->area, $allowedAreas)) {
                return true;
            }

            if ($device->location_id) {
                $allowedLocations = $this->getEmployeeAllowedLocations($employee);
                if (in_array($device->location_id, $allowedLocations)) {
                    return true;
                }
            }

            return false;
        });
    }

    /**
     * Check if employee can check in/out at current time (shift-based)
     */
    public function canPunchNow(Employee $employee, Device $device): array
    {
        if (! $this->canAccessDevice($employee, $device)) {
            return [
                'allowed' => false,
                'reason'  => 'Location access denied',
            ];
        }

        $shift = $employee->activeShiftAssignment?->shift;

        if (! $shift) {
            return [
                'allowed' => true,
                'reason'  => 'No shift restrictions',
            ];
        }

        $now   = Carbon::now();
        $today = $now->toDateString();

        try {
            $startTime = Carbon::parse($today . ' ' . $shift->start_time);
            $endTime   = Carbon::parse($today . ' ' . $shift->end_time);

            if ($endTime->lt($startTime)) {
                $endTime->addDay();
            }

            $checkinStart = $startTime->copy()->subMinutes(30);
            $checkoutEnd  = $endTime->copy()->addMinutes(120);

            if ($now->between($checkinStart, $checkoutEnd)) {
                return [
                    'allowed' => true,
                    'reason'  => 'Within shift hours',
                    'shift'   => [
                        'name'  => $shift->name,
                        'start' => $shift->start_time,
                        'end'   => $shift->end_time,
                    ],
                ];
            }

            return [
                'allowed' => false,
                'reason'  => 'Outside shift hours',
                'shift'   => [
                    'name'  => $shift->name,
                    'start' => $shift->start_time,
                    'end'   => $shift->end_time,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('❌ Shift parsing error', [
                'employee_id' => $employee->employee_id,
                'shift'       => $shift->toArray(),
                'error'       => $e->getMessage(),
            ]);

            return [
                'allowed' => true,
                'reason'  => 'Shift parsing error - allowing access',
            ];
        }
    }

    /**
     * Get all areas an employee can access
     */
    public function getEmployeeAllowedAreas(Employee $employee): array
    {
        $cacheKey = "employee_areas_{$employee->id}";

        return Cache::remember($cacheKey, 300, function () use ($employee) {
            $areas = $employee->biometric_areas ?? [];

            if ($employee->area) {
                $areas[] = $employee->area;
            }

            if ($employee->location_id) {
                $location = Location::find($employee->location_id);
                if ($location) {
                    $areas[] = $location->name;
                }
            }

            if ($employee->department_id) {
                $deptAreas = $this->getDepartmentAreas($employee->department_id);
                $areas     = array_merge($areas, $deptAreas);
            }

            return array_values(array_unique($areas));
        });
    }

    /**
     * Get all locations an employee can access
     */
    public function getEmployeeAllowedLocations(Employee $employee): array
    {
        $locations = [];

        if ($employee->location_id) {
            $locations[] = $employee->location_id;
        }

        $areaLocations = Location::whereIn('name', $this->getEmployeeAllowedAreas($employee))
            ->pluck('id')
            ->toArray();

        return array_values(array_unique(array_merge($locations, $areaLocations)));
    }

    /**
     * Get areas assigned to a department
     */
    private function getDepartmentAreas(int $departmentId): array
    {
        // Check if department has default areas configured
        $department = \App\Models\Department::find($departmentId);

        if (! $department) {
            return [];
        }

        // You can extend this with a department_areas table
        return [];
    }

    /**
     * Validate a punch attempt
     */
    public function validatePunch(Employee $employee, Device $device, string $punchType = 'check_in'): array
    {
        if (! $this->canAccessDevice($employee, $device)) {
            return [
                'valid' => false,
                'error' => 'You are not authorized to punch at this location.',
                'code'  => 'LOCATION_DENIED',
            ];
        }

        $shiftCheck = $this->canPunchNow($employee, $device);
        if (! $shiftCheck['allowed']) {
            return [
                'valid' => false,
                'error' => $shiftCheck['reason'],
                'code'  => 'SHIFT_RESTRICTED',
                'shift' => $shiftCheck['shift'] ?? null,
            ];
        }

        $today = Carbon::today();

        if ($punchType === 'check_in') {
            $alreadyCheckedIn = \App\Models\AttendanceLog::where('employee_pin', $employee->employee_id)
                ->whereDate('punch_time', $today)
                ->where('punch_type', 0)
                ->exists();

            if ($alreadyCheckedIn) {
                return [
                    'valid' => false,
                    'error' => 'You have already checked in today.',
                    'code'  => 'ALREADY_CHECKED_IN',
                ];
            }
        }

        if ($punchType === 'check_out') {
            $hasCheckedIn = \App\Models\AttendanceLog::where('employee_pin', $employee->employee_id)
                ->whereDate('punch_time', $today)
                ->where('punch_type', 0)
                ->exists();

            if (! $hasCheckedIn) {
                return [
                    'valid' => false,
                    'error' => 'You must check in before checking out.',
                    'code'  => 'NO_CHECK_IN',
                ];
            }

            $alreadyCheckedOut = \App\Models\AttendanceLog::where('employee_pin', $employee->employee_id)
                ->whereDate('punch_time', $today)
                ->where('punch_type', 1)
                ->exists();

            if ($alreadyCheckedOut) {
                return [
                    'valid' => false,
                    'error' => 'You have already checked out today.',
                    'code'  => 'ALREADY_CHECKED_OUT',
                ];
            }
        }

        return [
            'valid'   => true,
            'message' => 'Punch allowed',
        ];
    }

    /**
     * Get employees assigned to a specific area/location
     */
    public function getEmployeesInArea(string $area): array
    {
        return Employee::where('active', true)
            ->where(function ($query) use ($area) {
                $query->where('area', $area)
                    ->orWhereJsonContains('biometric_areas', $area);
            })
            ->get()
            ->map(fn($e) => [
                'id'          => $e->id,
                'employee_id' => $e->employee_id,
                'name'        => $e->full_name,
                'department'  => $e->department,
            ])
            ->toArray();
    }
}
