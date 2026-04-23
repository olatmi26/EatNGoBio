import { useTheme } from "@/contexts/ThemeContext";

interface Props {
    columns: number;
    rows: number;
}

export default function TableSkeleton({ columns, rows }: Props) {
    const { isDark } = useTheme();
    const border = isDark ? "#374151" : "#e5e7eb";

    return (
        <div className="overflow-x-auto animate-pulse">
            <table className="w-full">
                <thead>
                    <tr style={{ borderBottom: `1px solid ${border}` }}>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-4 py-3">
                                <div
                                    className="h-4 w-20 rounded"
                                    style={{
                                        background: isDark
                                            ? "#374151"
                                            : "#e5e7eb",
                                    }}
                                ></div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: rows }).map((_, rowIdx) => (
                        <tr
                            key={rowIdx}
                            style={{ borderBottom: `1px solid ${border}` }}
                        >
                            {Array.from({ length: columns }).map(
                                (_, colIdx) => (
                                    <td key={colIdx} className="px-4 py-3">
                                        <div
                                            className="h-4 rounded"
                                            style={{
                                                background: isDark
                                                    ? "#374151"
                                                    : "#e5e7eb",
                                                width:
                                                    colIdx === 0
                                                        ? "80%"
                                                        : "60%",
                                            }}
                                        ></div>
                                    </td>
                                ),
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
