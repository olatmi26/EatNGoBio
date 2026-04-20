interface StatCardProps {
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'up' | 'down' | 'neutral';
    icon: string;
    iconBg: string;
    iconColor: string;
    subtitle?: string;
}

export default function StatCard({ title, value, change, changeType, icon, iconBg, iconColor, subtitle }: StatCardProps) {
    return (
        <div className="bg-white rounded-xl p-5 border border-slate-100 hover:border-slate-200 transition-all">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{title}</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{value}</p>
                    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
                    {change && (
                        <div className="flex items-center gap-1 mt-2">
                            <i className={`text-xs ${changeType === 'up' ? 'ri-arrow-up-line text-emerald-500' : changeType === 'down' ? 'ri-arrow-down-line text-red-500' : 'ri-subtract-line text-slate-400'}`}></i>
                            <span className={`text-xs font-medium ${changeType === 'up' ? 'text-emerald-600' : changeType === 'down' ? 'text-red-600' : 'text-slate-500'}`}>{change}</span>
                        </div>
                    )}
                </div>
                <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                    <i className={`${icon} ${iconColor} text-xl`}></i>
                </div>
            </div>
        </div>
    );
}
