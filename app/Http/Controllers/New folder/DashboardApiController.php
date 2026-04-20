<?php

namespace App\Http\Controllers;

use App\Models\Device;
use App\Models\AttendanceLog;
use App\Models\Employee;
use App\Models\DeviceCommand;
use Illuminate\Http\Request;
use Carbon\Carbon;

/**
 * REST API for the ZK Dashboard frontend (React SPA)
 */
class DashboardApiController extends Controller
{
    // ── Dashboard Stats ──────────────────────────────────────────────────────

    public function stats()
    {
        $today     = Carbon::today();
        $threshold = Carbon::now()->subMinutes(2); // device is "online" if seen within 2 min

        $totalDevices   = Device::count();
        $onlineDevices  = Device::where('last_seen', '>=', $threshold)->count();
        $offlineDevices = $totalDevices - $onlineDevices;

        $todayLogs      = AttendanceLog::whereDate('punch_time', $today)->count();
        $uniqueToday    = AttendanceLog::whereDate('punch_time', $today)
                            ->distinct('employee_pin')->count();

        $totalEmployees = Employee::count();

        // Last 24h attendance by hour (for sparkline)
        $hourly = AttendanceLog::selectRaw("DATE_FORMAT(punch_time,'%H') as hour, COUNT(*) as cnt")
            ->where('punch_time', '>=', Carbon::now()->subHours(24))
            ->groupBy('hour')
            ->orderBy('hour')
            ->get()
            ->keyBy('hour')
            ->map(fn($r) => $r->cnt);

        $hourlyData = [];
        for ($h = 0; $h < 24; $h++) {
            $key = str_pad($h, 2, '0', STR_PAD_LEFT);
            $hourlyData[] = ['hour' => $key, 'count' => $hourly[$key]->count ?? ($hourly[$key] ?? 0)];
        }

        return response()->json([
            'total_devices'    => $totalDevices,
            'online_devices'   => $onlineDevices,
            'offline_devices'  => $offlineDevices,
            'today_punches'    => $todayLogs,
            'unique_today'     => $uniqueToday,
            'total_employees'  => $totalEmployees,
            'hourly_activity'  => $hourlyData,
        ]);
    }

    // ── Devices ───────────────────────────────────────────────────────────────

    public function devices(Request $request)
    {
        $threshold = Carbon::now()->subMinutes(2);

        $devices = Device::orderBy('name')
            ->get()
            ->map(function ($d) use ($threshold) {
                $d->is_online = $d->last_seen && Carbon::parse($d->last_seen)->gte($threshold);
                $d->last_seen_human = $d->last_seen
                    ? Carbon::parse($d->last_seen)->diffForHumans()
                    : 'Never';
                return $d;
            });

        return response()->json($devices);
    }

    public function device($sn)
    {
        $device = Device::where('serial_number', $sn)->firstOrFail();
        $threshold = Carbon::now()->subMinutes(2);
        $device->is_online = $device->last_seen && Carbon::parse($device->last_seen)->gte($threshold);

        $recentLogs = AttendanceLog::where('device_sn', $sn)
            ->orderByDesc('punch_time')
            ->limit(50)
            ->get();

        return response()->json([
            'device'      => $device,
            'recent_logs' => $recentLogs,
        ]);
    }

    public function updateDevice(Request $request, $sn)
    {
        $device = Device::where('serial_number', $sn)->firstOrFail();
        $device->update($request->only(['name', 'area', 'notes']));
        return response()->json($device);
    }

    // ── Attendance Logs ───────────────────────────────────────────────────────

    public function attendance(Request $request)
    {
        $query = AttendanceLog::query()
            ->with('employee')
            ->orderByDesc('punch_time');

        if ($request->date) {
            $query->whereDate('punch_time', $request->date);
        } else {
            $query->whereDate('punch_time', Carbon::today());
        }

        if ($request->device_sn) {
            $query->where('device_sn', $request->device_sn);
        }

        if ($request->employee_pin) {
            $query->where('employee_pin', $request->employee_pin);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('employee_pin', 'like', "%{$search}%")
                  ->orWhereHas('employee', fn($eq) => $eq->where('name', 'like', "%{$search}%"));
            });
        }

        $logs = $query->paginate($request->per_page ?? 50);

        // Enrich with punch type label
        $punchTypes = [
            0 => 'Check In',
            1 => 'Check Out',
            2 => 'Break Out',
            3 => 'Break In',
            4 => 'OT In',
            5 => 'OT Out',
        ];

        $verifyTypes = [
            1  => 'Fingerprint',
            4  => 'Password',
            15 => 'Face',
        ];

        $logs->getCollection()->transform(function ($log) use ($punchTypes, $verifyTypes) {
            $log->punch_type_label  = $punchTypes[$log->punch_type] ?? 'Unknown';
            $log->verify_type_label = $verifyTypes[$log->verify_type] ?? 'Unknown';
            return $log;
        });

        return response()->json($logs);
    }

    public function realtimeFeed()
    {
        $threshold = Carbon::now()->subMinutes(2);

        $logs = AttendanceLog::with('employee')
            ->where('punch_time', '>=', Carbon::now()->subMinutes(30))
            ->orderByDesc('punch_time')
            ->limit(30)
            ->get()
            ->map(function ($log) {
                $punchTypes  = [0=>'Check In',1=>'Check Out',2=>'Break Out',3=>'Break In',4=>'OT In',5=>'OT Out'];
                $verifyTypes = [1=>'Fingerprint',4=>'Password',15=>'Face'];

                return [
                    'id'           => $log->id,
                    'employee_pin' => $log->employee_pin,
                    'name'         => $log->employee?->name ?? 'Employee ' . $log->employee_pin,
                    'device_sn'    => $log->device_sn,
                    'punch_time'   => $log->punch_time,
                    'punch_label'  => $punchTypes[$log->punch_type] ?? 'Unknown',
                    'verify_label' => $verifyTypes[$log->verify_type] ?? 'Unknown',
                    'ago'          => Carbon::parse($log->punch_time)->diffForHumans(),
                ];
            });

        return response()->json($logs);
    }

    // ── Employees ─────────────────────────────────────────────────────────────

    public function employees(Request $request)
    {
        $query = Employee::query()->orderBy('name');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('pin', 'like', "%{$request->search}%");
            });
        }

        return response()->json($query->paginate(50));
    }

    // ── Device Commands ───────────────────────────────────────────────────────

    public function sendCommand(Request $request)
    {
        $request->validate([
            'device_sn' => 'required|string',
            'command'   => 'required|string|in:REBOOT,INFO,CLEAR,ENROLLUSER,DELETEUSER,ENABLEDEVICE,DISABLEDEVICE',
            'params'    => 'nullable|string',
        ]);

        $cmd = DeviceCommand::create([
            'device_sn' => $request->device_sn,
            'command'   => $request->command,
            'params'    => $request->params,
            'status'    => 'pending',
        ]);

        return response()->json($cmd, 201);
    }

    public function commands(Request $request)
    {
        $query = DeviceCommand::orderByDesc('created_at');

        if ($request->device_sn) {
            $query->where('device_sn', $request->device_sn);
        }

        return response()->json($query->paginate(50));
    }

    // ── Reports ────────────────────────────────────────────────────────────────

    public function reportDaily(Request $request)
    {
        $date = $request->date ?? Carbon::today()->toDateString();

        $data = AttendanceLog::selectRaw("
                employee_pin,
                MIN(CASE WHEN punch_type = 0 THEN punch_time END) as first_in,
                MAX(CASE WHEN punch_type = 1 THEN punch_time END) as last_out,
                COUNT(*) as total_punches,
                device_sn
            ")
            ->whereDate('punch_time', $date)
            ->groupBy('employee_pin', 'device_sn')
            ->with('employee')
            ->get()
            ->map(function ($row) {
                $firstIn  = $row->first_in  ? Carbon::parse($row->first_in)  : null;
                $lastOut  = $row->last_out  ? Carbon::parse($row->last_out)  : null;
                $duration = ($firstIn && $lastOut) ? $firstIn->diffInMinutes($lastOut) : null;

                return [
                    'employee_pin'  => $row->employee_pin,
                    'name'          => $row->employee?->name ?? 'Employee ' . $row->employee_pin,
                    'department'    => $row->employee?->department,
                    'device_sn'     => $row->device_sn,
                    'first_in'      => $row->first_in,
                    'last_out'      => $row->last_out,
                    'duration_mins' => $duration,
                    'duration_fmt'  => $duration ? floor($duration/60).'h '.($duration%60).'m' : '—',
                    'total_punches' => $row->total_punches,
                ];
            });

        return response()->json(['date' => $date, 'records' => $data]);
    }
}
