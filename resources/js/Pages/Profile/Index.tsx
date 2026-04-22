import { useState, useRef } from "react";
import { usePage, router } from "@inertiajs/react";
import AppLayout from "@/Layouts/AppLayout";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/Components/base/Toast";
import type { PageProps } from "@/types";

interface Props extends PageProps {
    user: {
        id: number;
        name: string;
        email: string;
        avatar: string | null;
        initials: string;
        status: string;
        roles: string[];
        created_at: string;
    };
}

export default function ProfilePage() {
    const { isDark } = useTheme();
    const { showToast } = useToast();
    const { props } = usePage<Props>();
    const { user } = props;

    const [isEditing, setIsEditing] = useState(false);
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [form, setForm] = useState({ name: user.name, email: user.email });
    const [passwordForm, setPasswordForm] = useState({
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const bg = isDark ? "#111827" : "#f8fafc";
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const border = isDark ? "#374151" : "#e5e7eb";
    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const inputBg = isDark ? "#374151" : "#f9fafb";

    const handleSave = () => {
        setIsSubmitting(true);
        router.put("/profile", form, {
            onSuccess: () => {
                setIsEditing(false);
                showToast(
                    "success",
                    "Profile Updated",
                    "Your information has been saved.",
                );
                setIsSubmitting(false);
            },
            onError: (errors: any) => {
                showToast(
                    "error",
                    "Update Failed",
                    Object.values(errors).flat().join(", "),
                );
                setIsSubmitting(false);
            },
        });
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("avatar", file);

        router.post("/profile/avatar", formData, {
            onSuccess: () => {
                showToast(
                    "success",
                    "Avatar Updated",
                    "Your profile picture has been updated.",
                );
                setIsUploading(false);
            },
            onError: (errors: any) => {
                showToast(
                    "error",
                    "Upload Failed",
                    Object.values(errors).flat().join(", "),
                );
                setIsUploading(false);
            },
        });
    };

    const handlePasswordChange = () => {
        setIsSubmitting(true);
        router.put("/profile/password", passwordForm, {
            onSuccess: () => {
                setShowSecurityModal(false);
                setPasswordForm({
                    current_password: "",
                    new_password: "",
                    new_password_confirmation: "",
                });
                showToast(
                    "success",
                    "Password Changed",
                    "Your password has been updated.",
                );
                setIsSubmitting(false);
            },
            onError: (errors: any) => {
                showToast(
                    "error",
                    "Change Failed",
                    Object.values(errors).flat().join(", "),
                );
                setIsSubmitting(false);
            },
        });
    };

    return (
        <AppLayout title="My Profile">
            <div
                className="p-4 sm:p-6 max-w-4xl mx-auto"
                style={{ background: bg, minHeight: "100vh" }}
            >
                <div className="mb-6">
                    <h1
                        className="text-xl sm:text-2xl font-bold"
                        style={{ color: textPrimary }}
                    >
                        My Profile
                    </h1>
                    <p
                        className="text-sm mt-0.5"
                        style={{ color: textSecondary }}
                    >
                        Manage your account information and security settings
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Profile Card */}
                    <div
                        className="rounded-xl sm:rounded-2xl p-5 sm:p-6"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                        }}
                    >
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            {/* Avatar */}
                            <div className="relative">
                                <div
                                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-lg"
                                    style={{
                                        background: user.avatar
                                            ? "transparent"
                                            : "linear-gradient(135deg, #16a34a, #15803d)",
                                    }}
                                >
                                    {user.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt={user.name}
                                            className="w-full h-full rounded-2xl object-cover"
                                        />
                                    ) : (
                                        user.initials
                                    )}
                                </div>
                                <button
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={isUploading}
                                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-105"
                                    style={{
                                        background: "#16a34a",
                                        color: "white",
                                    }}
                                >
                                    <i
                                        className={`ri-${isUploading ? "loader-4-line animate-spin" : "camera-line"} text-sm`}
                                    ></i>
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleAvatarUpload}
                                    accept="image/*"
                                    className="hidden"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 w-full">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                                    <div>
                                        <h2
                                            className="text-lg font-bold"
                                            style={{ color: textPrimary }}
                                        >
                                            {user.name}
                                        </h2>
                                        <p
                                            className="text-sm"
                                            style={{ color: textSecondary }}
                                        >
                                            {user.email}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!isEditing ? (
                                            <button
                                                onClick={() =>
                                                    setIsEditing(true)
                                                }
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                                                style={{
                                                    background: isDark
                                                        ? "#374151"
                                                        : "#f3f4f6",
                                                    color: textPrimary,
                                                }}
                                            >
                                                <i className="ri-edit-line"></i>{" "}
                                                Edit Profile
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setForm({
                                                            name: user.name,
                                                            email: user.email,
                                                        });
                                                    }}
                                                    className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                                                    style={{
                                                        background: isDark
                                                            ? "#374151"
                                                            : "#f3f4f6",
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleSave}
                                                    disabled={isSubmitting}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white cursor-pointer disabled:opacity-50"
                                                    style={{
                                                        background: "#16a34a",
                                                    }}
                                                >
                                                    {isSubmitting ? (
                                                        <i className="ri-loader-4-line animate-spin"></i>
                                                    ) : (
                                                        <i className="ri-check-line"></i>
                                                    )}
                                                    Save Changes
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-4">
                                        <div>
                                            <label
                                                className="text-xs font-medium mb-1 block"
                                                style={{ color: textSecondary }}
                                            >
                                                Full Name
                                            </label>
                                            <input
                                                value={form.name}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        name: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
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
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={form.email}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        email: e.target.value,
                                                    })
                                                }
                                                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                                style={{
                                                    background: inputBg,
                                                    border: `1px solid ${border}`,
                                                    color: textPrimary,
                                                }}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{
                                                    background: isDark
                                                        ? "#374151"
                                                        : "#f3f4f6",
                                                }}
                                            >
                                                <i
                                                    className="ri-shield-user-line text-sm"
                                                    style={{ color: "#16a34a" }}
                                                ></i>
                                            </div>
                                            <div>
                                                <p
                                                    className="text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    Role
                                                </p>
                                                <p
                                                    className="text-sm font-medium"
                                                    style={{
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {user.roles?.join(", ") ||
                                                        "Staff"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{
                                                    background: isDark
                                                        ? "#374151"
                                                        : "#f3f4f6",
                                                }}
                                            >
                                                <i
                                                    className="ri-calendar-line text-sm"
                                                    style={{ color: "#16a34a" }}
                                                ></i>
                                            </div>
                                            <div>
                                                <p
                                                    className="text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    Member Since
                                                </p>
                                                <p
                                                    className="text-sm font-medium"
                                                    style={{
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    {user.created_at}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                style={{
                                                    background: isDark
                                                        ? "#374151"
                                                        : "#f3f4f6",
                                                }}
                                            >
                                                <i
                                                    className="ri-checkbox-circle-line text-sm"
                                                    style={{ color: "#16a34a" }}
                                                ></i>
                                            </div>
                                            <div>
                                                <p
                                                    className="text-xs"
                                                    style={{
                                                        color: textSecondary,
                                                    }}
                                                >
                                                    Status
                                                </p>
                                                <p
                                                    className="text-sm font-medium"
                                                    style={{ color: "#16a34a" }}
                                                >
                                                    {user.status}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div
                        className="rounded-xl sm:rounded-2xl p-5 sm:p-6"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                        }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3
                                    className="text-base font-semibold"
                                    style={{ color: textPrimary }}
                                >
                                    Security
                                </h3>
                                <p
                                    className="text-xs mt-0.5"
                                    style={{ color: textSecondary }}
                                >
                                    Manage your password and security
                                    preferences
                                </p>
                            </div>
                            <button
                                onClick={() => setShowSecurityModal(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer"
                                style={{
                                    background: isDark ? "#374151" : "#f3f4f6",
                                    color: textPrimary,
                                }}
                            >
                                <i className="ri-key-line"></i> Change Password
                            </button>
                        </div>

                        <div
                            className="p-4 rounded-xl"
                            style={{
                                background: isDark ? "#374151" : "#f0fdf4",
                                border: `1px solid ${isDark ? "#4b5563" : "#bbf7d0"}`,
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <i
                                    className="ri-shield-check-line text-lg"
                                    style={{ color: "#16a34a" }}
                                ></i>
                                <div>
                                    <p
                                        className="text-sm font-medium"
                                        style={{ color: "#16a34a" }}
                                    >
                                        Password last changed recently
                                    </p>
                                    <p
                                        className="text-xs"
                                        style={{ color: textSecondary }}
                                    >
                                        Your account is secure. Change your
                                        password regularly for best security.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div
                        className="rounded-xl sm:rounded-2xl p-5 sm:p-6"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                        }}
                    >
                        <h3
                            className="text-base font-semibold mb-4"
                            style={{ color: textPrimary }}
                        >
                            Recent Activity
                        </h3>
                        <div className="space-y-3">
                            {[
                                {
                                    icon: "ri-login-box-line",
                                    text: "Logged in from Chrome on Windows",
                                    time: "Just now",
                                },
                                {
                                    icon: "ri-device-line",
                                    text: 'Device "Head office 2" came online',
                                    time: "2 hours ago",
                                },
                                {
                                    icon: "ri-settings-3-line",
                                    text: "Settings updated",
                                    time: "Yesterday",
                                },
                            ].map((activity, i) => (
                                <div
                                    key={i}
                                    className="flex items-center gap-3"
                                >
                                    <div
                                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{
                                            background: isDark
                                                ? "#374151"
                                                : "#f3f4f6",
                                        }}
                                    >
                                        <i
                                            className={`${activity.icon} text-sm`}
                                            style={{ color: textSecondary }}
                                        ></i>
                                    </div>
                                    <div className="flex-1">
                                        <p
                                            className="text-sm"
                                            style={{ color: textPrimary }}
                                        >
                                            {activity.text}
                                        </p>
                                    </div>
                                    <span
                                        className="text-xs"
                                        style={{ color: textSecondary }}
                                    >
                                        {activity.time}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Security Modal */}
            {showSecurityModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: "rgba(0,0,0,0.5)" }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget)
                            setShowSecurityModal(false);
                    }}
                >
                    <div
                        className="w-full max-w-md rounded-2xl"
                        style={{
                            background: cardBg,
                            border: `1px solid ${border}`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div
                            className="flex items-center justify-between px-6 py-4"
                            style={{ borderBottom: `1px solid ${border}` }}
                        >
                            <h3
                                className="text-base font-semibold"
                                style={{ color: textPrimary }}
                            >
                                Change Password
                            </h3>
                            <button
                                onClick={() => setShowSecurityModal(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer"
                                style={{ color: textSecondary }}
                            >
                                <i className="ri-close-line text-lg"></i>
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <label
                                    className="text-xs font-medium mb-1 block"
                                    style={{ color: textSecondary }}
                                >
                                    Current Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.current_password}
                                    onChange={(e) =>
                                        setPasswordForm({
                                            ...passwordForm,
                                            current_password: e.target.value,
                                        })
                                    }
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
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
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.new_password}
                                    onChange={(e) =>
                                        setPasswordForm({
                                            ...passwordForm,
                                            new_password: e.target.value,
                                        })
                                    }
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
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
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={
                                        passwordForm.new_password_confirmation
                                    }
                                    onChange={(e) =>
                                        setPasswordForm({
                                            ...passwordForm,
                                            new_password_confirmation:
                                                e.target.value,
                                        })
                                    }
                                    placeholder="••••••••"
                                    className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                                    style={{
                                        background: inputBg,
                                        border: `1px solid ${border}`,
                                        color: textPrimary,
                                    }}
                                />
                            </div>

                            <div
                                className="p-3 rounded-xl"
                                style={{
                                    background: "#f0fdf4",
                                    border: "1px solid #bbf7d0",
                                }}
                            >
                                <p
                                    className="text-xs"
                                    style={{ color: "#16a34a" }}
                                >
                                    <i className="ri-information-line mr-1"></i>
                                    Password must be at least 8 characters.
                                </p>
                            </div>
                        </div>

                        <div
                            className="px-6 py-4 flex items-center justify-end gap-3"
                            style={{ borderTop: `1px solid ${border}` }}
                        >
                            <button
                                onClick={() => setShowSecurityModal(false)}
                                className="px-4 py-2 text-sm rounded-lg cursor-pointer font-medium"
                                style={{
                                    background: isDark ? "#374151" : "#f3f4f6",
                                    color: textSecondary,
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordChange}
                                disabled={isSubmitting}
                                className="px-5 py-2 text-sm rounded-lg cursor-pointer font-semibold text-white disabled:opacity-50"
                                style={{ background: "#16a34a" }}
                            >
                                {isSubmitting ? (
                                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                                ) : null}
                                {isSubmitting
                                    ? "Updating..."
                                    : "Update Password"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
