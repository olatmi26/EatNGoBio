import React, { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface RejectPayrollModalProps {
    isOpen: boolean;
    onClose: () => void;
    onReject: (reason: string) => void;
    periodName?: string;
}

export default function RejectPayrollModal({
    isOpen,
    onClose,
    onReject,
    periodName,
}: RejectPayrollModalProps) {
    const { isDark } = useTheme();
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            setReason("");
            setError("");
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

        if (!reason.trim()) {
            setError("Please provide a reason for rejection");
            return;
        }

        if (reason.trim().length < 5) {
            setError(
                "Please provide a more detailed reason (at least 5 characters)",
            );
            return;
        }

        onReject(reason);
    };

    const quickReasons = [
        "Incorrect attendance data",
        "Calculation errors found",
        "Missing employee records",
        "Incorrect salary rates",
        "Need to adjust deductions",
    ];

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
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                            <i className="ri-close-circle-line text-xl text-red-600"></i>
                        </div>
                        <div>
                            <h2
                                className="text-lg font-bold"
                                style={{ color: textPrimary }}
                            >
                                Reject Payroll
                            </h2>
                            {periodName && (
                                <p
                                    className="text-xs mt-0.5"
                                    style={{ color: textSecondary }}
                                >
                                    {periodName}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label
                            className="text-xs font-medium mb-1.5 block"
                            style={{ color: textSecondary }}
                        >
                            Rejection Reason{" "}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => {
                                setReason(e.target.value);
                                setError("");
                            }}
                            rows={4}
                            placeholder="Enter the reason for rejecting this payroll..."
                            className={`w-full px-4 py-3 rounded-xl text-sm resize-none transition-all focus:ring-2 focus:ring-red-500/20 ${
                                error ? "border-red-500" : ""
                            }`}
                            style={{
                                background: inputBg,
                                border: `1px solid ${error ? "#ef4444" : border}`,
                                color: textPrimary,
                            }}
                        />
                        {error && (
                            <p
                                className="text-xs mt-1.5 flex items-center gap-1"
                                style={{ color: "#ef4444" }}
                            >
                                <i className="ri-error-warning-line"></i>
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Quick Reasons */}
                    <div>
                        <p
                            className="text-xs mb-2"
                            style={{ color: textSecondary }}
                        >
                            Quick reasons:
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {quickReasons.map((quickReason, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                        setReason(quickReason);
                                        setError("");
                                    }}
                                    className="px-3 py-1.5 rounded-lg text-xs transition-colors hover:opacity-80"
                                    style={{
                                        background: isDark
                                            ? "#334155"
                                            : "#f1f5f9",
                                        color: textSecondary,
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    {quickReason}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Warning */}
                    <div
                        className="p-3 rounded-lg"
                        style={{
                            background: isDark ? "#450a0a" : "#fef2f2",
                            border: `1px solid ${isDark ? "#7f1d1d" : "#fecaca"}`,
                        }}
                    >
                        <div className="flex gap-2">
                            <i
                                className="ri-alert-line text-sm"
                                style={{ color: "#dc2626" }}
                            ></i>
                            <p
                                className="text-xs"
                                style={{
                                    color: isDark ? "#fca5a5" : "#991b1b",
                                }}
                            >
                                Rejecting will return the payroll to draft
                                status. The preparer will be notified.
                            </p>
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
                            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all hover:scale-105"
                            style={{
                                background:
                                    "linear-gradient(135deg, #dc2626, #b91c1c)",
                            }}
                        >
                            <i className="ri-close-line"></i>
                            Confirm Rejection
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
