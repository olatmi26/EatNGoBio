import { useState, useEffect } from "react";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import UserManagement from "./components/UserManagement";
import DeviceProvisioning from "./components/DeviceProvisioning";
import { router } from "@inertiajs/react";

const settingsSections = [
    { id: "company", icon: "ri-building-line", label: "Company Profile" },
    { id: "adms", icon: "ri-server-line", label: "ADMS Server" },
    { id: "provisioning", icon: "ri-device-line", label: "Device Provisioning" },
    { id: "attendance", icon: "ri-time-line", label: "Attendance Rules" },
    { id: "notifications", icon: "ri-notification-3-line", label: "Notifications" },
    { id: "security", icon: "ri-shield-check-line", label: "Security" },
    { id: "users", icon: "ri-user-settings-line", label: "User Management" },
] as const;

type SectionId = typeof settingsSections[number]['id'];

interface Props {
    settings?: Record<string, any>;
    roles?: any[];
    users?: any[];
    allPermissions?: any[];
    pendingDevices?: any[];
    locations?: any[];
}

export default function SettingsPage({
    settings: initialSettings = {},
    roles = [],
    users = [],
    allPermissions = [],
    pendingDevices = [],
    locations = [],
}: Props) {
    const { isDark, toggleTheme } = useTheme();
    const { showToast } = useToast();
    
    // Tab persistence using URL hash
    const getInitialSection = (): SectionId => {
        const hash = window.location.hash.slice(1);
        return settingsSections.some(s => s.id === hash) ? hash as SectionId : "company";
    };
    
    const [activeSection, setActiveSection] = useState<SectionId>(getInitialSection);
    const [isSaving, setIsSaving] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Update URL hash when tab changes
    const handleSectionChange = (section: SectionId) => {
        setActiveSection(section);
        window.location.hash = section;
        setMobileMenuOpen(false);
    };

    // Listen for hash changes (browser back/forward)
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            if (settingsSections.some(s => s.id === hash)) {
                setActiveSection(hash as SectionId);
            }
        };
        
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Initialize settings from backend or defaults
    const [companySettings, setCompanySettings] = useState({
        companyName: initialSettings?.company_name || "EatNGo Africa",
        companyCode: initialSettings?.company_code || "EATNGO",
        industry: initialSettings?.industry || "Food & Beverage",
        address: initialSettings?.address || "14 Admiralty Way, Lekki Phase 1, Lagos, Nigeria",
        phone: initialSettings?.phone || "+234 801 234 5678",
        email: initialSettings?.email || "hr@eatngo-africa.com",
        website: initialSettings?.website || "https://eatngo-africa.com",
        timezone: initialSettings?.timezone || "Africa/Lagos",
        dateFormat: initialSettings?.date_format || "YYYY-MM-DD",
        language: initialSettings?.language || "English",
        currency: initialSettings?.currency || "NGN",
        fiscalYearStart: initialSettings?.fiscal_year_start || "01",
        logo: initialSettings?.logo || "",
    });

    const [admsSettings, setAdmsSettings] = useState({
        serverUrl: initialSettings?.adms_server_url || "https://engobio.coldstonecreamery.ng",
        port: initialSettings?.adms_port || "",
        heartbeatInterval: initialSettings?.adms_heartbeat_interval || 10,
        syncMode: initialSettings?.adms_sync_mode || "Real-Time",
        autoProvision: initialSettings?.adms_auto_provision ?? true,
        requireConfirmation: initialSettings?.adms_require_confirmation ?? true,
        maxRetries: initialSettings?.adms_max_retries || 3,
        connectionTimeout: initialSettings?.adms_connection_timeout || 30,
    });

    const [attendanceSettings, setAttendanceSettings] = useState({
        workStartTime: initialSettings?.att_work_start || "08:00",
        workEndTime: initialSettings?.att_work_end || "17:00",
        lateThreshold: initialSettings?.att_late_threshold || 15,
        overtimeThreshold: initialSettings?.att_overtime_threshold || 60,
        halfDayThreshold: initialSettings?.att_half_day_threshold || 4,
        earlyLeaveThreshold: initialSettings?.att_early_leave_threshold || 30,
        breakDuration: initialSettings?.att_break_duration || 60,
        roundingInterval: initialSettings?.att_rounding_interval || 5,
        countWeekends: initialSettings?.att_count_weekends ?? false,
        countHolidays: initialSettings?.att_count_holidays ?? false,
        autoCheckout: initialSettings?.att_auto_checkout ?? true,
        autoCheckoutTime: initialSettings?.att_auto_checkout_time || "23:59",
        minimumWorkHours: initialSettings?.att_min_work_hours || 4,
    });

    const [notifSettings, setNotifSettings] = useState({
        deviceOffline: initialSettings?.notif_device_offline ?? true,
        deviceOnline: initialSettings?.notif_device_online ?? false,
        lateArrival: initialSettings?.notif_late_arrival ?? true,
        earlyLeave: initialSettings?.notif_early_leave ?? false,
        consecutiveAbsence: initialSettings?.notif_consecutive_absence ?? true,
        consecutiveAbsenceThreshold: initialSettings?.notif_absence_threshold || 3,
        syncComplete: initialSettings?.notif_sync_complete ?? false,
        syncFailed: initialSettings?.notif_sync_failed ?? true,
        dailyReport: initialSettings?.notif_daily_report ?? true,
        dailyReportTime: initialSettings?.notif_daily_report_time || "18:00",
        weeklyReport: initialSettings?.notif_weekly_report ?? true,
        biometricEnrollment: initialSettings?.notif_biometric_enrollment ?? true,
        emailAlerts: initialSettings?.notif_email_alerts ?? true,
        alertEmail: initialSettings?.notif_alert_email || "admin@eatngo-africa.com",
    });

    // Theme styles
    const bg = isDark ? "#111827" : "#f8fafc";
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const inputBg = isDark ? "#374151" : "#f9fafb";
    const inputStyle = { background: inputBg, border: `1px solid ${border}`, color: textPrimary };
    const inputClass = "w-full px-3 py-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500/20 transition-all";
    const labelStyle: React.CSSProperties = { color: textSecondary, fontSize: "12px", fontWeight: 500, marginBottom: "4px", display: "block" };

    // Save settings to backend
    const handleSave = async () => {
        setIsSaving(true);

        let settingsData = {};

        switch (activeSection) {
            case "company": settingsData = { company: companySettings }; break;
            case "adms": settingsData = { adms: admsSettings }; break;
            case "attendance": settingsData = { attendance: attendanceSettings }; break;
            case "notifications": settingsData = { notifications: notifSettings }; break;
            default: setIsSaving(false); return;
        }

        try {
            await router.post("/settings/update", { settings: settingsData }, {
                preserveScroll: true,
                onSuccess: () => {
                    showToast("success", "Settings Saved", "Your changes have been saved successfully");
                },
                onError: (errors) => {
                    showToast("error", "Save Failed", "Could not save settings. Please try again.");
                    console.error("Save errors:", errors);
                },
                onFinish: () => setIsSaving(false),
            });
        } catch (error) {
            console.error("Save error:", error);
            showToast("error", "Save Failed", "An unexpected error occurred");
            setIsSaving(false);
        }
    };

    const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
        <button
            onClick={() => onChange(!value)}
            className="w-10 h-6 rounded-full cursor-pointer relative transition-all duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-green-500/50"
            style={{ background: value ? "#16a34a" : isDark ? "#4b5563" : "#d1d5db" }}
        >
            <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
                style={{ left: value ? "22px" : "2px" }}
            />
        </button>
    );

    const activeLabel = settingsSections.find(s => s.id === activeSection)?.label || "";
    const showSaveButton = !["users", "provisioning", "security"].includes(activeSection);

    // Common field renderer
    const renderField = (field: any, settings: any, setSettings: any) => {
        const value = settings[field.key as keyof typeof settings];
        
        if (field.type === "select") {
            return (
                <select
                    value={value as string}
                    onChange={(e) => setSettings((s: any) => ({ ...s, [field.key]: e.target.value }))}
                    className={inputClass}
                    style={inputStyle}
                >
                    {field.options?.map((opt: string) => <option key={opt}>{opt}</option>)}
                </select>
            );
        }
        
        return (
            <input
                type={field.type}
                value={value as string | number}
                onChange={(e) => setSettings((s: any) => ({
                    ...s,
                    [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value
                }))}
                className={inputClass}
                style={inputStyle}
            />
        );
    };

    return (
        <AppLayout title="Settings">
            <div className="p-4 md:p-6" style={{ background: bg, minHeight: "100vh" }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold" style={{ color: textPrimary }}>Settings</h1>
                        <p className="text-sm mt-0.5" style={{ color: textSecondary }}>Configure system preferences and ADMS server</p>
                    </div>
                    {showSaveButton && (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
                        >
                            <i className={isSaving ? "ri-loader-4-line animate-spin" : "ri-save-line"} />
                            <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save Changes"}</span>
                        </button>
                    )}
                </div>

                {/* Mobile section selector */}
                <div className="md:hidden mb-4">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                        style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }}
                    >
                        <div className="flex items-center gap-2">
                            <i className={`${settingsSections.find(s => s.id === activeSection)?.icon} text-sm`} style={{ color: "#16a34a" }} />
                            {activeLabel}
                        </div>
                        <i className={`ri-arrow-${mobileMenuOpen ? "up" : "down"}-s-line text-sm transition-transform`} style={{ color: textSecondary }} />
                    </button>
                    {mobileMenuOpen && (
                        <div className="mt-1 rounded-xl overflow-hidden shadow-lg" style={{ background: cardBg, border: `1px solid ${border}` }}>
                            {settingsSections.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSectionChange(s.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors text-left"
                                    style={{
                                        background: activeSection === s.id ? (isDark ? "#374151" : "#f0fdf4") : "transparent",
                                        color: activeSection === s.id ? "#16a34a" : textSecondary,
                                        fontWeight: activeSection === s.id ? 600 : 400,
                                        borderLeft: activeSection === s.id ? "3px solid #16a34a" : "3px solid transparent",
                                    }}
                                >
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        <i className={`${s.icon} text-sm`} />
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
                        <div className="rounded-xl overflow-hidden sticky top-20 shadow-sm" style={{ background: cardBg, border: `1px solid ${border}` }}>
                            {settingsSections.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => handleSectionChange(s.id)}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-all text-left hover:opacity-80"
                                    style={{
                                        background: activeSection === s.id ? (isDark ? "#374151" : "#f0fdf4") : "transparent",
                                        color: activeSection === s.id ? "#16a34a" : textSecondary,
                                        fontWeight: activeSection === s.id ? 600 : 400,
                                        borderLeft: activeSection === s.id ? "3px solid #16a34a" : "3px solid transparent",
                                    }}
                                >
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        <i className={`${s.icon} text-sm`} />
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
                                <div className="rounded-xl p-5 md:p-6 shadow-sm" style={{ background: cardBg, border: `1px solid ${border}` }}>
                                    <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Company Profile</h2>

                                    {/* Logo upload area */}
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-6" style={{ borderBottom: `1px solid ${border}` }}>
                                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
                                            <span className="text-2xl font-bold text-white">EG</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium mb-1" style={{ color: textPrimary }}>Company Logo</p>
                                            <p className="text-xs mb-3" style={{ color: textSecondary }}>PNG, JPG up to 2MB. Recommended 200×200px</p>
                                            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap transition-colors hover:opacity-80" style={{ background: isDark ? "#374151" : "#f3f4f6", color: textPrimary, border: `1px solid ${border}` }}>
                                                <i className="ri-upload-line text-sm" /> Upload Logo
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: "Company Name", key: "companyName", required: true, type: "text" },
                                            { label: "Company Code", key: "companyCode", type: "text" },
                                            { label: "Industry", key: "industry", type: "select", options: ["Food & Beverage", "Retail", "Manufacturing", "Healthcare", "Technology", "Finance", "Education", "Other"] },
                                            { label: "Phone Number", key: "phone", type: "text" },
                                            { label: "Email Address", key: "email", type: "email" },
                                            { label: "Website", key: "website", type: "text" },
                                        ].map(field => (
                                            <div key={field.key}>
                                                <label style={labelStyle}>
                                                    {field.label} {field.required && <span style={{ color: "#dc2626" }}>*</span>}
                                                </label>
                                                {renderField(field, companySettings, setCompanySettings)}
                                            </div>
                                        ))}
                                        <div className="sm:col-span-2">
                                            <label style={labelStyle}>Address</label>
                                            <input value={companySettings.address} onChange={(e) => setCompanySettings((s: any) => ({ ...s, address: e.target.value }))} className={inputClass} style={inputStyle} />
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl p-5 md:p-6 shadow-sm" style={{ background: cardBg, border: `1px solid ${border}` }}>
                                    <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Regional Settings</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: "Default Timezone", key: "timezone", type: "select", options: ["Africa/Lagos", "Africa/Nairobi", "Africa/Cairo", "UTC", "Europe/London"] },
                                            { label: "Date Format", key: "dateFormat", type: "select", options: ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY", "DD-MMM-YYYY"] },
                                            { label: "Language", key: "language", type: "select", options: ["English", "French", "Arabic", "Hausa", "Yoruba", "Igbo"] },
                                            { label: "Currency", key: "currency", type: "select", options: ["NGN", "USD", "GBP", "EUR", "KES", "GHS"] },
                                        ].map(field => (
                                            <div key={field.key}>
                                                <label style={labelStyle}>{field.label}</label>
                                                {renderField(field, companySettings, setCompanySettings)}
                                            </div>
                                        ))}
                                        <div>
                                            <label style={labelStyle}>Fiscal Year Start Month</label>
                                            <select value={companySettings.fiscalYearStart} onChange={(e) => setCompanySettings((s: any) => ({ ...s, fiscalYearStart: e.target.value }))} className={inputClass} style={inputStyle}>
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
                                <div className="rounded-xl p-5 md:p-6 shadow-sm" style={{ background: cardBg, border: `1px solid ${border}` }}>
                                    <h2 className="text-base font-semibold mb-2" style={{ color: textPrimary }}>ADMS Server Configuration</h2>
                                    <p className="text-xs mb-5" style={{ color: textSecondary }}>Configure the ZKTeco ADMS protocol server. Devices must point to this server URL and port to connect.</p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                        <div className="sm:col-span-2">
                                            <label style={labelStyle}>Server Domain / IP</label>
                                            <input value={admsSettings.serverUrl} onChange={(e) => setAdmsSettings((s: any) => ({ ...s, serverUrl: e.target.value }))} placeholder="https://engobio.coldstonecreamery.ng" className={inputClass} style={inputStyle} />
                                            <p className="text-xs mt-1" style={{ color: textSecondary }}>This is the URL your IT officer configures on each physical device</p>
                                        </div>
                                        {[
                                            { label: "ADMS Port", key: "port", type: "text" },
                                            { label: "Heartbeat Interval (seconds)", key: "heartbeatInterval", type: "number" },
                                            { label: "Sync Mode", key: "syncMode", type: "select", options: ["Real-Time", "Scheduled", "Manual"] },
                                            { label: "Connection Timeout (seconds)", key: "connectionTimeout", type: "number" },
                                            { label: "Max Retry Attempts", key: "maxRetries", type: "number" },
                                        ].map(field => (
                                            <div key={field.key}>
                                                <label style={labelStyle}>{field.label}</label>
                                                {renderField(field, admsSettings, setAdmsSettings)}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-3 mb-5">
                                        {[
                                            { key: "autoProvision", label: "Auto-Provisioning", desc: "Automatically detect new devices when they connect to the ADMS server" },
                                            { key: "requireConfirmation", label: "Require Admin Confirmation", desc: "New devices show as Pending until an admin confirms them" },
                                        ].map(item => (
                                            <div key={item.key} className="flex items-center justify-between py-3" style={{ borderTop: `1px solid ${border}` }}>
                                                <div>
                                                    <p className="text-sm font-medium" style={{ color: textPrimary }}>{item.label}</p>
                                                    <p className="text-xs" style={{ color: textSecondary }}>{item.desc}</p>
                                                </div>
                                                <Toggle value={admsSettings[item.key as keyof typeof admsSettings] as boolean} onChange={(v) => setAdmsSettings((s: any) => ({ ...s, [item.key]: v }))} />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-4 rounded-xl" style={{ background: isDark ? "#374151" : "#f0fdf4", border: `1px solid ${isDark ? "#4b5563" : "#bbf7d0"}` }}>
                                        <p className="text-xs font-semibold mb-3" style={{ color: "#16a34a" }}><i className="ri-code-line mr-1" />ADMS Protocol Endpoints</p>
                                        <div className="space-y-2">
                                            {[
                                                { method: "GET", path: "/iclock/cdata?SN=&lt;serial&gt;&options=all", desc: "Device registration & heartbeat" },
                                                { method: "POST", path: "/iclock/cdata?SN=&lt;serial&gt;&table=ATTLOG", desc: "Push attendance records" },
                                                { method: "GET", path: "/iclock/getrequest?SN=&lt;serial&gt;", desc: "Poll for pending commands" },
                                                { method: "POST", path: "/iclock/devicecmd?SN=&lt;serial&gt;", desc: "Command acknowledgement" },
                                            ].map(ep => (
                                                <div key={ep.path} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded flex-shrink-0" style={{ background: "#dcfce7", color: "#16a34a", width: "fit-content" }}>{ep.method}</span>
                                                    <code className="text-xs font-mono flex-1" style={{ color: textSecondary }} dangerouslySetInnerHTML={{ __html: ep.path }} />
                                                    <span className="text-xs" style={{ color: textSecondary }}>{ep.desc}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${isDark ? "#4b5563" : "#bbf7d0"}` }}>
                                            <p className="text-xs font-semibold mb-1" style={{ color: textPrimary }}>Device Configuration Instructions for IT Officer:</p>
                                            <p className="text-xs" style={{ color: textSecondary }}>
                                                On the ZKTeco device, go to <strong>Menu → Comm → Cloud Server Settings</strong> and set:
                                                <br />Server Address: <code className="font-mono" style={{ color: "#16a34a" }}>{admsSettings.serverUrl}</code>
                                                &nbsp;· Port: <code className="font-mono" style={{ color: "#16a34a" }}>{admsSettings.port || "443"}</code>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Device Provisioning */}
                        {activeSection === "provisioning" && (
                            <DeviceProvisioning
                                pendingDevices={pendingDevices}
                                locations={locations}
                                admsSettings={{ autoProvision: admsSettings.autoProvision, requireConfirmation: admsSettings.requireConfirmation }}
                            />
                        )}

                        {/* Attendance Rules */}
                        {activeSection === "attendance" && (
                            <div className="space-y-5">
                                <div className="rounded-xl p-5 md:p-6 shadow-sm" style={{ background: cardBg, border: `1px solid ${border}` }}>
                                    <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Work Schedule</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: "Work Start Time", key: "workStartTime", type: "time" },
                                            { label: "Work End Time", key: "workEndTime", type: "time" },
                                            { label: "Break Duration (minutes)", key: "breakDuration", type: "number" },
                                            { label: "Minimum Work Hours (for half-day)", key: "minimumWorkHours", type: "number" },
                                        ].map(field => (
                                            <div key={field.key}>
                                                <label style={labelStyle}>{field.label}</label>
                                                {renderField(field, attendanceSettings, setAttendanceSettings)}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-xl p-5 md:p-6 shadow-sm" style={{ background: cardBg, border: `1px solid ${border}` }}>
                                    <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Thresholds & Rules</h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {[
                                            { label: "Late Arrival Threshold (minutes)", key: "lateThreshold", desc: "Minutes after work start time before marked as late" },
                                            { label: "Early Leave Threshold (minutes)", key: "earlyLeaveThreshold" },
                                            { label: "Overtime Threshold (minutes)", key: "overtimeThreshold" },
                                            { label: "Half Day Threshold (hours)", key: "halfDayThreshold" },
                                        ].map(field => (
                                            <div key={field.key}>
                                                <label style={labelStyle}>{field.label}</label>
                                                {renderField(field, attendanceSettings, setAttendanceSettings)}
                                                {field.desc && <p className="text-xs mt-1" style={{ color: textSecondary }}>{field.desc}</p>}
                                            </div>
                                        ))}
                                        <div>
                                            <label style={labelStyle}>Time Rounding Interval (minutes)</label>
                                            <select value={attendanceSettings.roundingInterval} onChange={(e) => setAttendanceSettings((s: any) => ({ ...s, roundingInterval: Number(e.target.value) }))} className={inputClass} style={inputStyle}>
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
                                                <Toggle value={attendanceSettings[item.key as keyof typeof attendanceSettings] as boolean} onChange={(v) => setAttendanceSettings((s: any) => ({ ...s, [item.key]: v }))} />
                                            </div>
                                        ))}
                                        {attendanceSettings.autoCheckout && (
                                            <div className="pl-4" style={{ borderLeft: "3px solid #16a34a" }}>
                                                <label style={labelStyle}>Auto Checkout Time</label>
                                                <input type="time" value={attendanceSettings.autoCheckoutTime} onChange={(e) => setAttendanceSettings((s: any) => ({ ...s, autoCheckoutTime: e.target.value }))} className={inputClass} style={{ ...inputStyle, maxWidth: "200px" }} />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications */}
                        {activeSection === "notifications" && (
                            <div className="space-y-5">
                                <div className="rounded-xl p-5 md:p-6 shadow-sm" style={{ background: cardBg, border: `1px solid ${border}` }}>
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
                                    ].map(n => (
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
                                                        <input type="number" value={notifSettings.consecutiveAbsenceThreshold} onChange={(e) => setNotifSettings((s: any) => ({ ...s, consecutiveAbsenceThreshold: Number(e.target.value) }))} className="w-16 px-2 py-1 rounded text-xs outline-none text-center focus:ring-2 focus:ring-green-500/20" style={{ background: inputBg, border: `1px solid ${border}`, color: textPrimary }} />
                                                        <span className="text-xs" style={{ color: textSecondary }}>consecutive days</span>
                                                    </div>
                                                )}
                                            </div>
                                            <Toggle value={notifSettings[n.key as keyof typeof notifSettings] as boolean} onChange={(v) => setNotifSettings((s: any) => ({ ...s, [n.key]: v }))} />
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-xl p-5 md:p-6 shadow-sm" style={{ background: cardBg, border: `1px solid ${border}` }}>
                                    <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Report Delivery</h2>
                                    <div className="space-y-4">
                                        {[
                                            { key: "dailyReport", label: "Daily Attendance Report", desc: "Send daily attendance summary email" },
                                            { key: "weeklyReport", label: "Weekly Summary Report", desc: "Send weekly attendance summary every Monday" },
                                            { key: "emailAlerts", label: "Email Alerts", desc: "Send alert notifications via email" },
                                        ].map(item => (
                                            <div key={item.key}>
                                                <div className="flex items-center justify-between py-3" style={{ borderBottom: `1px solid ${border}` }}>
                                                    <div>
                                                        <p className="text-sm font-medium" style={{ color: textPrimary }}>{item.label}</p>
                                                        <p className="text-xs" style={{ color: textSecondary }}>{item.desc}</p>
                                                    </div>
                                                    <Toggle value={notifSettings[item.key as keyof typeof notifSettings] as boolean} onChange={(v) => setNotifSettings((s: any) => ({ ...s, [item.key]: v }))} />
                                                </div>
                                                {item.key === "dailyReport" && notifSettings.dailyReport && (
                                                    <div className="pl-4 mb-3" style={{ borderLeft: "3px solid #16a34a" }}>
                                                        <label style={labelStyle}>Send Report At</label>
                                                        <input type="time" value={notifSettings.dailyReportTime} onChange={(e) => setNotifSettings((s: any) => ({ ...s, dailyReportTime: e.target.value }))} className={inputClass} style={{ ...inputStyle, maxWidth: "200px" }} />
                                                    </div>
                                                )}
                                                {item.key === "emailAlerts" && notifSettings.emailAlerts && (
                                                    <div className="pl-4 mb-3" style={{ borderLeft: "3px solid #16a34a" }}>
                                                        <label style={labelStyle}>Alert Email Address</label>
                                                        <input type="email" value={notifSettings.alertEmail} onChange={(e) => setNotifSettings((s: any) => ({ ...s, alertEmail: e.target.value }))} className={inputClass} style={{ ...inputStyle, maxWidth: "320px" }} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security */}
                        {activeSection === "security" && (
                            <div className="rounded-xl p-5 md:p-6 shadow-sm" style={{ background: cardBg, border: `1px solid ${border}` }}>
                                <h2 className="text-base font-semibold mb-5" style={{ color: textPrimary }}>Security Settings</h2>
                                <div className="flex flex-col gap-4 max-w-sm">
                                    <div><label style={labelStyle}>Current Password</label><input type="password" placeholder="••••••••" className={inputClass} style={inputStyle} /></div>
                                    <div><label style={labelStyle}>New Password</label><input type="password" placeholder="••••••••" className={inputClass} style={inputStyle} /></div>
                                    <div><label style={labelStyle}>Confirm New Password</label><input type="password" placeholder="••••••••" className={inputClass} style={inputStyle} /></div>
                                    <button onClick={() => showToast("success", "Password Updated", "Your password has been changed")} className="w-fit px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white transition-colors hover:opacity-90" style={{ background: "#16a34a" }}>Update Password</button>
                                </div>
                            </div>
                        )}

                        {/* User Management */}
                        {activeSection === "users" && <UserManagement users={users} roles={roles} allPermissions={allPermissions} />}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}