import { Link } from 'react-router-dom'
import { hasBug } from '../lib/bugs'
import { useStore } from '../lib/store'
import Cover from './Cover'
import PriceTag from './PriceTag'
import WishlistHeart from './WishlistButton'

export default function GameCard({ game, layout = 'grid' }) {
  const { cart, library, addToCart } = useStore()
  const inCart = cart.includes(game.id) && !hasBug('BUG-03') // BUG-03: button never flips to "In cart"
  const owned = library.includes(game.id)

  let action
  if (owned) action = <span className="pill pill-owned">In library</span>
  else if (game.comingSoon) action = null
  else if (inCart)
    action = (
      <Link to="/cart" className="btn btn-sm btn-ghost">
        In cart · View
      </Link>
    )
  else
    action = (
      <button type="button" className="btn btn-sm btn-primary" onClick={() => addToCart(game)}>
        Add to cart
      </button>
    )

  return (
    <article className={`card card-${layout}`} data-testid="game-card" aria-label={game.title}>
      <Link to={`/game/${game.id}`} className="card-link" aria-label={`${game.title} — view details`}>
        <Cover game={game} size={layout === 'list' ? 'sm' : 'md'} />
      </Link>
      <div className="card-body">
        <h3 className="card-title">
          <Link to={`/game/${game.id}`}>{game.title}</Link>
        </h3>
        <p className="card-meta">
          {game.genres.join(' · ')}
          {game.esrb === 'M' && <span className="pill pill-m" title="Mature 17+">M</span>}
        </p>
        {layout === 'list' && <p className="card-tagline">{game.tagline}</p>}
        <div className="card-foot">
          <PriceTag game={game} />
          <div className="card-actions">
            <WishlistHeart game={game} />
            {action}
          </div>
        </div>
      </div>
    </article>
  )
}
