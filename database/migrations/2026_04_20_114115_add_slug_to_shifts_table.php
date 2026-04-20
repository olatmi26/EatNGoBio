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
        Schema::table('shifts', function (Blueprint $table) {
            $table->time('checkin_start_at')->nullable()->index()->after('start_time')->comment('Earliest allowed clock-in time; system rejects check-ins before this');           
            $table->time('checkout_ends_at')->nullable()->index()->after('end_time') ->comment('Latest valid clock-out time; checkouts after this are flagged as missed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('shifts', function (Blueprint $table) {
            $table->dropColumn(['checkin_start_at', 'checkout_ends_at']);
        });
    }
};
