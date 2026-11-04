import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { a11yLabel } from '../lib/bugs'
import Cover from './Cover'
import PriceTag from './PriceTag'

// Featured-games carousel. Autoplays every 7s, pauses on hover/focus or via the Pause button.
export default function Carousel({ items }) {
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const n = items.length

  useEffect(() => {
    if (paused || hover || n < 2) return
    const t = setInterval(() => setI((x) => (x + 1) % n), 7000)
    return () => clearInterval(t)
  }, [paused, hover, n])

  if (!n) return null
  const g = items[i]
  const go = (d) => setI((x) => (x + d + n) % n)

  return (
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-label="Featured games"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="slide" role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}`} data-testid="slide">
        <Link to={`/game/${g.id}`} className="slide-art" tabIndex={-1} aria-hidden="true">
          <Cover game={g} size="lg" />
        </Link>
        <div className="slide-info">
          <p className="eyebrow">Featured &amp; recommended</p>
          <h2>{g.title}</h2>
          <p>{g.tagline}</p>
          <p className="tags">{g.tags.slice(0, 3).map((t) => <span key={t} className="tag">{t}</span>)}</p>
          <div className="slide-buy">
            <PriceTag game={g} />
            <Link to={`/game/${g.id}`} className="btn btn-primary">View game</Link>
          </div>
        </div>
      </div>
      <div className="carousel-controls">
        <button type="button" className="icon-btn" {...a11yLabel('Previous slide')} onClick={() => go(-1)}>
          <span aria-hidden="true">‹</span>
        </button>
        <div className="dots" role="group" aria-label="Choose slide">
          {items.map((it, k) => (
            <button
              key={it.id}
              type="button"
              className={`dot ${k === i ? 'on' : ''}`}
              aria-label={`Go to slide ${k + 1}`}
              aria-current={k === i}
              onClick={() => setI(k)}
            />
          ))}
        </div>
        <button type="button" className="icon-btn" {...a11yLabel('Next slide')} onClick={() => go(1)}>
          <span aria-hidden="true">›</span>
        </button>
        <button type="button" className="btn btn-sm btn-ghost" aria-pressed={paused} onClick={() => setPaused(!paused)}>
          {paused ? 'Play' : 'Pause'}
        </button>
      </div>
    </section>
  )
}
