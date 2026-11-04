import { Link } from 'react-router-dom'
import Cover from '../components/Cover'
import PriceTag from '../components/PriceTag'
import { a11yLabel } from '../lib/bugs'
import { useStore } from '../lib/store'

export default function Wishlist() {
  const { wishlist, byId, games, cart, library, addToCart, toggleWishlist } = useStore()
  if (games.status === 'loading') return <p role="status" className="muted" aria-busy="true">Loading wishlist…</p>
  const items = wishlist.map((id) => byId[id]).filter(Boolean)

  return (
    <>
      <h1>Your wishlist <span className="muted small">({items.length})</span></h1>
      {items.length === 0 ? (
        <div className="empty" data-testid="empty-wishlist">
          <h2>Your wishlist is empty</h2>
          <p>Tap the heart on any game to save it for later.</p>
          <Link to="/" className="btn btn-primary">Browse the store</Link>
        </div>
      ) : (
        <ul className="lib-list">
          {items.map((g) => (
            <li key={g.id} className="lib-row" data-testid="wishlist-row">
              <Cover game={g} size="sm" />
              <div className="cart-info">
                <h2><Link to={`/game/${g.id}`}>{g.title}</Link></h2>
                <p className="muted small">{g.genres.join(' · ')}</p>
              </div>
              <PriceTag game={g} />
              <div className="card-actions">
                {library.includes(g.id) ? <span className="pill pill-owned">In library</span>
                  : g.comingSoon ? null
                  : cart.includes(g.id) ? <Link to="/cart" className="btn btn-ghost btn-sm">In cart</Link>
                  : <button type="button" className="btn btn-primary btn-sm" onClick={() => addToCart(g)}>Add to cart</button>}
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleWishlist(g)} {...a11yLabel(`Remove ${g.title} from wishlist`)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
