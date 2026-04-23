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
        Schema::create('salary_structures', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g., "Grade Level 1", "Manager Grade A"
            $table->string('code')->unique(); // e.g., "GL01", "MGR-A"
            $table->text('description')->nullable();
            $table->decimal('basic_salary_min', 15, 2);
            $table->decimal('basic_salary_max', 15, 2);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('salary_structures');
    }
};
