import { useState } from "react";
import DashboardLayout from "@/components/feature/DashboardLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/components/base/Toast";
import UserManagement from "./components/UserManagement";
import DeviceProvisioning from "./components/DeviceProvisioning";

const settingsSections = [
  { id: "company", icon: "ri-building-line", label: "Company Profile" },
  { id: "adms", icon: "ri-server-line", label: "ADMS Server" },
  { id: "provisioning", icon: "ri-device-line", label: "Device Provisioning" },
  { id: "attendance", icon: "ri-time-line", label: "Attendance Rules" },
  { id: "notifications", icon: "ri-notification-3-line", label: "Notifications" },
  { id: "security", icon: "ri-shield-check-line", label: "Security" },
  { id: "users", icon: "ri-user-settings-line", label: "User Management" },
];

export default function SettingsPage() {
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState("company");
  const [saved, setSaved] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [companySettings, setCompanySettings] = useState({
    companyName: "EatNGo Africa",
    companyCode: "EATNGO",
    industry: "Food & Beverage",
    address: "14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria",
    phone: "+234 801 234 5678",
    email: "hr@eatngo-africa.com",
    website: "https://eatngo-africa.com",
    timezone: "Africa/Lagos",
    dateFormat: "YYYY-MM-DD",
    language: "English",
    currency: "NGN",
    fiscalYearStart: "01",
    logo: "",
  });

  const [admsSettings, setAdmsSettings] = useState({
    serverUrl: "https://engobio.coldstonecreamery.ng",
    port: "",
    heartbeatInterval: 10,
    syncMode: "Real-Time",
    autoProvision: true,
    requireConfirmation: true,
    maxRetries: 3,
    connectionTimeout: 30,
    pushPath: "/iclock/cdata",
    pullPath: "/iclock/getrequest",
    cmdPath: "/iclock/devicecmd",
  });

  const [attendanceSettings, setAttendanceSettings] = useState({
    workStartTime: "08:00",
    workEndTime: "17:00",
    lateThreshold: 15,
    overtimeThreshold: 60,
    halfDayThreshold: 4,
    earlyLeaveThreshold: 30,
    breakDuration: 60,
    roundingInterval: 5,
    countWeekends: false,
    countHolidays: false,
    autoCheckout: true,
    autoCheckoutTime: "23:59",
    minimumWorkHours: 4,
  });

  const [notifSettings, setNotifSettings] = useState({
    deviceOffline: true,
    deviceOnline: false,
    lateArrival: true,
    earlyLeave: false,
    consecutiveAbsence: true,
    consecutiveAbsenceThreshold: 3,
    syncComplete: false,
    syncFailed: true,
    dailyReport: true,
    dailyReportTime: "18:00",
    weeklyReport: true,
    biometricEnrollment: true,
    emailAlerts: true,
    alertEmail: "admin@eatngo-africa.com",
  });

  const bg = isDark ? "#111827" : "#f8fafc";
  const cardBg = isDark ? "#1f2937" : "#ffffff";
  const border = isDark ? "#374151" : "#e5e7eb";
  const textPrimary = isDark ? "#f9fafb" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";
  const inputBg = isDark ? "#374151" : "#f9fafb";
  const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
  const inputClass = "w-full px-3 py-2 rounded-lg text-sm outline-none";
  const labelStyle: React.CSSProperties = { color: textSecondary, fontSize: "12px", fontWeight: 500, marginBottom: "4px", display: "block" };

  const handleSave = () => {
    setSaved(true);
    showToast("success", "Settings Saved", "Your changes have been saved successfully");
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} className="w-10 h-6 rounded-full cursor-pointer relative transition-colors flex-shrink-0" style={{ background: value ? "#16a34a" : (isDark ? "#4b5563" : "#d1d5db") }}>
      <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: value ? "22px" : "2px" }}></div>
    </button>
  );

  const activeLabel = settingsSections.find(s => s.id === activeSection)?.label || "";

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6" style={{ background: bg, minHeight: "100vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: textPrimary }}>Settings</h1>
            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>Configure system preferences and ADMS server</p>
          </div>
          {activeSection !== "users" && activeSection !== "provisioning" && (
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap hover:opacity-90" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
              <i className={saved ? "ri-checkbox-circle-line" : "ri-save-line"}></i>
              <span className="hidden sm:inline">{saved ? "Saved!" : "Save Changes"}</span>
            </button>
          )}
        </div>

        {/* Mobile section selector */}
        <div className="md:hidden mb-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }}
          >
            <div className="flex items-center gap-2">
              <i className={`${settingsSections.find(s => s.id === activeSection)?.icon} text-sm`} style={{ color: "#16a34a" }}></i>
              {activeLabel}
            </div>
            <i className={mobileMenuOpen ? "ri-arrow-up-s-line text-sm" : "ri-arrow-down-s-line text-sm"} style={{ color: textSecondary }}></i>
          </button>
          {mobileMenuOpen && (
            <div className="mt-1 rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
              {settingsSections.map(s => (
                <button key={s.id} onClick={() => { setActiveSection(s.id); setMobileMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors text-left"
                  style={{
                    background: activeSection === s.id ? (isDark ? "#374151" : "#f0fdf4") : "transparent",
                    color: activeSection === s.id ? "#16a34a" : textSecondary,
                    fontWeight: activeSection === s.id ? 600 : 400,
                    borderLeft: activeSection === s.id ? "3px solid #16a34a" : "3px solid transparent",
                  }}>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className={`${s.icon} text-sm`}></i>
                  </div>
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-6">
          {/* Sidebar nav - desktop only */}
          <div className="w-52 flex-shrink-0 hidden md:block">
            <div className="rounded-xl overflow-hidden sticky top-20" style={{ background: cardBg, border: `1px solid ${border}` }}>
              {settingsSections.map((s) => (
                <button key={s.id} onClick={() => setActiveSection(s.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors text-left"
                  style={{
                    background: activeSection === s.id ? (isDark ? "#374151" : "#f0fdf4") : "transparent",
                    color: activeSection === s.id ? "#16a34a" : textSecondary,
                    fontWeight: activeSection === s.id ? 600 : 400,
                    borderLeft: activeSection === s.id ? "3px solid #16a34a" : "3px solid transparent",
                  }}>
                  <div className="w-4 h-4 flex items-center justify-center">
                    <i className={`${s.icon} text-sm`}></i>
                  </div>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">

            {/* Company Profile */}
            {activeSection === "company" && (
              <div className="space-y-5">
                <div className="rounded-xl p-5 md:p-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Company Profile</h2>

                  {/* Logo upload area */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-6" style={{ borderBottom: `1px solid ${border}` }}>
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
                      <span className="text-2xl font-bold text-white">EG</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1" style={{ color: textPrimary }}>Company Logo</p>
                      <p className="text-xs mb-3" style={{ color: textSecondary }}>PNG, JPG up to 2MB. Recommended 200×200px</p>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap" style={{ background: isDark ? "#374151" : "#f3f4f6", color: textPrimary, border: `1px solid ${border}` }}>
                        <i className="ri-upload-line text-sm"></i> Upload Logo
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Company Name <span style={{ color: "#dc2626" }}>*</span></label>
                      <input value={companySettings.companyName} onChange={(e) => setCompanySettings(s => ({ ...s, companyName: e.target.value }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Company Code</label>
                      <input value={companySettings.companyCode} onChange={(e) => setCompanySettings(s => ({ ...s, companyCode: e.target.value }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Industry</label>
                      <select value={companySettings.industry} onChange={(e) => setCompanySettings(s => ({ ...s, industry: e.target.value }))} className={inputClass} style={inputStyle}>
                        <option>Food &amp; Beverage</option>
                        <option>Retail</option>
                        <option>Manufacturing</option>
                        <option>Healthcare</option>
                        <option>Technology</option>
                        <option>Finance</option>
                        <option>Education</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Phone Number</label>
                      <input value={companySettings.phone} onChange={(e) => setCompanySettings(s => ({ ...s, phone: e.target.value }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email Address</label>
                      <input type="email" value={companySettings.email} onChange={(e) => setCompanySettings(s => ({ ...s, email: e.target.value }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Website</label>
                      <input value={companySettings.website} onChange={(e) => setCompanySettings(s => ({ ...s, website: e.target.value }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div className="sm:col-span-2">
                      <label style={labelStyle}>Address</label>
                      <input value={companySettings.address} onChange={(e) => setCompanySettings(s => ({ ...s, address: e.target.value }))} className={inputClass} style={inputStyle} />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl p-5 md:p-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Regional Settings</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Default Timezone</label>
                      <select value={companySettings.timezone} onChange={(e) => setCompanySettings(s => ({ ...s, timezone: e.target.value }))} className={inputClass} style={inputStyle}>
                        <option>Africa/Lagos</option>
                        <option>Africa/Nairobi</option>
                        <option>Africa/Cairo</option>
                        <option>UTC</option>
                        <option>Europe/London</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Date Format</label>
                      <select value={companySettings.dateFormat} onChange={(e) => setCompanySettings(s => ({ ...s, dateFormat: e.target.value }))} className={inputClass} style={inputStyle}>
                        <option>YYYY-MM-DD</option>
                        <option>DD/MM/YYYY</option>
                        <option>MM/DD/YYYY</option>
                        <option>DD-MMM-YYYY</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Language</label>
                      <select value={companySettings.language} onChange={(e) => setCompanySettings(s => ({ ...s, language: e.target.value }))} className={inputClass} style={inputStyle}>
                        <option>English</option>
                        <option>French</option>
                        <option>Arabic</option>
                        <option>Hausa</option>
                        <option>Yoruba</option>
                        <option>Igbo</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Currency</label>
                      <select value={companySettings.currency} onChange={(e) => setCompanySettings(s => ({ ...s, currency: e.target.value }))} className={inputClass} style={inputStyle}>
                        <option>NGN</option>
                        <option>USD</option>
                        <option>GBP</option>
                        <option>EUR</option>
                        <option>KES</option>
                        <option>GHS</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Fiscal Year Start Month</label>
                      <select value={companySettings.fiscalYearStart} onChange={(e) => setCompanySettings(s => ({ ...s, fiscalYearStart: e.target.value }))} className={inputClass} style={inputStyle}>
                        {["01","02","03","04","05","06","07","08","09","10","11","12"].map((m, i) => (
                          <option key={m} value={m}>{["January","February","March","April","May","June","July","August","September","October","November","December"][i]}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium" style={{ color: textPrimary }}>Dark Mode</p>
                        <p className="text-xs" style={{ color: textSecondary }}>Switch between light and dark theme</p>
                      </div>
                      <Toggle value={isDark} onChange={toggleTheme} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADMS Server */}
            {activeSection === "adms" && (
              <div className="space-y-5">
                <div className="rounded-xl p-5 md:p-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h2 className="text-base font-semibold mb-2" style={{ color: textPrimary }}>ADMS Server Configuration</h2>
                  <p className="text-xs mb-5" style={{ color: textSecondary }}>Configure the ZKTeco ADMS protocol server. Devices must point to this server URL and port to connect.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div className="sm:col-span-2">
                      <label style={labelStyle}>Server Domain / IP</label>
                      <input value={admsSettings.serverUrl} onChange={(e) => setAdmsSettings(s => ({ ...s, serverUrl: e.target.value }))} placeholder="http://biometrics.yourdomain.com" className={inputClass} style={inputStyle} />
                      <p className="text-xs mt-1" style={{ color: textSecondary }}>This is the URL your IT officer configures on each physical device</p>
                    </div>
                    <div>
                      <label style={labelStyle}>ADMS Port</label>
                      <input value={admsSettings.port} onChange={(e) => setAdmsSettings(s => ({ ...s, port: e.target.value }))} placeholder="8089" className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Heartbeat Interval (seconds)</label>
                      <input type="number" value={admsSettings.heartbeatInterval} onChange={(e) => setAdmsSettings(s => ({ ...s, heartbeatInterval: Number(e.target.value) }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Sync Mode</label>
                      <select value={admsSettings.syncMode} onChange={(e) => setAdmsSettings(s => ({ ...s, syncMode: e.target.value }))} className={inputClass} style={inputStyle}>
                        <option>Real-Time</option>
                        <option>Scheduled</option>
                        <option>Manual</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Connection Timeout (seconds)</label>
                      <input type="number" value={admsSettings.connectionTimeout} onChange={(e) => setAdmsSettings(s => ({ ...s, connectionTimeout: Number(e.target.value) }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Max Retry Attempts</label>
                      <input type="number" value={admsSettings.maxRetries} onChange={(e) => setAdmsSettings(s => ({ ...s, maxRetries: Number(e.target.value) }))} className={inputClass} style={inputStyle} />
                    </div>
                  </div>

                  {/* Auto-provisioning toggles */}
                  <div className="space-y-3 mb-5">
                    <div className="flex items-center justify-between py-3" style={{ borderTop: `1px solid ${border}` }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: textPrimary }}>Auto-Provisioning</p>
                        <p className="text-xs" style={{ color: textSecondary }}>Automatically detect new devices when they connect to the ADMS server</p>
                      </div>
                      <Toggle value={admsSettings.autoProvision} onChange={(v) => setAdmsSettings(s => ({ ...s, autoProvision: v }))} />
                    </div>
                    <div className="flex items-center justify-between py-3" style={{ borderTop: `1px solid ${border}` }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: textPrimary }}>Require Admin Confirmation</p>
                        <p className="text-xs" style={{ color: textSecondary }}>New devices show as &quot;Pending&quot; until an admin confirms them</p>
                      </div>
                      <Toggle value={admsSettings.requireConfirmation} onChange={(v) => setAdmsSettings(s => ({ ...s, requireConfirmation: v }))} />
                    </div>
                  </div>

                  {/* ADMS Endpoints reference */}
                  <div className="p-4 rounded-xl" style={{ background: isDark ? "#374151" : "#f0fdf4", border: `1px solid ${isDark ? "#4b5563" : "#bbf7d0"}` }}>
                    <p className="text-xs font-semibold mb-3" style={{ color: "#16a34a" }}>
                      <i className="ri-code-line mr-1"></i>ADMS Protocol Endpoints
                    </p>
                    <div className="space-y-2">
                      {[
                        { method: "GET", path: "/iclock/cdata?SN=&lt;serial&gt;&options=all", desc: "Device registration & heartbeat" },
                        { method: "POST", path: "/iclock/cdata?SN=&lt;serial&gt;&table=ATTLOG", desc: "Push attendance records" },
                        { method: "GET", path: "/iclock/getrequest?SN=&lt;serial&gt;", desc: "Poll for pending commands" },
                        { method: "POST", path: "/iclock/devicecmd?SN=&lt;serial&gt;", desc: "Command acknowledgement" },
                      ].map(ep => (
                        <div key={ep.path} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                          <span className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0" style={{ background: "#dcfce7", color: "#16a34a", width: "fit-content" }}>{ep.method}</span>
                          <code className="text-xs font-mono flex-1" style={{ color: textSecondary }} dangerouslySetInnerHTML={{ __html: ep.path }}></code>
                          <span className="text-xs" style={{ color: textSecondary }}>{ep.desc}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${isDark ? "#4b5563" : "#bbf7d0"}` }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: textPrimary }}>Device Configuration Instructions for IT Officer:</p>
                      <p className="text-xs" style={{ color: textSecondary }}>
                        On the ZKTeco device, go to <strong>Menu → Comm → Cloud Server Settings</strong> and set:
                        <br />Server Address: <code className="font-mono" style={{ color: "#16a34a" }}>{admsSettings.serverUrl}</code>
                        &nbsp;· Port: <code className="font-mono" style={{ color: "#16a34a" }}>{admsSettings.port}</code>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Device Provisioning */}
            {activeSection === "provisioning" && <DeviceProvisioning />}

            {/* Attendance Rules */}
            {activeSection === "attendance" && (
              <div className="space-y-5">
                <div className="rounded-xl p-5 md:p-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Work Schedule</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Work Start Time</label>
                      <input type="time" value={attendanceSettings.workStartTime} onChange={(e) => setAttendanceSettings(s => ({ ...s, workStartTime: e.target.value }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Work End Time</label>
                      <input type="time" value={attendanceSettings.workEndTime} onChange={(e) => setAttendanceSettings(s => ({ ...s, workEndTime: e.target.value }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Break Duration (minutes)</label>
                      <input type="number" value={attendanceSettings.breakDuration} onChange={(e) => setAttendanceSettings(s => ({ ...s, breakDuration: Number(e.target.value) }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Minimum Work Hours (for half-day)</label>
                      <input type="number" value={attendanceSettings.minimumWorkHours} onChange={(e) => setAttendanceSettings(s => ({ ...s, minimumWorkHours: Number(e.target.value) }))} className={inputClass} style={inputStyle} />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl p-5 md:p-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Thresholds &amp; Rules</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label style={labelStyle}>Late Arrival Threshold (minutes)</label>
                      <input type="number" value={attendanceSettings.lateThreshold} onChange={(e) => setAttendanceSettings(s => ({ ...s, lateThreshold: Number(e.target.value) }))} className={inputClass} style={inputStyle} />
                      <p className="text-xs mt-1" style={{ color: textSecondary }}>Minutes after work start time before marked as late</p>
                    </div>
                    <div>
                      <label style={labelStyle}>Early Leave Threshold (minutes)</label>
                      <input type="number" value={attendanceSettings.earlyLeaveThreshold} onChange={(e) => setAttendanceSettings(s => ({ ...s, earlyLeaveThreshold: Number(e.target.value) }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Overtime Threshold (minutes)</label>
                      <input type="number" value={attendanceSettings.overtimeThreshold} onChange={(e) => setAttendanceSettings(s => ({ ...s, overtimeThreshold: Number(e.target.value) }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Half Day Threshold (hours)</label>
                      <input type="number" value={attendanceSettings.halfDayThreshold} onChange={(e) => setAttendanceSettings(s => ({ ...s, halfDayThreshold: Number(e.target.value) }))} className={inputClass} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Time Rounding Interval (minutes)</label>
                      <select value={attendanceSettings.roundingInterval} onChange={(e) => setAttendanceSettings(s => ({ ...s, roundingInterval: Number(e.target.value) }))} className={inputClass} style={inputStyle}>
                        <option value={1}>1 minute (no rounding)</option>
                        <option value={5}>5 minutes</option>
                        <option value={10}>10 minutes</option>
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      { key: "countWeekends", label: "Count Weekends as Work Days", desc: "Include Saturday and Sunday in attendance calculations" },
                      { key: "countHolidays", label: "Count Public Holidays as Work Days", desc: "Include public holidays in attendance calculations" },
                      { key: "autoCheckout", label: "Auto Checkout at End of Day", desc: `Automatically check out employees at ${attendanceSettings.autoCheckoutTime} if they forgot to check out` },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between py-3" style={{ borderTop: `1px solid ${border}` }}>
                        <div>
                          <p className="text-sm font-medium" style={{ color: textPrimary }}>{item.label}</p>
                          <p className="text-xs" style={{ color: textSecondary }}>{item.desc}</p>
                        </div>
                        <Toggle
                          value={attendanceSettings[item.key as keyof typeof attendanceSettings] as boolean}
                          onChange={(v) => setAttendanceSettings(s => ({ ...s, [item.key]: v }))}
                        />
                      </div>
                    ))}
                    {attendanceSettings.autoCheckout && (
                      <div className="pl-4" style={{ borderLeft: "3px solid #16a34a" }}>
                        <label style={labelStyle}>Auto Checkout Time</label>
                        <input type="time" value={attendanceSettings.autoCheckoutTime} onChange={(e) => setAttendanceSettings(s => ({ ...s, autoCheckoutTime: e.target.value }))} className={inputClass} style={{ ...inputStyle, maxWidth: "200px" }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === "notifications" && (
              <div className="space-y-5">
                <div className="rounded-xl p-5 md:p-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Alert Preferences</h2>
                  {[
                    { key: "deviceOffline", label: "Device Offline Alert", desc: "Notify when a biometric device goes offline", category: "Device" },
                    { key: "deviceOnline", label: "Device Online Alert", desc: "Notify when an offline device comes back online", category: "Device" },
                    { key: "lateArrival", label: "Late Arrival Alert", desc: "Notify when employees arrive late", category: "Attendance" },
                    { key: "earlyLeave", label: "Early Leave Alert", desc: "Notify when employees leave before end of shift", category: "Attendance" },
                    { key: "consecutiveAbsence", label: "Consecutive Absence Alert", desc: "Notify when employees are absent for multiple consecutive days", category: "Attendance" },
                    { key: "syncComplete", label: "Sync Complete", desc: "Notify when device data sync completes successfully", category: "System" },
                    { key: "syncFailed", label: "Sync Failed Alert", desc: "Notify when device sync fails", category: "System" },
                    { key: "biometricEnrollment", label: "Biometric Enrollment Pending", desc: "Notify when employees have no biometric data enrolled", category: "Biometric" },
                  ].map((n) => (
                    <div key={n.key} className="flex items-center justify-between py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-sm font-medium" style={{ color: textPrimary }}>{n.label}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: isDark ? "#374151" : "#f3f4f6", color: textSecondary }}>{n.category}</span>
                        </div>
                        <p className="text-xs" style={{ color: textSecondary }}>{n.desc}</p>
                        {n.key === "consecutiveAbsence" && notifSettings.consecutiveAbsence && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs" style={{ color: textSecondary }}>Trigger after</span>
                            <input type="number" value={notifSettings.consecutiveAbsenceThreshold}
                              onChange={(e) => setNotifSettings(s => ({ ...s, consecutiveAbsenceThreshold: Number(e.target.value) }))}
                              className="w-16 px-2 py-1 rounded text-xs outline-none text-center"
                              style={{ background: inputBg, border: `1px solid ${border}`, color: textPrimary }} />
                            <span className="text-xs" style={{ color: textSecondary }}>consecutive days</span>
                          </div>
                        )}
                      </div>
                      <Toggle
                        value={notifSettings[n.key as keyof typeof notifSettings] as boolean}
                        onChange={(v) => setNotifSettings(s => ({ ...s, [n.key]: v }))}
                      />
                    </div>
                  ))}
                </div>

                <div className="rounded-xl p-5 md:p-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Report Delivery</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${border}` }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: textPrimary }}>Daily Attendance Report</p>
                        <p className="text-xs" style={{ color: textSecondary }}>Send daily attendance summary email</p>
                      </div>
                      <Toggle value={notifSettings.dailyReport} onChange={(v) => setNotifSettings(s => ({ ...s, dailyReport: v }))} />
                    </div>
                    {notifSettings.dailyReport && (
                      <div className="pl-4" style={{ borderLeft: "3px solid #16a34a" }}>
                        <label style={labelStyle}>Send Report At</label>
                        <input type="time" value={notifSettings.dailyReportTime} onChange={(e) => setNotifSettings(s => ({ ...s, dailyReportTime: e.target.value }))} className={inputClass} style={{ ...inputStyle, maxWidth: "200px" }} />
                      </div>
                    )}
                    <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${border}` }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: textPrimary }}>Weekly Summary Report</p>
                        <p className="text-xs" style={{ color: textSecondary }}>Send weekly attendance summary every Monday</p>
                      </div>
                      <Toggle value={notifSettings.weeklyReport} onChange={(v) => setNotifSettings(s => ({ ...s, weeklyReport: v }))} />
                    </div>
                    <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${border}` }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: textPrimary }}>Email Alerts</p>
                        <p className="text-xs" style={{ color: textSecondary }}>Send alert notifications via email</p>
                      </div>
                      <Toggle value={notifSettings.emailAlerts} onChange={(v) => setNotifSettings(s => ({ ...s, emailAlerts: v }))} />
                    </div>
                    {notifSettings.emailAlerts && (
                      <div className="pl-4" style={{ borderLeft: "3px solid #16a34a" }}>
                        <label style={labelStyle}>Alert Email Address</label>
                        <input type="email" value={notifSettings.alertEmail} onChange={(e) => setNotifSettings(s => ({ ...s, alertEmail: e.target.value }))} className={inputClass} style={{ ...inputStyle, maxWidth: "320px" }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Security */}
            {activeSection === "security" && (
              <div className="rounded-xl p-5 md:p-6" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Security Settings</h2>
                <div className="flex flex-col gap-4 max-w-sm">
                  <div>
                    <label style={labelStyle}>Current Password</label>
                    <input type="password" placeholder="••••••••" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>New Password</label>
                    <input type="password" placeholder="••••••••" className={inputClass} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm New Password</label>
                    <input type="password" placeholder="••••••••" className={inputClass} style={inputStyle} />
                  </div>
                  <button onClick={() => showToast("success", "Password Updated", "Your password has been changed")} className="w-fit px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white" style={{ background: "#16a34a" }}>
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {/* User Management */}
            {activeSection === "users" && <UserManagement />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
