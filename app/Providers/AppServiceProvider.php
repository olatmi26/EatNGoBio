<?php

namespace App\Providers;

use App\Models\Employee;
use App\Observers\EmployeeObserver;
use App\Services\DeviceCommandService;
use App\Services\DeviceOperationService;
use App\Services\EmployeeSyncService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {      
        $this->app->singleton(DeviceOperationService::class);
        $this->app->singleton(DeviceCommandService::class);
        $this->app->singleton(EmployeeSyncService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Employee::observe(EmployeeObserver::class);
    }
}
