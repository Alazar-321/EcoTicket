type Props = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function getPages(page: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const pages: (number | '…')[] = [1]
  const start = Math.max(2, page - 1)
  const end = Math.min(total - 1, page + 1)

  if (start > 2) pages.push('…')
  for (let i = start; i <= end; i++) pages.push(i)
  if (end < total - 1) pages.push('…')
  pages.push(total)

  return pages
}

export default function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginación" className="mt-4 no-print">
      <ul className="pagination justify-content-center flex-wrap mb-0">
        <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Página anterior"
          >
            &laquo;
          </button>
        </li>

        {getPages(page, totalPages).map((p, i) =>
          p === '…' ? (
            <li key={`gap-${i}`} className="page-item disabled" aria-hidden="true">
              <span className="page-link">…</span>
            </li>
          ) : (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(p)}
                aria-label={`Página ${p}`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            </li>
          )
        )}

        <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
          <button
            type="button"
            className="page-link"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="Página siguiente"
          >
            &raquo;
          </button>
        </li>
      </ul>
    </nav>
  )
}