import { hasBug } from './bugs'

export const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100
export const salePrice = (g) => round2(g.price * (1 - g.discount / 100))
export const money = (n) => `$${n.toFixed(2)}`
export const priceLabel = (n) => (n === 0 ? 'Free' : money(n))

export const COUNTRIES = [
  { code: 'US', name: 'United States', tax: 0.0825 },
  { code: 'CA', name: 'Canada', tax: 0.05 },
  { code: 'GB', name: 'United Kingdom', tax: 0.2 },
  { code: 'DE', name: 'Germany', tax: 0.19 },
  { code: 'AU', name: 'Australia', tax: 0.1 },
  { code: 'JP', name: 'Japan', tax: 0.1 },
  { code: 'BR', name: 'Brazil', tax: 0 },
]

export const WALLET_BALANCE = 25

export const PROMOS = {
  PIXEL10: { type: 'percent', value: 10, label: '10% off your order' },
  VAULT5: { type: 'flat', value: 5, min: 20, label: '$5 off orders of $20 or more' },
  EXPIRED20: { expired: true },
}

export function evalPromo(raw, subtotal) {
  const code = hasBug('BUG-02') ? (raw || '').trim() : (raw || '').trim().toUpperCase()
  if (!code) return { ok: false, error: 'Enter a promo code.' }
  const promo = PROMOS[code]
  if (!promo) return { ok: false, error: 'That promo code is not valid.' }
  if (promo.expired) return { ok: false, error: 'This promo code has expired.' }
  if (promo.min && subtotal < promo.min) {
    return { ok: false, error: `This code needs a subtotal of at least ${money(promo.min)}.` }
  }
  const discount =
    promo.type === 'percent' ? round2((subtotal * promo.value) / 100) : Math.min(promo.value, subtotal)
  return { ok: true, code, discount, label: promo.label }
}

export function calcTotals(games, promoCode, countryCode = 'US') {
  const subtotal = round2(games.reduce((s, g) => s + (hasBug('BUG-01') ? g.price : salePrice(g)), 0))
  const listTotal = round2(games.reduce((s, g) => s + g.price, 0))
  const saved = round2(listTotal - games.reduce((s, g) => s + salePrice(g), 0))
  const promo = promoCode ? evalPromo(promoCode, subtotal) : null
  const discount = promo?.ok ? promo.discount : 0
  const taxable = round2(subtotal - discount)
  const rate = COUNTRIES.find((c) => c.code === countryCode)?.tax ?? 0
  const tax = round2(taxable * rate)
  return { subtotal, saved, discount, promo, taxable, rate, tax, total: round2(taxable + tax) }
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export function fmtDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
