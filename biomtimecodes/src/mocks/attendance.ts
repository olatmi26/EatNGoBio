export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  area: string;
  device: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workHours: string;
  status: 'present' | 'late' | 'absent' | 'half-day';
  punchType: 'fingerprint' | 'face' | 'card' | 'password';
}

export const mockAttendanceRecords: AttendanceRecord[] = [
  { id: 'att1', employeeId: '00237', employeeName: 'Kuzunwhe Adeyemi', department: 'HEAD-OFFICE', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '08:02', checkOut: '17:05', workHours: '9h 03m', status: 'present', punchType: 'fingerprint' },
  { id: 'att2', employeeId: '1', employeeName: 'Taiwo Hassan', department: 'HEAD-OFFICE', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '07:58', checkOut: '17:00', workHours: '9h 02m', status: 'present', punchType: 'face' },
  { id: 'att3', employeeId: '10082', employeeName: 'Odunayo Okafor', department: 'HEAD-OFFICE', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '09:15', checkOut: '17:10', workHours: '7h 55m', status: 'late', punchType: 'fingerprint' },
  { id: 'att4', employeeId: '10199', employeeName: 'Godwin Eze', department: 'MAGBORO COMMISSARY', area: 'Magboro-Commissary', device: 'Magboro-Commissary BIO', date: '2026-04-16', checkIn: '08:00', checkOut: '17:00', workHours: '9h 00m', status: 'present', punchType: 'fingerprint' },
  { id: 'att5', employeeId: '10245', employeeName: 'Adaeze Nwosu', department: 'Operations', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '08:05', checkOut: '', workHours: '-', status: 'present', punchType: 'face' },
  { id: 'att6', employeeId: '10301', employeeName: 'Emeka Obi', department: 'IT', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '08:30', checkOut: '17:30', workHours: '9h 00m', status: 'late', punchType: 'fingerprint' },
  { id: 'att7', employeeId: '10388', employeeName: 'Fatima Bello', department: 'HR and Admin', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '07:55', checkOut: '17:00', workHours: '9h 05m', status: 'present', punchType: 'fingerprint' },
  { id: 'att8', employeeId: '10412', employeeName: 'Babatunde Lawal', department: 'Security', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '06:00', checkOut: '14:00', workHours: '8h 00m', status: 'present', punchType: 'fingerprint' },
  { id: 'att9', employeeId: '10455', employeeName: 'Ngozi Amadi', department: 'Kitchen', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '07:00', checkOut: '15:00', workHours: '8h 00m', status: 'present', punchType: 'face' },
  { id: 'att10', employeeId: '10502', employeeName: 'Chukwuemeka Eze', department: 'Finance', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '08:10', checkOut: '17:15', workHours: '9h 05m', status: 'present', punchType: 'fingerprint' },
  { id: 'att11', employeeId: '10567', employeeName: 'Amina Yusuf', department: 'Accounts', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '08:00', checkOut: '17:00', workHours: '9h 00m', status: 'present', punchType: 'fingerprint' },
  { id: 'att12', employeeId: '10601', employeeName: 'Halima Musa', department: 'Procurement', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '', checkOut: '', workHours: '-', status: 'absent', punchType: 'fingerprint' },
  { id: 'att13', employeeId: '10644', employeeName: 'Tunde Fashola', department: 'Operations', area: 'AROMIRE STORE', device: 'AROMIRE BIOMETRICS', date: '2026-04-16', checkIn: '08:05', checkOut: '17:05', workHours: '9h 00m', status: 'present', punchType: 'fingerprint' },
  { id: 'att14', employeeId: '10700', employeeName: 'Oluwaseun Adeyemi', department: 'Logistics', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '07:45', checkOut: '16:45', workHours: '9h 00m', status: 'present', punchType: 'fingerprint' },
  { id: 'att15', employeeId: '10755', employeeName: 'Chioma Okafor', department: 'Sales', area: 'IKOTUN', device: 'IKOTUN BIOMETRICS', date: '2026-04-16', checkIn: '09:30', checkOut: '14:00', workHours: '4h 30m', status: 'half-day', punchType: 'fingerprint' },
  { id: 'att16', employeeId: '10800', employeeName: 'Ibrahim Suleiman', department: 'Security', area: 'OGUDU', device: 'OGUDU BIOMETRICS', date: '2026-04-16', checkIn: '06:00', checkOut: '14:00', workHours: '8h 00m', status: 'present', punchType: 'fingerprint' },
  { id: 'att17', employeeId: '10845', employeeName: 'Blessing Nwachukwu', department: 'Kitchen', area: 'Magboro-Commissary', device: 'Magboro-Commissary BIO', date: '2026-04-16', checkIn: '07:00', checkOut: '15:00', workHours: '8h 00m', status: 'present', punchType: 'face' },
  { id: 'att18', employeeId: '10901', employeeName: 'Segun Ogundimu', department: 'Maintenance', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '08:00', checkOut: '17:00', workHours: '9h 00m', status: 'present', punchType: 'fingerprint' },
  { id: 'att19', employeeId: '10950', employeeName: 'Yetunde Afolabi', department: 'Sales', area: 'EGBEDA STORE', device: 'EGBEDA STORE BIOMETRICS', date: '2026-04-16', checkIn: '08:15', checkOut: '17:15', workHours: '9h 00m', status: 'present', punchType: 'fingerprint' },
  { id: 'att20', employeeId: '11001', employeeName: 'Musa Abdullahi', department: 'Logistics', area: 'HEAD OFFICE', device: 'Central Support Unit', date: '2026-04-16', checkIn: '', checkOut: '', workHours: '-', status: 'absent', punchType: 'fingerprint' },
];
