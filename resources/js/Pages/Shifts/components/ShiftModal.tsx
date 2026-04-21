import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface Props {
    open: boolean;
    onClose: () => void;
    onSave: (data: Partial<Shift>) => void;
    editShift: Shift | null;
    areas?: string[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const COLORS = [
    "#16a34a",
    "#f59e0b",
    "#0891b2",
    "#7c3aed",
    "#db2777",
    "#d97706",
    "#dc2626",
];

export default function ShiftModal({
    open,
    onClose,
    onSave,
    editShift,
    areas = [],
}: Props) {
    const { isDark } = useTheme();
    const [activeTab, setActiveTab] = useState("basic");
    const [form, setForm] = useState<Partial<Shift>>({});
    const [breaks, setBreaks] = useState<ShiftBreak[]>([]);
    const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
    const [workdays, setWorkdays] = useState<boolean[]>([
        true,
        true,
        true,
        true,
        true,
        false,
        false,
    ]);
    const [selectedColor, setSelectedColor] = useState("#16a34a");

    useEffect(() => {
        if (open) {
            setActiveTab("basic");
            if (editShift) {
                setForm({ ...editShift });
                setBreaks(editShift.breaks || []);
                setSelectedLocations(editShift.locations || []);
                setSelectedColor(editShift.color || "#16a34a");
                setWorkdays([true, true, true, true, true, false, false]);
            } else {
                setForm({
                    name: "",
                    code: "",
                    startTime: "08:00",
                    endTime: "17:00",
                    checkinStartAt: "07:30",
                    checkoutEndsAt: "18:00",
                    workHours: 9,
                    lateThreshold: 15,
                    overtimeThreshold: 60,
                    type: "fixed",
                    active: true,
                });
                setBreaks([]);
                setSelectedLocations([]);
                setSelectedColor("#16a34a");
                setWorkdays([true, true, true, true, true, false, false]);
            }
        }
    }, [open, editShift]);

    if (!open) return null;

    const bg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const inputBg = isDark ? "#374151" : "#f9fafb";
    const inputStyle = {
        background: inputBg,
        border: `1px solid ${border}`,
        color: textPrimary,
    };
    const labelStyle: React.CSSProperties = {
        color: textSecondary,
        fontSize: "12px",
        fontWeight: 500,
        marginBottom: "4px",
        display: "block",
    };
    const inputClass = "w-full px-3 py-2 rounded-lg text-sm outline-none";

    /* ── Break helpers ── */
    const addBreak = () =>
        setBreaks((prev) => [
            ...prev,
            {
                id: `b${Date.now()}`,
                name: "Break",
                startTime: "12:00",
                endTime: "13:00",
                paid: false,
            },
        ]);

    const updateBreak = (
        id: string,
        field: keyof ShiftBreak,
        value: string | boolean,
    ) =>
        setBreaks((prev) =>
            prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)),
        );

    const removeBreak = (id: string) =>
        setBreaks((prev) => prev.filter((b) => b.id !== id));

    /* ── Location helpers ── */
    const allSelected =
        areas.length > 0 && selectedLocations.length === areas.length;
    const someSelected = selectedLocations.length > 0 && !allSelected;

    const toggleSelectAll = () => {
        setSelectedLocations(allSelected ? [] : [...areas]);
    };

    const toggleLocation = (loc: string) => {
        setSelectedLocations((prev) =>
            prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc],
        );
    };

    const toggleWorkday = (idx: number) =>
        setWorkdays((prev) => prev.map((d, i) => (i === idx ? !d : d)));

    const handleSave = () => {
        const formatTimeWithSeconds = (time: string | undefined): string => {
            if (!time) return "";
            // If already has seconds, return as-is
            if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time;
            // If only HH:MM, append :00
            if (time.match(/^\d{2}:\d{2}$/)) return time + ":00";
            return time;
        };
        onSave({
            ...form,
            startTime: formatTimeWithSeconds(form.startTime),
            endTime: formatTimeWithSeconds(form.endTime),
            checkinStartAt: formatTimeWithSeconds(form.checkinStartAt),
            checkoutEndsAt: formatTimeWithSeconds(form.checkoutEndsAt),
            breaks,
            locations: selectedLocations,
            color: selectedColor,
        });
        onClose();
    };

    const tabs = ["basic", "timetable", "breaks", "locations"];
    const tabLabels: Record<string, string> = {
        basic: "Basic Info",
        timetable: "Timetable",
        breaks: "Break Times",
        locations: "Locations",
    };

    /* ── Indeterminate checkbox ref ── */
    const allLocRef = (el: HTMLInputElement | null) => {
        if (el) el.indeterminate = someSelected;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="w-full max-w-2xl rounded-2xl flex flex-col max-h-[90vh]"
                style={{ background: bg, border: `1px solid ${border}` }}
            >
                {/* Header */}
                <div
                    className="flex items-center justify-between px-6 py-4"
                    style={{ borderBottom: `1px solid ${border}` }}
                >
                    <div className="flex items-center gap-3">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: `${selectedColor}20` }}
                        >
                            <i
                                className="ri-time-line text-base"
                                style={{ color: selectedColor }}
                            ></i>
                        </div>
                        <h2
                            className="text-base font-semibold"
                            style={{ color: textPrimary }}
                        >
                            {editShift ? "Edit Shift" : "Create Shift"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
                        style={{ color: textSecondary }}
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
                        <i className="ri-close-line text-lg"></i>
                    </button>
                </div>

                {/* Tabs */}
                <div
                    className="flex gap-1 px-6 pt-3"
                    style={{ borderBottom: `1px solid ${border}` }}
                >
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="px-4 py-2 text-xs font-medium cursor-pointer whitespace-nowrap transition-colors"
                            style={{
                                color:
                                    activeTab === tab
                                        ? "#16a34a"
                                        : textSecondary,
                                borderBottom:
                                    activeTab === tab
                                        ? "2px solid #16a34a"
                                        : "2px solid transparent",
                            }}
                        >
                            {tabLabels[tab]}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                    {/* ── Basic Info ── */}
                    {activeTab === "basic" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Shift Name */}
                                <div>
                                    <label style={labelStyle}>
                                        Shift Name{" "}
                                        <span style={{ color: "#dc2626" }}>
                                            *
                                        </span>
                                    </label>
                                    <input
                                        value={form.name || ""}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                name: e.target.value,
                                            }))
                                        }
                                        placeholder="e.g. Standard Day Shift"
                                        className={inputClass}
                                        style={inputStyle}
                                    />
                                </div>

                                {/* Shift Code */}
                                <div>
                                    <label style={labelStyle}>Shift Code</label>
                                    <input
                                        value={form.code || ""}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                code: e.target.value.toUpperCase(),
                                            }))
                                        }
                                        placeholder="e.g. SDS"
                                        className={inputClass}
                                        style={inputStyle}
                                    />
                                </div>

                                {/* Start Time */}
                                <div>
                                    <label style={labelStyle}>
                                        Start Time{" "}
                                        <span style={{ color: "#dc2626" }}>
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="time"
                                        value={form.startTime || "08:00"}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                startTime: e.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                        style={inputStyle}
                                    />
                                </div>

                                {/* End Time */}
                                <div>
                                    <label style={labelStyle}>
                                        End Time{" "}
                                        <span style={{ color: "#dc2626" }}>
                                            *
                                        </span>
                                    </label>
                                    <input
                                        type="time"
                                        value={form.endTime || "17:00"}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                endTime: e.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                        style={inputStyle}
                                    />
                                </div>

                                {/* Check-In Start At */}
                                <div>
                                    <label style={labelStyle}>
                                        Check-In Opens At
                                        <span
                                            className="ml-1 px-1.5 py-0.5 rounded text-xs"
                                            style={{
                                                background: "#dcfce7",
                                                color: "#16a34a",
                                                fontSize: "10px",
                                            }}
                                        >
                                            earliest allowed
                                        </span>
                                    </label>
                                    <input
                                        type="time"
                                        value={form.checkinStartAt || "07:30"}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                checkinStartAt: e.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                        style={inputStyle}
                                    />
                                    <p
                                        className="text-xs mt-1"
                                        style={{ color: textSecondary }}
                                    >
                                        System won't accept clock-ins before
                                        this time
                                    </p>
                                </div>

                                {/* Checkout Ends At */}
                                <div>
                                    <label style={labelStyle}>
                                        Checkout Closes At
                                        <span
                                            className="ml-1 px-1.5 py-0.5 rounded text-xs"
                                            style={{
                                                background: "#fef9c3",
                                                color: "#ca8a04",
                                                fontSize: "10px",
                                            }}
                                        >
                                            latest valid
                                        </span>
                                    </label>
                                    <input
                                        type="time"
                                        value={form.checkoutEndsAt || "18:00"}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                checkoutEndsAt: e.target.value,
                                            }))
                                        }
                                        className={inputClass}
                                        style={inputStyle}
                                    />
                                    <p
                                        className="text-xs mt-1"
                                        style={{ color: textSecondary }}
                                    >
                                        Checkouts after this time are flagged as
                                        missed
                                    </p>
                                </div>

                                {/* Late Threshold */}
                                <div>
                                    <label style={labelStyle}>
                                        Late Threshold (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.lateThreshold || 15}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                lateThreshold: Number(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                        className={inputClass}
                                        style={inputStyle}
                                    />
                                </div>

                                {/* Overtime After */}
                                <div>
                                    <label style={labelStyle}>
                                        Overtime After (minutes)
                                    </label>
                                    <input
                                        type="number"
                                        value={form.overtimeThreshold || 60}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                overtimeThreshold: Number(
                                                    e.target.value,
                                                ),
                                            }))
                                        }
                                        className={inputClass}
                                        style={inputStyle}
                                    />
                                </div>

                                {/* Shift Type */}
                                <div>
                                    <label style={labelStyle}>Shift Type</label>
                                    <select
                                        value={form.type || "fixed"}
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                type: e.target
                                                    .value as Shift["type"],
                                            }))
                                        }
                                        className={inputClass}
                                        style={inputStyle}
                                    >
                                        <option value="fixed">Fixed</option>
                                        <option value="flexible">
                                            Flexible
                                        </option>
                                        <option value="rotating">
                                            Rotating
                                        </option>
                                    </select>
                                </div>

                                {/* Status */}
                                <div>
                                    <label style={labelStyle}>Status</label>
                                    <select
                                        value={
                                            form.active ? "active" : "inactive"
                                        }
                                        onChange={(e) =>
                                            setForm((f) => ({
                                                ...f,
                                                active:
                                                    e.target.value === "active",
                                            }))
                                        }
                                        className={inputClass}
                                        style={inputStyle}
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>
                            </div>

                            {/* Shift window summary pill */}
                            <div
                                className="flex items-center gap-4 p-3 rounded-xl text-xs"
                                style={{
                                    background: isDark ? "#374151" : "#f0fdf4",
                                    border: `1px solid ${isDark ? "#4b5563" : "#bbf7d0"}`,
                                }}
                            >
                                <div
                                    className="flex items-center gap-1.5"
                                    style={{ color: "#16a34a" }}
                                >
                                    <i className="ri-login-circle-line"></i>
                                    <span>
                                        Check-in window:{" "}
                                        <strong>
                                            {form.checkinStartAt || "07:30"}
                                        </strong>{" "}
                                        →{" "}
                                        <strong>
                                            {form.startTime || "08:00"}
                                        </strong>
                                    </span>
                                </div>
                                <div
                                    className="w-px h-4"
                                    style={{ background: "#bbf7d0" }}
                                ></div>
                                <div
                                    className="flex items-center gap-1.5"
                                    style={{ color: "#ca8a04" }}
                                >
                                    <i className="ri-logout-circle-r-line"></i>
                                    <span>
                                        Checkout window:{" "}
                                        <strong>
                                            {form.endTime || "17:00"}
                                        </strong>{" "}
                                        →{" "}
                                        <strong>
                                            {form.checkoutEndsAt || "18:00"}
                                        </strong>
                                    </span>
                                </div>
                            </div>

                            {/* Color picker */}
                            <div>
                                <label style={labelStyle}>Shift Color</label>
                                <div className="flex gap-2 mt-1">
                                    {COLORS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setSelectedColor(c)}
                                            className="w-8 h-8 rounded-full cursor-pointer flex items-center justify-center transition-transform hover:scale-110"
                                            style={{
                                                background: c,
                                                border:
                                                    selectedColor === c
                                                        ? `3px solid ${isDark ? "#fff" : "#111"}`
                                                        : "3px solid transparent",
                                            }}
                                        >
                                            {selectedColor === c && (
                                                <i className="ri-check-line text-white text-xs"></i>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Timetable ── */}
                    {activeTab === "timetable" && (
                        <div className="space-y-4">
                            <p
                                className="text-sm font-medium"
                                style={{ color: textPrimary }}
                            >
                                Select working days for this shift
                            </p>
                            <div className="grid grid-cols-7 gap-2">
                                {DAYS.map((day, idx) => (
                                    <button
                                        key={day}
                                        onClick={() => toggleWorkday(idx)}
                                        className="flex flex-col items-center gap-1.5 py-4 rounded-xl cursor-pointer transition-all"
                                        style={{
                                            background: workdays[idx]
                                                ? `${selectedColor}15`
                                                : isDark
                                                  ? "#374151"
                                                  : "#f9fafb",
                                            border: `2px solid ${workdays[idx] ? selectedColor : border}`,
                                            color: workdays[idx]
                                                ? selectedColor
                                                : textSecondary,
                                        }}
                                    >
                                        <span className="text-xs font-bold">
                                            {day}
                                        </span>
                                        <div
                                            className="w-5 h-5 rounded-full flex items-center justify-center"
                                            style={{
                                                background: workdays[idx]
                                                    ? selectedColor
                                                    : "transparent",
                                                border: `1.5px solid ${workdays[idx] ? selectedColor : border}`,
                                            }}
                                        >
                                            {workdays[idx] && (
                                                <i
                                                    className="ri-check-line text-white"
                                                    style={{ fontSize: "10px" }}
                                                ></i>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                            <div
                                className="p-4 rounded-xl"
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
                                    Working days:{" "}
                                    {DAYS.filter((_, i) => workdays[i]).join(
                                        ", ",
                                    )}{" "}
                                    · {workdays.filter(Boolean).length}{" "}
                                    days/week
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className="p-4 rounded-xl"
                                    style={{
                                        background: isDark
                                            ? "#374151"
                                            : "#f9fafb",
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    <p
                                        className="text-xs font-medium mb-1"
                                        style={{ color: textSecondary }}
                                    >
                                        Shift Start
                                    </p>
                                    <p
                                        className="text-2xl font-bold"
                                        style={{ color: textPrimary }}
                                    >
                                        {form.startTime || "08:00"}
                                    </p>
                                </div>
                                <div
                                    className="p-4 rounded-xl"
                                    style={{
                                        background: isDark
                                            ? "#374151"
                                            : "#f9fafb",
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    <p
                                        className="text-xs font-medium mb-1"
                                        style={{ color: textSecondary }}
                                    >
                                        Shift End
                                    </p>
                                    <p
                                        className="text-2xl font-bold"
                                        style={{ color: textPrimary }}
                                    >
                                        {form.endTime || "17:00"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── Break Times ── */}
                    {activeTab === "breaks" && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: textPrimary }}
                                >
                                    Break Times
                                </p>
                                <button
                                    onClick={addBreak}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap"
                                    style={{
                                        background: "#dcfce7",
                                        color: "#16a34a",
                                    }}
                                >
                                    <i className="ri-add-line"></i> Add Break
                                </button>
                            </div>

                            {breaks.length === 0 && (
                                <div
                                    className="py-10 text-center rounded-xl"
                                    style={{
                                        background: isDark
                                            ? "#374151"
                                            : "#f9fafb",
                                        border: `1px dashed ${border}`,
                                    }}
                                >
                                    <i
                                        className="ri-cup-line text-3xl mb-2 block"
                                        style={{ color: textSecondary }}
                                    ></i>
                                    <p
                                        className="text-sm"
                                        style={{ color: textSecondary }}
                                    >
                                        No breaks configured
                                    </p>
                                    <button
                                        onClick={addBreak}
                                        className="mt-2 text-xs cursor-pointer"
                                        style={{ color: "#16a34a" }}
                                    >
                                        Add a break time
                                    </button>
                                </div>
                            )}

                            {breaks.map((brk) => (
                                <div
                                    key={brk.id}
                                    className="p-4 rounded-xl"
                                    style={{
                                        background: isDark
                                            ? "#374151"
                                            : "#f9fafb",
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <input
                                            value={brk.name}
                                            onChange={(e) =>
                                                updateBreak(
                                                    brk.id,
                                                    "name",
                                                    e.target.value,
                                                )
                                            }
                                            className="text-sm font-medium bg-transparent outline-none"
                                            style={{ color: textPrimary }}
                                        />
                                        <button
                                            onClick={() => removeBreak(brk.id)}
                                            className="w-6 h-6 flex items-center justify-center rounded cursor-pointer"
                                            style={{ color: "#dc2626" }}
                                        >
                                            <i className="ri-close-line text-sm"></i>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label style={labelStyle}>
                                                Start
                                            </label>
                                            <input
                                                type="time"
                                                value={brk.startTime}
                                                onChange={(e) =>
                                                    updateBreak(
                                                        brk.id,
                                                        "startTime",
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>
                                                End
                                            </label>
                                            <input
                                                type="time"
                                                value={brk.endTime}
                                                onChange={(e) =>
                                                    updateBreak(
                                                        brk.id,
                                                        "endTime",
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                                style={inputStyle}
                                            />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>
                                                Paid Break
                                            </label>
                                            <button
                                                onClick={() =>
                                                    updateBreak(
                                                        brk.id,
                                                        "paid",
                                                        !brk.paid,
                                                    )
                                                }
                                                className="w-full px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors"
                                                style={{
                                                    background: brk.paid
                                                        ? "#dcfce7"
                                                        : isDark
                                                          ? "#4b5563"
                                                          : "#f3f4f6",
                                                    color: brk.paid
                                                        ? "#16a34a"
                                                        : textSecondary,
                                                    border: `1px solid ${brk.paid ? "#16a34a" : border}`,
                                                }}
                                            >
                                                {brk.paid ? "Paid" : "Unpaid"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Locations ── */}
                    {activeTab === "locations" && (
                        <div className="space-y-3">
                            {/* Header row */}
                            <div className="flex items-center justify-between">
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: textPrimary }}
                                >
                                    Assign to Locations
                                </p>
                                <span
                                    className="text-xs px-2 py-1 rounded-full"
                                    style={{
                                        background: "#dcfce7",
                                        color: "#16a34a",
                                    }}
                                >
                                    {selectedLocations.length} / {areas.length}{" "}
                                    selected
                                </span>
                            </div>

                            <p
                                className="text-xs"
                                style={{ color: textSecondary }}
                            >
                                This shift will be available for employees in
                                the selected locations
                            </p>

                            {areas.length === 0 ? (
                                <div
                                    className="py-10 text-center rounded-xl"
                                    style={{
                                        background: isDark
                                            ? "#374151"
                                            : "#f9fafb",
                                        border: `1px dashed ${border}`,
                                    }}
                                >
                                    <i
                                        className="ri-map-pin-line text-3xl mb-2 block"
                                        style={{ color: textSecondary }}
                                    ></i>
                                    <p
                                        className="text-sm"
                                        style={{ color: textSecondary }}
                                    >
                                        No locations found
                                    </p>
                                    <p
                                        className="text-xs mt-1"
                                        style={{
                                            color: textSecondary,
                                            opacity: 0.7,
                                        }}
                                    >
                                        Add locations in the Locations module
                                        first
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {/* Select All row */}
                                    <div
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
                                        style={{
                                            background: allSelected
                                                ? "#dcfce7"
                                                : isDark
                                                  ? "#374151"
                                                  : "#f9fafb",
                                            border: `1px solid ${allSelected ? "#16a34a" : border}`,
                                        }}
                                        onClick={toggleSelectAll}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <input
                                                ref={allLocRef}
                                                type="checkbox"
                                                checked={allSelected}
                                                onChange={toggleSelectAll}
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                                className="w-4 h-4 cursor-pointer accent-green-600"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <p
                                                className="text-xs font-semibold"
                                                style={{
                                                    color: allSelected
                                                        ? "#16a34a"
                                                        : textPrimary,
                                                }}
                                            >
                                                All Locations
                                            </p>
                                            <p
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                {allSelected
                                                    ? "Click to deselect all"
                                                    : someSelected
                                                      ? `${selectedLocations.length} selected — click to select all`
                                                      : "Click to select all locations"}
                                            </p>
                                        </div>
                                        {allSelected && (
                                            <i
                                                className="ri-check-double-line flex-shrink-0"
                                                style={{ color: "#16a34a" }}
                                            ></i>
                                        )}
                                    </div>

                                    {/* Divider */}
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="flex-1 h-px"
                                            style={{ background: border }}
                                        ></div>
                                        <span
                                            className="text-xs"
                                            style={{ color: textSecondary }}
                                        >
                                            individual locations
                                        </span>
                                        <div
                                            className="flex-1 h-px"
                                            style={{ background: border }}
                                        ></div>
                                    </div>

                                    {/* Individual locations */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {areas.map((areaName) => {
                                            const isSelected =
                                                selectedLocations.includes(
                                                    areaName,
                                                );
                                            return (
                                                <div
                                                    key={areaName}
                                                    className="flex items-center gap-2.5 px-3 py-3 rounded-xl cursor-pointer transition-all"
                                                    style={{
                                                        background: isSelected
                                                            ? "#dcfce7"
                                                            : isDark
                                                              ? "#374151"
                                                              : "#f9fafb",
                                                        border: `1px solid ${isSelected ? "#16a34a" : border}`,
                                                    }}
                                                    onClick={() =>
                                                        toggleLocation(areaName)
                                                    }
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() =>
                                                            toggleLocation(
                                                                areaName,
                                                            )
                                                        }
                                                        onClick={(e) =>
                                                            e.stopPropagation()
                                                        }
                                                        className="w-4 h-4 cursor-pointer accent-green-600 flex-shrink-0"
                                                    />
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <div
                                                            className="w-2 h-2 rounded-full flex-shrink-0"
                                                            style={{
                                                                background:
                                                                    isSelected
                                                                        ? "#16a34a"
                                                                        : isDark
                                                                          ? "#6b7280"
                                                                          : "#d1d5db",
                                                            }}
                                                        ></div>
                                                        <p
                                                            className="text-xs font-medium truncate"
                                                            style={{
                                                                color: isSelected
                                                                    ? "#16a34a"
                                                                    : textPrimary,
                                                            }}
                                                        >
                                                            {areaName}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="px-6 py-4 flex items-center justify-end gap-3"
                    style={{ borderTop: `1px solid ${border}` }}
                >
                    <button
                        onClick={onClose}
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
                        {editShift ? "Save Changes" : "Create Shift"}
                    </button>
                </div>
            </div>
        </div>
    );
}
