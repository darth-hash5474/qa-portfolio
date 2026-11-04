# PixelVault — practice game store

A fictional Steam-style storefront (React + Vite, frontend only) built as a **UI test target**.
All data comes from `public/api/games.json`; nothing is real, nothing leaves the browser.

```bash
npm install
npm run dev        # http://localhost:5173
# or
npm run build && npm run preview   # http://localhost:4173
```

## Seeded bugs

The app ships with 14 deliberate defects for practice. Pick how many are active with an npm flag
when you start the server (no `--` separator needed):

| Command | Bugs active |
| --- | --- |
| `npm run dev` or `npm run dev --bugless` | none |
| `npm run dev --bugs=all` | all 14 |
| `npm run dev --bugs=5` | the first 5 (BUG-01 to BUG-05), always the same ones |
| `npm run dev --bugs=BUG-03,BUG-07` | exactly the listed bugs |

The same flags work for `npm run build`; the choice is baked into the build that `npm run preview` serves.
Restart the server to change the flag. The terminal prints which bugs are on when it starts.
A bad value (`--bugs=abc`, or `--bugless` together with `--bugs`) stops with an error message.

A `?bugs=` URL param overrides the flag for a single page load, which is handy inside a test:
`?bugs=all`, `?bugs=5`, `?bugs=BUG-03,BUG-07`, or `?bugs=` for none.

## What's in it

| Area | UI worth testing |
| --- | --- |
| **Store** (`/#/`) | Featured carousel (autoplay, pause, dots), genre checkboxes, price slider, on-sale checkbox, rating dropdown, 6 sort options, grid/list toggle, 12-per-page pagination, loading skeleton, empty state, error state with retry |
| **Search** | Header combobox with suggestions, arrow-key + Enter selection, submit to results page |
| **Game page** (`/#/game/:id`) | Screenshot gallery + lightbox `<dialog>`, ARIA tabs (arrow keys), review filter, wishlist toggle, add to cart / in cart / in library states, coming-soon game, 404 |
| **Age gate** | `M`-rated games open a modal with month/day/year dropdowns (impossible dates, under 18, Esc blocked) |
| **Cart** (`/#/cart`) | Remove items, promo codes, savings line, empty state, persists across reloads |
| **Checkout** (`/#/checkout`) | Field validation on blur and on submit, input masks (card, expiry), country-based tax, 3 payment methods, gift option with character counter, free-order path, simulated processing and declines |
| **Library / Wishlist** | Simulated install progress → Play, add to cart from wishlist |
| **Layout** | Hamburger menu under 720px, responsive grids, toasts, skip link |

## Test data

- **Promo codes:** `PIXEL10` (10% off), `VAULT5` ($5 off, needs $20+ subtotal), `EXPIRED20` (expired). Codes are case-insensitive.
- **Cards:** `4242 4242 4242 4242` succeeds, `4000 0000 0000 0002` is declined. Any future expiry (MM/YY), any 3-digit CVC.
- **Vault Wallet** balance is $25.00, so larger orders fail with an insufficient-balance message.
- **Tax:** US 8.25%, CA 5%, GB 20%, DE 19%, AU 10%, JP 10%, BR 0%.
- **Free games:** Brickbreaker Odyssey and Dragonwake Online (a cart of only free games skips payment).
- **Coming soon:** Eclipse Protocol can be wishlisted but not bought.

## URL switches (handy for automation)

| Param | Effect |
| --- | --- |
| `?delay=1500` | Slower games request (default 500 ms) so loading states are easy to see |
| `?fail=1` | Games request fails, which shows the error state |
| `?bugs=BUG-01,BUG-05` | Overrides the `--bugs` flag for this page load (see "Seeded bugs" above). Also available from the 🐞 QA Lab panel |

Put them before the hash: `http://localhost:5173/?delay=1500&bugs=BUG-03#/cart`.
Store filters live inside the hash: `/#/?genre=RPG,Horror&max=30&sale=1&sort=price-asc&page=2`.

## Locator notes

Most controls have proper roles, labels, and accessible names, so role-based locators work.
A handful of elements have `data-testid` (`game-card`, `cart-badge`, `price`, `cart-subtotal`, `co-total`,
`order-number`, `toast`, `result-count`, …) so you can practice both styles.

## State & reset

Cart, wishlist, library, orders, promo, and age verification are stored in `localStorage` (`pv_*` keys).
Use a fresh browser context per test, or clear storage, to start clean.

## Project layout

```
public/api/games.json   mock catalog (27 games)
src/lib/                bug-ids.js + bugs.js (bug switches), pricing.js (totals/promos/tax), store.jsx (state)
src/components/         Header, SearchBox, Carousel, GameCard, AgeGate, QALab, …
src/pages/              Store, Game, Cart, Checkout, Order, Library, Wishlist
```
