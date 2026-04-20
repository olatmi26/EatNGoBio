import { useState, useEffect } from "react";
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/Components/base/Toast';
import { router, usePage } from '@inertiajs/react';

interface PendingDevice {
  id: number;
  sn: string;
  ip: string;
  model: string;
  firmware: string;
  firstSeen: string;
  lastHeartbeat: string;
  requestCount: number;
  suggestedName: string;
  status: 'pending' | 'provisioning' | 'rejected' | 'approved';
}

interface Location {
  id: number;
  name: string;
  code: string;
}

interface Props {
  pendingDevices?: PendingDevice[];
  locations?: Location[];
  admsSettings?: {
    autoProvision?: boolean;
    requireConfirmation?: boolean;
  };
}

export default function DeviceProvisioning({ 
  pendingDevices: initialPending = [], 
  locations: locationOptions = [],
  admsSettings = { autoProvision: true, requireConfirmation: true }
}: Props) {
  const { isDark } = useTheme();
  const { showToast } = useToast();
  const { props } = usePage() as any;
  
  const [pending, setPending] = useState<PendingDevice[]>(initialPending);
  const [provisioning, setProvisioning] = useState<number | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [confirmForm, setConfirmForm] = useState({ 
    name: "", 
    location_id: "", 
    timezone: "Africa/Lagos" 
  });
  const [isLoading, setIsLoading] = useState(false);

  const cardBg = isDark ? "#1f2937" : "#ffffff";
  const border = isDark ? "#374151" : "#e5e7eb";
  const textPrimary = isDark ? "#f9fafb" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const inputBg = isDark ? "#374151" : "#f9fafb";
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
  const inputClass = "w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/20";
  const labelStyle: React.CSSProperties = { 
    color: textSecondary, 
    fontSize: "12px", 
    fontWeight: 500, 
    marginBottom: "4px", 
    display: "block" 
  };

  // Fetch fresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      router.reload({ only: ['pendingDevices'], preserveState: true });
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const openConfirm = (dev: PendingDevice) => {
    setConfirmId(dev.id);
    setConfirmForm({ 
      name: dev.suggestedName || dev.sn, 
      location_id: locationOptions[0]?.id?.toString() || "", 
      timezone: "Africa/Lagos" 
    });
  };

  const handleProvision = () => {
    if (!confirmId) return;
    
    setIsLoading(true);
    
    router.post(`/devices/approve/${confirmId}`, confirmForm, {
      preserveScroll: true,
      onSuccess: () => {
        setPending(prev => prev.filter(d => d.id !== confirmId));
        setConfirmId(null);
        showToast("success", "Device Provisioned", `${confirmForm.name} is now online and syncing automatically`);
        setIsLoading(false);
      },
      onError: (errors) => {
        showToast("error", "Provisioning Failed", errors.message || "Could not provision device");
        setIsLoading(false);
      }
    });
  };

  const handleReject = (id: number) => {
    router.post(`/devices/reject/${id}`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setPending(prev => prev.map(d => d.id === id ? { ...d, status: "rejected" } : d));
        const dev = pending.find(d => d.id === id);
        showToast("info", "Device Rejected", `${dev?.sn} has been rejected and will not auto-provision`);
      },
      onError: () => {
        showToast("error", "Action Failed", "Could not reject device");
      }
    });
  };

  const handleReconsider = (id: number) => {
    router.post(`/devices/reconsider/${id}`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setPending(prev => prev.map(d => d.id === id ? { ...d, status: "pending" } : d));
        showToast("info", "Device Reconsidered", "Device moved back to pending queue");
      }
    });
  };

  const pendingCount = pending.filter(p => p.status === "pending").length;
  const activeDevices = (props.devices || []).filter((d: any) => d.status === "online").length;
  const offlineDevices = (props.devices || []).filter((d: any) => d.status === "offline").length;

  return (
    <div className="space-y-5">
      {/* ADMS Status Banner */}
      <div className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4" 
           style={{ background: isDark ? "#14532d20" : "#f0fdf4", border: "1px solid #bbf7d0" }}>
        <div className="flex items-center gap-3 flex-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" 
               style={{ background: "#dcfce7" }}>
            <i className="ri-server-line text-lg" style={{ color: "#16a34a" }}></i>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#16a34a" }}>ADMS Server Active</p>
            <p className="text-xs font-mono" style={{ color: textSecondary }}>
              Listening on /iclock/cdata · Port {props.settings?.adms_port || '8089'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: textSecondary }}>
          <span><span className="font-bold" style={{ color: "#16a34a" }}>{activeDevices}</span> online</span>
          <span><span className="font-bold" style={{ color: "#dc2626" }}>{offlineDevices}</span> offline</span>
          <span><span className="font-bold" style={{ color: "#d97706" }}>{pendingCount}</span> pending</span>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl p-5" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <h3 className="text-sm font-semibold mb-4" style={{ color: textPrimary }}>How Auto-Provisioning Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { step: "1", icon: "ri-settings-3-line", color: "#0891b2", title: "IT Configures Device", desc: "IT officer sets ADMS cloud URL and port on the physical device" },
            { step: "2", icon: "ri-wifi-line", color: "#d97706", title: "Device Connects", desc: "Device sends heartbeat to /iclock/cdata — appears here as Pending" },
            { step: "3", icon: "ri-checkbox-circle-line", color: "#16a34a", title: "Admin Confirms", desc: "You review device info, assign a name and area, then confirm" },
            { step: "4", icon: "ri-refresh-line", color: "#7c3aed", title: "Auto Online & Sync", desc: "Device goes Online immediately and starts syncing attendance data" },
          ].map(s => (
            <div key={s.step} className="flex flex-col items-center text-center p-3 rounded-xl" 
                 style={{ background: isDark ? "#374151" : "#f9fafb" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2" 
                   style={{ background: `${s.color}20` }}>
                <i className={`${s.icon} text-base`} style={{ color: s.color }}></i>
              </div>
              <p className="text-xs font-semibold mb-1" style={{ color: textPrimary }}>{s.title}</p>
              <p className="text-xs leading-relaxed" style={{ color: textSecondary }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pending Devices */}
      <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Pending Device Requests</h3>
            <p className="text-xs mt-0.5" style={{ color: textSecondary }}>
              Devices that have connected to the ADMS server and are awaiting confirmation
            </p>
          </div>
          {pendingCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold animate-pulse" 
                  style={{ background: "#fef9c3", color: "#ca8a04" }}>
              {pendingCount} awaiting
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="py-14 text-center">
            <i className="ri-device-line text-4xl mb-3 block" style={{ color: textSecondary }}></i>
            <p className="text-sm font-medium" style={{ color: textPrimary }}>No pending devices</p>
            <p className="text-xs mt-1" style={{ color: textSecondary }}>
              New devices will appear here when they connect to the ADMS server
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: border }}>
            {pending.map(dev => (
              <div key={dev.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center" 
                           style={{ background: dev.status === "rejected" ? "#fee2e2" : "#fef9c3" }}>
                        <i className="ri-device-line text-xl" 
                           style={{ color: dev.status === "rejected" ? "#dc2626" : "#ca8a04" }}></i>
                      </div>
                      {dev.status === "pending" && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" 
                              style={{ background: "#fef9c3", border: "2px solid #ca8a04" }}>
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" 
                                style={{ background: "#ca8a04" }}></span>
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className="text-sm font-semibold" style={{ color: textPrimary }}>
                          {dev.suggestedName || dev.sn}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                          background: dev.status === "pending" ? "#fef9c3" : 
                                     dev.status === "provisioning" ? "#dcfce7" : "#fee2e2",
                          color: dev.status === "pending" ? "#ca8a04" : 
                                 dev.status === "provisioning" ? "#16a34a" : "#dc2626",
                        }}>
                          {dev.status === "pending" ? "Pending Confirmation" : 
                           dev.status === "provisioning" ? "Provisioning…" : "Rejected"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs" style={{ color: textSecondary }}>
                        <span><i className="ri-barcode-line mr-1"></i>{dev.sn}</span>
                        <span><i className="ri-global-line mr-1"></i>{dev.ip}</span>
                        <span><i className="ri-cpu-line mr-1"></i>{dev.model} · {dev.firmware}</span>
                        <span><i className="ri-time-line mr-1"></i>First seen: {dev.firstSeen}</span>
                        <span><i className="ri-heart-pulse-line mr-1"></i>Last heartbeat: {dev.lastHeartbeat}</span>
                        <span><i className="ri-repeat-line mr-1"></i>{dev.requestCount} requests</span>
                      </div>
                    </div>
                  </div>

                  {dev.status === "pending" && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {provisioning === dev.id ? (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" 
                             style={{ background: "#dcfce7", color: "#16a34a" }}>
                          <i className="ri-refresh-line animate-spin text-sm"></i>
                          Provisioning…
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => openConfirm(dev)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer whitespace-nowrap text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                            style={{ background: "#16a34a" }}
                          >
                            <i className="ri-checkbox-circle-line"></i> Confirm & Activate
                          </button>
                          <button
                            onClick={() => handleReject(dev.id)}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap hover:opacity-80 transition-opacity disabled:opacity-50"
                            style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
                          >
                            <i className="ri-close-line"></i> Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {dev.status === "rejected" && (
                    <button
                      onClick={() => handleReconsider(dev.id)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap flex-shrink-0 hover:opacity-80 transition-opacity"
                      style={{ background: isDark ? "#374151" : "#f3f4f6", color: textSecondary }}
                    >
                      <i className="ri-refresh-line"></i> Reconsider
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" 
             style={{ background: "rgba(0,0,0,0.5)" }}
             onClick={(e) => { if (e.target === e.currentTarget) setConfirmId(null); }}>
          <div className="w-full max-w-md rounded-2xl shadow-xl" 
               style={{ background: isDark ? "#1f2937" : "#ffffff", border: `1px solid ${border}` }}>
            <div className="px-6 py-4 flex items-center justify-between" 
                 style={{ borderBottom: `1px solid ${border}` }}>
              <div>
                <h3 className="text-base font-semibold" style={{ color: textPrimary }}>Confirm Device Activation</h3>
                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>
                  This device will go online and start syncing immediately
                </p>
              </div>
              <button onClick={() => setConfirmId(null)} 
                      className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer hover:opacity-70 transition-opacity" 
                      style={{ color: textSecondary }}>
                <i className="ri-close-line text-lg"></i>
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {(() => {
                const dev = pending.find(d => d.id === confirmId);
                return dev ? (
                  <div className="p-3 rounded-xl" 
                       style={{ background: isDark ? "#374151" : "#f9fafb", border: `1px solid ${border}` }}>
                    <div className="flex flex-wrap gap-3 text-xs" style={{ color: textSecondary }}>
                      <span><strong style={{ color: textPrimary }}>SN:</strong> {dev.sn}</span>
                      <span><strong style={{ color: textPrimary }}>IP:</strong> {dev.ip}</span>
                      <span><strong style={{ color: textPrimary }}>Model:</strong> {dev.model}</span>
                    </div>
                  </div>
                ) : null;
              })()}
              <div>
                <label style={labelStyle}>Device Name <span style={{ color: "#dc2626" }}>*</span></label>
                <input 
                  value={confirmForm.name} 
                  onChange={e => setConfirmForm(f => ({ ...f, name: e.target.value }))} 
                  placeholder="e.g. SURULERE BIOMETRICS" 
                  className={inputClass} 
                  style={inputStyle} 
                />
              </div>
              <div>
                <label style={labelStyle}>Assign to Location <span style={{ color: "#dc2626" }}>*</span></label>
                <select 
                  value={confirmForm.location_id} 
                  onChange={e => setConfirmForm(f => ({ ...f, location_id: e.target.value }))} 
                  className={inputClass} 
                  style={inputStyle}
                >
                  <option value="">Select Location</option>
                  {locationOptions.map(loc => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Timezone</label>
                <select 
                  value={confirmForm.timezone} 
                  onChange={e => setConfirmForm(f => ({ ...f, timezone: e.target.value }))} 
                  className={inputClass} 
                  style={inputStyle}
                >
                  <option>Africa/Lagos</option>
                  <option>Africa/Nairobi</option>
                  <option>Africa/Cairo</option>
                  <option>UTC</option>
                </select>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                <p className="text-xs" style={{ color: "#16a34a" }}>
                  <i className="ri-information-line mr-1"></i>
                  After confirmation, the device will automatically come <strong>Online</strong> and begin syncing attendance records in real-time.
                </p>
              </div>
            </div>
            <div className="px-6 py-4 flex items-center justify-end gap-3" 
                 style={{ borderTop: `1px solid ${border}` }}>
              <button 
                onClick={() => setConfirmId(null)} 
                className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium hover:opacity-80 transition-opacity" 
                style={{ background: isDark ? "#374151" : "#f3f4f6", color: textSecondary }}
              >
                Cancel
              </button>
              <button 
                onClick={handleProvision} 
                disabled={!confirmForm.name || !confirmForm.location_id || isLoading}
                className="flex items-center gap-2 px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                style={{ background: "#16a34a" }}
              >
                {isLoading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Provisioning...
                  </>
                ) : (
                  <>
                    <i className="ri-checkbox-circle-line"></i> Activate Device
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}