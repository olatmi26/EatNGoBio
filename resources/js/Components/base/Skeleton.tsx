import { useTheme } from "@/contexts/ThemeContext";

interface SkeletonProps {
    className?: string;
    variant?: "text" | "circular" | "rectangular" | "card";
    width?: string | number;
    height?: string | number;
    animate?: boolean;
}

export function Skeleton({
    className = "",
    variant = "text",
    width,
    height,
    animate = true,
}: SkeletonProps) {
    const { isDark } = useTheme();
    const bg = isDark ? "#374151" : "#e5e7eb";

    const baseStyles = {
        background: bg,
        borderRadius:
            variant === "circular"
                ? "50%"
                : variant === "card"
                  ? "12px"
                  : "6px",
        width: width || (variant === "circular" ? "40px" : "100%"),
        height:
            height ||
            (variant === "circular"
                ? "40px"
                : variant === "text"
                  ? "16px"
                  : "100%"),
    };

    const animation = animate
        ? {
              animation: "pulse 1.5s ease-in-out infinite",
          }
        : {};

    return (
        <div
            className={`${animate ? "animate-pulse" : ""} ${className}`}
            style={{ ...baseStyles, ...animation }}
        />
    );
}

export function TableSkeleton({
    rows = 5,
    columns = 5,
}: {
    rows?: number;
    columns?: number;
}) {
    const { isDark } = useTheme();
    const bg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";

    return (
        <div
            className="rounded-xl overflow-hidden"
            style={{ background: bg, border: `1px solid ${border}` }}
        >
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${border}` }}>
                            {Array(columns)
                                .fill(0)
                                .map((_, i) => (
                                    <th key={i} className="px-4 py-3">
                                        <Skeleton width="80%" height="12px" />
                                    </th>
                                ))}
                        </tr>
                    </thead>
                    <tbody>
                        {Array(rows)
                            .fill(0)
                            .map((_, i) => (
                                <tr
                                    key={i}
                                    style={{
                                        borderBottom: `1px solid ${border}`,
                                    }}
                                >
                                    {Array(columns)
                                        .fill(0)
                                        .map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <Skeleton
                                                    width={
                                                        j === 0 ? "60%" : "80%"
                                                    }
                                                    height="14px"
                                                />
                                            </td>
                                        ))}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function CardSkeleton({ count = 1 }: { count?: number }) {
    const { isDark } = useTheme();
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(count)
                .fill(0)
                .map((_, i) => (
                    <div
                        key={i}
                        className="rounded-xl p-4"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                        }}
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <Skeleton
                                variant="circular"
                                width="40px"
                                height="40px"
                            />
                            <div className="flex-1">
                                <Skeleton
                                    width="70%"
                                    height="16px"
                                    className="mb-2"
                                />
                                <Skeleton width="50%" height="12px" />
                            </div>
                            <Skeleton width="60px" height="24px" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton width="90%" height="12px" />
                            <Skeleton width="80%" height="12px" />
                            <Skeleton width="60%" height="12px" />
                        </div>
                    </div>
                ))}
        </div>
    );
}

export function DeviceCardSkeleton() {
    const { isDark } = useTheme();
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";

    return (
        <div
            className="rounded-xl p-4 animate-pulse"
            style={{ background: cardBg, border: `1px solid ${border}` }}
        >
            <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700"></div>
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
            <div className="space-y-2 mb-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
        </div>
    );
}
