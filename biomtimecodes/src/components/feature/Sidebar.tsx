import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

interface NavItem {
  icon: string;
  label: string;
  path: string;
}

interface NavGroup {
  group: string;
  icon?: string;
  items: NavItem[];
  expandable?: boolean;
}

const navGroups: NavGroup[] = [
  {
    group: "Dashboard",
    items: [{ icon: "ri-dashboard-line", label: "Dashboard", path: "/" }],
  },
  {
    group: "Devices",
    items: [{ icon: "ri-device-line", label: "Devices", path: "/devices" }],
  },
  {
    group: "Organization",
    icon: "ri-building-line",
    expandable: true,
    items: [
      { icon: "ri-building-2-line", label: "Department", path: "/organization/departments" },
      { icon: "ri-briefcase-line", label: "Position", path: "/organization/positions" },
      { icon: "ri-map-pin-line", label: "Area", path: "/organization/areas" },
      { icon: "ri-node-tree", label: "Org Chart", path: "/organization/chart" },
    ],
  },
  {
    group: "Employees",
    items: [{ icon: "ri-team-line", label: "Employees", path: "/employees" }],
  },
  {
    group: "Attendance",
    items: [{ icon: "ri-time-line", label: "Attendance", path: "/attendance" }],
  },
  {
    group: "Shifts",
    items: [{ icon: "ri-calendar-schedule-line", label: "Shift Management", path: "/shifts" }],
  },
  {
    group: "Live Monitor",
    items: [{ icon: "ri-live-line", label: "Live Monitor", path: "/live-monitor" }],
  },
  {
    group: "Reports",
    items: [{ icon: "ri-bar-chart-2-line", label: "Reports", path: "/reports" }],
  },
  {
    group: "Analytics",
    items: [{ icon: "ri-pie-chart-2-line", label: "Analytics", path: "/analytics" }],
  },
  {
    group: "Settings",
    items: [{ icon: "ri-settings-3-line", label: "Settings", path: "/settings" }],
  },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark } = useTheme();
  const [orgExpanded, setOrgExpanded] = useState(
    location.pathname.startsWith("/organization")
  );

  const authRaw = localStorage.getItem("eatngobio_auth");
  const auth = authRaw ? JSON.parse(authRaw) : { user: "Admin", role: "Super Admin" };

  const handleLogout = () => {
    localStorage.removeItem("eatngobio_auth");
    navigate("/login");
  };

  const isActive = (path: string) => location.pathname === path;
  const isOrgActive = location.pathname.startsWith("/organization");

  const bg = isDark ? "#111827" : "#ffffff";
  const border = isDark ? "#1f2937" : "#e5e7eb";
  const textPrimary = isDark ? "#f9fafb" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const hoverBg = isDark ? "#1f2937" : "#f3f4f6";
  const activeBg = isDark ? "#14532d20" : "#f0fdf4";
  const activeColor = "#16a34a";
  const userCardBg = isDark ? "#1f2937" : "#f9fafb";

  return (
    <aside
      className="flex flex-col h-screen fixed left-0 top-0 z-30 transition-all duration-300"
      style={{
        width: collapsed ? "72px" : "260px",
        background: bg,
        borderRight: `1px solid ${border}`,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: `1px solid ${border}`, minHeight: "64px" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
        >
          <i className="ri-fingerprint-line text-white text-lg"></i>
        </div>
        {!collapsed && (
          <div className="overflow-hidden flex-1">
            <span
              className="font-bold text-base tracking-tight whitespace-nowrap"
              style={{ color: textPrimary }}
            >
              EatNGo<span style={{ color: "#16a34a" }}>Bio</span>
            </span>
            <p className="text-xs whitespace-nowrap" style={{ color: textSecondary }}>
              Attendance System
            </p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors flex-shrink-0"
          style={{ color: textSecondary }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = hoverBg;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <i className={collapsed ? "ri-menu-unfold-line text-sm" : "ri-menu-fold-line text-sm"}></i>
        </button>
      </div>

      {/* User card */}
      {!collapsed && (
        <div className="mx-3 my-3 p-3 rounded-xl" style={{ background: userCardBg, border: `1px solid ${border}` }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
            >
              {auth.user?.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-semibold whitespace-nowrap capitalize" style={{ color: textPrimary }}>
                {auth.user}
              </p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: "#dcfce7", color: "#16a34a" }}
              >
                {auth.role}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navGroups.map((group) => {
          if (group.expandable) {
            // Organization group with submenu
            return (
              <div key={group.group} className="mb-0.5">
                <button
                  onClick={() => !collapsed && setOrgExpanded(!orgExpanded)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all whitespace-nowrap"
                  style={{
                    background: isOrgActive ? activeBg : "transparent",
                    color: isOrgActive ? activeColor : textSecondary,
                  }}
                  onMouseEnter={(e) => {
                    if (!isOrgActive) (e.currentTarget as HTMLButtonElement).style.background = hoverBg;
                  }}
                  onMouseLeave={(e) => {
                    if (!isOrgActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                  }}
                  title={collapsed ? "Organization" : undefined}
                >
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    <i className="ri-building-line text-base"></i>
                  </div>
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 text-left">Organization</span>
                      <i className={orgExpanded ? "ri-arrow-up-s-line text-sm" : "ri-arrow-down-s-line text-sm"}></i>
                    </>
                  )}
                </button>

                {!collapsed && orgExpanded && (
                  <div className="ml-4 mt-0.5 pl-3" style={{ borderLeft: `2px solid ${border}` }}>
                    {group.items.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mb-0.5 cursor-pointer transition-all whitespace-nowrap text-left"
                        style={{
                          background: isActive(item.path) ? activeBg : "transparent",
                          color: isActive(item.path) ? activeColor : textSecondary,
                          fontWeight: isActive(item.path) ? 600 : 400,
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive(item.path)) (e.currentTarget as HTMLButtonElement).style.background = hoverBg;
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive(item.path)) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                        }}
                      >
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Regular single-item groups
          return group.items.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 cursor-pointer transition-all whitespace-nowrap"
              style={{
                background: isActive(item.path) ? activeBg : "transparent",
                color: isActive(item.path) ? activeColor : textSecondary,
                fontWeight: isActive(item.path) ? 600 : 400,
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) (e.currentTarget as HTMLButtonElement).style.background = hoverBg;
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
              title={collapsed ? item.label : undefined}
            >
              <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                <i className={`${item.icon} text-base`}></i>
              </div>
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ));
        })}
      </nav>

      {/* Bottom: ADMS status + logout */}
      <div className="px-3 py-3" style={{ borderTop: `1px solid ${border}` }}>
        {!collapsed ? (
          <div className="p-3 rounded-xl" style={{ background: userCardBg, border: `1px solid ${border}` }}>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#16a34a" }}></div>
              <span className="text-xs font-semibold" style={{ color: "#16a34a" }}>ADMS Online</span>
            </div>
            <p className="text-xs font-mono truncate" style={{ color: textSecondary }}>
              /iclock/cdata
            </p>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors whitespace-nowrap"
              style={{ color: "#dc2626" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              <i className="ri-logout-box-line"></i>
              Sign Out
            </button>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center py-2 rounded-xl cursor-pointer transition-colors"
            style={{ color: "#dc2626" }}
            title="Sign Out"
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "#fef2f2";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <i className="ri-logout-box-line text-base"></i>
          </button>
        )}
      </div>
    </aside>
  );
}
