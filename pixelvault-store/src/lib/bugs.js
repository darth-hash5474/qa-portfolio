// "QA Lab" bug injection.
// Bugs are switched on with ?bugs=BUG-01,BUG-05 in the URL (or from the QA Lab panel).
// The URL param wins; otherwise the last saved selection from localStorage is used.

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

function read() {
  try {
    const p = new URLSearchParams(window.location.search).get('bugs')
    if (p !== null) {
      return p
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
    }
    return JSON.parse(localStorage.getItem('pv_bugs') || '[]')
  } catch {
    return []
  }
}

const active = new Set(read())

export const hasBug = (id) => active.has(id)
export const activeBugs = () => [...active]

export function setBugs(list) {
  try {
    localStorage.setItem('pv_bugs', JSON.stringify(list))
  } catch {
    /* storage unavailable */
  }
  const url = new URL(window.location.href)
  if (list.length) url.searchParams.set('bugs', list.join(','))
  else url.searchParams.delete('bugs')
  window.location.href = url.toString()
}

if (active.has('BUG-11')) document.documentElement.classList.add('bug-mobile-cart')

// Accessible-name helper: BUG-12 strips the labels off icon-only controls and cover art.
export const a11yLabel = (label) => (hasBug('BUG-12') ? {} : { 'aria-label': label })
