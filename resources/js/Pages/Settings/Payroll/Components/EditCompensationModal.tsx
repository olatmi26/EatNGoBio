// js/Pages/Settings/Payroll/Components/EditCompensationModal.tsx
import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";

interface Compensation {
    id: number;
    employee_id: string;
    employee_name: string;
    department: string;
    basic_salary: number;
    effective_date: string;
    status: string;
    salary_structure_name: string | null;
}

interface EditCompensationModalProps {
    isOpen: boolean;
    onClose: () => void;
    compensation: Compensation;
}

export default function EditCompensationModal({
    isOpen,
    onClose,
    compensation,
}: EditCompensationModalProps) {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const [form, setForm] = useState({
        basic_salary: compensation.basic_salary,
        effective_date: compensation.effective_date,
        status: compensation.status,
        remarks: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setForm({
                basic_salary: compensation.basic_salary,
                effective_date: compensation.effective_date,
                status: compensation.status,
                remarks: "",
            });
        }
    }, [isOpen, compensation]);

    const cardBg = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#334155" : "#e2e8f0";
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";
    const inputBg = isDark ? "#0f172a" : "#f8fafc";

    if (!isOpen) return null;

    const handleSubmit = () => {
        setIsSubmitting(true);
        router.put(`/settings/payroll/employees/${compensation.id}`, form, {
            onSuccess: () => {
                showToast(
                    "success",
                    "Updated",
                    "Compensation updated successfully",
                );
                setIsSubmitting(false);
                onClose();
            },
            onError: (errors) => {
                showToast(
                    "error",
                    "Error",
                    errors.message || "Failed to update compensation",
                );
                setIsSubmitting(false);
            },
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-2xl shadow-2xl"
                style={{ background: cardBg }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="px-6 pt-6 pb-4 border-b"
                    style={{ borderColor: border }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100 dark:bg-purple-900/30">
                            <i className="ri-user-settings-line text-xl text-purple-600"></i>
                        </div>
                        <div>
                            <h2
                                className="text-lg font-bold"
                                style={{ color: textPrimary }}
                            >
                                Edit Compensation
                            </h2>
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: textSecondary }}
                            >
                                {compensation.employee_name} •{" "}
                                {compensation.employee_id}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label
                            className="text-xs font-medium mb-1.5 block"
                            style={{ color: textSecondary }}
                        >
                            Basic Salary (₦){" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={form.basic_salary}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    basic_salary:
                                        parseFloat(e.target.value) || 0,
                                })
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
                            className="text-xs font-medium mb-1.5 block"
                            style={{ color: textSecondary }}
                        >
                            Effective Date{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="date"
                            value={form.effective_date}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    effective_date: e.target.value,
                                })
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
                            className="text-xs font-medium mb-1.5 block"
                            style={{ color: textSecondary }}
                        >
                            Status
                        </label>
                        <select
                            value={form.status}
                            onChange={(e) =>
                                setForm({ ...form, status: e.target.value })
                            }
                            className="w-full px-4 py-3 rounded-xl text-sm"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    <div>
                        <label
                            className="text-xs font-medium mb-1.5 block"
                            style={{ color: textSecondary }}
                        >
                            Remarks
                        </label>
                        <textarea
                            value={form.remarks}
                            onChange={(e) =>
                                setForm({ ...form, remarks: e.target.value })
                            }
                            rows={2}
                            placeholder="Reason for change..."
                            className="w-full px-4 py-3 rounded-xl text-sm resize-none"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                        />
                    </div>
                </div>

                <div className="px-6 pb-6 flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-medium"
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
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 disabled:opacity-50"
                        style={{
                            background:
                                "linear-gradient(135deg, #16a34a, #15803d)",
                        }}
                    >
                        {isSubmitting ? <>Saving...</> : <>Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
