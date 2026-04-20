import { useNavigate } from "react-router-dom";
import { mockDevices } from "@/mocks/dashboard";
import { useTheme } from "@/contexts/ThemeContext";

const statusConfig = {
  online: { color: "#16a34a", label: "Online", bg: "#dcfce7" },
  offline: { color: "#dc2626", label: "Offline", bg: "#fee2e2" },
  syncing: { color: "#d97706", label: "Syncing", bg: "#fef3c7" },
};

export default function DeviceStatusGrid() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e5e7eb";
  const innerBg = isDark ? "#0f172a" : "#f8fafc";
  const textPrimary = isDark ? "#f1f5f9" : "#111827";
  const textSecondary = isDark ? "#94a3b8" : "#6b7280";
  const textMuted = isDark ? "#64748b" : "#9ca3af";

  return (
    <div className="rounded-xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-base" style={{ color: textPrimary }}>Device Status</h3>
          <p className="text-xs mt-0.5" style={{ color: textSecondary }}>10 of 87 devices connected</p>
        </div>
        <button
          onClick={() => navigate("/devices")}
          className="text-xs font-medium cursor-pointer transition-colors whitespace-nowrap flex items-center gap-1"
          style={{ color: "#16a34a" }}
        >
          View All <i className="ri-arrow-right-line"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {mockDevices.map((device) => {
          const status = statusConfig[device.status as keyof typeof statusConfig];
          return (
            <div
              key={device.id}
              onClick={() => navigate(`/devices/${device.id}`)}
              className="p-4 rounded-xl cursor-pointer transition-all"
              style={{
                background: innerBg,
                border: `1px solid ${cardBorder}`,
                borderLeft: device.status === "offline" ? "3px solid #dc2626" : device.status === "syncing" ? "3px solid #d97706" : `3px solid #16a34a`,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = status.color + "60";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = cardBorder;
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-semibold leading-tight pr-2" style={{ color: textPrimary }}>
                  {device.name}
                </p>
                <span
                  className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap"
                  style={{ background: status.bg, color: status.color }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full bg-current ${device.status === "online" ? "animate-pulse" : ""}`}></span>
                  {status.label}
                </span>
              </div>
              <p className="text-xs font-mono mb-1" style={{ color: textMuted }}>{device.sn}</p>
              <div className="flex items-center gap-1 mb-3">
                <i className="ri-map-pin-line text-xs" style={{ color: textSecondary }}></i>
                <p className="text-xs truncate" style={{ color: textSecondary }}>{device.location}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: textMuted }}>
                  {device.status === "offline"
                    ? `Last: ${new Date(device.lastSeen).toLocaleDateString()}`
                    : new Date(device.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
                <button
                  className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                  style={{ background: "#dcfce7", color: "#16a34a" }}
                  onClick={(e) => { e.stopPropagation(); }}
                  title="Sync device"
                >
                  <i className="ri-refresh-line text-xs"></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
