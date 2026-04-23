<?php

namespace App\Services;

use App\Models\Device;
use App\Models\Employee;
use App\Models\Location;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class LocationAccessService
{
    /**
     * Check if employee can access a device at a specific location
     */
    public function canAccessDevice(Employee $employee, Device $device): bool
    {
        // Employee must be active
        if (!$employee->active || $employee->employee_status !== 'active') {
            Log::info('🚫 Access denied: Employee not active', [
                'employee_id' => $employee->employee_id,
                'device' => $device->serial_number,
                'reason' => 'inactive',
            ]);
            return false;
        }

        // Check if employee is assigned to device's area
        $allowedAreas = $this->getEmployeeAllowedAreas($employee);
        
        if (in_array($device->area, $allowedAreas)) {
            Log::info('✅ Access granted', [
                'employee_id' => $employee->employee_id,
                'device' => $device->serial_number,
                'area' => $device->area,
            ]);
            return true;
        }

        // Check if device is at a location the employee can access
        if ($device->location_id) {
            $allowedLocations = $this->getEmployeeAllowedLocations($employee);
            if (in_array($device->location_id, $allowedLocations)) {
                Log::info('✅ Access granted via location', [
                    'employee_id' => $employee->employee_id,
                    'device' => $device->serial_number,
                    'location_id' => $device->location_id,
                ]);
                return true;
            }
        }

        Log::info('🚫 Access denied: Area not allowed', [
            'employee_id' => $employee->employee_id,
            'device' => $device->serial_number,
            'device_area' => $device->area,
            'employee_areas' => $allowedAreas,
        ]);
        
        return false;
    }

    /**
     * Check if employee can check in/out at current time (shift-based)
     */
    public function canPunchNow(Employee $employee, Device $device): array
    {
        if (!$this->canAccessDevice($employee, $device)) {
            return [
                'allowed' => false,
                'reason' => 'Location access denied',
            ];
        }

        // Check if employee has an active shift
        $shift = $employee->activeShiftAssignment?->shift;
        
        if (!$shift) {
            // No shift assigned - allow 24/7 access
            return [
                'allowed' => true,
                'reason' => 'No shift restrictions',
            ];
        }

        $now = Carbon::now();
        $today = $now->toDateString();
        
        // Parse shift times
        $startTime = Carbon::parse($today . ' ' . $shift->start_time);
        $endTime = Carbon::parse($today . ' ' . $shift->end_time);
        
        // Handle overnight shifts
        if ($endTime->lt($startTime)) {
            $endTime->addDay();
        }

        // Check if within shift hours (with grace periods)
        $checkinStart = $startTime->copy()->subMinutes(30); // 30 min before shift
        $checkoutEnd = $endTime->copy()->addMinutes(120);   // 2 hours after shift

        if ($now->between($checkinStart, $checkoutEnd)) {
            return [
                'allowed' => true,
                'reason' => 'Within shift hours',
                'shift' => [
                    'name' => $shift->name,
                    'start' => $shift->start_time,
                    'end' => $shift->end_time,
                ],
            ];
        }

        return [
            'allowed' => false,
            'reason' => 'Outside shift hours',
            'shift' => [
                'name' => $shift->name,
                'start' => $shift->start_time,
                'end' => $shift->end_time,
            ],
        ];
    }

    /**
     * Get all areas an employee can access
     */
    public function getEmployeeAllowedAreas(Employee $employee): array
    {
        $areas = $employee->biometric_areas ?? [];
        
        // Add primary area
        if ($employee->area) {
            $areas[] = $employee->area;
        }
        
        // Add areas from assigned locations
        if ($employee->location_id) {
            $location = Location::find($employee->location_id);
            if ($location) {
                $areas[] = $location->name;
            }
        }
        
        // Add areas from department (if department has default areas)
        if ($employee->department_id) {
            $deptAreas = $this->getDepartmentAreas($employee->department_id);
            $areas = array_merge($areas, $deptAreas);
        }
        
        return array_unique($areas);
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
        
        // Add locations from biometric areas
        $areaLocations = Location::whereIn('name', $this->getEmployeeAllowedAreas($employee))
            ->pluck('id')
            ->toArray();
        
        $locations = array_merge($locations, $areaLocations);
        
        return array_unique($locations);
    }

    /**
     * Get areas assigned to a department
     */
    private function getDepartmentAreas(int $departmentId): array
    {
        // This could be extended to fetch department-specific areas
        return [];
    }

    /**
     * Get all devices an employee can access
     */
    public function getEmployeeAccessibleDevices(Employee $employee): array
    {
        $allowedAreas = $this->getEmployeeAllowedAreas($employee);
        $allowedLocations = $this->getEmployeeAllowedLocations($employee);
        
        return Device::where('approved', true)
            ->where(function($query) use ($allowedAreas, $allowedLocations) {
                $query->whereIn('area', $allowedAreas)
                      ->orWhereIn('location_id', $allowedLocations);
            })
            ->get()
            ->map(fn($device) => [
                'id' => $device->id,
                'name' => $device->name,
                'serial_number' => $device->serial_number,
                'area' => $device->area,
                'status' => $device->status,
                'last_seen' => $device->last_seen?->diffForHumans(),
            ])
            ->toArray();
    }

    /**
     * Validate a punch attempt
     */
    public function validatePunch(Employee $employee, Device $device, string $punchType = 'check_in'): array
    {
        // Check location access
        if (!$this->canAccessDevice($employee, $device)) {
            return [
                'valid' => false,
                'error' => 'You are not authorized to punch at this location.',
                'code' => 'LOCATION_DENIED',
            ];
        }

        // Check shift timing
        $shiftCheck = $this->canPunchNow($employee, $device);
        if (!$shiftCheck['allowed']) {
            return [
                'valid' => false,
                'error' => $shiftCheck['reason'],
                'code' => 'SHIFT_RESTRICTED',
                'shift' => $shiftCheck['shift'] ?? null,
            ];
        }

        // Check for duplicate punch
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
                    'code' => 'ALREADY_CHECKED_IN',
                ];
            }
        }

        if ($punchType === 'check_out') {
            $hasCheckedIn = \App\Models\AttendanceLog::where('employee_pin', $employee->employee_id)
                ->whereDate('punch_time', $today)
                ->where('punch_type', 0)
                ->exists();
                
            if (!$hasCheckedIn) {
                return [
                    'valid' => false,
                    'error' => 'You must check in before checking out.',
                    'code' => 'NO_CHECK_IN',
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
                    'code' => 'ALREADY_CHECKED_OUT',
                ];
            }
        }

        return [
            'valid' => true,
            'message' => 'Punch allowed',
        ];
    }

    /**
     * Get employees assigned to a specific area/location
     */
    public function getEmployeesInArea(string $area): array
    {
        return Employee::where('active', true)
            ->where(function($query) use ($area) {
                $query->where('area', $area)
                      ->orWhereJsonContains('biometric_areas', $area);
            })
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'employee_id' => $e->employee_id,
                'name' => $e->full_name,
                'department' => $e->department,
            ])
            ->toArray();
    }

    /**
     * Get location/area statistics
     */
    public function getAreaStats(string $area): array
    {
        $employees = $this->getEmployeesInArea($area);
        $devices = Device::where('area', $area)->where('approved', true)->get();
        
        $today = Carbon::today();
        $employeeIds = array_column($employees, 'id');
        
        $presentToday = \App\Models\AttendanceLog::whereDate('punch_time', $today)
            ->where('punch_type', 0)
            ->whereIn('employee_pin', array_column($employees, 'employee_id'))
            ->distinct('employee_pin')
            ->count();
        
        return [
            'area' => $area,
            'total_employees' => count($employees),
            'present_today' => $presentToday,
            'total_devices' => $devices->count(),
            'online_devices' => $devices->filter(fn($d) => $d->status === 'online')->count(),
        ];
    }

    /**
     * Bulk assign employees to an area
     */
    public function bulkAssignToArea(array $employeeIds, string $area): int
    {
        $employees = Employee::whereIn('id', $employeeIds)->get();
        $count = 0;
        
        foreach ($employees as $employee) {
            $areas = $employee->biometric_areas ?? [];
            if (!in_array($area, $areas)) {
                $areas[] = $area;
                $employee->update(['biometric_areas' => $areas]);
                $count++;
            }
        }
        
        Log::info('📍 Bulk area assignment', [
            'area' => $area,
            'total' => count($employees),
            'updated' => $count,
        ]);
        
        return $count;
    }

    /**
     * Remove employee from an area
     */
    public function removeFromArea(Employee $employee, string $area): bool
    {
        $areas = $employee->biometric_areas ?? [];
        
        if (($key = array_search($area, $areas)) !== false) {
            unset($areas[$key]);
            $employee->update(['biometric_areas' => array_values($areas)]);
            
            Log::info('📍 Employee removed from area', [
                'employee_id' => $employee->employee_id,
                'area' => $area,
            ]);
            
            return true;
        }
        
        return false;
    }
}