<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('employees', function (Blueprint $table) {
            if (!Schema::hasColumn('employees', 'department_id')) {
                $table->foreignId('department_id')->nullable()->after('department')->constrained()->nullOnDelete();
            }
            if (!Schema::hasColumn('employees', 'position_id')) {
                $table->foreignId('position_id')->nullable()->after('position')->constrained()->nullOnDelete();
            }
            if (!Schema::hasColumn('employees', 'location_id')) {
                $table->foreignId('location_id')->nullable()->after('area')->constrained()->nullOnDelete();
            }
            if (!Schema::hasColumn('employees', 'shift_id')) {
                $table->unsignedBigInteger('shift_id')->nullable()->after('location_id');
                $table->foreign('shift_id')->references('id')->on('shifts')->nullOnDelete();
            }
            if (!Schema::hasColumn('employees', 'employee_status')) {
                // 'active' | 'resigned' | 'probation' | 'suspended' | 'disabled'
                $table->string('employee_status', 20)->default('active')->after('active');
            }
            if (!Schema::hasColumn('employees', 'basic_salary')) {
                $table->decimal('basic_salary', 12, 2)->nullable()->after('employee_status');
            }
        });
    }
    public function down(): void {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropForeign(['department_id', 'position_id', 'location_id', 'shift_id']);
            $table->dropColumn(['department_id', 'position_id', 'location_id', 'shift_id', 'employee_status', 'basic_salary']);
        });
    }
};
