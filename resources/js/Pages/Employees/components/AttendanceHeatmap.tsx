import { useTheme } from '@/contexts/ThemeContext';

interface HeatmapDay {
    date: string;
    status: 'present' | 'late' | 'absent' | 'half-day' | 'weekend' | 'future';
    checkIn?: string;
    checkOut?: string;
}

interface Props {
    // Legacy format (month/year/data array)
    month?: number;
    year?: number;
    data?: HeatmapDay[];
    // New Inertia format (date -> 0|1 dict)
    heatmap?: Record<string, number>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AttendanceHeatmap({ month, year, data, heatmap }: Props) {
    const { isDark } = useTheme();
    const textSecondary = isDark ? '#9ca3af' : '#6b7280';
    const border = isDark ? '#374151' : '#e5e7eb';

    // Support both formats
    const today = new Date();
    const resolvedYear  = year  ?? today.getFullYear();
    const resolvedMonth = month ?? today.getMonth();
    const resolvedData: HeatmapDay[] = data ?? (() => {
        const daysInMonth = new Date(resolvedYear, resolvedMonth + 1, 0).getDate();
        const result: HeatmapDay[] = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(resolvedYear, resolvedMonth, d);
            const dateStr = `${resolvedYear}-${String(resolvedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dow = date.getDay();
            if (date > today)  { result.push({ date: dateStr, status: 'future' }); continue; }
            if (dow === 0 || dow === 6) { result.push({ date: dateStr, status: 'weekend' }); continue; }
            result.push({ date: dateStr, status: heatmap?.[dateStr] ? 'present' : 'absent' });
        }
        return result;
    })();

  const daysInMonth = new Date(resolvedYear, resolvedMonth + 1, 0).getDate();
  const firstDay = new Date(resolvedYear, resolvedMonth, 1).getDay();

  const getDay = (day: number): HeatmapDay | null => {
    const dateStr = `${resolvedYear}-${String(resolvedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return resolvedData.find(d => d.date === dateStr) || null;
  };

  const statusColor = (status: HeatmapDay['status']) => {
    const map = {
      present: { bg: '#16a34a', text: '#ffffff' },
      late: { bg: '#f59e0b', text: '#ffffff' },
      absent: { bg: '#fee2e2', text: '#dc2626' },
      'half-day': { bg: '#bfdbfe', text: '#1d4ed8' },
      weekend: { bg: isDark ? '#374151' : '#f3f4f6', text: isDark ? '#6b7280' : '#9ca3af' },
      future: { bg: 'transparent', text: isDark ? '#4b5563' : '#d1d5db' },
    };
    return map[status] || map.future;
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isToday = (day: number) => today.getFullYear() === resolvedYear && today.getMonth() === resolvedMonth && today.getDate() === day;

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs font-semibold py-1" style={{ color: textSecondary }}>{d}</div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />;
          const dayData = getDay(day);
          const status = dayData?.status || 'future';
          const colors = statusColor(status);
          const today_ = isToday(day);
          return (
            <div
              key={day}
              className="relative aspect-square rounded-lg flex flex-col items-center justify-center cursor-default group"
              style={{
                background: colors.bg,
                border: today_ ? '2px solid #16a34a' : `1px solid ${border}`,
              }}
              title={dayData ? `${dayData.date}: ${status}${dayData.checkIn ? ` | In: ${dayData.checkIn}` : ''}${dayData.checkOut ? ` | Out: ${dayData.checkOut}` : ''}` : `${resolvedYear}-${resolvedMonth + 1}-${day}`}
            >
              <span className="text-xs font-semibold" style={{ color: colors.text }}>{day}</span>
              {dayData?.checkIn && (
                <span className="text-[9px] leading-tight" style={{ color: colors.text, opacity: 0.8 }}>{dayData.checkIn}</span>
              )}
            </div>
          );
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-4 pt-3" style={{ borderTop: `1px solid ${border}` }}>
        {[
          { status: 'present', label: 'Present', bg: '#16a34a' },
          { status: 'late', label: 'Late', bg: '#f59e0b' },
          { status: 'absent', label: 'Absent', bg: '#fee2e2', border: '#fecaca', text: '#dc2626' },
          { status: 'half-day', label: 'Half Day', bg: '#bfdbfe', text: '#1d4ed8' },
        ].map(l => (
          <div key={l.status} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: l.bg, border: l.border ? `1px solid ${l.border}` : undefined }}></div>
            <span className="text-xs" style={{ color: textSecondary }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
