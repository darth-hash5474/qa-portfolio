import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { hasBug } from '../lib/bugs'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function ageOn(y, m, d, today = new Date()) {
  let age = today.getFullYear() - y
  const before = today.getMonth() < m - 1 || (today.getMonth() === m - 1 && today.getDate() < d)
  if (before) age -= 1
  return age
}

// Mature-content gate shown on 'M' rated game pages. Native <dialog>: Esc is normally blocked.
export default function AgeGate({ title, onVerified }) {
  const ref = useRef(null)
  const [m, setM] = useState('')
  const [d, setD] = useState('')
  const [y, setY] = useState('')
  const [error, setError] = useState('')
  const thisYear = new Date().getFullYear()

  useEffect(() => {
    const dlg = ref.current
    if (dlg && !dlg.open) dlg.showModal()
  }, [])

  const onCancel = (e) => {
    if (hasBug('BUG-10')) onVerified(false) // Esc skips verification
    else e.preventDefault()
  }

  const submit = (e) => {
    e.preventDefault()
    if (!m || !d || !y) return setError('Please select your full date of birth.')
    const mm = Number(m), dd = Number(d), yy = Number(y)
    const real = new Date(yy, mm - 1, dd)
    if (real.getMonth() !== mm - 1 || real.getDate() !== dd) return setError("That date doesn't exist.")
    if (ageOn(yy, mm, dd) < 18) return setError('Sorry, you must be 18 or older to view this content.')
    setError('')
    onVerified(true)
  }

  return (
    <dialog ref={ref} className="dialog" aria-labelledby="age-title" onCancel={onCancel}>
      <form onSubmit={submit} noValidate>
        <h2 id="age-title">Age verification</h2>
        <p><strong>{title}</strong> contains mature content. Enter your date of birth to continue.</p>
        <div className="row3">
          <label>
            Month
            <select value={m} onChange={(e) => setM(e.target.value)}>
              <option value="">Month</option>
              {MONTHS.map((n, k) => <option key={n} value={k + 1}>{n}</option>)}
            </select>
          </label>
          <label>
            Day
            <select value={d} onChange={(e) => setD(e.target.value)}>
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, k) => <option key={k} value={k + 1}>{k + 1}</option>)}
            </select>
          </label>
          <label>
            Year
            <select value={y} onChange={(e) => setY(e.target.value)}>
              <option value="">Year</option>
              {Array.from({ length: 100 }, (_, k) => thisYear - k).map((yr) => <option key={yr} value={yr}>{yr}</option>)}
            </select>
          </label>
        </div>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="dialog-actions">
          <Link to="/" className="btn btn-ghost">Leave</Link>
          <button type="submit" className="btn btn-primary">Enter</button>
        </div>
      </form>
    </dialog>
  )
}
