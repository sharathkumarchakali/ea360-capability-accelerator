import { useState } from 'react'
import { Download, RotateCcw } from 'lucide-react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { getTenantConfig } from '../../data/repositories/tenantRepository'
import {
  DEFAULT_DEMO_AS_OF,
  formatDemoAsOfLabel,
  getDemoAsOfDate,
  resetDemoAsOfDate,
  setDemoAsOfDate,
} from '../../domain/demo/demoClock'

export default function WorkspaceSettings() {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const pack = usePrototypeStore((s) => s.workingPack)
  const resetDemo = usePrototypeStore((s) => s.resetDemo)
  const showToast = usePrototypeStore((s) => s.showToast)
  const config = getTenantConfig(tenantCode)
  const [asOf, setAsOf] = useState(getDemoAsOfDate())
  const [error, setError] = useState('')
  const [confirmReset, setConfirmReset] = useState(false)

  function changeAsOf(value) {
    setAsOf(value)
    try {
      setDemoAsOfDate(value)
      setError('')
    } catch {
      setError('Enter a valid date.')
    }
  }

  function restoreDate() {
    resetDemoAsOfDate()
    setAsOf(getDemoAsOfDate())
    setError('')
    showToast('As-of date restored to the documented snapshot.')
  }

  function exportJson() {
    const payload = {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      synthetic: true,
      tenantCode,
      asOf: getDemoAsOfDate(),
      pack,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ea360-${tenantCode.toLowerCase()}-workspace-${getDemoAsOfDate()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    showToast('Workspace JSON exported (illustrative synthetic data).')
  }

  return (
    <section className="view active wv-view" data-demo-target="workspace-settings">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Workspace · Settings</div>
            <h1 className="page-title">Workspace Settings</h1>
            <p>Settings for {config.shortName || config.displayName}. All content in this workspace is synthetic.</p>
            <p className="sub">{formatDemoAsOfLabel(asOf)}</p>
          </div>
          <div className="synthetic-pill">ILLUSTRATIVE DATA</div>
        </div>

        <div className="wv-panel">
          <h2>As-of date</h2>
          <p className="sub">
            Evidence freshness, end-of-support horizons and reports are measured from this date. Documented snapshot: {DEFAULT_DEMO_AS_OF}.
          </p>
          <label className="field">
            <span>As-of date</span>
            <input type="date" value={asOf} onChange={(e) => changeAsOf(e.target.value)} aria-invalid={Boolean(error)} />
            {error && <small className="wv-error">{error}</small>}
          </label>
          <div className="wv-actions">
            <button type="button" className="btn secondary-button" onClick={restoreDate}>
              Restore documented date
            </button>
          </div>
        </div>

        <div className="wv-panel">
          <h2>Export workspace</h2>
          <p className="sub">Downloads the current working copy of this workspace as versioned JSON, including any changes made in this session.</p>
          <div className="wv-actions">
            <button type="button" className="btn primary primary-button" onClick={exportJson}>
              <Download size={16} aria-hidden="true" />
              Export JSON
            </button>
          </div>
        </div>

        <div className="wv-panel">
          <h2>Reset workspace</h2>
          <p className="sub">
            Restores {config.shortName || config.displayName} to its original synthetic seed and discards decisions,
            drafts and other changes made in this session.
          </p>
          {!confirmReset ? (
            <div className="wv-actions">
              <button type="button" className="btn secondary-button" onClick={() => setConfirmReset(true)}>
                <RotateCcw size={16} aria-hidden="true" />
                Reset workspace…
              </button>
            </div>
          ) : (
            <div className="wv-confirm" role="alertdialog" aria-label="Confirm reset">
              <p>This discards all session changes for this workspace. This cannot be undone.</p>
              <div className="wv-actions">
                <button
                  type="button"
                  className="btn primary primary-button"
                  onClick={() => {
                    resetDemo()
                    setConfirmReset(false)
                  }}
                >
                  Yes, reset workspace
                </button>
                <button type="button" className="btn secondary-button" onClick={() => setConfirmReset(false)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
