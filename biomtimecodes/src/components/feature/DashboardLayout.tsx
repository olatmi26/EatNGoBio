import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useTheme } from "@/contexts/ThemeContext";

interface DashboardLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function DashboardLayout({ title, subtitle, children, actions }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("eatngobio_auth");
    if (!auth) {
      navigate("/login");
    }
  }, [navigate]);

  const pageBg = isDark ? "#0f172a" : "#f8fafc";

  return (
    <div className="min-h-screen transition-colors duration-200" style={{ background: pageBg, fontFamily: "'Inter', sans-serif" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <TopBar title={title} subtitle={subtitle} sidebarCollapsed={collapsed} actions={actions} />
      <main
        className="transition-all duration-300 pt-16"
        style={{ marginLeft: collapsed ? "72px" : "260px" }}
      >
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
