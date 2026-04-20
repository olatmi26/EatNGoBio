import { useState } from "react";
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/Components/base/Toast';
import FlyoutPanel from '@/Components/base/FlyoutPanel';

type ViewMode = "departments" | "positions" | "areas";

const DEPT_COLORS = ["#16a34a", "#0891b2", "#7c3aed", "#d97706", "#dc2626", "#db2777", "#0d9488", "#ea580c", "#6366f1"];

function getDeptColor(idx: number) {
  return DEPT_COLORS[idx % DEPT_COLORS.length];
}

interface OrgNode {
  id: string;
  name: string;
  code: string;
  manager?: string;
  employeeQty: number;
  resignedQty?: number;
  children: OrgNode[];
  color: string;
  depth: number;
}

function buildTree(departments: Department[]): OrgNode[] {
  const roots: OrgNode[] = [];
  const map: Record<string, OrgNode> = {};
  let colorIdx = 0;

  // First pass: create all nodes
  departments.forEach(d => {
    map[d.name] = {
      id: d.id,
      name: d.name,
      code: d.code,
      manager: d.manager,
      employeeQty: d.employeeQty,
      resignedQty: d.resignedQty,
      children: [],
      color: getDeptColor(colorIdx++),
      depth: 0,
    };
  });

  // Second pass: build hierarchy
  departments.forEach(d => {
    const node = map[d.name];
    if (d.superior && d.superior !== "-" && map[d.superior]) {
      map[d.superior].children.push(node);
      node.depth = 1;
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function DeptCard({ node, onSelect, isDark, border, textPrimary, textSecondary }: {
  node: OrgNode;
  onSelect: (n: OrgNode) => void;
  isDark: boolean;
  border: string;
  textPrimary: string;
  textSecondary: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const cardBg = isDark ? "#1f2937" : "#ffffff";

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div
        className="rounded-xl p-4 cursor-pointer transition-all hover:scale-105 relative"
        style={{
          background: cardBg,
          border: `2px solid ${node.color}`,
          width: "180px",
          boxShadow: `0 4px 16px ${node.color}25`,
        }}
        onClick={() => onSelect(node)}
      >
        {/* Color top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: node.color }}></div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${node.color}20` }}>
            <i className="ri-building-2-line text-sm" style={{ color: node.color }}></i>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold truncate" style={{ color: textPrimary }}>{node.name}</p>
            <p className="text-xs" style={{ color: textSecondary, fontSize: "10px" }}>{node.code}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-base font-bold" style={{ color: node.color }}>{node.employeeQty}</p>
            <p className="text-xs" style={{ color: textSecondary, fontSize: "9px" }}>Employees</p>
          </div>
          {node.manager && node.manager !== "-" && (
            <div className="text-right">
              <p className="text-xs truncate max-w-[80px]" style={{ color: textSecondary, fontSize: "9px" }}>{node.manager}</p>
            </div>
          )}
        </div>
        {node.children.length > 0 && (
          <button
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer z-10"
            style={{ background: node.color, color: "#fff" }}
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            <i className={`${expanded ? "ri-subtract-line" : "ri-add-line"} text-xs`}></i>
          </button>
        )}
      </div>

      {/* Children */}
      {node.children.length > 0 && expanded && (
        <div className="flex flex-col items-center mt-6">
          {/* Vertical connector */}
          <div className="w-0.5 h-5" style={{ background: node.color }}></div>
          {/* Horizontal bar */}
          {node.children.length > 1 && (
            <div className="relative flex items-start justify-center" style={{ width: `${node.children.length * 200}px` }}>
              <div className="absolute top-0 h-0.5" style={{ background: node.color, left: "100px", right: "100px" }}></div>
              <div className="flex gap-4 pt-0">
                {node.children.map(child => (
                  <div key={child.id} className="flex flex-col items-center">
                    <div className="w-0.5 h-5" style={{ background: node.color }}></div>
                    <DeptCard node={child} onSelect={onSelect} isDark={isDark} border={border} textPrimary={textPrimary} textSecondary={textSecondary} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {node.children.length === 1 && (
            <DeptCard node={node.children[0]} onSelect={onSelect} isDark={isDark} border={border} textPrimary={textPrimary} textSecondary={textSecondary} />
          )}
        </div>
      )}
    </div>
  );
}

interface OrgChartPageProps {
  departments?: Department[];
  positions?: Position[];
  areas?: Area[];
}

export default function OrgChartPage(props: OrgChartPageProps) {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>("departments");
  const [selectedDept, setSelectedDept] = useState<OrgNode | null>(null);
  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const [search, setSearch] = useState("");

  const bg = isDark ? "#111827" : "#f8fafc";
  const cardBg = isDark ? "#1f2937" : "#ffffff";
  const border = isDark ? "#374151" : "#e5e7eb";
  const textPrimary = isDark ? "#f9fafb" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const inputBg = isDark ? "#374151" : "#f9fafb";

  const tree = buildTree(props.departments ?? []);

  const totalEmployees = (props.departments ?? []).reduce((s, d) => s + d.employeeQty, 0);
  const totalPositions = (props.positions ?? []).reduce((s, p) => s + p.employeeQty, 0);
  const totalAreas = (props.areas ?? []).length;

  const filteredPositions = (props.positions ?? []).filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  );
  const filteredAreas = (props.areas ?? []).filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredDepts = (props.departments ?? []).filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())
  );

  const openDeptFlyout = (node: OrgNode) => {
    setSelectedDept(node);
    setFlyoutOpen(true);
  };

  const openPosFlyout = (pos: Position) => {
    setSelectedPos(pos);
    setFlyoutOpen(true);
  };

  const openAreaFlyout = (area: Area) => {
    setSelectedArea(area);
    setFlyoutOpen(true);
  };

  const closeFlyout = () => {
    setFlyoutOpen(false);
    setTimeout(() => { setSelectedDept(null); setSelectedPos(null); setSelectedArea(null); }, 300);
  };

  const getFlyoutTitle = () => {
    if (selectedDept) return selectedDept.name;
    if (selectedPos) return selectedPos.name;
    if (selectedArea) return selectedArea.name;
    return "";
  };

  const getFlyoutSubtitle = () => {
    if (selectedDept) return `Department · ${selectedDept.employeeQty} employees`;
    if (selectedPos) return `Position · ${selectedPos.employeeQty} employees`;
    if (selectedArea) return `Area · ${selectedArea.employees} employees · ${selectedArea.devices} device(s)`;
    return "";
  };

  const posColors = ["#16a34a", "#0891b2", "#7c3aed", "#d97706", "#dc2626", "#db2777", "#0d9488", "#ea580c"];

  return (
    <AppLayout title="">
      <div className="p-4 md:p-6" style={{ background: bg, minHeight: "100vh" }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: textPrimary }}>Organization Chart</h1>
            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>Visual hierarchy of departments, positions, and locations</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: textSecondary }}></i>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-40 md:w-52"
                style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }}
              />
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Departments", value: (props.departments ?? []).length, icon: "ri-building-2-line", color: "#16a34a", bg: "#dcfce7" },
            { label: "Positions", value: (props.positions ?? []).length, icon: "ri-briefcase-line", color: "#0891b2", bg: "#e0f2fe" },
            { label: "Locations / Areas", value: totalAreas, icon: "ri-map-pin-line", color: "#7c3aed", bg: "#ede9fe" },
            { label: "Total Headcount", value: totalEmployees, icon: "ri-team-line", color: "#d97706", bg: "#fef3c7" },
          ].map(s => (
            <div key={s.label} className="p-3 md:p-4 rounded-xl flex items-center gap-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <i className={`${s.icon} text-base`} style={{ color: s.color }}></i>
              </div>
              <div>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: textSecondary }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* View mode tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl w-fit" style={{ background: isDark ? "#374151" : "#f3f4f6" }}>
          {([
            { key: "departments", label: "Departments", icon: "ri-building-2-line" },
            { key: "positions", label: "Positions", icon: "ri-briefcase-line" },
            { key: "areas", label: "Areas / Locations", icon: "ri-map-pin-line" },
          ] as { key: ViewMode; label: string; icon: string }[]).map(v => (
            <button key={v.key} onClick={() => setViewMode(v.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
              style={{
                background: viewMode === v.key ? (isDark ? "#1f2937" : "#ffffff") : "transparent",
                color: viewMode === v.key ? textPrimary : textSecondary,
              }}>
              <i className={v.icon}></i>
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>

        {/* Departments — Org Tree */}
        {viewMode === "departments" && (
          <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Department Hierarchy</h3>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Click any card to view details · Click +/- to expand/collapse</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: "#dcfce7", color: "#16a34a" }}>
                {(props.departments ?? []).length} departments · {totalEmployees} employees
              </span>
            </div>

            {/* Tree view */}
            <div className="p-6 overflow-x-auto">
              <div className="flex flex-col items-center gap-6 min-w-max">
                {(search ? filteredDepts.map(d => ({
                  id: d.id, name: d.name, code: d.code, manager: d.manager,
                  employeeQty: d.employeeQty, resignedQty: d.resignedQty,
                  children: [], color: getDeptColor((props.departments ?? []).indexOf(d)), depth: 0,
                })) : tree).map((node, i) => (
                  <DeptCard key={node.id} node={node} onSelect={openDeptFlyout} isDark={isDark} border={border} textPrimary={textPrimary} textSecondary={textSecondary} />
                ))}
              </div>
            </div>

            {/* Flat list below tree */}
            <div style={{ borderTop: `1px solid ${border}` }}>
              <div className="px-5 py-3" style={{ background: isDark ? "#111827" : "#f9fafb", borderBottom: `1px solid ${border}` }}>
                <p className="text-xs font-semibold" style={{ color: textSecondary }}>ALL DEPARTMENTS</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                      {["Code", "Department", "Superior", "Employees", "Resigned", "Manager", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(search ? filteredDepts : (props.departments ?? [])).map((d, i) => (
                      <tr key={d.id} style={{ borderBottom: `1px solid ${border}` }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? "#374151" : "#f9fafb"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${getDeptColor(i)}20`, color: getDeptColor(i) }}>{d.code}</span>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: textPrimary }}>{d.name}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: d.superior === "-" ? textSecondary : "#16a34a" }}>{d.superior}</td>
                        <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: "#16a34a" }}>{d.employeeQty}</td>
                        <td className="px-4 py-3 text-sm text-center" style={{ color: d.resignedQty > 0 ? "#dc2626" : textSecondary }}>{d.resignedQty}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: textSecondary }}>{d.manager === "-" ? "—" : d.manager}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openDeptFlyout({ id: d.id, name: d.name, code: d.code, manager: d.manager, employeeQty: d.employeeQty, resignedQty: d.resignedQty, children: [], color: getDeptColor(i), depth: 0 })}
                            className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                            style={{ color: textSecondary }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? "#4b5563" : "#f3f4f6"; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                            <i className="ri-eye-line text-sm"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Positions */}
        {viewMode === "positions" && (
          <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
            <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Positions &amp; Headcount</h3>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{(props.positions ?? []).length} positions · {totalPositions} total employees</p>
              </div>
            </div>

            {/* Visual cards */}
            <div className="p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-0">
              {filteredPositions.map((pos, i) => {
                const color = posColors[i % posColors.length];
                const maxQty = Math.max(...(props.positions ?? []).map(p => p.employeeQty));
                return (
                  <button
                    key={pos.id}
                    onClick={() => openPosFlyout(pos)}
                    className="rounded-xl p-4 text-left cursor-pointer transition-all hover:scale-105"
                    style={{ background: isDark ? "#374151" : "#f9fafb", border: `1px solid ${border}` }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}20` }}>
                      <i className="ri-briefcase-line text-lg" style={{ color }}></i>
                    </div>
                    <p className="text-xs font-semibold mb-1 leading-tight" style={{ color: textPrimary }}>{pos.name}</p>
                    <p className="text-xl font-bold" style={{ color }}>{pos.employeeQty}</p>
                    <div className="mt-2 h-1.5 rounded-full" style={{ background: isDark ? "#4b5563" : "#e5e7eb" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${(pos.employeeQty / maxQty) * 100}%`, background: color }}></div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Table */}
            <div style={{ borderTop: `1px solid ${border}` }}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[400px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                      {["#", "Position Code", "Position Name", "Headcount", "% of Total", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPositions.sort((a, b) => b.employeeQty - a.employeeQty).map((pos, i) => {
                      const color = posColors[i % posColors.length];
                      const pct = totalPositions > 0 ? ((pos.employeeQty / totalPositions) * 100).toFixed(1) : "0";
                      return (
                        <tr key={pos.id} style={{ borderBottom: `1px solid ${border}` }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? "#374151" : "#f9fafb"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color: textSecondary }}>{i + 1}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${color}20`, color }}>{pos.code}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: textPrimary }}>{pos.name}</td>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color }}>{pos.employeeQty}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 rounded-full" style={{ background: isDark ? "#374151" : "#e5e7eb" }}>
                                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }}></div>
                              </div>
                              <span className="text-xs" style={{ color: textSecondary }}>{pct}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => openPosFlyout(pos)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                              style={{ color: textSecondary }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? "#4b5563" : "#f3f4f6"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                              <i className="ri-eye-line text-sm"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Areas */}
        {viewMode === "areas" && (
          <div className="space-y-4">
            {/* Area cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAreas.map((area, i) => {
                const color = posColors[i % posColors.length];
                return (
                  <button
                    key={area.id}
                    onClick={() => openAreaFlyout(area)}
                    className="rounded-xl p-5 text-left cursor-pointer transition-all hover:scale-102"
                    style={{ background: cardBg, border: `2px solid ${border}` }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = color; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = border; }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
                        <i className="ri-map-pin-line text-lg" style={{ color }}></i>
                      </div>
                      <div className="flex items-center gap-1">
                        {area.devices > 0 ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#dcfce7", color: "#16a34a" }}>
                            <i className="ri-device-line mr-0.5"></i>{area.devices} device{area.devices !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#f3f4f6", color: "#6b7280" }}>No device</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold mb-1" style={{ color: textPrimary }}>{area.name}</p>
                    <p className="text-xs mb-3" style={{ color: textSecondary }}>{area.timezone}</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold" style={{ color }}>{area.employees}</p>
                        <p className="text-xs" style={{ color: textSecondary }}>Employees</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: textSecondary }}>{area.code}</p>
                        <p className="text-xs" style={{ color: textSecondary }}>Code</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Areas table */}
            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>All Areas / Locations</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                      {["Area Code", "Area Name", "Timezone", "Devices", "Employees", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAreas.map((area, i) => {
                      const color = posColors[i % posColors.length];
                      return (
                        <tr key={area.id} style={{ borderBottom: `1px solid ${border}` }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? "#374151" : "#f9fafb"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                          <td className="px-4 py-3">
                            <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: `${color}20`, color }}>{area.code}</span>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium" style={{ color: textPrimary }}>{area.name}</td>
                          <td className="px-4 py-3 text-xs" style={{ color: textSecondary }}>{area.timezone}</td>
                          <td className="px-4 py-3">
                            {area.devices > 0 ? (
                              <span className="text-sm font-bold" style={{ color: "#16a34a" }}>{area.devices}</span>
                            ) : (
                              <span className="text-xs" style={{ color: textSecondary }}>—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold" style={{ color }}>{area.employees}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => openAreaFlyout(area)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                              style={{ color: textSecondary }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? "#4b5563" : "#f3f4f6"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                              <i className="ri-eye-line text-sm"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Left-side Flyout Panel */}
      <FlyoutPanel
        open={flyoutOpen}
        onClose={closeFlyout}
        title={getFlyoutTitle()}
        subtitle={getFlyoutSubtitle()}
        side="left"
        width="400px"
        footer={
          <button onClick={closeFlyout} className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium" style={{ background: isDark ? "#374151" : "#f3f4f6", color: textSecondary }}>
            Close
          </button>
        }
      >
        {selectedDept && (
          <div className="space-y-5">
            {/* Color header */}
            <div className="rounded-xl p-4" style={{ background: `${selectedDept.color}15`, border: `1px solid ${selectedDept.color}40` }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${selectedDept.color}25` }}>
                  <i className="ri-building-2-line text-2xl" style={{ color: selectedDept.color }}></i>
                </div>
                <div>
                  <p className="text-base font-bold" style={{ color: textPrimary }}>{selectedDept.name}</p>
                  <p className="text-xs" style={{ color: textSecondary }}>Code: {selectedDept.code}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Active Employees", value: selectedDept.employeeQty, color: "#16a34a", icon: "ri-team-line" },
                { label: "Resigned", value: selectedDept.resignedQty || 0, color: "#dc2626", icon: "ri-user-unfollow-line" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: isDark ? "#374151" : "#f9fafb", border: `1px solid ${border}` }}>
                  <i className={`${s.icon} text-xl mb-1 block`} style={{ color: s.color }}></i>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs" style={{ color: textSecondary }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
              {[
                { label: "Department Code", value: selectedDept.code },
                { label: "Manager", value: selectedDept.manager && selectedDept.manager !== "-" ? selectedDept.manager : "Not assigned" },
                { label: "Sub-departments", value: selectedDept.children.length > 0 ? selectedDept.children.map(c => c.name).join(", ") : "None" },
              ].map((row, i) => (
                <div key={row.label} className="flex items-start justify-between px-4 py-3" style={{ borderBottom: i < 2 ? `1px solid ${border}` : "none" }}>
                  <span className="text-xs font-medium" style={{ color: textSecondary }}>{row.label}</span>
                  <span className="text-xs font-semibold text-right max-w-[180px]" style={{ color: textPrimary }}>{row.value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => { showToast("info", "Edit Department", "Opening department editor..."); closeFlyout(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap text-white"
              style={{ background: selectedDept.color }}
            >
              <i className="ri-edit-line"></i> Edit Department
            </button>
          </div>
        )}

        {selectedPos && (
          <div className="space-y-5">
            <div className="rounded-xl p-4" style={{ background: "#e0f2fe", border: "1px solid #bae6fd" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#bae6fd" }}>
                  <i className="ri-briefcase-line text-2xl" style={{ color: "#0891b2" }}></i>
                </div>
                <div>
                  <p className="text-base font-bold" style={{ color: textPrimary }}>{selectedPos.name}</p>
                  <p className="text-xs" style={{ color: textSecondary }}>Code: {selectedPos.code}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl p-5 text-center" style={{ background: isDark ? "#374151" : "#f9fafb", border: `1px solid ${border}` }}>
              <p className="text-4xl font-bold mb-1" style={{ color: "#0891b2" }}>{selectedPos.employeeQty}</p>
              <p className="text-sm" style={{ color: textSecondary }}>Employees in this position</p>
              <p className="text-xs mt-1" style={{ color: textSecondary }}>
                {totalPositions > 0 ? ((selectedPos.employeeQty / totalPositions) * 100).toFixed(1) : 0}% of total workforce
              </p>
            </div>
            <button
              onClick={() => { showToast("info", "Edit Position", "Opening position editor..."); closeFlyout(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap text-white"
              style={{ background: "#0891b2" }}
            >
              <i className="ri-edit-line"></i> Edit Position
            </button>
          </div>
        )}

        {selectedArea && (
          <div className="space-y-5">
            <div className="rounded-xl p-4" style={{ background: "#ede9fe", border: "1px solid #ddd6fe" }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#ddd6fe" }}>
                  <i className="ri-map-pin-line text-2xl" style={{ color: "#7c3aed" }}></i>
                </div>
                <div>
                  <p className="text-base font-bold" style={{ color: textPrimary }}>{selectedArea.name}</p>
                  <p className="text-xs" style={{ color: textSecondary }}>{selectedArea.timezone}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Employees", value: selectedArea.employees, color: "#7c3aed", icon: "ri-team-line" },
                { label: "Devices", value: selectedArea.devices, color: "#16a34a", icon: "ri-device-line" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-4 text-center" style={{ background: isDark ? "#374151" : "#f9fafb", border: `1px solid ${border}` }}>
                  <i className={`${s.icon} text-xl mb-1 block`} style={{ color: s.color }}></i>
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs" style={{ color: textSecondary }}>{s.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
              {[
                { label: "Area Code", value: selectedArea.code },
                { label: "Timezone", value: selectedArea.timezone },
                { label: "Device Status", value: selectedArea.devices > 0 ? `${selectedArea.devices} device(s) registered` : "No devices registered" },
              ].map((row, i) => (
                <div key={row.label} className="flex items-center justify-between px-4 py-3" style={{ borderBottom: i < 2 ? `1px solid ${border}` : "none" }}>
                  <span className="text-xs font-medium" style={{ color: textSecondary }}>{row.label}</span>
                  <span className="text-xs font-semibold" style={{ color: textPrimary }}>{row.value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { showToast("info", "Edit Area", "Opening area editor..."); closeFlyout(); }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold cursor-pointer whitespace-nowrap text-white"
              style={{ background: "#7c3aed" }}
            >
              <i className="ri-edit-line"></i> Edit Area
            </button>
          </div>
        )}
      </FlyoutPanel>
    </AppLayout>
  );
}
