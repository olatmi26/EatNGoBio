// js/Pages/Settings/Payroll/Components/ImportSalaryModal.tsx
import { useState, useRef } from "react";
import { router } from "@inertiajs/react";
import { useTheme } from "@/contexts/ThemeContext";

interface ImportSalaryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ImportSalaryModal({
    isOpen,
    onClose,
}: ImportSalaryModalProps) {
    const { isDark } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const cardBg = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#334155" : "#e2e8f0";
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
                alert("Please upload an Excel (.xlsx, .xls) or CSV file");
                return;
            }
            setFile(selectedFile);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.name.match(/\.(xlsx|xls|csv)$/)) {
            setFile(droppedFile);
        }
    };

    const handleUpload = () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        router.post("/settings/payroll/employees/import", formData, {
            onSuccess: () => {
                setIsUploading(false);
                onClose();
            },
            onError: () => {
                setIsUploading(false);
            },
        });
    };

    const handleDownloadTemplate = () => {
        window.open("/settings/payroll/employees/template", "_blank");
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="w-full max-w-lg rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
                style={{ background: cardBg }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="px-6 pt-6 pb-4 border-b"
                    style={{ borderColor: border }}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 dark:bg-blue-900/30">
                            <i className="ri-upload-cloud-line text-xl text-blue-600"></i>
                        </div>
                        <div>
                            <h2
                                className="text-lg font-bold"
                                style={{ color: textPrimary }}
                            >
                                Import Salary Data
                            </h2>
                            <p
                                className="text-xs mt-0.5"
                                style={{ color: textSecondary }}
                            >
                                Upload Excel or CSV file with employee salary
                                data
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Download Template */}
                    <button
                        onClick={handleDownloadTemplate}
                        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                        style={{
                            background: isDark ? "#0f172a" : "#f0fdf4",
                            color: "#16a34a",
                            border: `1px dashed #16a34a`,
                        }}
                    >
                        <i className="ri-download-line"></i>
                        Download Template File
                    </button>

                    {/* Upload Area */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                            dragOver
                                ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                : ""
                        }`}
                        style={{ borderColor: dragOver ? "#16a34a" : border }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            onChange={handleFileChange}
                            className="hidden"
                        />

                        {file ? (
                            <div className="space-y-2">
                                <div className="w-12 h-12 mx-auto rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                    <i className="ri-file-excel-line text-xl text-green-600"></i>
                                </div>
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: textPrimary }}
                                >
                                    {file.name}
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: textSecondary }}
                                >
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                    className="text-xs font-medium"
                                    style={{ color: "#dc2626" }}
                                >
                                    Remove file
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <div className="w-12 h-12 mx-auto rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <i
                                        className="ri-file-excel-line text-xl"
                                        style={{ color: textSecondary }}
                                    ></i>
                                </div>
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: textPrimary }}
                                >
                                    Drop your file here or click to browse
                                </p>
                                <p
                                    className="text-xs"
                                    style={{ color: textSecondary }}
                                >
                                    Supports .xlsx, .xls, .csv up to 10MB
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Column Mapping Info */}
                    <div
                        className="p-4 rounded-lg"
                        style={{
                            background: isDark ? "#0f172a" : "#f8fafc",
                            border: `1px solid ${border}`,
                        }}
                    >
                        <h4
                            className="text-xs font-semibold mb-2"
                            style={{ color: textPrimary }}
                        >
                            Required Columns:
                        </h4>
                        <div
                            className="grid grid-cols-2 gap-2 text-xs"
                            style={{ color: textSecondary }}
                        >
                            {[
                                "Employee ID",
                                "Basic Salary (₦)",
                                "Effective Date",
                                "Salary Structure (optional)",
                                "Allowances (optional)",
                                "Deductions (optional)",
                            ].map((col) => (
                                <div
                                    key={col}
                                    className="flex items-center gap-1.5"
                                >
                                    <i className="ri-checkbox-circle-fill text-green-500"></i>
                                    {col}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-6 pb-6 flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                        style={{
                            background: isDark ? "#334155" : "#f1f5f9",
                            color: textSecondary,
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        style={{
                            background:
                                "linear-gradient(135deg, #16a34a, #15803d)",
                        }}
                    >
                        {isUploading ? (
                            <>
                                <i className="ri-loader-4-line animate-spin"></i>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <i className="ri-upload-line"></i>
                                Upload & Import
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
