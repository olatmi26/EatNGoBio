import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import LoginPage from "../pages/login/page";
import DevicesPage from "../pages/devices/page";
import DeviceDetailPage from "../pages/devices/detail";
import DepartmentsPage from "../pages/organization/departments/page";
import PositionsPage from "../pages/organization/positions/page";
import AreasPage from "../pages/organization/areas/page";
import OrgChartPage from "../pages/organization/chart/page";
import EmployeesPage from "../pages/employees/page";
import EmployeeDetailPage from "../pages/employees/detail";
import AttendancePage from "../pages/attendance/page";
import ReportsPage from "../pages/reports/page";
import SettingsPage from "../pages/settings/page";
import LiveMonitorPage from "../pages/live-monitor/page";
import ShiftsPage from "../pages/shifts/page";
import AnalyticsPage from "../pages/analytics/page";

const routes: RouteObject[] = [
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/devices",
    element: <DevicesPage />,
  },
  {
    path: "/devices/:id",
    element: <DeviceDetailPage />,
  },
  {
    path: "/organization/departments",
    element: <DepartmentsPage />,
  },
  {
    path: "/organization/positions",
    element: <PositionsPage />,
  },
  {
    path: "/organization/areas",
    element: <AreasPage />,
  },
  {
    path: "/organization/chart",
    element: <OrgChartPage />,
  },
  {
    path: "/employees",
    element: <EmployeesPage />,
  },
  {
    path: "/employees/:id",
    element: <EmployeeDetailPage />,
  },
  {
    path: "/attendance",
    element: <AttendancePage />,
  },
  {
    path: "/shifts",
    element: <ShiftsPage />,
  },
  {
    path: "/live-monitor",
    element: <LiveMonitorPage />,
  },
  {
    path: "/reports",
    element: <ReportsPage />,
  },
  {
    path: "/analytics",
    element: <AnalyticsPage />,
  },
  {
    path: "/settings",
    element: <SettingsPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
