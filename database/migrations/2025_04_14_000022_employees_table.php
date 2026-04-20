<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('employee_id', 20)->unique();  // ZK "PIN" = employee ID on device
            $table->string('first_name',100);
            $table->string('last_name',100)->nullable();
            $table->string('card', 50)->nullable();
            $table->string('department', 100)->nullable();
            $table->string('position')->nullable();
            $table->string('employment_type')->nullable();
            $table->date('hired_date')->nullable();
            $table->string('area')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('email')->nullable();
            $table->string('picture')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('state')->nullable();
            $table->string('zip')->nullable();
            $table->boolean('app_status')->default(false);
            $table->boolean('active')->default(true);
            $table->json('biometric_areas')->nullable();
            $table->string('source_device_sn', 32)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
