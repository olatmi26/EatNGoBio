<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('device_sync_logs', function (Blueprint $table) {
            $table->id();
            $table->string('device_sn', 32);
            $table->foreignId('device_id')->nullable()->constrained('devices')->nullOnDelete();
            $table->enum('type', ['heartbeat', 'attendance', 'user', 'command', 'upload']);
            $table->unsignedInteger('records')->default(0);
            $table->enum('status', ['success', 'failed', 'partial'])->default('success');
            $table->string('duration')->nullable();   // e.g. "1.4s"
            $table->text('message')->nullable();
            $table->timestamp('synced_at')->useCurrent();
            $table->index(['device_sn', 'synced_at']);
            $table->index(['device_id', 'type', 'synced_at']);
        });

        Schema::create('pending_devices', function (Blueprint $table) {
            $table->id();
            $table->string('serial_number', 32)->unique();
            $table->ipAddress('ip_address')->nullable();
            $table->string('model')->nullable();
            $table->string('firmware', 50)->nullable();
            $table->string('suggested_name')->nullable();
            $table->enum('status', ['pending', 'provisioning', 'approved', 'rejected'])->default('pending');
            $table->unsignedInteger('request_count')->default(1);
            $table->timestamp('first_seen')->useCurrent();
            $table->timestamp('last_heartbeat')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void {
        Schema::dropIfExists('device_sync_logs');
        Schema::dropIfExists('pending_devices');
    }
};
