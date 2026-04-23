<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // User-Location pivot table
        Schema::create('user_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('location_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            
            $table->unique(['user_id', 'location_id']);
        });

        // User-Area pivot table (for granular control)
        Schema::create('user_areas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('area_name');
            $table->timestamps();
            
            $table->unique(['user_id', 'area_name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_areas');
        Schema::dropIfExists('user_locations');
    }
};