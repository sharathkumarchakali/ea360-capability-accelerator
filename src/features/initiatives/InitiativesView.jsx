import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { getTenantConfig, usePrototypeStore } from '../../state/prototypeStore'
import {
  DELIVERY_STATUSES,
  HORIZONS,
  PORTFOLIO_IMPACTS,
  PRIORITIES,
  QUAD_COLORS,
  READINESS_LEVELS,
  RISK_LEVELS,
  STATUS_COLORS,
  computePortfolioMetrics,
  conflictInsight,
  criticalDependencyRows,
  emptyInitFilters,
  enrichInitiative,
  filterPortfolioInitiatives,
  matrixSample,
  overlapInsight,
  readinessMix,
  readinessTone,
  riskTone,
  statusMix,
  statusTone,
  transformationSignal,
} from './portfolioModel'

function StatusTag({ children, tone }) {
  return <span className={`status-tag tone-${tone || 'muted'}`}>{children}</span>
}

export default function InitiativesView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const [filters, setFilters] = useState(emptyInitFilters())
  const [sort, setSort] = useState({ key: 'priority', dir: 'desc' })
  const [showAllMatrix, setShowAllMatrix] = useState(false)

  const packInits = repo.listInitiatives()
  const caps = repo.listCapabilities()
  const objectives = repo.listObjectives()
  const orgName = config.shortName || config.displayName || tenantCode || 'Organisation'

  const enriched = useMemo(
    () => packInits.map((i) => enrichInitiative(i, { capabilities: caps, objectives })),
    [packInits, caps, objectives],
  )

  const metrics = useMemo(() => computePortfolioMetrics(enriched), [enriched])
  const statuses = useMemo(() => statusMix(enriched), [enriched])
  const readiness = useMemo(() => readinessMix(enriched), [enriched])
  const signal = useMemo(() => transformationSignal(enriched), [enriched])
  const deps = useMemo(() => criticalDependencyRows(enriched), [enriched])
  const conflict = useMemo(() => conflictInsight(enriched), [enriched])
  const overlap = useMemo(() => overlapInsight(enriched), [enriched])

  const filtered = useMemo(
    () => filterPortfolioInitiatives(enriched, filters),
    [enriched, filters],
  )

  const sorted = useMemo(() => {
    const list = [...filtered]
    const statusOrder = Object.fromEntries(DELIVERY_STATUSES.map((k, i) => [k, i]))
    const readyOrder = Object.fromEntries(READINESS_LEVELS.map((k, i) => [k, i]))
    const priOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
    const riskOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
    list.sort((a, b) => {
      let ka
      let kb
      if (sort.key === 'initiative') {
        ka = a.init.name
        kb = b.init.name
      } else if (sort.key === 'priority') {
        ka = priOrder[a.strategicPriority] || 0
        kb = priOrder[b.strategicPriority] || 0
      } else if (sort.key === 'status') {
        ka = statusOrder[a.deliveryStatus] ?? 0
        kb = statusOrder[b.deliveryStatus] ?? 0
      } else if (sort.key === 'readiness') {
        ka = readyOrder[a.architectureReadiness] ?? 0
        kb = readyOrder[b.architectureReadiness] ?? 0
      } else if (sort.key === 'risk') {
        ka = riskOrder[a.architectureRisk] || 0
        kb = riskOrder[b.architectureRisk] || 0
      } else if (sort.key === 'progress') {
        ka = a.progressPercent
        kb = b.progressPercent
      } else {
        ka = a.init.name
        kb = b.init.name
      }
      if (ka === kb) return a.init.name.localeCompare(b.init.name)
      const cmp = ka > kb ? 1 : -1
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [filtered, sort])

  const matrixRows = useMemo(
    () => (showAllMatrix ? filtered : matrixSample(filtered, 12)),
    [filtered, showAllMatrix],
  )

  const statusChart = useMemo(() => {
    const data = statuses.filter((s) => s.count > 0)
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'middle',
        textStyle: { color: '#55717a', fontSize: 12 },
      },
      series: [
        {
          type: 'pie',
          radius: ['46%', '70%'],
          center: ['36%', '50%'],
          data: data.map((d) => ({
            name: d.key,
            value: d.count,
            itemStyle: { color: STATUS_COLORS[d.key] },
          })),
        },
      ],
    }
  }, [statuses])

  const matrixChart = useMemo(() => {
    const data = matrixRows.map((r) => ({
      name: r.init.name,
      value: [r.riskScore, r.importanceScore, r.init.id],
      itemStyle: { color: QUAD_COLORS[r.matrixQuadrant] },
    }))
    return {
      grid: { left: 52, right: 16, top: 28, bottom: 44 },
      tooltip: {
        formatter: (p) => {
          const row = matrixRows.find((r) => r.init.id === p.data.value[2])
          if (!row) return p.name
          return [
            `<strong>${row.init.name}</strong>`,
            row.matrixQuadrant,
            `Strategic importance: ${row.strategicPriority}`,
            `Architecture risk: ${row.architectureRisk}`,
          ].join('<br/>')
        },
      },
      xAxis: {
        name: 'Architecture risk',
        nameLocation: 'middle',
        nameGap: 28,
        min: 0.5,
        max: 4.5,
        interval: 1,
        axisLabel: {
          formatter: (v) => ({ 1: 'Low', 2: 'Med', 3: 'High', 4: 'Crit' }[v] || ''),
        },
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } },
      },
      yAxis: {
        name: 'Strategic importance',
        nameLocation: 'middle',
        nameGap: 36,
        min: 0.5,
        max: 4.5,
        interval: 1,
        axisLabel: {
          formatter: (v) => ({ 1: 'Low', 2: 'Med', 3: 'High', 4: 'Crit' }[v] || ''),
        },
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } },
      },
      series: [
        {
          type: 'scatter',
          symbolSize: 16,
          data,
          label: {
            show: true,
            formatter: (p) => {
              const n = p.name || ''
              return n.length > 14 ? `${n.slice(0, 12)}…` : n
            },
            position: 'top',
            fontSize: 10,
            color: '#55717a',
          },
          markArea: {
            silent: true,
            data: [
              [
                {
                  name: 'Govern Closely',
                  xAxis: 2.5,
                  yAxis: 2.5,
                  itemStyle: { color: 'rgba(180,35,24,0.07)' },
                  label: { show: true, position: 'insideTopRight', fontSize: 11, color: '#55717a' },
                },
                { xAxis: 4.5, yAxis: 4.5 },
              ],
              [
                {
                  name: 'Accelerate',
                  xAxis: 0.5,
                  yAxis: 2.5,
                  itemStyle: { color: 'rgba(30,140,170,0.07)' },
                  label: { show: true, position: 'insideTopLeft', fontSize: 11, color: '#55717a' },
                },
                { xAxis: 2.5, yAxis: 4.5 },
              ],
              [
                {
                  name: 'Simplify',
                  xAxis: 2.5,
                  yAxis: 0.5,
                  itemStyle: { color: 'rgba(196,123,44,0.07)' },
                  label: {
                    show: true,
                    position: 'insideBottomRight',
                    fontSize: 11,
                    color: '#55717a',
                  },
                },
                { xAxis: 4.5, yAxis: 2.5 },
              ],
              [
                {
                  name: 'Monitor',
                  xAxis: 0.5,
                  yAxis: 0.5,
                  itemStyle: { color: 'rgba(107,114,128,0.06)' },
                  label: {
                    show: true,
                    position: 'insideBottomLeft',
                    fontSize: 11,
                    color: '#55717a',
                  },
                },
                { xAxis: 2.5, yAxis: 2.5 },
              ],
            ],
          },
        },
      ],
    }
  }, [matrixRows])

  const readyMax = Math.max(1, ...readiness.map((x) => x.count))

  const ownerOptions = useMemo(() => {
    const map = new Map()
    for (const r of enriched) {
      const id = r.init.initiativeOwnerId || r.init.ownerId
      if (id) map.set(id, r.ownerLabel)
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [enriched])

  const capabilityOptions = useMemo(() => {
    const ids = new Set(packInits.flatMap((i) => i.capabilityIds || []))
    return caps.filter((c) => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [packInits, caps])

  function patchFilters(partial) {
    setFilters((prev) => ({ ...prev, ...partial }))
  }

  function clearFilters() {
    setFilters(emptyInitFilters())
  }

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }

  function openInit(id) {
    selectEntity({ id, type: 'initiative' })
  }

  function applyMetricFilter(kind) {
    if (kind === 'active') {
      setFilters({
        ...emptyInitFilters(),
        idSet: enriched.filter((r) => r.isActive).map((r) => r.init.id),
      })
      return
    }
    if (kind === 'aligned') {
      setFilters({
        ...emptyInitFilters(),
        idSet: enriched.filter((r) => r.isArchitectureAligned).map((r) => r.init.id),
      })
      return
    }
    if (kind === 'atRisk') {
      setFilters({
        ...emptyInitFilters(),
        risk: 'elevated',
        idSet: enriched.filter((r) => r.isAtRisk).map((r) => r.init.id),
      })
      return
    }
    if (kind === 'decisions') {
      setFilters({ ...emptyInitFilters(), decisions: 'Outstanding' })
      return
    }
    if (kind === 'dependencies') {
      setFilters({
        ...emptyInitFilters(),
        idSet: enriched.filter((r) => r.hasCriticalDependency).map((r) => r.init.id),
      })
      return
    }
    if (kind === 'value') {
      setFilters({ ...emptyInitFilters(), valueMeasures: 'Defined' })
    }
  }

  function reviewAtRisk() {
    applyMetricFilter('atRisk')
  }

  function reviewDecisions() {
    applyMetricFilter('decisions')
  }

  function viewDependencies() {
    applyMetricFilter('dependencies')
  }

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.status) ||
    Boolean(filters.readiness) ||
    Boolean(filters.priority) ||
    Boolean(filters.risk) ||
    Boolean(filters.horizon) ||
    Boolean(filters.ownerId) ||
    Boolean(filters.capabilityId) ||
    Boolean(filters.portfolioImpact) ||
    Boolean(filters.decisions) ||
    Boolean(filters.valueMeasures) ||
    (filters.idSet && filters.idSet.length > 0)

  return (
    <section className="view active app-portfolio-view initiative-portfolio-view">
      <div className="module">
        <div className="module-header app-portfolio-header">
          <div>
            <div className="kicker">Transform · {orgName}</div>
            <h1 className="page-title">Initiatives</h1>
            <p>
              Understand how transformation programmes are changing the enterprise — what they
              affect, what they depend on and whether they align with the target architecture.
            </p>
          </div>
          <div className="synthetic-pill" title="Illustrative seed data for demonstration">
            SYNTHETIC DEMO DATA
          </div>
        </div>

        <div className="app-metric-strip" role="group" aria-label="Initiative summary metrics">
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('active')}>
            <span>Active Initiatives</span>
            <strong>{metrics.active}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('aligned')}>
            <span>Architecture-Aligned</span>
            <strong>{metrics.architectureAligned}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('atRisk')}>
            <span>At Risk</span>
            <strong>{metrics.atRisk}</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('decisions')}
          >
            <span>Decisions Required</span>
            <strong>{metrics.decisionsRequired}</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('dependencies')}
          >
            <span>Critical Dependencies</span>
            <strong>{metrics.criticalDependencies}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('value')}>
            <span>Value Measures Defined</span>
            <strong>{metrics.valueMeasuresDefinedPct}%</strong>
          </button>
        </div>

        <div className="portfolio-signal">
          <div>
            <div className="kicker">Transformation Signal</div>
            <h2>{signal.headline}</h2>
            <p>{signal.support}</p>
          </div>
          <div className="portfolio-signal-actions">
            <button type="button" className="btn primary primary-button" onClick={reviewAtRisk}>
              Review At-Risk Initiatives
            </button>
            <button type="button" className="btn secondary-button" onClick={reviewDecisions}>
              Review Architecture Decisions
            </button>
            <button type="button" className="btn secondary-button" onClick={viewDependencies}>
              View Dependencies
            </button>
          </div>
        </div>

        <div className="app-health-layout">
          <div className="app-health-card">
            <div className="app-health-card-head">
              <h2>Initiative status</h2>
              <p>Delivery programme status — distinct from architecture readiness.</p>
            </div>
            <ReactECharts option={statusChart} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
            <div className="decision-legend">
              {statuses.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`decision-leg${filters.status === m.key ? ' active' : ''}`}
                  onClick={() => patchFilters({ status: filters.status === m.key ? '' : m.key })}
                >
                  <i style={{ background: m.color }} />
                  {m.key} · {m.count}
                </button>
              ))}
            </div>
          </div>

          <div className="app-health-card app-matrix-card">
            <div className="app-health-card-head">
              <div>
                <h2>Strategic value vs architecture risk</h2>
                <p>Prioritise where importance and architecture risk concentrate.</p>
              </div>
              {filtered.length > 12 && (
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setShowAllMatrix((v) => !v)}
                >
                  {showAllMatrix ? 'Show sample' : 'View all'}
                </button>
              )}
            </div>
            <ReactECharts
              option={matrixChart}
              style={{ height: 320 }}
              opts={{ renderer: 'svg' }}
              onEvents={{
                click: (params) => {
                  const id = params?.data?.value?.[2]
                  if (id) openInit(id)
                },
              }}
            />
          </div>

          <div className="app-health-card">
            <div className="app-health-card-head">
              <h2>Architecture readiness</h2>
              <p>Which initiatives are architecturally ready to proceed?</p>
            </div>
            <div className="lifecycle-bars">
              {readiness.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  className={`lifecycle-row${filters.readiness === row.key ? ' active' : ''}`}
                  onClick={() =>
                    patchFilters({ readiness: filters.readiness === row.key ? '' : row.key })
                  }
                >
                  <span className="lifecycle-label">{row.key}</span>
                  <span className="lifecycle-track" aria-hidden="true">
                    <span
                      style={{
                        width: `${(row.count / readyMax) * 100}%`,
                        background: row.color,
                      }}
                    />
                  </span>
                  <strong>{row.count}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>

        {(deps.length > 0 || conflict || overlap) && (
          <div className="initiative-intel-grid">
            {deps.length > 0 && (
              <div className="portfolio-insight-card">
                <h3>Critical dependencies</h3>
                <ul className="drawer-list">
                  {deps.slice(0, 4).map((d) => (
                    <li key={`${d.fromId}-${d.toId}`}>
                      <button type="button" className="text-link" onClick={() => openInit(d.fromId)}>
                        {d.fromName}
                      </button>
                      <span className="sub"> depends on </span>
                      <button type="button" className="text-link" onClick={() => openInit(d.toId)}>
                        {d.toName}
                      </button>
                      <div className="sub">{d.reason}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {conflict && (
              <div className="portfolio-insight-card">
                <h3>Transformation conflict</h3>
                <p>{conflict.headline}</p>
                <p className="sub">{conflict.note}</p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    setFilters({ ...emptyInitFilters(), idSet: conflict.ids })
                  }
                >
                  Review conflicting initiatives
                </button>
              </div>
            )}
            {overlap && (
              <div className="portfolio-insight-card">
                <h3>Potential overlap</h3>
                <p>{overlap.headline}</p>
                <p className="sub">{overlap.note}</p>
                <StatusTag tone="warn">Architecture review required</StatusTag>
                <div>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => setFilters({ ...emptyInitFilters(), idSet: overlap.ids })}
                  >
                    Review overlapping programmes
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="intel-toolbar app-filters">
          <label className="field grow">
            <span>Search</span>
            <input
              type="search"
              value={filters.search}
              onChange={(e) => patchFilters({ search: e.target.value })}
              placeholder="Search initiatives, owners, capabilities or affected assets"
              aria-label="Search initiatives, owners, capabilities or affected assets"
            />
          </label>
          <label className="field">
            <span>Initiative status</span>
            <select
              value={filters.status}
              onChange={(e) => patchFilters({ status: e.target.value })}
            >
              <option value="">All</option>
              {DELIVERY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Architecture readiness</span>
            <select
              value={filters.readiness}
              onChange={(e) => patchFilters({ readiness: e.target.value })}
            >
              <option value="">All</option>
              {READINESS_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Strategic priority</span>
            <select
              value={filters.priority}
              onChange={(e) => patchFilters({ priority: e.target.value })}
            >
              <option value="">All</option>
              {PRIORITIES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Architecture risk</span>
            <select value={filters.risk} onChange={(e) => patchFilters({ risk: e.target.value })}>
              <option value="">All</option>
              {RISK_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Horizon</span>
            <select
              value={filters.horizon}
              onChange={(e) => patchFilters({ horizon: e.target.value })}
            >
              <option value="">All</option>
              {HORIZONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Owner</span>
            <select
              value={filters.ownerId}
              onChange={(e) => patchFilters({ ownerId: e.target.value })}
            >
              <option value="">All</option>
              {ownerOptions.map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Business capability</span>
            <select
              value={filters.capabilityId}
              onChange={(e) => patchFilters({ capabilityId: e.target.value })}
            >
              <option value="">All</option>
              {capabilityOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Portfolio impact</span>
            <select
              value={filters.portfolioImpact}
              onChange={(e) => patchFilters({ portfolioImpact: e.target.value })}
            >
              <option value="">All</option>
              {PORTFOLIO_IMPACTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Decisions</span>
            <select
              value={filters.decisions}
              onChange={(e) => patchFilters({ decisions: e.target.value })}
            >
              <option value="">All</option>
              <option value="Outstanding">Outstanding</option>
              <option value="Complete">Complete</option>
            </select>
          </label>
          <label className="field">
            <span>Value measures</span>
            <select
              value={filters.valueMeasures}
              onChange={(e) => patchFilters({ valueMeasures: e.target.value })}
            >
              <option value="">All</option>
              <option value="Defined">Defined</option>
              <option value="Missing">Missing</option>
            </select>
          </label>
        </div>

        <div className="app-register-meta">
          <span>
            {sorted.length} of {enriched.length} initiatives
          </span>
          {hasFilters ? (
            <button type="button" className="text-link" onClick={clearFilters}>
              Clear filters
            </button>
          ) : null}
        </div>

        <div className="table-wrap portfolio-table-desktop app-register">
          <table className="data">
            <thead>
              <tr>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort('initiative')}>
                    Initiative
                  </button>
                </th>
                <th>Strategic outcome</th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort('status')}>
                    Status
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort('readiness')}>
                    Architecture readiness
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort('risk')}>
                    Risk
                  </button>
                </th>
                <th>Owner</th>
                <th>Horizon</th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort('progress')}>
                    Progress
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.init.id}
                  className="clickable-row"
                  onClick={() => openInit(row.init.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openInit(row.init.id)
                    }
                  }}
                  tabIndex={0}
                  role="link"
                >
                  <td>
                    <strong>{row.init.name}</strong>
                    <div className="sub">{row.strategicPriority} priority</div>
                  </td>
                  <td>{row.strategicOutcome}</td>
                  <td>
                    <StatusTag tone={statusTone(row.deliveryStatus)}>
                      {row.deliveryStatus}
                    </StatusTag>
                  </td>
                  <td>
                    <StatusTag tone={readinessTone(row.architectureReadiness)}>
                      {row.architectureReadiness}
                    </StatusTag>
                  </td>
                  <td>
                    <StatusTag tone={riskTone(row.architectureRisk)}>
                      {row.architectureRisk}
                    </StatusTag>
                  </td>
                  <td>{row.ownerLabel}</td>
                  <td>{row.horizonLabel}</td>
                  <td>
                    <div className="progress-cell">
                      <span className="progress-track" aria-hidden="true">
                        <span style={{ width: `${row.progressPercent}%` }} />
                      </span>
                      <strong>{row.progressPercent}%</strong>
                    </div>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8}>No initiatives match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="portfolio-mobile app-register-mobile">
          {sorted.map((row) => (
            <button
              key={row.init.id}
              type="button"
              className="app-mobile-card"
              onClick={() => openInit(row.init.id)}
            >
              <strong>{row.init.name}</strong>
              <span>
                {row.deliveryStatus} · {row.architectureReadiness}
              </span>
              <span>
                Risk {row.architectureRisk} · {row.progressPercent}%
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
