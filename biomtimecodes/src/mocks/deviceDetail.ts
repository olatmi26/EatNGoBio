export interface PunchLog {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  timestamp: string;
  punchType: 'fingerprint' | 'face' | 'card' | 'password';
  verifyMode: 'Check-In' | 'Check-Out' | 'Break' | 'Return';
  status: 'success' | 'failed' | 'timeout';
}

export interface SyncHistory {
  id: string;
  timestamp: string;
  type: 'attendance' | 'user' | 'command' | 'heartbeat';
  records: number;
  status: 'success' | 'failed' | 'partial';
  duration: string;
  message: string;
}

export interface DeviceCommand {
  id: string;
  command: string;
  sentAt: string;
  status: 'pending' | 'executed' | 'failed' | 'timeout';
  response: string;
}

export const mockPunchLogs: PunchLog[] = [
  { id: 'pl1', employeeId: '00237', employeeName: 'Kuzunwhe Adeyemi', department: 'HEAD-OFFICE', timestamp: '2026-04-16 09:02:11', punchType: 'fingerprint', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl2', employeeId: '1', employeeName: 'Taiwo Hassan', department: 'HEAD-OFFICE', timestamp: '2026-04-16 08:58:44', punchType: 'face', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl3', employeeId: '10082', employeeName: 'Odunayo Okafor', department: 'HEAD-OFFICE', timestamp: '2026-04-16 09:15:22', punchType: 'fingerprint', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl4', employeeId: '10245', employeeName: 'Adaeze Nwosu', department: 'Operations', timestamp: '2026-04-16 08:05:33', punchType: 'face', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl5', employeeId: '10301', employeeName: 'Emeka Obi', department: 'IT', timestamp: '2026-04-16 08:30:01', punchType: 'fingerprint', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl6', employeeId: '10388', employeeName: 'Fatima Bello', department: 'HR and Admin', timestamp: '2026-04-16 07:55:18', punchType: 'fingerprint', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl7', employeeId: '10412', employeeName: 'Babatunde Lawal', department: 'Security', timestamp: '2026-04-16 06:00:05', punchType: 'fingerprint', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl8', employeeId: '10455', employeeName: 'Ngozi Amadi', department: 'Kitchen', timestamp: '2026-04-16 07:00:44', punchType: 'face', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl9', employeeId: '10502', employeeName: 'Chukwuemeka Eze', department: 'Finance', timestamp: '2026-04-16 08:10:29', punchType: 'fingerprint', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl10', employeeId: '10567', employeeName: 'Amina Yusuf', department: 'Accounts', timestamp: '2026-04-16 08:00:55', punchType: 'fingerprint', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl11', employeeId: '10700', employeeName: 'Oluwaseun Adeyemi', department: 'Logistics', timestamp: '2026-04-16 07:45:12', punchType: 'fingerprint', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl12', employeeId: '10901', employeeName: 'Segun Ogundimu', department: 'Maintenance', timestamp: '2026-04-16 08:00:03', punchType: 'fingerprint', verifyMode: 'Check-In', status: 'success' },
  { id: 'pl13', employeeId: '00237', employeeName: 'Kuzunwhe Adeyemi', department: 'HEAD-OFFICE', timestamp: '2026-04-16 13:01:00', punchType: 'fingerprint', verifyMode: 'Break', status: 'success' },
  { id: 'pl14', employeeId: '1', employeeName: 'Taiwo Hassan', department: 'HEAD-OFFICE', timestamp: '2026-04-16 13:05:22', punchType: 'face', verifyMode: 'Break', status: 'success' },
  { id: 'pl15', employeeId: '10082', employeeName: 'Odunayo Okafor', department: 'HEAD-OFFICE', timestamp: '2026-04-16 13:15:44', punchType: 'fingerprint', verifyMode: 'Break', status: 'success' },
  { id: 'pl16', employeeId: '99999', employeeName: 'Unknown User', department: '-', timestamp: '2026-04-16 11:22:33', punchType: 'fingerprint', verifyMode: 'Check-In', status: 'failed' },
  { id: 'pl17', employeeId: '00237', employeeName: 'Kuzunwhe Adeyemi', department: 'HEAD-OFFICE', timestamp: '2026-04-16 14:02:11', punchType: 'fingerprint', verifyMode: 'Return', status: 'success' },
  { id: 'pl18', employeeId: '10388', employeeName: 'Fatima Bello', department: 'HR and Admin', timestamp: '2026-04-16 17:00:08', punchType: 'fingerprint', verifyMode: 'Check-Out', status: 'success' },
  { id: 'pl19', employeeId: '10412', employeeName: 'Babatunde Lawal', department: 'Security', timestamp: '2026-04-16 14:00:22', punchType: 'fingerprint', verifyMode: 'Check-Out', status: 'success' },
  { id: 'pl20', employeeId: '10455', employeeName: 'Ngozi Amadi', department: 'Kitchen', timestamp: '2026-04-16 15:00:11', punchType: 'face', verifyMode: 'Check-Out', status: 'success' },
];

export const mockSyncHistory: SyncHistory[] = [
  { id: 'sh1', timestamp: '2026-04-16 09:17:11', type: 'heartbeat', records: 0, status: 'success', duration: '0.2s', message: 'Heartbeat OK' },
  { id: 'sh2', timestamp: '2026-04-16 09:10:05', type: 'attendance', records: 12, status: 'success', duration: '1.4s', message: '12 attendance records synced' },
  { id: 'sh3', timestamp: '2026-04-16 09:07:11', type: 'heartbeat', records: 0, status: 'success', duration: '0.2s', message: 'Heartbeat OK' },
  { id: 'sh4', timestamp: '2026-04-16 08:55:33', type: 'attendance', records: 8, status: 'success', duration: '1.1s', message: '8 attendance records synced' },
  { id: 'sh5', timestamp: '2026-04-16 08:30:00', type: 'command', records: 0, status: 'success', duration: '0.5s', message: 'Command executed: SYNC_USER' },
  { id: 'sh6', timestamp: '2026-04-16 08:00:11', type: 'attendance', records: 5, status: 'success', duration: '0.9s', message: '5 attendance records synced' },
  { id: 'sh7', timestamp: '2026-04-16 07:45:22', type: 'user', records: 126, status: 'success', duration: '3.2s', message: '126 users synchronized' },
  { id: 'sh8', timestamp: '2026-04-16 07:00:00', type: 'attendance', records: 3, status: 'partial', duration: '2.1s', message: '3 records synced, 1 failed (duplicate)' },
  { id: 'sh9', timestamp: '2026-04-15 23:00:00', type: 'attendance', records: 45, status: 'success', duration: '4.5s', message: 'End-of-day sync: 45 records' },
  { id: 'sh10', timestamp: '2026-04-15 18:30:00', type: 'heartbeat', records: 0, status: 'failed', duration: '30s', message: 'Heartbeat timeout — device unreachable' },
];

export const mockDeviceCommands: DeviceCommand[] = [
  { id: 'dc1', command: 'SYNC_USER', sentAt: '2026-04-16 08:30:00', status: 'executed', response: 'User sync completed: 126 users' },
  { id: 'dc2', command: 'GET_ATTLOG', sentAt: '2026-04-16 09:10:00', status: 'executed', response: 'Attendance log retrieved: 12 records' },
  { id: 'dc3', command: 'RESTART', sentAt: '2026-04-15 22:00:00', status: 'executed', response: 'Device restarted successfully' },
  { id: 'dc4', command: 'CLEAR_ATTLOG', sentAt: '2026-04-14 08:00:00', status: 'executed', response: 'Attendance log cleared' },
  { id: 'dc5', command: 'CHECK_FIRMWARE', sentAt: '2026-04-13 10:00:00', status: 'executed', response: 'Firmware: Ver 6.60 — Up to date' },
];
