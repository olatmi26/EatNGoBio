import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import axios from "axios";

interface EmployeeModalProps {
    departments?: string[];
    positions?: string[];
    areas?: string[];
    open: boolean;
    onClose: () => void;
    onSave: (data: Partial<any>) => void;
    editEmployee: any | null;
}

const employeeTypes = ["Official", "Temporary", "Probation"];
const genders = ["Male", "Female", "Other"];

const STEPS = [
    {
        id: 1,
        key: "identity",
        label: "Identity",
        mobileLabel: "Identity",
        icon: "ri-id-card-line",
    },
    {
        id: 2,
        key: "location",
        label: "Location & Access",
        mobileLabel: "Location",
        icon: "ri-map-pin-line",
    },
    {
        id: 3,
        key: "private",
        label: "Private Info",
        mobileLabel: "Private",
        icon: "ri-shield-user-line",
    },
    {
        id: 4,
        key: "biometrics",
        label: "Biometrics",
        mobileLabel: "Bio",
        icon: "ri-fingerprint-line",
    },
];

function SmartSelect({
    value,
    onChange,
    options,
    placeholder,
    inputClass,
    inputStyle,
}: {
    value: string;
    onChange: (v: string) => void;
    options: string[];
    placeholder: string;
    inputClass: string;
    inputStyle: React.CSSProperties;
}) {
    const all =
        value && !options.includes(value) ? [value, ...options] : options;
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
            style={inputStyle}
        >
            <option value="">{placeholder}</option>
            {all.map((o) => (
                <option key={o} value={o}>
                    {o}
                </option>
            ))}
        </select>
    );
}

function Toggle({
    enabled,
    onToggle,
    isDark,
}: {
    enabled: boolean;
    onToggle: () => void;
    isDark: boolean;
}) {
    return (
        <button
            onClick={onToggle}
            className="w-11 h-6 rounded-full cursor-pointer relative transition-all flex-shrink-0"
            style={{
                background: enabled
                    ? "#16a34a"
                    : isDark
                      ? "#4b5563"
                      : "#d1d5db",
            }}
        >
            <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                style={{ left: enabled ? "23px" : "3px" }}
            ></div>
        </button>
    );
}

// ── Camera Modal ──────────────────────────────────────────────────────────────
function CameraCaptureModal({
    open,
    onClose,
    onCapture,
    isDark,
    border,
}: {
    open: boolean;
    onClose: () => void;
    onCapture: () => void;
    isDark: boolean;
    border: string;
}) {
    const [status, setStatus] = useState<"empty" | "scanning" | "captured">(
        "empty",
    );
    const tp = isDark ? "#f9fafb" : "#111827";
    const ts = isDark ? "#9ca3af" : "#6b7280";
    useEffect(() => {
        if (open) setStatus("empty");
    }, [open]);
    if (!open) return null;
    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div
                className="w-full max-w-sm rounded-2xl overflow-hidden"
                style={{
                    background: isDark ? "#1f2937" : "#fff",
                    border: `1px solid ${border}`,
                    boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
                }}
            >
                <div
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: `1px solid ${border}` }}
                >
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ background: "#dcfce7" }}
                        >
                            <i
                                className="ri-camera-line text-sm"
                                style={{ color: "#16a34a" }}
                            ></i>
                        </div>
                        <div>
                            <p
                                className="text-sm font-semibold"
                                style={{ color: tp }}
                            >
                                Face Capture
                            </p>
                            <p className="text-xs" style={{ color: ts }}>
                                Position face within the frame
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg"
                        style={{ color: ts }}
                    >
                        <i className="ri-close-line text-lg"></i>
                    </button>
                </div>
                <div
                    className="relative flex items-center justify-center mx-5 mt-5 rounded-2xl overflow-hidden"
                    style={{
                        background: "#0a0a0a",
                        height: "260px",
                        border: `1px solid ${border}`,
                    }}
                >
                    {status === "empty" && (
                        <div className="text-center">
                            <div
                                className="w-28 h-28 rounded-full border-2 border-dashed mx-auto mb-3 flex items-center justify-center"
                                style={{ borderColor: "#4b5563" }}
                            >
                                <i
                                    className="ri-user-line text-5xl"
                                    style={{ color: "#4b5563" }}
                                ></i>
                            </div>
                            <p className="text-xs" style={{ color: "#6b7280" }}>
                                Centre your face in the frame
                            </p>
                        </div>
                    )}
                    {status === "scanning" && (
                        <div className="text-center">
                            <div
                                className="w-36 h-36 rounded-full border-4 mx-auto mb-3 flex items-center justify-center animate-pulse"
                                style={{ borderColor: "#f59e0b" }}
                            >
                                <i
                                    className="ri-scan-line text-6xl"
                                    style={{ color: "#f59e0b" }}
                                ></i>
                            </div>
                            <p
                                className="text-sm font-semibold"
                                style={{ color: "#f59e0b" }}
                            >
                                Detecting face...
                            </p>
                        </div>
                    )}
                    {status === "captured" && (
                        <div className="text-center">
                            <div
                                className="w-36 h-36 rounded-full border-4 mx-auto mb-3 flex items-center justify-center"
                                style={{ borderColor: "#16a34a" }}
                            >
                                <i
                                    className="ri-user-smile-line text-6xl"
                                    style={{ color: "#16a34a" }}
                                ></i>
                            </div>
                            <p
                                className="text-sm font-semibold"
                                style={{ color: "#16a34a" }}
                            >
                                Face captured!
                            </p>
                        </div>
                    )}
                    {status !== "captured" && (
                        <>
                            {[
                                "top-3 left-3 border-t-2 border-l-2",
                                "top-3 right-3 border-t-2 border-r-2",
                                "bottom-3 left-3 border-b-2 border-l-2",
                                "bottom-3 right-3 border-b-2 border-r-2",
                            ].map((cls, i) => (
                                <div
                                    key={i}
                                    className={`absolute w-7 h-7 ${cls}`}
                                    style={{
                                        borderColor:
                                            status === "scanning"
                                                ? "#f59e0b"
                                                : "#4b5563",
                                    }}
                                ></div>
                            ))}
                        </>
                    )}
                    <div
                        className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2 py-1 rounded-full"
                        style={{ background: "rgba(0,0,0,0.6)" }}
                    >
                        <div
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{
                                background:
                                    status === "scanning"
                                        ? "#f59e0b"
                                        : "#16a34a",
                            }}
                        ></div>
                        <span className="text-xs font-medium text-white">
                            {status === "scanning" ? "SCANNING" : "LIVE"}
                        </span>
                    </div>
                </div>
                <div className="px-5 py-4 space-y-2">
                    {status !== "scanning" && (
                        <button
                            onClick={() => {
                                setStatus("scanning");
                                setTimeout(() => setStatus("captured"), 3000);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                            style={{
                                background:
                                    status === "captured"
                                        ? "#0891b2"
                                        : "#16a34a",
                            }}
                        >
                            <i
                                className={
                                    status === "captured"
                                        ? "ri-refresh-line"
                                        : "ri-camera-line"
                                }
                            ></i>
                            {status === "captured"
                                ? "Re-capture"
                                : "Capture Face"}
                        </button>
                    )}
                    {status === "scanning" && (
                        <button
                            disabled
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white opacity-60"
                            style={{ background: "#f59e0b" }}
                        >
                            <i className="ri-loader-4-line animate-spin"></i>{" "}
                            Scanning...
                        </button>
                    )}
                    {status === "captured" && (
                        <>
                            <button
                                onClick={() => {
                                    onCapture();
                                    onClose();
                                }}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                                style={{ background: "#16a34a" }}
                            >
                                <i className="ri-check-line"></i> Save Face
                                Template
                            </button>
                            <button
                                onClick={() => setStatus("empty")}
                                className="w-full py-2 rounded-xl text-sm font-medium"
                                style={{
                                    background: "#fee2e2",
                                    color: "#dc2626",
                                }}
                            >
                                <i className="ri-delete-bin-line mr-1"></i>{" "}
                                Discard & Retry
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Saving Overlay ────────────────────────────────────────────────────────────
function SavingOverlay({ isDark }: { isDark: boolean }) {
    return (
        <div
            className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-2xl"
            style={{
                background: isDark
                    ? "rgba(17,24,39,0.9)"
                    : "rgba(255,255,255,0.9)",
                backdropFilter: "blur(4px)",
            }}
        >
            <div className="flex flex-col items-center gap-5">
                <div className="relative w-20 h-20">
                    <div
                        className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
                        style={{
                            borderTopColor: "#16a34a",
                            animationDuration: "0.75s",
                        }}
                    ></div>
                    <div
                        className="absolute inset-2 rounded-full border-4 border-transparent animate-spin"
                        style={{
                            borderTopColor: "#22c55e",
                            animationDuration: "1.1s",
                            animationDirection: "reverse",
                        }}
                    ></div>
                    <div
                        className="absolute inset-5 rounded-full flex items-center justify-center"
                        style={{ background: "#dcfce7" }}
                    >
                        <i
                            className="ri-user-line text-base"
                            style={{ color: "#16a34a" }}
                        ></i>
                    </div>
                </div>
                <div className="text-center">
                    <p
                        className="text-sm font-bold"
                        style={{ color: isDark ? "#f9fafb" : "#111827" }}
                    >
                        Saving Employee
                    </p>
                    <p
                        className="text-xs mt-1"
                        style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
                    >
                        Please wait a moment...
                    </p>
                </div>
            </div>
        </div>
    );
}

// ── STEP 1: Identity ──────────────────────────────────────────────────────────
function StepIdentity({
    form,
    setForm,
    departments,
    positions,
    isDark,
    border,
    textPrimary,
    textSecondary,
    inputBg,
    generatingId,
    generateEmployeeId,
}: any) {
    const ic =
        "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-green-500";
    const is = {
        background: inputBg,
        border: `1px solid ${border}`,
        color: textPrimary,
    };
    const ls: React.CSSProperties = {
        color: textSecondary,
        fontSize: "11px",
        fontWeight: 600,
        marginBottom: "5px",
        display: "block",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    };
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (ev) =>
            setForm((prev: any) => ({
                ...prev,
                avatarPreview: ev.target?.result as string,
            }));
        reader.readAsDataURL(f);
    };

    return (
        <div className="flex gap-6 h-full">
            <div className="flex-1 min-w-0 space-y-4">
                <div>
                    <label style={ls}>
                        Employee ID <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <div className="flex gap-2">
                        <input
                            value={form.employeeId || ""}
                            onChange={(e) =>
                                setForm((f: any) => ({
                                    ...f,
                                    employeeId: e.target.value.replace(
                                        /\D/g,
                                        "",
                                    ),
                                }))
                            }
                            className={`${ic} flex-1 font-mono`}
                            style={is}
                            placeholder="Enter numeric ID (e.g., 1001)"
                        />
                        {!form.id && (
                            <button
                                onClick={generateEmployeeId}
                                disabled={generatingId}
                                className="px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors"
                                style={{ background: "#0891b2", color: "#fff" }}
                            >
                                {generatingId ? (
                                    <i className="ri-loader-4-line animate-spin"></i>
                                ) : (
                                    <i className="ri-refresh-line"></i>
                                )}
                            </button>
                        )}
                    </div>
                    <p
                        className="text-xs mt-1"
                        style={{ color: textSecondary }}
                    >
                        Numeric digits only, no letters or special characters
                    </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label style={ls}>
                            First Name{" "}
                            <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <input
                            value={form.firstName || ""}
                            onChange={(e) =>
                                setForm((f: any) => ({
                                    ...f,
                                    firstName: e.target.value,
                                }))
                            }
                            className={ic}
                            style={is}
                            placeholder="John"
                        />
                    </div>
                    <div>
                        <label style={ls}>
                            Last Name{" "}
                            <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <input
                            value={form.lastName || ""}
                            onChange={(e) =>
                                setForm((f: any) => ({
                                    ...f,
                                    lastName: e.target.value,
                                }))
                            }
                            className={ic}
                            style={is}
                            placeholder="Doe"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label style={ls}>
                            Department{" "}
                            <span style={{ color: "#dc2626" }}>*</span>
                        </label>
                        <SmartSelect
                            value={form.department || ""}
                            onChange={(v) =>
                                setForm((f: any) => ({ ...f, department: v }))
                            }
                            options={departments ?? []}
                            placeholder="Select Department"
                            inputClass={ic}
                            inputStyle={is}
                        />
                    </div>
                    <div>
                        <label style={ls}>Position</label>
                        <SmartSelect
                            value={form.position || ""}
                            onChange={(v) =>
                                setForm((f: any) => ({ ...f, position: v }))
                            }
                            options={positions ?? []}
                            placeholder="Select Position"
                            inputClass={ic}
                            inputStyle={is}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label style={ls}>Type</label>
                        <select
                            value={form.employeeType || "Official"}
                            onChange={(e) =>
                                setForm((f: any) => ({
                                    ...f,
                                    employeeType: e.target.value,
                                }))
                            }
                            className={ic}
                            style={is}
                        >
                            {employeeTypes.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label style={ls}>Hired Date</label>
                        <input
                            type="date"
                            value={form.hiredDate || ""}
                            onChange={(e) =>
                                setForm((f: any) => ({
                                    ...f,
                                    hiredDate: e.target.value,
                                }))
                            }
                            className={ic}
                            style={is}
                        />
                    </div>
                    <div>
                        <label style={ls}>Status</label>
                        <select
                            value={form.status || "active"}
                            onChange={(e) =>
                                setForm((f: any) => ({
                                    ...f,
                                    status: e.target.value,
                                }))
                            }
                            className={ic}
                            style={is}
                        >
                            <option value="active">Active</option>
                            <option value="probation">Probation</option>
                            <option value="resigned">Resigned</option>
                        </select>
                    </div>
                </div>
            </div>

            <div
                style={{ width: "150px", flexShrink: 0 }}
                className="flex flex-col gap-2.5"
            >
                <label style={ls}>Employee Photo</label>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFile}
                />
                <div
                    onClick={() => fileRef.current?.click()}
                    className="rounded-2xl flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group transition-all"
                    style={{
                        height: "180px",
                        background: form.avatarPreview
                            ? "transparent"
                            : isDark
                              ? "#374151"
                              : "#f3f4f6",
                        border: `2px dashed ${form.avatarPreview ? "#16a34a" : border}`,
                    }}
                >
                    {form.avatarPreview ? (
                        <>
                            <img
                                src={form.avatarPreview}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <div
                                className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ background: "rgba(0,0,0,0.5)" }}
                            >
                                <i className="ri-edit-line text-white text-xl mb-1"></i>
                                <span className="text-white text-xs font-semibold">
                                    Change Photo
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5"
                                style={{
                                    background: isDark ? "#4b5563" : "#e5e7eb",
                                }}
                            >
                                <i
                                    className="ri-user-line text-2xl"
                                    style={{ color: textSecondary }}
                                ></i>
                            </div>
                            <p
                                className="text-xs font-semibold text-center px-3"
                                style={{ color: textSecondary }}
                            >
                                Click to upload
                            </p>
                            <p
                                className="text-xs mt-0.5"
                                style={{
                                    color: isDark ? "#6b7280" : "#9ca3af",
                                }}
                            >
                                JPG, PNG, GIF
                            </p>
                        </>
                    )}
                </div>
                {form.avatarPreview ? (
                    <button
                        onClick={() =>
                            setForm((f: any) => ({ ...f, avatarPreview: null }))
                        }
                        className="w-full py-2 rounded-xl text-xs font-semibold"
                        style={{ background: "#fee2e2", color: "#dc2626" }}
                    >
                        <i className="ri-delete-bin-line mr-1"></i>Remove Photo
                    </button>
                ) : (
                    <button
                        onClick={() => fileRef.current?.click()}
                        className="w-full py-2 rounded-xl text-xs font-semibold text-white"
                        style={{ background: "#16a34a" }}
                    >
                        <i className="ri-upload-2-line mr-1"></i>Browse Files
                    </button>
                )}
            </div>
        </div>
    );
}

// ── STEP 2: Location & Access ─────────────────────────────────────────────────
function StepLocationAccess({
    form,
    setForm,
    areas,
    isDark,
    border,
    textPrimary,
    textSecondary,
    inputBg,
}: any) {
    const [search, setSearch] = useState("");
    const [dropOpen, setDropOpen] = useState(false);
    const [fpEnabled, setFpEnabled] = useState(true);
    const [faceEnabled, setFaceEnabled] = useState(true);
    const dropRef = useRef<HTMLDivElement>(null);

    const selectedAreas: string[] = form.areas ?? [];
    const areaOptions: string[] = areas ?? [];
    const filtered = areaOptions.filter(
        (a: string) =>
            a.toLowerCase().includes(search.toLowerCase()) &&
            !selectedAreas.includes(a),
    );

    const addArea = (name: string) => {
        const updated = [...selectedAreas, name];
        setForm((f: any) => ({ ...f, areas: updated, area: updated[0] || "" }));
        setSearch("");
        setDropOpen(false);
    };
    const removeArea = (name: string) => {
        const updated = selectedAreas.filter((a: string) => a !== name);
        setForm((f: any) => ({ ...f, areas: updated, area: updated[0] || "" }));
    };

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (dropRef.current && !dropRef.current.contains(e.target as Node))
                setDropOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    const subBg = isDark ? "#374151" : "#f9fafb";
    const ls: React.CSSProperties = {
        color: textSecondary,
        fontSize: "11px",
        fontWeight: 600,
        marginBottom: "5px",
        display: "block",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    };

    return (
        <div className="flex gap-6 h-full">
            <div className="flex-1 min-w-0 space-y-3">
                <div>
                    <label style={ls}>
                        Attendance Locations{" "}
                        <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <p
                        className="text-xs mb-3"
                        style={{ color: textSecondary }}
                    >
                        Employee can punch from any assigned location
                    </p>

                    <div ref={dropRef} className="relative">
                        <div className="relative">
                            <i
                                className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-xs"
                                style={{ color: textSecondary }}
                            ></i>
                            <input
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setDropOpen(true);
                                }}
                                onFocus={() => setDropOpen(true)}
                                placeholder="Type to search locations..."
                                className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm outline-none"
                                style={{
                                    background: inputBg,
                                    border: `1px solid ${dropOpen ? "#16a34a" : border}`,
                                    color: textPrimary,
                                }}
                            />
                            {search && (
                                <button
                                    onClick={() => {
                                        setSearch("");
                                        setDropOpen(false);
                                    }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2"
                                    style={{ color: textSecondary }}
                                >
                                    <i className="ri-close-line text-sm"></i>
                                </button>
                            )}
                        </div>

                        {/* Dropdown - now expands DOWNWARD with better visibility */}
                        {dropOpen && (
                            <div
                                className="absolute left-0 right-0 z-50 rounded-xl overflow-hidden"
                                style={{
                                    top: "calc(100% + 8px)",
                                    background: isDark ? "#1f2937" : "#ffffff",
                                    border: `1px solid #16a34a`,
                                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                                    maxHeight: "280px",
                                    overflowY: "auto",
                                }}
                            >
                                {filtered.length === 0 ? (
                                    <div
                                        className="px-4 py-6 text-center"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-map-pin-off-line text-lg block mb-1"></i>
                                        <p className="text-xs">
                                            {search
                                                ? "No matching locations"
                                                : "All locations already assigned"}
                                        </p>
                                    </div>
                                ) : (
                                    filtered.map((area: string) => (
                                        <button
                                            key={area}
                                            onClick={() => addArea(area)}
                                            className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                                            style={{
                                                background: "transparent",
                                            }}
                                        >
                                            <i
                                                className="ri-map-pin-line text-sm"
                                                style={{ color: "#16a34a" }}
                                            ></i>
                                            <span
                                                className="text-sm flex-1"
                                                style={{ color: textPrimary }}
                                            >
                                                {area}
                                            </span>
                                            <span
                                                className="text-xs px-2 py-1 rounded-full font-medium"
                                                style={{
                                                    background: "#dcfce7",
                                                    color: "#16a34a",
                                                }}
                                            >
                                                Add
                                            </span>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Assigned list */}
                {selectedAreas.length === 0 ? (
                    <div
                        className="py-8 text-center rounded-2xl"
                        style={{
                            background: subBg,
                            border: `1px dashed ${border}`,
                        }}
                    >
                        <i
                            className="ri-map-pin-add-line text-2xl block mb-2"
                            style={{ color: textSecondary }}
                        ></i>
                        <p
                            className="text-xs font-medium"
                            style={{ color: textSecondary }}
                        >
                            No locations assigned yet
                        </p>
                        <p
                            className="text-xs mt-0.5"
                            style={{ color: isDark ? "#6b7280" : "#9ca3af" }}
                        >
                            Search above to add locations
                        </p>
                    </div>
                ) : (
                    <div
                        className="space-y-1.5 overflow-y-auto"
                        style={{ maxHeight: "220px" }}
                    >
                        {selectedAreas.map((area: string, i: number) => (
                            <div
                                key={area}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                                style={{
                                    background: subBg,
                                    border: `1px solid ${i === 0 ? "#bbf7d0" : border}`,
                                }}
                            >
                                <div
                                    className="w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                                    style={{
                                        background:
                                            i === 0
                                                ? "#16a34a"
                                                : isDark
                                                  ? "#4b5563"
                                                  : "#9ca3af",
                                    }}
                                >
                                    {i + 1}
                                </div>
                                <span
                                    className="text-sm flex-1 truncate"
                                    style={{ color: textPrimary }}
                                >
                                    {area}
                                </span>
                                {i === 0 && (
                                    <span
                                        className="text-xs px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
                                        style={{
                                            background: "#dcfce7",
                                            color: "#16a34a",
                                        }}
                                    >
                                        Primary
                                    </span>
                                )}
                                <button
                                    onClick={() => removeArea(area)}
                                    className="w-5 h-5 flex items-center justify-center rounded-md flex-shrink-0 hover:opacity-80"
                                    style={{
                                        background: "#fee2e2",
                                        color: "#dc2626",
                                    }}
                                >
                                    <i
                                        className="ri-close-line"
                                        style={{ fontSize: "10px" }}
                                    ></i>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div
                style={{ width: "210px", flexShrink: 0 }}
                className="space-y-3"
            >
                <div>
                    <label style={ls}>Auth Methods</label>
                    <p
                        className="text-xs mb-3"
                        style={{ color: textSecondary }}
                    >
                        Punch-in methods for this employee
                    </p>
                </div>
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ border: `1px solid ${border}` }}
                >
                    <div
                        className="flex items-center justify-between px-3.5 py-3.5"
                        style={{ borderBottom: `1px solid ${border}` }}
                    >
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: fpEnabled
                                        ? "#dcfce7"
                                        : isDark
                                          ? "#4b5563"
                                          : "#f3f4f6",
                                }}
                            >
                                <i
                                    className="ri-fingerprint-line text-sm"
                                    style={{
                                        color: fpEnabled
                                            ? "#16a34a"
                                            : textSecondary,
                                    }}
                                ></i>
                            </div>
                            <div>
                                <p
                                    className="text-xs font-semibold"
                                    style={{ color: textPrimary }}
                                >
                                    Fingerprint
                                </p>
                                <p
                                    className="text-xs"
                                    style={{
                                        color: fpEnabled
                                            ? "#16a34a"
                                            : textSecondary,
                                    }}
                                >
                                    {fpEnabled ? "Enabled" : "Disabled"}
                                </p>
                            </div>
                        </div>
                        <Toggle
                            enabled={fpEnabled}
                            onToggle={() => setFpEnabled(!fpEnabled)}
                            isDark={isDark}
                        />
                    </div>
                    <div className="flex items-center justify-between px-3.5 py-3.5">
                        <div className="flex items-center gap-2.5">
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: faceEnabled
                                        ? "#dbeafe"
                                        : isDark
                                          ? "#4b5563"
                                          : "#f3f4f6",
                                }}
                            >
                                <i
                                    className="ri-user-smile-line text-sm"
                                    style={{
                                        color: faceEnabled
                                            ? "#2563eb"
                                            : textSecondary,
                                    }}
                                ></i>
                            </div>
                            <div>
                                <p
                                    className="text-xs font-semibold"
                                    style={{ color: textPrimary }}
                                >
                                    Face ID
                                </p>
                                <p
                                    className="text-xs"
                                    style={{
                                        color: faceEnabled
                                            ? "#2563eb"
                                            : textSecondary,
                                    }}
                                >
                                    {faceEnabled ? "Enabled" : "Disabled"}
                                </p>
                            </div>
                        </div>
                        <Toggle
                            enabled={faceEnabled}
                            onToggle={() => setFaceEnabled(!faceEnabled)}
                            isDark={isDark}
                        />
                    </div>
                </div>

                {selectedAreas.length > 0 ? (
                    <div
                        className="px-3.5 py-3 rounded-xl"
                        style={{
                            background: isDark
                                ? "rgba(22,163,74,0.1)"
                                : "#f0fdf4",
                            border: "1px solid #bbf7d0",
                        }}
                    >
                        <p
                            className="text-xs font-semibold mb-1"
                            style={{ color: "#16a34a" }}
                        >
                            <i className="ri-shield-check-line mr-1"></i>Summary
                        </p>
                        <p
                            className="text-xs leading-relaxed"
                            style={{ color: textSecondary }}
                        >
                            {selectedAreas.length} location
                            {selectedAreas.length !== 1 ? "s" : ""}
                            <br />
                            {[
                                fpEnabled && "Fingerprint",
                                faceEnabled && "Face ID",
                            ]
                                .filter(Boolean)
                                .join(" · ") || "No auth methods"}
                        </p>
                    </div>
                ) : (
                    <div
                        className="px-3.5 py-3 rounded-xl"
                        style={{
                            background: "#fef9c3",
                            border: "1px solid #fde68a",
                        }}
                    >
                        <p
                            className="text-xs font-semibold"
                            style={{ color: "#92400e" }}
                        >
                            <i className="ri-error-warning-line mr-1"></i>No
                            locations
                        </p>
                        <p
                            className="text-xs mt-0.5"
                            style={{ color: "#a16207" }}
                        >
                            Assign at least one attendance location
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── STEP 3: Private Info ──────────────────────────────────────────────────────
function StepPrivate({
    form,
    setForm,
    isDark,
    border,
    textPrimary,
    textSecondary,
    inputBg,
}: any) {
    const ic =
        "w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-green-500";
    const is = {
        background: inputBg,
        border: `1px solid ${border}`,
        color: textPrimary,
    };
    const ls: React.CSSProperties = {
        color: textSecondary,
        fontSize: "11px",
        fontWeight: 600,
        marginBottom: "5px",
        display: "block",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
    };
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label style={ls}>Gender</label>
                    <select
                        value={form.gender || ""}
                        onChange={(e) =>
                            setForm((f: any) => ({
                                ...f,
                                gender: e.target.value,
                            }))
                        }
                        className={ic}
                        style={is}
                    >
                        <option value="">Select Gender</option>
                        {genders.map((g) => (
                            <option key={g} value={g}>
                                {g}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={ls}>Date of Birth</label>
                    <input
                        type="date"
                        value={form.dateOfBirth || ""}
                        onChange={(e) =>
                            setForm((f: any) => ({
                                ...f,
                                dateOfBirth: e.target.value,
                            }))
                        }
                        className={ic}
                        style={is}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label style={ls}>Email Address</label>
                    <input
                        type="email"
                        value={form.email || ""}
                        onChange={(e) =>
                            setForm((f: any) => ({
                                ...f,
                                email: e.target.value,
                            }))
                        }
                        placeholder="employee@company.com"
                        className={ic}
                        style={is}
                    />
                </div>
                <div>
                    <label style={ls}>Mobile Number</label>
                    <input
                        value={form.mobile || ""}
                        onChange={(e) =>
                            setForm((f: any) => ({
                                ...f,
                                mobile: e.target.value,
                            }))
                        }
                        placeholder="080XXXXXXXX"
                        className={ic}
                        style={is}
                    />
                </div>
            </div>
            <div>
                <label style={ls}>Employment Type</label>
                <select
                    value={form.employmentType || "Full-Time"}
                    onChange={(e) =>
                        setForm((f: any) => ({
                            ...f,
                            employmentType: e.target.value,
                        }))
                    }
                    className={ic}
                    style={is}
                >
                    {[
                        "Full-Time",
                        "Part-Time",
                        "Contract",
                        "Intern",
                        "Temporary",
                    ].map((t) => (
                        <option key={t} value={t}>
                            {t}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

// ── STEP 4: Biometrics ────────────────────────────────────────────────────────
function StepBiometrics({ isDark, border, textPrimary, textSecondary }: any) {
    const [fpStatus, setFpStatus] = useState<
        Record<number, "empty" | "captured" | "scanning">
    >({});
    const [faceStatus, setFaceStatus] = useState<"empty" | "captured">("empty");
    const [activeDevice, setActiveDevice] = useState<"usb" | "camera">("usb");
    const [showCamera, setShowCamera] = useState(false);
    const [usbConnected, setUsbConnected] = useState(false);

    useEffect(() => {
        let id: ReturnType<typeof setInterval>;
        const check = async () => {
            try {
                if ("hid" in navigator) {
                    const devs = await (navigator as any).hid.getDevices();
                    setUsbConnected(devs.length > 0);
                }
            } catch {
                setUsbConnected(false);
            }
        };
        check();
        id = setInterval(check, 3000);
        return () => clearInterval(id);
    }, []);

    const fingers = [
        { id: 1, label: "Right Thumb" },
        { id: 2, label: "Right Index" },
        { id: 3, label: "Right Middle" },
        { id: 4, label: "Right Ring" },
        { id: 5, label: "Right Little" },
        { id: 6, label: "Left Thumb" },
        { id: 7, label: "Left Index" },
        { id: 8, label: "Left Middle" },
        { id: 9, label: "Left Ring" },
        { id: 10, label: "Left Little" },
    ];

    const scan = (id: number) => {
        setFpStatus((p) => ({ ...p, [id]: "scanning" }));
        setTimeout(
            () => setFpStatus((p) => ({ ...p, [id]: "captured" })),
            2000,
        );
    };

    const subBg = isDark ? "#374151" : "#f9fafb";
    const captured = Object.values(fpStatus).filter(
        (s) => s === "captured",
    ).length;

    return (
        <>
            <CameraCaptureModal
                open={showCamera}
                onClose={() => setShowCamera(false)}
                onCapture={() => setFaceStatus("captured")}
                isDark={isDark}
                border={border}
            />
            <div className="space-y-3">
                <div
                    className="flex gap-1 p-1 rounded-xl"
                    style={{ background: isDark ? "#374151" : "#f3f4f6" }}
                >
                    {[
                        {
                            key: "usb",
                            label: "USB Fingerprint",
                            icon: "ri-usb-line",
                        },
                        {
                            key: "camera",
                            label: "Camera / Face",
                            icon: "ri-camera-line",
                        },
                    ].map((d) => (
                        <button
                            key={d.key}
                            onClick={() => setActiveDevice(d.key as any)}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
                            style={{
                                background:
                                    activeDevice === d.key
                                        ? isDark
                                            ? "#1f2937"
                                            : "#fff"
                                        : "transparent",
                                color:
                                    activeDevice === d.key
                                        ? textPrimary
                                        : textSecondary,
                                boxShadow:
                                    activeDevice === d.key
                                        ? "0 1px 4px rgba(0,0,0,0.1)"
                                        : "none",
                            }}
                        >
                            <i className={d.icon}></i>
                            {d.label}
                        </button>
                    ))}
                </div>

                {activeDevice === "usb" && (
                    <div className="space-y-3">
                        <div
                            className="flex items-center gap-3 px-4 py-3 rounded-xl"
                            style={{
                                background: usbConnected
                                    ? isDark
                                        ? "rgba(22,163,74,0.1)"
                                        : "#f0fdf4"
                                    : subBg,
                                border: `1px solid ${usbConnected ? "#bbf7d0" : border}`,
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background: usbConnected
                                        ? "#dcfce7"
                                        : isDark
                                          ? "#4b5563"
                                          : "#e5e7eb",
                                }}
                            >
                                <i
                                    className="ri-usb-line text-sm"
                                    style={{
                                        color: usbConnected
                                            ? "#16a34a"
                                            : "#9ca3af",
                                    }}
                                ></i>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p
                                    className="text-sm font-semibold"
                                    style={{ color: textPrimary }}
                                >
                                    ZKTeco USB Reader
                                </p>
                                <p
                                    className="text-xs"
                                    style={{
                                        color: usbConnected
                                            ? "#16a34a"
                                            : "#9ca3af",
                                    }}
                                >
                                    {usbConnected
                                        ? "Connected · Ready to scan"
                                        : "Not detected · Auto-scanning..."}
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                <div
                                    className={`w-2 h-2 rounded-full ${usbConnected ? "animate-pulse" : ""}`}
                                    style={{
                                        background: usbConnected
                                            ? "#16a34a"
                                            : "#d1d5db",
                                    }}
                                ></div>
                                <span
                                    className="text-xs font-semibold"
                                    style={{
                                        color: usbConnected
                                            ? "#16a34a"
                                            : "#9ca3af",
                                    }}
                                >
                                    {usbConnected
                                        ? "Connected"
                                        : "Disconnected"}
                                </span>
                            </div>
                        </div>

                        {!usbConnected ? (
                            <div
                                className="flex flex-col items-center justify-center py-10 rounded-2xl"
                                style={{
                                    background: subBg,
                                    border: `1px dashed ${border}`,
                                }}
                            >
                                <div
                                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                                    style={{
                                        background: isDark
                                            ? "#4b5563"
                                            : "#e5e7eb",
                                    }}
                                >
                                    <i
                                        className="ri-usb-line text-3xl"
                                        style={{ color: textSecondary }}
                                    ></i>
                                </div>
                                <p
                                    className="text-sm font-semibold mb-1"
                                    style={{ color: textPrimary }}
                                >
                                    No USB device detected
                                </p>
                                <p
                                    className="text-xs text-center px-6 mb-4"
                                    style={{ color: textSecondary }}
                                >
                                    Plug in a ZKTeco USB fingerprint reader and
                                    it will be detected automatically.
                                </p>
                                <div
                                    className="flex items-start gap-2 px-4 py-2.5 rounded-xl mx-4"
                                    style={{
                                        background: "#fef9c3",
                                        border: "1px solid #fde68a",
                                    }}
                                >
                                    <i
                                        className="ri-information-line text-sm mt-0.5 flex-shrink-0"
                                        style={{ color: "#d97706" }}
                                    ></i>
                                    <p
                                        className="text-xs"
                                        style={{ color: "#92400e" }}
                                    >
                                        Fingerprints can also be enrolled
                                        directly from a biometric device via
                                        Device Manager
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-3">
                                    {["RIGHT HAND", "LEFT HAND"].map(
                                        (hand, hi) => (
                                            <div key={hand}>
                                                <p
                                                    className="text-xs font-bold mb-2 text-center tracking-widest"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {hand}
                                                </p>
                                                <div className="space-y-1.5">
                                                    {fingers
                                                        .slice(
                                                            hi * 5,
                                                            hi * 5 + 5,
                                                        )
                                                        .map((f) => {
                                                            const s =
                                                                fpStatus[
                                                                    f.id
                                                                ] || "empty";
                                                            return (
                                                                <button
                                                                    key={f.id}
                                                                    onClick={() =>
                                                                        s !==
                                                                            "scanning" &&
                                                                        scan(
                                                                            f.id,
                                                                        )
                                                                    }
                                                                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all hover:opacity-80"
                                                                    style={{
                                                                        background:
                                                                            s ===
                                                                            "captured"
                                                                                ? "#dcfce7"
                                                                                : s ===
                                                                                    "scanning"
                                                                                  ? "#fef9c3"
                                                                                  : subBg,
                                                                        border: `1px solid ${s === "captured" ? "#16a34a" : s === "scanning" ? "#f59e0b" : border}`,
                                                                    }}
                                                                >
                                                                    <div
                                                                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                                                                        style={{
                                                                            background:
                                                                                s ===
                                                                                "captured"
                                                                                    ? "#16a34a"
                                                                                    : s ===
                                                                                        "scanning"
                                                                                      ? "#f59e0b"
                                                                                      : isDark
                                                                                        ? "#4b5563"
                                                                                        : "#e5e7eb",
                                                                        }}
                                                                    >
                                                                        {s ===
                                                                        "scanning" ? (
                                                                            <i className="ri-loader-4-line text-white text-xs animate-spin"></i>
                                                                        ) : (
                                                                            <i
                                                                                className="ri-fingerprint-line text-xs"
                                                                                style={{
                                                                                    color:
                                                                                        s ===
                                                                                        "captured"
                                                                                            ? "#fff"
                                                                                            : textSecondary,
                                                                                }}
                                                                            ></i>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0 text-left">
                                                                        <p
                                                                            className="text-xs font-medium truncate"
                                                                            style={{
                                                                                color: textPrimary,
                                                                            }}
                                                                        >
                                                                            {
                                                                                f.label
                                                                            }
                                                                        </p>
                                                                        <p
                                                                            className="text-xs"
                                                                            style={{
                                                                                color:
                                                                                    s ===
                                                                                    "captured"
                                                                                        ? "#16a34a"
                                                                                        : s ===
                                                                                            "scanning"
                                                                                          ? "#f59e0b"
                                                                                          : textSecondary,
                                                                            }}
                                                                        >
                                                                            {s ===
                                                                            "captured"
                                                                                ? "Captured"
                                                                                : s ===
                                                                                    "scanning"
                                                                                  ? "Scanning..."
                                                                                  : "Tap to scan"}
                                                                        </p>
                                                                    </div>
                                                                    {s ===
                                                                        "captured" && (
                                                                        <i
                                                                            className="ri-checkbox-circle-line text-xs flex-shrink-0"
                                                                            style={{
                                                                                color: "#16a34a",
                                                                            }}
                                                                        ></i>
                                                                    )}
                                                                </button>
                                                            );
                                                        })}
                                                </div>
                                            </div>
                                        ),
                                    )}
                                </div>
                                <div
                                    className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                                    style={{
                                        background: subBg,
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    <span
                                        className="text-xs"
                                        style={{ color: textSecondary }}
                                    >
                                        {captured} / 10 fingers captured
                                    </span>
                                    <button
                                        onClick={() => setFpStatus({})}
                                        className="text-xs font-semibold hover:opacity-70"
                                        style={{ color: "#dc2626" }}
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeDevice === "camera" && (
                    <div className="space-y-3">
                        <div
                            className="flex items-center gap-3 p-3 rounded-xl"
                            style={{
                                background: subBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center"
                                style={{ background: "#f3f4f6" }}
                            >
                                <i
                                    className="ri-camera-line text-sm"
                                    style={{ color: "#9ca3af" }}
                                ></i>
                            </div>
                            <div>
                                <p
                                    className="text-sm font-semibold"
                                    style={{ color: textPrimary }}
                                >
                                    Webcam / USB Camera
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: "#9ca3af" }}
                                >
                                    Click below to open the face capture dialog
                                </p>
                            </div>
                        </div>
                        <div
                            className="p-4 rounded-2xl flex items-center gap-4"
                            style={{
                                background: subBg,
                                border: `1px solid ${faceStatus === "captured" ? "#16a34a" : border}`,
                            }}
                        >
                            <div
                                className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{
                                    background:
                                        faceStatus === "captured"
                                            ? "#dcfce7"
                                            : isDark
                                              ? "#4b5563"
                                              : "#e5e7eb",
                                }}
                            >
                                <i
                                    className={`${faceStatus === "captured" ? "ri-user-smile-line" : "ri-user-line"} text-2xl`}
                                    style={{
                                        color:
                                            faceStatus === "captured"
                                                ? "#16a34a"
                                                : textSecondary,
                                    }}
                                ></i>
                            </div>
                            <div className="flex-1">
                                <p
                                    className="text-sm font-semibold"
                                    style={{ color: textPrimary }}
                                >
                                    Face Template
                                </p>
                                <p
                                    className="text-xs mt-0.5"
                                    style={{
                                        color:
                                            faceStatus === "captured"
                                                ? "#16a34a"
                                                : textSecondary,
                                    }}
                                >
                                    {faceStatus === "captured"
                                        ? "Template captured and ready to save"
                                        : "No face template captured yet"}
                                </p>
                                {faceStatus === "captured" && (
                                    <button
                                        onClick={() => setFaceStatus("empty")}
                                        className="text-xs mt-1 hover:opacity-70"
                                        style={{ color: "#dc2626" }}
                                    >
                                        <i className="ri-delete-bin-line mr-0.5"></i>
                                        Remove
                                    </button>
                                )}
                            </div>
                            {faceStatus === "captured" && (
                                <i
                                    className="ri-checkbox-circle-line text-xl"
                                    style={{ color: "#16a34a" }}
                                ></i>
                            )}
                        </div>
                        <button
                            onClick={() => setShowCamera(true)}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                            style={{
                                background:
                                    faceStatus === "captured"
                                        ? "#0891b2"
                                        : "#16a34a",
                            }}
                        >
                            <i
                                className={
                                    faceStatus === "captured"
                                        ? "ri-refresh-line"
                                        : "ri-camera-line"
                                }
                            ></i>
                            {faceStatus === "captured"
                                ? "Re-capture Face"
                                : "Open Camera to Capture Face"}
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

// ── MAIN MODAL ────────────────────────────────────────────────────────────────
export default function EmployeeModal({
    open,
    onClose,
    onSave,
    editEmployee,
    departments,
    positions,
    areas,
}: EmployeeModalProps) {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [form, setForm] = useState<Partial<any>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [generatingId, setGeneratingId] = useState(false);

    const bg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const inputBg = isDark ? "#374151" : "#f9fafb";

    // Generate employee ID from backend
    const generateEmployeeId = async () => {
        setGeneratingId(true);
        try {
            const response = await axios.get("/employees/generate-id");
            if (response.data.success) {
                setForm((f: any) => ({
                    ...f,
                    employeeId: response.data.employee_id,
                }));
                showToast(
                    "success",
                    "ID Generated",
                    `Employee ID: ${response.data.employee_id}`,
                );
            }
        } catch (error) {
            showToast(
                "error",
                "Generation Failed",
                "Could not generate employee ID",
            );
        } finally {
            setGeneratingId(false);
        }
    };

    useEffect(() => {
        if (open) {
            setCurrentStep(1);
            setIsSaving(false);
            if (editEmployee) {
                setForm({
                    ...editEmployee,
                    id: editEmployee.id,
                    department:
                        editEmployee.department === "-"
                            ? ""
                            : (editEmployee.department ?? ""),
                    position:
                        editEmployee.position === "-"
                            ? ""
                            : (editEmployee.position ?? ""),
                    area:
                        editEmployee.area === "-"
                            ? ""
                            : (editEmployee.area ?? ""),
                    areas:
                        editEmployee.area && editEmployee.area !== "-"
                            ? editEmployee.area
                                  .split(",")
                                  .map((a: string) => a.trim())
                                  .filter(Boolean)
                            : [],
                    dateOfBirth: editEmployee.dateOfBirth || "",
                    employeeType: editEmployee.employeeType || "Official",
                });
            } else {
                setForm({
                    employeeId: "",
                    firstName: "",
                    lastName: "",
                    department: "",
                    position: "",
                    area: "",
                    areas: [],
                    employmentType: "Full-Time",
                    employeeType: "Official",
                    hiredDate: new Date().toISOString().split("T")[0],
                    dateOfBirth: "",
                    gender: "",
                    email: "",
                    mobile: "",
                    status: "active",
                });
                generateEmployeeId();
            }
        }
    }, [open, editEmployee]);

    if (!open) return null;

    const handleSave = () => {
        // Validate
        if (!form.employeeId || !/^\d+$/.test(form.employeeId)) {
            showToast(
                "error",
                "Validation Error",
                "Employee ID must contain only digits",
            );
            return;
        }
        if (!form.firstName) {
            showToast("error", "Validation Error", "First name is required");
            return;
        }
        if (!form.department) {
            showToast("error", "Validation Error", "Department is required");
            return;
        }
        const selectedAreas = form.areas ?? [];
        if (selectedAreas.length === 0) {
            showToast(
                "error",
                "Validation Error",
                "At least one attendance location is required",
            );
            return;
        }

        setIsSaving(true);
        setTimeout(() => {
            onSave({ ...form, area: selectedAreas[0] || form.area || "" });
            setIsSaving(false);
            onClose();
        }, 1800);
    };

    const sp = {
        form,
        setForm,
        isDark,
        border,
        textPrimary,
        textSecondary,
        inputBg,
        departments,
        positions,
        areas,
        generatingId,
        generateEmployeeId,
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{
                background: "rgba(0,0,0,0.6)",
                backdropFilter: "blur(3px)",
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !isSaving) onClose();
            }}
        >
            <div
                className="w-full rounded-t-3xl sm:rounded-2xl flex flex-col relative overflow-hidden"
                style={{
                    background: bg,
                    border: `1px solid ${border}`,
                    maxWidth: "920px",
                    height: "min(700px, 95dvh)",
                    boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
                }}
            >
                {isSaving && <SavingOverlay isDark={isDark} />}

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-2 flex-shrink-0">
                    <div>
                        <h2
                            className="text-base font-bold"
                            style={{ color: textPrimary }}
                        >
                            {editEmployee ? "Edit Employee" : "New Employee"}
                        </h2>
                        <p
                            className="text-xs mt-0.5"
                            style={{ color: textSecondary }}
                        >
                            Step {currentStep} of {STEPS.length} ·{" "}
                            {STEPS[currentStep - 1].label}
                        </p>
                    </div>
                    <button
                        onClick={() => !isSaving && onClose()}
                        className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer hover:opacity-80"
                        style={{
                            color: textSecondary,
                            background: isDark ? "#374151" : "#f3f4f6",
                        }}
                    >
                        <i className="ri-close-line text-lg"></i>
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 pt-2 pb-3 flex-shrink-0">
                    <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{ background: isDark ? "#374151" : "#e5e7eb" }}
                    >
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${(currentStep / STEPS.length) * 100}%`,
                                background:
                                    "linear-gradient(90deg,#16a34a,#22c55e)",
                            }}
                        ></div>
                    </div>
                </div>

                {/* Step Buttons */}
                <div className="px-6 pb-2 flex-shrink-0">
                    <div className="flex gap-2">
                        {STEPS.map((step) => {
                            const isActive = step.id === currentStep;
                            const isDone = step.id < currentStep;
                            return (
                                <button
                                    key={step.id}
                                    onClick={() =>
                                        !isSaving && setCurrentStep(step.id)
                                    }
                                    disabled={isSaving}
                                    className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap cursor-pointer transition-all flex-1"
                                    style={{
                                        background: isActive
                                            ? "#16a34a"
                                            : isDone
                                              ? isDark
                                                  ? "rgba(22,163,74,0.15)"
                                                  : "#f0fdf4"
                                              : isDark
                                                ? "#374151"
                                                : "#f3f4f6",
                                        color: isActive
                                            ? "#fff"
                                            : isDone
                                              ? "#16a34a"
                                              : textSecondary,
                                        border: `1px solid ${isActive ? "transparent" : isDone ? "#bbf7d0" : border}`,
                                    }}
                                >
                                    <i
                                        className={`${isDone ? "ri-check-line" : step.icon} text-xs`}
                                    ></i>
                                    <span className="hidden sm:inline">
                                        {step.label}
                                    </span>
                                    <span className="sm:hidden">
                                        {step.mobileLabel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content - with proper centering and spacing */}
                <div
                    className="flex-1 overflow-y-auto px-6 py-4"
                    style={{ minHeight: 0 }}
                >
                    {currentStep === 1 && <StepIdentity {...sp} />}
                    {currentStep === 2 && <StepLocationAccess {...sp} />}
                    {currentStep === 3 && <StepPrivate {...sp} />}
                    {currentStep === 4 && <StepBiometrics {...sp} />}
                </div>

                {/* Footer */}
                <div
                    className="flex-shrink-0 px-6 py-4 flex items-center justify-between gap-3"
                    style={{
                        borderTop: `1px solid ${border}`,
                        background: isDark ? "#1f2937" : "#fafafa",
                    }}
                >
                    <button
                        onClick={() =>
                            currentStep > 1 &&
                            !isSaving &&
                            setCurrentStep((s) => s - 1)
                        }
                        disabled={currentStep === 1 || isSaving}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-80"
                        style={{
                            background: isDark ? "#374151" : "#f3f4f6",
                            color: textSecondary,
                        }}
                    >
                        <i className="ri-arrow-left-line text-sm"></i>Back
                    </button>

                    <div className="flex items-center gap-1.5">
                        {STEPS.map((s) => (
                            <button
                                key={s.id}
                                onClick={() =>
                                    !isSaving && setCurrentStep(s.id)
                                }
                                className="rounded-full transition-all cursor-pointer"
                                style={{
                                    width:
                                        s.id === currentStep ? "22px" : "7px",
                                    height: "7px",
                                    background:
                                        s.id === currentStep
                                            ? "#16a34a"
                                            : s.id < currentStep
                                              ? "#86efac"
                                              : isDark
                                                ? "#4b5563"
                                                : "#d1d5db",
                                }}
                            ></button>
                        ))}
                    </div>

                    {currentStep === STEPS.length ? (
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer transition-all hover:opacity-90 disabled:opacity-60"
                            style={{
                                background:
                                    "linear-gradient(135deg,#16a34a,#15803d)",
                                boxShadow: "0 4px 12px rgba(22,163,74,0.3)",
                            }}
                        >
                            {isSaving ? (
                                <>
                                    <i className="ri-loader-4-line animate-spin text-sm"></i>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <i className="ri-check-double-line text-sm"></i>
                                    {editEmployee
                                        ? "Save Changes"
                                        : "Add Employee"}
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() =>
                                !isSaving && setCurrentStep((s) => s + 1)
                            }
                            disabled={isSaving}
                            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer transition-all hover:opacity-90"
                            style={{ background: "#16a34a" }}
                        >
                            Continue
                            <i className="ri-arrow-right-line text-sm"></i>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
