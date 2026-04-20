import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/Components/base/Toast';
import type { PageProps, AttendanceRecord } from '@/types';

interface Props extends PageProps {
    records: AttendanceRecord[];
    date: string;
    summary: { present: number; late: number; absent: number; halfDay: number };
    departments: string[];
    areas: string[];
    filters: { search?: string; department?: string; area?: string; status?: string };
}

export default function Index() {
    const { props } = usePage<Props>();
    const { records, date, summary, departments, areas, filters } = props;
    const { isDark } = useTheme();
    const { showToast } = useToast();

    const [search, setSearch]         = useState(filters.search ?? '');
    const [dateFilter, setDateFilter] = useState(date);
    const [statusFilter, setStatusFilter] = useState(filters.status ?? 'all');
    const [selected, setSelected]     = useState<number[]>([]);

    const bg = isDark ? '#111827' : '#f8fafc';
    const cardBg = isDark ? '#1f2937' : '#ffffff';
    const border = isDark ? '#374151' : '#e5e7eb';
    const textPrimary = isDark ? '#f9fafb' : '#111827';
    const textSecondary = isDark ? '#9ca3af' : '#6b7280';

    const applyFilters = (overrides: Record<string, string> = {}) => {
        router.get('/attendance', { date: dateFilter, search, status: statusFilter, ...overrides }, { preserveState: true, preserveScroll: true });
    };

    const toggleSelect = (id: number) => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleAll    = () => setSelected(prev => prev.length === records.length ? [] : records.map(r => r.id));

    const statusBadge = (status: AttendanceRecord['status']) => {
        const map = { present: { bg: '#dcfce7', color: '#16a34a', label: 'Present' }, late: { bg: '#fef9c3', color: '#ca8a04', label: 'Late' }, absent: { bg: '#fee2e2', color: '#dc2626', label: 'Absent' }, 'half-day': { bg: '#e0f2fe', color: '#0284c7', label: 'Half Day' } };
        const s = map[status];
        return <span className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap" style={{ background: s.bg, color: s.color }}>{s.label}</span>;
    };

    const punchIcon = (type: string) => {
        const map: Record<string, string> = { fingerprint: 'ri-fingerprint-line', face: 'ri-user-smile-line', card: 'ri-bank-card-line', password: 'ri-lock-password-line' };
        return <i className={`${map[type] ?? 'ri-question-line'} text-sm`} style={{ color: textSecondary }} title={type}></i>;
    };

    const avatarColors = ['#16a34a', '#0891b2', '#7c3aed', '#d97706', '#dc2626', '#db2777'];
    const getAvatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];
    const getInitials    = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <AppLayout title="Attendance" subtitle="Real-time attendance records from all devices">
            <Head title="Attendance" />

            <div style={{ background: bg, minHeight: '100vh' }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>Attendance</h1>
                        <p className="text-sm mt-0.5" style={{ color: textSecondary }}>Showing {records.length} records for {dateFilter}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => showToast('success', 'Export Started', 'Attendance data is being exported')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap" style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }}>
                            <i className="ri-download-line"></i> Export
                        </button>
                        <button onClick={() => { router.reload(); showToast('info', 'Sync Triggered', 'Pulling latest records from all devices'); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap hover:opacity-90" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                            <i className="ri-refresh-line"></i> Sync Now
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Present',  value: summary.present,  color: '#16a34a', bg: '#dcfce7', icon: 'ri-checkbox-circle-line' },
                        { label: 'Late',     value: summary.late,     color: '#ca8a04', bg: '#fef9c3', icon: 'ri-time-line' },
                        { label: 'Absent',   value: summary.absent,   color: '#dc2626', bg: '#fee2e2', icon: 'ri-close-circle-line' },
                        { label: 'Half Day', value: summary.halfDay,  color: '#0284c7', bg: '#e0f2fe', icon: 'ri-calendar-line' },
                    ].map(s => (
                        <div key={s.label} className="p-5 rounded-xl flex items-center gap-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                                <i className={`${s.icon} text-xl`} style={{ color: s.color }}></i>
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{ color: textSecondary }}>{s.label}</p>
                                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="relative">
                        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: textSecondary }}></i>
                        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && applyFilters({ search })} placeholder="Search employees..." className="pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none w-56" style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }} />
                    </div>
                    <div className="flex items-center gap-2">
                        <i className="ri-calendar-line text-sm" style={{ color: textSecondary }}></i>
                        <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); applyFilters({ date: e.target.value }); }} className="px-3 py-2.5 rounded-xl text-sm outline-none" style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }} />
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: isDark ? '#374151' : '#f3f4f6' }}>
                        {['all', 'present', 'late', 'absent', 'half-day'].map(s => (
                            <button key={s} onClick={() => { setStatusFilter(s); applyFilters({ status: s }); }} className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap capitalize transition-colors"
                                style={{ background: statusFilter === s ? (isDark ? '#1f2937' : '#ffffff') : 'transparent', color: statusFilter === s ? textPrimary : textSecondary }}>
                                {s === 'all' ? 'All' : s === 'half-day' ? 'Half Day' : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${border}` }}>
                                    <th className="px-4 py-3 w-10"><input type="checkbox" checked={selected.length === records.length && records.length > 0} onChange={toggleAll} className="cursor-pointer" /></th>
                                    {['Employee', 'ID', 'Department', 'Area', 'Device', 'Date', 'Check In', 'Check Out', 'Hours', 'Type', 'Status'].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {records.map(r => (
                                    <tr key={r.id} style={{ borderBottom: `1px solid ${border}` }}
                                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? '#374151' : '#f9fafb'; }}
                                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}>
                                        <td className="px-4 py-3"><input type="checkbox" checked={selected.includes(r.id)} onChange={() => toggleSelect(r.id)} className="cursor-pointer" /></td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: getAvatarColor(r.employeeName) }}>{getInitials(r.employeeName)}</div>
                                                <button onClick={() => router.visit(`/employees`)} className="text-sm font-medium cursor-pointer hover:underline whitespace-nowrap" style={{ color: '#16a34a' }}>{r.employeeName}</button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{r.employeeId}</td>
                                        <td className="px-4 py-3 text-sm" style={{ color: textPrimary }}>{r.department}</td>
                                        <td className="px-4 py-3 text-sm" style={{ color: textSecondary }}>{r.area}</td>
                                        <td className="px-4 py-3 text-xs" style={{ color: textSecondary }}>{r.device}</td>
                                        <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{r.date}</td>
                                        <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: '#16a34a' }}>{r.checkIn || '-'}</td>
                                        <td className="px-4 py-3 text-sm font-mono font-semibold" style={{ color: '#dc2626' }}>{r.checkOut || '-'}</td>
                                        <td className="px-4 py-3 text-sm font-medium" style={{ color: textPrimary }}>{r.workHours}</td>
                                        <td className="px-4 py-3">{punchIcon(r.punchType)}</td>
                                        <td className="px-4 py-3">{statusBadge(r.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {records.length === 0 && (
                        <div className="py-16 text-center" style={{ color: textSecondary }}>
                            <i className="ri-time-line text-4xl mb-3 block"></i>
                            <p className="text-sm">No attendance records found for {dateFilter}</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
