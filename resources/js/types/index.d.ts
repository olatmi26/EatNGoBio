import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
    permissions?: string[];
    avatar?: string;
    initials?: string;
    status?: string;
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: { user: User };
    ziggy: Config & { location: string };
    flash: { success?: string; error?: string; warning?: string };
    unreadCount?: number;
};

// ── Domain Types ──────────────────────────────────────────────────────────────

export interface DeviceItem {
    id: number;
    sn: string;
    name: string;
    area: string;
    ip: string;
    timezone: string;
    transferMode: string;
    status: 'online' | 'offline' | 'syncing' | 'unregistered';
    lastActivity: string;
    lastSeen: string;
    users: number;
    fp: number;
    face: number;
    firmware: string;
    heartbeat: number;
    punchesToday: number;
    location?: string;
    approved: boolean;
}

export interface PendingDeviceItem {
    id: number;
    sn: string;
    ip: string;
    model: string;
    firmware: string;
    firstSeen: string;
    lastHeartbeat: string;
    status: 'pending' | 'provisioning' | 'approved' | 'rejected';
    requestCount: number;
    suggestedName: string;
}

export interface EmployeeItem {
    id: number;
    employeeId: string;
    firstName: string;
    lastName: string;
    fullName: string;
    initials: string;
    department: string;
    position: string;
    area: string;
    employmentType: string;
    hiredDate?: string;
    gender?: string;
    email?: string;
    mobile?: string;
    status: 'active' | 'resigned' | 'probation' | 'suspended' | 'disabled';
    basicSalary?: number;
    shift?: { id: number; name: string } | null;
    biometricAreas?: string[];
}

export interface AttendanceRecord {
    id: number;
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

export interface ShiftItem {
    id: number;
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

export interface ShiftBreak {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    paid: boolean;
}

export interface ShiftAssignmentItem {
    id: number;
    employeeId: string;
    employeeName: string;
    department: string;
    shiftId: string;
    shiftName: string;
    effectiveDate: string;
    endDate: string | null;
    location: string;
}

export interface LiveFeedEntry {
    id: number;
    employeeId: string;
    name: string;
    initials: string;
    department: string;
    device: string;
    deviceName?: string;
    time: string;
    timestamp: string;
    type: 'IN' | 'OUT';
    punchType: string;
    verifyMode: string;
    status: string;
    color: string;
}

export interface Notification {
    id: number;
    category: 'absence' | 'device' | 'late' | 'system' | 'biometric';
    severity: 'critical' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    time: string;
    read: boolean;
    actionLabel?: string;
    actionPath?: string;
    meta?: string;
}

export interface DepartmentItem {
    id: number;
    code: string;
    name: string;
    superior: string;
    employeeQty: number;
    resignedQty: number;
    manager: string;
    color?: string;
}

export interface PositionItem {
    id: number;
    code: string;
    name: string;
    employeeQty: number;
}

export interface AreaItem {
    id: number;
    code: string;
    name: string;
    timezone: string;
    devices: number;
    employees: number;
}

export interface PunchLog {
    id: number;
    employeeId: string;
    employeeName: string;
    department: string;
    timestamp: string;
    punchType: 'fingerprint' | 'face' | 'card' | 'password';
    verifyMode: 'Check-In' | 'Check-Out' | 'Break' | 'Return' | 'OT In' | 'OT Out';
    status: 'success' | 'failed';
}

export interface SyncHistory {
    id: number;
    timestamp: string;
    type: 'attendance' | 'user' | 'command' | 'heartbeat' | 'upload';
    records: number;
    status: 'success' | 'failed' | 'partial';
    duration: string;
    message: string;
}

export interface DeviceCommandItem {
    id: number;
    command: string;
    sentAt: string;
    status: 'pending' | 'sent' | 'success' | 'failed';
    response: string;
}
