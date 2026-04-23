<?php

use App\Http\Controllers\ADMSController;
use App\Http\Controllers\AnalyticsController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeviceController;
use App\Http\Controllers\EmployeeCompensationController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\LiveMonitorController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PayrollSettingsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SalaryStructureController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\UserLocationAccessController;
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

Route::get('/storage/avatars/{filename}', [App\Http\Controllers\AvatarController::class, 'show'])
    ->name('avatar.show')
    ->where('filename', '.*');

// ─── Guest Routes ─────────────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
});

// ─── Authenticated Routes ─────────────────────────────────────────────────────
Route::middleware(['auth'])->group(function () {
    // Dashboard
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');
    // Devices acrosss all locations
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
    Route::post('/devices/{id}/sync-time', [DeviceController::class, 'syncTime'])->name('devices.sync-time');
    Route::post('/devices/{id}/sync-users', [DeviceController::class, 'syncAllUsers'])->name('devices.sync-users');
    Route::get('/devices/{id}/pending-commands', [DeviceController::class, 'pendingCommands'])->name('devices.pending-commands');
    Route::get('/devices/{id}/command-history', [DeviceController::class, 'commandHistory'])->name('devices.command-history');
    Route::post('/devices/{id}/retry-failed', [DeviceController::class, 'retryFailed'])->name('devices.retry-failed');

    // Employees
    Route::get('/employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::post('/employees', [EmployeeController::class, 'store'])->name('employees.store');
    Route::get('/employees/{id}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::put('/employees/{id}', [EmployeeController::class, 'update'])->name('employees.update');
    Route::delete('/employees/{id}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
    Route::post('/employees/{id}/transfer', [EmployeeController::class, 'transfer'])->name('employees.transfer');
    Route::post('/employees/{id}/status', [EmployeeController::class, 'updateStatus'])->name('employees.status');
    Route::post('/employees/{id}/sync', [EmployeeController::class, 'syncToDevices'])->name('employees.sync');
    Route::get('/employees/{id}/sync-status', [EmployeeController::class, 'syncStatus'])->name('employees.sync-status');
    Route::post('/employees/bulk-sync', [EmployeeController::class, 'bulkSync'])->name('employees.bulk-sync');

    // Attendance
    Route::get('/attendance', [AttendanceController::class, 'index'])->name('attendance.index');

    // Location access routes
    Route::get('/employees/{id}/accessible-devices', [EmployeeController::class, 'accessibleDevices'])->name('employees.devices');
    Route::get('/employees/{id}/allowed-areas', [EmployeeController::class, 'allowedAreas'])->name('employees.areas');
    Route::post('/employees/{id}/assign-area', [EmployeeController::class, 'assignToArea'])->name('employees.assign-area');
    Route::post('/employees/{id}/remove-area', [EmployeeController::class, 'removeFromArea'])->name('employees.remove-area');
    Route::post('/employees/bulk-assign-area', [EmployeeController::class, 'bulkAssignToArea'])->name('employees.bulk-assign-area');
    Route::post('/validate-punch', [EmployeeController::class, 'validatePunch'])->name('validate.punch');
    Route::post('/users/{user}/location-access', [UserLocationAccessController::class, 'update'])
        ->name('users.location-access.update');
    Route::get('/users/{user}/location-access', [UserLocationAccessController::class, 'show'])
        ->name('users.location-access.show');

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

    // Report exports
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('index');

        // Excel exports
        Route::get('/export/attendance', [ReportController::class, 'exportAttendance'])->name('attendance');
        /*  Route::get('/export/devices', [ReportController::class, 'exportDevices'])->name('devices'); */
        Route::get('/export/payroll', [ReportController::class, 'exportPayroll'])->name('payroll');

        // PDF exports
        //Route::get('/export/attendance-pdf', [ReportController::class, 'exportAttendancePdf'])->name('attendance.pdf');
        // Route::get('/export/devices-pdf', [ReportController::class, 'exportDevicesPdf'])->name('devices.pdf');
        //Route::get('/export/payroll-pdf', [ReportController::class, 'exportPayrollPdf'])->name('payroll.pdf');

        // Attendance exports
        Route::get('/export/attendance', [ReportController::class, 'exportAttendance'])
            ->name('reports.export.attendance');
        Route::get('/export/attendance-pdf', [ReportController::class, 'exportAttendancePdf'])->name('export.attendance-pdf');

        // Device exports
        Route::get('/export/devices', [ReportController::class, 'exportDevices'])->name('export.devices');
        Route::get('/export/devices-pdf', [ReportController::class, 'exportDevicesPdf'])->name('export.devices-pdf');

        // Payroll exports
        Route::get('/export/payroll', [ReportController::class, 'exportPayroll'])
            ->name('export.payroll');
        Route::get('/export/payroll-pdf', [ReportController::class, 'exportPayrollPdf'])->name('export.payroll-pdf');

        // Late arrivals export
        Route::get('/export/late-arrivals', [ReportController::class, 'exportLateArrivals'])
            ->name('export.late-arrivals');

        // Absenteeism export
        Route::get('/export/absenteeism', [ReportController::class, 'exportAbsenteeism'])
            ->name('export.absenteeism');

    });
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Analytics
    Route::get('/analytics', [AnalyticsController::class, 'index'])->name('analytics.index');

    // Live Monitor
    Route::get('/live-monitor', [LiveMonitorController::class, 'index'])->name('live-monitor.index');
    Route::get('/api/live-monitor/feed', [LiveMonitorController::class, 'feed'])->name('live-monitor.feed');

    // Payroll Management
    Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll.index');
    Route::post('/payroll/generate', [PayrollController::class, 'generate'])->name('payroll.generate');
    Route::get('/payroll/{period}', [PayrollController::class, 'show'])->name('payroll.show');

    // Approval Workflow
    Route::post('/payroll/{period}/submit', [PayrollController::class, 'submitForApproval'])->name('payroll.submit');
    Route::post('/payroll/{period}/approve', [PayrollController::class, 'approve'])->name('payroll.approve');
    Route::post('/payroll/{period}/reject', [PayrollController::class, 'reject'])->name('payroll.reject');
    Route::post('/payroll/{period}/mark-paid', [PayrollController::class, 'markAsPaid'])->name('payroll.mark-paid');

    // Exports
    Route::get('/payroll/{period}/export', [PayrollController::class, 'export'])->name('payroll.export');
    Route::get('/payroll/{payroll}/payslip', [PayrollController::class, 'payslip'])->name('payroll.payslip');
    Route::delete('/payroll/{period}', [PayrollController::class, 'destroy'])->name('payroll.destroy');

    // Payroll Settings
    Route::get('/settings/payroll', [PayrollSettingsController::class, 'index'])->name('settings.payroll.index');
    Route::post('/settings/payroll', [PayrollSettingsController::class, 'update'])->name('settings.payroll.update');
    Route::post('/settings/payroll/tax-brackets', [PayrollSettingsController::class, 'updateTaxBrackets'])->name('settings.payroll.tax-brackets.update');
    Route::get('/settings/payroll/preview', [PayrollSettingsController::class, 'preview'])->name('settings.payroll.preview');

    // Approval Workflow Configuration
    Route::get('/settings/payroll/workflows', [PayrollSettingsController::class, 'workflows'])->name('settings.payroll.workflows');
    Route::post('/settings/payroll/workflows', [PayrollSettingsController::class, 'storeWorkflow'])->name('settings.payroll.workflows.store');
    Route::put('/settings/payroll/workflows/{workflow}', [PayrollSettingsController::class, 'updateWorkflow'])->name('settings.payroll.workflows.update');
    Route::post('/settings/payroll/approval-routes', [PayrollSettingsController::class, 'updateApprovalRoutes'])->name('settings.payroll.approval-routes.update');

    // Employee Compensation Management & Salary Structures (Grouped)
    Route::prefix('/settings/payroll')->name('settings.payroll.')->group(function () {
        // Employee Compensation Management
        Route::get('employees/template', [EmployeeCompensationController::class, 'downloadTemplate'])
            ->name('employees.template');
        Route::post('employees/import', [EmployeeCompensationController::class, 'import'])
            ->name('employees.import');
        Route::get('employees/export', [EmployeeCompensationController::class, 'export'])
            ->name('employees.export');
        Route::post('employees/bulk-update', [EmployeeCompensationController::class, 'bulkUpdate'])
            ->name('employees.bulk-update');
        Route::put('employees/{compensation}', [EmployeeCompensationController::class, 'update'])
            ->name('employees.update');
        Route::delete('employees/{compensation}', [EmployeeCompensationController::class, 'destroy'])
            ->name('employees.destroy');
        Route::get('employees/history', [EmployeeCompensationController::class, 'history'])
            ->name('employees.history');

        // Salary Structures
        Route::post('structures', [SalaryStructureController::class, 'store'])
            ->name('structures.store');
        Route::put('structures/{structure}', [SalaryStructureController::class, 'update'])
            ->name('structures.update');
        Route::put('/structures/{structure}/toggle', [SalaryStructureController::class, 'toggle'])
            ->name('structures.toggle');
        Route::delete('structures/{structure}', [SalaryStructureController::class, 'destroy'])
            ->name('structures.destroy');

        Route::get('structures/{structure}', [SalaryStructureController::class, 'show'])
            ->name('structures.show');

        Route::put('structures/{structure}', [SalaryStructureController::class, 'update'])
            ->name('structures.update');
    });

    // Settings & User Management
    Route::prefix('settings')->name('settings.')->group(function () {
        Route::get('/', [SettingsController::class, 'index'])->name('index');
        Route::post('/', [SettingsController::class, 'update'])->name('update');

        // Users Management
        Route::post('/users', [SettingsController::class, 'storeUser'])->name('users.store');
        Route::put('/users/{id}', [SettingsController::class, 'updateUser'])->name('users.update');
        Route::delete('/users/{id}', [SettingsController::class, 'destroyUser'])->name('users.destroy');

        // Roles Management
        Route::post('/roles', [SettingsController::class, 'storeRole'])->name('roles.store');
        Route::put('/roles/{id}', [SettingsController::class, 'updateRole'])->name('roles.update');
        Route::delete('/roles/{id}', [SettingsController::class, 'destroyRole'])->name('roles.destroy');

        // Device Provisioning
        Route::get('/pending-devices', [SettingsController::class, 'pendingDevices'])->name('pending-devices');
        Route::post('/provision-device', [SettingsController::class, 'provisionDevice'])->name('provision-device');
        Route::post('/reject-device', [SettingsController::class, 'rejectDevice'])->name('reject-device');
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

    if (! $device) {
        return response()->json(['error' => 'Device not found']);
    }

    return response()->json([
        'device'           => [
            'serial_number' => $device->serial_number,
            'name'          => $device->name,
            'user_count'    => $device->user_count,
            'fp_count'      => $device->fp_count,
            'face_count'    => $device->face_count,
            'last_seen'     => $device->last_seen,
            'status'        => $device->status,
        ],
        'recent_logs'      => \App\Models\DeviceSyncLog::where('device_sn', $sn)
            ->orderByDesc('synced_at')
            ->limit(10)
            ->get(),
        'attendance_count' => \App\Models\AttendanceLog::where('device_sn', $sn)->count(),
    ]);
})->name('debug.device');
