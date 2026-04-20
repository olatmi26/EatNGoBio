import { useState } from "react";
import { useTheme } from '@/contexts/ThemeContext';

type ActionType = 'resync' | 'reupload' | 'delete-template' | 'export-usb';

interface Props {
  open: boolean;
  onClose: () => void;
  type: ActionType;
  employees: Employee[];
  selectedIds: string[];
  onConfirm: (type: ActionType) => void;
}

const actionConfig: Record<ActionType, { title: string; icon: string; color: string; desc: string; warning?: string; confirmLabel: string }> = {
  resync: {
    title: 'Resynchronize to Device',
    icon: 'ri-refresh-line',
    color: '#0891b2',
    desc: 'Push employee biometric data and access rights to all assigned devices.',
    confirmLabel: 'Resynchronize',
  },
  reupload: {
    title: 'Re-upload from Device',
    icon: 'ri-upload-cloud-line',
    color: '#7c3aed',
    desc: 'Pull and re-upload biometric templates from the device back to the server.',
    confirmLabel: 'Re-upload',
  },
  'delete-template': {
    title: 'Delete Biometric Template',
    icon: 'ri-fingerprint-line',
    color: '#dc2626',
    desc: 'Permanently delete fingerprint and face templates from all assigned devices.',
    warning: 'This will remove all biometric data for the selected employees. They will need to re-enroll their fingerprints and face on the device.',
    confirmLabel: 'Delete Templates',
  },
  'export-usb': {
    title: 'Export USB Employee',
    icon: 'ri-usb-line',
    color: '#f59e0b',
    desc: 'Export employee data and biometric templates to a USB-compatible format for offline device enrollment.',
    confirmLabel: 'Export to USB',
  },
};

export default function BiometricActionModal({ open, onClose, type, employees, selectedIds, onConfirm }: Props) {
  const { isDark } = useTheme();
  const [confirmed, setConfirmed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const config = actionConfig[type];
  const selectedEmployees = employees.filter(e => selectedIds.includes(e.id));
  const targetEmployees = selectedEmployees.length > 0 ? selectedEmployees : employees.slice(0, 5);

  const bg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';

  const handleConfirm = () => {
    if (config.warning && !confirmed) return;
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setDone(true);
      setTimeout(() => {
        onConfirm(type);
        onClose();
        setDone(false);
        setConfirmed(false);
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !processing) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl flex flex-col" style={{ background: bg, border: `1px solid ${border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${config.color}15` }}>
              <i className={`${config.icon} text-lg`} style={{ color: config.color }}></i>
            </div>
            <h2 className="text-base font-semibold" style={{ color: textPrimary }}>{config.title}</h2>
          </div>
          {!processing && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary }}>
              <i className="ri-close-line text-lg"></i>
            </button>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">
          {done ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
                <i className="ri-check-line text-3xl" style={{ color: '#16a34a' }}></i>
              </div>
              <p className="text-base font-semibold" style={{ color: textPrimary }}>{config.title} Complete</p>
              <p className="text-sm text-center" style={{ color: textSecondary }}>Successfully processed {targetEmployees.length} employee{targetEmployees.length !== 1 ? 's' : ''}</p>
            </div>
          ) : processing ? (
            <div className="py-8 flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${config.color}15` }}>
                <i className={`ri-loader-4-line text-3xl animate-spin`} style={{ color: config.color }}></i>
              </div>
              <p className="text-base font-semibold" style={{ color: textPrimary }}>Processing...</p>
              <p className="text-sm" style={{ color: textSecondary }}>Sending command to devices</p>
            </div>
          ) : (
            <>
              <p className="text-sm" style={{ color: textSecondary }}>{config.desc}</p>

              {/* Target employees */}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: textSecondary }}>
                  Affected Employees ({targetEmployees.length})
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-3 rounded-xl" style={{ background: isDark ? '#374151' : '#f9fafb', border: `1px solid ${border}` }}>
                  {targetEmployees.map(emp => (
                    <div key={emp.id} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#16a34a' }}>
                        {emp.firstName[0]}{emp.lastName[0]}
                      </div>
                      <span className="text-xs" style={{ color: textPrimary }}>{emp.firstName} {emp.lastName}</span>
                      <span className="text-xs ml-auto" style={{ color: textSecondary }}>{emp.area}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Warning */}
              {config.warning && (
                <div className="p-3 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <p className="text-xs" style={{ color: '#dc2626' }}>
                    <i className="ri-alert-line mr-1"></i>
                    {config.warning}
                  </p>
                  <label className="flex items-center gap-2 mt-3 cursor-pointer">
                    <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="cursor-pointer" />
                    <span className="text-xs font-medium" style={{ color: '#dc2626' }}>I understand and want to proceed</span>
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        {!done && !processing && (
          <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${border}` }}>
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium" style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}>Cancel</button>
            <button onClick={handleConfirm}
              disabled={!!config.warning && !confirmed}
              className="px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white disabled:opacity-50"
              style={{ background: config.color }}
            >
              {config.confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
