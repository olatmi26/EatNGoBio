export interface DeptAttendanceStat {
  id: string;
  department: string;
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendanceRate: number;
  trend: number[];
  topPerformers: { name: string; rate: number; streak: number }[];
  absenteeismTrend: { week: string; rate: number }[];
  color: string;
}

export interface LocationAttendanceStat {
  id: string;
  location: string;
  totalEmployees: number;
  presentToday: number;
  attendanceRate: number;
  devices: number;
  onlineDevices: number;
  trend: number[];
  color: string;
}

export interface DeviceAttendanceStat {
  id: string;
  deviceName: string;
  location: string;
  status: 'online' | 'offline';
  punchesToday: number;
  lastSync: string;
  successRate: number;
  weeklyPunches: number[];
}

export const mockDeptStats: DeptAttendanceStat[] = [
  {
    id: 'd1', department: 'HEAD-OFFICE', totalEmployees: 126, presentToday: 118, absentToday: 5, lateToday: 3,
    attendanceRate: 93.7, trend: [88, 91, 90, 93, 95, 92, 94],
    topPerformers: [
      { name: 'Taiwo Hassan', rate: 100, streak: 22 },
      { name: 'Fatima Bello', rate: 99.1, streak: 18 },
      { name: 'Emeka Obi', rate: 98.5, streak: 15 },
    ],
    absenteeismTrend: [
      { week: 'W1', rate: 4.2 }, { week: 'W2', rate: 3.8 }, { week: 'W3', rate: 5.1 }, { week: 'W4', rate: 3.2 },
    ],
    color: '#16a34a',
  },
  {
    id: 'd2', department: 'MAGBORO COMMISSARY', totalEmployees: 84, presentToday: 79, absentToday: 3, lateToday: 2,
    attendanceRate: 94.0, trend: [90, 92, 91, 94, 93, 95, 94],
    topPerformers: [
      { name: 'Blessing Nwachukwu', rate: 100, streak: 20 },
      { name: 'Godwin Eze', rate: 97.8, streak: 14 },
      { name: 'Halima Musa', rate: 96.5, streak: 12 },
    ],
    absenteeismTrend: [
      { week: 'W1', rate: 3.5 }, { week: 'W2', rate: 4.0 }, { week: 'W3', rate: 2.8 }, { week: 'W4', rate: 3.1 },
    ],
    color: '#0891b2',
  },
  {
    id: 'd3', department: 'Operations', totalEmployees: 45, presentToday: 38, absentToday: 5, lateToday: 2,
    attendanceRate: 84.4, trend: [80, 82, 79, 84, 83, 85, 84],
    topPerformers: [
      { name: 'Adaeze Nwosu', rate: 98.2, streak: 16 },
      { name: 'Tunde Fashola', rate: 95.5, streak: 10 },
      { name: 'Oluwaseun Adeyemi', rate: 93.0, streak: 8 },
    ],
    absenteeismTrend: [
      { week: 'W1', rate: 8.5 }, { week: 'W2', rate: 7.2 }, { week: 'W3', rate: 9.1 }, { week: 'W4', rate: 6.8 },
    ],
    color: '#f59e0b',
  },
  {
    id: 'd4', department: 'Kitchen', totalEmployees: 18, presentToday: 17, absentToday: 1, lateToday: 0,
    attendanceRate: 94.4, trend: [92, 93, 94, 95, 94, 96, 94],
    topPerformers: [
      { name: 'Ngozi Amadi', rate: 100, streak: 22 },
      { name: 'Blessing Nwachukwu', rate: 99.0, streak: 19 },
      { name: 'Chioma Okafor', rate: 97.5, streak: 13 },
    ],
    absenteeismTrend: [
      { week: 'W1', rate: 2.1 }, { week: 'W2', rate: 3.5 }, { week: 'W3', rate: 1.8 }, { week: 'W4', rate: 2.9 },
    ],
    color: '#7c3aed',
  },
  {
    id: 'd5', department: 'Security', totalEmployees: 10, presentToday: 9, absentToday: 1, lateToday: 0,
    attendanceRate: 90.0, trend: [88, 89, 90, 91, 88, 92, 90],
    topPerformers: [
      { name: 'Ibrahim Suleiman', rate: 100, streak: 18 },
      { name: 'Babatunde Lawal', rate: 95.5, streak: 11 },
    ],
    absenteeismTrend: [
      { week: 'W1', rate: 5.0 }, { week: 'W2', rate: 4.5 }, { week: 'W3', rate: 6.0 }, { week: 'W4', rate: 4.0 },
    ],
    color: '#dc2626',
  },
  {
    id: 'd6', department: 'Finance', totalEmployees: 8, presentToday: 8, absentToday: 0, lateToday: 1,
    attendanceRate: 100.0, trend: [96, 97, 98, 100, 99, 100, 100],
    topPerformers: [
      { name: 'Chukwuemeka Eze', rate: 100, streak: 22 },
      { name: 'Amina Yusuf', rate: 100, streak: 20 },
    ],
    absenteeismTrend: [
      { week: 'W1', rate: 0.0 }, { week: 'W2', rate: 1.2 }, { week: 'W3', rate: 0.5 }, { week: 'W4', rate: 0.0 },
    ],
    color: '#16a34a',
  },
  {
    id: 'd7', department: 'HR and Admin', totalEmployees: 5, presentToday: 5, absentToday: 0, lateToday: 0,
    attendanceRate: 100.0, trend: [98, 99, 100, 100, 99, 100, 100],
    topPerformers: [
      { name: 'Fatima Bello', rate: 100, streak: 22 },
    ],
    absenteeismTrend: [
      { week: 'W1', rate: 0.0 }, { week: 'W2', rate: 0.0 }, { week: 'W3', rate: 1.0 }, { week: 'W4', rate: 0.0 },
    ],
    color: '#0891b2',
  },
  {
    id: 'd8', department: 'Logistics', totalEmployees: 12, presentToday: 10, absentToday: 2, lateToday: 1,
    attendanceRate: 83.3, trend: [78, 80, 82, 83, 81, 84, 83],
    topPerformers: [
      { name: 'Musa Abdullahi', rate: 92.0, streak: 7 },
      { name: 'Oluwaseun Adeyemi', rate: 90.5, streak: 6 },
    ],
    absenteeismTrend: [
      { week: 'W1', rate: 10.5 }, { week: 'W2', rate: 9.2 }, { week: 'W3', rate: 11.0 }, { week: 'W4', rate: 8.5 },
    ],
    color: '#f59e0b',
  },
  {
    id: 'd9', department: 'Sales', totalEmployees: 23, presentToday: 20, absentToday: 2, lateToday: 1,
    attendanceRate: 87.0, trend: [83, 85, 86, 87, 85, 88, 87],
    topPerformers: [
      { name: 'Yetunde Afolabi', rate: 96.5, streak: 12 },
      { name: 'Chioma Okafor', rate: 94.0, streak: 9 },
    ],
    absenteeismTrend: [
      { week: 'W1', rate: 7.5 }, { week: 'W2', rate: 6.8 }, { week: 'W3', rate: 8.2 }, { week: 'W4', rate: 5.9 },
    ],
    color: '#db2777',
  },
];

export const mockLocationStats: LocationAttendanceStat[] = [
  { id: 'l1', location: 'HEAD OFFICE', totalEmployees: 126, presentToday: 118, attendanceRate: 93.7, devices: 2, onlineDevices: 2, trend: [88, 91, 90, 93, 95, 92, 94], color: '#16a34a' },
  { id: 'l2', location: 'Magboro-Commissary', totalEmployees: 108, presentToday: 101, attendanceRate: 93.5, devices: 2, onlineDevices: 2, trend: [90, 92, 91, 94, 93, 95, 94], color: '#0891b2' },
  { id: 'l3', location: 'AROMIRE STORE', totalEmployees: 16, presentToday: 14, attendanceRate: 87.5, devices: 1, onlineDevices: 1, trend: [82, 84, 85, 87, 86, 88, 88], color: '#7c3aed' },
  { id: 'l4', location: 'IKOTUN', totalEmployees: 12, presentToday: 10, attendanceRate: 83.3, devices: 1, onlineDevices: 1, trend: [78, 80, 82, 83, 81, 84, 83], color: '#f59e0b' },
  { id: 'l5', location: 'OGUDU', totalEmployees: 14, presentToday: 13, attendanceRate: 92.9, devices: 1, onlineDevices: 0, trend: [88, 90, 91, 92, 90, 93, 93], color: '#dc2626' },
  { id: 'l6', location: 'EGBEDA STORE', totalEmployees: 10, presentToday: 9, attendanceRate: 90.0, devices: 1, onlineDevices: 1, trend: [85, 87, 88, 90, 89, 91, 90], color: '#16a34a' },
  { id: 'l7', location: 'ILUPEJU', totalEmployees: 8, presentToday: 7, attendanceRate: 87.5, devices: 1, onlineDevices: 1, trend: [82, 84, 85, 87, 86, 88, 88], color: '#0891b2' },
  { id: 'l8', location: 'TOYIN STORE', totalEmployees: 11, presentToday: 10, attendanceRate: 90.9, devices: 1, onlineDevices: 1, trend: [86, 88, 89, 91, 90, 92, 91], color: '#7c3aed' },
  { id: 'l9', location: 'MARYLAND', totalEmployees: 9, presentToday: 8, attendanceRate: 88.9, devices: 1, onlineDevices: 1, trend: [84, 86, 87, 89, 88, 90, 89], color: '#f59e0b' },
  { id: 'l10', location: 'AGIDINGBI', totalEmployees: 7, presentToday: 6, attendanceRate: 85.7, devices: 1, onlineDevices: 0, trend: [80, 82, 83, 85, 84, 86, 86], color: '#dc2626' },
  { id: 'l11', location: 'LEKKI', totalEmployees: 6, presentToday: 5, attendanceRate: 83.3, devices: 1, onlineDevices: 1, trend: [78, 80, 81, 83, 82, 84, 83], color: '#db2777' },
  { id: 'l12', location: 'VICTORIA ISLAND', totalEmployees: 5, presentToday: 5, attendanceRate: 100.0, devices: 1, onlineDevices: 1, trend: [95, 97, 98, 100, 99, 100, 100], color: '#16a34a' },
];

export const mockDeviceStats: DeviceAttendanceStat[] = [
  { id: 'dv1', deviceName: 'ZK-HQ-001', location: 'HEAD OFFICE', status: 'online', punchesToday: 248, lastSync: '2026-04-16 08:45', successRate: 98.4, weeklyPunches: [210, 225, 230, 248, 235, 0, 0] },
  { id: 'dv2', deviceName: 'ZK-HQ-002', location: 'HEAD OFFICE', status: 'online', punchesToday: 195, lastSync: '2026-04-16 08:43', successRate: 97.9, weeklyPunches: [180, 190, 185, 195, 188, 0, 0] },
  { id: 'dv3', deviceName: 'ZK-MAGBORO-001', location: 'Magboro-Commissary', status: 'online', punchesToday: 202, lastSync: '2026-04-16 08:50', successRate: 99.0, weeklyPunches: [195, 200, 198, 202, 199, 0, 0] },
  { id: 'dv4', deviceName: 'ZK-MAGBORO-002', location: 'Magboro-Commissary', status: 'online', punchesToday: 178, lastSync: '2026-04-16 08:48', successRate: 98.3, weeklyPunches: [170, 175, 172, 178, 174, 0, 0] },
  { id: 'dv5', deviceName: 'ZK-AROMIRE-001', location: 'AROMIRE STORE', status: 'online', punchesToday: 32, lastSync: '2026-04-16 08:52', successRate: 96.9, weeklyPunches: [28, 30, 29, 32, 31, 0, 0] },
  { id: 'dv6', deviceName: 'ZK-IKOTUN-001', location: 'IKOTUN', status: 'online', punchesToday: 24, lastSync: '2026-04-16 08:55', successRate: 95.8, weeklyPunches: [20, 22, 21, 24, 23, 0, 0] },
  { id: 'dv7', deviceName: 'ZK-OGUDU-001', location: 'OGUDU', status: 'offline', punchesToday: 0, lastSync: '2026-04-15 17:30', successRate: 94.2, weeklyPunches: [26, 28, 27, 0, 0, 0, 0] },
  { id: 'dv8', deviceName: 'ZK-EGBEDA-001', location: 'EGBEDA STORE', status: 'online', punchesToday: 20, lastSync: '2026-04-16 08:58', successRate: 97.5, weeklyPunches: [18, 19, 18, 20, 19, 0, 0] },
  { id: 'dv9', deviceName: 'ZK-ILUPEJU-001', location: 'ILUPEJU', status: 'online', punchesToday: 16, lastSync: '2026-04-16 09:00', successRate: 98.1, weeklyPunches: [14, 15, 14, 16, 15, 0, 0] },
  { id: 'dv10', deviceName: 'ZK-AGIDINGBI-001', location: 'AGIDINGBI', status: 'offline', punchesToday: 0, lastSync: '2026-04-15 16:45', successRate: 91.3, weeklyPunches: [12, 13, 12, 0, 0, 0, 0] },
];
