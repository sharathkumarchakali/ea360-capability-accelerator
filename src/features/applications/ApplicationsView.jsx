import { useMemo, useState } from 'react'
import ReactECharts from '../../components/charts/ThemedChart'
import { getTenantConfig, usePrototypeStore } from '../../state/prototypeStore'
import {
  DECISION_COLORS,
  PORTFOLIO_DECISIONS,
  PORTFOLIO_LIFECYCLES,
  computePortfolioMetrics,
  decisionMix,
  emptyAppFilters,
  enrichApplication,
  filterPortfolioApps,
  formatCriticality,
  lifecycleMix,
  matrixSample,
  portfolioSignal,
} from './portfolioModel'

function StatusTag({ children, tone }) {
  return <span className={`status-tag tone-${tone || 'muted'}`}>{children}</span>
}

function decisionTone(d) {
  if (d === 'Invest') return 'accent'
  if (d === 'Modernise') return 'warn'
  if (d === 'Consolidate') return 'info'
  if (d === 'Retire') return 'bad'
  return 'muted'
}

function riskTone(r) {
  if (r === 'Critical' || r === 'High') return 'bad'
  if (r === 'Medium') return 'warn'
  return 'good'
}

function critTone(c) {
  if (c === 'critical') return 'bad'
  if (c === 'high') return 'warn'
  return 'muted'
}

export default function ApplicationsView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const [filters, setFilters] = useState(emptyAppFilters)
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [showAllMatrix, setShowAllMatrix] = useState(false)

  const packApps = repo.listApplications()
  const caps = repo.listCapabilities()
  const initiatives = repo.listInitiatives()
  const orgName = config.shortName || config.displayName || tenantCode || 'Organisation'

  const enriched = useMemo(
    () =>
      packApps.map((app) =>
        enrichApplication(app, { capabilities: caps, initiatives }),
      ),
    [packApps, caps, initiatives],
  )

  const metrics = useMemo(() => computePortfolioMetrics(enriched), [enriched])
  const mix = useMemo(() => decisionMix(enriched), [enriched])
  const lifeMix = useMemo(() => lifecycleMix(enriched), [enriched])
  const signal = useMemo(() => portfolioSignal(enriched), [enriched])

  const filtered = useMemo(() => filterPortfolioApps(enriched, filters), [enriched, filters])

  const sorted = useMemo(() => {
    const list = [...filtered]
    const critOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const riskOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
    const lifeOrder = Object.fromEntries(PORTFOLIO_LIFECYCLES.map((k, i) => [k, i]))
    list.sort((a, b) => {
      let ka
      let kb
      if (sort.key === 'name') {
        ka = a.app.name
        kb = b.app.name
      } else if (sort.key === 'criticality') {
        ka = critOrder[a.app.criticality] || 0
        kb = critOrder[b.app.criticality] || 0
      } else if (sort.key === 'risk') {
        ka = riskOrder[a.architectureRisk] || 0
        kb = riskOrder[b.architectureRisk] || 0
      } else if (sort.key === 'lifecycle') {
        ka = lifeOrder[a.lifecycleStage] ?? 0
        kb = lifeOrder[b.lifecycleStage] ?? 0
      } else {
        ka = a.app.name
        kb = b.app.name
      }
      if (ka === kb) return a.app.name.localeCompare(b.app.name)
      const cmp = ka > kb ? 1 : -1
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [filtered, sort])

  const matrixRows = useMemo(
    () => (showAllMatrix ? filtered : matrixSample(filtered, 15)),
    [filtered, showAllMatrix],
  )

  const decisionChart = useMemo(() => {
    const data = mix.filter((m) => m.count > 0)
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
          radius: ['48%', '72%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: data.map((d) => ({
            name: d.key,
            value: d.count,
            itemStyle: { color: d.color },
          })),
        },
      ],
    }
  }, [mix])

  const matrixChart = useMemo(() => {
    const data = matrixRows.map((r) => ({
      name: r.app.name,
      value: [r.riskScore, r.criticalityScore, r.app.id],
      decision: r.portfolioDecision,
      itemStyle: { color: DECISION_COLORS[r.portfolioDecision] },
    }))
    return {
      grid: { left: 52, right: 16, top: 28, bottom: 44 },
      tooltip: {
        formatter: (p) => {
          const row = matrixRows.find((r) => r.app.id === p.data.value[2])
          if (!row) return p.name
          return [
            `<strong>${row.app.name}</strong>`,
            `${row.portfolioDecision} · ${formatCriticality(row.app.criticality)}`,
            `Architecture risk: ${row.architectureRisk}`,
            row.matrixQuadrant,
          ].join('<br/>')
        },
      },
      xAxis: {
        name: 'Architecture / technology risk',
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
        name: 'Business criticality',
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
                  name: 'Protect',
                  xAxis: 0.5,
                  yAxis: 2.5,
                  itemStyle: { color: 'rgba(15, 138, 106, 0.06)' },
                  label: { show: true, position: 'insideTopLeft', color: '#0f8a6a', fontSize: 11 },
                },
                { xAxis: 2.5, yAxis: 4.5 },
              ],
              [
                {
                  name: 'Prioritise',
                  xAxis: 2.5,
                  yAxis: 2.5,
                  itemStyle: { color: 'rgba(192, 57, 43, 0.06)' },
                  label: { show: true, position: 'insideTopRight', color: '#c0392b', fontSize: 11 },
                },
                { xAxis: 4.5, yAxis: 4.5 },
              ],
              [
                {
                  name: 'Monitor',
                  xAxis: 0.5,
                  yAxis: 0.5,
                  itemStyle: { color: 'rgba(30, 140, 170, 0.05)' },
                  label: { show: true, position: 'insideBottomLeft', color: '#1e8caa', fontSize: 11 },
                },
                { xAxis: 2.5, yAxis: 2.5 },
              ],
              [
                {
                  name: 'Simplify',
                  xAxis: 2.5,
                  yAxis: 0.5,
                  itemStyle: { color: 'rgba(183, 121, 31, 0.06)' },
                  label: {
                    show: true,
                    position: 'insideBottomRight',
                    color: '#b7791f',
                    fontSize: 11,
                  },
                },
                { xAxis: 4.5, yAxis: 2.5 },
              ],
            ],
          },
        },
      ],
    }
  }, [matrixRows])

  const lifeMax = Math.max(1, ...lifeMix.map((x) => x.count))

  function patchFilters(partial) {
    setFilters((prev) => ({ ...prev, ...partial }))
  }

  function clearFilters() {
    setFilters({ ...emptyAppFilters })
  }

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }

  function openApp(id) {
    selectEntity({ id, type: 'application' })
  }

  function applyMetricFilter(kind) {
    if (kind === 'all') {
      clearFilters()
      return
    }
    if (kind === 'critical') {
      setFilters({ ...emptyAppFilters, criticality: 'critical' })
      return
    }
    if (kind === 'highRisk') {
      setFilters({
        ...emptyAppFilters,
        idSet: enriched
          .filter(
            (r) =>
              r.architectureRisk === 'Critical' ||
              r.architectureRisk === 'High' ||
              r.lifecycleRisk ||
              r.securityRisk === 'Critical' ||
              r.securityRisk === 'High',
          )
          .map((r) => r.app.id),
      })
      return
    }
    if (kind === 'modernise') {
      setFilters({ ...emptyAppFilters, portfolioDecision: 'modernise-replace' })
      return
    }
    if (kind === 'ownership') {
      setFilters({ ...emptyAppFilters, ownership: 'unassigned' })
      return
    }
    if (kind === 'lifecycle') {
      setFilters({ ...emptyAppFilters, lifecycle: 'lifecycle-attention' })
    }
  }

  function reviewPriority() {
    setFilters({
      ...emptyAppFilters,
      criticality: 'business-critical',
      idSet: signal.ids,
    })
  }

  function goFindings() {
    setView('findings')
    window.location.hash = 'findings'
  }

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.criticality) ||
    Boolean(filters.portfolioDecision) ||
    Boolean(filters.lifecycle) ||
    Boolean(filters.risk) ||
    Boolean(filters.ownership) ||
    Boolean(filters.capabilityId) ||
    Boolean(filters.transformation) ||
    (filters.idSet && filters.idSet.length > 0)

  const capabilityOptions = useMemo(() => {
    const ids = new Set(packApps.flatMap((a) => a.supportedCapabilityIds))
    return caps.filter((c) => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [packApps, caps])

  return (
    <section className="view active app-portfolio-view">
      <div className="module">
        <div className="module-header app-portfolio-header">
          <div>
            <div className="kicker">Portfolios · {orgName}</div>
            <h1 className="page-title">Applications</h1>
            <p>
              Understand the applications that run the enterprise, the capabilities they support,
              the risks they create and the decisions required.
            </p>
          </div>
          <div className="synthetic-pill" title="Illustrative seed data for demonstration">
            SYNTHETIC DEMO DATA
          </div>
        </div>

        <div className="app-metric-strip" role="group" aria-label="Portfolio summary metrics">
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('all')}>
            <span>Applications</span>
            <strong>{metrics.total}</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('critical')}
          >
            <span>Business Critical</span>
            <strong>{metrics.businessCritical}</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('highRisk')}
          >
            <span>High Risk</span>
            <strong>{metrics.highRisk}</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('modernise')}
          >
            <span>Modernise / Replace</span>
            <strong>{metrics.moderniseReplace}</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('ownership')}
          >
            <span>Ownership Coverage</span>
            <strong>{metrics.ownershipCoverage}%</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('lifecycle')}
          >
            <span>Lifecycle Risk</span>
            <strong>{metrics.lifecycleRisk}</strong>
          </button>
        </div>

        <div className="app-health-layout">
          <div className="app-health-card">
            <div className="app-health-card-head">
              <h2>Application portfolio decision mix</h2>
              <p>Where the estate requires investment, change or retirement.</p>
            </div>
            <ReactECharts option={decisionChart} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
            <div className="decision-legend">
              {mix.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`decision-leg${filters.portfolioDecision === m.key ? ' active' : ''}`}
                  onClick={() =>
                    patchFilters({
                      portfolioDecision: filters.portfolioDecision === m.key ? '' : m.key,
                    })
                  }
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
                <h2>Business criticality vs architecture risk</h2>
                <p>Prioritise change where value and risk concentrate.</p>
              </div>
              {filtered.length > 15 && (
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
                  if (id) openApp(id)
                },
              }}
            />
          </div>

          <div className="app-health-card">
            <div className="app-health-card-head">
              <h2>Lifecycle exposure</h2>
              <p>How much of the application estate needs lifecycle attention.</p>
            </div>
            <div className="lifecycle-bars">
              {lifeMix.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  className={`lifecycle-row${filters.lifecycle === row.key ? ' active' : ''}`}
                  onClick={() =>
                    patchFilters({ lifecycle: filters.lifecycle === row.key ? '' : row.key })
                  }
                >
                  <span className="lifecycle-label">{row.key}</span>
                  <span className="lifecycle-track" aria-hidden="true">
                    <span style={{ width: `${(row.count / lifeMax) * 100}%` }} />
                  </span>
                  <strong>{row.count}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="portfolio-signal">
          <div>
            <div className="kicker">Portfolio signal</div>
            <h2>
              {signal.count} business-critical applications carry high architecture or lifecycle
              risk.
            </h2>
            <p>
              {signal.withInit} are associated with active transformation initiatives, while{' '}
              {signal.eos} depend on technologies approaching retirement.
            </p>
          </div>
          <div className="portfolio-signal-actions">
            <button type="button" className="btn primary primary-button" onClick={reviewPriority}>
              Review priority applications
            </button>
            <button type="button" className="btn secondary-button" onClick={goFindings}>
              View related findings
            </button>
          </div>
        </div>

        <div className="intel-toolbar app-filters">
          <label className="field grow">
            <span>Search</span>
            <input
              type="search"
              value={filters.search}
              onChange={(e) => patchFilters({ search: e.target.value })}
              placeholder="Search applications, owners or capabilities"
              aria-label="Search applications, owners or capabilities"
            />
          </label>
          <label className="field">
            <span>Business criticality</span>
            <select
              value={filters.criticality}
              onChange={(e) => patchFilters({ criticality: e.target.value })}
            >
              <option value="">All</option>
              {['critical', 'high', 'medium', 'low'].map((c) => (
                <option key={c} value={c}>
                  {formatCriticality(c)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Portfolio decision</span>
            <select
              value={filters.portfolioDecision}
              onChange={(e) => patchFilters({ portfolioDecision: e.target.value })}
            >
              <option value="">All</option>
              {PORTFOLIO_DECISIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Lifecycle</span>
            <select
              value={filters.lifecycle}
              onChange={(e) => patchFilters({ lifecycle: e.target.value })}
            >
              <option value="">All</option>
              {PORTFOLIO_LIFECYCLES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Risk</span>
            <select value={filters.risk} onChange={(e) => patchFilters({ risk: e.target.value })}>
              <option value="">All</option>
              {['Critical', 'High', 'Medium', 'Low'].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Ownership</span>
            <select
              value={filters.ownership}
              onChange={(e) => patchFilters({ ownership: e.target.value })}
            >
              <option value="">All</option>
              <option value="assigned">Assigned</option>
              <option value="unassigned">Unassigned</option>
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
            <span>Transformation</span>
            <select
              value={filters.transformation}
              onChange={(e) => patchFilters({ transformation: e.target.value })}
            >
              <option value="">All</option>
              <option value="in">In transformation</option>
              <option value="none">No active transformation</option>
            </select>
          </label>
        </div>

        <div className="app-register-meta">
          <span>
            {sorted.length} of {enriched.length} applications
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
                  <button type="button" className="th-sort" onClick={() => toggleSort('name')}>
                    Application
                  </button>
                </th>
                <th>Business capability</th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort('criticality')}>
                    Criticality
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort('lifecycle')}>
                    Lifecycle
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort('risk')}>
                    Risk
                  </button>
                </th>
                <th>Portfolio decision</th>
                <th>Owner</th>
                <th>Transformation</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.app.id}
                  className="clickable-row"
                  onClick={() => openApp(row.app.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openApp(row.app.id)
                    }
                  }}
                  tabIndex={0}
                  role="link"
                >
                  <td>
                    <strong>{row.app.name}</strong>
                    <div className="sub">{row.app.vendorProduct}</div>
                  </td>
                  <td>{row.primaryCapability}</td>
                  <td>
                    <StatusTag tone={critTone(row.app.criticality)}>
                      {formatCriticality(row.app.criticality)}
                    </StatusTag>
                  </td>
                  <td>{row.lifecycleStage}</td>
                  <td>
                    <StatusTag tone={riskTone(row.architectureRisk)}>
                      {row.architectureRisk}
                    </StatusTag>
                  </td>
                  <td>
                    <StatusTag tone={decisionTone(row.portfolioDecision)}>
                      {row.portfolioDecision}
                    </StatusTag>
                  </td>
                  <td>
                    {row.ownershipGap ? (
                      <StatusTag tone="bad">Ownership gap</StatusTag>
                    ) : (
                      row.businessOwnerLabel
                    )}
                  </td>
                  <td>{row.inTransformation ? 'In transformation' : '—'}</td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8}>No applications match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="portfolio-mobile app-register-mobile">
          {sorted.map((row) => (
            <button
              key={row.app.id}
              type="button"
              className="app-mobile-card"
              onClick={() => openApp(row.app.id)}
            >
              <strong>{row.app.name}</strong>
              <span>
                {row.primaryCapability} · {formatCriticality(row.app.criticality)}
              </span>
              <span>
                {row.portfolioDecision} · Risk {row.architectureRisk}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

