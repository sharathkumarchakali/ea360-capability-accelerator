import { useMemo, useState } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { callStoreAction } from '../workflow/callStoreAction'

const HORIZONS = ['now', 'next', 'later']
const QUARTERS = ['2026-Q3', '2026-Q4', '2027-Q1', '2027-Q2', '2027-Q3', '2027-Q4']

function deriveQuarter(initiative) {
  if (initiative.quarter) return initiative.quarter
  if (initiative.targetQuarter) return initiative.targetQuarter
  if (initiative.horizon === 'now') return '2026-Q3'
  if (initiative.horizon === 'next') return '2026-Q4'
  return '2027-Q2'
}

function dependencyIds(initiative, relationships = []) {
  if (Array.isArray(initiative.dependencyIds)) return initiative.dependencyIds
  return relationships
    .filter(
      (r) =>
        r.sourceId === initiative.id &&
        r.targetType === 'initiative' &&
        (r.relationshipType === 'depends-on' || r.relationshipType === 'blocks'),
    )
    .map((r) => r.targetId)
}

export default function RoadmapView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const setGraphRoot = usePrototypeStore((s) => s.setGraphRoot)
  const selected = usePrototypeStore((s) => s.selectedEntity)

  const [mode, setMode] = useState('horizon') // horizon | quarterly | objective | capability
  const [objectiveId, setObjectiveId] = useState('')
  const [capabilityId, setCapabilityId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [highlightDeps, setHighlightDeps] = useState(true)
  const [focusId, setFocusId] = useState(null)

  const initiatives = repo.listInitiatives()
  const objectives = repo.listObjectives()
  const capabilities = repo.listCapabilities().filter((c) => c.level === 1)
  const relationships = repo.listRelationships()

  const enriched = useMemo(
    () =>
      initiatives.map((i) => ({
        i,
        quarter: deriveQuarter(i),
        deps: dependencyIds(i, relationships),
        objectiveNames: (i.objectiveIds || [])
          .map((id) => objectives.find((o) => o.id === id)?.name)
          .filter(Boolean),
        capabilityNames: (i.capabilityIds || [])
          .map((id) => repo.getCapability(id)?.name)
          .filter(Boolean),
      })),
    [initiatives, relationships, objectives, repo],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enriched.filter(({ i }) => {
      if (statusFilter && i.status !== statusFilter) return false
      if (objectiveId && !(i.objectiveIds || []).includes(objectiveId)) return false
      if (capabilityId && !(i.capabilityIds || []).includes(capabilityId)) return false
      if (q && !`${i.name} ${i.expectedValue} ${i.riskReduction}`.toLowerCase().includes(q)) {
        return false
      }
      return true
    })
  }, [enriched, search, statusFilter, objectiveId, capabilityId])

  const activeId =
    focusId ||
    (selected?.type === 'initiative' ? selected.id : null) ||
    filtered[0]?.i.id
  const active = filtered.find((x) => x.i.id === activeId) || null
  const depSet = new Set(active?.deps || [])
  if (highlightDeps && active) {
    filtered.forEach(({ i, deps }) => {
      if (deps.includes(active.i.id)) depSet.add(i.id)
    })
  }

  function openInitiative(id) {
    setFocusId(id)
    selectEntity({ id, type: 'initiative' })
  }

  function openExplorer(id) {
    setGraphRoot({ id, type: 'initiative' })
    setView('explorer')
    window.location.hash = 'explorer'
  }

  function columnsForMode() {
    if (mode === 'quarterly') {
      return QUARTERS.map((q) => ({
        key: q,
        label: q,
        items: filtered.filter((x) => x.quarter === q),
      }))
    }
    if (mode === 'objective') {
      const ids = objectiveId ? [objectiveId] : objectives.map((o) => o.id)
      return ids.map((id) => {
        const o = objectives.find((x) => x.id === id)
        return {
          key: id,
          label: o?.name || id,
          items: filtered.filter((x) => (x.i.objectiveIds || []).includes(id)),
        }
      })
    }
    if (mode === 'capability') {
      const ids = capabilityId ? [capabilityId] : capabilities.slice(0, 6).map((c) => c.id)
      return ids.map((id) => {
        const c = repo.getCapability(id)
        return {
          key: id,
          label: c?.name || id,
          items: filtered.filter((x) => (x.i.capabilityIds || []).includes(id)),
        }
      })
    }
    return HORIZONS.map((h) => ({
      key: h,
      label: h === 'now' ? 'Now' : h === 'next' ? 'Next' : 'Later',
      items: filtered.filter((x) => x.i.horizon === h),
    }))
  }

  const columns = columnsForMode()

  return (
    <section className="view active">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Transform · Roadmap</div>
            <h1 className="page-title">Transformation roadmap</h1>
            <p>
              Now / Next / Later, quarterly, objective and capability views with dependency
              highlights and horizon moves.
            </p>
          </div>
        </div>

        <div className="toolbar roadmap-mode-bar">
          {[
            ['horizon', 'Now / Next / Later'],
            ['quarterly', 'Quarterly'],
            ['objective', 'By objective'],
            ['capability', 'By capability'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`btn ${mode === id ? 'primary primary-button' : 'secondary-button'}`}
              onClick={() => setMode(id)}
            >
              {label}
            </button>
          ))}
          <label className="field inline-check">
            <input
              type="checkbox"
              checked={highlightDeps}
              onChange={(e) => setHighlightDeps(e.target.checked)}
            />
            <span>Highlight dependencies</span>
          </label>
        </div>

        <div className="intel-toolbar">
          <label className="field grow">
            <span>Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Initiative, value…"
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="proposed">Proposed</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="field">
            <span>Objective</span>
            <select value={objectiveId} onChange={(e) => setObjectiveId(e.target.value)}>
              <option value="">All</option>
              {objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Capability</span>
            <select value={capabilityId} onChange={(e) => setCapabilityId(e.target.value)}>
              <option value="">All</option>
              {capabilities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={`roadmap-board mode-${mode}`}>
          {columns.map((col) => (
            <div key={col.key} className="roadmap-column">
              <header className="roadmap-column-head">
                <h3>{col.label}</h3>
                <span className="sub">{col.items.length}</span>
              </header>
              <div className="roadmap-column-body">
                {col.items.map(({ i, deps, quarter, objectiveNames, capabilityNames }) => {
                  const isActive = active?.i.id === i.id
                  const isDep = highlightDeps && depSet.has(i.id) && !isActive
                  return (
                    <article
                      key={i.id}
                      className={`roadmap-card${isActive ? ' active' : ''}${isDep ? ' dep-highlight' : ''}`}
                    >
                      <button
                        type="button"
                        className="roadmap-card-main"
                        onClick={() => openInitiative(i.id)}
                      >
                        <div className="chip-row">
                          <span className="wf-status">{i.status}</span>
                          <span className="sub">{quarter}</span>
                        </div>
                        <h4>{i.name}</h4>
                        <p className="sub">
                          {i.expectedValue} · {i.riskReduction}
                        </p>
                        <div className="progress" aria-hidden>
                          <div style={{ width: `${i.progressPercent}%` }} />
                        </div>
                        <p className="sub">
                          {i.progressPercent}% · {i.costBand}
                          {deps.length ? ` · ${deps.length} dep(s)` : ''}
                        </p>
                        {(objectiveNames[0] || capabilityNames[0]) && (
                          <p className="sub">
                            {objectiveNames[0] || capabilityNames[0]}
                          </p>
                        )}
                      </button>
                      <div className="roadmap-card-actions">
                        {HORIZONS.filter((h) => h !== i.horizon).map((h) => (
                          <button
                            key={h}
                            type="button"
                            className="btn secondary-button tiny"
                            onClick={() =>
                              callStoreAction('moveInitiativeHorizon', {
                                initiativeId: i.id,
                                horizon: h,
                              })
                            }
                          >
                            Move to {h}
                          </button>
                        ))}
                        <label className="field tiny-field">
                          <span>Quarter</span>
                          <select
                            value={quarter}
                            onChange={(e) =>
                              callStoreAction('changeInitiativeQuarter', {
                                initiativeId: i.id,
                                quarter: e.target.value,
                              })
                            }
                          >
                            {QUARTERS.map((q) => (
                              <option key={q} value={q}>
                                {q}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </article>
                  )
                })}
                {!col.items.length && <p className="sub empty-col">No initiatives</p>}
              </div>
            </div>
          ))}
        </div>

        {active && (
          <aside className="itemcard roadmap-detail">
            <div className="kicker">Initiative detail</div>
            <h3>{active.i.name}</h3>
            <p>{active.i.description}</p>
            <div className="drawer-metrics">
              <div>
                <span>Horizon</span>
                <strong>{active.i.horizon}</strong>
              </div>
              <div>
                <span>Quarter</span>
                <strong>{active.quarter}</strong>
              </div>
              <div>
                <span>Progress</span>
                <strong>{active.i.progressPercent}%</strong>
              </div>
              <div>
                <span>Cost</span>
                <strong>{active.i.costBand}</strong>
              </div>
              <div>
                <span>Risk reduction</span>
                <strong>{active.i.riskReduction}</strong>
              </div>
              <div>
                <span>Value</span>
                <strong>{active.i.expectedValue}</strong>
              </div>
            </div>
            <h4 className="drawer-section-title">Dependencies</h4>
            <div className="chip-row">
              {active.deps.length === 0 && <span className="sub">None recorded</span>}
              {active.deps.map((id) => {
                const dep = repo.getInitiative(id)
                return (
                  <button
                    key={id}
                    type="button"
                    className="link-chip"
                    onClick={() => openInitiative(id)}
                  >
                    {dep?.name || id}
                  </button>
                )
              })}
            </div>
            <h4 className="drawer-section-title">From recommendations</h4>
            <div className="chip-row">
              {active.i.recommendationIds.map((id) => {
                const r = repo.getRecommendation(id)
                return r ? (
                  <button
                    key={id}
                    type="button"
                    className="link-chip"
                    onClick={() => selectEntity({ id, type: 'recommendation' })}
                  >
                    {r.name}
                  </button>
                ) : null
              })}
            </div>
            <div className="toolbar" style={{ marginTop: 12 }}>
              <button
                type="button"
                className="btn primary primary-button"
                onClick={() => openExplorer(active.i.id)}
              >
                Open in explorer
              </button>
              <button
                type="button"
                className="btn secondary-button"
                onClick={() => selectEntity({ id: active.i.id, type: 'initiative' })}
              >
                Open drawer
              </button>
            </div>
          </aside>
        )}
      </div>
    </section>
  )
}
