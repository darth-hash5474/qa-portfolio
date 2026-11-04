import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Cover from '../components/Cover'
import { useStore } from '../lib/store'

// Simulated install: Install -> progress -> Play.
function InstallButton({ game }) {
  const [pct, setPct] = useState(null) // null = not installed, 0-99 installing, 100 installed
  useEffect(() => {
    if (pct === null || pct >= 100) return
    const t = setTimeout(() => setPct((p) => Math.min(100, p + 10)), 300)
    return () => clearTimeout(t)
  }, [pct])

  if (pct === null) return <button type="button" className="btn btn-primary btn-sm" onClick={() => setPct(0)}>Install</button>
  if (pct < 100) {
    return (
      <div className="progress-wrap">
        <progress max="100" value={pct} aria-label={`Installing ${game.title}`} />
        <span className="small">{pct}%</span>
      </div>
    )
  }
  return <button type="button" className="btn btn-good btn-sm" onClick={() => setPct(null)}>Play</button>
}

export default function Library() {
  const { library, byId, games } = useStore()
  const owned = library.map((id) => byId[id]).filter(Boolean)

  if (games.status === 'loading') return <p role="status" className="muted" aria-busy="true">Loading library…</p>

  return (
    <>
      <h1>Your library <span className="muted small">({owned.length})</span></h1>
      {owned.length === 0 ? (
        <div className="empty" data-testid="empty-library">
          <h2>Nothing here yet</h2>
          <p>Games you buy will appear in your library.</p>
          <Link to="/" className="btn btn-primary">Browse the store</Link>
        </div>
      ) : (
        <ul className="lib-list">
          {owned.map((g) => (
            <li key={g.id} className="lib-row" data-testid="library-row">
              <Cover game={g} size="sm" />
              <div className="cart-info">
                <h2><Link to={`/game/${g.id}`}>{g.title}</Link></h2>
                <p className="muted small">{g.developer}</p>
              </div>
              <InstallButton game={g} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
