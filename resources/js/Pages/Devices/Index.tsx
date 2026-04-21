import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import Modal from "@/Components/base/Modal";
import ConfirmDialog from "@/Components/base/ConfirmDialog";
import { useEcho } from "@/hooks/useEcho";
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
    };
}

type TabKey = "devices" | "analytics";

const TABS: { key: TabKey; label: string; icon: string }[] = [
    { key: "devices", label: "Device List", icon: "ri-device-line" },
    {
        key: "analytics",
        label: "Device Analytics",
        icon: "ri-bar-chart-2-line",
    },
];

const timezones = [
    "Africa/Lagos",
    "Africa/Nairobi",
    "Africa/Cairo",
    "UTC",
    "Europe/London",
    "America/New_York",
];
const transferModes = ["Real-Time", "Scheduled", "Manual"];
const perPageOptions = [10, 15, 25, 50, 100];

const emptyForm = {
    name: "",
    sn: "",
    ip: "",
    area: "",
    timezone: "Africa/Lagos",
    transferMode: "Real-Time",
    heartbeat: 60,
};
type DeviceForm = typeof emptyForm;

// Skeleton Components (unchanged)
const FullTableSkeleton = ({
    columns,
    rows = 10,
    isDark,
}: {
    columns: number;
    rows?: number;
    isDark: boolean;
}) => {
    const bg = isDark ? "#374151" : "#e5e7eb";
    const headerBg = isDark ? "#1f2937" : "#f9fafb";
    return (
        <div className="animate-pulse w-full">
            <div
                className="flex items-center px-4 py-3 border-b"
                style={{
                    background: headerBg,
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                }}
            >
                <div
                    className="w-4 h-4 rounded mr-3"
                    style={{ background: bg }}
                ></div>
                {[...Array(columns - 2)].map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                ))}
                <div
                    className="w-20 h-4 rounded ml-2"
                    style={{ background: bg }}
                ></div>
            </div>
            {[...Array(rows)].map((_, i) => (
                <div
                    key={i}
                    className="flex items-center px-4 py-3 border-b"
                    style={{ borderColor: isDark ? "#374151" : "#e5e7eb" }}
                >
                    <div
                        className="w-4 h-4 rounded mr-3"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-6 rounded-full mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="w-20 h-8 rounded-lg ml-2"
                        style={{ background: bg }}
                    ></div>
                </div>
            ))}
        </div>
    );
};

const AnalyticsTableSkeleton = ({
    rows = 10,
    isDark,
}: {
    rows?: number;
    isDark: boolean;
}) => {
    const bg = isDark ? "#374151" : "#e5e7eb";
    const headerBg = isDark ? "#1f2937" : "#f9fafb";
    return (
        <div className="animate-pulse w-full">
            <div
                className="flex items-center px-4 py-3 border-b"
                style={{
                    background: headerBg,
                    borderColor: isDark ? "#374151" : "#e5e7eb",
                }}
            >
                {[...Array(7)].map((_, i) => (
                    <div
                        key={i}
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                ))}
            </div>
            {[...Array(rows)].map((_, i) => (
                <div
                    key={i}
                    className="flex items-center px-4 py-3 border-b"
                    style={{ borderColor: isDark ? "#374151" : "#e5e7eb" }}
                >
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-6 rounded-full mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="flex-1 h-4 rounded mx-2"
                        style={{ background: bg }}
                    ></div>
                </div>
            ))}
        </div>
    );
};

export default function DevicesPage() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const { props } = usePage<Props>();
    const { subscribe } = useEcho();

    // ========== STATE ==========
    // Master device list from server
    const [masterDevices, setMasterDevices] = useState<DeviceItem[]>(
        props.devices?.data || [],
    );

    // Live stats (updated via WebSocket)
    const [liveStats, setLiveStats] = useState(
        props.stats || { total: 0, online: 0, offline: 0, totalUsers: 0 },
    );

    // Analytics data
    const [analytics, setAnalytics] = useState<DeviceAnalyticItem[]>(
        props.deviceAnalytics?.data || [],
    );
    const [analyticsPagination, setAnalyticsPagination] = useState({
        current_page: props.deviceAnalytics?.current_page || 1,
        last_page: props.deviceAnalytics?.last_page || 1,
        per_page: props.deviceAnalytics?.per_page || 15,
        total: props.deviceAnalytics?.total || 0,
    });

    // UI State
    const [activeTab, setActiveTab] = useState<TabKey>("devices");
    const [isTableLoading, setIsTableLoading] = useState(false);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editDevice, setEditDevice] = useState<DeviceItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState<DeviceForm>({ ...emptyForm });
    const [selected, setSelected] = useState<number[]>([]);

    // Filter State - CLIENT SIDE for instant response
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [perPage, setPerPage] = useState(15);
    const [currentPage, setCurrentPage] = useState(1);
    const [analyticsPerPage, setAnalyticsPerPage] = useState(15);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const statsRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const filtersRef = useRef<HTMLDivElement>(null);

    // ========== WEBSOCKET - Real-time device status (with fallback) ==========
    useEffect(() => {
        // Try to subscribe - if Echo is not configured, this silently fails
        const unsubscribe = subscribe(
            "devices",
            ".device.status",
            (data: any) => {
                setMasterDevices((prev) =>
                    prev.map((d) =>
                        d.id === data.id
                            ? {
                                  ...d,
                                  status: data.status,
                                  lastActivity: data.lastSeen,
                                  users: data.users,
                                  fp: data.fp,
                                  face: data.face,
                              }
                            : d,
                    ),
                );

                setLiveStats((prev) => {
                    const device = masterDevices.find((d) => d.id === data.id);
                    const wasOnline = device?.status === "online";
                    const isOnline = data.status === "online";
                    if (wasOnline === isOnline) return prev;
                    return {
                        ...prev,
                        online: prev.online + (isOnline ? 1 : -1),
                        offline: prev.offline + (isOnline ? -1 : 1),
                    };
                });
            },
        );

        return unsubscribe;
    }, [subscribe, masterDevices]);

    // ========== POLLING FALLBACK - When WebSockets are not available ==========
    useEffect(() => {
        // Only poll if we don't have real-time updates
        let interval: NodeJS.Timeout | null = null;

        // Poll every 30 seconds to refresh device statuses
        interval = setInterval(() => {
            // Silently fetch latest device stats without triggering loading state
            fetch("/api/devices/live-stats", {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.heartbeats) {
                        // Update device statuses based on heartbeat data
                        setMasterDevices((prev) =>
                            prev.map((d) => ({
                                ...d,
                                status: data.heartbeats[d.sn]
                                    ? "online"
                                    : "offline",
                            })),
                        );
                    }
                    if (data.online !== undefined) {
                        setLiveStats((prev) => ({
                            ...prev,
                            online: data.online,
                            offline: data.total - data.online,
                        }));
                    }
                })
                .catch(() => {}); // Silent fail
        }, 30000); // Every 30 seconds

        return () => {
            if (interval) clearInterval(interval);
        };
    }, []);
    // ========== CLIENT-SIDE FILTERING (Instant) ==========
    const filteredDevices = useMemo(() => {
        if (!masterDevices.length) return [];

        return masterDevices.filter((d) => {
            const matchesSearch =
                !search ||
                d.name.toLowerCase().includes(search.toLowerCase()) ||
                d.sn.toLowerCase().includes(search.toLowerCase()) ||
                (d.area || "").toLowerCase().includes(search.toLowerCase());

            const matchesStatus = !statusFilter || d.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [masterDevices, search, statusFilter]);

    // Paginated devices
    const paginatedDevices = useMemo(() => {
        if (!filteredDevices.length) return [];
        const start = (currentPage - 1) * perPage;
        const end = Math.min(start + perPage, filteredDevices.length);
        return filteredDevices.slice(start, end);
    }, [filteredDevices, currentPage, perPage]);

    // Calculate total pages
    const totalPages = Math.max(1, Math.ceil(filteredDevices.length / perPage));

    // Reset to page 1 when filters change
    // Ensure current page is valid
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    // ========== DATA FETCHING (Server sync only) ==========
    const fetchDevices = useCallback(
        async (params: Record<string, any> = {}) => {
            setIsTableLoading(true);
            router.get(
                route("devices.index"),
                {
                    ...params,
                    search: search || undefined,
                    status: statusFilter || undefined,
                    per_page: perPage,
                    tab: "devices",
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => setIsTableLoading(false),
                },
            );
        },
        [search, statusFilter, perPage],
    );

    const fetchAnalytics = useCallback(
        (page: number = 1, perPageVal: number = analyticsPerPage) => {
            setIsAnalyticsLoading(true);
            router.get(
                route("devices.index"),
                {
                    tab: "analytics",
                    analytics_page: page,
                    analytics_per_page: perPageVal,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => setIsAnalyticsLoading(false),
                },
            );
        },
        [analyticsPerPage],
    );

    // Debounced search sync to server
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1); // Reset to first page
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            fetchDevices({ search: value, page: 1 });
        }, 500);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1); // Reset to first page
        fetchDevices({ status: value, page: 1 });
    };
    
    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        setCurrentPage(1);
        fetchDevices({ per_page: value, page: 1 });
    };

    // ========== SYNC FROM PROPS ==========
    useEffect(() => {
        if (props.devices?.data) {
            setMasterDevices(props.devices.data);
            setIsTableLoading(false);
        }
        if (props.stats) setLiveStats(props.stats);
    }, [props.devices, props.stats]);

    useEffect(() => {
        if (props.deviceAnalytics?.data) {
            setAnalytics(props.deviceAnalytics.data);
            setAnalyticsPagination({
                current_page: props.deviceAnalytics.current_page,
                last_page: props.deviceAnalytics.last_page,
                per_page: props.deviceAnalytics.per_page,
                total: props.deviceAnalytics.total,
            });
            setIsAnalyticsLoading(false);
        }
    }, [props.deviceAnalytics]);

    // ========== MODAL HANDLERS ==========
    const openAdd = () => {
        setForm({ ...emptyForm });
        setEditDevice(null);
        setShowModal(true);
    };
    const openEdit = (d: DeviceItem) => {
        setForm({
            name: d.name,
            sn: d.sn,
            ip: d.ip,
            area: d.area,
            timezone: d.timezone,
            transferMode: d.transferMode,
            heartbeat: d.heartbeat,
        });
        setEditDevice(d);
        setShowModal(true);
    };

    const handleSave = () => {
        if (!form.name || !form.sn || !form.ip || !form.area) {
            showToast(
                "error",
                "Validation Error",
                "Please fill all required fields",
            );
            return;
        }
        if (editDevice) {
            router.put(route("devices.update", editDevice.id), form, {
                onSuccess: () => {
                    setShowModal(false);
                    showToast("success", "Device Updated", "");
                    fetchDevices({ page: currentPage });
                },
            });
        } else {
            router.post(route("devices.store"), form, {
                onSuccess: () => {
                    setShowModal(false);
                    showToast("success", "Device Added", "");
                    fetchDevices({ page: 1 });
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
                showToast(
                    "success",
                    "Device Removed",
                    "Device has been removed.",
                );
                fetchDevices({ page: currentPage });
            },
            onError: () =>
                showToast("error", "Error", "Could not remove device."),
        });
    };

    const toggleSelect = (id: number) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };
    const toggleAll = () => {
        setSelected((prev) =>
            prev.length === masterDevices.length
                ? []
                : masterDevices.map((d) => d.id),
        );
    };

    // ========== THEME ==========
    const bg = isDark ? "#111827" : "#f8fafc";
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const inputBg = isDark ? "#374151" : "#f9fafb";

    const statusBadge = (status: string) => {
        const map: Record<
            string,
            { bg: string; color: string; label: string }
        > = {
            online: { bg: "#dcfce7", color: "#16a34a", label: "Online" },
            offline: { bg: "#fee2e2", color: "#dc2626", label: "Offline" },
            syncing: { bg: "#fef9c3", color: "#ca8a04", label: "Syncing" },
            unregistered: {
                bg: "#f3f4f6",
                color: "#6b7280",
                label: "Unregistered",
            },
        };
        const s = map[status] || map.offline;
        return (
            <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: s.bg, color: s.color }}
            >
                <span
                    className={`w-1.5 h-1.5 rounded-full ${status === "online" ? "animate-pulse" : ""}`}
                    style={{ background: s.color }}
                ></span>
                {s.label}
            </span>
        );
    };

    const MiniSparkline = ({
        data,
        color,
    }: {
        data: number[];
        color: string;
    }) => {
        if (!data?.length) return null;
        const max = Math.max(...data, 1);
        const points = data
            .map(
                (v, i) =>
                    `${(i / (data.length - 1)) * 60},${24 - (v / max) * 24}`,
            )
            .join(" ");
        return (
            <svg width={60} height={24}>
                <polyline
                    points={points}
                    fill="none"
                    stroke={color}
                    strokeWidth="1.5"
                />
            </svg>
        );
    };

    // Analytics calculations
    const totalPunchesToday = analytics.reduce(
        (s, d) => s + (d.punchesToday || 0),
        0,
    );
    const avgSuccessRate = analytics.length
        ? (
              analytics.reduce((s, d) => s + d.successRate, 0) /
              analytics.length
          ).toFixed(1)
        : "0.0";
    const devicesWithActivity = analytics.filter(
        (d) => d.punchesToday > 0,
    ).length;
    const inactiveDevices = analytics.filter(
        (d) => d.punchesToday === 0,
    ).length;

    // ========== RENDER ==========
    return (
        <AppLayout title="Devices">
            <div
                className="p-4 md:p-6"
                style={{ background: bg, minHeight: "100vh" }}
            >
                {/* Sticky Header */}
                <div
                    className="sticky top-0 z-10 pb-4"
                    style={{ background: bg }}
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1
                                className="text-xl md:text-2xl font-bold"
                                style={{ color: textPrimary }}
                            >
                                Devices
                            </h1>
                            <p
                                className="text-sm mt-0.5"
                                style={{ color: textSecondary }}
                            >
                                {liveStats.total} devices registered ·{" "}
                                {liveStats.online} online
                            </p>
                        </div>
                        <button
                            onClick={openAdd}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
                            style={{
                                background:
                                    "linear-gradient(135deg, #16a34a, #15803d)",
                            }}
                        >
                            <i className="ri-add-line"></i> Add Device
                        </button>
                    </div>

                    {/* Stats Cards - Never show skeleton after initial load */}
                    <div
                        ref={statsRef}
                        className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6"
                    >
                        {[
                            {
                                label: "Total Devices",
                                value: liveStats.total,
                                icon: "ri-device-line",
                                color: textPrimary,
                                bg: isDark ? "#374151" : "#f3f4f6",
                            },
                            {
                                label: "Online",
                                value: liveStats.online,
                                icon: "ri-wifi-line",
                                color: "#16a34a",
                                bg: "#dcfce7",
                            },
                            {
                                label: "Offline",
                                value: liveStats.offline,
                                icon: "ri-wifi-off-line",
                                color: "#dc2626",
                                bg: "#fee2e2",
                            },
                            {
                                label: "Total Users",
                                value: liveStats.totalUsers,
                                icon: "ri-team-line",
                                color: "#7c3aed",
                                bg: "#ede9fe",
                            },
                        ].map((s) => (
                            <div
                                key={s.label}
                                className="p-4 md:p-5 rounded-xl"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${border}`,
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                        style={{ background: s.bg }}
                                    >
                                        <i
                                            className={`${s.icon} text-lg`}
                                            style={{ color: s.color }}
                                        ></i>
                                    </div>
                                    <div>
                                        <p
                                            className="text-xl md:text-2xl font-bold"
                                            style={{ color: s.color }}
                                        >
                                            {s.value}
                                        </p>
                                        <p
                                            className="text-xs"
                                            style={{ color: textSecondary }}
                                        >
                                            {s.label}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tabs */}
                    <div
                        ref={tabsRef}
                        className="flex gap-1"
                        style={{ borderBottom: `1px solid ${border}` }}
                    >
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    if (
                                        tab.key === "analytics" &&
                                        !analytics.length
                                    )
                                        fetchAnalytics();
                                }}
                                className="flex items-center gap-2 px-5 py-3 text-sm font-medium cursor-pointer whitespace-nowrap"
                                style={{
                                    color:
                                        activeTab === tab.key
                                            ? "#16a34a"
                                            : textSecondary,
                                    borderBottom:
                                        activeTab === tab.key
                                            ? "2px solid #16a34a"
                                            : "2px solid transparent",
                                }}
                            >
                                <i className={tab.icon}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Devices Tab */}
                {activeTab === "devices" && (
                    <>
                        {/* Filters - Sticky */}
                        <div
                            ref={filtersRef}
                            className="sticky top-[180px] z-10 py-3"
                            style={{ background: bg }}
                        >
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="relative flex-1 min-w-[200px] max-w-sm">
                                    <i
                                        className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                                        style={{ color: textSecondary }}
                                    ></i>
                                    <input
                                        value={search}
                                        onChange={(e) =>
                                            handleSearchChange(e.target.value)
                                        }
                                        placeholder="Search devices..."
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                                        style={{
                                            background: cardBg,
                                            border: `1px solid ${border}`,
                                            color: textPrimary,
                                        }}
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        handleStatusChange(e.target.value)
                                    }
                                    className="px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                >
                                    <option value="">All Status</option>
                                    <option value="online">Online</option>
                                    <option value="offline">Offline</option>
                                    <option value="unregistered">
                                        Unregistered
                                    </option>
                                </select>
                                <select
                                    value={perPage}
                                    onChange={(e) =>
                                        handlePerPageChange(
                                            Number(e.target.value),
                                        )
                                    }
                                    className="px-4 py-2.5 rounded-xl text-sm outline-none cursor-pointer"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                >
                                    {perPageOptions.map((n) => (
                                        <option key={n} value={n}>
                                            {n} per page
                                        </option>
                                    ))}
                                </select>
                                {selected.length > 0 && (
                                    <button
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap"
                                        style={{
                                            background: "#fef2f2",
                                            color: "#dc2626",
                                            border: "1px solid #fecaca",
                                        }}
                                    >
                                        <i className="ri-delete-bin-line"></i>{" "}
                                        Delete ({selected.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div
                            className="rounded-xl overflow-hidden"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div className="overflow-x-auto">
                                {isTableLoading && !masterDevices.length ? (
                                    <FullTableSkeleton
                                        columns={11}
                                        rows={perPage}
                                        isDark={isDark}
                                    />
                                ) : (
                                    <table className="w-full min-w-[1000px]">
                                        <thead>
                                            <tr
                                                style={{
                                                    borderBottom: `1px solid ${border}`,
                                                }}
                                            >
                                                <th className="px-4 py-3 text-left w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            selected.length ===
                                                                masterDevices.length &&
                                                            masterDevices.length >
                                                                0
                                                        }
                                                        onChange={toggleAll}
                                                        className="cursor-pointer"
                                                    />
                                                </th>
                                                {[
                                                    "Device Name",
                                                    "Serial Number",
                                                    "Area",
                                                    "IP Address",
                                                    "State",
                                                    "Last Activity",
                                                    "Users",
                                                    "FP",
                                                    "Face",
                                                    "",
                                                ].map((h) => (
                                                    <th
                                                        key={h}
                                                        className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedDevices.map((d) => (
                                                <tr
                                                    key={d.id}
                                                    style={{
                                                        borderBottom: `1px solid ${border}`,
                                                    }}
                                                    onMouseEnter={(e) =>
                                                        (e.currentTarget.style.background =
                                                            isDark
                                                                ? "#374151"
                                                                : "#f9fafb")
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.currentTarget.style.background =
                                                            "transparent")
                                                    }
                                                >
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected.includes(
                                                                d.id,
                                                            )}
                                                            onChange={() =>
                                                                toggleSelect(
                                                                    d.id,
                                                                )
                                                            }
                                                            className="cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() =>
                                                                router.visit(
                                                                    `/devices/${d.id}`,
                                                                )
                                                            }
                                                            className="text-sm font-medium cursor-pointer hover:underline whitespace-nowrap"
                                                            style={{
                                                                color: "#16a34a",
                                                            }}
                                                        >
                                                            {d.name}
                                                        </button>
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-xs font-mono"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {d.sn}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-sm font-medium whitespace-nowrap"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {d.area}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-xs font-mono"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {d.ip}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {statusBadge(d.status)}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-xs whitespace-nowrap"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {d.lastActivity}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-sm font-medium text-center"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {Number(d.users) || 0}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-sm font-medium text-center"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {Number(d.fp) || 0}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-sm font-medium text-center"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {Number(d.face) || 0}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() =>
                                                                    router.visit(
                                                                        `/devices/${d.id}`,
                                                                    )
                                                                }
                                                                className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                                                                style={{
                                                                    color: textSecondary,
                                                                }}
                                                            >
                                                                <i className="ri-eye-line text-sm"></i>
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    openEdit(d)
                                                                }
                                                                className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                                                                style={{
                                                                    color: "#0891b2",
                                                                }}
                                                            >
                                                                <i className="ri-edit-line text-sm"></i>
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    setDeleteId(
                                                                        d.id,
                                                                    )
                                                                }
                                                                className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                                                                style={{
                                                                    color: "#dc2626",
                                                                }}
                                                            >
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
                            {!isTableLoading && !filteredDevices.length && (
                                <div
                                    className="py-16 text-center"
                                    style={{ color: textSecondary }}
                                >
                                    <i className="ri-device-line text-4xl mb-3 block"></i>
                                    <p className="text-sm">No devices found</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {filteredDevices.length > 0 && (
                            <div className="flex items-center justify-between mt-4 px-2">
                                <div
                                    className="text-xs"
                                    style={{ color: textSecondary }}
                                >
                                    Showing {(currentPage - 1) * perPage + 1} to{" "}
                                    {Math.min(
                                        currentPage * perPage,
                                        filteredDevices.length,
                                    )}{" "}
                                    of {filteredDevices.length} devices
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-arrow-left-double-line"></i>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.max(1, p - 1),
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-arrow-left-s-line"></i>
                                    </button>
                                    {[...Array(Math.min(5, totalPages))].map(
                                        (_, i) => {
                                            let pageNum =
                                                totalPages <= 5
                                                    ? i + 1
                                                    : currentPage <= 3
                                                      ? i + 1
                                                      : currentPage >=
                                                          totalPages - 2
                                                        ? totalPages - 4 + i
                                                        : currentPage - 2 + i;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() =>
                                                        setCurrentPage(pageNum)
                                                    }
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer"
                                                    style={{
                                                        background:
                                                            currentPage ===
                                                            pageNum
                                                                ? "#16a34a"
                                                                : "transparent",
                                                        color:
                                                            currentPage ===
                                                            pageNum
                                                                ? "#fff"
                                                                : textSecondary,
                                                    }}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        },
                                    )}
                                    <button
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1),
                                            )
                                        }
                                        disabled={currentPage === totalPages}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-arrow-right-s-line"></i>
                                    </button>
                                    <button
                                        onClick={() =>
                                            setCurrentPage(totalPages)
                                        }
                                        disabled={currentPage === totalPages}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-arrow-right-double-line"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Analytics Tab */}
                {activeTab === "analytics" && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                {
                                    label: "Total Punches Today",
                                    value: totalPunchesToday,
                                    icon: "ri-fingerprint-line",
                                    color: "#16a34a",
                                },
                                {
                                    label: "Avg Success Rate",
                                    value: `${avgSuccessRate}%`,
                                    icon: "ri-checkbox-circle-line",
                                    color: "#0891b2",
                                },
                                {
                                    label: "Devices with Activity",
                                    value: devicesWithActivity,
                                    icon: "ri-bar-chart-2-line",
                                    color: "#7c3aed",
                                },
                                {
                                    label: "Inactive Devices",
                                    value: inactiveDevices,
                                    icon: "ri-alert-line",
                                    color: "#f59e0b",
                                },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="p-4 rounded-xl"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{
                                                background: `${s.color}20`,
                                            }}
                                        >
                                            <i
                                                className={`${s.icon} text-lg`}
                                                style={{ color: s.color }}
                                            ></i>
                                        </div>
                                        <div>
                                            <p
                                                className="text-xl font-bold"
                                                style={{ color: textPrimary }}
                                            >
                                                {s.value}
                                            </p>
                                            <p
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                {s.label}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end">
                            <select
                                value={analyticsPerPage}
                                onChange={(e) => {
                                    setAnalyticsPerPage(Number(e.target.value));
                                    fetchAnalytics(1, Number(e.target.value));
                                }}
                                className="px-4 py-2 rounded-xl text-sm outline-none cursor-pointer"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${border}`,
                                    color: textPrimary,
                                }}
                            >
                                {perPageOptions.map((n) => (
                                    <option key={n} value={n}>
                                        {n} per page
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div
                            className="rounded-xl overflow-hidden"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div
                                className="px-5 py-3.5"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <h3
                                    className="text-sm font-semibold"
                                    style={{ color: textPrimary }}
                                >
                                    Device Performance Overview
                                </h3>
                                <p
                                    className="text-xs mt-0.5"
                                    style={{ color: textSecondary }}
                                >
                                    Today's activity and success rates
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                {isAnalyticsLoading ? (
                                    <AnalyticsTableSkeleton
                                        rows={analyticsPerPage}
                                        isDark={isDark}
                                    />
                                ) : (
                                    <table className="w-full min-w-[800px]">
                                        <thead>
                                            <tr
                                                style={{
                                                    borderBottom: `1px solid ${border}`,
                                                }}
                                            >
                                                {[
                                                    "Device",
                                                    "Location",
                                                    "Status",
                                                    "Punches Today",
                                                    "Last Sync",
                                                    "Success Rate",
                                                    "7-Day Trend",
                                                ].map((h) => (
                                                    <th
                                                        key={h}
                                                        className="px-4 py-3 text-left text-xs font-semibold"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analytics.map((dev) => (
                                                <tr
                                                    key={dev.id}
                                                    style={{
                                                        borderBottom: `1px solid ${border}`,
                                                    }}
                                                    onMouseEnter={(e) =>
                                                        (e.currentTarget.style.background =
                                                            isDark
                                                                ? "#374151"
                                                                : "#f9fafb")
                                                    }
                                                    onMouseLeave={(e) =>
                                                        (e.currentTarget.style.background =
                                                            "transparent")
                                                    }
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-2 h-2 rounded-full"
                                                                style={{
                                                                    background:
                                                                        dev.status ===
                                                                        "online"
                                                                            ? "#16a34a"
                                                                            : "#dc2626",
                                                                }}
                                                            ></div>
                                                            <span
                                                                className="text-sm font-medium"
                                                                style={{
                                                                    color: textPrimary,
                                                                }}
                                                            >
                                                                {dev.deviceName}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {dev.location}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                                                            style={{
                                                                background:
                                                                    dev.status ===
                                                                    "online"
                                                                        ? "#dcfce7"
                                                                        : "#fee2e2",
                                                                color:
                                                                    dev.status ===
                                                                    "online"
                                                                        ? "#16a34a"
                                                                        : "#dc2626",
                                                            }}
                                                        >
                                                            {dev.status}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-sm font-bold"
                                                        style={{
                                                            color:
                                                                dev.punchesToday >
                                                                0
                                                                    ? textPrimary
                                                                    : textSecondary,
                                                        }}
                                                    >
                                                        {dev.punchesToday ||
                                                            "—"}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-xs font-mono"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {dev.lastSync}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="flex-1 h-1.5 rounded-full overflow-hidden"
                                                                style={{
                                                                    background:
                                                                        isDark
                                                                            ? "#374151"
                                                                            : "#e5e7eb",
                                                                    minWidth:
                                                                        "60px",
                                                                }}
                                                            >
                                                                <div
                                                                    className="h-full rounded-full"
                                                                    style={{
                                                                        width: `${dev.successRate}%`,
                                                                        background:
                                                                            dev.successRate >=
                                                                            95
                                                                                ? "#16a34a"
                                                                                : dev.successRate >=
                                                                                    85
                                                                                  ? "#f59e0b"
                                                                                  : "#dc2626",
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span
                                                                className="text-xs font-semibold"
                                                                style={{
                                                                    color: textPrimary,
                                                                }}
                                                            >
                                                                {
                                                                    dev.successRate
                                                                }
                                                                %
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <MiniSparkline
                                                            data={
                                                                dev.weeklyPunches
                                                            }
                                                            color={
                                                                dev.status ===
                                                                "online"
                                                                    ? "#16a34a"
                                                                    : "#6b7280"
                                                            }
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {!isAnalyticsLoading && !analytics.length && (
                                <div
                                    className="py-16 text-center"
                                    style={{ color: textSecondary }}
                                >
                                    <i className="ri-bar-chart-2-line text-4xl mb-3 block"></i>
                                    <p className="text-sm">
                                        No analytics data available
                                    </p>
                                </div>
                            )}
                        </div>
                        {analytics.length > 0 && (
                            <div className="flex items-center justify-between mt-4 px-2">
                                <div
                                    className="text-xs"
                                    style={{ color: textSecondary }}
                                >
                                    Page {analyticsPagination.current_page} of{" "}
                                    {analyticsPagination.last_page}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => fetchAnalytics(1)}
                                        disabled={
                                            analyticsPagination.current_page ===
                                            1
                                        }
                                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-arrow-left-double-line"></i>
                                    </button>
                                    <button
                                        onClick={() =>
                                            fetchAnalytics(
                                                analyticsPagination.current_page -
                                                    1,
                                            )
                                        }
                                        disabled={
                                            analyticsPagination.current_page ===
                                            1
                                        }
                                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-arrow-left-s-line"></i>
                                    </button>
                                    <button
                                        onClick={() =>
                                            fetchAnalytics(
                                                analyticsPagination.current_page +
                                                    1,
                                            )
                                        }
                                        disabled={
                                            analyticsPagination.current_page ===
                                            analyticsPagination.last_page
                                        }
                                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-arrow-right-s-line"></i>
                                    </button>
                                    <button
                                        onClick={() =>
                                            fetchAnalytics(
                                                analyticsPagination.last_page,
                                            )
                                        }
                                        disabled={
                                            analyticsPagination.current_page ===
                                            analyticsPagination.last_page
                                        }
                                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-arrow-right-double-line"></i>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editDevice ? "Edit Device" : "Add New Device"}
                size="lg"
                footer={
                    <>
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-sm rounded-lg cursor-pointer font-medium"
                            style={{
                                background: isDark ? "#374151" : "#f3f4f6",
                                color: textSecondary,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2 text-sm rounded-lg cursor-pointer font-semibold text-white"
                            style={{ background: "#16a34a" }}
                        >
                            {editDevice ? "Save Changes" : "Confirm"}
                        </button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label
                            className="text-xs font-medium mb-1 block"
                            style={{ color: textSecondary }}
                        >
                            Device Name <span className="text-red-600">*</span>
                        </label>
                        <input
                            value={form.name}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, name: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        />
                    </div>
                    <div>
                        <label
                            className="text-xs font-medium mb-1 block"
                            style={{ color: textSecondary }}
                        >
                            Serial Number{" "}
                            <span className="text-red-600">*</span>
                        </label>
                        <input
                            value={form.sn}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, sn: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        />
                    </div>
                    <div>
                        <label
                            className="text-xs font-medium mb-1 block"
                            style={{ color: textSecondary }}
                        >
                            Device IP <span className="text-red-600">*</span>
                        </label>
                        <input
                            value={form.ip}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, ip: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        />
                    </div>
                    <div>
                        <label
                            className="text-xs font-medium mb-1 block"
                            style={{ color: textSecondary }}
                        >
                            Area <span className="text-red-600">*</span>
                        </label>
                        <select
                            value={form.area}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, area: e.target.value }))
                            }
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        >
                            <option value="">Select Area</option>
                            {props.areas.map((a: any) => (
                                <option key={a.id} value={a.name}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label
                            className="text-xs font-medium mb-1 block"
                            style={{ color: textSecondary }}
                        >
                            Time Zone
                        </label>
                        <select
                            value={form.timezone}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    timezone: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        >
                            {timezones.map((tz) => (
                                <option key={tz} value={tz}>
                                    {tz}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label
                            className="text-xs font-medium mb-1 block"
                            style={{ color: textSecondary }}
                        >
                            Transfer Mode
                        </label>
                        <select
                            value={form.transferMode}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    transferMode: e.target.value,
                                }))
                            }
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        >
                            {transferModes.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label
                            className="text-xs font-medium mb-1 block"
                            style={{ color: textSecondary }}
                        >
                            Heartbeat (seconds)
                        </label>
                        <input
                            type="number"
                            value={form.heartbeat}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    heartbeat: Number(e.target.value) || 60,
                                }))
                            }
                            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        />
                    </div>
                </div>
                <div
                    className="mt-4 p-3 rounded-xl"
                    style={{
                        background: isDark ? "#374151" : "#f0fdf4",
                        border: `1px solid ${isDark ? "#4b5563" : "#bbf7d0"}`,
                    }}
                >
                    <p
                        className="text-xs font-medium"
                        style={{ color: "#16a34a" }}
                    >
                        <i className="ri-information-line mr-1"></i>Configure
                        device to:{" "}
                        <span className="font-mono">
                            https://engobio.coldstonecreamery.ng
                        </span>
                    </p>
                </div>
            </Modal>
            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && handleDelete(deleteId)}
                title="Remove Device"
                message="Are you sure? This cannot be undone."
                confirmLabel="Remove"
                danger
            />
        </AppLayout>
    );
}
