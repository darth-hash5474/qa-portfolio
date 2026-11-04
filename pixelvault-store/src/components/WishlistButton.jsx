import { a11yLabel } from '../lib/bugs'
import { useStore } from '../lib/store'

// Icon-only heart used on cards; the labelled version lives on the detail page.
export default function WishlistHeart({ game }) {
  const { wishlist, toggleWishlist } = useStore()
  const on = wishlist.includes(game.id)
  return (
    <button
      type="button"
      className={`icon-btn heart ${on ? 'on' : ''}`}
      aria-pressed={on}
      {...a11yLabel(on ? `Remove ${game.title} from wishlist` : `Add ${game.title} to wishlist`)}
      onClick={() => toggleWishlist(game)}
      data-testid={`wishlist-${game.id}`}
    >
      <span aria-hidden="true">{on ? '♥' : '♡'}</span>
    </button>
  )
}
