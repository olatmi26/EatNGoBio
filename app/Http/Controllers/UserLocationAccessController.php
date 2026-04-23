<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\UserArea;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class UserLocationAccessController extends Controller
{
    /**
     * Update user's location and area access
     */
    public function update(Request $request, User $user)
    {
        try {
            $validated = $request->validate([
                'locations' => 'array',
                'locations.*' => 'exists:locations,id',
                'areas' => 'array',
                'areas.*' => 'string|max:255',
            ]);

            DB::beginTransaction();

            // Sync locations (using your existing pivot table 'user_locations')
            if (isset($validated['locations'])) {
                // Sync with pivot data (is_primary defaults to false)
                $locationData = [];
                foreach ($validated['locations'] as $locationId) {
                    $locationData[$locationId] = ['is_primary' => false];
                }
                $user->managedLocations()->sync($locationData);
            } else {
                $user->managedLocations()->sync([]);
            }

            // Sync areas (using your existing UserArea model)
            if (isset($validated['areas'])) {
                // Delete existing areas and create new ones
                $user->managedAreas()->delete();
                foreach ($validated['areas'] as $areaName) {
                    UserArea::create([
                        'user_id' => $user->id,
                        'area_name' => $areaName,
                    ]);
                }
            } else {
                $user->managedAreas()->delete();
            }

            DB::commit();

            Log::info('User location access updated', [
                'user_id' => $user->id,
                'locations' => $validated['locations'] ?? [],
                'areas' => $validated['areas'] ?? [],
            ]);

            // For Inertia.js response
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Location access updated successfully',
                    'user' => $user->load('managedLocations', 'managedAreas'),
                ]);
            }

            // Redirect back for traditional form submissions
            return redirect()->back()->with('success', 'Location access updated successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Failed to update location access', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update location access: ' . $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->with('error', 'Failed to update location access');
        }
    }

    /**
     * Get user's location access
     */
    public function show(User $user)
    {
        return response()->json([
            'locations' => $user->managedLocations()->get(),
            'areas' => $user->managedAreas()->pluck('area_name')->toArray(),
        ]);
    }
}