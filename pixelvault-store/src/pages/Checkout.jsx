import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { hasBug } from '../lib/bugs'
import { COUNTRIES, WALLET_BALANCE, calcTotals, money, priceLabel, salePrice } from '../lib/pricing'
import { useStore } from '../lib/store'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const POSTAL = {
  US: [/^\d{5}(-\d{4})?$/, 'Enter a valid ZIP code (e.g. 78701).'],
  CA: [/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, 'Enter a valid postal code (e.g. K1A 0B1).'],
  GB: [/^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$/, 'Enter a valid postcode (e.g. SW1A 1AA).'],
  DE: [/^\d{5}$/, 'Enter a valid 5-digit postal code.'],
}

function luhn(num) {
  let sum = 0
  let dbl = false
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i])
    if (dbl) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    dbl = !dbl
  }
  return sum % 10 === 0
}

function validate(v, ctx) {
  const e = {}
  if (v.name.trim().length < 2) e.name = 'Enter your full name.'
  if (!EMAIL.test(v.email)) e.email = 'Enter a valid email address.'
  const [re, msg] = POSTAL[v.country] || [/^.{3,}$/, 'Enter a valid postal code.']
  if (!re.test(v.postal.trim())) e.postal = msg

  if (!ctx.free && v.method === 'card') {
    const digits = v.card.replace(/\s/g, '')
    const lengthOk = digits.length >= 13 && digits.length <= 19
    if (!lengthOk || (!hasBug('BUG-07') && !luhn(digits))) e.card = 'Enter a valid card number.'

    const m = /^(\d{2})\/(\d{2})$/.exec(v.expiry)
    if (!m || Number(m[1]) < 1 || Number(m[1]) > 12) e.expiry = 'Enter a valid expiry date (MM/YY).'
    else if (!hasBug('BUG-08')) {
      const now = new Date()
      const yy = now.getFullYear() % 100
      const mm = now.getMonth() + 1
      const y = Number(m[2])
      if (y < yy || (y === yy && Number(m[1]) < mm)) e.expiry = 'Your card has expired.'
    }
    if (!/^\d{3,4}$/.test(v.cvc)) e.cvc = 'Enter the 3 or 4-digit security code.'
  }
  if (v.gift && !EMAIL.test(v.giftEmail)) e.giftEmail = "Enter the recipient's email address."
  if (!v.terms && !hasBug('BUG-09')) e.terms = 'You must accept the terms to continue.'
  return e
}

function Field({ name, label, error, children, hint }) {
  return (
    <div className={`field ${error ? 'invalid' : ''}`}>
      <label htmlFor={`f-${name}`}>{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
      {error && <p id={`e-${name}`} className="field-error" role="alert">{error}</p>}
    </div>
  )
}

const ORDER = ['name', 'email', 'country', 'postal', 'card', 'expiry', 'cvc', 'giftEmail', 'terms']

export default function Checkout() {
  const { cart, byId, games, placeOrder, promoCode } = useStore()
  const nav = useNavigate()
  const [v, setV] = useState({
    name: '', email: '', country: 'US', postal: '', method: 'card',
    card: '', expiry: '', cvc: '', gift: false, giftEmail: '', giftNote: '', terms: false,
  })
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [bannerError, setBannerError] = useState('')
  const placed = useRef(false)

  if (games.status === 'loading') return <p role="status" className="muted" aria-busy="true">Loading checkout…</p>
  const items = cart.map((id) => byId[id]).filter(Boolean)
  if (items.length === 0) return placed.current ? null : <Navigate to="/cart" replace />

  const t = calcTotals(items, promoCode, v.country)
  const free = t.total === 0
  const errors = validate(v, { free })
  const show = (f) => (touched[f] || submitted) && errors[f]
  const set = (field, value) => setV((s) => ({ ...s, [field]: value }))
  const blur = (f) => () => setTouched((s) => ({ ...s, [f]: true }))
  const errorCount = Object.keys(errors).length

  const fmtCard = (raw) => raw.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
  const fmtExpiry = (raw) => {
    const d = raw.replace(/\D/g, '').slice(0, 4)
    return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
  }

  const submit = (ev) => {
    ev.preventDefault()
    setSubmitted(true)
    setBannerError('')
    if (errorCount > 0) {
      const first = ORDER.find((f) => errors[f])
      setTimeout(() => document.querySelector(`[name="${first}"]`)?.focus(), 0)
      return
    }
    if (!free && v.method === 'wallet' && t.total > WALLET_BALANCE) {
      return setBannerError(`Insufficient wallet balance. You have ${money(WALLET_BALANCE)} but this order is ${money(t.total)}.`)
    }
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      if (!free && v.method === 'card' && v.card.replace(/\s/g, '') === '4000000000000002') {
        return setBannerError('Your card was declined. Try a different card or payment method.')
      }
      placed.current = true
      const number = placeOrder({
        items: items.map((g) => g.id),
        totals: t,
        email: v.email,
        gift: v.gift ? { to: v.giftEmail, note: v.giftNote } : null,
        country: v.country,
      })
      nav(`/order/${number}`)
    }, 1500)
  }

  const props = (name) => ({
    id: `f-${name}`, name, onBlur: blur(name),
    'aria-invalid': show(name) ? 'true' : undefined,
    'aria-describedby': show(name) ? `e-${name}` : undefined,
  })

  return (
    <>
      <h1>Checkout</h1>
      <div className="cart-layout">
        <form className="checkout" onSubmit={submit} noValidate aria-label="Checkout form">
          {submitted && errorCount > 0 && (
            <div className="banner banner-error" role="alert">Please fix {errorCount} {errorCount === 1 ? 'problem' : 'problems'} below.</div>
          )}
          {bannerError && <div className="banner banner-error" role="alert" data-testid="payment-error">{bannerError}</div>}

          <fieldset>
            <legend>Contact</legend>
            <Field name="name" error={show('name')} label="Full name">
              <input {...props('name')} value={v.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
            </Field>
            <Field name="email" error={show('email')} label="Email address">
              <input {...props('email')} type="email" value={v.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
            </Field>
          </fieldset>

          <fieldset>
            <legend>Billing</legend>
            <div className="row2">
              <Field name="country" error={show('country')} label="Country">
                <select {...props('country')} value={v.country} onChange={(e) => set('country', e.target.value)}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
                </select>
              </Field>
              <Field name="postal" error={show('postal')} label="ZIP / Postal code">
                <input {...props('postal')} value={v.postal} onChange={(e) => set('postal', e.target.value)} autoComplete="postal-code" />
              </Field>
            </div>
          </fieldset>

          <fieldset>
            <legend>Payment</legend>
            {free ? (
              <p className="banner" data-testid="no-payment">No payment required for this order.</p>
            ) : (
              <>
                <div className="radios" role="radiogroup" aria-label="Payment method">
                  {[['card', 'Credit / debit card'], ['paypal', 'PayPal'], ['wallet', `Vault Wallet (${money(WALLET_BALANCE)})`]].map(([val, label]) => (
                    <label key={val} className="check">
                      <input type="radio" name="method" value={val} checked={v.method === val} onChange={() => set('method', val)} /> {label}
                    </label>
                  ))}
                </div>

                {v.method === 'card' && (
                  <>
                    <Field name="card" error={show('card')} label="Card number">
                      <input {...props('card')} inputMode="numeric" autoComplete="cc-number" placeholder="1234 5678 9012 3456" value={v.card} onChange={(e) => set('card', fmtCard(e.target.value))} />
                    </Field>
                    <div className="row2">
                      <Field name="expiry" error={show('expiry')} label="Expiry (MM/YY)">
                        <input {...props('expiry')} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" value={v.expiry} onChange={(e) => set('expiry', fmtExpiry(e.target.value))} />
                      </Field>
                      <Field name="cvc" error={show('cvc')} label="Security code">
                        <input {...props('cvc')} inputMode="numeric" autoComplete="cc-csc" maxLength={4} value={v.cvc} onChange={(e) => set('cvc', e.target.value.replace(/\D/g, '').slice(0, 4))} />
                      </Field>
                    </div>
                    <details className="testcards">
                      <summary>Test card numbers</summary>
                      <p><code>4242 4242 4242 4242</code> succeeds · <code>4000 0000 0000 0002</code> is declined</p>
                    </details>
                  </>
                )}
                {v.method === 'paypal' && <p className="banner">You'll be redirected to PayPal to approve this payment (simulated).</p>}
                {v.method === 'wallet' && <p className="banner">Paid from your Vault Wallet balance of {money(WALLET_BALANCE)}.</p>}
              </>
            )}
          </fieldset>

          <fieldset>
            <legend>Options</legend>
            <label className="check">
              <input type="checkbox" checked={v.gift} onChange={(e) => set('gift', e.target.checked)} /> This purchase is a gift
            </label>
            {v.gift && (
              <>
                <Field name="giftEmail" error={show('giftEmail')} label="Recipient email">
                  <input {...props('giftEmail')} type="email" value={v.giftEmail} onChange={(e) => set('giftEmail', e.target.value)} />
                </Field>
                <div className="field">
                  <label htmlFor="f-giftNote">Gift message (optional)</label>
                  <textarea id="f-giftNote" name="giftNote" rows={3} maxLength={200} value={v.giftNote} onChange={(e) => set('giftNote', e.target.value)} />
                  <p className="hint" data-testid="note-counter">{v.giftNote.length}/200</p>
                </div>
              </>
            )}
            <div className={`field ${show('terms') ? 'invalid' : ''}`}>
              <label className="check">
                <input {...props('terms')} type="checkbox" checked={v.terms} onChange={(e) => set('terms', e.target.checked)} /> I agree to the Subscriber Terms and the Refund Policy
              </label>
              {show('terms') && <p id="e-terms" className="field-error" role="alert">{errors.terms}</p>}
            </div>
          </fieldset>

          <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
            {busy ? 'Processing…' : free ? 'Complete order' : `Place order · ${money(t.total)}`}
          </button>
        </form>

        <aside className="summary" aria-label="Order summary">
          <h2>Order summary</h2>
          <ul className="mini">
            {items.map((g, k) => (
              <li key={`${g.id}-${k}`}><span>{g.title}</span><span>{priceLabel(salePrice(g))}</span></li>
            ))}
          </ul>
          <dl className="totals">
            <div><dt>Subtotal</dt><dd data-testid="co-subtotal">{money(t.subtotal)}</dd></div>
            {t.discount > 0 && <div><dt>Promo ({promoCode})</dt><dd data-testid="co-discount">-{money(t.discount)}</dd></div>}
            <div><dt>Tax ({(t.rate * 100).toFixed(2).replace(/\.?0+$/, '')}%)</dt><dd data-testid="co-tax">{money(t.tax)}</dd></div>
            <div className="grand"><dt>Total</dt><dd data-testid="co-total">{money(t.total)}</dd></div>
          </dl>
          <Link to="/cart" className="btn btn-ghost btn-block">Back to cart</Link>
        </aside>
      </div>
    </>
  )
}
