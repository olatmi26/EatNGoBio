import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  data: DailyAttendanceRow[];
}

export default function DailyTrendChart({ data }: Props) {
  const { isDark } = useTheme();
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const border = isDark ? '#374151' : '#e5e7eb';

  const workdays = data.filter(d => d.attendanceRate > 0);
  const maxPresent = Math.max(...workdays.map(d => d.present));

  return (
    <div>
      <div className="flex items-end gap-1.5 h-32">
        {data.map((day) => {
          const isWeekend = day.attendanceRate === 0;
          const height = isWeekend ? 4 : Math.max(8, (day.present / maxPresent) * 100);
          const date = new Date(day.date);
          const dayLabel = date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 1);
          const dateLabel = date.getDate();

          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="rounded-lg px-2.5 py-2 text-xs whitespace-nowrap" style={{ background: isDark ? '#374151' : '#111827', color: '#fff' }}>
                  <p className="font-semibold">{day.date}</p>
                  {isWeekend ? (
                    <p>Weekend</p>
                  ) : (
                    <>
                      <p>Present: {day.present}</p>
                      <p>Absent: {day.absent}</p>
                      <p>Late: {day.late}</p>
                      <p>Rate: {day.attendanceRate}%</p>
                    </>
                  )}
                </div>
              </div>
              <div
                className="w-full rounded-t-sm transition-all cursor-pointer"
                style={{
                  height: `${height}%`,
                  background: isWeekend
                    ? (isDark ? '#374151' : '#e5e7eb')
                    : day.attendanceRate >= 95
                    ? '#16a34a'
                    : day.attendanceRate >= 85
                    ? '#f59e0b'
                    : '#dc2626',
                  opacity: isWeekend ? 0.4 : 1,
                }}
              ></div>
              <div className="text-center">
                <p className="text-xs font-medium" style={{ color: textSecondary, fontSize: '9px' }}>{dayLabel}</p>
                <p className="text-xs font-bold" style={{ color: textSecondary, fontSize: '9px' }}>{dateLabel}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${border}` }}>
        {[
          { color: '#16a34a', label: '≥95% Rate' },
          { color: '#f59e0b', label: '85–94%' },
          { color: '#dc2626', label: '<85%' },
          { color: isDark ? '#374151' : '#e5e7eb', label: 'Weekend' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.color }}></div>
            <span className="text-xs" style={{ color: textSecondary }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
