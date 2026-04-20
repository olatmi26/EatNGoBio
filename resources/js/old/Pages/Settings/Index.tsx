import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { useState } from "react";

const roleColors: Record<string, string> = {
  "Super Admin": "bg-red-100 text-red-700",
  "IT Admin": "bg-violet-100 text-violet-700",
  "IT Officer": "bg-emerald-100 text-emerald-700",
  "Location Manager": "bg-amber-100 text-amber-700",
  "User": "bg-slate-100 text-slate-600",
};

const ALL_PERMISSIONS = [
  { group: "Assets", items: ["View All Assets", "Create Assets", "Edit Assets", "Delete Assets", "Allocate Assets", "Retire Assets", "Import Assets", "Export Assets"] },
  { group: "Reports", items: ["View All Reports", "Export Reports", "View Financial Reports"] },
  { group: "Users", items: ["Manage Users", "Manage Roles", "View User Activity"] },
  { group: "Infrastructure", items: ["Manage Locations", "Manage Categories", "View Infrastructure Checks", "Submit Infrastructure Checks", "Schedule Maintenance"] },
  { group: "Tickets", items: ["View All Tickets", "Assign Tickets", "Resolve Tickets", "Create Tickets"] },
  { group: "System", items: ["System Settings", "Audit Log", "Integrations", "Manage Alerts"] },
];

const ROLES_PERMISSIONS = [
  {
    role: "Super Admin",
    color: "bg-red-100 text-red-700 border-red-200",
    description: "Full system access — all modules, all locations, all data",
    permissions: ["View All Assets", "Create Assets", "Edit Assets", "Delete Assets", "Allocate Assets", "Retire Assets", "Import Assets", "Export Assets", "View All Reports", "Export Reports", "View Financial Reports", "Manage Users", "Manage Roles", "View User Activity", "Manage Locations", "Manage Categories", "View Infrastructure Checks", "Submit Infrastructure Checks", "Schedule Maintenance", "View All Tickets", "Assign Tickets", "Resolve Tickets", "Create Tickets", "System Settings", "Audit Log", "Integrations", "Manage Alerts"],
  },
  {
    role: "IT Admin",
    color: "bg-violet-100 text-violet-700 border-violet-200",
    description: "Manage assets, users, and operations across all locations",
    permissions: ["View All Assets", "Create Assets", "Edit Assets", "Allocate Assets", "Retire Assets", "Export Assets", "View All Reports", "Export Reports", "Manage Users", "View User Activity", "Manage Locations", "View Infrastructure Checks", "Schedule Maintenance", "View All Tickets", "Assign Tickets", "Resolve Tickets", "Manage Alerts"],
  },
  {
    role: "IT Officer",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    description: "Manage assigned assets, submit checks, handle tickets",
    permissions: ["View All Assets", "Edit Assets", "Submit Infrastructure Checks", "Schedule Maintenance", "View All Tickets", "Resolve Tickets", "Create Tickets"],
  },
  {
    role: "Location Manager",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    description: "View assets and checks for their assigned location",
    permissions: ["View All Assets", "View Infrastructure Checks", "View All Tickets", "Create Tickets"],
  },
  {
    role: "User",
    color: "bg-slate-100 text-slate-600 border-slate-200",
    description: "Standard employee — view own allocated assets and raise tickets",
    permissions: ["View All Assets", "Create Tickets"],
  },
];

const AUDIT_LOGS = [
  { time: "2026-04-13 09:14:22", user: "Emeka Okafor", role: "IT Officer", action: "Asset Allocated", resource: "ITFRA-002", details: "Allocated to Adaeze Nwosu", ip: "192.168.1.5", location: "ADMIRALTY", browser: "Chrome 124", device: "Windows 11 · Dell Latitude", status: "success" },
  { time: "2026-04-13 08:52:10", user: "Ngozi Adeyemi", role: "IT Admin", action: "User Created", resource: "USR-011", details: "New user: Seun Afolabi (IT Officer)", ip: "192.168.1.10", location: "Head Office", browser: "Firefox 125", device: "macOS 14 · MacBook Pro", status: "success" },
  { time: "2026-04-13 08:30:05", user: "John Smith", role: "Super Admin", action: "Settings Updated", resource: "System", details: "Alert threshold changed to 30 days", ip: "10.0.0.5", location: "Head Office", browser: "Chrome 124", device: "Windows 11 · HP EliteBook", status: "success" },
  { time: "2026-04-12 17:45:33", user: "Chidi Eze", role: "IT Officer", action: "Asset Created", resource: "ITFRA-021", details: "New asset: Zebra ZD421 Label Printer", ip: "192.168.1.8", location: "APAPA", browser: "Edge 124", device: "Windows 10 · Lenovo ThinkPad", status: "success" },
  { time: "2026-04-12 16:20:18", user: "Emeka Okafor", role: "IT Officer", action: "Ticket Resolved", resource: "TKT-0012", details: "Network issue resolved at FESTAC", ip: "192.168.1.5", location: "FESTAC", browser: "Chrome 124", device: "Windows 11 · Dell Latitude", status: "success" },
  { time: "2026-04-12 14:10:44", user: "Ngozi Adeyemi", role: "IT Admin", action: "Asset Retired", resource: "ITFRA-011", details: "Lenovo ThinkPad X1 Carbon retired (EOL)", ip: "192.168.1.10", location: "Head Office", browser: "Firefox 125", device: "macOS 14 · MacBook Pro", status: "success" },
  { time: "2026-04-12 11:05:02", user: "Unknown", role: "—", action: "Login Failed", resource: "Auth", details: "3 failed login attempts for admin@company.com", ip: "41.58.120.44", location: "External", browser: "Chrome 123", device: "Unknown Device", status: "warning" },
  { time: "2026-04-11 15:30:11", user: "John Smith", role: "Super Admin", action: "Role Updated", resource: "IT Officer", details: "Added permission: Export Assets", ip: "10.0.0.5", location: "Head Office", browser: "Chrome 124", device: "Windows 11 · HP EliteBook", status: "success" },
  { time: "2026-04-11 10:22:55", user: "Chidi Eze", role: "IT Officer", action: "Infrastructure Check", resource: "CHK-0045", details: "Daily check submitted for BODIJA", ip: "192.168.1.8", location: "BODIJA", browser: "Safari 17", device: "iOS 17 · iPhone 15", status: "success" },
  { time: "2026-04-10 09:15:30", user: "Ngozi Adeyemi", role: "IT Admin", action: "Bulk Export", resource: "Assets", details: "Exported 45 assets to CSV", ip: "192.168.1.10", location: "Head Office", browser: "Firefox 125", device: "macOS 14 · MacBook Pro", status: "success" },
];

type SettingsSection =
  | "user-management" | "roles" | "locations" | "categories"
  | "org" | "alerts" | "integrations" | "email" | "security" | "audit";

const sidebarMenu: { group: string; items: { key: SettingsSection; label: string; icon: string }[] }[] = [
  {
    group: "Access & Users",
    items: [
      { key: "user-management", label: "User Management", icon: "ri-team-fill" },
      { key: "roles", label: "Roles & Permissions", icon: "ri-shield-user-fill" },
    ],
  },
  {
    group: "Infrastructure",
    items: [
      { key: "locations", label: "Locations", icon: "ri-map-pin-fill" },
      { key: "categories", label: "Asset Categories", icon: "ri-price-tag-3-fill" },
    ],
  },
  {
    group: "Configuration",
    items: [
      { key: "org", label: "Organization", icon: "ri-building-fill" },
      { key: "alerts", label: "Alerts & Notifications", icon: "ri-notification-3-fill" },
      { key: "email", label: "Email Settings", icon: "ri-mail-fill" },
    ],
  },
  {
    group: "Security & Compliance",
    items: [
      { key: "security", label: "Security", icon: "ri-shield-keyhole-fill" },
      { key: "audit", label: "Audit Log", icon: "ri-file-list-3-fill" },
    ],
  },
  {
    group: "Integrations",
    items: [
      { key: "integrations", label: "Integrations", icon: "ri-plug-fill" },
    ],
  },
];

interface UserFormData {
  name: string; email: string; role: string; department: string; location: string; phone: string; status: string;
}

interface LocationFormData {
  name: string; type: string; city: string; state: string; manager: string; address: string; phone: string;
}

export default function Settings() {
  const [section, setSection] = useState<SettingsSection>("user-management");
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUser, setEditUser] = useState<typeof mockUsers[0] | null>(null);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editLocationId, setEditLocationId] = useState<string | null>(null);
  const [editCategoryCode, setEditCategoryCode] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<typeof ROLES_PERMISSIONS[0] | null>(null);
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
  const [viewUserAssets, setViewUserAssets] = useState<typeof mockUsers[0] | null>(null);
  const [userForm, setUserForm] = useState<UserFormData>({ name: "", email: "", role: "User", department: "", location: "", phone: "", status: "Active" });
  const [editUserForm, setEditUserForm] = useState<UserFormData>({ name: "", email: "", role: "User", department: "", location: "", phone: "", status: "Active" });
  const [locationForm, setLocationForm] = useState<LocationFormData>({ name: "", type: "Store", city: "", state: "", manager: "", address: "", phone: "" });
  const [newCatName, setNewCatName] = useState("");
  const [newCatDesc, setNewCatDesc] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  const [locationSearch, setLocationSearch] = useState("");
  const [auditSearch, setAuditSearch] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("All");
  const [editRolePermissions, setEditRolePermissions] = useState<string[]>([]);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const filteredCategories = ASSET_CATEGORIES.filter(c =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase()) || c.code.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredUsers = mockUsers.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = userRoleFilter === "All" || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  const filteredLocations = mockLocations.filter(l =>
    l.name.toLowerCase().includes(locationSearch.toLowerCase()) || l.city.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const filteredAudit = AUDIT_LOGS.filter(l => {
    const matchSearch = l.user.toLowerCase().includes(auditSearch.toLowerCase()) || l.action.toLowerCase().includes(auditSearch.toLowerCase()) || l.resource.toLowerCase().includes(auditSearch.toLowerCase()) || l.ip.includes(auditSearch);
    const matchAction = auditActionFilter === "All" || l.action === auditActionFilter;
    return matchSearch && matchAction;
  });

  const getUserAssets = (userName: string) => mockAssets.filter(a => a.assignedTo === userName || a.officer === userName);

  const roleStats = ROLES_PERMISSIONS.map(r => ({
    ...r,
    count: mockUsers.filter(u => u.role === r.role).length,
  }));

  const openEditUser = (u: typeof mockUsers[0]) => {
    setEditUser(u);
    setEditUserForm({ name: u.name, email: u.email, role: u.role, department: u.department, location: "", phone: "", status: u.status });
  };

  const openEditRole = (r: typeof ROLES_PERMISSIONS[0]) => {
    setEditRole(r);
    setEditRolePermissions([...r.permissions]);
  };

  const togglePermission = (perm: string) => {
    setEditRolePermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSaveRole = () => {
    setSaveSuccess(`Role "${editRole?.role}" updated successfully`);
    setEditRole(null);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleSaveUser = () => {
    setSaveSuccess(`User "${editUserForm.name}" updated successfully`);
    setEditUser(null);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  const handleExportAudit = () => {
    const headers = ["Timestamp", "User", "Role", "Action", "Resource", "Details", "IP Address", "Location", "Browser", "Device", "Status"];
    const rows = filteredAudit.map(l => [
      l.time, `"${l.user}"`, l.role, `"${l.action}"`, l.resource, `"${l.details}"`, l.ip, `"${l.location}"`, `"${l.browser}"`, `"${l.device}"`, l.status
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const el = document.createElement("a");
    el.href = url;
    el.download = `AuditLog_${new Date().toISOString().split("T")[0]}.csv`;
    el.click();
    URL.revokeObjectURL(url);
  };

  const uniqueActions = Array.from(new Set(AUDIT_LOGS.map(l => l.action)));

  return (
    <AppLayout>
      <Head title="Settings" />
    <div className="flex gap-0 bg-white rounded-2xl border border-slate-100 overflow-hidden min-h-[calc(100vh-140px)]">
      {/* Sub Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-slate-100 py-4" style={{ background: "#f8fafc" }}>
        <div className="px-4 mb-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Settings</p>
        </div>
        {sidebarMenu.map(group => (
          <div key={group.group} className="mb-2">
            <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.group}</p>
            {group.items.map(item => (
              <button key={item.key} onClick={() => setSection(item.key)}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-all cursor-pointer text-left ${section === item.key ? "bg-emerald-50 text-emerald-700 border-r-2 border-emerald-500" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}>
                <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                  <i className={`${item.icon} text-sm`}></i>
                </div>
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">

        {/* Success toast */}
        {saveSuccess && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium mb-4">
            <i className="ri-checkbox-circle-fill text-emerald-500"></i>{saveSuccess}
          </div>
        )}

        {/* ── USER MANAGEMENT ── */}
        {section === "user-management" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">User Management</h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage system users, departments, and asset allocations</p>
              </div>
              <button onClick={() => setShowAddUser(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">
                <i className="ri-user-add-line"></i>Add User
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {["Super Admin", "IT Admin", "IT Officer", "Location Manager", "User"].map(role => (
                <div key={role} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <p className="text-xl font-bold text-slate-800">{mockUsers.filter(u => u.role === role).length}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{role}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                <div className="w-4 h-4 flex items-center justify-center absolute left-3 text-slate-400"><i className="ri-search-line text-xs"></i></div>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search users..." className="pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none cursor-pointer">
                <option value="All">All Roles</option>
                <option>Super Admin</option><option>IT Admin</option><option>IT Officer</option><option>Location Manager</option><option>User</option>
              </select>
              <span className="text-xs text-slate-400 ml-auto">{filteredUsers.length} users</span>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {["User", "Email", "Role", "Department", "Assets", "Status", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => {
                    const userAssets = getUserAssets(u.name);
                    return (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{u.avatar}</div>
                            <div>
                              <p className="font-semibold text-slate-800 text-sm">{u.name}</p>
                              <p className="text-xs text-slate-400">{u.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                        <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleColors[u.role]}`}>{u.role}</span></td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{u.department}</td>
                        <td className="px-4 py-3">
                          {userAssets.length > 0 ? (
                            <button onClick={() => setViewUserAssets(u)}
                              className="flex items-center gap-1 text-xs text-emerald-600 hover:underline cursor-pointer font-medium">
                              <i className="ri-computer-line text-xs"></i>{userAssets.length} asset{userAssets.length > 1 ? "s" : ""}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === "Active" ? "bg-emerald-500" : "bg-slate-300"}`}></span>
                            <span className={`text-xs font-medium ${u.status === "Active" ? "text-emerald-600" : "text-slate-400"}`}>{u.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={() => openEditUser(u)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 cursor-pointer" title="Edit user"><i className="ri-edit-line text-sm"></i></button>
                            <button onClick={() => setViewUserAssets(u)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 cursor-pointer" title="View assets"><i className="ri-computer-line text-sm"></i></button>
                            <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer" title="Delete user"><i className="ri-delete-bin-line text-sm"></i></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ROLES & PERMISSIONS ── */}
        {section === "roles" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Roles &amp; Permissions</h2>
                <p className="text-xs text-slate-400 mt-0.5">Define access levels and capabilities for each role</p>
              </div>
              <button onClick={() => { setShowAddRole(true); setNewRoleName(""); setNewRoleDesc(""); setNewRolePermissions([]); }}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">
                <i className="ri-add-line"></i>Add Role
              </button>
            </div>

            <div className="space-y-4">
              {roleStats.map(r => (
                <div key={r.role} className="border border-slate-100 rounded-xl overflow-hidden hover:border-slate-200 transition-all">
                  <div className="px-5 py-4 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${r.color}`}>{r.role}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{r.description}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{r.count} user{r.count !== 1 ? "s" : ""} assigned · {r.permissions.length} permissions</p>
                      </div>
                    </div>
                    <button onClick={() => openEditRole(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer font-medium text-slate-600 whitespace-nowrap">
                      <i className="ri-edit-line text-xs"></i>Edit Role
                    </button>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2.5">Permissions ({r.permissions.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {r.permissions.map(p => (
                        <span key={p} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-100">
                          <i className="ri-checkbox-circle-fill text-emerald-500 text-[10px]"></i>{p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LOCATIONS ── */}
        {section === "locations" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Location Management</h2>
                <p className="text-xs text-slate-400 mt-0.5">{ALL_LOCATIONS.length} total locations</p>
              </div>
              <button onClick={() => setShowAddLocation(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">
                <i className="ri-add-line"></i>Add Location
              </button>
            </div>
            <div className="relative flex items-center">
              <div className="w-4 h-4 flex items-center justify-center absolute left-3 text-slate-400"><i className="ri-search-line text-xs"></i></div>
              <input value={locationSearch} onChange={e => setLocationSearch(e.target.value)} placeholder="Search locations..." className="pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {["ID", "Location Name", "Type", "City", "Manager", "Assets", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map(l => (
                    <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                      <td className="px-4 py-3 font-mono text-xs text-slate-400">{l.id}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 text-sm">{l.name}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.type === "Head Office" ? "bg-red-100 text-red-700" : l.type === "Commissary" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{l.type}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{l.city}</td>
                      <td className="px-4 py-3 text-slate-600 text-xs">{l.manager}</td>
                      <td className="px-4 py-3"><span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{l.assetCount} assets</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditLocationId(l.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer whitespace-nowrap font-medium">
                            <i className="ri-edit-line text-xs"></i>Edit
                          </button>
                          <button className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 cursor-pointer"><i className="ri-delete-bin-line text-sm"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ASSET CATEGORIES ── */}
        {section === "categories" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Asset Categories</h2>
                <p className="text-xs text-slate-400 mt-0.5">{ASSET_CATEGORIES.length} categories defined</p>
              </div>
              <button onClick={() => setShowAddCategory(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">
                <i className="ri-add-line"></i>Add Category
              </button>
            </div>
            <div className="relative flex items-center">
              <div className="w-4 h-4 flex items-center justify-center absolute left-3 text-slate-400"><i className="ri-search-line text-xs"></i></div>
              <input value={categorySearch} onChange={e => setCategorySearch(e.target.value)} placeholder="Search categories..." className="pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    {["Code", "Category Name", "Description", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map(c => (
                    <tr key={c.code} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                      <td className="px-4 py-3 font-mono text-xs text-emerald-600 font-semibold whitespace-nowrap">{c.code}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 text-sm whitespace-nowrap">{c.name}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 max-w-xs">{c.description}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setEditCategoryCode(c.code)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer whitespace-nowrap font-medium">
                          <i className="ri-edit-line text-xs"></i>Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ORGANIZATION ── */}
        {section === "org" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-800">Organization Settings</h2>
              <p className="text-xs text-slate-400 mt-0.5">Configure your organization&apos;s core information</p>
            </div>
            <div className="space-y-4">
              {[
                { label: "Organization Name", value: "Chicken Republic Nigeria Ltd" },
                { label: "IT Department Email", value: "it@chickenrepublic.com" },
                { label: "Support Phone", value: "+234 800 000 0000" },
                { label: "Website", value: "https://www.chickenrepublic.com" },
                { label: "Head Office Address", value: "Central Support Unit, Lagos, Nigeria" },
                { label: "Timezone", value: "Africa/Lagos (WAT, UTC+1)" },
                { label: "Currency", value: "NGN (₦)" },
                { label: "Fiscal Year Start", value: "January" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{f.label}</label>
                  <input defaultValue={f.value} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                </div>
              ))}
              <button className="px-5 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">Save Changes</button>
            </div>
          </div>
        )}

        {/* ── ALERTS ── */}
        {section === "alerts" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-800">Alerts &amp; Notification Settings</h2>
              <p className="text-xs text-slate-400 mt-0.5">Configure automated alerts and notification preferences</p>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Threshold Settings</p>
              {[
                { label: "Warranty expiry alert (days before)", value: "30" },
                { label: "License renewal alert (days before)", value: "30" },
                { label: "Maintenance overdue alert (days)", value: "3" },
                { label: "Asset idle alert (days without activity)", value: "90" },
                { label: "Low stock alert threshold (units)", value: "5" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{f.label}</label>
                  <input defaultValue={f.value} type="number" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                </div>
              ))}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Notification Channels</p>
              {[
                { label: "Email notifications", checked: true },
                { label: "In-app notifications", checked: true },
                { label: "Auto-assign alerts to IT Officer", checked: true },
                { label: "SMS notifications", checked: false },
                { label: "Slack integration alerts", checked: false },
                { label: "Daily digest email", checked: true },
              ].map(opt => (
                <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
                  <div className="relative flex-shrink-0">
                    <input type="checkbox" defaultChecked={opt.checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-all"></div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                  </div>
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
              <button className="px-5 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">Save Settings</button>
            </div>
          </div>
        )}

        {/* ── EMAIL ── */}
        {section === "email" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-800">Email Settings</h2>
              <p className="text-xs text-slate-400 mt-0.5">Configure SMTP and email notification templates</p>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">SMTP Configuration</p>
              {[
                { label: "SMTP Host", value: "smtp.gmail.com", type: "text" },
                { label: "SMTP Port", value: "587", type: "number" },
                { label: "SMTP Username", value: "it@chickenrepublic.com", type: "email" },
                { label: "SMTP Password", value: "••••••••••••", type: "password" },
                { label: "From Name", value: "AssetIQ System", type: "text" },
                { label: "From Email", value: "noreply@chickenrepublic.com", type: "email" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{f.label}</label>
                  <input defaultValue={f.value} type={f.type} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                </div>
              ))}
              <div className="flex gap-3">
                <button className="px-4 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer whitespace-nowrap font-medium text-slate-600">Test Connection</button>
                <button className="px-5 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">Save Settings</button>
              </div>
            </div>
          </div>
        )}

        {/* ── SECURITY ── */}
        {section === "security" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-800">Security Settings</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage authentication, session, and access control policies</p>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Authentication</p>
              {[
                { label: "Two-Factor Authentication (2FA)", checked: true },
                { label: "Single Sign-On (SSO)", checked: false },
                { label: "Force password reset every 90 days", checked: true },
                { label: "Lock account after 5 failed attempts", checked: true },
              ].map(opt => (
                <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
                  <div className="relative flex-shrink-0">
                    <input type="checkbox" defaultChecked={opt.checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-all"></div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                  </div>
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Session</p>
              {[
                { label: "Session timeout (minutes)", value: "60" },
                { label: "Max concurrent sessions per user", value: "3" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{f.label}</label>
                  <input defaultValue={f.value} type="number" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400" />
                </div>
              ))}
              <button className="px-5 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">Save Settings</button>
            </div>
          </div>
        )}

        {/* ── AUDIT LOG ── */}
        {section === "audit" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">Audit Log</h2>
                <p className="text-xs text-slate-400 mt-0.5">Complete system activity, security events, and change history</p>
              </div>
              <button onClick={handleExportAudit}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">
                <i className="ri-download-2-line"></i>Export Log
              </button>
            </div>

            {/* Audit Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Events", value: AUDIT_LOGS.length, color: "text-slate-800" },
                { label: "Today", value: AUDIT_LOGS.filter(l => l.time.startsWith("2026-04-13")).length, color: "text-emerald-600" },
                { label: "Warnings", value: AUDIT_LOGS.filter(l => l.status === "warning").length, color: "text-amber-600" },
                { label: "Unique Users", value: new Set(AUDIT_LOGS.map(l => l.user)).size, color: "text-slate-700" },
              ].map(s => (
                <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex items-center">
                <div className="w-4 h-4 flex items-center justify-center absolute left-3 text-slate-400"><i className="ri-search-line text-xs"></i></div>
                <input value={auditSearch} onChange={e => setAuditSearch(e.target.value)} placeholder="Search user, action, IP..." className="pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <select value={auditActionFilter} onChange={e => setAuditActionFilter(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none cursor-pointer">
                <option value="All">All Actions</option>
                {uniqueActions.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <span className="text-xs text-slate-400 ml-auto">{filteredAudit.length} events</span>
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      {["Timestamp", "User / Role", "Action", "Resource", "Details", "IP Address", "Location", "Device / Browser", "Status"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAudit.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap font-mono">{row.time}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-700">{row.user}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${roleColors[row.role] || "bg-slate-100 text-slate-500"}`}>{row.role}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${row.status === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>{row.action}</span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">{row.resource}</td>
                        <td className="px-4 py-3 text-xs text-slate-400 max-w-[180px] truncate">{row.details}</td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500 whitespace-nowrap">{row.ip}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{row.location}</td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-slate-600 whitespace-nowrap">{row.device}</p>
                          <p className="text-[10px] text-slate-400">{row.browser}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${row.status === "warning" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {row.status === "warning" ? "Warning" : "Success"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── INTEGRATIONS ── */}
        {section === "integrations" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-800">Integrations</h2>
              <p className="text-xs text-slate-400 mt-0.5">Connect AssetIQ with third-party tools and services</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: "Microsoft Active Directory", desc: "Sync users and groups from AD/LDAP", icon: "ri-microsoft-fill", status: "Connected", color: "text-emerald-600 bg-emerald-50" },
                { name: "Microsoft Teams", desc: "Send alerts and notifications to Teams channels", icon: "ri-team-fill", status: "Not Connected", color: "text-slate-400 bg-slate-100" },
                { name: "Slack", desc: "Push alerts and ticket updates to Slack", icon: "ri-slack-fill", status: "Not Connected", color: "text-slate-400 bg-slate-100" },
                { name: "Jira Service Management", desc: "Sync support tickets with Jira", icon: "ri-bug-fill", status: "Not Connected", color: "text-slate-400 bg-slate-100" },
                { name: "ServiceNow", desc: "Integrate with ServiceNow ITSM platform", icon: "ri-settings-3-fill", status: "Not Connected", color: "text-slate-400 bg-slate-100" },
                { name: "Google Workspace", desc: "Sync users from Google Directory", icon: "ri-google-fill", status: "Not Connected", color: "text-slate-400 bg-slate-100" },
                { name: "Webhook / REST API", desc: "Custom integrations via webhook endpoints", icon: "ri-code-s-slash-fill", status: "Active", color: "text-emerald-600 bg-emerald-50" },
                { name: "SNMP Monitoring", desc: "Network device monitoring via SNMP", icon: "ri-router-fill", status: "Not Connected", color: "text-slate-400 bg-slate-100" },
              ].map(intg => (
                <div key={intg.name} className="border border-slate-100 rounded-xl p-4 flex items-start gap-4 hover:border-slate-200 transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${intg.color}`}>
                    <i className={`${intg.icon} text-xl`}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-slate-800 text-sm">{intg.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${intg.status === "Connected" || intg.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{intg.status}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{intg.desc}</p>
                    <button className={`mt-2 text-xs font-medium cursor-pointer ${intg.status === "Connected" || intg.status === "Active" ? "text-red-500 hover:underline" : "text-emerald-600 hover:underline"}`}>
                      {intg.status === "Connected" || intg.status === "Active" ? "Disconnect" : "Connect"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── EDIT ROLE MODAL ── */}
      {editRole && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditRole(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${editRole.color}`}>{editRole.role}</span>
                <div>
                  <h3 className="font-bold text-slate-800">Edit Role Permissions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{editRolePermissions.length} permissions selected</p>
                </div>
              </div>
              <button onClick={() => setEditRole(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"><i className="ri-close-line text-slate-500"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Role Description</label>
                <input defaultValue={editRole.description} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Permissions</p>
                  <div className="flex gap-2">
                    <button onClick={() => setEditRolePermissions(ALL_PERMISSIONS.flatMap(g => g.items))}
                      className="text-xs text-emerald-600 hover:underline cursor-pointer font-medium">Select All</button>
                    <span className="text-slate-300">·</span>
                    <button onClick={() => setEditRolePermissions([])}
                      className="text-xs text-red-500 hover:underline cursor-pointer font-medium">Clear All</button>
                  </div>
                </div>
                <div className="space-y-4">
                  {ALL_PERMISSIONS.map(group => (
                    <div key={group.group}>
                      <p className="text-xs font-semibold text-slate-600 mb-2">{group.group}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {group.items.map(perm => {
                          const checked = editRolePermissions.includes(perm);
                          return (
                            <label key={perm}
                              className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${checked ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100 hover:border-slate-200"}`}>
                              <div className="relative flex-shrink-0">
                                <input type="checkbox" checked={checked} onChange={() => togglePermission(perm)} className="sr-only peer" />
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${checked ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                                  {checked && <i className="ri-check-line text-white text-[10px]"></i>}
                                </div>
                              </div>
                              <span className={`text-xs font-medium ${checked ? "text-emerald-700" : "text-slate-600"}`}>{perm}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditRole(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer font-medium">Cancel</button>
              <button onClick={handleSaveRole} className="flex-1 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer font-semibold">Save Permissions</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT USER MODAL ── */}
      {editUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">{editUser.avatar}</div>
                <div>
                  <h3 className="font-bold text-slate-800">Edit User</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{editUser.id}</p>
                </div>
              </div>
              <button onClick={() => setEditUser(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"><i className="ri-close-line text-slate-500"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name <span className="text-red-500">*</span></label>
                  <input value={editUserForm.name} onChange={e => setEditUserForm(f => ({ ...f, name: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" value={editUserForm.email} onChange={e => setEditUserForm(f => ({ ...f, email: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Role <span className="text-red-500">*</span></label>
                  <select value={editUserForm.role} onChange={e => setEditUserForm(f => ({ ...f, role: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                    <option>User</option><option>IT Officer</option><option>IT Admin</option><option>Location Manager</option><option>Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Status</label>
                  <select value={editUserForm.status} onChange={e => setEditUserForm(f => ({ ...f, status: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department <span className="text-red-500">*</span></label>
                  <select value={editUserForm.department} onChange={e => setEditUserForm(f => ({ ...f, department: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Location</label>
                  <select value={editUserForm.location} onChange={e => setEditUserForm(f => ({ ...f, location: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                    <option value="">Select location</option>
                    {ALL_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone</label>
                  <input value={editUserForm.phone} onChange={e => setEditUserForm(f => ({ ...f, phone: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="+234..." />
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer font-medium">Cancel</button>
              <button onClick={handleSaveUser} className="flex-1 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer font-semibold">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD USER MODAL ── */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddUser(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">Add New User</h3>
                <p className="text-xs text-slate-400 mt-0.5">Create a new system user account</p>
              </div>
              <button onClick={() => setShowAddUser(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"><i className="ri-close-line text-slate-500"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name <span className="text-red-500">*</span></label>
                  <input value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="Full name" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="email@company.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Role <span className="text-red-500">*</span></label>
                  <select value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                    <option>User</option><option>IT Officer</option><option>IT Admin</option><option>Location Manager</option><option>Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone</label>
                  <input value={userForm.phone} onChange={e => setUserForm(f => ({ ...f, phone: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="+234..." />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department <span className="text-red-500">*</span></label>
                  <select value={userForm.department} onChange={e => setUserForm(f => ({ ...f, department: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Location</label>
                  <select value={userForm.location} onChange={e => setUserForm(f => ({ ...f, location: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                    <option value="">Select location</option>
                    {ALL_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowAddUser(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer font-medium">Cancel</button>
              <button onClick={() => setShowAddUser(false)} className="flex-1 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer font-semibold">Add User</button>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW USER ASSETS MODAL ── */}
      {viewUserAssets && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewUserAssets(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">{viewUserAssets.avatar}</div>
                <div>
                  <h3 className="font-bold text-slate-800">{viewUserAssets.name}</h3>
                  <p className="text-xs text-slate-400">{viewUserAssets.role} · {viewUserAssets.department}</p>
                </div>
              </div>
              <button onClick={() => setViewUserAssets(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"><i className="ri-close-line text-slate-500"></i></button>
            </div>
            <div className="p-5">
              {(() => {
                const assets = getUserAssets(viewUserAssets.name);
                return assets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ri-computer-line text-slate-400 text-xl"></i>
                    </div>
                    <p className="text-sm text-slate-500">No assets allocated to this user</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 mb-3">{assets.length} asset{assets.length > 1 ? "s" : ""} allocated</p>
                    {assets.map(a => (
                      <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{a.id} · {a.category}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{a.status}</span>
                          <p className="text-xs text-slate-400 mt-0.5">{a.location}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── ADD LOCATION MODAL ── */}
      {showAddLocation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddLocation(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Add New Location</h3>
              <button onClick={() => setShowAddLocation(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"><i className="ri-close-line text-slate-500"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Location Name <span className="text-red-500">*</span></label>
                  <input value={locationForm.name} onChange={e => setLocationForm(f => ({ ...f, name: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="e.g. VICTORIA ISLAND" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type</label>
                  <select value={locationForm.type} onChange={e => setLocationForm(f => ({ ...f, type: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                    <option>Store</option><option>Commissary</option><option>Head Office</option><option>Warehouse</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">City</label>
                  <input value={locationForm.city} onChange={e => setLocationForm(f => ({ ...f, city: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="City" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">State</label>
                  <input value={locationForm.state} onChange={e => setLocationForm(f => ({ ...f, state: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="State" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Location Manager</label>
                  <select value={locationForm.manager} onChange={e => setLocationForm(f => ({ ...f, manager: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                    <option value="">Select manager</option>
                    {mockUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone</label>
                  <input value={locationForm.phone} onChange={e => setLocationForm(f => ({ ...f, phone: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="+234..." />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Address</label>
                  <input value={locationForm.address} onChange={e => setLocationForm(f => ({ ...f, address: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="Full address" />
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowAddLocation(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer font-medium">Cancel</button>
              <button onClick={() => setShowAddLocation(false)} className="flex-1 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer font-semibold">Add Location</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD CATEGORY MODAL ── */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddCategory(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Add Asset Category</h3>
              <button onClick={() => setShowAddCategory(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"><i className="ri-close-line text-slate-500"></i></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category Name <span className="text-red-500">*</span></label>
                <input value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" placeholder="e.g. Smart Displays" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                <textarea value={newCatDesc} onChange={e => setNewCatDesc(e.target.value)} rows={3} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none" placeholder="Brief description..." />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowAddCategory(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer font-medium">Cancel</button>
              <button onClick={() => setShowAddCategory(false)} className="flex-1 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer font-semibold">Add Category</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT LOCATION MODAL ── */}
      {editLocationId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditLocationId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Edit Location</h3>
              <button onClick={() => setEditLocationId(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"><i className="ri-close-line text-slate-500"></i></button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const loc = mockLocations.find(l => l.id === editLocationId);
                return loc ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Location Name</label>
                      <input defaultValue={loc.name} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Type</label>
                      <select defaultValue={loc.type} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                        <option>Store</option><option>Commissary</option><option>Head Office</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">City</label>
                      <input defaultValue={loc.city} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Manager</label>
                      <select defaultValue={loc.manager} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                        {mockUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setEditLocationId(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer font-medium">Cancel</button>
              <button onClick={() => setEditLocationId(null)} className="flex-1 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer font-semibold">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD ROLE MODAL ── */}
      {showAddRole && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddRole(false)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800">Add New Role</h3>
                <p className="text-xs text-slate-400 mt-0.5">{newRolePermissions.length} permissions selected</p>
              </div>
              <button onClick={() => setShowAddRole(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"><i className="ri-close-line text-slate-500"></i></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Role Name <span className="text-red-500">*</span></label>
                <input value={newRoleName} onChange={e => setNewRoleName(e.target.value)} placeholder="e.g. Auditor" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                <input value={newRoleDesc} onChange={e => setNewRoleDesc(e.target.value)} placeholder="Brief description of this role" className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Permissions</p>
                  <div className="flex gap-2">
                    <button onClick={() => setNewRolePermissions(ALL_PERMISSIONS.flatMap(g => g.items))} className="text-xs text-emerald-600 hover:underline cursor-pointer font-medium">Select All</button>
                    <span className="text-slate-300">·</span>
                    <button onClick={() => setNewRolePermissions([])} className="text-xs text-red-500 hover:underline cursor-pointer font-medium">Clear All</button>
                  </div>
                </div>
                <div className="space-y-4">
                  {ALL_PERMISSIONS.map(group => (
                    <div key={group.group}>
                      <p className="text-xs font-semibold text-slate-600 mb-2">{group.group}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {group.items.map(perm => {
                          const checked = newRolePermissions.includes(perm);
                          return (
                            <label key={perm}
                              className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${checked ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100 hover:border-slate-200"}`}>
                              <div className="relative flex-shrink-0">
                                <input type="checkbox" checked={checked} onChange={() => setNewRolePermissions(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm])} className="sr-only peer" />
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${checked ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}>
                                  {checked && <i className="ri-check-line text-white text-[10px]"></i>}
                                </div>
                              </div>
                              <span className={`text-xs font-medium ${checked ? "text-emerald-700" : "text-slate-600"}`}>{perm}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowAddRole(false)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer font-medium">Cancel</button>
              <button onClick={() => {
                if (!newRoleName.trim()) return;
                setSaveSuccess(`Role "${newRoleName}" created successfully`);
                setShowAddRole(false);
                setTimeout(() => setSaveSuccess(null), 3000);
              }} className="flex-1 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer font-semibold">Create Role</button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT CATEGORY MODAL ── */}
      {editCategoryCode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditCategoryCode(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Edit Category</h3>
              <button onClick={() => setEditCategoryCode(null)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 cursor-pointer"><i className="ri-close-line text-slate-500"></i></button>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const cat = ASSET_CATEGORIES.find(c => c.code === editCategoryCode);
                return cat ? (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category Code</label>
                      <input defaultValue={cat.code} disabled className="w-full text-sm border border-slate-100 rounded-xl px-3 py-2.5 bg-slate-50 text-slate-400 font-mono" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Category Name</label>
                      <input defaultValue={cat.name} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Description</label>
                      <textarea defaultValue={cat.description} rows={3} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none" />
                    </div>
                  </>
                ) : null;
              })()}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setEditCategoryCode(null)} className="flex-1 py-2.5 text-sm border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer font-medium">Cancel</button>
              <button onClick={() => setEditCategoryCode(null)} className="flex-1 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer font-semibold">Update Category</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}
