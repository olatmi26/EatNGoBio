<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_period_approvals', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_period_id')->constrained('payroll_periods')->cascadeOnDelete();
            $table->foreignId('approval_level_id')->constrained('payroll_approval_levels')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            
            $table->unique(['payroll_period_id', 'approval_level_id'], 'payroll_period_approvals_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_period_approvals');
    }
};