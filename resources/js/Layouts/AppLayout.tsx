import { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import type { PageProps } from '@/types';

interface AppLayoutProps {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

export default function AppLayout({ title, subtitle, children, actions }: AppLayoutProps) {
    const { isDark } = useTheme();
    const { url } = usePage<PageProps>();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // Close mobile menu on navigation
    useEffect(() => { setMobileOpen(false); }, [url]);

    const pageBg = isDark ? '#0f172a' : '#f8fafc';

    return (
        <div className="min-h-screen transition-colors duration-200" style={{ background: pageBg, fontFamily: "'Inter', sans-serif" }}>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            <Sidebar
                collapsed={collapsed}
                onToggle={() => setCollapsed(!collapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

            <TopBar
                title={title}
                subtitle={subtitle}
                sidebarCollapsed={collapsed}
                actions={actions}
                onMobileMenuToggle={() => setMobileOpen(!mobileOpen)}
            />

            <main
                className="transition-all duration-300 pt-16"
                style={{ marginLeft: collapsed ? '72px' : '260px' }}
            >
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
