import { useState } from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/Components/base/Toast';
import ConfirmDialog from '@/Components/base/ConfirmDialog';
import ShiftModal from "./components/ShiftModal";
import AssignShiftModal from "./components/AssignShiftModal";
import AutoAssignModal from "./components/AutoAssignModal";
import type { PageProps, ShiftAssignmentItem } from '@/types';

type TabKey = 'shifts' | 'assignments';

interface Props extends PageProps {
  shifts: ShiftItem[];
  assignments: ShiftAssignmentItem[];
  areas: string[];
  employees: EmployeeOption[];
}

export default function ShiftsPage() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<TabKey>('shifts');
  const { props } = usePage<Props>();
  const { areas, employees } = usePage<Props>().props;
  const [shifts, setShifts] = useState<ShiftItem[]>(props.shifts ?? []);
  const [assignments, setAssignments] = useState<ShiftAssignmentItem[]>(props.assignments ?? []);

  const [showShiftModal, setShowShiftModal]       = useState(false);
  const [showAssignModal, setShowAssignModal]     = useState(false);
  const [autoAssignShift, setAutoAssignShift]     = useState<ShiftItem | null>(null);
  const [editShift, setEditShift]                 = useState<Shift | null>(null);
  const [deleteId, setDeleteId]                   = useState<string | null>(null);
  const [search, setSearch]                       = useState('');

  const bg           = isDark ? '#111827' : '#f8fafc';
  const cardBg       = isDark ? '#1f2937' : '#ffffff';
  const border       = isDark ? '#374151' : '#e5e7eb';
  const textPrimary  = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const rowHover     = isDark ? '#374151' : '#f9fafb';

  const filteredShifts = shifts.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAssignments = assignments.filter(a =>
    a.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    a.shiftName.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd  = () => { setEditShift(null); setShowShiftModal(true); };
  const openEdit = (s: Shift) => { setEditShift(s); setShowShiftModal(true); };

  const handleSaveShift = (data: Partial<ShiftItem>) => {
    if (editShift) {
      setShifts(prev => prev.map(s => s.id === editShift.id ? { ...s, ...data } : s));
      showToast('success', 'Shift Updated', `${data.name} has been updated`);
    } else {
      const newShift: ShiftItem = {
        id: `sh${Date.now()}`,
        name: data.name || '',
        code: data.code || '',
        startTime: data.startTime || '08:00',
        endTime: data.endTime || '17:00',
        checkinStartAt: data.checkinStartAt || '07:30',
        checkoutEndsAt: data.checkoutEndsAt || '18:00',
        workHours: data.workHours || 8,
        lateThreshold: data.lateThreshold || 15,
        overtimeThreshold: data.overtimeThreshold || 60,
        breaks: data.breaks || [],
        locations: data.locations || [],
        color: data.color || '#16a34a',
        employeeCount: 0,
        active: data.active !== false,
        type: data.type || 'fixed',
      };
      setShifts(prev => [...prev, newShift]);
      showToast('success', 'Shift Created', `${newShift.name} has been created`);
    }
  };

  const handleDeleteShift = (id: string) => {
    const s = shifts.find(x => x.id === id);
    setShifts(prev => prev.filter(x => x.id !== id));
    showToast('success', 'Shift Deleted', `${s?.name} removed`);
  };

  const handleAssign = (assignment: ShiftAssignmentItem) => {
    setAssignments(prev => [...prev, assignment]);
    showToast('success', 'Shift Assigned', `${assignment.employeeName} assigned to ${assignment.shiftName}`);
  };

  const handleAutoAssignSuccess = (newAssignments: ShiftAssignmentItem[]) => {
    // Remove old open assignments for these employees and add the new ones
    const newEmployeeIds = new Set(newAssignments.map(a => a.employeeId));
    setAssignments(prev => [
      ...prev.filter(a => !newEmployeeIds.has(a.employeeId)),
      ...newAssignments,
    ]);
    // Update employeeCount on the shift card
    if (autoAssignShift) {
      setShifts(prev => prev.map(s =>
        s.id === autoAssignShift.id
          ? { ...s, employeeCount: newAssignments.length }
          : s
      ));
    }
    showToast('success', 'Auto-Assigned', `${newAssignments.length} employee${newAssignments.length !== 1 ? 's' : ''} assigned to ${autoAssignShift?.name}`);
  };

  const removeAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
    showToast('success', 'Assignment Removed', 'Shift assignment removed');
  };

  const typeBadge = (type: Shift['type']) => {
    const map = {
      fixed:    { bg: '#dcfce7', color: '#16a34a', label: 'Fixed' },
      flexible: { bg: '#fef9c3', color: '#ca8a04', label: 'Flexible' },
      rotating: { bg: '#ede9fe', color: '#7c3aed', label: 'Rotating' },
    };
    const s = map[type];
    return (
      <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
        {s.label}
      </span>
    );
  };

  /* How many employees in a shift's locations are available to auto-assign */
  const autoAssignCount = (shift: ShiftItem) =>
    employees.filter(e => shift.locations?.includes(e.area)).length;

  return (
    <AppLayout title="">
      <div className="p-6" style={{ background: bg, minHeight: '100vh' }}>

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>Shift Management</h1>
            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>
              Define work schedules, assign shifts, and configure attendance rules
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap"
              style={{ background: isDark ? '#374151' : '#f3f4f6', color: textPrimary, border: `1px solid ${border}` }}
            >
              <i className="ri-user-add-line"></i> Assign Shift
            </button>
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
            >
              <i className="ri-add-line"></i> Create Shift
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Shifts',       value: shifts.length,                                          icon: 'ri-time-line',             color: '#16a34a' },
            { label: 'Active Shifts',      value: shifts.filter(s => s.active).length,                    icon: 'ri-checkbox-circle-line',  color: '#0891b2' },
            { label: 'Assigned Employees', value: assignments.length,                                      icon: 'ri-team-line',             color: '#7c3aed' },
            { label: 'Locations Covered',  value: [...new Set(shifts.flatMap(s => s.locations))].length,  icon: 'ri-map-pin-line',          color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="p-5 rounded-xl flex items-center gap-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15` }}>
                <i className={`${s.icon} text-lg`} style={{ color: s.color }}></i>
              </div>
              <div>
                <p className="text-2xl font-bold" style={{ color: textPrimary }}>{s.value}</p>
                <p className="text-xs" style={{ color: textSecondary }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Tabs + Search ── */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: isDark ? '#374151' : '#f3f4f6' }}>
            {(['shifts', 'assignments'] as TabKey[]).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap capitalize transition-colors"
                style={{
                  background: activeTab === tab ? (isDark ? '#1f2937' : '#ffffff') : 'transparent',
                  color: activeTab === tab ? textPrimary : textSecondary,
                }}
              >
                {tab === 'shifts' ? 'Shift Schedules' : 'Assignments'}
                {tab === 'assignments' && assignments.length > 0 && (
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs"
                    style={{ background: '#dcfce7', color: '#16a34a' }}
                  >
                    {assignments.length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: textSecondary }}></i>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-52"
              style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }}
            />
          </div>
        </div>

        {/* ── Shifts Tab ── */}
        {activeTab === 'shifts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredShifts.map(shift => {
              const eligible = autoAssignCount(shift);
              return (
                <div key={shift.id} className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  {/* Color bar */}
                  <div className="h-1.5" style={{ background: shift.color }}></div>
                  <div className="p-5">

                    {/* Card header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-bold" style={{ color: textPrimary }}>{shift.name}</h3>
                          {!shift.active && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: '#f3f4f6', color: '#6b7280' }}>Inactive</span>
                          )}
                        </div>
                        <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}>
                          {shift.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(shift)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                          style={{ color: textSecondary }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#4b5563' : '#f3f4f6'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                          <i className="ri-edit-line text-sm"></i>
                        </button>
                        <button
                          onClick={() => setDeleteId(shift.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                          style={{ color: '#dc2626' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                          <i className="ri-delete-bin-line text-sm"></i>
                        </button>
                      </div>
                    </div>

                    {/* Time display */}
                    <div className="flex items-center gap-3 mb-3 p-3 rounded-xl" style={{ background: isDark ? '#374151' : '#f9fafb' }}>
                      <div className="text-center">
                        <p className="text-lg font-bold" style={{ color: textPrimary }}>{shift.startTime}</p>
                        <p className="text-xs" style={{ color: textSecondary }}>Start</p>
                      </div>
                      <div className="flex-1 flex items-center gap-1">
                        <div className="flex-1 h-0.5 rounded" style={{ background: shift.color }}></div>
                        <i className="ri-arrow-right-line text-xs" style={{ color: shift.color }}></i>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold" style={{ color: textPrimary }}>{shift.endTime}</p>
                        <p className="text-xs" style={{ color: textSecondary }}>End</p>
                      </div>
                    </div>

                    {/* Check-in / checkout window */}
                    {(shift.checkinStartAt || shift.checkoutEndsAt) && (
                      <div className="flex items-center gap-2 mb-3 text-xs" style={{ color: textSecondary }}>
                        <i className="ri-login-circle-line" style={{ color: '#16a34a' }}></i>
                        <span>In from <strong style={{ color: textPrimary }}>{shift.checkinStartAt}</strong></span>
                        <span style={{ color: border }}>·</span>
                        <i className="ri-logout-circle-r-line" style={{ color: '#f59e0b' }}></i>
                        <span>Out by <strong style={{ color: textPrimary }}>{shift.checkoutEndsAt}</strong></span>
                      </div>
                    )}

                    {/* Detail chips */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: textSecondary }}>
                        <i className="ri-alarm-warning-line" style={{ color: '#f59e0b' }}></i>
                        Late after {shift.lateThreshold}min
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: textSecondary }}>
                        <i className="ri-time-line" style={{ color: '#0891b2' }}></i>
                        OT after {shift.overtimeThreshold}min
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: textSecondary }}>
                        <i className="ri-cup-line" style={{ color: '#16a34a' }}></i>
                        {shift.breaks.length} break{shift.breaks.length !== 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs" style={{ color: textSecondary }}>
                        <i className="ri-team-line" style={{ color: '#7c3aed' }}></i>
                        {shift.employeeCount} employees
                      </div>
                    </div>

                    {/* Breaks */}
                    {shift.breaks.length > 0 && (
                      <div className="mb-3 space-y-1">
                        {shift.breaks.map(brk => (
                          <div
                            key={brk.id}
                            className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs"
                            style={{ background: isDark ? '#374151' : '#f0fdf4' }}
                          >
                            <span style={{ color: textPrimary }}>{brk.name}</span>
                            <span style={{ color: textSecondary }}>
                              {brk.startTime}–{brk.endTime} {brk.paid ? '(Paid)' : '(Unpaid)'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer: type + locations + auto-assign button */}
                    <div className="pt-3" style={{ borderTop: `1px solid ${border}` }}>
                      <div className="flex items-center justify-between mb-2.5">
                        {typeBadge(shift.type)}
                        <div className="flex flex-wrap gap-1 justify-end">
                          {shift.locations.slice(0, 2).map(loc => (
                            <span
                              key={loc}
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}
                            >
                              {loc}
                            </span>
                          ))}
                          {shift.locations.length > 2 && (
                            <span
                              className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}
                            >
                              +{shift.locations.length - 2}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ── Auto-Assign CTA ── */}
                      {shift.locations.length > 0 && shift.active && (
                        <button
                          onClick={() => setAutoAssignShift(shift)}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                          style={{
                            background: eligible > 0 ? `${shift.color}15` : (isDark ? '#374151' : '#f3f4f6'),
                            color: eligible > 0 ? shift.color : textSecondary,
                            border: `1px solid ${eligible > 0 ? `${shift.color}40` : border}`,
                          }}
                          onMouseEnter={(e) => {
                            if (eligible > 0) (e.currentTarget as HTMLButtonElement).style.background = `${shift.color}25`;
                          }}
                          onMouseLeave={(e) => {
                            if (eligible > 0) (e.currentTarget as HTMLButtonElement).style.background = `${shift.color}15`;
                          }}
                        >
                          <i className="ri-flashlight-line"></i>
                          {eligible > 0
                            ? `Auto-Assign ${eligible} Employee${eligible !== 1 ? 's' : ''}`
                            : 'No eligible employees in locations'
                          }
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Assignments Tab ── */}
        {activeTab === 'assignments' && (
          <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Shift Assignments</h3>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{filteredAssignments.length} active assignments</p>
              </div>
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
                style={{ background: '#dcfce7', color: '#16a34a' }}
              >
                <i className="ri-add-line"></i> Assign
              </button>
            </div>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: `1px solid ${border}` }}>
                  {['Employee', 'Department', 'Shift', 'Schedule', 'Effective Date', 'End Date', 'Location', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map(a => {
                  const shift = shifts.find(s => s.id === a.shiftId);
                  return (
                    <tr
                      key={a.id}
                      style={{ borderBottom: `1px solid ${border}` }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium whitespace-nowrap" style={{ color: textPrimary }}>{a.employeeName}</p>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{a.department}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: shift?.color || '#16a34a' }}></div>
                          <span className="text-sm font-medium whitespace-nowrap" style={{ color: textPrimary }}>{a.shiftName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: textSecondary }}>
                        {shift ? `${shift.startTime}–${shift.endTime}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{a.effectiveDate}</td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>
                        {a.endDate || <span style={{ color: '#16a34a' }}>Ongoing</span>}
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{a.location}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeAssignment(a.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                          style={{ color: '#dc2626' }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                          <i className="ri-delete-bin-line text-sm"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-sm" style={{ color: textSecondary }}>
                      <i className="ri-calendar-line text-3xl mb-2 block"></i>
                      No shift assignments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <ShiftModal
        open={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        onSave={handleSaveShift}
        editShift={editShift}
        areas={areas as string[]}
      />
      <AssignShiftModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onSave={handleAssign}
        employees={employees as any[]}
        shifts={shifts}
      />
      <AutoAssignModal
        open={!!autoAssignShift}
        onClose={() => setAutoAssignShift(null)}
        shift={autoAssignShift}
        allEmployees={employees as any[]}
        onSuccess={handleAutoAssignSuccess}
      />
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDeleteShift(deleteId)}
        title="Delete Shift"
        message="Are you sure you want to delete this shift? All assignments will be affected."
        confirmLabel="Delete"
        danger
      />
    </AppLayout>
  );
}