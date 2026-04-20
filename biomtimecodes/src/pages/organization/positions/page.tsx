import { useState } from "react";
import DashboardLayout from "@/components/feature/DashboardLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/base/Toast";
import Modal from "@/components/base/Modal";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import { mockPositions, type Position } from "@/mocks/organization";

export default function PositionsPage() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [positions, setPositions] = useState<Position[]>(mockPositions);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Position | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ code: '', name: '' });

  const bg = isDark ? '#111827' : '#f8fafc';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#374151' : '#f9fafb';
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
  const labelStyle = { color: textSecondary, fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' };

  const filtered = positions.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({ code: '', name: '' }); setEditItem(null); setShowModal(true); };
  const openEdit = (p: Position) => { setForm({ code: p.code, name: p.name }); setEditItem(p); setShowModal(true); };

  const handleSave = () => {
    if (!form.code || !form.name) { showToast('error', 'Validation Error', 'Code and Name are required'); return; }
    if (editItem) {
      setPositions(prev => prev.map(p => p.id === editItem.id ? { ...p, ...form } : p));
      showToast('success', 'Position Updated', `${form.name} updated successfully`);
    } else {
      setPositions(prev => [...prev, { id: `p${Date.now()}`, ...form, employeeQty: 0 }]);
      showToast('success', 'Position Created', `${form.name} has been added`);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const p = positions.find(x => x.id === id);
    setPositions(prev => prev.filter(x => x.id !== id));
    showToast('success', 'Position Deleted', `${p?.name} removed`);
  };

  return (
    <DashboardLayout>
      <div className="p-6" style={{ background: bg, minHeight: '100vh' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>Positions</h1>
            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>{positions.length} positions defined</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap hover:opacity-90" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <i className="ri-add-line"></i> Add Position
          </button>
        </div>

        <div className="relative max-w-sm mb-4">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: textSecondary }}></i>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search positions..." className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }} />
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {['Position Code', 'Position Name', 'Employee Qty.', ''].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold" style={{ color: textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${border}` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? '#374151' : '#f9fafb'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td className="px-6 py-4">
                    <button onClick={() => openEdit(p)} className="text-sm font-medium cursor-pointer hover:underline" style={{ color: '#16a34a' }}>{p.code}</button>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium" style={{ color: textPrimary }}>{p.name}</td>
                  <td className="px-6 py-4 text-sm font-semibold" style={{ color: textPrimary }}>{p.employeeQty}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#4b5563' : '#f3f4f6'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button onClick={() => setDeleteId(p.id)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: '#dc2626' }}
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
              <i className="ri-briefcase-line text-4xl mb-3 block"></i>
              <p className="text-sm">No positions found</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Position' : 'Add Position'} size="sm"
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
            <label style={labelStyle}>Position Code <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. CASHIER" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Position Name <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Cashier" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && handleDelete(deleteId)} title="Delete Position" message="Are you sure you want to delete this position?" confirmLabel="Delete" danger />
    </DashboardLayout>
  );
}
