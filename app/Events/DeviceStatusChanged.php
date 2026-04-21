<?php

namespace App\Events;

use App\Models\Device;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DeviceStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $deviceId;
    public $sn;
    public $name;
    public $status;
    public $lastSeen;
    public $users;
    public $fp;
    public $face;

    public function __construct(Device $device, string $status)
    {
        $this->deviceId = $device->id;
        $this->sn = $device->serial_number;
        $this->name = $device->name;
        $this->status = $status;
        $this->lastSeen = $device->last_seen?->toDateTimeString();
        $this->users = $device->user_count ?? 0;
        $this->fp = $device->fp_count ?? 0;
        $this->face = $device->face_count ?? 0;
    }

    public function broadcastOn(): array
    {
        return [new Channel('devices')];
    }

    public function broadcastAs(): string
    {
        return 'device.status';
    }
}