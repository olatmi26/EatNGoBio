<?php
namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Location;
use App\Services\AttendanceService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function __construct(
        private AttendanceService   $service,
        private NotificationService $notifs,
    ) {}

    public function index(Request $request): Response
    {
        $date    = Carbon::parse($request->input('date', today()->toDateString()));
        $filters = $request->only(['search', 'department', 'area', 'status']);
        $records = $this->service->attendanceList($date, $filters);

        $present = collect($records)->where('status', 'present')->count();
        $late    = collect($records)->where('status', 'late')->count();
        $absent  = collect($records)->where('status', 'absent')->count();
        $halfDay = collect($records)->where('status', 'half-day')->count();

        return Inertia::render('Attendance/Index', [
            'records'     => $records,
            'date'        => $date->toDateString(),
            'summary'     => compact('present', 'late', 'absent', 'halfDay'),
            'departments' => Department::orderBy('name')->pluck('name'),
            'areas'       => Location::orderBy('name')->pluck('name'),
            'filters'     => $filters,
            'unreadCount' => $this->notifs->unreadCount(auth()->id()),
        ]);
    }
}
