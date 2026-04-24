import { useState, useEffect, useCallback } from "react";
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/Components/base/Toast';
import ConfirmDialog from '@/Components/base/ConfirmDialog';
import type { DeviceItem, DeviceCommandItem } from '@/types';

interface Props {
  device: DeviceItem;
  commands: DeviceCommandItem[];
  onCommandSent: (cmd: DeviceCommandItem) => void;
}

interface PaginatedCommands {
  data: DeviceCommandItem[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
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
  
  // Pagination state
  const [commandHistory, setCommandHistory] = useState<PaginatedCommands>({
    data: [],
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
    from: null,
    to: null,
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const rowHover = isDark ? '#374151' : '#f9fafb';

  // Fetch command history with pagination
  const fetchCommandHistory = useCallback(async (page: number = 1, perPage: number = 15) => {
    if (!device?.id) return;
    
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/devices/${device.id}/command-history?page=${page}&per_page=${perPage}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch command history');
      
      const data = await response.json();
      setCommandHistory({
        data: data.history || [],
        current_page: data.current_page || page,
        last_page: data.last_page || 1,
        per_page: data.per_page || perPage,
        total: data.total || 0,
        from: data.from || null,
        to: data.to || null,
      });
    } catch (error) {
      console.error('Error fetching command history:', error);
      showToast('error', 'Load Failed', 'Could not load command history');
    } finally {
      setIsLoadingHistory(false);
    }
  }, [device?.id, showToast]);

  // Load command history when device changes
  useEffect(() => {
    if (device?.id) {
      fetchCommandHistory(1, commandHistory.per_page);
    }
  }, [device?.id, fetchCommandHistory]);

  const handleHistoryPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= commandHistory.last_page) {
      fetchCommandHistory(newPage, commandHistory.per_page);
    }
  };

  const handlePerPageChange = (newPerPage: number) => {
    fetchCommandHistory(1, newPerPage);
  };

  const sendCommand = (cmd: typeof COMMANDS[0]) => {
    if (cmd.danger) { setConfirmCmd(cmd); return; }
    executeCommand(cmd);
  };

  const executeCommand = async (cmd: typeof COMMANDS[0]) => {
    setSending(cmd.key);
    
    try {
      const response = await fetch(`/devices/${device.id}/send-command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ command: cmd.key }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const newCmd: DeviceCommandItem = {
          id: data.command?.id || Date.now(),
          command: cmd.key,
          sentAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
          status: data.command?.status || 'pending',
          response: data.message || `${cmd.label} sent to ${device.name}`,
        };
        onCommandSent(newCmd);
        
        // Refresh command history after sending
        setTimeout(() => {
          fetchCommandHistory(1, commandHistory.per_page);
        }, 500);
        
        showToast('success', 'Command Sent', data.message);
      } else {
        showToast('error', 'Command Failed', data.message);
      }
    } catch (error) {
      showToast('error', 'Command Failed', 'Network error occurred');
    } finally {
      setSending(null);
    }
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
        <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Command History</h3>
            <p className="text-xs mt-0.5" style={{ color: textSecondary }}>
              {commandHistory.total > 0 ? `Showing ${commandHistory.from}-${commandHistory.to} of ${commandHistory.total} commands` : 'No commands found'}
            </p>
          </div>
          
          {/* Per page selector */}
          <select
            value={commandHistory.per_page}
            onChange={(e) => handlePerPageChange(Number(e.target.value))}
            className="text-xs px-2 py-1 rounded-lg outline-none cursor-pointer"
            style={{
              background: isDark ? '#374151' : '#f9fafb',
              border: `1px solid ${border}`,
              color: textPrimary,
            }}
          >
            {[10, 15, 25, 50, 100].map(n => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {['Command', 'Sent At', 'Status', 'Response'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoadingHistory ? (
                <tr>
                  <td colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <i className="ri-loader-4-line animate-spin text-lg"></i>
                      <span className="text-xs" style={{ color: textSecondary }}>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : commandHistory.data.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-xs" style={{ color: textSecondary }}>
                    <i className="ri-command-line text-2xl mb-2 block"></i>
                    No command history found.
                  </td>
                </tr>
              ) : (
                commandHistory.data.map((cmd) => (
                  <tr
                    key={cmd.id}
                    style={{ borderBottom: `1px solid ${border}` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-semibold px-2 py-1 rounded"
                        style={{ background: isDark ? '#374151' : '#f3f4f6', color: textPrimary }}>
                        {cmd.command}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{cmd.sentAt}</td>
                    <td className="px-4 py-3">{statusBadge(cmd.status)}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: textSecondary }}>{cmd.response || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!isLoadingHistory && commandHistory.last_page > 1 && (
          <div className="p-3 flex items-center justify-between gap-2 border-t flex-wrap" style={{ borderColor: border }}>
            <div className="text-xs" style={{ color: textSecondary }}>
              Page {commandHistory.current_page} of {commandHistory.last_page}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleHistoryPageChange(1)}
                disabled={commandHistory.current_page === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-50"
                style={{ color: textSecondary }}
              >
                <i className="ri-arrow-left-double-line"></i>
              </button>
              <button
                onClick={() => handleHistoryPageChange(commandHistory.current_page - 1)}
                disabled={commandHistory.current_page === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-50"
                style={{ color: textSecondary }}
              >
                <i className="ri-arrow-left-s-line"></i>
              </button>
              
              {/* Page numbers */}
              {(() => {
                const pages = [];
                const maxVisible = 5;
                let startPage = Math.max(1, commandHistory.current_page - Math.floor(maxVisible / 2));
                let endPage = Math.min(commandHistory.last_page, startPage + maxVisible - 1);
                
                if (endPage - startPage + 1 < maxVisible) {
                  startPage = Math.max(1, endPage - maxVisible + 1);
                }
                
                for (let i = startPage; i <= endPage; i++) {
                  pages.push(i);
                }
                
                return pages.map(page => (
                  <button
                    key={page}
                    onClick={() => handleHistoryPageChange(page)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: commandHistory.current_page === page ? '#16a34a' : 'transparent',
                      color: commandHistory.current_page === page ? '#fff' : textSecondary,
                    }}
                  >
                    {page}
                  </button>
                ));
              })()}
              
              <button
                onClick={() => handleHistoryPageChange(commandHistory.current_page + 1)}
                disabled={commandHistory.current_page === commandHistory.last_page}
                className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-50"
                style={{ color: textSecondary }}
              >
                <i className="ri-arrow-right-s-line"></i>
              </button>
              <button
                onClick={() => handleHistoryPageChange(commandHistory.last_page)}
                disabled={commandHistory.current_page === commandHistory.last_page}
                className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-50"
                style={{ color: textSecondary }}
              >
                <i className="ri-arrow-right-double-line"></i>
              </button>
            </div>
          </div>
        )}
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