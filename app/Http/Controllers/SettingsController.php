<?php
namespace App\Http\Controllers;

use App\Models\Location;
use App\Models\PendingDevice;
use App\Models\Setting;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class SettingsController extends Controller
{
    public function __construct(private NotificationService $notifs)
    {}

    public function index(): Response
    {
        $settings = Setting::all()->keyBy('key')->map(fn($s) => $s->value);

        $roles = Role::withCount('users')->get()->map(fn($r) => [
            'id'          => $r->id,
            'name'        => $r->name,
            'description' => $r->description ?? '',
            'permissions' => $r->permissions->pluck('name'),
            'userCount'   => $r->users_count,
            'color'       => $this->getRoleColor($r->name),
            'isSystem'    => in_array($r->name, ['Super Admin']),
        ])->values();

        $users = User::with(['managedLocations', 'managedAreas', 'roles'])->get()->map(fn($u) => [
            'id'        => $u->id,
            'name'      => $u->name,
            'email'     => $u->email,
            'roleId'    => $u->roles->first()?->id,
            'roleName'  => $u->roles->first()?->name ?? 'No Role',
            'status'    => $u->status ?? 'active',
            'lastLogin' => $u->last_login_at?->format('Y-m-d H:i') ?? '-',
            'createdAt' => $u->created_at->format('Y-m-d'),
            'avatar'    => $u->avatar,
            'managed_locations' => $u->managedLocations->map(fn($loc) => [
                        'id' => $loc->id,
                        'name' => $loc->name,
                        'code' => $loc->code,
                    ]),
                    'managed_areas' => $u->managedAreas->map(fn($area) => [
                        'id' => $area->id,
                        'area_name' => $area->area_name,
                    ]),
        ])->values();

        $allPermissions = Permission::all()
            ->map(fn($p) => [
                'id'       => $p->id,
                'key'      => $p->name,
                'label'    => ucwords(str_replace(['.', '_'], ' ', $p->name)),
                'category' => ucfirst(explode('.', $p->name)[0] ?? 'General'),
            ])->values();

        // Get locations for device provisioning
        $locations = Location::orderBy('name')->get(['id', 'name', 'code']);

        // Get pending devices
        $pendingDevices = PendingDevice::where('status', 'pending')
            ->orderByDesc('last_heartbeat')
            ->get()
            ->map(fn($pd) => [
                'id'            => $pd->id,
                'sn'            => $pd->serial_number,
                'ip'            => $pd->ip_address,
                'model'         => $pd->model ?? 'ZKTeco',
                'firmware'      => $pd->firmware ?? '-',
                'firstSeen'     => $pd->first_seen?->format('Y-m-d H:i:s') ?? '-',
                'lastHeartbeat' => $pd->last_heartbeat?->format('Y-m-d H:i:s') ?? '-',
                'status'        => $pd->status,
                'requestCount'  => $pd->request_count ?? 0,
                'suggestedName' => $pd->suggested_name ?? $pd->serial_number,
            ])->values();
            $areas = \App\Models\Device::whereNotNull('area')
            ->distinct()
            ->pluck('area')
            ->toArray();
        return Inertia::render('Settings/Index', [
            'settings'       => $settings,
            'roles'          => $roles,
            'users'          => $users,
            'allPermissions' => $allPermissions,
            'locations'      => $locations,
            'pendingDevices' => $pendingDevices,
            'unreadCount'    => $this->notifs->unreadCount(auth()->id()),
            'areas' => $areas,
            'userAccess' => $users,
        ]);

    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'settings' => 'required|array',
        ]);

        $this->saveSettings($data['settings']);

        return back()->with('success', 'Settings saved successfully.');
    }

    private function saveSettings(array $settings, string $prefix = ''): void
    {
        foreach ($settings as $key => $value) {
            $fullKey = $prefix ? "{$prefix}.{$key}" : $key;

            if (is_array($value) && ! isset($value[0])) {
                $this->saveSettings($value, $fullKey);
                continue;
            }

            $dbKey = str_replace('.', '_', $fullKey);

            Setting::updateOrCreate(
                ['key' => $dbKey],
                [
                    'value' => is_array($value) ? json_encode($value) : (string) $value,
                    'group' => $this->guessGroup($dbKey),
                ]
            );
        }
    }

    private function getRoleColor(string $roleName): string
    {
        $colors = [
            'Super Admin' => '#7c3aed',
            'Admin'       => '#16a34a',
            'HR Manager'  => '#0891b2',
            'Manager'     => '#f59e0b',
            'User'        => '#6b7280',
        ];

        return $colors[$roleName] ?? '#16a34a';
    }

    public function storeUser(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|min:8',
            'role'     => 'required|string|exists:roles,name',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => bcrypt($data['password']),
            'status'   => 'active',
        ]);

        $user->assignRole($data['role']);

        return back()->with('success', 'User created successfully.');
    }

    public function updateUser(Request $request, int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$id}",
            'role'   => 'sometimes|string|exists:roles,name',
            'status' => 'sometimes|in:active,inactive,pending',
        ]);

        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
            unset($data['role']);
        }

        $user->update($data);

        return back()->with('success', 'User updated successfully.');
    }

    public function destroyUser(int $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }

    public function storeRole(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|unique:roles,name',
            'description' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'color'       => 'nullable|string',
        ]);

        $role = Role::create([
            'name'       => $data['name'],
            'guard_name' => 'web',
        ]);

        if (! empty($data['description'])) {
            $role->description = $data['description'];
            $role->save();
        }

        if (! empty($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return back()->with('success', 'Role created successfully.');
    }

    public function updateRole(Request $request, int $id): RedirectResponse
    {
        $role = Role::findOrFail($id);

        // Prevent modifying Super Admin role
        if ($role->name === 'Super Admin' && ! auth()->user()->hasRole('Super Admin')) {
            return back()->with('error', 'You cannot modify the Super Admin role.');
        }

        $data = $request->validate([
            'description' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'color'       => 'nullable|string',
        ]);

        if (isset($data['description'])) {
            $role->description = $data['description'];
            $role->save();
        }

        if (isset($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroyRole(int $id): RedirectResponse
    {
        $role = Role::findOrFail($id);

        // Prevent deleting system roles
        if (in_array($role->name, ['Super Admin', 'Admin'])) {
            return back()->with('error', 'System roles cannot be deleted.');
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return back()->with('error', 'Cannot delete role with assigned users.');
        }

        $role->delete();

        return back()->with('success', 'Role deleted successfully.');
    }

    private function guessGroup(string $key): string
    {
        $groups = [
            'notifications' => ['notif', 'email', 'alert', 'report'],
            'adms'          => ['adms', 'server', 'device', 'sync', 'provision'],
            'attendance'    => ['att', 'work', 'late', 'overtime', 'checkout'],
            'security'      => ['security', 'password'],
            'company'       => ['company', 'address', 'phone', 'timezone', 'language', 'currency'],
        ];

        foreach ($groups as $group => $patterns) {
            foreach ($patterns as $pattern) {
                if (str_contains($key, $pattern)) {
                    return $group;
                }
            }
        }

        return 'general';
    }
}
