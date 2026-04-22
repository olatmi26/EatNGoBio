<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(private NotificationService $notifs) {}

    public function index(Request $request ): Response
    {
        $user = $request->user()->load('roles');
        
        return Inertia::render('Profile/Index', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'initials' => $user->avatar_initials ?? substr($user->name, 0, 2)->toUpperCase(),
                'status' => $user->status ?? 'active',
                'roles' => $user->roles->pluck('name'),
                'created_at' => $user->created_at->format('M d, Y'),
            ],
            'unreadCount' => $this->notifs->unreadCount(auth()->id()),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $user =  $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
        ]);

        $user->update($validated);

        return back()->with('success', 'Profile updated successfully.');
    }

    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate([
            'avatar' => 'required|image|max:2048',
        ]);

        $user =  $request->user();
        
        if ($request->hasFile('avatar')) {
            $path = $request->file('avatar')->store('avatars', 'public');
            $user->update(['avatar' => '/storage/' . $path]);
        }

        return back()->with('success', 'Profile picture updated.');
    }

    public function updatePassword(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'new_password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['new_password']),
        ]);

        return back()->with('success', 'Password changed successfully.');
    }
}