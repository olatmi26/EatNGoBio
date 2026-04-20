import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppLayout from '@/Layouts/AppLayout';
import StatCard from './Components/StatCard';
import { PageProps } from '@/types';
import { route } from 'ziggy-js';

interface DashboardProps extends PageProps {
    stats: {
        total_assets: number;
        active_assets: number;
        open_tickets: number;
        active_alerts: number;
        hardware_assets: number;
        software_licenses: number;
        in_maintenance: number;
        it_officers: number;
        total_value: number;
    };
    tickets: any[];
    alerts: any[];
    assets: any[];
    users: any[];
}

const areaData = [
    { month: 'Jul', hardware: 42, software: 18, licenses: 12 },
    { month: 'Aug', hardware: 45, software: 20, licenses: 13 },
    { month: 'Sep', hardware: 48, software: 22, licenses: 14 },
    { month: 'Oct', hardware: 50, software: 24, licenses: 15 },
    { month: 'Nov', hardware: 53, software: 25, licenses: 15 },
    { month: 'Dec', hardware: 55, software: 27, licenses: 15 },
];

const priorityColors: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700',
    High: 'bg-orange-100 text-orange-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-slate-100 text-slate-600',
};

const severityColors: Record<string, string> = {
    Critical: 'text-red-500',
    High: 'text-orange-500',
    Medium: 'text-amber-500',
    Low: 'text-slate-400',
};

export default function Dashboard({ stats, tickets, alerts, assets }: DashboardProps) {
    const [activeRole, setActiveRole] = useState<'super' | 'admin' | 'officer'>('super');

    const statusData = [
        { name: 'Active',      value: assets.filter(a => a.status === 'Active').length,      color: '#10b981' },
        { name: 'Maintenance', value: assets.filter(a => a.status === 'Maintenance').length, color: '#f59e0b' },
        { name: 'Retired',     value: assets.filter(a => a.status === 'Retired').length,     color: '#94a3b8' },
        { name: 'Inactive',    value: assets.filter(a => a.status === 'Inactive').length,    color: '#ef4444' },
    ];

    const locationData = Object.entries(
        assets.reduce((acc: Record<string, number>, a: any) => {
            const loc = a.location?.name ?? 'Unknown';
            acc[loc] = (acc[loc] || 0) + 1;
            return acc;
        }, {})
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([name, count]) => ({ name: name.length > 10 ? name.slice(0, 9) + '…' : name, assets: count }));

    return (
        <AppLayout>
            <Head title="Dashboard" />
            <div className="space-y-6">
                {/* Role Switcher */}
                <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl p-1 w-fit">
                    {[
                        { key: 'super',   label: 'Super Admin', icon: 'ri-shield-star-fill',    href: route('dashboard') },
                        { key: 'admin',   label: 'IT Admin',    icon: 'ri-admin-fill',           href: route('admin.dashboard') },
                        { key: 'officer', label: 'IT Officer',  icon: 'ri-user-settings-fill',   href: route('officer.dashboard') },
                    ].map((r) => (
                        <Link
                            key={r.key}
                            href={r.href}
                            onClick={() => setActiveRole(r.key as any)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap ${
                                activeRole === r.key ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            <i className={`${r.icon} text-sm`}></i>
                            {r.label}
                        </Link>
                    ))}
                </div>

                {/* Stat Cards Row 1 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Total Assets"   value={stats.total_assets}   change="+3 this month"       changeType="up"      icon="ri-computer-fill"      iconBg="bg-emerald-50"  iconColor="text-emerald-600" subtitle="Across all locations" />
                    <StatCard title="Active Assets"  value={stats.active_assets}  change="87% utilization"    changeType="neutral" icon="ri-checkbox-circle-fill" iconBg="bg-blue-50"   iconColor="text-blue-600"    subtitle="Currently in use" />
                    <StatCard title="Open Tickets"   value={stats.open_tickets}   change="+2 since yesterday" changeType="down"    icon="ri-ticket-2-fill"      iconBg="bg-orange-50"   iconColor="text-orange-600"  subtitle="Needs attention" />
                    <StatCard title="Active Alerts"  value={stats.active_alerts}  change="2 critical"         changeType="down"    icon="ri-alarm-warning-fill" iconBg="bg-red-50"      iconColor="text-red-600"     subtitle="Maintenance & warranty" />
                </div>

                {/* Stat Cards Row 2 */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Hardware Assets"    value={stats.hardware_assets}   icon="ri-server-fill"        iconBg="bg-slate-100"   iconColor="text-slate-600"   subtitle="Physical devices" />
                    <StatCard title="Software Licenses"  value={stats.software_licenses} icon="ri-code-box-fill"       iconBg="bg-purple-50"   iconColor="text-purple-600"  subtitle="Active licenses" />
                    <StatCard title="In Maintenance"     value={stats.in_maintenance}    icon="ri-tools-fill"          iconBg="bg-amber-50"    iconColor="text-amber-600"   subtitle="Under service" />
                    <StatCard title="IT Officers"        value={stats.it_officers}       icon="ri-user-settings-fill"  iconBg="bg-teal-50"     iconColor="text-teal-600"    subtitle="Active staff" />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-slate-800">Asset Growth Trend</h3>
                                <p className="text-xs text-slate-400">Last 6 months</p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>Hardware</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>Software</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>Licenses</span>
                            </div>
                        </div>
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={areaData}>
                                <defs>
                                    <linearGradient id="hw" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="sw" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                <Area type="monotone" dataKey="hardware" stroke="#10b981" strokeWidth={2} fill="url(#hw)" />
                                <Area type="monotone" dataKey="software" stroke="#60a5fa" strokeWidth={2} fill="url(#sw)" />
                                <Area type="monotone" dataKey="licenses" stroke="#fbbf24" strokeWidth={2} fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 p-5">
                        <h3 className="text-sm font-semibold text-slate-800 mb-1">Asset Status</h3>
                        <p className="text-xs text-slate-400 mb-4">Distribution overview</p>
                        <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-2 mt-2">
                            {statusData.map((s) => (
                                <div key={s.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: s.color }}></span>
                                        <span className="text-xs text-slate-600">{s.name}</span>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-700">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-slate-100 p-5">
                        <h3 className="text-sm font-semibold text-slate-800 mb-1">Assets by Location</h3>
                        <p className="text-xs text-slate-400 mb-4">Top locations</p>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={locationData} barSize={14}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                                <Bar dataKey="assets" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">Recent Tickets</h3>
                            <Link href={route('tickets.index')} className="text-xs text-emerald-600 font-medium hover:underline">View all</Link>
                        </div>
                        <div className="space-y-3">
                            {tickets.slice(0, 4).map((t: any) => (
                                <div key={t.id} className="flex items-start gap-3">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0 mt-0.5 ${priorityColors[t.priority]}`}>{t.priority}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-700 truncate">{t.title}</p>
                                        <p className="text-xs text-slate-400">{t.requester?.name ?? t.requester} · {t.created_at?.slice(0,10)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-100 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-slate-800">Active Alerts</h3>
                            <Link href={route('alerts.index')} className="text-xs text-emerald-600 font-medium hover:underline">View all</Link>
                        </div>
                        <div className="space-y-3">
                            {alerts.filter((a: any) => a.status === 'Active').slice(0, 4).map((a: any) => (
                                <div key={a.id} className="flex items-start gap-3">
                                    <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                                        <i className={`ri-alarm-warning-fill ${severityColors[a.severity]} text-base`}></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-700 truncate">{a.title}</p>
                                        <p className="text-xs text-slate-400 truncate">{a.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
