import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useStore } from '../lib/store'
import SearchBox from './SearchBox'

export default function Header() {
  const { badge, wishlist } = useStore()
  const [menu, setMenu] = useState(false)
  const close = () => setMenu(false)

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo" onClick={close}>
          <span className="logo-mark" aria-hidden="true">▣</span> PIXELVAULT
        </Link>

        <button
          type="button"
          className="menu-btn"
          aria-expanded={menu}
          aria-controls="main-nav"
          onClick={() => setMenu(!menu)}
        >
          {menu ? 'Close' : 'Menu'}
        </button>

        <nav id="main-nav" className={`nav ${menu ? 'open' : ''}`} aria-label="Main">
          <NavLink to="/" end onClick={close}>Store</NavLink>
          <NavLink to="/wishlist" onClick={close}>
            Wishlist <span className="count" data-testid="wishlist-count">({wishlist.length})</span>
          </NavLink>
          <NavLink to="/library" onClick={close}>Library</NavLink>
          <NavLink to="/cart" className="nav-cart" onClick={close}>
            Cart
            <span className="badge" data-testid="cart-badge" aria-label={`${badge} items in cart`}>
              {badge}
            </span>
          </NavLink>
        </nav>

        <SearchBox />
      </div>
    </header>
  )
}
