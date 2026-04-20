<?php
namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Location;
use App\Models\Shift;
use App\Models\ShiftAssignment;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShiftController extends Controller
{
    public function __construct(private NotificationService $notifs) {}

    public function index(): Response
    {
        $shifts = Shift::orderBy('name')->get()->map(fn($s) => [
            'id'                => $s->id,
            'name'              => $s->name,
            'code'              => $s->code,
            'startTime'         => $s->start_time,
            'endTime'           => $s->end_time,
            'checkinStartAt'    => $s->checkin_start_at,
            'checkoutEndsAt'    => $s->checkout_ends_at,
            'workHours'         => (float) $s->work_hours,
            'lateThreshold'     => $s->late_threshold,
            'overtimeThreshold' => $s->overtime_threshold,
            'breaks'            => $s->breaks ?? [],
            'locations'         => $s->locations ?? [],
            'color'             => $s->color,
            'employeeCount'     => $s->employee_count,
            'active'            => $s->active,
            'type'              => $s->type,
        ]);

        $assignments = ShiftAssignment::with(['employee', 'shift'])
            ->whereNull('end_date')
            ->orWhere('end_date', '>=', today())
            ->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'employeeId'    => $a->employee->employee_id,
                'employeeName'  => $a->employee->full_name,
                'department'    => $a->employee->department ?? '-',
                'shiftId'       => (string) $a->shift_id,
                'shiftName'     => $a->shift->name,
                'effectiveDate' => $a->effective_date->format('Y-m-d'),
                'endDate'       => $a->end_date?->format('Y-m-d'),
                'location'      => $a->location ?? '-',
            ]);

        return Inertia::render('Shifts/Index', [
            'shifts'      => $shifts,
            'assignments' => $assignments,
            'employees'   => Employee::where('active', true)
                ->select('id', 'employee_id', 'first_name', 'last_name', 'department', 'area')
                ->get()
                ->map(fn($e) => [
                    'id'         => $e->id,
                    'employeeId' => $e->employee_id,
                    'firstName'  => $e->first_name,
                    'lastName'   => $e->last_name,
                    'department' => $e->department ?? '-',
                    'area'       => $e->area ?? '-',
                ]),
            'areas'       => Location::orderBy('name')->pluck('name'),
            'unreadCount' => $this->notifs->unreadCount(auth()->id()),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'               => 'required|string|max:100',
            'code'               => 'required|string|max:10|unique:shifts,code',
            'start_time'         => 'required|date_format:H:i',
            'end_time'           => 'required|date_format:H:i',
            'checkin_start_at'   => 'nullable|date_format:H:i',
            'checkout_ends_at'   => 'nullable|date_format:H:i',
            'work_hours'         => 'required|numeric',
            'late_threshold'     => 'required|integer',
            'overtime_threshold' => 'required|integer',
            'breaks'             => 'nullable|array',
            'locations'          => 'nullable|array',
            'color'              => 'nullable|string|max:20',
            'type'               => 'required|in:fixed,flexible,rotating',
            'active'             => 'boolean',
        ]);

        Shift::create($data);

        return back()->with('success', 'Shift created.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $shift = Shift::findOrFail($id);

        $data = $request->validate([
            'name'               => 'sometimes|string|max:100',
            'start_time'         => 'sometimes|date_format:H:i',
            'end_time'           => 'sometimes|date_format:H:i',
            'checkin_start_at'   => 'nullable|date_format:H:i',
            'checkout_ends_at'   => 'nullable|date_format:H:i',
            'work_hours'         => 'sometimes|numeric',
            'late_threshold'     => 'sometimes|integer',
            'overtime_threshold' => 'sometimes|integer',
            'breaks'             => 'nullable|array',
            'locations'          => 'nullable|array',
            'color'              => 'nullable|string|max:20',
            'type'               => 'sometimes|in:fixed,flexible,rotating',
            'active'             => 'sometimes|boolean',
        ]);

        $shift->update($data);

        return back()->with('success', 'Shift updated.');
    }

    public function destroy(int $id): RedirectResponse
    {
        Shift::findOrFail($id)->delete();

        return back()->with('success', 'Shift deleted.');
    }

    /**
     * Manual single-employee assignment (kept for edge cases).
     */
    public function assign(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employee_id'    => 'required|exists:employees,id',
            'shift_id'       => 'required|exists:shifts,id',
            'location'       => 'nullable|string',
            'effective_date' => 'required|date',
            'end_date'       => 'nullable|date|after_or_equal:effective_date',
        ]);

        $this->endOpenAssignments([$data['employee_id']], $data['effective_date']);

        ShiftAssignment::create($data);
        Employee::find($data['employee_id'])->update(['shift_id' => $data['shift_id']]);

        return back()->with('success', 'Shift assigned.');
    }

    /**
     * Bulk auto-assign all employees in the shift's locations.
     *
     * POST /shifts/auto-assign
     * Body: {
     *   shift_id:           int,
     *   employee_ids:       int[],       // pre-filtered list sent from the frontend preview
     *   effective_date:     date,
     *   end_date:           date|null,
     *   overwrite_existing: bool,
     * }
     */
    public function autoAssign(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'shift_id'           => 'required|exists:shifts,id',
            'employee_ids'       => 'required|array|min:1',
            'employee_ids.*'     => 'integer|exists:employees,id',
            'effective_date'     => 'required|date',
            'end_date'           => 'nullable|date|after_or_equal:effective_date',
            'overwrite_existing' => 'boolean',
        ]);

        $shift         = Shift::findOrFail($data['shift_id']);
        $employeeIds   = $data['employee_ids'];
        $effectiveDate = $data['effective_date'];
        $endDate       = $data['end_date'] ?? null;
        $overwrite     = $data['overwrite_existing'] ?? true;

        // Server-side guard: employees must be active and in the shift's locations
        $allowedAreas   = $shift->locations ?? [];
        $validEmployees = Employee::whereIn('id', $employeeIds)
            ->where('active', true)
            ->when(!empty($allowedAreas), fn($q) => $q->whereIn('area', $allowedAreas))
            ->get();

        if ($validEmployees->isEmpty()) {
            return back()->withErrors([
                'employee_ids' => 'No valid employees found for the selected shift locations.',
            ]);
        }

        $validIds = $validEmployees->pluck('id')->toArray();

        // Close previous open assignments if requested
        if ($overwrite) {
            $this->endOpenAssignments($validIds, $effectiveDate);
        }

        // Bulk-insert new assignments (faster than individual creates)
        $now  = now();
        $rows = $validEmployees->map(fn($e) => [
            'employee_id'    => $e->id,
            'shift_id'       => $shift->id,
            'location'       => $e->area,
            'effective_date' => $effectiveDate,
            'end_date'       => $endDate,
            'created_at'     => $now,
            'updated_at'     => $now,
        ])->toArray();

        ShiftAssignment::insert($rows);

        // Sync each employee's active shift_id
        Employee::whereIn('id', $validIds)->update(['shift_id' => $shift->id]);

        // Refresh the shift's employee_count
        $shift->update([
            'employee_count' => ShiftAssignment::where('shift_id', $shift->id)
                ->where(fn($q) => $q->whereNull('end_date')->orWhere('end_date', '>=', today()))
                ->count(),
        ]);

        return back()->with('success', "Auto-assigned {$validEmployees->count()} employees to {$shift->name}.");
    }

    /**
     * Close all open assignments for the given employee IDs.
     * Sets end_date to the day before the new effective_date.
     */
    private function endOpenAssignments(array $employeeIds, string $effectiveDate): void
    {
        $dayBefore = now()->parse($effectiveDate)->subDay()->toDateString();

        ShiftAssignment::whereIn('employee_id', $employeeIds)
            ->whereNull('end_date')
            ->update(['end_date' => $dayBefore]);
    }
}