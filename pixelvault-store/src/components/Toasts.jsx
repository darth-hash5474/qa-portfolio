import { useStore } from '../lib/store'

export default function Toasts() {
  const { toasts, dismissToast } = useStore()
  return (
    <div className="toasts" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.kind}`} role="status" data-testid="toast">
          <span>{t.message}</span>
          <button type="button" className="toast-x" aria-label="Dismiss notification" onClick={() => dismissToast(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
