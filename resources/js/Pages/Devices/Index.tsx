import { useState, useEffect, useRef } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import Modal from "@/Components/base/Modal";
import ConfirmDialog from "@/Components/base/ConfirmDialog";
import type { PageProps, DeviceItem, PendingDeviceItem } from "@/types";

interface DeviceAnalyticItem {
    id: number;
    deviceName: string;
    location: string;
    status: string;
    punchesToday: number;
    lastSync: string;
    successRate: number;
    weeklyPunches: number[];
}

interface Props extends PageProps {
    devices: {
        data: DeviceItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: any[];
        from: number;
        to: number;
    };
    pendingDevices: PendingDeviceItem[];
    areas: { id: number; name: string; code?: string }[];
    stats: {
        total: number;
        online: number;
        offline: number;
        totalUsers: number;
    };
    deviceAnalytics: {
        data: DeviceAnalyticItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    filters: {
        search: string;
        status: string;
        per_page: number;
        analytics_page?: number;
        analytics_per_page?: number;
    };
}

type TabKey = 'devices' | 'analytics';

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: 'devices', label: 'Device List', icon: 'ri-device-line' },
    { key: 'analytics', label: 'Device Analytics', icon: 'ri-bar-chart-2-line' },
];

const timezones = ["Africa/Lagos", "Africa/Nairobi", "Africa/Cairo", "UTC", "Europe/London", "America/New_York"];
const transferModes = ["Real-Time", "Scheduled", "Manual"];
const perPageOptions = [10, 15, 25, 50, 100];

const emptyForm = {
    name: "", sn: "", ip: "", area: "",
    timezone: "Africa/Lagos", transferMode: "Real-Time", heartbeat: 60,
};
type DeviceForm = typeof emptyForm;

// Full-width Table Skeleton
const FullTableSkeleton = ({ columns, rows = 10, isDark }: { columns: number; rows?: number; isDark: boolean }) => {
    const bg = isDark ? '#374151' : '#e5e7eb';
    const headerBg = isDark ? '#1f2937' : '#f9fafb';
    return (
        <div className="animate-pulse w-full">
            {/* Header skeleton */}
            <div className="flex items-center px-4 py-3 border-b" style={{ background: headerBg, borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                <div className="w-4 h-4 rounded mr-3" style={{ background: bg }}></div>
                {[...Array(columns - 2)].map((_, i) => (
                    <div key={i} className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                ))}
                <div className="w-20 h-4 rounded ml-2" style={{ background: bg }}></div>
            </div>
            {/* Row skeletons */}
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center px-4 py-3 border-b" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                    <div className="w-4 h-4 rounded mr-3" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-6 rounded-full mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="w-20 h-8 rounded-lg ml-2" style={{ background: bg }}></div>
                </div>
            ))}
        </div>
    );
};

// Analytics Table Skeleton
const AnalyticsTableSkeleton = ({ rows = 10, isDark }: { rows?: number; isDark: boolean }) => {
    const bg = isDark ? '#374151' : '#e5e7eb';
    const headerBg = isDark ? '#1f2937' : '#f9fafb';
    return (
        <div className="animate-pulse w-full">
            <div className="flex items-center px-4 py-3 border-b" style={{ background: headerBg, borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                {[...Array(7)].map((_, i) => (
                    <div key={i} className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                ))}
            </div>
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center px-4 py-3 border-b" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-6 rounded-full mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                    <div className="flex-1 h-4 rounded mx-2" style={{ background: bg }}></div>
                </div>
            ))}
        </div>
    );
};

const StatCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    const bg = isDark ? '#374151' : '#e5e7eb';
    return (
        <div className="p-5 rounded-xl animate-pulse" style={{ background: isDark ? '#1f2937' : '#ffffff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}` }}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl" style={{ background: bg }}></div>
                <div className="flex-1">
                    <div className="w-16 h-6 rounded mb-1" style={{ background: bg }}></div>
                    <div className="w-20 h-3 rounded" style={{ background: bg }}></div>
                </div>
            </div>
        </div>
    );
};

export default function DevicesPage() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const { props } = usePage<Props>();
    
    const [devices, setDevices] = useState<DeviceItem[]>(props.devices?.data || []);
    const [devicePagination, setDevicePagination] = useState({
        current_page: props.devices?.current_page || 1,
        last_page: props.devices?.last_page || 1,
        per_page: props.devices?.per_page || 15,
        total: props.devices?.total || 0,
        from: props.devices?.from || 0,
        to: props.devices?.to || 0,
    });
    
    const [analytics, setAnalytics] = useState<DeviceAnalyticItem[]>(props.deviceAnalytics?.data || []);
    const [analyticsPagination, setAnalyticsPagination] = useState({
        current_page: props.deviceAnalytics?.current_page || 1,
        last_page: props.deviceAnalytics?.last_page || 1,
        per_page: props.deviceAnalytics?.per_page || 15,
        total: props.deviceAnalytics?.total || 0,
        from: props.deviceAnalytics?.from || 0,
        to: props.deviceAnalytics?.to || 0,
    });
    
    const [activeTab, setActiveTab] = useState<TabKey>('devices');
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const [search, setSearch] = useState(props.filters?.search || "");
    const [statusFilter, setStatusFilter] = useState(props.filters?.status || "");
    const [perPage, setPerPage] = useState(props.filters?.per_page || 15);
    const [analyticsPerPage, setAnalyticsPerPage] = useState(props.filters?.analytics_per_page || 15);
    const [showModal, setShowModal] = useState(false);
    const [editDevice, setEditDevice] = useState<DeviceItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState<DeviceForm>({ ...emptyForm });
    const [selected, setSelected] = useState<number[]>([]);

    // Refs for sticky behavior
    const statsRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const filtersRef = useRef<HTMLDivElement>(null);

    const stats = props.stats || { total: 0, online: 0, offline: 0, totalUsers: 0 };

    useEffect(() => {
        if (props.devices?.data) {
            setDevices(props.devices.data);
            setDevicePagination({
                current_page: props.devices.current_page,
                last_page: props.devices.last_page,
                per_page: props.devices.per_page,
                total: props.devices.total,
                from: props.devices.from,
                to: props.devices.to,
            });
        }
        setIsLoading(false);
    }, [props.devices]);

    useEffect(() => {
        if (props.deviceAnalytics?.data) {
            setAnalytics(props.deviceAnalytics.data);
            setAnalyticsPagination({
                current_page: props.deviceAnalytics.current_page,
                last_page: props.deviceAnalytics.last_page,
                per_page: props.deviceAnalytics.per_page,
                total: props.deviceAnalytics.total,
                from: props.deviceAnalytics.from,
                to: props.deviceAnalytics.to,
            });
        }
        setIsAnalyticsLoading(false);
    }, [props.deviceAnalytics]);

    const fetchDevices = (params: Record<string, any> = {}) => {
        setIsLoading(true);
        router.get(route('devices.index'), {
            ...params,
            search: search || undefined,
            status: statusFilter || undefined,
            per_page: perPage,
            tab: 'devices',
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsLoading(false),
        });
    };

    const fetchAnalytics = (page: number = 1, perPageVal: number = analyticsPerPage) => {
        setIsAnalyticsLoading(true);
        router.get(route('devices.index'), {
            tab: 'analytics',
            analytics_page: page,
            analytics_per_page: perPageVal,
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsAnalyticsLoading(false),
        });
    };

    const handleSearch = (value: string) => {
        setSearch(value);
        const timeoutId = setTimeout(() => {
            fetchDevices({ search: value, page: 1 });
        }, 300);
        return () => clearTimeout(timeoutId);
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        fetchDevices({ status: value, page: 1 });
    };

    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        fetchDevices({ per_page: value, page: 1 });
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= devicePagination.last_page) {
            fetchDevices({ page });
        }
    };

    const goToAnalyticsPage = (page: number) => {
        if (page >= 1 && page <= analyticsPagination.last_page) {
            fetchAnalytics(page);
        }
    };

    const handleAnalyticsPerPageChange = (value: number) => {
        setAnalyticsPerPage(value);
        fetchAnalytics(1, value);
    };

    const bg = isDark ? "#111827" : "#f8fafc";
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const inputBg = isDark ? "#374151" : "#f9fafb";

    const openAdd = () => {
        setForm({ ...emptyForm });
        setEditDevice(null);
        setShowModal(true);
    };
    
    const openEdit = (d: DeviceItem) => {
        setForm({
            name: d.name, sn: d.sn, ip: d.ip, area: d.area,
            timezone: d.timezone, transferMode: d.transferMode, heartbeat: d.heartbeat,
        });
        setEditDevice(d);
        setShowModal(true);
    };

    const handleSave = () => {
        if (!form.name || !form.sn || !form.ip || !form.area) {
            showToast("error", "Validation Error", "Please fill all required fields");
            return;
        }
        if (editDevice) {
            router.put(route("devices.update", editDevice.id), form, {
                onSuccess: () => {
                    setShowModal(false);
                    showToast("success", "Device Updated", "");
                    fetchDevices({ page: devicePagination.current_page });
                },
            });
        } else {
            router.post(route("devices.store"), form, {
                onSuccess: () => {
                    setShowModal(false);
                    showToast("success", "Device Added", "");
                    fetchDevices({ page: devicePagination.current_page });
                },
            });
        }
    };

    const handleDelete = (id: number) => {
        router.delete(route("devices.destroy", id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteId(null);
                setSelected((prev) => prev.filter((x) => x !== id));
                showToast("success", "Device Removed", "Device has been removed.");
                fetchDevices({ page: devicePagination.current_page });
            },
            onError: () => showToast("error", "Error", "Could not remove device."),
        });
    };

    const toggleSelect = (id: number) => {
        setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };
    
    const toggleAll = () => {
        setSelected((prev) => prev.length === devices.length ? [] : devices.map((d) => d.id));
    };

    const statusBadge = (status: DeviceItem["status"]) => {
        const map: Record<DeviceItem["status"], { bg: string; color: string; icon: string; label: string }> = {
            online: { bg: "#dcfce7", color: "#16a34a", icon: "ri-wifi-line", label: "Online" },
            offline: { bg: "#fee2e2", color: "#dc2626", icon: "ri-wifi-off-line", label: "Offline" },
            syncing: { bg: "#fef9c3", color: "#ca8a04", icon: "ri-refresh-line", label: "Syncing" },
            unregistered: { bg: "#f3f4f6", color: "#6b7280", icon: "ri-question-line", label: "Unregistered" },
        };
        const s = map[status] ?? map.offline;
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
                <i className={`${s.icon} text-xs`}></i> {s.label}
            </span>
        );
    };

    const inputClass = "w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors";
    const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
    const labelStyle = { color: textSecondary, fontSize: "12px", fontWeight: 500, marginBottom: "4px", display: "block" };

    // Mini sparkline for analytics
    const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
        if (!data || data.length === 0) return null;
        const max = Math.max(...data, 1);
        const w = 60;
        const h = 24;
        const points = data.map((v, i) => {
            const x = (i / (data.length - 1)) * w;
            const y = h - ((v / max) * h);
            return `${x},${y}`;
        }).join(' ');
        return (
            <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
                <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        );
    };

    // Device Pagination component
    const DevicePagination = () => {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, devicePagination.current_page - Math.floor(maxVisible / 2));
        let end = Math.min(devicePagination.last_page, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) pages.push(i);

        return (
            <div className="flex items-center justify-between mt-4 px-2">
                <div className="text-xs" style={{ color: textSecondary }}>
                    Showing {devicePagination.from} to {devicePagination.to} of {devicePagination.total} devices
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => goToPage(1)} disabled={devicePagination.current_page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80" style={{ color: textSecondary }}>
                        <i className="ri-arrow-left-double-line text-sm"></i>
                    </button>
                    <button onClick={() => goToPage(devicePagination.current_page - 1)} disabled={devicePagination.current_page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80" style={{ color: textSecondary }}>
                        <i className="ri-arrow-left-s-line text-sm"></i>
                    </button>
                    {pages.map(page => (
                        <button key={page} onClick={() => goToPage(page)} className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer transition-colors" style={{ background: devicePagination.current_page === page ? '#16a34a' : 'transparent', color: devicePagination.current_page === page ? '#fff' : textSecondary }}>
                            {page}
                        </button>
                    ))}
                    <button onClick={() => goToPage(devicePagination.current_page + 1)} disabled={devicePagination.current_page === devicePagination.last_page} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80" style={{ color: textSecondary }}>
                        <i className="ri-arrow-right-s-line text-sm"></i>
                    </button>
                    <button onClick={() => goToPage(devicePagination.last_page)} disabled={devicePagination.current_page === devicePagination.last_page} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80" style={{ color: textSecondary }}>
                        <i className="ri-arrow-right-double-line text-sm"></i>
                    </button>
                </div>
            </div>
        );
    };

    // Analytics Pagination component
    const AnalyticsPagination = () => {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, analyticsPagination.current_page - Math.floor(maxVisible / 2));
        let end = Math.min(analyticsPagination.last_page, start + maxVisible - 1);
        
        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }
        
        for (let i = start; i <= end; i++) pages.push(i);

        return (
            <div className="flex items-center justify-between mt-4 px-2">
                <div className="text-xs" style={{ color: textSecondary }}>
                    Showing {analyticsPagination.from} to {analyticsPagination.to} of {analyticsPagination.total} devices
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => goToAnalyticsPage(1)} disabled={analyticsPagination.current_page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80" style={{ color: textSecondary }}>
                        <i className="ri-arrow-left-double-line text-sm"></i>
                    </button>
                    <button onClick={() => goToAnalyticsPage(analyticsPagination.current_page - 1)} disabled={analyticsPagination.current_page === 1} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80" style={{ color: textSecondary }}>
                        <i className="ri-arrow-left-s-line text-sm"></i>
                    </button>
                    {pages.map(page => (
                        <button key={page} onClick={() => goToAnalyticsPage(page)} className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer transition-colors" style={{ background: analyticsPagination.current_page === page ? '#16a34a' : 'transparent', color: analyticsPagination.current_page === page ? '#fff' : textSecondary }}>
                            {page}
                        </button>
                    ))}
                    <button onClick={() => goToAnalyticsPage(analyticsPagination.current_page + 1)} disabled={analyticsPagination.current_page === analyticsPagination.last_page} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80" style={{ color: textSecondary }}>
                        <i className="ri-arrow-right-s-line text-sm"></i>
                    </button>
                    <button onClick={() => goToAnalyticsPage(analyticsPagination.last_page)} disabled={analyticsPagination.current_page === analyticsPagination.last_page} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80" style={{ color: textSecondary }}>
                        <i className="ri-arrow-right-double-line text-sm"></i>
                    </button>
                </div>
            </div>
        );
    };

    // Calculate analytics summary
    const totalPunchesToday = analytics.reduce((s, d) => s + (d.punchesToday || 0), 0);
    const avgSuccessRate = analytics.length > 0 
        ? (analytics.reduce((s, d) => s + d.successRate, 0) / analytics.length).toFixed(1) 
        : '0.0';
    const devicesWithActivity = analytics.filter(d => d.punchesToday > 0).length;
    const inactiveDevices = analytics.filter(d => d.punchesToday === 0).length;

    return (
        <AppLayout title="Devices">
            <div className="p-4 md:p-6" style={{ background: bg, minHeight: "100vh" }}>
                {/* Sticky Header */}
                <div className="sticky top-0 z-10 pb-4" style={{ background: bg }}>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold" style={{ color: textPrimary }}>Devices</h1>
                            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>
                                {stats.total} devices registered · {stats.online} online
                            </p>
                        </div>
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-opacity hover:opacity-90"
                            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                        >
                            <i className="ri-add-line"></i> Add Device
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div ref={statsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                        {isLoading && activeTab === 'devices' ? (
                            [...Array(4)].map((_, i) => <StatCardSkeleton key={i} isDark={isDark} />)
                        ) : (
                            [
                                { label: "Total Devices", value: stats.total, color: textPrimary, icon: "ri-device-line", bg: isDark ? '#374151' : '#f3f4f6' },
                                { label: "Online", value: stats.online, color: "#16a34a", icon: "ri-wifi-line", bg: '#dcfce7' },
                                { label: "Offline", value: stats.offline, color: "#dc2626", icon: "ri-wifi-off-line", bg: '#fee2e2' },
                                { label: "Total Users", value: stats.totalUsers, color: "#7c3aed", icon: "ri-team-line", bg: '#ede9fe' },
                            ].map((s) => (
                                <div key={s.label} className="p-4 md:p-5 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                                            <i className={`${s.icon} text-lg`} style={{ color: s.color }}></i>
                                        </div>
                                        <div>
                                            <p className="text-xl md:text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                                            <p className="text-xs" style={{ color: textSecondary }}>{s.label}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Tabs */}
                    <div ref={tabsRef} className="flex gap-1" style={{ borderBottom: `1px solid ${border}` }}>
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    if (tab.key === 'analytics' && analytics.length === 0) {
                                        fetchAnalytics(1);
                                    }
                                }}
                                className="flex items-center gap-2 px-5 py-3 text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
                                style={{
                                    color: activeTab === tab.key ? '#16a34a' : textSecondary,
                                    borderBottom: activeTab === tab.key ? '2px solid #16a34a' : '2px solid transparent',
                                }}
                            >
                                <i className={tab.icon}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Devices Tab */}
                {activeTab === 'devices' && (
                    <>
                        {/* Search + Filters - Sticky */}
                        <div ref={filtersRef} className="sticky top-[180px] z-10 py-3" style={{ background: bg }}>
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative flex-1 min-w-[200px] max-w-sm">
                                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: textSecondary }}></i>
                                    <input
                                        value={search}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Search devices..."
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                                        style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }}
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => handleStatusFilter(e.target.value)}
                                    className="px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                                    style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }}
                                >
                                    <option value="">All Status</option>
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                    <option value="unregistered">Unregistered</option>
                                </select>
                                <select
                                    value={perPage}
                                    onChange={(e) => handlePerPageChange(Number(e.target.value))}
                                    className="px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                                    style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }}
                                >
                                    {perPageOptions.map(n => <option key={n} value={n}>{n} per page</option>)}
                                </select>
                                {selected.length > 0 && (
                                    <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap" style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}>
                                        <i className="ri-delete-bin-line"></i> Delete ({selected.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
                            <div className="overflow-x-auto">
                                {isLoading ? (
                                    <FullTableSkeleton columns={11} rows={perPage} isDark={isDark} />
                                ) : (
                                    <table className="w-full min-w-[1000px]">
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${border}` }}>
                                                <th className="px-4 py-3 text-left w-10">
                                                    <input type="checkbox" checked={selected.length === devices.length && devices.length > 0} onChange={toggleAll} className="cursor-pointer" />
                                                </th>
                                                {["Device Name", "Serial Number", "Area", "IP Address", "State", "Last Activity", "Users", "FP", "Face", ""].map((h) => (
                                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {devices.map((d) => (
                                                <tr key={d.id} className="transition-colors" style={{ borderBottom: `1px solid ${border}` }}
                                                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? "#374151" : "#f9fafb"; }}
                                                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                                                >
                                                    <td className="px-4 py-3">
                                                        <input type="checkbox" checked={selected.includes(d.id)} onChange={() => toggleSelect(d.id)} className="cursor-pointer" />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button onClick={() => router.visit(`/devices/${d.id}`)} className="text-sm font-medium cursor-pointer hover:underline whitespace-nowrap" style={{ color: "#16a34a" }}>{d.name}</button>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{d.sn}</td>
                                                    <td className="px-4 py-3 text-sm font-medium whitespace-nowrap" style={{ color: textPrimary }}>{d.area}</td>
                                                    <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{d.ip}</td>
                                                    <td className="px-4 py-3">{statusBadge(d.status)}</td>
                                                    <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{d.lastActivity}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-center" style={{ color: textPrimary }}>{Number(d.users) || 0}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-center" style={{ color: textPrimary }}>{Number(d.fp) || 0}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-center" style={{ color: textPrimary }}>{Number(d.face) || 0}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1">
                                                            <button onClick={() => router.visit(`/devices/${d.id}`)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors" style={{ color: textSecondary }} title="View Details">
                                                                <i className="ri-eye-line text-sm"></i>
                                                            </button>
                                                            <button onClick={() => openEdit(d)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors" style={{ color: "#0891b2" }} title="Edit Device">
                                                                <i className="ri-edit-line text-sm"></i>
                                                            </button>
                                                            <button onClick={() => setDeleteId(d.id)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors" style={{ color: "#dc2626" }} title="Delete Device">
                                                                <i className="ri-delete-bin-line text-sm"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {!isLoading && devices.length === 0 && (
                                <div className="py-16 text-center" style={{ color: textSecondary }}>
                                    <i className="ri-device-line text-4xl mb-3 block"></i>
                                    <p className="text-sm">No devices found</p>
                                </div>
                            )}
                        </div>

                        {!isLoading && devices.length > 0 && <DevicePagination />}
                    </>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="space-y-5">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { label: "Total Punches Today", value: totalPunchesToday, icon: "ri-fingerprint-line", color: "#16a34a" },
                                { label: "Avg Success Rate", value: `${avgSuccessRate}%`, icon: "ri-checkbox-circle-line", color: "#0891b2" },
                                { label: "Devices with Activity", value: devicesWithActivity, icon: "ri-bar-chart-2-line", color: "#7c3aed" },
                                { label: "Inactive Devices", value: inactiveDevices, icon: "ri-alert-line", color: "#f59e0b" },
                            ].map((s) => (
                                <div key={s.label} className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}20` }}>
                                            <i className={`${s.icon} text-lg`} style={{ color: s.color }}></i>
                                        </div>
                                        <div>
                                            <p className="text-xl font-bold" style={{ color: textPrimary }}>{s.value}</p>
                                            <p className="text-xs" style={{ color: textSecondary }}>{s.label}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Per Page Selector for Analytics */}
                        <div className="flex justify-end">
                            <select
                                value={analyticsPerPage}
                                onChange={(e) => handleAnalyticsPerPageChange(Number(e.target.value))}
                                className="px-4 py-2 rounded-xl text-sm outline-none cursor-pointer"
                                style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }}
                            >
                                {perPageOptions.map(n => <option key={n} value={n}>{n} per page</option>)}
                            </select>
                        </div>

                        {/* Device Performance Table */}
                        <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
                            <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Device Performance Overview</h3>
                                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Today's activity and success rates</p>
                            </div>
                            <div className="overflow-x-auto">
                                {isAnalyticsLoading ? (
                                    <AnalyticsTableSkeleton rows={analyticsPerPage} isDark={isDark} />
                                ) : (
                                    <table className="w-full min-w-[800px]">
                                        <thead>
                                            <tr style={{ borderBottom: `1px solid ${border}` }}>
                                                {["Device", "Location", "Status", "Punches Today", "Last Sync", "Success Rate", "7-Day Trend"].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: textSecondary }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.map(dev => (
                                                <tr key={dev.id} style={{ borderBottom: `1px solid ${border}` }}
                                                    onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? "#374151" : "#f9fafb"; }}
                                                    onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 rounded-full" style={{ background: dev.status === 'online' ? '#16a34a' : '#dc2626' }}></div>
                                                            <span className="text-sm font-medium" style={{ color: textPrimary }}>{dev.deviceName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-xs" style={{ color: textSecondary }}>{dev.location}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: dev.status === 'online' ? '#dcfce7' : '#fee2e2', color: dev.status === 'online' ? '#16a34a' : '#dc2626' }}>
                                                            {dev.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-bold" style={{ color: dev.punchesToday > 0 ? textPrimary : textSecondary }}>
                                                        {dev.punchesToday || '—'}
                                                    </td>
                                                    <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{dev.lastSync}</td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? '#374151' : '#e5e7eb', minWidth: '60px' }}>
                                                                <div className="h-full rounded-full" style={{
                                                                    width: `${dev.successRate}%`,
                                                                    background: dev.successRate >= 95 ? '#16a34a' : dev.successRate >= 85 ? '#f59e0b' : '#dc2626',
                                                                }}></div>
                                                            </div>
                                                            <span className="text-xs font-semibold" style={{ color: textPrimary }}>{dev.successRate}%</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <MiniSparkline data={dev.weeklyPunches} color={dev.status === 'online' ? '#16a34a' : '#6b7280'} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {!isAnalyticsLoading && analytics.length === 0 && (
                                <div className="py-16 text-center" style={{ color: textSecondary }}>
                                    <i className="ri-bar-chart-2-line text-4xl mb-3 block"></i>
                                    <p className="text-sm">No analytics data available</p>
                                </div>
                            )}
                        </div>

                        {!isAnalyticsLoading && analytics.length > 0 && <AnalyticsPagination />}
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editDevice ? "Edit Device" : "Add New Device"}
                size="lg"
                footer={
                    <>
                        <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium" style={{ background: isDark ? "#374151" : "#f3f4f6", color: textSecondary }}>Cancel</button>
                        <button onClick={handleSave} className="px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white" style={{ background: "#16a34a" }}>{editDevice ? "Save Changes" : "Confirm"}</button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div><label style={labelStyle}>Device Name <span style={{ color: "#dc2626" }}>*</span></label><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. LEKKI BIOMETRICS" className={inputClass} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Serial Number <span style={{ color: "#dc2626" }}>*</span></label><input value={form.sn} onChange={(e) => setForm((f) => ({ ...f, sn: e.target.value }))} placeholder="e.g. BQC2254800XXX" className={inputClass} style={inputStyle} /></div>
                    <div><label style={labelStyle}>Device IP <span style={{ color: "#dc2626" }}>*</span></label><input value={form.ip} onChange={(e) => setForm((f) => ({ ...f, ip: e.target.value }))} placeholder="e.g. 192.168.1.199" className={inputClass} style={inputStyle} /></div>
                    <div>
                        <label style={labelStyle}>Area <span style={{ color: "#dc2626" }}>*</span></label>
                        <select value={form.area} onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))} className={inputClass} style={inputStyle}>
                            <option value="">Select Area</option>
                            {props.areas.map((a: any) => <option key={a.id} value={a.name}>{a.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Time Zone</label>
                        <select value={form.timezone} onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))} className={inputClass} style={inputStyle}>
                            {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Transfer Mode</label>
                        <select value={form.transferMode} onChange={(e) => setForm((f) => ({ ...f, transferMode: e.target.value }))} className={inputClass} style={inputStyle}>
                            {transferModes.map((m) => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Request Heartbeat (seconds)</label>
                        <input type="number" value={form.heartbeat} onChange={(e) => setForm((f) => ({ ...f, heartbeat: Number(e.target.value) || 60 }))} className={inputClass} style={inputStyle} />
                    </div>
                </div>
                <div className="mt-4 p-3 rounded-xl" style={{ background: isDark ? "#374151" : "#f0fdf4", border: `1px solid ${isDark ? "#4b5563" : "#bbf7d0"}` }}>
                    <p className="text-xs font-medium" style={{ color: "#16a34a" }}>
                        <i className="ri-information-line mr-1"></i>
                        Configure the device to point to: <span className="font-mono">https://engobio.coldstonecreamery.ng</span>
                    </p>
                </div>
            </Modal>

            {/* Delete Confirm */}
            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && handleDelete(deleteId)}
                title="Remove Device"
                message="Are you sure you want to remove this device? This action cannot be undone."
                confirmLabel="Remove"
                danger
            />
        </AppLayout>
    );
}