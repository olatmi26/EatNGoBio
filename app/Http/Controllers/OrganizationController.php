<?php
namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Location;
use App\Models\Position;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    public function __construct(private NotificationService $notifs) {}

    // ── Departments ───────────────────────────────────────────────────────────

    public function departments(): Response
    {
        $departments = Department::withCount([
            'employees as employee_qty' => fn($q) => $q->where('active', true),
            'employees as resigned_qty' => fn($q) => $q->where('employee_status', 'resigned'),
        ])->orderBy('name')->get()->map(fn($d) => [
            'id'          => $d->id,
            'code'        => $d->code ?? $d->name,
            'name'        => $d->name,
            'superior'    => $d->superior ?? '-',
            'employeeQty' => $d->employee_qty,
            'resignedQty' => $d->resigned_qty,
            'manager'     => $d->manager ?? '-',
            'color'       => $d->color,
        ]);

        return Inertia::render('Organization/Departments/Index', [
            'departments' => $departments,
            'unreadCount' => $this->notifs->unreadCount(auth()->id()),
        ]);
    }

    public function storeDepartment(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|unique:departments,name',
            'code'     => 'nullable|string',
            'superior' => 'nullable|string',
            'manager'  => 'nullable|string',
            'color'    => 'nullable|string',
        ]);
        Department::create($data);
        return back()->with('success', 'Department created.');
    }

    public function updateDepartment(Request $request, int $id): RedirectResponse
    {
        $dept = Department::findOrFail($id);
        $data = $request->validate([
            'name'     => "sometimes|string|unique:departments,name,{$id}",
            'code'     => 'nullable|string',
            'superior' => 'nullable|string',
            'manager'  => 'nullable|string',
            'color'    => 'nullable|string',
        ]);
        $dept->update($data);
        return back()->with('success', 'Department updated.');
    }

    public function destroyDepartment(int $id): RedirectResponse
    {
        Department::findOrFail($id)->delete();
        return back()->with('success', 'Department deleted.');
    }

    // ── Positions ─────────────────────────────────────────────────────────────

    public function positions(): Response
    {
        $positions = Position::withCount('employees as employee_qty')
            ->orderBy('name')
            ->get()
            ->map(fn($p) => [
                'id'          => $p->id,
                'code'        => $p->code,
                'name'        => $p->name,
                'employeeQty' => $p->employee_qty,
            ]);

        return Inertia::render('Organization/Positions/Index', [
            'positions'  => $positions,
            'unreadCount'=> $this->notifs->unreadCount(auth()->id()),
        ]);
    }

    public function storePosition(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code' => 'required|string|unique:positions,code',
            'name' => 'required|string',
        ]);
        Position::create($data);
        return back()->with('success', 'Position created.');
    }

    public function updatePosition(Request $request, int $id): RedirectResponse
    {
        Position::findOrFail($id)->update($request->validate([
            'code' => "sometimes|string|unique:positions,code,{$id}",
            'name' => 'sometimes|string',
        ]));
        return back()->with('success', 'Position updated.');
    }

    public function destroyPosition(int $id): RedirectResponse
    {
        Position::findOrFail($id)->delete();
        return back()->with('success', 'Position deleted.');
    }

    // ── Areas ─────────────────────────────────────────────────────────────────

    public function areas(): Response
    {
        $areas = Location::withCount([
            'devices',
            'employees as employees_count' => fn($q) => $q->where('active', true),
        ])->orderBy('name')->get()->map(fn($l) => [
            'id'        => $l->id,
            'code'      => $l->code ?? $l->name,
            'name'      => $l->name,
            'timezone'  => $l->timezone ?? 'Africa/Lagos',
            'devices'   => $l->devices_count,
            'employees' => $l->employees_count,
        ]);

        return Inertia::render('Organization/Areas/Index', [
            'areas'      => $areas,
            'unreadCount'=> $this->notifs->unreadCount(auth()->id()),
        ]);
    }

    public function storeArea(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'code'     => 'nullable|string',
            'name'     => 'required|string|unique:locations,name',
            'timezone' => 'nullable|string',
        ]);
        Location::create($data);
        return back()->with('success', 'Area created.');
    }

    public function updateArea(Request $request, int $id): RedirectResponse
    {
        Location::findOrFail($id)->update($request->validate([
            'code'     => 'nullable|string',
            'name'     => "sometimes|string|unique:locations,name,{$id}",
            'timezone' => 'nullable|string',
        ]));
        return back()->with('success', 'Area updated.');
    }

    public function destroyArea(int $id): RedirectResponse
    {
        Location::findOrFail($id)->delete();
        return back()->with('success', 'Area deleted.');
    }

    // ── Org Chart ─────────────────────────────────────────────────────────────

    public function chart(): Response
    {
        $departments = Department::withCount([
            'employees as employee_qty' => fn($q) => $q->where('active', true),
            'employees as resigned_qty' => fn($q) => $q->where('employee_status', 'resigned'),
        ])->orderBy('name')->get()->map(fn($d) => [
            'id'          => $d->id,
            'code'        => $d->code ?? $d->name,
            'name'        => $d->name,
            'superior'    => $d->superior ?? '-',
            'manager'     => $d->manager ?? '-',
            'employeeQty' => $d->employee_qty,
            'resignedQty' => $d->resigned_qty,
            'color'       => $d->color,
        ]);

        $positions = Position::withCount('employees as employee_qty')
            ->orderBy('name')
            ->get()
            ->map(fn($p) => [
                'id'          => $p->id,
                'code'        => $p->code,
                'name'        => $p->name,
                'employeeQty' => $p->employee_qty,
            ]);        

        $areas = Location::withCount([
            'devices',
            'employees as employees_count' => fn($q) => $q->where('active', true),
        ])->orderBy('name')->get()->map(fn($l) => [
            'id'        => $l->id,
            'code'      => $l->code ?? $l->name,
            'name'      => $l->name,
            'timezone'  => $l->timezone ?? 'Africa/Lagos',
            'devices'   => $l->devices_count,
            'employees' => $l->employees_count,
        ]);

        $employees = Employee::where('active', true)
            ->select('id', 'employee_id', 'first_name', 'last_name', 'department', 'position', 'department_id')
            ->get()
            ->map(fn($e) => [
                'id'         => $e->id,
                'employeeId' => $e->employee_id,
                'name'       => $e->full_name,
                'initials'   => $e->initials,
                'department' => $e->department ?? '-',
                'position'   => $e->position ?? '-',
            ]);

        return Inertia::render('Organization/Chart/Index', [
            'departments' => $departments,
            'positions'   => $positions,
            'areas'       => $areas,
            'employees'   => $employees,
            'unreadCount' => $this->notifs->unreadCount(auth()->id()),
        ]);
    }
}
