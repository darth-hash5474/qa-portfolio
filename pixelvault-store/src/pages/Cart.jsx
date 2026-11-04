import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Cover from '../components/Cover'
import PriceTag from '../components/PriceTag'
import { a11yLabel } from '../lib/bugs'
import { calcTotals, evalPromo, money } from '../lib/pricing'
import { useStore } from '../lib/store'

export default function Cart() {
  const { cart, byId, games, removeFromCart, promoCode, setPromoCode, toast } = useStore()
  const nav = useNavigate()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  if (games.status === 'loading') return <p role="status" className="muted" aria-busy="true">Loading your cart…</p>

  const items = cart.map((id) => byId[id]).filter(Boolean)
  const t = calcTotals(items, promoCode)
  const promoBroken = promoCode && t.promo && !t.promo.ok

  const apply = (e) => {
    e.preventDefault()
    const r = evalPromo(input, t.subtotal)
    if (!r.ok) return setError(r.error)
    setError('')
    setPromoCode(r.code)
    setInput('')
    toast(`Promo ${r.code} applied`, 'success')
  }

  if (items.length === 0) {
    return (
      <div className="empty" data-testid="empty-cart">
        <h1>Your cart is empty</h1>
        <p>Games you add will show up here.</p>
        <Link to="/" className="btn btn-primary">Browse the store</Link>
      </div>
    )
  }

  return (
    <>
      <h1>Shopping cart <span className="muted small">({items.length} {items.length === 1 ? 'item' : 'items'})</span></h1>
      <div className="cart-layout">
        <ul className="cart-list" aria-label="Cart items">
          {items.map((g, idx) => (
            <li key={`${g.id}-${idx}`} className="cart-row" data-testid="cart-row">
              <Cover game={g} size="sm" />
              <div className="cart-info">
                <h2><Link to={`/game/${g.id}`}>{g.title}</Link></h2>
                <p className="muted small">{g.genres.join(' · ')}</p>
              </div>
              <PriceTag game={g} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeFromCart(g.id)} {...a11yLabel(`Remove ${g.title} from cart`)}>
                Remove
              </button>
            </li>
          ))}
        </ul>

        <aside className="summary" aria-label="Order summary">
          <h2>Summary</h2>

          <form onSubmit={apply} className="promo" noValidate>
            <label htmlFor="promo">Promo code</label>
            <div className="promo-row">
              <input id="promo" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Enter code" aria-describedby="promo-err" autoComplete="off" />
              <button type="submit" className="btn btn-ghost">Apply</button>
            </div>
            <p id="promo-err" className="field-error" role="alert">{error}</p>
          </form>

          {promoCode && (
            <p className={`promo-chip ${promoBroken ? 'broken' : ''}`} data-testid="promo-applied">
              <strong>{promoCode}</strong> {promoBroken ? `— no longer valid: ${t.promo.error}` : `— ${t.promo.label}`}
              <button type="button" className="link-btn" onClick={() => setPromoCode('')}>Remove</button>
            </p>
          )}

          <dl className="totals">
            <div><dt>Subtotal</dt><dd data-testid="cart-subtotal">{money(t.subtotal)}</dd></div>
            {t.saved > 0 && <div className="saved"><dt>Sale savings included</dt><dd>{money(t.saved)}</dd></div>}
            {t.discount > 0 && <div><dt>Promo discount</dt><dd data-testid="cart-discount">-{money(t.discount)}</dd></div>}
            <div><dt>Estimated tax</dt><dd className="muted">Calculated at checkout</dd></div>
            <div className="grand"><dt>Estimated total</dt><dd data-testid="cart-total">{money(t.taxable)}</dd></div>
          </dl>

          <button type="button" className="btn btn-primary btn-block" onClick={() => nav('/checkout')}>
            Proceed to checkout
          </button>
          <Link to="/" className="btn btn-ghost btn-block">Continue shopping</Link>
        </aside>
      </div>
    </>
  )
}

