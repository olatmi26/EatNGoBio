<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('email')->constrained()->nullOnDelete();
            $table->string('avatar_initials', 5)->nullable()->after('department_id');
            $table->string('phone')->nullable()->after('avatar_initials')->unique();
            $table->string('address')->nullable()->after('phone');
            $table->string('city')->nullable()->after('address');
            $table->string('avatar')->nullable()->after('city');
            $table->foreignId('location_id')->nullable()->after('status')->constrained()->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['department_id', 'avatar_initials', 'status', 'location_id', 'phone', 'address', 'city', 'avatar']);
        });
    }
};
