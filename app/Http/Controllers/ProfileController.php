<?php
namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile.
     */
    public function index(): Response
    {
        $user = Auth::guard('web')->user();

        // Optionally, if Employee profile is attached to User, eager load it
        // $employee = $user?->employee; // Uncomment if relationship exists

        return Inertia::render('Profile/Index', [
            'user' => $user,
            // 'employee' => $employee, // Add if you want to pass employee data
        ]);
    }
}