import { Head } from '@inertiajs/react';
import { usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import DeviceStatusGrid from './components/DeviceStatusGrid';
import AttendanceChart from './components/AttendanceChart';
import LiveFeed from './components/LiveFeed';
import DeptBreakdown from './components/DeptBreakdown';
import WeeklyTrendChart from './components/WeeklyTrendChart';
import AlertsWidget from './components/AlertsWidget';
import type { PageProps, DeviceItem, LiveFeedEntry, Notification } from '@/types';

interface DashboardStats {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    checkInsToday: number;
    checkInsTrend: number;
    absentTrend: number;
    avgAttendanceRate: number;
    attendanceRateTrend: number;
    totalDevices: number;
    activeDevices: number;
    pendingSyncRecords: number;
}

interface DeptRow {
    dept: string;
    present: number;
    total: number;
    rate: number;
    late: number;
    color: string;
}

interface WeeklyRow {
    day: string;
    date: string;
    rate: number;
    present: number;
    absent: number;
}

interface HourlyRow {
    hour: string;
    count: number;
}

interface Props extends PageProps {
    stats: DashboardStats;
    devices: DeviceItem[];
    liveFeed: LiveFeedEntry[];
    weeklyTrend: WeeklyRow[];
    deptBreakdown: DeptRow[];
    hourlyData: HourlyRow[];
    notifications: Notification[];
}

export default function Index() {
    const { props } = usePage<Props>();
    const { stats, devices, liveFeed, weeklyTrend, deptBreakdown, hourlyData, notifications } = props;
    const { isDark } = useTheme();

    const cardBg = isDark ? '#1e293b' : '#ffffff';
    const cardBorder = isDark ? '#334155' : '#e5e7eb';
    const textPrimary = isDark ? '#f1f5f9' : '#111827';
    const textSecondary = isDark ? '#94a3b8' : '#6b7280';
    const innerBg = isDark ? '#0f172a' : '#f8fafc';

    const criticalCount = notifications.filter(n => !n.read && n.severity === 'critical').length;
    const warningCount  = notifications.filter(n => !n.read && n.severity === 'warning').length;

    const kpiCards = [
        { label: 'Total Employees',  value: stats.totalEmployees.toLocaleString(), sub: `${stats.presentToday} present today`,           icon: 'ri-team-line',          iconBg: '#dcfce7', iconColor: '#16a34a', trend: null,                    trendLabel: '',             accent: '#16a34a', path: '/employees' },
        { label: 'Check-ins Today',  value: stats.checkInsToday.toLocaleString(),  sub: 'Across all locations',                           icon: 'ri-user-follow-line',   iconBg: '#dcfce7', iconColor: '#16a34a', trend: stats.checkInsTrend,    trendLabel: 'vs yesterday', accent: null,      path: '/attendance' },
        { label: 'Attendance Rate',  value: `${stats.avgAttendanceRate}%`,          sub: 'Company-wide average',                           icon: 'ri-percent-line',       iconBg: '#ede9fe', iconColor: '#7c3aed', trend: stats.attendanceRateTrend, trendLabel: 'vs last week', accent: null,      path: '/analytics' },
        { label: 'Absent Today',     value: stats.absentToday,                      sub: `${stats.lateToday} late arrivals`,               icon: 'ri-user-unfollow-line', iconBg: '#fee2e2', iconColor: '#dc2626', trend: stats.absentTrend,      trendLabel: 'vs yesterday', accent: null,      path: '/reports' },
        { label: 'Active Devices',   value: `${stats.activeDevices}/${stats.totalDevices}`, sub: 'License-free, unlimited',             icon: 'ri-device-line',        iconBg: '#fef3c7', iconColor: '#d97706', trend: null,                    trendLabel: '',             accent: null,      path: '/devices' },
        { label: 'Pending Sync',     value: stats.pendingSyncRecords.toLocaleString(), sub: 'Records awaiting upload',                  icon: 'ri-upload-cloud-2-line',iconBg: '#e0f2fe', iconColor: '#0891b2', trend: 0,                       trendLabel: 'vs last hour', accent: null,      path: '/devices' },
    ];

    return (
        <AppLayout title="Dashboard" subtitle="Welcome back — here's what's happening today">
            <Head title="Dashboard" />

            {/* Critical alert banner */}
            {criticalCount > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 cursor-pointer" style={{ background: '#fef2f2', border: '1px solid #fecaca' }} onClick={() => router.visit('/analytics')}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#fee2e2' }}>
                        <i className="ri-alarm-warning-line text-sm" style={{ color: '#dc2626' }}></i>
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>
                            {criticalCount} critical alert{criticalCount > 1 ? 's' : ''} require{criticalCount === 1 ? 's' : ''} attention
                            {warningCount > 0 && ` · ${warningCount} warning${warningCount > 1 ? 's' : ''}`}
                        </p>
                        <p className="text-xs" style={{ color: '#b91c1c' }}>Offline devices detected, consecutive absences flagged — click to review</p>
                    </div>
                    <i className="ri-arrow-right-line text-sm" style={{ color: '#dc2626' }}></i>
                </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
                {kpiCards.map(card => {
                    const isPositive = card.trend !== null && card.trend > 0;
                    const isNegative = card.trend !== null && card.trend < 0;
                    return (
                        <div
                            key={card.label}
                            onClick={() => router.visit(card.path)}
                            className="p-4 rounded-xl flex flex-col gap-3 cursor-pointer transition-all"
                            style={{ background: cardBg, border: `1px solid ${card.accent ? card.accent + '30' : cardBorder}`, borderLeft: card.accent ? `3px solid ${card.accent}` : `1px solid ${cardBorder}` }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = card.iconColor + '60'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = card.accent ? card.accent + '30' : cardBorder; }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium uppercase tracking-wide mb-1.5" style={{ color: textSecondary }}>{card.label}</p>
                                    <p className="text-2xl font-bold leading-none" style={{ color: textPrimary }}>{card.value}</p>
                                    {card.sub && <p className="text-xs mt-1" style={{ color: textSecondary }}>{card.sub}</p>}
                                </div>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: card.iconBg }}>
                                    <i className={`${card.icon} text-lg`} style={{ color: card.iconColor }}></i>
                                </div>
                            </div>
                            {card.trend !== null && (
                                <div className="flex items-center gap-1.5">
                                    <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: isPositive ? '#dcfce7' : isNegative ? '#fee2e2' : '#fef3c7', color: isPositive ? '#16a34a' : isNegative ? '#dc2626' : '#d97706' }}>
                                        <i className={isPositive ? 'ri-arrow-up-line' : isNegative ? 'ri-arrow-down-line' : 'ri-subtract-line'}></i>
                                        {Math.abs(card.trend)}%
                                    </span>
                                    <span className="text-xs" style={{ color: textSecondary }}>{card.trendLabel}</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Row 2: Weekly trend + Dept breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
                <div className="lg:col-span-3"><WeeklyTrendChart weeklyTrend={weeklyTrend} /></div>
                <div className="lg:col-span-2"><DeptBreakdown deptBreakdown={deptBreakdown} /></div>
            </div>

            {/* Row 3: Hourly chart + Live feed */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
                <div className="lg:col-span-3"><AttendanceChart hourlyData={hourlyData} totalToday={stats.checkInsToday} /></div>
                <div className="lg:col-span-2"><LiveFeed initialFeed={liveFeed} /></div>
            </div>

            {/* Row 4: Device status grid */}
            <div className="mb-5">
                <DeviceStatusGrid devices={devices} activeDevices={stats.activeDevices} totalDevices={stats.totalDevices} />
            </div>

            {/* Row 5: Quick actions + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
                <div className="lg:col-span-2 rounded-xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                    <h3 className="font-semibold text-base mb-4" style={{ color: textPrimary }}>Quick Actions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { icon: 'ri-user-add-line',          label: 'Add Employee',   color: '#16a34a', bg: '#dcfce7', path: '/employees' },
                            { icon: 'ri-device-line',            label: 'Register Device',color: '#d97706', bg: '#fef3c7', path: '/devices' },
                            { icon: 'ri-bar-chart-2-line',       label: 'View Reports',   color: '#7c3aed', bg: '#ede9fe', path: '/reports' },
                            { icon: 'ri-pie-chart-2-line',       label: 'Analytics',      color: '#0891b2', bg: '#e0f2fe', path: '/analytics' },
                            { icon: 'ri-calendar-schedule-line', label: 'Shifts',         color: '#16a34a', bg: '#dcfce7', path: '/shifts' },
                            { icon: 'ri-live-line',              label: 'Live Monitor',   color: '#dc2626', bg: '#fee2e2', path: '/live-monitor' },
                            { icon: 'ri-download-2-line',        label: 'Export Logs',    color: '#16a34a', bg: '#dcfce7', path: '/attendance' },
                            { icon: 'ri-settings-3-line',        label: 'Settings',       color: '#6b7280', bg: '#f3f4f6', path: '/settings' },
                        ].map(action => (
                            <button key={action.label} onClick={() => router.visit(action.path)}
                                className="flex flex-col items-center gap-2.5 p-4 rounded-xl cursor-pointer transition-all whitespace-nowrap"
                                style={{ background: innerBg, border: `1px solid ${cardBorder}` }}
                                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = action.color + '60'; (e.currentTarget as HTMLButtonElement).style.background = action.bg; }}
                                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = cardBorder; (e.currentTarget as HTMLButtonElement).style.background = innerBg; }}
                            >
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: action.bg }}>
                                    <i className={`${action.icon} text-xl`} style={{ color: action.color }}></i>
                                </div>
                                <span className="text-xs font-medium" style={{ color: textPrimary }}>{action.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-1">
                    <AlertsWidget notifications={notifications} />
                </div>
            </div>

            {/* ADMS Server Info */}
            <div className="rounded-xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#16a34a' }}></div>
                            <h3 className="font-semibold text-sm" style={{ color: textPrimary }}>ADMS Server Endpoints</h3>
                        </div>
                        <p className="text-xs" style={{ color: textSecondary }}>Configure your ZKTeco devices to point to these endpoints</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['GET /iclock/cdata', 'POST /iclock/cdata', 'GET /iclock/getrequest', 'POST /iclock/devicecmd'].map(ep => (
                            <span key={ep} className="text-xs font-mono px-3 py-1.5 rounded-lg" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>{ep}</span>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
