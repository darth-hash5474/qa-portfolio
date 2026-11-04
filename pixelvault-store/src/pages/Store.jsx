import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Carousel from '../components/Carousel'
import GameCard from '../components/GameCard'
import Pagination from '../components/Pagination'
import { hasBug } from '../lib/bugs'
import { priceLabel, salePrice } from '../lib/pricing'
import { useStore } from '../lib/store'

const PER_PAGE = 12
const MAX_PRICE = 60
const SORTS = [
  ['relevance', 'Relevance'],
  ['price-asc', 'Price: Low to High'],
  ['price-desc', 'Price: High to Low'],
  ['newest', 'Release date'],
  ['score', 'User reviews'],
  ['name', 'Name (A–Z)'],
]

export default function Store() {
  const { games, loadGames } = useStore()
  const [params, setParams] = useSearchParams()

  const q = params.get('q') || ''
  const genres = (params.get('genre') || '').split(',').filter(Boolean)
  const max = Number(params.get('max') ?? MAX_PRICE)
  const sale = params.get('sale') === '1'
  const rating = params.get('rating') || ''
  const sort = params.get('sort') || 'relevance'
  const view = params.get('view') || 'grid'
  const page = Math.max(1, Number(params.get('page') || 1))

  const update = (changes) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([k, v]) => {
      if (v === '' || v === null || v === false || v === undefined) next.delete(k)
      else next.set(k, v === true ? '1' : v)
    })
    if (!('page' in changes)) next.delete('page')
    setParams(next)
  }

  const allGenres = useMemo(() => [...new Set(games.data.flatMap((g) => g.genres))].sort(), [games.data])
  const filtersActive = !!(q || genres.length || max < MAX_PRICE || sale || rating)

  const results = useMemo(() => {
    let list = games.data.filter((g) => {
      if (q) {
        const hay = `${g.title} ${g.developer} ${g.tags.join(' ')}`
        const hit = hasBug('BUG-06') ? hay.includes(q) : hay.toLowerCase().includes(q.toLowerCase())
        if (!hit) return false
      }
      if (genres.length && !genres.some((x) => g.genres.includes(x))) return false
      if (max < MAX_PRICE && salePrice(g) > max) return false
      if (sale && g.discount === 0) return false
      if (rating && g.esrb !== rating) return false
      return true
    })
    const by = {
      'price-asc': (a, b) => salePrice(a) - salePrice(b),
      'price-desc': (a, b) => salePrice(b) - salePrice(a),
      newest: (a, b) => b.releaseDate.localeCompare(a.releaseDate),
      score: (a, b) => b.reviewScore - a.reviewScore,
      name: (a, b) => a.title.localeCompare(b.title),
    }[sort]
    if (by) {
      list = [...list].sort(by)
      if (sort === 'price-asc' && hasBug('BUG-05')) list.reverse()
    }
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [games.data, q, params.get('genre'), max, sale, rating, sort])

  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE))
  const current = Math.min(page, pages)
  const start = (current - 1) * PER_PAGE
  const visible = results.slice(hasBug('BUG-14') && current > 1 ? start - 1 : start, start + PER_PAGE)

  const toggleGenre = (g) => update({ genre: (genres.includes(g) ? genres.filter((x) => x !== g) : [...genres, g]).join(',') })
  const reset = () => setParams({})

  const showHero = !filtersActive && current === 1 && sort === 'relevance' && games.status === 'ready'

  return (
    <>
      {showHero && <Carousel items={games.data.filter((g) => g.featured)} />}

      <div className="store-layout">
        <aside className="filters" aria-label="Filters">
          <div className="filters-head">
            <h2>Filters</h2>
            <button type="button" className="link-btn" onClick={reset} disabled={!filtersActive && sort === 'relevance'}>
              Reset filters
            </button>
          </div>

          <fieldset>
            <legend>Genre</legend>
            {allGenres.map((g) => (
              <label key={g} className="check">
                <input type="checkbox" checked={genres.includes(g)} onChange={() => toggleGenre(g)} /> {g}
              </label>
            ))}
          </fieldset>

          <div className="field">
            <label htmlFor="max-price">Max price</label>
            <input
              id="max-price"
              type="range"
              min="0"
              max={MAX_PRICE}
              step="5"
              value={max}
              onChange={(e) => update({ max: Number(e.target.value) === MAX_PRICE ? '' : e.target.value })}
            />
            <output htmlFor="max-price" data-testid="max-price-output">
              {max >= MAX_PRICE ? 'Any price' : max === 0 ? 'Free only' : `Up to $${max}`}
            </output>
          </div>

          <label className="check">
            <input type="checkbox" checked={sale} onChange={(e) => update({ sale: e.target.checked })} /> On sale only
          </label>

          <div className="field">
            <label htmlFor="rating">Content rating</label>
            <select id="rating" value={rating} onChange={(e) => update({ rating: e.target.value })}>
              <option value="">Any</option>
              <option value="E">E — Everyone</option>
              <option value="T">T — Teen</option>
              <option value="M">M — Mature 17+</option>
            </select>
          </div>
        </aside>

        <section className="results" aria-label="Search results">
          <div className="toolbar">
            <p role="status" data-testid="result-count" className="count-line">
              {games.status === 'ready'
                ? `${results.length} ${results.length === 1 ? 'result' : 'results'}${q ? ` for “${q}”` : ''}`
                : ''}
            </p>
            <div className="toolbar-right">
              <div className="field-inline">
                <label htmlFor="sort">Sort by</label>
                <select id="sort" value={sort} onChange={(e) => update({ sort: e.target.value === 'relevance' ? '' : e.target.value })}>
                  {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="seg" role="group" aria-label="View">
                <button type="button" aria-pressed={view === 'grid'} onClick={() => update({ view: '' }) }>Grid</button>
                <button type="button" aria-pressed={view === 'list'} onClick={() => update({ view: 'list' })}>List</button>
              </div>
            </div>
          </div>

          {games.status === 'loading' && (
            <div aria-busy="true">
              <p role="status" className="muted">Loading games…</p>
              <div className="grid">
                {Array.from({ length: 8 }, (_, k) => <div key={k} className="skeleton" data-testid="skeleton" />)}
              </div>
            </div>
          )}

          {games.status === 'error' && (
            <div className="empty" role="alert">
              <h2>We couldn't load the store.</h2>
              <p>Something went wrong while fetching games ({games.error}).</p>
              <button type="button" className="btn btn-primary" onClick={loadGames}>Try again</button>
            </div>
          )}

          {games.status === 'ready' && results.length === 0 && (
            <div className="empty" data-testid="empty-state">
              <h2>No games match your filters.</h2>
              <p>Try removing a filter or searching for something else.</p>
              <button type="button" className="btn btn-primary" onClick={reset}>Reset filters</button>
            </div>
          )}

          {games.status === 'ready' && results.length > 0 && (
            <>
              <div className={view === 'list' ? 'list' : 'grid'}>
                {visible.map((g) => <GameCard key={g.id} game={g} layout={view === 'list' ? 'list' : 'grid'} />)}
              </div>
              <Pagination page={current} pages={pages} onChange={(p) => update({ page: p === 1 ? '' : p })} />
              <p className="muted small">Showing {visible.length} of {results.length} · cheapest: {priceLabel(Math.min(...results.map(salePrice)))}</p>
            </>
          )}
        </section>
      </div>
    </>
  )
}
