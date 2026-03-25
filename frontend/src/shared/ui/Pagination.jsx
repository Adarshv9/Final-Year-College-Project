import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const delta = 2;
  const left = page - delta;
  const right = page + delta + 1;
  let last = null;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i < right)) {
      if (last && i - last !== 1) pages.push('...');
      pages.push(i);
      last = i;
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="h-8 w-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#1a2236] hover:text-[#e2e8f0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-1 text-[#64748b] text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={[
              'h-8 min-w-[2rem] px-2 rounded-lg text-sm font-medium transition-colors',
              p === page
                ? 'bg-indigo-500 text-white'
                : 'text-[#94a3b8] hover:bg-[#1a2236] hover:text-[#e2e8f0]',
            ].join(' ')}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="h-8 w-8 flex items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#1a2236] hover:text-[#e2e8f0] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

export default Pagination;
