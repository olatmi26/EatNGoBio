<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceCommand extends Model
{
    protected $fillable = [
        'device_id','device_sn','command','params',
        'status','return_code','response','sent_at','completed_at',
    ];
    protected $casts = [
        'sent_at'      => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function device(): BelongsTo { return $this->belongsTo(Device::class, 'device_id'); }
}
