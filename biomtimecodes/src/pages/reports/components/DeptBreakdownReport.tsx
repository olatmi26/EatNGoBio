import { useTheme } from "@/contexts/ThemeContext";
import type { AttendanceSummaryRow } from "@/mocks/reports";

interface Props {
  data: AttendanceSummaryRow[];
}

export default function DeptBreakdownReport({ data }: Props) {
  const { isDark } = useTheme();
  const border = isDark ? "#374151" : "#e5e7eb";
  const textPrimary = isDark ? "#f9fafb" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const cardBg = isDark ? "#374151" : "#f9fafb";

  // Group by department
  const deptMap: Record<string, AttendanceSummaryRow[]> = {};
  data.forEach(r => {
    if (!deptMap[r.department]) deptMap[r.department] = [];
    deptMap[r.department].push(r);
  });

  const deptStats = Object.entries(deptMap).map(([dept, rows]) => {
    const totalPresent = rows.reduce((s, r) => s + r.presentDays, 0);
    const totalAbsent = rows.reduce((s, r) => s + r.absentDays, 0);
    const totalLate = rows.reduce((s, r) => s + r.lateDays, 0);
    const totalOT = rows.reduce((s, r) => s + r.overtimeHours, 0);
    const avgRate = rows.reduce((s, r) => s + r.attendanceRate, 0) / rows.length;
    return { dept, count: rows.length, totalPresent, totalAbsent, totalLate, totalOT, avgRate };
  }).sort((a, b) => b.avgRate - a.avgRate);

  const maxRate = 100;

  const rateColor = (rate: number) => {
    if (rate >= 95) return "#16a34a";
    if (rate >= 85) return "#f59e0b";
    return "#dc2626";
  };

  return (
    <div className="p-5">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {deptStats.map((d, i) => (
          <div key={d.dept} className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ background: rateColor(d.avgRate), fontSize: "10px" }}>{i + 1}</span>
                <div>
                  <p className="text-sm font-semibold leading-tight" style={{ color: textPrimary }}>{d.dept}</p>
                  <p className="text-xs" style={{ color: textSecondary }}>{d.count} employee{d.count !== 1 ? "s" : ""}</p>
                </div>
              </div>
              <span className="text-base font-bold" style={{ color: rateColor(d.avgRate) }}>{d.avgRate.toFixed(1)}%</span>
            </div>
            {/* Rate bar */}
            <div className="h-2 rounded-full mb-3" style={{ background: isDark ? "#4b5563" : "#e5e7eb" }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${(d.avgRate / maxRate) * 100}%`, background: rateColor(d.avgRate) }}></div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                { label: "Present", value: d.totalPresent, color: "#16a34a" },
                { label: "Absent", value: d.totalAbsent, color: "#dc2626" },
                { label: "Late", value: d.totalLate, color: "#f59e0b" },
                { label: "OT hrs", value: d.totalOT.toFixed(1), color: "#7c3aed" },
              ].map(s => (
                <div key={s.label}>
                  <p className="text-sm font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs" style={{ color: textSecondary, fontSize: "10px" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary table */}
      <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
        <div className="px-4 py-3" style={{ background: isDark ? "#111827" : "#f9fafb", borderBottom: `1px solid ${border}` }}>
          <p className="text-xs font-semibold" style={{ color: textSecondary }}>DEPARTMENT COMPARISON TABLE</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr style={{ borderBottom: `1px solid ${border}` }}>
                {["Rank", "Department", "Employees", "Avg Rate", "Present Days", "Absent Days", "Late Days", "OT Hours"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {deptStats.map((d, i) => (
                <tr key={d.dept} style={{ borderBottom: `1px solid ${border}` }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? "#374151" : "#f9fafb"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ background: rateColor(d.avgRate), fontSize: "10px" }}>{i + 1}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium whitespace-nowrap" style={{ color: textPrimary }}>{d.dept}</td>
                  <td className="px-4 py-3 text-sm text-center" style={{ color: textSecondary }}>{d.count}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${rateColor(d.avgRate)}20`, color: rateColor(d.avgRate) }}>{d.avgRate.toFixed(1)}%</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: "#16a34a" }}>{d.totalPresent}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: d.totalAbsent > 0 ? "#dc2626" : textSecondary }}>{d.totalAbsent}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: d.totalLate > 0 ? "#f59e0b" : textSecondary }}>{d.totalLate}</td>
                  <td className="px-4 py-3 text-sm font-mono text-center" style={{ color: d.totalOT > 0 ? "#7c3aed" : textSecondary }}>{d.totalOT.toFixed(1)}h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
