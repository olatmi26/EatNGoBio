<?php

namespace App\Http\Middleware;

use App\Services\NotificationService;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $notifs = $request->user() ? app(NotificationService::class) : null;
        $user = $request->user();
        return [
            
            
            

            ...parent::share($request),

            'auth' => [
                'user' => $request->user() ? [
                    'id'               => $request->user()->id,
                    'name'             => $request->user()->name,
                    'email'            => $request->user()->email,
                    'department'       => $request->user()->department ?? null,
                    'avatar_initials'  => $request->user()->avatar_initials ?? null,
                    'status'           => $request->user()->status ?? 'Active',
                    'roles'            => $request->user()->getRoleNames() ?? [],
                    'permissions'      => $request->user()->getAllPermissions()->pluck('name') ?? [],
                    'initials'    => $user->avatar_initials ?? strtoupper(
                        substr($user->name, 0, 1) .
                        (str_contains($user->name, ' ')
                            ? substr(strrchr($user->name, ' '), 1, 1)
                            : '')
                    ),
                    
                ] : null,
            ],

            'flash' => [
                'success' => session('success'),
                'error'   => session('error'),
                'warning' => session('warning'),
            ],
            'unreadCount' => fn() => $notifs && $user
            ? $notifs->unreadCount($user->id)
            : 0,

            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
        ];
    }
}






