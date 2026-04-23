import { useState, useEffect } from "react";
import { usePage, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import ImportSalaryModal from "./Components/ImportSalaryModal";
import AddSalaryStructureModal from "./Components/AddSalaryStructureModal";
import EditCompensationModal from "./Components/EditCompensationModal";
import ViewSalaryStructureModal from "./Components/ViewSalaryStructureModal";

import type {
    PageProps,
    PayrollSettings as PayrollSettingsType,
} from "@/types";

interface Setting {
    id: number;
    key: string;
    value: string;
    group: string;
    type: string;
    options: Array<{ value: string; label: string }> | null;
    label: string;
    description: string | null;
}

interface TaxBracket {
    min: number;
    max: number | null;
    rate: number;
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

interface SalaryComponent {
    id: number;
    name: string;
    code: string;
    type: "allowance" | "deduction";
    calculation_type: "fixed" | "percentage";
    default_value: number | null;
    is_taxable: boolean;
    is_pensionable: boolean;
    is_active: boolean;
    sort_order: number;
}

interface EmployeeCompensation {
    id: number;
    employee_id: string;
    employee_name: string;
    department: string;
    location: string;
    basic_salary: number;
    effective_date: string;
    end_date: string | null;
    status: "active" | "inactive" | "pending";
    salary_structure_name: string | null;
    total_allowances: number;
    total_deductions: number;
    gross_salary: number;
    net_salary: number;
}

interface Props extends PageProps {
    settings: Record<string, Setting[]>;
    currentSettings: PayrollSettingsType;
    salaryStructures?: SalaryStructure[];
    salaryComponents?: SalaryComponent[];
    employeeCompensations?: {
        data: EmployeeCompensation[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    calculation?: any;
    departments?: string[];
    locations?: string[];
}

type SettingsTab =
    | "payroll-config"
    | "employee-compensation"
    | "salary-structures";

function getTabFromUrl(): SettingsTab {
    if (typeof window === "undefined") return "payroll-config";
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (
        tab === "employee-compensation" ||
        tab === "salary-structures" ||
        tab === "payroll-config"
    ) {
        return tab as SettingsTab;
    }
    return "payroll-config";
}

export default function PayrollSettingsIndex() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const { props } = usePage<Props>();

    // PERSISTENT TABS: Use URL search param ?tab= for persistence
    const [activeTab, setActiveTab] = useState<SettingsTab>(getTabFromUrl());

    // Write active tab to URL, update on popstate (back/forward browser nav)
    useEffect(() => {
        const onPop = () => {
            setActiveTab(getTabFromUrl());
        };
        window.addEventListener("popstate", onPop);
        return () => window.removeEventListener("popstate", onPop);
    }, []);

    // Whenever activeTab changes, push state to URL (without reload)
    useEffect(() => {
        // Only update if not already set (avoid infinite loop)
        const params = new URLSearchParams(window.location.search);
        if (params.get("tab") !== activeTab) {
            params.set("tab", activeTab);
            // Preserve other URL params (e.g. page)
            window.history.replaceState(
                {},
                "",
                `${window.location.pathname}?${params.toString()}`,
            );
        }
    }, [activeTab]);

    const [settings, setSettings] = useState(props.settings);
    const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>(() => {
        const taxSetting = Object.values(props.settings)
            .flat()
            .find((s) => s.key === "tax.brackets");
        return taxSetting
            ? JSON.parse(taxSetting.value)
            : [
                  { min: 0, max: 300000, rate: 7 },
                  { min: 300001, max: 600000, rate: 11 },
                  { min: 600001, max: 1100000, rate: 15 },
                  { min: 1100001, max: 1600000, rate: 19 },
                  { min: 1600001, max: 3200000, rate: 21 },
                  { min: 3200001, max: null, rate: 24 },
              ];
    });
    const [isSaving, setIsSaving] = useState(false);

    // Preview state
    const [previewSalary, setPreviewSalary] = useState(50000);
    const [previewResult, setPreviewResult] = useState<any>(
        props.calculation || null,
    );
    const [isCalculating, setIsCalculating] = useState(false);

    // Employee Compensation state
    const [searchTerm, setSearchTerm] = useState("");
    const [filterDept, setFilterDept] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showStructureModal, setShowStructureModal] = useState(false);
    const [editingCompensation, setEditingCompensation] =
        useState<EmployeeCompensation | null>(null);

    // Bulk update state
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [bulkUpdateMode, setBulkUpdateMode] = useState(false);
    const [bulkUpdateData, setBulkUpdateData] = useState({
        increase_type: "percentage" as "percentage" | "fixed",
        increase_value: 0,
        reason: "",
        effective_date: new Date().toISOString().split("T")[0],
    });

    const [showEditCompensationModal, setShowEditCompensationModal] =
        useState(false);

    const [editingStructure, setEditingStructure] = useState<any>(null);
    const [selectedStructure, setSelectedStructure] = useState<any>(null);
    const [showViewStructureModal, setShowViewStructureModal] = useState(false);

    const bg = isDark ? "#0f172a" : "#f8fafc";
    const cardBg = isDark ? "#1e293b" : "#ffffff";
    const border = isDark ? "#334155" : "#e2e8f0";
    const textPrimary = isDark ? "#f1f5f9" : "#0f172a";
    const textSecondary = isDark ? "#94a3b8" : "#64748b";
    const inputBg = isDark ? "#1e293b" : "#f8fafc";

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const formatCompact = (amount: number) => {
        if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}M`;
        if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}K`;
        return `₦${amount.toLocaleString()}`;
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("en-NG", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // ==================== PAYROLL CONFIG FUNCTIONS ====================

    const handleSettingChange = (key: string, value: any) => {
        const newSettings = { ...settings };
        for (const group in newSettings) {
            const setting = newSettings[group].find((s) => s.key === key);
            if (setting) {
                setting.value = value;
                break;
            }
        }
        setSettings(newSettings);
    };

    const handleTaxBracketChange = (
        index: number,
        field: keyof TaxBracket,
        value: string,
    ) => {
        const newBrackets = [...taxBrackets];
        newBrackets[index] = {
            ...newBrackets[index],
            [field]:
                field === "max" && (value === "" || value === null)
                    ? null
                    : field === "rate"
                      ? parseFloat(value) || 0
                      : parseInt(value) || 0,
        };
        setTaxBrackets(newBrackets);
    };

    const addTaxBracket = () => {
        const lastBracket = taxBrackets[taxBrackets.length - 1];
        setTaxBrackets([
            ...taxBrackets,
            { min: (lastBracket?.max || 0) + 1, max: null, rate: 0 },
        ]);
    };

    const removeTaxBracket = (index: number) => {
        setTaxBrackets(taxBrackets.filter((_, i) => i !== index));
    };

    const saveSettings = () => {
        setIsSaving(true);
        const settingsToSave = Object.values(settings)
            .flat()
            .map((s) => ({ key: s.key, value: s.value }));

        router.post(
            route("settings.payroll.update"),
            { settings: settingsToSave },
            {
                onSuccess: () => {
                    showToast(
                        "success",
                        "Settings Saved",
                        "Payroll settings updated successfully",
                    );
                    setIsSaving(false);
                },
                onError: () => {
                    showToast("error", "Error", "Failed to save settings");
                    setIsSaving(false);
                },
            },
        );
    };

    const saveTaxBrackets = () => {
        setIsSaving(true);

        // Validate brackets don't overlap
        for (let i = 0; i < taxBrackets.length - 1; i++) {
            if (
                taxBrackets[i].max &&
                taxBrackets[i].max >= taxBrackets[i + 1].min
            ) {
                showToast(
                    "error",
                    "Invalid Brackets",
                    "Tax brackets must not overlap",
                );
                setIsSaving(false);
                return;
            }
        }

        // Clean brackets data before sending
        const cleanBrackets = taxBrackets.map((bracket) => ({
            min: Number(bracket.min),
            max:
                bracket.max === null || bracket.max === ""
                    ? null
                    : Number(bracket.max),
            rate: Number(bracket.rate),
        }));

        router.post(
            route("settings.payroll.tax-brackets.update"),
            { brackets: cleanBrackets }, // Send as array, not JSON string
            {
                onSuccess: () => {
                    showToast(
                        "success",
                        "Tax Brackets Updated",
                        "Tax brackets saved successfully",
                    );
                    setIsSaving(false);
                },
                onError: (errors: any) => {
                    const message =
                        errors?.brackets ||
                        errors?.message ||
                        "Failed to update tax brackets";
                    showToast(
                        "error",
                        "Error",
                        typeof message === "string"
                            ? message
                            : "Failed to update tax brackets",
                    );
                    setIsSaving(false);
                },
            },
        );
    };

    const calculatePreview = () => {
        setIsCalculating(true);
        router.get(
            route("settings.payroll.preview"),
            {
                basic_salary: previewSalary,
                days_worked: 22,
                days_absent: 0,
                late_minutes: 0,
                overtime_hours: 0,
            },
            {
                preserveState: false,
                preserveScroll: true,
                only: ["calculation"],
                onSuccess: (page: any) => {
                    setPreviewResult(page.props.calculation);
                    setIsCalculating(false);
                },
                onError: () => {
                    showToast("error", "Error", "Failed to calculate preview");
                    setIsCalculating(false);
                },
            },
        );
    };

    // ==================== EMPLOYEE COMPENSATION FUNCTIONS ====================

    const handleBulkUpdate = () => {
        if (selectedEmployees.length === 0) {
            showToast(
                "error",
                "No Selection",
                "Please select employees to update",
            );
            return;
        }

        router.post(
            route("settings.payroll.employees.bulk-update"),
            {
                employee_ids: selectedEmployees,
                ...bulkUpdateData,
            },
            {
                onSuccess: () => {
                    showToast(
                        "success",
                        "Updated",
                        `Updated ${selectedEmployees.length} employees`,
                    );
                    setSelectedEmployees([]);
                    setBulkUpdateMode(false);
                },
            },
        );
    };

    const handleImportExcel = () => {
        setShowImportModal(true);
    };

    const handleExportCompensations = () => {
        const params = new URLSearchParams({
            department: filterDept,
            status: filterStatus,
            search: searchTerm,
        }).toString();
        window.open(`/settings/payroll/employees/export?${params}`, "_blank");
    };

    const handleEditCompensation = (comp: EmployeeCompensation) => {
        setEditingCompensation(comp);
        setShowEditCompensationModal(true);
    };

    const toggleEmployeeSelection = (employeeId: string) => {
        setSelectedEmployees((prev) =>
            prev.includes(employeeId)
                ? prev.filter((id) => id !== employeeId)
                : [...prev, employeeId],
        );
    };

    const toggleAllEmployees = () => {
        const allIds = filteredCompensations.map((c) => c.employee_id);
        setSelectedEmployees((prev) =>
            prev.length === allIds.length ? [] : allIds,
        );
    };

    const filteredCompensations = (
        props.employeeCompensations?.data || []
    ).filter((comp) => {
        const matchSearch =
            !searchTerm ||
            comp.employee_name
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
            comp.employee_id.includes(searchTerm) ||
            comp.department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchDept = !filterDept || comp.department === filterDept;
        const matchStatus = !filterStatus || comp.status === filterStatus;
        return matchSearch && matchDept && matchStatus;
    });

    // ==================== RENDER FUNCTIONS ====================

    const renderSettingInput = (setting: Setting) => {
        const value = setting.value;

        switch (setting.type) {
            case "boolean": {
                const checked = value === "1";
                return (
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                                handleSettingChange(
                                    setting.key,
                                    e.target.checked ? "1" : "0",
                                )
                            }
                            className="sr-only peer"
                        />
                        <div
                            className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"
                            style={{
                                background: checked ? "#16a34a" : "#9ca3af",
                            }}
                        ></div>
                    </label>
                );
            }
            case "number":
                return (
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={value}
                            onChange={(e) =>
                                handleSettingChange(setting.key, e.target.value)
                            }
                            className="w-32 px-3 py-2 rounded-lg text-sm"
                            style={{
                                background: inputBg,
                                border: `1px solid ${border}`,
                                color: textPrimary,
                            }}
                            step="0.1"
                            min="0"
                        />
                        {setting.key.includes("rate") && (
                            <span
                                className="text-sm"
                                style={{ color: textSecondary }}
                            >
                                %
                            </span>
                        )}
                        {setting.key.includes("relief") && (
                            <span
                                className="text-sm"
                                style={{ color: textSecondary }}
                            >
                                ₦
                            </span>
                        )}
                    </div>
                );
            case "select":
                return (
                    <select
                        value={value}
                        onChange={(e) =>
                            handleSettingChange(setting.key, e.target.value)
                        }
                        className="w-48 px-3 py-2 rounded-lg text-sm"
                        style={{
                            background: inputBg,
                            border: `1px solid ${border}`,
                            color: textPrimary,
                        }}
                    >
                        {setting.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );
            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) =>
                            handleSettingChange(setting.key, e.target.value)
                        }
                        className="w-full max-w-md px-3 py-2 rounded-lg text-sm"
                        style={{
                            background: inputBg,
                            border: `1px solid ${border}`,
                            color: textPrimary,
                        }}
                    />
                );
        }
    };

    const groupLabels: Record<string, string> = {
        payroll_tax: "Tax Settings (PAYE)",
        payroll_pension: "Pension Settings",
        payroll_nhf: "National Housing Fund (NHF)",
        payroll_deductions: "Other Statutory Deductions",
        payroll_general: "General Payroll Settings",
    };

    const groupIcons: Record<string, string> = {
        payroll_tax: "ri-government-line",
        payroll_pension: "ri-bank-line",
        payroll_nhf: "ri-home-4-line",
        payroll_deductions: "ri-subtract-line",
        payroll_general: "ri-settings-4-line",
    };

    // Safe accessors for currentSettings with defaults
    const taxSettings = props.currentSettings?.tax || {
        enabled: true,
        calculationMethod: "graduated" as const,
        flatRate: 10,
        brackets: [],
        consolidatedRelief: 200000,
    };

    const pensionSettings = props.currentSettings?.pension || {
        enabled: true,
        employeeRate: 8,
        employerRate: 10,
        minimumThreshold: 0,
    };

    const nhfSettings = props.currentSettings?.nhf || {
        enabled: true,
        rate: 2.5,
        minimumThreshold: 3000,
    };

    const deductionsSettings = props.currentSettings?.deductions || {
        nsitf: { enabled: true, rate: 1 },
    };

    const generalSettings = props.currentSettings?.general || {
        workDaysPerMonth: 22,
        workHoursPerDay: 8,
        overtimeMultiplier: 1.5,
        weekendMultiplier: 2.0,
        holidayMultiplier: 2.5,
    };

    return (
        <AppLayout title="Payroll Settings">
            <div
                className="p-4 sm:p-6"
                style={{ background: bg, minHeight: "100vh" }}
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1
                            className="text-xl sm:text-2xl font-bold"
                            style={{ color: textPrimary }}
                        >
                            Payroll Settings
                        </h1>
                        <p
                            className="text-sm mt-0.5"
                            style={{ color: textSecondary }}
                        >
                            Configure tax brackets, pension rates, employee
                            compensation, and payroll parameters
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(route("payroll.index"))}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
                            style={{
                                background: isDark ? "#334155" : "#f1f5f9",
                                color: textSecondary,
                            }}
                        >
                            <i className="ri-arrow-left-line"></i>
                            Back to Payroll
                        </button>
                        {activeTab === "payroll-config" && (
                            <button
                                onClick={saveSettings}
                                disabled={isSaving}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white cursor-pointer disabled:opacity-50"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #16a34a, #15803d)",
                                }}
                            >
                                <i
                                    className={`ri-${isSaving ? "loader-4-line animate-spin" : "save-line"}`}
                                ></i>
                                {isSaving ? " Saving..." : " Save All Settings"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div
                    className="flex gap-1 mb-6 border-b overflow-x-auto"
                    style={{ borderColor: border }}
                >
                    {[
                        {
                            key: "payroll-config" as SettingsTab,
                            label: "Payroll Config",
                            icon: "ri-settings-4-line",
                            short: "Config",
                        },
                        {
                            key: "employee-compensation" as SettingsTab,
                            label: "Employee Compensation",
                            icon: "ri-user-settings-line",
                            short: "Compensation",
                        },
                        {
                            key: "salary-structures" as SettingsTab,
                            label: "Salary Structures",
                            icon: "ri-stack-line",
                            short: "Structures",
                        },
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className="flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium whitespace-nowrap transition-all"
                            style={{
                                color:
                                    activeTab === tab.key
                                        ? "#16a34a"
                                        : textSecondary,
                                borderBottom:
                                    activeTab === tab.key
                                        ? "2px solid #16a34a"
                                        : "2px solid transparent",
                            }}
                        >
                            <i className={tab.icon}></i>
                            <span className="hidden sm:inline">
                                {tab.label}
                            </span>
                            <span className="sm:hidden">{tab.short}</span>
                        </button>
                    ))}
                </div>

                {/* ==================== PAYROLL CONFIG TAB ==================== */}
                {activeTab === "payroll-config" && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Settings Groups - Left Column (2/3) */}
                        <div className="lg:col-span-2 space-y-6">
                            {Object.entries(settings).map(
                                ([group, groupSettings]) => (
                                    <div
                                        key={group}
                                        className="rounded-xl overflow-hidden"
                                        style={{
                                            background: cardBg,
                                            border: `1px solid ${border}`,
                                        }}
                                    >
                                        <div
                                            className="px-5 py-4 flex items-center gap-3"
                                            style={{
                                                borderBottom: `1px solid ${border}`,
                                            }}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{
                                                    background: "#dcfce7",
                                                }}
                                            >
                                                <i
                                                    className={
                                                        groupIcons[group] ||
                                                        "ri-settings-line"
                                                    }
                                                    style={{ color: "#16a34a" }}
                                                ></i>
                                            </div>
                                            <div>
                                                <h2
                                                    className="text-sm font-semibold"
                                                    style={{
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {groupLabels[group] ||
                                                        group}
                                                </h2>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            {groupSettings.map((setting) => (
                                                <div
                                                    key={setting.key}
                                                    className="flex items-start justify-between py-2 border-b border-dashed last:border-0"
                                                    style={{
                                                        borderColor: border,
                                                    }}
                                                >
                                                    <div className="flex-1 pr-4">
                                                        <label
                                                            className="text-sm font-medium block mb-1"
                                                            style={{
                                                                color: textPrimary,
                                                            }}
                                                        >
                                                            {setting.label}
                                                        </label>
                                                        {setting.description && (
                                                            <p
                                                                className="text-xs"
                                                                style={{
                                                                    color: textSecondary,
                                                                }}
                                                            >
                                                                {
                                                                    setting.description
                                                                }
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex-shrink-0">
                                                        {renderSettingInput(
                                                            setting,
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ),
                            )}

                            {/* Tax Brackets Section */}
                            <div
                                className="rounded-xl overflow-hidden"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${border}`,
                                }}
                            >
                                <div
                                    className="px-5 py-4 flex items-center justify-between"
                                    style={{
                                        borderBottom: `1px solid ${border}`,
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ background: "#fef9c3" }}
                                        >
                                            <i
                                                className="ri-stack-line"
                                                style={{ color: "#ca8a04" }}
                                            ></i>
                                        </div>
                                        <div>
                                            <h2
                                                className="text-sm font-semibold"
                                                style={{ color: textPrimary }}
                                            >
                                                Graduated Tax Brackets (Annual
                                                Income)
                                            </h2>
                                            <p
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                Nigerian PAYE tax brackets -
                                                applied progressively
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={saveTaxBrackets}
                                        disabled={isSaving}
                                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                                        style={{ background: "#16a34a" }}
                                    >
                                        Save Brackets
                                    </button>
                                </div>

                                <div className="p-5">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr
                                                    style={{
                                                        borderBottom: `1px solid ${border}`,
                                                    }}
                                                >
                                                    {[
                                                        "Min Income (₦)",
                                                        "Max Income (₦)",
                                                        "Rate (%)",
                                                        "Annual Tax",
                                                        "",
                                                    ].map((h) => (
                                                        <th
                                                            key={h}
                                                            className="px-3 py-2 text-left text-xs font-semibold"
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
                                                {taxBrackets.map(
                                                    (bracket, index) => {
                                                        const bracketAmount =
                                                            bracket.max
                                                                ? bracket.max -
                                                                  bracket.min +
                                                                  1
                                                                : 0;
                                                        const bracketTax =
                                                            bracketAmount *
                                                            (bracket.rate /
                                                                100);
                                                        return (
                                                            <tr
                                                                key={index}
                                                                style={{
                                                                    borderBottom: `1px solid ${border}`,
                                                                }}
                                                            >
                                                                <td className="px-3 py-2">
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            bracket.min
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleTaxBracketChange(
                                                                                index,
                                                                                "min",
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        className="w-28 px-2 py-1.5 rounded text-sm"
                                                                        style={{
                                                                            background:
                                                                                inputBg,
                                                                            border: `1px solid ${border}`,
                                                                            color: textPrimary,
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            bracket.max ??
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleTaxBracketChange(
                                                                                index,
                                                                                "max",
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                        placeholder="∞"
                                                                        className="w-28 px-2 py-1.5 rounded text-sm"
                                                                        style={{
                                                                            background:
                                                                                inputBg,
                                                                            border: `1px solid ${border}`,
                                                                            color: textPrimary,
                                                                        }}
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <div className="flex items-center gap-1">
                                                                        <input
                                                                            type="number"
                                                                            value={
                                                                                bracket.rate
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                handleTaxBracketChange(
                                                                                    index,
                                                                                    "rate",
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            className="w-20 px-2 py-1.5 rounded text-sm"
                                                                            style={{
                                                                                background:
                                                                                    inputBg,
                                                                                border: `1px solid ${border}`,
                                                                                color: textPrimary,
                                                                            }}
                                                                            step="0.5"
                                                                            min="0"
                                                                            max="100"
                                                                        />
                                                                        <span
                                                                            style={{
                                                                                color: textSecondary,
                                                                            }}
                                                                        >
                                                                            %
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <span
                                                                        className="text-xs font-mono"
                                                                        style={{
                                                                            color: textSecondary,
                                                                        }}
                                                                    >
                                                                        {bracket.max
                                                                            ? formatCurrency(
                                                                                  bracketTax,
                                                                              )
                                                                            : "-"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <button
                                                                        onClick={() =>
                                                                            removeTaxBracket(
                                                                                index,
                                                                            )
                                                                        }
                                                                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                                                                        style={{
                                                                            background:
                                                                                "#fee2e2",
                                                                            color: "#dc2626",
                                                                        }}
                                                                    >
                                                                        <i className="ri-delete-bin-line"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    },
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button
                                        onClick={addTaxBracket}
                                        className="mt-4 flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
                                        style={{
                                            background: isDark
                                                ? "#334155"
                                                : "#f1f5f9",
                                            color: textSecondary,
                                        }}
                                    >
                                        <i className="ri-add-line"></i> Add Tax
                                        Bracket
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Preview Panel - Right Column (1/3) */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Current Settings Summary */}
                            <div
                                className="rounded-xl p-5"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${border}`,
                                }}
                            >
                                <h3
                                    className="text-sm font-semibold mb-4 flex items-center gap-2"
                                    style={{ color: textPrimary }}
                                >
                                    <i
                                        className="ri-information-line"
                                        style={{ color: "#0891b2" }}
                                    ></i>
                                    Current Configuration
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span
                                            className="text-xs"
                                            style={{ color: textSecondary }}
                                        >
                                            Work Days/Month:
                                        </span>
                                        <span
                                            className="text-xs font-semibold"
                                            style={{ color: textPrimary }}
                                        >
                                            {generalSettings.workDaysPerMonth}{" "}
                                            days
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span
                                            className="text-xs"
                                            style={{ color: textSecondary }}
                                        >
                                            Work Hours/Day:
                                        </span>
                                        <span
                                            className="text-xs font-semibold"
                                            style={{ color: textPrimary }}
                                        >
                                            {generalSettings.workHoursPerDay}{" "}
                                            hours
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span
                                            className="text-xs"
                                            style={{ color: textSecondary }}
                                        >
                                            Overtime Rate:
                                        </span>
                                        <span
                                            className="text-xs font-semibold"
                                            style={{ color: textPrimary }}
                                        >
                                            {generalSettings.overtimeMultiplier}
                                            x
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span
                                            className="text-xs"
                                            style={{ color: textSecondary }}
                                        >
                                            Weekend Rate:
                                        </span>
                                        <span
                                            className="text-xs font-semibold"
                                            style={{ color: textPrimary }}
                                        >
                                            {generalSettings.weekendMultiplier}x
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span
                                            className="text-xs"
                                            style={{ color: textSecondary }}
                                        >
                                            Holiday Rate:
                                        </span>
                                        <span
                                            className="text-xs font-semibold"
                                            style={{ color: textPrimary }}
                                        >
                                            {generalSettings.holidayMultiplier}x
                                        </span>
                                    </div>
                                    <div
                                        className="pt-3 border-t"
                                        style={{ borderColor: border }}
                                    >
                                        <div className="flex justify-between">
                                            <span
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                Pension (Employee):
                                            </span>
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: textPrimary }}
                                            >
                                                {pensionSettings.enabled
                                                    ? `${pensionSettings.employeeRate}%`
                                                    : "Disabled"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                Pension (Employer):
                                            </span>
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: textPrimary }}
                                            >
                                                {pensionSettings.enabled
                                                    ? `${pensionSettings.employerRate}%`
                                                    : "Disabled"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                NHF:
                                            </span>
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: textPrimary }}
                                            >
                                                {nhfSettings.enabled
                                                    ? `${nhfSettings.rate}%`
                                                    : "Disabled"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                NSITF:
                                            </span>
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: textPrimary }}
                                            >
                                                {deductionsSettings.nsitf
                                                    ?.enabled
                                                    ? `${deductionsSettings.nsitf.rate}%`
                                                    : "Disabled"}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span
                                                className="text-xs"
                                                style={{ color: textSecondary }}
                                            >
                                                Consolidated Relief:
                                            </span>
                                            <span
                                                className="text-xs font-semibold"
                                                style={{ color: textPrimary }}
                                            >
                                                {formatCurrency(
                                                    taxSettings.consolidatedRelief,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Calculator Preview */}
                            <div
                                className="rounded-xl p-5"
                                style={{
                                    background: cardBg,
                                    border: `1px solid ${border}`,
                                }}
                            >
                                <h3
                                    className="text-sm font-semibold mb-4 flex items-center gap-2"
                                    style={{ color: textPrimary }}
                                >
                                    <i
                                        className="ri-calculator-line"
                                        style={{ color: "#16a34a" }}
                                    ></i>
                                    Quick Calculator
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            className="text-xs font-medium mb-1 block"
                                            style={{ color: textSecondary }}
                                        >
                                            Monthly Basic Salary (₦)
                                        </label>
                                        <input
                                            type="number"
                                            value={previewSalary}
                                            onChange={(e) =>
                                                setPreviewSalary(
                                                    parseFloat(
                                                        e.target.value,
                                                    ) || 0,
                                                )
                                            }
                                            className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{
                                                background: inputBg,
                                                border: `1px solid ${border}`,
                                                color: textPrimary,
                                            }}
                                        />
                                    </div>
                                    <button
                                        onClick={calculatePreview}
                                        disabled={isCalculating}
                                        className="w-full px-4 py-2 rounded-lg text-sm font-medium text-white"
                                        style={{ background: "#16a34a" }}
                                    >
                                        {isCalculating ? (
                                            <>
                                                <i className="ri-loader-4-line animate-spin mr-2"></i>
                                                Calculating...
                                            </>
                                        ) : (
                                            "Calculate Take-Home Pay"
                                        )}
                                    </button>
                                    {previewResult && (
                                        <div
                                            className="mt-4 p-4 rounded-lg"
                                            style={{
                                                background: isDark
                                                    ? "#1e293b"
                                                    : "#f0fdf4",
                                            }}
                                        >
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        Basic Salary:
                                                    </span>
                                                    <span
                                                        className="text-xs font-semibold"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            previewResult.basic_salary,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        Tax (PAYE):
                                                    </span>
                                                    <span
                                                        className="text-xs font-semibold"
                                                        style={{
                                                            color: "#dc2626",
                                                        }}
                                                    >
                                                        -
                                                        {formatCurrency(
                                                            previewResult.tax_deduction,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        Pension:
                                                    </span>
                                                    <span
                                                        className="text-xs font-semibold"
                                                        style={{
                                                            color: "#dc2626",
                                                        }}
                                                    >
                                                        -
                                                        {formatCurrency(
                                                            previewResult.pension_deduction,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        NHF:
                                                    </span>
                                                    <span
                                                        className="text-xs font-semibold"
                                                        style={{
                                                            color: "#dc2626",
                                                        }}
                                                    >
                                                        -
                                                        {formatCurrency(
                                                            previewResult.nhf_deduction,
                                                        )}
                                                    </span>
                                                </div>
                                                <div
                                                    className="pt-2 border-t"
                                                    style={{
                                                        borderColor: border,
                                                    }}
                                                >
                                                    <div className="flex justify-between">
                                                        <span
                                                            className="text-sm font-semibold"
                                                            style={{
                                                                color: textPrimary,
                                                            }}
                                                        >
                                                            Net Pay:
                                                        </span>
                                                        <span
                                                            className="text-sm font-bold"
                                                            style={{
                                                                color: "#16a34a",
                                                            }}
                                                        >
                                                            {formatCurrency(
                                                                previewResult.net_pay,
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        Employer Pension:
                                                    </span>
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            previewResult.pension_employer,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        Employer NSITF:
                                                    </span>
                                                    <span
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            previewResult.nsitf_employer ||
                                                                0,
                                                        )}
                                                    </span>
                                                </div>
                                                <div
                                                    className="flex justify-between pt-1 border-t border-dashed"
                                                    style={{
                                                        borderColor: border,
                                                    }}
                                                >
                                                    <span
                                                        className="text-xs font-medium"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        Total Employer Cost:
                                                    </span>
                                                    <span
                                                        className="text-xs font-bold"
                                                        style={{
                                                            color: "#0891b2",
                                                        }}
                                                    >
                                                        {formatCurrency(
                                                            previewResult.total_employer_cost,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div
                                className="rounded-xl p-5"
                                style={{
                                    background: "#dcfce7",
                                    border: `1px solid #bbf7d0`,
                                }}
                            >
                                <h4
                                    className="text-xs font-semibold mb-2 flex items-center gap-1"
                                    style={{ color: "#16a34a" }}
                                >
                                    <i className="ri-lightbulb-line"></i>How
                                    Calculations Work
                                </h4>
                                <ul
                                    className="space-y-1.5 text-xs"
                                    style={{ color: "#166534" }}
                                >
                                    <li>
                                        • Tax is calculated on annual income
                                        minus consolidated relief
                                    </li>
                                    <li>
                                        • Progressive tax brackets apply to the
                                        taxable portion
                                    </li>
                                    <li>
                                        • Pension contributions are deducted
                                        before tax
                                    </li>
                                    <li>
                                        • Employer pays additional pension +
                                        NSITF contributions
                                    </li>
                                    <li>
                                        • NHF applies to salaries above minimum
                                        threshold
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== EMPLOYEE COMPENSATION TAB ==================== */}
                {activeTab === "employee-compensation" && (
                    <div>
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                            {[
                                {
                                    label: "Total Employees",
                                    value:
                                        props.employeeCompensations?.total || 0,
                                    icon: "ri-team-line",
                                    color: "#10b981",
                                },
                                {
                                    label: "Active",
                                    value: (
                                        props.employeeCompensations?.data || []
                                    ).filter((c) => c.status === "active")
                                        .length,
                                    icon: "ri-checkbox-circle-line",
                                    color: "#16a34a",
                                },
                                {
                                    label: "Pending",
                                    value: (
                                        props.employeeCompensations?.data || []
                                    ).filter((c) => c.status === "pending")
                                        .length,
                                    icon: "ri-time-line",
                                    color: "#f59e0b",
                                },
                                {
                                    label: "Avg Basic Salary",
                                    value: formatCompact(
                                        (
                                            props.employeeCompensations?.data ||
                                            []
                                        ).reduce(
                                            (s, c) => s + c.basic_salary,
                                            0,
                                        ) /
                                            (props.employeeCompensations?.data
                                                .length || 1),
                                    ),
                                    icon: "ri-money-dollar-circle-line",
                                    color: "#06b6d4",
                                },
                                {
                                    label: "Total Monthly",
                                    value: formatCompact(
                                        (
                                            props.employeeCompensations?.data ||
                                            []
                                        ).reduce((s, c) => s + c.net_salary, 0),
                                    ),
                                    icon: "ri-bank-line",
                                    color: "#8b5cf6",
                                },
                            ].map((stat, idx) => (
                                <div
                                    key={idx}
                                    className="p-4 rounded-xl"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    <p
                                        className="text-xs"
                                        style={{ color: textSecondary }}
                                    >
                                        {stat.label}
                                    </p>
                                    <p
                                        className="text-xl font-bold mt-1"
                                        style={{ color: stat.color }}
                                    >
                                        {stat.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-4">
                            <div className="flex-1 flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1 max-w-sm">
                                    <i
                                        className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                                        style={{ color: textSecondary }}
                                    ></i>
                                    <input
                                        type="text"
                                        placeholder="Search by name, ID, or department..."
                                        value={searchTerm}
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm"
                                        style={{
                                            background: cardBg,
                                            border: `1px solid ${border}`,
                                            color: textPrimary,
                                        }}
                                    />
                                </div>
                                <select
                                    value={filterDept}
                                    onChange={(e) =>
                                        setFilterDept(e.target.value)
                                    }
                                    className="px-4 py-2.5 rounded-xl text-sm"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                >
                                    <option value="">All Departments</option>
                                    {props.departments?.map((dept) => (
                                        <option key={dept} value={dept}>
                                            {dept}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    value={filterStatus}
                                    onChange={(e) =>
                                        setFilterStatus(e.target.value)
                                    }
                                    className="px-4 py-2.5 rounded-xl text-sm"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() =>
                                        setBulkUpdateMode(!bulkUpdateMode)
                                    }
                                    className={`px-4 py-2.5 rounded-xl text-sm font-medium ${bulkUpdateMode ? "text-white" : ""}`}
                                    style={{
                                        background: bulkUpdateMode
                                            ? "#f59e0b"
                                            : isDark
                                              ? "#334155"
                                              : "#f1f5f9",
                                        color: bulkUpdateMode
                                            ? undefined
                                            : textSecondary,
                                    }}
                                >
                                    <i className="ri-edit-line mr-1.5"></i>Bulk
                                    Update
                                </button>
                                <button
                                    onClick={handleImportExcel}
                                    className="px-4 py-2.5 rounded-xl text-sm font-medium"
                                    style={{
                                        background: isDark
                                            ? "#334155"
                                            : "#f1f5f9",
                                        color: textSecondary,
                                    }}
                                >
                                    <i className="ri-upload-line mr-1.5"></i>
                                    Import
                                </button>
                                <button
                                    onClick={handleExportCompensations}
                                    className="px-4 py-2.5 rounded-xl text-sm font-medium"
                                    style={{
                                        background: isDark
                                            ? "#334155"
                                            : "#f1f5f9",
                                        color: textSecondary,
                                    }}
                                >
                                    <i className="ri-download-line mr-1.5"></i>
                                    Export
                                </button>
                            </div>
                        </div>

                        {/* Bulk Update Panel */}
                        {bulkUpdateMode && (
                            <div
                                className="p-5 rounded-xl mb-4"
                                style={{
                                    background: isDark ? "#1e293b" : "#fef9c3",
                                    border: `1px solid ${border}`,
                                }}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3
                                        className="text-sm font-semibold"
                                        style={{ color: textPrimary }}
                                    >
                                        Bulk Update ({selectedEmployees.length}{" "}
                                        selected)
                                    </h3>
                                    <button
                                        onClick={() => {
                                            setBulkUpdateMode(false);
                                            setSelectedEmployees([]);
                                        }}
                                        className="text-sm"
                                        style={{ color: textSecondary }}
                                    >
                                        <i className="ri-close-line"></i> Cancel
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                                    <div>
                                        <label
                                            className="text-xs font-medium mb-1 block"
                                            style={{ color: textSecondary }}
                                        >
                                            Increase Type
                                        </label>
                                        <select
                                            value={bulkUpdateData.increase_type}
                                            onChange={(e) =>
                                                setBulkUpdateData({
                                                    ...bulkUpdateData,
                                                    increase_type: e.target
                                                        .value as any,
                                                })
                                            }
                                            className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{
                                                background: inputBg,
                                                border: `1px solid ${border}`,
                                                color: textPrimary,
                                            }}
                                        >
                                            <option value="percentage">
                                                Percentage (%)
                                            </option>
                                            <option value="fixed">
                                                Fixed Amount (₦)
                                            </option>
                                        </select>
                                    </div>
                                    <div>
                                        <label
                                            className="text-xs font-medium mb-1 block"
                                            style={{ color: textSecondary }}
                                        >
                                            {bulkUpdateData.increase_type ===
                                            "percentage"
                                                ? "Increase (%)"
                                                : "Amount (₦)"}
                                        </label>
                                        <input
                                            type="number"
                                            value={
                                                bulkUpdateData.increase_value
                                            }
                                            onChange={(e) =>
                                                setBulkUpdateData({
                                                    ...bulkUpdateData,
                                                    increase_value:
                                                        parseFloat(
                                                            e.target.value,
                                                        ) || 0,
                                                })
                                            }
                                            className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{
                                                background: inputBg,
                                                border: `1px solid ${border}`,
                                                color: textPrimary,
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className="text-xs font-medium mb-1 block"
                                            style={{ color: textSecondary }}
                                        >
                                            Effective Date
                                        </label>
                                        <input
                                            type="date"
                                            value={
                                                bulkUpdateData.effective_date
                                            }
                                            onChange={(e) =>
                                                setBulkUpdateData({
                                                    ...bulkUpdateData,
                                                    effective_date:
                                                        e.target.value,
                                                })
                                            }
                                            className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{
                                                background: inputBg,
                                                border: `1px solid ${border}`,
                                                color: textPrimary,
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            className="text-xs font-medium mb-1 block"
                                            style={{ color: textSecondary }}
                                        >
                                            Reason
                                        </label>
                                        <input
                                            type="text"
                                            value={bulkUpdateData.reason}
                                            onChange={(e) =>
                                                setBulkUpdateData({
                                                    ...bulkUpdateData,
                                                    reason: e.target.value,
                                                })
                                            }
                                            placeholder="e.g., Annual increment"
                                            className="w-full px-3 py-2 rounded-lg text-sm"
                                            style={{
                                                background: inputBg,
                                                border: `1px solid ${border}`,
                                                color: textPrimary,
                                            }}
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleBulkUpdate}
                                    className="mt-4 px-6 py-2.5 rounded-xl text-sm font-medium text-white"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #f59e0b, #d97706)",
                                    }}
                                >
                                    <i className="ri-check-line mr-1.5"></i>
                                    Apply to {selectedEmployees.length}{" "}
                                    Employees
                                </button>
                            </div>
                        )}

                        {/* Compensation Table */}
                        <div
                            className="rounded-xl overflow-hidden"
                            style={{
                                background: cardBg,
                                border: `1px solid ${border}`,
                            }}
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1100px]">
                                    <thead>
                                        <tr
                                            style={{
                                                borderBottom: `1px solid ${border}`,
                                                background: isDark
                                                    ? "#0f172a"
                                                    : "#f8fafc",
                                            }}
                                        >
                                            {bulkUpdateMode && (
                                                <th className="px-3 py-3 w-10">
                                                    <input
                                                        type="checkbox"
                                                        checked={
                                                            selectedEmployees.length ===
                                                                filteredCompensations.length &&
                                                            filteredCompensations.length >
                                                                0
                                                        }
                                                        onChange={
                                                            toggleAllEmployees
                                                        }
                                                        className="w-4 h-4 rounded"
                                                    />
                                                </th>
                                            )}
                                            {[
                                                "Employee",
                                                "Department",
                                                "Structure",
                                                "Basic Salary",
                                                "Allowances",
                                                "Deductions",
                                                "Net Salary",
                                                "Effective Date",
                                                "Status",
                                                "Actions",
                                            ].map((h) => (
                                                <th
                                                    key={h}
                                                    className="px-3 py-3 text-left text-xs font-semibold whitespace-nowrap"
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
                                        {filteredCompensations.map((comp) => (
                                            <tr
                                                key={comp.id}
                                                className="hover:bg-opacity-50"
                                                style={{
                                                    borderBottom: `1px solid ${border}`,
                                                }}
                                                onMouseEnter={(e) =>
                                                    (e.currentTarget.style.background =
                                                        isDark
                                                            ? "#1e293b"
                                                            : "#f8fafc")
                                                }
                                                onMouseLeave={(e) =>
                                                    (e.currentTarget.style.background =
                                                        "transparent")
                                                }
                                            >
                                                {bulkUpdateMode && (
                                                    <td className="px-3 py-3">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedEmployees.includes(
                                                                comp.employee_id,
                                                            )}
                                                            onChange={() =>
                                                                toggleEmployeeSelection(
                                                                    comp.employee_id,
                                                                )
                                                            }
                                                            className="w-4 h-4 rounded"
                                                        />
                                                    </td>
                                                )}
                                                <td className="px-3 py-3">
                                                    <p
                                                        className="text-sm font-medium"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {comp.employee_name}
                                                    </p>
                                                    <p
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {comp.employee_id}
                                                    </p>
                                                </td>
                                                <td
                                                    className="px-3 py-3 text-sm"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {comp.department}
                                                </td>
                                                <td
                                                    className="px-3 py-3 text-sm"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {comp.salary_structure_name ||
                                                        "—"}
                                                </td>
                                                <td
                                                    className="px-3 py-3 text-sm font-semibold"
                                                    style={{
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {formatCurrency(
                                                        comp.basic_salary,
                                                    )}
                                                </td>
                                                <td
                                                    className="px-3 py-3 text-sm"
                                                    style={{ color: "#16a34a" }}
                                                >
                                                    {comp.total_allowances > 0
                                                        ? formatCurrency(
                                                              comp.total_allowances,
                                                          )
                                                        : "—"}
                                                </td>
                                                <td
                                                    className="px-3 py-3 text-sm"
                                                    style={{ color: "#dc2626" }}
                                                >
                                                    {comp.total_deductions > 0
                                                        ? formatCurrency(
                                                              comp.total_deductions,
                                                          )
                                                        : "—"}
                                                </td>
                                                <td
                                                    className="px-3 py-3 text-sm font-bold"
                                                    style={{ color: "#16a34a" }}
                                                >
                                                    {formatCurrency(
                                                        comp.net_salary,
                                                    )}
                                                </td>
                                                <td
                                                    className="px-3 py-3 text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    {formatDate(
                                                        comp.effective_date,
                                                    )}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            comp.status ===
                                                            "active"
                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                : comp.status ===
                                                                    "pending"
                                                                  ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                                        }`}
                                                    >
                                                        {comp.status
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            comp.status.slice(
                                                                1,
                                                            )}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <button
                                                        onClick={() =>
                                                            setEditingCompensation(
                                                                comp,
                                                            )
                                                        }
                                                        className="text-xs font-medium"
                                                        style={{
                                                            color: "#16a34a",
                                                        }}
                                                    >
                                                        <i className="ri-edit-line mr-1"></i>
                                                        Edit
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredCompensations.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={
                                                        bulkUpdateMode ? 11 : 10
                                                    }
                                                    className="py-12 text-center"
                                                >
                                                    <div
                                                        className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center"
                                                        style={{
                                                            background: isDark
                                                                ? "#334155"
                                                                : "#f1f5f9",
                                                        }}
                                                    >
                                                        <i
                                                            className="ri-user-settings-line text-2xl"
                                                            style={{
                                                                color: textSecondary,
                                                            }}
                                                        ></i>
                                                    </div>
                                                    <p
                                                        className="text-sm"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        No employee compensation
                                                        records found
                                                    </p>
                                                    <button
                                                        onClick={
                                                            handleImportExcel
                                                        }
                                                        className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white"
                                                        style={{
                                                            background:
                                                                "#16a34a",
                                                        }}
                                                    >
                                                        <i className="ri-upload-line mr-1.5"></i>
                                                        Import Salary Data
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {props.employeeCompensations &&
                                props.employeeCompensations.last_page > 1 && (
                                    <div
                                        className="px-5 py-4 flex items-center justify-between border-t"
                                        style={{ borderColor: border }}
                                    >
                                        <p
                                            className="text-xs"
                                            style={{ color: textSecondary }}
                                        >
                                            Showing{" "}
                                            {(props.employeeCompensations
                                                .current_page -
                                                1) *
                                                props.employeeCompensations
                                                    .per_page +
                                                1}{" "}
                                            to{" "}
                                            {Math.min(
                                                props.employeeCompensations
                                                    .current_page *
                                                    props.employeeCompensations
                                                        .per_page,
                                                props.employeeCompensations
                                                    .total,
                                            )}{" "}
                                            of{" "}
                                            {props.employeeCompensations.total}{" "}
                                            records
                                        </p>
                                        <div className="flex items-center gap-1">
                                            {Array.from(
                                                {
                                                    length: props
                                                        .employeeCompensations
                                                        .last_page,
                                                },
                                                (_, i) => i + 1,
                                            ).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() =>
                                                        // Make sure ?tab= stays persistent in the URL for pagination as well
                                                        router.get(
                                                            route(
                                                                "settings.payroll.index",
                                                            ),
                                                            {
                                                                page,
                                                                tab: activeTab,
                                                            },
                                                            {
                                                                preserveState: true,
                                                                preserveScroll: true,
                                                            },
                                                        )
                                                    }
                                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                                                        page ===
                                                        props
                                                            .employeeCompensations
                                                            .current_page
                                                            ? "text-white"
                                                            : ""
                                                    }`}
                                                    style={
                                                        page ===
                                                        props
                                                            .employeeCompensations
                                                            .current_page
                                                            ? {
                                                                  background:
                                                                      "#16a34a",
                                                              }
                                                            : {
                                                                  background:
                                                                      isDark
                                                                          ? "#334155"
                                                                          : "#f1f5f9",
                                                                  color: textSecondary,
                                                              }
                                                    }
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    </div>
                )}

                {/* ==================== SALARY STRUCTURES TAB ==================== */}
                {activeTab === "salary-structures" && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3
                                    className="text-sm font-semibold"
                                    style={{ color: textPrimary }}
                                >
                                    Salary Structures (
                                    {props.salaryStructures?.length || 0})
                                </h3>
                                <p
                                    className="text-xs mt-0.5"
                                    style={{ color: textSecondary }}
                                >
                                    Define grade levels with salary ranges and
                                    components
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setEditingStructure(null);
                                    setShowStructureModal(true);
                                }}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium text-white"
                                style={{
                                    background:
                                        "linear-gradient(135deg, #16a34a, #15803d)",
                                }}
                            >
                                <i className="ri-add-line mr-1.5"></i>Add
                                Structure
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(props.salaryStructures || []).map((structure) => (
                                <div
                                    key={structure.id}
                                    className="rounded-xl p-5 relative group transition-all hover:shadow-lg"
                                    style={{
                                        background: cardBg,
                                        border: `1px solid ${border}`,
                                    }}
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h3
                                                    className="text-sm font-semibold"
                                                    style={{
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {structure.name}
                                                </h3>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                                        structure.is_active
                                                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                            : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                                                    }`}
                                                >
                                                    {structure.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </div>
                                            <p
                                                className="text-xs mt-0.5 font-mono"
                                                style={{ color: textSecondary }}
                                            >
                                                {structure.code}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    {structure.description && (
                                        <p
                                            className="text-xs mb-3"
                                            style={{ color: textSecondary }}
                                        >
                                            {structure.description}
                                        </p>
                                    )}

                                    {/* Stats */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex justify-between text-xs">
                                            <span
                                                style={{ color: textSecondary }}
                                            >
                                                Salary Range:
                                            </span>
                                            <span
                                                className="font-medium"
                                                style={{ color: textPrimary }}
                                            >
                                                {formatCompact(
                                                    structure.basic_salary_min,
                                                )}{" "}
                                                -{" "}
                                                {formatCompact(
                                                    structure.basic_salary_max,
                                                )}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span
                                                style={{ color: textSecondary }}
                                            >
                                                Components:
                                            </span>
                                            <span
                                                className="font-medium"
                                                style={{ color: textPrimary }}
                                            >
                                                {structure.components_count ||
                                                    0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span
                                                style={{ color: textSecondary }}
                                            >
                                                Employees:
                                            </span>
                                            <span
                                                className="font-medium"
                                                style={{ color: textPrimary }}
                                            >
                                                {structure.employees_count || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div
                                        className="flex gap-2 pt-3 border-t"
                                        style={{ borderColor: border }}
                                    >
                                        <button
                                            onClick={() => {
                                                setEditingStructure(structure);
                                                setShowStructureModal(true);
                                            }}
                                            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                                            style={{
                                                background: isDark
                                                    ? "#334155"
                                                    : "#f1f5f9",
                                                color: textSecondary,
                                            }}
                                        >
                                            <i className="ri-edit-line mr-1"></i>
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => {
                                                setSelectedStructure(structure);
                                                setShowViewStructureModal(true);
                                            }}
                                            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                                            style={{
                                                background: isDark
                                                    ? "#334155"
                                                    : "#f1f5f9",
                                                color: textSecondary,
                                            }}
                                        >
                                            <i className="ri-eye-line mr-1"></i>
                                            View
                                        </button>
                                        <button
                                            onClick={() => {
                                                router.put(
                                                    `/settings/payroll/structures/${structure.id}/toggle`,
                                                    {},
                                                    {
                                                        onSuccess: () =>
                                                            showToast(
                                                                "success",
                                                                "Updated",
                                                                "Structure status toggled",
                                                            ),
                                                    },
                                                );
                                            }}
                                            className="px-3 py-2 rounded-lg text-xs font-medium transition-colors hover:opacity-80"
                                            style={{
                                                background: structure.is_active
                                                    ? "#fee2e2"
                                                    : "#dcfce7",
                                                color: structure.is_active
                                                    ? "#dc2626"
                                                    : "#16a34a",
                                            }}
                                        >
                                            <i
                                                className={`ri-${structure.is_active ? "pause" : "play"}-circle-line`}
                                            ></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {(props.salaryStructures || []).length === 0 && (
                            <div className="py-16 text-center">
                                <div
                                    className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
                                    style={{
                                        background: isDark
                                            ? "#334155"
                                            : "#f1f5f9",
                                    }}
                                >
                                    <i
                                        className="ri-stack-line text-3xl"
                                        style={{ color: textSecondary }}
                                    ></i>
                                </div>
                                <h3
                                    className="text-base font-semibold mb-2"
                                    style={{ color: textPrimary }}
                                >
                                    No Salary Structures
                                </h3>
                                <p
                                    className="text-sm mb-6"
                                    style={{ color: textSecondary }}
                                >
                                    Create your first salary structure to
                                    organize employee compensation
                                </p>
                                <button
                                    onClick={() => {
                                        setEditingStructure(null);
                                        setShowStructureModal(true);
                                    }}
                                    className="px-6 py-3 rounded-xl text-sm font-medium text-white"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #16a34a, #15803d)",
                                    }}
                                >
                                    <i className="ri-add-line mr-1.5"></i>
                                    Create Structure
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <ImportSalaryModal
                isOpen={showImportModal}
                onClose={() => setShowImportModal(false)}
            />

            {/* Add Structure Modal */}
            <AddSalaryStructureModal
                isOpen={showStructureModal}
                onClose={() => {
                    setShowStructureModal(false);
                    setEditingStructure(null);
                }}
                components={props.salaryComponents || []}
                editData={editingStructure} // Pass edit data
            />

            <ViewSalaryStructureModal
                isOpen={showViewStructureModal}
                onClose={() => {
                    setShowViewStructureModal(false);
                    setSelectedStructure(null);
                }}
                structure={selectedStructure}
            />

            {showEditCompensationModal && editingCompensation && (
                <EditCompensationModal
                    isOpen={showEditCompensationModal}
                    onClose={() => {
                        setShowEditCompensationModal(false);
                        setEditingCompensation(null);
                    }}
                    compensation={editingCompensation}
                />
            )}
        </AppLayout>
    );
}
