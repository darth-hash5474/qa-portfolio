import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Toasts from './components/Toasts'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Game from './pages/Game'
import Library from './pages/Library'
import Order from './pages/Order'
import Store from './pages/Store'
import Wishlist from './pages/Wishlist'

function NotFound() {
  return (
    <div className="empty">
      <h1>404 — Page not found</h1>
      <p>This level doesn't exist. Maybe it was a secret one.</p>
      <Link to="/" className="btn btn-primary">Back to the store</Link>
    </div>
  )
}

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <a href="#content" className="skip">Skip to content</a>
      <Header />
      <main id="content" className="page" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Store />} />
          <Route path="/game/:id" element={<Game />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:number" element={<Order />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/library" element={<Library />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">
        <p>© 2026 PixelVault — a fictional store built for UI test practice. No real purchases are made.</p>
      </footer>
      <Toasts />
    </>
  )
}
