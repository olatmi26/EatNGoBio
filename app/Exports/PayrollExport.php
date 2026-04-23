<?php
// app/Exports/PayrollExport.php

namespace App\Exports;

use App\Models\Payroll;
use App\Models\PayrollPeriod;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PayrollExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle, WithColumnFormatting
{
    public function __construct(
        private int $periodId
    ) {}

    public function title(): string
    {
        $period = PayrollPeriod::find($this->periodId);
        return $period ? str_replace(' ', '_', $period->name) : 'Payroll';
    }

    public function collection()
    {
        return Payroll::with(['employee', 'period'])
            ->where('payroll_period_id', $this->periodId)
            ->orderBy('employee_id')
            ->get();
    }

    public function headings(): array
    {
        return [
            'Employee ID',
            'Employee Name',
            'Department',
            'Basic Salary (₦)',
            'Days Worked',
            'Days Absent',
            'Late Minutes',
            'Overtime Hours',
            'Overtime Pay (₦)',
            'Late Deduction (₦)',
            'Absent Deduction (₦)',
            'Tax Deduction (₦)',
            'Pension Deduction (₦)',
            'NHF Deduction (₦)',
            'Gross Pay (₦)',
            'Net Pay (₦)',
            'Status',
        ];
    }

    public function map($payroll): array
    {
        return [
            $payroll->employee_id,
            $payroll->employee?->full_name ?? '-',
            $payroll->employee?->department ?? '-',
            $payroll->basic_salary,
            $payroll->days_worked ?? 0,
            $payroll->days_absent ?? 0,
            $payroll->late_minutes ?? 0,
            $payroll->overtime_hours ?? 0,
            $payroll->overtime_pay ?? 0,
            $payroll->late_deduction ?? 0,
            $payroll->absent_deduction ?? 0,
            $payroll->tax_deduction ?? 0,
            $payroll->pension_deduction ?? 0,
            $payroll->nhf_deduction ?? 0,
            $payroll->gross_pay ?? 0,
            $payroll->net_pay ?? 0,
            ucfirst($payroll->status ?? 'draft'),
        ];
    }

    public function columnFormats(): array
    {
        return [
            'D' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'I' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'J' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'K' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'L' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'M' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'N' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'O' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
            'P' => NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1,
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1:R1')->applyFromArray([
            'font'    => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '16a34a']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ]);

        $sheet->freezePane('A2');
        $sheet->setAutoFilter($sheet->calculateWorksheetDimension());

        return [];
    }
}
