import { useEffect, useId, useRef } from 'react'

/**
 * Accessible confirmation dialog for irreversible workflow actions.
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}) {
  const titleId = useId()
  const descId = useId()
  const confirmRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const prev = document.activeElement
    const t = setTimeout(() => confirmRef.current?.focus(), 30)
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      document.removeEventListener('keydown', onKey)
      if (prev && typeof prev.focus === 'function') prev.focus()
    }
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="confirm-root" role="presentation">
      <button type="button" className="confirm-backdrop" aria-label="Dismiss" onClick={onCancel} />
      <div
        className={`confirm-dialog confirm-${tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <h3 id={titleId}>{title}</h3>
        <p id={descId}>{message}</p>
        <div className="confirm-actions">
          <button type="button" className="btn secondary-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn primary primary-button${tone === 'danger' ? ' confirm-danger-btn' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
