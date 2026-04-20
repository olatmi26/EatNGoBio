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

class ReportController extends Controller
{
    public function __construct(
        private AttendanceService   $service,
        private NotificationService $notifs,
    ) {}

    public function index(Request $request): Response
    {
        $from    = Carbon::parse($request->input('from', Carbon::now()->startOfMonth()->toDateString()));
        $to      = Carbon::parse($request->input('to', today()->toDateString()));
        $tab     = $request->input('tab', 'summary');
        $filters = $request->only(['department', 'location']);

        $data = match ($tab) {
            'payroll' => ['payrollRows' => $this->service->payrollReport($from, $to, $filters)],
            'daily'   => ['dailyRows'   => $this->service->dailyTrend($from, $to)],
            default   => ['summaryRows' => $this->service->summaryReport($from, $to, $filters)],
        };

        return Inertia::render('Reports/Index', array_merge($data, [
            'tab'         => $tab,
            'from'        => $from->toDateString(),
            'to'          => $to->toDateString(),
            'departments' => Department::orderBy('name')->pluck('name'),
            'locations'   => Location::orderBy('name')->pluck('name'),
            'filters'     => $filters,
            'unreadCount' => $this->notifs->unreadCount(auth()->id()),
        ]));
    }
}
