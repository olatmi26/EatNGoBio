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

// ── Reports Types ──────────────────────────────────────────────────────────────

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
    workDaysInPeriod?: number;
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

export interface PayrollRow {
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
    basicSalary: number;
    absentDeduction: number;
    lateDeduction: number;
    overtimePay: number;
    netPay: number;
    workHours: number;
}

export interface PaginationMeta {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
    from?: number;
    to?: number;
}

// ── Payroll Types ──────────────────────────────────────────────────────────────

export interface PayrollPeriodItem {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    paymentDate: string;
    status: 'draft' | 'processing' | 'approved' | 'paid' | 'closed';
    totalEmployees: number;
    totalBasicSalary: number;
    totalAllowances: number;
    totalDeductions: number;
    totalNetPay: number;
    processedBy?: number;
    approvedBy?: number;
    approvedAt?: string;
    remarks?: string;
    createdAt: string;
    updatedAt: string;
}

export interface PayrollItem {
    id: number;
    employeeId: string;
    payrollPeriodId: number;
    basicSalary: number;
    allowances: Record<string, number> | null;
    deductions: Record<string, number> | null;
    overtimePay: number;
    lateDeduction: number;
    absentDeduction: number;
    taxDeduction: number;
    pensionDeduction: number;
    nhfDeduction: number;
    grossPay: number;
    netPay: number;
    daysWorked: number;
    daysAbsent: number;
    lateMinutes: number;
    overtimeHours: number;
    overtimeHoursWeekend?: number;
    overtimeHoursHoliday?: number;
    status: 'draft' | 'approved' | 'paid';
    approvedBy?: number;
    approvedAt?: string;
    paidAt?: string;
    remarks?: string;
    employee?: EmployeeItem;
    period?: PayrollPeriodItem;
    createdAt: string;
    updatedAt: string;
}

export interface PayrollSummary {
    totalEmployees: number;
    monthlyPayroll: number;
    averageSalary: number;
    pendingApprovals: number;
    ytdPayroll: number;
    currentPeriod: PayrollPeriodItem | null;
    lastPeriod: PayrollPeriodItem | null;
}

export interface PayrollTrendItem {
    month: string;
    totalPayroll: number;
    employeeCount: number;
    avgSalary: number;
}

export interface DepartmentPayrollSummary {
    department: string;
    employeeCount: number;
    totalBasic: number;
    totalAllowances: number;
    totalDeductions: number;
    totalNetPay: number;
}

export interface PayrollCalculation {
    basic_salary: number;
    daily_rate: number;
    hourly_rate: number;
    days_worked: number;
    days_absent: number;
    late_minutes: number;
    overtime_hours_normal: number;
    overtime_hours_weekend: number;
    overtime_hours_holiday: number;
    overtime_pay: number;
    absent_deduction: number;
    late_deduction: number;
    tax_deduction: number;
    pension_deduction: number;
    nhf_deduction: number;
    total_deductions: number;
    gross_pay: number;
    net_pay: number;
    pension_employer: number;
    nsitf_employer: number;
    total_employer_cost: number;
}

// ── Settings Types ─────────────────────────────────────────────────────────────

export interface SettingItem {
    id: number;
    key: string;
    value: string;
    group: string;
    type: 'text' | 'number' | 'boolean' | 'json' | 'select' | 'array';
    options: Array<{ value: string; label: string }> | null;
    label: string;
    description: string | null;
    isPublic: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface TaxBracket {
    min: number;
    max: number | null;
    rate: number;
}

export interface PayrollSettings {
    tax: {
        enabled: boolean;
        calculationMethod: 'flat' | 'graduated';
        flatRate: number;
        brackets: TaxBracket[];
        consolidatedRelief: number;
    };
    pension: {
        enabled: boolean;
        employeeRate: number;
        employerRate: number;
        minimumThreshold: number;
    };
    nhf: {
        enabled: boolean;
        rate: number;
        minimumThreshold: number;
    };
    deductions: {
        nsitf: {
            enabled: boolean;
            rate: number;
        };
    };
    general: {
        workDaysPerMonth: number;
        workHoursPerDay: number;
        overtimeMultiplier: number;
        weekendMultiplier: number;
        holidayMultiplier: number;
    };
}

// ── Role & Permission Types ───────────────────────────────────────────────────

export interface RoleItem {
    id: number;
    name: string;
    guardName: string;
    permissions: PermissionItem[];
    usersCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface PermissionItem {
    id: number;
    name: string;
    guardName: string;
    group?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
}

// ── Device Provisioning Types ─────────────────────────────────────────────────

export interface DeviceStats {
    total: number;
    online: number;
    offline: number;
    unregistered: number;
    pending: number;
    approved: number;
    rejected: number;
}

// ── Dashboard Types ───────────────────────────────────────────────────────────

export interface DashboardStats {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    checkInsToday: number;
    checkInsTrend: number;
    absentTrend: number;
    avgAttendanceRate: number;
    attendanceRateTrend: number;
    overtimeToday: number;
}

export interface HourlyActivityItem {
    hour: string;
    count: number;
}

export interface WeeklyTrendItem {
    day: string;
    date: string;
    rate: number;
    present: number;
    absent: number;
}

export interface DeptBreakdownItem {
    dept: string;
    present: number;
    total: number;
    rate: number;
    late: number;
    color: string;
}

export interface DeptStatsItem {
    id: number;
    department: string;
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    attendanceRate: number;
    trend: number[];
    topPerformers: Array<{ name: string; rate: number }>;
    absenteeismTrend: number[];
    color: string;
}

// ── Organization Types ────────────────────────────────────────────────────────

export interface OrgChartNode {
    id: string;
    name: string;
    title: string;
    department: string;
    employeeId?: string;
    avatar?: string;
    initials?: string;
    children?: OrgChartNode[];
    employeeCount?: number;
}

// ── Analytics Types ───────────────────────────────────────────────────────────

export interface AnalyticsSummary {
    avgAttendanceRate: number;
    avgWorkHours: number;
    avgOvertime: number;
    latePercentage: number;
    topDepartment: string;
    topDeptRate: number;
    worstDepartment: string;
    worstDeptRate: number;
    bestDay: string;
    worstDay: string;
}

export interface MonthlyTrendItem {
    month: string;
    attendanceRate: number;
    lateRate: number;
    overtime: number;
}

// ── Component Props Types ─────────────────────────────────────────────────────

export interface PaginationProps {
    currentPage: number;
    lastPage: number;
    onPageChange: (page: number) => void;
    total?: number;
    from?: number;
    to?: number;
    showInfo?: boolean;
    isDark?: boolean;
}

export interface TableSkeletonProps {
    columns: number;
    rows: number;
}

export interface ExportDropdownProps {
    tabType: string;
    onExport: (format: 'excel' | 'pdf', type: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

// ── Filter Types ──────────────────────────────────────────────────────────────

export interface ReportFilters {
    department?: string;
    location?: string;
    area?: string;
    shift?: string;
    search?: string;
    from?: string;
    to?: string;
}

export interface DateRange {
    from: string;
    to: string;
}

export interface DatePreset {
    label: string;
    getValue: () => DateRange;
}

// ── Toast Types ──────────────────────────────────────────────────────────────

export interface ToastMessage {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
}

// ── Theme Types ──────────────────────────────────────────────────────────────

export interface ThemeContextType {
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (isDark: boolean) => void;
}

// ── Route Types (for Ziggy autocomplete) ─────────────────────────────────────

export type AppRouteName =
    | 'dashboard'
    | 'devices.index'
    | 'employees.index'
    | 'attendance.index'
    | 'live-monitor.index'
    | 'reports.index'
    | 'analytics.index'
    | 'shifts.index'
    | 'org.departments'
    | 'org.positions'
    | 'org.areas'
    | 'org.chart'
    | 'payroll.index'
    | 'payroll.generate'
    | 'payroll.show'
    | 'payroll.approve'
    | 'payroll.pay'
    | 'payroll.payslip'
    | 'payroll.export'
    | 'settings.index'
    | 'settings.update'
    | 'settings.users.store'
    | 'settings.users.update'
    | 'settings.users.destroy'
    | 'settings.roles.store'
    | 'settings.roles.update'
    | 'settings.roles.destroy'
    | 'settings.pending-devices'
    | 'settings.provision-device'
    | 'settings.reject-device'
    | 'settings.devices.approve'
    | 'settings.devices.reject'
    | 'settings.devices.reconsider'
    | 'settings.devices.stats'
    | 'settings.payroll.index'
    | 'settings.payroll.update'
    | 'settings.payroll.tax-brackets.update'
    | 'settings.payroll.preview'
    | 'profile.index';

declare global {
    function route<T = any>(
        name?: AppRouteName,
        params?: any[] | Record<string, any>,
        absolute?: boolean,
        config?: any
    ): string;
}