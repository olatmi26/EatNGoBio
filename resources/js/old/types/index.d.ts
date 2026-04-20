import { Config } from 'ziggy-js';

export interface User {
    id: number;
    name: string;
    email: string;
    department?: string;
    avatar_initials?: string;
    status?: string;
    roles?: string[];
    permissions?: string[];
}

export interface Asset {
    id: string;
    name: string;
    category: string;
    category_id?: number;
    type: string;
    status: 'Active' | 'Maintenance' | 'Retired' | 'Inactive';
    assigned_to?: string;
    department?: string;
    location: string;
    location_id?: number;
    purchase_date?: string;
    warranty_expiry?: string;
    cost?: number;
    officer?: string;
    officer_id?: number;
    serial_no?: string;
    ip_address?: string;
    notes?: string;
}

export interface Ticket {
    id: string;
    title: string;
    description: string;
    priority: 'Critical' | 'High' | 'Medium' | 'Low';
    status: 'Open' | 'In Progress' | 'Pending Approval' | 'Resolved' | 'Closed';
    category: string;
    asset_id?: string;
    asset_name?: string;
    requester: string;
    assigned_to?: string;
    department?: string;
    location?: string;
    created_at: string;
    updated_at: string;
}

export interface Alert {
    id: string;
    type: string;
    title: string;
    message: string;
    asset_id?: string;
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    alert_date?: string;
    status: 'Active' | 'Acknowledged' | 'Resolved';
    officer?: string;
}

export interface MaintenanceSchedule {
    id: string;
    asset_id: string;
    asset_name: string;
    type: string;
    scheduled_date: string;
    time?: string;
    duration?: string;
    officer?: string;
    location?: string;
    status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
    notes?: string;
}

export interface DailyCheck {
    id: string;
    location: string;
    check_date: string;
    officer?: string;
    status: 'Pending' | 'In Progress' | 'Completed';
    items_count: number;
    passed: number;
    failed: number;
    notes?: string;
}

export interface Vendor {
    id: string;
    name: string;
    category: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    contract_start?: string;
    contract_end?: string;
    contract_value?: number;
    status: 'Active' | 'Expired' | 'Pending' | 'Suspended';
    assets_supplied?: number;
    rating?: number;
    notes?: string;
    website?: string;
    tax_id?: string;
    payment_terms?: string;
}

export interface Contract {
    id: string;
    vendor_id: string;
    title: string;
    type: string;
    start_date: string;
    end_date: string;
    value: number;
    status: 'Active' | 'Expired' | 'Pending';
    renewal_alert: boolean;
}

export interface Location {
    id: string;
    name: string;
    type: string;
    manager?: string;
    asset_count?: number;
    city?: string;
}

export interface AssetCategory {
    id: number;
    code: string;
    name: string;
    description?: string;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

export interface PaginatedData<T> {
    data: T[];
    meta: PaginationMeta;
    links: { first: string; last: string; prev: string | null; next: string | null };
}

export type PageProps<T extends Record<string, unknown> = Record<string, unknown>> = T & {
    auth: { user: User };
    ziggy: Config & { location: string };
    flash: { success?: string; error?: string; warning?: string };
};
