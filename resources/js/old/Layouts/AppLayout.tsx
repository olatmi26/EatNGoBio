import { useState, useEffect, ReactNode } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
    'dashboard':          { title: 'Dashboard',                    subtitle: 'Welcome back' },
    'admin.dashboard':    { title: 'IT Admin Dashboard',           subtitle: 'Administrative overview' },
    'officer.dashboard':  { title: 'IT Officer Dashboard',         subtitle: 'Your assigned assets and tasks' },
    'assets.index':       { title: 'Asset Management',             subtitle: 'Manage hardware, software & licenses' },
    'warranty.index':     { title: 'Warranty Tracking',            subtitle: 'Monitor warranty expiry and renewals' },
    'lifecycle.index':    { title: 'Asset Lifecycle',              subtitle: 'Track asset journey and cost depreciation' },
    'register.index':     { title: 'Asset Register',               subtitle: 'Complete asset inventory — printable & exportable' },
    'vendors.index':      { title: 'Vendor Management',            subtitle: 'Manage suppliers, contracts, and relationships' },
    'location.health':    { title: 'Location Health',              subtitle: 'Per-location asset and ticket overview' },
    'reports.index':      { title: 'Reports & Analytics',          subtitle: 'Insights and performance metrics' },
    'alerts.index':       { title: 'Alerts & Maintenance',         subtitle: 'Maintenance schedules and alerts' },
    'maintenance.calendar': { title: 'Maintenance Calendar',       subtitle: 'Plan and assign maintenance tasks' },
    'infrastructure.index': { title: 'Infrastructure Checks',      subtitle: 'Daily infrastructure monitoring' },
    'infra.history':      { title: 'Infrastructure Checks History', subtitle: 'Daily check records by officer, location, and date' },
    'maintenance.cost':   { title: 'Maintenance Cost Analysis',    subtitle: 'Track repair costs, parts, and maintenance spend' },
    'tickets.index':      { title: 'Support Tickets',              subtitle: 'Track and resolve IT support requests' },
    'settings.index':     { title: 'Settings',                     subtitle: 'System configuration and preferences' },
    'profile.index':      { title: 'My Profile',                   subtitle: 'Account settings and preferences' },
};

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { url, component } = usePage();

    // Derive route name from component path e.g. "Dashboard/Index" → "dashboard"
    const routeKey = component
        ? component.toLowerCase()
            .replace('/index', '')
            .replace('/', '.')
            .replace('admindashboard', 'admin.dashboard')
            .replace('officerdashboard', 'officer.dashboard')
            .replace('assetlifecycle', 'lifecycle.index')
            .replace('assetregister', 'register.index')
            .replace('locationhealth', 'location.health')
            .replace('maintenancecost', 'maintenance.cost')
            .replace('maintenancecalendar', 'maintenance.calendar')
            .replace('infrahistory', 'infra.history')
            .replace('userprofile', 'profile.index')
        : '';

    const pageInfo = pageTitles[routeKey] ?? { title: title ?? 'AssetIQ', subtitle: subtitle ?? '' };
    const finalTitle = title ?? pageInfo.title;
    const finalSubtitle = subtitle ?? pageInfo.subtitle;

    useEffect(() => { setMobileOpen(false); }, [url]);

    useEffect(() => {
        const handler = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    return (
        <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            <TopBar
                sidebarCollapsed={collapsed}
                title={finalTitle}
                subtitle={finalSubtitle}
                onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
            />

            <main
                className={`transition-all duration-300 ${collapsed ? 'lg:ml-[60px]' : 'lg:ml-[230px]'}`}
                style={{ paddingTop: '60px' }}
            >
                <div className="p-4 md:p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
