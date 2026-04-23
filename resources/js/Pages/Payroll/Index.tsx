import { useState } from "react";
import { usePage, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import type { PageProps } from "@/types";

// Import Components - FIXED PATHS
import PayrollStats from "./Components/PayrollStats";
import ApprovalProgressBar from "./Components/ApprovalProgressBar";
import GeneratePayrollModal from "./Components/GeneratePayrollModal";
import RejectPayrollModal from "./Components/RejectPayrollModal";
import PayrollTrendChart from "./Components/PayrollTrendChart";
import DepartmentSummaryTable from "./Components/DepartmentSummaryTable";
import StatusBadge from "./Components/StatusBadge";

interface PayrollPeriod {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    payment_date: string | null;
    status: "draft" | "processing" | "approved" | "paid" | "closed";
    total_employees: number;
    total_basic_salary: number;
    total_net_pay: number;
    approval_progress?: {
        percentage: number;
        approved: number;
        total: number;
        levels: ApprovalLevelStatus[];
        is_fully_approved: boolean;
    };
    created_at?: string;
}

interface ApprovalLevelStatus {
    level: string;
    code: string;
    order: number;
    is_required: boolean;
    status: "pending" | "approved" | "rejected";
    approved_by: string | null;
    approved_at: string | null;
    remarks: string | null;
}

interface PayrollSummary {
    total_employees: number;
    monthly_payroll: number;
    average_salary: number;
    pending_approvals: number;
    ytd_payroll: number;
    current_period: PayrollPeriod | null;
    last_period: PayrollPeriod | null;
}

interface PayrollTrend {
    month: string;
    total_payroll: number;
    employee_count: number;
    avg_salary: number;
}

interface DeptSummary {
    department: string;
    employee_count: number;
    total_basic: number;
    total_net_pay: number;
}

interface PendingApproval {
    period: PayrollPeriod;
    level: string;
    code: string;
}

interface Props extends PageProps {
    summary: PayrollSummary;
    trend: PayrollTrend[];
    deptSummary: DeptSummary[];
    periods: PayrollPeriod[];
    currentPeriod: PayrollPeriod | null;
    selectedPeriod: string;
    pendingApprovals: PendingApproval[];
    userApprovalLevel: string | null;
    canApproveCurrentPeriod: boolean;
    pendingApprovalLevel: string | null;
    unreadCount: number;
    departments: string[];
    locations: string[];
}

const STATUS_CONFIG: Record<
    string,
    { bg: string; color: string; label: string; icon: string }
> = {
    draft: {
        bg: "#f3f4f6",
        color: "#6b7280",
        label: "Draft",
        icon: "ri-draft-line",
    },
    processing: {
        bg: "#fef9c3",
        color: "#ca8a04",
        label: "Processing",
        icon: "ri-time-line",
    },
    approved: {
        bg: "#dcfce7",
        color: "#16a34a",
        label: "Approved",
        icon: "ri-checkbox-circle-line",
    },
    paid: {
        bg: "#dbeafe",
        color: "#2563eb",
        label: "Paid",
        icon: "ri-bank-card-line",
    },
    closed: {
        bg: "#f3f4f6",
        color: "#4b5563",
        label: "Closed",
        icon: "ri-archive-line",
    },
};

export default function PayrollIndex() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const { props } = usePage<Props>();

    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [generateForm, setGenerateForm] = useState({
        period: new Date().toISOString().slice(0, 7),
        department: "",
        location: "",
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeTab, setActiveTab] = useState<
        "overview" | "history" | "approvals"
    >("overview");
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectPeriodId, setRejectPeriodId] = useState<number | null>(null);

    const bg = isDark ? "#0f172a" : "#f8fafc";
    const cardBg = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#334155" : "#e2e8f0";
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatCompact = (amount: number) => {
        if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}K`;
        return `₦${amount.toFixed(0)}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-NG", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleGenerate = (data: {
        period: string;
        department: string;
        location: string;
    }) => {
        setIsGenerating(true);
        router.post("/payroll/generate", data, {
            onSuccess: () => {
                setShowGenerateModal(false);
                showToast(
                    "success",
                    "Payroll Generated",
                    "Payroll period created successfully",
                );
                setIsGenerating(false);
            },
            onError: (errors: any) => {
                showToast(
                    "error",
                    "Generation Failed",
                    errors.period || "Failed to generate payroll",
                );
                setIsGenerating(false);
            },
        });
    };

    const handleApprove = (periodId: number) => {
        router.post(
            `/payroll/${periodId}/approve`,
            {},
            {
                onSuccess: () =>
                    showToast(
                        "success",
                        "Approved",
                        "Payroll approved successfully",
                    ),
                onError: (errors: any) =>
                    showToast(
                        "error",
                        "Approval Failed",
                        errors.message || "Failed to approve payroll",
                    ),
            },
        );
    };

    const handleReject = (reason: string) => {
        if (!rejectPeriodId) return;

        router.post(
            `/payroll/${rejectPeriodId}/reject`,
            { reason },
            {
                onSuccess: () => {
                    setShowRejectModal(false);
                    setRejectPeriodId(null);
                    showToast(
                        "success",
                        "Rejected",
                        "Payroll rejected successfully",
                    );
                },
            },
        );
    };
    const handleSubmitForApproval = (periodId: number) => {
        router.post(
            `/payroll/${periodId}/submit`,
            {},
            {
                onSuccess: () =>
                    showToast(
                        "success",
                        "Submitted",
                        "Payroll submitted for approval",
                    ),
            },
        );
    };

    const handleMarkAsPaid = (periodId: number) => {
        router.post(
            `/payroll/${periodId}/mark-paid`,
            {},
            {
                onSuccess: () =>
                    showToast(
                        "success",
                        "Marked as Paid",
                        "Payroll marked as paid successfully",
                    ),
            },
        );
    };

    // Prepare stats data for PayrollStats component
    const statsData = [
        {
            label: "Total Employees",
            value: props.summary.total_employees,
            icon: "ri-team-line",
            color: "#10b981",
        },
        {
            label: "Monthly Payroll",
            value: formatCompact(props.summary.monthly_payroll),
            icon: "ri-money-dollar-circle-line",
            color: "#06b6d4",
            trend: props.summary.last_period
                ? ((props.summary.monthly_payroll -
                      (props.summary.last_period?.total_net_pay || 0)) /
                      (props.summary.last_period?.total_net_pay || 1)) *
                  100
                : null,
        },
        {
            label: "Average Salary",
            value: formatCompact(props.summary.average_salary),
            icon: "ri-bar-chart-2-line",
            color: "#8b5cf6",
        },
        {
            label: "Pending Approvals",
            value: props.summary.pending_approvals,
            icon: "ri-time-line",
            color: "#f59e0b",
        },
        {
            label: "YTD Payroll",
            value: formatCompact(props.summary.ytd_payroll),
            icon: "ri-calendar-line",
            color: "#ef4444",
        },
    ];

    return (
        <AppLayout title="Payroll Management">
            <div className="min-h-screen" style={{ background: bg }}>
                {/* Header */}
                <div
                    className="sticky top-0 z-10 px-4 sm:px-6 py-4"
                    style={{
                        background: bg,
                        borderBottom: `1px solid ${border}`,
                    }}
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1
                                className="text-xl sm:text-2xl font-bold"
                                style={{ color: textPrimary }}
                            >
                                Payroll Management
                            </h1>
                            <p
                                className="text-sm mt-0.5"
                                style={{ color: textSecondary }}
                            >
                                Generate, approve, and manage employee payroll
                            </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() =>
                                    router.visit("/settings/payroll")
                                }
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105"
                                style={{
                                    background: isDark ? "#334155" : "#f1f5f9",
                                    color: textSecondary,
                                }}
                            >
                                <i className="ri-settings-4-line"></i>
                                <span className="hidden sm:inline">
                                    Settings
                                </span>
                            </button>
                            <button
                                onClick={() => setShowGenerateModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 shadow-lg"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #16a34a, #15803d)",
                                }}
                            >
                                <i className="ri-add-line"></i>
                                <span>Generate Payroll</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-6 py-6">
                    {/* KPI Cards - Using PayrollStats Component */}
                    <div className="mb-8">
                        <PayrollStats
                            stats={statsData}
                            variant="detailed"
                            columns={5}
                        />
                    </div>

                    {/* Tabs */}
                    <div
                        className="flex gap-1 mb-6 border-b"
                        style={{ borderColor: border }}
                    >
                        {[
                            {
                                key: "overview",
                                label: "Overview",
                                icon: "ri-dashboard-line",
                            },
                            {
                                key: "history",
                                label: "Payroll History",
                                icon: "ri-history-line",
                            },
                            {
                                key: "approvals",
                                label: "Pending Approvals",
                                icon: "ri-check-double-line",
                                badge: props.pendingApprovals.length,
                            },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className="flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap transition-all relative"
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
                                <span className="sm:hidden">
                                    {tab.label.split(" ")[0]}
                                </span>
                                {tab.badge ? (
                                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                                        {tab.badge}
                                    </span>
                                ) : null}
                            </button>
                        ))}
                    </div>

                    {/* Overview Tab Content */}
                    {activeTab === "overview" && (
                        <div className="space-y-6">
                            {/* Current Period */}
                            {props.currentPeriod ? (
                                <div
                                    className="rounded-2xl overflow-hidden"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                        boxShadow: isDark
                                            ? "0 4px 6px -1px rgba(0,0,0,0.3)"
                                            : "0 4px 6px -1px rgba(0,0,0,0.1)",
                                    }}
                                >
                                    <div
                                        className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                        style={{
                                            borderBottom: `1px solid ${border}`,
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                                                <i className="ri-calendar-check-line text-xl text-green-600"></i>
                                            </div>
                                            <div>
                                                <h3
                                                    className="text-base font-semibold"
                                                    style={{
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {props.currentPeriod.name}
                                                </h3>
                                                <p
                                                    className="text-xs mt-0.5"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {formatDate(
                                                        props.currentPeriod
                                                            .start_date,
                                                    )}{" "}
                                                    →{" "}
                                                    {formatDate(
                                                        props.currentPeriod
                                                            .end_date,
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <StatusBadge
                                                status={
                                                    props.currentPeriod.status
                                                }
                                                size="md"
                                            />

                                            {props.currentPeriod.status ===
                                                "draft" && (
                                                <button
                                                    onClick={() =>
                                                        handleSubmitForApproval(
                                                            props.currentPeriod!
                                                                .id,
                                                        )
                                                    }
                                                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                                                    style={{
                                                        background:
                                                            "linear-gradient(135deg, #16a34a, #15803d)",
                                                    }}
                                                >
                                                    <i className="ri-send-plane-line mr-1.5"></i>
                                                    Submit for Approval
                                                </button>
                                            )}

                                            {props.canApproveCurrentPeriod &&
                                                props.currentPeriod.status ===
                                                    "processing" && (
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleApprove(
                                                                    props
                                                                        .currentPeriod!
                                                                        .id,
                                                                )
                                                            }
                                                            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                                                            style={{
                                                                background:
                                                                    "linear-gradient(135deg, #16a34a, #15803d)",
                                                            }}
                                                        >
                                                            <i className="ri-check-line mr-1.5"></i>
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setRejectPeriodId(
                                                                    props
                                                                        .currentPeriod!
                                                                        .id,
                                                                );
                                                                setShowRejectModal(
                                                                    true,
                                                                );
                                                            }}
                                                            className="px-4 py-2 rounded-lg text-sm font-medium"
                                                            style={{
                                                                background:
                                                                    isDark
                                                                        ? "#7f1d1d"
                                                                        : "#fee2e2",
                                                                color: "#dc2626",
                                                            }}
                                                        >
                                                            <i className="ri-close-line mr-1.5"></i>
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}

                                            {props.currentPeriod.status ===
                                                "approved" && (
                                                <button
                                                    onClick={() =>
                                                        handleMarkAsPaid(
                                                            props.currentPeriod!
                                                                .id,
                                                        )
                                                    }
                                                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                                                    style={{
                                                        background:
                                                            "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                                    }}
                                                >
                                                    <i className="ri-bank-card-line mr-1.5"></i>
                                                    Mark as Paid
                                                </button>
                                            )}

                                            <button
                                                onClick={() =>
                                                    router.visit(
                                                        `/payroll/${props.currentPeriod!.id}`,
                                                    )
                                                }
                                                className="px-4 py-2 rounded-lg text-sm font-medium"
                                                style={{
                                                    background: isDark
                                                        ? "#334155"
                                                        : "#f1f5f9",
                                                    color: textSecondary,
                                                }}
                                            >
                                                <i className="ri-eye-line mr-1.5"></i>
                                                View Details
                                            </button>
                                        </div>
                                    </div>

                                    {/* Approval Progress - Using ApprovalProgressBar Component */}
                                    {props.currentPeriod.approval_progress && (
                                        <div
                                            className="px-5 py-4"
                                            style={{
                                                borderBottom: `1px solid ${border}`,
                                            }}
                                        >
                                            <ApprovalProgressBar
                                                percentage={
                                                    props.currentPeriod
                                                        .approval_progress
                                                        .percentage
                                                }
                                                approved={
                                                    props.currentPeriod
                                                        .approval_progress
                                                        .approved
                                                }
                                                total={
                                                    props.currentPeriod
                                                        .approval_progress.total
                                                }
                                                levels={
                                                    props.currentPeriod
                                                        .approval_progress
                                                        .levels
                                                }
                                                isFullyApproved={
                                                    props.currentPeriod
                                                        .approval_progress
                                                        .is_fully_approved
                                                }
                                                showDetails={true}
                                            />
                                        </div>
                                    )}

                                    {/* Summary Stats */}
                                    <div
                                        className="px-5 py-4 grid grid-cols-2 sm:grid-cols-5 gap-4"
                                        style={{
                                            background: isDark
                                                ? "rgba(15,23,42,0.5)"
                                                : "#f8fafc",
                                        }}
                                    >
                                        <div>
                                            <p
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                Employees
                                            </p>
                                            <p
                                                className="text-xl font-bold"
                                                style={{ color: textPrimary }}
                                            >
                                                {
                                                    props.currentPeriod
                                                        .total_employees
                                                }
                                            </p>
                                        </div>
                                        <div>
                                            <p
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                Basic Salary
                                            </p>
                                            <p
                                                className="text-xl font-bold"
                                                style={{ color: textPrimary }}
                                            >
                                                {formatCompact(
                                                    props.currentPeriod
                                                        .total_basic_salary,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                Net Pay
                                            </p>
                                            <p
                                                className="text-xl font-bold"
                                                style={{ color: "#16a34a" }}
                                            >
                                                {formatCompact(
                                                    props.currentPeriod
                                                        .total_net_pay,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                Payment Date
                                            </p>
                                            <p
                                                className="text-xl font-bold"
                                                style={{ color: textPrimary }}
                                            >
                                                {props.currentPeriod
                                                    .payment_date
                                                    ? formatDate(
                                                          props.currentPeriod
                                                              .payment_date,
                                                      )
                                                    : "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                Avg per Employee
                                            </p>
                                            <p
                                                className="text-xl font-bold"
                                                style={{ color: "#06b6d4" }}
                                            >
                                                {props.currentPeriod
                                                    .total_employees > 0
                                                    ? formatCompact(
                                                          props.currentPeriod
                                                              .total_net_pay /
                                                              props
                                                                  .currentPeriod
                                                                  .total_employees,
                                                      )
                                                    : "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="rounded-2xl p-12 text-center"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    <div
                                        className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                                        style={{
                                            background: isDark
                                                ? "#334155"
                                                : "#f1f5f9",
                                        }}
                                    >
                                        <i
                                            className="ri-calendar-line text-3xl"
                                            style={{ color: textSecondary }}
                                        ></i>
                                    </div>
                                    <h3
                                        className="text-lg font-semibold mb-2"
                                        style={{ color: textPrimary }}
                                    >
                                        No Current Payroll Period
                                    </h3>
                                    <p
                                        className="text-sm mb-6"
                                        style={{ color: textSecondary }}
                                    >
                                        Generate a new payroll period to get
                                        started
                                    </p>
                                    <button
                                        onClick={() =>
                                            setShowGenerateModal(true)
                                        }
                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white"
                                        style={{
                                            background:
                                                "linear-gradient(135deg, #16a34a, #15803d)",
                                        }}
                                    >
                                        <i className="ri-add-line"></i>
                                        Generate Payroll
                                    </button>
                                </div>
                            )}

                            {/* Payroll Trend Chart - Using PayrollTrendChart Component */}
                            {props.trend.length > 0 && (
                                <PayrollTrendChart
                                    data={props.trend}
                                    height={280}
                                    showLabels={true}
                                />
                            )}

                            {/* Department Summary - Using DepartmentSummaryTable Component */}
                            {props.deptSummary.length > 0 && (
                                <DepartmentSummaryTable
                                    data={props.deptSummary}
                                    periodName={props.currentPeriod?.name}
                                    maxRows={5}
                                />
                            )}
                        </div>
                    )}

                    {/* History Tab */}
                    {activeTab === "history" && (
                        <div
                            className="rounded-2xl overflow-hidden"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr
                                            style={{
                                                borderBottom: `1px solid ${border}`,
                                                background: isDark
                                                    ? "#0f172a"
                                                    : "#f8fafc",
                                            }}
                                        >
                                            {[
                                                "Period",
                                                "Status",
                                                "Employees",
                                                "Basic Salary",
                                                "Net Pay",
                                                "Progress",
                                                "Actions",
                                            ].map((h) => (
                                                <th
                                                    key={h}
                                                    className="px-5 py-3 text-left text-xs font-semibold"
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
                                        {props.periods.map((period) => (
                                            <tr
                                                key={period.id}
                                                className="hover:bg-opacity-50 transition-colors"
                                                style={{
                                                    borderBottom: `1px solid ${border}`,
                                                }}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.background =
                                                        isDark
                                                            ? "#1e293b"
                                                            : "#f8fafc")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.background =
                                                        "transparent")
                                                }
                                            >
                                                <td className="px-5 py-4">
                                                    <p
                                                        className="text-sm font-medium"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {period.name}
                                                    </p>
                                                    <p
                                                        className="text-xs mt-0.5"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {formatDate(
                                                            period.start_date,
                                                        )}{" "}
                                                        →{" "}
                                                        {formatDate(
                                                            period.end_date,
                                                        )}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <StatusBadge
                                                        status={period.status}
                                                        size="sm"
                                                    />
                                                </td>
                                                <td
                                                    className="px-5 py-4 text-sm"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {period.total_employees}
                                                </td>
                                                <td
                                                    className="px-5 py-4 text-sm"
                                                    style={{
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {formatCompact(
                                                        period.total_basic_salary,
                                                    )}
                                                </td>
                                                <td
                                                    className="px-5 py-4 text-sm font-semibold"
                                                    style={{ color: "#16a34a" }}
                                                >
                                                    {formatCompact(
                                                        period.total_net_pay,
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    {period.approval_progress && (
                                                        <ApprovalProgressBar
                                                            percentage={
                                                                period
                                                                    .approval_progress
                                                                    .percentage
                                                            }
                                                            approved={
                                                                period
                                                                    .approval_progress
                                                                    .approved
                                                            }
                                                            total={
                                                                period
                                                                    .approval_progress
                                                                    .total
                                                            }
                                                            levels={[]}
                                                            isFullyApproved={
                                                                period
                                                                    .approval_progress
                                                                    .is_fully_approved
                                                            }
                                                            compact={true}
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <button
                                                        onClick={() =>
                                                            router.visit(
                                                                `/payroll/${period.id}`,
                                                            )
                                                        }
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                                                        style={{
                                                            background: isDark
                                                                ? "#334155"
                                                                : "#f1f5f9",
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        <i className="ri-eye-line mr-1"></i>
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Approvals Tab */}
                    {activeTab === "approvals" && (
                        <div
                            className="rounded-2xl overflow-hidden"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            {props.pendingApprovals.length === 0 ? (
                                <div className="py-16 text-center">
                                    <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                                        <i className="ri-check-double-line text-3xl text-green-600"></i>
                                    </div>
                                    <h3
                                        className="text-lg font-semibold mb-2"
                                        style={{ color: textPrimary }}
                                    >
                                        No Pending Approvals
                                    </h3>
                                    <p
                                        className="text-sm"
                                        style={{ color: textSecondary }}
                                    >
                                        You're all caught up! No payrolls need
                                        your approval.
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr
                                                style={{
                                                    borderBottom: `1px solid ${border}`,
                                                    background: isDark
                                                        ? "#0f172a"
                                                        : "#f8fafc",
                                                }}
                                            >
                                                {[
                                                    "Period",
                                                    "Approval Level",
                                                    "Employees",
                                                    "Net Pay",
                                                    "Submitted",
                                                    "Action",
                                                ].map((h) => (
                                                    <th
                                                        key={h}
                                                        className="px-5 py-3 text-left text-xs font-semibold"
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
                                            {props.pendingApprovals.map(
                                                (item, idx) => (
                                                    <tr
                                                        key={idx}
                                                        className="hover:bg-opacity-50 transition-colors"
                                                        style={{
                                                            borderBottom: `1px solid ${border}`,
                                                        }}
                                                        onMouseEnter={(e) =>
                                                            (e.currentTarget.style.background =
                                                                isDark
                                                                    ? "#1e293b"
                                                                    : "#f8fafc")
                                                        }
                                                        onMouseLeave={(e) =>
                                                            (e.currentTarget.style.background =
                                                                "transparent")
                                                        }
                                                    >
                                                        <td className="px-5 py-4">
                                                            <p
                                                                className="text-sm font-medium"
                                                                style={{
                                                                    color: textPrimary,
                                                                }}
                                                            >
                                                                {
                                                                    item.period
                                                                        .name
                                                                }
                                                            </p>
                                                            <p
                                                                className="text-xs mt-0.5"
                                                                style={{
                                                                    color: textSecondary,
                                                                }}
                                                            >
                                                                {formatDate(
                                                                    item.period
                                                                        .start_date,
                                                                )}{" "}
                                                                →{" "}
                                                                {formatDate(
                                                                    item.period
                                                                        .end_date,
                                                                )}
                                                            </p>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                                                                <i className="ri-shield-user-line"></i>
                                                                {item.level}
                                                            </span>
                                                        </td>
                                                        <td
                                                            className="px-5 py-4 text-sm"
                                                            style={{
                                                                color: textSecondary,
                                                            }}
                                                        >
                                                            {
                                                                item.period
                                                                    .total_employees
                                                            }
                                                        </td>
                                                        <td
                                                            className="px-5 py-4 text-sm font-semibold"
                                                            style={{
                                                                color: "#16a34a",
                                                            }}
                                                        >
                                                            {formatCompact(
                                                                item.period
                                                                    .total_net_pay,
                                                            )}
                                                        </td>
                                                        <td
                                                            className="px-5 py-4 text-xs"
                                                            style={{
                                                                color: textSecondary,
                                                            }}
                                                        >
                                                            {item.period
                                                                .created_at
                                                                ? formatDate(
                                                                      item
                                                                          .period
                                                                          .created_at,
                                                                  )
                                                                : "—"}
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <button
                                                                onClick={() =>
                                                                    router.visit(
                                                                        `/payroll/${item.period.id}`,
                                                                    )
                                                                }
                                                                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                                                                style={{
                                                                    background:
                                                                        "linear-gradient(135deg, #16a34a, #15803d)",
                                                                }}
                                                            >
                                                                <i className="ri-check-line mr-1.5"></i>
                                                                Review
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ),
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modals */}
                <GeneratePayrollModal
                    isOpen={showGenerateModal}
                    onClose={() => setShowGenerateModal(false)}
                    onGenerate={handleGenerate}
                    isGenerating={isGenerating}
                    departments={props.departments}
                    locations={props.locations}
                />

                <RejectPayrollModal
                    isOpen={showRejectModal}
                    onClose={() => {
                        setShowRejectModal(false);
                        setRejectPeriodId(null);
                    }}
                    onReject={handleReject}
                    periodName={props.currentPeriod?.name}
                />
            </div>
        </AppLayout>
    );
}
