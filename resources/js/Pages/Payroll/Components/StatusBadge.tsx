import React from "react";

interface StatusBadgeProps {
    status: "draft" | "processing" | "approved" | "paid" | "closed";
    size?: "sm" | "md" | "lg";
    withIcon?: boolean;
}

const STATUS_CONFIG: Record<
    string,
    { bg: string; color: string; label: string; icon: string }
> = {
    draft: {
        bg: "#f3f4f6",
        color: "#6b7280",
        label: "Draft",
        icon: "ri-draft-line",
    },
    processing: {
        bg: "#fef9c3",
        color: "#ca8a04",
        label: "Processing",
        icon: "ri-time-line",
    },
    approved: {
        bg: "#dcfce7",
        color: "#16a34a",
        label: "Approved",
        icon: "ri-checkbox-circle-line",
    },
    paid: {
        bg: "#dbeafe",
        color: "#2563eb",
        label: "Paid",
        icon: "ri-bank-card-line",
    },
    closed: {
        bg: "#f3f4f6",
        color: "#4b5563",
        label: "Closed",
        icon: "ri-archive-line",
    },
};

export default function StatusBadge({
    status,
    size = "md",
    withIcon = true,
}: StatusBadgeProps) {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

    const sizeClasses = {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]}`}
            style={{ background: config.bg, color: config.color }}
        >
            {withIcon && (
                <i
                    className={`${config.icon} ${size === "lg" ? "text-sm" : "text-xs"}`}
                ></i>
            )}
            {config.label}
        </span>
    );
}
