import { useForm, Head } from '@inertiajs/react';
import { useTheme } from '@/contexts/ThemeContext';

export default function Login() {
    const { isDark, toggleTheme } = useTheme();
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('login'));
    };

    const pageBg = isDark ? '#0f172a' : '#f8fafc';
    const leftBg  = isDark ? '#111827' : '#ffffff';
    const cardBg  = isDark ? '#1e293b' : '#ffffff';
    const cardBorder = isDark ? '#334155' : '#e5e7eb';
    const inputBg    = isDark ? '#0f172a' : '#f9fafb';
    const inputBorder = isDark ? '#374151' : '#e5e7eb';
    const textPrimary   = isDark ? '#f1f5f9' : '#111827';
    const textSecondary = isDark ? '#94a3b8' : '#6b7280';
    const textMuted     = isDark ? '#64748b' : '#9ca3af';
    const statCardBg    = isDark ? '#1e293b' : '#f1f5f9';

    const stats = [
        { icon: 'ri-device-line',         label: 'Devices',         value: '87',   color: '#d97706' },
        { icon: 'ri-fingerprint-line',     label: 'Daily Check-ins', value: '1,247', color: '#16a34a' },
        { icon: 'ri-building-line',        label: 'Locations',       value: '12',   color: '#0891b2' },
        { icon: 'ri-team-line',            label: 'Employees',       value: '336',  color: '#7c3aed' },
    ];

    return (
        <>
            <Head title="Sign In" />
            <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif", background: pageBg }}>
                {/* Left Panel */}
                <div className="hidden lg:flex flex-col justify-between w-1/2 p-12" style={{ background: leftBg, borderRight: `1px solid ${cardBorder}` }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                                <i className="ri-fingerprint-line text-white text-xl"></i>
                            </div>
                            <div>
                                <span className="font-bold text-lg" style={{ color: textPrimary }}>EatNGo<span style={{ color: '#16a34a' }}>Bio</span></span>
                                <p className="text-xs" style={{ color: textSecondary }}>Attendance System</p>
                            </div>
                        </div>
                        <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary, background: isDark ? '#1f2937' : '#f3f4f6' }}>
                            <i className={isDark ? 'ri-sun-line' : 'ri-moon-line'}></i>
                        </button>
                    </div>

                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ background: '#dcfce7', border: '1px solid #bbf7d0' }}>
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#16a34a' }}></div>
                            <span className="text-xs font-semibold" style={{ color: '#16a34a' }}>ADMS Server Online — ZKTeco Compatible</span>
                        </div>
                        <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: textPrimary }}>
                            Unlimited Biometric<br />
                            <span style={{ color: '#16a34a' }}>Attendance Management</span>
                        </h1>
                        <p className="text-lg mb-8" style={{ color: textSecondary }}>
                            No license limits. Manage all your ZKTeco devices with our own ADMS-compatible backend.
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-8">
                            {stats.map(s => (
                                <div key={s.label} className="p-4 rounded-xl" style={{ background: statCardBg, border: `1px solid ${cardBorder}` }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${s.color}20` }}>
                                            <i className={`${s.icon} text-lg`} style={{ color: s.color }}></i>
                                        </div>
                                        <div>
                                            <p className="text-lg font-bold" style={{ color: textPrimary }}>{s.value}</p>
                                            <p className="text-xs" style={{ color: textSecondary }}>{s.label}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {['GET /iclock/cdata', 'POST /iclock/cdata', 'GET /iclock/getrequest', 'POST /iclock/devicecmd'].map(ep => (
                                <span key={ep} className="text-xs font-mono px-3 py-1.5 rounded-lg" style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>{ep}</span>
                            ))}
                        </div>
                    </div>

                    <p className="text-xs" style={{ color: textMuted }}>EatNGo Africa — Custom Biometrics Management</p>
                </div>

                {/* Right Panel */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
                    <div className="w-full max-w-sm">
                        {/* Mobile logo */}
                        <div className="flex items-center justify-center gap-3 mb-8 lg:hidden">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                                <i className="ri-fingerprint-line text-white text-xl"></i>
                            </div>
                            <span className="font-bold text-xl" style={{ color: textPrimary }}>EatNGo<span style={{ color: '#16a34a' }}>Bio</span></span>
                        </div>

                        <div className="p-8 rounded-2xl" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
                            <h2 className="text-xl font-bold mb-1" style={{ color: textPrimary }}>Welcome back</h2>
                            <p className="text-sm mb-6" style={{ color: textSecondary }}>Sign in to manage attendance</p>

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: textSecondary }}>Email address</label>
                                    <input
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        placeholder="you@eatngo-africa.com"
                                        className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
                                        style={{ background: inputBg, border: `1px solid ${errors.email ? '#dc2626' : inputBorder}`, color: textPrimary }}
                                        required
                                    />
                                    {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{ color: textSecondary }}>Password</label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-3 py-2.5 text-sm rounded-xl outline-none transition-all"
                                        style={{ background: inputBg, border: `1px solid ${errors.password ? '#dc2626' : inputBorder}`, color: textPrimary }}
                                        required
                                    />
                                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={data.remember} onChange={e => setData('remember', e.target.checked)} className="rounded" />
                                        <span className="text-xs" style={{ color: textSecondary }}>Remember me</span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity cursor-pointer disabled:opacity-60"
                                    style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                                >
                                    {processing ? 'Signing in…' : 'Sign in'}
                                </button>
                            </form>
                        </div>

                        <p className="text-center text-xs mt-6" style={{ color: textMuted }}>
                            EatNGo Biometrics — Powered by ADMS Protocol
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
