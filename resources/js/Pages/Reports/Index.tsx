import { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import type { PageProps } from "@/types";

// Lazy load components
import AttendanceSummaryTable from "./components/AttendanceSummaryTable";
import PayrollTable from "./components/PayrollTable";
import DailyTrendChart from "./components/DailyTrendChart";
import DeptBreakdownReport from "./components/DeptBreakdownReport";
import LocationBreakdownReport from "./components/LocationBreakdownReport";
import TableSkeleton from "./components/TableSkeleton";
import Pagination from "@/Components/base/Pagination";

interface Props extends PageProps {
    tab: string;
    from: string;
    to: string;
    departments: string[];
    locations: string[];
    areas: string[];
    filters: {
        department?: string;
        location?: string;
        area?: string;
    };
    summaryRows?: any[];
    summaryPagination?: PaginationMeta;
    dailyRows?: any[];
    payrollRows?: any[];
    payrollPagination?: PaginationMeta;
    deptRows?: any[];
    kpiTotalPresent: number;
    kpiTotalAbsent: number;
    kpiTotalLate: number;
    kpiTotalOT: number;
    kpiAvgRate: number;
    kpiTotalNetPay: number;
    lateCount: number;
    absentCount: number;
    totalEmployees: number;
    currentPage: number;
    perPage: number;
}

interface PaginationMeta {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
}

type ReportTab =
    | "summary"
    | "payroll"
    | "daily"
    | "dept"
    | "location"
    | "late"
    | "absent";

const DATE_PRESETS = [
    {
        label: "Today",
        getValue: () => {
            const today = new Date().toISOString().split("T")[0];
            return { from: today, to: today };
        },
    },
    {
        label: "This Week",
        getValue: () => {
            const today = new Date();
            const start = new Date(today);
            start.setDate(today.getDate() - today.getDay() + 1);
            return {
                from: start.toISOString().split("T")[0],
                to: today.toISOString().split("T")[0],
            };
        },
    },
    {
        label: "This Month",
        getValue: () => {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), 1);
            return {
                from: start.toISOString().split("T")[0],
                to: today.toISOString().split("T")[0],
            };
        },
    },
    {
        label: "Last Month",
        getValue: () => {
            const today = new Date();
            const start = new Date(
                today.getFullYear(),
                today.getMonth() - 1,
                1,
            );
            const end = new Date(today.getFullYear(), today.getMonth(), 0);
            return {
                from: start.toISOString().split("T")[0],
                to: end.toISOString().split("T")[0],
            };
        },
    },
];

const PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];

export default function ReportsPage() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const { props } = usePage<Props>();

    const [activeTab, setActiveTab] = useState<ReportTab>(
        (props.tab as ReportTab) || "summary",
    );
    const [isLoading, setIsLoading] = useState(false);
    const [dateRange, setDateRange] = useState({
        from: props.from || new Date().toISOString().split("T")[0],
        to: props.to || new Date().toISOString().split("T")[0],
    });
    const [filters, setFilters] = useState({
        department: props.filters?.department || "",
        location: props.filters?.location || "",
        area: props.filters?.area || "",
        search: "",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState<string | null>(null);
    const [perPage, setPerPage] = useState(props.perPage || 15);

    const bg = isDark ? "#111827" : "#f8fafc";
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const inputBg = isDark ? "#374151" : "#f9fafb";

    // Handle page change
    const handlePageChange = (page: number) => {
        setIsLoading(true);
        router.get(
            "/reports",
            {
                tab: activeTab,
                from: dateRange.from,
                to: dateRange.to,
                page,
                perPage,
                ...filters,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const handlePerPageChange = (newPerPage: number) => {
        setPerPage(newPerPage);
        setIsLoading(true);
        router.get(
            "/reports",
            {
                tab: activeTab,
                from: dateRange.from,
                to: dateRange.to,
                page: 1,
                perPage: newPerPage,
                ...filters,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const applyFilters = () => {
        setIsLoading(true);
        router.get(
            "/reports",
            {
                tab: activeTab,
                from: dateRange.from,
                to: dateRange.to,
                page: 1,
                perPage,
                ...filters,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const applyPreset = (from: string, to: string) => {
        setDateRange({ from, to });
    };

    const clearFilters = () => {
        setFilters({ department: "", location: "", area: "", search: "" });
    };

    const switchTab = (tab: ReportTab) => {
        setActiveTab(tab);
        setIsLoading(true);
        router.get(
            "/reports",
            {
                tab,
                from: dateRange.from,
                to: dateRange.to,
                page: 1,
                perPage,
                ...filters,
            },
            {
                preserveState: true,
                onFinish: () => setIsLoading(false),
            },
        );
    };

    const exportReport = (format: "excel" | "pdf", type: string) => {
        setShowExportMenu(null);

        const params = new URLSearchParams({
            from: dateRange.from,
            to: dateRange.to,
            ...(filters.department && { department: filters.department }),
            ...(filters.location && { location: filters.location }),
            ...(filters.area && { area: filters.area }),
        }).toString();

        const urls: Record<string, string> = {
            attendance_excel: `/reports/export/attendance?${params}`,
            attendance_pdf: `/reports/export/attendance-pdf?${params}`,
            devices_excel: `/reports/export/devices`,
            devices_pdf: `/reports/export/devices-pdf`,
            payroll_excel: `/reports/export/payroll?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}&${params}`,
            payroll_pdf: `/reports/export/payroll-pdf?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}&${params}`,
            late_excel: `/reports/export/late-arrivals?${params}`,
            absent_excel: `/reports/export/absenteeism?${params}`,
            dept_excel: `/reports/export/department-summary?${params}`,
        };

        const key = `${type}_${format}`;
        if (urls[key]) {
            window.open(urls[key], "_blank");
            showToast(
                "success",
                "Export Started",
                `Your ${type} report is being generated.`,
            );
        }
    };

    const renderExportDropdown = (tabType: string) => {
        const isOpen = showExportMenu === tabType;

        const getExportOptions = () => {
            switch (tabType) {
                case "summary":
                    return [
                        {
                            label: "Attendance (Excel)",
                            key: "attendance_excel",
                            icon: "ri-file-excel-line",
                            color: "#16a34a",
                        },
                        {
                            label: "Attendance (PDF)",
                            key: "attendance_pdf",
                            icon: "ri-file-pdf-line",
                            color: "#dc2626",
                        },
                    ];
                case "payroll":
                    return [
                        {
                            label: "Payroll (Excel)",
                            key: "payroll_excel",
                            icon: "ri-file-excel-line",
                            color: "#16a34a",
                        },
                        {
                            label: "Payroll (PDF)",
                            key: "payroll_pdf",
                            icon: "ri-file-pdf-line",
                            color: "#dc2626",
                        },
                    ];
                case "daily":
                    return [
                        {
                            label: "Daily Trend (Excel)",
                            key: "attendance_excel",
                            icon: "ri-file-excel-line",
                            color: "#16a34a",
                        },
                        {
                            label: "Daily Trend (PDF)",
                            key: "attendance_pdf",
                            icon: "ri-file-pdf-line",
                            color: "#dc2626",
                        },
                    ];
                case "dept":
                    return [
                        {
                            label: "Department (Excel)",
                            key: "dept_excel",
                            icon: "ri-file-excel-line",
                            color: "#16a34a",
                        },
                    ];
                case "location":
                    return [
                        {
                            label: "Location (Excel)",
                            key: "attendance_excel",
                            icon: "ri-file-excel-line",
                            color: "#16a34a",
                        },
                    ];
                case "late":
                    return [
                        {
                            label: "Late Arrivals (Excel)",
                            key: "late_excel",
                            icon: "ri-file-excel-line",
                            color: "#16a34a",
                        },
                    ];
                case "absent":
                    return [
                        {
                            label: "Absenteeism (Excel)",
                            key: "absent_excel",
                            icon: "ri-file-excel-line",
                            color: "#16a34a",
                        },
                    ];
                default:
                    return [];
            }
        };

        const options = getExportOptions();

        return (
            <div className="relative">
                <button
                    onClick={() => setShowExportMenu(isOpen ? null : tabType)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
                    style={{ background: "#dcfce7", color: "#16a34a" }}
                >
                    <i className="ri-download-line"></i> Export
                    <i
                        className={`ri-arrow-${isOpen ? "up" : "down"}-s-line`}
                    ></i>
                </button>

                {isOpen && (
                    <div
                        className="absolute right-0 top-10 rounded-xl overflow-hidden z-50 shadow-lg"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                            minWidth: "180px",
                        }}
                    >
                        <div className="py-1">
                            {options.map((opt) => (
                                <button
                                    key={opt.key}
                                    onClick={() => {
                                        const [type, format] =
                                            opt.key.split("_");
                                        exportReport(
                                            format as "excel" | "pdf",
                                            type,
                                        );
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-opacity-50 transition-colors"
                                    style={{ color: textPrimary }}
                                >
                                    <i
                                        className={opt.icon}
                                        style={{ color: opt.color }}
                                    ></i>{" "}
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const tabs: {
        key: ReportTab;
        label: string;
        icon: string;
        badge?: number;
    }[] = [
        {
            key: "summary",
            label: "Attendance Summary",
            icon: "ri-file-list-line",
        },
        {
            key: "payroll",
            label: "Payroll Report",
            icon: "ri-money-dollar-circle-line",
        },
        { key: "daily", label: "Daily Trend", icon: "ri-bar-chart-2-line" },
        { key: "dept", label: "By Department", icon: "ri-building-2-line" },
        { key: "location", label: "By Location", icon: "ri-map-pin-line" },
        {
            key: "late",
            label: "Late Arrivals",
            icon: "ri-time-line",
            badge: props.lateCount,
        },
        {
            key: "absent",
            label: "Absenteeism",
            icon: "ri-user-unfollow-line",
            badge: props.absentCount,
        },
    ];

    const hasActiveFilters =
        filters.department ||
        filters.location ||
        filters.area ||
        filters.search;

    const pagination =
        activeTab === "payroll"
            ? props.payrollPagination
            : props.summaryPagination;

    return (
        <AppLayout title="Reports">
            <div
                className="p-4 sm:p-6"
                style={{ background: bg, minHeight: "100vh" }}
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                        <h1
                            className="text-xl sm:text-2xl font-bold"
                            style={{ color: textPrimary }}
                        >
                            Reports & Analytics
                        </h1>
                        <p
                            className="text-sm mt-0.5"
                            style={{ color: textSecondary }}
                        >
                            Attendance summaries, payroll, department & location
                            breakdowns
                        </p>
                    </div>

                    {/* Global Export Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() =>
                                setShowExportMenu(
                                    showExportMenu === "global"
                                        ? null
                                        : "global",
                                )
                            }
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer"
                            style={{
                                background:
                                    "linear-gradient(135deg, #16a34a, #15803d)",
                            }}
                        >
                            <i className="ri-download-line"></i>
                            Export Report
                            <i className="ri-arrow-down-s-line"></i>
                        </button>

                        {showExportMenu === "global" && (
                            <div
                                className="absolute right-0 top-12 rounded-xl overflow-hidden z-50 shadow-lg"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${border}`,
                                    minWidth: "220px",
                                }}
                            >
                                <div className="py-1">
                                    <button
                                        onClick={() =>
                                            exportReport("excel", "attendance")
                                        }
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-opacity-50"
                                        style={{ color: textPrimary }}
                                    >
                                        <i className="ri-file-excel-line text-green-600"></i>{" "}
                                        Attendance (Excel)
                                    </button>
                                    <button
                                        onClick={() =>
                                            exportReport("pdf", "attendance")
                                        }
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-opacity-50"
                                        style={{ color: textPrimary }}
                                    >
                                        <i className="ri-file-pdf-line text-red-600"></i>{" "}
                                        Attendance (PDF)
                                    </button>
                                    <div
                                        className="my-1"
                                        style={{
                                            borderTop: `1px solid ${border}`,
                                        }}
                                    ></div>
                                    <button
                                        onClick={() =>
                                            exportReport("excel", "devices")
                                        }
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-opacity-50"
                                        style={{ color: textPrimary }}
                                    >
                                        <i className="ri-file-excel-line text-green-600"></i>{" "}
                                        Devices (Excel)
                                    </button>
                                    <button
                                        onClick={() =>
                                            exportReport("pdf", "devices")
                                        }
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-opacity-50"
                                        style={{ color: textPrimary }}
                                    >
                                        <i className="ri-file-pdf-line text-red-600"></i>{" "}
                                        Devices (PDF)
                                    </button>
                                    <div
                                        className="my-1"
                                        style={{
                                            borderTop: `1px solid ${border}`,
                                        }}
                                    ></div>
                                    <button
                                        onClick={() =>
                                            exportReport("excel", "payroll")
                                        }
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-opacity-50"
                                        style={{ color: textPrimary }}
                                    >
                                        <i className="ri-file-excel-line text-green-600"></i>{" "}
                                        Payroll (Excel)
                                    </button>
                                    <button
                                        onClick={() =>
                                            exportReport("pdf", "payroll")
                                        }
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-opacity-50"
                                        style={{ color: textPrimary }}
                                    >
                                        <i className="ri-file-pdf-line text-red-600"></i>{" "}
                                        Payroll (PDF)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
                    {[
                        {
                            label: "Avg Rate",
                            value: `${props.kpiAvgRate.toFixed(1)}%`,
                            icon: "ri-percent-line",
                            color: "#16a34a",
                            bg: "#dcfce7",
                        },
                        {
                            label: "Present Days",
                            value: props.kpiTotalPresent.toLocaleString(),
                            icon: "ri-checkbox-circle-line",
                            color: "#16a34a",
                            bg: "#dcfce7",
                        },
                        {
                            label: "Absent Days",
                            value: props.kpiTotalAbsent.toLocaleString(),
                            icon: "ri-close-circle-line",
                            color: "#dc2626",
                            bg: "#fee2e2",
                        },
                        {
                            label: "Late Arrivals",
                            value: props.kpiTotalLate.toLocaleString(),
                            icon: "ri-alarm-warning-line",
                            color: "#f59e0b",
                            bg: "#fef9c3",
                        },
                        {
                            label: "OT Hours",
                            value: `${props.kpiTotalOT.toFixed(1)}h`,
                            icon: "ri-timer-line",
                            color: "#7c3aed",
                            bg: "#ede9fe",
                        },
                        {
                            label: "Net Pay",
                            value: `₦${(props.kpiTotalNetPay / 1000000).toFixed(2)}M`,
                            icon: "ri-money-dollar-circle-line",
                            color: "#0891b2",
                            bg: "#e0f2fe",
                        },
                    ].map((stat) => (
                        <div
                            key={stat.label}
                            className="p-3 md:p-4 rounded-xl flex items-center gap-3"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div
                                className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: stat.bg }}
                            >
                                <i
                                    className={`${stat.icon} text-sm md:text-base`}
                                    style={{ color: stat.color }}
                                ></i>
                            </div>
                            <div className="min-w-0">
                                <p
                                    className="text-base md:text-lg font-bold leading-tight"
                                    style={{ color: textPrimary }}
                                >
                                    {stat.value}
                                </p>
                                <p
                                    className="text-xs leading-tight"
                                    style={{ color: textSecondary }}
                                >
                                    {stat.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters Section */}
                <div
                    className="rounded-xl mb-5"
                    style={{
                        background: cardBg,
                        border: `1px solid ${border}`,
                    }}
                >
                    <div
                        className="px-4 py-3 flex items-center gap-2 flex-wrap"
                        style={{ borderBottom: `1px solid ${border}` }}
                    >
                        <span
                            className="text-xs font-semibold whitespace-nowrap"
                            style={{ color: textSecondary }}
                        >
                            Quick:
                        </span>
                        {DATE_PRESETS.map((preset) => {
                            const { from, to } = preset.getValue();
                            return (
                                <button
                                    key={preset.label}
                                    onClick={() => applyPreset(from, to)}
                                    className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
                                    style={{
                                        background:
                                            dateRange.from === from &&
                                            dateRange.to === to
                                                ? "#16a34a"
                                                : isDark
                                                  ? "#374151"
                                                  : "#f3f4f6",
                                        color:
                                            dateRange.from === from &&
                                            dateRange.to === to
                                                ? "#ffffff"
                                                : textSecondary,
                                    }}
                                >
                                    {preset.label}
                                </button>
                            );
                        })}
                        <div className="flex-1"></div>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
                            style={{
                                background: showFilters
                                    ? "#dcfce7"
                                    : isDark
                                      ? "#374151"
                                      : "#f3f4f6",
                                color: showFilters ? "#16a34a" : textSecondary,
                            }}
                        >
                            <i className="ri-filter-3-line"></i> Filters
                            {hasActiveFilters && (
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: "#16a34a" }}
                                ></span>
                            )}
                        </button>
                    </div>

                    {showFilters && (
                        <div
                            className="px-4 py-3 flex items-center gap-3 flex-wrap"
                            style={{ borderBottom: `1px solid ${border}` }}
                        >
                            <div className="flex items-center gap-2">
                                <label
                                    className="text-xs font-medium whitespace-nowrap"
                                    style={{ color: textSecondary }}
                                >
                                    From
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.from}
                                    onChange={(e) =>
                                        setDateRange({
                                            ...dateRange,
                                            from: e.target.value,
                                        })
                                    }
                                    className="px-3 py-1.5 rounded-lg text-sm outline-none"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <label
                                    className="text-xs font-medium whitespace-nowrap"
                                    style={{ color: textSecondary }}
                                >
                                    To
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.to}
                                    onChange={(e) =>
                                        setDateRange({
                                            ...dateRange,
                                            to: e.target.value,
                                        })
                                    }
                                    className="px-3 py-1.5 rounded-lg text-sm outline-none"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                />
                            </div>
                            <select
                                value={filters.department}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        department: e.target.value,
                                    })
                                }
                                className="px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
                                style={{
                                    background: inputBg,
                                    border: `1px solid ${border}`,
                                    color: textPrimary,
                                }}
                            >
                                <option value="">All Departments</option>
                                {props.departments?.map((dept) => (
                                    <option key={dept} value={dept}>
                                        {dept}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filters.location}
                                onChange={(e) =>
                                    setFilters({
                                        ...filters,
                                        location: e.target.value,
                                    })
                                }
                                className="px-3 py-1.5 rounded-lg text-sm outline-none cursor-pointer"
                                style={{
                                    background: inputBg,
                                    border: `1px solid ${border}`,
                                    color: textPrimary,
                                }}
                            >
                                <option value="">All Locations</option>
                                {props.locations?.map((loc) => (
                                    <option key={loc} value={loc}>
                                        {loc}
                                    </option>
                                ))}
                            </select>
                            <div className="relative">
                                <i
                                    className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs"
                                    style={{ color: textSecondary }}
                                ></i>
                                <input
                                    value={filters.search}
                                    onChange={(e) =>
                                        setFilters({
                                            ...filters,
                                            search: e.target.value,
                                        })
                                    }
                                    placeholder="Search employee..."
                                    className="pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none w-48"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                />
                            </div>
                            <button
                                onClick={applyFilters}
                                className="px-4 py-1.5 rounded-lg text-sm font-medium text-white cursor-pointer"
                                style={{ background: "#16a34a" }}
                            >
                                Apply Filters
                            </button>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="text-xs font-medium cursor-pointer whitespace-nowrap"
                                    style={{ color: "#dc2626" }}
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    )}

                    <div className="px-4 py-2 flex items-center gap-2">
                        <i
                            className="ri-calendar-line text-xs"
                            style={{ color: textSecondary }}
                        ></i>
                        <span
                            className="text-xs"
                            style={{ color: textSecondary }}
                        >
                            {dateRange.from} → {dateRange.to} ·{" "}
                            {props.totalEmployees} employees
                        </span>
                    </div>
                </div>

                {/* Tabs */}
                <div
                    className="flex gap-0 mb-4 overflow-x-auto"
                    style={{ borderBottom: `1px solid ${border}` }}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => switchTab(tab.key)}
                            className="flex items-center gap-1.5 px-3 md:px-4 py-3 text-xs md:text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
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
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span
                                    className="px-1.5 py-0.5 rounded-full text-xs font-bold"
                                    style={{
                                        background:
                                            tab.key === "late"
                                                ? "#fef9c3"
                                                : "#fee2e2",
                                        color:
                                            tab.key === "late"
                                                ? "#ca8a04"
                                                : "#dc2626",
                                    }}
                                >
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        background: cardBg,
                        border: `1px solid ${border}`,
                    }}
                >
                    {/* Summary Tab */}
                    {activeTab === "summary" && (
                        <>
                            <div
                                className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <div>
                                    <h3
                                        className="text-sm font-semibold"
                                        style={{ color: textPrimary }}
                                    >
                                        Attendance Summary Report
                                    </h3>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: textSecondary }}
                                    >
                                        {pagination?.total || 0} employees ·{" "}
                                        {dateRange.from} to {dateRange.to}
                                    </p>
                                </div>
                                {renderExportDropdown("summary")}
                            </div>
                            {isLoading ? (
                                <TableSkeleton columns={10} rows={perPage} />
                            ) : (
                                <>
                                    <AttendanceSummaryTable
                                        data={props.summaryRows || []}
                                    />
                                    {pagination && (
                                        <div
                                            className="px-5 py-3 flex items-center justify-between border-t"
                                            style={{ borderColor: border }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    Show
                                                </span>
                                                <select
                                                    value={perPage}
                                                    onChange={(e) =>
                                                        handlePerPageChange(
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="px-2 py-1 rounded text-xs"
                                                    style={{
                                                        background: inputBg,
                                                        border: `1px solid ${border}`,
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {PER_PAGE_OPTIONS.map(
                                                        (opt) => (
                                                            <option
                                                                key={opt}
                                                                value={opt}
                                                            >
                                                                {opt}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    per page
                                                </span>
                                            </div>
                                            <Pagination
                                                currentPage={
                                                    pagination.currentPage
                                                }
                                                lastPage={pagination.lastPage}
                                                onPageChange={handlePageChange}
                                                isDark={isDark}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* Payroll Tab */}
                    {activeTab === "payroll" && (
                        <>
                            <div
                                className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <div>
                                    <h3
                                        className="text-sm font-semibold"
                                        style={{ color: textPrimary }}
                                    >
                                        Payroll Summary
                                    </h3>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: textSecondary }}
                                    >
                                        Auto-calculated · Late & absent
                                        deductions · OT pay included
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                                        style={{
                                            background: "#dcfce7",
                                            color: "#16a34a",
                                        }}
                                    >
                                        Total Net: ₦
                                        {props.kpiTotalNetPay.toLocaleString()}
                                    </div>
                                    {renderExportDropdown("payroll")}
                                </div>
                            </div>
                            <div
                                className="px-5 py-3 flex items-center gap-4 md:gap-6 flex-wrap"
                                style={{
                                    borderBottom: `1px solid ${border}`,
                                    background: isDark ? "#374151" : "#f9fafb",
                                }}
                            >
                                {[
                                    {
                                        icon: "ri-information-line",
                                        color: "#0891b2",
                                        text: "Deduction: Basic ÷ working days",
                                    },
                                    {
                                        icon: "ri-alarm-warning-line",
                                        color: "#f59e0b",
                                        text: "Late: Basic ÷ days ÷ 8h × late min ÷ 60",
                                    },
                                    {
                                        icon: "ri-timer-line",
                                        color: "#7c3aed",
                                        text: "OT rate: 1.5× hourly",
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.text}
                                        className="flex items-center gap-2 text-xs"
                                        style={{ color: textSecondary }}
                                    >
                                        <i
                                            className={item.icon}
                                            style={{ color: item.color }}
                                        ></i>
                                        <span>{item.text}</span>
                                    </div>
                                ))}
                            </div>
                            {isLoading ? (
                                <TableSkeleton columns={12} rows={perPage} />
                            ) : (
                                <>
                                    <PayrollTable
                                        data={props.payrollRows || []}
                                    />
                                    {props.payrollPagination && (
                                        <div
                                            className="px-5 py-3 flex items-center justify-between border-t"
                                            style={{ borderColor: border }}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    Show
                                                </span>
                                                <select
                                                    value={perPage}
                                                    onChange={(e) =>
                                                        handlePerPageChange(
                                                            Number(
                                                                e.target.value,
                                                            ),
                                                        )
                                                    }
                                                    className="px-2 py-1 rounded text-xs"
                                                    style={{
                                                        background: inputBg,
                                                        border: `1px solid ${border}`,
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {PER_PAGE_OPTIONS.map(
                                                        (opt) => (
                                                            <option
                                                                key={opt}
                                                                value={opt}
                                                            >
                                                                {opt}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    per page
                                                </span>
                                            </div>
                                            <Pagination
                                                currentPage={
                                                    props.payrollPagination
                                                        .currentPage
                                                }
                                                lastPage={
                                                    props.payrollPagination
                                                        .lastPage
                                                }
                                                onPageChange={handlePageChange}
                                                isDark={isDark}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {/* Daily Trend Tab */}
                    {activeTab === "daily" && (
                        <>
                            <div
                                className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <div>
                                    <h3
                                        className="text-sm font-semibold"
                                        style={{ color: textPrimary }}
                                    >
                                        Daily Attendance Trend
                                    </h3>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: textSecondary }}
                                    >
                                        Hover bars for details
                                    </p>
                                </div>
                                {renderExportDropdown("daily")}
                            </div>
                            <div className="p-5">
                                <DailyTrendChart data={props.dailyRows || []} />
                            </div>
                            <div style={{ borderTop: `1px solid ${border}` }}>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[600px]">
                                        <thead>
                                            <tr
                                                style={{
                                                    borderBottom: `1px solid ${border}`,
                                                }}
                                            >
                                                {[
                                                    "Date",
                                                    "Day",
                                                    "Total",
                                                    "Present",
                                                    "Absent",
                                                    "Late",
                                                    "Half Day",
                                                    "Rate",
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
                                            {(props.dailyRows || []).map(
                                                (row) => {
                                                    const date = new Date(
                                                        row.date,
                                                    );
                                                    const dayName =
                                                        date.toLocaleDateString(
                                                            "en",
                                                            { weekday: "long" },
                                                        );
                                                    const isWeekend =
                                                        row.attendanceRate ===
                                                        0;
                                                    return (
                                                        <tr
                                                            key={row.date}
                                                            style={{
                                                                borderBottom: `1px solid ${border}`,
                                                                opacity:
                                                                    isWeekend
                                                                        ? 0.5
                                                                        : 1,
                                                            }}
                                                        >
                                                            <td
                                                                className="px-4 py-2.5 text-sm font-mono"
                                                                style={{
                                                                    color: textPrimary,
                                                                }}
                                                            >
                                                                {row.date}
                                                            </td>
                                                            <td
                                                                className="px-4 py-2.5 text-xs"
                                                                style={{
                                                                    color: textSecondary,
                                                                }}
                                                            >
                                                                {dayName}
                                                            </td>
                                                            <td
                                                                className="px-4 py-2.5 text-sm text-center"
                                                                style={{
                                                                    color: textPrimary,
                                                                }}
                                                            >
                                                                {
                                                                    row.totalEmployees
                                                                }
                                                            </td>
                                                            <td
                                                                className="px-4 py-2.5 text-sm font-semibold text-center"
                                                                style={{
                                                                    color: "#16a34a",
                                                                }}
                                                            >
                                                                {isWeekend
                                                                    ? "-"
                                                                    : row.present}
                                                            </td>
                                                            <td
                                                                className="px-4 py-2.5 text-sm font-semibold text-center"
                                                                style={{
                                                                    color: "#dc2626",
                                                                }}
                                                            >
                                                                {isWeekend
                                                                    ? "-"
                                                                    : row.absent}
                                                            </td>
                                                            <td
                                                                className="px-4 py-2.5 text-sm font-semibold text-center"
                                                                style={{
                                                                    color: "#f59e0b",
                                                                }}
                                                            >
                                                                {isWeekend
                                                                    ? "-"
                                                                    : row.late}
                                                            </td>
                                                            <td
                                                                className="px-4 py-2.5 text-sm font-semibold text-center"
                                                                style={{
                                                                    color: "#0891b2",
                                                                }}
                                                            >
                                                                {isWeekend
                                                                    ? "-"
                                                                    : row.halfDay}
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                {isWeekend ? (
                                                                    <span
                                                                        className="text-xs px-2 py-0.5 rounded-full"
                                                                        style={{
                                                                            background:
                                                                                isDark
                                                                                    ? "#374151"
                                                                                    : "#f3f4f6",
                                                                            color: textSecondary,
                                                                        }}
                                                                    >
                                                                        Weekend
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                                                        style={{
                                                                            background:
                                                                                row.attendanceRate >=
                                                                                95
                                                                                    ? "#dcfce7"
                                                                                    : row.attendanceRate >=
                                                                                        85
                                                                                      ? "#fef9c3"
                                                                                      : "#fee2e2",
                                                                            color:
                                                                                row.attendanceRate >=
                                                                                95
                                                                                    ? "#16a34a"
                                                                                    : row.attendanceRate >=
                                                                                        85
                                                                                      ? "#ca8a04"
                                                                                      : "#dc2626",
                                                                        }}
                                                                    >
                                                                        {
                                                                            row.attendanceRate
                                                                        }
                                                                        %
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                },
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Department Breakdown Tab */}
                    {activeTab === "dept" && (
                        <>
                            <div
                                className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <div>
                                    <h3
                                        className="text-sm font-semibold"
                                        style={{ color: textPrimary }}
                                    >
                                        Department Breakdown
                                    </h3>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: textSecondary }}
                                    >
                                        Attendance performance grouped by
                                        department
                                    </p>
                                </div>
                                {renderExportDropdown("dept")}
                            </div>
                            <DeptBreakdownReport
                                data={props.summaryRows || []}
                                deptRows={props.deptRows}
                            />
                        </>
                    )}

                    {/* Location Breakdown Tab */}
                    {activeTab === "location" && (
                        <>
                            <div
                                className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <div>
                                    <h3
                                        className="text-sm font-semibold"
                                        style={{ color: textPrimary }}
                                    >
                                        Location Breakdown
                                    </h3>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: textSecondary }}
                                    >
                                        Attendance performance grouped by
                                        location / area
                                    </p>
                                </div>
                                {renderExportDropdown("location")}
                            </div>
                            <LocationBreakdownReport
                                data={props.summaryRows || []}
                            />
                        </>
                    )}

                    {/* Late Arrivals Tab */}
                    {activeTab === "late" && (
                        <>
                            <div
                                className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <div>
                                    <h3
                                        className="text-sm font-semibold"
                                        style={{ color: textPrimary }}
                                    >
                                        Late Arrivals Report
                                    </h3>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: textSecondary }}
                                    >
                                        {props.lateCount} employees with late
                                        arrivals · Sorted by total late minutes
                                    </p>
                                </div>
                                {renderExportDropdown("late")}
                            </div>
                            {isLoading ? (
                                <TableSkeleton columns={9} rows={perPage} />
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[700px]">
                                            <thead>
                                                <tr
                                                    style={{
                                                        borderBottom: `1px solid ${border}`,
                                                    }}
                                                >
                                                    {[
                                                        "#",
                                                        "Employee",
                                                        "Department",
                                                        "Shift",
                                                        "Location",
                                                        "Late Days",
                                                        "Total Late (min)",
                                                        "Avg Late (min)",
                                                        "Rate",
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
                                                {(props.summaryRows || []).map(
                                                    (row, i) => (
                                                        <tr
                                                            key={
                                                                row.employeeId ||
                                                                i
                                                            }
                                                            style={{
                                                                borderBottom: `1px solid ${border}`,
                                                            }}
                                                            onMouseEnter={(
                                                                e,
                                                            ) => {
                                                                e.currentTarget.style.background =
                                                                    isDark
                                                                        ? "#374151"
                                                                        : "#f9fafb";
                                                            }}
                                                            onMouseLeave={(
                                                                e,
                                                            ) => {
                                                                e.currentTarget.style.background =
                                                                    "transparent";
                                                            }}
                                                        >
                                                            <td
                                                                className="px-4 py-3 text-sm font-bold"
                                                                style={{
                                                                    color:
                                                                        i < 3
                                                                            ? "#f59e0b"
                                                                            : textSecondary,
                                                                }}
                                                            >
                                                                {((pagination?.currentPage ||
                                                                    1) -
                                                                    1) *
                                                                    perPage +
                                                                    i +
                                                                    1}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <p
                                                                    className="text-sm font-medium whitespace-nowrap"
                                                                    style={{
                                                                        color: textPrimary,
                                                                    }}
                                                                >
                                                                    {
                                                                        row.employeeName
                                                                    }
                                                                </p>
                                                                <p
                                                                    className="text-xs"
                                                                    style={{
                                                                        color: textSecondary,
                                                                    }}
                                                                >
                                                                    {
                                                                        row.employeeId
                                                                    }
                                                                </p>
                                                            </td>
                                                            <td
                                                                className="px-4 py-3 text-xs whitespace-nowrap"
                                                                style={{
                                                                    color: textSecondary,
                                                                }}
                                                            >
                                                                {row.department}
                                                            </td>
                                                            <td
                                                                className="px-4 py-3 text-xs whitespace-nowrap"
                                                                style={{
                                                                    color: textSecondary,
                                                                }}
                                                            >
                                                                {row.shift ||
                                                                    "-"}
                                                            </td>
                                                            <td
                                                                className="px-4 py-3 text-xs whitespace-nowrap"
                                                                style={{
                                                                    color: textSecondary,
                                                                }}
                                                            >
                                                                {row.location}
                                                            </td>
                                                            <td
                                                                className="px-4 py-3 text-sm font-bold text-center"
                                                                style={{
                                                                    color: "#f59e0b",
                                                                }}
                                                            >
                                                                {row.lateDays}
                                                            </td>
                                                            <td
                                                                className="px-4 py-3 text-sm font-bold text-center"
                                                                style={{
                                                                    color: "#dc2626",
                                                                }}
                                                            >
                                                                {row.lateMinutes ||
                                                                    0}
                                                            </td>
                                                            <td
                                                                className="px-4 py-3 text-sm font-mono text-center"
                                                                style={{
                                                                    color: textSecondary,
                                                                }}
                                                            >
                                                                {row.lateDays >
                                                                0
                                                                    ? (
                                                                          (row.lateMinutes ||
                                                                              0) /
                                                                          row.lateDays
                                                                      ).toFixed(
                                                                          0,
                                                                      )
                                                                    : 0}
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span
                                                                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                                                    style={{
                                                                        background:
                                                                            row.attendanceRate >=
                                                                            95
                                                                                ? "#dcfce7"
                                                                                : row.attendanceRate >=
                                                                                    80
                                                                                  ? "#fef9c3"
                                                                                  : "#fee2e2",
                                                                        color:
                                                                            row.attendanceRate >=
                                                                            95
                                                                                ? "#16a34a"
                                                                                : row.attendanceRate >=
                                                                                    80
                                                                                  ? "#ca8a04"
                                                                                  : "#dc2626",
                                                                    }}
                                                                >
                                                                    {row.attendanceRate?.toFixed(
                                                                        1,
                                                                    )}
                                                                    %
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                                {(props.summaryRows || [])
                                                    .length === 0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={9}
                                                            className="py-12 text-center text-sm"
                                                            style={{
                                                                color: textSecondary,
                                                            }}
                                                        >
                                                            <i
                                                                className="ri-checkbox-circle-line text-3xl mb-2 block"
                                                                style={{
                                                                    color: "#16a34a",
                                                                }}
                                                            ></i>
                                                            No late arrivals for
                                                            the selected period
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {pagination &&
                                        (props.summaryRows || []).length >
                                            0 && (
                                            <div
                                                className="px-5 py-3 flex items-center justify-between border-t"
                                                style={{ borderColor: border }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        Show
                                                    </span>
                                                    <select
                                                        value={perPage}
                                                        onChange={(e) =>
                                                            handlePerPageChange(
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        className="px-2 py-1 rounded text-xs"
                                                        style={{
                                                            background: inputBg,
                                                            border: `1px solid ${border}`,
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {PER_PAGE_OPTIONS.map(
                                                            (opt) => (
                                                                <option
                                                                    key={opt}
                                                                    value={opt}
                                                                >
                                                                    {opt}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        per page
                                                    </span>
                                                </div>
                                                <Pagination
                                                    currentPage={
                                                        pagination.currentPage
                                                    }
                                                    lastPage={
                                                        pagination.lastPage
                                                    }
                                                    onPageChange={
                                                        handlePageChange
                                                    }
                                                    isDark={isDark}
                                                />
                                            </div>
                                        )}
                                </>
                            )}
                        </>
                    )}

                    {/* Absenteeism Tab */}
                    {activeTab === "absent" && (
                        <>
                            <div
                                className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2"
                                style={{ borderBottom: `1px solid ${border}` }}
                            >
                                <div>
                                    <h3
                                        className="text-sm font-semibold"
                                        style={{ color: textPrimary }}
                                    >
                                        Absenteeism Report
                                    </h3>
                                    <p
                                        className="text-xs mt-0.5"
                                        style={{ color: textSecondary }}
                                    >
                                        {props.absentCount} employees with
                                        absences · Sorted by absent days
                                    </p>
                                </div>
                                {renderExportDropdown("absent")}
                            </div>
                            {isLoading ? (
                                <TableSkeleton columns={9} rows={perPage} />
                            ) : (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full min-w-[700px]">
                                            <thead>
                                                <tr
                                                    style={{
                                                        borderBottom: `1px solid ${border}`,
                                                    }}
                                                >
                                                    {[
                                                        "#",
                                                        "Employee",
                                                        "Department",
                                                        "Shift",
                                                        "Location",
                                                        "Absent Days",
                                                        "Present Days",
                                                        "Rate",
                                                        "Deduction",
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
                                                {(props.summaryRows || []).map(
                                                    (row, i) => {
                                                        const payrollRow = (
                                                            props.payrollRows ||
                                                            []
                                                        ).find(
                                                            (p) =>
                                                                p.employeeId ===
                                                                row.employeeId,
                                                        );
                                                        return (
                                                            <tr
                                                                key={
                                                                    row.employeeId ||
                                                                    i
                                                                }
                                                                style={{
                                                                    borderBottom: `1px solid ${border}`,
                                                                }}
                                                                onMouseEnter={(
                                                                    e,
                                                                ) => {
                                                                    e.currentTarget.style.background =
                                                                        isDark
                                                                            ? "#374151"
                                                                            : "#f9fafb";
                                                                }}
                                                                onMouseLeave={(
                                                                    e,
                                                                ) => {
                                                                    e.currentTarget.style.background =
                                                                        "transparent";
                                                                }}
                                                            >
                                                                <td
                                                                    className="px-4 py-3 text-sm font-bold"
                                                                    style={{
                                                                        color:
                                                                            i <
                                                                            3
                                                                                ? "#dc2626"
                                                                                : textSecondary,
                                                                    }}
                                                                >
                                                                    {((pagination?.currentPage ||
                                                                        1) -
                                                                        1) *
                                                                        perPage +
                                                                        i +
                                                                        1}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <p
                                                                        className="text-sm font-medium whitespace-nowrap"
                                                                        style={{
                                                                            color: textPrimary,
                                                                        }}
                                                                    >
                                                                        {
                                                                            row.employeeName
                                                                        }
                                                                    </p>
                                                                    <p
                                                                        className="text-xs"
                                                                        style={{
                                                                            color: textSecondary,
                                                                        }}
                                                                    >
                                                                        {
                                                                            row.employeeId
                                                                        }
                                                                    </p>
                                                                </td>
                                                                <td
                                                                    className="px-4 py-3 text-xs whitespace-nowrap"
                                                                    style={{
                                                                        color: textSecondary,
                                                                    }}
                                                                >
                                                                    {
                                                                        row.department
                                                                    }
                                                                </td>
                                                                <td
                                                                    className="px-4 py-3 text-xs whitespace-nowrap"
                                                                    style={{
                                                                        color: textSecondary,
                                                                    }}
                                                                >
                                                                    {row.shift ||
                                                                        "-"}
                                                                </td>
                                                                <td
                                                                    className="px-4 py-3 text-xs whitespace-nowrap"
                                                                    style={{
                                                                        color: textSecondary,
                                                                    }}
                                                                >
                                                                    {
                                                                        row.location
                                                                    }
                                                                </td>
                                                                <td
                                                                    className="px-4 py-3 text-sm font-bold text-center"
                                                                    style={{
                                                                        color: "#dc2626",
                                                                    }}
                                                                >
                                                                    {
                                                                        row.absentDays
                                                                    }
                                                                </td>
                                                                <td
                                                                    className="px-4 py-3 text-sm font-semibold text-center"
                                                                    style={{
                                                                        color: "#16a34a",
                                                                    }}
                                                                >
                                                                    {
                                                                        row.presentDays
                                                                    }
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <span
                                                                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                                                        style={{
                                                                            background:
                                                                                row.attendanceRate >=
                                                                                95
                                                                                    ? "#dcfce7"
                                                                                    : row.attendanceRate >=
                                                                                        80
                                                                                      ? "#fef9c3"
                                                                                      : "#fee2e2",
                                                                            color:
                                                                                row.attendanceRate >=
                                                                                95
                                                                                    ? "#16a34a"
                                                                                    : row.attendanceRate >=
                                                                                        80
                                                                                      ? "#ca8a04"
                                                                                      : "#dc2626",
                                                                        }}
                                                                    >
                                                                        {row.attendanceRate?.toFixed(
                                                                            1,
                                                                        )}
                                                                        %
                                                                    </span>
                                                                </td>
                                                                <td
                                                                    className="px-4 py-3 text-sm font-mono whitespace-nowrap"
                                                                    style={{
                                                                        color: "#dc2626",
                                                                    }}
                                                                >
                                                                    {payrollRow
                                                                        ? `-₦${payrollRow.absentDeduction?.toLocaleString() || 0}`
                                                                        : "-"}
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                                {(props.summaryRows || [])
                                                    .length === 0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={9}
                                                            className="py-12 text-center text-sm"
                                                            style={{
                                                                color: textSecondary,
                                                            }}
                                                        >
                                                            <i
                                                                className="ri-checkbox-circle-line text-3xl mb-2 block"
                                                                style={{
                                                                    color: "#16a34a",
                                                                }}
                                                            ></i>
                                                            No absences for the
                                                            selected period
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    {pagination &&
                                        (props.summaryRows || []).length >
                                            0 && (
                                            <div
                                                className="px-5 py-3 flex items-center justify-between border-t"
                                                style={{ borderColor: border }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        Show
                                                    </span>
                                                    <select
                                                        value={perPage}
                                                        onChange={(e) =>
                                                            handlePerPageChange(
                                                                Number(
                                                                    e.target
                                                                        .value,
                                                                ),
                                                            )
                                                        }
                                                        className="px-2 py-1 rounded text-xs"
                                                        style={{
                                                            background: inputBg,
                                                            border: `1px solid ${border}`,
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {PER_PAGE_OPTIONS.map(
                                                            (opt) => (
                                                                <option
                                                                    key={opt}
                                                                    value={opt}
                                                                >
                                                                    {opt}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        per page
                                                    </span>
                                                </div>
                                                <Pagination
                                                    currentPage={
                                                        pagination.currentPage
                                                    }
                                                    lastPage={
                                                        pagination.lastPage
                                                    }
                                                    onPageChange={
                                                        handlePageChange
                                                    }
                                                    isDark={isDark}
                                                />
                                            </div>
                                        )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
