import { useState } from 'react'
import { executiveBriefing } from '../../lib/ai'
import { usePrototypeStore } from '../../state/prototypeStore'
import AIResponse from './AIResponse'

const ROLES = [
  'Executive Committee',
  'Commissioner',
  'CIO / CTO',
  'Enterprise architect',
  'Risk / compliance',
]

const EMPHASIS = [
  { id: 'balanced', label: 'Balanced' },
  { id: 'risk', label: 'Risk focus' },
  { id: 'value', label: 'Value / service' },
  { id: 'delivery', label: 'Delivery progress' },
]

export default function ExecutiveBriefing({ onAction, embedded }) {
  const role = usePrototypeStore((s) => s.role)
  const filters = usePrototypeStore((s) => s.filters)
  const getRepo = usePrototypeStore((s) => s.getRepo)
  const prefs = usePrototypeStore((s) => s.briefingPreferences)
  const setBriefingPreferences = usePrototypeStore((s) => s.setBriefingPreferences)
  const recordAiResponse = usePrototypeStore((s) => s.recordAiResponse)
  const domains = getRepo().listCapabilities?.()
    ? [...new Set(getRepo().listCapabilities().map((c) => c.domain).filter(Boolean))]
    : []

  const [preview, setPreview] = useState(null)
  const [copied, setCopied] = useState(false)

  function generate() {
    const tenant = getRepo().getTenant()
    const response = executiveBriefing({
      tenantId: tenant.id,
      userRole: role,
      query: `Executive briefing for ${prefs.role}`,
      intent: 'executive_briefing',
      briefingRole: prefs.role,
      briefingEmphasis: prefs.emphasis,
      filters: {
        period: prefs.period || filters.period,
        domain: prefs.domain || undefined,
        objectiveId: prefs.objectiveId || undefined,
      },
      view: 'executive',
    })
    recordAiResponse(response)
    setPreview(response)
  }

  async function copyText() {
    if (!preview) return
    const text = [preview.summary, preview.explanation, preview.whyItMatters]
      .filter(Boolean)
      .join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`ai-briefing${embedded ? ' embedded' : ''}`}>
      <div className="kicker">Assist · Executive briefing</div>
      <h3 className="section-title">Decision briefing</h3>
      <p className="sub">
        Role-specific snapshot from the active tenant. Indicative only — not a guaranteed financial
        forecast.
      </p>

      <div className="form-grid ai-briefing-form">
        <label className="field">
          <span>Audience role</span>
          <select
            value={prefs.role}
            onChange={(e) => setBriefingPreferences({ role: e.target.value })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Period</span>
          <input
            value={prefs.period}
            onChange={(e) => setBriefingPreferences({ period: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Domain focus</span>
          <select
            value={prefs.domain}
            onChange={(e) => setBriefingPreferences({ domain: e.target.value })}
          >
            <option value="">All domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Emphasis</span>
          <select
            value={prefs.emphasis}
            onChange={(e) => setBriefingPreferences({ emphasis: e.target.value })}
          >
            {EMPHASIS.map((e) => (
              <option key={e.id} value={e.id}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="toolbar wrap-actions">
        <button type="button" className="btn primary primary-button" onClick={generate}>
          Generate briefing
        </button>
        <button
          type="button"
          className="btn secondary-button"
          disabled={!preview}
          onClick={copyText}
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          className="btn secondary-button"
          disabled={!preview}
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>

      {preview ? (
        <div className="ai-briefing-preview print-friendly">
          <AIResponse response={preview} onAction={onAction} />
        </div>
      ) : null}
    </div>
  )
}
