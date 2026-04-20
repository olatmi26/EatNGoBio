export interface ShiftBreak {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  paid: boolean;
}

export interface Shift {
  id: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  workHours: number;
  lateThreshold: number;
  overtimeThreshold: number;
  breaks: ShiftBreak[];
  locations: string[];
  color: string;
  employeeCount: number;
  active: boolean;
  type: 'fixed' | 'flexible' | 'rotating';
}

export interface ShiftAssignment {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  shiftId: string;
  shiftName: string;
  effectiveDate: string;
  endDate: string | null;
  location: string;
}

export interface TimetableEntry {
  id: string;
  shiftId: string;
  dayOfWeek: number;
  isWorkday: boolean;
}

export const mockShifts: Shift[] = [
  {
    id: 'sh1',
    name: 'Standard Day Shift',
    code: 'SDS',
    startTime: '08:00',
    endTime: '17:00',
    workHours: 9,
    lateThreshold: 15,
    overtimeThreshold: 60,
    breaks: [
      { id: 'b1', name: 'Lunch Break', startTime: '13:00', endTime: '14:00', paid: false },
    ],
    locations: ['HEAD OFFICE', 'AROMIRE STORE', 'IKOTUN'],
    color: '#16a34a',
    employeeCount: 126,
    active: true,
    type: 'fixed',
  },
  {
    id: 'sh2',
    name: 'Early Morning Shift',
    code: 'EMS',
    startTime: '06:00',
    endTime: '14:00',
    workHours: 8,
    lateThreshold: 10,
    overtimeThreshold: 30,
    breaks: [
      { id: 'b2', name: 'Tea Break', startTime: '09:00', endTime: '09:15', paid: true },
    ],
    locations: ['Magboro-Commissary', 'EGBEDA STORE'],
    color: '#f59e0b',
    employeeCount: 45,
    active: true,
    type: 'fixed',
  },
  {
    id: 'sh3',
    name: 'Afternoon Shift',
    code: 'AFS',
    startTime: '14:00',
    endTime: '22:00',
    workHours: 8,
    lateThreshold: 15,
    overtimeThreshold: 45,
    breaks: [
      { id: 'b3', name: 'Dinner Break', startTime: '18:00', endTime: '18:30', paid: false },
    ],
    locations: ['OGUDU', 'TOYIN STORE', 'MARYLAND'],
    color: '#0891b2',
    employeeCount: 32,
    active: true,
    type: 'fixed',
  },
  {
    id: 'sh4',
    name: 'Night Shift',
    code: 'NGT',
    startTime: '22:00',
    endTime: '06:00',
    workHours: 8,
    lateThreshold: 20,
    overtimeThreshold: 60,
    breaks: [
      { id: 'b4', name: 'Midnight Break', startTime: '02:00', endTime: '02:30', paid: true },
    ],
    locations: ['Magboro-Commissary'],
    color: '#7c3aed',
    employeeCount: 18,
    active: true,
    type: 'fixed',
  },
  {
    id: 'sh5',
    name: 'Flexible Hours',
    code: 'FLX',
    startTime: '07:00',
    endTime: '19:00',
    workHours: 8,
    lateThreshold: 30,
    overtimeThreshold: 120,
    breaks: [
      { id: 'b5', name: 'Lunch', startTime: '12:00', endTime: '13:00', paid: false },
    ],
    locations: ['HEAD OFFICE'],
    color: '#db2777',
    employeeCount: 12,
    active: true,
    type: 'flexible',
  },
  {
    id: 'sh6',
    name: 'Weekend Shift',
    code: 'WKD',
    startTime: '09:00',
    endTime: '18:00',
    workHours: 9,
    lateThreshold: 15,
    overtimeThreshold: 60,
    breaks: [
      { id: 'b6', name: 'Lunch Break', startTime: '13:00', endTime: '14:00', paid: false },
    ],
    locations: ['AROMIRE STORE', 'EGBEDA STORE', 'LEKKI', 'VICTORIA ISLAND'],
    color: '#d97706',
    employeeCount: 28,
    active: false,
    type: 'rotating',
  },
];

export const mockShiftAssignments: ShiftAssignment[] = [
  { id: 'sa1', employeeId: 'e1', employeeName: 'Kuzunwhe Adeyemi', department: 'HEAD-OFFICE', shiftId: 'sh1', shiftName: 'Standard Day Shift', effectiveDate: '2026-01-01', endDate: null, location: 'HEAD OFFICE' },
  { id: 'sa2', employeeId: 'e2', employeeName: 'Taiwo Hassan', department: 'HEAD-OFFICE', shiftId: 'sh1', shiftName: 'Standard Day Shift', effectiveDate: '2026-01-01', endDate: null, location: 'HEAD OFFICE' },
  { id: 'sa3', employeeId: 'e4', employeeName: 'Godwin Eze', department: 'MAGBORO COMMISSARY', shiftId: 'sh2', shiftName: 'Early Morning Shift', effectiveDate: '2026-01-01', endDate: null, location: 'Magboro-Commissary' },
  { id: 'sa4', employeeId: 'e5', employeeName: 'Adaeze Nwosu', department: 'Operations', shiftId: 'sh1', shiftName: 'Standard Day Shift', effectiveDate: '2026-02-01', endDate: null, location: 'HEAD OFFICE' },
  { id: 'sa5', employeeId: 'e8', employeeName: 'Babatunde Lawal', department: 'Security', shiftId: 'sh4', shiftName: 'Night Shift', effectiveDate: '2026-01-15', endDate: null, location: 'HEAD OFFICE' },
  { id: 'sa6', employeeId: 'e13', employeeName: 'Tunde Fashola', department: 'Operations', shiftId: 'sh3', shiftName: 'Afternoon Shift', effectiveDate: '2026-03-01', endDate: null, location: 'AROMIRE STORE' },
  { id: 'sa7', employeeId: 'e15', employeeName: 'Chioma Okafor', department: 'Sales', shiftId: 'sh3', shiftName: 'Afternoon Shift', effectiveDate: '2026-04-01', endDate: null, location: 'IKOTUN' },
  { id: 'sa8', employeeId: 'e17', employeeName: 'Blessing Nwachukwu', department: 'Kitchen', shiftId: 'sh2', shiftName: 'Early Morning Shift', effectiveDate: '2026-01-01', endDate: null, location: 'Magboro-Commissary' },
];
