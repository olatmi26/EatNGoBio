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
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ShiftController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ProfileController;


// ─── ZKTeco ADMS Device Protocol (NO auth, NO CSRF) ──────────────────────────
// Also add these paths to App\Http\Middleware\VerifyCsrfToken::$except:
//   'iclock/*'
Route::withoutMiddleware(['auth', 'web'])
    ->prefix('iclock')
    ->group(function () {
        Route::match(['GET', 'POST'], '/cdata',   [ADMSController::class, 'cdata']);
        Route::get('/getrequest',                 [ADMSController::class, 'getRequest']);
        Route::post('/devicecmd',                 [ADMSController::class, 'deviceCmd']);
        Route::post('/upload',                    [ADMSController::class, 'upload']);
        Route::get('/fdata',                      [ADMSController::class, 'fdata']);
    });

// ─── Guest Routes ─────────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login',  [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});



// ─── Authenticated Routes ─────────────────────────────────────────────────────
Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Devices
    Route::get('/devices',                        [DeviceController::class, 'index'])->name('devices.index');
    Route::get('/devices/{id}',                   [DeviceController::class, 'show'])->name('devices.show');
    Route::put('/devices/{id}',                   [DeviceController::class, 'update'])->name('devices.update');
    Route::delete('/devices/{id}',                [DeviceController::class, 'destroy'])->name('devices.destroy');
    Route::post('/devices/{id}/command',          [DeviceController::class, 'sendCommand'])->name('devices.command');
    Route::post('/devices/pending/{id}/approve',  [DeviceController::class, 'approve'])->name('devices.approve');
    Route::post('/devices/pending/{id}/reject',   [DeviceController::class, 'reject'])->name('devices.reject');
    Route::get('/api/devices/live-stats',         [DeviceController::class, 'liveStats'])->name('devices.live-stats');

    // Employees
    Route::get('/employees',                      [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('/employees',                     [EmployeeController::class, 'store'])->name('employees.store');
    Route::get('/employees/{id}',                 [EmployeeController::class, 'show'])->name('employees.show');
    Route::put('/employees/{id}',                 [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('/employees/{id}',              [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::post('/employees/{id}/transfer',       [EmployeeController::class, 'transfer'])->name('employees.transfer');
    Route::post('/employees/{id}/status',         [EmployeeController::class, 'updateStatus'])->name('employees.status');

    // Attendance
    Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');

    // Shifts
    Route::prefix('shifts')->name('shifts.')->group(function () {

        Route::get('/',               [ShiftController::class, 'index'])->name('index');
        Route::post('/',              [ShiftController::class, 'store'])->name('store');
        Route::put('/{id}',           [ShiftController::class, 'update'])->name('update');
        Route::delete('/{id}',        [ShiftController::class, 'destroy'])->name('destroy');
        Route::post('/assign',        [ShiftController::class, 'assign'])->name('assign');
        Route::post('/auto-assign',   [ShiftController::class, 'autoAssign'])->name('autoAssign'); 

    });


   

    // Organization
    Route::get('/organization/departments',         [OrganizationController::class, 'departments'])->name('org.departments');
    Route::post('/organization/departments',        [OrganizationController::class, 'storeDepartment'])->name('org.departments.store');
    Route::put('/organization/departments/{id}',    [OrganizationController::class, 'updateDepartment'])->name('org.departments.update');
    Route::delete('/organization/departments/{id}', [OrganizationController::class, 'destroyDepartment'])->name('org.departments.destroy');
    Route::get('/organization/positions',           [OrganizationController::class, 'positions'])->name('org.positions');
    Route::post('/organization/positions',          [OrganizationController::class, 'storePosition'])->name('org.positions.store');
    Route::put('/organization/positions/{id}',      [OrganizationController::class, 'updatePosition'])->name('org.positions.update');
    Route::delete('/organization/positions/{id}',   [OrganizationController::class, 'destroyPosition'])->name('org.positions.destroy');
    Route::get('/organization/areas',               [OrganizationController::class, 'areas'])->name('org.areas');
    Route::post('/organization/areas',              [OrganizationController::class, 'storeArea'])->name('org.areas.store');
    Route::put('/organization/areas/{id}',          [OrganizationController::class, 'updateArea'])->name('org.areas.update');
    Route::delete('/organization/areas/{id}',       [OrganizationController::class, 'destroyArea'])->name('org.areas.destroy');
    Route::get('/organization/chart',               [OrganizationController::class, 'chart'])->name('org.chart');

    // Reports
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Live Monitor
    Route::get('/live-monitor',            [LiveMonitorController::class, 'index'])->name('live-monitor.index');
    Route::get('/api/live-monitor/feed',   [LiveMonitorController::class, 'feed'])->name('live-monitor.feed');

    // Settings & User Management
    Route::get('/settings',                [SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings',               [SettingsController::class, 'update'])->name('settings.update');
    Route::post('/settings/users',         [SettingsController::class, 'storeUser'])->name('settings.users.store');
    Route::put('/settings/users/{id}',     [SettingsController::class, 'updateUser'])->name('settings.users.update');
    Route::delete('/settings/users/{id}',  [SettingsController::class, 'destroyUser'])->name('settings.users.destroy');
    Route::post('/settings/roles',         [SettingsController::class, 'storeRole'])->name('settings.roles.store');
    Route::put('/settings/roles/{id}',     [SettingsController::class, 'updateRole'])->name('settings.roles.update');

    // Notifications (JSON API — used by TopBar)
    Route::get('/api/notifications',               [NotificationController::class, 'index'])->name('notifications.index');
    Route::post('/api/notifications/{id}/read',    [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('/api/notifications/read-all',     [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    // Profile
    Route::get('/profile',                     [ProfileController::class, 'index'])->name('profile.index');
    Route::put('/profile',                     [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password',            [ProfileController::class, 'updatePassword'])->name('profile.password');

    // Logout
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});
