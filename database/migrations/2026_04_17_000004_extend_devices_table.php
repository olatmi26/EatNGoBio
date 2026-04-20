<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('devices', function (Blueprint $table) {
            if (!Schema::hasColumn('devices', 'area')) {
                $table->string('area')->nullable()->after('name');
            }
            if (!Schema::hasColumn('devices', 'transfer_mode')) {
                $table->string('transfer_mode')->default('Real-Time')->after('timezone');
            }
            if (!Schema::hasColumn('devices', 'heartbeat_interval')) {
                $table->unsignedInteger('heartbeat_interval')->default(10)->after('transfer_mode');
            }
            if (!Schema::hasColumn('devices', 'approved')) {
                $table->boolean('approved')->default(false)->after('heartbeat_interval');
            }
        });
    }
    public function down(): void {
        Schema::table('devices', function (Blueprint $table) {
            $table->dropColumn(['area', 'transfer_mode', 'heartbeat_interval', 'approved']);
        });
    }
};
