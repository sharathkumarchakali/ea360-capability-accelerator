import { useMemo, useState } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { deriveExecutiveMetrics } from '../../domain/metrics'
import { formatDemoAsOfLabel } from '../../domain/demo/demoClock'

function gapTone(gap) {
  if (gap >= 2) return 'bad'
  if (gap >= 1) return 'warn'
  return 'good'
}

const fmt = (n) => (Number.isFinite(n) ? Math.round(n * 10) / 10 : '—')

export default function ArchitectureHealthView({ onNavigate }) {
  const pack = usePrototypeStore((s) => s.workingPack)
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const [domain, setDomain] = useState('')
  const [level, setLevel] = useState('')

  const metrics = useMemo(() => (pack ? deriveExecutiveMetrics(pack) : null), [pack])
  const rows = useMemo(
    () =>
      (pack?.capabilities ?? [])
        .map((c) => ({ ...c, gap: Math.max(0, (c.maturityTarget ?? 0) - (c.maturityCurrent ?? 0)) }))
        .sort((a, b) => b.gap - a.gap || (b.riskScore ?? 0) - (a.riskScore ?? 0)),
    [pack],
  )
  const domains = useMemo(() => [...new Set(rows.map((r) => r.domain).filter(Boolean))].sort(), [rows])
  const visible = rows.filter((r) => (!domain || r.domain === domain) && (!level || String(r.level) === level))
  const gapCount = rows.filter((r) => r.gap > 0).length

  if (!pack || !metrics) return null

  return (
    <section className="view active wv-view" data-demo-target="architecture-health">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Insights · Architecture Health</div>
            <h1 className="page-title">Architecture Health</h1>
            <p>
              Current versus target maturity for every capability, with the gaps that matter most listed first.
              Select a row to open the capability record.
            </p>
            <p className="sub">{formatDemoAsOfLabel()}</p>
          </div>
          <div className="synthetic-pill">ILLUSTRATIVE DATA</div>
        </div>

        <div className="app-metric-strip" role="group" aria-label="Architecture health metrics">
          <div className="app-metric">
            <span>Enterprise health</span>
            <strong>{fmt(metrics.enterpriseHealth)}</strong>
          </div>
          <div className="app-metric">
            <span>Architecture maturity</span>
            <strong>{fmt(metrics.architectureMaturity)}</strong>
          </div>
          <div className="app-metric">
            <span>Application health</span>
            <strong>{fmt(metrics.applicationHealth)}</strong>
          </div>
          <div className="app-metric">
            <span>Critical risks</span>
            <strong>{metrics.criticalRiskCount}</strong>
          </div>
          <div className="app-metric">
            <span>Open findings</span>
            <strong>{metrics.openFindings}</strong>
          </div>
          <div className="app-metric">
            <span>Capabilities below target</span>
            <strong>
              {gapCount} of {rows.length}
            </strong>
          </div>
        </div>

        <div className="wv-filters" role="group" aria-label="Capability filters">
          <label className="field">
            <span>Domain</span>
            <select value={domain} onChange={(e) => setDomain(e.target.value)}>
              <option value="">All domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Level</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="">All levels</option>
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
            </select>
          </label>
          <button type="button" className="btn secondary-button" onClick={() => onNavigate?.('capabilities')}>
            Open capability map
          </button>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <caption className="wv-caption">
              Showing {visible.length} of {rows.length} capabilities, largest maturity gap first.
            </caption>
            <thead>
              <tr>
                <th>Capability</th>
                <th>Domain</th>
                <th>Current</th>
                <th>Target</th>
                <th>Gap</th>
                <th>Strategic importance</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={6}>No capabilities match these filters.</td>
                </tr>
              )}
              {visible.map((c) => (
                <tr
                  key={c.id}
                  className="clickable-row"
                  tabIndex={0}
                  onClick={() => selectEntity({ id: c.id, type: 'capability' })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      selectEntity({ id: c.id, type: 'capability' })
                    }
                  }}
                >
                  <td>{c.name}</td>
                  <td>{c.domain || '—'}</td>
                  <td>{fmt(c.maturityCurrent)}</td>
                  <td>{fmt(c.maturityTarget)}</td>
                  <td>
                    <span className={`status-tag tone-${gapTone(c.gap)}`}>{fmt(c.gap)}</span>
                  </td>
                  <td>{c.strategicImportance ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sub synthetic-disclosure">Illustrative synthetic assessment — not an audit of any real organisation.</p>
      </div>
    </section>
  )
}
