import { useForm, Head } from '@inertiajs/react';
import { route } from 'ziggy-js';
export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        route('login'); // Use the plain string path instead of route() helper
    };

    return (
        <>
            <Head title="Sign In" />
            <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                <div className="w-full max-w-sm">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <i className="ri-cpu-line text-white text-2xl"></i>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>AssetIQ</h1>
                        <p className="text-slate-400 text-sm mt-1">IT Asset Management System</p>
                    </div>

                    {/* Card */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-8" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                        <h2 className="text-lg font-bold text-slate-800 mb-6">Sign in to your account</h2>
                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email address</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    placeholder="you@company.com"
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                                    required
                                />
                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password</label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={data.remember} onChange={e => setData('remember', e.target.checked)} className="rounded border-slate-300 text-emerald-500" />
                                    <span className="text-xs text-slate-600">Remember me</span>
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-60"
                            >
                                {processing ? 'Signing in…' : 'Sign in'}
                            </button>
                        </form>
                        <p className="text-center text-xs text-slate-400 mt-6">
                            <a href="#" className="text-emerald-500 hover:underline">Forgot your password?</a>
                        </p>
                   
                    </div>
                </div>
            </div>
        </>
    );
}
