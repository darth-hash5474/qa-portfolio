import { useId, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { hasBug } from '../lib/bugs'
import { useStore } from '../lib/store'

// Search field with a suggestion list (ARIA combobox pattern).
export default function SearchBox() {
  const { games } = useStore()
  const nav = useNavigate()
  const [value, setValue] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = useId()

  const suggestions = useMemo(() => {
    const q = value.trim()
    if (!q) return []
    const match = (t) => (hasBug('BUG-06') ? t.includes(q) : t.toLowerCase().includes(q.toLowerCase()))
    return games.data.filter((g) => match(g.title)).slice(0, 5)
  }, [value, games.data])

  const showList = open && suggestions.length > 0

  const submit = (e) => {
    e.preventDefault()
    setOpen(false)
    const q = value.trim()
    nav(q ? `/?q=${encodeURIComponent(q)}` : '/')
  }

  const pick = (g) => {
    setOpen(false)
    setValue('')
    setActive(-1)
    nav(`/game/${g.id}`)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown' && suggestions.length) {
      e.preventDefault()
      setOpen(true)
      setActive((a) => (a + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp' && suggestions.length) {
      e.preventDefault()
      setActive((a) => (a <= 0 ? suggestions.length - 1 : a - 1))
    } else if (e.key === 'Enter' && showList && active >= 0) {
      e.preventDefault()
      pick(suggestions[active])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <form className="search" role="search" onSubmit={submit}>
      <input
        type="search"
        role="combobox"
        className="search-input"
        placeholder="Search games"
        aria-label="Search games"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 && showList ? `${listId}-${active}` : undefined}
        autoComplete="off"
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          setOpen(true)
          setActive(-1)
        }}
        onKeyDown={onKeyDown}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
      />
      <button type="submit" className="search-btn">
        Search
      </button>
      {showList && (
        <ul id={listId} role="listbox" className="suggest" aria-label="Search suggestions">
          {suggestions.map((g, i) => (
            <li
              key={g.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={i === active ? 'active' : ''}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(g)
              }}
            >
              <span aria-hidden="true">{g.emoji}</span> {g.title}
            </li>
          ))}
        </ul>
      )}
    </form>
  )
}
