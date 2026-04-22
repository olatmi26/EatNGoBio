<?php

use App\Http\Controllers\ADMSController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\LiveMonitorController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ShiftController;
use Illuminate\Support\Facades\Route;

// =========================================================================
// ZKTeco ADMS Device Protocol Routes
// MUST be first and OUTSIDE any middleware groups
// =========================================================================
Route::prefix('iclock')->group(function () {
    Route::match(['get', 'post'], '/cdata', [ADMSController::class, 'cdata']);
    Route::get('/getrequest', [ADMSController::class, 'getRequest']);
    Route::post('/devicecmd', [ADMSController::class, 'deviceCmd']);
    Route::post('/upload', [ADMSController::class, 'upload']);
    Route::get('/fdata', [ADMSController::class, 'fdata']);
});

// ─── Guest Routes ─────────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// ─── Authenticated Routes ─────────────────────────────────────────────────────
Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Devices
    Route::get('/devices', [DeviceController::class, 'index'])->name('devices.index');
    Route::post('/devices', [DeviceController::class, 'store'])->name('devices.store');
    Route::get('/devices/{id}', [DeviceController::class, 'show'])->name('devices.show');
    Route::put('/devices/{id}', [DeviceController::class, 'update'])->name('devices.update');
    Route::delete('/devices/{id}', [DeviceController::class, 'destroy'])->name('devices.destroy');
    Route::post('/devices/{id}/command', [DeviceController::class, 'sendCommand'])->name('devices.command');
    Route::get('/devices/{id}/employees', [DeviceController::class, 'employees'])->name('devices.employees');
    Route::post('/devices/pending/{id}/approve', [DeviceController::class, 'approve'])->name('devices.approve');
    Route::post('/devices/pending/{id}/reject', [DeviceController::class, 'reject'])->name('devices.reject');
    Route::post('/devices/batch-approve', [DeviceController::class, 'batchApprove'])->name('devices.batch-approve');
    Route::get('/api/devices/live-stats', [DeviceController::class, 'liveStats'])->name('devices.live-stats');

    // Employees
    Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::get('/employees/{id}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::put('/employees/{id}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::post('/employees/{id}/transfer', [EmployeeController::class, 'transfer'])->name('employees.transfer');
    Route::post('/employees/{id}/status', [EmployeeController::class, 'updateStatus'])->name('employees.status');

    // Attendance
    Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');

    // Shifts
    Route::prefix('shifts')->name('shifts.')->group(function () {

        Route::get('/', [ShiftController::class, 'index'])->name('index');
        Route::post('/', [ShiftController::class, 'store'])->name('store');
        Route::put('/{id}', [ShiftController::class, 'update'])->name('update');
        Route::delete('/{id}', [ShiftController::class, 'destroy'])->name('destroy');
        Route::post('/assign', [ShiftController::class, 'assign'])->name('assign');
        Route::post('/auto-assign', [ShiftController::class, 'autoAssign'])->name('autoAssign');

    });

    // Organization
    Route::get('/organization/departments', [OrganizationController::class, 'departments'])->name('org.departments');
    Route::post('/organization/departments', [OrganizationController::class, 'storeDepartment'])->name('org.departments.store');
    Route::put('/organization/departments/{id}', [OrganizationController::class, 'updateDepartment'])->name('org.departments.update');
    Route::delete('/organization/departments/{id}', [OrganizationController::class, 'destroyDepartment'])->name('org.departments.destroy');
    Route::get('/organization/positions', [OrganizationController::class, 'positions'])->name('org.positions');
    Route::post('/organization/positions', [OrganizationController::class, 'storePosition'])->name('org.positions.store');
    Route::put('/organization/positions/{id}', [OrganizationController::class, 'updatePosition'])->name('org.positions.update');
    Route::delete('/organization/positions/{id}', [OrganizationController::class, 'destroyPosition'])->name('org.positions.destroy');
    Route::get('/organization/areas', [OrganizationController::class, 'areas'])->name('org.areas');
    Route::post('/organization/areas', [OrganizationController::class, 'storeArea'])->name('org.areas.store');
    Route::put('/organization/areas/{id}', [OrganizationController::class, 'updateArea'])->name('org.areas.update');
    Route::delete('/organization/areas/{id}', [OrganizationController::class, 'destroyArea'])->name('org.areas.destroy');
    Route::get('/organization/chart', [OrganizationController::class, 'chart'])->name('org.chart');

    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Live Monitor
    Route::get('/live-monitor', [LiveMonitorController::class, 'index'])->name('live-monitor.index');
    Route::get('/api/live-monitor/feed', [LiveMonitorController::class, 'feed'])->name('live-monitor.feed');

    // Settings & User Management
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [SettingsController::class, 'index'])->name('index');
        Route::post('/', [SettingsController::class, 'update'])->name('update');

        // Users
        Route::post('/users', [SettingsController::class, 'storeUser'])->name('users.store');
        Route::put('/users/{id}', [SettingsController::class, 'updateUser'])->name('users.update');
        Route::delete('/users/{id}', [SettingsController::class, 'destroyUser'])->name('users.destroy');

        // Roles
        Route::post('/roles', [SettingsController::class, 'storeRole'])->name('roles.store');
        Route::put('/roles/{id}', [SettingsController::class, 'updateRole'])->name('roles.update');
        Route::delete('/roles/{id}', [SettingsController::class, 'destroyRole'])->name('roles.destroy');

        Route::get('/pending-devices', [SettingsController::class, 'pendingDevices']);
        Route::post('/provision-device', [SettingsController::class, 'provisionDevice']);
        Route::post('/reject-device', [SettingsController::class, 'rejectDevice']);

        Route::post('/devices/approve/{pendingId}', [DeviceController::class, 'approve'])->name('devices.approve');
        Route::post('/devices/reject/{pendingId}', [DeviceController::class, 'reject'])->name('devices.reject');
        Route::post('/devices/reconsider/{pendingId}', [DeviceController::class, 'reconsider'])->name('devices.reconsider');
        Route::get('/devices/stats', [DeviceController::class, 'stats'])->name('devices.stats');
    });

    // Notifications (JSON API — used by TopBar)
    Route::get('/api/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/api/notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/api/notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    // Profile
    // Profile
    Route::get('/profile', [ProfileController::class, 'index'])->name('profile.index');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    // Logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

Route::get('/test-pusher', function () {
    event(new \App\Events\DeviceStatusChanged(
        \App\Models\Device::first(),
        'online'
    ));
    return 'Event fired!';
});

Route::get('/debug/device-data/{sn}', function ($sn) {
    $device = \App\Models\Device::where('serial_number', $sn)->first();
    
    if (!$device) {
        return response()->json(['error' => 'Device not found']);
    }
    
    return response()->json([
        'device' => [
            'serial_number' => $device->serial_number,
            'name' => $device->name,
            'user_count' => $device->user_count,
            'fp_count' => $device->fp_count,
            'face_count' => $device->face_count,
            'last_seen' => $device->last_seen,
            'status' => $device->status,
        ],
        'recent_logs' => \App\Models\DeviceSyncLog::where('device_sn', $sn)
            ->orderByDesc('synced_at')
            ->limit(10)
            ->get(),
        'attendance_count' => \App\Models\AttendanceLog::where('device_sn', $sn)->count(),
    ]);
})->name('debug.device');
