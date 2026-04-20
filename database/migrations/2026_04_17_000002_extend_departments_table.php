<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'superior')) {
                $table->string('superior')->nullable()->after('code');
            }
            if (!Schema::hasColumn('departments', 'employee_qty')) {
                $table->unsignedInteger('employee_qty')->default(0)->after('superior');
            }
            if (!Schema::hasColumn('departments', 'resigned_qty')) {
                $table->unsignedInteger('resigned_qty')->default(0)->after('employee_qty');
            }
            if (!Schema::hasColumn('departments', 'manager')) {
                $table->string('manager')->nullable()->after('resigned_qty');
            }
            if (!Schema::hasColumn('departments', 'color')) {
                $table->string('color', 10)->nullable()->after('manager');
            }
        });
    }
    public function down(): void {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropColumn(['superior', 'employee_qty', 'resigned_qty', 'manager', 'color']);
        });
    }
};
