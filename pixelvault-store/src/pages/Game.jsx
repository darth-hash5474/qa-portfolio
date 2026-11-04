import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AgeGate from '../components/AgeGate'
import Cover from '../components/Cover'
import PriceTag from '../components/PriceTag'
import { a11yLabel, hasBug } from '../lib/bugs'
import { fmtDate } from '../lib/pricing'
import { useStore } from '../lib/store'

const TABS = ['About', 'System requirements', 'Reviews']

function Tabs({ game }) {
  const [tab, setTab] = useState(0)
  const [filter, setFilter] = useState('all')
  const refs = useRef([])

  const onKey = (e) => {
    const last = TABS.length - 1
    let next = null
    if (e.key === 'ArrowRight') next = tab === last ? 0 : tab + 1
    if (e.key === 'ArrowLeft') next = tab === 0 ? last : tab - 1
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = last
    if (next !== null) {
      e.preventDefault()
      setTab(next)
      refs.current[next]?.focus()
    }
  }

  const reviews = game.reviews.filter((r) => filter === 'all' || (filter === 'positive') === r.recommended)

  return (
    <section className="tabs">
      <div role="tablist" aria-label="Game information" onKeyDown={onKey}>
        {TABS.map((t, i) => (
          <button
            key={t}
            ref={(el) => {
              refs.current[i] = el
            }}
            role="tab"
            id={`tab-${i}`}
            aria-selected={tab === i}
            aria-controls={`panel-${i}`}
            tabIndex={tab === i ? 0 : -1}
            onClick={() => setTab(i)}
          >
            {t}
          </button>
        ))}
      </div>

      <div role="tabpanel" id="panel-0" aria-labelledby="tab-0" hidden={tab !== 0}>
        {game.description.map((p, k) => <p key={k}>{p}</p>)}
        <dl className="facts">
          <dt>Developer</dt><dd>{game.developer}</dd>
          <dt>Release date</dt><dd>{fmtDate(game.releaseDate)}</dd>
          <dt>Platforms</dt><dd>{game.platforms.join(', ')}</dd>
          <dt>Content rating</dt><dd>{game.esrb === 'M' ? 'M — Mature 17+' : game.esrb === 'T' ? 'T — Teen' : 'E — Everyone'}</dd>
        </dl>
      </div>

      <div role="tabpanel" id="panel-1" aria-labelledby="tab-1" hidden={tab !== 1}>
        <table className="sysreq">
          <caption className="sr-only">System requirements</caption>
          <thead><tr><th scope="col" /><th scope="col">Minimum</th><th scope="col">Recommended</th></tr></thead>
          <tbody>
            {[['os', 'OS'], ['cpu', 'Processor'], ['ram', 'Memory'], ['gpu', 'Graphics'], ['storage', 'Storage']].map(([k, l]) => (
              <tr key={k}><th scope="row">{l}</th><td>{game.sysreq.minimum[k]}</td><td>{game.sysreq.recommended[k]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div role="tabpanel" id="panel-2" aria-labelledby="tab-2" hidden={tab !== 2}>
        {game.reviews.length === 0 ? (
          <p className="muted">No reviews yet. This game hasn't been released.</p>
        ) : (
          <>
            <div className="field-inline">
              <label htmlFor="review-filter">Show</label>
              <select id="review-filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">All reviews</option>
                <option value="positive">Recommended</option>
                <option value="negative">Not recommended</option>
              </select>
            </div>
            {reviews.length === 0 && <p className="muted">No reviews match this filter.</p>}
            <ul className="reviews">
              {reviews.map((r, k) => (
                <li key={k} className="review" data-testid="review">
                  <strong>{r.user}</strong>
                  <span className={`pill ${r.recommended ? 'pill-good' : 'pill-bad'}`}>{r.recommended ? '👍 Recommended' : '👎 Not recommended'}</span>
                  <span className="muted small">{r.hours} hrs on record</span>
                  <p>{r.text}</p>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}

function Gallery({ game }) {
  const [i, setI] = useState(1)
  const dlg = useRef(null)
  const count = 4
  const go = (d) => setI((x) => ((x - 1 + d + count) % count) + 1)

  return (
    <section className="gallery" aria-label="Screenshots">
      <button type="button" className="gallery-main" onClick={() => dlg.current?.showModal()} aria-label="Open screenshot in full view">
        <Cover game={game} size="lg" scene={i} />
      </button>
      <div className="gallery-bar">
        <button type="button" className="icon-btn" {...a11yLabel('Previous screenshot')} onClick={() => go(-1)}><span aria-hidden="true">‹</span></button>
        <span role="status" className="small">Screenshot {i} of {count}</span>
        <button type="button" className="icon-btn" {...a11yLabel('Next screenshot')} onClick={() => go(1)}><span aria-hidden="true">›</span></button>
      </div>
      <div className="thumbs">
        {Array.from({ length: count }, (_, k) => k + 1).map((n) => (
          <button key={n} type="button" className={`thumb ${n === i ? 'on' : ''}`} aria-label={`Show screenshot ${n}`} aria-current={n === i} onClick={() => setI(n)}>
            <Cover game={game} size="xs" scene={n} />
          </button>
        ))}
      </div>
      <dialog ref={dlg} className="dialog dialog-wide" aria-label={`${game.title} screenshot ${i}`}>
        <Cover game={game} size="xl" scene={i} />
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={() => go(-1)}>Previous</button>
          <button type="button" className="btn btn-ghost" onClick={() => go(1)}>Next</button>
          <button type="button" className="btn btn-primary" onClick={() => dlg.current?.close()}>Close</button>
        </div>
      </dialog>
    </section>
  )
}

export default function Game() {
  const { id } = useParams()
  const { games, byId, cart, library, wishlist, addToCart, toggleWishlist, ageOk, setAgeOk, toast } = useStore()
  const [bypass, setBypass] = useState(false)

  if (games.status === 'loading') return <p role="status" className="muted" aria-busy="true">Loading game…</p>
  if (games.status === 'error') return <div className="empty" role="alert"><h1>Couldn't load this game.</h1><Link to="/" className="btn btn-primary">Back to the store</Link></div>

  const game = byId[id]
  if (!game) {
    return (
      <div className="empty" data-testid="not-found">
        <h1>Game not found</h1>
        <p>We couldn't find a game with that address.</p>
        <Link to="/" className="btn btn-primary">Browse the store</Link>
      </div>
    )
  }

  const gated = game.esrb === 'M' && !ageOk && !bypass
  const inCart = cart.includes(game.id) && !hasBug('BUG-03')
  const owned = library.includes(game.id)
  const wished = wishlist.includes(game.id)

  const verified = (persist) => {
    if (persist) setAgeOk(true)
    else setBypass(true)
  }

  return (
    <>
      {gated && <AgeGate title={game.title} onVerified={verified} />}
      <div aria-hidden={gated} className={gated ? 'blurred' : ''}>
        <nav aria-label="Breadcrumb" className="crumbs">
          <Link to="/">Store</Link> / <Link to={`/?genre=${game.genres[0]}`}>{game.genres[0]}</Link> / <span aria-current="page">{game.title}</span>
        </nav>
        <h1 className="game-title">{game.title}</h1>

        <div className="game-layout">
          <Gallery game={game} />

          <aside className="buybox" aria-label="Purchase">
            <p className="muted small">{game.developer}</p>
            <p className="review-line" data-testid="review-summary">
              {game.comingSoon ? game.reviewLabel : <><strong>{game.reviewLabel}</strong> · {game.reviewScore}% of {game.reviewCount.toLocaleString()} reviews</>}
            </p>
            <p className="tags">{game.tags.map((t) => <span key={t} className="tag">{t}</span>)}</p>
            <p className="muted small">Platforms: {game.platforms.join(', ')}</p>

            <div className="buy-row">
              <PriceTag game={game} />
              {owned ? (
                <Link to="/library" className="btn btn-ghost">In library — go to library</Link>
              ) : game.comingSoon ? (
                <span className="pill">Releases {fmtDate(game.releaseDate)}</span>
              ) : inCart ? (
                <Link to="/cart" className="btn btn-ghost">In cart — view cart</Link>
              ) : (
                <button type="button" className="btn btn-primary" onClick={() => addToCart(game)}>
                  {game.price === 0 ? 'Get for free' : 'Add to cart'}
                </button>
              )}
            </div>

            <div className="buy-secondary">
              <button type="button" className="btn btn-ghost btn-sm" aria-pressed={wished} onClick={() => toggleWishlist(game)}>
                {wished ? '♥ On your wishlist' : '♡ Add to wishlist'}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => toast('Link copied to clipboard', 'success')}>
                Share
              </button>
            </div>
          </aside>
        </div>

        <Tabs game={game} />
      </div>
    </>
  )
}
