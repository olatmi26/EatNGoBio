import { useState, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";

interface DeviceEmployee {
    id: number;
    name: string;
    sn: string;
    area: string;
    status: string;
    is_online: boolean;
    employeeCount: number;
    fpCount: number;
    faceCount: number;
}

interface EmployeeOption {
    id: number;
    employeeId: string;
    name: string;
    department: string;
    area: string;
    status: string;
    hasBiometric: boolean;
}

const ITEMS_PER_PAGE = 10;

export default function EmployeeManager({
    initialDeviceId,
    onClose,
}: {
    initialDeviceId?: number | null;
    onClose?: () => void;
}) {
    const { isDark } = useTheme();
    const { showToast } = useToast();

    const [devices, setDevices] = useState<DeviceEmployee[]>([]);
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [selectedDevice, setSelectedDevice] = useState<number | null>(
        initialDeviceId ?? null,
    );
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [deviceSearchTerm, setDeviceSearchTerm] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const [devicePage, setDevicePage] = useState(1);
    const [employeePage, setEmployeePage] = useState(1);

    // ── Fetch data from API ──────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/devices/employee-manager/data", {
                headers: {
                    Accept: "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                },
            });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setDevices(Array.isArray(data.devices) ? data.devices : []);
            setEmployees(Array.isArray(data.employees) ? data.employees : []);

            // Auto-select the initial device if provided
            if (initialDeviceId) {
                setSelectedDevice(initialDeviceId);
            } else if (data.devices?.length > 0) {
                setSelectedDevice(data.devices[0].id);
            }
        } catch (e) {
            showToast(
                "error",
                "Load Failed",
                "Could not load devices/employees",
            );
        } finally {
            setIsLoading(false);
        }
    }, [initialDeviceId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ── Derived state ────────────────────────────────────────────────────────
    const filteredDevices = devices.filter((device) => {
        const s = deviceSearchTerm.toLowerCase();
        return (
            device.name.toLowerCase().includes(s) ||
            device.sn.toLowerCase().includes(s) ||
            device.area.toLowerCase().includes(s)
        );
    });

    const paginatedDevices = filteredDevices.slice(
        (devicePage - 1) * ITEMS_PER_PAGE,
        devicePage * ITEMS_PER_PAGE,
    );
    const deviceTotalPages = Math.max(
        1,
        Math.ceil(filteredDevices.length / ITEMS_PER_PAGE),
    );

    const selectedDeviceData = devices.find((d) => d.id === selectedDevice);
    const deviceArea = selectedDeviceData?.area;

    const filteredEmployees = employees.filter((emp) => {
        if (!deviceArea) return false;
        if (emp.area !== deviceArea) return false;
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
            emp.name.toLowerCase().includes(s) ||
            emp.employeeId.toLowerCase().includes(s) ||
            emp.department.toLowerCase().includes(s)
        );
    });

    const paginatedEmployees = filteredEmployees.slice(
        (employeePage - 1) * ITEMS_PER_PAGE,
        employeePage * ITEMS_PER_PAGE,
    );
    const employeeTotalPages = Math.max(
        1,
        Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE),
    );

    // ── Sync handlers ────────────────────────────────────────────────────────
    const handleSyncToDevice = async () => {
        if (!selectedDevice || selectedEmployees.length === 0) return;
        setIsSyncing(true);
        try {
            const res = await fetch("/devices/sync-to-device", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    device_id: selectedDevice,
                    employee_ids: selectedEmployees,
                }),
            });

            const data = await res.json();
            if (data.success) {
                showToast("success", "Sync Complete", data.message);
                setSelectedEmployees([]);
                // Refresh data to update counts
                setTimeout(() => fetchData(), 1000);
            } else {
                showToast(
                    "error",
                    "Sync Failed",
                    data.message || "Unknown error occurred",
                );
            }
        } catch (error) {
            console.error("Sync error:", error);
            showToast("error", "Sync Failed", "Network error occurred");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSyncFromDevice = async (deviceId: number) => {
        try {
            const res = await fetch(`/devices/${deviceId}/sync-from-device`, {
                method: "POST",
                headers: {
                    "X-CSRF-TOKEN":
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute("content") || "",
                },
            });
            const data = await res.json();
            if (data.success) {
                showToast("success", "Command Sent", data.message);
            } else {
                showToast("error", "Command Failed", data.message);
            }
        } catch {
            showToast("error", "Command Failed", "Network error occurred");
        }
    };

    const toggleEmployee = (id: number) =>
        setSelectedEmployees((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    const toggleAll = () => {
        const ids = paginatedEmployees.map((e) => e.id);
        const allSelected =
            ids.length > 0 && ids.every((id) => selectedEmployees.includes(id));
        if (allSelected) {
            setSelectedEmployees(
                selectedEmployees.filter((id) => !ids.includes(id)),
            );
        } else {
            setSelectedEmployees([...new Set([...selectedEmployees, ...ids])]);
        }
    };

    useEffect(() => {
        setEmployeePage(1);
        setSelectedEmployees([]);
        setSearchTerm("");
    }, [selectedDevice]);

    // ── Theme ────────────────────────────────────────────────────────────────
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";

    // ── Loading skeleton ─────────────────────────────────────────────────────
    if (isLoading) {
        const bg = isDark ? "#374151" : "#e5e7eb";
        return (
            <div className="p-4 space-y-3 animate-pulse">
                <div className="grid grid-cols-4 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="h-16 rounded-xl"
                            style={{ background: bg }}
                        />
                    ))}
                </div>
                <div className="grid grid-cols-12 gap-4">
                    <div
                        className="col-span-3 h-96 rounded-xl"
                        style={{ background: bg }}
                    />
                    <div
                        className="col-span-9 h-96 rounded-xl"
                        style={{ background: bg }}
                    />
                </div>
            </div>
        );
    }

    if (!devices.length) {
        return (
            <div className="p-8 text-center" style={{ color: textSecondary }}>
                <i className="ri-device-line text-4xl mb-3 block"></i>
                <p>No devices available</p>
                <button
                    onClick={fetchData}
                    className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style={{ background: "#16a34a" }}
                >
                    Retry
                </button>
            </div>
        );
    }

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* ── Devices Panel ── */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div
                        className="rounded-xl overflow-hidden"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                        }}
                    >
                        <div
                            className="p-3"
                            style={{ borderBottom: `1px solid ${border}` }}
                        >
                            <div className="relative">
                                <i
                                    className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                                    style={{ color: textSecondary }}
                                ></i>
                                <input
                                    type="text"
                                    placeholder="Search devices..."
                                    value={deviceSearchTerm}
                                    onChange={(e) =>
                                        setDeviceSearchTerm(e.target.value)
                                    }
                                    className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
                                    style={{
                                        background: isDark
                                            ? "#374151"
                                            : "#f9fafb",
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                />
                            </div>
                            <p
                                className="text-xs mt-2"
                                style={{ color: textSecondary }}
                            >
                                {filteredDevices.length} devices
                            </p>
                        </div>

                        <div className="max-h-[500px] overflow-y-auto">
                            {paginatedDevices.length === 0 ? (
                                <div className="py-8 text-center">
                                    <i
                                        className="ri-device-line text-3xl mb-2 block"
                                        style={{ color: textSecondary }}
                                    ></i>
                                    <p
                                        className="text-sm"
                                        style={{ color: textSecondary }}
                                    >
                                        No devices found
                                    </p>
                                </div>
                            ) : (
                                <div
                                    className="divide-y"
                                    style={{ borderColor: border }}
                                >
                                    {paginatedDevices.map((device) => (
                                        <button
                                            key={device.id}
                                            onClick={() =>
                                                setSelectedDevice(device.id)
                                            }
                                            className="w-full text-left p-3 transition-all cursor-pointer"
                                            style={{
                                                background:
                                                    selectedDevice === device.id
                                                        ? isDark
                                                            ? "#374151"
                                                            : "#f0fdf4"
                                                        : "transparent",
                                                borderLeft:
                                                    selectedDevice === device.id
                                                        ? "3px solid #16a34a"
                                                        : "3px solid transparent",
                                            }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p
                                                        className="font-medium text-sm truncate"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {device.name}
                                                    </p>
                                                    <p
                                                        className="text-xs font-mono mt-0.5"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {device.sn}
                                                    </p>
                                                    <p
                                                        className="text-xs mt-1"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {device.area}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 ml-2">
                                                    <span
                                                        className={`w-2 h-2 rounded-full ${device.is_online ? "bg-green-500 animate-pulse" : "bg-red-500"}`}
                                                    ></span>
                                                    <span
                                                        className="text-xs px-1.5 py-0.5 rounded-full"
                                                        style={{
                                                            background:
                                                                "#dcfce7",
                                                            color: "#16a34a",
                                                        }}
                                                    >
                                                        {device.employeeCount}
                                                    </span>
                                                </div>
                                            </div>
                                            <div
                                                className="flex items-center gap-3 text-xs mt-2"
                                                style={{ color: textSecondary }}
                                            >
                                                <span>👆 {device.fpCount}</span>
                                                <span>
                                                    😊 {device.faceCount}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSyncFromDevice(
                                                        device.id,
                                                    );
                                                }}
                                                className="mt-2 w-full text-xs flex items-center justify-center gap-1 px-2 py-1 rounded"
                                                style={{
                                                    background: "#0891b2",
                                                    color: "#fff",
                                                }}
                                            >
                                                <i className="ri-download-cloud-line"></i>{" "}
                                                Pull Data
                                            </button>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {deviceTotalPages > 1 && (
                            <div
                                className="p-2 flex items-center justify-center gap-1 border-t"
                                style={{ borderColor: border }}
                            >
                                <button
                                    onClick={() =>
                                        setDevicePage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={devicePage === 1}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-50"
                                >
                                    ←
                                </button>
                                <span className="text-xs px-2">
                                    {devicePage} / {deviceTotalPages}
                                </span>
                                <button
                                    onClick={() =>
                                        setDevicePage((p) =>
                                            Math.min(deviceTotalPages, p + 1),
                                        )
                                    }
                                    disabled={devicePage === deviceTotalPages}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-50"
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Employees Panel ── */}
                <div className="lg:col-span-8 xl:col-span-9">
                    <div
                        className="rounded-xl overflow-hidden"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                        }}
                    >
                        <div
                            className="p-3"
                            style={{ borderBottom: `1px solid ${border}` }}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h3
                                        className="font-semibold text-sm"
                                        style={{ color: textPrimary }}
                                    >
                                        {selectedDevice
                                            ? `Employees for ${selectedDeviceData?.name}`
                                            : "Select a device"}
                                    </h3>
                                    {selectedDevice && (
                                        <p
                                            className="text-xs mt-0.5"
                                            style={{ color: textSecondary }}
                                        >
                                            {selectedEmployees.length} of{" "}
                                            {filteredEmployees.length} selected
                                            {deviceArea && (
                                                <span>
                                                    {" "}
                                                    · Area:{" "}
                                                    <strong>
                                                        {deviceArea}
                                                    </strong>
                                                </span>
                                            )}
                                        </p>
                                    )}
                                </div>
                                {selectedDevice &&
                                    selectedEmployees.length > 0 && (
                                        <button
                                            onClick={handleSyncToDevice}
                                            disabled={isSyncing}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                                            style={{ background: "#16a34a" }}
                                        >
                                            {isSyncing ? (
                                                <>
                                                    <i className="ri-loader-4-line animate-spin"></i>{" "}
                                                    Syncing
                                                </>
                                            ) : (
                                                <>
                                                    <i className="ri-user-shared-line"></i>{" "}
                                                    Sync (
                                                    {selectedEmployees.length})
                                                </>
                                            )}
                                        </button>
                                    )}
                            </div>

                            {selectedDevice && (
                                <>
                                    <div className="relative mt-3">
                                        <i
                                            className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                                            style={{ color: textSecondary }}
                                        ></i>
                                        <input
                                            type="text"
                                            placeholder="Search employees..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(e.target.value)
                                            }
                                            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
                                            style={{
                                                background: isDark
                                                    ? "#374151"
                                                    : "#f9fafb",
                                                border: `1px solid ${border}`,
                                                color: textPrimary,
                                            }}
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={toggleAll}
                                            className="text-xs px-2 py-1 rounded"
                                            style={{
                                                background: isDark
                                                    ? "#374151"
                                                    : "#f3f4f6",
                                                color: textPrimary,
                                            }}
                                        >
                                            {paginatedEmployees.length > 0 &&
                                            paginatedEmployees.every((e) =>
                                                selectedEmployees.includes(
                                                    e.id,
                                                ),
                                            )
                                                ? "Deselect All"
                                                : "Select All"}
                                        </button>
                                        <span
                                            className="text-xs"
                                            style={{ color: textSecondary }}
                                        >
                                            {paginatedEmployees.length} of{" "}
                                            {filteredEmployees.length}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                            {!selectedDevice ? (
                                <div className="py-12 text-center">
                                    <i
                                        className="ri-device-line text-4xl mb-2 block"
                                        style={{ color: textSecondary }}
                                    ></i>
                                    <p
                                        className="text-sm"
                                        style={{ color: textSecondary }}
                                    >
                                        Select a device to manage employees
                                    </p>
                                </div>
                            ) : paginatedEmployees.length === 0 ? (
                                <div className="py-12 text-center">
                                    <i
                                        className="ri-team-line text-4xl mb-2 block"
                                        style={{ color: textSecondary }}
                                    ></i>
                                    <p
                                        className="text-sm"
                                        style={{ color: textSecondary }}
                                    >
                                        No employees found for this device's
                                        area
                                    </p>
                                    {deviceArea && (
                                        <p
                                            className="text-xs mt-1"
                                            style={{ color: textSecondary }}
                                        >
                                            Area: <strong>{deviceArea}</strong>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <table className="w-full min-w-[500px]">
                                    <thead
                                        className="sticky top-0"
                                        style={{ background: cardBg }}
                                    >
                                        <tr
                                            style={{
                                                borderBottom: `1px solid ${border}`,
                                            }}
                                        >
                                            <th className="py-2 pl-3 w-8">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        paginatedEmployees.length >
                                                            0 &&
                                                        paginatedEmployees.every(
                                                            (e) =>
                                                                selectedEmployees.includes(
                                                                    e.id,
                                                                ),
                                                        )
                                                    }
                                                    onChange={toggleAll}
                                                />
                                            </th>
                                            {[
                                                "Employee",
                                                "ID",
                                                "Department",
                                                "Biometric",
                                            ].map((h) => (
                                                <th
                                                    key={h}
                                                    className="py-2 text-left text-xs font-semibold"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedEmployees.map((emp) => (
                                            <tr
                                                key={emp.id}
                                                className="cursor-pointer"
                                                onClick={() =>
                                                    toggleEmployee(emp.id)
                                                }
                                                style={{
                                                    borderBottom: `1px solid ${border}`,
                                                }}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.background =
                                                        isDark
                                                            ? "#374151"
                                                            : "#f9fafb")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.background =
                                                        "transparent")
                                                }
                                            >
                                                <td className="py-2 pl-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedEmployees.includes(
                                                            emp.id,
                                                        )}
                                                        onChange={() =>
                                                            toggleEmployee(
                                                                emp.id,
                                                            )
                                                        }
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                    />
                                                </td>
                                                <td className="py-2 pr-3">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                                            style={{
                                                                background:
                                                                    "#16a34a",
                                                            }}
                                                        >
                                                            {emp.name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <span
                                                            className="text-sm font-medium"
                                                            style={{
                                                                color: textPrimary,
                                                            }}
                                                        >
                                                            {emp.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td
                                                    className="py-2 text-xs font-mono"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {emp.employeeId}
                                                </td>
                                                <td
                                                    className="py-2 text-sm"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {emp.department}
                                                </td>
                                                <td className="py-2">
                                                    {emp.hasBiometric ? (
                                                        <span
                                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs"
                                                            style={{
                                                                background:
                                                                    "#dcfce7",
                                                                color: "#16a34a",
                                                            }}
                                                        >
                                                            <i className="ri-fingerprint-line"></i>{" "}
                                                            Enrolled
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs"
                                                            style={{
                                                                background:
                                                                    "#fee2e2",
                                                                color: "#dc2626",
                                                            }}
                                                        >
                                                            <i className="ri-error-warning-line"></i>{" "}
                                                            Pending
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {selectedDevice && employeeTotalPages > 1 && (
                            <div
                                className="p-2 flex items-center justify-center gap-1 border-t"
                                style={{ borderColor: border }}
                            >
                                <button
                                    onClick={() =>
                                        setEmployeePage((p) =>
                                            Math.max(1, p - 1),
                                        )
                                    }
                                    disabled={employeePage === 1}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-50"
                                >
                                    ←
                                </button>
                                <span className="text-xs px-2">
                                    {employeePage} / {employeeTotalPages}
                                </span>
                                <button
                                    onClick={() =>
                                        setEmployeePage((p) =>
                                            Math.min(employeeTotalPages, p + 1),
                                        )
                                    }
                                    disabled={
                                        employeePage === employeeTotalPages
                                    }
                                    className="w-7 h-7 flex items-center justify-center rounded-lg disabled:opacity-50"
                                >
                                    →
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
