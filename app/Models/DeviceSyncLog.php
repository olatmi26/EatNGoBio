<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceSyncLog extends Model
{
    public $timestamps = false;
    protected $fillable = ['device_sn','device_id','type','records','status','duration','message','synced_at'];
    protected $casts    = ['synced_at' => 'datetime', 'records' => 'integer'];

    public function device(): BelongsTo { return $this->belongsTo(Device::class); }
}
