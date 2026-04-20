import { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { PageProps } from '@/types';

interface NavChild {
    routeName: string;
    label: string;
    icon: string;
    tab?: string;
}
interface NavItem {
    routeName: string;
    label: string;
    icon: string;
    activeIcon: string;
    children?: NavChild[];
}
interface NavGroup {
    label: string;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: 'Overview',
        items: [
            { routeName: 'dashboard',         label: 'Super Admin', icon: 'ri-dashboard-3-line',  activeIcon: 'ri-dashboard-3-fill' },
            { routeName: 'admin.dashboard',   label: 'IT Admin',    icon: 'ri-admin-line',         activeIcon: 'ri-admin-fill' },
            { routeName: 'officer.dashboard', label: 'IT Officer',  icon: 'ri-user-settings-line', activeIcon: 'ri-user-settings-fill' },
        ],
    },
    {
        label: 'Asset Management',
        items: [
            {
                routeName: 'assets.index',
                label: 'Assets',
                icon: 'ri-computer-line',
                activeIcon: 'ri-computer-fill',
                children: [
                    { routeName: 'assets.index', label: 'Asset List',  icon: 'ri-list-check-2' },
                    { routeName: 'assets.index', label: 'Allocation',  icon: 'ri-user-shared-line', tab: 'allocation' },
                    { routeName: 'assets.index', label: 'History',     icon: 'ri-history-line',     tab: 'history' },
                ],
            },
            { routeName: 'warranty.index',    label: 'Warranty Tracking',   icon: 'ri-shield-check-line',      activeIcon: 'ri-shield-check-fill' },
            { routeName: 'lifecycle.index',   label: 'Asset Lifecycle',     icon: 'ri-loop-right-line',        activeIcon: 'ri-loop-right-line' },
            { routeName: 'vendors.index',     label: 'Vendor Management',   icon: 'ri-building-2-line',        activeIcon: 'ri-building-2-fill' },
            { routeName: 'location.health',   label: 'Location Health',     icon: 'ri-map-pin-2-line',         activeIcon: 'ri-map-pin-2-fill' },
            { routeName: 'reports.index',     label: 'Reports & Analytics', icon: 'ri-bar-chart-2-line',       activeIcon: 'ri-bar-chart-2-fill' },
            { routeName: 'register.index',    label: 'Asset Register',      icon: 'ri-file-list-2-line',       activeIcon: 'ri-file-list-2-fill' },
        ],
    },
    {
        label: 'Operations',
        items: [
            { routeName: 'alerts.index',          label: 'Alerts & Maintenance',  icon: 'ri-alarm-warning-line',       activeIcon: 'ri-alarm-warning-fill' },
            { routeName: 'maintenance.calendar',  label: 'Maintenance Calendar',  icon: 'ri-calendar-schedule-line',   activeIcon: 'ri-calendar-schedule-fill' },
            { routeName: 'infrastructure.index',  label: 'Infrastructure Checks', icon: 'ri-server-line',              activeIcon: 'ri-server-fill' },
            { routeName: 'infra.history',         label: 'Checks History',        icon: 'ri-history-line',             activeIcon: 'ri-history-fill' },
            { routeName: 'maintenance.cost',      label: 'Maintenance Costs',     icon: 'ri-money-dollar-circle-line', activeIcon: 'ri-money-dollar-circle-fill' },
            { routeName: 'tickets.index',         label: 'Support Tickets',       icon: 'ri-customer-service-2-line',  activeIcon: 'ri-customer-service-2-fill' },
        ],
    },
    {
        label: 'Administration',
        items: [
            { routeName: 'settings.index', label: 'Settings', icon: 'ri-settings-3-line', activeIcon: 'ri-settings-3-fill' },
        ],
    },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen?: boolean;
    onMobileClose?: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
    const { url } = usePage();
    const { auth } = usePage<PageProps>().props;
    const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({ 'assets.index': true });
    const navRef = useRef<HTMLElement>(null);
    const activeItemRef = useRef<HTMLElement | null>(null);

    const isActive = (routeName: string) => {
        try { return route().current(routeName); } catch { return false; }
    };

    const isChildActive = (child: NavChild) => {
        if (!isActive(child.routeName)) return false;
        if (child.tab) {
            const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
            return params.get('tab') === child.tab;
        }
        const params = new URLSearchParams(url.includes('?') ? url.split('?')[1] : '');
        return !params.get('tab');
    };

    const handleChildNav = (child: NavChild) => {
        const params = child.tab ? { tab: child.tab } : {};
        router.visit(route(child.routeName, params));
        if (onMobileClose) onMobileClose();
    };

    // Auto-open dropdown for active route & scroll active item into view
    useEffect(() => {
        navGroups.forEach(group => {
            group.items.forEach(item => {
                if (item.children && isActive(item.routeName)) {
                    setOpenDropdowns(prev => ({ ...prev, [item.routeName]: true }));
                }
            });
        });
        // Scroll active item into view after render
        const timer = setTimeout(() => {
            if (activeItemRef.current && navRef.current) {
                const nav = navRef.current;
                const item = activeItemRef.current;
                const navTop = nav.getBoundingClientRect().top;
                const itemTop = item.getBoundingClientRect().top;
                const offset = itemTop - navTop - nav.clientHeight / 2 + item.clientHeight / 2;
                nav.scrollBy({ top: offset, behavior: 'smooth' });
            }
        }, 150);
        return () => clearTimeout(timer);
    }, [url]);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const effectiveCollapsed = isMobile ? false : collapsed;

    const userInitials = auth?.user?.avatar_initials
        ?? auth?.user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        ?? 'U';
    const userRole = (auth?.user as any)?.roles?.[0] ?? 'User';

    return (
        <aside
            className={`fixed left-0 top-0 h-full z-40 flex flex-col transition-all duration-300
                ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                ${effectiveCollapsed ? 'w-[60px]' : 'w-[230px]'}
            `}
            style={{ background: '#0f1623', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        >
            {/* Logo */}
            <div
                className={`flex items-center h-[60px] border-b flex-shrink-0 ${effectiveCollapsed ? 'justify-center px-0' : 'px-4 gap-3'}`}
                style={{ borderColor: 'rgba(255,255,255,0.06)' }}
            >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
                    <i className="ri-cpu-line text-white text-base"></i>
                </div>
                {!effectiveCollapsed && (
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm tracking-tight leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AssetIQ</p>
                        <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>IT Infrastructure</p>
                    </div>
                )}
                {mobileOpen && onMobileClose && (
                    <button onClick={onMobileClose} className="lg:hidden w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 cursor-pointer flex-shrink-0">
                        <i className="ri-close-line text-slate-400 text-base"></i>
                    </button>
                )}
            </div>

            {/* Nav */}
            <nav ref={navRef} className="flex-1 py-3 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
                {navGroups.map(group => (
                    <div key={group.label} className="mb-1">
                        {!effectiveCollapsed && (
                            <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
                                {group.label}
                            </p>
                        )}
                        {effectiveCollapsed && <div className="my-2 mx-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}></div>}

                        {group.items.map(item => {
                            const active = isActive(item.routeName);
                            const hasChildren = item.children && item.children.length > 0;
                            const isOpen = openDropdowns[item.routeName];

                            return (
                                <div key={item.routeName}>
                                    {hasChildren ? (
                                        <button
                                            ref={active ? (el => { activeItemRef.current = el; }) : undefined}
                                            onClick={() => {
                                                if (!effectiveCollapsed) setOpenDropdowns(p => ({ ...p, [item.routeName]: !p[item.routeName] }));
                                                else router.visit(route(item.routeName));
                                            }}
                                            className={`relative w-full flex items-center mx-2 mb-0.5 rounded-lg transition-all duration-150 cursor-pointer group ${
                                                effectiveCollapsed ? 'justify-center py-2.5 px-0' : 'px-3 py-2'
                                            } ${active ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                            style={{ width: 'calc(100% - 16px)' }}
                                            title={effectiveCollapsed ? item.label : undefined}
                                        >
                                            {active && !effectiveCollapsed && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-r-full"></span>
                                            )}
                                            <div className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                                                <i className={`${active ? item.activeIcon : item.icon} text-base`}></i>
                                            </div>
                                            {!effectiveCollapsed && (
                                                <>
                                                    <span className="ml-2.5 text-[13px] font-medium whitespace-nowrap flex-1 text-left">{item.label}</span>
                                                    <div className="w-4 h-4 flex items-center justify-center">
                                                        {isOpen ? <i className="ri-arrow-up-s-line text-sm"></i> : <i className="ri-arrow-down-s-line text-sm"></i>}
                                                    </div>
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <Link
                                            href={route(item.routeName)}
                                            ref={active ? (el => { activeItemRef.current = el as HTMLElement | null; }) : undefined}
                                            onClick={() => { if (onMobileClose) onMobileClose(); }}
                                            className={`relative flex items-center mx-2 mb-0.5 rounded-lg transition-all duration-150 cursor-pointer group ${
                                                effectiveCollapsed ? 'justify-center py-2.5 px-0' : 'px-3 py-2'
                                            } ${active ? 'bg-emerald-500/15 text-emerald-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}
                                            style={{ width: 'calc(100% - 16px)' }}
                                            title={effectiveCollapsed ? item.label : undefined}
                                        >
                                            {active && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-r-full"></span>
                                            )}
                                            <div className="w-[18px] h-[18px] flex items-center justify-center flex-shrink-0">
                                                <i className={`${active ? item.activeIcon : item.icon} text-base`}></i>
                                            </div>
                                            {!effectiveCollapsed && (
                                                <span className="ml-2.5 text-[13px] font-medium whitespace-nowrap">{item.label}</span>
                                            )}
                                        </Link>
                                    )}

                                    {hasChildren && isOpen && !effectiveCollapsed && (
                                        <div className="ml-4 mb-1">
                                            {item.children!.map(child => {
                                                const childActive = isChildActive(child);
                                                return (
                                                    <button
                                                        key={`${child.routeName}-${child.tab ?? 'default'}`}
                                                        ref={childActive ? (el => { activeItemRef.current = el; }) : undefined}
                                                        onClick={() => handleChildNav(child)}
                                                        className={`w-full flex items-center gap-2.5 mx-2 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer ${
                                                            childActive ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                                                        }`}
                                                        style={{ width: 'calc(100% - 16px)' }}
                                                    >
                                                        <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                                                            <i className={`${child.icon} text-xs`}></i>
                                                        </div>
                                                        <span className="whitespace-nowrap">{child.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Bottom */}
            <div className="flex-shrink-0 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                {!effectiveCollapsed && (
                    <div className="flex items-center gap-2.5 px-4 py-3">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {userInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold text-white truncate leading-none">{auth?.user?.name ?? 'User'}</p>
                            <p className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>{userRole}</p>
                        </div>
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            className="w-6 h-6 flex items-center justify-center rounded cursor-pointer hover:bg-white/10 transition-all flex-shrink-0"
                            title="Sign out"
                        >
                            <i className="ri-logout-box-r-line text-slate-400 text-sm"></i>
                        </Link>
                    </div>
                )}
                <button
                    onClick={onToggle}
                    className="hidden lg:flex w-full items-center justify-center py-2.5 transition-all cursor-pointer hover:bg-white/5"
                    style={{ color: 'rgba(255,255,255,0.3)' }}
                >
                    <div className="w-4 h-4 flex items-center justify-center">
                        <i className={`${effectiveCollapsed ? 'ri-arrow-right-s-line' : 'ri-arrow-left-s-line'} text-base`}></i>
                    </div>
                    {!effectiveCollapsed && <span className="ml-1.5 text-[11px]">Collapse</span>}
                </button>
            </div>
        </aside>
    );
}