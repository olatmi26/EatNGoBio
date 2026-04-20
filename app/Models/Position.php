<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Position extends Model
{
    protected $fillable = ['code', 'name', 'employee_qty'];
    protected $casts    = ['employee_qty' => 'integer'];

    public function employees(): HasMany { return $this->hasMany(Employee::class, 'position_id'); }
}
