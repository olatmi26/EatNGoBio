// js/Pages/Payroll/Show.tsx
import { useState } from "react";
import { usePage, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import type { PageProps } from "@/types";

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
    processed_by: number | null;
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

interface PayrollRecord {
    id: number;
    employee_id: string;
    employee: {
        full_name: string;
        department: string;
        position: string;
    };
    basic_salary: number;
    days_worked: number;
    days_absent: number;
    late_minutes: number;
    overtime_hours: number;
    overtime_pay: number;
    late_deduction: number;
    absent_deduction: number;
    tax_deduction: number;
    pension_deduction: number;
    nhf_deduction: number;
    gross_pay: number;
    net_pay: number;
    status: string;
}

interface Props extends PageProps {
    period: PayrollPeriod;
    payrolls: {
        data: PayrollRecord[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        total_employees: number;
        total_basic: number;
        total_overtime: number;
        total_late_deduction: number;
        total_absent_deduction: number;
        total_tax: number;
        total_pension: number;
        total_nhf: number;
        total_net: number;
        total_gross: number;
    };
    canApprove: boolean;
    pendingApprovalLevel: string | null;
    userApprovalLevel: string | null;
    unreadCount: number;
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

export default function PayrollShow() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const { props } = usePage<Props>();

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    const bg = isDark ? "#0f172a" : "#f8fafc";
    const cardBg = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#334155" : "#e2e8f0";
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-NG", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const handleApprove = () => {
        router.post(
            `/payroll/${props.period.id}/approve`,
            {},
            {
                onSuccess: () =>
                    showToast(
                        "success",
                        "Approved",
                        "Payroll approved successfully",
                    ),
            },
        );
    };

    const handleReject = () => {
        if (!rejectReason.trim()) {
            showToast(
                "error",
                "Reason Required",
                "Please provide a reason for rejection",
            );
            return;
        }
        router.post(
            `/payroll/${props.period.id}/reject`,
            { reason: rejectReason },
            {
                onSuccess: () => {
                    setShowRejectModal(false);
                    setRejectReason("");
                    showToast(
                        "success",
                        "Rejected",
                        "Payroll rejected successfully",
                    );
                },
            },
        );
    };

    const handleSubmit = () => {
        router.post(
            `/payroll/${props.period.id}/submit`,
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

    const handleMarkPaid = () => {
        router.post(
            `/payroll/${props.period.id}/mark-paid`,
            {},
            {
                onSuccess: () =>
                    showToast(
                        "success",
                        "Marked as Paid",
                        "Payroll marked as paid",
                    ),
            },
        );
    };

    const handleExport = () => {
        window.open(`/payroll/${props.period.id}/export`, "_blank");
    };

    const filteredPayrolls = props.payrolls.data.filter(
        (p) =>
            p.employee.full_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            p.employee_id.includes(searchTerm) ||
            p.employee.department
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    return (
        <AppLayout title={`Payroll - ${props.period.name}`}>
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
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.visit("/payroll")}
                                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                                style={{
                                    background: isDark ? "#334155" : "#f1f5f9",
                                    color: textSecondary,
                                }}
                            >
                                <i className="ri-arrow-left-line"></i>
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1
                                        className="text-xl sm:text-2xl font-bold"
                                        style={{ color: textPrimary }}
                                    >
                                        {props.period.name}
                                    </h1>
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-medium"
                                        style={{
                                            background:
                                                STATUS_CONFIG[
                                                    props.period.status
                                                ]?.bg,
                                            color: STATUS_CONFIG[
                                                props.period.status
                                            ]?.color,
                                        }}
                                    >
                                        {
                                            STATUS_CONFIG[props.period.status]
                                                ?.label
                                        }
                                    </span>
                                </div>
                                <p
                                    className="text-sm mt-0.5"
                                    style={{ color: textSecondary }}
                                >
                                    {formatDate(props.period.start_date)} →{" "}
                                    {formatDate(props.period.end_date)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExport}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2"
                                style={{
                                    background: isDark ? "#334155" : "#f1f5f9",
                                    color: textSecondary,
                                }}
                            >
                                <i className="ri-download-line"></i>
                                Export Excel
                            </button>

                            {props.period.status === "draft" && (
                                <button
                                    onClick={handleSubmit}
                                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #16a34a, #15803d)",
                                    }}
                                >
                                    <i className="ri-send-plane-line mr-1.5"></i>
                                    Submit for Approval
                                </button>
                            )}

                            {props.canApprove &&
                                props.period.status === "processing" && (
                                    <>
                                        <button
                                            onClick={handleApprove}
                                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                                            style={{
                                                background:
                                                    "linear-gradient(135deg, #16a34a, #15803d)",
                                            }}
                                        >
                                            <i className="ri-check-line mr-1.5"></i>
                                            Approve
                                        </button>
                                        <button
                                            onClick={() =>
                                                setShowRejectModal(true)
                                            }
                                            className="px-4 py-2.5 rounded-xl text-sm font-medium"
                                            style={{
                                                background: isDark
                                                    ? "#7f1d1d"
                                                    : "#fee2e2",
                                                color: "#dc2626",
                                            }}
                                        >
                                            <i className="ri-close-line mr-1.5"></i>
                                            Reject
                                        </button>
                                    </>
                                )}

                            {props.period.status === "approved" && (
                                <button
                                    onClick={handleMarkPaid}
                                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #2563eb, #1d4ed8)",
                                    }}
                                >
                                    <i className="ri-bank-card-line mr-1.5"></i>
                                    Mark as Paid
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-6 py-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                        {[
                            {
                                label: "Total Employees",
                                value: props.stats.total_employees,
                                color: "#10b981",
                            },
                            {
                                label: "Total Basic",
                                value: formatCurrency(props.stats.total_basic),
                                color: "#3b82f6",
                            },
                            {
                                label: "Total Overtime",
                                value: formatCurrency(
                                    props.stats.total_overtime,
                                ),
                                color: "#8b5cf6",
                            },
                            {
                                label: "Total Deductions",
                                value: formatCurrency(
                                    props.stats.total_tax +
                                        props.stats.total_pension +
                                        props.stats.total_nhf +
                                        props.stats.total_late_deduction +
                                        props.stats.total_absent_deduction,
                                ),
                                color: "#ef4444",
                            },
                            {
                                label: "Total Net Pay",
                                value: formatCurrency(props.stats.total_net),
                                color: "#16a34a",
                            },
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className="p-4 rounded-xl"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${border}`,
                                }}
                            >
                                <p
                                    className="text-xs"
                                    style={{ color: textSecondary }}
                                >
                                    {stat.label}
                                </p>
                                <p
                                    className="text-xl font-bold mt-1"
                                    style={{ color: stat.color }}
                                >
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Approval Progress */}
                    {props.period.approval_progress && (
                        <div
                            className="rounded-xl p-5 mb-6"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3
                                    className="text-sm font-semibold"
                                    style={{ color: textPrimary }}
                                >
                                    Approval Progress
                                </h3>
                                <span
                                    className="text-sm font-bold"
                                    style={{ color: "#16a34a" }}
                                >
                                    {props.period.approval_progress.percentage}%
                                </span>
                            </div>
                            <div
                                className="h-2 rounded-full mb-4 overflow-hidden"
                                style={{
                                    background: isDark ? "#334155" : "#e2e8f0",
                                }}
                            >
                                <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                        width: `${props.period.approval_progress.percentage}%`,
                                        background: "#16a34a",
                                    }}
                                ></div>
                            </div>
                            <div className="flex flex-wrap gap-6">
                                {props.period.approval_progress.levels.map(
                                    (level, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center gap-2"
                                        >
                                            <div
                                                className={`w-2.5 h-2.5 rounded-full ${
                                                    level.status === "approved"
                                                        ? "bg-green-500"
                                                        : level.status ===
                                                            "rejected"
                                                          ? "bg-red-500"
                                                          : "bg-gray-400"
                                                }`}
                                            ></div>
                                            <span
                                                className="text-xs font-medium"
                                                style={{ color: textPrimary }}
                                            >
                                                {level.level}
                                            </span>
                                            {level.approved_by && (
                                                <span
                                                    className="text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    • {level.approved_by}
                                                </span>
                                            )}
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    )}

                    {/* Search */}
                    <div className="mb-4">
                        <div className="relative max-w-md">
                            <i
                                className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: textSecondary }}
                            ></i>
                            <input
                                type="text"
                                placeholder="Search by name, ID, or department..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${border}`,
                                    color: textPrimary,
                                }}
                            />
                        </div>
                    </div>

                    {/* Payroll Table */}
                    <div
                        className="rounded-xl overflow-hidden"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                        }}
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1200px]">
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
                                            "Employee",
                                            "Basic",
                                            "Days",
                                            "Absent",
                                            "Late",
                                            "OT",
                                            "OT Pay",
                                            "Late Ded.",
                                            "Absent Ded.",
                                            "Tax",
                                            "Pension",
                                            "NHF",
                                            "Net Pay",
                                        ].map((h) => (
                                            <th
                                                key={h}
                                                className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap"
                                                style={{ color: textSecondary }}
                                            >
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayrolls.map((payroll) => (
                                        <tr
                                            key={payroll.id}
                                            className="hover:bg-opacity-50"
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
                                            <td className="px-3 py-3">
                                                <p
                                                    className="text-sm font-medium"
                                                    style={{
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {payroll.employee.full_name}
                                                </p>
                                                <p
                                                    className="text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {payroll.employee_id} •{" "}
                                                    {
                                                        payroll.employee
                                                            .department
                                                    }
                                                </p>
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm"
                                                style={{ color: textPrimary }}
                                            >
                                                {formatCurrency(
                                                    payroll.basic_salary,
                                                )}
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm text-center"
                                                style={{ color: "#16a34a" }}
                                            >
                                                {payroll.days_worked}
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm text-center"
                                                style={{
                                                    color:
                                                        payroll.days_absent > 0
                                                            ? "#dc2626"
                                                            : textSecondary,
                                                }}
                                            >
                                                {payroll.days_absent}
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm text-center"
                                                style={{
                                                    color:
                                                        payroll.late_minutes > 0
                                                            ? "#f59e0b"
                                                            : textSecondary,
                                                }}
                                            >
                                                {payroll.late_minutes}
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm text-center"
                                                style={{
                                                    color:
                                                        payroll.overtime_hours >
                                                        0
                                                            ? "#8b5cf6"
                                                            : textSecondary,
                                                }}
                                            >
                                                {payroll.overtime_hours}
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm"
                                                style={{ color: "#8b5cf6" }}
                                            >
                                                {payroll.overtime_pay > 0
                                                    ? formatCurrency(
                                                          payroll.overtime_pay,
                                                      )
                                                    : "—"}
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm"
                                                style={{ color: "#dc2626" }}
                                            >
                                                {payroll.late_deduction > 0
                                                    ? formatCurrency(
                                                          payroll.late_deduction,
                                                      )
                                                    : "—"}
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm"
                                                style={{ color: "#dc2626" }}
                                            >
                                                {payroll.absent_deduction > 0
                                                    ? formatCurrency(
                                                          payroll.absent_deduction,
                                                      )
                                                    : "—"}
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm"
                                                style={{ color: "#dc2626" }}
                                            >
                                                {formatCurrency(
                                                    payroll.tax_deduction,
                                                )}
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm"
                                                style={{ color: "#dc2626" }}
                                            >
                                                {formatCurrency(
                                                    payroll.pension_deduction,
                                                )}
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm"
                                                style={{ color: "#dc2626" }}
                                            >
                                                {formatCurrency(
                                                    payroll.nhf_deduction,
                                                )}
                                            </td>
                                            <td
                                                className="px-3 py-3 text-sm font-bold"
                                                style={{ color: "#16a34a" }}
                                            >
                                                {formatCurrency(
                                                    payroll.net_pay,
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {props.payrolls.last_page > 1 && (
                            <div
                                className="px-5 py-4 flex items-center justify-between border-t"
                                style={{ borderColor: border }}
                            >
                                <p
                                    className="text-xs"
                                    style={{ color: textSecondary }}
                                >
                                    Showing{" "}
                                    {(props.payrolls.current_page - 1) *
                                        props.payrolls.per_page +
                                        1}{" "}
                                    to{" "}
                                    {Math.min(
                                        props.payrolls.current_page *
                                            props.payrolls.per_page,
                                        props.payrolls.total,
                                    )}{" "}
                                    of {props.payrolls.total} records
                                </p>
                                <div className="flex items-center gap-1">
                                    {Array.from(
                                        { length: props.payrolls.last_page },
                                        (_, i) => i + 1,
                                    ).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() =>
                                                router.get(
                                                    `/payroll/${props.period.id}`,
                                                    { page },
                                                    { preserveState: true },
                                                )
                                            }
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                page ===
                                                props.payrolls.current_page
                                                    ? "text-white"
                                                    : ""
                                            }`}
                                            style={
                                                page ===
                                                props.payrolls.current_page
                                                    ? { background: "#16a34a" }
                                                    : {
                                                          background: isDark
                                                              ? "#334155"
                                                              : "#f1f5f9",
                                                          color: textSecondary,
                                                      }
                                            }
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Reject Modal */}
                {showRejectModal && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowRejectModal(false)}
                    >
                        <div
                            className="w-full max-w-md rounded-2xl p-6"
                            style={{ background: cardBg }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2
                                className="text-lg font-bold mb-4"
                                style={{ color: textPrimary }}
                            >
                                Reject Payroll
                            </h2>
                            <textarea
                                value={rejectReason}
                                onChange={(e) =>
                                    setRejectReason(e.target.value)
                                }
                                rows={4}
                                placeholder="Enter rejection reason..."
                                className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                                style={{
                                    background: isDark ? "#0f172a" : "#f8fafc",
                                    border: `1px solid ${border}`,
                                    color: textPrimary,
                                }}
                            />
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowRejectModal(false)}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium"
                                    style={{
                                        background: isDark
                                            ? "#334155"
                                            : "#f1f5f9",
                                        color: textSecondary,
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                                    style={{ background: "#dc2626" }}
                                >
                                    Confirm Reject
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
