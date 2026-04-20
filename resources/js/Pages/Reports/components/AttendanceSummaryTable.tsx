import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  data: AttendanceSummaryRow[];
}

export default function AttendanceSummaryTable({ data }: Props) {
  const { isDark } = useTheme();
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const rowHover = isDark ? '#374151' : '#f9fafb';

  const statusColor = (rate: number) => {
    if (rate >= 95) return '#16a34a';
    if (rate >= 80) return '#f59e0b';
    return '#dc2626';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            {['Employee', 'Department', 'Shift', 'Present', 'Absent', 'Late', 'Half Day', 'Work Hours', 'OT Hours', 'Late (min)', 'Rate'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: textSecondary }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.employeeId} style={{ borderBottom: `1px solid ${border}` }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
            >
              <td className="px-4 py-3">
                <p className="text-sm font-medium whitespace-nowrap" style={{ color: textPrimary }}>{row.employeeName}</p>
                <p className="text-xs" style={{ color: textSecondary }}>{row.employeeId}</p>
              </td>
              <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{row.department}</td>
              <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: textSecondary }}>{row.shift}</td>
              <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: '#16a34a' }}>{row.presentDays}</td>
              <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: row.absentDays > 0 ? '#dc2626' : textSecondary }}>{row.absentDays}</td>
              <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: row.lateDays > 0 ? '#f59e0b' : textSecondary }}>{row.lateDays}</td>
              <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: row.halfDays > 0 ? '#0891b2' : textSecondary }}>{row.halfDays}</td>
              <td className="px-4 py-3 text-sm font-mono text-center" style={{ color: textPrimary }}>{row.totalWorkHours.toFixed(1)}h</td>
              <td className="px-4 py-3 text-sm font-mono text-center" style={{ color: row.overtimeHours > 0 ? '#7c3aed' : textSecondary }}>{row.overtimeHours.toFixed(1)}h</td>
              <td className="px-4 py-3 text-sm font-mono text-center" style={{ color: row.lateMinutes > 0 ? '#f59e0b' : textSecondary }}>{row.lateMinutes}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: isDark ? '#374151' : '#e5e7eb' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${row.attendanceRate}%`, background: statusColor(row.attendanceRate) }}></div>
                  </div>
                  <span className="text-xs font-semibold whitespace-nowrap" style={{ color: statusColor(row.attendanceRate) }}>{row.attendanceRate.toFixed(1)}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
