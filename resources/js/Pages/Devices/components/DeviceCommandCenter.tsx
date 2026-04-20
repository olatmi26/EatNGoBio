import { useState } from "react";
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/Components/base/Toast';
import ConfirmDialog from '@/Components/base/ConfirmDialog';
import type { DeviceItem, DeviceCommandItem } from '@/types';

interface Props {
  device: DeviceItem;
  commands: DeviceCommandItem[];
  onCommandSent: (cmd: DeviceCommandItem) => void;
}

const COMMANDS = [
  { key: 'RESTART', label: 'Restart Device', icon: 'ri-restart-line', color: '#f59e0b', danger: false, desc: 'Remotely restart the device. It will reconnect automatically.' },
  { key: 'SYNC_USER', label: 'Sync Users', icon: 'ri-user-shared-line', color: '#16a34a', danger: false, desc: 'Push all registered employees to this device.' },
  { key: 'GET_ATTLOG', label: 'Pull Attendance', icon: 'ri-download-cloud-line', color: '#0891b2', danger: false, desc: 'Force-pull all pending attendance records now.' },
  { key: 'CLEAR_ATTLOG', label: 'Clear Attendance Log', icon: 'ri-delete-bin-2-line', color: '#dc2626', danger: true, desc: 'Permanently delete all attendance records stored on the device.' },
  { key: 'CLEAR_DATA', label: 'Clear All Data', icon: 'ri-database-2-line', color: '#dc2626', danger: true, desc: 'Wipe all users, fingerprints, and attendance data from the device.' },
  { key: 'CHECK_FIRMWARE', label: 'Check Firmware', icon: 'ri-cpu-line', color: '#7c3aed', danger: false, desc: 'Query the current firmware version from the device.' },
  { key: 'ENABLE_DEVICE', label: 'Enable Device', icon: 'ri-toggle-line', color: '#16a34a', danger: false, desc: 'Re-enable the device if it was disabled.' },
  { key: 'DISABLE_DEVICE', label: 'Disable Device', icon: 'ri-toggle-fill', color: '#6b7280', danger: false, desc: 'Temporarily disable the device from accepting punches.' },
];

export default function DeviceCommandCenter({ device, commands, onCommandSent }: Props) {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [confirmCmd, setConfirmCmd] = useState<typeof COMMANDS[0] | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const rowHover = isDark ? '#374151' : '#f9fafb';

  const sendCommand = (cmd: typeof COMMANDS[0]) => {
    if (cmd.danger) { setConfirmCmd(cmd); return; }
    executeCommand(cmd);
  };

  const executeCommand = (cmd: typeof COMMANDS[0]) => {
    setSending(cmd.key);
    setTimeout(() => {
      const newCmd: DeviceCommandItem = {
        id: Date.now(),
        command: cmd.key,
        sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'success',
        response: `${cmd.label} executed on ${device.name}`,
      };
      onCommandSent(newCmd);
      setSending(null);
      showToast('success', 'Command Sent', `${cmd.label} sent to ${device.name}`);
    }, 1500);
  };

  const statusBadge = (status: DeviceCommandItem['status']) => {
    const map: Record<DeviceCommandItem['status'], { bg: string; color: string; label: string }> = {
      pending: { bg: '#fef9c3', color: '#ca8a04', label: 'Pending' },
      sent: { bg: '#dbeafe', color: '#2563eb', label: 'Sent' },
      success: { bg: '#dcfce7', color: '#16a34a', label: 'Success' },
      failed: { bg: '#fee2e2', color: '#dc2626', label: 'Failed' },
    };
    const s = map[status];
    return <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Command buttons */}
      <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Remote Commands</h3>
          <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Send ADMS commands directly to the device</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          {COMMANDS.map((cmd) => (
            <button
              key={cmd.key}
              onClick={() => sendCommand(cmd)}
              disabled={sending === cmd.key || device.status === 'offline'}
              className="flex flex-col items-center gap-2 p-4 rounded-xl cursor-pointer transition-all text-center group disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ border: `1px solid ${border}`, background: isDark ? '#374151' : '#f9fafb' }}
              onMouseEnter={(e) => { if (device.status !== 'offline') (e.currentTarget as HTMLButtonElement).style.borderColor = cmd.color; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = border; }}
              title={cmd.desc}
            >
              {sending === cmd.key ? (
                <div className="w-8 h-8 flex items-center justify-center">
                  <i className="ri-loader-4-line text-xl animate-spin" style={{ color: cmd.color }}></i>
                </div>
              ) : (
                <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ background: `${cmd.color}20` }}>
                  <i className={`${cmd.icon} text-lg`} style={{ color: cmd.color }}></i>
                </div>
              )}
              <span className="text-xs font-medium leading-tight" style={{ color: textPrimary }}>{cmd.label}</span>
            </button>
          ))}
        </div>
        {device.status === 'offline' && (
          <div className="mx-4 mb-4 p-3 rounded-xl flex items-center gap-2" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <i className="ri-wifi-off-line text-sm" style={{ color: '#dc2626' }}></i>
            <p className="text-xs font-medium" style={{ color: '#dc2626' }}>Device is offline — commands will be queued and executed when device reconnects</p>
          </div>
        )}
      </div>

      {/* Command history */}
      <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
          <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Command History</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${border}` }}>
              {['Command', 'Sent At', 'Status', 'Response'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: textSecondary }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {commands.map(cmd => (
              <tr key={cmd.id} style={{ borderBottom: `1px solid ${border}` }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
              >
                <td className="px-4 py-3">
                  <span className="text-xs font-mono font-semibold px-2 py-1 rounded" style={{ background: isDark ? '#374151' : '#f3f4f6', color: textPrimary }}>{cmd.command}</span>
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{cmd.sentAt}</td>
                <td className="px-4 py-3">{statusBadge(cmd.status)}</td>
                <td className="px-4 py-3 text-xs" style={{ color: textSecondary }}>{cmd.response}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!confirmCmd}
        onClose={() => setConfirmCmd(null)}
        onConfirm={() => { if (confirmCmd) executeCommand(confirmCmd); setConfirmCmd(null); }}
        title={`Confirm: ${confirmCmd?.label}`}
        message={`${confirmCmd?.desc} This action cannot be undone.`}
        confirmLabel="Execute"
        danger
      />
    </div>
  );
}
