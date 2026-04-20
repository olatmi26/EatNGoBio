import { useState, useEffect, useCallback } from "react";

// ── Simulated Data (replace with real API calls) ──────────────────────────────
const STORES_FROM_PDF = [
  { sn: "BQC2254800326", name: "SAKA", ip: "192.168.155.199" },
  { sn: "BQC2254800342", name: "ADMIRALTY", ip: "192.168.2.199" },
  { sn: "BQC2254800320", name: "TOYIN", ip: "192.168.3.199" },
  { sn: "BQC2254800364", name: "OGUNNAIKE", ip: "192.168.4.199" },
  { sn: "BQC2254800319", name: "APAPA", ip: "192.168.5.199" },
  { sn: "BQC2254800366", name: "RING ROAD", ip: "192.168.6.199" },
  { sn: "BQC2254800396", name: "AGUNGI", ip: "192.168.7.199" },
  { sn: "BQC2254800378", name: "FESTAC", ip: "192.168.8.199" },
  { sn: "BQC2254800363", name: "BODIJA", ip: "192.168.10.199" },
  { sn: "BQC2254800397", name: "BODE-THOMAS", ip: "192.168.9.199" },
  { sn: "BQC2254800023", name: "AJAO", ip: "192.168.11.199" },
  { sn: "BQC2254800343", name: "AJOSE", ip: "192.168.106.199" },
  { sn: "BQC2254800356", name: "GBAGADA", ip: "192.168.13.199" },
  { sn: "BQC2254800355", name: "WUSE 2", ip: "192.168.14.199" },
  { sn: "BQC2254800107", name: "MAGODO", ip: "192.168.15.199" },
  { sn: "BQC2254800354", name: "CHEVRON", ip: "192.168.102.199" },
  { sn: "BQC2254800382", name: "GWARINPA", ip: "192.168.17.199" },
  { sn: "BQC2254800047", name: "YABA", ip: "192.168.18.199" },
  { sn: "BQC2254800046", name: "AGIDINGBI", ip: "192.168.19.199" },
  { sn: "BQC2254800045", name: "OGUDU", ip: "192.168.104.199" },
  { sn: "BQC2254800021", name: "IKOTUN", ip: "192.168.105.199" },
  { sn: "BQC2254800020", name: "AROMIRE", ip: "192.168.101.199" },
  { sn: "BQC2254800032", name: "ADMIRALTY II", ip: "192.168.103.199" },
  { sn: "BQC2254800174", name: "OKOTA", ip: "192.168.24.199" },
  { sn: "BQC2254800166", name: "EGBEDA", ip: "192.168.25.199" },
  { sn: "BQC2254800168", name: "SANGOTEDO", ip: "192.168.107.199" },
  { sn: "BQC2254800169", name: "ILUPEJU", ip: "192.168.108.199" },
  { sn: "BQC2254800170", name: "IKORODU", ip: "192.168.109.199" },
  { sn: "BQC2254800167", name: "IDIMU", ip: "192.168.110.199" },
  { sn: "BQC2254800362", name: "OKO OBA", ip: "192.168.112.199" },
  { sn: "BQC2254800345", name: "IJU", ip: "192.168.113.199" },
  { sn: "BQC2254800321", name: "GARKI", ip: "192.168.114.199" },
  { sn: "BQC2254800346", name: "MARYLAND", ip: "192.168.115.199" },
  { sn: "BQC2254800347", name: "ABEOKUTA", ip: "192.168.116.199" },
  { sn: "BQC2254800360", name: "JAKANDE", ip: "192.168.120.199" },
  { sn: "BQC2254800197", name: "OTA", ip: "192.168.121.199" },
  { sn: "BQC2254800323", name: "IKOYI", ip: "192.168.123.199" },
  { sn: "BQC2254800198", name: "PH", ip: "192.168.125.199" },
  { sn: "BQC2254800200", name: "Satellite", ip: "192.168.126.199" },
  { sn: "BQC2254800203", name: "Jabi Mall", ip: "192.168.132.199" },
  { sn: "BQC2254800201", name: "Gateway Mall", ip: "192.168.133.199" },
  { sn: "BQC2254800202", name: "Itire", ip: "192.168.136.199" },
  { sn: "BQC2254800068", name: "Apo Mall", ip: "192.168.137.199" },
  { sn: "BQC2254800058", name: "Polo Park", ip: "192.168.138.199" },
  { sn: "BQC2254800067", name: "Kubwa", ip: "192.168.139.199" },
  { sn: "BQC2254800065", name: "Akure", ip: "192.168.140.199" },
  { sn: "BQC2254800066", name: "Ilorin", ip: "192.168.141.199" },
  { sn: "BQC2254800124", name: "Calabar", ip: "192.168.142.199" },
  { sn: "BQC2254800122", name: "Shell gate PH 2", ip: "192.168.143.199" },
  { sn: "BQC2254800115", name: "Jara Mall", ip: "192.168.144.199" },
  { sn: "BQC2254800123", name: "Badore", ip: "192.168.145.199" },
  { sn: "BQC2254800103", name: "Uyo", ip: "192.168.146.199" },
  { sn: "BQC2254800071", name: "Peter-Odili", ip: "192.168.147.199" },
  { sn: "BQC2254800256", name: "Asaba", ip: "192.168.148.199" },
  { sn: "BQC2254800121", name: "Benin-Sapele", ip: "192.168.149.199" },
  { sn: "BQC2254800373", name: "Benin-Ugbowo", ip: "192.168.151.199" },
  { sn: "BQC2254800331", name: "Aba", ip: "192.168.153.199" },
  { sn: "BQC2254800328", name: "Kano Bompai", ip: "192.168.154.199" },
  { sn: "BQC2254800329", name: "Warri", ip: "192.168.156.199" },
  { sn: "BQC2235300158", name: "Central Support Unit", ip: "172.16.1.196", connected: true },
  { sn: "BQC2254800020", name: "AROMIRE BIOMETRICS", ip: "192.168.101.199", connected: true },
  { sn: "BQC2254800348", name: "Challenge", ip: "192.168.158.199" },
  { sn: "BQC2254800349", name: "Nyanya", ip: "192.168.159.199" },
  { sn: "BQC2254800086", name: "Choba", ip: "192.168.160.199" },
  { sn: "BQC2254800088", name: "Barnawa", ip: "192.168.161.199" },
  { sn: "BQC2254800087", name: "Minna", ip: "192.168.162.199" },
  { sn: "BQC2254800091", name: "Ali Akilu", ip: "192.168.163.199" },
  { sn: "BQC2254800090", name: "Awka", ip: "192.168.164.199" },
  { sn: "BQC2254800085", name: "Owerri", ip: "192.168.165.199" },
  { sn: "BQC2254800358", name: "Jos", ip: "192.168.167.199" },
  { sn: "BQC2254800359", name: "Yenagoa", ip: "192.168.168.199" },
  { sn: "BQC2254800392", name: "Abiola Way", ip: "192.168.169.199" },
  { sn: "BQC2254800357", name: "Akobo", ip: "192.168.170.199" },
  { sn: "BQC2254800394", name: "Lasu-Iba", ip: "192.168.166.199" },
  { sn: "BQC2254800393", name: "Sawmill-Ikorodu", ip: "192.168.171.199" },
  { sn: "BQC2254800251", name: "Onitsha", ip: "192.168.172.199" },
  { sn: "BQC2254800261", name: "Ikota", ip: "192.168.173.199" },
  { sn: "BQC2254800254", name: "Awoyaya", ip: "192.168.174.199" },
  { sn: "BQC2254800252", name: "Prime Mall", ip: "192.168.175.199" },
  { sn: "BQC2254800255", name: "Freedom", ip: "192.168.176.199" },
  { sn: "BQC2254800012", name: "Mowe Warehouse", ip: "192.168.177.199" },
  { sn: "ECV3235300053", name: "Magboro-Commissary", ip: "192.168.150.2", connected: true },
];

// Simulate some devices being "online" for demo
const DEMO_DEVICES = STORES_FROM_PDF.map((d, i) => ({
  ...d,
  online: d.connected || Math.random() > 0.35,
  last_seen: d.connected
    ? new Date(Date.now() - Math.random() * 60000).toISOString()
    : new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
  user_count: Math.floor(Math.random() * 150) + 5,
  fp_count: Math.floor(Math.random() * 300) + 10,
}));

const DEMO_FEED = [
  { id: 1, name: "VICTORIA", pin: "122225", device: "AROMIRE BIOMETRICS", time: "09:09:15", type: "Unknown", verify: "Fingerprint" },
  { id: 2, name: "Oluwatomi", pin: "13959", device: "Central Support Unit", time: "08:57:39", type: "Check In", verify: "Fingerprint" },
  { id: 3, name: "Sadiq", pin: "1027", device: "Central Support Unit", time: "08:55:06", type: "Check In", verify: "Fingerprint" },
  { id: 4, name: "Ismail", pin: "13541", device: "Central Support Unit", time: "08:54:37", type: "Check In", verify: "Fingerprint" },
  { id: 5, name: "BISOLA", pin: "13675", device: "Magboro-Commissary", time: "08:54:22", type: "Check In", verify: "Face" },
  { id: 6, name: "ABDULRAHMAN", pin: "1452", device: "Magboro-Commissary", time: "08:54:17", type: "Check In", verify: "Fingerprint" },
  { id: 7, name: "ODUNUBI", pin: "12207", device: "Central Support Unit", time: "08:49:58", type: "Check In", verify: "Fingerprint" },
  { id: 8, name: "DENNIS", pin: "6040", device: "Magboro-Commissary", time: "08:40:48", type: "Check In", verify: "Fingerprint" },
];

// ── Color helpers ─────────────────────────────────────────────────────────────
const online = DEMO_DEVICES.filter((d) => d.online).length;
const offline = DEMO_DEVICES.length - online;

// ── Components ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  const colors = {
    green: "from-emerald-500 to-green-600",
    red: "from-rose-500 to-red-600",
    blue: "from-blue-500 to-indigo-600",
    amber: "from-amber-400 to-orange-500",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[accent] || colors.blue} rounded-2xl p-5 text-white shadow-lg`}>
      <div style={{ fontSize: 13, opacity: 0.85, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.1, margin: "6px 0 2px" }}>{value}</div>
      {sub && <div style={{ fontSize: 12, opacity: 0.8 }}>{sub}</div>}
    </div>
  );
}

function Badge({ online }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 10px", borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: online ? "#dcfce7" : "#fee2e2",
      color: online ? "#16a34a" : "#dc2626",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: online ? "#22c55e" : "#ef4444", display: "inline-block" }} />
      {online ? "ONLINE" : "OFFLINE"}
    </span>
  );
}

function PunchBadge({ type }) {
  const map = {
    "Check In":  ["#dcfce7", "#15803d"],
    "Check Out": ["#dbeafe", "#1d4ed8"],
    "Break Out": ["#fef9c3", "#a16207"],
    "Break In":  ["#e0f2fe", "#0369a1"],
    "OT In":     ["#f3e8ff", "#7e22ce"],
    "OT Out":    ["#fce7f3", "#9d174d"],
    "Unknown":   ["#f3f4f6", "#6b7280"],
  };
  const [bg, fg] = map[type] || map["Unknown"];
  return (
    <span style={{ background: bg, color: fg, padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
      {type}
    </span>
  );
}

// ── Pages ─────────────────────────────────────────────────────────────────────
function DashboardPage() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 8000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: "#111827" }}>
        Live Overview
      </h2>

      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Devices" value={DEMO_DEVICES.length} sub="87 deployed stores" accent="blue" />
        <StatCard label="Online Now" value={online} sub={`${Math.round(online/DEMO_DEVICES.length*100)}% reachable`} accent="green" />
        <StatCard label="Offline" value={offline} sub="Check VPN/network" accent="red" />
        <StatCard label="Today's Punches" value="1,247" sub="Across all locations" accent="amber" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Real-time feed */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>Real-Time Feed</span>
            <span style={{ fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", animation: "pulse 2s infinite" }} />
              LIVE
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {DEMO_FEED.map((r) => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", background: "#f9fafb", borderRadius: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {r.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.name}</div>
                  <div style={{ fontSize: 11, color: "#6b7280", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.device}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <PunchBadge type={r.type} />
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{r.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device status summary */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 14 }}>Device Status Summary</div>

          {/* Donut-like visual */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20, padding: 16, background: "#f9fafb", borderRadius: 12 }}>
            <svg viewBox="0 0 120 120" width={100} height={100}>
              <circle cx={60} cy={60} r={44} fill="none" stroke="#e5e7eb" strokeWidth={18} />
              <circle cx={60} cy={60} r={44} fill="none" stroke="#22c55e" strokeWidth={18}
                strokeDasharray={`${(online / DEMO_DEVICES.length) * 276.5} 276.5`}
                strokeDashoffset={69} strokeLinecap="round" transform="rotate(-90 60 60)" />
              <text x={60} y={65} textAnchor="middle" fontSize={18} fontWeight={800} fill="#111827">
                {Math.round(online / DEMO_DEVICES.length * 100)}%
              </text>
            </svg>
            <div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Online</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#16a34a" }}>{online}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Offline</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#dc2626" }}>{offline}</div>
              </div>
            </div>
          </div>

          {/* Top offline devices */}
          <div style={{ fontWeight: 600, fontSize: 13, color: "#374151", marginBottom: 8 }}>Offline Devices</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto" }}>
            {DEMO_DEVICES.filter((d) => !d.online).slice(0, 8).map((d) => (
              <div key={d.sn} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#fef2f2", borderRadius: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#991b1b" }}>{d.name}</span>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{d.ip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DevicesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = DEMO_DEVICES.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.sn.includes(search) || d.ip.includes(search);
    const matchFilter = filter === "all" || (filter === "online" && d.online) || (filter === "offline" && !d.online);
    return matchSearch && matchFilter;
  });

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: "#111827" }}>
        All Devices ({DEMO_DEVICES.length})
      </h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, serial, IP..."
          style={{ flex: 1, padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none" }}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, background: "#fff", outline: "none" }}
        >
          <option value="all">All ({DEMO_DEVICES.length})</option>
          <option value="online">Online ({online})</option>
          <option value="offline">Offline ({offline})</option>
        </select>
      </div>

      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["#", "Store Name", "Serial Number", "IP Address", "Status", "Users", "FP", "Last Seen"].map((h) => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 12, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d, i) => (
              <tr key={d.sn} style={{ borderBottom: "1px solid #f3f4f6", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "10px 14px", color: "#9ca3af", fontWeight: 600 }}>{i + 1}</td>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#111827" }}>{d.name}</td>
                <td style={{ padding: "10px 14px", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{d.sn}</td>
                <td style={{ padding: "10px 14px", color: "#6b7280", fontFamily: "monospace", fontSize: 12 }}>{d.ip}</td>
                <td style={{ padding: "10px 14px" }}><Badge online={d.online} /></td>
                <td style={{ padding: "10px 14px", color: "#374151" }}>{d.user_count}</td>
                <td style={{ padding: "10px 14px", color: "#374151" }}>{d.fp_count}</td>
                <td style={{ padding: "10px 14px", color: "#9ca3af", fontSize: 12 }}>
                  {d.online ? "Just now" : new Date(d.last_seen).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: "12px 16px", background: "#f9fafb", fontSize: 13, color: "#6b7280", borderTop: "1px solid #e5e7eb" }}>
          Showing {filtered.length} of {DEMO_DEVICES.length} devices
        </div>
      </div>
    </div>
  );
}

function AttendancePage() {
  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, color: "#111827" }}>Attendance Logs</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <input type="date" defaultValue="2026-04-16"
          style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none" }} />
        <select style={{ padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, background: "#fff", outline: "none" }}>
          <option>All Devices</option>
          {DEMO_DEVICES.filter(d=>d.online).map(d => <option key={d.sn}>{d.name}</option>)}
        </select>
        <input placeholder="Search employee..." style={{ flex:1, padding: "10px 14px", border: "1px solid #e5e7eb", borderRadius: 10, fontSize: 14, outline: "none" }} />
      </div>
      <div style={{ background: "#fff", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              {["Employee PIN", "Name", "Device", "Punch Time", "Type", "Verify Method"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DEMO_FEED.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #f3f4f6", background: i%2===0?"#fff":"#fafafa" }}>
                <td style={{ padding: "10px 14px", fontFamily: "monospace", color: "#6b7280" }}>{r.pin}</td>
                <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827" }}>{r.name}</td>
                <td style={{ padding: "10px 14px", color: "#6b7280" }}>{r.device}</td>
                <td style={{ padding: "10px 14px", color: "#374151" }}>2026-04-16 {r.time}</td>
                <td style={{ padding: "10px 14px" }}><PunchBadge type={r.type} /></td>
                <td style={{ padding: "10px 14px", color: "#6b7280", fontSize: 12 }}>{r.verify}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SetupPage() {
  const [copied, setCopied] = useState("");
  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 2000);
  };

  const codeBlock = (label, code, key) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#6b7280", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</div>
      <div style={{ position: "relative" }}>
        <pre style={{ background: "#1e293b", color: "#e2e8f0", padding: "14px 16px", borderRadius: 10, fontSize: 13, overflowX: "auto", margin: 0, lineHeight: 1.6, fontFamily: "monospace" }}>
          {code}
        </pre>
        <button onClick={() => copy(code, key)}
          style={{ position: "absolute", top: 8, right: 8, background: copied===key?"#22c55e":"#334155", color: "#fff", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
          {copied===key ? "✓ Copied" : "Copy"}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: "#111827" }}>Setup Guide</h2>
      <p style={{ color: "#6b7280", marginBottom: 24, fontSize: 14 }}>How to deploy the ADMS backend and connect all 87 devices.</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 16 }}>
            1. Laravel Backend Installation
          </div>
          {codeBlock("Add routes to routes/web.php", `// Include the ZK routes file
require base_path('routes/zk_routes.php');`, "r1")}
          {codeBlock("Exclude ICLOCK from CSRF (VerifyCsrfToken.php)", `protected $except = [
    'iclock/*',
];`, "r2")}
          {codeBlock("Run migrations", `php artisan migrate`, "r3")}
          {codeBlock("Your server URL (set on each device)", `http://YOUR-SERVER-IP:8089`, "r4")}
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 16 }}>
            2. Configure Each ZKTeco Device
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              ["On device screen", "Menu → Comm → Cloud Server Settings"],
              ["Enable", "ADMS → ON"],
              ["Server Address", "http://YOUR-SERVER-IP"],
              ["Port", "8089 (or your app port)"],
              ["Protocol", "HTTP (not HTTPS unless you have SSL)"],
            ].map(([k,v]) => (
              <div key={k} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "#f9fafb", borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: "#6b7280", minWidth: 130, fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: 12, color: "#111827", fontFamily: k==="Server Address"||k==="Port"||k==="Protocol"?"monospace":"inherit", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 12, background: "#fffbeb", borderRadius: 8, border: "1px solid #fbbf24" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>⚠ Network Requirement</div>
            <div style={{ fontSize: 12, color: "#78350f" }}>
              Each store device must be able to reach your server IP. This works via VPN (OpenVPN/WireGuard) or direct internet with firewall rules allowing inbound on port 8089.
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, padding: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", gridColumn: "1 / -1" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "#111827", marginBottom: 16 }}>
            3. Bulk Pre-Register All 87 Devices (Laravel Seeder)
          </div>
          {codeBlock("database/seeders/DeviceSeeder.php — run: php artisan db:seed --class=DeviceSeeder", `<?php
use App\\Models\\Device;

$devices = [
  ['serial_number'=>'BQC2254800326','name'=>'SAKA',       'ip_address'=>'192.168.155.199'],
  ['serial_number'=>'BQC2254800342','name'=>'ADMIRALTY',  'ip_address'=>'192.168.2.199'],
  ['serial_number'=>'BQC2254800320','name'=>'TOYIN',      'ip_address'=>'192.168.3.199'],
  // ... all 87 devices (full list in zk_routes.php seeder file)
];

foreach ($devices as $d) {
    Device::updateOrCreate(['serial_number' => $d['serial_number']], $d);
}`, "r5")}
        </div>
      </div>
    </div>
  );
}

// ── App Shell ─────────────────────────────────────────────────────────────────
const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "◉" },
  { key: "devices",   label: "Devices",   icon: "⬡" },
  { key: "attendance",label: "Attendance",icon: "⏱" },
  { key: "setup",     label: "Setup Guide",icon: "⚙" },
];

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pages = { dashboard: <DashboardPage />, devices: <DevicesPage />, attendance: <AttendancePage />, setup: <SetupPage /> };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#f3f4f6" }}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #f1f5f9; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 230, background: "#0f172a", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "22px 20px 16px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#22c55e,#16a34a)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              🖐
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#f1f5f9" }}>ZK Manager</div>
              <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "0.1em" }}>EATNGO AFRICA</div>
            </div>
          </div>
        </div>

        {/* Server status */}
        <div style={{ margin: "14px 16px", padding: "10px 12px", background: "#1e293b", borderRadius: 10 }}>
          <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 4 }}>ADMS SERVER</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s infinite", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>RUNNING</span>
          </div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 3, fontFamily: "monospace" }}>
            /iclock/cdata
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "8px 12px" }}>
          {NAV.map((n) => (
            <button key={n.key} onClick={() => setPage(n.key)}
              style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer",
                background: page===n.key ? "#1e293b" : "transparent",
                color: page===n.key ? "#f1f5f9" : "#64748b",
                fontWeight: page===n.key ? 700 : 500,
                fontSize: 14, marginBottom: 2, textAlign: "left",
                transition: "all 0.15s",
              }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              {n.label}
              {n.key==="devices" && (
                <span style={{ marginLeft: "auto", background: "#22c55e", color: "#fff", borderRadius: 999, padding: "1px 7px", fontSize: 10, fontWeight: 800 }}>
                  {online}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: "14px 16px", borderTop: "1px solid #1e293b" }}>
          <div style={{ fontSize: 10, color: "#475569", marginBottom: 2 }}>
            {time.toLocaleDateString('en-NG', { weekday:'short', day:'2-digit', month:'short', year:'numeric' })}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#94a3b8", fontFamily: "monospace" }}>
            {time.toLocaleTimeString('en-NG')}
          </div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Topbar */}
        <div style={{ background: "#fff", padding: "14px 28px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 10 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#111827" }}>
              {NAV.find(n=>n.key===page)?.label}
            </div>
            <div style={{ fontSize: 12, color: "#9ca3af" }}>
              {DEMO_DEVICES.length} devices registered · {online} online · {offline} offline
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 12, color: "#6b7280", background: "#f3f4f6", padding: "6px 12px", borderRadius: 8 }}>
              🔗 https://engobio.coldstonecreamery.ng
            </div>
            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
              T
            </div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ padding: 28 }}>
          {pages[page]}
        </div>
      </main>
    </div>
  );
}
