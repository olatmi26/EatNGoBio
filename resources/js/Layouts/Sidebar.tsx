import { useState } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { useTheme } from '@/contexts/ThemeContext';
import type { PageProps } from '@/types';

interface NavItem { icon: string; label: string; routeName: string; }
interface NavGroup { group: string; icon?: string; expandable?: boolean; items: NavItem[]; }

const navGroups: NavGroup[] = [
    { group: 'Dashboard', items: [{ icon: 'ri-dashboard-line', label: 'Dashboard', routeName: 'dashboard' }] },
    { group: 'Devices',   items: [{ icon: 'ri-device-line',    label: 'Devices',   routeName: 'devices.index' }] },
    {
        group: 'Organization', icon: 'ri-building-line', expandable: true,
        items: [
            { icon: 'ri-building-2-line',  label: 'Department', routeName: 'org.departments' },
            { icon: 'ri-briefcase-line',   label: 'Position',   routeName: 'org.positions' },
            { icon: 'ri-map-pin-line',     label: 'Area',       routeName: 'org.areas' },
            { icon: 'ri-node-tree',        label: 'Org Chart',  routeName: 'org.chart' },
        ],
    },
    { group: 'Employees',    items: [{ icon: 'ri-team-line',              label: 'Employees',       routeName: 'employees.index' }] },
    { group: 'Attendance',   items: [{ icon: 'ri-time-line',              label: 'Attendance',      routeName: 'attendance.index' }] },
    { group: 'Shifts',       items: [{ icon: 'ri-calendar-schedule-line', label: 'Shift Management', routeName: 'shifts.index' }] },
    { group: 'Live Monitor', items: [{ icon: 'ri-live-line',              label: 'Live Monitor',    routeName: 'live-monitor.index' }] },
    { group: 'Reports',      items: [{ icon: 'ri-bar-chart-2-line',       label: 'Reports',         routeName: 'reports.index' }] },
    { group: 'Analytics',    items: [{ icon: 'ri-pie-chart-2-line',       label: 'Analytics',       routeName: 'analytics.index' }] },
    { group: 'Settings',     items: [{ icon: 'ri-settings-3-line',        label: 'Settings',        routeName: 'settings.index' }] },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
    const { isDark } = useTheme();
    const { url } = usePage<PageProps>();
    const { auth } = usePage<PageProps>().props;
    const [orgExpanded, setOrgExpanded] = useState(url.startsWith('/organization'));

    const isActive = (routeName: string) => {
        try { return route().current(routeName); } catch { return false; }
    };
    const isOrgActive = url.startsWith('/organization');

    const bg = isDark ? '#111827' : '#ffffff';
    const border = isDark ? '#1f2937' : '#e5e7eb';
    const textPrimary = isDark ? '#f9fafb' : '#111827';
    const textSecondary = isDark ? '#9ca3af' : '#6b7280';
    const hoverBg = isDark ? '#1f2937' : '#f3f4f6';
    const activeBg = isDark ? '#14532d20' : '#f0fdf4';
    const activeColor = '#16a34a';
    const userCardBg = isDark ? '#1f2937' : '#f9fafb';

    const effectiveCollapsed = mobileOpen ? false : collapsed;

    return (
        <aside
            className={`flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
            style={{ width: effectiveCollapsed ? '72px' : '260px', background: bg, borderRight: `1px solid ${border}`, fontFamily: "'Inter', sans-serif" }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: `1px solid ${border}`, minHeight: '64px' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                    <i className="ri-fingerprint-line text-white text-lg"></i>
                </div>
                {!effectiveCollapsed && (
                    <div className="overflow-hidden flex-1">
                        <span className="font-bold text-base tracking-tight whitespace-nowrap" style={{ color: textPrimary }}>
                            EatNGo<span style={{ color: '#16a34a' }}>Bio</span>
                        </span>
                        <p className="text-xs whitespace-nowrap" style={{ color: textSecondary }}>Attendance System</p>
                    </div>
                )}
                <button onClick={onToggle} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors flex-shrink-0" style={{ color: textSecondary }} onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }} onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                    <i className={effectiveCollapsed ? 'ri-menu-unfold-line text-sm' : 'ri-menu-fold-line text-sm'}></i>
                </button>
            </div>

            {/* User card */}
            {!effectiveCollapsed && (
                <div className="mx-3 my-3 p-3 rounded-xl" style={{ background: userCardBg, border: `1px solid ${border}` }}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                            {auth.user?.initials ?? auth.user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
                        </div>
                        <div className="overflow-hidden flex-1">
                            <p className="text-sm font-semibold whitespace-nowrap capitalize" style={{ color: textPrimary }}>{auth.user?.name}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: '#dcfce7', color: '#16a34a' }}>{auth.user?.role ?? 'Staff'}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-2 px-2">
                {navGroups.map(group => {
                    if (group.expandable) {
                        return (
                            <div key={group.group} className="mb-0.5">
                                <button
                                    onClick={() => !effectiveCollapsed && setOrgExpanded(!orgExpanded)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all whitespace-nowrap"
                                    style={{ background: isOrgActive ? activeBg : 'transparent', color: isOrgActive ? activeColor : textSecondary }}
                                    onMouseEnter={(e) => { if (!isOrgActive) (e.currentTarget as HTMLButtonElement).style.background = hoverBg; }}
                                    onMouseLeave={(e) => { if (!isOrgActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                                >
                                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                        <i className="ri-building-line text-base"></i>
                                    </div>
                                    {!effectiveCollapsed && (
                                        <>
                                            <span className="text-sm font-medium flex-1 text-left">Organization</span>
                                            <i className={orgExpanded ? 'ri-arrow-up-s-line text-sm' : 'ri-arrow-down-s-line text-sm'}></i>
                                        </>
                                    )}
                                </button>
                                {!effectiveCollapsed && orgExpanded && (
                                    <div className="ml-4 mt-0.5 pl-3" style={{ borderLeft: `2px solid ${border}` }}>
                                        {group.items.map(item => {
                                            const active = isActive(item.routeName);
                                            return (
                                                <Link
                                                    key={item.routeName}
                                                    href={route(item.routeName)}
                                                    onClick={() => onMobileClose?.()}
                                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 cursor-pointer transition-all whitespace-nowrap"
                                                    style={{ background: active ? activeBg : 'transparent', color: active ? activeColor : textSecondary, fontWeight: active ? 600 : 400, display: 'flex' }}
                                                >
                                                    <span className="text-sm">{item.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    }

                    return group.items.map(item => {
                        const active = isActive(item.routeName);
                        return (
                            <Link
                                key={item.routeName}
                                href={route(item.routeName)}
                                onClick={() => onMobileClose?.()}
                                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 cursor-pointer transition-all whitespace-nowrap"
                                style={{ background: active ? activeBg : 'transparent', color: active ? activeColor : textSecondary, fontWeight: active ? 600 : 400, display: 'flex' }}
                                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = hoverBg; }}
                                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
                            >
                                <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    <i className={`${item.icon} text-base`}></i>
                                </div>
                                {!effectiveCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                            </Link>
                        );
                    });
                })}
            </nav>

            {/* Bottom: ADMS status + logout */}
            <div className="px-3 py-3" style={{ borderTop: `1px solid ${border}` }}>
                {!effectiveCollapsed ? (
                    <div className="p-3 rounded-xl" style={{ background: userCardBg, border: `1px solid ${border}` }}>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#16a34a' }}></div>
                            <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>ADMS Online</span>
                        </div>
                        <p className="text-xs font-mono truncate" style={{ color: textSecondary }}>/iclock/cdata</p>
                        <Link
                            href={route('logout')} method="post" as="button"
                            className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap"
                            style={{ color: '#dc2626' }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                        >
                            <i className="ri-logout-box-line"></i> Sign Out
                        </Link>
                    </div>
                ) : (
                    <Link
                        href={route('logout')} method="post" as="button"
                        className="w-full flex items-center justify-center py-2 rounded-xl cursor-pointer transition-colors"
                        style={{ color: '#dc2626' }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                        <i className="ri-logout-box-line text-base"></i>
                    </Link>
                )}
            </div>
        </aside>
    );
}
