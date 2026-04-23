<?php

namespace App\Exports;


use App\Models\Employee;
use Carbon\Carbon;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

class AttendanceExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(
        private string $fromDate,
        private string $toDate,
        private ?string $department = null,
        private ?string $area = null,
        private ?int $userId = null
    ) {}

    public function title(): string
    {
        return 'Attendance Report';
    }

    public function collection()
    {
        $query = Employee::with(['attendanceLogs' => function($q) {
            $q->whereBetween('punch_time', [
                Carbon::parse($this->fromDate)->startOfDay(),
                Carbon::parse($this->toDate)->endOfDay()
            ]);
        }])->where('active', true);

        if ($this->department) {
            $query->where('department', $this->department);
        }

        if ($this->area) {
            $query->where('area', $this->area);
        }

        // Apply user access control
        if ($this->userId) {
            $user = \App\Models\User::find($this->userId);
            if ($user && !$user->hasRole('Super Admin')) {
                $accessibleAreas = $user->getAccessibleAreas();
                $query->whereIn('area', $accessibleAreas);
            }
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'Employee ID',
            'Employee Name',
            'Department',
            'Area',
            'Date',
            'Check In',
            'Check Out',
            'Work Hours',
            'Status',
            'Late (mins)',
            'Overtime (mins)',
        ];
    }

    public function map($employee): array
    {
        $rows = [];
        $logsByDate = $employee->attendanceLogs->groupBy(fn($log) => $log->punch_time->format('Y-m-d'));
        
        $dateRange = Carbon::parse($this->fromDate)->daysUntil(Carbon::parse($this->toDate));
        
        foreach ($dateRange as $date) {
            $dateStr = $date->format('Y-m-d');
            if ($date->isWeekend()) continue;
            
            $dayLogs = $logsByDate->get($dateStr, collect());
            $checkIn = $dayLogs->where('punch_type', 0)->first();
            $checkOut = $dayLogs->where('punch_type', 1)->last();
            
            $status = 'Absent';
            $workHours = 0;
            $lateMins = 0;
            $overtimeMins = 0;
            
            if ($checkIn) {
                $status = 'Present';
                
                // Calculate late minutes
                $shift = $employee->shift;
                $expectedStart = $shift?->start_time ?? '08:00';
                $expectedTime = Carbon::parse($dateStr . ' ' . $expectedStart);
                $lateThreshold = $shift?->late_threshold ?? 15;
                
                if ($checkIn->punch_time->gt($expectedTime->addMinutes($lateThreshold))) {
                    $status = 'Late';
                    $lateMins = $checkIn->punch_time->diffInMinutes($expectedTime);
                }
                
                // Calculate work hours
                if ($checkOut) {
                    $workHours = round($checkIn->punch_time->diffInMinutes($checkOut->punch_time) / 60, 2);
                    
                    // Calculate overtime
                    $expectedWorkHours = $shift?->work_hours ?? 8;
                    $overtimeThreshold = $shift?->overtime_threshold ?? 60;
                    
                    if ($workHours > $expectedWorkHours) {
                        $overtimeMins = ($workHours - $expectedWorkHours) * 60;
                    }
                }
            }
            
            $rows[] = [
                $employee->employee_id,
                $employee->full_name,
                $employee->department ?? '-',
                $employee->area ?? '-',
                $dateStr,
                $checkIn?->punch_time->format('H:i:s') ?? '-',
                $checkOut?->punch_time->format('H:i:s') ?? '-',
                $workHours ? number_format($workHours, 2) : '-',
                $status,
                $lateMins ?: '-',
                $overtimeMins ?: '-',
            ];
        }
        
        return $rows;
    }

    public function styles(Worksheet $sheet)
    {
        // Header styling
        $sheet->getStyle('A1:K1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '16a34a']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ]);

        // Freeze header row
        $sheet->freezePane('A2');
        
        // Auto-filter
        $sheet->setAutoFilter($sheet->calculateWorksheetDimension());
        
        return [];
    }
}