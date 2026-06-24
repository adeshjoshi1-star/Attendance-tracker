import { useMemo } from 'react';

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  const pages = useMemo(() => {
    const items = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      items.push(1);
      if (currentPage > 3) items.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) items.push(i);
      if (currentPage < totalPages - 2) items.push('...');
      items.push(totalPages);
    }
    return items;
  }, [currentPage, totalPages]);

  const btnBase =
    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500';

  const btnActive = 'bg-primary-600 text-white';
  const btnInactive =
    'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700';
  const btnDisabled = 'opacity-40 cursor-not-allowed';

  return (
    <div className="flex items-center gap-1">
      {/* First */}
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${btnInactive} ${currentPage === 1 ? btnDisabled : ''}`}
        title="First page"
      >
        {'\u00AB'}
      </button>

      {/* Prev */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`${btnBase} ${btnInactive} ${currentPage === 1 ? btnDisabled : ''}`}
        title="Previous page"
      >
        {'\u2039'}
      </button>

      {/* Page numbers */}
      {pages.map((page, i) =>
        page === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-slate-400 dark:text-slate-500">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`${btnBase} ${page === currentPage ? btnActive : btnInactive}`}
          >
            {page}
          </button>
        )
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${btnInactive} ${currentPage === totalPages ? btnDisabled : ''}`}
        title="Next page"
      >
        {'\u203A'}
      </button>

      {/* Last */}
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className={`${btnBase} ${btnInactive} ${currentPage === totalPages ? btnDisabled : ''}`}
        title="Last page"
      >
        {'\u00BB'}
      </button>
    </div>
  );
}
