import { useState, useEffect, useRef } from "react";
import { usePage, router, Link } from "@inertiajs/react";
import { useTheme } from "@/contexts/ThemeContext";
import type { PageProps, Notification } from "@/types";

type NotifCategory = "absence" | "device" | "late" | "system" | "biometric";

const categoryConfig: Record<
    NotifCategory,
    { icon: string; color: string; bg: string }
> = {
    absence: { icon: "ri-user-unfollow-line", color: "#dc2626", bg: "#fee2e2" },
    device: { icon: "ri-device-line", color: "#d97706", bg: "#fef3c7" },
    late: { icon: "ri-alarm-warning-line", color: "#f59e0b", bg: "#fef9c3" },
    system: { icon: "ri-settings-3-line", color: "#0891b2", bg: "#e0f2fe" },
    biometric: { icon: "ri-fingerprint-line", color: "#7c3aed", bg: "#ede9fe" },
};

const severityDot: Record<string, string> = {
    critical: "#dc2626",
    warning: "#f59e0b",
    info: "#0891b2",
    success: "#16a34a",
};

interface TopBarProps {
    title: string;
    subtitle?: string;
    sidebarCollapsed: boolean;
    actions?: React.ReactNode;
    onMobileMenuToggle?: () => void;
}

export default function TopBar({
    title,
    subtitle,
    sidebarCollapsed,
    actions,
    onMobileMenuToggle,
}: TopBarProps) {
    const { isDark, toggleTheme } = useTheme();
    const { props } = usePage<
        PageProps & {
            notifications?: Notification[];
            unreadCount?: number;
            flash?: { success?: string };
        }
    >();
    const { auth } = props;
    const [notifications, setNotifications] = useState<Notification[]>(
        (props as any).notifications ?? [],
    );
    const [showNotif, setShowNotif] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [activeFilter, setActiveFilter] = useState<NotifCategory | "all">(
        "all",
    );
    const [syncing, setSyncing] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;
    const filtered =
        activeFilter === "all"
            ? notifications
            : notifications.filter((n) => n.category === activeFilter);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    const markRead = async (id: number) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        try {
            await fetch(route("notifications.read", id), {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN":
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content ?? "",
                },
            });
        } catch {}
    };

    const markAllRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        try {
            await fetch(route("notifications.read-all"), {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN":
                        (
                            document.querySelector(
                                'meta[name="csrf-token"]',
                            ) as HTMLMetaElement
                        )?.content ?? "",
                },
            });
        } catch {}
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (
                notifRef.current &&
                !notifRef.current.contains(e.target as Node)
            )
                setShowNotif(false);
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(e.target as Node)
            )
                setShowUserMenu(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const bg = isDark ? "#111827" : "#ffffff";
    const border = isDark ? "#1f2937" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const hoverBg = isDark ? "#1f2937" : "#f3f4f6";
    const panelBg = isDark ? "#1f2937" : "#ffffff";
    const itemHover = isDark ? "#374151" : "#f9fafb";
    const inputBg = isDark ? "#1f2937" : "#f9fafb";
    const inputBorder = isDark ? "#374151" : "#e5e7eb";

    const filterTabs = [
        {
            key: "all" as const,
            label: "All",
            count: notifications.filter((n) => !n.read).length,
        },
        {
            key: "absence" as const,
            label: "Absence",
            count: notifications.filter(
                (n) => n.category === "absence" && !n.read,
            ).length,
        },
        {
            key: "device" as const,
            label: "Device",
            count: notifications.filter(
                (n) => n.category === "device" && !n.read,
            ).length,
        },
        {
            key: "late" as const,
            label: "Late",
            count: notifications.filter((n) => n.category === "late" && !n.read)
                .length,
        },
        {
            key: "system" as const,
            label: "System",
            count: notifications.filter(
                (n) =>
                    (n.category === "system" || n.category === "biometric") &&
                    !n.read,
            ).length,
        },
    ];

    // User menu items - with proper handling for external links
    const userMenuItems = [
        {
            icon: "ri-user-line",
            label: "My Profile",
            route: "profile.index",
            type: "link" as const,
        },
        {
            icon: "ri-settings-3-line",
            label: "Settings",
            route: "settings.index",
            type: "link" as const,
        },
        {
            icon: "ri-shield-check-line",
            label: "Security",
            route: "profile.password",
            type: "link" as const,
        },
        { divider: true, type: "divider" as const },
        {
            icon: "ri-logout-box-line",
            label: "Sign Out",
            route: "logout",
            type: "logout" as const,
            danger: true,
        },
    ];

    return (
        <header
            className="fixed top-0 right-0 z-20 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 md:px-6 transition-all duration-300"
            style={{
                left: isMobile ? "0" : sidebarCollapsed ? "72px" : "260px",
                height: "64px",
                background: bg,
                borderBottom: `1px solid ${border}`,
                fontFamily: "'Inter', sans-serif",
            }}
        >
            {/* Mobile: Hamburger + App Name */}
            <div className="flex items-center gap-2 lg:hidden">
                <button
                    onClick={onMobileMenuToggle}
                    className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer flex-shrink-0"
                    style={{ color: textSecondary }}
                >
                    <i className="ri-menu-line text-lg"></i>
                </button>
                <div className="flex items-center gap-2">
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                            background:
                                "linear-gradient(135deg, #16a34a, #15803d)",
                        }}
                    >
                        <i className="ri-fingerprint-line text-white text-xs"></i>
                    </div>
                    <span
                        className="font-bold text-sm tracking-tight whitespace-nowrap"
                        style={{ color: textPrimary }}
                    >
                        EatNGo<span style={{ color: "#16a34a" }}>Bio</span>
                    </span>
                </div>
            </div>

            {/* Desktop Title */}
            <div className="flex-shrink-0 hidden lg:block">
                <h2
                    className="font-bold text-base leading-tight"
                    style={{ color: textPrimary }}
                >
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs" style={{ color: textSecondary }}>
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Search */}
            <div className="hidden sm:flex flex-1 mx-2 lg:mx-4 max-w-md">
                <div className="relative w-full">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
                        <i
                            className="ri-search-line text-sm"
                            style={{ color: textSecondary }}
                        ></i>
                    </div>
                    <input
                        type="text"
                        placeholder="Search employees, devices…"
                        className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                        style={{
                            background: inputBg,
                            border: `1px solid ${inputBorder}`,
                            color: textPrimary,
                        }}
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-1 sm:gap-1.5 ml-auto flex-shrink-0">
                {actions}

                {props.flash?.success && (
                    <span
                        className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{
                            background: "#f0fdf4",
                            color: "#16a34a",
                            border: "1px solid #bbf7d0",
                        }}
                    >
                        <i className="ri-checkbox-circle-line"></i>
                        {props.flash.success}
                    </span>
                )}

                <button
                    onClick={() => {
                        setSyncing(true);
                        setTimeout(() => setSyncing(false), 2500);
                        router.reload();
                    }}
                    className="flex items-center justify-center gap-2 px-2 sm:px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all whitespace-nowrap"
                    style={{
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                        color: textSecondary,
                        background: "transparent",
                    }}
                    onMouseEnter={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = hoverBg;
                    }}
                    onMouseLeave={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                    }}
                >
                    <i
                        className={`ri-refresh-line text-sm ${syncing ? "animate-spin" : ""}`}
                    ></i>
                    <span className="hidden lg:inline">
                        {syncing ? "Syncing…" : "Sync All"}
                    </span>
                </button>

                <button
                    onClick={toggleTheme}
                    className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-colors flex-shrink-0"
                    style={{ color: textSecondary }}
                    onMouseEnter={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = hoverBg;
                    }}
                    onMouseLeave={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                    }}
                >
                    <i
                        className={
                            isDark
                                ? "ri-sun-line text-base"
                                : "ri-moon-line text-base"
                        }
                    ></i>
                </button>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                    <button
                        onClick={() => {
                            setShowNotif(!showNotif);
                            setShowUserMenu(false);
                        }}
                        className="relative w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-colors flex-shrink-0"
                        style={{
                            color: unreadCount > 0 ? "#dc2626" : textSecondary,
                            background: showNotif ? hoverBg : "transparent",
                        }}
                        onMouseEnter={(e) => {
                            (
                                e.currentTarget as HTMLButtonElement
                            ).style.background = hoverBg;
                        }}
                        onMouseLeave={(e) => {
                            if (!showNotif)
                                (
                                    e.currentTarget as HTMLButtonElement
                                ).style.background = "transparent";
                        }}
                    >
                        <i
                            className={`${unreadCount > 0 ? "ri-notification-3-fill" : "ri-notification-3-line"} text-base`}
                        ></i>
                        {unreadCount > 0 && (
                            <span
                                className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full text-white flex items-center justify-center px-1"
                                style={{
                                    background: "#dc2626",
                                    fontSize: "10px",
                                    fontWeight: 700,
                                }}
                            >
                                {unreadCount > 9 ? "9+" : unreadCount}
                            </span>
                        )}
                    </button>

                    {showNotif && (
                        <div
                            className="absolute right-0 top-12 rounded-2xl overflow-hidden z-50 flex flex-col"
                            style={{
                                background: panelBg,
                                border: `1px solid ${border}`,
                                boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
                                maxHeight: "520px",
                                width: "min(384px, calc(100vw - 32px))",
                            }}
                        >
                            <div
                                className="px-4 py-3.5 flex items-center justify-between flex-shrink-0"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <div className="flex items-center gap-2">
                                    <span
                                        className="text-sm font-bold"
                                        style={{ color: textPrimary }}
                                    >
                                        Notifications
                                    </span>
                                    {unreadCount > 0 && (
                                        <span
                                            className="px-2 py-0.5 rounded-full text-xs font-bold"
                                            style={{
                                                background: "#fee2e2",
                                                color: "#dc2626",
                                            }}
                                        >
                                            {unreadCount} unread
                                        </span>
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-xs font-medium cursor-pointer whitespace-nowrap"
                                        style={{ color: "#16a34a" }}
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div
                                className="flex gap-0 px-3 pt-2 pb-0 flex-shrink-0 overflow-x-auto"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                {filterTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveFilter(tab.key)}
                                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
                                        style={{
                                            color:
                                                activeFilter === tab.key
                                                    ? "#16a34a"
                                                    : textSecondary,
                                            borderBottom:
                                                activeFilter === tab.key
                                                    ? "2px solid #16a34a"
                                                    : "2px solid transparent",
                                        }}
                                    >
                                        {tab.label}
                                        {tab.count > 0 && (
                                            <span
                                                className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                                                style={{
                                                    background: "#fee2e2",
                                                    color: "#dc2626",
                                                    fontSize: "9px",
                                                }}
                                            >
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="overflow-y-auto flex-1">
                                {filtered.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <i
                                            className="ri-notification-off-line text-3xl mb-2 block"
                                            style={{ color: textSecondary }}
                                        ></i>
                                        <p
                                            className="text-sm"
                                            style={{ color: textSecondary }}
                                        >
                                            No notifications
                                        </p>
                                    </div>
                                ) : (
                                    filtered.map((notif) => {
                                        const cat =
                                            categoryConfig[
                                                notif.category as NotifCategory
                                            ] ?? categoryConfig.system;
                                        return (
                                            <div
                                                key={notif.id}
                                                className="flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors relative"
                                                style={{
                                                    borderBottom: `1px solid ${border}`,
                                                    background: notif.read
                                                        ? "transparent"
                                                        : isDark
                                                          ? "#1a2e1a"
                                                          : "#f0fdf4",
                                                }}
                                                onClick={() =>
                                                    markRead(notif.id)
                                                }
                                                onMouseEnter={(e) => {
                                                    (
                                                        e.currentTarget as HTMLDivElement
                                                    ).style.background =
                                                        notif.read
                                                            ? itemHover
                                                            : isDark
                                                              ? "#1f3a1f"
                                                              : "#dcfce7";
                                                }}
                                                onMouseLeave={(e) => {
                                                    (
                                                        e.currentTarget as HTMLDivElement
                                                    ).style.background =
                                                        notif.read
                                                            ? "transparent"
                                                            : isDark
                                                              ? "#1a2e1a"
                                                              : "#f0fdf4";
                                                }}
                                            >
                                                {!notif.read && (
                                                    <div
                                                        className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                                                        style={{
                                                            background:
                                                                severityDot[
                                                                    notif
                                                                        .severity
                                                                ],
                                                        }}
                                                    ></div>
                                                )}
                                                <div
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                                                    style={{
                                                        background: cat.bg,
                                                    }}
                                                >
                                                    <i
                                                        className={`${cat.icon} text-sm`}
                                                        style={{
                                                            color: cat.color,
                                                        }}
                                                    ></i>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-0.5">
                                                        <p
                                                            className="text-xs font-semibold leading-tight"
                                                            style={{
                                                                color: textPrimary,
                                                            }}
                                                        >
                                                            {notif.title}
                                                        </p>
                                                        <span
                                                            className="text-xs flex-shrink-0"
                                                            style={{
                                                                color: textSecondary,
                                                            }}
                                                        >
                                                            {notif.time}
                                                        </span>
                                                    </div>
                                                    <p
                                                        className="text-xs leading-relaxed mb-1.5"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {notif.message}
                                                    </p>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        {notif.meta && (
                                                            <span
                                                                className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                                style={{
                                                                    background:
                                                                        cat.bg,
                                                                    color: cat.color,
                                                                }}
                                                            >
                                                                {notif.meta}
                                                            </span>
                                                        )}
                                                        {notif.actionLabel &&
                                                            notif.actionPath && (
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        markRead(
                                                                            notif.id,
                                                                        );
                                                                        router.visit(
                                                                            notif.actionPath!,
                                                                        );
                                                                        setShowNotif(
                                                                            false,
                                                                        );
                                                                    }}
                                                                    className="text-xs font-semibold cursor-pointer whitespace-nowrap"
                                                                    style={{
                                                                        color: "#16a34a",
                                                                    }}
                                                                >
                                                                    {
                                                                        notif.actionLabel
                                                                    }{" "}
                                                                    →
                                                                </button>
                                                            )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            <div
                                className="px-4 py-3 flex items-center justify-between flex-shrink-0"
                                style={{ borderTop: `1px solid ${border}` }}
                            >
                                <span
                                    className="text-xs"
                                    style={{ color: textSecondary }}
                                >
                                    {filtered.length} notification
                                    {filtered.length !== 1 ? "s" : ""}
                                </span>
                                <button
                                    onClick={() => setShowNotif(false)}
                                    className="text-xs font-medium cursor-pointer"
                                    style={{ color: "#16a34a" }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                    <button
                        onClick={() => {
                            setShowUserMenu(!showUserMenu);
                            setShowNotif(false);
                        }}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-pointer flex-shrink-0 transition-transform hover:scale-105"
                        style={{
                            background:
                                "linear-gradient(135deg, #16a34a, #15803d)",
                        }}
                    >
                        {auth.user?.initials ??
                            auth.user?.name?.slice(0, 2).toUpperCase() ??
                            "U"}
                    </button>

                    {showUserMenu && (
                        <div
                            className="absolute right-0 top-12 rounded-xl overflow-hidden z-50 flex flex-col"
                            style={{
                                background: panelBg,
                                border: `1px solid ${border}`,
                                boxShadow: "0 16px 48px rgba(0,0,0,0.18)",
                                width: "240px",
                            }}
                        >
                            <div
                                className="px-4 py-3"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <p
                                    className="text-sm font-semibold truncate"
                                    style={{ color: textPrimary }}
                                >
                                    {auth.user?.name}
                                </p>
                                <p
                                    className="text-xs truncate"
                                    style={{ color: textSecondary }}
                                >
                                    {auth.user?.email}
                                </p>
                                <span
                                    className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                                    style={{
                                        background: "#dcfce7",
                                        color: "#16a34a",
                                    }}
                                >
                                    {auth.user?.roles?.[0] ?? "Staff"}
                                </span>
                            </div>

                            <div className="py-1">
                                {userMenuItems.map((item, idx) => {
                                    if (item.type === "divider") {
                                        return (
                                            <div
                                                key={`divider-${idx}`}
                                                className="my-1"
                                                style={{
                                                    borderTop: `1px solid ${border}`,
                                                }}
                                            />
                                        );
                                    }

                                    if (item.type === "logout") {
                                        return (
                                            <button
                                                key={item.route}
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    router.post(
                                                        route("logout"),
                                                    );
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left"
                                                style={{
                                                    color: item.danger
                                                        ? "#dc2626"
                                                        : textPrimary,
                                                }}
                                                onMouseEnter={(e) => {
                                                    (
                                                        e.currentTarget as HTMLElement
                                                    ).style.background =
                                                        itemHover;
                                                }}
                                                onMouseLeave={(e) => {
                                                    (
                                                        e.currentTarget as HTMLElement
                                                    ).style.background =
                                                        "transparent";
                                                }}
                                            >
                                                <i
                                                    className={`${item.icon} text-base`}
                                                    style={{
                                                        color: item.danger
                                                            ? "#dc2626"
                                                            : textSecondary,
                                                    }}
                                                ></i>
                                                {item.label}
                                            </button>
                                        );
                                    }

                                    // Regular link
                                    return (
                                        <Link
                                            key={item.route}
                                            href={route(item.route)}
                                            onClick={() =>
                                                setShowUserMenu(false)
                                            }
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                                            style={{ color: textPrimary }}
                                            onMouseEnter={(e) => {
                                                (
                                                    e.currentTarget as HTMLElement
                                                ).style.background = itemHover;
                                            }}
                                            onMouseLeave={(e) => {
                                                (
                                                    e.currentTarget as HTMLElement
                                                ).style.background =
                                                    "transparent";
                                            }}
                                        >
                                            <i
                                                className={`${item.icon} text-base`}
                                                style={{ color: textSecondary }}
                                            ></i>
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
