<?php
namespace App\Http\Controllers;

use App\Exports\AttendanceExport;
use App\Exports\DeviceReportExport;
use App\Exports\PayrollExport;
use App\Models\Department;
use App\Models\Location;
use App\Services\AttendanceService;
use App\Services\NotificationService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function __construct(
        private AttendanceService $service,
        private NotificationService $notifs,
    ) {}

    public function index(Request $request): Response
    {
        $from    = Carbon::parse($request->input('from', now()->startOfMonth()->toDateString()));
        $to      = Carbon::parse($request->input('to', today()->toDateString()));
        $tab     = $request->input('tab', 'summary');
        $page    = $request->input('page', 1);
        $perPage = $request->input('perPage', 15);
        $filters = $request->only(['department', 'location', 'area', 'search']);

        // Get data based on active tab
        $data = match ($tab) {
            'payroll' => $this->getPaginatedPayrollData($from, $to, $filters, $page, $perPage),
            'daily'   => ['dailyRows' => $this->service->dailyTrend($from, $to)],
            'dept'    => ['deptRows' => $this->service->departmentSummary($from, $to, $filters)],
            'summary', 'location', 'late', 'absent' =>
            $this->getPaginatedSummaryData($from, $to, $filters, $page, $perPage, $tab),
            default   => $this->getPaginatedSummaryData($from, $to, $filters, $page, $perPage, 'summary'),
        };

        // Get all data for KPI calculations (unpaginated)
        $allSummaryRows = $this->service->summaryReport($from, $to, $filters);
        $allPayrollRows = $tab === 'payroll' ? $data['payrollData'] ?? [] : $this->service->payrollReport($from, $to, $filters);

        // Calculate KPI totals
        $kpiTotals = $this->calculateKpiTotals($allSummaryRows, $allPayrollRows, $tab, $data);

        // Get accessible areas for the user
        $user            = auth()->user();
        $accessibleAreas = $user->hasRole('Super Admin')
            ? Location::orderBy('name')->pluck('name')->toArray()
            : $user->getAccessibleAreas();

        $departments = Department::orderBy('name')->pluck('name')->toArray();
        $locations   = Location::orderBy('name')->pluck('name')->toArray();

        return Inertia::render('Reports/Index', array_merge($data, $kpiTotals, [
            'tab'         => $tab,
            'from'        => $from->toDateString(),
            'to'          => $to->toDateString(),
            'departments' => $departments,
            'locations'   => $locations,
            'areas'       => $accessibleAreas,
            'filters'     => $filters,
            'unreadCount' => $this->notifs->unreadCount($user->id),
            'currentPage' => $page,
            'perPage'     => $perPage,
        ]));
    }

    private function getPaginatedSummaryData(Carbon $from, Carbon $to, array $filters, int $page, int $perPage, string $tab): array
    {
        $allRows = $this->service->summaryReport($from, $to, $filters);

        // Apply search filter if provided
        if (! empty($filters['search'])) {
            $search  = strtolower($filters['search']);
            $allRows = array_filter($allRows, function ($row) use ($search) {
                return str_contains(strtolower($row['employeeName']), $search) ||
                str_contains(strtolower($row['employeeId']), $search);
            });
        }

        // Filter based on tab
        if ($tab === 'late') {
            $allRows = array_filter($allRows, fn($row) => $row['lateDays'] > 0);
            usort($allRows, fn($a, $b) => ($b['lateMinutes'] ?? 0) <=> ($a['lateMinutes'] ?? 0));
        } elseif ($tab === 'absent') {
            $allRows = array_filter($allRows, fn($row) => $row['absentDays'] > 0);
            usort($allRows, fn($a, $b) => $b['absentDays'] <=> $a['absentDays']);
        }

        $total         = count($allRows);
        $paginatedRows = array_slice($allRows, ($page - 1) * $perPage, $perPage);

        return [
            'summaryRows'       => $paginatedRows,
            'summaryPagination' => [
                'currentPage' => $page,
                'perPage'     => $perPage,
                'total'       => $total,
                'lastPage'    => ceil($total / $perPage),
            ],
        ];
    }

    private function getPaginatedPayrollData(Carbon $from, Carbon $to, array $filters, int $page, int $perPage): array
    {
        $allRows = $this->service->payrollReport($from, $to, $filters);

        if (! empty($filters['search'])) {
            $search  = strtolower($filters['search']);
            $allRows = array_filter($allRows, function ($row) use ($search) {
                return str_contains(strtolower($row['employeeName']), $search) ||
                str_contains(strtolower($row['employeeId']), $search);
            });
        }

        $total         = count($allRows);
        $paginatedRows = array_slice($allRows, ($page - 1) * $perPage, $perPage);

        return [
            'payrollRows'       => $paginatedRows,
            'payrollData'       => $allRows,
            'payrollPagination' => [
                'currentPage' => $page,
                'perPage'     => $perPage,
                'total'       => $total,
                'lastPage'    => ceil($total / $perPage),
            ],
        ];
    }

    private function calculateKpiTotals(array $summaryRows, array $payrollRows, string $tab, array $data): array
    {
        $totalPresent = array_sum(array_column($summaryRows, 'presentDays'));
        $totalAbsent  = array_sum(array_column($summaryRows, 'absentDays'));
        $totalLate    = array_sum(array_column($summaryRows, 'lateDays'));
        $totalOT      = array_sum(array_column($summaryRows, 'overtimeHours'));
        $avgRate      = count($summaryRows) > 0
            ? array_sum(array_column($summaryRows, 'attendanceRate')) / count($summaryRows)
            : 0;
        $totalNetPay = array_sum(array_column($payrollRows, 'netPay'));

        // Counts for badge displays
        $lateCount   = count(array_filter($summaryRows, fn($r) => $r['lateDays'] > 0));
        $absentCount = count(array_filter($summaryRows, fn($r) => $r['absentDays'] > 0));

        return [
            'kpiTotalPresent' => $totalPresent,
            'kpiTotalAbsent'  => $totalAbsent,
            'kpiTotalLate'    => $totalLate,
            'kpiTotalOT'      => $totalOT,
            'kpiAvgRate'      => round($avgRate, 1),
            'kpiTotalNetPay'  => $totalNetPay,
            'lateCount'       => $lateCount,
            'absentCount'     => $absentCount,
            'totalEmployees'  => count($summaryRows),
        ];
    }

    /**
     * Export attendance report to Excel
     */
    public function exportAttendance(Request $request)
    {
        $from       = $request->input('from', now()->startOfMonth()->toDateString());
        $to         = $request->input('to', today()->toDateString());
        $department = $request->input('department');
        $area       = $request->input('area');
        $location   = $request->input('location');

        $filename = sprintf(
            'attendance_report_%s_to_%s.xlsx',
            Carbon::parse($from)->format('Y-m-d'),
            Carbon::parse($to)->format('Y-m-d')
        );

        return Excel::download(
            new AttendanceExport($from, $to, $department, $area, $location, auth()->id()),
            $filename
        );
    }

    /**
     * Export attendance report to PDF
     */
    public function exportAttendancePdf(Request $request)
    {
        $from       = $request->input('from', now()->startOfMonth()->toDateString());
        $to         = $request->input('to', today()->toDateString());
        $department = $request->input('department');
        $area       = $request->input('area');
        $location   = $request->input('location');

        $filters = array_filter(compact('department', 'area', 'location'));

        $data = [
            'from'         => $from,
            'to'           => $to,
            'rows'         => $this->service->summaryReport(Carbon::parse($from), Carbon::parse($to), $filters),
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'generated_by' => auth()->user()->name,
            'filters'      => $filters,
        ];

        $pdf = Pdf::loadView('exports.attendance-pdf', $data);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download(sprintf(
            'attendance_report_%s_to_%s.pdf',
            Carbon::parse($from)->format('Y-m-d'),
            Carbon::parse($to)->format('Y-m-d')
        ));
    }

    /**
     * Export device report to Excel
     */
    public function exportDevices()
    {
        return Excel::download(
            new DeviceReportExport(auth()->id()),
            'device_report_' . now()->format('Y-m-d_His') . '.xlsx'
        );
    }

    /**
     * Export device report to PDF
     */
    public function exportDevicesPdf()
    {
        $user  = auth()->user();
        $query = \App\Models\Device::with('location')->orderBy('name');

        if (! $user->hasRole('Super Admin')) {
            $accessibleAreas       = $user->getAccessibleAreas();
            $accessibleLocationIds = $user->getAccessibleLocationIds();

            $query->where(function ($q) use ($accessibleAreas, $accessibleLocationIds) {
                if (! empty($accessibleAreas)) {
                    $q->whereIn('area', $accessibleAreas);
                }
                if (! empty($accessibleLocationIds)) {
                    $q->orWhereIn('location_id', $accessibleLocationIds);
                }
            });
        }

        $devices = $query->get();

        $pdf = Pdf::loadView('exports.devices-pdf', [
            'devices'      => $devices,
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'generated_by' => auth()->user()->name,
        ]);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download('device_report_' . now()->format('Y-m-d_His') . '.pdf');
    }

    /**
     * Export payroll report to Excel
     */
    public function exportPayroll(Request $request)
    {
        $month      = $request->input('month', now()->format('m'));
        $year       = $request->input('year', now()->format('Y'));
        $department = $request->input('department');
        $area       = $request->input('area');
        $location   = $request->input('location');

        $monthName = Carbon::create()->month($month)->format('F');

        return Excel::download(
            new PayrollExport($month, $year, $department, $area, $location, auth()->id()),
            sprintf('payroll_%s_%s.xlsx', $monthName, $year)
        );
    }

    /**
     * Export payroll report to PDF
     */
    public function exportPayrollPdf(Request $request)
    {
        $month      = $request->input('month', now()->format('m'));
        $year       = $request->input('year', now()->format('Y'));
        $department = $request->input('department');
        $area       = $request->input('area');
        $location   = $request->input('location');

        $monthName = Carbon::create()->month($month)->format('F');

        $filters = array_filter(compact('department', 'area', 'location'));

        $rows = $this->service->payrollReport(
            Carbon::create($year, $month, 1)->startOfMonth(),
            Carbon::create($year, $month, 1)->endOfMonth(),
            $filters
        );

        // Calculate totals
        $totals = [
            'basic_salary'     => array_sum(array_column($rows, 'basicSalary')),
            'absent_deduction' => array_sum(array_column($rows, 'absentDeduction')),
            'late_deduction'   => array_sum(array_column($rows, 'lateDeduction')),
            'overtime_pay'     => array_sum(array_column($rows, 'overtimePay')),
            'net_pay'          => array_sum(array_column($rows, 'netPay')),
        ];

        $pdf = Pdf::loadView('exports.payroll-pdf', [
            'month'        => $monthName,
            'year'         => $year,
            'rows'         => $rows,
            'totals'       => $totals,
            'generated_at' => now()->format('Y-m-d H:i:s'),
            'generated_by' => auth()->user()->name,
            'filters'      => $filters,
        ]);
        $pdf->setPaper('A4', 'landscape');

        return $pdf->download(sprintf('payroll_%s_%s.pdf', $monthName, $year));
    }

    /**
     * Export late arrivals report to Excel
     */
    public function exportLateArrivals(Request $request)
    {
        $from       = $request->input('from', now()->startOfMonth()->toDateString());
        $to         = $request->input('to', today()->toDateString());
        $department = $request->input('department');
        $area       = $request->input('area');

        $filters = array_filter(compact('department', 'area'));
        $rows    = $this->service->summaryReport(Carbon::parse($from), Carbon::parse($to), $filters);

        // Filter only late employees
        $lateRows = array_filter($rows, fn($row) => $row['lateDays'] > 0);

        // Sort by late minutes descending
        usort($lateRows, fn($a, $b) => ($b['lateMinutes'] ?? 0) <=> ($a['lateMinutes'] ?? 0));

        $filename = sprintf(
            'late_arrivals_%s_to_%s.xlsx',
            Carbon::parse($from)->format('Y-m-d'),
            Carbon::parse($to)->format('Y-m-d')
        );

        return Excel::download(
            new class($lateRows, $from, $to) implements
            \Maatwebsite\Excel\Concerns\FromArray,
            \Maatwebsite\Excel\Concerns\WithHeadings,
            \Maatwebsite\Excel\Concerns\WithTitle,
            \Maatwebsite\Excel\Concerns\ShouldAutoSize,
            \Maatwebsite\Excel\Concerns\WithStyles
        {

                public function __construct(
                    private array $rows,
                    private string $from,
                    private string $to
                ) {}

                public function title(): string
            {return 'Late Arrivals';}

                public function headings(): array
            {
                    return ['#', 'Employee ID', 'Employee Name', 'Department', 'Location',
                        'Late Days', 'Total Late (min)', 'Avg Late (min)', 'Attendance Rate'];
                }

                public function array(): array
            {
                    return array_map(function ($row, $i) {
                        return [
                            $i + 1,
                            $row['employeeId'],
                            $row['employeeName'],
                            $row['department'],
                            $row['location'],
                            $row['lateDays'],
                            $row['lateMinutes'] ?? 0,
                            $row['lateDays'] > 0 ? round(($row['lateMinutes'] ?? 0) / $row['lateDays'], 0) : 0,
                            $row['attendanceRate'] . '%',
                        ];
                    }, $this->rows, array_keys($this->rows));
                }

                public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet)
            {
                    $sheet->getStyle('A1:I1')->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                        'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                            'startColor'          => ['rgb' => '16a34a']],
                    ]);
                    $sheet->freezePane('A2');
                    return [];
                }
            },
            $filename
        );
    }

    /**
     * Export absenteeism report to Excel
     */
    public function exportAbsenteeism(Request $request)
    {
        $from       = $request->input('from', now()->startOfMonth()->toDateString());
        $to         = $request->input('to', today()->toDateString());
        $department = $request->input('department');
        $area       = $request->input('area');

        $filters        = array_filter(compact('department', 'area'));
        $attendanceRows = $this->service->summaryReport(Carbon::parse($from), Carbon::parse($to), $filters);
        $payrollRows    = $this->service->payrollReport(Carbon::parse($from), Carbon::parse($to), $filters);

        // Create lookup for payroll data
        $payrollLookup = [];
        foreach ($payrollRows as $pRow) {
            $payrollLookup[$pRow['employeeId']] = $pRow;
        }

        // Filter only employees with absences
        $absentRows = array_filter($attendanceRows, fn($row) => $row['absentDays'] > 0);

        // Sort by absent days descending
        usort($absentRows, fn($a, $b) => $b['absentDays'] <=> $a['absentDays']);

        $filename = sprintf(
            'absenteeism_%s_to_%s.xlsx',
            Carbon::parse($from)->format('Y-m-d'),
            Carbon::parse($to)->format('Y-m-d')
        );

        return Excel::download(
            new class($absentRows, $payrollLookup, $from, $to) implements
            \Maatwebsite\Excel\Concerns\FromArray,
            \Maatwebsite\Excel\Concerns\WithHeadings,
            \Maatwebsite\Excel\Concerns\WithTitle,
            \Maatwebsite\Excel\Concerns\ShouldAutoSize,
            \Maatwebsite\Excel\Concerns\WithStyles
        {

                public function __construct(
                    private array $rows,
                    private array $payrollLookup,
                    private string $from,
                    private string $to
                ) {}

                public function title(): string
            {return 'Absenteeism Report';}

                public function headings(): array
            {
                    return ['#', 'Employee ID', 'Employee Name', 'Department', 'Location',
                        'Absent Days', 'Present Days', 'Attendance Rate', 'Absent Deduction (₦)'];
                }

                public function array(): array
            {
                    return array_map(function ($row, $i) {
                        $payroll = $this->payrollLookup[$row['employeeId']] ?? null;
                        return [
                            $i + 1,
                            $row['employeeId'],
                            $row['employeeName'],
                            $row['department'],
                            $row['location'],
                            $row['absentDays'],
                            $row['presentDays'],
                            $row['attendanceRate'] . '%',
                            $payroll ? number_format($payroll['absentDeduction'], 2) : '-',
                        ];
                    }, $this->rows, array_keys($this->rows));
                }

                public function styles(\PhpOffice\PhpSpreadsheet\Worksheet\Worksheet $sheet)
            {
                    $sheet->getStyle('A1:I1')->applyFromArray([
                        'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                        'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                            'startColor'          => ['rgb' => '16a34a']],
                    ]);
                    $sheet->freezePane('A2');
                    return [];
                }
            },
            $filename
        );
    }
}
