import { useState, useEffect } from "react";
import { mockLiveFeed } from "@/mocks/dashboard";
import { useTheme } from "@/contexts/ThemeContext";

export default function LiveFeed() {
  const { isDark } = useTheme();
  const [feed, setFeed] = useState(mockLiveFeed);
  const [newIds, setNewIds] = useState<string[]>([]);

  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e5e7eb";
  const innerBg = isDark ? "#0f172a" : "#f8fafc";
  const innerBorder = isDark ? "#1e293b" : "#e5e7eb";
  const textPrimary = isDark ? "#f1f5f9" : "#111827";
  const textSecondary = isDark ? "#94a3b8" : "#6b7280";
  const textMuted = isDark ? "#64748b" : "#9ca3af";

  useEffect(() => {
    const names = ["Kemi Adeyinka", "Uche Nwosu", "Sade Okafor", "Musa Ibrahim", "Chioma Eze", "Tunde Bello"];
    const devices = ["Main Gate - Entry", "Admin Block", "Canteen A - Entry", "Reception Desk"];
    const bgColors = ["#16a34a", "#ea580c", "#dc2626", "#0d9488", "#7c3aed", "#d97706"];

    const interval = setInterval(() => {
      const name = names[Math.floor(Math.random() * names.length)];
      const initials = name.split(" ").map((n) => n[0]).join("");
      const bgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
      const newEntry = {
        id: `live-${Date.now()}`,
        employeeId: `EMP0${Math.floor(Math.random() * 400 + 100)}`,
        name,
        initials,
        department: "Operations",
        device: devices[Math.floor(Math.random() * devices.length)],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
        type: Math.random() > 0.3 ? "IN" : "OUT",
        color: bgColor,
      };
      setFeed((prev) => [newEntry, ...prev.slice(0, 14)]);
      setNewIds((prev) => [...prev, newEntry.id]);
      setTimeout(() => setNewIds((prev) => prev.filter((id) => id !== newEntry.id)), 1200);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl p-5 h-full flex flex-col" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base" style={{ color: textPrimary }}>Live Feed</h3>
          <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Real-time punch events</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#16a34a" }}></div>
          <span className="text-xs font-medium" style={{ color: "#16a34a" }}>Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ maxHeight: "320px" }}>
        {feed.map((entry) => {
          const isNew = newIds.includes(entry.id);
          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 p-3 rounded-xl transition-all duration-500"
              style={{
                background: isNew ? "#f0fdf4" : innerBg,
                border: `1px solid ${isNew ? "#bbf7d0" : innerBorder}`,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white"
                style={{ background: entry.color }}
              >
                {entry.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: textPrimary }}>{entry.name}</p>
                <p className="text-xs truncate" style={{ color: textSecondary }}>{entry.device}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    background: entry.type === "IN" ? "#dcfce7" : "#fee2e2",
                    color: entry.type === "IN" ? "#16a34a" : "#dc2626",
                  }}
                >
                  {entry.type === "IN" ? "Check In" : "Check Out"}
                </span>
                <span className="text-xs font-mono" style={{ color: textMuted }}>{entry.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
