import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const auth = localStorage.getItem("eatngobio_auth");
    if (auth) navigate("/");
  }, [navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Please enter your username and password.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      if (username === "admin" && password === "admin123") {
        localStorage.setItem(
          "eatngobio_auth",
          JSON.stringify({ user: username, role: "Super Admin", loginAt: Date.now() })
        );
        navigate("/");
      } else {
        setError("Invalid credentials. Try admin / admin123");
        setLoading(false);
      }
    }, 1200);
  };

  const pageBg = isDark ? "#0f172a" : "#f8fafc";
  const leftBg = isDark ? "#111827" : "#ffffff";
  const rightBg = isDark ? "#0f172a" : "#f8fafc";
  const cardBg = isDark ? "#1e293b" : "#ffffff";
  const cardBorder = isDark ? "#334155" : "#e5e7eb";
  const inputBg = isDark ? "#0f172a" : "#f9fafb";
  const inputBorder = isDark ? "#374151" : "#e5e7eb";
  const textPrimary = isDark ? "#f1f5f9" : "#111827";
  const textSecondary = isDark ? "#94a3b8" : "#6b7280";
  const textMuted = isDark ? "#64748b" : "#9ca3af";
  const statCardBg = isDark ? "#1e293b" : "#f1f5f9";

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Inter', sans-serif", background: pageBg }}>
      {/* Left Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12"
        style={{ background: leftBg, borderRight: `1px solid ${cardBorder}` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
            >
              <i className="ri-fingerprint-line text-white text-xl"></i>
            </div>
            <span className="font-bold text-xl tracking-tight" style={{ color: textPrimary }}>
              EatNGo<span style={{ color: "#16a34a" }}>Bio</span>
            </span>
          </div>
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
            style={{ color: textSecondary, background: statCardBg }}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            <i className={isDark ? "ri-sun-line" : "ri-moon-line"}></i>
          </button>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 py-16">
          {/* Animated fingerprint */}
          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute w-48 h-48 rounded-full animate-ping opacity-5" style={{ background: "#16a34a" }}></div>
            <div className="absolute w-36 h-36 rounded-full animate-pulse opacity-10" style={{ background: "#16a34a" }}></div>
            <div
              className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
            >
              <i className="ri-fingerprint-line text-white" style={{ fontSize: "56px" }}></i>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center mb-4 leading-tight" style={{ color: textPrimary }}>
            Biometric Attendance<br />Management System
          </h2>
          <p className="text-center text-sm leading-relaxed max-w-xs" style={{ color: textSecondary }}>
            Manage all 87 ZKTeco devices across your locations — unlimited, license-free, and fully under your control.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-sm">
            {[
              { icon: "ri-device-line", label: "87 Devices", sub: "Unlimited" },
              { icon: "ri-team-line", label: "1,200+ Staff", sub: "Managed" },
              { icon: "ri-shield-check-line", label: "ADMS", sub: "Protocol" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center p-4 rounded-xl"
                style={{ background: statCardBg, border: `1px solid ${cardBorder}` }}
              >
                <i className={`${item.icon} text-2xl mb-2`} style={{ color: "#16a34a" }}></i>
                <span className="text-sm font-semibold" style={{ color: textPrimary }}>{item.label}</span>
                <span className="text-xs" style={{ color: textSecondary }}>{item.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs" style={{ color: textMuted }}>
          &copy; 2026 EatNGo Africa. All rights reserved.
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12" style={{ background: rightBg }}>
        <div className="w-full max-w-md">
          {/* Mobile logo + theme toggle */}
          <div className="flex lg:hidden items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
              >
                <i className="ri-fingerprint-line text-white text-xl"></i>
              </div>
              <span className="font-bold text-xl tracking-tight" style={{ color: textPrimary }}>
                EatNGo<span style={{ color: "#16a34a" }}>Bio</span>
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer"
              style={{ color: textSecondary, background: cardBg, border: `1px solid ${cardBorder}` }}
            >
              <i className={isDark ? "ri-sun-line" : "ri-moon-line"}></i>
            </button>
          </div>

          <div className="rounded-2xl p-8 md:p-10" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="mb-8">
              <span
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
                style={{ background: "#dcfce7", color: "#16a34a" }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                ADMS Server Active
              </span>
              <h1 className="text-2xl font-bold mb-1" style={{ color: textPrimary }}>Welcome back</h1>
              <p className="text-sm" style={{ color: textSecondary }}>Sign in to your EatNGoBio dashboard</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
                  Username
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <i className="ri-user-line text-sm" style={{ color: textSecondary }}></i>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      color: textPrimary,
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#16a34a"; }}
                    onBlur={(e) => { e.target.style.borderColor = inputBorder; }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: textPrimary }}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center">
                    <i className="ri-lock-line text-sm" style={{ color: textSecondary }}></i>
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full pl-10 pr-12 py-3 rounded-lg text-sm outline-none transition-all"
                    style={{
                      background: inputBg,
                      border: `1px solid ${inputBorder}`,
                      color: textPrimary,
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "#16a34a"; }}
                    onBlur={(e) => { e.target.style.borderColor = inputBorder; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center cursor-pointer"
                    style={{ color: textSecondary }}
                  >
                    <i className={showPassword ? "ri-eye-off-line text-sm" : "ri-eye-line text-sm"}></i>
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm"
                  style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }}
                >
                  <i className="ri-error-warning-line"></i>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
                style={{
                  background: "linear-gradient(135deg, #16a34a, #15803d)",
                  color: "white",
                  opacity: loading ? 0.8 : 1,
                }}
              >
                {loading ? (
                  <>
                    <i className="ri-loader-4-line animate-spin"></i>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <i className="ri-arrow-right-line"></i>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6" style={{ borderTop: `1px solid ${cardBorder}` }}>
              <p className="text-xs text-center" style={{ color: textMuted }}>
                Demo credentials:{" "}
                <span className="font-mono font-medium" style={{ color: textSecondary }}>admin</span>
                {" / "}
                <span className="font-mono font-medium" style={{ color: textSecondary }}>admin123</span>
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#16a34a" }}></div>
            <span className="text-xs font-mono" style={{ color: textMuted }}>
              ADMS Endpoint: http://your-server/iclock/
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
