import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { mockDeptBreakdown } from "@/mocks/dashboard";

export default function DeptBreakdown() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const cardBorder = isDark ? '#334155' : '#e5e7eb';
  const innerBg = isDark ? '#0f172a' : '#f8fafc';
  const textPrimary = isDark ? '#f1f5f9' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#6b7280';
  const textMuted = isDark ? '#64748b' : '#9ca3af';

  const maxRate = 100;

  return (
    <div className="rounded-xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-base" style={{ color: textPrimary }}>Department Breakdown</h3>
          <p className="text-xs mt-0.5" style={{ color: textSecondary }}>Today&apos;s attendance by department</p>
        </div>
        <button onClick={() => navigate('/analytics')}
          className="text-xs font-medium cursor-pointer whitespace-nowrap flex items-center gap-1"
          style={{ color: '#16a34a' }}>
          Full Analytics <i className="ri-arrow-right-line"></i>
        </button>
      </div>

      <div className="space-y-3">
        {mockDeptBreakdown.map(dept => {
          const rate = dept.rate;
          const rateColor = rate >= 95 ? '#16a34a' : rate >= 85 ? '#f59e0b' : '#dc2626';
          return (
            <div key={dept.dept} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: dept.color }}></div>
                  <span className="text-sm font-medium" style={{ color: textPrimary }}>{dept.dept}</span>
                  {dept.late > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#fef9c3', color: '#ca8a04' }}>
                      {dept.late} late
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ color: textMuted }}>{dept.present}/{dept.total}</span>
                  <span className="text-sm font-bold w-12 text-right" style={{ color: rateColor }}>{rate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#1e293b' : '#f3f4f6', border: `1px solid ${cardBorder}` }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(rate / maxRate) * 100}%`, background: rateColor }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${cardBorder}` }}>
        {[
          { label: '≥95% Excellent', color: '#16a34a', bg: '#dcfce7' },
          { label: '85–94% Good', color: '#f59e0b', bg: '#fef9c3' },
          { label: '<85% Needs Attention', color: '#dc2626', bg: '#fee2e2' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }}></div>
            <span className="text-xs" style={{ color: textMuted }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
