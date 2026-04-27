import { useState, useEffect, useRef, useCallback } from "react";
import { usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import Modal from "@/Components/base/Modal";
import ConfirmDialog from "@/Components/base/ConfirmDialog";
import { useEcho } from "@/hooks/useEcho";
import type { PageProps, DeviceItem, PendingDeviceItem } from "@/types";
import EmployeeManager from "./components/EmployeeManager";
import FlyoutPanel from "@/Components/base/FlyoutPanel";

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

type TabKey = "devices" | "analytics" | "employee-manager";

const TABS: {
    key: TabKey;
    label: string;
    icon: string;
    mobileLabel: string;
}[] = [
    {
        key: "devices",
        label: "Device List",
        icon: "ri-device-line",
        mobileLabel: "Devices",
    },
    {
        key: "analytics",
        label: "Device Analytics",
        icon: "ri-bar-chart-2-line",
        mobileLabel: "Analytics",
    },
    {
        key: "employee-manager",
        label: "Employee Manager",
        icon: "ri-exchange-line",
        mobileLabel: "Manager",
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

const getInitialTab = (): TabKey => {
    const hash = window.location.hash.slice(1);
    if (hash === "analytics") return "analytics";
    if (hash === "employee-manager") return "employee-manager";
    return "devices";
};

// ========== SKELETON LOADERS ==========
const StatCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    const bg = isDark ? "#374151" : "#e5e7eb";
    return (
        <div
            className="p-3 rounded-xl animate-pulse"
            style={{
                background: isDark ? "#1f2937" : "#ffffff",
                border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
            }}
        >
            <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-lg"
                    style={{ background: bg }}
                ></div>
                <div className="flex-1">
                    <div
                        className="w-12 h-5 rounded mb-1"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="w-16 h-3 rounded"
                        style={{ background: bg }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

const MobileCardSkeleton = ({ isDark }: { isDark: boolean }) => {
    const bg = isDark ? "#374151" : "#e5e7eb";
    const border = isDark ? "#374151" : "#e5e7eb";
    return (
        <div
            className="rounded-xl p-4 animate-pulse"
            style={{
                background: isDark ? "#1f2937" : "#ffffff",
                border: `1px solid ${border}`,
            }}
        >
            <div className="flex items-start gap-3 mb-3">
                <div
                    className="w-10 h-10 rounded-xl flex-shrink-0"
                    style={{ background: bg }}
                ></div>
                <div className="flex-1">
                    <div
                        className="w-3/4 h-4 rounded mb-1"
                        style={{ background: bg }}
                    ></div>
                    <div
                        className="w-1/2 h-3 rounded"
                        style={{ background: bg }}
                    ></div>
                </div>
                <div
                    className="w-16 h-6 rounded-full"
                    style={{ background: bg }}
                ></div>
            </div>
            <div className="space-y-2 mb-3">
                <div
                    className="w-full h-4 rounded"
                    style={{ background: bg }}
                ></div>
                <div
                    className="w-3/4 h-4 rounded"
                    style={{ background: bg }}
                ></div>
                <div
                    className="w-1/2 h-4 rounded"
                    style={{ background: bg }}
                ></div>
            </div>
            <div
                className="flex gap-2 pt-3 border-t"
                style={{ borderColor: border }}
            >
                <div
                    className="flex-1 h-10 rounded-lg"
                    style={{ background: bg }}
                ></div>
                <div
                    className="flex-1 h-10 rounded-lg"
                    style={{ background: bg }}
                ></div>
                <div
                    className="w-10 h-10 rounded-lg"
                    style={{ background: bg }}
                ></div>
            </div>
        </div>
    );
};

// ========== DEVICE CARD (Mobile) ==========
const DeviceCard = ({
    device,
    isDark,
    onView,
    onEdit,
    onDelete,
    onAssign,
}: {
    device: DeviceItem;
    isDark: boolean;
    onView: (id: number) => void;
    onEdit: (d: DeviceItem) => void;
    onDelete: (id: number) => void;
    onAssign: (id: number) => void;
}) => {
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const cardBg = isDark ? "#1f2937" : "#ffffff";

    const statusConfig: Record<
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
    const status = statusConfig[device.status] || statusConfig.offline;

    return (
        <div
            className="rounded-xl p-4"
            style={{ background: cardBg, border: `1px solid ${border}` }}
        >
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${status.color}15` }}
                >
                    <i
                        className="ri-device-line text-lg"
                        style={{ color: status.color }}
                    ></i>
                </div>
                <div className="flex-1 min-w-0">
                    <h3
                        className="font-semibold text-sm truncate"
                        style={{ color: textPrimary }}
                    >
                        {device.name}
                    </h3>
                    <p
                        className="text-xs font-mono truncate"
                        style={{ color: textSecondary }}
                    >
                        {device.sn}
                    </p>
                </div>
                <span
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0"
                    style={{ background: status.bg, color: status.color }}
                >
                    <span
                        className={`w-1.5 h-1.5 rounded-full ${device.status === "online" ? "animate-pulse" : ""}`}
                        style={{ background: status.color }}
                    ></span>
                    {status.label}
                </span>
            </div>

            {/* Details */}
            <div className="space-y-1.5 mb-3 text-sm">
                <div className="flex">
                    <span
                        className="w-16 text-xs flex-shrink-0"
                        style={{ color: textSecondary }}
                    >
                        Area:
                    </span>
                    <span className="truncate" style={{ color: textPrimary }}>
                        {device.area || "-"}
                    </span>
                </div>
                <div className="flex">
                    <span
                        className="w-16 text-xs flex-shrink-0"
                        style={{ color: textSecondary }}
                    >
                        IP:
                    </span>
                    <span
                        className="truncate font-mono"
                        style={{ color: textPrimary }}
                    >
                        {device.ip || "-"}
                    </span>
                </div>
                <div className="flex">
                    <span
                        className="w-16 text-xs flex-shrink-0"
                        style={{ color: textSecondary }}
                    >
                        Users:
                    </span>
                    <span style={{ color: textPrimary }}>
                        {device.users || 0}
                    </span>
                </div>
                <div className="flex">
                    <span
                        className="w-16 text-xs flex-shrink-0"
                        style={{ color: textSecondary }}
                    >
                        Activity:
                    </span>
                    <span className="truncate" style={{ color: textPrimary }}>
                        {device.lastActivity || "Never"}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div
                className="flex items-center gap-2 pt-3 border-t"
                style={{ borderColor: border }}
            >
                <button
                    onClick={() => onView(device.id)}
                    className="flex-1 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                    style={{
                        background: isDark ? "#374151" : "#f3f4f6",
                        color: textSecondary,
                    }}
                >
                    <i className="ri-eye-line"></i>View
                </button>
                <button
                    onClick={() => onEdit(device)}
                    className="flex-1 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 text-white"
                    style={{ background: "#0891b2" }}
                >
                    <i className="ri-edit-line"></i>Edit
                </button>
                <button
                    onClick={() => onDelete(device.id)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "#fee2e2", color: "#dc2626" }}
                >
                    <i className="ri-delete-bin-line"></i>
                </button>
                <button
                    onClick={() => onAssign(device.id)}
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ color: "#7c3aed" }}
                    title="Assign Employees"
                >
                    <i className="ri-user-add-line"></i>
                </button>
            </div>
        </div>
    );
};

// ========== MAIN COMPONENT ==========
export default function DevicesPage() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const { props } = usePage<Props>();
    const { subscribe } = useEcho();

    // MOVED INSIDE THE COMPONENT - THESE WERE THE CAUSE OF THE ERROR
    const [showEmployeeManager, setShowEmployeeManager] = useState(false);
    const [selectedDeviceForManager, setSelectedDeviceForManager] = useState<
        number | null
    >(null);

    const [devices, setDevices] = useState<DeviceItem[]>(
        props.devices?.data || [],
    );
    const [pagination, setPagination] = useState({
        current_page: props.devices?.current_page || 1,
        last_page: props.devices?.last_page || 1,
        per_page: props.devices?.per_page || 15,
        total: props.devices?.total || 0,
        from: props.devices?.from || 0,
        to: props.devices?.to || 0,
    });
    const [liveStats, setLiveStats] = useState(
        props.stats || { total: 0, online: 0, offline: 0, totalUsers: 0 },
    );
    const [analytics, setAnalytics] = useState<DeviceAnalyticItem[]>(
        props.deviceAnalytics?.data || [],
    );
    const [analyticsPagination, setAnalyticsPagination] = useState({
        current_page: props.deviceAnalytics?.current_page || 1,
        last_page: props.deviceAnalytics?.last_page || 1,
        per_page: props.deviceAnalytics?.per_page || 15,
        total: props.deviceAnalytics?.total || 0,
    });

    const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab());
    const [isLoading, setIsLoading] = useState(false);
    const [isAnalyticsLoading, setIsAnalyticsLoading] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editDevice, setEditDevice] = useState<DeviceItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState<DeviceForm>({ ...emptyForm });

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [perPage, setPerPage] = useState(15);
    const [analyticsPerPage, setAnalyticsPerPage] = useState(15);

    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const bg = isDark ? "#111827" : "#f8fafc";
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const inputBg = isDark ? "#374151" : "#f9fafb";

    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        window.location.hash = tab;
        if (tab === "analytics" && !analytics.length) fetchAnalytics();
    };

    // WebSocket for real-time updates
    // In devices/Index.tsx, update the WebSocket useEffect:

    useEffect(() => {
        const unsubscribe = subscribe(
            "devices",
            ".device.status",
            (data: any) => {
                // Only update device status, not full page reload
                setDevices((prev) =>
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

                // Update stats without full refresh
                setLiveStats((prev) => {
                    const device = devices.find((d) => d.id === data.id);
                    const wasOnline = device?.status === "online";
                    const isOnline = data.status === "online";
                    if (wasOnline === isOnline) return prev;
                    return {
                        ...prev,
                        online: prev.online + (isOnline ? 1 : -1),
                        offline: prev.offline + (isOnline ? -1 : 1),
                    };
                });

                // Show toast notification for status change
                showToast(
                    "info",
                    "Device Status",
                    `${device?.name} is now ${data.status}`,
                    { duration: 3000 },
                );
            },
        );
        return unsubscribe;
    }, [subscribe, devices]);

    // Polling fallback
    useEffect(() => {
        const interval = setInterval(() => {
            fetch("/devices/api/devices/live-stats", {
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    Accept: "application/json",
                },
            })
                .then((res) => res.json())
                .then((data) => {
                    if (data.heartbeats)
                        setDevices((prev) =>
                            prev.map((d) => ({
                                ...d,
                                status: data.heartbeats[d.sn]
                                    ? "online"
                                    : "offline",
                            })),
                        );
                    if (data.online !== undefined)
                        setLiveStats((prev) => ({
                            ...prev,
                            online: data.online,
                            offline: data.total - data.online,
                        }));
                })
                .catch(() => {});
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDevices = useCallback(
        (params: Record<string, any> = {}) => {
            setIsLoading(true);
            router.get(
                route("devices.index"),
                {
                    search:
                        params.search !== undefined
                            ? params.search
                            : search || undefined,
                    status:
                        params.status !== undefined
                            ? params.status
                            : statusFilter || undefined,
                    per_page:
                        params.per_page !== undefined
                            ? params.per_page
                            : perPage,
                    page: params.page ?? 1,
                    tab: "devices",
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    onFinish: () => setIsLoading(false),
                },
            );
        },
        [search, statusFilter, perPage],
    );

    const fetchAnalytics = useCallback(
        (page: number = 1) => {
            setIsAnalyticsLoading(true);
            router.get(
                route("devices.index"),
                {
                    tab: "analytics",
                    analytics_page: page,
                    analytics_per_page: analyticsPerPage,
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

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(
            () => fetchDevices({ search: value, page: 1 }),
            400,
        );
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        fetchDevices({ status: value || undefined, page: 1 });
    };
    const handlePerPageChange = (value: number) => {
        setPerPage(value);
        fetchDevices({ per_page: value, page: 1 });
    };
    const goToPage = (page: number) => {
        if (page >= 1 && page <= pagination.last_page) fetchDevices({ page });
    };

    useEffect(() => {
        if (props.devices?.data) {
            setDevices(props.devices.data);
            setPagination({
                current_page: props.devices.current_page,
                last_page: props.devices.last_page,
                per_page: props.devices.per_page,
                total: props.devices.total,
                from: props.devices.from,
                to: props.devices.to,
            });
            setIsLoading(false);
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

    useEffect(() => {
        const interval = setInterval(() => {
            if (activeTab === "devices") {
                fetchDevices({ page: pagination.current_page });
            }
            if (activeTab === "analytics") {
                fetchAnalytics(analyticsPagination.current_page);
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [activeTab, pagination.current_page]);

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
        const url = editDevice
            ? route("devices.update", editDevice.id)
            : route("devices.store");
        router[editDevice ? "put" : "post"](url, form, {
            onSuccess: () => {
                setShowModal(false);
                showToast(
                    "success",
                    editDevice ? "Device Updated" : "Device Added",
                    "",
                );
                fetchDevices({ page: pagination.current_page });
            },
        });
    };

    const handleDelete = (id: number) => {
        router.delete(route("devices.destroy", id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteId(null);
                showToast("success", "Device Removed", "");
                fetchDevices({ page: pagination.current_page });
            },
            onError: () =>
                showToast("error", "Error", "Could not remove device."),
        });
    };

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

    return (
        <AppLayout title="Devices">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1
                            className="text-xl sm:text-2xl font-bold"
                            style={{ color: textPrimary }}
                        >
                            Devices
                        </h1>
                        <p
                            className="text-xs sm:text-sm mt-0.5"
                            style={{ color: textSecondary }}
                        >
                            {liveStats.total} devices · {liveStats.online}{" "}
                            online
                        </p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                        style={{
                            background:
                                "linear-gradient(135deg, #16a34a, #15803d)",
                        }}
                    >
                        <i className="ri-add-line"></i> Add Device
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                    {isLoading && !devices.length
                        ? [...Array(4)].map((_, i) => (
                              <StatCardSkeleton key={i} isDark={isDark} />
                          ))
                        : [
                              {
                                  label: "Total",
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
                                  label: "Users",
                                  value: liveStats.totalUsers,
                                  icon: "ri-team-line",
                                  color: "#7c3aed",
                                  bg: "#ede9fe",
                              },
                          ].map((s) => (
                              <div
                                  key={s.label}
                                  className="p-3 rounded-xl"
                                  style={{
                                      background: cardBg,
                                      border: `1px solid ${border}`,
                                  }}
                              >
                                  <div className="flex items-center gap-2">
                                      <div
                                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                          style={{ background: s.bg }}
                                      >
                                          <i
                                              className={`${s.icon} text-base`}
                                              style={{ color: s.color }}
                                          ></i>
                                      </div>
                                      <div className="min-w-0">
                                          <p
                                              className="text-lg font-bold truncate"
                                              style={{ color: s.color }}
                                          >
                                              {s.value}
                                          </p>
                                          <p
                                              className="text-xs truncate"
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
                    className="flex gap-1 overflow-x-auto"
                    style={{ borderBottom: `1px solid ${border}` }}
                >
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => handleTabChange(tab.key)}
                            className="flex items-center gap-1.5 px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-medium cursor-pointer whitespace-nowrap"
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
                            <span className="hidden sm:inline">
                                {tab.label}
                            </span>
                            <span className="sm:hidden">{tab.mobileLabel}</span>
                        </button>
                    ))}
                </div>

                {/* Devices Tab - Same as before, but update DeviceCard to pass onAssign */}
                {activeTab === "devices" && (
                    <>
                        {/* Filters */}
                        <div>
                            <button
                                onClick={() =>
                                    setShowMobileFilters(!showMobileFilters)
                                }
                                className="sm:hidden w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium mb-2"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${border}`,
                                    color: textPrimary,
                                }}
                            >
                                <span className="flex items-center gap-2">
                                    <i className="ri-filter-3-line"></i> Filters
                                </span>
                                <i
                                    className={`ri-arrow-${showMobileFilters ? "up" : "down"}-s-line`}
                                ></i>
                            </button>
                            <div
                                className={`${showMobileFilters ? "flex" : "hidden"} sm:flex flex-col gap-2 sm:flex-row sm:gap-3`}
                            >
                                <div className="relative flex-1">
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
                                <div className="grid grid-cols-2 gap-2 sm:flex">
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
                                </div>
                            </div>
                        </div>

                        {/* Desktop Table */}
                        <div
                            className="hidden sm:block rounded-xl overflow-hidden"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div className="overflow-x-auto">
                                {isLoading ? (
                                    <div
                                        className="divide-y"
                                        style={{ borderColor: border }}
                                    >
                                        {[...Array(perPage)].map((_, i) => (
                                            <MobileCardSkeleton
                                                key={i}
                                                isDark={isDark}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <table className="w-full min-w-[900px]">
                                        <thead>
                                            <tr
                                                style={{
                                                    borderBottom: `1px solid ${border}`,
                                                }}
                                            >
                                                {[
                                                    "Device",
                                                    "Serial",
                                                    "Area",
                                                    "IP",
                                                    "Status",
                                                    "Activity",
                                                    "Users",
                                                    "FP",
                                                    "Face",
                                                    "",
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
                                            {devices.map((d) => {
                                                const s =
                                                    d.status === "online"
                                                        ? {
                                                              bg: "#dcfce7",
                                                              color: "#16a34a",
                                                          }
                                                        : {
                                                              bg: "#fee2e2",
                                                              color: "#dc2626",
                                                          };
                                                return (
                                                    <tr
                                                        key={d.id}
                                                        style={{
                                                            borderBottom: `1px solid ${border}`,
                                                        }}
                                                        className="hover:bg-opacity-50"
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
                                                            <button
                                                                onClick={() =>
                                                                    router.visit(
                                                                        `/devices/${d.id}`,
                                                                    )
                                                                }
                                                                className="text-sm font-medium hover:underline"
                                                                style={{
                                                                    color: "#16a34a",
                                                                }}
                                                            >
                                                                {d.name}
                                                            </button>
                                                            <div
                                                                className="text-xs font-mono"
                                                                style={{
                                                                    color: textSecondary,
                                                                }}
                                                            >
                                                                {d.sn}
                                                            </div>
                                                        </td>
                                                        <td
                                                            className="px-4 py-3 text-sm"
                                                            style={{
                                                                color: textPrimary,
                                                            }}
                                                        >
                                                            {d.area || "-"}
                                                        </td>
                                                        <td
                                                            className="px-4 py-3 text-xs font-mono"
                                                            style={{
                                                                color: textSecondary,
                                                            }}
                                                        >
                                                            {d.ip || "-"}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                                                style={{
                                                                    background:
                                                                        s.bg,
                                                                    color: s.color,
                                                                }}
                                                            >
                                                                <span
                                                                    className={`w-1.5 h-1.5 rounded-full ${d.status === "online" ? "animate-pulse" : ""}`}
                                                                    style={{
                                                                        background:
                                                                            s.color,
                                                                    }}
                                                                ></span>
                                                                {d.status}
                                                            </span>
                                                        </td>
                                                        <td
                                                            className="px-4 py-3 text-xs"
                                                            style={{
                                                                color: textSecondary,
                                                            }}
                                                        >
                                                            {d.lastActivity ||
                                                                "Never"}
                                                        </td>
                                                        <td
                                                            className="px-4 py-3 text-sm text-center"
                                                            style={{
                                                                color: textPrimary,
                                                            }}
                                                        >
                                                            {d.users || 0}
                                                        </td>
                                                        <td
                                                            className="px-4 py-3 text-sm text-center"
                                                            style={{
                                                                color: textPrimary,
                                                            }}
                                                        >
                                                            {d.fp || 0}
                                                        </td>
                                                        <td
                                                            className="px-4 py-3 text-sm text-center"
                                                            style={{
                                                                color: textPrimary,
                                                            }}
                                                        >
                                                            {d.face || 0}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    onClick={() =>
                                                                        router.visit(
                                                                            `/devices/${d.id}`,
                                                                        )
                                                                    }
                                                                    className="w-7 h-7 flex items-center justify-center rounded-lg"
                                                                    style={{
                                                                        color: textSecondary,
                                                                    }}
                                                                    title="View"
                                                                >
                                                                    <i className="ri-eye-line"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        openEdit(
                                                                            d,
                                                                        )
                                                                    }
                                                                    className="w-7 h-7 flex items-center justify-center rounded-lg"
                                                                    style={{
                                                                        color: "#0891b2",
                                                                    }}
                                                                    title="Edit"
                                                                >
                                                                    <i className="ri-edit-line"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedDeviceForManager(
                                                                            d.id,
                                                                        );
                                                                        setShowEmployeeManager(
                                                                            true,
                                                                        );
                                                                    }}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-lg"
                                                                    style={{
                                                                        color: "#7c3aed",
                                                                    }}
                                                                    title="Assign Employees"
                                                                >
                                                                    <i className="ri-user-add-line"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setDeleteId(
                                                                            d.id,
                                                                        )
                                                                    }
                                                                    className="w-7 h-7 flex items-center justify-center rounded-lg"
                                                                    style={{
                                                                        color: "#dc2626",
                                                                    }}
                                                                    title="Delete"
                                                                >
                                                                    <i className="ri-delete-bin-line"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            {!isLoading && !devices.length && (
                                <div
                                    className="py-16 text-center"
                                    style={{ color: textSecondary }}
                                >
                                    <i className="ri-device-line text-4xl mb-3 block"></i>
                                    <p>No devices found</p>
                                </div>
                            )}
                        </div>

                        {/* Mobile Cards */}
                        <div className="sm:hidden space-y-3">
                            {isLoading ? (
                                [...Array(perPage)].map((_, i) => (
                                    <MobileCardSkeleton
                                        key={i}
                                        isDark={isDark}
                                    />
                                ))
                            ) : devices.length > 0 ? (
                                devices.map((d) => (
                                    <DeviceCard
                                        key={d.id}
                                        device={d}
                                        isDark={isDark}
                                        onView={(id) =>
                                            router.visit(`/devices/${id}`)
                                        }
                                        onEdit={openEdit}
                                        onDelete={(id) => setDeleteId(id)}
                                        onAssign={(id) => {
                                            setSelectedDeviceForManager(id);
                                            setShowEmployeeManager(true);
                                        }}
                                    />
                                ))
                            ) : (
                                <div
                                    className="py-16 text-center rounded-xl"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    <i
                                        className="ri-device-line text-4xl mb-3 block"
                                        style={{ color: textSecondary }}
                                    ></i>
                                    <p style={{ color: textSecondary }}>
                                        No devices found
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {!isLoading && devices.length > 0 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                <div
                                    className="text-xs"
                                    style={{ color: textSecondary }}
                                >
                                    Showing {pagination.from}-{pagination.to} of{" "}
                                    {pagination.total}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => goToPage(1)}
                                        disabled={pagination.current_page === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-50"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-arrow-left-double-line"></i>
                                    </button>
                                    <button
                                        onClick={() =>
                                            goToPage(
                                                pagination.current_page - 1,
                                            )
                                        }
                                        disabled={pagination.current_page === 1}
                                        className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-50"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-arrow-left-s-line"></i>
                                    </button>
                                    {[
                                        ...Array(
                                            Math.min(5, pagination.last_page),
                                        ),
                                    ].map((_, i) => {
                                        let page =
                                            pagination.last_page <= 5
                                                ? i + 1
                                                : pagination.current_page <= 3
                                                  ? i + 1
                                                  : pagination.current_page >=
                                                      pagination.last_page - 2
                                                    ? pagination.last_page -
                                                      4 +
                                                      i
                                                    : pagination.current_page -
                                                      2 +
                                                      i;
                                        return (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium"
                                                style={{
                                                    background:
                                                        pagination.current_page ===
                                                        page
                                                            ? "#16a34a"
                                                            : "transparent",
                                                    color:
                                                        pagination.current_page ===
                                                        page
                                                            ? "#fff"
                                                            : textSecondary,
                                                }}
                                            >
                                                {page}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() =>
                                            goToPage(
                                                pagination.current_page + 1,
                                            )
                                        }
                                        disabled={
                                            pagination.current_page ===
                                            pagination.last_page
                                        }
                                        className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-50"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-arrow-right-s-line"></i>
                                    </button>
                                    <button
                                        onClick={() =>
                                            goToPage(pagination.last_page)
                                        }
                                        disabled={
                                            pagination.current_page ===
                                            pagination.last_page
                                        }
                                        className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-50"
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
                    <div className="space-y-4">
                        {/* Analytics Summary Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                            {[
                                {
                                    label: "Punches Today",
                                    value: totalPunchesToday,
                                    icon: "ri-hand-coin-line",
                                    color: "#16a34a",
                                    bg: "#dcfce7",
                                },
                                {
                                    label: "Avg Success Rate",
                                    value: `${avgSuccessRate}%`,
                                    icon: "ri-percent-line",
                                    color: "#0891b2",
                                    bg: "#e0f2fe",
                                },
                                {
                                    label: "Active Devices",
                                    value: devicesWithActivity,
                                    icon: "ri-checkbox-circle-line",
                                    color: "#7c3aed",
                                    bg: "#ede9fe",
                                },
                                {
                                    label: "Inactive Devices",
                                    value: inactiveDevices,
                                    icon: "ri-error-warning-line",
                                    color: "#dc2626",
                                    bg: "#fee2e2",
                                },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="p-3 rounded-xl"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: s.bg }}
                                        >
                                            <i
                                                className={`${s.icon} text-base`}
                                                style={{ color: s.color }}
                                            ></i>
                                        </div>
                                        <div className="min-w-0">
                                            <p
                                                className="text-lg font-bold truncate"
                                                style={{ color: s.color }}
                                            >
                                                {s.value}
                                            </p>
                                            <p
                                                className="text-xs truncate"
                                                style={{ color: textSecondary }}
                                            >
                                                {s.label}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Analytics Table */}
                        <div
                            className="rounded-xl overflow-hidden"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            {isAnalyticsLoading ? (
                                <div
                                    className="p-8 text-center"
                                    style={{ color: textSecondary }}
                                >
                                    <i className="ri-loader-4-line animate-spin text-3xl mb-2 block"></i>
                                    <p className="text-sm">
                                        Loading analytics...
                                    </p>
                                </div>
                            ) : analytics.length === 0 ? (
                                <div
                                    className="py-16 text-center"
                                    style={{ color: textSecondary }}
                                >
                                    <i className="ri-bar-chart-2-line text-4xl mb-3 block"></i>
                                    <p>No analytics data available</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
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
                                                    "Weekly Total",
                                                    "Success Rate",
                                                    "Last Sync",
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
                                            {analytics.map((a) => (
                                                <tr
                                                    key={a.id}
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
                                                        <p
                                                            className="text-sm font-medium"
                                                            style={{
                                                                color: textPrimary,
                                                            }}
                                                        >
                                                            {a.deviceName}
                                                        </p>
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-sm"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {a.location}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                                                            style={{
                                                                background:
                                                                    a.status ===
                                                                    "online"
                                                                        ? "#dcfce7"
                                                                        : "#fee2e2",
                                                                color:
                                                                    a.status ===
                                                                    "online"
                                                                        ? "#16a34a"
                                                                        : "#dc2626",
                                                            }}
                                                        >
                                                            <span
                                                                className={`w-1.5 h-1.5 rounded-full ${a.status === "online" ? "animate-pulse" : ""}`}
                                                                style={{
                                                                    background:
                                                                        a.status ===
                                                                        "online"
                                                                            ? "#16a34a"
                                                                            : "#dc2626",
                                                                }}
                                                            ></span>
                                                            {a.status}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-sm font-semibold"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {a.punchesToday}
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-sm"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {a.weeklyPunches?.reduce(
                                                            (s, n) => s + n,
                                                            0,
                                                        ) ?? 0}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="flex-1 h-1.5 rounded-full"
                                                                style={{
                                                                    background:
                                                                        isDark
                                                                            ? "#374151"
                                                                            : "#e5e7eb",
                                                                }}
                                                            >
                                                                <div
                                                                    className="h-1.5 rounded-full"
                                                                    style={{
                                                                        width: `${a.successRate}%`,
                                                                        background:
                                                                            a.successRate >=
                                                                            80
                                                                                ? "#16a34a"
                                                                                : a.successRate >=
                                                                                    50
                                                                                  ? "#ca8a04"
                                                                                  : "#dc2626",
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span
                                                                className="text-xs font-medium w-10 text-right"
                                                                style={{
                                                                    color: textPrimary,
                                                                }}
                                                            >
                                                                {a.successRate}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td
                                                        className="px-4 py-3 text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {a.lastSync}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Analytics Pagination */}
                        {!isAnalyticsLoading &&
                            analyticsPagination.last_page > 1 && (
                                <div className="flex items-center justify-between">
                                    <span
                                        className="text-xs"
                                        style={{ color: textSecondary }}
                                    >
                                        Page {analyticsPagination.current_page}{" "}
                                        of {analyticsPagination.last_page} ·{" "}
                                        {analyticsPagination.total} devices
                                    </span>
                                    <div className="flex items-center gap-1">
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
                                            className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-50"
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
                                            className="w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-50"
                                            style={{ color: textSecondary }}
                                        >
                                            <i className="ri-arrow-right-s-line"></i>
                                        </button>
                                    </div>
                                </div>
                            )}
                    </div>
                )}

                {/* Employee Manager Tab */}
                {activeTab === "employee-manager" && <EmployeeManager />}
            </div>

            {/* Modals */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editDevice ? "Edit Device" : "Add Device"}
                size="lg"
                footer={
                    <>
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-sm rounded-lg"
                            style={{
                                background: isDark ? "#374151" : "#f3f4f6",
                                color: textSecondary,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2 text-sm rounded-lg font-semibold text-white"
                            style={{ background: "#16a34a" }}
                        >
                            Save
                        </button>
                    </>
                }
            >
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label
                            className="text-xs font-medium mb-1 block"
                            style={{ color: textSecondary }}
                        >
                            Name *
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
                            Serial *
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
                            IP *
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
                            Area *
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
                            <option value="">Select</option>
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
                            Timezone
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
                                <option key={tz}>{tz}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label
                            className="text-xs font-medium mb-1 block"
                            style={{ color: textSecondary }}
                        >
                            Heartbeat (s)
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
            </Modal>
            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && handleDelete(deleteId)}
                title="Remove Device"
                message="Are you sure?"
                confirmLabel="Remove"
                danger
            />

            {/* Flyout Panel for Assign Employees */}
            <FlyoutPanel
                open={showEmployeeManager}
                onClose={() => setShowEmployeeManager(false)}
                title="Employee Device Manager"
                subtitle={`Manage employees for ${devices.find((d) => d.id === selectedDeviceForManager)?.name || ""}`}
                width="900px"
                side="right"
            >
                {selectedDeviceForManager && (
                    <EmployeeManager
                        initialDeviceId={selectedDeviceForManager}
                        onClose={() => setShowEmployeeManager(false)}
                    />
                )}
            </FlyoutPanel>
        </AppLayout>
    );
}
