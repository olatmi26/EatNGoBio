import { Head, Link, router, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
import { useState } from "react";

type ProfileSection = "profile" | "settings" | "roles" | "notifications" | "help" | "security";

const sidebarMenu: { key: ProfileSection; label: string; icon: string }[] = [
  { key: "profile", label: "My Profile", icon: "ri-user-3-line" },
  { key: "settings", label: "Account Settings", icon: "ri-settings-3-line" },
  { key: "roles", label: "Roles & Permissions", icon: "ri-shield-user-line" },
  { key: "notifications", label: "Notification Preferences", icon: "ri-notification-3-line" },
  { key: "security", label: "Security", icon: "ri-lock-password-line" },
  { key: "help", label: "Help & Support", icon: "ri-question-line" },
];

const MY_PERMISSIONS = [
  "View All Assets", "Create Assets", "Edit Assets", "Delete Assets", "Allocate Assets", "Retire Assets", "Import Assets", "Export Assets",
  "View All Reports", "Export Reports", "View Financial Reports",
  "Manage Users", "Manage Roles", "View User Activity",
  "Manage Locations", "Manage Categories", "View Infrastructure Checks", "Submit Infrastructure Checks", "Schedule Maintenance",
  "View All Tickets", "Assign Tickets", "Resolve Tickets", "Create Tickets",
  "System Settings", "Audit Log", "Integrations", "Manage Alerts",
];

const ACTIVITY_LOG = [
  { time: "2026-04-13 09:14", action: "Asset Allocated", detail: "ITFRA-002 → Adaeze Nwosu", icon: "ri-computer-line", color: "text-emerald-600 bg-emerald-50" },
  { time: "2026-04-13 08:30", action: "Settings Updated", detail: "Alert threshold changed to 30 days", icon: "ri-settings-3-line", color: "text-slate-600 bg-slate-100" },
  { time: "2026-04-12 17:45", action: "Asset Created", detail: "ITFRA-021 — Zebra ZD421 Label Printer", icon: "ri-add-circle-line", color: "text-emerald-600 bg-emerald-50" },
  { time: "2026-04-12 14:10", action: "Asset Retired", detail: "ITFRA-011 — Lenovo ThinkPad X1 Carbon", icon: "ri-archive-line", color: "text-amber-600 bg-amber-50" },
  { time: "2026-04-11 15:30", action: "Role Updated", detail: "IT Officer — Added: Export Assets", icon: "ri-shield-user-line", color: "text-slate-600 bg-slate-100" },
  { time: "2026-04-10 09:15", action: "Bulk Export", detail: "Exported 45 assets to CSV", icon: "ri-download-2-line", color: "text-slate-600 bg-slate-100" },
];

const FAQ_ITEMS = [
  { q: "How do I allocate an asset to a user?", a: "Go to Asset Management → find the asset → click the ••• menu → Allocate. Select the user, department, and location, then confirm." },
  { q: "How do I submit an infrastructure daily check?", a: "Navigate to Infrastructure Checks in the sidebar. Click 'New Check', select your location, fill in each check item status, add notes, and submit." },
  { q: "How do I export asset data?", a: "On the Asset List page, use the Export button in the top right to download all assets as CSV. For selected assets, use the bulk action bar after checking rows." },
  { q: "How do I raise a support ticket?", a: "Go to Support Tickets → click 'New Ticket'. Fill in the title, category, priority, location, and description. The ticket will be assigned to the relevant IT Officer." },
  { q: "How do I view warranty expiry alerts?", a: "Check the Warranty Tracking page for a full overview. Critical and expired warranties are also surfaced in the Notifications panel (bell icon in the top bar)." },
  { q: "How do I reset my password?", a: "Go to Security in this profile panel → click 'Change Password'. Enter your current password and your new password twice to confirm." },
];

export default function UserProfilePage() {
  const [section, setSection] = useState<ProfileSection>("profile");
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: "John Smith",
    email: "john.smith@company.com",
    phone: "+234 800 000 0001",
    department: "IT",
    location: "Head Office",
    jobTitle: "System Administrator",
    bio: "Senior IT professional managing infrastructure across all Chicken Republic locations.",
  });

  const showSuccess = (msg: string) => {
    setSaveSuccess(msg);
    setTimeout(() => setSaveSuccess(null), 3000);
  };

  return (
    <AppLayout>
      <Head title="My Profile" />
    <div className="flex gap-0 bg-white rounded-2xl border border-slate-100 overflow-hidden min-h-[calc(100vh-140px)]">
      {/* Sub Sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-slate-100 py-4" style={{ background: "#f8fafc" }}>
        {/* Avatar */}
        <div className="px-4 mb-5 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-2">JS</div>
          <p className="text-sm font-bold text-slate-800">John Smith</p>
          <p className="text-xs text-slate-400">john.smith@company.com</p>
          <span className="inline-block mt-1 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">Super Admin</span>
        </div>
        <div className="border-t border-slate-200 mb-3"></div>
        {sidebarMenu.map(item => (
          <button key={item.key} onClick={() => setSection(item.key)}
            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all cursor-pointer text-left ${section === item.key ? "bg-emerald-50 text-emerald-700 border-r-2 border-emerald-500" : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"}`}>
            <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
              <i className={`${item.icon} text-sm`}></i>
            </div>
            <span className="whitespace-nowrap">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {saveSuccess && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700 font-medium mb-4">
            <i className="ri-checkbox-circle-fill text-emerald-500"></i>{saveSuccess}
          </div>
        )}

        {/* ── MY PROFILE ── */}
        {section === "profile" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-800">My Profile</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your personal information and account details</p>
            </div>

            {/* Avatar section */}
            <div className="flex items-center gap-5 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">JS</div>
              <div>
                <p className="text-sm font-bold text-slate-800">Profile Photo</p>
                <p className="text-xs text-slate-400 mt-0.5">JPG, PNG or GIF · Max 2MB</p>
                <button className="mt-2 text-xs text-emerald-600 font-medium hover:underline cursor-pointer">Upload new photo</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Full Name</label>
                <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Email Address</label>
                <input type="email" value={profileForm.email} onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Phone</label>
                <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Job Title</label>
                <input value={profileForm.jobTitle} onChange={e => setProfileForm(f => ({ ...f, jobTitle: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Department</label>
                <select value={profileForm.department} onChange={e => setProfileForm(f => ({ ...f, department: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Primary Location</label>
                <select value={profileForm.location} onChange={e => setProfileForm(f => ({ ...f, location: e.target.value }))} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                  {ALL_LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Bio</label>
                <textarea value={profileForm.bio} onChange={e => setProfileForm(f => ({ ...f, bio: e.target.value }))} rows={3} maxLength={500} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none" />
              </div>
            </div>
            <button onClick={() => showSuccess("Profile updated successfully")}
              className="px-5 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">
              Save Profile
            </button>

            {/* Activity Log */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Activity</p>
              <div className="space-y-2">
                {ACTIVITY_LOG.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className={`w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0 ${a.color}`}>
                      <i className={`${a.icon} text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700">{a.action}</p>
                      <p className="text-xs text-slate-400 truncate">{a.detail}</p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ACCOUNT SETTINGS ── */}
        {section === "settings" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-800">Account Settings</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage your account preferences and display settings</p>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Display Preferences</p>
              {[
                { label: "Language", type: "select", options: ["English", "Yoruba", "Igbo", "Hausa"], value: "English" },
                { label: "Timezone", type: "select", options: ["Africa/Lagos (WAT, UTC+1)", "UTC", "Europe/London"], value: "Africa/Lagos (WAT, UTC+1)" },
                { label: "Date Format", type: "select", options: ["YYYY-MM-DD", "DD/MM/YYYY", "MM/DD/YYYY"], value: "YYYY-MM-DD" },
                { label: "Currency", type: "select", options: ["NGN (₦)", "USD ($)", "GBP (£)"], value: "NGN (₦)" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{f.label}</label>
                  <select defaultValue={f.value} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none cursor-pointer bg-white">
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Dashboard Preferences</p>
              {[
                { label: "Show welcome message on dashboard", checked: true },
                { label: "Compact table view by default", checked: false },
                { label: "Auto-refresh dashboard every 5 minutes", checked: true },
                { label: "Show asset cost information", checked: true },
              ].map(opt => (
                <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
                  <div className="relative flex-shrink-0">
                    <input type="checkbox" defaultChecked={opt.checked} className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-all"></div>
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                  </div>
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
              <button onClick={() => showSuccess("Account settings saved")}
                className="px-5 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">
                Save Settings
              </button>
            </div>
          </div>
        )}

        {/* ── ROLES & PERMISSIONS ── */}
        {section === "roles" && (
          <div className="space-y-5 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-800">My Roles &amp; Permissions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Your current access level and what you can do in the system</p>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                <i className="ri-shield-user-fill text-red-600 text-xl"></i>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Super Admin</p>
                <p className="text-xs text-slate-500 mt-0.5">Full system access — all modules, all locations, all data</p>
                <p className="text-xs text-slate-400 mt-0.5">{MY_PERMISSIONS.length} permissions granted</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { group: "Assets", items: ["View All Assets", "Create Assets", "Edit Assets", "Delete Assets", "Allocate Assets", "Retire Assets", "Import Assets", "Export Assets"] },
                { group: "Reports", items: ["View All Reports", "Export Reports", "View Financial Reports"] },
                { group: "Users", items: ["Manage Users", "Manage Roles", "View User Activity"] },
                { group: "Infrastructure", items: ["Manage Locations", "Manage Categories", "View Infrastructure Checks", "Submit Infrastructure Checks", "Schedule Maintenance"] },
                { group: "Tickets", items: ["View All Tickets", "Assign Tickets", "Resolve Tickets", "Create Tickets"] },
                { group: "System", items: ["System Settings", "Audit Log", "Integrations", "Manage Alerts"] },
              ].map(group => (
                <div key={group.group}>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{group.group}</p>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map(p => (
                      <span key={p} className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-100">
                        <i className="ri-checkbox-circle-fill text-emerald-500 text-[10px]"></i>{p}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-500">
              <i className="ri-information-line mr-1.5 text-slate-400"></i>
              To request changes to your role or permissions, contact your IT Admin or Super Admin.
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {section === "notifications" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-800">Notification Preferences</h2>
              <p className="text-xs text-slate-400 mt-0.5">Choose what alerts and updates you receive</p>
            </div>
            <div className="space-y-5">
              {[
                {
                  group: "Asset Alerts",
                  items: [
                    { label: "Warranty expiry alerts (30 days before)", checked: true },
                    { label: "Asset allocated to me", checked: true },
                    { label: "Asset retired or decommissioned", checked: false },
                    { label: "New asset created in my location", checked: true },
                  ],
                },
                {
                  group: "Maintenance",
                  items: [
                    { label: "Maintenance due reminders", checked: true },
                    { label: "Maintenance completed notifications", checked: true },
                    { label: "Emergency maintenance alerts", checked: true },
                  ],
                },
                {
                  group: "Tickets",
                  items: [
                    { label: "New ticket assigned to me", checked: true },
                    { label: "Ticket status updates", checked: true },
                    { label: "Ticket resolved confirmation", checked: false },
                  ],
                },
                {
                  group: "System",
                  items: [
                    { label: "Daily digest email (7:00 AM)", checked: true },
                    { label: "Weekly summary report", checked: false },
                    { label: "Security alerts (login from new device)", checked: true },
                  ],
                },
              ].map(section => (
                <div key={section.group}>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{section.group}</p>
                  <div className="space-y-3">
                    {section.items.map(opt => (
                      <label key={opt.label} className="flex items-center gap-3 cursor-pointer">
                        <div className="relative flex-shrink-0">
                          <input type="checkbox" defaultChecked={opt.checked} className="sr-only peer" />
                          <div className="w-9 h-5 bg-slate-200 peer-checked:bg-emerald-500 rounded-full transition-all"></div>
                          <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                        </div>
                        <span className="text-sm text-slate-700">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={() => showSuccess("Notification preferences saved")}
                className="px-5 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">
                Save Preferences
              </button>
            </div>
          </div>
        )}

        {/* ── SECURITY ── */}
        {section === "security" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-800">Security</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage your password and account security settings</p>
            </div>
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Change Password</p>
              {[
                { label: "Current Password", placeholder: "Enter current password" },
                { label: "New Password", placeholder: "Enter new password" },
                { label: "Confirm New Password", placeholder: "Confirm new password" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-slate-600 mb-1.5 block">{f.label}</label>
                  <input type="password" placeholder={f.placeholder} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
                </div>
              ))}
              <button onClick={() => showSuccess("Password changed successfully")}
                className="px-5 py-2.5 text-sm bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 cursor-pointer whitespace-nowrap font-semibold">
                Change Password
              </button>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-4">Two-Factor Authentication</p>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Authenticator App (2FA)</p>
                  <p className="text-xs text-slate-400 mt-0.5">Use Google Authenticator or Authy for extra security</p>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-semibold">Enabled</span>
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Active Sessions</p>
              {[
                { device: "Windows 11 · HP EliteBook", browser: "Chrome 124", location: "Lagos, Nigeria", time: "Now", current: true },
                { device: "iOS 17 · iPhone 15", browser: "Safari 17", location: "Lagos, Nigeria", time: "2h ago", current: false },
              ].map((s, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-slate-200">
                      <i className={`${s.device.includes("iOS") ? "ri-smartphone-line" : "ri-computer-line"} text-slate-500 text-base`}></i>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{s.device}</p>
                      <p className="text-xs text-slate-400">{s.browser} · {s.location} · {s.time}</p>
                    </div>
                  </div>
                  {s.current ? (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Current</span>
                  ) : (
                    <button className="text-xs text-red-500 hover:underline cursor-pointer font-medium">Revoke</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── HELP & SUPPORT ── */}
        {section === "help" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-800">Help &amp; Support</h2>
              <p className="text-xs text-slate-400 mt-0.5">Frequently asked questions and support resources</p>
            </div>

            {/* Quick links */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "ri-book-open-line", label: "User Guide", desc: "Full documentation", color: "text-emerald-600 bg-emerald-50" },
                { icon: "ri-video-line", label: "Video Tutorials", desc: "Step-by-step walkthroughs", color: "text-amber-600 bg-amber-50" },
                { icon: "ri-customer-service-2-line", label: "Contact IT Admin", desc: "it@chickenrepublic.com", color: "text-slate-600 bg-slate-100" },
                { icon: "ri-bug-line", label: "Report a Bug", desc: "Submit an issue report", color: "text-red-600 bg-red-50" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:border-slate-200 transition-all">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0 ${l.color}`}>
                    <i className={`${l.icon} text-lg`}></i>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{l.label}</p>
                    <p className="text-xs text-slate-400">{l.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* FAQ */}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Frequently Asked Questions</p>
              <div className="space-y-2">
                {FAQ_ITEMS.map((faq, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left cursor-pointer hover:bg-slate-50 transition-all">
                      <span className="text-sm font-semibold text-slate-800">{faq.q}</span>
                      <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                        <i className={`${openFaq === i ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} text-slate-400 text-base`}></i>
                      </div>
                    </button>
                    {openFaq === i && (
                      <div className="px-4 pb-4 text-sm text-slate-500 border-t border-slate-50 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-sm font-bold text-emerald-800 mb-1">Still need help?</p>
              <p className="text-xs text-emerald-700">Contact the IT Admin team at <strong>it@chickenrepublic.com</strong> or call <strong>+234 800 000 0000</strong>. Support hours: Mon–Fri, 8am–6pm WAT.</p>
            </div>
          </div>
        )}
      </div>
    </div>
    </AppLayout>
  );
}
