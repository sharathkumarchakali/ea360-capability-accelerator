import { useMemo, useState } from 'react'
import ReactECharts from '../../components/charts/ThemedChart'
import { getTenantConfig, usePrototypeStore } from '../../state/prototypeStore'
import {
  computePortfolioMetrics,
  DECISION_COLORS,
  deploymentMix,
  emptyTechFilters,
  enrichTechnology,
  filterPortfolioTechnologies,
  lifecycleMix,
  matrixSample,
  portfolioSignal,
  PORTFOLIO_LIFECYCLES,
} from './portfolioModel'

function StatusTag({ children, tone }) {
  return <span className={`status-tag tone-${tone || 'muted'}`}>{children}</span>
}

function riskTone(r) {
  if (r === 'Critical' || r === 'High') return 'bad'
  if (r === 'Medium') return 'warn'
  return 'good'
}

function lifecycleTone(label) {
  if (label === 'Strategic' || label === 'Approved') return 'good'
  if (label === 'Tolerated') return 'warn'
  return 'bad'
}

function standardTone(s) {
  if (s === 'Standard') return 'good'
  if (s === 'Under Review') return 'warn'
  if (s === 'Exception') return 'bad'
  return 'muted'
}

const LIFECYCLE_COLORS = {
  Strategic: '#1E8CAA',
  Approved: '#0D6B7A',
  Tolerated: '#52CFE4',
  Deprecated: '#C47B2C',
  Retire: '#B42318',
  'End-of-Support Risk': '#93370D',
}

const DEPLOYMENT_COLORS = {
  'On-Premise': '#6B7280',
  'Private Cloud': '#0D6B7A',
  'Public Cloud': '#1E8CAA',
  Hybrid: '#52CFE4',
  SaaS: '#C47B2C',
  'Not classified': '#D1D5DB',
}

const QUAD_COLORS = {
  Protect: '#1E8CAA',
  Prioritise: '#B42318',
  Simplify: '#C47B2C',
  Monitor: '#6B7280',
}

export default function TechnologyInfrastructureView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const [filters, setFilters] = useState(emptyTechFilters)
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [showAllMatrix, setShowAllMatrix] = useState(false)

  const packTech = repo.listTechnologies()
  const applications = repo.listApplications()
  const integrations = repo.listIntegrations()
  const initiatives = repo.listInitiatives()
  const orgName = config.shortName || config.displayName || tenantCode || 'Organisation'

  const enriched = useMemo(
    () => packTech.map((t) => enrichTechnology(t, { applications, integrations, initiatives })),
    [packTech, applications, integrations, initiatives],
  )

  const metrics = useMemo(() => computePortfolioMetrics(enriched), [enriched])
  const lifecycles = useMemo(() => lifecycleMix(enriched), [enriched])
  const deployments = useMemo(() => deploymentMix(enriched), [enriched])
  const signal = useMemo(() => portfolioSignal(enriched), [enriched])

  const filtered = useMemo(
    () => filterPortfolioTechnologies(enriched, filters),
    [enriched, filters],
  )

  const sorted = useMemo(() => {
    const list = [...filtered]
    const riskOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
    const lifeOrder = Object.fromEntries(PORTFOLIO_LIFECYCLES.map((k, i) => [k, i]))
    list.sort((a, b) => {
      let ka
      let kb
      if (sort.key === 'name') {
        ka = a.tech.name
        kb = b.tech.name
      } else if (sort.key === 'lifecycle') {
        ka = lifeOrder[a.lifecycleLabel] ?? 0
        kb = lifeOrder[b.lifecycleLabel] ?? 0
      } else if (sort.key === 'risk') {
        ka = riskOrder[a.architectureRisk] || 0
        kb = riskOrder[b.architectureRisk] || 0
      } else if (sort.key === 'criticalApps') {
        ka = a.criticalApplicationCount
        kb = b.criticalApplicationCount
      } else if (sort.key === 'vendor') {
        ka = a.vendorLabel
        kb = b.vendorLabel
      } else {
        ka = a.tech.name
        kb = b.tech.name
      }
      if (ka === kb) return a.tech.name.localeCompare(b.tech.name)
      const cmp = ka > kb ? 1 : -1
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [filtered, sort])

  const matrixRows = useMemo(
    () => (showAllMatrix ? filtered : matrixSample(filtered, 14)),
    [filtered, showAllMatrix],
  )

  const lifecycleChart = useMemo(() => {
    const data = lifecycles.filter((d) => d.count > 0)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 120, right: 24, top: 12, bottom: 24 },
      xAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } },
      },
      yAxis: {
        type: 'category',
        data: data.map((d) => d.key),
        axisLabel: { color: '#55717a', fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          data: data.map((d) => ({
            value: d.count,
            itemStyle: { color: LIFECYCLE_COLORS[d.key] || '#6B7280' },
          })),
          barWidth: 18,
          label: { show: true, position: 'right', color: '#55717a' },
        },
      ],
    }
  }, [lifecycles])

  const deploymentChart = useMemo(() => {
    const data = deployments.filter((d) => d.count > 0)
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
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: data.map((d) => ({
            name: d.key,
            value: d.count,
            itemStyle: { color: DEPLOYMENT_COLORS[d.key] || '#6B7280' },
          })),
        },
      ],
    }
  }, [deployments])

  const matrixChart = useMemo(() => {
    const data = matrixRows.map((r) => ({
      name: r.tech.name,
      value: [r.riskScore, r.criticalityScore, r.tech.id],
      itemStyle: { color: DECISION_COLORS[r.portfolioDecision] || QUAD_COLORS[r.matrixQuadrant] },
    }))
    return {
      grid: { left: 52, right: 16, top: 28, bottom: 44 },
      tooltip: {
        formatter: (p) => {
          const row = matrixRows.find((r) => r.tech.id === p.data.value[2])
          if (!row) return p.name
          return [
            `<strong>${row.tech.name}</strong>`,
            `${row.matrixQuadrant} · ${row.architectureRisk} risk`,
            `Critical apps: ${row.criticalApplicationCount}`,
            row.portfolioDecision,
          ].join('<br/>')
        },
      },
      xAxis: {
        name: 'Technology risk',
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
        name: 'Business dependency',
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
                  itemStyle: { color: 'rgba(30,140,170,0.06)' },
                  label: { show: true, position: 'insideTopLeft', color: '#55717a', fontSize: 11 },
                },
                { xAxis: 2.5, yAxis: 4.5 },
              ],
              [
                {
                  name: 'Prioritise',
                  xAxis: 2.5,
                  yAxis: 2.5,
                  itemStyle: { color: 'rgba(180,35,24,0.06)' },
                  label: { show: true, position: 'insideTopRight', color: '#55717a', fontSize: 11 },
                },
                { xAxis: 4.5, yAxis: 4.5 },
              ],
              [
                {
                  name: 'Simplify',
                  xAxis: 2.5,
                  yAxis: 0.5,
                  itemStyle: { color: 'rgba(196,123,44,0.06)' },
                  label: {
                    show: true,
                    position: 'insideBottomRight',
                    color: '#55717a',
                    fontSize: 11,
                  },
                },
                { xAxis: 4.5, yAxis: 2.5 },
              ],
              [
                {
                  name: 'Monitor',
                  xAxis: 0.5,
                  yAxis: 0.5,
                  itemStyle: { color: 'rgba(107,114,128,0.05)' },
                  label: {
                    show: true,
                    position: 'insideBottomLeft',
                    color: '#55717a',
                    fontSize: 11,
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

  function patchFilters(patch) {
    setFilters((f) => ({ ...f, ...patch }))
  }

  function clearFilters() {
    setFilters(emptyTechFilters)
  }

  function openTech(id) {
    selectEntity({ id, type: 'technology' })
  }

  function toggleSort(key) {
    setSort((s) =>
      s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  }

  function applyMetricFilter(kind) {
    if (kind === 'all') {
      clearFilters()
      return
    }
    if (kind === 'lifecycle') {
      setFilters({
        ...emptyTechFilters,
        idSet: enriched
          .filter((r) =>
            ['deprecated', 'retire', 'end-of-support-risk'].includes(r.tech.lifecycle),
          )
          .map((r) => r.tech.id),
      })
      return
    }
    if (kind === 'eos') {
      setFilters({
        ...emptyTechFilters,
        idSet: enriched
          .filter((r) =>
            ['end-of-support-risk', 'retire', 'deprecated'].includes(r.tech.lifecycle),
          )
          .map((r) => r.tech.id),
      })
      return
    }
    if (kind === 'exceptions') {
      setFilters({ ...emptyTechFilters, standardStatus: 'non-standard' })
      return
    }
    if (kind === 'criticalDeps') {
      setFilters({
        ...emptyTechFilters,
        criticalApp: 'yes',
        idSet: enriched.filter((r) => r.criticalApplicationCount >= 2).map((r) => r.tech.id),
      })
    }
  }

  function reviewLifecycleRisk() {
    setFilters({ ...emptyTechFilters, idSet: signal.techIds })
  }

  function viewAffectedApplications() {
    setFilters({ ...emptyTechFilters, criticalApp: 'yes', idSet: signal.techIds })
  }

  function viewRelatedInitiatives() {
    setFilters({ ...emptyTechFilters, idSet: signal.techIds })
  }

  function goFindings() {
    setView('findings')
    window.location.hash = 'findings'
  }

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.category) ||
    Boolean(filters.lifecycle) ||
    Boolean(filters.risk) ||
    Boolean(filters.deployment) ||
    Boolean(filters.standardStatus) ||
    Boolean(filters.vendor) ||
    Boolean(filters.ownership) ||
    Boolean(filters.criticalApp) ||
    Boolean(filters.resilience) ||
    Boolean(filters.portfolioDecision) ||
    (filters.idSet && filters.idSet.length > 0)

  const vendorOptions = useMemo(() => {
    const set = new Set(enriched.map((r) => r.vendorLabel).filter((v) => v && v !== '—'))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [enriched])

  return (
    <section className="view active app-portfolio-view tech-portfolio-view">
      <div className="module">
        <div className="module-header app-portfolio-header">
          <div>
            <div className="kicker">Portfolios · {orgName}</div>
            <h1 className="page-title">Technology & Infrastructure</h1>
            <p>
              Understand the platforms, technologies and infrastructure the enterprise depends on —
              their lifecycle, standards, resilience and transformation risk.
            </p>
          </div>
          <div className="synthetic-pill" title="Illustrative seed data for demonstration">
            SYNTHETIC DEMO DATA
          </div>
        </div>

        <div
          className="app-metric-strip"
          role="group"
          aria-label="Technology portfolio summary metrics"
        >
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('all')}>
            <span>Technology Assets</span>
            <strong>{metrics.total}</strong>
          </button>
          <button type="button" className="app-metric" onClick={clearFilters}>
            <span>Strategic / Approved</span>
            <strong>{metrics.strategicApprovedPct}%</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('lifecycle')}>
            <span>Lifecycle Risk</span>
            <strong>{metrics.lifecycleRisk}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('eos')}>
            <span>End-of-Support</span>
            <strong>{metrics.endOfSupport}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('exceptions')}>
            <span>Standards Exceptions</span>
            <strong>{metrics.standardsExceptions}</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('criticalDeps')}
          >
            <span>Critical Platform Dependencies</span>
            <strong>{metrics.criticalPlatformDependencies}</strong>
          </button>
        </div>

        <div className="portfolio-signal">
          <div>
            <div className="kicker">Technology Signal</div>
            <h2>
              {signal.criticalAppCount} business-critical applications depend on technologies
              approaching end of support or planned retirement.
            </h2>
            <p>
              {signal.withInitiatives > 0
                ? `${signal.withInitiatives} of these technologies are also involved in active transformation programmes, increasing sequencing and migration risk.`
                : 'Review lifecycle plans and dependency maps before committing transformation sequencing.'}
            </p>
          </div>
          <div className="portfolio-signal-actions">
            <button type="button" className="btn primary primary-button" onClick={reviewLifecycleRisk}>
              Review Lifecycle Risk
            </button>
            <button type="button" className="btn secondary-button" onClick={viewAffectedApplications}>
              View Affected Applications
            </button>
            <button type="button" className="btn secondary-button" onClick={viewRelatedInitiatives}>
              View Related Initiatives
            </button>
          </div>
        </div>

        <div className="app-health-layout tech-health-layout">
          <div className="app-health-card">
            <div className="app-health-card-head">
              <h3>Technology Lifecycle Exposure</h3>
            </div>
            <p className="sub int-pattern-note">How much of the estate requires lifecycle attention?</p>
            <ReactECharts
              option={lifecycleChart}
              style={{ height: 260 }}
              onEvents={{
                click: (params) => {
                  const name = params?.name
                  if (name) setFilters({ ...emptyTechFilters, lifecycle: name })
                },
              }}
            />
          </div>

          <div className="app-health-card">
            <div className="app-health-card-head">
              <h3>Business Criticality vs Technology Risk</h3>
              <button
                type="button"
                className="text-link"
                onClick={() => setShowAllMatrix((v) => !v)}
              >
                {showAllMatrix ? 'Show sample' : 'Show all'}
              </button>
            </div>
            <p className="sub int-pattern-note">Click a point to open technology detail.</p>
            <ReactECharts
              option={matrixChart}
              style={{ height: 280 }}
              onEvents={{
                click: (params) => {
                  const id = params?.data?.value?.[2]
                  if (id) openTech(id)
                },
              }}
            />
          </div>

          <div className="app-health-card">
            <div className="app-health-card-head">
              <h3>Deployment Posture</h3>
            </div>
            <p className="sub int-pattern-note">How is the estate distributed across hosting models?</p>
            <ReactECharts
              option={deploymentChart}
              style={{ height: 260 }}
              onEvents={{
                click: (params) => {
                  if (params?.name) {
                    setFilters({ ...emptyTechFilters, deployment: params.name })
                  }
                },
              }}
            />
          </div>
        </div>

        <div className="app-filters int-filters tech-filters">
          <input
            type="search"
            placeholder="Search technologies, platforms, vendors, owners or applications"
            aria-label="Search technologies"
            value={filters.search}
            onChange={(e) => patchFilters({ search: e.target.value })}
          />
          <select
            aria-label="Category"
            value={filters.category}
            onChange={(e) => patchFilters({ category: e.target.value })}
          >
            <option value="">Category</option>
            {['Platform', 'Runtime', 'Database', 'Cloud', 'Middleware', 'Infrastructure', 'Security'].map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ),
            )}
          </select>
          <select
            aria-label="Lifecycle"
            value={filters.lifecycle}
            onChange={(e) => patchFilters({ lifecycle: e.target.value })}
          >
            <option value="">Lifecycle</option>
            {PORTFOLIO_LIFECYCLES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            aria-label="Risk"
            value={filters.risk}
            onChange={(e) => patchFilters({ risk: e.target.value })}
          >
            <option value="">Risk</option>
            {['Critical', 'High', 'Medium', 'Low'].map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            aria-label="Deployment"
            value={filters.deployment}
            onChange={(e) => patchFilters({ deployment: e.target.value })}
          >
            <option value="">Deployment</option>
            {['On-Premise', 'Private Cloud', 'Public Cloud', 'Hybrid', 'SaaS'].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            aria-label="Standards status"
            value={filters.standardStatus}
            onChange={(e) => patchFilters({ standardStatus: e.target.value })}
          >
            <option value="">Standards status</option>
            {['Standard', 'Exception', 'Under Review', 'Not Assessed'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            aria-label="Vendor"
            value={filters.vendor}
            onChange={(e) => patchFilters({ vendor: e.target.value })}
          >
            <option value="">Vendor</option>
            {vendorOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <select
            aria-label="Ownership"
            value={filters.ownership}
            onChange={(e) => patchFilters({ ownership: e.target.value })}
          >
            <option value="">Ownership</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <select
            aria-label="Critical application dependency"
            value={filters.criticalApp}
            onChange={(e) => patchFilters({ criticalApp: e.target.value })}
          >
            <option value="">Critical app dependency</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
          <select
            aria-label="Resilience"
            value={filters.resilience}
            onChange={(e) => patchFilters({ resilience: e.target.value })}
          >
            <option value="">Resilience</option>
            <option value="Meets Target">Meets Target</option>
            <option value="Gap">Gap</option>
            <option value="Not Assessed">Not Assessed</option>
          </select>
          <select
            aria-label="Portfolio decision"
            value={filters.portfolioDecision}
            onChange={(e) => patchFilters({ portfolioDecision: e.target.value })}
          >
            <option value="">Portfolio decision</option>
            {['INVEST', 'STANDARDISE', 'MODERNISE', 'CONSOLIDATE', 'TOLERATE', 'REPLACE', 'RETIRE'].map(
              (d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ),
            )}
          </select>
        </div>

        <div className="app-filter-meta">
          <span>
            {sorted.length} of {enriched.length} technology assets
          </span>
          {hasFilters && (
            <button type="button" className="text-link" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        <div className="app-table-wrap">
          <table className="app-table int-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="sort-head" onClick={() => toggleSort('name')}>
                    Technology / Platform
                  </button>
                </th>
                <th>Category</th>
                <th>
                  <button type="button" className="sort-head" onClick={() => toggleSort('lifecycle')}>
                    Lifecycle
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-head" onClick={() => toggleSort('criticalApps')}>
                    Critical Apps
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-head" onClick={() => toggleSort('risk')}>
                    Risk
                  </button>
                </th>
                <th>Deployment</th>
                <th>
                  <button type="button" className="sort-head" onClick={() => toggleSort('vendor')}>
                    Vendor
                  </button>
                </th>
                <th>Standard Status</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.tech.id} className="clickable" onClick={() => openTech(row.tech.id)}>
                  <td>
                    <strong>{row.tech.name}</strong>
                    <div className="sub">{row.portfolioDecision}</div>
                  </td>
                  <td>{row.categoryNorm}</td>
                  <td>
                    <StatusTag tone={lifecycleTone(row.lifecycleLabel)}>{row.lifecycleLabel}</StatusTag>
                  </td>
                  <td>{row.criticalApplicationCount}</td>
                  <td>
                    <StatusTag tone={riskTone(row.architectureRisk)}>{row.architectureRisk}</StatusTag>
                  </td>
                  <td>{row.deploymentLabel}</td>
                  <td>{row.vendorLabel}</td>
                  <td>
                    <StatusTag tone={standardTone(row.standardStatus)}>{row.standardStatus}</StatusTag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <p className="sub app-table-empty">No technology assets match the current filters.</p>
          )}
        </div>

        <p className="sub tech-portfolio-footnote">
          Architecture intelligence only — EA360 does not operate infrastructure. Findings and
          initiatives link to broader transformation context.{' '}
          <button type="button" className="text-link" onClick={goFindings}>
            Open Findings & Risks
          </button>
        </p>
      </div>
    </section>
  )
}
