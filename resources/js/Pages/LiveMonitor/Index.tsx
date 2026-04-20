import { router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from "react";
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import type { PageProps } from '@/types';

interface LiveDevice { id: number; sn: string; name: string; area: string; status: string; ip: string; users: number; }
interface Props extends PageProps { initialFeed: any[]; devices: LiveDevice[]; }

type ExtendedPunch = any;


export default function LiveMonitorPage() {
  const { isDark } = useTheme();
  const { props } = usePage<Props>();
  const deviceList = props.devices ?? [];
  const [punches, setPunches] = useState<any[]>(props.initialFeed ?? []);
  const [isLive, setIsLive] = useState(true);
  const lastTimestampRef = useRef<string | null>(
    props.initialFeed?.length ? props.initialFeed[0]?.timestamp ?? null : null
  );
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<string>("all");
  const [stats, setStats] = useState({ total: 247, checkIn: 189, checkOut: 58, failed: 3 });
  const [deviceHeartbeats, setDeviceHeartbeats] = useState<Record<string, number>>({});
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBeep = useCallback((failed: boolean) => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = failed ? 300 : 880;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // Audio not available
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (!isLive) return;
    const poll = async () => {
      try {
        const url = lastTimestampRef.current
          ? `/api/live-monitor/feed?since=${encodeURIComponent(lastTimestampRef.current)}`
          : '/api/live-monitor/feed';
        const res = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json' } });
        if (!res.ok) return;
        const data = await res.json();
        const newPunches: any[] = data.feed ?? [];
        if (newPunches.length > 0) {
          lastTimestampRef.current = newPunches[0].timestamp ?? lastTimestampRef.current;
          setPunches(prev => [...newPunches, ...prev].slice(0, 100));
          setStats(prev => ({
            total: prev.total + newPunches.length,
            checkIn: prev.checkIn + newPunches.filter((p: any) => p.verifyMode === 'Check-In' || p.type === 'IN').length,
            checkOut: prev.checkOut + newPunches.filter((p: any) => p.verifyMode === 'Check-Out' || p.type === 'OUT').length,
            failed: prev.failed + newPunches.filter((p: any) => p.status === 'failed').length,
          }));
          if (newPunches.some((p: any) => p.status === 'failed')) playBeep(true);
          else if (newPunches.length > 0) playBeep(false);
        }
        // Update heartbeats from server response
        if (data.heartbeats) {
          setDeviceHeartbeats((prev: Record<string, number>) => {
            const next = { ...prev };
            Object.entries(data.heartbeats as Record<string, number>).forEach(([sn, online]) => {
              if (online) next[sn] = Date.now();
            });
            return next;
          });
        }
      } catch { /* network error — silently ignore */ }
    };
    intervalRef.current = setInterval(poll, 4000);
    poll(); // immediate first call
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isLive, playBeep]);

  // Heartbeats updated via the poll response above — no simulation needed

  const bg = isDark ? "#111827" : "#f8fafc";
  const cardBg = isDark ? "#1f2937" : "#ffffff";
  const border = isDark ? "#374151" : "#e5e7eb";
  const textPrimary = isDark ? "#f9fafb" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";

  const punchTypeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    fingerprint: { icon: "ri-fingerprint-line", color: "#16a34a", bg: "#dcfce7" },
    face: { icon: "ri-user-smile-line", color: "#0891b2", bg: "#e0f2fe" },
    card: { icon: "ri-bank-card-line", color: "#7c3aed", bg: "#ede9fe" },
    password: { icon: "ri-lock-password-line", color: "#f59e0b", bg: "#fef9c3" },
  };

  const verifyModeConfig: Record<string, { color: string; bg: string }> = {
    "Check-In": { color: "#16a34a", bg: "#dcfce7" },
    "Check-Out": { color: "#dc2626", bg: "#fee2e2" },
    "Break": { color: "#f59e0b", bg: "#fef9c3" },
    "Return": { color: "#0891b2", bg: "#e0f2fe" },
  };

  const avatarColors = ["#16a34a", "#0891b2", "#7c3aed", "#d97706", "#dc2626", "#db2777"];
  const getAvatarColor = (name: string) => avatarColors[name.charCodeAt(0) % avatarColors.length];
  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const onlineDevices = deviceList.filter(d => d.status === "online");
  const offlineDevices = deviceList.filter(d => d.status === "offline");

  const filteredPunches = punches.filter(p => {
    if (filterMode === "all") return true;
    if (filterMode === "checkin") return p.verifyMode === "Check-In";
    if (filterMode === "checkout") return p.verifyMode === "Check-Out";
    if (filterMode === "failed") return p.status === "failed";
    if (filterMode === "fingerprint") return p.punchType === "fingerprint";
    if (filterMode === "face") return p.punchType === "face";
    return true;
  });

  const isHeartbeatRecent = (devId: string) => {
    const last = deviceHeartbeats[devId];
    return last && Date.now() - last < 8000;
  };

  const mapUrl = "https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d126832.0!2d3.3792!3d6.5244!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sng!4v1713200000000!5m2!1sen!2sng";

  return (
    <AppLayout title="">
      <div className="p-4 md:p-6" style={{ background: bg, minHeight: "100vh" }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold" style={{ color: textPrimary }}>Live Attendance Monitor</h1>
              {isLive && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: "#dcfce7", color: "#16a34a" }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#16a34a" }}></span>
                  LIVE
                </span>
              )}
            </div>
            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>Real-time punch feed across all {deviceList.length} devices</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Sound toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
              style={{
                background: soundEnabled ? "#fef9c3" : (isDark ? "#374151" : "#f3f4f6"),
                color: soundEnabled ? "#ca8a04" : textSecondary,
                border: `1px solid ${soundEnabled ? "#fde68a" : border}`,
              }}
              title={soundEnabled ? "Disable sound alerts" : "Enable sound alerts"}
            >
              <i className={soundEnabled ? "ri-volume-up-line" : "ri-volume-mute-line"}></i>
              <span className="hidden sm:inline">{soundEnabled ? "Sound On" : "Sound Off"}</span>
            </button>
            <button
              onClick={() => setIsLive(!isLive)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
              style={{
                background: isLive ? "#fee2e2" : "#dcfce7",
                color: isLive ? "#dc2626" : "#16a34a",
                border: `1px solid ${isLive ? "#fecaca" : "#bbf7d0"}`,
              }}
            >
              <i className={isLive ? "ri-pause-line" : "ri-play-line"}></i>
              {isLive ? "Pause" : "Resume"}
            </button>
            <button
              onClick={() => setPunches([])}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap"
              style={{ background: isDark ? "#374151" : "#f3f4f6", color: textSecondary, border: `1px solid ${border}` }}
            >
              <i className="ri-delete-bin-line"></i>
              <span className="hidden sm:inline">Clear</span>
            </button>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Total Punches Today", value: stats.total, icon: "ri-time-line", color: textPrimary, bg: isDark ? "#374151" : "#f3f4f6" },
            { label: "Check-Ins", value: stats.checkIn, icon: "ri-login-box-line", color: "#16a34a", bg: "#dcfce7" },
            { label: "Check-Outs", value: stats.checkOut, icon: "ri-logout-box-line", color: "#dc2626", bg: "#fee2e2" },
            { label: "Failed Attempts", value: stats.failed, icon: "ri-error-warning-line", color: "#f59e0b", bg: "#fef9c3" },
          ].map(s => (
            <div key={s.label} className="p-3 md:p-4 rounded-xl flex items-center gap-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <i className={`${s.icon} text-base`} style={{ color: s.color }}></i>
              </div>
              <div>
                <p className="text-lg md:text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs" style={{ color: textSecondary }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Live feed */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden flex flex-col" style={{ background: cardBg, border: `1px solid ${border}`, maxHeight: "640px" }}>
            {/* Feed header */}
            <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 flex-wrap gap-2" style={{ borderBottom: `1px solid ${border}` }}>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Live Punch Feed</h3>
                {isLive && <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#16a34a" }}></span>}
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: isDark ? "#374151" : "#f3f4f6", color: textSecondary }}>{filteredPunches.length}</span>
              </div>
              {/* Filter pills */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { key: "all", label: "All" },
                  { key: "checkin", label: "In" },
                  { key: "checkout", label: "Out" },
                  { key: "failed", label: "Failed" },
                  { key: "fingerprint", label: "FP" },
                  { key: "face", label: "Face" },
                ].map(f => (
                  <button key={f.key} onClick={() => setFilterMode(f.key)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
                    style={{
                      background: filterMode === f.key ? "#16a34a" : (isDark ? "#374151" : "#f3f4f6"),
                      color: filterMode === f.key ? "#ffffff" : textSecondary,
                    }}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Feed list */}
            <div className="flex-1 overflow-y-auto">
              {filteredPunches.map((punch, idx) => {
                const pt = punchTypeConfig[punch.punchType] || punchTypeConfig.fingerprint;
                const vm = verifyModeConfig[punch.verifyMode] || { color: "#6b7280", bg: "#f3f4f6" };
                const isNew = idx === 0 && isLive;
                return (
                  <div
                    key={punch.id}
                    className="flex items-center gap-3 px-4 py-3 transition-all"
                    style={{
                      borderBottom: `1px solid ${border}`,
                      background: punch.status === "failed"
                        ? (isDark ? "#2d1515" : "#fff5f5")
                        : isNew ? (isDark ? "#14532d20" : "#f0fdf4") : "transparent",
                      animation: isNew ? "liveIn 0.35s ease" : undefined,
                    }}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: getAvatarColor(punch.employeeName) }}>
                        {getInitials(punch.employeeName)}
                      </div>
                      {/* Punch type badge */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: pt.bg, border: `2px solid ${cardBg}` }}>
                        <i className={`${pt.icon} text-xs`} style={{ color: pt.color, fontSize: "9px" }}></i>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold" style={{ color: textPrimary }}>{punch.employeeName}</p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: vm.bg, color: vm.color }}>{punch.verifyMode}</span>
                        {punch.status === "failed" && (
                          <span className="px-1.5 py-0.5 rounded text-xs font-bold" style={{ background: "#fee2e2", color: "#dc2626" }}>
                            <i className="ri-error-warning-line mr-0.5"></i>FAILED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="text-xs" style={{ color: textSecondary }}>{punch.department}</span>
                        <span className="text-xs" style={{ color: textSecondary }}>
                          <i className="ri-device-line mr-0.5"></i>{punch.deviceName}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs" style={{ color: pt.color }}>
                          <i className={pt.icon}></i>
                          <span className="capitalize">{punch.punchType}</span>
                        </span>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-mono font-bold" style={{ color: textPrimary }}>{punch.timestamp.split(" ")[1]}</p>
                      <p className="text-xs" style={{ color: textSecondary }}>{punch.timestamp.split(" ")[0]}</p>
                    </div>
                  </div>
                );
              })}
              {filteredPunches.length === 0 && (
                <div className="py-16 text-center" style={{ color: textSecondary }}>
                  <i className="ri-time-line text-4xl mb-3 block"></i>
                  <p className="text-sm">Waiting for punches...</p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="space-y-4">
            {/* Device heartbeat status */}
            <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Device Heartbeats</h3>
                  <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{onlineDevices.length} online · {offlineDevices.length} offline</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#dcfce7", color: "#16a34a" }}>
                  {onlineDevices.length}/{deviceList.length}
                </span>
              </div>
              <div className="p-3 space-y-1.5 max-h-72 overflow-y-auto">
                {deviceList.map(dev => {
                  const isOnline = dev.status === "online";
                  const isSyncing = dev.status === "syncing";
                  const hasRecentHB = isHeartbeatRecent(dev.id);
                  return (
                    <button
                      key={dev.id}
                      onClick={() => { setSelectedDevice(selectedDevice === dev.id ? null : dev.id); router.visit(`/devices/${dev.id}`); }}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors text-left"
                      style={{
                        background: selectedDevice === dev.id ? (isDark ? "#374151" : "#f0fdf4") : "transparent",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? "#374151" : "#f9fafb"; }}
                      onMouseLeave={(e) => { if (selectedDevice !== dev.id) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      {/* Status dot with heartbeat pulse */}
                      <div className="relative flex-shrink-0">
                        <div className="w-2.5 h-2.5 rounded-full" style={{
                          background: isOnline ? "#16a34a" : isSyncing ? "#f59e0b" : "#dc2626",
                        }}></div>
                        {hasRecentHB && isOnline && (
                          <div className="absolute inset-0 rounded-full animate-ping" style={{ background: "#16a34a", opacity: 0.4 }}></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: textPrimary }}>{dev.name}</p>
                        <p className="text-xs truncate" style={{ color: textSecondary }}>{dev.area} · {dev.ip}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold" style={{ color: isOnline ? "#16a34a" : "#dc2626" }}>
                          {isOnline ? "Online" : isSyncing ? "Sync" : "Offline"}
                        </p>
                        <p className="text-xs font-mono" style={{ color: textSecondary }}>{dev.users}u</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Map */}
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${border}` }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: cardBg, borderBottom: `1px solid ${border}` }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Device Locations</h3>
                  <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Lagos, Nigeria</p>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: textSecondary }}>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#16a34a" }}></span>Online</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: "#dc2626" }}></span>Offline</span>
                </div>
              </div>
              <div style={{ height: "200px" }}>
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="200"
                  style={{ border: 0, display: "block" }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Device Locations Map"
                ></iframe>
              </div>
            </div>

            {/* Recent activity summary */}
            <div className="rounded-xl p-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <h3 className="text-sm font-semibold mb-3" style={{ color: textPrimary }}>Last 10 Minutes</h3>
              <div className="space-y-2">
                {(["Check-In", "Check-Out", "Break", "Return"] as const).map(mode => {
                  const count = punches.filter(p => p.verifyMode === mode).length;
                  const vm = verifyModeConfig[mode];
                  return (
                    <div key={mode} className="flex items-center gap-3">
                      <span className="text-xs w-20 flex-shrink-0" style={{ color: textSecondary }}>{mode}</span>
                      <div className="flex-1 h-2 rounded-full" style={{ background: isDark ? "#374151" : "#f3f4f6" }}>
                        <div className="h-2 rounded-full" style={{ width: `${Math.min(100, (count / Math.max(1, punches.length)) * 100 * 3)}%`, background: vm.color }}></div>
                      </div>
                      <span className="text-xs font-bold w-6 text-right flex-shrink-0" style={{ color: vm.color }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes liveIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppLayout>
  );
}
