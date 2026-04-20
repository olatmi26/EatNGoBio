export interface Permission {
  id: string;
  key: string;
  label: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  color: string;
  isSystem: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin: string;
  createdAt: string;
  avatar?: string;
}

export const allPermissions: Permission[] = [
  { id: 'p1', key: 'dashboard.view', label: 'View Dashboard', category: 'Dashboard' },
  { id: 'p2', key: 'devices.view', label: 'View Devices', category: 'Devices' },
  { id: 'p3', key: 'devices.add', label: 'Add Devices', category: 'Devices' },
  { id: 'p4', key: 'devices.edit', label: 'Edit Devices', category: 'Devices' },
  { id: 'p5', key: 'devices.delete', label: 'Delete Devices', category: 'Devices' },
  { id: 'p6', key: 'devices.commands', label: 'Send Device Commands', category: 'Devices' },
  { id: 'p7', key: 'employees.view', label: 'View Employees', category: 'Employees' },
  { id: 'p8', key: 'employees.add', label: 'Add Employees', category: 'Employees' },
  { id: 'p9', key: 'employees.edit', label: 'Edit Employees', category: 'Employees' },
  { id: 'p10', key: 'employees.delete', label: 'Delete Employees', category: 'Employees' },
  { id: 'p11', key: 'employees.transfer', label: 'Personnel Transfer', category: 'Employees' },
  { id: 'p12', key: 'employees.biometric', label: 'Biometric Actions', category: 'Employees' },
  { id: 'p13', key: 'attendance.view', label: 'View Attendance', category: 'Attendance' },
  { id: 'p14', key: 'attendance.edit', label: 'Edit Attendance', category: 'Attendance' },
  { id: 'p15', key: 'attendance.export', label: 'Export Attendance', category: 'Attendance' },
  { id: 'p16', key: 'shifts.view', label: 'View Shifts', category: 'Shifts' },
  { id: 'p17', key: 'shifts.manage', label: 'Manage Shifts', category: 'Shifts' },
  { id: 'p18', key: 'shifts.assign', label: 'Assign Shifts', category: 'Shifts' },
  { id: 'p19', key: 'reports.view', label: 'View Reports', category: 'Reports' },
  { id: 'p20', key: 'reports.export', label: 'Export Reports', category: 'Reports' },
  { id: 'p21', key: 'reports.payroll', label: 'View Payroll', category: 'Reports' },
  { id: 'p22', key: 'organization.view', label: 'View Organization', category: 'Organization' },
  { id: 'p23', key: 'organization.manage', label: 'Manage Organization', category: 'Organization' },
  { id: 'p24', key: 'settings.view', label: 'View Settings', category: 'Settings' },
  { id: 'p25', key: 'settings.manage', label: 'Manage Settings', category: 'Settings' },
  { id: 'p26', key: 'users.view', label: 'View Users', category: 'User Management' },
  { id: 'p27', key: 'users.manage', label: 'Manage Users', category: 'User Management' },
  { id: 'p28', key: 'roles.manage', label: 'Manage Roles', category: 'User Management' },
  { id: 'p29', key: 'live_monitor.view', label: 'View Live Monitor', category: 'Live Monitor' },
];

export const mockRoles: Role[] = [
  {
    id: 'r1',
    name: 'Super Admin',
    description: 'Full access to all system features and settings',
    permissions: allPermissions.map(p => p.key),
    userCount: 1,
    color: '#dc2626',
    isSystem: true,
  },
  {
    id: 'r2',
    name: 'HR Manager',
    description: 'Manage employees, attendance, and generate reports',
    permissions: ['dashboard.view', 'employees.view', 'employees.add', 'employees.edit', 'employees.transfer', 'attendance.view', 'attendance.edit', 'attendance.export', 'shifts.view', 'shifts.assign', 'reports.view', 'reports.export', 'organization.view', 'organization.manage'],
    userCount: 2,
    color: '#7c3aed',
    isSystem: false,
  },
  {
    id: 'r3',
    name: 'IT Admin',
    description: 'Manage devices, biometric templates, and system settings',
    permissions: ['dashboard.view', 'devices.view', 'devices.add', 'devices.edit', 'devices.delete', 'devices.commands', 'employees.view', 'employees.biometric', 'settings.view', 'settings.manage', 'live_monitor.view'],
    userCount: 1,
    color: '#0891b2',
    isSystem: false,
  },
  {
    id: 'r4',
    name: 'Attendance Officer',
    description: 'View and manage attendance records only',
    permissions: ['dashboard.view', 'attendance.view', 'attendance.edit', 'attendance.export', 'employees.view', 'reports.view', 'live_monitor.view'],
    userCount: 3,
    color: '#16a34a',
    isSystem: false,
  },
  {
    id: 'r5',
    name: 'Report Viewer',
    description: 'Read-only access to reports and attendance data',
    permissions: ['dashboard.view', 'attendance.view', 'reports.view', 'reports.export'],
    userCount: 2,
    color: '#f59e0b',
    isSystem: false,
  },
];

export const mockSystemUsers: SystemUser[] = [
  { id: 'u1', name: 'Taiwo Hassan', email: 'taiwo@eatngo.com', roleId: 'r1', roleName: 'Super Admin', status: 'active', lastLogin: '2026-04-16 09:15:00', createdAt: '2020-03-01' },
  { id: 'u2', name: 'Adaeze Nwosu', email: 'adaeze@eatngo.com', roleId: 'r2', roleName: 'HR Manager', status: 'active', lastLogin: '2026-04-16 08:45:00', createdAt: '2022-11-05' },
  { id: 'u3', name: 'Emeka Obi', email: 'emeka@eatngo.com', roleId: 'r3', roleName: 'IT Admin', status: 'active', lastLogin: '2026-04-15 17:30:00', createdAt: '2023-01-15' },
  { id: 'u4', name: 'Fatima Bello', email: 'fatima@eatngo.com', roleId: 'r2', roleName: 'HR Manager', status: 'active', lastLogin: '2026-04-16 08:00:00', createdAt: '2021-07-22' },
  { id: 'u5', name: 'Segun Ogundimu', email: 'segun@eatngo.com', roleId: 'r4', roleName: 'Attendance Officer', status: 'active', lastLogin: '2026-04-16 07:55:00', createdAt: '2021-06-10' },
  { id: 'u6', name: 'Halima Musa', email: 'halima@eatngo.com', roleId: 'r5', roleName: 'Report Viewer', status: 'inactive', lastLogin: '2026-04-10 14:20:00', createdAt: '2021-12-01' },
  { id: 'u7', name: 'Chukwuemeka Eze', email: 'chukwuemeka@eatngo.com', roleId: 'r4', roleName: 'Attendance Officer', status: 'pending', lastLogin: '-', createdAt: '2026-04-14' },
];
