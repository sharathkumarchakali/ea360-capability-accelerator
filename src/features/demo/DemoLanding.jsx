import { useMemo, useState } from 'react'
import {
  getTenantConfig,
  listAvailableTenants,
  usePrototypeStore,
} from '../../state/prototypeStore'
import { DEMO_ENTRY_OPTIONS, getDemoJourneys } from './demoJourneys'

export default function DemoLanding({ onStart }) {
  const tenants = listAvailableTenants()
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const role = usePrototypeStore((s) => s.role)
  const switchTenant = usePrototypeStore((s) => s.switchTenant)
  const setRole = usePrototypeStore((s) => s.setRole)
  const setPresentationMode = usePrototypeStore((s) => s.setPresentationMode)
  const startGuidedTour = usePrototypeStore((s) => s.startGuidedTour)
  const dismissLanding = usePrototypeStore((s) => s.dismissLanding)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const [presentation, setPresentation] = useState(true)

  function begin(entryId) {
    setPresentationMode(presentation)
    const entry = DEMO_ENTRY_OPTIONS.find((e) => e.id === entryId)
    dismissLanding()
    if (entry?.journeyKind) {
      const journeys = getDemoJourneys(tenantCode)
      const journey = journeys.find((j) => j.kind === entry.journeyKind) || journeys[0]
      if (journey) startGuidedTour(journey.id)
    }
    onStart?.(entryId)
  }

  return (
    <div className="demo-landing" role="dialog" aria-modal="true" aria-labelledby="demo-landing-title">
      <div className="demo-landing-panel">
        <p className="demo-landing-kicker">Enterprise Intelligence and Transformation Governance</p>
        <h1 id="demo-landing-title">EA360</h1>
        <p className="demo-landing-tagline">Know Your Enterprise. Shape What’s Next.</p>
        <p className="demo-landing-lead">
          Controlled synthetic demonstration for {config.displayName}. Choose how you want to begin.
        </p>

        <div className="demo-landing-controls">
          <label className="demo-field">
            <span>Organisation</span>
            <select
              value={tenantCode}
              aria-label="Organisation"
              onChange={(e) => switchTenant(e.target.value)}
            >
              {tenants.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.name} · Synthetic
                </option>
              ))}
            </select>
          </label>
          <label className="demo-field">
            <span>Role</span>
            <select value={role} aria-label="Role" onChange={(e) => setRole(e.target.value)}>
              {config.roleLabels.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="demo-check">
            <input
              type="checkbox"
              checked={presentation}
              onChange={(e) => setPresentation(e.target.checked)}
            />
            <span>Presentation mode (calmer chrome, larger focus)</span>
          </label>
        </div>

        <div className="demo-entry-grid">
          {DEMO_ENTRY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="demo-entry-card"
              onClick={() => begin(opt.id)}
            >
              <strong>{opt.label}</strong>
              <span>{opt.description}</span>
            </button>
          ))}
        </div>

        <p className="demo-landing-disclaimer">{config.syntheticDisclaimer}</p>
        <p className="demo-landing-disclaimer subtle">
          Synthetic demonstration data — not supplied or validated by the named institution.
        </p>
      </div>
    </div>
  )
}
