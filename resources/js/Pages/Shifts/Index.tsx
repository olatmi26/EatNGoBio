import { useState, useEffect, useRef } from "react";
import { usePage, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import ConfirmDialog from "@/Components/base/ConfirmDialog";
import ShiftModal from "./components/ShiftModal";
import AssignShiftModal from "./components/AssignShiftModal";
import AutoAssignModal from "./components/AutoAssignModal";
import type { PageProps, ShiftAssignmentItem } from "@/types";

type TabKey = "shifts" | "assignments";

interface ShiftItem {
    id: number | string;
    name: string;
    code: string;
    startTime: string;
    endTime: string;
    checkinStartAt?: string;
    checkoutEndsAt?: string;
    workHours: number;
    lateThreshold: number;
    overtimeThreshold: number;
    breaks: ShiftBreak[];
    locations: string[];
    color: string;
    employeeCount: number;
    active: boolean;
    type: "fixed" | "flexible" | "rotating";
}

interface ShiftBreak {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    paid: boolean;
}

interface EmployeeOption {
    id: number;
    employeeId: string;
    firstName: string;
    lastName: string;
    department: string;
    area: string;
}

interface Props extends PageProps {
    shifts: ShiftItem[];
    assignments: ShiftAssignmentItem[];
    areas: string[];
    employees: EmployeeOption[];
}

const ITEMS_PER_PAGE = 10;

export default function ShiftsPage() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const { props } = usePage<Props>();
    const { areas, employees } = props;

    // Initialize state from props
    const [shifts, setShifts] = useState<ShiftItem[]>(props.shifts ?? []);
    const [assignments, setAssignments] = useState<ShiftAssignmentItem[]>(props.assignments ?? []);

    // Tab persistence using URL hash
    const getInitialTab = (): TabKey => {
        const hash = window.location.hash.slice(1);
        return hash === "assignments" ? "assignments" : "shifts";
    };

    const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab());
    const [showShiftModal, setShowShiftModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [autoAssignShift, setAutoAssignShift] = useState<ShiftItem | null>(null);
    const [editShift, setEditShift] = useState<ShiftItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filters - CLIENT SIDE ONLY
    const [search, setSearch] = useState("");
    const [assignmentFilter, setAssignmentFilter] = useState<"all" | "active" | "ended">("active");
    const [locationFilter, setLocationFilter] = useState<string>("");
    const [assignmentPage, setAssignmentPage] = useState(1);

    // Debounced search for performance
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [debouncedSearch, setDebouncedSearch] = useState("");

    const handleSearchChange = (value: string) => {
        setSearch(value);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            setDebouncedSearch(value);
            setAssignmentPage(1);
        }, 200);
    };

    // Add tab change handler
    const handleTabChange = (tab: TabKey) => {
        setActiveTab(tab);
        window.location.hash = tab;
    };

    const unassignedEligibleCount = (shift: ShiftItem): number => {
        const assignedEmployeeIds = new Set(
            assignments
                .filter((a) => a.shiftId === String(shift.id) && (!a.endDate || a.endDate === "null" || a.endDate === ""))
                .map((a) => a.employeeId)
        );
        return employees.filter((e) => shift.locations?.includes(e.area) && !assignedEmployeeIds.has(e.employeeId)).length;
    };

    // Listen for hash changes
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            if (hash === "assignments" || hash === "shifts") setActiveTab(hash);
        };
        window.addEventListener("hashchange", handleHashChange);
        return () => window.removeEventListener("hashchange", handleHashChange);
    }, []);

    // Update state when props change
    useEffect(() => {
        setShifts(props.shifts ?? []);
    }, [props.shifts]);

    useEffect(() => {
        setAssignments(props.assignments ?? []);
    }, [props.assignments]);

    const bg = isDark ? "#111827" : "#f8fafc";
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const rowHover = isDark ? "#374151" : "#f9fafb";

    const filteredShifts = shifts.filter(
        (s) => s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || s.code.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    // Get unique locations from assignments for filter dropdown
    const assignmentLocations = [...new Set(assignments.map((a) => a.location).filter(Boolean))];

    // Filter assignments - CLIENT SIDE
    const filteredAssignments = assignments
        .filter((a) => {
            const searchLower = debouncedSearch.toLowerCase();
            const matchesSearch =
                !debouncedSearch ||
                a.employeeName.toLowerCase().includes(searchLower) ||
                a.shiftName.toLowerCase().includes(searchLower) ||
                (a.department || "").toLowerCase().includes(searchLower) ||
                a.employeeId.toLowerCase().includes(searchLower);

            const hasEndDate = a.endDate && a.endDate !== "" && a.endDate !== "null";
            const matchesStatus = assignmentFilter === "active" ? !hasEndDate : assignmentFilter === "ended" ? hasEndDate : true;
            const matchesLocation = !locationFilter || a.location === locationFilter;

            return matchesSearch && matchesStatus && matchesLocation;
        })
        .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());

    const totalAssignmentPages = Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE);
    const paginatedAssignments = filteredAssignments.slice((assignmentPage - 1) * ITEMS_PER_PAGE, assignmentPage * ITEMS_PER_PAGE);

    // Reset page when filters change
    useEffect(() => {
        setAssignmentPage(1);
    }, [debouncedSearch, assignmentFilter, locationFilter]);

    const openAdd = () => {
        setEditShift(null);
        setShowShiftModal(true);
    };

    const openEdit = (s: ShiftItem) => {
        setEditShift(s);
        setShowShiftModal(true);
    };

    const handleSaveShift = (data: Partial<ShiftItem>) => {
        setIsSubmitting(true);
        const payload = {
            name: data.name,
            code: data.code,
            start_time: data.startTime,
            end_time: data.endTime,
            checkin_start_at: data.checkinStartAt,
            checkout_ends_at: data.checkoutEndsAt,
            work_hours: data.workHours,
            late_threshold: data.lateThreshold,
            overtime_threshold: data.overtimeThreshold,
            breaks: data.breaks,
            locations: data.locations,
            color: data.color,
            type: data.type,
            active: data.active,
        };

        if (editShift) {
            setShifts((prev) => prev.map((s) => (s.id === editShift.id ? { ...s, ...data, breaks: data.breaks || [], locations: data.locations || [] } : s)));
            router.put(`/shifts/${editShift.id}`, payload, {
                preserveScroll: true,
                onSuccess: (page) => {
                    setShowShiftModal(false);
                    showToast("success", "Shift Updated", `${data.name} has been updated`);
                    if (page.props.shifts) setShifts(page.props.shifts);
                },
                onError: (errors) => {
                    setShifts(props.shifts);
                    showToast("error", "Update Failed", Object.values(errors).flat().join(", "));
                },
                onFinish: () => setIsSubmitting(false),
            });
        } else {
            const tempId = `temp-${Date.now()}`;
            const newShift: ShiftItem = {
                id: tempId,
                name: data.name || "",
                code: data.code || "",
                startTime: data.startTime || "08:00",
                endTime: data.endTime || "17:00",
                checkinStartAt: data.checkinStartAt,
                checkoutEndsAt: data.checkoutEndsAt,
                workHours: data.workHours || 8,
                lateThreshold: data.lateThreshold || 15,
                overtimeThreshold: data.overtimeThreshold || 60,
                breaks: data.breaks || [],
                locations: data.locations || [],
                color: data.color || "#16a34a",
                employeeCount: 0,
                active: data.active !== false,
                type: data.type || "fixed",
            };
            setShifts((prev) => [...prev, newShift]);
            router.post("/shifts", payload, {
                preserveScroll: true,
                onSuccess: (page) => {
                    setShowShiftModal(false);
                    showToast("success", "Shift Created", `${data.name} has been created`);
                    if (page.props.shifts) setShifts(page.props.shifts);
                },
                onError: (errors) => {
                    setShifts((prev) => prev.filter((s) => s.id !== tempId));
                    showToast("error", "Creation Failed", Object.values(errors).flat().join(", "));
                },
                onFinish: () => setIsSubmitting(false),
            });
        }
    };

    const handleDeleteShift = (id: string | number) => {
        const deletedShift = shifts.find((s) => s.id === id);
        setShifts((prev) => prev.filter((s) => s.id !== id));
        setDeleteId(null);
        router.delete(`/shifts/${id}`, {
            preserveScroll: true,
            onSuccess: () => showToast("success", "Shift Deleted", `${deletedShift?.name || "Shift"} has been removed`),
            onError: () => {
                if (deletedShift) setShifts((prev) => [...prev, deletedShift]);
                showToast("error", "Delete Failed", "Could not delete shift");
            },
        });
    };

    const handleAssign = (assignment: ShiftAssignmentItem) => {
        setAssignments((prev) => [...prev, assignment]);
        router.post(
            "/shifts/assign",
            {
                employee_id: assignment.employeeId,
                shift_id: assignment.shiftId,
                location: assignment.location,
                effective_date: assignment.effectiveDate,
                end_date: assignment.endDate,
            },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setShowAssignModal(false);
                    showToast("success", "Shift Assigned", `${assignment.employeeName} assigned to ${assignment.shiftName}`);
                    if (page.props.assignments) setAssignments(page.props.assignments);
                    if (page.props.shifts) setShifts(page.props.shifts);
                },
                onError: (errors) => {
                    setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
                    showToast("error", "Assignment Failed", Object.values(errors).flat().join(", "));
                },
            }
        );
    };

    const handleAutoAssignSuccess = (newAssignments: ShiftAssignmentItem[]) => {
        setAutoAssignShift(null);
        showToast("success", "Auto-Assigned", `${newAssignments.length} employee${newAssignments.length !== 1 ? "s" : ""} assigned to ${autoAssignShift?.name}`);
    };

    const removeAssignment = (id: string | number) => {
        setAssignments((prev) => prev.filter((a) => a.id !== id));
        showToast("success", "Assignment Removed", "Shift assignment removed");
    };

    const typeBadge = (type: ShiftItem["type"]) => {
        const map = {
            fixed: { bg: "#dcfce7", color: "#16a34a", label: "Fixed" },
            flexible: { bg: "#fef9c3", color: "#ca8a04", label: "Flexible" },
            rotating: { bg: "#ede9fe", color: "#7c3aed", label: "Rotating" },
        };
        const s = map[type];
        return (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: s.bg, color: s.color }}>
                {s.label}
            </span>
        );
    };

    const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
        const pages: number[] = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        for (let i = start; i <= end; i++) pages.push(i);

        return (
            <div className="flex items-center justify-between mt-4 px-2">
                <div className="text-xs" style={{ color: textSecondary }}>
                    Page {currentPage} of {totalPages} · {filteredAssignments.length} results
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50" style={{ color: textSecondary }}>
                        <i className="ri-arrow-left-double-line text-sm"></i>
                    </button>
                    <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50" style={{ color: textSecondary }}>
                        <i className="ri-arrow-left-s-line text-sm"></i>
                    </button>
                    {pages.map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer"
                            style={{ background: currentPage === page ? "#16a34a" : "transparent", color: currentPage === page ? "#fff" : textSecondary }}
                        >
                            {page}
                        </button>
                    ))}
                    <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50" style={{ color: textSecondary }}>
                        <i className="ri-arrow-right-s-line text-sm"></i>
                    </button>
                    <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-50" style={{ color: textSecondary }}>
                        <i className="ri-arrow-right-double-line text-sm"></i>
                    </button>
                </div>
            </div>
        );
    };

    return (
        <AppLayout title="">
            <div className="p-6" style={{ background: bg, minHeight: "100vh" }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: textPrimary }}>Shift Management</h1>
                        <p className="text-sm mt-0.5" style={{ color: textSecondary }}>Define work schedules, assign shifts, and configure attendance rules</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap" style={{ background: isDark ? "#374151" : "#f3f4f6", color: textPrimary, border: `1px solid ${border}` }}>
                            <i className="ri-user-add-line"></i> Assign Shift
                        </button>
                        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
                            <i className="ri-add-line"></i> Create Shift
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Shifts", value: shifts.length, icon: "ri-time-line", color: "#16a34a" },
                        { label: "Active Shifts", value: shifts.filter((s) => s.active).length, icon: "ri-checkbox-circle-line", color: "#0891b2" },
                        { label: "Assigned Employees", value: assignments.length, icon: "ri-team-line", color: "#7c3aed" },
                        { label: "Locations Covered", value: [...new Set(shifts.flatMap((s) => s.locations))].length, icon: "ri-map-pin-line", color: "#f59e0b" },
                    ].map((s) => (
                        <div key={s.label} className="p-5 rounded-xl flex items-center gap-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${s.color}15` }}>
                                <i className={`${s.icon} text-lg`} style={{ color: s.color }}></i>
                            </div>
                            <div>
                                <p className="text-2xl font-bold" style={{ color: textPrimary }}>{s.value}</p>
                                <p className="text-xs" style={{ color: textSecondary }}>{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs + Filters */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: isDark ? "#374151" : "#f3f4f6" }}>
                        {(["shifts", "assignments"] as TabKey[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap capitalize transition-colors"
                                style={{ background: activeTab === tab ? (isDark ? "#1f2937" : "#ffffff") : "transparent", color: activeTab === tab ? textPrimary : textSecondary }}
                            >
                                {tab === "shifts" ? "Shift Schedules" : "Assignments"}
                                {tab === "assignments" && assignments.length > 0 && (
                                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs" style={{ background: "#dcfce7", color: "#16a34a" }}>{assignments.length}</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeTab === "assignments" && (
                            <>
                                <select value={assignmentFilter} onChange={(e) => setAssignmentFilter(e.target.value as "all" | "active" | "ended")} className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer" style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }}>
                                    <option value="active">Active</option>
                                    <option value="all">All</option>
                                    <option value="ended">Ended</option>
                                </select>
                                <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} className="px-3 py-2 rounded-lg text-sm outline-none cursor-pointer max-w-[150px]" style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }}>
                                    <option value="">All Locations</option>
                                    {assignmentLocations.map((loc) => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </>
                        )}
                        <div className="relative">
                            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: textSecondary }}></i>
                            <input value={search} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-52" style={{ background: cardBg, border: `1px solid ${border}`, color: textPrimary }} />
                        </div>
                    </div>
                </div>

                {/* Shifts Tab */}
                {activeTab === "shifts" && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredShifts.map((shift) => {
                            const eligible = unassignedEligibleCount(shift);
                            return (
                                <div key={shift.id} className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
                                    <div className="h-1.5" style={{ background: shift.color }}></div>
                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-sm font-bold" style={{ color: textPrimary }}>{shift.name}</h3>
                                                    {!shift.active && <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "#f3f4f6", color: "#6b7280" }}>Inactive</span>}
                                                </div>
                                                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: isDark ? "#374151" : "#f3f4f6", color: textSecondary }}>{shift.code}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => openEdit(shift)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: textSecondary }}>
                                                    <i className="ri-edit-line text-sm"></i>
                                                </button>
                                                <button onClick={() => setDeleteId(shift.id)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: "#dc2626" }}>
                                                    <i className="ri-delete-bin-line text-sm"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mb-3 p-3 rounded-xl" style={{ background: isDark ? "#374151" : "#f9fafb" }}>
                                            <div className="text-center"><p className="text-lg font-bold" style={{ color: textPrimary }}>{shift.startTime}</p><p className="text-xs" style={{ color: textSecondary }}>Start</p></div>
                                            <div className="flex-1 flex items-center gap-1"><div className="flex-1 h-0.5 rounded" style={{ background: shift.color }}></div><i className="ri-arrow-right-line text-xs" style={{ color: shift.color }}></i></div>
                                            <div className="text-center"><p className="text-lg font-bold" style={{ color: textPrimary }}>{shift.endTime}</p><p className="text-xs" style={{ color: textSecondary }}>End</p></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className="flex items-center gap-1.5 text-xs" style={{ color: textSecondary }}><i className="ri-alarm-warning-line" style={{ color: "#f59e0b" }}></i>Late after {shift.lateThreshold}min</div>
                                            <div className="flex items-center gap-1.5 text-xs" style={{ color: textSecondary }}><i className="ri-time-line" style={{ color: "#0891b2" }}></i>OT after {shift.overtimeThreshold}min</div>
                                        </div>
                                        <div className="pt-3" style={{ borderTop: `1px solid ${border}` }}>
                                            <div className="flex items-center justify-between mb-2.5">
                                                {typeBadge(shift.type)}
                                                <span className="text-xs" style={{ color: textSecondary }}>{shift.employeeCount} employees</span>
                                            </div>
                                            {shift.locations?.length > 0 && shift.active && (
                                                <button onClick={() => setAutoAssignShift(shift)} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold cursor-pointer"
                                                    style={{ background: eligible > 0 ? `${shift.color}15` : isDark ? "#374151" : "#f3f4f6", color: eligible > 0 ? shift.color : textSecondary }}>
                                                    <i className="ri-flashlight-line"></i>
                                                    {eligible > 0 ? `Auto-Assign ${eligible} Unassigned Employee${eligible !== 1 ? "s" : ""}` : "All eligible employees assigned"}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Assignments Tab */}
                {activeTab === "assignments" && (
                    <div className="rounded-xl overflow-hidden" style={{ background: cardBg, border: `1px solid ${border}` }}>
                        <div className="px-5 py-3.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${border}` }}>
                            <div>
                                <h3 className="text-sm font-semibold" style={{ color: textPrimary }}>Shift Assignments</h3>
                                <p className="text-xs mt-0.5" style={{ color: textSecondary }}>{filteredAssignments.length} assignments</p>
                            </div>
                            <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer" style={{ background: "#dcfce7", color: "#16a34a" }}>+ Assign</button>
                        </div>
                        <table className="w-full">
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${border}` }}>
                                    {["Employee", "Department", "Shift", "Schedule", "Effective", "Ends", "Location", ""].map((h) => (
                                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold" style={{ color: textSecondary }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedAssignments.map((a) => {
                                    const shift = shifts.find((s) => String(s.id) === String(a.shiftId));
                                    return (
                                        <tr key={a.id} style={{ borderBottom: `1px solid ${border}` }}
                                            onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = rowHover; }}
                                            onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}>
                                            <td className="px-4 py-3"><p className="text-sm font-medium" style={{ color: textPrimary }}>{a.employeeName}</p></td>
                                            <td className="px-4 py-3 text-xs" style={{ color: textSecondary }}>{a.department}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ background: shift?.color || "#16a34a" }}></div><span className="text-sm font-medium" style={{ color: textPrimary }}>{a.shiftName}</span></div>
                                            </td>
                                            <td className="px-4 py-3 text-xs font-mono" style={{ color: textSecondary }}>{shift ? `${shift.startTime}–${shift.endTime}` : "-"}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: textSecondary }}>{a.effectiveDate}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: textSecondary }}>{a.endDate || <span style={{ color: "#16a34a" }}>Ongoing</span>}</td>
                                            <td className="px-4 py-3 text-xs" style={{ color: textSecondary }}>{a.location}</td>
                                            <td className="px-4 py-3">
                                                <button onClick={() => removeAssignment(a.id)} className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer" style={{ color: "#dc2626" }}>
                                                    <i className="ri-delete-bin-line text-sm"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredAssignments.length === 0 && (
                                    <tr><td colSpan={8} className="py-12 text-center text-sm" style={{ color: textSecondary }}><i className="ri-calendar-line text-3xl mb-2 block"></i>No shift assignments found</td></tr>
                                )}
                            </tbody>
                        </table>
                        {filteredAssignments.length > ITEMS_PER_PAGE && <Pagination currentPage={assignmentPage} totalPages={totalAssignmentPages} onPageChange={setAssignmentPage} />}
                    </div>
                )}
            </div>

            {/* Modals */}
            <ShiftModal open={showShiftModal} onClose={() => setShowShiftModal(false)} onSave={handleSaveShift} editShift={editShift} areas={areas} />
            <AssignShiftModal open={showAssignModal} onClose={() => setShowAssignModal(false)} onSave={handleAssign} employees={employees} shifts={shifts} />
            <AutoAssignModal open={!!autoAssignShift} onClose={() => setAutoAssignShift(null)} shift={autoAssignShift} allEmployees={employees} onSuccess={handleAutoAssignSuccess} onTabChange={handleTabChange} />
            <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && handleDeleteShift(deleteId)} title="Delete Shift" message="Are you sure?" confirmLabel="Delete" danger />
        </AppLayout>
    );
}