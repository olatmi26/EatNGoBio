<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ADMSController;
use App\Http\Controllers\DashboardApiController;

/*
|--------------------------------------------------------------------------
| ZKTeco ADMS Device Protocol Routes
|--------------------------------------------------------------------------
|
| These routes MUST be accessible WITHOUT CSRF verification and auth.
| The ZKTeco devices call these endpoints directly.
|
| Add these routes to web.php and exclude from CSRF in:
|   App\Http\Middleware\VerifyCsrfToken -> $except[]
|
*/

// ZKTeco ADMS Protocol Endpoints (device-facing, NO auth)
Route::withoutMiddleware(['auth', 'web'])
    ->prefix('iclock')
    ->group(function () {
        // Primary data endpoint (GET=handshake, POST=push data)
        Route::match(['GET', 'POST'], '/cdata',      [ADMSController::class, 'cdata']);

        // Command polling (device calls every ~10s)
        Route::get('/getrequest',                    [ADMSController::class, 'getRequest']);

        // Command result acknowledgement
        Route::post('/devicecmd',                    [ADMSController::class, 'deviceCmd']);

        // User/fingerprint data upload
        Route::post('/upload',                       [ADMSController::class, 'upload']);

        // Firmware data request
        Route::get('/fdata',                         [ADMSController::class, 'fdata']);
    });

/*
|--------------------------------------------------------------------------
| Dashboard API Routes
|--------------------------------------------------------------------------
|
| These are called by the React frontend. Protect with Sanctum or your
| existing auth middleware.
|
*/

Route::prefix('api/zk')
    ->middleware(['auth:sanctum'])   // or your existing auth guard
    ->group(function () {

        // Dashboard
        Route::get('/stats',              [DashboardApiController::class, 'stats']);
        Route::get('/realtime',           [DashboardApiController::class, 'realtimeFeed']);

        // Devices
        Route::get('/devices',            [DashboardApiController::class, 'devices']);
        Route::get('/devices/{sn}',       [DashboardApiController::class, 'device']);
        Route::patch('/devices/{sn}',     [DashboardApiController::class, 'updateDevice']);

        // Attendance
        Route::get('/attendance',         [DashboardApiController::class, 'attendance']);

        // Employees
        Route::get('/employees',          [DashboardApiController::class, 'employees']);

        // Device Commands
        Route::post('/commands',          [DashboardApiController::class, 'sendCommand']);
        Route::get('/commands',           [DashboardApiController::class, 'commands']);

        // Reports
        Route::get('/reports/daily',      [DashboardApiController::class, 'reportDaily']);
    });

/*
|--------------------------------------------------------------------------
| IMPORTANT: CSRF Exclusion (add to App\Http\Middleware\VerifyCsrfToken)
|--------------------------------------------------------------------------
|
| protected $except = [
|     'iclock/*',
| ];
|
*/
