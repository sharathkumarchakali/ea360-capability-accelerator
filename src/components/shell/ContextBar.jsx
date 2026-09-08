import { useMemo, useState } from 'react'
import {
  Calendar,
  Home,
  MonitorPlay,
  RotateCcw,
  UserRound,
} from 'lucide-react'
import {
  getTenantConfig,
  usePrototypeStore,
} from '../../state/prototypeStore'
import ConfirmDialog from '../ui/ConfirmDialog'
import { getDemoJourneys } from '../../features/demo/demoJourneys'

export default function ContextBar({ onOpenDemoHome }) {
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

  return (
    <div className="context-bar" role="region" aria-label="Context and demo controls">
      <div className="context-bar-group context-bar-primary">
        <label className="context-field">
          <UserRound size={14} strokeWidth={2} aria-hidden="true" />
          <span className="context-field-label">Role</span>
          <select
            className="context-select role-select"
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

        <span className="context-chip period" title="Reporting period">
          <Calendar size={14} strokeWidth={2} aria-hidden="true" />
          <span>{filters.period}</span>
        </span>

        <label className="context-field context-field-grow">
          <span className="context-field-label">Scenario</span>
          <select
            className="context-select scenario-launch"
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
      </div>

      <div className="context-bar-group context-bar-actions">
        <button
          className={`context-btn${presentationMode ? ' is-active' : ''}`}
          type="button"
          aria-pressed={presentationMode}
          onClick={() => setPresentationMode(!presentationMode)}
        >
          <MonitorPlay size={14} strokeWidth={2} aria-hidden="true" />
          <span>Present</span>
        </button>
        <button className="context-btn" type="button" onClick={onOpenDemoHome}>
          <Home size={14} strokeWidth={2} aria-hidden="true" />
          <span>Demo home</span>
        </button>
        <button
          className="context-btn context-btn-danger"
          type="button"
          onClick={() => setConfirmReset(true)}
          title="Restore seeded state for the active tenant"
        >
          <RotateCcw size={14} strokeWidth={2} aria-hidden="true" />
          <span>Reset</span>
        </button>
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
        }}
      />
    </div>
  )
}