import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import StatusBadge from "./StatusBadge";

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

interface PayrollTableProps {
    data: PayrollRecord[];
    showActions?: boolean;
    onViewPayslip?: (record: PayrollRecord) => void;
    compact?: boolean;
}

export default function PayrollTable({
    data,
    showActions = true,
    onViewPayslip,
    compact = false,
}: PayrollTableProps) {
    const { isDark } = useTheme();
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

    const formatCompact = (amount: number) => {
        if (amount >= 1000000) {
            return `₦${(amount / 1000000).toFixed(1)}M`;
        }
        if (amount >= 1000) {
            return `₦${(amount / 1000).toFixed(0)}K`;
        }
        return `₦${amount.toFixed(0)}`;
    };

    if (compact) {
        return (
            <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                    <thead>
                        <tr
                            style={{
                                borderBottom: `1px solid ${border}`,
                                background: isDark ? "#0f172a" : "#f8fafc",
                            }}
                        >
                            {["Employee", "Basic", "Net Pay", "Status"].map(
                                (h) => (
                                    <th
                                        key={h}
                                        className="px-3 py-2.5 text-left text-xs font-semibold"
                                        style={{ color: textSecondary }}
                                    >
                                        {h}
                                    </th>
                                ),
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((record) => (
                            <tr
                                key={record.id}
                                className="hover:bg-opacity-50"
                                style={{ borderBottom: `1px solid ${border}` }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.background = isDark
                                        ? "#1e293b"
                                        : "#f8fafc")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.background =
                                        "transparent")
                                }
                            >
                                <td className="px-3 py-2.5">
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: textPrimary }}
                                    >
                                        {record.employee.full_name}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: textSecondary }}
                                    >
                                        {record.employee_id}
                                    </p>
                                </td>
                                <td
                                    className="px-3 py-2.5 text-sm"
                                    style={{ color: textPrimary }}
                                >
                                    {formatCompact(record.basic_salary)}
                                </td>
                                <td
                                    className="px-3 py-2.5 text-sm font-semibold"
                                    style={{ color: "#16a34a" }}
                                >
                                    {formatCompact(record.net_pay)}
                                </td>
                                <td className="px-3 py-2.5">
                                    <StatusBadge
                                        status={record.status as any}
                                        size="sm"
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px]">
                <thead>
                    <tr
                        style={{
                            borderBottom: `1px solid ${border}`,
                            background: isDark ? "#0f172a" : "#f8fafc",
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
                            showActions ? "Actions" : null,
                        ]
                            .filter(Boolean)
                            .map((h) => (
                                <th
                                    key={h as string}
                                    className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap"
                                    style={{ color: textSecondary }}
                                >
                                    {h as string}
                                </th>
                            ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((record) => (
                        <tr
                            key={record.id}
                            className="group hover:bg-opacity-50 transition-colors"
                            style={{ borderBottom: `1px solid ${border}` }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.background = isDark
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
                                    style={{ color: textPrimary }}
                                >
                                    {record.employee.full_name}
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: textSecondary }}
                                >
                                    {record.employee_id} •{" "}
                                    {record.employee.department}
                                </p>
                            </td>
                            <td
                                className="px-3 py-3 text-sm font-mono"
                                style={{ color: textPrimary }}
                            >
                                {formatCurrency(record.basic_salary)}
                            </td>
                            <td
                                className="px-3 py-3 text-sm text-center"
                                style={{ color: "#16a34a" }}
                            >
                                {record.days_worked}
                            </td>
                            <td
                                className="px-3 py-3 text-sm text-center"
                                style={{
                                    color:
                                        record.days_absent > 0
                                            ? "#dc2626"
                                            : textSecondary,
                                }}
                            >
                                {record.days_absent || "—"}
                            </td>
                            <td
                                className="px-3 py-3 text-sm text-center"
                                style={{
                                    color:
                                        record.late_minutes > 0
                                            ? "#f59e0b"
                                            : textSecondary,
                                }}
                            >
                                {record.late_minutes || "—"}
                            </td>
                            <td
                                className="px-3 py-3 text-sm text-center"
                                style={{
                                    color:
                                        record.overtime_hours > 0
                                            ? "#8b5cf6"
                                            : textSecondary,
                                }}
                            >
                                {record.overtime_hours || "—"}
                            </td>
                            <td
                                className="px-3 py-3 text-sm"
                                style={{ color: "#8b5cf6" }}
                            >
                                {record.overtime_pay > 0
                                    ? formatCurrency(record.overtime_pay)
                                    : "—"}
                            </td>
                            <td
                                className="px-3 py-3 text-sm"
                                style={{ color: "#ef4444" }}
                            >
                                {record.late_deduction > 0
                                    ? formatCurrency(record.late_deduction)
                                    : "—"}
                            </td>
                            <td
                                className="px-3 py-3 text-sm"
                                style={{ color: "#ef4444" }}
                            >
                                {record.absent_deduction > 0
                                    ? formatCurrency(record.absent_deduction)
                                    : "—"}
                            </td>
                            <td
                                className="px-3 py-3 text-sm"
                                style={{ color: "#ef4444" }}
                            >
                                {formatCurrency(record.tax_deduction)}
                            </td>
                            <td
                                className="px-3 py-3 text-sm"
                                style={{ color: "#ef4444" }}
                            >
                                {formatCurrency(record.pension_deduction)}
                            </td>
                            <td
                                className="px-3 py-3 text-sm"
                                style={{ color: "#ef4444" }}
                            >
                                {formatCurrency(record.nhf_deduction)}
                            </td>
                            <td
                                className="px-3 py-3 text-sm font-bold"
                                style={{ color: "#16a34a" }}
                            >
                                {formatCurrency(record.net_pay)}
                            </td>
                            {showActions && (
                                <td className="px-3 py-3">
                                    <button
                                        onClick={() => onViewPayslip?.(record)}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg text-xs font-medium"
                                        style={{
                                            background: isDark
                                                ? "#334155"
                                                : "#f1f5f9",
                                            color: textSecondary,
                                        }}
                                    >
                                        <i className="ri-file-list-3-line mr-1"></i>
                                        Payslip
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
