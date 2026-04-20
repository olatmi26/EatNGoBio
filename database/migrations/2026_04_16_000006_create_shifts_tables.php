<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->time('start_time');
            $table->time('end_time');
            $table->decimal('work_hours', 4, 1)->default(8.0);
            $table->unsignedInteger('late_threshold')->default(15);     // minutes
            $table->unsignedInteger('overtime_threshold')->default(60); // minutes
            $table->json('breaks')->nullable();    // [{id, name, startTime, endTime, paid}]
            $table->json('locations')->nullable(); // [area names]
            $table->string('color', 10)->default('#16a34a');
            $table->unsignedInteger('employee_count')->default(0);
            $table->boolean('active')->default(true);
            $table->enum('type', ['fixed', 'flexible', 'rotating'])->default('fixed');
            $table->timestamps();
        });

        Schema::create('shift_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shift_id')->constrained()->cascadeOnDelete();
            $table->string('location')->nullable();
            $table->date('effective_date');
            $table->date('end_date')->nullable();
            $table->timestamps();
            $table->index(['employee_id', 'effective_date']);
        });
    }
    public function down(): void {
        Schema::dropIfExists('shift_assignments');
        Schema::dropIfExists('shifts');
    }
};
