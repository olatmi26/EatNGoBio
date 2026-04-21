<?php

namespace App\Events;

use App\Models\AttendanceLog;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AttendanceRecorded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $id;
    public $employeeId;
    public $employeeName;
    public $initials;
    public $department;
    public $device;
    public $deviceName;
    public $timestamp;
    public $time;
    public $punchType;
    public $verifyMode;
    public $type;
    public $status;
    public $color;

    public function __construct(AttendanceLog $log)
    {
        $employee = $log->employee;
        $device = $log->device;
        $colors = ['#16a34a', '#0891b2', '#f59e0b', '#7c3aed', '#db2777', '#dc2626', '#d97706', '#0d9488', '#4f46e5', '#ea580c'];
        
        $this->id = $log->id;
        $this->employeeId = $log->employee_pin;
        $this->employeeName = $employee?->full_name ?? "PIN {$log->employee_pin}";
        $this->initials = $employee ? $employee->initials : strtoupper(substr($log->employee_pin, 0, 2));
        $this->department = $employee?->department ?? '-';
        $this->device = $device?->name ?? $log->device_sn;
        $this->deviceName = $device?->name ?? $log->device_sn;
        $this->timestamp = $log->punch_time->toIso8601String();
        $this->time = $log->punch_time->format('H:i:s');
        $this->punchType = $log->verify_type_label;
        $this->verifyMode = $log->punch_type_label;
        $this->type = $log->punch_type === 0 ? 'IN' : 'OUT';
        $this->status = 'success';
        $this->color = $colors[$log->id % count($colors)];
    }

    public function broadcastOn(): array
    {
        return [new Channel('attendance')];
    }

    public function broadcastAs(): string
    {
        return 'attendance.recorded';
    }
}