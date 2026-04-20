<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\User;
use App\Models\Location;
use App\Models\AssetCategory;
use App\Models\Department;
use App\Models\Asset;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Settings/Index', [
            'settings'   => Setting::all()->keyBy('key')->map(fn($s) => $s->value),
            'users'      => User::with('roles')->orderBy('name')->get(),
            'locations'  => Location::orderBy('name')->get(['id', 'name', 'type', 'city']),
            'categories' => AssetCategory::orderBy('name')->get(),
            'departments'=> Department::orderBy('name')->pluck('name'),
            'assetCount' => Asset::count(),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        foreach ($request->settings as $key => $value) {
            Setting::where('key', $key)->update(['value' => $value]);
        }
        return back()->with('success', 'Settings saved.');
    }
}
