import { useTheme } from '@/contexts/ThemeContext';

interface HourlyRow { hour: string; count: number; }

export default function AttendanceChart({ hourlyData, totalToday }: { hourlyData: HourlyRow[]; totalToday: number }) {
    const { isDark } = useTheme();
    const maxCount = Math.max(...hourlyData.map(d => d.count), 1);
    const cardBg = isDark ? '#1e293b' : '#ffffff';
    const cardBorder = isDark ? '#334155' : '#e5e7eb';
    const innerBg = isDark ? '#0f172a' : '#f8fafc';
    const divider = isDark ? '#334155' : '#f1f5f9';
    const textPrimary = isDark ? '#f1f5f9' : '#111827';
    const textSecondary = isDark ? '#94a3b8' : '#6b7280';
    const textMuted = isDark ? '#64748b' : '#9ca3af';

    const peakHour = hourlyData.reduce((a, b) => b.count > a.count ? b : a, { hour: '-', count: 0 });
    const avgPerHour = hourlyData.length ? Math.round(hourlyData.reduce((s, r) => s + r.count, 0) / hourlyData.filter(r => r.count > 0).length || 1) : 0;

    return (
        <div className="rounded-xl p-5 h-full" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="flex items-center justify-between mb-5">
                <div>
                    <h3 className="font-semibold text-base" style={{ color: textPrimary }}>Today's Attendance</h3>
                    <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Hourly check-in volume</p>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: '#16a34a' }}></div>
                    <span className="text-xs" style={{ color: textSecondary }}>Check-ins</span>
                </div>
            </div>

            <div className="flex items-end gap-2" style={{ height: '120px' }}>
                {hourlyData.map(d => {
                    const heightPct = (d.count / maxCount) * 100;
                    return (
                        <div key={d.hour} className="flex-1 flex flex-col items-center gap-1 group">
                            <div className="relative w-full flex items-end justify-center" style={{ height: '100px' }}>
                                <div className="w-full rounded-t-md transition-all duration-500 relative overflow-hidden" style={{ height: `${Math.max(heightPct, 2)}%`, background: 'linear-gradient(180deg, #16a34a 0%, #15803d 100%)', minHeight: '4px' }}>
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(255,255,255,0.15)' }}></div>
                                </div>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-lg text-xs font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none" style={{ background: '#16a34a' }}>{d.count}</div>
                            </div>
                            <span className="text-xs" style={{ color: textMuted, fontSize: '10px' }}>{d.hour.split(':')[0]}</span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 grid grid-cols-3 gap-3" style={{ borderTop: `1px solid ${divider}` }}>
                {[
                    { label: 'Peak Hour',   value: peakHour.hour,           icon: 'ri-time-line',        color: '#16a34a' },
                    { label: 'Total Today', value: totalToday.toLocaleString(), icon: 'ri-user-follow-line', color: '#d97706' },
                    { label: 'Avg/Hour',    value: avgPerHour.toLocaleString(), icon: 'ri-bar-chart-line',   color: '#16a34a' },
                ].map(s => (
                    <div key={s.label} className="text-center p-2 rounded-xl" style={{ background: innerBg }}>
                        <i className={`${s.icon} text-base mb-1`} style={{ color: s.color }}></i>
                        <p className="text-sm font-bold" style={{ color: textPrimary }}>{s.value}</p>
                        <p className="text-xs" style={{ color: textMuted }}>{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
