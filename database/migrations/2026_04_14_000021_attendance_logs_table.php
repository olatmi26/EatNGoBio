<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_logs', function (Blueprint $table) {
            $table->id();
            $table->string('device_sn', 32);
            $table->foreignId('device_id')->constrained()->cascadeOnDelete();
            $table->string('employee_pin', 20);
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->dateTime('punch_time');
            $table->tinyInteger('punch_type')->default(0);  // 0=In,1=Out,2=Break Out...
            $table->tinyInteger('verify_type')->default(1); // 1=FP,4=PIN,15=Face
            $table->string('work_code', 20)->nullable();
            $table->text('raw_line_data')->nullable();
            $table->timestamps();

            // Prevent duplicate records from device retransmission
            $table->unique(['device_sn', 'employee_pin', 'punch_time','employee_id'], 'unique_punch');

            $table->index(['punch_time']);
            $table->index(['employee_pin','employee_id']);
            $table->index(['device_sn']);
            $table->index(['device_sn', 'punch_time']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_logs');
    }
};
