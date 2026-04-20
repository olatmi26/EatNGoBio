import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { useTheme } from '@/contexts/ThemeContext';

interface EmployeePreview {
  id: string | number;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  area: string;
}

interface ShiftOption {
  id: string | number;
  name: string;
  startTime: string;
  endTime: string;
  checkinStartAt?: string;
  checkoutEndsAt?: string;
  workHours: number;
  color: string;
  locations: string[];
  active: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  shift: ShiftOption | null;
  allEmployees: EmployeePreview[];
  onSuccess?: (assignments: any[]) => void;
}

export default function AutoAssignModal({ open, onClose, shift, allEmployees, onSuccess }: Props) {
  const { isDark } = useTheme();
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [overwriteExisting, setOverwriteExisting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());

  // Employees in the shift's locations
  const matchedEmployees = allEmployees.filter(e =>
    shift?.locations?.includes(e.area)
  );

  const includedEmployees = matchedEmployees.filter(e => !excludedIds.has(String(e.id)));

  useEffect(() => {
    if (open) {
      setEffectiveDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setOverwriteExisting(true);
      setExcludedIds(new Set());
    }
  }, [open, shift]);

  if (!open || !shift) return null;

  const bg            = isDark ? '#1f2937' : '#ffffff';
  const overlay       = isDark ? '#111827' : '#f8fafc';
  const border        = isDark ? '#374151' : '#e5e7eb';
  const textPrimary   = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const inputBg       = isDark ? '#374151' : '#f9fafb';
  const inputStyle    = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
  const inputClass    = "w-full px-3 py-2 rounded-lg text-sm outline-none";
  const labelStyle: React.CSSProperties = {
    color: textSecondary, fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block',
  };

  const toggleExclude = (id: string) => {
    setExcludedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (excludedIds.size === 0) {
      setExcludedIds(new Set(matchedEmployees.map(e => String(e.id))));
    } else {
      setExcludedIds(new Set());
    }
  };

  const handleConfirm = () => {
    if (includedEmployees.length === 0) return;
    setLoading(true);
    router.post('/shifts/auto-assign', {
      shift_id:          shift.id,
      employee_ids:      includedEmployees.map(e => e.id),
      effective_date:    effectiveDate,
      end_date:          endDate || null,
      overwrite_existing: overwriteExisting,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        // Build optimistic assignment list for parent state
        const newAssignments = includedEmployees.map(e => ({
          id:            `sa${Date.now()}-${e.id}`,
          employeeId:    e.employeeId,
          employeeName:  `${e.firstName} ${e.lastName}`,
          department:    e.department,
          shiftId:       String(shift.id),
          shiftName:     shift.name,
          effectiveDate,
          endDate:       endDate || null,
          location:      e.area,
        }));
        onSuccess?.(newAssignments);
        setLoading(false);
        onClose();
      },
      onError: () => setLoading(false),
    });
  };

  /* ── Group matched employees by area ── */
  const byArea = matchedEmployees.reduce<Record<string, EmployeePreview[]>>((acc, e) => {
    if (!acc[e.area]) acc[e.area] = [];
    acc[e.area].push(e);
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-xl rounded-2xl flex flex-col"
        style={{ background: bg, border: `1px solid ${border}`, maxHeight: '90vh' }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${shift.color}20` }}
            >
              <i className="ri-flashlight-line text-base" style={{ color: shift.color }}></i>
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: textPrimary }}>Auto-Assign by Location</h2>
              <p className="text-xs mt-0.5" style={{ color: textSecondary }}>
                Bulk assign employees in <strong style={{ color: textPrimary }}>{shift.name}</strong>'s locations
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
            style={{ color: textSecondary }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#374151' : '#f3f4f6'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">

          {/* ── Shift summary banner ── */}
          <div className="mx-6 mt-5 p-4 rounded-xl flex items-center gap-4" style={{ background: `${shift.color}12`, border: `1px solid ${shift.color}30` }}>
            <div className="w-2.5 h-12 rounded-full flex-shrink-0" style={{ background: shift.color }}></div>
            <div className="flex-1 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs mb-0.5" style={{ color: textSecondary }}>Shift</p>
                <p className="text-sm font-bold" style={{ color: textPrimary }}>{shift.name}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: textSecondary }}>Hours</p>
                <p className="text-sm font-bold" style={{ color: textPrimary }}>{shift.startTime} – {shift.endTime}</p>
              </div>
              <div>
                <p className="text-xs mb-0.5" style={{ color: textSecondary }}>Locations</p>
                <p className="text-sm font-bold" style={{ color: textPrimary }}>{shift.locations.length} area{shift.locations.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {/* ── Dates + options ── */}
          <div className="px-6 mt-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Effective Date <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>End Date (optional)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Overwrite toggle */}
            <div
              className="flex items-center justify-between p-3.5 rounded-xl cursor-pointer"
              style={{ background: isDark ? '#374151' : '#f9fafb', border: `1px solid ${border}` }}
              onClick={() => setOverwriteExisting(v => !v)}
            >
              <div>
                <p className="text-xs font-semibold" style={{ color: textPrimary }}>End existing assignments</p>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>
                  Previous open assignments for these employees will be closed the day before the effective date
                </p>
              </div>
              <div
                className="w-10 h-6 rounded-full relative flex-shrink-0 ml-4 transition-colors"
                style={{ background: overwriteExisting ? '#16a34a' : (isDark ? '#4b5563' : '#d1d5db') }}
              >
                <div
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: overwriteExisting ? '22px' : '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
                ></div>
              </div>
            </div>
          </div>

          {/* ── Employee preview ── */}
          <div className="px-6 mt-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                  Employees to assign
                </p>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>
                  {includedEmployees.length} of {matchedEmployees.length} employees will be assigned
                  {excludedIds.size > 0 && <span style={{ color: '#f59e0b' }}> ({excludedIds.size} excluded)</span>}
                </p>
              </div>
              {matchedEmployees.length > 0 && (
                <button
                  onClick={toggleAll}
                  className="text-xs px-3 py-1.5 rounded-lg cursor-pointer font-medium"
                  style={{
                    background: excludedIds.size === matchedEmployees.length ? '#dcfce7' : (isDark ? '#374151' : '#f3f4f6'),
                    color: excludedIds.size === matchedEmployees.length ? '#16a34a' : textSecondary,
                    border: `1px solid ${border}`,
                  }}
                >
                  {excludedIds.size === matchedEmployees.length ? 'Include all' : 'Exclude all'}
                </button>
              )}
            </div>

            {matchedEmployees.length === 0 ? (
              /* No employees in these locations */
              <div
                className="py-10 text-center rounded-xl"
                style={{ background: isDark ? '#374151' : '#f9fafb', border: `1px dashed ${border}` }}
              >
                <i className="ri-user-unfollow-line text-3xl mb-2 block" style={{ color: textSecondary }}></i>
                <p className="text-sm font-medium" style={{ color: textPrimary }}>No employees found</p>
                <p className="text-xs mt-1" style={{ color: textSecondary }}>
                  None of the active employees are in {shift.locations.join(', ')}
                </p>
                <p className="text-xs mt-2" style={{ color: textSecondary, opacity: 0.7 }}>
                  Make sure employees have their Area set in the Employees module
                </p>
              </div>
            ) : (
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${border}` }}
              >
                {/* Group by area */}
                {Object.entries(byArea).map(([area, emps], aIdx) => (
                  <div key={area}>
                    {/* Area header */}
                    <div
                      className="px-4 py-2 flex items-center gap-2"
                      style={{ background: isDark ? '#374151' : '#f3f4f6', borderBottom: `1px solid ${border}` }}
                    >
                      <i className="ri-map-pin-2-line text-xs" style={{ color: '#16a34a' }}></i>
                      <span className="text-xs font-semibold" style={{ color: textPrimary }}>{area}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#16a34a' }}>
                        {emps.filter(e => !excludedIds.has(String(e.id))).length}/{emps.length}
                      </span>
                    </div>

                    {/* Employees in this area */}
                    {emps.map((emp, idx) => {
                      const isExcluded = excludedIds.has(String(emp.id));
                      const isLast = idx === emps.length - 1 && aIdx === Object.keys(byArea).length - 1;
                      return (
                        <div
                          key={emp.id}
                          className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                          style={{
                            borderBottom: isLast ? 'none' : `1px solid ${border}`,
                            background: isExcluded ? (isDark ? '#1f2937' : '#fff7f7') : 'transparent',
                            opacity: isExcluded ? 0.55 : 1,
                          }}
                          onClick={() => toggleExclude(String(emp.id))}
                        >
                          {/* Avatar */}
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: isExcluded ? '#d1d5db' : shift.color }}
                          >
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium" style={{ color: isExcluded ? textSecondary : textPrimary }}>
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs" style={{ color: textSecondary }}>
                              {emp.employeeId} · {emp.department}
                            </p>
                          </div>

                          {/* Status badge */}
                          {isExcluded ? (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#fee2e2', color: '#dc2626' }}>
                              Excluded
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#16a34a' }}>
                              <i className="ri-check-line mr-0.5"></i>Include
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="px-6 py-4 flex items-center justify-between gap-3"
          style={{ borderTop: `1px solid ${border}` }}
        >
          {/* Summary */}
          <p className="text-xs" style={{ color: textSecondary }}>
            {includedEmployees.length > 0
              ? <><strong style={{ color: textPrimary }}>{includedEmployees.length} employee{includedEmployees.length !== 1 ? 's' : ''}</strong> will be assigned starting <strong style={{ color: textPrimary }}>{effectiveDate}</strong></>
              : <span style={{ color: '#f59e0b' }}>No employees selected</span>
            }
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium"
              style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading || includedEmployees.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
            >
              {loading
                ? <><i className="ri-loader-4-line animate-spin"></i> Assigning...</>
                : <><i className="ri-flashlight-line"></i> Auto-Assign {includedEmployees.length > 0 ? `(${includedEmployees.length})` : ''}</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}