<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('device_commands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->nullable()->constrained('devices')->nullOnDelete();
            $table->string('device_sn', 32)->nullable();
            $table->text('command');
            $table->text('params')->nullable(); // full command string
            $table->enum('status', ['pending', 'sent', 'success', 'failed'])->default('pending');
            $table->integer('return_code')->nullable();
            $table->text('response')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['device_sn', 'status', 'device_id']);
        });

        Schema::create('device_operation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('device_id')->nullable()->constrained('devices')->nullOnDelete();
            $table->text('raw_data');
            $table->text('response')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('executed_at')->nullable();
            $table->timestamps();
            $table->index(['device_id', 'executed_at']);

        });
    }

    public function down(): void
    {
        Schema::dropIfExists('device_commands');
    }
};
