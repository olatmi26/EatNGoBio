<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
       /*  Schema::create('payroll_approval_routes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('approval_level_id')->constrained('payroll_approval_levels')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('role')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        }); */
    }

    public function down(): void
    {
       // Schema::dropIfExists('payroll_approval_routes');
    }
};