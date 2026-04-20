import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { PageProps } from '@/types';
interface AdminDashboardProps extends PageProps {
  assets: any[];
  tickets: any[];
  alerts: any[];
  users: any[];
  officerPerf: { name: string; tickets: number; resolved: number; assets: number }[];
  totalValue: number;
  activeAssets: number;
  openTickets: number;
  criticalAlerts: number;
}

export default function AdminDashboard({ assets, alerts, users, officerPerf, totalValue, activeAssets, openTickets, criticalAlerts }: AdminDashboardProps) {
  const categoryCount = assets.reduce((acc: Record<string, number>, asset: any) => {
    const key = asset.category?.name ?? "Uncategorized";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <AppLayout>
      <Head title="IT Admin Dashboard" />
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">IT Admin Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">Infrastructure overview · April 13, 2026</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white hover:bg-slate-50 cursor-pointer whitespace-nowrap font-medium text-slate-600">
            <i className="ri-download-2-line text-slate-500"></i>Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Asset Value", value: `₦${(totalValue / 1000).toFixed(0)}K`, icon: "ri-money-dollar-circle-fill", color: "bg-emerald-50 text-emerald-600", sub: "Across all categories" },
          { label: "Active Assets", value: `${activeAssets}/${assets.length}`, icon: "ri-checkbox-circle-fill", color: "bg-blue-50 text-blue-600", sub: `${assets.length > 0 ? Math.round((activeAssets / assets.length) * 100) : 0}% utilization` },
          { label: "Open Tickets", value: openTickets, icon: "ri-ticket-2-fill", color: "bg-orange-50 text-orange-600", sub: `${criticalAlerts} critical alerts` },
          { label: "IT Officers", value: users.filter((u) => (u.roles ?? []).some((r: any) => r.name === "IT Officer")).length, icon: "ri-user-settings-fill", color: "bg-teal-50 text-teal-600", sub: "Active staff" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                <i className={`${s.icon} text-lg`}></i>
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800">{s.value}</p>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{s.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h3 className="text-sm font-bold text-slate-800 mb-3">Assets by Category</h3>
        <div className="space-y-2">
          {Object.entries(categoryCount).map(([category, count]) => (
            <div key={category} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{category}</span>
              <span className="font-semibold text-slate-800">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Officer Performance */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">IT Officer Performance</h3>
            <p className="text-xs text-slate-400 mt-0.5">This month</p>
          </div>
          <div className="divide-y divide-slate-50">
            {officerPerf.map((o, i) => (
              <div key={o.name} className="flex items-center gap-4 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {o.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{o.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-400">{o.tickets} tickets</span>
                    <span className="text-xs text-emerald-600 font-medium">{o.resolved} resolved</span>
                    <span className="text-xs text-slate-400">{o.assets} assets</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{Math.round((o.resolved / o.tickets) * 100)}%</p>
                  <p className="text-xs text-slate-400">resolution</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">User Roles</h3>
          <div className="space-y-2">
            {users.slice(0, 8).map((u) => (
              <div key={u.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">{u.name}</span>
                <span className="text-slate-400">{u.roles?.[0]?.name ?? 'User'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Recent Alerts */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Recent Alerts</h3>
          <a href="/alerts" className="text-xs text-emerald-600 font-medium hover:underline cursor-pointer">View all</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                {["Severity", "Alert", "Asset", "Officer", "Date", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 5).map(a => (
                <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-all">
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.severity === "Critical" ? "bg-red-100 text-red-700" : a.severity === "High" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`}>{a.severity}</span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 text-sm">{a.title}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{a.asset?.asset_code ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{a.officer?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{a.alert_date?.slice(0, 10) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === "Active" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </AppLayout>
  );
}
