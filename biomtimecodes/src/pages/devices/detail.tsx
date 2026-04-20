import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/feature/DashboardLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/base/Toast";
import { mockDeviceList } from "@/mocks/devices";
import { mockEmployees } from "@/mocks/employees";
import { mockPunchLogs, mockSyncHistory, mockDeviceCommands, type DeviceCommand } from "@/mocks/deviceDetail";
import DeviceCommandCenter from "./components/DeviceCommandCenter";

type TabKey = 'overview' | 'punches' | 'sync' | 'employees' | 'commands';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: 'ri-dashboard-line' },
  { key: 'punches', label: 'Punch Logs', icon: 'ri-fingerprint-line' },
  { key: 'sync', label: 'Sync History', icon: 'ri-refresh-line' },
  { key: 'employees', label: 'Connected Employees', icon: 'ri-team-line' },
  { key: 'commands', label: 'Command Center', icon: 'ri-terminal-box-line' },
];

export default function DeviceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [commands, setCommands] = useState(mockDeviceCommands);
  const [punchSearch, setPunchSearch] = useState('');

  const device = mockDeviceList.find(d => d.id === id);
  if (!device) {
    return (
      <DashboardLayout>
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          <i className="ri-device-line text-5xl mb-4" style={{ color: '#9ca3af' }}></i>
          <p className="text-lg font-semibold" style={{ color: '#111827' }}>Device not found</p>
          <button onClick={() => navigate('/devices')} className="mt-4 px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer" style={{ background: '#16a34a' }}>Back to Devices</button>
        </div>
      </DashboardLayout>
    );
  }

  const connectedEmployees = mockEmployees.filter(e => e.area === device.area);
  const devicePunches = mockPunchLogs.filter(p =>
    p.employeeName.toLowerCase().includes(punchSearch.toLowerCase()) ||
    p.employeeId.includes(punchSearch)
  );

  const bg = isDark ? '#111827' : '#f8fafc';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const rowHover = isDark ? '#374151' : '#f9fafb';

  const statusConfig = {
    online: { bg: '#dcfce7', color: '#16a34a', icon: 'ri-wifi-line', label: 'Online', dot: '#16a34a' },
    offline: { bg: '#fee2e2', color: '#dc2626', icon: 'ri-wifi-off-line', label: 'Offline', dot: '#dc2626' },
    syncing: { bg: '#fef9c3', color: '#ca8a04', icon: 'ri-refresh-line', label: 'Syncing', dot: '#ca8a04' },
  };
  const sc = statusConfig[device.status];

  const punchTypeIcon = (type: string) => {
    const map: Record<string, { icon: string; color: string }> = {
      fingerprint: { icon: 'ri-fingerprint-line', color: '#16a34a' },
      face: { icon: 'ri-user-smile-line', color: '#0891b2' },
      card: { icon: 'ri-bank-card-line', color: '#7c3aed' },
      password: { icon: 'ri-lock-password-line', color: '#f59e0b' },
    };
    return map[type] || { icon: 'ri-question-line', color: '#6b7280' };
  };

  const verifyModeColor = (mode: string) => {
    const map: Record<string, string> = {
      'Check-In': '#16a34a',
      'Check-Out': '#dc2626',
      'Break': '#f59e0b',
      'Return': '#0891b2',
    };
    return map[mode] || '#6b7280';
  };

  const syncTypeIcon = (type: string) => {
    const map: Record<string, { icon: string; color: string }> = {
      attendance: { icon: 'ri-time-line', color: '#16a34a' },
      user: { icon: 'ri-user-line', color: '#0891b2' },
      command: { icon: 'ri-terminal-line', color: '#7c3aed' },
      heartbeat: { icon: 'ri-heart-pulse-line', color: '#f59e0b' },
    };
    return map[type] || { icon: 'ri-refresh-line', color: '#6b7280' };
  };

  const syncStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      success: { bg: '#dcfce7', color: '#16a34a', label: 'Success' },
      failed: { bg: '#fee2e2', color: '#dc2626', label: 'Failed' },
      partial: { bg: '#fef9c3', color: '#ca8a04', label: 'Partial' },
    };
    const s = map[status] || map.success;
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
  };

  const avatarColors = ['#16a34a', '#0891b2', '#7c3aed', '#d97706', '#dc2626', '#db2777'];
  const getAvatarColor = (id: string) => avatarColors[id.charCodeAt(0) % avatarColors.length];

  return (
    <DashboardLayout>
      <div className="p-6" style={{ background: bg, minHeight: '100vh' }}>
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-sm">
          <button onClick={() => navigate('/devices')} className="cursor-pointer hover:underline" style={{ color: '#16a34a' }}>Devices</button>
          <i className="ri-arrow-right-s-line" style={{ color: textSecondary }}></i>
          <span style={{ color: textSecondary }}>{device.name}</span>
        </div>

        {/* Device header card */}
        <div className="rounded-2xl p-6 mb-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${sc.dot}20` }}>
              <i className="ri-device-line text-3xl" style={{ color: sc.dot }}></i>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-xl font-bold" style={{ color: textPrimary }}>{device.name}</h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: sc.bg, color: sc.color }}>
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: sc.dot }}></span>
                  {sc.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: textSecondary }}>
                <span><i className="ri-barcode-line mr-1"></i>{device.sn}</span>
                <span><i className="ri-map-pin-line mr-1"></i>{device.area}</span>
                <span><i className="ri-global-line mr-1"></i>{device.ip}</span>
                <span><i className="ri-time-line mr-1"></i>{device.timezone}</span>
                <span><i className="ri-cpu-line mr-1"></i>{device.firmware}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { showToast('info', 'Syncing...', `Pulling data from ${device.name}`); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap transition-opacity hover:opacity-80"
                style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}
              >
                <i className="ri-refresh-line"></i> Sync Now
              </button>
              <button
                onClick={() => { setActiveTab('commands'); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap transition-opacity hover:opacity-80"
                style={{ background: isDark ? '#374151' : '#f3f4f6', color: textPrimary, border: `1px solid ${border}` }}
              >
                <i className="ri-terminal-box-line"></i> Commands
              </button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5" style={{ borderTop: `1px solid ${border}` }}>
            {[
              { label: 'Registered Users', value: device.users, icon: 'ri-team-line', color: '#16a34a' },
              { label: 'Fingerprints', value: device.fp, icon: 'ri-fingerprint-line', color: '#0891b2' },
              { label: 'Face Templates', value: device.face, icon: 'ri-user-smile-line', color: '#7c3aed' },
              { label: 'Heartbeat', value: `${device.heartbeat}s`, icon: 'ri-heart-pulse-line', color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15` }}>
                  <i className={`${s.icon} text-lg`} style={{ color: s.color }}></i>
                </div>
                <div>
                  <p className="text-lg font-bold" style={{ color: textPrimary }}>{s.value}</p>
                  <p className="text-xs" style={{ color: textSecondary }}>{s.label}</p>
                </div>
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

        {/* Tab: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Device info */}
            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Device Information</h3>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Device Name', value: device.name },
                  { label: 'Serial Number', value: device.sn },
                  { label: 'IP Address', value: device.ip },
                  { label: 'Area', value: device.area },
                  { label: 'Timezone', value: device.timezone },
                  { label: 'Transfer Mode', value: device.transferMode },
                  { label: 'Firmware', value: device.firmware },
                  { label: 'Heartbeat Interval', value: `${device.heartbeat} seconds` },
                  { label: 'Last Activity', value: device.lastActivity },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${border}` }}>
                    <span className="text-xs font-medium" style={{ color: textSecondary }}>{row.label}</span>
                    <span className="text-sm font-medium" style={{ color: textPrimary }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent punches preview */}
            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Recent Punches</h3>
                <button onClick={() => setActiveTab('punches')} className="text-xs cursor-pointer" style={{ color: '#16a34a' }}>View all</button>
              </div>
              <div className="divide-y" style={{ borderColor: border }}>
                {mockPunchLogs.slice(0, 8).map(log => {
                  const pt = punchTypeIcon(log.punchType);
                  return (
                    <div key={log.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${pt.color}15` }}>
                        <i className={`${pt.icon} text-sm`} style={{ color: pt.color }}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: textPrimary }}>{log.employeeName}</p>
                        <p className="text-xs" style={{ color: textSecondary }}>{log.department}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-semibold" style={{ color: verifyModeColor(log.verifyMode) }}>{log.verifyMode}</p>
                        <p className="text-xs font-mono" style={{ color: textSecondary }}>{log.timestamp.split(' ')[1]}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Punch Logs */}
        {activeTab === 'punches' && (
          <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Punch Logs</h3>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{devicePunches.length} records today</p>
              </div>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: textSecondary }}></i>
                <input
                  value={punchSearch}
                  onChange={(e) => setPunchSearch(e.target.value)}
                  placeholder="Search employee..."
                  className="pl-8 pr-3 py-2 rounded-lg text-xs outline-none w-48"
                  style={{ background: isDark ? '#374151' : '#f9fafb', border: `1px solid ${border}`, color: textPrimary }}
                />
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {['Employee', 'ID', 'Department', 'Timestamp', 'Type', 'Mode', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devicePunches.map(log => {
                  const pt = punchTypeIcon(log.punchType);
                  return (
                    <tr key={log.id} style={{ borderBottom: `1px solid ${border}` }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-3 text-sm font-medium whitespace-nowrap" style={{ color: textPrimary }}>{log.employeeName}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{log.employeeId}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{log.department}</td>
                      <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: textSecondary }}>{log.timestamp}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          <i className={`${pt.icon}`} style={{ color: pt.color }}></i>
                          <span style={{ color: textSecondary }} className="capitalize">{log.punchType}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold" style={{ color: verifyModeColor(log.verifyMode) }}>{log.verifyMode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                          background: log.status === 'success' ? '#dcfce7' : '#fee2e2',
                          color: log.status === 'success' ? '#16a34a' : '#dc2626',
                        }}>
                          {log.status === 'success' ? 'OK' : 'Failed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Sync History */}
        {activeTab === 'sync' && (
          <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
              <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Sync History</h3>
              <p className="text-xs mt-0.5" style={{ color: textSecondary }}>All ADMS communication events</p>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {['Type', 'Timestamp', 'Records', 'Duration', 'Status', 'Message'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockSyncHistory.map(sh => {
                  const st = syncTypeIcon(sh.type);
                  return (
                    <tr key={sh.id} style={{ borderBottom: `1px solid ${border}` }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize">
                          <i className={st.icon} style={{ color: st.color }}></i>
                          <span style={{ color: textPrimary }}>{sh.type}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: textSecondary }}>{sh.timestamp}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: textPrimary }}>{sh.records || '-'}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{sh.duration}</td>
                      <td className="px-4 py-3">{syncStatusBadge(sh.status)}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: textSecondary }}>{sh.message}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Connected Employees */}
        {activeTab === 'employees' && (
          <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
              <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Connected Employees</h3>
              <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{connectedEmployees.length} employees assigned to {device.area}</p>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {['Employee', 'ID', 'Department', 'Position', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {connectedEmployees.map(emp => (
                  <tr key={emp.id} style={{ borderBottom: `1px solid ${border}` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: getAvatarColor(emp.id) }}>
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap" style={{ color: textPrimary }}>{emp.firstName} {emp.lastName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{emp.employeeId}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: textSecondary }}>{emp.department}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap" style={{ color: textSecondary }}>{emp.position}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{
                        background: emp.status === 'active' ? '#dcfce7' : emp.status === 'probation' ? '#fef9c3' : '#fee2e2',
                        color: emp.status === 'active' ? '#16a34a' : emp.status === 'probation' ? '#ca8a04' : '#dc2626',
                      }}>
                        {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
                {connectedEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm" style={{ color: textSecondary }}>
                      <i className="ri-team-line text-3xl mb-2 block"></i>
                      No employees assigned to this area
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab: Command Center */}
        {activeTab === 'commands' && (
          <DeviceCommandCenter
            device={device}
            commands={commands}
            onCommandSent={(cmd) => setCommands(prev => [cmd, ...prev])}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
