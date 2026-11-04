import { useState } from 'react'
import { BUGS, activeBugs, setBugs } from '../lib/bugs'

// Floating panel for switching seeded bugs on and off (reloads the page).
// What each bug actually does is documented in BUGS.md, not here.
export default function QALab() {
  const [open, setOpen] = useState(false)
  const active = activeBugs()

  const toggle = (id) => {
    const next = active.includes(id) ? active.filter((x) => x !== id) : [...active, id]
    setBugs(next)
  }

  return (
    <aside className="qalab">
      <button type="button" className="qalab-toggle" aria-expanded={open} aria-controls="qalab-panel" onClick={() => setOpen(!open)}>
        🐞 QA Lab{active.length > 0 && <span className="qalab-count">{active.length}</span>}
      </button>
      {open && (
        <div id="qalab-panel" className="qalab-panel">
          <h2>Seeded bugs</h2>
          <p className="muted">Toggle to reload the app with defects switched on.</p>
          <ul>
            {BUGS.map((b) => (
              <li key={b.id}>
                <label>
                  <input type="checkbox" checked={active.includes(b.id)} onChange={() => toggle(b.id)} />
                  <strong>{b.id}</strong> <span className="muted">{b.area}</span>
                </label>
              </li>
            ))}
          </ul>
          {active.length > 0 && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setBugs([])}>
              Clear all
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
