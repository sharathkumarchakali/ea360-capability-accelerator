import { useEffect, useMemo, useState } from 'react'
import { callStoreAction } from '../workflow/callStoreAction'

const HORIZONS = ['now', 'next', 'later']
const COST_BANDS = ['low', 'medium', 'high', 'very-high', 'GHS 2–4m', 'GHS 3–5m', 'GHS 4–7m', 'GHS 8–12m', 'GHS 15–25m']

function ownerLabel(id) {
  return (id || '').replace(/^person-/, '') || ''
}

/**
 * Create initiative form pre-populated from an approved decision / recommendation.
 */
export default function CreateInitiativeModal({
  open,
  source,
  objectives = [],
  capabilities = [],
  onClose,
}) {
  const defaults = useMemo(() => {
    const rec = source?.recommendation || source
    const decision = source?.decision
    return {
      name: rec?.name ? `${rec.name} — initiative` : 'New initiative',
      description: rec?.outcome || rec?.description || decision?.rationale || '',
      horizon: 'next',
      costBand: rec?.effortBand === 'XL' ? 'GHS 15–25m' : rec?.effortBand === 'L' ? 'GHS 8–12m' : 'GHS 3–5m',
      expectedValue: rec?.expectedValue || '',
      riskReduction: rec?.riskReduction || '',
      recommendationIds: rec?.id ? [rec.id] : source?.recommendationIds || [],
      decisionId: decision?.id || source?.decisionId || '',
      objectiveIds: source?.objectiveIds || [],
      capabilityIds: rec?.affectedCapabilityIds || source?.capabilityIds || [],
      ownerId: rec?.ownerId || 'person-cio',
    }
  }, [source])

  const [form, setForm] = useState(defaults)
  const [errors, setErrors] = useState([])

  useEffect(() => {
    if (open) {
      setForm(defaults)
      setErrors([])
    }
  }, [open, defaults])

  if (!open) return null

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function validate() {
    const msgs = []
    if (!form.name.trim()) msgs.push('Name is required.')
    if (!form.description.trim()) msgs.push('Description / outcome is required.')
    if (!form.horizon) msgs.push('Select a delivery horizon (Now / Next / Later).')
    if (!form.expectedValue.trim()) msgs.push('Expected value is required.')
    if (!form.riskReduction.trim()) msgs.push('Risk reduction statement is required.')
    if (!(form.recommendationIds || []).length && !form.decisionId) {
      msgs.push('Link at least one approved recommendation or decision.')
    }
    return msgs
  }

  function submit(e) {
    e.preventDefault()
    const msgs = validate()
    setErrors(msgs)
    if (msgs.length) return
    callStoreAction('createInitiative', {
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      status: 'proposed',
      progressPercent: 0,
    })
    onClose?.({ created: true })
  }

  return (
    <div className="confirm-root" role="presentation">
      <button type="button" className="confirm-backdrop" aria-label="Close" onClick={() => onClose?.()} />
      <div
        className="confirm-dialog initiative-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Create initiative"
      >
        <header className="initiative-modal-head">
          <div>
            <div className="kicker">Transform · Create initiative</div>
            <h3>Pre-populated from approved source</h3>
          </div>
          <button type="button" className="btn secondary-button" onClick={() => onClose?.()}>
            Close
          </button>
        </header>
        <form onSubmit={submit} className="initiative-form">
          {errors.length > 0 && (
            <div className="form-errors" role="alert">
              {errors.map((m) => (
                <p key={m}>{m}</p>
              ))}
            </div>
          )}
          <label className="field grow">
            <span>Name</span>
            <input value={form.name} onChange={(e) => update('name', e.target.value)} />
          </label>
          <label className="field grow">
            <span>Description</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </label>
          <div className="form-grid">
            <label className="field">
              <span>Horizon</span>
              <select value={form.horizon} onChange={(e) => update('horizon', e.target.value)}>
                {HORIZONS.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Cost band</span>
              <select value={form.costBand} onChange={(e) => update('costBand', e.target.value)}>
                {COST_BANDS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Owner</span>
              <input
                value={ownerLabel(form.ownerId)}
                onChange={(e) => update('ownerId', `person-${e.target.value}`)}
              />
            </label>
          </div>
          <label className="field grow">
            <span>Expected value</span>
            <input
              value={form.expectedValue}
              onChange={(e) => update('expectedValue', e.target.value)}
            />
          </label>
          <label className="field grow">
            <span>Risk reduction</span>
            <input
              value={form.riskReduction}
              onChange={(e) => update('riskReduction', e.target.value)}
            />
          </label>
          <label className="field grow">
            <span>Strategic objectives</span>
            <select
              multiple
              value={form.objectiveIds}
              onChange={(e) =>
                update(
                  'objectiveIds',
                  [...e.target.selectedOptions].map((o) => o.value),
                )
              }
            >
              {objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field grow">
            <span>Capabilities</span>
            <select
              multiple
              value={form.capabilityIds}
              onChange={(e) =>
                update(
                  'capabilityIds',
                  [...e.target.selectedOptions].map((o) => o.value),
                )
              }
            >
              {capabilities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <p className="sub">
            Linked recommendation(s): {(form.recommendationIds || []).join(', ') || 'none'}
            {form.decisionId ? ` · Decision ${form.decisionId}` : ''}
          </p>
          <div className="confirm-actions">
            <button type="button" className="btn secondary-button" onClick={() => onClose?.()}>
              Cancel
            </button>
            <button type="submit" className="btn primary primary-button">
              Create initiative
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
