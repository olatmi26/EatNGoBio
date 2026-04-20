<?php
namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Device;
use App\Models\Employee;
use App\Models\Location;
use App\Models\Position;
use App\Models\Shift;
use App\Services\AttendanceService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function __construct(
        private AttendanceService $attendance,
        private NotificationService $notifs,
    ) {}

    public function index(Request $request): Response
    {
        $query = Employee::with(['dept', 'positionModel', 'location', 'shift'])
            ->where('active', true);

        if ($s = $request->input('search')) {
            $query->where(fn($q) => $q
                    ->where('first_name', 'like', "%{$s}%")
                    ->orWhere('last_name', 'like', "%{$s}%")
                    ->orWhere('employee_id', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
            );
        }
        if ($d = $request->input('department')) {
            $query->where('department', $d);
        }

        if ($a = $request->input('area')) {
            $query->where('area', $a);
        }

        if (($st = $request->input('status')) && $st !== 'all') {
            $query->where('employee_status', $st);
        }

        $perPage   = min((int) $request->input('per_page', 15), 100);
        $paginator = $query->orderBy('first_name')->paginate($perPage);

        $employees = [
            'data'  => $paginator->getCollection()->map(fn($emp) => [
                'id'             => $emp->id,
                'employeeId'     => $emp->employee_id,
                'firstName'      => $emp->first_name,
                'lastName'       => $emp->last_name,
                'fullName'       => $emp->full_name,
                'initials'       => $emp->initials,
                'department'     => $emp->department ?? '-',
                'position'       => $emp->position ?? '-',
                'area'           => $emp->area ?? '-',
                'employmentType' => $emp->employment_type ?? 'Full-Time',
                'hiredDate'      => $emp->hired_date?->format('Y-m-d'),
                'gender'         => $emp->gender ?? '-',
                'email'          => $emp->email,
                'mobile'         => $emp->phone,
                'status'         => $emp->employee_status ?? 'active',
            ]),
            'meta'  => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'from'         => $paginator->firstItem() ?? 0,
                'to'           => $paginator->lastItem() ?? 0,
            ],
            'links' => $paginator->linkCollection()->toArray(),
        ];

        // ── FIX: use values() to guarantee a JSON array (not object) ──────────
        // pluck() returns a Collection; if any key is non-sequential Laravel
        // may serialize it as a JSON object ({}) instead of an array ([]).
        // values()->all() forces a 0-indexed PHP array that always encodes as [].
        $departments = Department::orderBy('name')->pluck('name')->values()->all();
        $areas       = Location::orderBy('name')->pluck('name')->values()->all();
        $positions   = Position::orderBy('name')->pluck('name')->values()->all();

        return Inertia::render('Employees/Index', [
            'employees'   => $employees,
            'departments' => $departments,
            'areas'       => $areas,
            'positions'   => $positions,
            'filters'     => $request->only(['search', 'department', 'area', 'status', 'per_page']),
            'unreadCount' => $this->notifs->unreadCount(auth()->id()),
        ]);
    }

    public function show(int $id): Response
    {
        $emp = Employee::with(['dept', 'positionModel', 'location', 'shift'])->findOrFail($id);

        [$from, $to] = [Carbon::today()->subDays(29), Carbon::today()];

        $heatmap = $this->getAttendanceHeatmap($emp, $from, $to);

        return Inertia::render('Employees/Detail', [
            'employee'         => $this->formatEmployee($emp),
            'recentLogs'       => $this->getRecentLogs($emp, $from, $to),
            'heatmap'          => $heatmap,
            'attendanceStats'  => $this->getAttendanceStats($heatmap), // ← real stats
            'connectedDevices' => $this->getConnectedDevices($emp),
            'departments'      => Department::orderBy('name')->pluck('name')->values()->all(),
            'positions'        => Position::orderBy('name')->pluck('name')->values()->all(),
            'areas'            => Location::orderBy('name')->pluck('name')->values()->all(),
            'shifts'           => Shift::where('active', true)->get(['id', 'name', 'code']),
            'unreadCount'      => $this->notifs->unreadCount(auth()->id()),
        ]);
    }

    private function formatEmployee(Employee $emp): array
    {
        return [
            'id'             => $emp->id,
            'employeeId'     => $emp->employee_id,
            'firstName'      => $emp->first_name,
            'lastName'       => $emp->last_name,
            'fullName'       => $emp->full_name,
            'initials'       => $emp->initials,
            'department'     => $emp->department ?? '-',
            'position'       => $emp->position ?? '-',
            'area'           => $emp->area ?? '-',
            'employmentType' => $emp->employment_type ?? 'Full-Time',
            'hiredDate'      => $emp->hired_date?->format('Y-m-d'),
            'gender'         => $emp->gender,
            'email'          => $emp->email,
            'mobile'         => $emp->phone,
            'status'         => $emp->employee_status ?? 'active',
            'basicSalary'    => $emp->basic_salary,
            'shift'          => $emp->shift ? ['id' => $emp->shift->id, 'name' => $emp->shift->name] : null,
            'biometricAreas' => $emp->biometric_areas ?? [],
        ];
    }

    private function getRecentLogs(Employee $emp, Carbon $from, Carbon $to): \Illuminate\Support\Collection
    {
        return $emp->attendanceLogs()
            ->whereBetween('punch_time', [$from, $to])
            ->orderByDesc('punch_time')
            ->limit(100)
            ->get()
            ->map(fn($l) => [
                'date'       => $l->punch_time->toDateString(),
                'time'       => $l->punch_time->format('H:i:s'),
                'punchType'  => $l->punch_type_label,
                'verifyType' => $l->verify_type_label,
                'device'     => $l->device_sn,
            ]);
    }

    private function getAttendanceHeatmap(Employee $emp, Carbon $from, Carbon $to): array
    {
        // Fetch all punches in range, keyed by date
        $logs = $emp->attendanceLogs()
            ->whereBetween('punch_time', [$from, $to])
            ->orderBy('punch_time')
            ->get();

        // Group by date → collect check-in (punch_type=0) and check-out (punch_type=1)
        $byDate = [];
        foreach ($logs as $log) {
            $day = $log->punch_time->toDateString();
            if (! isset($byDate[$day])) {
                $byDate[$day] = ['checkIn' => null, 'checkOut' => null];
            }
            if ($log->punch_type === 0 && $byDate[$day]['checkIn'] === null) {
                $byDate[$day]['checkIn'] = $log->punch_time->format('H:i');
            }
            if ($log->punch_type === 1) {
                // Always take the latest check-out
                $byDate[$day]['checkOut'] = $log->punch_time->format('H:i');
            }
        }

        $data   = [];
        $cursor = $from->copy();

        while ($cursor->lte($to)) {
            $dateStr   = $cursor->toDateString();
            $dayOfWeek = $cursor->dayOfWeek; // 0 = Sunday, 6 = Saturday

            if ($dayOfWeek === 0 || $dayOfWeek === 6) {
                $data[] = ['date' => $dateStr, 'status' => 'weekend'];
            } elseif ($cursor->isAfter(Carbon::today())) {
                $data[] = ['date' => $dateStr, 'status' => 'future'];
            } elseif (isset($byDate[$dateStr])) {
                $checkIn  = $byDate[$dateStr]['checkIn'];
                $checkOut = $byDate[$dateStr]['checkOut'];

                // Determine late: check-in after 09:00 (adjust to your shift rule)
                $isLate = $checkIn && $checkIn > '09:00';

                $entry = [
                    'date'     => $dateStr,
                    'status'   => $isLate ? 'late' : 'present',
                    'checkIn'  => $checkIn,
                    'checkOut' => $checkOut,
                ];
                $data[] = $entry;
            } else {
                // Weekday with no punch = absent
                $data[] = ['date' => $dateStr, 'status' => 'absent'];
            }

            $cursor->addDay();
        }

        return [
            'year'  => (int) $from->format('Y'),
            'month' => (int) $from->format('n') - 1, // JS months are 0-indexed
            'data'  => $data,
        ];
    }

    /**
     * Compute real attendance stats from the heatmap data array.
     * Returned as a flat array so the frontend can use it directly
     * instead of re-computing from possibly-fake heatmap data.
     */
    private function getAttendanceStats(array $heatmap): array
    {
        $data     = $heatmap['data'] ?? [];
        $present  = count(array_filter($data, fn($d) => $d['status'] === 'present'));
        $late     = count(array_filter($data, fn($d) => $d['status'] === 'late'));
        $absent   = count(array_filter($data, fn($d) => $d['status'] === 'absent'));
        $workDays = count(array_filter($data, fn($d) => ! in_array($d['status'], ['weekend', 'future'])));
        $rate     = $workDays > 0 ? round((($present + $late) / $workDays) * 100) : 0;

        return [
            'attendanceRate' => $rate,
            'presentDays'    => $present,
            'lateDays'       => $late,
            'absentDays'     => $absent,
            'workDays'       => $workDays,
        ];
    }

    private function getConnectedDevices(Employee $emp): \Illuminate\Support\Collection
    {
        return Device::with('location')
            ->where('approved', true)
            ->where('area', $emp->area)
            ->get()
            ->map(fn($dev) => [
                'id'           => $dev->id,
                'name'         => $dev->name,
                'sn'           => $dev->serial_number,
                'area'         => $dev->area ?? '-',
                'ip'           => $dev->ip_address,
                'status'       => $dev->computed_status,
                'lastActivity' => $dev->last_seen?->format('Y-m-d H:i:s') ?? 'Never',
            ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employee_id'     => 'required|string|max:20|unique:employees,employee_id',
            'first_name'      => 'required|string|max:100',
            'last_name'       => 'nullable|string|max:100',
            'department'      => 'nullable|string',
            'position'        => 'nullable|string',
            'area'            => 'nullable|string',
            'employment_type' => 'nullable|string',
            'hired_date'      => 'nullable|date',
            'gender'          => 'nullable|string',
            'email'           => 'nullable|email',
            'phone'           => 'nullable|string',
            'employee_status' => 'nullable|in:active,resigned,probation,suspended,disabled',
            'basic_salary'    => 'nullable|numeric',
            'shift_id'        => 'nullable|exists:shifts,id',
        ]);

        $this->syncFKs($data);
        $emp = Employee::create($data + ['active' => true]);
        return redirect()->route('employees.show', $emp->id)->with('success', 'Employee created.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $emp  = Employee::findOrFail($id);
        $data = $request->validate([
            'first_name'      => 'sometimes|string|max:100',
            'last_name'       => 'sometimes|nullable|string',
            'department'      => 'sometimes|nullable|string',
            'position'        => 'sometimes|nullable|string',
            'area'            => 'sometimes|nullable|string',
            'employment_type' => 'sometimes|nullable|string',
            'hired_date'      => 'sometimes|nullable|date',
            'gender'          => 'sometimes|nullable|string',
            'email'           => 'sometimes|nullable|email',
            'phone'           => 'sometimes|nullable|string',
            'employee_status' => 'sometimes|in:active,resigned,probation,suspended,disabled',
            'basic_salary'    => 'sometimes|nullable|numeric',
            'shift_id'        => 'sometimes|nullable|exists:shifts,id',
        ]);

        $this->syncFKs($data);
        $emp->update($data);
        return back()->with('success', 'Employee updated.');
    }

    public function transfer(Request $request, int $id): RedirectResponse
    {
        $emp  = Employee::findOrFail($id);
        $data = $request->validate([
            'department'     => 'required|string',
            'area'           => 'required|string',
            'position'       => 'nullable|string',
            'effective_date' => 'required|date',
        ]);
        $emp->update([
            'department' => $data['department'],
            'area'       => $data['area'],
            'position'   => $data['position'] ?? $emp->position,
        ]);
        $this->syncFKs(['department' => $data['department'], 'area' => $data['area']]);
        return back()->with('success', 'Employee transferred.');
    }

    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        $emp  = Employee::findOrFail($id);
        $data = $request->validate(['status' => 'required|in:active,resigned,probation,suspended,disabled']);
        $emp->update(['employee_status' => $data['status']]);
        return back()->with('success', 'Employee status updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        Employee::findOrFail($id)->update(['active' => false, 'employee_status' => 'resigned']);
        return redirect()->route('employees.index')->with('success', 'Employee deactivated.');
    }

    private function syncFKs(array &$data): void
    {
        if (! empty($data['department'])) {
            $dept = Department::where('name', $data['department'])->first();
            if ($dept) {
                $data['department_id'] = $dept->id;
            }

        }
        if (! empty($data['area'])) {
            $loc = Location::where('name', $data['area'])->first();
            if ($loc) {
                $data['location_id'] = $loc->id;
            }

        }
        if (! empty($data['position'])) {
            $pos = Position::where('name', $data['position'])->first();
            if ($pos) {
                $data['position_id'] = $pos->id;
            }

        }
    }
}
