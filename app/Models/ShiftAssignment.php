<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShiftAssignment extends Model
{
    protected $fillable = ['employee_id', 'shift_id', 'location', 'effective_date', 'end_date'];
    protected $casts    = ['effective_date' => 'date', 'end_date' => 'date'];

    public function employee(): BelongsTo { return $this->belongsTo(Employee::class); }
    public function shift(): BelongsTo    { return $this->belongsTo(Shift::class); }
}
