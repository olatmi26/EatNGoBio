import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface DeptSummary {
    department: string;
    employee_count: number;
    total_basic: number;
    total_net_pay: number;
}

interface DepartmentSummaryTableProps {
    data: DeptSummary[];
    periodName?: string;
    maxRows?: number;
}

export default function DepartmentSummaryTable({
    data,
    periodName,
    maxRows = 5,
}: DepartmentSummaryTableProps) {
    const { isDark } = useTheme();
    const border = isDark ? "#334155" : "#e2e8f0";
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";
    const cardBg = isDark ? "#1e293b" : "#ffffff";

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const displayData = data.slice(0, maxRows);
    const hasMore = data.length > maxRows;

    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{ background: cardBg, border: `1px solid ${border}` }}
        >
            <div className="px-5 py-4 border-b" style={{ borderColor: border }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3
                            className="text-base font-semibold"
                            style={{ color: textPrimary }}
                        >
                            Department Summary
                        </h3>
                        {periodName && (
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: textSecondary }}
                            >
                                {periodName}
                            </p>
                        )}
                    </div>
                    {hasMore && (
                        <span
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                                background: isDark ? "#334155" : "#f1f5f9",
                                color: textSecondary,
                            }}
                        >
                            Top {maxRows} of {data.length}
                        </span>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr
                            style={{
                                borderBottom: `1px solid ${border}`,
                                background: isDark ? "#0f172a" : "#f8fafc",
                            }}
                        >
                            {[
                                "Department",
                                "Employees",
                                "Total Basic",
                                "Total Net Pay",
                                "Avg Salary",
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-5 py-3 text-left text-xs font-semibold"
                                    style={{ color: textSecondary }}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {displayData.map((dept, idx) => {
                            const avgSalary =
                                dept.employee_count > 0
                                    ? dept.total_net_pay / dept.employee_count
                                    : 0;
                            const maxNet = Math.max(
                                ...data.map((d) => d.total_net_pay),
                                1,
                            );
                            const barWidth =
                                (dept.total_net_pay / maxNet) * 100;

                            return (
                                <tr
                                    key={idx}
                                    className="group hover:bg-opacity-50 transition-colors"
                                    style={{
                                        borderBottom: `1px solid ${border}`,
                                    }}
                                    onMouseEnter={(e) =>
                                        (e.currentTarget.style.background =
                                            isDark ? "#1e293b" : "#f8fafc")
                                    }
                                    onMouseLeave={(e) =>
                                        (e.currentTarget.style.background =
                                            "transparent")
                                    }
                                >
                                    <td className="px-5 py-3">
                                        <p
                                            className="text-sm font-medium"
                                            style={{ color: textPrimary }}
                                        >
                                            {dept.department}
                                        </p>
                                        <div
                                            className="mt-1.5 h-1 w-full rounded-full overflow-hidden"
                                            style={{
                                                background: isDark
                                                    ? "#334155"
                                                    : "#e2e8f0",
                                            }}
                                        >
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${barWidth}%`,
                                                    background:
                                                        "linear-gradient(90deg, #3b82f6, #60a5fa)",
                                                }}
                                            ></div>
                                        </div>
                                    </td>
                                    <td
                                        className="px-5 py-3 text-sm"
                                        style={{ color: textSecondary }}
                                    >
                                        {dept.employee_count}
                                    </td>
                                    <td
                                        className="px-5 py-3 text-sm"
                                        style={{ color: textPrimary }}
                                    >
                                        {formatCurrency(dept.total_basic)}
                                    </td>
                                    <td
                                        className="px-5 py-3 text-sm font-semibold"
                                        style={{ color: "#16a34a" }}
                                    >
                                        {formatCurrency(dept.total_net_pay)}
                                    </td>
                                    <td
                                        className="px-5 py-3 text-sm font-medium"
                                        style={{ color: "#06b6d4" }}
                                    >
                                        {formatCurrency(avgSalary)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {data.length === 0 && (
                <div className="py-12 text-center">
                    <i
                        className="ri-building-2-line text-3xl mb-3 block opacity-50"
                        style={{ color: textSecondary }}
                    ></i>
                    <p className="text-sm" style={{ color: textSecondary }}>
                        No department data available
                    </p>
                </div>
            )}
        </div>
    );
}
