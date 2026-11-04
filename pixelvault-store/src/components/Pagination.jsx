export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn btn-sm btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      {Array.from({ length: pages }, (_, k) => k + 1).map((p) => (
        <button
          key={p}
          type="button"
          className={`btn btn-sm ${p === page ? 'btn-primary' : 'btn-ghost'}`}
          aria-current={p === page ? 'page' : undefined}
          aria-label={`Page ${p}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}
      <button type="button" className="btn btn-sm btn-ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </nav>
  )
}
