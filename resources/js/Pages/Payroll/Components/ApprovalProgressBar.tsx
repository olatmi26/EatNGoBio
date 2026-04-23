import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ApprovalLevel {
    level: string;
    code: string;
    order: number;
    is_required: boolean;
    status: "pending" | "approved" | "rejected";
    approved_by: string | null;
    approved_at: string | null;
    remarks: string | null;
}

interface ApprovalProgressBarProps {
    percentage: number;
    approved: number;
    total: number;
    levels: ApprovalLevel[];
    isFullyApproved: boolean;
    showDetails?: boolean;
    compact?: boolean;
}

export default function ApprovalProgressBar({
    percentage,
    approved,
    total,
    levels,
    isFullyApproved,
    showDetails = true,
    compact = false,
}: ApprovalProgressBarProps) {
    const { isDark } = useTheme();
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";

    const getLevelIcon = (status: string, index: number) => {
        if (status === "approved") return "ri-checkbox-circle-fill";
        if (status === "rejected") return "ri-close-circle-fill";
        if (index === 0 || levels[index - 1]?.status === "approved")
            return "ri-time-fill";
        return "ri-checkbox-blank-circle-line";
    };

    const getLevelColor = (status: string) => {
        if (status === "approved") return "#10b981";
        if (status === "rejected") return "#ef4444";
        return "#9ca3af";
    };

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div
                    className="flex-1 h-1.5 rounded-full overflow-hidden"
                    style={{ background: isDark ? "#334155" : "#e2e8f0" }}
                >
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${percentage}%`,
                            background:
                                "linear-gradient(90deg, #16a34a, #22c55e)",
                        }}
                    ></div>
                </div>
                <span
                    className="text-xs font-medium"
                    style={{ color: textSecondary }}
                >
                    {percentage}%
                </span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span
                        className="text-sm font-medium"
                        style={{ color: textPrimary }}
                    >
                        Approval Progress
                    </span>
                    {isFullyApproved && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Fully Approved
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className="text-sm font-bold"
                        style={{ color: "#16a34a" }}
                    >
                        {percentage}%
                    </span>
                    <span className="text-xs" style={{ color: textSecondary }}>
                        ({approved}/{total})
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div
                className="relative h-2.5 rounded-full overflow-hidden"
                style={{ background: isDark ? "#334155" : "#e2e8f0" }}
            >
                <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                    style={{
                        width: `${percentage}%`,
                        background: isFullyApproved
                            ? "linear-gradient(90deg, #16a34a, #22c55e)"
                            : "linear-gradient(90deg, #3b82f6, #60a5fa)",
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                </div>
            </div>

            {/* Level Indicators */}
            {showDetails && (
                <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                    {levels.map((level, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 group relative"
                        >
                            <div
                                className="transition-all duration-300 group-hover:scale-110"
                                style={{ color: getLevelColor(level.status) }}
                            >
                                <i
                                    className={`${getLevelIcon(level.status, idx)} text-base`}
                                ></i>
                            </div>
                            <div>
                                <span
                                    className="text-sm font-medium"
                                    style={{ color: textPrimary }}
                                >
                                    {level.level}
                                </span>
                                {level.approved_by && (
                                    <span
                                        className="text-xs ml-1.5"
                                        style={{ color: textSecondary }}
                                    >
                                        by {level.approved_by.split(" ")[0]}
                                    </span>
                                )}
                            </div>

                            {/* Tooltip on hover for more details */}
                            {level.approved_at && (
                                <div className="absolute bottom-full left-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                    <div
                                        className="rounded-lg px-3 py-1.5 text-xs shadow-lg"
                                        style={{
                                            background: isDark
                                                ? "#0f172a"
                                                : "#1e293b",
                                            color: "#fff",
                                        }}
                                    >
                                        <p>
                                            Approved:{" "}
                                            {new Date(
                                                level.approved_at,
                                            ).toLocaleString()}
                                        </p>
                                        {level.remarks && (
                                            <p className="mt-0.5 opacity-80">
                                                {level.remarks}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Compact Level Display */}
            <div className="flex items-center gap-1">
                {levels.map((level, idx) => (
                    <React.Fragment key={idx}>
                        <div
                            className={`w-8 h-1.5 rounded-full transition-all duration-500 ${
                                level.status === "approved"
                                    ? "bg-green-500"
                                    : level.status === "rejected"
                                      ? "bg-red-500"
                                      : "bg-gray-300 dark:bg-gray-600"
                            }`}
                            style={{
                                opacity: level.status === "pending" ? 0.5 : 1,
                                width:
                                    level.status === "approved"
                                        ? "2.5rem"
                                        : "2rem",
                            }}
                        ></div>
                        {idx < levels.length - 1 && (
                            <div
                                className="w-4 h-px"
                                style={{
                                    background: isDark ? "#475569" : "#cbd5e1",
                                }}
                            ></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
