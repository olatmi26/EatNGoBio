import { useState } from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/Components/base/Toast';
import Modal from '@/Components/base/Modal';
import ConfirmDialog from '@/Components/base/ConfirmDialog';

const timezones = ['Africa/Lagos', 'Africa/Nairobi', 'Africa/Cairo', 'UTC', 'Europe/London', 'America/New_York'];

type Area = {
  id: string;
  code: string;
  name: string;
  timezone: string;
  devices: number;
  employees: number;
};

interface PageProps {
  areas: Area[];
}

export default function AreasPage() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const { props } = usePage<PageProps>();
  const [areas, setAreas] = useState<Area[]>(props.areas ?? []);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Area | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '', timezone: 'Africa/Lagos' });
  const [areaPage, setAreaPage] = useState(1);
  const AREA_PAGE_SIZE = 15;

  const bg = isDark ? '#111827' : '#f8fafc';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#374151' : '#f9fafb';
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
  const labelStyle = { color: textSecondary, fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' };

  const filtered = areas.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({ code: '', name: '', timezone: 'Africa/Lagos' }); setEditItem(null); setShowModal(true); };
  const openEdit = (a: Area) => { setForm({ code: a.code, name: a.name, timezone: a.timezone }); setEditItem(a); setShowModal(true); };

  const handleSave = () => {
    if (!form.code || !form.name) { showToast('error', 'Validation Error', 'Code and Name are required'); return; }
    if (editItem) {
      setAreas(prev => prev.map(a => a.id === editItem.id ? { ...a, ...form } : a));
      showToast('success', 'Area Updated', `${form.name} updated successfully`);
    } else {
      setAreas(prev => [...prev, { id: `a${Date.now()}`, ...form, devices: 0, employees: 0 }]);
      showToast('success', 'Area Created', `${form.name} has been added`);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const a = areas.find(x => x.id === id);
    setAreas(prev => prev.filter(x => x.id !== id));
    showToast('success', 'Area Deleted', `${a?.name} removed`);
  };

  return (
    <AppLayout title="">
      <div className="p-6" style={{ background: bg, minHeight: '100vh' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>Areas</h1>
            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>{areas.length} areas configured · Manage location zones</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap hover:opacity-90" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <i className="ri-add-line"></i> Add Area
          </button>
        </div>

        <div className="relative max-w-sm mb-4">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: textSecondary }}></i>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search areas..." className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }} />
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {['Area Code', 'Area Name', 'Timezone', 'Devices', 'Employees', ''].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold" style={{ color: textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${border}` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? '#374151' : '#f9fafc'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td className="px-6 py-4">
                    <button onClick={() => openEdit(a)} className="text-sm font-medium cursor-pointer hover:underline" style={{ color: '#16a34a' }}>{a.code}</button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center" style={{ color: textSecondary }}>
                        <i className="ri-map-pin-line text-xs"></i>
                      </div>
                      <span className="text-sm font-medium" style={{ color: textPrimary }}>{a.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm" style={{ color: textSecondary }}>{a.timezone}</td>
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: textPrimary }}>{a.devices}</td>
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: textPrimary }}>{a.employees}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(a)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#4b5563' : '#f3f4f6'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button onClick={() => setDeleteId(a.id)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: '#dc2626' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <i className="ri-delete-bin-line text-sm"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center" style={{ color: textSecondary }}>
              <i className="ri-map-pin-line text-4xl mb-3 block"></i>
              <p className="text-sm">No areas found</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Area' : 'Add Area'} size="sm"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium" style={{ background: isDark ? '#374151' : '#f3f4f6', color: textSecondary }}>Cancel</button>
            <button onClick={handleSave} className="px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white" style={{ background: '#16a34a' }}>
              {editItem ? 'Save Changes' : 'Confirm'}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>Area Code <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. LEKKI STORE" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Area Name <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Lekki Store" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Timezone</label>
            <select value={form.timezone} onChange={(e) => setForm(f => ({ ...f, timezone: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
              {timezones.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>
      </Modal>


      {/* Pagination */}
      {(() => {
        const source = search ? filteredAreas : areas;
        const totalAreaPages = Math.ceil(source.length / AREA_PAGE_SIZE);
        if (totalAreaPages <= 1) return null;
        return (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${border}` }}>
            <p className="text-xs" style={{ color: textSecondary }}>
              Showing {(areaPage - 1) * AREA_PAGE_SIZE + 1}–{Math.min(areaPage * AREA_PAGE_SIZE, source.length)} of {source.length}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setAreaPage(p => Math.max(1, p - 1))} disabled={areaPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-xs cursor-pointer"
                style={{ background: areaPage === 1 ? 'transparent' : (isDark ? '#374151' : '#f3f4f6'), color: areaPage === 1 ? textSecondary : textPrimary, opacity: areaPage === 1 ? 0.4 : 1 }}>
                <i className="ri-arrow-left-s-line"></i>
              </button>
              {Array.from({ length: Math.min(5, totalAreaPages) }, (_, i) => {
                const p = totalAreaPages <= 5 ? i + 1 : Math.max(1, Math.min(totalAreaPages - 4, areaPage - 2)) + i;
                return (
                  <button key={p} onClick={() => setAreaPage(p)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer"
                    style={{ background: areaPage === p ? '#16a34a' : (isDark ? '#374151' : '#f3f4f6'), color: areaPage === p ? '#fff' : textPrimary }}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setAreaPage(p => Math.min(totalAreaPages, p + 1))} disabled={areaPage === totalAreaPages}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-xs cursor-pointer"
                style={{ background: areaPage === totalAreaPages ? 'transparent' : (isDark ? '#374151' : '#f3f4f6'), color: areaPage === totalAreaPages ? textSecondary : textPrimary, opacity: areaPage === totalAreaPages ? 0.4 : 1 }}>
                <i className="ri-arrow-right-s-line"></i>
              </button>
            </div>
          </div>
        );
      })()}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && handleDelete(deleteId)} title="Delete Area" message="Are you sure you want to delete this area?" confirmLabel="Delete" danger />
    </AppLayout>
  );
}
