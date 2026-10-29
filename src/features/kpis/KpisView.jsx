import { useMemo, useState } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { formatDemoAsOfLabel } from '../../domain/demo/demoClock'

/** Share of the distance from baseline to target that has been covered (0–100, clamped). */
function progressToTarget(k) {
  const base = k.baselineValue
  if (!Number.isFinite(base) || !Number.isFinite(k.currentValue) || !Number.isFinite(k.targetValue)) return null
  const span = k.targetValue - base
  if (span === 0) return k.currentValue === k.targetValue ? 100 : 0
  return Math.max(0, Math.min(100, Math.round(((k.currentValue - base) / span) * 100)))
}

function tone(pct) {
  if (pct === null) return 'muted'
  if (pct >= 75) return 'good'
  if (pct >= 40) return 'warn'
  return 'bad'
}

const show = (v, unit) => (v === undefined || v === null ? '—' : `${v}${unit ? ` ${unit}` : ''}`)

export default function KpisView() {
  const pack = usePrototypeStore((s) => s.workingPack)
  const selectedEntity = usePrototypeStore((s) => s.selectedEntity)
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')

  const kpis = useMemo(() => pack?.kpis ?? [], [pack])
  const categories = useMemo(() => [...new Set(kpis.map((k) => k.category).filter(Boolean))].sort(), [kpis])
  const visible = kpis.filter((k) => {
    if (category && k.category !== category) return false
    const q = search.trim().toLowerCase()
    return !q || `${k.id} ${k.name}`.toLowerCase().includes(q)
  })
  const selectedKpi = selectedEntity?.type === 'kpi' ? selectedEntity.id : null

  if (!pack) return null

  return (
    <section className="view active wv-view" data-demo-target="kpi-register">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Transform · KPIs</div>
            <h1 className="page-title">KPIs</h1>
            <p>
              Baseline, current and target for every indicator. Targets state intent; they are not achieved by
              approving a change.
            </p>
            <p className="sub">{formatDemoAsOfLabel()}</p>
          </div>
          <div className="synthetic-pill">ILLUSTRATIVE DATA</div>
        </div>

        <div className="wv-filters" role="group" aria-label="KPI filters">
          <label className="field">
            <span>Search</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or id" />
          </label>
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="table-wrap">
          <table className="data-table">
            <caption className="wv-caption">
              {visible.length} of {kpis.length} indicators. Progress is the share of the baseline-to-target distance covered.
            </caption>
            <thead>
              <tr>
                <th>KPI</th>
                <th>Category</th>
                <th>Baseline</th>
                <th>Current</th>
                <th>Target</th>
                <th>Progress</th>
                <th>Frequency</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7}>No KPIs match these filters.</td>
                </tr>
              )}
              {visible.map((k) => {
                const pct = progressToTarget(k)
                return (
                  <tr
                    key={k.id}
                    className={`clickable-row${k.id === selectedKpi ? ' is-selected' : ''}`}
                    tabIndex={0}
                    aria-selected={k.id === selectedKpi}
                    onClick={() => selectEntity({ id: k.id, type: 'kpi' })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        selectEntity({ id: k.id, type: 'kpi' })
                      }
                    }}
                  >
                    <td>{k.name}</td>
                    <td>{k.category || '—'}</td>
                    <td>{show(k.baselineValue, k.unit)}</td>
                    <td>{show(k.currentValue, k.unit)}</td>
                    <td>{show(k.targetValue, k.unit)}</td>
                    <td>
                      <span className={`status-tag tone-${tone(pct)}`}>{pct === null ? 'No baseline' : `${pct}%`}</span>
                    </td>
                    <td>{k.measurementFrequency || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="sub synthetic-disclosure">Illustrative synthetic indicators — values are not measurements of any real organisation.</p>
      </div>
    </section>
  )
}
