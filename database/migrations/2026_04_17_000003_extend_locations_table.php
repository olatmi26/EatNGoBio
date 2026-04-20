<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('locations', function (Blueprint $table) {
            if (!Schema::hasColumn('locations', 'code')) {
                $table->string('code')->nullable()->after('id');
            }
            if (!Schema::hasColumn('locations', 'timezone')) {
                $table->string('timezone')->default('Africa/Lagos')->after('name');
            }
            if (!Schema::hasColumn('locations', 'color')) {
                $table->string('color', 10)->nullable()->after('timezone');
            }
        });
    }
    public function down(): void {
        Schema::table('locations', function (Blueprint $table) {
            $table->dropColumn(['code', 'timezone', 'color']);
        });
    }
};
