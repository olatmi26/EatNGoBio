<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Create devices table
        Schema::create('devices', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number', 32)->unique();
            $table->string('name', 100)->nullable();
            $table->foreignId('location_id')->nullable()->constrained('locations')->nullOnDelete();
            $table->ipAddress('ip_address')->nullable();
            $table->string('firmware', 50)->nullable();
            $table->integer('user_count')->default(0);
            $table->integer('fp_count')->default(0);
            $table->integer('face_count')->default(0);
            $table->timestamp('last_seen')->nullable();
            $table->string('timezone')->default('Etc/GMT+1');
            $table->boolean('online')->default(false);
            $table->enum('status', ['online', 'offline', 'unknown'])->default('unknown');
            $table->text('notes')->nullable();
            $table->json('extra_data')->nullable();
            $table->timestamps();



            

            $table->index(['last_seen','status']);
            $table->index(['location_id']);
            $table->index(['serial_number']);
            $table->index(['ip_address']);
            $table->index(['user_count']);
            $table->index(['fp_count']);
            $table->index(['face_count']);
            
        });

    }

    public function down(): void
    {
       /*  Schema::dropIfExists('device_commands');
        Schema::dropIfExists('attendance_logs');
        Schema::dropIfExists('employees'); */
        Schema::dropIfExists('devices');
    }
};
