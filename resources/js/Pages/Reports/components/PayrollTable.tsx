import { useTheme } from '@/contexts/ThemeContext';

interface Props {
  data: PayrollRow[];
}

const fmt = (n: number) => `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;

export default function PayrollTable({ data }: Props) {
  const { isDark } = useTheme();
  const border = isDark ? '#374151' : '#e5e7eb';
  const textPrimary = isDark ? '#f9fafb' : '#111827';
  const textSecondary = isDark ? '#9ca3af' : '#6b7280';
  const rowHover = isDark ? '#374151' : '#f9fafb';

  const totalBasic = data.reduce((s, r) => s + r.basicSalary, 0);
  const totalDeductions = data.reduce((s, r) => s + r.lateDeduction + r.absentDeduction, 0);
  const totalOT = data.reduce((s, r) => s + r.overtimePay, 0);
  const totalNet = data.reduce((s, r) => s + r.netPay, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px]">
        <thead>
          <tr style={{ borderBottom: `1px solid ${border}` }}>
            {['Employee', 'Department', 'Shift', 'Basic Salary', 'Days Present', 'Days Absent', 'Late Days', 'OT Hours', 'Late Deduction', 'Absent Deduction', 'OT Pay', 'Net Pay'].map(h => (
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
              <td className="px-4 py-3 text-sm font-mono whitespace-nowrap" style={{ color: textPrimary }}>{fmt(row.basicSalary)}</td>
              <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: '#16a34a' }}>{row.presentDays}</td>
              <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: row.absentDays > 0 ? '#dc2626' : textSecondary }}>{row.absentDays}</td>
              <td className="px-4 py-3 text-sm font-semibold text-center" style={{ color: row.lateDays > 0 ? '#f59e0b' : textSecondary }}>{row.lateDays}</td>
              <td className="px-4 py-3 text-sm font-mono text-center" style={{ color: row.overtimeHours > 0 ? '#7c3aed' : textSecondary }}>{row.overtimeHours.toFixed(1)}</td>
              <td className="px-4 py-3 text-sm font-mono whitespace-nowrap" style={{ color: row.lateDeduction > 0 ? '#dc2626' : textSecondary }}>
                {row.lateDeduction > 0 ? `-${fmt(row.lateDeduction)}` : '-'}
              </td>
              <td className="px-4 py-3 text-sm font-mono whitespace-nowrap" style={{ color: row.absentDeduction > 0 ? '#dc2626' : textSecondary }}>
                {row.absentDeduction > 0 ? `-${fmt(row.absentDeduction)}` : '-'}
              </td>
              <td className="px-4 py-3 text-sm font-mono whitespace-nowrap" style={{ color: row.overtimePay > 0 ? '#16a34a' : textSecondary }}>
                {row.overtimePay > 0 ? `+${fmt(row.overtimePay)}` : '-'}
              </td>
              <td className="px-4 py-3">
                <span className="text-sm font-bold whitespace-nowrap px-2 py-1 rounded-lg" style={{ background: '#dcfce7', color: '#16a34a' }}>{fmt(row.netPay)}</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ borderTop: `2px solid ${border}`, background: isDark ? '#374151' : '#f9fafb' }}>
            <td colSpan={3} className="px-4 py-3 text-sm font-bold" style={{ color: textPrimary }}>TOTALS</td>
            <td className="px-4 py-3 text-sm font-bold font-mono whitespace-nowrap" style={{ color: textPrimary }}>{fmt(totalBasic)}</td>
            <td colSpan={4}></td>
            <td className="px-4 py-3 text-sm font-bold font-mono whitespace-nowrap" style={{ color: '#dc2626' }}>-{fmt(totalDeductions)}</td>
            <td></td>
            <td className="px-4 py-3 text-sm font-bold font-mono whitespace-nowrap" style={{ color: '#16a34a' }}>+{fmt(totalOT)}</td>
            <td className="px-4 py-3">
              <span className="text-sm font-bold whitespace-nowrap px-2 py-1 rounded-lg" style={{ background: '#dcfce7', color: '#16a34a' }}>{fmt(totalNet)}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
