import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface StructureComponent {
    id: number;
    name: string;
    code: string;
    type: "allowance" | "deduction";
    calculation_type: "fixed" | "percentage";
    value: number;
    is_active: boolean;
}

interface SalaryStructure {
    id: number;
    name: string;
    code: string;
    description: string | null;
    basic_salary_min: number;
    basic_salary_max: number;
    is_active: boolean;
    components_count?: number;
    employees_count?: number;
}

interface ViewSalaryStructureModalProps {
    isOpen: boolean;
    onClose: () => void;
    structure: SalaryStructure | null;
}

export default function ViewSalaryStructureModal({
    isOpen,
    onClose,
    structure,
}: ViewSalaryStructureModalProps) {
    const { isDark } = useTheme();
    const [loading, setLoading] = useState(false);
    const [components, setComponents] = useState<StructureComponent[]>([]);

    const cardBg = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#334155" : "#e2e8f0";
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";

    useEffect(() => {
        if (isOpen && structure) {
            fetchComponents();
        }
    }, [isOpen, structure]);

    const fetchComponents = async () => {
        if (!structure) return;
        setLoading(true);
        try {
            const response = await fetch(
                `/settings/payroll/structures/${structure.id}`,
                {
                    headers: {
                        Accept: "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                },
            );
            const data = await response.json();
            setComponents(data.components || []);
        } catch (error) {
            console.error("Failed to fetch components:", error);
        }
        setLoading(false);
    };

    if (!isOpen || !structure) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const totalAllowances = components
    .filter((c) => c.type === "allowance")
    .reduce((sum, c) => {
        return c.calculation_type === "percentage" ? sum : sum + c.value;
    }, 0);

    const totalDeductions = components
    .filter((c) => c.type === "deduction")
    .reduce((sum, c) => {
        return c.calculation_type === "percentage" ? sum : sum + c.value;
    }, 0);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl"
                style={{ background: cardBg }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="sticky top-0 z-10 px-6 pt-6 pb-4 border-b"
                    style={{ background: cardBg, borderColor: border }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                                <i className="ri-stack-line text-xl text-blue-600"></i>
                            </div>
                            <div>
                                <h2
                                    className="text-lg font-bold"
                                    style={{ color: textPrimary }}
                                >
                                    {structure.name}
                                </h2>
                                <p
                                    className="text-xs"
                                    style={{ color: textSecondary }}
                                >
                                    {structure.code}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                                background: isDark ? "#334155" : "#f1f5f9",
                            }}
                        >
                            <i
                                className="ri-close-line"
                                style={{ color: textSecondary }}
                            ></i>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Description */}
                    {structure.description && (
                        <p className="text-sm" style={{ color: textSecondary }}>
                            {structure.description}
                        </p>
                    )}

                    {/* Salary Range */}
                    <div
                        className="grid grid-cols-2 gap-4 p-4 rounded-xl"
                        style={{
                            background: isDark ? "#0f172a" : "#f8fafc",
                            border: `1px solid ${border}`,
                        }}
                    >
                        <div className="text-center">
                            <p
                                className="text-xs mb-1"
                                style={{ color: textSecondary }}
                            >
                                Minimum
                            </p>
                            <p
                                className="text-lg font-bold"
                                style={{ color: textPrimary }}
                            >
                                {formatCurrency(structure.basic_salary_min)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p
                                className="text-xs mb-1"
                                style={{ color: textSecondary }}
                            >
                                Maximum
                            </p>
                            <p
                                className="text-lg font-bold"
                                style={{ color: textPrimary }}
                            >
                                {formatCurrency(structure.basic_salary_max)}
                            </p>
                        </div>
                    </div>

                    {/* Components */}
                    <div>
                        <h3
                            className="text-sm font-semibold mb-3"
                            style={{ color: textPrimary }}
                        >
                            Salary Components ({components.length})
                        </h3>

                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="h-12 rounded-xl animate-pulse"
                                        style={{
                                            background: isDark
                                                ? "#334155"
                                                : "#e2e8f0",
                                        }}
                                    ></div>
                                ))}
                            </div>
                        ) : components.length === 0 ? (
                            <div className="py-8 text-center">
                                <i
                                    className="ri-inbox-line text-3xl mb-2 block"
                                    style={{ color: textSecondary }}
                                ></i>
                                <p
                                    className="text-sm"
                                    style={{ color: textSecondary }}
                                >
                                    No components defined
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {components.map((comp) => (
                                    <div
                                        key={comp.id}
                                        className="flex items-center justify-between p-3 rounded-xl"
                                        style={{
                                            background: isDark
                                                ? "#1e293b"
                                                : "#f8fafc",
                                            border: `1px solid ${border}`,
                                        }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                                    comp.type === "allowance"
                                                        ? "bg-green-100 dark:bg-green-900/30"
                                                        : "bg-red-100 dark:bg-red-900/30"
                                                }`}
                                            >
                                                <i
                                                    className={`${comp.type === "allowance" ? "ri-add-circle-line text-green-600" : "ri-subtract-line text-red-600"} text-sm`}
                                                ></i>
                                            </div>
                                            <div>
                                                <p
                                                    className="text-sm font-medium"
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
                                                    {comp.code}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p
                                                className="text-sm font-semibold"
                                                style={{
                                                    color:
                                                        comp.type ===
                                                        "allowance"
                                                            ? "#16a34a"
                                                            : "#dc2626",
                                                }}
                                            >
                                                {comp.calculation_type ===
                                                "percentage"
                                                    ? `${comp.value}%`
                                                    : formatCurrency(
                                                          comp.value,
                                                      )}
                                            </p>
                                            <p
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                {comp.calculation_type}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    {components.length > 0 && (
                        <div
                            className="p-4 rounded-xl"
                            style={{
                                background: isDark ? "#0f172a" : "#f0fdf4",
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div className="flex justify-between text-xs mb-2">
                                <span style={{ color: textSecondary }}>
                                    Total Allowances:
                                </span>
                                <span
                                    className="font-medium"
                                    style={{ color: "#16a34a" }}
                                >
                                    +{formatCurrency(totalAllowances)}
                                </span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span style={{ color: textSecondary }}>
                                    Total Deductions:
                                </span>
                                <span
                                    className="font-medium"
                                    style={{ color: "#dc2626" }}
                                >
                                    -{formatCurrency(totalDeductions)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 rounded-xl text-sm font-medium"
                        style={{
                            background: isDark ? "#334155" : "#f1f5f9",
                            color: textSecondary,
                        }}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
