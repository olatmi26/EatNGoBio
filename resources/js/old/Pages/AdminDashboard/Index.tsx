import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import {
    BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Props extends PageProps {
    assets: any[];
    tickets: any[];
    alerts: any[];
    users: any[];
    officerPerf: { name: string; tickets: number; resolved: number; assets: number }[];
    totalValue: number;
    activeAssets: number;
    openTickets: number;
    criticalAlerts: number;
    maintenanceCosts?: any[];
}

const assetValueData = [
    { month: 'Nov', value: 180000 }, { month: 'Dec', value: 195000 },
    { month: 'Jan', value: 210000 }, { month: 'Feb', value: 225000 },
    { month: 'Mar', value: 238000 }, { month: 'Apr', value: 252000 },
];

const recentSpend = [
    { asset: 'Cisco Catalyst 2960-X',  type: 'Repair',           cost: 110000, date: 'Apr 10', location: 'APAPA' },
    { asset: 'Dell PowerEdge R740',    type: 'Part Replacement',  cost: 135000, date: 'Apr 08', location: 'Head Office' },
    { asset: 'APC Smart-UPS 3000VA',   type: 'Part Replacement',  cost: 115000, date: 'Apr 07', location: 'FESTAC' },
    { asset: 'HP LaserJet Pro M428',   type: 'Repair',            cost: 63000,  date: 'Apr 05', location: 'BODIJA' },
];

const budgetCategories = [
    { label: 'Networking', spent: 190000, budget: 300000, color: 'bg-emerald-500' },
    { label: 'Servers',    spent: 157000, budget: 250000, color: 'bg-amber-400' },
    { label: 'Power / UPS',spent: 115000, budget: 150000, color: 'bg-red-400' },
    { label: 'Printers',   spent: 113000, budget: 200000, color: 'bg-emerald-500' },
    { label: 'CCTV',       spent: 85000,  budget: 100000, color: 'bg-red-400' },
    { label: 'Laptops',    spent: 38000,  budget: 200000, color: 'bg-emerald-500' },
];

const fmt = (v: number) => `₦${v.toLocaleString('en-NG')}`;
const fmtK = (v: number) => `₦${(v / 1000).toFixed(0)}K`;

export default function AdminDashboard({ assets, tickets, alerts, users, officerPerf, totalValue, activeAssets, openTickets, criticalAlerts }: Props) {
    const categoryData = Object.entries(
        assets.reduce((acc: Record<string, number>, a: any) => {
            const k = a.category?.name ?? 'Other';
            acc[k] = (acc[k] ?? 0) + 1;
            return acc;
        }, {})
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value], i) => ({
            name, value,
            color: ['#10b981', '#f59e0b', '#8b5cf6', '#3b82f6', '#94a3b8'][i],
        }));

    const locationHealth = Object.entries(
        assets.reduce((acc: Record<string, { count: number; issues: number }>, a: any) => {
            const loc = a.location?.name ?? 'Unknown';
            if (!acc[loc]) acc[loc] = { count: 0, issues: 0 };
            acc[loc].count++;
            if (a.status === 'Maintenance' || a.status === 'Inactive') acc[loc].issues++;
            return acc;
        }, {})
    )
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([name, d]) => ({
            name,
            assets: d.count,
            issues: d.issues,
            health: Math.max(0, Math.min(100, 100 - d.issues * 8)),
        }));

    const budgetUsed = 1456000;
    const budgetTotal = 2000000;
    const budgetPct = Math.round((budgetUsed / budgetTotal) * 100);

    const kpiCards = [
        { label: 'Total Asset Value',  value: fmtK(totalValue),                  icon: 'ri-money-dollar-circle-fill', color: 'bg-emerald-50 text-emerald-600', sub: 'Across all categories' },
        { label: 'Active Assets',      value: `${activeAssets}/${assets.length}`, icon: 'ri-checkbox-circle-fill',     color: 'bg-blue-50 text-blue-600',       sub: `${assets.length ? Math.round((activeAssets / assets.length) * 100) : 0}% utilization` },
        { label: 'Open Tickets',       value: openTickets,                        icon: 'ri-ticket-2-fill',             color: 'bg-orange-50 text-orange-600',   sub: `${criticalAlerts} critical alerts` },
        { label: 'IT Officers',        value: users.filter((u: any) => u.roles?.includes?.('IT Officer')).length || officerPerf.length, icon: 'ri-user-settings-fill', color: 'bg-teal-50 text-teal-600', sub: 'Active staff' },
    ];

    return (
        <AppLayout>
            <Head title="IT Admin Dashboard" />
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-slate-800">IT Admin Dashboard</h1>
                        <p className="text-sm text-slate-400 mt-0.5">Infrastructure overview · {new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white hover:bg-slate-50 cursor-pointer whitespace-nowrap font-medium text-slate-600">
                        <i className="ri-download-2-line text-slate-500"></i>Export Report
                    </button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {kpiCards.map(s => (
                        <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                                    <i className={`${s.icon} text-lg`}></i>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
                            <p className="text-xs font-semibold text-slate-600 mt-0.5">{s.label}</p>
                            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Area Chart - Asset Portfolio Value */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
                        <h3 className="text-sm font-bold text-slate-800 mb-1">Asset Portfolio Value</h3>
                        <p className="text-xs text-slate-400 mb-4">Total value trend (₦)</p>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={assetValueData}>
                                <defs>
                                    <linearGradient id="val" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v: number) => [fmt(v), 'Value']} />
                                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fill="url(#val)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Pie Chart - By Category */}
                    <div className="bg-white rounded-xl border border-slate-100 p-5">
                        <h3 className="text-sm font-bold text-slate-800 mb-1">Assets by Category</h3>
                        <p className="text-xs text-slate-400 mb-3">Distribution</p>
                        <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5 mt-2">
                            {categoryData.map(c => (
                                <div key={c.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }}></span>
                                        <span className="text-xs text-slate-600">{c.name}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">{c.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Officer Performance + Location Health */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800">IT Officer Performance</h3>
                            <p className="text-xs text-slate-400 mt-0.5">This month</p>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {officerPerf.map(o => (
                                <div key={o.name} className="flex items-center gap-4 px-5 py-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                        {o.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800">{o.name}</p>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-xs text-slate-400">{o.tickets} tickets</span>
                                            <span className="text-xs text-emerald-600 font-medium">{o.resolved} resolved</span>
                                            <span className="text-xs text-slate-400">{o.assets} assets</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-slate-800">{o.tickets > 0 ? Math.round((o.resolved / o.tickets) * 100) : 0}%</p>
                                        <p className="text-xs text-slate-400">resolution</p>
                                    </div>
                                </div>
                            ))}
                            {officerPerf.length === 0 && (
                                <div className="px-5 py-8 text-center text-xs text-slate-400">No officer data available</div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800">Location Health</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Infrastructure status by site</p>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {locationHealth.map(l => (
                                <div key={l.name} className="px-5 py-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.health >= 95 ? 'bg-emerald-500' : l.health >= 85 ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                            <span className="text-sm font-medium text-slate-700">{l.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-slate-400">{l.assets} assets</span>
                                            {l.issues > 0 && <span className="text-red-500 font-medium">{l.issues} issue{l.issues > 1 ? 's' : ''}</span>}
                                            <span className={`font-bold ${l.health >= 95 ? 'text-emerald-600' : l.health >= 85 ? 'text-amber-600' : 'text-red-600'}`}>{l.health}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                                        <div className={`h-1.5 rounded-full transition-all ${l.health >= 95 ? 'bg-emerald-500' : l.health >= 85 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${l.health}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Maintenance Cost vs Budget */}
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-bold text-slate-800">Maintenance Cost vs Budget</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })} · Real-time spend tracking</p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${budgetPct >= 85 ? 'bg-red-100 text-red-700' : budgetPct >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{budgetPct}% Used</span>
                    </div>
                    <div className="p-5 space-y-4">
                        {/* Overall bar */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-slate-600">Overall Budget</span>
                                <div className="flex items-center gap-3 text-xs">
                                    <span className="text-slate-500">Spent: <strong className="text-slate-800">{fmt(budgetUsed)}</strong></span>
                                    <span className="text-slate-400">Budget: <strong className="text-slate-600">{fmt(budgetTotal)}</strong></span>
                                    <span className="text-slate-400">Remaining: <strong className="text-emerald-600">{fmt(budgetTotal - budgetUsed)}</strong></span>
                                </div>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all ${budgetPct >= 85 ? 'bg-red-400' : budgetPct >= 70 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${budgetPct}%` }}></div>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                                <span>₦0</span>
                                <span className="text-amber-600 font-semibold">{budgetPct}% of annual budget used</span>
                                <span>{fmt(budgetTotal)}</span>
                            </div>
                        </div>

                        {/* Category breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2">
                            {budgetCategories.map(cat => {
                                const pct = Math.round((cat.spent / cat.budget) * 100);
                                const isOver = pct >= 85;
                                return (
                                    <div key={cat.label} className={`p-3 rounded-xl border ${isOver ? 'border-red-100 bg-red-50/30' : 'border-slate-100 bg-slate-50'}`}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-xs font-semibold text-slate-700">{cat.label}</span>
                                            <span className={`text-[10px] font-bold ${isOver ? 'text-red-600' : 'text-slate-600'}`}>{pct}%</span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                                        </div>
                                        <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400">
                                            <span>₦{(cat.spent / 1000).toFixed(0)}k spent</span>
                                            <span>₦{(cat.budget / 1000).toFixed(0)}k budget</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Recent spend */}
                        <div className="border-t border-slate-100 pt-4">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Maintenance Spend</p>
                            <div className="space-y-2">
                                {recentSpend.map((r, i) => (
                                    <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-50 flex-shrink-0">
                                                <i className="ri-tools-line text-amber-600 text-xs"></i>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-700 truncate">{r.asset}</p>
                                                <p className="text-[10px] text-slate-400">{r.type} · {r.location} · {r.date}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-800 whitespace-nowrap ml-3">{fmt(r.cost)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Alerts */}
                <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">Recent Alerts</h3>
                        <Link href={route('alerts.index')} className="text-xs text-emerald-600 font-medium hover:underline cursor-pointer">View all</Link>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/80">
                                    {['Severity', 'Alert', 'Asset', 'Officer', 'Date', 'Status'].map(h => (
                                        <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {alerts.slice(0, 5).map((a: any) => (
                                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.severity === 'Critical' ? 'bg-red-100 text-red-700' : a.severity === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>{a.severity}</span>
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-800 text-sm">{a.title}</td>
                                        <td className="px-4 py-3 text-xs font-mono text-slate-500">{a.asset?.asset_code ?? a.asset?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs text-slate-600">{a.officer?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{a.alert_date?.slice(0, 10)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'Active' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{a.status}</span>
                                        </td>
                                    </tr>
                                ))}
                                {alerts.length === 0 && (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">No alerts found</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}