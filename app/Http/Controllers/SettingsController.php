<?php
namespace App\Http\Controllers;

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
    public function __construct(private NotificationService $notifs) {}

    public function index(): Response
    {
        $settings = Setting::all()->keyBy('key')->map(fn($s) => $s->value);

        $roles = Role::withCount('users')->get()->map(fn($r) => [
            'id'          => $r->id,
            'name'        => $r->name,
            'description' => $r->description ?? '',
            'permissions' => $r->permissions->pluck('name'),
            'userCount'   => $r->users_count,
            'color'       => '#7c3aed',
            'isSystem'    => in_array($r->name, ['Super Admin']),
        ]);

        $users = User::with('roles')->get()->map(fn($u) => [
            'id'        => $u->id,
            'name'      => $u->name,
            'email'     => $u->email,
            'roleId'    => $u->roles->first()?->id,
            'roleName'  => $u->roles->first()?->name ?? 'No Role',
            'status'    => $u->status ?? 'active',
            'lastLogin' => $u->updated_at?->format('Y-m-d H:i') ?? '-',
            'createdAt' => $u->created_at->format('Y-m-d'),
            'avatar'    => $u->avatar,
        ]);

        $allPermissions = Permission::all()
            ->map(fn($p) => [
                'id'       => $p->id,
                'key'      => $p->name,
                'label'    => ucwords(str_replace(['.', '_'], ' ', $p->name)),
                'category' => ucfirst(explode('.', $p->name)[0] ?? 'General'),
            ]);

        return Inertia::render('Settings/Index', [
            'settings'       => $settings,
            'roles'          => $roles,
            'users'          => $users,
            'allPermissions' => $allPermissions,
            'unreadCount'    => $this->notifs->unreadCount(auth()->id()),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate(['settings' => 'required|array']);
        foreach ($data['settings'] as $key => $value) {
            Setting::updateOrCreate(
                ['key'   => $key],
                ['value' => $value, 'group' => $this->guessGroup($key)]
            );
        }
        return back()->with('success', 'Settings saved.');
    }

    public function storeUser(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'     => 'required|string',
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
        return back()->with('success', 'User created.');
    }

    public function updateUser(Request $request, int $id): RedirectResponse
    {
        $user = User::findOrFail($id);
        $data = $request->validate([
            'name'   => 'sometimes|string',
            'email'  => "sometimes|email|unique:users,email,{$id}",
            'role'   => 'sometimes|string|exists:roles,name',
            'status' => 'sometimes|in:active,inactive',
        ]);
        if (isset($data['role'])) {
            $user->syncRoles([$data['role']]);
            unset($data['role']);
        }
        $user->update($data);
        return back()->with('success', 'User updated.');
    }

    public function destroyUser(int $id): RedirectResponse
    {
        User::findOrFail($id)->delete();
        return back()->with('success', 'User deleted.');
    }

    public function storeRole(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|unique:roles,name',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
        ]);
        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);
        if (!empty($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }
        return back()->with('success', 'Role created.');
    }

    public function updateRole(Request $request, int $id): RedirectResponse
    {
        $role = Role::findOrFail($id);
        $data = $request->validate(['permissions' => 'nullable|array']);
        $role->syncPermissions($data['permissions'] ?? []);
        return back()->with('success', 'Role updated.');
    }

    private function guessGroup(string $key): string
    {
        if (str_contains($key, 'notif') || str_contains($key, 'email')) return 'notifications';
        if (str_contains($key, 'adms') || str_contains($key, 'server')) return 'adms';
        if (str_contains($key, 'attendance') || str_contains($key, 'late')) return 'attendance';
        if (str_contains($key, 'security') || str_contains($key, 'password')) return 'security';
        return 'company';
    }
}
