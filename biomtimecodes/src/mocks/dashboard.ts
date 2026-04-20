export const mockStats = {
  checkInsToday: 1247,
  checkInsTrend: +12,
  activeDevices: 10,
  totalDevices: 87,
  absentEmployees: 34,
  absentTrend: -5,
  pendingSyncRecords: 203,
  pendingTrend: +18,
  totalEmployees: 336,
  presentToday: 302,
  lateToday: 14,
  overtimeToday: 8,
  avgAttendanceRate: 91.4,
  attendanceRateTrend: +2.1,
};

export const mockDeptBreakdown = [
  { dept: 'HEAD-OFFICE', present: 118, total: 126, rate: 93.7, late: 3, color: '#16a34a' },
  { dept: 'MAGBORO', present: 79, total: 84, rate: 94.0, late: 2, color: '#0891b2' },
  { dept: 'Operations', present: 38, total: 45, rate: 84.4, late: 4, color: '#f59e0b' },
  { dept: 'Kitchen', present: 17, total: 18, rate: 94.4, late: 0, color: '#7c3aed' },
  { dept: 'Sales', present: 20, total: 23, rate: 87.0, late: 2, color: '#db2777' },
  { dept: 'Security', present: 9, total: 10, rate: 90.0, late: 0, color: '#dc2626' },
  { dept: 'Logistics', present: 10, total: 12, rate: 83.3, late: 2, color: '#d97706' },
  { dept: 'Finance', present: 8, total: 8, rate: 100.0, late: 1, color: '#16a34a' },
];

export const mockWeeklyTrend = [
  { day: 'Mon', rate: 89.2, present: 300, absent: 36 },
  { day: 'Tue', rate: 91.1, present: 306, absent: 30 },
  { day: 'Wed', rate: 88.7, present: 298, absent: 38 },
  { day: 'Thu', rate: 93.5, present: 314, absent: 22 },
  { day: 'Fri', rate: 91.4, present: 307, absent: 29 },
  { day: 'Sat', rate: 0, present: 0, absent: 0 },
  { day: 'Sun', rate: 0, present: 0, absent: 0 },
];

export const mockDevices = [
  { id: "DEV001", sn: "CGXH201360001", name: "Main Gate - Entry", location: "Head Office, Lagos", status: "online", lastSeen: "2026-04-16T09:11:00", ip: "192.168.1.101", firmware: "Ver 6.60 Apr 12 2023" },
  { id: "DEV002", sn: "CGXH201360002", name: "Canteen A - Entry", location: "Head Office, Lagos", status: "online", lastSeen: "2026-04-16T09:10:45", ip: "192.168.1.102", firmware: "Ver 6.60 Apr 12 2023" },
  { id: "DEV003", sn: "CGXH201360003", name: "Warehouse Gate", location: "Apapa Depot", status: "offline", lastSeen: "2026-04-15T18:32:00", ip: "192.168.2.101", firmware: "Ver 6.55 Jan 08 2023" },
  { id: "DEV004", sn: "CGXH201360004", name: "Admin Block", location: "Head Office, Lagos", status: "online", lastSeen: "2026-04-16T09:11:10", ip: "192.168.1.103", firmware: "Ver 6.60 Apr 12 2023" },
  { id: "DEV005", sn: "CGXH201360005", name: "Kitchen Entry", location: "Ikeja Branch", status: "syncing", lastSeen: "2026-04-16T09:08:00", ip: "10.0.1.50", firmware: "Ver 6.60 Apr 12 2023" },
  { id: "DEV006", sn: "CGXH201360006", name: "Staff Lounge", location: "Victoria Island", status: "online", lastSeen: "2026-04-16T09:11:05", ip: "10.0.2.51", firmware: "Ver 6.60 Apr 12 2023" },
  { id: "DEV007", sn: "CGXH201360007", name: "Loading Bay", location: "Apapa Depot", status: "offline", lastSeen: "2026-04-14T07:45:00", ip: "192.168.2.102", firmware: "Ver 6.50 Sep 01 2022" },
  { id: "DEV008", sn: "CGXH201360008", name: "Reception Desk", location: "Lekki Office", status: "online", lastSeen: "2026-04-16T09:10:58", ip: "172.16.0.10", firmware: "Ver 6.60 Apr 12 2023" },
];

export const mockLiveFeed = [
  { id: "f1", employeeId: "EMP0042", name: "Adaeze Okonkwo", initials: "AO", department: "Operations", device: "Main Gate - Entry", time: "09:11:02", type: "IN", color: "#16a34a" },
  { id: "f2", employeeId: "EMP0118", name: "Chukwuemeka Eze", initials: "CE", department: "Finance", device: "Admin Block", time: "09:10:47", type: "IN", color: "#ea580c" },
  { id: "f3", employeeId: "EMP0205", name: "Fatima Bello", initials: "FB", department: "HR", device: "Main Gate - Entry", time: "09:10:33", type: "IN", color: "#dc2626" },
  { id: "f4", employeeId: "EMP0077", name: "Oluwaseun Adeyemi", initials: "OA", department: "Logistics", device: "Warehouse Gate", time: "09:09:58", type: "OUT", color: "#0d9488" },
  { id: "f5", employeeId: "EMP0311", name: "Ngozi Amadi", initials: "NA", department: "Kitchen", device: "Kitchen Entry", time: "09:09:22", type: "IN", color: "#7c3aed" },
  { id: "f6", employeeId: "EMP0089", name: "Babatunde Lawal", initials: "BL", department: "Security", device: "Main Gate - Entry", time: "09:08:55", type: "IN", color: "#d97706" },
  { id: "f7", employeeId: "EMP0156", name: "Amina Yusuf", initials: "AY", department: "Accounts", device: "Admin Block", time: "09:08:30", type: "IN", color: "#0891b2" },
  { id: "f8", employeeId: "EMP0033", name: "Emeka Obi", initials: "EO", department: "IT", device: "Reception Desk", time: "09:07:44", type: "IN", color: "#db2777" },
  { id: "f9", employeeId: "EMP0244", name: "Halima Musa", initials: "HM", department: "Procurement", device: "Admin Block", time: "09:07:10", type: "OUT", color: "#65a30d" },
  { id: "f10", employeeId: "EMP0067", name: "Tunde Fashola", initials: "TF", department: "Operations", device: "Canteen A - Entry", time: "09:06:48", type: "IN", color: "#4f46e5" },
];

export const mockHourlyData = [
  { hour: "06:00", count: 12 },
  { hour: "07:00", count: 87 },
  { hour: "08:00", count: 342 },
  { hour: "09:00", count: 418 },
  { hour: "10:00", count: 156 },
  { hour: "11:00", count: 89 },
  { hour: "12:00", count: 43 },
  { hour: "13:00", count: 67 },
  { hour: "14:00", count: 33 },
];
