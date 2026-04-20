export interface AttendanceSummaryRow {
  employeeId: string;
  employeeName: string;
  department: string;
  shift: string;
  location: string;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDays: number;
  totalWorkHours: number;
  overtimeHours: number;
  lateMinutes: number;
  attendanceRate: number;
}

export interface PayrollRow {
  employeeId: string;
  employeeName: string;
  department: string;
  shift: string;
  basicSalary: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  overtimeHours: number;
  lateDeduction: number;
  absentDeduction: number;
  overtimePay: number;
  netPay: number;
  workHours: number;
}

export interface DailyAttendanceRow {
  date: string;
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  attendanceRate: number;
}

export const mockAttendanceSummary: AttendanceSummaryRow[] = [
  { employeeId: '00237', employeeName: 'Kuzunwhe Adeyemi', department: 'HEAD-OFFICE', shift: 'Standard Day Shift', location: 'HEAD OFFICE', presentDays: 20, absentDays: 2, lateDays: 1, halfDays: 0, totalWorkHours: 181.5, overtimeHours: 1.5, lateMinutes: 12, attendanceRate: 90.9 },
  { employeeId: '1', employeeName: 'Taiwo Hassan', department: 'HEAD-OFFICE', shift: 'Standard Day Shift', location: 'HEAD OFFICE', presentDays: 22, absentDays: 0, lateDays: 0, halfDays: 0, totalWorkHours: 198.0, overtimeHours: 0, lateMinutes: 0, attendanceRate: 100 },
  { employeeId: '10082', employeeName: 'Odunayo Okafor', department: 'HEAD-OFFICE', shift: 'Standard Day Shift', location: 'HEAD OFFICE', presentDays: 19, absentDays: 2, lateDays: 4, halfDays: 1, totalWorkHours: 168.0, overtimeHours: 0, lateMinutes: 68, attendanceRate: 86.4 },
  { employeeId: '10199', employeeName: 'Godwin Eze', department: 'MAGBORO COMMISSARY', shift: 'Early Morning Shift', location: 'Magboro-Commissary', presentDays: 22, absentDays: 0, lateDays: 0, halfDays: 0, totalWorkHours: 176.0, overtimeHours: 2.5, lateMinutes: 0, attendanceRate: 100 },
  { employeeId: '10245', employeeName: 'Adaeze Nwosu', department: 'Operations', shift: 'Standard Day Shift', location: 'HEAD OFFICE', presentDays: 21, absentDays: 1, lateDays: 2, halfDays: 0, totalWorkHours: 189.0, overtimeHours: 0, lateMinutes: 35, attendanceRate: 95.5 },
  { employeeId: '10301', employeeName: 'Emeka Obi', department: 'IT', shift: 'Standard Day Shift', location: 'HEAD OFFICE', presentDays: 20, absentDays: 2, lateDays: 3, halfDays: 0, totalWorkHours: 180.0, overtimeHours: 4.0, lateMinutes: 55, attendanceRate: 90.9 },
  { employeeId: '10388', employeeName: 'Fatima Bello', department: 'HR and Admin', shift: 'Standard Day Shift', location: 'HEAD OFFICE', presentDays: 22, absentDays: 0, lateDays: 0, halfDays: 0, totalWorkHours: 199.0, overtimeHours: 1.0, lateMinutes: 0, attendanceRate: 100 },
  { employeeId: '10412', employeeName: 'Babatunde Lawal', department: 'Security', shift: 'Night Shift', location: 'HEAD OFFICE', presentDays: 20, absentDays: 2, lateDays: 1, halfDays: 0, totalWorkHours: 160.0, overtimeHours: 0, lateMinutes: 20, attendanceRate: 90.9 },
  { employeeId: '10455', employeeName: 'Ngozi Amadi', department: 'Kitchen', shift: 'Early Morning Shift', location: 'HEAD OFFICE', presentDays: 21, absentDays: 1, lateDays: 0, halfDays: 0, totalWorkHours: 168.0, overtimeHours: 0, lateMinutes: 0, attendanceRate: 95.5 },
  { employeeId: '10502', employeeName: 'Chukwuemeka Eze', department: 'Finance', shift: 'Standard Day Shift', location: 'HEAD OFFICE', presentDays: 22, absentDays: 0, lateDays: 1, halfDays: 0, totalWorkHours: 198.5, overtimeHours: 0.5, lateMinutes: 10, attendanceRate: 100 },
  { employeeId: '10567', employeeName: 'Amina Yusuf', department: 'Accounts', shift: 'Standard Day Shift', location: 'HEAD OFFICE', presentDays: 21, absentDays: 1, lateDays: 0, halfDays: 0, totalWorkHours: 189.0, overtimeHours: 0, lateMinutes: 0, attendanceRate: 95.5 },
  { employeeId: '10601', employeeName: 'Halima Musa', department: 'Procurement', shift: 'Standard Day Shift', location: 'HEAD OFFICE', presentDays: 18, absentDays: 4, lateDays: 2, halfDays: 0, totalWorkHours: 162.0, overtimeHours: 0, lateMinutes: 40, attendanceRate: 81.8 },
  { employeeId: '10644', employeeName: 'Tunde Fashola', department: 'Operations', shift: 'Afternoon Shift', location: 'AROMIRE STORE', presentDays: 22, absentDays: 0, lateDays: 0, halfDays: 0, totalWorkHours: 176.0, overtimeHours: 0, lateMinutes: 0, attendanceRate: 100 },
  { employeeId: '10700', employeeName: 'Oluwaseun Adeyemi', department: 'Logistics', shift: 'Standard Day Shift', location: 'HEAD OFFICE', presentDays: 20, absentDays: 2, lateDays: 1, halfDays: 0, totalWorkHours: 180.0, overtimeHours: 0, lateMinutes: 15, attendanceRate: 90.9 },
  { employeeId: '10755', employeeName: 'Chioma Okafor', department: 'Sales', shift: 'Afternoon Shift', location: 'IKOTUN', presentDays: 19, absentDays: 3, lateDays: 3, halfDays: 2, totalWorkHours: 152.0, overtimeHours: 0, lateMinutes: 75, attendanceRate: 86.4 },
];

export const mockPayrollSummary: PayrollRow[] = [
  { employeeId: '00237', employeeName: 'Kuzunwhe Adeyemi', department: 'HEAD-OFFICE', shift: 'Standard Day Shift', basicSalary: 250000, presentDays: 20, absentDays: 2, lateDays: 1, overtimeHours: 1.5, lateDeduction: 1136, absentDeduction: 22727, overtimePay: 2131, netPay: 228268, workHours: 181.5 },
  { employeeId: '1', employeeName: 'Taiwo Hassan', department: 'HEAD-OFFICE', shift: 'Standard Day Shift', basicSalary: 350000, presentDays: 22, absentDays: 0, lateDays: 0, overtimeHours: 0, lateDeduction: 0, absentDeduction: 0, overtimePay: 0, netPay: 350000, workHours: 198.0 },
  { employeeId: '10082', employeeName: 'Odunayo Okafor', department: 'HEAD-OFFICE', shift: 'Standard Day Shift', basicSalary: 180000, presentDays: 19, absentDays: 2, lateDays: 4, overtimeHours: 0, lateDeduction: 3273, absentDeduction: 16364, overtimePay: 0, netPay: 160363, workHours: 168.0 },
  { employeeId: '10199', employeeName: 'Godwin Eze', department: 'MAGBORO COMMISSARY', shift: 'Early Morning Shift', basicSalary: 220000, presentDays: 22, absentDays: 0, lateDays: 0, overtimeHours: 2.5, lateDeduction: 0, absentDeduction: 0, overtimePay: 3750, netPay: 223750, workHours: 176.0 },
  { employeeId: '10245', employeeName: 'Adaeze Nwosu', department: 'Operations', shift: 'Standard Day Shift', basicSalary: 200000, presentDays: 21, absentDays: 1, lateDays: 2, overtimeHours: 0, lateDeduction: 1818, absentDeduction: 9091, overtimePay: 0, netPay: 189091, workHours: 189.0 },
  { employeeId: '10301', employeeName: 'Emeka Obi', department: 'IT', shift: 'Standard Day Shift', basicSalary: 280000, presentDays: 20, absentDays: 2, lateDays: 3, overtimeHours: 4.0, lateDeduction: 3818, absentDeduction: 25455, overtimePay: 8000, netPay: 258727, workHours: 180.0 },
  { employeeId: '10388', employeeName: 'Fatima Bello', department: 'HR and Admin', shift: 'Standard Day Shift', basicSalary: 230000, presentDays: 22, absentDays: 0, lateDays: 0, overtimeHours: 1.0, lateDeduction: 0, absentDeduction: 0, overtimePay: 1563, netPay: 231563, workHours: 199.0 },
  { employeeId: '10412', employeeName: 'Babatunde Lawal', department: 'Security', shift: 'Night Shift', basicSalary: 150000, presentDays: 20, absentDays: 2, lateDays: 1, overtimeHours: 0, lateDeduction: 682, absentDeduction: 13636, overtimePay: 0, netPay: 135682, workHours: 160.0 },
  { employeeId: '10455', employeeName: 'Ngozi Amadi', department: 'Kitchen', shift: 'Early Morning Shift', basicSalary: 160000, presentDays: 21, absentDays: 1, lateDays: 0, overtimeHours: 0, lateDeduction: 0, absentDeduction: 7273, overtimePay: 0, netPay: 152727, workHours: 168.0 },
  { employeeId: '10502', employeeName: 'Chukwuemeka Eze', department: 'Finance', shift: 'Standard Day Shift', basicSalary: 300000, presentDays: 22, absentDays: 0, lateDays: 1, overtimeHours: 0.5, lateDeduction: 909, absentDeduction: 0, overtimePay: 1023, netPay: 300114, workHours: 198.5 },
];

export const mockDailyTrend: DailyAttendanceRow[] = [
  { date: '2026-04-01', totalEmployees: 262, present: 245, absent: 10, late: 7, halfDay: 0, attendanceRate: 93.5 },
  { date: '2026-04-02', totalEmployees: 262, present: 250, absent: 8, late: 4, halfDay: 0, attendanceRate: 95.4 },
  { date: '2026-04-03', totalEmployees: 262, present: 248, absent: 9, late: 5, halfDay: 0, attendanceRate: 94.7 },
  { date: '2026-04-04', totalEmployees: 262, present: 255, absent: 5, late: 2, halfDay: 0, attendanceRate: 97.3 },
  { date: '2026-04-05', totalEmployees: 262, present: 0, absent: 262, late: 0, halfDay: 0, attendanceRate: 0 },
  { date: '2026-04-06', totalEmployees: 262, present: 0, absent: 262, late: 0, halfDay: 0, attendanceRate: 0 },
  { date: '2026-04-07', totalEmployees: 262, present: 240, absent: 15, late: 7, halfDay: 0, attendanceRate: 91.6 },
  { date: '2026-04-08', totalEmployees: 262, present: 252, absent: 7, late: 3, halfDay: 0, attendanceRate: 96.2 },
  { date: '2026-04-09', totalEmployees: 262, present: 247, absent: 10, late: 5, halfDay: 0, attendanceRate: 94.3 },
  { date: '2026-04-10', totalEmployees: 262, present: 258, absent: 3, late: 1, halfDay: 0, attendanceRate: 98.5 },
  { date: '2026-04-11', totalEmployees: 262, present: 244, absent: 12, late: 6, halfDay: 0, attendanceRate: 93.1 },
  { date: '2026-04-12', totalEmployees: 262, present: 0, absent: 262, late: 0, halfDay: 0, attendanceRate: 0 },
  { date: '2026-04-13', totalEmployees: 262, present: 0, absent: 262, late: 0, halfDay: 0, attendanceRate: 0 },
  { date: '2026-04-14', totalEmployees: 262, present: 251, absent: 8, late: 3, halfDay: 0, attendanceRate: 95.8 },
  { date: '2026-04-15', totalEmployees: 262, present: 246, absent: 11, late: 5, halfDay: 0, attendanceRate: 93.9 },
  { date: '2026-04-16', totalEmployees: 262, present: 250, absent: 12, late: 8, halfDay: 2, attendanceRate: 95.4 },
];
