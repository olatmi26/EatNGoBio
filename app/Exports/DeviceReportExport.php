<?php

namespace App\Exports;

use App\Models\Device;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

class DeviceReportExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(
        private ?int $userId = null
    ) {}

    public function title(): string
    {
        return 'Device Report';
    }

    public function collection()
    {
        $query = Device::with('location')->orderBy('name');
        
        if ($this->userId) {
            $user = \App\Models\User::find($this->userId);
            if ($user && !$user->hasRole('Super Admin')) {
                $accessibleAreas = $user->getAccessibleAreas();
                $accessibleLocationIds = $user->getAccessibleLocationIds();
                
                $query->where(function($q) use ($accessibleAreas, $accessibleLocationIds) {
                    if (!empty($accessibleAreas)) {
                        $q->whereIn('area', $accessibleAreas);
                    }
                    if (!empty($accessibleLocationIds)) {
                        $q->orWhereIn('location_id', $accessibleLocationIds);
                    }
                });
            }
        }
        
        return $query->get();
    }

    public function headings(): array
    {
        return [
            'Device Name',
            'Serial Number',
            'Area/Location',
            'IP Address',
            'Status',
            'Firmware',
            'User Count',
            'FP Count',
            'Face Count',
            'Last Seen',
            'Heartbeat Interval',
            'Timezone',
            'Transfer Mode',
            'Approved',
            'Created At',
        ];
    }

    public function map($device): array
    {
        return [
            $device->name ?? '-',
            $device->serial_number,
            $device->area ?? $device->location?->name ?? '-',
            $device->ip_address ?? '-',
            $device->computed_status,
            $device->firmware ?? 'Unknown',
            $device->user_count ?? 0,
            $device->fp_count ?? 0,
            $device->face_count ?? 0,
            $device->last_seen?->format('Y-m-d H:i:s') ?? 'Never',
            $device->heartbeat_interval ?? 10,
            $device->timezone ?? 'Africa/Lagos',
            $device->transfer_mode ?? 'Real-Time',
            $device->approved ? 'Yes' : 'No',
            $device->created_at?->format('Y-m-d H:i:s') ?? '-',
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1:O1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '16a34a']],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ]);

        $sheet->freezePane('A2');
        $sheet->setAutoFilter($sheet->calculateWorksheetDimension());
        
        return [];
    }
}