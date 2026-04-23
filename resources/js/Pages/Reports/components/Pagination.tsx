interface Props {
    currentPage: number;
    lastPage: number;
    onPageChange: (page: number) => void;
    isDark: boolean;
}

export default function Pagination({
    currentPage,
    lastPage,
    onPageChange,
    isDark,
}: Props) {
    const buttonStyle = {
        background: isDark ? "#374151" : "#f3f4f6",
        color: isDark ? "#f9fafb" : "#111827",
    };

    const activeButtonStyle = {
        background: "#16a34a",
        color: "#ffffff",
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (lastPage <= maxVisible) {
            for (let i = 1; i <= lastPage; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(lastPage - 1, currentPage + 1);

            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < lastPage - 2) pages.push("...");
            pages.push(lastPage);
        }

        return pages;
    };

    return (
        <div className="flex items-center gap-1">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm disabled:opacity-50"
                style={buttonStyle}
            >
                <i className="ri-arrow-left-s-line"></i>
            </button>

            {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                    <span
                        key={idx}
                        className="px-2"
                        style={{ color: isDark ? "#9ca3af" : "#6b7280" }}
                    >
                        ...
                    </span>
                ) : (
                    <button
                        key={idx}
                        onClick={() => onPageChange(page as number)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-sm"
                        style={
                            currentPage === page
                                ? activeButtonStyle
                                : buttonStyle
                        }
                    >
                        {page}
                    </button>
                ),
            )}

            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === lastPage}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-sm disabled:opacity-50"
                style={buttonStyle}
            >
                <i className="ri-arrow-right-s-line"></i>
            </button>
        </div>
    );
}
