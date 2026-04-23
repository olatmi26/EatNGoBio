<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('employee_salary_history', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id');
            $table->foreign('employee_id')->references('employee_id')->on('employees')->cascadeOnDelete();
            $table->decimal('old_basic_salary', 15, 2)->nullable();
            $table->decimal('new_basic_salary', 15, 2);
            $table->decimal('change_amount', 15, 2);
            $table->decimal('change_percentage', 8, 2)->nullable();
            $table->string('change_type'); // increment, decrement, promotion, demotion, adjustment
            $table->text('reason')->nullable();
            $table->date('effective_date');
            $table->foreignId('changed_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
            
            $table->index(['employee_id', 'effective_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_salary_histories');
    }
};
