import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { mockNotifications } from "@/mocks/notifications";

export default function AlertsWidget() {
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const cardBorder = isDark ? '#334155' : '#e5e7eb';
  const textPrimary = isDark ? '#f1f5f9' : '#111827';
  const textSecondary = isDark ? '#94a3b8' : '#6b7280';

  const criticalAlerts = mockNotifications.filter(n => !n.read && (n.severity === 'critical' || n.severity === 'warning'));

  const severityStyle: Record<string, { bg: string; color: string; border: string }> = {
    critical: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
    warning: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  };

  const catIcon: Record<string, string> = {
    absence: 'ri-user-unfollow-line',
    device: 'ri-device-line',
    late: 'ri-alarm-warning-line',
    system: 'ri-settings-3-line',
    biometric: 'ri-fingerprint-line',
  };

  return (
    <div className="rounded-xl p-5" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#fee2e2' }}>
            <i className="ri-alarm-warning-line text-sm" style={{ color: '#dc2626' }}></i>
          </div>
          <div>
            <h3 className="font-semibold text-sm" style={{ color: textPrimary }}>Active Alerts</h3>
            <p className="text-xs" style={{ color: textSecondary }}>{criticalAlerts.length} requiring attention</p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: '#fee2e2', color: '#dc2626' }}>
          {criticalAlerts.length}
        </span>
      </div>

      <div className="space-y-2">
        {criticalAlerts.slice(0, 4).map(alert => {
          const style = severityStyle[alert.severity] || severityStyle.warning;
          return (
            <div key={alert.id}
              className="flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-all"
              style={{ background: isDark ? '#1f2937' : style.bg, border: `1px solid ${isDark ? '#374151' : style.border}` }}
              onClick={() => alert.actionPath && navigate(alert.actionPath)}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ background: style.bg, border: `1px solid ${style.border}` }}>
                <i className={`${catIcon[alert.category]} text-xs`} style={{ color: style.color }}></i>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: textPrimary }}>{alert.title}</p>
                <p className="text-xs mt-0.5 line-clamp-1" style={{ color: textSecondary }}>{alert.message}</p>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-xs px-1.5 py-0.5 rounded-full font-medium capitalize"
                  style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                  {alert.severity}
                </span>
                <span className="text-xs" style={{ color: textSecondary }}>{alert.time}</span>
              </div>
            </div>
          );
        })}
      </div>

      {criticalAlerts.length === 0 && (
        <div className="py-6 text-center">
          <i className="ri-shield-check-line text-3xl mb-2 block" style={{ color: '#16a34a' }}></i>
          <p className="text-sm font-medium" style={{ color: '#16a34a' }}>All clear!</p>
          <p className="text-xs mt-0.5" style={{ color: textSecondary }}>No active alerts</p>
        </div>
      )}
    </div>
  );
}
