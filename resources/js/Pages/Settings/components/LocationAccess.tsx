import { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import Modal from "@/Components/base/Modal";
import { useToast } from "@/Components/base/Toast";

interface Location {
    id: number;
    name: string;
    code: string;
}

interface UserAccess {
    id: number;
    name: string;
    email: string;
    roles: { name: string }[];
    managed_locations?: Location[];
    managed_areas?: { id: number; area_name: string }[];
}

interface Props {
    users: UserAccess[];
    locations: Location[];
    areas?: string[]; // Keeping for backward compatibility, but will be merged with locations
    isDark: boolean;
    onUpdate?: () => void;
}

export default function LocationAccess({
    users,
    locations,
    areas = [],
    isDark,
    onUpdate,
}: Props) {
    const { showToast } = useToast();
    const [selectedUser, setSelectedUser] = useState<UserAccess | null>(null);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [selectedLocations, setSelectedLocations] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [hoveredLocations, setHoveredLocations] = useState<Location[] | null>(
        null,
    );
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

    const textPrimary = isDark ? "#f9fafb" : "#111827";
    const textSecondary = isDark ? "#9ca3af" : "#6b7280";
    const border = isDark ? "#374151" : "#e5e7eb";
    const cardBg = isDark ? "#1f2937" : "#ffffff";
    const tooltipBg = isDark ? "#1f2937" : "#ffffff";

    // Merge locations from both sources (for the modal)
    const allLocations = locations;

    const openLocationModal = (user: UserAccess) => {
        setSelectedUser(user);
        // Extract location IDs from managed_locations
        const locationIds = user.managed_locations?.map((l) => l.id) || [];

        // Also check if there are managed_areas and convert them to location IDs if they match
        if (user.managed_areas && user.managed_areas.length > 0) {
            const areaLocationIds = user.managed_areas
                .map((area) => {
                    const matchingLocation = allLocations.find(
                        (l) => l.name === area.area_name,
                    );
                    return matchingLocation?.id;
                })
                .filter((id): id is number => id !== undefined);

            // Merge unique location IDs
            areaLocationIds.forEach((id) => {
                if (!locationIds.includes(id)) {
                    locationIds.push(id);
                }
            });
        }

        setSelectedLocations(locationIds);
        setShowLocationModal(true);
    };

    const saveLocationAccess = () => {
        if (!selectedUser) return;

        setIsSaving(true);

        router.post(
            `/users/${selectedUser.id}/location-access`,
            {
                locations: selectedLocations,
                areas: [], // Send empty array since we're consolidating
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setShowLocationModal(false);
                    showToast(
                        "success",
                        "Access Updated",
                        `${selectedUser.name}'s location access has been updated.`,
                    );
                    onUpdate?.();
                    // Refresh the page data
                    router.reload({ only: ["users"] });
                },
                onError: (errors) => {
                    console.error("Update errors:", errors);
                    showToast(
                        "error",
                        "Update Failed",
                        "Could not update location access. Please try again.",
                    );
                },
                onFinish: () => {
                    setIsSaving(false);
                },
            },
        );
    };

    const toggleLocation = (id: number) => {
        setSelectedLocations((prev) =>
            prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
        );
    };

    const selectAllLocations = () => {
        if (selectedLocations.length === allLocations.length) {
            setSelectedLocations([]);
        } else {
            setSelectedLocations(allLocations.map((l) => l.id));
        }
    };

    // Helper to get user's primary role
    const getUserRole = (user: UserAccess) => {
        return user.roles?.[0]?.name || "Staff";
    };

    // Get all assigned locations for a user (merge both sources)
    const getAllAssignedLocations = (user: UserAccess): Location[] => {
        const locationsMap = new Map<number, Location>();

        // Add from managed_locations
        user.managed_locations?.forEach((loc) => {
            locationsMap.set(loc.id, loc);
        });

        // Add from managed_areas (convert area names to locations if they exist)
        user.managed_areas?.forEach((area) => {
            const matchingLocation = allLocations.find(
                (l) => l.name === area.area_name,
            );
            if (matchingLocation && !locationsMap.has(matchingLocation.id)) {
                locationsMap.set(matchingLocation.id, matchingLocation);
            }
        });

        return Array.from(locationsMap.values());
    };

    // Handle hover on "X more" text
    const handleMoreHover = (
        event: React.MouseEvent,
        locations: Location[],
    ) => {
        setHoveredLocations(locations);
        setHoverPosition({ x: event.clientX, y: event.clientY });
    };

    const handleMoreLeave = () => {
        setHoveredLocations(null);
    };

    return (
        <>
            <div className="space-y-4">
                <div
                    className="rounded-xl overflow-hidden"
                    style={{
                        background: cardBg,
                        border: `1px solid ${border}`,
                    }}
                >
                    <div
                        className="px-4 sm:px-5 py-3 sm:py-3.5"
                        style={{ borderBottom: `1px solid ${border}` }}
                    >
                        <h3
                            className="text-sm font-semibold"
                            style={{ color: textPrimary }}
                        >
                            User Location Access
                        </h3>
                        <p
                            className="text-xs mt-0.5"
                            style={{ color: textSecondary }}
                        >
                            Control which locations each user can manage
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr
                                    style={{
                                        borderBottom: `1px solid ${border}`,
                                    }}
                                >
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold"
                                        style={{ color: textSecondary }}
                                    >
                                        User
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold"
                                        style={{ color: textSecondary }}
                                    >
                                        Role
                                    </th>
                                    <th
                                        className="px-4 py-3 text-left text-xs font-semibold"
                                        style={{ color: textSecondary }}
                                    >
                                        Assigned Locations
                                    </th>
                                    <th
                                        className="px-4 py-3 text-right text-xs font-semibold"
                                        style={{ color: textSecondary }}
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {users?.map((user) => {
                                    const assignedLocations =
                                        getAllAssignedLocations(user);
                                    const hasLocations =
                                        assignedLocations.length > 0;
                                    const displayLocations =
                                        assignedLocations.slice(0, 2);
                                    const remainingCount =
                                        assignedLocations.length - 2;
                                    const remainingLocations =
                                        assignedLocations.slice(2);

                                    return (
                                        <tr
                                            key={user.id}
                                            style={{
                                                borderBottom: `1px solid ${border}`,
                                            }}
                                        >
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p
                                                        className="text-sm font-medium"
                                                        style={{
                                                            color: textPrimary,
                                                        }}
                                                    >
                                                        {user.name}
                                                    </p>
                                                    <p
                                                        className="text-xs"
                                                        style={{
                                                            color: textSecondary,
                                                        }}
                                                    >
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span
                                                    className="px-2 py-1 rounded-full text-xs font-medium"
                                                    style={{
                                                        background: "#dcfce7",
                                                        color: "#16a34a",
                                                    }}
                                                >
                                                    {getUserRole(user)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1 items-center">
                                                    {hasLocations ? (
                                                        <>
                                                            {displayLocations.map(
                                                                (loc) => (
                                                                    <span
                                                                        key={
                                                                            loc.id
                                                                        }
                                                                        className="px-2 py-0.5 rounded-full text-xs"
                                                                        style={{
                                                                            background:
                                                                                isDark
                                                                                    ? "#374151"
                                                                                    : "#f3f4f6",
                                                                            color: textSecondary,
                                                                        }}
                                                                    >
                                                                        {
                                                                            loc.name
                                                                        }
                                                                    </span>
                                                                ),
                                                            )}
                                                            {remainingCount >
                                                                0 && (
                                                                <span
                                                                    className="px-2 py-0.5 rounded-full text-xs cursor-help relative"
                                                                    style={{
                                                                        background:
                                                                            isDark
                                                                                ? "#374151"
                                                                                : "#f3f4f6",
                                                                        color: "#16a34a",
                                                                        border: `1px solid #16a34a`,
                                                                    }}
                                                                    onMouseEnter={(
                                                                        e,
                                                                    ) =>
                                                                        handleMoreHover(
                                                                            e,
                                                                            remainingLocations,
                                                                        )
                                                                    }
                                                                    onMouseLeave={
                                                                        handleMoreLeave
                                                                    }
                                                                >
                                                                    +
                                                                    {
                                                                        remainingCount
                                                                    }{" "}
                                                                    more
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span
                                                            className="text-xs italic"
                                                            style={{
                                                                color: textSecondary,
                                                            }}
                                                        >
                                                            All locations
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() =>
                                                        openLocationModal(user)
                                                    }
                                                    className="px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors hover:opacity-80"
                                                    style={{
                                                        background: isDark
                                                            ? "#374151"
                                                            : "#f3f4f6",
                                                        color: textPrimary,
                                                    }}
                                                >
                                                    <i className="ri-edit-line mr-1"></i>{" "}
                                                    Manage Access
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info Box */}
                <div
                    className="p-4 rounded-xl"
                    style={{
                        background: isDark ? "#374151" : "#f0fdf4",
                        border: `1px solid ${isDark ? "#4b5563" : "#bbf7d0"}`,
                    }}
                >
                    <p className="text-xs" style={{ color: "#16a34a" }}>
                        <i className="ri-information-line mr-1"></i>
                        <strong>Super Admin</strong> users automatically have
                        access to all locations. For other users, you can
                        restrict access to specific locations.
                    </p>
                </div>
            </div>

            {/* Hover Tooltip/Popover for remaining locations */}
            {hoveredLocations && hoveredLocations.length > 0 && (
                <div
                    className="fixed z-50 p-3 rounded-lg shadow-lg border min-w-[200px] max-w-[300px]"
                    style={{
                        background: tooltipBg,
                        border: `1px solid ${border}`,
                        top: hoverPosition.y + 15,
                        left: hoverPosition.x - 100,
                        boxShadow:
                            "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                    onMouseEnter={() => setHoveredLocations(hoveredLocations)}
                    onMouseLeave={handleMoreLeave}
                >
                    <p
                        className="text-xs font-semibold mb-2"
                        style={{ color: textPrimary }}
                    >
                        Assigned Locations
                    </p>
                    <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                        {hoveredLocations.map((loc) => (
                            <span
                                key={loc.id}
                                className="px-2 py-0.5 rounded-full text-xs"
                                style={{
                                    background: isDark ? "#374151" : "#f3f4f6",
                                    color: textSecondary,
                                }}
                            >
                                {loc.name}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Location Access Modal - Single section for locations only */}
            <Modal
                open={showLocationModal}
                onClose={() => setShowLocationModal(false)}
                title={`Manage Access - ${selectedUser?.name}`}
                size="lg"
                footer={
                    <>
                        <button
                            onClick={() => setShowLocationModal(false)}
                            className="px-4 py-2 text-sm rounded-lg cursor-pointer transition-colors hover:opacity-80"
                            style={{
                                background: isDark ? "#374151" : "#f3f4f6",
                                color: textSecondary,
                            }}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={saveLocationAccess}
                            disabled={isSaving}
                            className="px-5 py-2 text-sm rounded-lg cursor-pointer font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: "#16a34a" }}
                        >
                            {isSaving ? (
                                <>
                                    <i className="ri-loader-4-line animate-spin mr-2"></i>
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </button>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Locations only - removed separate Areas section */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label
                                className="text-sm font-medium"
                                style={{ color: textPrimary }}
                            >
                                Assigned Locations
                            </label>
                            <button
                                onClick={selectAllLocations}
                                className="text-xs cursor-pointer hover:underline"
                                style={{ color: "#16a34a" }}
                            >
                                {selectedLocations.length ===
                                allLocations.length
                                    ? "Deselect All"
                                    : "Select All"}
                            </button>
                        </div>
                        <div
                            className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-2 rounded-lg"
                            style={{
                                background: isDark ? "#374151" : "#f9fafb",
                                border: `1px solid ${border}`,
                            }}
                        >
                            {allLocations.map((location) => (
                                <label
                                    key={location.id}
                                    className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedLocations.includes(
                                            location.id,
                                        )}
                                        onChange={() =>
                                            toggleLocation(location.id)
                                        }
                                        className="cursor-pointer accent-green-600"
                                    />
                                    <span
                                        className="text-sm"
                                        style={{ color: textPrimary }}
                                    >
                                        {location.name}
                                    </span>
                                </label>
                            ))}
                        </div>
                        <p
                            className="text-xs mt-2"
                            style={{ color: textSecondary }}
                        >
                            <i className="ri-information-line mr-1"></i>
                            If no locations are selected, user will have access
                            to <strong>all locations</strong>.
                        </p>
                    </div>
                </div>
            </Modal>
        </>
    );
}
