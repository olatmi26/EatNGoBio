import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface StatItem {
    label: string;
    value: string | number;
    icon: string;
    color: string;
    trend?: number | null;
    subtitle?: string;
}

interface PayrollStatsProps {
    stats: StatItem[];
    variant?: "default" | "compact" | "detailed";
    columns?: 2 | 3 | 4 | 5 | 6;
}

export default function PayrollStats({
    stats,
    variant = "default",
    columns = 5,
}: PayrollStatsProps) {
    const { isDark } = useTheme();

    const cardBg = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#334155" : "#e2e8f0";
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";

    const getBgColor = (color: string) => {
        return isDark
            ? `${color}20` || "rgba(16,185,129,0.15)"
            : `${color}10` || "#dcfce7";
    };

    const getTrendIcon = (trend: number) => {
        if (trend > 0) return "ri-arrow-up-line";
        if (trend < 0) return "ri-arrow-down-line";
        return "ri-subtract-line";
    };

    const getTrendColor = (trend: number) => {
        if (trend > 0) return "#10b981";
        if (trend < 0) return "#ef4444";
        return textSecondary;
    };

    const gridCols = {
        2: "grid-cols-2",
        3: "grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-2 lg:grid-cols-4",
        5: "grid-cols-2 lg:grid-cols-5",
        6: "grid-cols-2 lg:grid-cols-6",
    };

    if (variant === "compact") {
        return (
            <div className={`grid ${gridCols[columns]} gap-3`}>
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="p-4 rounded-xl transition-all hover:scale-[1.02]"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p
                                    className="text-xs font-medium uppercase tracking-wide"
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
                            <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center"
                                style={{ background: getBgColor(stat.color) }}
                            >
                                <i
                                    className={stat.icon}
                                    style={{ color: stat.color }}
                                ></i>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === "detailed") {
        return (
            <div className={`grid ${gridCols[columns]} gap-4`}>
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        className="p-5 rounded-2xl transition-all hover:scale-[1.02] shadow-sm"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                        }}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <p
                                className="text-xs font-medium uppercase tracking-wide"
                                style={{ color: textSecondary }}
                            >
                                {stat.label}
                            </p>
                            <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center"
                                style={{ background: getBgColor(stat.color) }}
                            >
                                <i
                                    className={`${stat.icon} text-lg`}
                                    style={{ color: stat.color }}
                                ></i>
                            </div>
                        </div>
                        <p
                            className="text-2xl font-bold"
                            style={{ color: textPrimary }}
                        >
                            {stat.value}
                        </p>
                        {stat.trend !== undefined && stat.trend !== null && (
                            <div className="flex items-center gap-1 mt-2">
                                <i
                                    className={getTrendIcon(stat.trend)}
                                    style={{ color: getTrendColor(stat.trend) }}
                                ></i>
                                <span
                                    className="text-xs font-medium"
                                    style={{ color: getTrendColor(stat.trend) }}
                                >
                                    {Math.abs(stat.trend).toFixed(1)}%
                                </span>
                                <span
                                    className="text-xs ml-1"
                                    style={{ color: textSecondary }}
                                >
                                    vs last period
                                </span>
                            </div>
                        )}
                        {stat.subtitle && (
                            <p
                                className="text-xs mt-2"
                                style={{ color: textSecondary }}
                            >
                                {stat.subtitle}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className={`grid ${gridCols[columns]} gap-4`}>
            {stats.map((stat, idx) => (
                <div
                    key={idx}
                    className="p-4 rounded-xl backdrop-blur-sm transition-all hover:scale-[1.02]"
                    style={{
                        background: cardBg,
                        border: `1px solid ${border}`,
                    }}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <p
                                className="text-xs font-medium tracking-wide uppercase"
                                style={{ color: textSecondary }}
                            >
                                {stat.label}
                            </p>
                            <p
                                className="text-xl sm:text-2xl font-bold mt-1"
                                style={{ color: textPrimary }}
                            >
                                {stat.value}
                            </p>
                            {stat.trend !== undefined &&
                                stat.trend !== null && (
                                    <p
                                        className="text-xs mt-1 flex items-center gap-0.5"
                                        style={{
                                            color: getTrendColor(stat.trend),
                                        }}
                                    >
                                        <i
                                            className={getTrendIcon(stat.trend)}
                                        ></i>
                                        {Math.abs(stat.trend).toFixed(1)}%
                                    </p>
                                )}
                        </div>
                        <div
                            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: getBgColor(stat.color) }}
                        >
                            <i
                                className={`${stat.icon} text-lg sm:text-xl`}
                                style={{ color: stat.color }}
                            ></i>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
