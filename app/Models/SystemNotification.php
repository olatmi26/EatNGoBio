<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SystemNotification extends Model
{
    protected $fillable = [
        'category','severity','title','message',
        'action_label','action_path','meta','read','user_id',
    ];
    protected $casts = ['read' => 'boolean'];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
