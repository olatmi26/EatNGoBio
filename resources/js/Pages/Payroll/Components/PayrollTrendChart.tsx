import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface TrendData {
    month: string;
    total_payroll: number;
    employee_count: number;
    avg_salary: number;
}

interface PayrollTrendChartProps {
    data: TrendData[];
    height?: number;
    showLabels?: boolean;
}

export default function PayrollTrendChart({
    data,
    height = 280,
    showLabels = true,
}: PayrollTrendChartProps) {
    const { isDark } = useTheme();
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";
    const cardBg = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#334155" : "#e2e8f0";

    const formatCompact = (amount: number) => {
        if (amount >= 1000000) {
            return `₦${(amount / 1000000).toFixed(1)}M`;
        }
        if (amount >= 1000) {
            return `₦${(amount / 1000).toFixed(0)}K`;
        }
        return `₦${amount.toFixed(0)}`;
    };

    const maxPayroll = Math.max(...data.map((d) => d.total_payroll), 1);

    return (
        <div
            className="rounded-xl p-5"
            style={{ background: cardBg, border: `1px solid ${border}` }}
        >
            {showLabels && (
                <div className="flex items-center justify-between mb-4">
                    <h3
                        className="text-base font-semibold"
                        style={{ color: textPrimary }}
                    >
                        Payroll Trend
                    </h3>
                    <span
                        className="text-xs px-3 py-1 rounded-full"
                        style={{
                            background: isDark ? "#334155" : "#f1f5f9",
                            color: textSecondary,
                        }}
                    >
                        <i className="ri-bar-chart-2-line mr-1"></i>
                        Last 6 Months
                    </span>
                </div>
            )}

            <div
                className="flex items-end gap-2 sm:gap-3"
                style={{ height: `${height}px` }}
            >
                {data.map((item, idx) => {
                    const barHeight = (item.total_payroll / maxPayroll) * 100;
                    const isLast = idx === data.length - 1;
                    const barColor = isLast ? "#16a34a" : "#3b82f6";

                    return (
                        <div
                            key={idx}
                            className="flex-1 flex flex-col items-center gap-2 h-full group"
                        >
                            {/* Value Label */}
                            <div className="w-full flex flex-col items-center">
                                <span
                                    className="text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ color: textPrimary }}
                                >
                                    {formatCompact(item.total_payroll)}
                                </span>
                            </div>

                            {/* Bar */}
                            <div className="w-full relative flex-1 flex items-end">
                                <div
                                    className="w-full rounded-t-lg transition-all duration-700 ease-out cursor-pointer hover:opacity-80"
                                    style={{
                                        height: `${Math.max(barHeight, 4)}%`,
                                        minHeight: "4px",
                                        background: `linear-gradient(180deg, ${barColor}, ${barColor}dd)`,
                                        boxShadow: `0 -2px 8px ${barColor}40`,
                                    }}
                                ></div>

                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                    <div
                                        className="rounded-lg px-4 py-2.5 text-xs shadow-xl"
                                        style={{
                                            background: isDark
                                                ? "#0f172a"
                                                : "#1e293b",
                                            color: "#fff",
                                        }}
                                    >
                                        <p className="font-semibold text-sm mb-1">
                                            {item.month}
                                        </p>
                                        <div className="space-y-0.5">
                                            <p className="flex justify-between gap-4">
                                                <span className="opacity-70">
                                                    Payroll:
                                                </span>
                                                <span className="font-medium">
                                                    {formatCompact(
                                                        item.total_payroll,
                                                    )}
                                                </span>
                                            </p>
                                            <p className="flex justify-between gap-4">
                                                <span className="opacity-70">
                                                    Employees:
                                                </span>
                                                <span>
                                                    {item.employee_count}
                                                </span>
                                            </p>
                                            <p className="flex justify-between gap-4">
                                                <span className="opacity-70">
                                                    Avg Salary:
                                                </span>
                                                <span>
                                                    {formatCompact(
                                                        item.avg_salary,
                                                    )}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Month Label */}
                            <span
                                className="text-xs font-medium"
                                style={{ color: textSecondary }}
                            >
                                {item.month.split(" ")[0]}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div
                className="flex items-center justify-center gap-6 mt-4 pt-3 border-t"
                style={{ borderColor: border }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded"
                        style={{ background: "#3b82f6" }}
                    ></div>
                    <span className="text-xs" style={{ color: textSecondary }}>
                        Previous Months
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className="w-3 h-3 rounded"
                        style={{ background: "#16a34a" }}
                    ></div>
                    <span className="text-xs" style={{ color: textSecondary }}>
                        Current Month
                    </span>
                </div>
            </div>
        </div>
    );
}
