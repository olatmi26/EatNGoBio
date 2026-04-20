import { useState } from "react";
import { usePage } from "@inertiajs/react";
import AppLayout from '@/Layouts/AppLayout';
import { useTheme } from '@/contexts/ThemeContext';
import type { PageProps } from '@/types';

interface DepartmentStat {
  id: number;
  department: string;
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
  trend: number[];
  topPerformers: Array<{ name: string; rate: number; streak: number }>;
  absenteeismTrend: Array<{ week: string; rate: number }>;
  color: string;
}

interface LocationStat {
  id: number;
  location: string;
  totalEmployees: number;
  presentToday: number;
  attendanceRate: number;
  devices: number;
  onlineDevices: number;
  trend: number[];
  color: string;
}

interface DeviceStat {
  id: number;
  deviceName: string;
  location: string;
  status: 'online' | 'offline' | 'syncing' | 'unregistered';
  punchesToday: number;
  lastSync: string;
  successRate: number;
  weeklyPunches: number[];
}

interface WeeklyTrendItem {
  day: string;
  date: string;
  rate: number;
  present: number;
  absent: number;
}

interface Props extends PageProps {
  deptStats?: DepartmentStat[];
  locationStats?: LocationStat[];
  deviceStats?: DeviceStat[];
  weeklyTrend?: WeeklyTrendItem[];
}

type AnalyticsTab = 'departments' | 'locations' | 'devices';

export default function AnalyticsPage() {
  const { isDark } = useTheme();
  const { props } = usePage<Props>();
  
  // Access data from props with defaults
  const deptStats = props.deptStats || [];
  const locationStats = props.locationStats || [];
  const deviceStats = props.deviceStats || [];
  const weeklyTrend = props.weeklyTrend || [];
  
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('departments');
  const [selectedDept, setSelectedDept] = useState<number | null>(null);

  const bg = isDark ? '#111827' : '#f8fafc';
  const cardBg = isDark ? '#1f2937' : '#ffffff';
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const subCardBg = isDark ? '#374151' : '#f9fafb';

  // Calculate totals with safety checks
  const totalEmployees = deptStats.length > 0 
    ? deptStats.reduce((s, d) => s + (d.totalEmployees ?? 0), 0) 
    : 0;
    
  const totalPresent = deptStats.length > 0 
    ? deptStats.reduce((s, d) => s + (d.presentToday ?? 0), 0) 
    : 0;
    
  const totalAbsent = deptStats.length > 0 
    ? deptStats.reduce((s, d) => s + (d.absentToday ?? 0), 0) 
    : 0;
    
  const totalLate = deptStats.length > 0 
    ? deptStats.reduce((s, d) => s + (d.lateToday ?? 0), 0) 
    : 0;
    
  const avgRate = deptStats.length > 0 
    ? deptStats.reduce((s, d) => s + (d.attendanceRate ?? 0), 0) / deptStats.length 
    : 0;

  const selectedDeptData = selectedDept 
    ? deptStats.find((d) => d.id === selectedDept) 
    : null;

  const MiniSparkline = ({ data, color }: { data: number[]; color: string }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 80;
    const h = 32;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    }).join(' ');
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={parseFloat(points.split(' ').pop()!.split(',')[0])} cy={parseFloat(points.split(' ').pop()!.split(',')[1])} r="3" fill={color} />
      </svg>
    );
  };

  const MiniBarChart = ({ data, color }: { data: number[]; color: string }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data, 1);
    const w = 80;
    const h = 32;
    const barW = w / data.length - 2;
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        {data.map((v, i) => {
          const barH = (v / max) * h;
          const x = i * (w / data.length) + 1;
          const y = h - barH;
          return <rect key={i} x={x} y={y} width={barW} height={barH} rx="2" fill={v === 0 ? (isDark ? '#374151' : '#e5e7eb') : color} opacity={i === data.length - 1 ? 1 : 0.6} />;
        })}
      </svg>
    );
  };

  const AbsenteeismChart = ({ data, color }: { data: { week: string; rate: number }[]; color: string }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data.map(d => d.rate), 1);
    return (
      <div className="flex items-end gap-1 h-12">
        {data.map((d, idx) => (
          <div key={idx} className="flex flex-col items-center gap-0.5 flex-1">
            <div className="w-full rounded-t" style={{ height: `${(d.rate / max) * 40}px`, background: color, opacity: 0.7 }}></div>
            <span className="text-xs" style={{ color: textSecondary, fontSize: '9px' }}>{d.week}</span>
          </div>
        ))}
      </div>
    );
  };

  const tabs: { key: AnalyticsTab; label: string; icon: string }[] = [
    { key: 'departments', label: 'Department Analytics', icon: 'ri-building-2-line' },
    { key: 'locations', label: 'Location Analytics', icon: 'ri-map-pin-line' },
    { key: 'devices', label: 'Device Analytics', icon: 'ri-device-line' },
  ];

  // Get today's date for display
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  return (
    <AppLayout title="Analytics">
      <div className="p-4 md:p-6" style={{ background: bg, minHeight: '100vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold" style={{ color: textPrimary }}>Attendance Analytics</h1>
            <p className="text-sm mt-0.5" style={{ color: textSecondary }}>Department, location, and device-level attendance insights</p>
          </div>
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: '#dcfce7', color: '#16a34a' }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#16a34a' }}></div>
            Live · Today, {today}
          </div>
        </div>

        {/* Top KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total Employees', value: totalEmployees.toLocaleString(), icon: 'ri-team-line', color: '#16a34a', bg: '#dcfce7' },
            { label: 'Present Today', value: totalPresent.toLocaleString(), icon: 'ri-checkbox-circle-line', color: '#16a34a', bg: '#dcfce7' },
            { label: 'Absent Today', value: totalAbsent.toLocaleString(), icon: 'ri-close-circle-line', color: '#dc2626', bg: '#fee2e2' },
            { label: 'Late Today', value: totalLate.toLocaleString(), icon: 'ri-alarm-warning-line', color: '#f59e0b', bg: '#fef9c3' },
            { label: 'Avg Attendance Rate', value: `${avgRate.toFixed(1)}%`, icon: 'ri-percent-line', color: '#7c3aed', bg: '#ede9fe' },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl flex items-center gap-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                <i className={`${s.icon} text-lg`} style={{ color: s.color }}></i>
              </div>
              <div>
                <p className="text-xl font-bold leading-tight" style={{ color: textPrimary }}>{s.value}</p>
                <p className="text-xs leading-tight" style={{ color: textSecondary }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto" style={{ borderBottom: `1px solid ${border}` }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
              style={{
                color: activeTab === tab.key ? '#16a34a' : textSecondary,
                borderBottom: activeTab === tab.key ? '2px solid #16a34a' : '2px solid transparent',
              }}
            >
              <i className={tab.icon}></i>
              {tab.label}
            </button>
          ))}
        </div>

        {/* DEPARTMENTS TAB */}
        {activeTab === 'departments' && (
          <div className="space-y-5">
            {deptStats.length === 0 ? (
              <div className="p-8 text-center rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <i className="ri-building-2-line text-4xl mb-3 block" style={{ color: textSecondary }}></i>
                <p className="text-sm font-medium" style={{ color: textPrimary }}>No department data available</p>
                <p className="text-xs mt-1" style={{ color: textSecondary }}>Department statistics will appear here once attendance data is collected</p>
              </div>
            ) : (
              <>
                {/* Overall rate bar */}
                <div className="p-5 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <h3 className="text-sm font-semibold mb-4" style={{ color: textPrimary }}>Department Attendance Rate Comparison</h3>
                  <div className="space-y-3">
                    {[...deptStats].sort((a, b) => b.attendanceRate - a.attendanceRate).map(dept => (
                      <div key={dept.id} className="flex items-center gap-3">
                        <div className="w-36 text-xs font-medium truncate" style={{ color: textPrimary }}>{dept.department}</div>
                        <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: isDark ? '#374151' : '#f3f4f6' }}>
                          <div
                            className="h-full rounded-full flex items-center justify-end pr-2 transition-all"
                            style={{
                              width: `${dept.attendanceRate}%`,
                              background: dept.attendanceRate >= 95 ? '#16a34a' : dept.attendanceRate >= 85 ? '#f59e0b' : '#dc2626',
                            }}
                          >
                            <span className="text-white text-xs font-bold">{dept.attendanceRate.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="w-20 text-right text-xs" style={{ color: textSecondary }}>
                          {dept.presentToday}/{dept.totalEmployees}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Department cards grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {deptStats.map(dept => (
                    <div
                      key={dept.id}
                      className="p-5 rounded-xl cursor-pointer transition-all"
                      style={{
                        background: cardBg,
                        border: `1px solid ${selectedDept === dept.id ? dept.color : border}`,
                        outline: selectedDept === dept.id ? `2px solid ${dept.color}20` : 'none',
                      }}
                      onClick={() => setSelectedDept(selectedDept === dept.id ? null : dept.id)}
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold" style={{ color: textPrimary }}>{dept.department}</h4>
                          <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{dept.totalEmployees} employees</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {dept.trend && dept.trend.length > 0 && <MiniSparkline data={dept.trend} color={dept.color} />}
                          <span className="text-lg font-bold" style={{ color: dept.attendanceRate >= 95 ? '#16a34a' : dept.attendanceRate >= 85 ? '#f59e0b' : '#dc2626' }}>
                            {dept.attendanceRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>

                      {/* Stats row */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                          { label: 'Present', value: dept.presentToday, color: '#16a34a', bg: '#dcfce7' },
                          { label: 'Absent', value: dept.absentToday, color: '#dc2626', bg: '#fee2e2' },
                          { label: 'Late', value: dept.lateToday, color: '#f59e0b', bg: '#fef9c3' },
                        ].map(s => (
                          <div key={s.label} className="p-2 rounded-lg text-center" style={{ background: s.bg }}>
                            <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
                            <p className="text-xs" style={{ color: s.color, opacity: 0.8 }}>{s.label}</p>
                          </div>
                        ))}
                      </div>

                      {/* Absenteeism trend */}
                      {dept.absenteeismTrend && dept.absenteeismTrend.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium mb-1.5" style={{ color: textSecondary }}>Absenteeism Trend (4 weeks)</p>
                          <AbsenteeismChart data={dept.absenteeismTrend} color={dept.color} />
                        </div>
                      )}

                      {/* Top performers */}
                      {dept.topPerformers && dept.topPerformers.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-2" style={{ color: textSecondary }}>Top Performers</p>
                          <div className="space-y-1.5">
                            {dept.topPerformers.slice(0, 2).map((p, i) => (
                              <div key={p.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                    style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : '#cd7f32' }}>
                                    {i + 1}
                                  </div>
                                  <span className="text-xs truncate" style={{ color: textPrimary, maxWidth: '120px' }}>{p.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>{p.rate}%</span>
                                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#16a34a' }}>
                                    {p.streak}d
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Expanded dept detail */}
                {selectedDeptData && (
                  <div className="p-5 rounded-xl" style={{ background: cardBg, border: `2px solid ${selectedDeptData.color}` }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-bold" style={{ color: textPrimary }}>{selectedDeptData.department} — Detailed View</h3>
                      <button onClick={() => setSelectedDept(null)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary, background: subCardBg }}>
                        <i className="ri-close-line text-sm"></i>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* Full top performers */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3" style={{ color: textPrimary }}>All Top Performers</h4>
                        <div className="space-y-2">
                          {selectedDeptData.topPerformers?.map((p, i) => (
                            <div key={p.name} className="flex items-center justify-between p-3 rounded-xl" style={{ background: subCardBg }}>
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                  style={{ background: i === 0 ? '#f59e0b' : i === 1 ? '#9ca3af' : '#cd7f32' }}>
                                  {i + 1}
                                </div>
                                <div>
                                  <p className="text-sm font-medium" style={{ color: textPrimary }}>{p.name}</p>
                                  <p className="text-xs" style={{ color: textSecondary }}>{p.streak} day streak</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold" style={{ color: '#16a34a' }}>{p.rate}%</p>
                                <p className="text-xs" style={{ color: textSecondary }}>attendance</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Weekly trend */}
                      <div>
                        <h4 className="text-sm font-semibold mb-3" style={{ color: textPrimary }}>7-Day Attendance Trend</h4>
                        {selectedDeptData.trend && selectedDeptData.trend.length > 0 ? (
                          <div className="flex items-end gap-2 h-32">
                            {selectedDeptData.trend.map((v, i) => {
                              const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                              const max = Math.max(...selectedDeptData.trend);
                              return (
                                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                                  <span className="text-xs font-semibold" style={{ color: textPrimary }}>{v}%</span>
                                  <div className="w-full rounded-t transition-all" style={{
                                    height: `${(v / max) * 80}px`,
                                    background: v >= 95 ? '#16a34a' : v >= 85 ? '#f59e0b' : '#dc2626',
                                    opacity: i >= 5 ? 0.3 : 1,
                                  }}></div>
                                  <span className="text-xs" style={{ color: textSecondary }}>{days[i]}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: textSecondary }}>No trend data available</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* LOCATIONS TAB */}
        {activeTab === 'locations' && (
          <div className="space-y-5">
            {locationStats.length === 0 ? (
              <div className="p-8 text-center rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <i className="ri-map-pin-line text-4xl mb-3 block" style={{ color: textSecondary }}></i>
                <p className="text-sm font-medium" style={{ color: textPrimary }}>No location data available</p>
                <p className="text-xs mt-1" style={{ color: textSecondary }}>Location statistics will appear here once data is collected</p>
              </div>
            ) : (
              <>
                {/* Map-style overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Summary */}
                  <div className="p-5 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: textPrimary }}>Location Summary</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Total Locations', value: locationStats.length, color: '#16a34a' },
                        { label: 'Total Employees', value: locationStats.reduce((s, l) => s + (l.totalEmployees || 0), 0), color: '#0891b2' },
                        { label: 'Present Today', value: locationStats.reduce((s, l) => s + (l.presentToday || 0), 0), color: '#16a34a' },
                        { label: 'Online Devices', value: locationStats.reduce((s, l) => s + (l.onlineDevices || 0), 0), color: '#16a34a' },
                        { label: 'Offline Devices', value: locationStats.reduce((s, l) => s + ((l.devices || 0) - (l.onlineDevices || 0)), 0), color: '#dc2626' },
                      ].map(s => (
                        <div key={s.label} className="flex items-center justify-between py-2" style={{ borderBottom: `1px solid ${border}` }}>
                          <span className="text-sm" style={{ color: textSecondary }}>{s.label}</span>
                          <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rate ranking */}
                  <div className="lg:col-span-2 p-5 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: textPrimary }}>Location Attendance Rate Ranking</h3>
                    <div className="space-y-2.5">
                      {[...locationStats].sort((a, b) => b.attendanceRate - a.attendanceRate).map((loc, i) => (
                        <div key={loc.id} className="flex items-center gap-3">
                          <span className="text-xs font-bold w-5 text-center" style={{ color: i < 3 ? '#f59e0b' : textSecondary }}>#{i + 1}</span>
                          <div className="w-32 text-xs font-medium truncate" style={{ color: textPrimary }}>{loc.location}</div>
                          <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: isDark ? '#374151' : '#f3f4f6' }}>
                            <div className="h-full rounded-full" style={{
                              width: `${loc.attendanceRate}%`,
                              background: loc.attendanceRate >= 95 ? '#16a34a' : loc.attendanceRate >= 85 ? '#f59e0b' : '#dc2626',
                            }}></div>
                          </div>
                          <span className="text-xs font-bold w-12 text-right" style={{ color: textPrimary }}>{loc.attendanceRate.toFixed(1)}%</span>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: loc.onlineDevices === loc.devices ? '#16a34a' : '#dc2626' }}></div>
                            <span className="text-xs" style={{ color: textSecondary }}>{loc.onlineDevices}/{loc.devices}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Location cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {locationStats.map(loc => (
                    <div key={loc.id} className="p-4 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-semibold" style={{ color: textPrimary }}>{loc.location}</h4>
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className="w-2 h-2 rounded-full" style={{ background: loc.onlineDevices === loc.devices ? '#16a34a' : '#dc2626' }}></div>
                            <span className="text-xs" style={{ color: textSecondary }}>{loc.onlineDevices}/{loc.devices} devices online</span>
                          </div>
                        </div>
                        <span className="text-lg font-bold" style={{ color: loc.attendanceRate >= 95 ? '#16a34a' : loc.attendanceRate >= 85 ? '#f59e0b' : '#dc2626' }}>
                          {loc.attendanceRate.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-center">
                          <p className="text-base font-bold" style={{ color: '#16a34a' }}>{loc.presentToday}</p>
                          <p className="text-xs" style={{ color: textSecondary }}>Present</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold" style={{ color: '#dc2626' }}>{loc.totalEmployees - loc.presentToday}</p>
                          <p className="text-xs" style={{ color: textSecondary }}>Absent</p>
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold" style={{ color: textPrimary }}>{loc.totalEmployees}</p>
                          <p className="text-xs" style={{ color: textSecondary }}>Total</p>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? '#374151' : '#f3f4f6' }}>
                        <div className="h-full rounded-full" style={{
                          width: `${loc.attendanceRate}%`,
                          background: loc.attendanceRate >= 95 ? '#16a34a' : loc.attendanceRate >= 85 ? '#f59e0b' : '#dc2626',
                        }}></div>
                      </div>
                      {loc.trend && loc.trend.length > 0 && (
                        <div className="mt-3">
                          <MiniSparkline data={loc.trend} color={loc.color} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* DEVICES TAB */}
        {activeTab === 'devices' && (
          <div className="space-y-5">
            {deviceStats.length === 0 ? (
              <div className="p-8 text-center rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                <i className="ri-device-line text-4xl mb-3 block" style={{ color: textSecondary }}></i>
                <p className="text-sm font-medium" style={{ color: textPrimary }}>No device data available</p>
                <p className="text-xs mt-1" style={{ color: textSecondary }}>Device statistics will appear here once devices are registered</p>
              </div>
            ) : (
              <>
                {/* Device summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Devices', value: deviceStats.length, icon: 'ri-device-line', color: '#16a34a', bg: '#dcfce7' },
                    { label: 'Online', value: deviceStats.filter(d => d.status === 'online').length, icon: 'ri-wifi-line', color: '#16a34a', bg: '#dcfce7' },
                    { label: 'Offline', value: deviceStats.filter(d => d.status === 'offline').length, icon: 'ri-wifi-off-line', color: '#dc2626', bg: '#fee2e2' },
                    { label: 'Total Punches Today', value: deviceStats.reduce((s, d) => s + (d.punchesToday || 0), 0), icon: 'ri-fingerprint-line', color: '#7c3aed', bg: '#ede9fe' },
                  ].map(s => (
                    <div key={s.label} className="p-4 rounded-xl flex items-center gap-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
                        <i className={`${s.icon} text-lg`} style={{ color: s.color }}></i>
                      </div>
                      <div>
                        <p className="text-xl font-bold" style={{ color: textPrimary }}>{s.value}</p>
                        <p className="text-xs" style={{ color: textSecondary }}>{s.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Device table */}
                <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
                  <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${border}` }}>
                    <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Device Performance Overview</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${border}` }}>
                          {['Device', 'Location', 'Status', 'Punches Today', 'Last Sync', 'Success Rate', 'Weekly Trend'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {deviceStats.map(dev => (
                          <tr key={dev.id} style={{ borderBottom: `1px solid ${border}` }}
                            onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = isDark ? '#374151' : '#f9fafb'; }}
                            onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: dev.status === 'online' ? '#dcfce7' : '#fee2e2' }}>
                                  <i className="ri-device-line text-sm" style={{ color: dev.status === 'online' ? '#16a34a' : '#dc2626' }}></i>
                                </div>
                                <span className="text-sm font-medium" style={{ color: textPrimary }}>{dev.deviceName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{dev.location}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                                style={{ background: dev.status === 'online' ? '#dcfce7' : '#fee2e2', color: dev.status === 'online' ? '#16a34a' : '#dc2626' }}>
                                <div className={`w-1.5 h-1.5 rounded-full ${dev.status === 'online' ? 'animate-pulse' : ''}`} style={{ background: dev.status === 'online' ? '#16a34a' : '#dc2626' }}></div>
                                {dev.status === 'online' ? 'Online' : 'Offline'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: dev.punchesToday > 0 ? textPrimary : textSecondary }}>
                              {dev.punchesToday > 0 ? dev.punchesToday : '—'}
                            </td>
                            <td className="px-4 py-3 text-xs font-mono whitespace-nowrap" style={{ color: textSecondary }}>{dev.lastSync}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: isDark ? '#374151' : '#f3f4f6', minWidth: '60px' }}>
                                  <div className="h-full rounded-full" style={{
                                    width: `${dev.successRate}%`,
                                    background: dev.successRate >= 97 ? '#16a34a' : dev.successRate >= 90 ? '#f59e0b' : '#dc2626',
                                  }}></div>
                                </div>
                                <span className="text-xs font-semibold" style={{ color: textPrimary }}>{dev.successRate}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {dev.weeklyPunches && dev.weeklyPunches.length > 0 && (
                                <MiniBarChart data={dev.weeklyPunches} color={dev.status === 'online' ? '#16a34a' : '#dc2626'} />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Device punch distribution chart */}
                {deviceStats.some(d => d.punchesToday > 0) && (
                  <div className="p-5 rounded-xl" style={{ background: cardBg, border: `1px solid ${border}` }}>
                    <h3 className="text-sm font-semibold mb-4" style={{ color: textPrimary }}>Punches Distribution by Device (Today)</h3>
                    <div className="space-y-3">
                      {deviceStats.filter(d => d.punchesToday > 0).sort((a, b) => b.punchesToday - a.punchesToday).map(dev => {
                        const maxPunches = Math.max(...deviceStats.map(d => d.punchesToday));
                        return (
                          <div key={dev.id} className="flex items-center gap-3">
                            <div className="w-32 text-xs font-medium truncate" style={{ color: textPrimary }}>{dev.deviceName}</div>
                            <div className="flex-1 h-6 rounded-full overflow-hidden" style={{ background: isDark ? '#374151' : '#f3f4f6' }}>
                              <div className="h-full rounded-full flex items-center justify-end pr-2"
                                style={{ width: `${(dev.punchesToday / maxPunches) * 100}%`, background: '#16a34a' }}>
                                <span className="text-white text-xs font-bold">{dev.punchesToday}</span>
                              </div>
                            </div>
                            <div className="w-24 text-xs text-right" style={{ color: textSecondary }}>{dev.location}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}