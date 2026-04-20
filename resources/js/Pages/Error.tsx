import { router } from "@inertiajs/react";
import { useTheme } from "@/contexts/ThemeContext";

interface ErrorProps {
  status?: number;
  message?: string;
}

export default function ErrorPage({ status = 500, message }: ErrorProps) {
  const { isDark } = useTheme?.() ?? { isDark: false };
  const bg        = isDark ? "#111827" : "#f8fafc";
  const cardBg    = isDark ? "#1f2937" : "#ffffff";
  const border    = isDark ? "#374151" : "#e5e7eb";
  const textPrimary   = isDark ? "#f9fafb" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";

  const titles: Record<number, string> = {
    403: "Access Denied",
    404: "Page Not Found",
    419: "Session Expired",
    500: "Server Error",
    503: "Service Unavailable",
  };

  const descriptions: Record<number, string> = {
    403: "You don't have permission to access this page.",
    404: "The page you're looking for doesn't exist or has been moved.",
    419: "Your session has expired. Please refresh and try again.",
    500: "Something went wrong on our end. Please try again shortly.",
    503: "The service is temporarily unavailable. Please try again later.",
  };

  const title = titles[status] ?? "Unexpected Error";
  const desc  = message ?? descriptions[status] ?? "An unexpected error occurred.";

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: bg }}
    >
      <div
        className="max-w-md w-full rounded-2xl p-8 text-center"
        style={{ background: cardBg, border: `1px solid ${border}` }}
      >
        {/* Status number */}
        <div
          className="text-8xl font-black mb-4 select-none"
          style={{ color: status === 404 ? "#16a34a" : "#dc2626", opacity: 0.15 }}
        >
          {status}
        </div>

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{
            background: status === 404 ? "#dcfce7" : "#fee2e2",
          }}
        >
          <i
            className={`text-3xl ${
              status === 404
                ? "ri-search-line"
                : status === 403
                ? "ri-lock-line"
                : status === 419
                ? "ri-time-line"
                : "ri-error-warning-line"
            }`}
            style={{ color: status === 404 ? "#16a34a" : "#dc2626" }}
          ></i>
        </div>

        <h1 className="text-xl font-bold mb-2" style={{ color: textPrimary }}>
          {title}
        </h1>
        <p className="text-sm mb-6" style={{ color: textSecondary }}>
          {desc}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
            style={{
              background: isDark ? "#374151" : "#f3f4f6",
              color: textPrimary,
              border: `1px solid ${border}`,
            }}
          >
            <i className="ri-arrow-left-line"></i> Go Back
          </button>
          <button
            onClick={() => router.visit("/dashboard")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}
          >
            <i className="ri-home-line"></i> Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
