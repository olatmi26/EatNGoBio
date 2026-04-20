import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface FlyoutPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  side?: "left" | "right";
}

export default function FlyoutPanel({ open, onClose, title, subtitle, children, footer, width = "520px", side = "right" }: FlyoutPanelProps) {
  const { isDark } = useTheme();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const bg = isDark ? "#1f2937" : "#ffffff";
  const border = isDark ? "#374151" : "#e5e7eb";
  const textPrimary = isDark ? "#f9fafb" : "#111827";
  const textSecondary = isDark ? "#9ca3af" : "#6b7280";

  const isLeft = side === "left";

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-300"
        style={{ background: "rgba(0,0,0,0.4)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className="fixed top-0 h-full z-50 flex flex-col transition-transform duration-300 ease-in-out"
        style={{
          width,
          maxWidth: "100vw",
          background: bg,
          borderLeft: isLeft ? "none" : `1px solid ${border}`,
          borderRight: isLeft ? `1px solid ${border}` : "none",
          left: isLeft ? 0 : "auto",
          right: isLeft ? "auto" : 0,
          transform: open ? "translateX(0)" : isLeft ? "translateX(-100%)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5" style={{ borderBottom: `1px solid ${border}` }}>
          <div>
            <h2 className="text-base font-semibold" style={{ color: textPrimary }}>{title}</h2>
            {subtitle && <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors mt-0.5"
            style={{ color: textSecondary }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = isDark ? "#374151" : "#f3f4f6"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
          >
            <i className="ri-close-line text-lg"></i>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 flex items-center justify-end gap-3" style={{ borderTop: `1px solid ${border}` }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
