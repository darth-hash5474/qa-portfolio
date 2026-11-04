import { money, priceLabel, salePrice } from '../lib/pricing'

export default function PriceTag({ game }) {
  if (game.comingSoon) return <span className="price-soon">Coming soon</span>
  const final = salePrice(game)
  return (
    <span className="price-tag">
      {game.discount > 0 && (
        <>
          <span className="badge-discount" data-testid="discount-badge">
            -{game.discount}%
          </span>
          <s className="price-old" aria-label={`Original price ${money(game.price)}`}>
            {money(game.price)}
          </s>
        </>
      )}
      <span className="price-final" data-testid="price">
        {priceLabel(final)}
      </span>
    </span>
  )
}
