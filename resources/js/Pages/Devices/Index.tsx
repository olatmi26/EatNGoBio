import { useState, useEffect } from "react";
import { Head, usePage, router } from "@inertiajs/react";
import { route } from "ziggy-js";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import Modal from "@/Components/base/Modal";
import ConfirmDialog from "@/Components/base/ConfirmDialog";
import type { PageProps, DeviceItem, PendingDeviceItem } from "@/types";

interface Props extends PageProps {
    devices: DeviceItem[];
    pendingDevices: PendingDeviceItem[];
    areas: { id: number; name: string; code?: string }[];
}

const timezones = [
    "Africa/Lagos",
    "Africa/Nairobi",
    "Africa/Cairo",
    "UTC",
    "Europe/London",
    "America/New_York",
];

const transferModes = ["Real-Time", "Scheduled", "Manual"];

const emptyForm = {
    name: "",
    sn: "",
    ip: "",
    area: "",
    timezone: "Africa/Lagos",
    transferMode: "Real-Time",
    heartbeat: 60,
};

type DeviceForm = typeof emptyForm;

// usePage replaces all mock data
export default function DevicesPage() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const { props } = usePage<Props>();
    const [devices, setDevices] = useState<DeviceItem[]>(props.devices);
    const pendingDevices = props.pendingDevices;
    const [search, setSearch] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editDevice, setEditDevice] = useState<DeviceItem | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [form, setForm] = useState<DeviceForm>({ ...emptyForm });
    const [selected, setSelected] = useState<number[]>([]);

    useEffect(() => {
        setDevices(props.devices);
    }, [props.devices]);

    const bg = isDark ? "#111827" : "#f8fafc";
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const inputBg = isDark ? "#374151" : "#f9fafb";

    const filtered = devices.filter(
        (d) =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.sn.toLowerCase().includes(search.toLowerCase()) ||
            (d.area ?? "").toLowerCase().includes(search.toLowerCase()),
    );

    const online = devices.filter((d) => d.status === "online").length;
    const offline = devices.filter((d) => d.status === "offline").length;
    const totalUsers = devices.reduce((s, d) => s + (Number(d.users) || 0), 0);

    const openAdd = () => {
        setForm({ ...emptyForm });
        setEditDevice(null);
        setShowModal(true);
    };
    const openEdit = (d: DeviceItem) => {
        setForm({
            name: d.name,
            sn: d.sn,
            ip: d.ip,
            area: d.area,
            timezone: d.timezone,
            transferMode: d.transferMode,
            heartbeat: d.heartbeat,
        });
        setEditDevice(d);
        setShowModal(true);
    };

    const handleSave = () => {
        if (!form.name || !form.sn || !form.ip || !form.area) {
            showToast(
                "error",
                "Validation Error",
                "Please fill all required fields",
            );
            return;
        }
        if (editDevice) {
            router.put(
                route("devices.update", editDevice.id, false, props.ziggy),
                form,
                {
                    onSuccess: () => {
                        setShowModal(false);
                        showToast("success", "Device Updated", "");
                    },
                },
            );
        } else {
            router.post(
                route("devices.store", undefined, false, props.ziggy),
                form,
                {
                    onSuccess: () => {
                        setShowModal(false);
                        showToast("success", "Device Added", "");
                    },
                },
            );
        }
    };

    const handleDelete = (id: number) => {
        const name = devices.find((x) => x.id === id)?.name;
        router.delete(route("devices.destroy", id, false, props.ziggy), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteId(null);
                setSelected((prev) => prev.filter((x) => x !== id));
                showToast(
                    "success",
                    "Device Removed",
                    name ? `${name} has been removed` : "Device removed.",
                );
            },
            onError: () => {
                showToast("error", "Error", "Could not remove device.");
            },
        });
    };

    const bulkDeleteSelected = () => {
        const ids = [...selected];
        if (ids.length === 0) return;
        const run = (index: number) => {
            if (index >= ids.length) {
                showToast(
                    "success",
                    "Devices removed",
                    `${ids.length} device(s) removed.`,
                );
                setSelected([]);
                return;
            }
            router.delete(
                route("devices.destroy", ids[index], false, props.ziggy),
                {
                    preserveScroll: true,
                    onSuccess: () => run(index + 1),
                    onError: () => {
                        showToast(
                            "error",
                            "Error",
                            "Could not remove one or more devices.",
                        );
                        setSelected([]);
                    },
                },
            );
        };
        run(0);
    };

    const batchApproveAll = () => {
        router.post(
            "/devices/batch-approve",
            {},
            {
                onSuccess: () => {
                    showToast(
                        "success",
                        "Devices Approved",
                        "All devices are now ready for connection",
                    );
                },
            },
        );
    };

    const toggleSelect = (id: number) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );
    };
    const toggleAll = () => {
        setSelected((prev) =>
            prev.length === filtered.length ? [] : filtered.map((d) => d.id),
        );
    };

    const statusBadge = (status: DeviceItem["status"]) => {
        const map: Record<
            DeviceItem["status"],
            { bg: string; color: string; icon: string; label: string }
        > = {
            online: {
                bg: "#dcfce7",
                color: "#16a34a",
                icon: "ri-wifi-line",
                label: "Online",
            },
            offline: {
                bg: "#fee2e2",
                color: "#dc2626",
                icon: "ri-wifi-off-line",
                label: "Offline",
            },
            syncing: {
                bg: "#fef9c3",
                color: "#ca8a04",
                icon: "ri-refresh-line",
                label: "Syncing",
            },
            unregistered: {
                bg: "#f3f4f6",
                color: "#6b7280",
                icon: "ri-question-line",
                label: "Unregistered",
            },
        };
        const s = map[status] ?? map.offline;
        return (
            <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ background: s.bg, color: s.color }}
            >
                <i className={`${s.icon} text-xs`}></i> {s.label}
            </span>
        );
    };

    const inputClass =
        "w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors";
    const inputStyle = {
        background: inputBg,
        border: `1px solid ${border}`,
        color: textPrimary,
    };
    const labelStyle = {
        color: textSecondary,
        fontSize: "12px",
        fontWeight: 500,
        marginBottom: "4px",
        display: "block",
    };

    return (
        <AppLayout title="">
            <div className="p-6" style={{ background: bg, minHeight: "100vh" }}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1
                            className="text-2xl font-bold"
                            style={{ color: textPrimary }}
                        >
                            Devices
                        </h1>
                        <p
                            className="text-sm mt-0.5"
                            style={{ color: textSecondary }}
                        >
                            {devices.length} devices registered · {online}{" "}
                            online · No license limits
                        </p>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer whitespace-nowrap transition-opacity hover:opacity-90"
                        style={{
                            background:
                                "linear-gradient(135deg, #16a34a, #15803d)",
                        }}
                    >
                        <i className="ri-add-line"></i> Add Device
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                        {
                            label: "Total Devices",
                            value: devices.length,
                            color: textPrimary,
                        },
                        { label: "Online", value: online, color: "#16a34a" },
                        { label: "Offline", value: offline, color: "#dc2626" },
                        {
                            label: "Total Users on Devices",
                            value: totalUsers,
                            color: textPrimary,
                        },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="p-5 rounded-xl"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <p
                                className="text-xs font-medium mb-2"
                                style={{ color: textSecondary }}
                            >
                                {s.label}
                            </p>
                            <p
                                className="text-3xl font-bold"
                                style={{ color: s.color }}
                            >
                                {Number.isFinite(s.value) ? s.value : 0}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Search + Bulk actions */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="relative flex-1 max-w-sm">
                        <i
                            className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                            style={{ color: textSecondary }}
                        ></i>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search devices..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        />
                    </div>
                    {selected.length > 0 && (
                        <button
                            onClick={() => bulkDeleteSelected()}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer whitespace-nowrap"
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
                </div>

                {/* Table */}
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        background: cardBg,
                        border: `1px solid ${border}`,
                    }}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                            <thead>
                                <tr
                                    style={{
                                        borderBottom: `1px solid ${border}`,
                                    }}
                                >
                                    <th className="px-4 py-3 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={
                                                selected.length ===
                                                    filtered.length &&
                                                filtered.length > 0
                                            }
                                            onChange={toggleAll}
                                            className="cursor-pointer"
                                        />
                                    </th>
                                    {[
                                        "Device Name",
                                        "Serial Number",
                                        "Area",
                                        "IP Address",
                                        "State",
                                        "Last Activity",
                                        "Users",
                                        "FP",
                                        "Face",
                                        "",
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
                                {filtered.map((d) => (
                                    <tr
                                        key={d.id}
                                        className="transition-colors"
                                        style={{
                                            borderBottom: `1px solid ${border}`,
                                        }}
                                        onMouseEnter={(e) => {
                                            (
                                                e.currentTarget as HTMLTableRowElement
                                            ).style.background = isDark
                                                ? "#374151"
                                                : "#f9fafb";
                                        }}
                                        onMouseLeave={(e) => {
                                            (
                                                e.currentTarget as HTMLTableRowElement
                                            ).style.background = "transparent";
                                        }}
                                    >
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selected.includes(
                                                    d.id,
                                                )}
                                                onChange={() =>
                                                    toggleSelect(d.id)
                                                }
                                                className="cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() =>
                                                    router.visit(
                                                        `/devices/${d.id}`,
                                                    )
                                                }
                                                className="text-sm font-medium cursor-pointer hover:underline whitespace-nowrap"
                                                style={{ color: "#16a34a" }}
                                            >
                                                {d.name}
                                            </button>
                                        </td>
                                        <td
                                            className="px-4 py-3 text-xs font-mono"
                                            style={{ color: textSecondary }}
                                        >
                                            {d.sn}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm font-medium whitespace-nowrap"
                                            style={{ color: textPrimary }}
                                        >
                                            {d.area}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-xs font-mono"
                                            style={{ color: textSecondary }}
                                        >
                                            {d.ip}
                                        </td>
                                        <td className="px-4 py-3">
                                            {statusBadge(d.status)}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-xs whitespace-nowrap"
                                            style={{ color: textSecondary }}
                                        >
                                            {d.lastActivity}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm font-medium text-center"
                                            style={{ color: textPrimary }}
                                        >
                                            {Number(d.users) || 0}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm font-medium text-center"
                                            style={{ color: textPrimary }}
                                        >
                                            {Number(d.fp) || 0}
                                        </td>
                                        <td
                                            className="px-4 py-3 text-sm font-medium text-center"
                                            style={{ color: textPrimary }}
                                        >
                                            {Number(d.face) || 0}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() =>
                                                        router.visit(
                                                            `/devices/${d.id}`,
                                                        )
                                                    }
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                    title="View Details"
                                                    onMouseEnter={(e) => {
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            isDark
                                                                ? "#4b5563"
                                                                : "#f3f4f6";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            "transparent";
                                                    }}
                                                >
                                                    <i className="ri-eye-line text-sm"></i>
                                                </button>
                                                <button
                                                    onClick={() => openEdit(d)}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                                                    style={{ color: "#0891b2" }}
                                                    title="Edit Device"
                                                    onMouseEnter={(e) => {
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            "#e0f2fe";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            "transparent";
                                                    }}
                                                >
                                                    <i className="ri-edit-line text-sm"></i>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        router.visit(
                                                            `/devices/${d.id}`,
                                                        );
                                                    }}
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                                                    style={{ color: "#7c3aed" }}
                                                    title="Command Center"
                                                    onMouseEnter={(e) => {
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            "#ede9fe";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            "transparent";
                                                    }}
                                                >
                                                    <i className="ri-terminal-box-line text-sm"></i>
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setDeleteId(d.id)
                                                    }
                                                    className="w-7 h-7 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
                                                    style={{ color: "#dc2626" }}
                                                    title="Delete Device"
                                                    onMouseEnter={(e) => {
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            "#fef2f2";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        (
                                                            e.currentTarget as HTMLButtonElement
                                                        ).style.background =
                                                            "transparent";
                                                    }}
                                                >
                                                    <i className="ri-delete-bin-line text-sm"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && (
                        <div
                            className="py-16 text-center"
                            style={{ color: textSecondary }}
                        >
                            <i className="ri-device-line text-4xl mb-3 block"></i>
                            <p className="text-sm">No devices found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editDevice ? "Edit Device" : "Add New Device"}
                size="lg"
                footer={
                    <>
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-medium"
                            style={{
                                background: isDark ? "#374151" : "#f3f4f6",
                                color: textSecondary,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-5 py-2 text-sm rounded-lg cursor-pointer whitespace-nowrap font-semibold text-white"
                            style={{ background: "#16a34a" }}
                        >
                            {editDevice ? "Save Changes" : "Confirm"}
                        </button>
                    </>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label style={labelStyle}>
                            Device Name{" "}
                            <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <input
                            value={form.name}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, name: e.target.value }))
                            }
                            placeholder="e.g. LEKKI BIOMETRICS"
                            className={inputClass}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>
                            Serial Number{" "}
                            <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <input
                            value={form.sn}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, sn: e.target.value }))
                            }
                            placeholder="e.g. BQC2254800XXX"
                            className={inputClass}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>
                            Device IP{" "}
                            <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <input
                            value={form.ip}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, ip: e.target.value }))
                            }
                            placeholder="e.g. 192.168.1.199"
                            className={inputClass}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>
                            Area <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <select
                            value={form.area}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, area: e.target.value }))
                            }
                            className={inputClass}
                            style={inputStyle}
                        >
                            <option value="">Select Area</option>
                            {props.areas.map((a: any) => (
                                <option key={a.id} value={a.name}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Time Zone</label>
                        <select
                            value={form.timezone}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    timezone: e.target.value,
                                }))
                            }
                            className={inputClass}
                            style={inputStyle}
                        >
                            {timezones.map((tz) => (
                                <option key={tz} value={tz}>
                                    {tz}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Transfer Mode</label>
                        <select
                            value={form.transferMode}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    transferMode: e.target.value,
                                }))
                            }
                            className={inputClass}
                            style={inputStyle}
                        >
                            {transferModes.map((m) => (
                                <option key={m} value={m}>
                                    {m}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>
                            Request Heartbeat (seconds)
                        </label>
                        <input
                            type="number"
                            value={
                                Number.isFinite(form.heartbeat)
                                    ? form.heartbeat
                                    : emptyForm.heartbeat
                            }
                            onChange={(e) => {
                                const n = Number(e.target.value);
                                setForm((f) => ({
                                    ...f,
                                    heartbeat:
                                        e.target.value === "" ||
                                        !Number.isFinite(n)
                                            ? emptyForm.heartbeat
                                            : n,
                                }));
                            }}
                            className={inputClass}
                            style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Attendance Device</label>
                        <select
                            className={inputClass}
                            style={inputStyle}
                            defaultValue="Yes"
                        >
                            <option>Yes</option>
                            <option>No</option>
                        </select>
                    </div>
                </div>
                <div
                    className="mt-4 p-3 rounded-xl"
                    style={{
                        background: isDark ? "#374151" : "#f0fdf4",
                        border: `1px solid ${isDark ? "#4b5563" : "#bbf7d0"}`,
                    }}
                >
                    <p
                        className="text-xs font-medium"
                        style={{ color: "#16a34a" }}
                    >
                        <i className="ri-information-line mr-1"></i>
                        Configure the device to point to:{" "}
                        <span className="font-mono">
                            https://engobio.coldstonecreamery.ng
                        </span>
                    </p>
                </div>
            </Modal>

            {/* Delete Confirm */}
            <ConfirmDialog
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={() => deleteId && handleDelete(deleteId)}
                title="Remove Device"
                message="Are you sure you want to remove this device? This action cannot be undone."
                confirmLabel="Remove"
                danger
            />
        </AppLayout>
    );
}
