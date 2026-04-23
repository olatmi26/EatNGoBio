<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('biometric_templates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('device_sn');
            $table->enum('type', ['fingerprint', 'face']);
            $table->integer('finger_id')->nullable(); // 0-9 for fingerprints
            $table->integer('template_size')->default(0);
            $table->longText('template_data')->nullable(); // Base64 encoded template
            $table->boolean('is_valid')->default(true);
            $table->boolean('is_duress')->default(false);
            $table->string('major_version')->nullable();
            $table->string('minor_version')->nullable();
            $table->timestamps();
            
            $table->unique(['employee_id', 'device_sn', 'type', 'finger_id'], 'unique_biometric');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('biometric_templates');
    }
};