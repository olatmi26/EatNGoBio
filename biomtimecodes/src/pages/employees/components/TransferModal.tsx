import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { mockDepartments, mockPositions, mockAreas } from "@/mocks/organization";
import type { Employee } from "@/mocks/employees";

type TransferType = 'department' | 'position' | 'area' | 'probation' | 'resignation';

interface Props {
  open: boolean;
  onClose: () => void;
  type: TransferType;
  employees: Employee[];
  selectedIds: string[];
  onConfirm: (type: TransferType, value: string, reason: string, effectiveDate: string) => void;
}

const typeConfig: Record<TransferType, { title: string; icon: string; color: string; desc: string }> = {
  department: { title: 'Department Transfer', icon: 'ri-building-2-line', color: '#0891b2', desc: 'Move selected employees to a different department' },
  position: { title: 'Position Transfer', icon: 'ri-briefcase-line', color: '#7c3aed', desc: 'Change the position/role of selected employees' },
  area: { title: 'Area Transfer', icon: 'ri-map-pin-line', color: '#f59e0b', desc: 'Reassign employees to a different work location' },
  probation: { title: 'Pass Probation', icon: 'ri-shield-check-line', color: '#16a34a', desc: 'Confirm employees have passed their probation period' },
  resignation: { title: 'Resignation', icon: 'ri-logout-box-line', color: '#dc2626', desc: 'Process resignation for selected employees' },
};

export default function TransferModal({ open, onClose, type, employees, selectedIds, onConfirm }: Props) {
  const { isDark } = useTheme();
  const [targetValue, setTargetValue] = useState('');
  const [reason, setReason] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  if (!open) return null;

  const config = typeConfig[type];
  const selectedEmployees = employees.filter(e => selectedIds.includes(e.id));

  const bg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#374151' : '#f9fafb';
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
  const labelStyle: React.CSSProperties = { color: textSecondary, fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' };
  const inputClass = "w-full px-3 py-2 rounded-lg text-sm outline-none";

  const handleConfirm = () => {
    onConfirm(type, targetValue, reason, effectiveDate);
    onClose();
  };

  const needsTarget = type === 'department' || type === 'position' || type === 'area';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl flex flex-col" style={{ background: bg, border: `1px solid ${border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${config.color}15` }}>
              <i className={`${config.icon} text-lg`} style={{ color: config.color }}></i>
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: textPrimary }}>{config.title}</h2>
              <p className="text-xs" style={{ color: textSecondary }}>{config.desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary }}>
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Selected employees */}
          <div>
            <label style={labelStyle}>Selected Employees ({selectedEmployees.length})</label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl" style={{ background: isDark ? '#374151' : '#f9fafb', border: `1px solid ${border}` }}>
              {selectedEmployees.map(emp => (
                <span key={emp.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: `${config.color}15`, color: config.color }}>
                  <i className="ri-user-line text-xs"></i>
                  {emp.firstName} {emp.lastName}
                </span>
              ))}
              {selectedEmployees.length === 0 && (
                <p className="text-xs" style={{ color: textSecondary }}>No employees selected — this will apply to all filtered employees</p>
              )}
            </div>
          </div>

          {/* Target selection */}
          {needsTarget && (
            <div>
              <label style={labelStyle}>
                {type === 'department' ? 'Transfer to Department' : type === 'position' ? 'New Position' : 'Transfer to Area'} <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select value={targetValue} onChange={(e) => setTargetValue(e.target.value)} className={inputClass} style={inputStyle}>
                <option value="">Select {type === 'department' ? 'Department' : type === 'position' ? 'Position' : 'Area'}</option>
                {type === 'department' && mockDepartments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                {type === 'position' && mockPositions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                {type === 'area' && mockAreas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
            </div>
          )}

          {/* Effective date */}
          <div>
            <label style={labelStyle}>Effective Date</label>
            <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputClass} style={inputStyle} />
          </div>

          {/* Reason */}
          <div>
            <label style={labelStyle}>{type === 'resignation' ? 'Resignation Reason' : 'Reason / Notes'}</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder={type === 'resignation' ? 'Enter resignation reason...' : 'Optional notes about this transfer...'}
              rows={3} className={`${inputClass} resize-none`} style={inputStyle}
            />
          </div>

          {/* Warning for resignation */}
          {type === 'resignation' && (
            <div className="p-3 rounded-xl flex items-start gap-2" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
              <i className="ri-alert-line text-sm mt-0.5" style={{ color: '#dc2626' }}></i>
              <p className="text-xs" style={{ color: '#dc2626' }}>This action will mark the selected employees as Resigned and revoke their device access. This cannot be undone without manual intervention.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${border}` }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium" style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}>Cancel</button>
          <button onClick={handleConfirm}
            disabled={needsTarget && !targetValue}
            className="px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white disabled:opacity-50"
            style={{ background: config.color }}
          >
            Confirm {config.title}
          </button>
        </div>
      </div>
    </div>
  );
}
