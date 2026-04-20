interface PaginationControlsProps {
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  perPageOptions?: number[];
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  itemLabel?: string;
}

export default function PaginationControls({
  page,
  totalPages,
  totalItems,
  perPage,
  perPageOptions = [10, 20, 50],
  onPageChange,
  onPerPageChange,
  itemLabel = "items",
}: PaginationControlsProps) {
  if (totalItems === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalItems);

  return (
    <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-3">
      <span className="text-xs text-slate-400">
        Showing {from}-{to} of {totalItems} {itemLabel}
      </span>
      <div className="flex items-center gap-2">
        <select
          value={perPage}
          onChange={(e) => onPerPageChange(Number(e.target.value))}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
        >
          {perPageOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}/page
            </option>
          ))}
        </select>
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="px-2 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-50"
        >
          Prev
        </button>
        <span className="text-xs text-slate-500">
          {page}/{totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="px-2 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
