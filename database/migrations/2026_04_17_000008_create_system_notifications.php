<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('system_notifications', function (Blueprint $table) {
            $table->id();
            $table->enum('category', ['absence', 'device', 'late', 'system', 'biometric']);
            $table->enum('severity', ['critical', 'warning', 'info', 'success']);
            $table->string('title');
            $table->text('message');
            $table->string('action_label')->nullable();
            $table->string('action_path')->nullable();
            $table->string('meta')->nullable();
            $table->boolean('read')->default(false);
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();
            $table->index(['read', 'severity', 'created_at']);
            $table->index(['user_id', 'read']);
        });
    }
    public function down(): void { Schema::dropIfExists('system_notifications'); }
};
