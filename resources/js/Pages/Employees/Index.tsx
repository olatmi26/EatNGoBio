import { useState, useRef, useEffect } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import ConfirmDialog from "@/Components/base/ConfirmDialog";
import EmployeeModal from "./components/EmployeeModal";
import TransferModal from "./components/TransferModal";
import BiometricActionModal from "./components/BiometricActionModal";
import type { PageProps, EmployeeItem } from "@/types";


interface Props extends PageProps {
    employees: {
        data: EmployeeItem[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
            from: number;
            to: number;
        };
        links: any;
    };
    departments: string[];
    areas: string[];
    positions: string[];
    filters: {
        search?: string;
        department?: string;
        area?: string;
        status?: string;
    };
}

type DropdownKey = "import" | "transfer" | "more" | null;
type TransferType =
    | "department"
    | "position"
    | "area"
    | "probation"
    | "resignation";
type BiometricActionType =
    | "resync"
    | "reupload"
    | "delete-template"
    | "export-usb";
type RowActionKey = string | null;

interface Employee extends EmployeeItem {}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function EmployeesPage() {
    const { props } = usePage<Props>();
    const { isDark } = useTheme();
    const { showToast } = useToast();

    // ── Fix: Properly access pagination data ──────────────────────────────────────────
    const employeesData = props.employees || {
        data: [],
        meta: null,
        links: null,
    };
    const paginated = employeesData.data ?? [];
    const meta = employeesData.meta;
    const links = employeesData.links;

    const { departments, positions, areas } = usePage<Props>().props;

    const totalRecords = meta?.total ?? 0;
    const totalPages = meta?.last_page ?? 1;
    const currentPage = meta?.current_page ?? 1;
    const from = meta?.from ?? 0;
    const to = meta?.to ?? 0;
    const perPage = meta?.per_page ?? 15;

    // UI/State hooks
    const [search, setSearch] = useState(props.filters?.search ?? "");
    const [statusFilter, setStatusFilter] = useState(
        props.filters?.status ?? "all",
    );
    const [pageSize, setPageSize] = useState(perPage);
    const [showModal, setShowModal] = useState(false);
    const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
    const [rowAction, setRowAction] = useState<RowActionKey>(null);
    const rowActionRef = useRef<HTMLDivElement | null>(null);

    const [transferType, setTransferType] = useState<TransferType | null>(null);
    const [biometricAction, setBiometricAction] =
        useState<BiometricActionType | null>(null);

    const bg = isDark ? "#111827" : "#f8fafc";
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const dropdownBg = isDark ? "#1f2937" : "#ffffff";

    const canPaginate = totalPages > 1;

    // ── Debounced server fetch ─────────────────────────────────────────────────
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchPage = (
        overrides: {
            page?: number;
            per_page?: number;
            search?: string;
            status?: string;
        } = {},
    ) => {
        const params: Record<string, string | number | undefined> = {
            page: overrides.page ?? currentPage,
            per_page: overrides.per_page ?? pageSize,
            search:
                overrides.search !== undefined
                    ? overrides.search
                    : search || undefined,
            status:
                overrides.status !== undefined
                    ? overrides.status
                    : statusFilter !== "all"
                      ? statusFilter
                      : undefined,
        };
        Object.keys(params).forEach(
            (k) => params[k] === undefined && delete params[k],
        );
        router.visit("/employees", {
            method: "get",
            data: params as Record<string, string | number>,
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onSuccess: () => setSelected([]),
        });
    };

    // Sync pageSize when meta changes
    useEffect(() => {
        if (meta?.per_page && meta.per_page !== pageSize) {
            setPageSize(meta.per_page);
        }
    }, [meta?.per_page]);

    const openAdd = () => {
        setEditEmployee(null);
        setShowModal(true);
    };
    const openEdit = (e: Employee) => {
        setEditEmployee(e);
        setShowModal(true);
    };

    // --- CRUD / local update logic ---
    const handleSave = (data: Partial<EmployeeItem>) => {
        if (editEmployee) {
            router.put(route("employees.update", editEmployee.id), data, {
                onSuccess: () => setShowModal(false),
            });
        } else {
            router.post(route("employees.store"), data, {
                onSuccess: () => setShowModal(false),
            });
        }
        if (editEmployee) {
            setEmployees((prev) =>
                prev.map((e) =>
                    e.id === editEmployee.id ? { ...e, ...data } : e,
                ),
            );
            showToast(
                "success",
                "Employee Updated",
                `${data.firstName} ${data.lastName} updated successfully`,
            );
        } else {
            const newEmp: Employee = {
                id: `e${Date.now()}`,
                employeeId: data.employeeId || "",
                firstName: data.firstName || "",
                lastName: data.lastName || "",
                department: data.department || "",
                position: data.position || "",
                area: data.area || "",
                employmentType: data.employmentType || "Full-Time",
                hiredDate: data.hiredDate || "",
                gender: data.gender || "",
                email: data.email || "",
                mobile: data.mobile || "",
                status: data.status || "active",
            };
            setEmployees((prev) => [...prev, newEmp]);
            showToast(
                "success",
                "Employee Added",
                `${data.firstName} ${data.lastName} registered successfully`,
            );
        }
    };

    const handleDelete = (id: string) => {
        const e = employees.find((x) => x.id === id);
        setEmployees((prev) => prev.filter((x) => x.id !== id));
        showToast(
            "success",
            "Employee Removed",
            `${e?.firstName} ${e?.lastName} removed`,
        );
    };

    const handleStatusChange = (
        id: string,
        newStatus: Employee["status"],
        label: string,
    ) => {
        const e = employees.find((x) => x.id === id);
        setEmployees((prev) =>
            prev.map((x) => (x.id === id ? { ...x, status: newStatus } : x)),
        );
        showToast(
            "success",
            label,
            `${e?.firstName} ${e?.lastName} ${label.toLowerCase()}`,
        );
        setRowAction(null);
    };

    const handleTransferConfirm = (
        type: TransferType,
        value: string,
        _reason: string,
        _effectiveDate: string,
    ) => {
        // Remove 'filtered' usage, fallback to selected
        const targetIds = selected.length > 0 ? selected : [];
        if (type === "department") {
            setEmployees((prev) =>
                prev.map((e) =>
                    targetIds.includes(e.id) ? { ...e, department: value } : e,
                ),
            );
            showToast(
                "success",
                "Department Transfer",
                `${targetIds.length} employee(s) transferred to ${value}`,
            );
        } else if (type === "position") {
            setEmployees((prev) =>
                prev.map((e) =>
                    targetIds.includes(e.id) ? { ...e, position: value } : e,
                ),
            );
            showToast(
                "success",
                "Position Transfer",
                `${targetIds.length} employee(s) moved to ${value}`,
            );
        } else if (type === "area") {
            setEmployees((prev) =>
                prev.map((e) =>
                    targetIds.includes(e.id) ? { ...e, area: value } : e,
                ),
            );
            showToast(
                "success",
                "Area Transfer",
                `${targetIds.length} employee(s) transferred to ${value}`,
            );
        } else if (type === "probation") {
            setEmployees((prev) =>
                prev.map((e) =>
                    targetIds.includes(e.id) ? { ...e, status: "active" } : e,
                ),
            );
            showToast(
                "success",
                "Probation Passed",
                `${targetIds.length} employee(s) confirmed as active`,
            );
        } else if (type === "resignation") {
            setEmployees((prev) =>
                prev.map((e) =>
                    targetIds.includes(e.id) ? { ...e, status: "resigned" } : e,
                ),
            );
            showToast(
                "success",
                "Resignation Processed",
                `${targetIds.length} employee(s) marked as resigned`,
            );
        }
        setSelected([]);
    };

    const handleBiometricAction = (type: BiometricActionType) => {
        const count = selected.length > 0 ? selected.length : employees.length;
        const labels: Record<BiometricActionType, string> = {
            resync: "Resynchronized",
            reupload: "Re-uploaded",
            "delete-template": "Biometric templates deleted for",
            "export-usb": "Exported to USB for",
        };
        showToast(
            "success",
            "Action Complete",
            `${labels[type]} ${count} employee(s)`,
        );
        setSelected([]);
    };

    const toggleSelect = (id: string) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    const toggleAll = () =>
        setSelected((prev) =>
            prev.length === paginated.length
                ? []
                : paginated.map((e) => String(e.id)),
        );

    const statusBadge = (status: Employee["status"]) => {
        const map: Record<
            string,
            { bg: string; color: string; label: string }
        > = {
            active: { bg: "#dcfce7", color: "#16a34a", label: "Active" },
            resigned: { bg: "#fee2e2", color: "#dc2626", label: "Resigned" },
            probation: { bg: "#fef9c3", color: "#ca8a04", label: "Probation" },
            suspended: { bg: "#fef3c7", color: "#d97706", label: "Suspended" },
            disabled: { bg: "#f3f4f6", color: "#6b7280", label: "Disabled" },
        };
        const s = map[status] || map.active;
        return (
            <span
                className="px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
                style={{ background: s.bg, color: s.color }}
            >
                {s.label}
            </span>
        );
    };

    const getInitials = (e: Employee) =>
        `${e.firstName?.[0] || ""}${e.lastName?.[0] || ""}`.toUpperCase();
    const avatarColors = [
        "#16a34a",
        "#0891b2",
        "#7c3aed",
        "#d97706",
        "#dc2626",
        "#db2777",
    ];
    const getAvatarColor = (id: string | number) => {
        const sid = String(id);
        const code = sid.length > 0 ? sid.charCodeAt(0) : 0;
        return avatarColors[code % avatarColors.length];
    };

    const DropdownMenu = ({
        items,
    }: {
        items: { label: string; action: () => void; danger?: boolean }[];
    }) => (
        <div
            className="absolute top-full left-0 mt-1 z-20 rounded-xl py-1 min-w-[200px]"
            style={{
                background: dropdownBg,
                border: `1px solid ${border}`,
                boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            }}
        >
            {items.map((item) => (
                <button
                    key={item.label}
                    onClick={() => {
                        item.action();
                        setOpenDropdown(null);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm cursor-pointer transition-colors whitespace-nowrap"
                    style={{ color: item.danger ? "#dc2626" : textPrimary }}
                    onMouseEnter={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = item.danger
                            ? "#fef2f2"
                            : isDark
                              ? "#374151"
                              : "#f9fafb";
                    }}
                    onMouseLeave={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                    }}
                >
                    {item.label}
                </button>
            ))}
        </div>
    );

    const RowActionMenu = ({ emp }: { emp: Employee }) => (
        <div
            className="absolute right-0 top-full mt-1 z-30 rounded-xl py-1 min-w-[180px]"
            style={{
                background: dropdownBg,
                border: `1px solid ${border}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            }}
        >
            <button
                onClick={() => router.visit(`/employees/${emp.id}`)}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap"
                style={{ color: textPrimary }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                        isDark ? "#374151" : "#f9fafb";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                }}
            >
                <i
                    className="ri-eye-line text-sm"
                    style={{ color: "#0891b2" }}
                ></i>{" "}
                View Profile
            </button>
            <button
                onClick={() => {
                    openEdit(emp);
                    setRowAction(null);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap"
                style={{ color: textPrimary }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                        isDark ? "#374151" : "#f9fafb";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                }}
            >
                <i
                    className="ri-edit-line text-sm"
                    style={{ color: "#16a34a" }}
                ></i>{" "}
                Edit
            </button>
            <div
                style={{ height: "1px", background: border, margin: "4px 0" }}
            ></div>
            {emp.status !== "suspended" && (
                <button
                    onClick={() =>
                        handleStatusChange(
                            emp.id,
                            "suspended" as Employee["status"],
                            "Suspended",
                        )
                    }
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap"
                    style={{ color: "#d97706" }}
                    onMouseEnter={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = "#fef3c7";
                    }}
                    onMouseLeave={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                    }}
                >
                    <i className="ri-pause-circle-line text-sm"></i> Suspend
                </button>
            )}
            {emp.status === "suspended" && (
                <button
                    onClick={() =>
                        handleStatusChange(emp.id, "active", "Reactivated")
                    }
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap"
                    style={{ color: "#16a34a" }}
                    onMouseEnter={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = "#dcfce7";
                    }}
                    onMouseLeave={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                    }}
                >
                    <i className="ri-play-circle-line text-sm"></i> Reactivate
                </button>
            )}
            {emp.status !== "resigned" && (
                <button
                    onClick={() =>
                        handleStatusChange(
                            emp.id,
                            "resigned",
                            "Marked as Resigned",
                        )
                    }
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap"
                    style={{ color: "#dc2626" }}
                    onMouseEnter={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = "#fef2f2";
                    }}
                    onMouseLeave={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                    }}
                >
                    <i className="ri-logout-box-line text-sm"></i> Mark as
                    Resigned
                </button>
            )}
            {emp.status !== "disabled" && (
                <button
                    onClick={() =>
                        handleStatusChange(
                            emp.id,
                            "disabled" as Employee["status"],
                            "Disabled",
                        )
                    }
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap"
                    style={{ color: "#6b7280" }}
                    onMouseEnter={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = isDark ? "#374151" : "#f3f4f6";
                    }}
                    onMouseLeave={(e) => {
                        (
                            e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                    }}
                >
                    <i className="ri-forbid-line text-sm"></i> Disable Account
                </button>
            )}
            <div
                style={{ height: "1px", background: border, margin: "4px 0" }}
            ></div>
            <button
                onClick={() => {
                    setDeleteId(emp.id);
                    setRowAction(null);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm cursor-pointer whitespace-nowrap"
                style={{ color: "#dc2626" }}
                onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                        "#fef2f2";
                }}
                onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                        "transparent";
                }}
            >
                <i className="ri-delete-bin-line text-sm"></i> Delete
            </button>
        </div>
    );

    const handlePageChange = (newPage: number) => {
        const clamped = Math.max(1, Math.min(newPage, totalPages));
        fetchPage({ page: clamped });
    };

    const getPageNumbers = () => {
        const pages: (number | "...")[] = [];
        const p = currentPage;
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (p > 3) pages.push("...");
            for (
                let i = Math.max(2, p - 1);
                i <= Math.min(totalPages - 1, p + 1);
                i++
            )
                pages.push(i);
            if (p < totalPages - 2) pages.push("...");
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <AppLayout title="">
            <div
                className="p-4 md:p-6"
                style={{ background: bg, minHeight: "100vh" }}
                onClick={() => {
                    setOpenDropdown(null);
                    setRowAction(null);
                }}
            >
                {/* Header - Fix: Show actual count instead of 0 */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h1
                            className="text-xl md:text-2xl font-bold"
                            style={{ color: textPrimary }}
                        >
                            Employees
                        </h1>
                        <p
                            className="text-sm mt-0.5"
                            style={{ color: textSecondary }}
                        >
                            {totalRecords}{" "}
                            {totalRecords === 1 ? "employee" : "employees"} ·
                            Manage personnel records
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap transition-colors"
                        style={{
                            background:
                                "linear-gradient(135deg, #16a34a, #15803d)",
                            color: "#fff",
                        }}
                    >
                        <i className="ri-add-line"></i>{" "}
                        <span className="hidden sm:inline">Add Employee</span>
                        <span className="sm:hidden">Add</span>
                    </button>

                    {selected.length > 0 && (
                        <button
                            onClick={() => {
                                selected.forEach((id) => handleDelete(id));
                                setSelected([]);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap"
                            style={{
                                background: "#fef2f2",
                                color: "#dc2626",
                                border: "1px solid #fecaca",
                            }}
                        >
                            <i className="ri-delete-bin-line"></i> Delete (
                            {selected.length})
                        </button>
                    )}

                    {selected.length > 0 && (
                        <button
                            onClick={() => {
                                router.post("/employees/bulk-sync", {
                                    employee_ids: selected,
                                });
                                showToast(
                                    "success",
                                    "Bulk Sync",
                                    `Syncing ${selected.length} employee(s) to devices`,
                                );
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium cursor-pointer"
                            style={{ background: "#0891b2", color: "#fff" }}
                        >
                            <i className="ri-user-shared-line"></i> Sync
                            Selected ({selected.length})
                        </button>
                    )}

                    {/* Import dropdown */}
                    <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "import" ? null : "import",
                                )
                            }
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap"
                            style={{
                                background: isDark ? "#374151" : "#f3f4f6",
                                color: textPrimary,
                                border: `1px solid ${border}`,
                            }}
                        >
                            Import{" "}
                            <i className="ri-arrow-down-s-line text-xs"></i>
                        </button>
                        {openDropdown === "import" && (
                            <DropdownMenu
                                items={[
                                    {
                                        label: "Import Employee",
                                        action: () =>
                                            showToast(
                                                "info",
                                                "Import Employee",
                                                "Select a CSV/Excel file to import",
                                            ),
                                    },
                                    {
                                        label: "Import Document",
                                        action: () =>
                                            showToast(
                                                "info",
                                                "Import Document",
                                                "Upload employee documents",
                                            ),
                                    },
                                    {
                                        label: "Import Photo",
                                        action: () =>
                                            showToast(
                                                "info",
                                                "Import Photo",
                                                "Upload employee photos",
                                            ),
                                    },
                                    {
                                        label: "Import USB Employee",
                                        action: () =>
                                            showToast(
                                                "info",
                                                "Import USB",
                                                "Connect USB device to import",
                                            ),
                                    },
                                ]}
                            />
                        )}
                    </div>

                    {/* Personnel Transfer dropdown */}
                    <div
                        className="relative hidden md:block"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "transfer"
                                        ? null
                                        : "transfer",
                                )
                            }
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap"
                            style={{
                                background: isDark ? "#374151" : "#f3f4f6",
                                color: textPrimary,
                                border: `1px solid ${border}`,
                            }}
                        >
                            Transfer{" "}
                            <i className="ri-arrow-down-s-line text-xs"></i>
                        </button>
                        {openDropdown === "transfer" && (
                            <DropdownMenu
                                items={[
                                    {
                                        label: "Department Transfer",
                                        action: () =>
                                            setTransferType("department"),
                                    },
                                    {
                                        label: "Position Transfer",
                                        action: () =>
                                            setTransferType("position"),
                                    },
                                    {
                                        label: "Area Transfer",
                                        action: () => setTransferType("area"),
                                    },
                                    {
                                        label: "Pass Probation",
                                        action: () =>
                                            setTransferType("probation"),
                                    },
                                    {
                                        label: "Resignation",
                                        action: () =>
                                            setTransferType("resignation"),
                                        danger: true,
                                    },
                                ]}
                            />
                        )}
                    </div>

                    {/* More dropdown */}
                    <div
                        className="relative hidden md:block"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() =>
                                setOpenDropdown(
                                    openDropdown === "more" ? null : "more",
                                )
                            }
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium cursor-pointer whitespace-nowrap"
                            style={{
                                background: isDark ? "#374151" : "#f3f4f6",
                                color: textPrimary,
                                border: `1px solid ${border}`,
                            }}
                        >
                            More{" "}
                            <i className="ri-arrow-down-s-line text-xs"></i>
                        </button>
                        {openDropdown === "more" && (
                            <DropdownMenu
                                items={[
                                    {
                                        label: "Resynchronize to Device",
                                        action: () =>
                                            setBiometricAction("resync"),
                                    },
                                    {
                                        label: "Re-upload from Device",
                                        action: () =>
                                            setBiometricAction("reupload"),
                                    },
                                    {
                                        label: "Delete Biometric Template",
                                        action: () =>
                                            setBiometricAction(
                                                "delete-template",
                                            ),
                                        danger: true,
                                    },
                                    {
                                        label: "Export USB Employee",
                                        action: () =>
                                            setBiometricAction("export-usb"),
                                    },
                                ]}
                            />
                        )}
                    </div>

                    <div className="flex-1"></div>

                    {/* Status filter - scrollable on mobile */}
                    <div
                        className="flex items-center gap-1 p-1 rounded-xl overflow-x-auto"
                        style={{ background: isDark ? "#374151" : "#f3f4f6" }}
                    >
                        {["all", "active", "probation", "resigned"].map((s) => (
                            <button
                                key={s}
                                onClick={() => {
                                    setStatusFilter(s);
                                    fetchPage({ page: 1, status: s });
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap capitalize transition-colors"
                                style={{
                                    background:
                                        statusFilter === s
                                            ? isDark
                                                ? "#1f2937"
                                                : "#ffffff"
                                            : "transparent",
                                    color:
                                        statusFilter === s
                                            ? textPrimary
                                            : textSecondary,
                                }}
                            >
                                {s === "all"
                                    ? `All (${totalRecords})`
                                    : s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <i
                            className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                            style={{ color: textSecondary }}
                        ></i>
                        <input
                            value={search}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearch(val);
                                if (searchTimerRef.current)
                                    clearTimeout(searchTimerRef.current);
                                searchTimerRef.current = setTimeout(
                                    () => fetchPage({ page: 1, search: val }),
                                    400,
                                );
                            }}
                            placeholder="Search..."
                            className="pl-9 pr-4 py-2 rounded-xl text-sm outline-none w-36 md:w-56"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        />
                    </div>
                </div>

                {/* Table - scrollable on mobile */}
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        background: cardBg,
                        border: `1px solid ${border}`,
                    }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px]">
                            <thead>
                                <tr
                                    style={{
                                        borderBottom: `1px solid ${border}`,
                                    }}
                                >
                                    <th className="px-4 py-3 w-10">
                                        <input
                                            type="checkbox"
                                            checked={
                                                selected.length ===
                                                    paginated.length &&
                                                paginated.length > 0
                                            }
                                            onChange={toggleAll}
                                            className="cursor-pointer"
                                        />
                                    </th>
                                    {[
                                        "Employee ID",
                                        "Name",
                                        "Department",
                                        "Position",
                                        "Area",
                                        "Type",
                                        "Status",
                                        "Actions",
                                    ].map((h) => (
                                        <th
                                            key={h}
                                            className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap"
                                            style={{ color: textSecondary }}
                                        >
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((e) => (
                                    <tr
                                        key={e.id}
                                        style={{
                                            borderBottom: `1px solid ${border}`,
                                        }}
                                        onMouseEnter={(el) => {
                                            (
                                                el.currentTarget as HTMLTableRowElement
                                            ).style.background = isDark
                                                ? "#374151"
                                                : "#f9fafb";
                                        }}
                                        onMouseLeave={(el) => {
                                            (
                                                el.currentTarget as HTMLTableRowElement
                                            ).style.background = "transparent";
                                        }}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(
                                                    String(e.id),
                                                )}
                                                onChange={() =>
                                                    toggleSelect(String(e.id))
                                                }
                                                className="cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() =>
                                                    router.visit(
                                                        `/employees/${e.id}`,
                                                    )
                                                }
                                                className="text-sm font-medium cursor-pointer hover:underline whitespace-nowrap"
                                                style={{ color: "#16a34a" }}
                                            >
                                                {e.employeeId}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                    style={{
                                                        background:
                                                            getAvatarColor(
                                                                e.id,
                                                            ),
                                                    }}
                                                >
                                                    {getInitials(e)}
                                                </div>
                                                <div>
                                                    <p
                                                        className="text-sm font-medium whitespace-nowrap"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {e.firstName}{" "}
                                                        {e.lastName}
                                                    </p>
                                                    <p
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {e.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm whitespace-nowrap"
                                            style={{ color: textPrimary }}
                                        >
                                            {e.department}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm whitespace-nowrap"
                                            style={{ color: textSecondary }}
                                        >
                                            {e.position}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm whitespace-nowrap"
                                            style={{ color: textSecondary }}
                                        >
                                            {e.area}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm whitespace-nowrap"
                                            style={{ color: textSecondary }}
                                        >
                                            {e.employmentType}
                                        </td>
                                        <td className="px-4 py-3">
                                            {statusBadge(e.status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        router.visit(
                                                            `/employees/${e.id}`,
                                                        )
                                                    }
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                                                    style={{ color: "#0891b2" }}
                                                    title="View Profile"
                                                    onMouseEnter={(el) => {
                                                        (
                                                            el.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            "#e0f2fe";
                                                    }}
                                                    onMouseLeave={(el) => {
                                                        (
                                                            el.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            "transparent";
                                                    }}
                                                >
                                                    <i className="ri-eye-line text-sm"></i>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        openEdit(e as Employee)
                                                    }
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                                                    style={{ color: "#16a34a" }}
                                                    title="Edit Employee"
                                                    onMouseEnter={(el) => {
                                                        (
                                                            el.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            "#dcfce7";
                                                    }}
                                                    onMouseLeave={(el) => {
                                                        (
                                                            el.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            "transparent";
                                                    }}
                                                >
                                                    <i className="ri-edit-line text-sm"></i>
                                                </button>
                                                <div
                                                    className="relative"
                                                    onClick={(ev) =>
                                                        ev.stopPropagation()
                                                    }
                                                    ref={
                                                        rowAction ===
                                                        String(e.id)
                                                            ? rowActionRef
                                                            : null
                                                    }
                                                >
                                                    <button
                                                        onClick={() =>
                                                            setRowAction(
                                                                rowAction ===
                                                                    String(e.id)
                                                                    ? null
                                                                    : String(
                                                                          e.id,
                                                                      ),
                                                            )
                                                        }
                                                        className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                        title="More Actions"
                                                        onMouseEnter={(el) => {
                                                            (
                                                                el.currentTarget as HTMLButtonElement
                                                            ).style.background =
                                                                isDark
                                                                    ? "#4b5563"
                                                                    : "#f3f4f6";
                                                        }}
                                                        onMouseLeave={(el) => {
                                                            (
                                                                el.currentTarget as HTMLButtonElement
                                                            ).style.background =
                                                                "transparent";
                                                        }}
                                                    >
                                                        <i className="ri-more-2-line text-sm"></i>
                                                    </button>
                                                    {rowAction ===
                                                        String(e.id) && (
                                                        <RowActionMenu
                                                            emp={e as Employee}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {paginated.length === 0 && (
                        <div
                            className="py-16 text-center"
                            style={{ color: textSecondary }}
                        >
                            <i className="ri-team-line text-4xl mb-3 block"></i>
                            <p className="text-sm">No employees found</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-xs" style={{ color: textSecondary }}>
                            Showing {from}–{to} of {totalRecords}
                            {selected.length > 0 && (
                                <span
                                    className="ml-2 font-medium"
                                    style={{ color: "#16a34a" }}
                                >
                                    · {selected.length} selected
                                </span>
                            )}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <span
                                className="text-xs"
                                style={{ color: textSecondary }}
                            >
                                Per page:
                            </span>
                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    const s = Number(e.target.value);
                                    setPageSize(s);
                                    fetchPage({ page: 1, per_page: s });
                                }}
                                className="px-2 py-1 rounded-lg text-xs outline-none cursor-pointer"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${border}`,
                                    color: textPrimary,
                                }}
                            >
                                {PAGE_SIZE_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Pagination buttons - Only show if there are pages */}
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() =>
                                    handlePageChange(currentPage - 1)
                                }
                                disabled={currentPage === 1}
                                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    background: isDark ? "#374151" : "#f3f4f6",
                                    color: textPrimary,
                                }}
                            >
                                <i className="ri-arrow-left-s-line text-sm"></i>
                            </button>
                            {getPageNumbers().map((p, i) =>
                                p === "..." ? (
                                    <span
                                        key={`ellipsis-${i}`}
                                        className="w-8 h-8 flex items-center justify-center text-xs"
                                        style={{ color: textSecondary }}
                                    >
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={p}
                                        onClick={() =>
                                            handlePageChange(p as number)
                                        }
                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium cursor-pointer transition-colors"
                                        style={{
                                            background:
                                                currentPage === p
                                                    ? "#16a34a"
                                                    : isDark
                                                      ? "#374151"
                                                      : "#f3f4f6",
                                            color:
                                                currentPage === p
                                                    ? "#ffffff"
                                                    : textPrimary,
                                        }}
                                    >
                                        {p}
                                    </button>
                                ),
                            )}
                            <button
                                onClick={() =>
                                    handlePageChange(currentPage + 1)
                                }
                                disabled={currentPage === totalPages}
                                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                style={{
                                    background: isDark ? "#374151" : "#f3f4f6",
                                    color: textPrimary,
                                }}
                            >
                                <i className="ri-arrow-right-s-line text-sm"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <EmployeeModal
                open={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                editEmployee={editEmployee}
                departments={departments as string[]}
                positions={positions as string[]}
                areas={areas as string[]}
            />
            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && handleDelete(deleteId)}
                title="Remove Employee"
                message="Are you sure you want to remove this employee? This action cannot be undone."
                confirmLabel="Remove"
                danger
            />
            {transferType && (
                <TransferModal
                    open={!!transferType}
                    onClose={() => setTransferType(null)}
                    type={transferType}
                    employees={employees}
                    selectedIds={selected}
                    onConfirm={handleTransferConfirm}
                />
            )}
            {biometricAction && (
                <BiometricActionModal
                    open={!!biometricAction}
                    onClose={() => setBiometricAction(null)}
                    type={biometricAction}
                    employees={employees}
                    selectedIds={selected}
                    onConfirm={handleBiometricAction}
                />
            )}
        </AppLayout>
    );
}