<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\HandleInertiaRequests;
use Inertia\Inertia;
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function ($response, $exception, $request) {
            if ($request->expectsJson()) {
                return $response;
            }

            $status = $response->getStatusCode();

            if (!in_array($status, [403, 404, 419, 500, 503], true)) {
                return $response;
            }

            $messages = [
                403 => 'You do not have permission to access this resource.',
                404 => 'The requested page could not be found.',
                419 => 'Your session has expired. Please refresh and try again.',
                500 => 'An unexpected server error occurred.',
                503 => 'Service is temporarily unavailable.',
            ];

            return Inertia::render('Error', [
                'status' => $status,
                'message' => $messages[$status] ?? 'An unexpected error occurred.',
            ])->toResponse($request)->setStatusCode($status);
        });
    })->create();
