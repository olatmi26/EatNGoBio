<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PendingDevice extends Model
{
    protected $fillable = [
        'serial_number','ip_address','model','firmware',
        'suggested_name','status','request_count','first_seen','last_heartbeat',
    ];
    protected $casts = [
        'first_seen'     => 'datetime',
        'last_heartbeat' => 'datetime',
        'request_count'  => 'integer',
    ];
}
