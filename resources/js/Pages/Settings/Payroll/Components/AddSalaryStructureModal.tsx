// js/Pages/Settings/Payroll/Components/AddSalaryStructureModal.tsx
import { useEffect, useState } from "react";
import { router } from "@inertiajs/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";

interface SalaryComponentOption {
    id: number;
    name: string;
    code: string;
    type: "allowance" | "deduction";
    calculation_type: "fixed" | "percentage";
    default_value: number | null;
}

interface SelectedComponent {
    salary_component_id: number;
    calculation_type: "fixed" | "percentage";
    value: number;
    name?: string;
    type?: "allowance" | "deduction";
}

interface AddSalaryStructureModalProps {
    isOpen: boolean;
    onClose: () => void;
    components?: SalaryComponentOption[];
    editData?: any | null;
}

export default function AddSalaryStructureModal({
    isOpen,
    onClose,
    components = [],
    editData = null,
}: AddSalaryStructureModalProps) {
    const { isDark } = useTheme();
    const { showToast } = useToast();

    const [form, setForm] = useState({
        name: "",
        code: "",
        description: "",
        basic_salary_min: 0,
        basic_salary_max: 0,
    });

    const [selectedComponents, setSelectedComponents] = useState<
        SelectedComponent[]
    >([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Custom component state
    const [newCompName, setNewCompName] = useState("");
    const [newCompType, setNewCompType] = useState<"allowance" | "deduction">(
        "allowance",
    );
    const [newCompCalcType, setNewCompCalcType] = useState<
        "fixed" | "percentage"
    >("fixed");
    const [newCompValue, setNewCompValue] = useState<number>(0);
    const [componentIdSeed, setComponentIdSeed] = useState(1000000);

    const isEditMode = !!editData;
    const submitUrl = isEditMode
        ? `/settings/payroll/structures/${editData.id}`
        : "/settings/payroll/structures";

    // Theme colors
    const bg = isDark ? "#0f172a" : "#f8fafc";
    const cardBg = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#334155" : "#e2e8f0";
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";
    const inputBg = isDark ? "#1e293b" : "#f8fafc";
    const hoverBg = isDark ? "#1e293b" : "#f1f5f9";

    // Initialize form for edit mode
    useEffect(() => {
        if (isOpen) {
            if (editData) {
                setForm({
                    name: editData.name || "",
                    code: editData.code || "",
                    description: editData.description || "",
                    basic_salary_min: editData.basic_salary_min || 0,
                    basic_salary_max: editData.basic_salary_max || 0,
                });
                fetchExistingComponents(editData.id);
            } else {
                setForm({
                    name: "",
                    code: "",
                    description: "",
                    basic_salary_min: 0,
                    basic_salary_max: 0,
                });
                setSelectedComponents([]);
            }
        }
    }, [isOpen, editData]);

    const fetchExistingComponents = async (structureId: number) => {
        try {
            const response = await fetch(
                `/settings/payroll/structures/${structureId}`,
                {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                },
            );
            const data = await response.json();
            if (data.components) {
                setSelectedComponents(
                    data.components.map((c: any) => ({
                        salary_component_id: c.id,
                        calculation_type: c.calculation_type,
                        value: c.value,
                        name: c.name,
                        type: c.type || "allowance",
                    })),
                );
            }
        } catch (error) {
            console.error("Failed to fetch components:", error);
        }
    };

    if (!isOpen) return null;

    const addComponent = (component: SalaryComponentOption) => {
        if (
            selectedComponents.find(
                (c) => c.salary_component_id === component.id,
            )
        ) {
            showToast(
                "error",
                "Already Added",
                `${component.name} is already added`,
            );
            return;
        }
        setSelectedComponents([
            ...selectedComponents,
            {
                salary_component_id: component.id,
                calculation_type: component.calculation_type,
                value: component.default_value || 0,
                name: component.name,
                type: component.type, // Make sure type is included
            },
        ]);
    };

    const addCustomComponent = () => {
        const trimmedName = newCompName.trim();
        if (!trimmedName) {
            showToast("error", "Validation", "Component name required");
            return;
        }
        if (
            selectedComponents.find(
                (c) => c.name?.toLowerCase() === trimmedName.toLowerCase(),
            )
        ) {
            showToast(
                "error",
                "Already Added",
                `${trimmedName} is already added`,
            );
            return;
        }
        setSelectedComponents([
            ...selectedComponents,
            {
                salary_component_id: componentIdSeed,
                calculation_type: newCompCalcType,
                value: newCompValue,
                name: trimmedName,
                type: newCompType,
            },
        ]);
        setComponentIdSeed((prev) => prev + 1);
        setNewCompName("");
        setNewCompValue(0);
    };

    const removeComponent = (index: number) => {
        setSelectedComponents((prev) => prev.filter((_, i) => i !== index));
    };

    const updateComponentValue = (index: number, field: string, value: any) => {
        setSelectedComponents((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const handleSubmit = () => {
        if (!form.name || !form.code) {
            showToast("error", "Required Fields", "Name and code are required");
            return;
        }

        setIsSubmitting(true);

        // Clean components data before sending
        const cleanComponents = selectedComponents.map((comp) => ({
            salary_component_id: comp.salary_component_id,
            calculation_type: comp.calculation_type,
            value: comp.value,
            name: comp.name,
            type: comp.type || "allowance",
        }));

        const payload = { ...form, components: cleanComponents };

        router[isEditMode ? "put" : "post"](submitUrl, payload, {
            onSuccess: () => {
                showToast(
                    "success",
                    isEditMode ? "Updated" : "Created",
                    `Salary structure ${isEditMode ? "updated" : "created"} successfully`,
                );
                setIsSubmitting(false);
                onClose();
            },
            onError: (errors: any) => {
                showToast(
                    "error",
                    "Error",
                    errors?.message || "Failed to save structure",
                );
                setIsSubmitting(false);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Get total allowances and deductions
    const totalAllowances = selectedComponents
        .filter((c) => (c.type || "allowance") === "allowance")
        .reduce(
            (sum, c) =>
                sum + (c.calculation_type === "percentage" ? 0 : c.value),
            0,
        );

    const totalDeductions = selectedComponents
        .filter((c) => c.type === "deduction")
        .reduce(
            (sum, c) =>
                sum + (c.calculation_type === "percentage" ? 0 : c.value),
            0,
        );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
                style={{ background: cardBg }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Sticky Header */}
                <div
                    className="sticky top-0 z-10 px-6 pt-6 pb-4 border-b"
                    style={{ background: cardBg, borderColor: border }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                            <i className="ri-stack-line text-xl text-green-600"></i>
                        </div>
                        <div>
                            <h2
                                className="text-lg font-bold"
                                style={{ color: textPrimary }}
                            >
                                {isEditMode ? "Edit" : "Add"} Salary Structure
                            </h2>
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: textSecondary }}
                            >
                                {isEditMode ? "Modify" : "Define a new"} grade
                                level with salary range and components
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                className="text-xs font-medium mb-1.5 block"
                                style={{ color: textSecondary }}
                            >
                                Structure Name{" "}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.name}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        name: e.target.value,
                                    }))
                                }
                                placeholder="e.g., Grade Level 1"
                                className="w-full px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20"
                                style={{
                                    background: inputBg,
                                    border: `1px solid ${border}`,
                                    color: textPrimary,
                                }}
                            />
                        </div>
                        <div>
                            <label
                                className="text-xs font-medium mb-1.5 block"
                                style={{ color: textSecondary }}
                            >
                                Code <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.code}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        code: e.target.value.toUpperCase(),
                                    }))
                                }
                                placeholder="e.g., GL01"
                                className="w-full px-4 py-3 rounded-xl text-sm uppercase focus:ring-2 focus:ring-green-500/20"
                                style={{
                                    background: inputBg,
                                    border: `1px solid ${border}`,
                                    color: textPrimary,
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            className="text-xs font-medium mb-1.5 block"
                            style={{ color: textSecondary }}
                        >
                            Description
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm((p) => ({
                                    ...p,
                                    description: e.target.value,
                                }))
                            }
                            rows={2}
                            placeholder="Optional description..."
                            className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        />
                    </div>

                    {/* Salary Range */}
                    <div>
                        <label
                            className="text-xs font-medium mb-2 block"
                            style={{ color: textSecondary }}
                        >
                            Salary Range
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label
                                    className="text-xs mb-1 block"
                                    style={{ color: textSecondary }}
                                >
                                    Minimum (₦)
                                </label>
                                <input
                                    type="number"
                                    value={form.basic_salary_min || ""}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            basic_salary_min:
                                                parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                    className="w-full px-4 py-3 rounded-xl text-sm"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                />
                            </div>
                            <div>
                                <label
                                    className="text-xs mb-1 block"
                                    style={{ color: textSecondary }}
                                >
                                    Maximum (₦)
                                </label>
                                <input
                                    type="number"
                                    value={form.basic_salary_max || ""}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            basic_salary_max:
                                                parseFloat(e.target.value) || 0,
                                        }))
                                    }
                                    className="w-full px-4 py-3 rounded-xl text-sm"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Components */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <label
                                className="text-sm font-semibold"
                                style={{ color: textPrimary }}
                            >
                                Salary Components
                            </label>
                            <span
                                className="text-xs px-2.5 py-1 rounded-full font-medium"
                                style={{
                                    background: isDark ? "#334155" : "#e2e8f0",
                                    color: textSecondary,
                                }}
                            >
                                {selectedComponents.length} selected
                            </span>
                        </div>

                        {/* Add Component Selector */}
                        <div
                            className="mb-4 p-4 rounded-xl"
                            style={{
                                background: bg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <p
                                className="text-xs font-medium mb-3"
                                style={{ color: textSecondary }}
                            >
                                Select from preset components:
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {components.map((comp) => {
                                    const isSelected = selectedComponents.some(
                                        (c) =>
                                            c.salary_component_id === comp.id,
                                    );
                                    return (
                                        <button
                                            key={comp.id}
                                            onClick={() => addComponent(comp)}
                                            disabled={isSelected}
                                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                                isSelected
                                                    ? "opacity-40 cursor-not-allowed"
                                                    : "hover:scale-105"
                                            } ${
                                                comp.type === "allowance"
                                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/40"
                                                    : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-900/40"
                                            }`}
                                        >
                                            <i
                                                className={`${comp.type === "allowance" ? "ri-add-circle-fill text-emerald-500" : "ri-subtract-fill text-rose-500"} text-xs`}
                                            ></i>
                                            {comp.name}
                                            {isSelected && (
                                                <i className="ri-check-line ml-1"></i>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Divider */}
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className="flex-1 h-px"
                                    style={{ background: border }}
                                ></div>
                                <span
                                    className="text-xs font-medium"
                                    style={{ color: textSecondary }}
                                >
                                    OR CREATE CUSTOM
                                </span>
                                <div
                                    className="flex-1 h-px"
                                    style={{ background: border }}
                                ></div>
                            </div>

                            {/* Custom Component Input */}
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={newCompName}
                                    onChange={(e) =>
                                        setNewCompName(e.target.value)
                                    }
                                    placeholder="Component name"
                                    className="flex-1 px-3 py-2.5 rounded-lg text-sm"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                />
                                <select
                                    value={newCompType}
                                    onChange={(e) =>
                                        setNewCompType(e.target.value as any)
                                    }
                                    className="px-3 py-2.5 rounded-lg text-sm min-w-[110px]"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                >
                                    <option value="allowance">
                                        💰 Allowance
                                    </option>
                                    <option value="deduction">
                                        📤 Deduction
                                    </option>
                                </select>
                                <select
                                    value={newCompCalcType}
                                    onChange={(e) =>
                                        setNewCompCalcType(
                                            e.target.value as any,
                                        )
                                    }
                                    className="px-3 py-2.5 rounded-lg text-sm min-w-[110px]"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                >
                                    <option value="fixed">Fixed (₦)</option>
                                    <option value="percentage">
                                        Percentage (%)
                                    </option>
                                </select>
                                <input
                                    type="number"
                                    value={newCompValue || ""}
                                    onChange={(e) =>
                                        setNewCompValue(
                                            parseFloat(e.target.value) || 0,
                                        )
                                    }
                                    placeholder={
                                        newCompCalcType === "percentage"
                                            ? "5%"
                                            : "5000₦"
                                    }
                                    className="w-28 px-3 py-2.5 rounded-lg text-sm"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                />
                                <button
                                    onClick={addCustomComponent}
                                    className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all shadow-sm whitespace-nowrap"
                                >
                                    <i className="ri-add-line mr-1"></i> Add
                                </button>
                            </div>
                        </div>

                        {/* Selected Components List */}
                        {selectedComponents.length > 0 && (
                            <div className="space-y-2">
                                {selectedComponents.map((comp, idx) => {
                                    const isAllowance =
                                        (comp.type || "allowance") ===
                                        "allowance";
                                    return (
                                        <div
                                            key={idx}
                                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl transition-colors hover:shadow-sm"
                                            style={{
                                                background: inputBg,
                                                border: `1px solid ${border}`,
                                                borderLeft: `4px solid ${isAllowance ? "#10b981" : "#ef4444"}`,
                                            }}
                                        >
                                            {/* Component Info */}
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div
                                                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                        isAllowance
                                                            ? "bg-emerald-100 dark:bg-emerald-900/30"
                                                            : "bg-rose-100 dark:bg-rose-900/30"
                                                    }`}
                                                >
                                                    <i
                                                        className={`${
                                                            isAllowance
                                                                ? "ri-add-circle-fill text-emerald-600 dark:text-emerald-400"
                                                                : "ri-subtract-fill text-rose-600 dark:text-rose-400"
                                                        } text-lg`}
                                                    ></i>
                                                </div>
                                                <div className="min-w-0">
                                                    <p
                                                        className="text-sm font-semibold truncate"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {comp.name}
                                                    </p>
                                                    <p
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {isAllowance
                                                            ? "Allowance"
                                                            : "Deduction"}{" "}
                                                        ·{" "}
                                                        {comp.calculation_type ===
                                                        "percentage"
                                                            ? "Percentage of basic"
                                                            : "Fixed amount"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Controls */}
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <select
                                                    value={
                                                        comp.calculation_type
                                                    }
                                                    onChange={(e) =>
                                                        updateComponentValue(
                                                            idx,
                                                            "calculation_type",
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="px-3 py-2 rounded-lg text-xs font-medium"
                                                    style={{
                                                        background: cardBg,
                                                        border: `1px solid ${border}`,
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    <option value="fixed">
                                                        Fixed (₦)
                                                    </option>
                                                    <option value="percentage">
                                                        Percentage (%)
                                                    </option>
                                                </select>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={comp.value}
                                                        onChange={(e) =>
                                                            updateComponentValue(
                                                                idx,
                                                                "value",
                                                                parseFloat(
                                                                    e.target
                                                                        .value,
                                                                ) || 0,
                                                            )
                                                        }
                                                        className="w-28 px-3 py-2 rounded-lg text-sm font-medium"
                                                        style={{
                                                            background: cardBg,
                                                            border: `1px solid ${border}`,
                                                            color: isAllowance
                                                                ? "#10b981"
                                                                : "#ef4444",
                                                        }}
                                                        min="0"
                                                    />
                                                    <span
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {comp.calculation_type ===
                                                        "percentage"
                                                            ? "%"
                                                            : "₦"}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        removeComponent(idx)
                                                    }
                                                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                                                    style={{ color: "#ef4444" }}
                                                    title="Remove component"
                                                >
                                                    <i className="ri-delete-bin-line"></i>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Summary */}
                                <div
                                    className="flex items-center gap-4 p-4 rounded-xl mt-2"
                                    style={{
                                        background: isDark
                                            ? "#0f172a"
                                            : "#f0fdf4",
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                        <span
                                            className="text-xs font-medium"
                                            style={{ color: textSecondary }}
                                        >
                                            Allowances:{" "}
                                            <span
                                                className="font-bold"
                                                style={{ color: "#10b981" }}
                                            >
                                                ₦
                                                {totalAllowances.toLocaleString()}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                        <span
                                            className="text-xs font-medium"
                                            style={{ color: textSecondary }}
                                        >
                                            Deductions:{" "}
                                            <span
                                                className="font-bold"
                                                style={{ color: "#ef4444" }}
                                            >
                                                ₦
                                                {totalDeductions.toLocaleString()}
                                            </span>
                                        </span>
                                    </div>
                                    <div className="flex-1"></div>
                                    <span
                                        className="text-xs font-bold"
                                        style={{ color: textPrimary }}
                                    >
                                        Net Impact:{" "}
                                        <span
                                            style={{
                                                color:
                                                    totalAllowances -
                                                        totalDeductions >=
                                                    0
                                                        ? "#10b981"
                                                        : "#ef4444",
                                            }}
                                        >
                                            ₦
                                            {(
                                                totalAllowances -
                                                totalDeductions
                                            ).toLocaleString()}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {selectedComponents.length === 0 && (
                            <div
                                className="py-8 text-center rounded-xl border-2 border-dashed"
                                style={{ borderColor: border }}
                            >
                                <div
                                    className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                                    style={{
                                        background: isDark
                                            ? "#334155"
                                            : "#f1f5f9",
                                    }}
                                >
                                    <i
                                        className="ri-stack-line text-xl"
                                        style={{ color: textSecondary }}
                                    ></i>
                                </div>
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: textSecondary }}
                                >
                                    No components added yet
                                </p>
                                <p
                                    className="text-xs mt-1"
                                    style={{ color: textSecondary }}
                                >
                                    Add preset components or create custom ones
                                    above
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="sticky bottom-0 px-6 pb-6 pt-4 border-t flex items-center gap-3"
                    style={{ background: cardBg, borderColor: border }}
                >
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors hover:opacity-80"
                        style={{
                            background: isDark ? "#334155" : "#f1f5f9",
                            color: textSecondary,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg"
                        style={{
                            background:
                                "linear-gradient(135deg, #16a34a, #15803d)",
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <i className="ri-loader-4-line animate-spin"></i>{" "}
                                Saving...
                            </>
                        ) : (
                            <>
                                <i className="ri-check-line"></i>{" "}
                                {isEditMode ? "Update" : "Create"} Structure
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
