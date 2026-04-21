<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DeviceSyncLog extends Model
{
    // Remove this line: public $timestamps = false;
    
    protected $fillable = [
        'device_sn', 
        'device_id', 
        'type', 
        'records', 
        'status', 
        'duration', 
        'message', 
        'synced_at',
        'created_at',   // Add this
        'updated_at',   // Add this
    ];
    
    protected $casts = [
        'synced_at'  => 'datetime', 
        'records'    => 'integer',
        'created_at' => 'datetime',  // Add this
        'updated_at' => 'datetime',  // Add this
    ];

    public function device(): BelongsTo 
    { 
        return $this->belongsTo(Device::class); 
    }
}