// Pure data + parsing: no DOM access, so both the app and vite.config.js can import it.

export const BUGS = [
  { id: 'BUG-01', area: 'Cart' },
  { id: 'BUG-02', area: 'Cart' },
  { id: 'BUG-03', area: 'Cart' },
  { id: 'BUG-04', area: 'Header' },
  { id: 'BUG-05', area: 'Store' },
  { id: 'BUG-06', area: 'Search' },
  { id: 'BUG-07', area: 'Checkout' },
  { id: 'BUG-08', area: 'Checkout' },
  { id: 'BUG-09', area: 'Checkout' },
  { id: 'BUG-10', area: 'Age gate' },
  { id: 'BUG-11', area: 'Layout' },
  { id: 'BUG-12', area: 'Accessibility' },
  { id: 'BUG-13', area: 'Wishlist' },
  { id: 'BUG-14', area: 'Pagination' },
]

export const BUG_IDS = BUGS.map((b) => b.id)

// Turns a bug spec into a list of bug ids.
//   'all'                -> every bug
//   '' | 'none' | '0'    -> no bugs
//   '5'                  -> the first 5 bugs (BUG-01..BUG-05), always the same ones
//   'BUG-03,BUG-07'      -> exactly those bugs
// Never throws: problems come back in `error` so callers decide what to do.
export function resolveBugSpec(spec) {
  const s = String(spec ?? '').trim()
  if (/^all$/i.test(s)) return { ids: [...BUG_IDS] }
  if (s === '' || /^none$/i.test(s)) return { ids: [] }
  if (/^\d+$/.test(s)) {
    const n = Number(s)
    return { ids: BUG_IDS.slice(0, n), clamped: n > BUG_IDS.length }
  }
  const wanted = [...new Set(s.split(',').map((x) => x.trim().toUpperCase()).filter(Boolean))]
  const unknown = wanted.filter((id) => !BUG_IDS.includes(id))
  const ids = wanted.filter((id) => BUG_IDS.includes(id))
  return unknown.length ? { ids, error: `Unknown bug id(s): ${unknown.join(', ')}` } : { ids }
}
