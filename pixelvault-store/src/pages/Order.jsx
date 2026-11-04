import { Link, useParams } from 'react-router-dom'
import { COUNTRIES, money } from '../lib/pricing'
import { useStore } from '../lib/store'

export default function Order() {
  const { number } = useParams()
  const { orders, byId } = useStore()
  const order = orders.find((o) => o.number === number)

  if (!order) {
    return (
      <div className="empty" data-testid="order-missing">
        <h1>Order not found</h1>
        <p>We couldn't find order {number} in this browser.</p>
        <Link to="/" className="btn btn-primary">Back to the store</Link>
      </div>
    )
  }

  const country = COUNTRIES.find((c) => c.code === order.country)?.name
  return (
    <div className="confirm">
      <h1>Thank you for your order!</h1>
      <p>
        Order number: <strong data-testid="order-number">{order.number}</strong>
      </p>
      <p>A receipt was sent to <strong>{order.email}</strong>{country ? ` (billing: ${country})` : ''}.</p>
      {order.gift && <p className="banner">Gift will be delivered to <strong>{order.gift.to}</strong>.</p>}
      <ul className="mini">
        {order.items.map((id) => <li key={id}><span>{byId[id]?.title ?? id}</span></li>)}
      </ul>
      <p className="grand-line">Total charged: <strong data-testid="order-total">{money(order.totals.total)}</strong></p>
      <div className="row-actions">
        {!order.gift && <Link to="/library" className="btn btn-primary">Go to library</Link>}
        <Link to="/" className="btn btn-ghost">Keep browsing</Link>
      </div>
    </div>
  )
}
