<?php
// app/Exports/EmployeeCompensationExport.php

namespace App\Exports;

use App\Models\EmployeeCompensation;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EmployeeCompensationExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(private array $filters = [])
    {}

    public function title(): string
    {
        return 'Employee Compensations';
    }

    public function collection()
    {
        $query = EmployeeCompensation::with(['employee', 'salaryStructure']);

        if (! empty($this->filters['department'])) {
            $query->whereHas('employee', fn($q) => $q->where('department', $this->filters['department']));
        }

        if (! empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }

        if (! empty($this->filters['search'])) {
            $search = $this->filters['search'];
            $query->where(function ($q) use ($search) {
                $q->whereHas('employee', fn($eq) => $eq->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('employee_id', 'like', "%{$search}%"));
            });
        }

        return $query->orderBy('employee_id')->get();
    }

    public function headings(): array
    {
        return [
            'Employee ID',
            'Employee Name',
            'Department',
            'Salary Structure',
            'Basic Salary (₦)',
            'Total Allowances (₦)',
            'Total Deductions (₦)',
            'Gross Salary (₦)',
            'Net Salary (₦)',
            'Effective Date',
            'End Date',
            'Status',
            'Remarks',
        ];
    }

    public function map($compensation): array
    {
        return [
            $compensation->employee_id,
            $compensation->employee->full_name ?? 'Unknown',
            $compensation->employee->department ?? '-',
            $compensation->salaryStructure->name ?? '-',
            $compensation->basic_salary,
            $compensation->total_allowances,
            $compensation->total_deductions,
            $compensation->gross_salary,
            $compensation->net_salary,
            $compensation->effective_date->format('Y-m-d'),
            $compensation->end_date?->format('Y-m-d') ?? '-',
            $compensation->status,
            $compensation->remarks ?? '-',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1:M1')->applyFromArray([
            'font'    => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '16a34a']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ]);

        $sheet->freezePane('A2');
        $sheet->setAutoFilter($sheet->calculateWorksheetDimension());

        return [];
    }
}
