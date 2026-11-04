/* global __PV_DEFAULT_BUGS__ */
// Seeded-bug switches.
// Which bugs are on is decided when the dev server (or build) starts, from npm flags:
//   npm run dev --bugs=all | --bugs=<number> | --bugless      (see vite.config.js)
// A ?bugs=... URL param overrides that for a single page load (handy in tests):
//   ?bugs=all   ?bugs=5   ?bugs=BUG-03,BUG-07   ?bugs=   (empty = no bugs)

import { BUGS, BUG_IDS, resolveBugSpec } from './bug-ids'

export { BUGS, BUG_IDS }

// Injected by vite.config.js (`define`); empty if the app is loaded some other way.
const FLAG_DEFAULT = typeof __PV_DEFAULT_BUGS__ !== 'undefined' ? __PV_DEFAULT_BUGS__ : []

function read() {
  try {
    const p = new URLSearchParams(window.location.search).get('bugs')
    if (p !== null) return resolveBugSpec(p).ids
  } catch {
    /* no window / bad URL: fall back to the flag */
  }
  return FLAG_DEFAULT
}

const active = new Set(read())

export const hasBug = (id) => active.has(id)
export const activeBugs = () => [...active]

// Reloads the page with a specific set of bugs (used by the QA Lab panel).
export function setBugs(list) {
  const url = new URL(window.location.href)
  if (list.length) url.searchParams.set('bugs', list.join(','))
  else url.searchParams.set('bugs', '')
  window.location.href = url.toString()
}

if (active.has('BUG-11')) document.documentElement.classList.add('bug-mobile-cart')

// Accessible-name helper: BUG-12 strips the labels off icon-only controls and cover art.
export const a11yLabel = (label) => (hasBug('BUG-12') ? {} : { 'aria-label': label })
