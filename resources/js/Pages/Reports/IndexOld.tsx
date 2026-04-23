import { useState } from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/Components/base/Toast';
import AttendanceSummaryTable from "./components/AttendanceSummaryTable";
import PayrollTable from "./components/PayrollTable";
import DailyTrendChart from "./components/DailyTrendChart";
import DeptBreakdownReport from "./components/DeptBreakdownReport";
import LocationBreakdownReport from "./components/LocationBreakdownReport";
import type { PageProps } from '@/types';

interface Props extends PageProps {
  summaryRows?: any[];
  payrollRows?: any[];
  dailyRows?: any[];
  tab?: string;
  from?: string;
  to?: string;
  departments?: string[];
  locations?: string[];
  filters?: Record<string, string>;
}

type ReportTab = "attendance" | "payroll" | "daily" | "dept" | "location" | "late" | "absent";
type Period = "daily" | "weekly" | "monthly";

const periodLabels: Record<Period, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

const DATE_PRESETS = [
  { label: "Today", from: "2026-04-16", to: "2026-04-16" },
  { label: "This Week", from: "2026-04-14", to: "2026-04-16" },
  { label: "This Month", from: "2026-04-01", to: "2026-04-16" },
  { label: "Last Month", from: "2026-03-01", to: "2026-03-31" },
  { label: "Q1 2026", from: "2026-01-01", to: "2026-03-31" },
];

export default function ReportsPage() {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const { props } = usePage<Props>();
  const [activeTab, setActiveTab] = useState<ReportTab>((props.tab as ReportTab) ?? "attendance");
  const [period, setPeriod] = useState<Period>("monthly");
  const [dateFrom, setDateFrom] = useState("2026-04-01");
  const [dateTo, setDateTo] = useState("2026-04-16");
  const [filterDept, setFilterDept] = useState("all");
  const [filterShift, setFilterShift] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const bg = isDark ? "#111827" : "#f8fafc";
  const cardBg = isDark ? "#1f2937" : "#ffffff";
  const border = isDark ? "#374151" : "#e5e7eb";
  const textPrimary = isDark ? "#f9fafb" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const inputBg = isDark ? "#374151" : "#f9fafb";
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };

  const filteredAttendance = props.summaryRows ?? [].filter(r => {
    const matchDept = filterDept === "all" || r.department === filterDept;
    const matchShift = filterShift === "all" || r.shift === filterShift;
    const matchLoc = filterLocation === "all" || r.location === filterLocation;
    const matchSearch = r.employeeName.toLowerCase().includes(search.toLowerCase()) || r.employeeId.includes(search);
    return matchDept && matchShift && matchLoc && matchSearch;
  });

  const filteredPayroll = props.payrollRows ?? [].filter(r => {
    const matchDept = filterDept === "all" || r.department === filterDept;
    const matchShift = filterShift === "all" || r.shift === filterShift;
    const matchSearch = r.employeeName.toLowerCase().includes(search.toLowerCase()) || r.employeeId.includes(search);
    return matchDept && matchShift && matchSearch;
  });

  const lateEmployees = filteredAttendance.filter(r => r.lateDays > 0).sort((a, b) => b.lateMinutes - a.lateMinutes);
  const absentEmployees = filteredAttendance.filter(r => r.absentDays > 0).sort((a, b) => b.absentDays - a.absentDays);

  const totalPresent = filteredAttendance.reduce((s, r) => s + r.presentDays, 0);
  const totalAbsent = filteredAttendance.reduce((s, r) => s + r.absentDays, 0);
  const totalLate = filteredAttendance.reduce((s, r) => s + r.lateDays, 0);
  const totalOT = filteredAttendance.reduce((s, r) => s + r.overtimeHours, 0);
  const avgRate = filteredAttendance.length > 0 ? filteredAttendance.reduce((s, r) => s + r.attendanceRate, 0) / filteredAttendance.length : 0;
  const totalNetPay = filteredPayroll.reduce((s, r) => s + r.netPay, 0);

  const handleExportExcel = () => {
    const tab = activeTab === "payroll" ? "Payroll" : "Attendance";
    showToast("success", `${tab} Report Exported`, `${tab}_Report_${dateFrom}_${dateTo}.xlsx downloaded`);
  };

  const handleExportPDF = () => {
    const tab = activeTab === "payroll" ? "Payroll" : "Attendance";
    showToast("success", `${tab} PDF Generated`, `${tab}_Report_${dateFrom}_${dateTo}.pdf downloaded`);
  };

  const applyPreset = (from: string, to: string) => {
    setDateFrom(from);
    setDateTo(to);
  };

  const tabs: { key: ReportTab; label: string; icon: string; badge?: number }[] = [
    { key: "attendance", label: "Attendance", icon: "ri-calendar-check-line" },
    { key: "payroll", label: "Payroll", icon: "ri-money-dollar-circle-line" },
    { key: "daily", label: "Daily Trend", icon: "ri-bar-chart-line" },
    { key: "dept", label: "By Department", icon: "ri-building-2-line" },
    { key: "location", label: "By Location", icon: "ri-map-pin-line" },
    { key: "late", label: "Late Arrivals", icon: "ri-time-line", badge: lateEmployees.length },
    { key: "absent", label: "Absenteeism", icon: "ri-user-unfollow-line", badge: absentEmployees.length },
  ];

  return (
    <AppLayout title="">
      <div className="p-4 md:p-6" style={{ background: bg, minHeight: "100vh" }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: textPrimary }}>Reports &amp; Analytics</h1>
            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>Attendance summaries, payroll, department &amp; location breakdowns</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleExportExcel}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap transition-opacity hover:opacity-80"
              style={{ background: "#dcfce7", color: "#16a34a", border: "1px solid #bbf7d0" }}>
              <i className="ri-file-excel-2-line"></i> <span className="hidden sm:inline">Export</span> Excel
            </button>
            <button onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap transition-opacity hover:opacity-80"
              style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }}>
              <i className="ri-file-pdf-2-line"></i> <span className="hidden sm:inline">Export</span> PDF
            </button>
          </div>
        </div>

        {/* Summary KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
          {[
            { label: "Avg Rate", value: `${avgRate.toFixed(1)}%`, icon: "ri-percent-line", color: "#16a34a", bg: "#dcfce7" },
            { label: "Present Days", value: totalPresent.toLocaleString(), icon: "ri-checkbox-circle-line", color: "#16a34a", bg: "#dcfce7" },
            { label: "Absent Days", value: totalAbsent.toLocaleString(), icon: "ri-close-circle-line", color: "#dc2626", bg: "#fee2e2" },
            { label: "Late Arrivals", value: totalLate.toLocaleString(), icon: "ri-alarm-warning-line", color: "#f59e0b", bg: "#fef9c3" },
            { label: "OT Hours", value: `${totalOT.toFixed(1)}h`, icon: "ri-timer-line", color: "#7c3aed", bg: "#ede9fe" },
            { label: "Net Pay", value: `₦${(totalNetPay / 1000000).toFixed(2)}M`, icon: "ri-money-dollar-circle-line", color: "#0891b2", bg: "#e0f2fe" },
          ].map(s => (
            <div key={s.label} className="p-3 md:p-4 rounded-xl flex items-center gap-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <i className={`${s.icon} text-sm md:text-base`} style={{ color: s.color }}></i>
              </div>
              <div className="min-w-0">
                <p className="text-base md:text-lg font-bold leading-tight" style={{ color: textPrimary }}>{s.value}</p>
                <p className="text-xs leading-tight" style={{ color: textSecondary }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="rounded-xl mb-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
          {/* Date presets + toggle */}
          <div className="px-4 py-3 flex items-center gap-2 flex-wrap" style={{ borderBottom: `1px solid ${border}` }}>
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>Quick:</span>
            {DATE_PRESETS.map(p => (
              <button key={p.label} onClick={() => applyPreset(p.from, p.to)}
                className="px-3 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
                style={{
                  background: dateFrom === p.from && dateTo === p.to ? "#16a34a" : (isDark ? "#374151" : "#f3f4f6"),
                  color: dateFrom === p.from && dateTo === p.to ? "#ffffff" : textSecondary,
                }}>
                {p.label}
              </button>
            ))}
            <div className="flex-1"></div>
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
              style={{ background: showFilters ? "#dcfce7" : (isDark ? "#374151" : "#f3f4f6"), color: showFilters ? "#16a34a" : textSecondary }}>
              <i className="ri-filter-3-line"></i> Filters
              {(filterDept !== "all" || filterShift !== "all" || filterLocation !== "all") && (
                <span className="w-2 h-2 rounded-full" style={{ background: "#16a34a" }}></span>
              )}
            </button>
          </div>

          {/* Expanded filters */}
          {showFilters && (
            <div className="px-4 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: `1px solid ${border}` }}>
              {/* Period selector */}
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: isDark ? "#374151" : "#f3f4f6" }}>
                {(["daily", "weekly", "monthly"] as Period[]).map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
                    style={{ background: period === p ? (isDark ? "#1f2937" : "#ffffff") : "transparent", color: period === p ? textPrimary : textSecondary }}>
                    {periodLabels[p]}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium whitespace-nowrap" style={{ color: textSecondary }}>From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium whitespace-nowrap" style={{ color: textSecondary }}>To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle} />
              </div>
              <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
                <option value="all">All Departments</option>
                {mockDepartments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              <select value={filterShift} onChange={(e) => setFilterShift(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
                <option value="all">All Shifts</option>
                {mockShifts.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="px-3 py-1.5 rounded-lg text-sm outline-none" style={inputStyle}>
                <option value="all">All Locations</option>
                {mockAreas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
              </select>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: textSecondary }}></i>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee..." className="pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none w-40" style={inputStyle} />
              </div>
              {(filterDept !== "all" || filterShift !== "all" || filterLocation !== "all" || search) && (
                <button onClick={() => { setFilterDept("all"); setFilterShift("all"); setFilterLocation("all"); setSearch(""); }}
                  className="text-xs font-medium cursor-pointer whitespace-nowrap" style={{ color: "#dc2626" }}>
                  Clear filters
                </button>
              )}
            </div>
          )}

          {/* Date range display */}
          <div className="px-4 py-2 flex items-center gap-2">
            <i className="ri-calendar-line text-xs" style={{ color: textSecondary }}></i>
            <span className="text-xs" style={{ color: textSecondary }}>
              {dateFrom} → {dateTo} · {filteredAttendance.length} employees
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-4 overflow-x-auto" style={{ borderBottom: `1px solid ${border}` }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 md:px-4 py-3 text-xs md:text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
              style={{
                color: activeTab === tab.key ? "#16a34a" : textSecondary,
                borderBottom: activeTab === tab.key ? "2px solid #16a34a" : "2px solid transparent",
              }}>
              <i className={tab.icon}></i>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ background: tab.key === "late" ? "#fef9c3" : "#fee2e2", color: tab.key === "late" ? "#ca8a04" : "#dc2626" }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
          {/* Attendance Summary */}
          {activeTab === "attendance" && (
            <>
              <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: `1px solid ${border}` }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Attendance Summary Report</h3>
                  <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{filteredAttendance.length} employees · {dateFrom} to {dateTo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    <i className="ri-file-excel-2-line"></i> Excel
                  </button>
                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    <i className="ri-file-pdf-2-line"></i> PDF
                  </button>
                </div>
              </div>
              <AttendanceSummaryTable data={filteredAttendance} />
            </>
          )}

          {/* Payroll Summary */}
          {activeTab === "payroll" && (
            <>
              <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: `1px solid ${border}` }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Payroll Summary</h3>
                  <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Auto-calculated · Late &amp; absent deductions · OT pay included</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    Total Net: ₦{totalNetPay.toLocaleString()}
                  </div>
                  <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    <i className="ri-file-excel-2-line"></i> Excel
                  </button>
                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    <i className="ri-file-pdf-2-line"></i> PDF
                  </button>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center gap-4 md:gap-6 flex-wrap" style={{ borderBottom: `1px solid ${border}`, background: isDark ? "#374151" : "#f9fafb" }}>
                {[
                  { icon: "ri-information-line", color: "#0891b2", text: "Deduction: Basic ÷ 22 working days" },
                  { icon: "ri-alarm-warning-line", color: "#f59e0b", text: "Late: Basic ÷ 22 ÷ 8h × late min ÷ 60" },
                  { icon: "ri-timer-line", color: "#7c3aed", text: "OT rate: 1.5× hourly" },
                ].map(r => (
                  <div key={r.text} className="flex items-center gap-2 text-xs" style={{ color: textSecondary }}>
                    <i className={r.icon} style={{ color: r.color }}></i>
                    <span>{r.text}</span>
                  </div>
                ))}
              </div>
              <PayrollTable data={filteredPayroll} />
            </>
          )}

          {/* Daily Trend */}
          {activeTab === "daily" && (
            <>
              <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: `1px solid ${border}` }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Daily Attendance Trend</h3>
                  <p className="text-xs mt-0.5" style={{ color: textSecondary }}>April 2026 · Hover bars for details</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    <i className="ri-file-excel-2-line"></i> Excel
                  </button>
                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    <i className="ri-file-pdf-2-line"></i> PDF
                  </button>
                </div>
              </div>
              <div className="p-5">
                <DailyTrendChart data={props.dailyRows ?? []} />
              </div>
              <div style={{ borderTop: `1px solid ${border}` }}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${border}` }}>
                        {["Date", "Day", "Total", "Present", "Absent", "Late", "Half Day", "Rate"].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {props.dailyRows ?? [].map(row => {
                        const date = new Date(row.date);
                        const dayName = date.toLocaleDateString("en", { weekday: "long" });
                        const isWeekend = row.attendanceRate === 0;
                        return (
                          <tr key={row.date} style={{ borderBottom: `1px solid ${border}`, opacity: isWeekend ? 0.5 : 1 }}>
                            <td className="px-4 py-2.5 text-sm font-mono" style={{ color: textPrimary }}>{row.date}</td>
                            <td className="px-4 py-2.5 text-xs" style={{ color: textSecondary }}>{dayName}</td>
                            <td className="px-4 py-2.5 text-sm text-center" style={{ color: textPrimary }}>{row.totalEmployees}</td>
                            <td className="px-4 py-2.5 text-sm font-semibold text-center" style={{ color: "#16a34a" }}>{isWeekend ? "-" : row.present}</td>
                            <td className="px-4 py-2.5 text-sm font-semibold text-center" style={{ color: "#dc2626" }}>{isWeekend ? "-" : row.absent}</td>
                            <td className="px-4 py-2.5 text-sm font-semibold text-center" style={{ color: "#f59e0b" }}>{isWeekend ? "-" : row.late}</td>
                            <td className="px-4 py-2.5 text-sm font-semibold text-center" style={{ color: "#0891b2" }}>{isWeekend ? "-" : row.halfDay}</td>
                            <td className="px-4 py-2.5">
                              {isWeekend ? (
                                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: isDark ? "#374151" : "#f3f4f6", color: textSecondary }}>Weekend</span>
                              ) : (
                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                                  background: row.attendanceRate >= 95 ? "#dcfce7" : row.attendanceRate >= 85 ? "#fef9c3" : "#fee2e2",
                                  color: row.attendanceRate >= 95 ? "#16a34a" : row.attendanceRate >= 85 ? "#ca8a04" : "#dc2626",
                                }}>{row.attendanceRate}%</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Department Breakdown */}
          {activeTab === "dept" && (
            <>
              <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: `1px solid ${border}` }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Department Breakdown</h3>
                  <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Attendance performance grouped by department</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    <i className="ri-file-excel-2-line"></i> Excel
                  </button>
                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    <i className="ri-file-pdf-2-line"></i> PDF
                  </button>
                </div>
              </div>
              <DeptBreakdownReport data={filteredAttendance} />
            </>
          )}

          {/* Location Breakdown */}
          {activeTab === "location" && (
            <>
              <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: `1px solid ${border}` }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Location Breakdown</h3>
                  <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Attendance performance grouped by location / area</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    <i className="ri-file-excel-2-line"></i> Excel
                  </button>
                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    <i className="ri-file-pdf-2-line"></i> PDF
                  </button>
                </div>
              </div>
              <LocationBreakdownReport data={filteredAttendance} />
            </>
          )}

          {/* Late Arrivals */}
          {activeTab === "late" && (
            <>
              <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: `1px solid ${border}` }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Late Arrivals Report</h3>
                  <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{lateEmployees.length} employees with late arrivals · Sorted by total late minutes</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    <i className="ri-file-excel-2-line"></i> Excel
                  </button>
                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    <i className="ri-file-pdf-2-line"></i> PDF
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                      {["#", "Employee", "Department", "Shift", "Location", "Late Days", "Total Late (min)", "Avg Late (min)", "Rate"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lateEmployees.map((row, i) => (
                      <tr key={row.employeeId} style={{ borderBottom: `1px solid ${border}` }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? "#374151" : "#f9fafb"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                        <td className="px-4 py-3 text-sm font-bold" style={{ color: i < 3 ? "#f59e0b" : textSecondary }}>{i + 1}</td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium whitespace-nowrap" style={{ color: textPrimary }}>{row.employeeName}</p>
                          <p className="text-xs" style={{ color: textSecondary }}>{row.employeeId}</p>
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{row.department}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{row.shift}</td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{row.location}</td>
                        <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: "#f59e0b" }}>{row.lateDays}</td>
                        <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: "#dc2626" }}>{row.lateMinutes}</td>
                        <td className="px-4 py-3 text-sm font-mono text-center" style={{ color: textSecondary }}>{(row.lateMinutes / row.lateDays).toFixed(0)}</td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                            background: row.attendanceRate >= 95 ? "#dcfce7" : row.attendanceRate >= 80 ? "#fef9c3" : "#fee2e2",
                            color: row.attendanceRate >= 95 ? "#16a34a" : row.attendanceRate >= 80 ? "#ca8a04" : "#dc2626",
                          }}>{row.attendanceRate.toFixed(1)}%</span>
                        </td>
                      </tr>
                    ))}
                    {lateEmployees.length === 0 && (
                      <tr><td colSpan={9} className="py-12 text-center text-sm" style={{ color: textSecondary }}>
                        <i className="ri-checkbox-circle-line text-3xl mb-2 block" style={{ color: "#16a34a" }}></i>
                        No late arrivals for the selected period
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Absenteeism */}
          {activeTab === "absent" && (
            <>
              <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-2" style={{ borderBottom: `1px solid ${border}` }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Absenteeism Report</h3>
                  <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{absentEmployees.length} employees with absences · Sorted by absent days</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#dcfce7", color: "#16a34a" }}>
                    <i className="ri-file-excel-2-line"></i> Excel
                  </button>
                  <button onClick={handleExportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap" style={{ background: "#fee2e2", color: "#dc2626" }}>
                    <i className="ri-file-pdf-2-line"></i> PDF
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                      {["#", "Employee", "Department", "Shift", "Location", "Absent Days", "Present Days", "Rate", "Deduction"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {absentEmployees.map((row, i) => {
                      const payrollRow = props.payrollRows ?? [].find(p => p.employeeId === row.employeeId);
                      return (
                        <tr key={row.employeeId} style={{ borderBottom: `1px solid ${border}` }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? "#374151" : "#f9fafb"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: i < 3 ? "#dc2626" : textSecondary }}>{i + 1}</td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium whitespace-nowrap" style={{ color: textPrimary }}>{row.employeeName}</p>
                            <p className="text-xs" style={{ color: textSecondary }}>{row.employeeId}</p>
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{row.department}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{row.shift}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{row.location}</td>
                          <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: "#dc2626" }}>{row.absentDays}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: "#16a34a" }}>{row.presentDays}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{
                              background: row.attendanceRate >= 95 ? "#dcfce7" : row.attendanceRate >= 80 ? "#fef9c3" : "#fee2e2",
                              color: row.attendanceRate >= 95 ? "#16a34a" : row.attendanceRate >= 80 ? "#ca8a04" : "#dc2626",
                            }}>{row.attendanceRate.toFixed(1)}%</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono whitespace-nowrap" style={{ color: "#dc2626" }}>
                            {payrollRow ? `-₦${payrollRow.absentDeduction.toLocaleString()}` : "-"}
                          </td>
                        </tr>
                      );
                    })}
                    {absentEmployees.length === 0 && (
                      <tr><td colSpan={9} className="py-12 text-center text-sm" style={{ color: textSecondary }}>
                        <i className="ri-checkbox-circle-line text-3xl mb-2 block" style={{ color: "#16a34a" }}></i>
                        No absences for the selected period
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
