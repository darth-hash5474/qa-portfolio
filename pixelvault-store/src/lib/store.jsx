import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { hasBug } from './bugs'

const Ctx = createContext(null)
export const useStore = () => useContext(Ctx)

function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch {
    return fallback
  }
}
function save(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val))
  } catch {
    /* storage unavailable */
  }
}

// Loading is deliberately a little slow so loading states are visible.
// ?delay=1500 makes it slower, ?fail=1 forces the error state.
function gamesRequest() {
  const q = new URLSearchParams(window.location.search)
  const delay = Number(q.get('delay') ?? 500)
  const fail = q.get('fail') === '1'
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        if (fail) throw new Error('Forced failure')
        const res = await fetch(`${import.meta.env.BASE_URL}api/games.json`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        resolve((await res.json()).games)
      } catch (e) {
        reject(e)
      }
    }, delay)
  })
}

export function StoreProvider({ children }) {
  const [games, setGames] = useState({ status: 'loading', data: [], error: null })
  const [cart, setCart] = useState(() => load('pv_cart', []))
  const [wishlist, setWishlist] = useState(() => (hasBug('BUG-13') ? [] : load('pv_wishlist', [])))
  const [library, setLibrary] = useState(() => load('pv_library', []))
  const [orders, setOrders] = useState(() => load('pv_orders', []))
  const [promoCode, setPromoCode] = useState(() => load('pv_promo', ''))
  const [ageOk, setAgeOk] = useState(() => load('pv_age_ok', false))
  const [badge, setBadge] = useState(() => load('pv_cart', []).length)
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const loadGames = useCallback(() => {
    setGames((g) => ({ ...g, status: 'loading', error: null }))
    gamesRequest().then(
      (data) => setGames({ status: 'ready', data, error: null }),
      (error) => setGames({ status: 'error', data: [], error: error.message }),
    )
  }, [])
  useEffect(() => {
    loadGames()
  }, [loadGames])

  useEffect(() => {
    save('pv_cart', cart)
  }, [cart])
  useEffect(() => {
    if (!hasBug('BUG-13')) save('pv_wishlist', wishlist)
  }, [wishlist])
  useEffect(() => {
    save('pv_library', library)
  }, [library])
  useEffect(() => {
    save('pv_orders', orders)
  }, [orders])
  useEffect(() => {
    save('pv_promo', promoCode)
  }, [promoCode])
  useEffect(() => {
    save('pv_age_ok', ageOk)
  }, [ageOk])

  const toast = useCallback((message, kind = 'info') => {
    const id = ++toastId.current
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000)
  }, [])
  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const byId = useMemo(() => Object.fromEntries(games.data.map((g) => [g.id, g])), [games.data])

  const addToCart = useCallback(
    (game) => {
      if (game.comingSoon) return toast(`${game.title} isn't released yet.`, 'error')
      if (library.includes(game.id)) return toast(`You already own ${game.title}.`, 'error')
      if (cart.includes(game.id) && !hasBug('BUG-03')) return toast(`${game.title} is already in your cart.`, 'error')
      setCart((c) => [...c, game.id])
      setBadge(cart.length + 1)
      toast(`${game.title} added to cart`, 'success')
    },
    [cart, library, toast],
  )
  const removeFromCart = useCallback(
    (id) => {
      const next = cart.filter((x) => x !== id)
      setCart(next)
      if (!hasBug('BUG-04')) setBadge(next.length)
    },
    [cart],
  )
  const toggleWishlist = useCallback(
    (game) => {
      const on = wishlist.includes(game.id)
      setWishlist(on ? wishlist.filter((x) => x !== game.id) : [...wishlist, game.id])
      toast(on ? `${game.title} removed from wishlist` : `${game.title} added to wishlist`, on ? 'info' : 'success')
    },
    [wishlist, toast],
  )

  const placeOrder = useCallback(
    ({ items, totals, email, gift, country }) => {
      const number = `PV-${String(Date.now()).slice(-8)}`
      const order = { number, items, totals, email, gift, country, placedAt: new Date().toISOString() }
      setOrders((o) => [order, ...o])
      if (!gift) setLibrary((l) => [...new Set([...l, ...items])])
      setWishlist((w) => w.filter((id) => !items.includes(id)))
      setCart([])
      setBadge(0)
      setPromoCode('')
      return number
    },
    [],
  )

  const value = {
    games, loadGames, byId,
    cart, addToCart, removeFromCart, badge,
    wishlist, toggleWishlist,
    library, orders, placeOrder,
    promoCode, setPromoCode,
    ageOk, setAgeOk,
    toasts, toast, dismissToast,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
