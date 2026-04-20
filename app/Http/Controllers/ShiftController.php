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
            'workHours'         => (float)$s->work_hours,
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
                'shiftId'       => (string)$a->shift_id,
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
            'work_hours'         => 'required|numeric',
            'late_threshold'     => 'required|integer',
            'overtime_threshold' => 'required|integer',
            'breaks'             => 'nullable|array',
            'locations'          => 'nullable|array',
            'color'              => 'nullable|string',
            'type'               => 'required|in:fixed,flexible,rotating',
            'active'             => 'boolean',
        ]);
        Shift::create($data);
        return back()->with('success', 'Shift created.');
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $shift = Shift::findOrFail($id);
        $data  = $request->validate([
            'name'               => 'sometimes|string|max:100',
            'start_time'         => 'sometimes|date_format:H:i',
            'end_time'           => 'sometimes|date_format:H:i',
            'work_hours'         => 'sometimes|numeric',
            'late_threshold'     => 'sometimes|integer',
            'overtime_threshold' => 'sometimes|integer',
            'breaks'             => 'nullable|array',
            'locations'          => 'nullable|array',
            'color'              => 'nullable|string',
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

    public function assign(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employee_id'    => 'required|exists:employees,id',
            'shift_id'       => 'required|exists:shifts,id',
            'location'       => 'nullable|string',
            'effective_date' => 'required|date',
            'end_date'       => 'nullable|date',
        ]);

        // End previous open assignment
        ShiftAssignment::where('employee_id', $data['employee_id'])
            ->whereNull('end_date')
            ->update(['end_date' => now()->subDay()->toDateString()]);

        ShiftAssignment::create($data);
        Employee::find($data['employee_id'])->update(['shift_id' => $data['shift_id']]);
        return back()->with('success', 'Shift assigned.');
    }
}
