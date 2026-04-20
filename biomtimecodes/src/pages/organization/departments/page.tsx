import { useState } from "react";
import DashboardLayout from "@/components/feature/DashboardLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/base/Toast";
import Modal from "@/components/base/Modal";
import ConfirmDialog from "@/components/base/ConfirmDialog";
import { mockDepartments, type Department } from "@/mocks/organization";

export default function DepartmentsPage() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [departments, setDepartments] = useState<Department[]>(mockDepartments);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<Department | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ code: '', name: '', superior: '', manager: '' });

  const bg = isDark ? '#111827' : '#f8fafc';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#374151' : '#f9fafb';
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
  const labelStyle = { color: textSecondary, fontSize: '12px', fontWeight: 500, marginBottom: '4px', display: 'block' };

  const filtered = departments.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setForm({ code: '', name: '', superior: '', manager: '' }); setEditItem(null); setShowModal(true); };
  const openEdit = (d: Department) => { setForm({ code: d.code, name: d.name, superior: d.superior, manager: d.manager }); setEditItem(d); setShowModal(true); };

  const handleSave = () => {
    if (!form.code || !form.name) { showToast('error', 'Validation Error', 'Code and Name are required'); return; }
    if (editItem) {
      setDepartments(prev => prev.map(d => d.id === editItem.id ? { ...d, ...form } : d));
      showToast('success', 'Department Updated', `${form.name} updated successfully`);
    } else {
      setDepartments(prev => [...prev, { id: `d${Date.now()}`, ...form, employeeQty: 0, resignedQty: 0 }]);
      showToast('success', 'Department Created', `${form.name} has been added`);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    const d = departments.find(x => x.id === id);
    setDepartments(prev => prev.filter(x => x.id !== id));
    showToast('success', 'Department Deleted', `${d?.name} removed`);
  };

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelected(prev => prev.length === filtered.length ? [] : filtered.map(d => d.id));

  return (
    <DashboardLayout>
      <div className="p-6" style={{ background: bg, minHeight: '100vh' }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>Departments</h1>
            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>{departments.length} departments · Manage organizational structure</p>
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap hover:opacity-90" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
            <i className="ri-add-line"></i> Add Department
          </button>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: textSecondary }}></i>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search departments..." className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none" style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }} />
          </div>
          {selected.length > 0 && (
            <button onClick={() => { selected.forEach(id => handleDelete(id)); setSelected([]); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              <i className="ri-delete-bin-line"></i> Delete ({selected.length})
            </button>
          )}
        </div>

        <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="cursor-pointer" />
                </th>
                {['Department Code', 'Department Name', 'Superior', 'Employee Qty.', 'Resigned Qty.', 'Department Manager', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} style={{ borderBottom: `1px solid ${border}` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? '#374151' : '#f9fafb'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggleSelect(d.id)} className="cursor-pointer" />
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(d)} className="text-sm font-medium cursor-pointer hover:underline" style={{ color: '#16a34a' }}>{d.code}</button>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium" style={{ color: textPrimary }}>{d.name}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: d.superior === '-' ? textSecondary : '#16a34a' }}>{d.superior}</td>
                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: textPrimary }}>{d.employeeQty}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: textSecondary }}>{d.resignedQty}</td>
                  <td className="px-4 py-3 text-sm" style={{ color: textSecondary }}>{d.manager}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(d)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? '#4b5563' : '#f3f4f6'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <i className="ri-edit-line text-sm"></i>
                      </button>
                      <button onClick={() => setDeleteId(d.id)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: '#dc2626' }}
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
              <i className="ri-building-2-line text-4xl mb-3 block"></i>
              <p className="text-sm">No departments found</p>
            </div>
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Department' : 'Add Department'} size="md"
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
            <label style={labelStyle}>Department Code <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={form.code} onChange={(e) => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. FINANCE" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Department Name <span style={{ color: '#dc2626' }}>*</span></label>
            <input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Finance Department" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Superior Department</label>
            <select value={form.superior} onChange={(e) => setForm(f => ({ ...f, superior: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle}>
              <option value="-">None</option>
              {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Department Manager</label>
            <input value={form.manager} onChange={(e) => setForm(f => ({ ...f, manager: e.target.value }))} placeholder="e.g. John Doe" className="w-full px-3 py-2 rounded-lg text-sm outline-none" style={inputStyle} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && handleDelete(deleteId)} title="Delete Department" message="Are you sure you want to delete this department?" confirmLabel="Delete" danger />
    </DashboardLayout>
  );
}
