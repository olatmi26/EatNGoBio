<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    protected $fillable = ['name', 'slug', 'code', 'superior', 'employee_qty', 'resigned_qty', 'manager', 'color'];
    protected $casts    = ['employee_qty' => 'integer', 'resigned_qty' => 'integer'];

    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'department_id');
    }
}
