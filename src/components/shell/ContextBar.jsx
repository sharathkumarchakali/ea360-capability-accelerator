import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Calendar,
  Home,
  MonitorPlay,
  RotateCcw,
  Settings2,
  UserRound,
} from 'lucide-react'
import {
  getTenantConfig,
  usePrototypeStore,
} from '../../state/prototypeStore'
import ConfirmDialog from '../ui/ConfirmDialog'
import { getDemoJourneys } from '../../features/demo/demoJourneys'

/** Compact demo-controls popover (replaces the second header row). */
export default function DemoControls({ onOpenDemoHome, open, onToggle, onClose }) {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const role = usePrototypeStore((s) => s.role)
  const setRole = usePrototypeStore((s) => s.setRole)
  const resetDemo = usePrototypeStore((s) => s.resetDemo)
  const filters = usePrototypeStore((s) => s.filters)
  const presentationMode = usePrototypeStore((s) => s.presentationMode)
  const setPresentationMode = usePrototypeStore((s) => s.setPresentationMode)
  const startGuidedTour = usePrototypeStore((s) => s.startGuidedTour)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const [confirmReset, setConfirmReset] = useState(false)
  const journeys = getDemoJourneys(tenantCode)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    function onPointer(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose?.()
      }
    }
    document.addEventListener('mousedown', onPointer)
    return () => document.removeEventListener('mousedown', onPointer)
  }, [open, onClose])

  return (
    <div className="demo-controls" ref={panelRef}>
      <button
        type="button"
        className={`demo-controls-trigger${open ? ' is-open' : ''}${presentationMode ? ' is-active' : ''}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls="demo-controls-panel"
        onClick={onToggle}
        title="Demo controls"
      >
        <Settings2 size={16} strokeWidth={2} aria-hidden="true" />
        <span className="demo-controls-trigger-label">Demo</span>
      </button>

      <div
        id="demo-controls-panel"
        className={`demo-controls-panel${open ? ' show' : ''}`}
        role="dialog"
        aria-label="Demo controls"
        aria-hidden={!open}
      >
        <header className="demo-controls-head">
          <h4>Demo controls</h4>
          <p>Role, period, scenarios and presentation</p>
        </header>

        <div className="demo-controls-body">
          <label className="demo-controls-field">
            <span className="demo-controls-label">
              <UserRound size={14} strokeWidth={2} aria-hidden="true" />
              Role
            </span>
            <select
              className="demo-controls-select"
              aria-label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {config.roleLabels.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>

          <div className="demo-controls-field">
            <span className="demo-controls-label">
              <Calendar size={14} strokeWidth={2} aria-hidden="true" />
              Reporting period
            </span>
            <span className="demo-controls-period" title="Reporting period">
              {filters.period}
            </span>
          </div>

          <label className="demo-controls-field">
            <span className="demo-controls-label">Guided scenario</span>
            <select
              className="demo-controls-select"
              aria-label="Guided scenario"
              defaultValue=""
              onChange={(e) => {
                const id = e.target.value
                e.target.value = ''
                if (id) startGuidedTour(id)
              }}
            >
              <option value="" disabled>
                Guided scenario…
              </option>
              {journeys.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.durationLabel})
                </option>
              ))}
            </select>
          </label>

          <div className="demo-controls-actions">
            <button
              className={`demo-controls-btn${presentationMode ? ' is-active' : ''}`}
              type="button"
              aria-pressed={presentationMode}
              onClick={() => setPresentationMode(!presentationMode)}
            >
              <MonitorPlay size={14} strokeWidth={2} aria-hidden="true" />
              <span>Present</span>
            </button>
            <button
              className="demo-controls-btn"
              type="button"
              onClick={() => {
                onClose?.()
                onOpenDemoHome?.()
              }}
            >
              <Home size={14} strokeWidth={2} aria-hidden="true" />
              <span>Demo Home</span>
            </button>
            <button
              className="demo-controls-btn demo-controls-btn-danger"
              type="button"
              onClick={() => setConfirmReset(true)}
              title="Restore seeded state for the active tenant"
            >
              <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset demonstration?"
        message="This restores the original synthetic pack, filters, AI history and roadmap state for the active organisation only."
        confirmLabel="Reset demo"
        cancelLabel="Cancel"
        tone="danger"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false)
          resetDemo()
          window.location.hash = ''
          onClose?.()
        }}
      />
    </div>
  )
}
