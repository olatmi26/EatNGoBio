<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyCsrfToken
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'iclock/*',
        'iclock/cdata',
        'iclock/getrequest',
        'iclock/devicecmd',
        'iclock/upload',
        'iclock/fdata',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip CSRF check for excluded paths or read-only methods
        if ($this->inExceptArray($request) || $this->isReadOnly($request)) {
            return $next($request);
        }

        // Verify CSRF token for all other requests
        $this->validateCsrfToken($request);

        return $next($request);
    }

    /**
     * Determine if the request URI is in the except array.
     */
    protected function inExceptArray(Request $request): bool
    {
        foreach ($this->except as $except) {
            if ($request->is($except) || $request->is("*/{$except}")) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if the request is read-only (GET, HEAD, OPTIONS).
     */
    protected function isReadOnly(Request $request): bool
    {
        return in_array($request->method(), ['GET', 'HEAD', 'OPTIONS']);
    }

    /**
     * Validate the CSRF token.
     *
     * @throws \Illuminate\Session\TokenMismatchException
     */
    protected function validateCsrfToken(Request $request): void
    {
        $sessionToken = $request->session()->token();
        $requestToken = $request->input('_token') ?? $request->header('X-CSRF-TOKEN');

        if (!$sessionToken || !$requestToken || !hash_equals($sessionToken, $requestToken)) {
            throw new \Illuminate\Session\TokenMismatchException('CSRF token mismatch.');
        }
    }
}