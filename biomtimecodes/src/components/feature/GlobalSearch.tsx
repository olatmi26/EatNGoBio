import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { mockEmployees } from "@/mocks/employees";
import { mockDeviceList } from "@/mocks/devices";
import { mockAttendanceRecords } from "@/mocks/attendance";

type ResultCategory = "employees" | "devices" | "attendance";

interface SearchResult {
  id: string;
  category: ResultCategory;
  title: string;
  subtitle: string;
  meta?: string;
  path: string;
  icon: string;
  color: string;
  badge?: { label: string; color: string; bg: string };
}

const categoryConfig: Record<ResultCategory, { label: string; icon: string; color: string }> = {
  employees: { label: "Employees", icon: "ri-team-line", color: "#16a34a" },
  devices: { label: "Devices", icon: "ri-device-line", color: "#0891b2" },
  attendance: { label: "Attendance", icon: "ri-time-line", color: "#d97706" },
};

function searchAll(query: string): SearchResult[] {
  if (!query.trim() || query.length < 2) return [];
  const q = query.toLowerCase();
  const results: SearchResult[] = [];

  // Employees
  mockEmployees
    .filter(e =>
      `${e.firstName} ${e.lastName} ${e.employeeId} ${e.department} ${e.position}`.toLowerCase().includes(q)
    )
    .slice(0, 5)
    .forEach(e => {
      const statusMap: Record<string, { label: string; color: string; bg: string }> = {
        active: { label: "Active", color: "#16a34a", bg: "#dcfce7" },
        resigned: { label: "Resigned", color: "#dc2626", bg: "#fee2e2" },
        probation: { label: "Probation", color: "#ca8a04", bg: "#fef9c3" },
        suspended: { label: "Suspended", color: "#d97706", bg: "#fef3c7" },
        disabled: { label: "Disabled", color: "#6b7280", bg: "#f3f4f6" },
      };
      results.push({
        id: e.id,
        category: "employees",
        title: `${e.firstName} ${e.lastName}`,
        subtitle: `${e.department} · ${e.position}`,
        meta: e.employeeId,
        path: `/employees/${e.id}`,
        icon: "ri-user-line",
        color: "#16a34a",
        badge: statusMap[e.status] || statusMap.active,
      });
    });

  // Devices
  mockDeviceList
    .filter(d =>
      `${d.name} ${d.sn} ${d.area} ${d.ip}`.toLowerCase().includes(q)
    )
    .slice(0, 4)
    .forEach(d => {
      const statusMap: Record<string, { label: string; color: string; bg: string }> = {
        online: { label: "Online", color: "#16a34a", bg: "#dcfce7" },
        offline: { label: "Offline", color: "#dc2626", bg: "#fee2e2" },
        syncing: { label: "Syncing", color: "#ca8a04", bg: "#fef9c3" },
      };
      results.push({
        id: d.id,
        category: "devices",
        title: d.name,
        subtitle: `${d.area} · ${d.ip}`,
        meta: d.sn,
        path: `/devices/${d.id}`,
        icon: "ri-device-line",
        color: "#0891b2",
        badge: statusMap[d.status],
      });
    });

  // Attendance
  mockAttendanceRecords
    .filter(r =>
      `${r.employeeName} ${r.employeeId} ${r.department} ${r.area}`.toLowerCase().includes(q)
    )
    .slice(0, 4)
    .forEach(r => {
      const statusMap: Record<string, { label: string; color: string; bg: string }> = {
        present: { label: "Present", color: "#16a34a", bg: "#dcfce7" },
        late: { label: "Late", color: "#ca8a04", bg: "#fef9c3" },
        absent: { label: "Absent", color: "#dc2626", bg: "#fee2e2" },
        "half-day": { label: "Half Day", color: "#0284c7", bg: "#e0f2fe" },
      };
      results.push({
        id: r.id,
        category: "attendance",
        title: r.employeeName,
        subtitle: `${r.department} · ${r.date}`,
        meta: `In: ${r.checkIn || "-"} Out: ${r.checkOut || "-"}`,
        path: `/attendance`,
        icon: "ri-time-line",
        color: "#d97706",
        badge: statusMap[r.status],
      });
    });

  return results;
}

interface GlobalSearchProps {
  isDark: boolean;
  textSecondary: string;
  textPrimary: string;
  inputBg: string;
  inputBorder: string;
}

export default function GlobalSearch({ isDark, textSecondary, textPrimary, inputBg, inputBorder }: GlobalSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const panelBg = isDark ? "#1f2937" : "#ffffff";
  const border = isDark ? "#374151" : "#e5e7eb";
  const hoverBg = isDark ? "#374151" : "#f9fafb";

  const doSearch = useCallback((q: string) => {
    const r = searchAll(q);
    setResults(r);
    setOpen(r.length > 0 || q.length >= 2);
    setActiveIdx(-1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => doSearch(query), 150);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      const r = results[activeIdx];
      if (r) { navigate(r.path); setOpen(false); setQuery(""); }
    }
  };

  const handleSelect = (r: SearchResult) => {
    navigate(r.path);
    setOpen(false);
    setQuery("");
  };

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<ResultCategory, SearchResult[]>);

  return (
    <div className="relative flex-1 max-w-md">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
          <i className="ri-search-line text-sm" style={{ color: textSecondary }}></i>
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { setFocused(true); if (query.length >= 2) setOpen(true); }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Search employees, devices, attendance… (Ctrl+K)"
          className="w-full pl-9 pr-16 py-2 rounded-lg text-sm outline-none transition-all"
          style={{
            background: inputBg,
            border: `1px solid ${focused ? "#16a34a" : inputBorder}`,
            color: textPrimary,
          }}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          {query ? (
            <button
              className="pointer-events-auto w-4 h-4 flex items-center justify-center rounded cursor-pointer"
              style={{ color: textSecondary }}
              onMouseDown={e => { e.preventDefault(); setQuery(""); setOpen(false); }}
            >
              <i className="ri-close-line text-xs"></i>
            </button>
          ) : (
            <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: isDark ? "#374151" : "#e5e7eb", color: textSecondary, fontSize: "10px" }}>⌘K</span>
          )}
        </div>
      </div>

      {open && (
        <div
          ref={panelRef}
          className="absolute top-full left-0 right-0 mt-1.5 rounded-xl overflow-hidden z-50"
          style={{ background: panelBg, border: `1px solid ${border}`, boxShadow: "0 16px 48px rgba(0,0,0,0.18)", maxHeight: "480px", overflowY: "auto" }}
        >
          {results.length === 0 && query.length >= 2 ? (
            <div className="py-10 text-center">
              <i className="ri-search-line text-2xl mb-2 block" style={{ color: textSecondary }}></i>
              <p className="text-sm font-medium" style={{ color: textPrimary }}>No results for &quot;{query}&quot;</p>
              <p className="text-xs mt-1" style={{ color: textSecondary }}>Try searching by name, ID, department, or area</p>
            </div>
          ) : (
            <>
              {(Object.keys(grouped) as ResultCategory[]).map(cat => (
                <div key={cat}>
                  <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: `1px solid ${border}`, background: isDark ? "#111827" : "#f9fafb" }}>
                    <i className={`${categoryConfig[cat].icon} text-xs`} style={{ color: categoryConfig[cat].color }}></i>
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: textSecondary }}>{categoryConfig[cat].label}</span>
                    <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${categoryConfig[cat].color}20`, color: categoryConfig[cat].color }}>{grouped[cat].length}</span>
                  </div>
                  {grouped[cat].map((r, i) => {
                    const globalIdx = results.indexOf(r);
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors"
                        style={{ background: activeIdx === globalIdx ? hoverBg : "transparent", borderBottom: `1px solid ${border}` }}
                        onMouseEnter={() => setActiveIdx(globalIdx)}
                        onMouseLeave={() => setActiveIdx(-1)}
                        onClick={() => handleSelect(r)}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}15` }}>
                          <i className={`${r.icon} text-sm`} style={{ color: r.color }}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate" style={{ color: textPrimary }}>{r.title}</p>
                            {r.badge && (
                              <span className="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0" style={{ background: r.badge.bg, color: r.badge.color }}>{r.badge.label}</span>
                            )}
                          </div>
                          <p className="text-xs truncate" style={{ color: textSecondary }}>{r.subtitle}</p>
                        </div>
                        {r.meta && (
                          <span className="text-xs font-mono flex-shrink-0" style={{ color: textSecondary }}>{r.meta}</span>
                        )}
                        <i className="ri-arrow-right-s-line text-sm flex-shrink-0" style={{ color: textSecondary }}></i>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div className="px-4 py-2.5 flex items-center justify-between" style={{ borderTop: `1px solid ${border}`, background: isDark ? "#111827" : "#f9fafb" }}>
                <span className="text-xs" style={{ color: textSecondary }}>{results.length} result{results.length !== 1 ? "s" : ""} found</span>
                <div className="flex items-center gap-3 text-xs" style={{ color: textSecondary }}>
                  <span><kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: isDark ? "#374151" : "#e5e7eb" }}>↑↓</kbd> navigate</span>
                  <span><kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: isDark ? "#374151" : "#e5e7eb" }}>↵</kbd> select</span>
                  <span><kbd className="px-1 py-0.5 rounded text-xs font-mono" style={{ background: isDark ? "#374151" : "#e5e7eb" }}>Esc</kbd> close</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
