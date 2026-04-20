import { useState, useRef, useEffect } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

interface TopBarProps {
    sidebarCollapsed: boolean;
    title: string;
    subtitle?: string;
    onMobileMenuToggle?: () => void;
}

type SearchResult = { id: number; title: string; meta: string; path: string };
type SearchPayload = {
    assets: SearchResult[];
    tickets: SearchResult[];
    vendors: SearchResult[];
    locations: SearchResult[];
};

export default function TopBar({ sidebarCollapsed, title, subtitle, onMobileMenuToggle }: TopBarProps) {
    const { auth, flash } = usePage<PageProps>().props;
    const [notifOpen, setNotifOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [notifFilter, setNotifFilter] = useState<'all' | 'warranty' | 'maintenance' | 'ticket'>('all');
    const [readIds, setReadIds] = useState<Set<number>>(new Set());
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchPayload>({ assets: [], tickets: [], vendors: [], locations: [] });
    const notifRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    const notifications = [
        { id: 1, icon: 'ri-shield-keyhole-fill', color: 'text-red-500',    bg: 'bg-red-50',    title: 'Warranty expired: Cisco Catalyst 2960-X',       desc: 'APAPA · Expired 2024-06-20',               time: '2h ago',  unread: true,  type: 'warranty' },
        { id: 2, icon: 'ri-shield-keyhole-fill', color: 'text-orange-500', bg: 'bg-orange-50', title: 'Warranty expiring: Fortinet FortiGate 100F',     desc: 'Head Office · Expires 2025-08-10 (118 days)', time: '5h ago',  unread: true,  type: 'warranty' },
        { id: 3, icon: 'ri-tools-fill',          color: 'text-amber-500',  bg: 'bg-amber-50',  title: 'Maintenance due: Dell PowerEdge R740',           desc: 'Head Office · Scheduled 2026-04-15',       time: '1d ago',  unread: true,  type: 'maintenance' },
        { id: 4, icon: 'ri-ticket-2-fill',       color: 'text-emerald-500',bg: 'bg-emerald-50',title: 'New ticket: Printer offline — Finance',          desc: 'TOYIN · Priority: High',                   time: '1d ago',  unread: true,  type: 'ticket' },
        { id: 5, icon: 'ri-shield-keyhole-fill', color: 'text-amber-500',  bg: 'bg-amber-50',  title: 'Warranty expiring: APC Smart-UPS 3000VA',        desc: 'Head Office · Expires 2025-07-18 (96 days)', time: '2d ago',  unread: false, type: 'warranty' },
        { id: 6, icon: 'ri-file-list-3-fill',   color: 'text-slate-500',  bg: 'bg-slate-100', title: 'License renewal: MS Office 365 E3',             desc: 'Cloud · Expires 2025-01-01',               time: '3d ago',  unread: false, type: 'license' },
    ];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
            if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const keyHandler = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                setSearchOpen(true);
            }
            if (event.key === 'Escape') {
                setSearchOpen(false);
            }
        };
        window.addEventListener('keydown', keyHandler);
        return () => window.removeEventListener('keydown', keyHandler);
    }, []);

    useEffect(() => {
        if (!searchOpen) return;
        if (!searchQuery.trim()) {
            setSearchResults({ assets: [], tickets: [], vendors: [], locations: [] });
            return;
        }
        const timer = window.setTimeout(async () => {
            setSearchLoading(true);
            try {
                const response = await fetch(`/search/global?q=${encodeURIComponent(searchQuery)}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                });
                if (!response.ok) return;
                const payload = (await response.json()) as SearchPayload;
                setSearchResults(payload);
            } finally {
                setSearchLoading(false);
            }
        }, 200);
        return () => window.clearTimeout(timer);
    }, [searchOpen, searchQuery]);

    const markAllRead = () => setReadIds(new Set(notifications.map(n => n.id)));
    const filteredNotifs = notifications.filter(n => notifFilter === 'all' || n.type === notifFilter);
    const unreadCount = notifications.filter(n => n.unread && !readIds.has(n.id)).length;

    const userInitials = auth?.user?.avatar_initials
        ?? auth?.user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
        ?? 'U';

    const userRole = auth?.user?.roles?.[0] ?? 'User';

    return (
        <header
            className={`fixed top-0 right-0 z-30 flex items-center justify-between bg-white transition-all duration-300 ${sidebarCollapsed ? 'lg:left-[60px]' : 'lg:left-[230px]'} left-0`}
            style={{ height: '60px', borderBottom: '1px solid #f1f5f9', padding: '0 24px' }}
        >
            {/* Left */}
            <div className="flex items-center gap-3">
                <button onClick={onMobileMenuToggle} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all cursor-pointer flex-shrink-0">
                    <i className="ri-menu-line text-slate-600 text-lg"></i>
                </button>
                <div>
                    <h1 className="text-[15px] font-bold text-slate-800 leading-none" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{title}</h1>
                    {subtitle && <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">{subtitle}</p>}
                </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
                {/* Global search */}
                <div className="relative hidden lg:flex items-center">
                    <div className="w-4 h-4 flex items-center justify-center absolute left-3 pointer-events-none">
                        <i className="ri-search-line text-slate-400 text-sm"></i>
                    </div>
                    <input
                        type="text"
                        placeholder="Search assets, tickets, locations..."
                        value={searchQuery}
                        onFocus={() => setSearchOpen(true)}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-1.5 text-[13px] rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}
                    />
                    <kbd className="absolute right-3 text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">Ctrl K</kbd>
                </div>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => { setNotifOpen(!notifOpen); setUserMenuOpen(false); }}
                        className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                    >
                        <i className="ri-notification-3-line text-slate-500 text-lg"></i>
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {notifOpen && (
                        <div className="absolute right-0 top-11 w-[380px] bg-white rounded-xl overflow-hidden z-50" style={{ border: '1px solid #e2e8f0', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="text-[13px] font-bold text-slate-800">Notifications</span>
                                    {unreadCount > 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-semibold">{unreadCount} new</span>}
                                </div>
                                <button onClick={markAllRead} className="text-[11px] text-emerald-600 font-medium hover:underline cursor-pointer">Mark all read</button>
                            </div>
                            <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-50">
                                {(['all', 'warranty', 'maintenance', 'ticket'] as const).map(f => (
                                    <button key={f} onClick={() => setNotifFilter(f)}
                                        className={`px-2.5 py-1 text-[11px] rounded-full font-medium cursor-pointer transition-all capitalize whitespace-nowrap ${notifFilter === f ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                        {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className="max-h-[340px] overflow-y-auto">
                                {filteredNotifs.length === 0 ? (
                                    <div className="py-8 text-center text-xs text-slate-400">No notifications</div>
                                ) : filteredNotifs.map(n => {
                                    const isRead = readIds.has(n.id) || !n.unread;
                                    return (
                                        <div key={n.id} onClick={() => setReadIds(prev => new Set([...prev, n.id]))}
                                            className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer transition-all border-b border-slate-50 ${!isRead ? 'bg-emerald-50/30' : ''}`}>
                                            <div className={`w-8 h-8 rounded-lg ${n.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                <i className={`${n.icon} ${n.color} text-sm`}></i>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[12px] font-semibold text-slate-700 leading-snug">{n.title}</p>
                                                <p className="text-[11px] text-slate-400 mt-0.5">{n.desc}</p>
                                                <p className="text-[10px] text-slate-300 mt-0.5">{n.time}</p>
                                            </div>
                                            {!isRead && <span className="w-2 h-2 bg-emerald-500 rounded-full flex-shrink-0 mt-1.5"></span>}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                                <Link href={route('alerts.index')} onClick={() => setNotifOpen(false)}
                                    className="text-[12px] text-emerald-600 font-medium hover:underline cursor-pointer">
                                    View all alerts &amp; maintenance
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-slate-200 mx-1"></div>

                {/* User menu */}
                <div className="relative" ref={userRef}>
                    <button
                        onClick={() => { setUserMenuOpen(!userMenuOpen); setNotifOpen(false); }}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-slate-50 transition-all"
                        style={{ border: '1px solid #e2e8f0' }}
                    >
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {userInitials}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-[12px] font-semibold text-slate-700 leading-none whitespace-nowrap">{auth?.user?.name ?? 'User'}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">{userRole}</p>
                        </div>
                        <i className={`${userMenuOpen ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} text-slate-400 text-sm`}></i>
                    </button>

                    {userMenuOpen && (
                        <div className="absolute right-0 top-11 w-[220px] bg-white rounded-xl overflow-hidden z-50" style={{ border: '1px solid #e2e8f0', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
                            <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">{userInitials}</div>
                                    <div className="min-w-0">
                                        <p className="text-[13px] font-bold text-slate-800 truncate">{auth?.user?.name}</p>
                                        <p className="text-[11px] text-slate-400 truncate">{auth?.user?.email}</p>
                                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-semibold">{userRole}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="py-1">
                                {[
                                    { icon: 'ri-user-3-line',         label: 'My Profile',              href: route('profile.index') },
                                    { icon: 'ri-settings-3-line',     label: 'Account Settings',        href: route('settings.index') },
                                    { icon: 'ri-notification-3-line', label: 'Notification Preferences',href: route('profile.index') },
                                    null,
                                    { icon: 'ri-question-line',       label: 'Help & Support',          href: route('profile.index') },
                                    null,
                                ].map((item, i) => {
                                    if (!item) return <div key={i} className="my-1 border-t border-slate-100"></div>;
                                    return (
                                        <Link key={i} href={item.href} onClick={() => setUserMenuOpen(false)}
                                            className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium cursor-pointer transition-all text-slate-600 hover:bg-slate-50">
                                            <i className={`${item.icon} text-sm`}></i>
                                            <span className="whitespace-nowrap">{item.label}</span>
                                        </Link>
                                    );
                                })}
                                <div className="my-1 border-t border-slate-100"></div>
                                <Link href={route('logout')} method="post" as="button"
                                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[13px] font-medium cursor-pointer transition-all text-red-500 hover:bg-red-50">
                                    <i className="ri-logout-box-r-line text-sm"></i>
                                    <span>Sign Out</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Flash messages */}
            {flash?.success && (
                <div className="absolute top-16 right-6 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2 rounded-xl z-50">
                    <i className="ri-checkbox-circle-line mr-2"></i>{flash.success}
                </div>
            )}

            {searchOpen && (
                <div className="fixed inset-0 z-[70] bg-black/40 flex items-start justify-center pt-24" onClick={() => setSearchOpen(false)}>
                    <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="px-4 py-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <i className="ri-search-line text-slate-400"></i>
                                <input
                                    autoFocus
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search assets, tickets, vendors, locations..."
                                    className="w-full text-sm outline-none"
                                />
                                <button onClick={() => setSearchOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">Esc</button>
                            </div>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-3">
                            {searchLoading && <p className="text-xs text-slate-400 px-1">Searching...</p>}
                            {!searchLoading && !searchQuery.trim() && <p className="text-xs text-slate-400 px-1">Type to search across assets, tickets, vendors, and locations.</p>}
                            {!searchLoading && searchQuery.trim() && (
                                <>
                                    {([
                                        ['Assets', searchResults.assets],
                                        ['Tickets', searchResults.tickets],
                                        ['Vendors', searchResults.vendors],
                                        ['Locations', searchResults.locations],
                                    ] as Array<[string, SearchResult[]]>).map(([label, results]) => (
                                        <div key={label}>
                                            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-2 py-1">{label}</p>
                                            <div className="space-y-1">
                                                {results.length === 0 ? (
                                                    <p className="text-xs text-slate-300 px-2 py-1">No matches</p>
                                                ) : (
                                                    results.map((result) => (
                                                        <button
                                                            key={`${label}-${result.id}`}
                                                            onClick={() => {
                                                                setSearchOpen(false);
                                                                router.visit(result.path);
                                                            }}
                                                            className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-50"
                                                        >
                                                            <p className="text-sm font-medium text-slate-700">{result.title}</p>
                                                            <p className="text-xs text-slate-400">{result.meta}</p>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
}
