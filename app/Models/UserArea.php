<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserArea extends Model
{
    protected $fillable = ['user_id', 'area_name'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}