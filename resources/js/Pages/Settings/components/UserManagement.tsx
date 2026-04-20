import { useState } from "react";
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/Components/base/Toast';
import ConfirmDialog from '@/Components/base/ConfirmDialog';

type SubTab = 'users' | 'roles';

const ROLE_COLORS = ['#16a34a', '#0891b2', '#7c3aed', '#f59e0b', '#dc2626', '#db2777', '#d97706'];

export default function UserManagement() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [subTab, setSubTab] = useState<SubTab>('users');
  const [users, setUsers] = useState<SystemUser[]>(mockSystemUsers);
  const [roles, setRoles] = useState<Role[]>(mockRoles);

  // User modal
  const [showUserModal, setShowUserModal] = useState(false);
  const [editUser, setEditUser] = useState<SystemUser | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', roleId: '', status: 'active' as SystemUser['status'] });

  // Role modal
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', description: '', color: '#16a34a', permissions: [] as string[] });

  // Delete
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteRoleId, setDeleteRoleId] = useState<string | null>(null);

  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#374151' : '#f9fafb';
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
  const labelStyle: React.CSSProperties = { color: textSecondary, fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' };
  const inputClass = "w-full px-3 py-2 rounded-lg text-sm outline-none";
  const rowHover = isDark ? '#374151' : '#f9fafb';

  const openAddUser = () => {
    setEditUser(null);
    setUserForm({ name: '', email: '', roleId: roles[0]?.id || '', status: 'active' });
    setShowUserModal(true);
  };

  const openEditUser = (u: SystemUser) => {
    setEditUser(u);
    setUserForm({ name: u.name, email: u.email, roleId: u.roleId, status: u.status });
    setShowUserModal(true);
  };

  const handleSaveUser = () => {
    const role = roles.find(r => r.id === userForm.roleId);
    if (editUser) {
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...userForm, roleName: role?.name || '' } : u));
      showToast('success', 'User Updated', `${userForm.name} updated successfully`);
    } else {
      const newUser: SystemUser = {
        id: `u${Date.now()}`,
        name: userForm.name,
        email: userForm.email,
        roleId: userForm.roleId,
        roleName: role?.name || '',
        status: userForm.status,
        lastLogin: '-',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setUsers(prev => [...prev, newUser]);
      showToast('success', 'User Added', `${userForm.name} has been added`);
    }
    setShowUserModal(false);
  };

  const openAddRole = () => {
    setEditRole(null);
    setRoleForm({ name: '', description: '', color: '#16a34a', permissions: [] });
    setShowRoleModal(true);
  };

  const openEditRole = (r: Role) => {
    setEditRole(r);
    setRoleForm({ name: r.name, description: r.description, color: r.color, permissions: [...r.permissions] });
    setShowRoleModal(true);
  };

  const handleSaveRole = () => {
    if (editRole) {
      setRoles(prev => prev.map(r => r.id === editRole.id ? { ...r, ...roleForm } : r));
      showToast('success', 'Role Updated', `${roleForm.name} updated`);
    } else {
      const newRole: Role = {
        id: `r${Date.now()}`,
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
        userCount: 0,
        color: roleForm.color,
        isSystem: false,
      };
      setRoles(prev => [...prev, newRole]);
      showToast('success', 'Role Created', `${roleForm.name} created`);
    }
    setShowRoleModal(false);
  };

  const togglePermission = (key: string) => {
    setRoleForm(f => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter(p => p !== key) : [...f.permissions, key],
    }));
  };

  const selectAllCategory = (category: string) => {
    const catPerms = allPermissions.filter(p => p.category === category).map(p => p.key);
    const allSelected = catPerms.every(k => roleForm.permissions.includes(k));
    if (allSelected) {
      setRoleForm(f => ({ ...f, permissions: f.permissions.filter(k => !catPerms.includes(k)) }));
    } else {
      setRoleForm(f => ({ ...f, permissions: [...new Set([...f.permissions, ...catPerms])] }));
    }
  };

  const permissionsByCategory = allPermissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  const statusBadge = (status: SystemUser['status']) => {
    const map = {
      active: { bg: '#dcfce7', color: '#16a34a', label: 'Active' },
      inactive: { bg: '#f3f4f6', color: '#6b7280', label: 'Inactive' },
      pending: { bg: '#fef9c3', color: '#ca8a04', label: 'Pending' },
    };
    const s = map[status];
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
        <div>
          <h2 className="text-base font-semibold" style={{ color: textPrimary }}>User Management</h2>
          <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Manage system users, roles, and permissions</p>
        </div>
        <div className="flex items-center gap-2">
          {subTab === 'users' && (
            <button onClick={openAddUser} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap text-white" style={{ background: '#16a34a' }}>
              <i className="ri-user-add-line"></i> Add User
            </button>
          )}
          {subTab === 'roles' && (
            <button onClick={openAddRole} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap text-white" style={{ background: '#16a34a' }}>
              <i className="ri-shield-star-line"></i> New Role
            </button>
          )}
        </div>
      </div>

      {/* Sub tabs */}
      <div className="flex gap-1 px-6 pt-3" style={{ borderBottom: `1px solid ${border}` }}>
        {([['users', 'Users', 'ri-team-line'], ['roles', 'Roles & Permissions', 'ri-shield-check-line']] as [SubTab, string, string][]).map(([key, label, icon]) => (
          <button key={key} onClick={() => setSubTab(key)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
            style={{ color: subTab === key ? '#16a34a' : textSecondary, borderBottom: subTab === key ? '2px solid #16a34a' : '2px solid transparent' }}
          >
            <i className={icon}></i>{label}
            <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}>
              {key === 'users' ? users.length : roles.length}
            </span>
          </button>
        ))}
      </div>

      {/* Users list */}
      {subTab === 'users' && (
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${border}` }}>
              {['User', 'Email', 'Role', 'Status', 'Last Login', 'Created', ''].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => {
              const role = roles.find(r => r.id === u.roleId);
              return (
                <tr key={u.id} style={{ borderBottom: `1px solid ${border}` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: role?.color || '#16a34a' }}>
                        {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium whitespace-nowrap" style={{ color: textPrimary }}>{u.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: textSecondary }}>{u.email}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: `${role?.color || '#16a34a'}20`, color: role?.color || '#16a34a' }}>{u.roleName}</span>
                  </td>
                  <td className="px-5 py-3">{statusBadge(u.status)}</td>
                  <td className="px-5 py-3 text-xs font-mono whitespace-nowrap" style={{ color: textSecondary }}>{u.lastLogin}</td>
                  <td className="px-5 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{u.createdAt}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditUser(u)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: '#0891b2' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#e0f2fe'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button onClick={() => setDeleteUserId(u.id)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: '#dc2626' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Roles list */}
      {subTab === 'roles' && (
        <div className="p-5 grid grid-cols-1 gap-3">
          {roles.map(role => (
            <div key={role.id} className="p-4 rounded-xl" style={{ border: `1px solid ${border}`, background: isDark ? '#374151' : '#f9fafb' }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${role.color}20` }}>
                    <i className="ri-shield-check-line text-base" style={{ color: role.color }}></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold" style={{ color: textPrimary }}>{role.name}</h4>
                      {role.isSystem && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#fef9c3', color: '#ca8a04' }}>System</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: `${role.color}15`, color: role.color }}>{role.userCount} users</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{role.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditRole(role)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: '#0891b2' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#e0f2fe'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                  >
                    <i className="ri-edit-line text-sm"></i>
                  </button>
                  {!role.isSystem && (
                    <button onClick={() => setDeleteRoleId(role.id)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: '#dc2626' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                      <i className="ri-delete-bin-line text-sm"></i>
                    </button>
                  )}
                </div>
              </div>
              {/* Permission tags */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {role.permissions.slice(0, 8).map(pKey => {
                  const perm = allPermissions.find(p => p.key === pKey);
                  return perm ? (
                    <span key={pKey} className="px-2 py-0.5 rounded text-xs" style={{ background: isDark ? '#4b5563' : '#e5e7eb', color: textSecondary }}>{perm.label}</span>
                  ) : null;
                })}
                {role.permissions.length > 8 && (
                  <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: `${role.color}15`, color: role.color }}>+{role.permissions.length - 8} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowUserModal(false); }}
        >
          <div className="w-full max-w-md rounded-2xl" style={{ background: isDark ? '#1f2937' : '#ffffff', border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
              <h3 className="text-base font-semibold" style={{ color: textPrimary }}>{editUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowUserModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary }}>
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label style={labelStyle}>Full Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={userForm.name} onChange={(e) => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Doe" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email Address <span style={{ color: '#dc2626' }}>*</span></label>
                <input type="email" value={userForm.email} onChange={(e) => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="user@eatngo.com" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Role <span style={{ color: '#dc2626' }}>*</span></label>
                <select value={userForm.roleId} onChange={(e) => setUserForm(f => ({ ...f, roleId: e.target.value }))} className={inputClass} style={inputStyle}>
                  <option value="">Select Role</option>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                {userForm.roleId && (
                  <p className="text-xs mt-1" style={{ color: textSecondary }}>
                    {roles.find(r => r.id === userForm.roleId)?.description}
                  </p>
                )}
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={userForm.status} onChange={(e) => setUserForm(f => ({ ...f, status: e.target.value as SystemUser['status'] }))} className={inputClass} style={inputStyle}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${border}` }}>
              <button onClick={() => setShowUserModal(false)} className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium" style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}>Cancel</button>
              <button onClick={handleSaveUser} disabled={!userForm.name || !userForm.email || !userForm.roleId}
                className="px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white disabled:opacity-50"
                style={{ background: '#16a34a' }}
              >
                {editUser ? 'Save Changes' : 'Add User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowRoleModal(false); }}
        >
          <div className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]" style={{ background: isDark ? '#1f2937' : '#ffffff', border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
              <h3 className="text-base font-semibold" style={{ color: textPrimary }}>{editRole ? 'Edit Role' : 'Create New Role'}</h3>
              <button onClick={() => setShowRoleModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary }}>
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Role Name <span style={{ color: '#dc2626' }}>*</span></label>
                  <input value={roleForm.name} onChange={(e) => setRoleForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Branch Manager" className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Color</label>
                  <div className="flex gap-2 mt-1">
                    {ROLE_COLORS.map(c => (
                      <button key={c} onClick={() => setRoleForm(f => ({ ...f, color: c }))}
                        className="w-7 h-7 rounded-full cursor-pointer flex items-center justify-center transition-transform hover:scale-110"
                        style={{ background: c, border: roleForm.color === c ? `3px solid ${isDark ? '#fff' : '#111'}` : '3px solid transparent' }}
                      >
                        {roleForm.color === c && <i className="ri-check-line text-white" style={{ fontSize: '10px' }}></i>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label style={labelStyle}>Description</label>
                  <input value={roleForm.description} onChange={(e) => setRoleForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe what this role can do..." className={inputClass} style={inputStyle} />
                </div>
              </div>

              {/* Permissions */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label style={{ ...labelStyle, marginBottom: 0 }}>Permissions</label>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#16a34a' }}>{roleForm.permissions.length} selected</span>
                </div>
                <div className="space-y-3">
                  {Object.entries(permissionsByCategory).map(([category, perms]) => {
                    const allSelected = perms.every(p => roleForm.permissions.includes(p.key));
                    const someSelected = perms.some(p => roleForm.permissions.includes(p.key));
                    return (
                      <div key={category} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
                        <div className="flex items-center justify-between px-4 py-2.5 cursor-pointer" style={{ background: isDark ? '#374151' : '#f9fafb' }}
                          onClick={() => selectAllCategory(category)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: allSelected ? '#16a34a' : someSelected ? '#dcfce7' : 'transparent', border: `1.5px solid ${allSelected ? '#16a34a' : someSelected ? '#16a34a' : border}` }}>
                              {allSelected && <i className="ri-check-line text-white" style={{ fontSize: '10px' }}></i>}
                              {someSelected && !allSelected && <div className="w-2 h-0.5 rounded" style={{ background: '#16a34a' }}></div>}
                            </div>
                            <span className="text-xs font-semibold" style={{ color: textPrimary }}>{category}</span>
                          </div>
                          <span className="text-xs" style={{ color: textSecondary }}>{perms.filter(p => roleForm.permissions.includes(p.key)).length}/{perms.length}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-0">
                          {perms.map(perm => (
                            <label key={perm.key} className="flex items-center gap-2 px-4 py-2 cursor-pointer" style={{ borderTop: `1px solid ${border}` }}
                              onClick={() => togglePermission(perm.key)}
                            >
                              <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: roleForm.permissions.includes(perm.key) ? '#16a34a' : 'transparent', border: `1.5px solid ${roleForm.permissions.includes(perm.key) ? '#16a34a' : border}` }}>
                                {roleForm.permissions.includes(perm.key) && <i className="ri-check-line text-white" style={{ fontSize: '10px' }}></i>}
                              </div>
                              <span className="text-xs" style={{ color: textPrimary }}>{perm.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${border}` }}>
              <button onClick={() => setShowRoleModal(false)} className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium" style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}>Cancel</button>
              <button onClick={handleSaveRole} disabled={!roleForm.name}
                className="px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white disabled:opacity-50"
                style={{ background: '#16a34a' }}
              >
                {editRole ? 'Save Changes' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteUserId} onClose={() => setDeleteUserId(null)}
        onConfirm={() => { setUsers(prev => prev.filter(u => u.id !== deleteUserId)); showToast('success', 'User Removed', 'User has been removed'); }}
        title="Remove User" message="Are you sure you want to remove this user? They will lose all system access." confirmLabel="Remove" danger
      />
      <ConfirmDialog open={!!deleteRoleId} onClose={() => setDeleteRoleId(null)}
        onConfirm={() => { setRoles(prev => prev.filter(r => r.id !== deleteRoleId)); showToast('success', 'Role Deleted', 'Role has been deleted'); }}
        title="Delete Role" message="Deleting this role will affect all users assigned to it. Are you sure?" confirmLabel="Delete" danger
      />
    </div>
  );
}
