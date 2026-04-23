import { useTheme } from "@/contexts/ThemeContext";

interface Props {
    data: AttendanceSummaryRow[];
    allLocations?: string[]; // Add this to show all locations even with 0 employees
}

export default function LocationBreakdownReport({
    data,
    allLocations = [],
}: Props) {
    const { isDark } = useTheme();
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const cardBg = isDark ? "#1f2937" : "#ffffff";

    // Group by location
    const locMap: Record<string, AttendanceSummaryRow[]> = {};
    data.forEach((r) => {
        const loc = r.location || "Unknown";
        if (!locMap[loc]) locMap[loc] = [];
        locMap[loc].push(r);
    });

    // Ensure all locations from props.allLocations are included
    allLocations.forEach((loc) => {
        if (!locMap[loc]) {
            locMap[loc] = [];
        }
    });

    const locStats = Object.entries(locMap)
        .map(([loc, rows]) => {
            const totalPresent = rows.reduce(
                (s, r) => s + (r.presentDays || 0),
                0,
            );
            const totalAbsent = rows.reduce(
                (s, r) => s + (r.absentDays || 0),
                0,
            );
            const totalLate = rows.reduce((s, r) => s + (r.lateDays || 0), 0);
            const totalOT = rows.reduce(
                (s, r) => s + (r.overtimeHours || 0),
                0,
            );
            const avgRate =
                rows.length > 0
                    ? rows.reduce((s, r) => s + (r.attendanceRate || 0), 0) /
                      rows.length
                    : 0;
            const totalWorkHours = rows.reduce(
                (s, r) => s + (r.totalWorkHours || 0),
                0,
            );
            return {
                loc,
                count: rows.length,
                totalPresent,
                totalAbsent,
                totalLate,
                totalOT,
                avgRate,
                totalWorkHours,
            };
        })
        .sort((a, b) => b.avgRate - a.avgRate);

    const rateColor = (rate: number) => {
        if (rate >= 95) return "#16a34a";
        if (rate >= 85) return "#f59e0b";
        return "#dc2626";
    };

    const locationIcons: Record<string, string> = {
        "HEAD OFFICE": "ri-building-line",
        "Central Support Unit": "ri-building-line",
        "Magboro Commissary": "ri-store-2-line",
        "Magboro-Commissary": "ri-store-2-line",
        "AROMIRE STORE": "ri-store-line",
        IKOTUN: "ri-map-pin-line",
        OGUDU: "ri-map-pin-line",
        AGIDINGBI: "ri-map-pin-line",
        "EGBEDA STORE": "ri-store-line",
        ILUPEJU: "ri-map-pin-line",
        "TOYIN STORE": "ri-store-line",
        MARYLAND: "ri-map-pin-line",
    };

    return (
        <div className="p-5">
            {/* Location cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                {locStats.map((l, i) => (
                    <div
                        key={l.loc}
                        className="rounded-xl p-4"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                        }}
                    >
                        <div className="flex items-start gap-3 mb-3">
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: `${rateColor(l.avgRate)}20`,
                                }}
                            >
                                <i
                                    className={`${locationIcons[l.loc] || "ri-map-pin-line"} text-lg`}
                                    style={{
                                        color:
                                            l.count > 0
                                                ? rateColor(l.avgRate)
                                                : textSecondary,
                                    }}
                                ></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p
                                        className="text-sm font-semibold truncate"
                                        style={{ color: textPrimary }}
                                    >
                                        {l.loc}
                                    </p>
                                    <span
                                        className="text-sm font-bold flex-shrink-0"
                                        style={{
                                            color:
                                                l.count > 0
                                                    ? rateColor(l.avgRate)
                                                    : textSecondary,
                                        }}
                                    >
                                        {l.count > 0
                                            ? `${l.avgRate.toFixed(1)}%`
                                            : "0.0%"}
                                    </span>
                                </div>
                                <p
                                    className="text-xs"
                                    style={{ color: textSecondary }}
                                >
                                    {l.count} employee{l.count !== 1 ? "s" : ""}{" "}
                                    · {l.totalWorkHours.toFixed(0)}h total
                                </p>
                            </div>
                        </div>
                        {/* Rate bar */}
                        <div
                            className="h-1.5 rounded-full mb-3"
                            style={{
                                background: isDark ? "#4b5563" : "#e5e7eb",
                            }}
                        >
                            <div
                                className="h-1.5 rounded-full"
                                style={{
                                    width: `${l.avgRate}%`,
                                    background: rateColor(l.avgRate),
                                }}
                            ></div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            {[
                                {
                                    label: "Present",
                                    value: l.totalPresent,
                                    color: "#16a34a",
                                },
                                {
                                    label: "Absent",
                                    value: l.totalAbsent,
                                    color: "#dc2626",
                                },
                                {
                                    label: "Late",
                                    value: l.totalLate,
                                    color: "#f59e0b",
                                },
                            ].map((s) => (
                                <div
                                    key={s.label}
                                    className="rounded-lg py-1.5"
                                    style={{
                                        background: isDark
                                            ? "#1f2937"
                                            : "#ffffff",
                                    }}
                                >
                                    <p
                                        className="text-sm font-bold"
                                        style={{ color: s.color }}
                                    >
                                        {s.value}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{
                                            color: textSecondary,
                                            fontSize: "10px",
                                        }}
                                    >
                                        {s.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Horizontal bar chart */}
            <div
                className="rounded-xl overflow-hidden"
                style={{ border: `1px solid ${border}` }}
            >
                <div
                    className="px-4 py-3"
                    style={{
                        background: isDark ? "#111827" : "#f9fafb",
                        borderBottom: `1px solid ${border}`,
                    }}
                >
                    <p
                        className="text-xs font-semibold"
                        style={{ color: textSecondary }}
                    >
                        LOCATION ATTENDANCE RATE COMPARISON
                    </p>
                </div>
                <div className="p-5 space-y-3">
                    {locStats
                        .filter((l) => l.count > 0)
                        .map((l) => (
                            <div
                                key={l.loc}
                                className="flex items-center gap-3"
                            >
                                <div className="w-32 flex-shrink-0">
                                    <p
                                        className="text-xs font-medium truncate"
                                        style={{ color: textPrimary }}
                                    >
                                        {l.loc}
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: textSecondary }}
                                    >
                                        {l.count} emp
                                    </p>
                                </div>
                                <div
                                    className="flex-1 h-6 rounded-lg overflow-hidden"
                                    style={{
                                        background: isDark
                                            ? "#374151"
                                            : "#f3f4f6",
                                    }}
                                >
                                    <div
                                        className="h-full rounded-lg flex items-center px-2 transition-all"
                                        style={{
                                            width: `${l.avgRate}%`,
                                            background: rateColor(l.avgRate),
                                            minWidth: "40px",
                                        }}
                                    >
                                        <span className="text-xs font-bold text-white">
                                            {l.avgRate.toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-20 flex-shrink-0 text-right">
                                    <span
                                        className="text-xs"
                                        style={{ color: textSecondary }}
                                    >
                                        {l.totalPresent}P / {l.totalAbsent}A
                                    </span>
                                </div>
                            </div>
                        ))}
                    {locStats.filter((l) => l.count > 0).length === 0 && (
                        <div className="text-center py-8">
                            <p
                                className="text-sm"
                                style={{ color: textSecondary }}
                            >
                                No attendance data for this period
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
