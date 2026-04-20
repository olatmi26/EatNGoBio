import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/feature/DashboardLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/base/Toast";
import { mockEmployees } from "@/mocks/employees";
import { mockAttendanceRecords } from "@/mocks/attendance";
import { mockDeviceList } from "@/mocks/devices";
import AttendanceHeatmap from "./components/AttendanceHeatmap";
import ConfirmDialog from "@/components/base/ConfirmDialog";

type TabKey = 'profile' | 'attendance' | 'biometric' | 'devices';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'profile', label: 'Profile', icon: 'ri-user-line' },
  { key: 'attendance', label: 'Attendance History', icon: 'ri-time-line' },
  { key: 'biometric', label: 'Biometric Status', icon: 'ri-fingerprint-line' },
  { key: 'devices', label: 'Device Access', icon: 'ri-device-line' },
];

// Generate heatmap data for current month
const generateHeatmapData = (employeeId: string) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const data = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = date.getDay();
    if (date > today) {
      data.push({ date: dateStr, status: 'future' as const });
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      data.push({ date: dateStr, status: 'weekend' as const });
    } else {
      const rand = (employeeId.charCodeAt(0) + d) % 10;
      if (rand < 7) data.push({ date: dateStr, status: 'present' as const, checkIn: `0${7 + (d % 2)}:${String(d % 60).padStart(2, '0')}`, checkOut: '17:00' });
      else if (rand < 8) data.push({ date: dateStr, status: 'late' as const, checkIn: `09:${String(15 + d % 30).padStart(2, '0')}`, checkOut: '17:30' });
      else if (rand < 9) data.push({ date: dateStr, status: 'absent' as const });
      else data.push({ date: dateStr, status: 'half-day' as const, checkIn: '08:00', checkOut: '13:00' });
    }
  }
  return { year, month, data };
};

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('profile');
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const employee = mockEmployees.find(e => e.id === id);
  if (!employee) {
    return (
      <DashboardLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <i className="ri-user-line text-5xl mb-4" style={{ color: '#9ca3af' }}></i>
          <p className="text-lg font-semibold" style={{ color: '#111827' }}>Employee not found</p>
          <button onClick={() => navigate('/employees')} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer" style={{ background: '#16a34a' }}>Back to Employees</button>
        </div>
      </DashboardLayout>
    );
  }

  const empAttendance = mockAttendanceRecords.filter(a => a.employeeId === employee.employeeId);
  const heatmap = generateHeatmapData(employee.id);
  const connectedDevices = mockDeviceList.filter(d => d.area === employee.area);

  const bg = isDark ? '#111827' : '#f8fafc';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const rowHover = isDark ? '#374151' : '#f9fafb';

  const avatarColors = ['#16a34a', '#0891b2', '#7c3aed', '#d97706', '#dc2626', '#db2777'];
  const avatarColor = avatarColors[employee.id.charCodeAt(0) % avatarColors.length];

  const statusConfig = {
    active: { bg: '#dcfce7', color: '#16a34a', label: 'Active' },
    resigned: { bg: '#fee2e2', color: '#dc2626', label: 'Resigned' },
    probation: { bg: '#fef9c3', color: '#ca8a04', label: 'Probation' },
  };
  const sc = statusConfig[employee.status];

  const presentDays = heatmap.data.filter(d => d.status === 'present').length;
  const lateDays = heatmap.data.filter(d => d.status === 'late').length;
  const absentDays = heatmap.data.filter(d => d.status === 'absent').length;
  const workDays = heatmap.data.filter(d => d.status !== 'weekend' && d.status !== 'future').length;
  const attendanceRate = workDays > 0 ? Math.round(((presentDays + lateDays) / workDays) * 100) : 0;

  const punchTypeIcon = (type: string) => {
    const map: Record<string, { icon: string; color: string }> = {
      fingerprint: { icon: 'ri-fingerprint-line', color: '#16a34a' },
      face: { icon: 'ri-user-smile-line', color: '#0891b2' },
      card: { icon: 'ri-bank-card-line', color: '#7c3aed' },
      password: { icon: 'ri-lock-password-line', color: '#f59e0b' },
    };
    return map[type] || { icon: 'ri-question-line', color: '#6b7280' };
  };

  const biometricActions = [
    { key: 'resync', label: 'Resynchronize to Device', icon: 'ri-user-shared-line', color: '#16a34a', desc: 'Push this employee\'s data to all assigned devices' },
    { key: 'reupload', label: 'Re-upload from Device', icon: 'ri-download-cloud-line', color: '#0891b2', desc: 'Pull biometric templates from device back to server' },
    { key: 'delete_template', label: 'Delete Biometric Template', icon: 'ri-fingerprint-2-line', color: '#dc2626', desc: 'Remove all fingerprint and face templates for this employee', danger: true },
    { key: 'export_usb', label: 'Export USB Employee', icon: 'ri-usb-line', color: '#7c3aed', desc: 'Export employee data to USB for offline device enrollment' },
  ];

  const handleBiometricAction = (key: string, danger?: boolean) => {
    if (danger) { setConfirmAction(key); return; }
    showToast('success', biometricActions.find(a => a.key === key)?.label || key, `Action completed for ${employee.firstName} ${employee.lastName}`);
  };

  return (
    <DashboardLayout>
      <div className="p-6" style={{ background: bg, minHeight: '100vh' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-sm">
          <button onClick={() => navigate('/employees')} className="cursor-pointer hover:underline" style={{ color: '#16a34a' }}>Employees</button>
          <i className="ri-arrow-right-s-line" style={{ color: textSecondary }}></i>
          <span style={{ color: textSecondary }}>{employee.firstName} {employee.lastName}</span>
        </div>

        {/* Employee header */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0" style={{ background: avatarColor }}>
              {employee.firstName[0]}{employee.lastName[0]}
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
                <span><i className="ri-mail-line mr-1"></i>{employee.email}</span>
                <span><i className="ri-phone-line mr-1"></i>{employee.mobile}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/employees')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap"
                style={{ background: isDark ? '#374151' : '#f3f4f6', color: textPrimary, border: `1px solid ${border}` }}
              >
                <i className="ri-edit-line"></i> Edit Profile
              </button>
            </div>
          </div>

          {/* Attendance stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5" style={{ borderTop: `1px solid ${border}` }}>
            {[
              { label: 'Attendance Rate', value: `${attendanceRate}%`, color: attendanceRate >= 90 ? '#16a34a' : attendanceRate >= 75 ? '#f59e0b' : '#dc2626' },
              { label: 'Present Days', value: presentDays, color: '#16a34a' },
              { label: 'Late Days', value: lateDays, color: '#f59e0b' },
              { label: 'Absent Days', value: absentDays, color: '#dc2626' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl" style={{ background: isDark ? '#374151' : '#f9fafb' }}>
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: textSecondary }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto" style={{ borderBottom: `1px solid ${border}` }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
              style={{
                color: activeTab === tab.key ? '#16a34a' : textSecondary,
                borderBottom: activeTab === tab.key ? '2px solid #16a34a' : '2px solid transparent',
              }}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Profile */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Personal Information</h3>
              </div>
              <div className="p-5 space-y-1">
                {[
                  { label: 'Full Name', value: `${employee.firstName} ${employee.lastName}` },
                  { label: 'Employee ID', value: employee.employeeId },
                  { label: 'Gender', value: employee.gender || 'Not specified' },
                  { label: 'Email', value: employee.email },
                  { label: 'Mobile', value: employee.mobile },
                  { label: 'Hired Date', value: employee.hiredDate },
                  { label: 'Employment Type', value: employee.employmentType },
                  { label: 'Status', value: employee.status.charAt(0).toUpperCase() + employee.status.slice(1) },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
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
              <div className="p-5 space-y-1">
                {[
                  { label: 'Department', value: employee.department },
                  { label: 'Position', value: employee.position },
                  { label: 'Primary Area', value: employee.area },
                  { label: 'Assigned Devices', value: connectedDevices.length },
                  { label: 'Total Punches (Today)', value: empAttendance.length },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2.5" style={{ borderBottom: `1px solid ${border}` }}>
                    <span className="text-xs font-medium" style={{ color: textSecondary }}>{row.label}</span>
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Attendance History */}
        {activeTab === 'attendance' && (
          <div className="space-y-5">
            {/* Heatmap */}
            <div className="rounded-xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>
                  Monthly Calendar — {new Date(heatmap.year, heatmap.month).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              <AttendanceHeatmap month={heatmap.month} year={heatmap.year} data={heatmap.data} />
            </div>

            {/* Attendance records table */}
            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Attendance Records</h3>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{empAttendance.length} records found</p>
              </div>
              {empAttendance.length > 0 ? (
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                      {['Date', 'Device', 'Check In', 'Check Out', 'Hours', 'Type', 'Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {empAttendance.map(rec => {
                      const pt = punchTypeIcon(rec.punchType);
                      return (
                        <tr key={rec.id} style={{ borderBottom: `1px solid ${border}` }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                        >
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: textPrimary }}>{rec.date}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{rec.device}</td>
                          <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: '#16a34a' }}>{rec.checkIn || '-'}</td>
                          <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: '#dc2626' }}>{rec.checkOut || '-'}</td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: textPrimary }}>{rec.workHours}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-xs">
                              <i className={pt.icon} style={{ color: pt.color }}></i>
                              <span style={{ color: textSecondary }} className="capitalize">{rec.punchType}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{
                              background: rec.status === 'present' ? '#dcfce7' : rec.status === 'late' ? '#fef9c3' : rec.status === 'absent' ? '#fee2e2' : '#bfdbfe',
                              color: rec.status === 'present' ? '#16a34a' : rec.status === 'late' ? '#ca8a04' : rec.status === 'absent' ? '#dc2626' : '#1d4ed8',
                            }}>
                              {rec.status.charAt(0).toUpperCase() + rec.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-12 text-center" style={{ color: textSecondary }}>
                  <i className="ri-time-line text-3xl mb-2 block"></i>
                  <p className="text-sm">No attendance records found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Biometric Status */}
        {activeTab === 'biometric' && (
          <div className="space-y-5">
            {/* Biometric status cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Fingerprint Templates', value: '2 enrolled', icon: 'ri-fingerprint-line', color: '#16a34a', status: 'Enrolled' },
                { label: 'Face Templates', value: '1 enrolled', icon: 'ri-user-smile-line', color: '#0891b2', status: 'Enrolled' },
                { label: 'Card / PIN', value: 'Not set', icon: 'ri-bank-card-line', color: '#6b7280', status: 'Not Set' },
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
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{
                    background: b.status === 'Enrolled' ? '#dcfce7' : '#f3f4f6',
                    color: b.status === 'Enrolled' ? '#16a34a' : '#6b7280',
                  }}>{b.status}</span>
                </div>
              ))}
            </div>

            {/* Biometric actions */}
            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Biometric Actions</h3>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Manage biometric data for this employee across all devices</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4">
                {biometricActions.map(action => (
                  <button
                    key={action.key}
                    onClick={() => handleBiometricAction(action.key, action.danger)}
                    className="flex items-start gap-4 p-4 rounded-xl cursor-pointer transition-all text-left"
                    style={{ border: `1px solid ${border}`, background: isDark ? '#374151' : '#f9fafb' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = action.color; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = border; }}
                  >
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

        {/* Tab: Device Access */}
        {activeTab === 'devices' && (
          <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
              <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Assigned Devices</h3>
              <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Devices this employee can punch in/out from</p>
            </div>
            {connectedDevices.length > 0 ? (
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
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/devices/${dev.id}`)} className="text-sm font-medium cursor-pointer hover:underline" style={{ color: '#16a34a' }}>{dev.name}</button>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{dev.sn}</td>
                      <td className="px-4 py-3 text-sm" style={{ color: textSecondary }}>{dev.area}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{dev.ip}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{
                          background: dev.status === 'online' ? '#dcfce7' : dev.status === 'syncing' ? '#fef9c3' : '#fee2e2',
                          color: dev.status === 'online' ? '#16a34a' : dev.status === 'syncing' ? '#ca8a04' : '#dc2626',
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
        message={`Are you sure you want to ${biometricActions.find(a => a.key === confirmAction)?.label.toLowerCase()}? This cannot be undone.`}
        confirmLabel="Confirm"
        danger
      />
    </DashboardLayout>
  );
}
