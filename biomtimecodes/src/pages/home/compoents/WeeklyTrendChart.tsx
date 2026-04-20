import { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { mockWeeklyTrend } from "@/mocks/dashboard";

export default function WeeklyTrendChart() {
  const { isDark } = useTheme();
  const [hovered, setHovered] = useState<number | null>(null);

  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const cardBorder = isDark ? '#334155' : '#e5e7eb';
  const innerBg = isDark ? '#0f172a' : '#f8fafc';
  const textPrimary = isDark ? '#f1f5f9' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#6b7280';
  const textMuted = isDark ? '#64748b' : '#9ca3af';

  const workdays = mockWeeklyTrend.filter(d => d.rate > 0);
  const maxPresent = Math.max(...workdays.map(d => d.present));

  return (
    <div className="rounded-xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-base" style={{ color: textPrimary }}>Weekly Attendance Trend</h3>
          <p className="text-xs mt-0.5" style={{ color: textSecondary }}>This week · Mon–Fri</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#16a34a' }}></div>
            <span className="text-xs" style={{ color: textSecondary }}>Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#fee2e2' }}></div>
            <span className="text-xs" style={{ color: textSecondary }}>Absent</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-3" style={{ height: '120px' }}>
        {mockWeeklyTrend.map((d, i) => {
          const isWeekend = d.rate === 0;
          const presentH = isWeekend ? 0 : (d.present / maxPresent) * 90;
          const absentH = isWeekend ? 0 : (d.absent / maxPresent) * 90;
          const isHovered = hovered === i;
          return (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1 relative"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}>
              {/* Tooltip */}
              {isHovered && !isWeekend && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap z-10"
                  style={{ background: isDark ? '#374151' : '#111827', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                  <p className="font-bold">{d.rate}% rate</p>
                  <p>{d.present} present · {d.absent} absent</p>
                </div>
              )}
              {/* Stacked bars */}
              <div className="w-full flex flex-col items-center justify-end gap-0.5" style={{ height: '100px' }}>
                {!isWeekend ? (
                  <>
                    <div className="w-full rounded-t transition-all duration-500"
                      style={{ height: `${absentH}px`, background: '#fecaca', minHeight: absentH > 0 ? '3px' : '0' }}></div>
                    <div className="w-full rounded-t transition-all duration-500"
                      style={{
                        height: `${presentH}px`,
                        background: isHovered ? '#15803d' : '#16a34a',
                        minHeight: '4px',
                      }}></div>
                  </>
                ) : (
                  <div className="w-full rounded" style={{ height: '8px', background: isDark ? '#1e293b' : '#f3f4f6' }}></div>
                )}
              </div>
              <span className="text-xs font-medium" style={{ color: isWeekend ? textMuted : (isHovered ? textPrimary : textSecondary) }}>{d.day}</span>
              {!isWeekend && (
                <span className="text-xs font-bold" style={{ color: d.rate >= 90 ? '#16a34a' : '#f59e0b' }}>{d.rate}%</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${cardBorder}` }}>
        {[
          { label: 'Best Day', value: 'Thursday', sub: '93.5%', color: '#16a34a', icon: 'ri-trophy-line' },
          { label: 'Avg Rate', value: '91.6%', sub: 'This week', color: '#0891b2', icon: 'ri-percent-line' },
          { label: 'Total Absent', value: '155', sub: 'This week', color: '#dc2626', icon: 'ri-user-unfollow-line' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: innerBg }}>
            <i className={`${s.icon} text-base mb-1 block`} style={{ color: s.color }}></i>
            <p className="text-sm font-bold" style={{ color: textPrimary }}>{s.value}</p>
            <p className="text-xs" style={{ color: textMuted }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
