import { useState, useEffect, useRef, useCallback } from "react";
import { usePage, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useEcho } from "@/hooks/useEcho";
import type { PageProps } from "@/types";

interface DeviceStatus {
    id: number;
    sn: string;
    name: string;
    area: string;
    ip: string;
    status: string;
    users: number;
    fp: number;
    face: number;
    last_seen: string;
    is_online: boolean;
}

interface PunchFeed {
    id: number;
    employee_id: string;
    employee_name: string;
    initials: string;
    department: string;
    device: string;
    device_name: string;
    timestamp: string;
    time: string;
    date: string;
    punch_type: string;
    verify_mode: string;
    type: "IN" | "OUT";
    status: string;
    color: string;
    avatar_bg: string;
}

interface CheckedInEmployee {
    employee_id: string;
    name: string;
    initials: string;
    department: string;
    check_in_time: string;
    duration: string;
    device: string;
}

interface LiveStats {
    total_devices: number;
    online_devices: number;
    offline_devices: number;
    punches_today: number;
    check_ins_today: number;
    check_outs_today: number;
    failed_attempts: number;
    last_updated: string;
}

interface ActivityBreakdown {
    check_in: number;
    check_out: number;
    fingerprint: number;
    face: number;
    card: number;
}

interface Props extends PageProps {
    initialFeed: PunchFeed[];
    devices: DeviceStatus[];
    stats: LiveStats;
    checkedIn: CheckedInEmployee[];
    activityBreakdown: ActivityBreakdown;
}

export default function LiveMonitorPage() {
    const { isDark } = useTheme();
    const { props } = usePage<Props>();
    const { subscribe } = useEcho();

    // State
    const [feed, setFeed] = useState<PunchFeed[]>(props.initialFeed || []);
    const [devices, setDevices] = useState<DeviceStatus[]>(props.devices || []);
    const [stats, setStats] = useState<LiveStats>(props.stats);
    const [checkedIn, setCheckedIn] = useState<CheckedInEmployee[]>(
        props.checkedIn || [],
    );
    const [activityBreakdown, setActivityBreakdown] =
        useState<ActivityBreakdown>(props.activityBreakdown);

    // UI State
    const [isLive, setIsLive] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(false);
    const [filterMode, setFilterMode] = useState<string>("all");
    const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
    const [showDeviceList, setShowDeviceList] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string>(
        new Date().toISOString(),
    );

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const feedContainerRef = useRef<HTMLDivElement>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Theme
    const bg = isDark ? "#111827" : "#f8fafc";
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";

    // ========== WEBSOCKET - Real-time attendance ==========
    useEffect(() => {
        const unsubscribe = subscribe(
            "attendance",
            ".attendance.recorded",
            (data: any) => {
                if (!isLive) return;

                // Add new punch to feed
                setFeed((prev) => [data, ...prev].slice(0, 100));

                // Play sound if enabled
                if (soundEnabled) {
                    playBeep(data.status === "failed");
                }

                // Update stats
                setStats((prev) => ({
                    ...prev,
                    punches_today: prev.punches_today + 1,
                    check_ins_today:
                        data.type === "IN"
                            ? prev.check_ins_today + 1
                            : prev.check_ins_today,
                    check_outs_today:
                        data.type === "OUT"
                            ? prev.check_outs_today + 1
                            : prev.check_outs_today,
                    failed_attempts:
                        data.status === "failed"
                            ? prev.failed_attempts + 1
                            : prev.failed_attempts,
                    last_updated: new Date().toISOString(),
                }));

                // Update activity breakdown
                setActivityBreakdown((prev) => ({
                    ...prev,
                    check_in:
                        data.type === "IN" ? prev.check_in + 1 : prev.check_in,
                    check_out:
                        data.type === "OUT"
                            ? prev.check_out + 1
                            : prev.check_out,
                    fingerprint:
                        data.punch_type === "fingerprint"
                            ? prev.fingerprint + 1
                            : prev.fingerprint,
                    face:
                        data.punch_type === "face" ? prev.face + 1 : prev.face,
                    card:
                        data.punch_type === "card" ? prev.card + 1 : prev.card,
                }));

                setLastUpdate(new Date().toISOString());
            },
        );

        // Subscribe to device status changes
        const deviceUnsubscribe = subscribe(
            "devices",
            ".device.status",
            (data: any) => {
                setDevices((prev) =>
                    prev.map((d) =>
                        d.id === data.deviceId
                            ? {
                                  ...d,
                                  status: data.status,
                                  is_online: data.status === "online",
                              }
                            : d,
                    ),
                );

                setStats((prev) => ({
                    ...prev,
                    online_devices: devices.filter((d) => d.is_online).length,
                    offline_devices: devices.filter((d) => !d.is_online).length,
                }));
            },
        );

        return () => {
            unsubscribe();
            deviceUnsubscribe();
        };
    }, [subscribe, isLive, soundEnabled, devices]);

    // ========== POLLING FALLBACK ==========
    useEffect(() => {
        if (!isLive) return;

        const pollFeed = async () => {
            try {
                const res = await fetch(
                    `/api/live-monitor/feed?since=${lastUpdate}`,
                    {
                        headers: {
                            "X-Requested-With": "XMLHttpRequest",
                            Accept: "application/json",
                        },
                    },
                );

                if (!res.ok) return;

                const data = await res.json();

                if (data.feed?.length > 0) {
                    setFeed((prev) => [...data.feed, ...prev].slice(0, 100));
                    setLastUpdate(data.server_time);
                }

                if (data.stats) {
                    setStats(data.stats);
                }

                if (data.heartbeats) {
                    setDevices((prev) =>
                        prev.map((d) => ({
                            ...d,
                            is_online: data.heartbeats[d.sn] === 1,
                        })),
                    );
                }
            } catch (error) {
                // Silent fail
            }
        };

        pollingIntervalRef.current = setInterval(pollFeed, 5000);
        return () => {
            if (pollingIntervalRef.current)
                clearInterval(pollingIntervalRef.current);
        };
    }, [isLive, lastUpdate]);

    // ========== AUDIO ==========
    const playBeep = (failed: boolean) => {
        try {
            const audio = new Audio(
                failed ? "/audio/error.mp3" : "/audio/success.mp3",
            );
            audio.volume = 0.3;
            audio.play();
        } catch (error) {
            // Audio not available
        }
    };

    // ========== FILTERED FEED ==========
    const filteredFeed = feed.filter((punch) => {
        if (filterMode === "all") return true;
        if (filterMode === "checkin") return punch.type === "IN";
        if (filterMode === "checkout") return punch.type === "OUT";
        if (filterMode === "failed") return punch.status === "failed";
        if (filterMode === "fingerprint")
            return punch.punch_type === "fingerprint";
        if (filterMode === "face") return punch.punch_type === "face";
        if (selectedDevice) return punch.device === selectedDevice;
        return true;
    });

    const onlineDevices = devices.filter((d) => d.is_online);
    const offlineDevices = devices.filter((d) => !d.is_online);

    // ========== RENDER ==========
    return (
        <AppLayout title="Live Monitor">
            <div
                className="p-3 sm:p-4 md:p-6"
                style={{ background: bg, minHeight: "100vh" }}
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1
                                className="text-xl sm:text-2xl font-bold"
                                style={{ color: textPrimary }}
                            >
                                Live Attendance Monitor
                            </h1>
                            {isLive && (
                                <span
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                                    style={{
                                        background: "#dcfce7",
                                        color: "#16a34a",
                                    }}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full animate-pulse"
                                        style={{ background: "#16a34a" }}
                                    ></span>
                                    LIVE
                                </span>
                            )}
                        </div>
                        <p
                            className="text-xs sm:text-sm mt-0.5"
                            style={{ color: textSecondary }}
                        >
                            Real-time punch feed across {devices.length} devices
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => setSoundEnabled(!soundEnabled)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium cursor-pointer"
                            style={{
                                background: soundEnabled
                                    ? "#fef9c3"
                                    : isDark
                                      ? "#374151"
                                      : "#f3f4f6",
                                color: soundEnabled ? "#ca8a04" : textSecondary,
                                border: `1px solid ${soundEnabled ? "#fde68a" : border}`,
                            }}
                        >
                            <i
                                className={
                                    soundEnabled
                                        ? "ri-volume-up-line"
                                        : "ri-volume-mute-line"
                                }
                            ></i>
                            <span className="hidden sm:inline">
                                {soundEnabled ? "Sound On" : "Sound Off"}
                            </span>
                        </button>

                        <button
                            onClick={() => setIsLive(!isLive)}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium cursor-pointer"
                            style={{
                                background: isLive ? "#fee2e2" : "#dcfce7",
                                color: isLive ? "#dc2626" : "#16a34a",
                                border: `1px solid ${isLive ? "#fecaca" : "#bbf7d0"}`,
                            }}
                        >
                            <i
                                className={
                                    isLive ? "ri-pause-line" : "ri-play-line"
                                }
                            ></i>
                            <span className="hidden sm:inline">
                                {isLive ? "Pause" : "Resume"}
                            </span>
                        </button>

                        <button
                            onClick={() => setFeed([])}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium cursor-pointer"
                            style={{
                                background: isDark ? "#374151" : "#f3f4f6",
                                color: textSecondary,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <i className="ri-delete-bin-line"></i>
                            <span className="hidden sm:inline">Clear</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
                    {[
                        {
                            label: "Total Punches",
                            value: stats.punches_today,
                            icon: "ri-time-line",
                            color: textPrimary,
                        },
                        {
                            label: "Check-Ins",
                            value: stats.check_ins_today,
                            icon: "ri-login-box-line",
                            color: "#16a34a",
                        },
                        {
                            label: "Check-Outs",
                            value: stats.check_outs_today,
                            icon: "ri-logout-box-line",
                            color: "#dc2626",
                        },
                        {
                            label: "Failed",
                            value: stats.failed_attempts,
                            icon: "ri-error-warning-line",
                            color: "#f59e0b",
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
                                    style={{
                                        background: isDark
                                            ? "#374151"
                                            : "#f3f4f6",
                                    }}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Live Feed Column */}
                    <div
                        className="lg:col-span-2 rounded-xl overflow-hidden flex flex-col"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                            maxHeight: "calc(100vh - 280px)",
                        }}
                    >
                        {/* Feed Header */}
                        <div
                            className="px-4 py-3 flex items-center justify-between flex-shrink-0 flex-wrap gap-2"
                            style={{ borderBottom: `1px solid ${border}` }}
                        >
                            <div className="flex items-center gap-2">
                                <h3
                                    className="text-sm font-semibold"
                                    style={{ color: textPrimary }}
                                >
                                    Live Punch Feed
                                </h3>
                                <span
                                    className="text-xs px-2 py-0.5 rounded-full"
                                    style={{
                                        background: isDark
                                            ? "#374151"
                                            : "#f3f4f6",
                                        color: textSecondary,
                                    }}
                                >
                                    {filteredFeed.length}
                                </span>
                            </div>

                            {/* Filter Pills */}
                            <div className="flex items-center gap-1 overflow-x-auto">
                                {[
                                    { key: "all", label: "All" },
                                    { key: "checkin", label: "IN" },
                                    { key: "checkout", label: "OUT" },
                                    { key: "failed", label: "Failed" },
                                    { key: "fingerprint", label: "FP" },
                                    { key: "face", label: "Face" },
                                ].map((f) => (
                                    <button
                                        key={f.key}
                                        onClick={() => setFilterMode(f.key)}
                                        className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
                                        style={{
                                            background:
                                                filterMode === f.key
                                                    ? "#16a34a"
                                                    : isDark
                                                      ? "#374151"
                                                      : "#f3f4f6",
                                            color:
                                                filterMode === f.key
                                                    ? "#fff"
                                                    : textSecondary,
                                        }}
                                    >
                                        {f.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Feed List */}
                        <div
                            ref={feedContainerRef}
                            className="flex-1 overflow-y-auto"
                        >
                            {filteredFeed.length === 0 ? (
                                <div
                                    className="py-16 text-center"
                                    style={{ color: textSecondary }}
                                >
                                    <i className="ri-time-line text-4xl mb-3 block"></i>
                                    <p className="text-sm">
                                        Waiting for punches...
                                    </p>
                                </div>
                            ) : (
                                filteredFeed.map((punch, idx) => {
                                    const isNew = idx === 0 && isLive;
                                    return (
                                        <div
                                            key={punch.id}
                                            className="flex items-center gap-3 px-4 py-3 transition-all"
                                            style={{
                                                borderBottom: `1px solid ${border}`,
                                                background:
                                                    punch.status === "failed"
                                                        ? isDark
                                                            ? "#2d1515"
                                                            : "#fff5f5"
                                                        : isNew
                                                          ? isDark
                                                              ? "#14532d20"
                                                              : "#f0fdf4"
                                                          : "transparent",
                                                animation: isNew
                                                    ? "liveIn 0.35s ease"
                                                    : undefined,
                                            }}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div
                                                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                    style={{
                                                        background:
                                                            punch.avatar_bg,
                                                    }}
                                                >
                                                    {punch.initials}
                                                </div>
                                                <div
                                                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                                                    style={{
                                                        background:
                                                            punch.type === "IN"
                                                                ? "#dcfce7"
                                                                : "#fee2e2",
                                                        border: `2px solid ${cardBg}`,
                                                    }}
                                                >
                                                    <i
                                                        className={`ri-${punch.type === "IN" ? "login-box" : "logout-box"}-line text-xs`}
                                                        style={{
                                                            color:
                                                                punch.type ===
                                                                "IN"
                                                                    ? "#16a34a"
                                                                    : "#dc2626",
                                                            fontSize: "9px",
                                                        }}
                                                    ></i>
                                                </div>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p
                                                        className="text-sm font-semibold"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {punch.employee_name}
                                                    </p>
                                                    <span
                                                        className="px-2 py-0.5 rounded-full text-xs font-semibold"
                                                        style={{
                                                            background:
                                                                punch.type ===
                                                                "IN"
                                                                    ? "#dcfce7"
                                                                    : "#fee2e2",
                                                            color:
                                                                punch.type ===
                                                                "IN"
                                                                    ? "#16a34a"
                                                                    : "#dc2626",
                                                        }}
                                                    >
                                                        {punch.verify_mode}
                                                    </span>
                                                    {punch.status ===
                                                        "failed" && (
                                                        <span
                                                            className="px-1.5 py-0.5 rounded text-xs font-bold"
                                                            style={{
                                                                background:
                                                                    "#fee2e2",
                                                                color: "#dc2626",
                                                            }}
                                                        >
                                                            <i className="ri-error-warning-line mr-0.5"></i>
                                                            FAILED
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {punch.department}
                                                    </span>
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        <i className="ri-device-line mr-0.5"></i>
                                                        {punch.device_name}
                                                    </span>
                                                    <span
                                                        className="inline-flex items-center gap-1 text-xs capitalize"
                                                        style={{
                                                            color:
                                                                punch.type ===
                                                                "IN"
                                                                    ? "#16a34a"
                                                                    : "#dc2626",
                                                        }}
                                                    >
                                                        <i
                                                            className={`ri-${punch.punch_type === "fingerprint" ? "fingerprint" : "user-smile"}-line`}
                                                        ></i>
                                                        {punch.punch_type}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-right flex-shrink-0">
                                                <p
                                                    className="text-sm font-mono font-bold"
                                                    style={{
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {punch.time}
                                                </p>
                                                <p
                                                    className="text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {punch.date}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Right Panel */}
                    <div className="space-y-4">
                        {/* Device Status */}
                        <div
                            className="rounded-xl overflow-hidden"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div
                                className="px-4 py-3 flex items-center justify-between"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <div>
                                    <h3
                                        className="text-sm font-semibold"
                                        style={{ color: textPrimary }}
                                    >
                                        Device Status
                                    </h3>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: textSecondary }}
                                    >
                                        {onlineDevices.length} online ·{" "}
                                        {offlineDevices.length} offline
                                    </p>
                                </div>
                                <button
                                    onClick={() =>
                                        setShowDeviceList(!showDeviceList)
                                    }
                                    className="text-xs px-2 py-1 rounded-lg cursor-pointer"
                                    style={{ color: "#16a34a" }}
                                >
                                    {showDeviceList ? "Hide" : "View All"}
                                </button>
                            </div>

                            {showDeviceList && (
                                <div className="max-h-64 overflow-y-auto">
                                    {devices.map((dev) => (
                                        <button
                                            key={dev.id}
                                            onClick={() => {
                                                setSelectedDevice(
                                                    selectedDevice === dev.sn
                                                        ? null
                                                        : dev.sn,
                                                );
                                                router.visit(
                                                    `/devices/${dev.id}`,
                                                );
                                            }}
                                            className="w-full flex items-center gap-3 p-3 cursor-pointer text-left transition-colors"
                                            style={{
                                                borderBottom: `1px solid ${border}`,
                                                background:
                                                    selectedDevice === dev.sn
                                                        ? isDark
                                                            ? "#374151"
                                                            : "#f0fdf4"
                                                        : "transparent",
                                            }}
                                            onMouseEnter={(e) => {
                                                if (selectedDevice !== dev.sn)
                                                    e.currentTarget.style.background =
                                                        isDark
                                                            ? "#374151"
                                                            : "#f9fafb";
                                            }}
                                            onMouseLeave={(e) => {
                                                if (selectedDevice !== dev.sn)
                                                    e.currentTarget.style.background =
                                                        "transparent";
                                            }}
                                        >
                                            <div className="relative flex-shrink-0">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{
                                                        background:
                                                            dev.is_online
                                                                ? "#16a34a"
                                                                : "#dc2626",
                                                    }}
                                                ></div>
                                                {dev.is_online && (
                                                    <div
                                                        className="absolute inset-0 rounded-full animate-ping"
                                                        style={{
                                                            background:
                                                                "#16a34a",
                                                            opacity: 0.4,
                                                        }}
                                                    ></div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className="text-xs font-semibold truncate"
                                                    style={{
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {dev.name}
                                                </p>
                                                <p
                                                    className="text-xs truncate"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {dev.area} · {dev.ip}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p
                                                    className="text-xs font-bold"
                                                    style={{
                                                        color: dev.is_online
                                                            ? "#16a34a"
                                                            : "#dc2626",
                                                    }}
                                                >
                                                    {dev.is_online
                                                        ? "Online"
                                                        : "Offline"}
                                                </p>
                                                <p
                                                    className="text-xs font-mono"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {dev.users}u
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Currently Checked In */}
                        <div
                            className="rounded-xl overflow-hidden"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div
                                className="px-4 py-3"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <h3
                                    className="text-sm font-semibold"
                                    style={{ color: textPrimary }}
                                >
                                    Currently Checked In
                                </h3>
                                <p
                                    className="text-xs mt-0.5"
                                    style={{ color: textSecondary }}
                                >
                                    {checkedIn.length} employees on duty
                                </p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {checkedIn.length === 0 ? (
                                    <div
                                        className="py-8 text-center"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-user-line text-2xl mb-2 block"></i>
                                        <p className="text-xs">
                                            No employees checked in
                                        </p>
                                    </div>
                                ) : (
                                    checkedIn.map((emp) => (
                                        <div
                                            key={emp.employee_id}
                                            className="flex items-center gap-3 px-4 py-2.5"
                                            style={{
                                                borderBottom: `1px solid ${border}`,
                                            }}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                style={{
                                                    background: "#16a34a",
                                                }}
                                            >
                                                {emp.initials}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p
                                                    className="text-xs font-medium truncate"
                                                    style={{
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {emp.name}
                                                </p>
                                                <p
                                                    className="text-xs truncate"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {emp.department}
                                                </p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p
                                                    className="text-xs font-mono font-bold"
                                                    style={{ color: "#16a34a" }}
                                                >
                                                    {emp.check_in_time}
                                                </p>
                                                <p
                                                    className="text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {emp.duration}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Activity Breakdown */}
                        <div
                            className="rounded-xl p-4"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <h3
                                className="text-sm font-semibold mb-3"
                                style={{ color: textPrimary }}
                            >
                                Last 10 Minutes
                            </h3>
                            <div className="space-y-2">
                                {[
                                    {
                                        label: "Check-In",
                                        value: activityBreakdown.check_in,
                                        color: "#16a34a",
                                    },
                                    {
                                        label: "Check-Out",
                                        value: activityBreakdown.check_out,
                                        color: "#dc2626",
                                    },
                                    {
                                        label: "Fingerprint",
                                        value: activityBreakdown.fingerprint,
                                        color: "#0891b2",
                                    },
                                    {
                                        label: "Face",
                                        value: activityBreakdown.face,
                                        color: "#7c3aed",
                                    },
                                    {
                                        label: "Card",
                                        value: activityBreakdown.card,
                                        color: "#f59e0b",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center gap-3"
                                    >
                                        <span
                                            className="text-xs w-20 flex-shrink-0"
                                            style={{ color: textSecondary }}
                                        >
                                            {item.label}
                                        </span>
                                        <div
                                            className="flex-1 h-2 rounded-full"
                                            style={{
                                                background: isDark
                                                    ? "#374151"
                                                    : "#f3f4f6",
                                            }}
                                        >
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${Math.min(100, (item.value / Math.max(1, activityBreakdown.check_in + activityBreakdown.check_out)) * 100)}%`,
                                                    background: item.color,
                                                }}
                                            ></div>
                                        </div>
                                        <span
                                            className="text-xs font-bold w-6 text-right flex-shrink-0"
                                            style={{ color: item.color }}
                                        >
                                            {item.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes liveIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </AppLayout>
    );
}
