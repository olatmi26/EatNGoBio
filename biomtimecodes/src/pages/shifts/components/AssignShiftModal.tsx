import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { mockEmployees } from "@/mocks/employees";
import { mockShifts, type ShiftAssignment } from "@/mocks/shifts";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (assignment: ShiftAssignment) => void;
}

export default function AssignShiftModal({ open, onClose, onSave }: Props) {
  const { isDark } = useTheme();
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  if (!open) return null;

  const bg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#374151' : '#f9fafb';
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
  const labelStyle: React.CSSProperties = { color: textSecondary, fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' };
  const inputClass = "w-full px-3 py-2 rounded-lg text-sm outline-none";

  const filteredEmployees = mockEmployees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeId}`.toLowerCase().includes(search.toLowerCase())
  );

  const selectedEmp = mockEmployees.find(e => e.id === selectedEmployee);
  const selectedShiftData = mockShifts.find(s => s.id === selectedShift);

  const handleSave = () => {
    if (!selectedEmployee || !selectedShift) return;
    const emp = mockEmployees.find(e => e.id === selectedEmployee)!;
    const shift = mockShifts.find(s => s.id === selectedShift)!;
    onSave({
      id: `sa${Date.now()}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      shiftId: shift.id,
      shiftName: shift.name,
      effectiveDate,
      endDate: endDate || null,
      location: emp.area,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-lg rounded-2xl flex flex-col max-h-[85vh]" style={{ background: bg, border: `1px solid ${border}` }}>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <h2 className="text-base font-semibold" style={{ color: textPrimary }}>Assign Shift to Employee</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary }}>
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Employee search */}
          <div>
            <label style={labelStyle}>Select Employee <span style={{ color: '#dc2626' }}>*</span></label>
            <div className="relative mb-2">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: textSecondary }}></i>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div className="max-h-40 overflow-y-auto rounded-lg" style={{ border: `1px solid ${border}` }}>
              {filteredEmployees.slice(0, 10).map(emp => (
                <button key={emp.id} onClick={() => setSelectedEmployee(emp.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-colors"
                  style={{ background: selectedEmployee === emp.id ? '#dcfce7' : 'transparent', borderBottom: `1px solid ${border}` }}
                >
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: '#16a34a' }}>
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: selectedEmployee === emp.id ? '#16a34a' : textPrimary }}>{emp.firstName} {emp.lastName}</p>
                    <p className="text-xs" style={{ color: textSecondary }}>{emp.employeeId} · {emp.department}</p>
                  </div>
                  {selectedEmployee === emp.id && <i className="ri-check-line ml-auto" style={{ color: '#16a34a' }}></i>}
                </button>
              ))}
            </div>
          </div>

          {/* Shift selection */}
          <div>
            <label style={labelStyle}>Select Shift <span style={{ color: '#dc2626' }}>*</span></label>
            <div className="space-y-2">
              {mockShifts.filter(s => s.active).map(shift => (
                <button key={shift.id} onClick={() => setSelectedShift(shift.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left cursor-pointer transition-all"
                  style={{ background: selectedShift === shift.id ? '#dcfce7' : (isDark ? '#374151' : '#f9fafb'), border: `1px solid ${selectedShift === shift.id ? '#16a34a' : border}` }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: shift.color }}></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: selectedShift === shift.id ? '#16a34a' : textPrimary }}>{shift.name}</p>
                    <p className="text-xs" style={{ color: textSecondary }}>{shift.startTime} – {shift.endTime} · {shift.workHours}h · Late after {shift.lateThreshold}min</p>
                  </div>
                  {selectedShift === shift.id && <i className="ri-check-line" style={{ color: '#16a34a' }}></i>}
                </button>
              ))}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Effective Date <span style={{ color: '#dc2626' }}>*</span></label>
              <input type="date" value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date (optional)</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} style={inputStyle} />
            </div>
          </div>

          {/* Summary */}
          {selectedEmp && selectedShiftData && (
            <div className="p-4 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <p className="text-xs font-semibold mb-2" style={{ color: '#16a34a' }}>Assignment Summary</p>
              <p className="text-xs" style={{ color: '#166534' }}>
                <strong>{selectedEmp.firstName} {selectedEmp.lastName}</strong> will be assigned to <strong>{selectedShiftData.name}</strong> ({selectedShiftData.startTime}–{selectedShiftData.endTime}) starting {effectiveDate}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${border}` }}>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium" style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}>Cancel</button>
          <button onClick={handleSave} disabled={!selectedEmployee || !selectedShift}
            className="px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white disabled:opacity-50"
            style={{ background: '#16a34a' }}
          >
            Assign Shift
          </button>
        </div>
      </div>
    </div>
  );
}
