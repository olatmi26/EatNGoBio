import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface GeneratePayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (data: {
        period: string;
        department: string;
        location: string;
    }) => void;
    isGenerating: boolean;
    departments: string[];
    locations: string[];
}

export default function GeneratePayrollModal({
    isOpen,
    onClose,
    onGenerate,
    isGenerating,
    departments,
    locations,
}: GeneratePayrollModalProps) {
    const { isDark } = useTheme();
    const [form, setForm] = useState({
        period: new Date().toISOString().slice(0, 7),
        department: "",
        location: "",
    });

    useEffect(() => {
        if (isOpen) {
            setForm({
                period: new Date().toISOString().slice(0, 7),
                department: "",
                location: "",
            });
        }
    }, [isOpen]);

    const cardBg = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#334155" : "#e2e8f0";
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";
    const inputBg = isDark ? "#0f172a" : "#f8fafc";

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate(form);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
                style={{ background: cardBg }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="px-6 pt-6 pb-4 border-b"
                    style={{ borderColor: border }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                            <i className="ri-money-dollar-circle-line text-xl text-green-600"></i>
                        </div>
                        <div>
                            <h2
                                className="text-lg font-bold"
                                style={{ color: textPrimary }}
                            >
                                Generate Payroll
                            </h2>
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: textSecondary }}
                            >
                                Create a new payroll period
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label
                            className="text-xs font-medium mb-1.5 block"
                            style={{ color: textSecondary }}
                        >
                            Period (Month){" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="month"
                            value={form.period}
                            onChange={(e) =>
                                setForm({ ...form, period: e.target.value })
                            }
                            required
                            className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        />
                        <p
                            className="text-xs mt-1.5"
                            style={{ color: textSecondary }}
                        >
                            Payroll will be generated for the entire month
                        </p>
                    </div>

                    <div>
                        <label
                            className="text-xs font-medium mb-1.5 block"
                            style={{ color: textSecondary }}
                        >
                            Department (Optional)
                        </label>
                        <select
                            value={form.department}
                            onChange={(e) =>
                                setForm({ ...form, department: e.target.value })
                            }
                            className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept} value={dept}>
                                    {dept}
                                </option>
                            ))}
                        </select>
                        <p
                            className="text-xs mt-1.5"
                            style={{ color: textSecondary }}
                        >
                            Leave empty to include all departments
                        </p>
                    </div>

                    <div>
                        <label
                            className="text-xs font-medium mb-1.5 block"
                            style={{ color: textSecondary }}
                        >
                            Location (Optional)
                        </label>
                        <select
                            value={form.location}
                            onChange={(e) =>
                                setForm({ ...form, location: e.target.value })
                            }
                            className="w-full px-4 py-3 rounded-xl text-sm transition-all focus:ring-2 focus:ring-green-500/20 focus:border-green-500 cursor-pointer"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        >
                            <option value="">All Locations</option>
                            {locations.map((loc) => (
                                <option key={loc} value={loc}>
                                    {loc}
                                </option>
                            ))}
                        </select>
                        <p
                            className="text-xs mt-1.5"
                            style={{ color: textSecondary }}
                        >
                            Leave empty to include all locations
                        </p>
                    </div>

                    {/* Info Box */}
                    <div
                        className="p-3 rounded-lg"
                        style={{
                            background: isDark ? "#0f172a" : "#f0fdf4",
                            border: `1px solid ${isDark ? "#334155" : "#bbf7d0"}`,
                        }}
                    >
                        <div className="flex gap-2">
                            <i
                                className="ri-information-line text-sm"
                                style={{ color: "#16a34a" }}
                            ></i>
                            <div
                                className="text-xs"
                                style={{ color: textSecondary }}
                            >
                                <p
                                    className="font-medium mb-0.5"
                                    style={{
                                        color: isDark ? "#86efac" : "#166534",
                                    }}
                                >
                                    Payroll will calculate:
                                </p>
                                <ul className="space-y-0.5 list-disc list-inside">
                                    <li>Basic salary based on attendance</li>
                                    <li>Overtime pay at configured rates</li>
                                    <li>
                                        Tax (PAYE), Pension, and NHF deductions
                                    </li>
                                    <li>Late and absent deductions</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
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
                            type="submit"
                            disabled={isGenerating}
                            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                            style={{
                                background:
                                    "linear-gradient(135deg, #16a34a, #15803d)",
                            }}
                        >
                            {isGenerating ? (
                                <>
                                    <i className="ri-loader-4-line animate-spin"></i>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <i className="ri-flash-line"></i>
                                    Generate Payroll
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
