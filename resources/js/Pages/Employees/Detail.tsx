import { router } from '@inertiajs/react';
import { useState } from "react";
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/Components/base/Toast';
import AttendanceHeatmap from "./components/AttendanceHeatmap";
import ConfirmDialog from '@/Components/base/ConfirmDialog';

type AttendanceStats = {
  attendanceRate: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  workDays: number;
};

type Props = {
  employee: any;
  recentLogs: any[];
  heatmap?: { year: number; month: number; data: any[] };
  attendanceStats?: AttendanceStats; // ← real stats from server
  connectedDevices: any[];
};

type TabKey = 'profile' | 'attendance' | 'biometric' | 'devices';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'profile',    label: 'Profile',            icon: 'ri-user-line' },
  { key: 'attendance', label: 'Attendance History',  icon: 'ri-time-line' },
  { key: 'biometric',  label: 'Biometric Status',    icon: 'ri-fingerprint-line' },
  { key: 'devices',    label: 'Device Access',       icon: 'ri-device-line' },
];

// ── REMOVED: generateHeatmapData() — was producing fake random attendance ──

export default function EmployeeDetailPage(props: Props) {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const { employee, recentLogs, heatmap, attendanceStats, connectedDevices } = props;

  if (!employee || !employee.id) {
    return (
      <AppLayout title="">
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <i className="ri-user-line text-5xl mb-4" style={{ color: '#9ca3af' }}></i>
          <p className="text-lg font-semibold" style={{ color: '#111827' }}>Employee not found</p>
          <button onClick={() => router.visit('/employees')}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer"
            style={{ background: '#16a34a' }}>
            Back to Employees
          </button>
        </div>
      </AppLayout>
    );
  }

  const empAttendance = Array.isArray(recentLogs) ? recentLogs : [];

  const bg           = isDark ? '#111827' : '#f8fafc';
  const cardBg       = isDark ? '#1f2937' : '#ffffff';
  const border       = isDark ? '#374151' : '#e5e7eb';
  const textPrimary  = isDark ? '#f9fafb' : '#111827';
  const textSecondary= isDark ? '#9ca3af' : '#6b7280';
  const rowHover     = isDark ? '#374151' : '#f9fafb';

  const avatarColors = ['#16a34a', '#0891b2', '#7c3aed', '#d97706', '#dc2626', '#db2777'];
  const empIdStr     = String(employee.id ?? '0');
  const avatarColor  = avatarColors[empIdStr.charCodeAt(0) % avatarColors.length];

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    active:    { bg: '#dcfce7', color: '#16a34a', label: 'Active' },
    resigned:  { bg: '#fee2e2', color: '#dc2626', label: 'Resigned' },
    probation: { bg: '#fef9c3', color: '#ca8a04', label: 'Probation' },
    suspended: { bg: '#fef3c7', color: '#d97706', label: 'Suspended' },
    disabled:  { bg: '#f3f4f6', color: '#6b7280', label: 'Disabled' },
  };
  const sc = statusConfig[employee.status] ?? statusConfig.active;

  // ── Use REAL stats from server. Zero-out if not yet available ──────────────
  const stats: AttendanceStats = attendanceStats ?? {
    attendanceRate: 0,
    presentDays:    0,
    lateDays:       0,
    absentDays:     0,
    workDays:       0,
  };

  // ── Heatmap: use server data if valid, otherwise show empty skeleton ────────
  const safeHeatmap = heatmap && Array.isArray(heatmap.data) && heatmap.data.length > 0
    ? heatmap
    : null;

  const punchTypeIcon = (type: string) => {
    const map: Record<string, { icon: string; color: string }> = {
      fingerprint: { icon: 'ri-fingerprint-line',      color: '#16a34a' },
      face:        { icon: 'ri-user-smile-line',        color: '#0891b2' },
      card:        { icon: 'ri-bank-card-line',         color: '#7c3aed' },
      password:    { icon: 'ri-lock-password-line',     color: '#f59e0b' },
    };
    return map[type] || { icon: 'ri-question-line', color: '#6b7280' };
  };

  const biometricActions = [
    { key: 'resync',          label: 'Resynchronize to Device',   icon: 'ri-user-shared-line',    color: '#16a34a', desc: "Push this employee's data to all assigned devices" },
    { key: 'reupload',        label: 'Re-upload from Device',     icon: 'ri-download-cloud-line', color: '#0891b2', desc: 'Pull biometric templates from device back to server' },
    { key: 'delete_template', label: 'Delete Biometric Template', icon: 'ri-fingerprint-2-line',  color: '#dc2626', desc: 'Remove all fingerprint and face templates for this employee', danger: true },
    { key: 'export_usb',      label: 'Export USB Employee',       icon: 'ri-usb-line',            color: '#7c3aed', desc: 'Export employee data to USB for offline device enrollment' },
  ];

  const handleBiometricAction = (key: string, danger?: boolean) => {
    if (danger) { setConfirmAction(key); return; }
    showToast('success', biometricActions.find(a => a.key === key)?.label || key,
      `Action completed for ${employee.firstName} ${employee.lastName}`);
  };

  return (
    <AppLayout title="">
      <div className="p-6" style={{ background: bg, minHeight: '100vh' }}>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-sm">
          <button onClick={() => router.visit('/employees')} className="cursor-pointer hover:underline" style={{ color: '#16a34a' }}>Employees</button>
          <i className="ri-arrow-right-s-line" style={{ color: textSecondary }}></i>
          <span style={{ color: textSecondary }}>{employee.firstName} {employee.lastName}</span>
        </div>

        {/* Employee header card */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ background: avatarColor }}>
              {employee.firstName?.[0]}{employee.lastName?.[0]}
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-xl font-bold" style={{ color: textPrimary }}>{employee.firstName} {employee.lastName}</h1>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: textSecondary }}>
                <span><i className="ri-id-card-line mr-1"></i>ID: {employee.employeeId}</span>
                <span><i className="ri-building-2-line mr-1"></i>{employee.department}</span>
                <span><i className="ri-briefcase-line mr-1"></i>{employee.position}</span>
                <span><i className="ri-map-pin-line mr-1"></i>{employee.area}</span>
                {employee.email && <span><i className="ri-mail-line mr-1"></i>{employee.email}</span>}
                {employee.mobile && <span><i className="ri-phone-line mr-1"></i>{employee.mobile}</span>}
              </div>
            </div>
            <button
              onClick={() => router.visit('/employees')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap"
              style={{ background: isDark ? '#374151' : '#f3f4f6', color: textPrimary, border: `1px solid ${border}` }}>
              <i className="ri-edit-line"></i> Edit Profile
            </button>
          </div>

          {/* ── Real attendance stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5" style={{ borderTop: `1px solid ${border}` }}>
            {[
              {
                label: 'Attendance Rate',
                value: `${stats.attendanceRate}%`,
                color: stats.workDays === 0
                  ? textSecondary
                  : stats.attendanceRate >= 90 ? '#16a34a'
                  : stats.attendanceRate >= 75 ? '#f59e0b'
                  : '#dc2626',
              },
              { label: 'Present Days', value: stats.presentDays, color: stats.presentDays > 0 ? '#16a34a' : textSecondary },
              { label: 'Late Days',    value: stats.lateDays,    color: stats.lateDays    > 0 ? '#f59e0b' : textSecondary },
              { label: 'Absent Days',  value: stats.absentDays,  color: stats.absentDays  > 0 ? '#dc2626' : textSecondary },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: isDark ? '#374151' : '#f9fafb' }}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: textSecondary }}>{s.label}</p>
                {/* Show "No data" hint when no punches have been recorded */}
                {stats.workDays === 0 && (
                  <p className="text-xs mt-0.5" style={{ color: textSecondary, opacity: 0.6 }}>No records yet</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto" style={{ borderBottom: `1px solid ${border}` }}>
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
              style={{
                color: activeTab === tab.key ? '#16a34a' : textSecondary,
                borderBottom: activeTab === tab.key ? '2px solid #16a34a' : '2px solid transparent',
              }}>
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Profile tab ── */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Personal Information</h3>
              </div>
              <div className="p-5">
                {[
                  { label: 'Full Name',        value: `${employee.firstName} ${employee.lastName}` },
                  { label: 'Employee ID',      value: employee.employeeId },
                  { label: 'Gender',           value: employee.gender || '-' },
                  { label: 'Email',            value: employee.email   || '-' },
                  { label: 'Mobile',           value: employee.mobile  || '-' },
                  { label: 'Hired Date',       value: employee.hiredDate || '-' },
                  { label: 'Employment Type',  value: employee.employmentType },
                  { label: 'Status',           value: sc.label },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: `1px solid ${border}` }}>
                    <span className="text-xs font-medium" style={{ color: textSecondary }}>{row.label}</span>
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Work Information</h3>
              </div>
              <div className="p-5">
                {[
                  { label: 'Department',           value: employee.department },
                  { label: 'Position',             value: employee.position },
                  { label: 'Primary Area',         value: employee.area },
                  { label: 'Assigned Devices',     value: connectedDevices.length },
                  { label: 'Total Punches (30d)',  value: empAttendance.length },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: `1px solid ${border}` }}>
                    <span className="text-xs font-medium" style={{ color: textSecondary }}>{row.label}</span>
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Attendance History tab ── */}
        {activeTab === 'attendance' && (
          <div className="space-y-5">
            <div className="rounded-xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>
                  {safeHeatmap
                    ? `Monthly Calendar — ${new Date(safeHeatmap.year, safeHeatmap.month).toLocaleString('default', { month: 'long', year: 'numeric' })}`
                    : 'Monthly Calendar'}
                </h3>
              </div>

              {safeHeatmap ? (
                <AttendanceHeatmap heatmap={safeHeatmap} />
              ) : (
                <div className="py-10 text-center" style={{ color: textSecondary }}>
                  <i className="ri-calendar-line text-3xl mb-2 block"></i>
                  <p className="text-sm">No attendance data for the last 30 days</p>
                  <p className="text-xs mt-1" style={{ opacity: 0.6 }}>Records will appear once the employee starts punching in</p>
                </div>
              )}
            </div>

            {/* Attendance log table */}
            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Attendance Records</h3>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{empAttendance.length} punch records in the last 30 days</p>
              </div>
              {empAttendance.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                      {['Date', 'Time', 'Punch Type', 'Verify Type', 'Device'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {empAttendance.map((rec, i) => {
                      const pt = punchTypeIcon(rec.verifyType);
                      return (
                        <tr key={i} style={{ borderBottom: `1px solid ${border}` }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: textPrimary }}>{rec.date}</td>
                          <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: '#16a34a' }}>{rec.time}</td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                              style={{
                                background: rec.punchType === 'Check-In' ? '#dcfce7' : '#fee2e2',
                                color:      rec.punchType === 'Check-In' ? '#16a34a' : '#dc2626',
                              }}>
                              {rec.punchType}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs">
                              <i className={pt.icon} style={{ color: pt.color }}></i>
                              <span style={{ color: textSecondary }} className="capitalize">{rec.verifyType}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{rec.device}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center" style={{ color: textSecondary }}>
                  <i className="ri-time-line text-3xl mb-2 block"></i>
                  <p className="text-sm">No punch records in the last 30 days</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Biometric Status tab ── */}
        {activeTab === 'biometric' && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Fingerprint Templates', value: '2 enrolled', icon: 'ri-fingerprint-line', color: '#16a34a', status: 'Enrolled' },
                { label: 'Face Templates',        value: '1 enrolled', icon: 'ri-user-smile-line',  color: '#0891b2', status: 'Enrolled' },
                { label: 'Card / PIN',            value: 'Not set',    icon: 'ri-bank-card-line',   color: '#6b7280', status: 'Not Set' },
              ].map(b => (
                <div key={b.label} className="p-5 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${b.color}15` }}>
                      <i className={`${b.icon} text-xl`} style={{ color: b.color }}></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: textPrimary }}>{b.label}</p>
                      <p className="text-xs" style={{ color: textSecondary }}>{b.value}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: b.status === 'Enrolled' ? '#dcfce7' : '#f3f4f6', color: b.status === 'Enrolled' ? '#16a34a' : '#6b7280' }}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Biometric Actions</h3>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Manage biometric data for this employee across all devices</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                {biometricActions.map(action => (
                  <button key={action.key} onClick={() => handleBiometricAction(action.key, action.danger)}
                    className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all text-left"
                    style={{ border: `1px solid ${border}`, background: isDark ? '#374151' : '#f9fafb' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = action.color; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = border; }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${action.color}15` }}>
                      <i className={`${action.icon} text-lg`} style={{ color: action.color }}></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: textPrimary }}>{action.label}</p>
                      <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{action.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Device Access tab ── */}
        {activeTab === 'devices' && (
          <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
              <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Assigned Devices</h3>
              <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Devices this employee can punch in/out from</p>
            </div>
            {connectedDevices && connectedDevices.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${border}` }}>
                    {['Device', 'Serial', 'Area', 'IP', 'Status', 'Last Activity'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {connectedDevices.map(dev => (
                    <tr key={dev.id} style={{ borderBottom: `1px solid ${border}` }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                      <td className="px-4 py-3">
                        <button onClick={() => router.visit(`/devices/${dev.id}`)}
                          className="text-sm font-medium cursor-pointer hover:underline" style={{ color: '#16a34a' }}>
                          {dev.name}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{dev.sn}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: textSecondary }}>{dev.area}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{dev.ip}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium"
                          style={{
                            background: dev.status === 'online' ? '#dcfce7' : dev.status === 'syncing' ? '#fef9c3' : '#fee2e2',
                            color:      dev.status === 'online' ? '#16a34a' : dev.status === 'syncing' ? '#ca8a04' : '#dc2626',
                          }}>
                          {dev.status.charAt(0).toUpperCase() + dev.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{dev.lastActivity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center" style={{ color: textSecondary }}>
                <i className="ri-device-line text-3xl mb-2 block"></i>
                <p className="text-sm">No devices assigned to this area</p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={() => {
          const action = biometricActions.find(a => a.key === confirmAction);
          if (action) showToast('success', action.label, `Completed for ${employee.firstName} ${employee.lastName}`);
          setConfirmAction(null);
        }}
        title="Confirm Action"
        message={`Are you sure you want to ${biometricActions.find(a => a.key === confirmAction)?.label?.toLowerCase() ?? ''}? This cannot be undone.`}
        confirmLabel="Confirm"
        danger
      />
    </AppLayout>
  );
}