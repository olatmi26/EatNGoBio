<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['Store', 'Head Office', 'Commissary', 'Other'])->default('Store');
            $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedInteger('asset_count')->default(0);
            $table->string('city')->nullable();
            
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('locations'); }
};
