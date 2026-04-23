<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll_approval_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('workflow_id')->constrained('payroll_approval_workflows')->cascadeOnDelete();
            $table->string('name');
            $table->string('code')->unique();
            $table->integer('order')->default(1);
            $table->boolean('is_required')->default(true);
            $table->boolean('can_reject')->default(true);
            $table->boolean('can_edit')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll_approval_levels');
    }
};