import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { mockDepartments, mockPositions, mockAreas } from "@/mocks/organization";
import type { Employee } from "@/mocks/employees";

interface EmployeeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Employee>) => void;
  editEmployee: Employee | null;
}

const tabs = ['Profile', 'Private Info', 'Device Access', 'Attendance Settings', 'Biometrics'];
const employeeTypes = ['Official', 'Temporary', 'Probation'];
const genders = ['Male', 'Female', 'Other'];

// Searchable multi-select location component
function LocationSearchSelect({
  selectedAreas,
  onToggle,
  isDark,
  border,
  textPrimary,
  textSecondary,
  inputBg,
}: {
  selectedAreas: string[];
  onToggle: (name: string) => void;
  isDark: boolean;
  border: string;
  textPrimary: string;
  textSecondary: string;
  inputBg: string;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = mockAreas.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Selected tags */}
      {selectedAreas.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedAreas.map(area => (
            <span key={area} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ background: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0' }}>
              <i className="ri-map-pin-line" style={{ fontSize: '10px' }}></i>
              {area}
              <button onClick={() => onToggle(area)} className="cursor-pointer ml-0.5 hover:opacity-70">
                <i className="ri-close-line" style={{ fontSize: '10px' }}></i>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: textSecondary }}></i>
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={selectedAreas.length > 0 ? `${selectedAreas.length} location(s) selected — search to add more` : 'Search locations...'}
          className="w-full pl-8 pr-10 py-2 rounded-lg text-sm outline-none"
          style={{ background: inputBg, border: `1px solid ${border}`, color: textPrimary }}
        />
        <button onClick={() => setOpen(!open)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ color: textSecondary }}>
          <i className={open ? 'ri-arrow-up-s-line text-sm' : 'ri-arrow-down-s-line text-sm'}></i>
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl overflow-hidden max-h-52 overflow-y-auto"
          style={{ background: isDark ? '#1f2937' : '#ffffff', border: `1px solid ${border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-center" style={{ color: textSecondary }}>No locations found</div>
          ) : (
            filtered.map(area => {
              const isSelected = selectedAreas.includes(area.name);
              return (
                <button key={area.id} onClick={() => onToggle(area.name)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors"
                  style={{ background: isSelected ? (isDark ? '#14532d20' : '#f0fdf4') : 'transparent' }}
                  onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#374151' : '#f9fafb'; }}
                  onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: isSelected ? '#16a34a' : 'transparent', border: `1.5px solid ${isSelected ? '#16a34a' : border}` }}>
                    {isSelected && <i className="ri-check-line text-white" style={{ fontSize: '10px' }}></i>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: textPrimary }}>{area.name}</p>
                    <p className="text-xs" style={{ color: textSecondary }}>{area.devices} device{area.devices !== 1 ? 's' : ''} · {area.employees} employees</p>
                  </div>
                  {isSelected && <i className="ri-check-double-line text-sm" style={{ color: '#16a34a' }}></i>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// Biometrics capture tab
function BiometricsTab({
  isDark, border, textPrimary, textSecondary, inputBg, cardBg,
}: {
  isDark: boolean; border: string; textPrimary: string; textSecondary: string; inputBg: string; cardBg: string;
}) {
  const [fpStatus, setFpStatus] = useState<Record<number, 'empty' | 'captured' | 'scanning'>>({});
  const [faceStatus, setFaceStatus] = useState<'empty' | 'captured' | 'scanning'>('empty');
  const [activeDevice, setActiveDevice] = useState<'usb' | 'camera'>('usb');
  const [scanningFinger, setScanningFinger] = useState<number | null>(null);

  const fingers = [
    { id: 1, label: 'Right Thumb' }, { id: 2, label: 'Right Index' }, { id: 3, label: 'Right Middle' },
    { id: 4, label: 'Right Ring' }, { id: 5, label: 'Right Little' },
    { id: 6, label: 'Left Thumb' }, { id: 7, label: 'Left Index' }, { id: 8, label: 'Left Middle' },
    { id: 9, label: 'Left Ring' }, { id: 10, label: 'Left Little' },
  ];

  const scanFinger = (id: number) => {
    setScanningFinger(id);
    setFpStatus(prev => ({ ...prev, [id]: 'scanning' }));
    setTimeout(() => {
      setFpStatus(prev => ({ ...prev, [id]: 'captured' }));
      setScanningFinger(null);
    }, 2000);
  };

  const scanFace = () => {
    setFaceStatus('scanning');
    setTimeout(() => setFaceStatus('captured'), 3000);
  };

  const subBg = isDark ? '#374151' : '#f9fafb';

  return (
    <div className="space-y-4">
      {/* Device selector */}
      <div className="flex items-center gap-2 p-1 rounded-xl w-fit" style={{ background: isDark ? '#374151' : '#f3f4f6' }}>
        {[
          { key: 'usb', label: 'USB Thumb Device', icon: 'ri-usb-line' },
          { key: 'camera', label: 'Camera / Face', icon: 'ri-camera-line' },
        ].map(d => (
          <button key={d.key} onClick={() => setActiveDevice(d.key as 'usb' | 'camera')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
            style={{
              background: activeDevice === d.key ? (isDark ? '#1f2937' : '#ffffff') : 'transparent',
              color: activeDevice === d.key ? textPrimary : textSecondary,
            }}>
            <i className={d.icon}></i>
            {d.label}
          </button>
        ))}
      </div>

      {/* USB Fingerprint */}
      {activeDevice === 'usb' && (
        <div>
          <div className="flex items-center gap-2 mb-3 p-3 rounded-xl" style={{ background: subBg, border: `1px solid ${border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#dcfce7' }}>
              <i className="ri-usb-line text-sm" style={{ color: '#16a34a' }}></i>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: textPrimary }}>ZKTeco USB Fingerprint Reader</p>
              <p className="text-xs" style={{ color: '#16a34a' }}>Device connected · Ready to scan</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#16a34a' }}></div>
              <span className="text-xs font-medium" style={{ color: '#16a34a' }}>Connected</span>
            </div>
          </div>

          <p className="text-xs font-medium mb-3" style={{ color: textSecondary }}>
            Click a finger to scan. Place finger on the USB reader when prompted.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {/* Right hand */}
            <div>
              <p className="text-xs font-semibold mb-2 text-center" style={{ color: textSecondary }}>RIGHT HAND</p>
              <div className="space-y-1.5">
                {fingers.slice(0, 5).map(f => {
                  const status = fpStatus[f.id] || 'empty';
                  return (
                    <button key={f.id} onClick={() => status !== 'scanning' && scanFinger(f.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: status === 'captured' ? '#dcfce7' : status === 'scanning' ? '#fef9c3' : subBg,
                        border: `1px solid ${status === 'captured' ? '#16a34a' : status === 'scanning' ? '#f59e0b' : border}`,
                      }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: status === 'captured' ? '#16a34a' : status === 'scanning' ? '#f59e0b' : (isDark ? '#4b5563' : '#e5e7eb') }}>
                        {status === 'scanning' ? (
                          <i className="ri-loader-4-line text-white text-sm animate-spin"></i>
                        ) : status === 'captured' ? (
                          <i className="ri-fingerprint-line text-white text-sm"></i>
                        ) : (
                          <i className="ri-fingerprint-line text-sm" style={{ color: textSecondary }}></i>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-medium" style={{ color: textPrimary }}>{f.label}</p>
                        <p className="text-xs" style={{ color: status === 'captured' ? '#16a34a' : status === 'scanning' ? '#f59e0b' : textSecondary }}>
                          {status === 'captured' ? 'Captured' : status === 'scanning' ? 'Scanning...' : 'Tap to scan'}
                        </p>
                      </div>
                      {status === 'captured' && <i className="ri-checkbox-circle-line text-sm" style={{ color: '#16a34a' }}></i>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Left hand */}
            <div>
              <p className="text-xs font-semibold mb-2 text-center" style={{ color: textSecondary }}>LEFT HAND</p>
              <div className="space-y-1.5">
                {fingers.slice(5).map(f => {
                  const status = fpStatus[f.id] || 'empty';
                  return (
                    <button key={f.id} onClick={() => status !== 'scanning' && scanFinger(f.id)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: status === 'captured' ? '#dcfce7' : status === 'scanning' ? '#fef9c3' : subBg,
                        border: `1px solid ${status === 'captured' ? '#16a34a' : status === 'scanning' ? '#f59e0b' : border}`,
                      }}>
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: status === 'captured' ? '#16a34a' : status === 'scanning' ? '#f59e0b' : (isDark ? '#4b5563' : '#e5e7eb') }}>
                        {status === 'scanning' ? (
                          <i className="ri-loader-4-line text-white text-sm animate-spin"></i>
                        ) : status === 'captured' ? (
                          <i className="ri-fingerprint-line text-white text-sm"></i>
                        ) : (
                          <i className="ri-fingerprint-line text-sm" style={{ color: textSecondary }}></i>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-xs font-medium" style={{ color: textPrimary }}>{f.label}</p>
                        <p className="text-xs" style={{ color: status === 'captured' ? '#16a34a' : status === 'scanning' ? '#f59e0b' : textSecondary }}>
                          {status === 'captured' ? 'Captured' : status === 'scanning' ? 'Scanning...' : 'Tap to scan'}
                        </p>
                      </div>
                      {status === 'captured' && <i className="ri-checkbox-circle-line text-sm" style={{ color: '#16a34a' }}></i>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-3 p-3 rounded-xl flex items-center justify-between" style={{ background: subBg, border: `1px solid ${border}` }}>
            <span className="text-xs" style={{ color: textSecondary }}>
              {Object.values(fpStatus).filter(s => s === 'captured').length} of 10 fingers captured
            </span>
            <button onClick={() => setFpStatus({})} className="text-xs cursor-pointer" style={{ color: '#dc2626' }}>
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Camera Face */}
      {activeDevice === 'camera' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-3 rounded-xl" style={{ background: subBg, border: `1px solid ${border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#dcfce7' }}>
              <i className="ri-camera-line text-sm" style={{ color: '#16a34a' }}></i>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: textPrimary }}>Webcam / USB Camera</p>
              <p className="text-xs" style={{ color: '#16a34a' }}>Camera ready · Face detection active</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#16a34a' }}></div>
              <span className="text-xs font-medium" style={{ color: '#16a34a' }}>Ready</span>
            </div>
          </div>

          {/* Camera preview area */}
          <div className="relative rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: '#000', height: '220px', border: `1px solid ${border}` }}>
            {faceStatus === 'empty' && (
              <div className="text-center">
                <div className="w-24 h-24 rounded-full border-2 border-dashed mx-auto mb-3 flex items-center justify-center" style={{ borderColor: '#4b5563' }}>
                  <i className="ri-user-line text-4xl" style={{ color: '#4b5563' }}></i>
                </div>
                <p className="text-sm" style={{ color: '#6b7280' }}>Camera preview will appear here</p>
                <p className="text-xs mt-1" style={{ color: '#4b5563' }}>Position face within the frame</p>
              </div>
            )}
            {faceStatus === 'scanning' && (
              <div className="text-center">
                <div className="w-32 h-32 rounded-full border-4 mx-auto mb-3 flex items-center justify-center animate-pulse" style={{ borderColor: '#f59e0b' }}>
                  <i className="ri-scan-line text-5xl" style={{ color: '#f59e0b' }}></i>
                </div>
                <p className="text-sm font-medium" style={{ color: '#f59e0b' }}>Scanning face...</p>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Hold still, looking for face landmarks</p>
              </div>
            )}
            {faceStatus === 'captured' && (
              <div className="text-center">
                <div className="w-32 h-32 rounded-full border-4 mx-auto mb-3 flex items-center justify-center" style={{ borderColor: '#16a34a' }}>
                  <i className="ri-user-smile-line text-5xl" style={{ color: '#16a34a' }}></i>
                </div>
                <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>Face captured successfully!</p>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>Face template saved</p>
              </div>
            )}
            {/* Corner guides */}
            {faceStatus !== 'captured' && (
              <>
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2" style={{ borderColor: faceStatus === 'scanning' ? '#f59e0b' : '#4b5563' }}></div>
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2" style={{ borderColor: faceStatus === 'scanning' ? '#f59e0b' : '#4b5563' }}></div>
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2" style={{ borderColor: faceStatus === 'scanning' ? '#f59e0b' : '#4b5563' }}></div>
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2" style={{ borderColor: faceStatus === 'scanning' ? '#f59e0b' : '#4b5563' }}></div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {faceStatus !== 'scanning' && (
              <button onClick={scanFace}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap text-white"
                style={{ background: faceStatus === 'captured' ? '#0891b2' : '#16a34a' }}>
                <i className={faceStatus === 'captured' ? 'ri-refresh-line' : 'ri-camera-line'}></i>
                {faceStatus === 'captured' ? 'Re-capture Face' : 'Capture Face'}
              </button>
            )}
            {faceStatus === 'captured' && (
              <button onClick={() => setFaceStatus('empty')}
                className="px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap"
                style={{ background: '#fee2e2', color: '#dc2626' }}>
                <i className="ri-delete-bin-line"></i>
              </button>
            )}
          </div>

          {/* Face status */}
          <div className="p-3 rounded-xl flex items-center gap-3" style={{ background: subBg, border: `1px solid ${border}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: faceStatus === 'captured' ? '#dcfce7' : '#f3f4f6' }}>
              <i className="ri-scan-2-line text-sm" style={{ color: faceStatus === 'captured' ? '#16a34a' : textSecondary }}></i>
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: textPrimary }}>Face Template</p>
              <p className="text-xs" style={{ color: faceStatus === 'captured' ? '#16a34a' : textSecondary }}>
                {faceStatus === 'captured' ? 'Template captured and ready to save' : 'Not yet captured'}
              </p>
            </div>
            {faceStatus === 'captured' && <i className="ri-checkbox-circle-line ml-auto text-lg" style={{ color: '#16a34a' }}></i>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeeModal({ open, onClose, onSave, editEmployee }: EmployeeModalProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('Profile');
  const [form, setForm] = useState<Partial<Employee & { areas: string[]; dateOfBirth: string; employeeType: string }>>({});
  const [fpEnabled, setFpEnabled] = useState(true);
  const [faceEnabled, setFaceEnabled] = useState(true);

  useEffect(() => {
    if (open) {
      setActiveTab('Profile');
      if (editEmployee) {
        setForm({
          ...editEmployee,
          areas: editEmployee.area ? editEmployee.area.split(',').map(a => a.trim()) : [],
          dateOfBirth: '',
          employeeType: 'Official',
        });
      } else {
        setForm({
          employeeId: `EMP${Math.floor(10000 + Math.random() * 90000)}`,
          firstName: '', lastName: '', department: '', position: '', area: '',
          areas: [],
          employmentType: 'Full-Time',
          employeeType: 'Official',
          hiredDate: new Date().toISOString().split('T')[0],
          dateOfBirth: '',
          gender: '', email: '', mobile: '', status: 'active',
        });
      }
    }
  }, [open, editEmployee]);

  if (!open) return null;

  const bg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#374151' : '#f9fafb';
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
  const labelStyle = { color: textSecondary, fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' as const };
  const inputClass = "w-full px-3 py-2 rounded-lg text-sm outline-none";

  const selectedAreas: string[] = (form as { areas?: string[] }).areas || [];

  const toggleArea = (areaName: string) => {
    const current = selectedAreas;
    const updated = current.includes(areaName)
      ? current.filter(a => a !== areaName)
      : [...current, areaName];
    setForm(f => ({ ...f, areas: updated, area: updated[0] || '' }));
  };

  const handleSave = () => {
    const areas = selectedAreas;
    onSave({ ...form, area: areas[0] || form.area || '' });
    onClose();
  };

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} className="w-10 h-6 rounded-full cursor-pointer relative transition-colors flex-shrink-0"
      style={{ background: enabled ? '#16a34a' : (isDark ? '#4b5563' : '#d1d5db') }}>
      <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: enabled ? '22px' : '2px' }}></div>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-3xl rounded-2xl flex flex-col max-h-[92vh]" style={{ background: bg, border: `1px solid ${border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <h2 className="text-base font-semibold" style={{ color: textPrimary }}>{editEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#374151' : '#f3f4f6'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* Profile top section */}
        <div className="px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
          <div className="flex items-start gap-6">
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div>
                <label style={labelStyle}>Employee ID <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={form.employeeId || ''} onChange={(e) => setForm(f => ({ ...f, employeeId: e.target.value }))} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>First Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={form.firstName || ''} onChange={(e) => setForm(f => ({ ...f, firstName: e.target.value }))} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Last Name <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={form.lastName || ''} onChange={(e) => setForm(f => ({ ...f, lastName: e.target.value }))} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Department <span style={{ color: '#dc2626' }}>*</span></label>
                <select value={form.department || ''} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} className={inputClass} style={inputStyle}>
                  <option value="">Select Department</option>
                  {mockDepartments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Position</label>
                <select value={form.position || ''} onChange={(e) => setForm(f => ({ ...f, position: e.target.value }))} className={inputClass} style={inputStyle}>
                  <option value="">Select Position</option>
                  {mockPositions.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Employee Type</label>
                <select value={(form as { employeeType?: string }).employeeType || 'Official'} onChange={(e) => setForm(f => ({ ...f, employeeType: e.target.value }))} className={inputClass} style={inputStyle}>
                  {employeeTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Hired Date</label>
                <input type="date" value={form.hiredDate || ''} onChange={(e) => setForm(f => ({ ...f, hiredDate: e.target.value }))} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Status</label>
                <select value={form.status || 'active'} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as Employee['status'] }))} className={inputClass} style={inputStyle}>
                  <option value="active">Active</option>
                  <option value="probation">Probation</option>
                  <option value="resigned">Resigned</option>
                </select>
              </div>
            </div>
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-24 h-28 rounded-xl flex flex-col items-center justify-center cursor-pointer" style={{ background: isDark ? '#374151' : '#f3f4f6', border: `2px dashed ${border}` }}>
                <i className="ri-user-line text-3xl mb-1" style={{ color: textSecondary }}></i>
                <span className="text-xs" style={{ color: textSecondary }}>Photo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-6 pt-3 overflow-x-auto" style={{ borderBottom: `1px solid ${border}` }}>
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-4 py-2 text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
              style={{
                color: activeTab === tab ? '#16a34a' : textSecondary,
                borderBottom: activeTab === tab ? '2px solid #16a34a' : '2px solid transparent',
              }}>
              {tab === 'Biometrics' && <i className="ri-fingerprint-line mr-1"></i>}
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {activeTab === 'Profile' && (
            <div className="space-y-4">
              <div>
                <label style={{ ...labelStyle, marginBottom: '8px' }}>
                  Attendance Locations <span style={{ color: '#dc2626' }}>*</span>
                  <span className="ml-2 font-normal" style={{ color: textSecondary }}>— Employee can punch from any selected location</span>
                </label>
                <LocationSearchSelect
                  selectedAreas={selectedAreas}
                  onToggle={toggleArea}
                  isDark={isDark}
                  border={border}
                  textPrimary={textPrimary}
                  textSecondary={textSecondary}
                  inputBg={inputBg}
                />
              </div>
            </div>
          )}

          {activeTab === 'Private Info' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Gender</label>
                <select value={form.gender || ''} onChange={(e) => setForm(f => ({ ...f, gender: e.target.value }))} className={inputClass} style={inputStyle}>
                  <option value="">Select Gender</option>
                  {genders.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Date of Birth</label>
                <input type="date" value={(form as { dateOfBirth?: string }).dateOfBirth || ''} onChange={(e) => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={form.email || ''} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="employee@eatngo.com" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Mobile</label>
                <input value={form.mobile || ''} onChange={(e) => setForm(f => ({ ...f, mobile: e.target.value }))} placeholder="080XXXXXXXX" className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Employment Type</label>
                <select value={form.employmentType || ''} onChange={(e) => setForm(f => ({ ...f, employmentType: e.target.value }))} className={inputClass} style={inputStyle}>
                  {['Full-Time', 'Part-Time', 'Contract', 'Intern', 'Temporary'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
          )}

          {activeTab === 'Device Access' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl" style={{ background: isDark ? '#374151' : '#f9fafb', border: `1px solid ${border}` }}>
                <p className="text-sm font-medium mb-4" style={{ color: textPrimary }}>Biometric Authentication Methods</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium" style={{ color: textPrimary }}>Fingerprint Access</p>
                      <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Allow fingerprint authentication on all assigned devices</p>
                    </div>
                    <Toggle enabled={fpEnabled} onToggle={() => setFpEnabled(!fpEnabled)} />
                  </div>
                  <div className="flex items-center justify-between" style={{ paddingTop: '12px', borderTop: `1px solid ${border}` }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: textPrimary }}>Face Recognition</p>
                      <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Allow face recognition on all assigned devices</p>
                    </div>
                    <Toggle enabled={faceEnabled} onToggle={() => setFaceEnabled(!faceEnabled)} />
                  </div>
                </div>
              </div>
              {selectedAreas.length > 0 && (
                <div className="p-4 rounded-xl" style={{ background: isDark ? '#374151' : '#f9fafb', border: `1px solid ${border}` }}>
                  <p className="text-sm font-medium mb-3" style={{ color: textPrimary }}>Access Granted to Locations</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedAreas.map(area => (
                      <span key={area} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: '#dcfce7', color: '#16a34a' }}>
                        <i className="ri-map-pin-line text-xs"></i>{area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Attendance Settings' && (
            <div className="p-4 rounded-xl" style={{ background: isDark ? '#374151' : '#f9fafb', border: `1px solid ${border}` }}>
              <p className="text-sm font-medium mb-3" style={{ color: textPrimary }}>Attendance Configuration</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Work Schedule</label>
                  <select className={inputClass} style={inputStyle}>
                    <option>Standard (8AM - 5PM)</option>
                    <option>Early Shift (6AM - 3PM)</option>
                    <option>Late Shift (2PM - 11PM)</option>
                    <option>Night Shift (10PM - 7AM)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Late Threshold (minutes)</label>
                  <input type="number" defaultValue={15} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Overtime Threshold (hours)</label>
                  <input type="number" defaultValue={9} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Attendance Rule</label>
                  <select className={inputClass} style={inputStyle}>
                    <option>Standard</option>
                    <option>Flexible</option>
                    <option>Shift-based</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Biometrics' && (
            <BiometricsTab
              isDark={isDark}
              border={border}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
              inputBg={inputBg}
              cardBg={bg}
            />
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: `1px solid ${border}` }}>
          <p className="text-xs" style={{ color: textSecondary }}>
            {selectedAreas.length > 0 ? (
              <><i className="ri-map-pin-line mr-1" style={{ color: '#16a34a' }}></i>{selectedAreas.length} location{selectedAreas.length !== 1 ? 's' : ''} selected</>
            ) : (
              <><i className="ri-information-line mr-1"></i>Select at least one attendance location</>
            )}
          </p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium" style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}>Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white" style={{ background: '#16a34a' }}>
              {editEmployee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
