import { useMemo, useState } from 'react'
import ReactECharts from '../../components/charts/ThemedChart'
import { getTenantConfig, usePrototypeStore } from '../../state/prototypeStore'
import {
  DECISION_COLORS,
  emptyIntFilters,
  computePortfolioMetrics,
  enrichIntegration,
  exposureReuseMix,
  filterPortfolioIntegrations,
  formatCriticality,
  matrixSample,
  patternMix,
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

function critTone(c) {
  if (c === 'critical') return 'bad'
  if (c === 'high') return 'warn'
  return 'muted'
}

function complianceTone(c) {
  if (c === 'Compliant') return 'good'
  if (c === 'Partial') return 'warn'
  return 'bad'
}

const PATTERN_COLORS = {
  'Managed API': '#1E8CAA',
  'Event / Streaming': '#52CFE4',
  'Service Integration': '#0D6B7A',
  'Point-to-Point': '#C47B2C',
  'Batch / File': '#6B7280',
  'Database Integration': '#B42318',
}

export default function IntegrationsView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const [filters, setFilters] = useState(emptyIntFilters)
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [showAllMatrix, setShowAllMatrix] = useState(false)

  const packInts = repo.listIntegrations()
  const applications = repo.listApplications()
  const caps = repo.listCapabilities()
  const initiatives = repo.listInitiatives()
  const orgName = config.shortName || config.displayName || tenantCode || 'Organisation'

  const enriched = useMemo(
    () =>
      packInts.map((i) =>
        enrichIntegration(i, { applications, capabilities: caps, initiatives }),
      ),
    [packInts, applications, caps, initiatives],
  )

  const metrics = useMemo(() => computePortfolioMetrics(enriched), [enriched])
  const patterns = useMemo(() => patternMix(enriched), [enriched])
  const exposureReuse = useMemo(() => exposureReuseMix(enriched), [enriched])
  const signal = useMemo(() => portfolioSignal(enriched), [enriched])

  const filtered = useMemo(
    () => filterPortfolioIntegrations(enriched, filters),
    [enriched, filters],
  )

  const sorted = useMemo(() => {
    const list = [...filtered]
    const critOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const riskOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
    const lifeOrder = Object.fromEntries(PORTFOLIO_LIFECYCLES.map((k, i) => [k, i]))
    list.sort((a, b) => {
      let ka
      let kb
      if (sort.key === 'name') {
        ka = a.int.name
        kb = b.int.name
      } else if (sort.key === 'criticality') {
        ka = critOrder[a.int.criticality] || 0
        kb = critOrder[b.int.criticality] || 0
      } else if (sort.key === 'risk') {
        ka = riskOrder[a.architectureRisk] || 0
        kb = riskOrder[b.architectureRisk] || 0
      } else if (sort.key === 'lifecycle') {
        ka = lifeOrder[a.lifecycleStage] ?? 0
        kb = lifeOrder[b.lifecycleStage] ?? 0
      } else {
        ka = a.int.name
        kb = b.int.name
      }
      if (ka === kb) return a.int.name.localeCompare(b.int.name)
      const cmp = ka > kb ? 1 : -1
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [filtered, sort])

  const matrixRows = useMemo(
    () => (showAllMatrix ? filtered : matrixSample(filtered, 14)),
    [filtered, showAllMatrix],
  )

  const patternChart = useMemo(() => {
    const data = patterns.filter((p) => p.count > 0)
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
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
          label: { show: false },
          data: data.map((d) => ({
            name: d.key,
            value: d.count,
            itemStyle: { color: PATTERN_COLORS[d.key] || '#6B7280' },
          })),
        },
      ],
    }
  }, [patterns])

  const exposureReuseChart = useMemo(() => {
    const categories = exposureReuse.exposure.map((e) => e.key)
    const reuseKeys = exposureReuse.reuse.map((r) => r.key)
    const reuseColors = {
      'Enterprise Reusable': '#1E8CAA',
      'Multi-Consumer': '#52CFE4',
      'Single Consumer': '#C47B2C',
    }
    // Compact stacked view: for each exposure, approximate reuse split by filtering rows
    const series = reuseKeys.map((rk) => ({
      name: rk,
      type: 'bar',
      stack: 'total',
      barWidth: 28,
      itemStyle: { color: reuseColors[rk] },
      data: categories.map((exp) =>
        enriched.filter((r) => r.exposure === exp && r.reuseClassification === rk).length,
      ),
    }))
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: {
        bottom: 0,
        textStyle: { color: '#55717a', fontSize: 11 },
      },
      grid: { left: 48, right: 12, top: 16, bottom: 48 },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: '#55717a', fontSize: 12 },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } },
      },
      series,
    }
  }, [exposureReuse, enriched])

  const matrixChart = useMemo(() => {
    const data = matrixRows.map((r) => ({
      name: r.int.apiOrInterfaceName || r.int.name,
      value: [r.riskScore, r.criticalityScore, r.int.id],
      decision: r.portfolioDecision,
      itemStyle: { color: DECISION_COLORS[r.portfolioDecision] },
    }))
    return {
      grid: { left: 52, right: 16, top: 28, bottom: 44 },
      tooltip: {
        formatter: (p) => {
          const row = matrixRows.find((r) => r.int.id === p.data.value[2])
          if (!row) return p.name
          return [
            `<strong>${row.int.name}</strong>`,
            `${row.portfolioDecision} · ${formatCriticality(row.int.criticality)}`,
            `Integration risk: ${row.architectureRisk}`,
            row.matrixQuadrant,
          ].join('<br/>')
        },
      },
      xAxis: {
        name: 'Integration risk',
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
    setFilters(emptyIntFilters)
  }

  function openInt(id) {
    selectEntity({ id, type: 'integration' })
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
    if (kind === 'critical') {
      setFilters({ ...emptyIntFilters, criticality: 'critical' })
      return
    }
    if (kind === 'ownership') {
      setFilters({ ...emptyIntFilters, ownership: 'unassigned' })
      return
    }
    if (kind === 'compliance') {
      setFilters({ ...emptyIntFilters, compliance: 'Non-Compliant' })
      return
    }
    if (kind === 'reuse') {
      setFilters({ ...emptyIntFilters, reuse: 'Single Consumer' })
      return
    }
    if (kind === 'highRisk') {
      setFilters({ ...emptyIntFilters, risk: 'elevated' })
    }
  }

  function reviewOwnershipGaps() {
    setFilters({
      ...emptyIntFilters,
      ownership: 'unassigned',
      idSet: signal.ownershipGapIds,
    })
  }

  function reviewCriticalDependencies() {
    setFilters({
      ...emptyIntFilters,
      criticality: 'business-critical',
      idSet: signal.criticalDependencyIds,
    })
  }

  function goFindings() {
    setView('findings')
    window.location.hash = 'findings'
  }

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.assetType) ||
    Boolean(filters.exposure) ||
    Boolean(filters.criticality) ||
    Boolean(filters.risk) ||
    Boolean(filters.ownership) ||
    Boolean(filters.lifecycle) ||
    Boolean(filters.compliance) ||
    Boolean(filters.reuse) ||
    Boolean(filters.platform) ||
    Boolean(filters.capabilityId) ||
    (filters.idSet && filters.idSet.length > 0)

  const capabilityOptions = useMemo(() => {
    const ids = new Set(packInts.flatMap((i) => i.supportedCapabilityIds || []))
    return caps.filter((c) => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [packInts, caps])

  const platformOptions = useMemo(() => {
    const set = new Set(enriched.map((r) => r.platform).filter(Boolean))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [enriched])

  const p2pShare = metrics.total
    ? Math.round((metrics.pointToPoint / metrics.total) * 100)
    : 0

  return (
    <section className="view active app-portfolio-view int-portfolio-view">
      <div className="module">
        <div className="module-header app-portfolio-header">
          <div>
            <div className="kicker">Portfolios · {orgName}</div>
            <h1 className="page-title">Integrations & APIs</h1>
            <p>
              Understand how applications, services and data connect — and where integration risk,
              duplication and reuse opportunities exist.
            </p>
          </div>
          <div className="synthetic-pill" title="Illustrative seed data for demonstration">
            SYNTHETIC DEMO DATA
          </div>
        </div>

        <div className="app-metric-strip" role="group" aria-label="Integration portfolio summary metrics">
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('all')}>
            <span>Integration Assets</span>
            <strong>{metrics.total}</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('critical')}
          >
            <span>Business-Critical</span>
            <strong>{metrics.businessCritical}</strong>
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
            onClick={() => applyMetricFilter('compliance')}
          >
            <span>Standards Compliance</span>
            <strong>{metrics.standardsCompliance}%</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('reuse')}>
            <span>Reuse Coverage</span>
            <strong>{metrics.reuseCoverage}%</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('highRisk')}
          >
            <span>High-Risk Integrations</span>
            <strong>{metrics.highRisk}</strong>
          </button>
        </div>

        <div className="portfolio-signal">
          <div>
            <div className="kicker">Integration Signal</div>
            <h2>
              {signal.ownershipGapPct}% of enterprise APIs and interfaces do not have confirmed
              accountable ownership.
            </h2>
            <p>
              Business-critical services are disproportionately dependent on a small number of
              integration platforms and point-to-point connections
              {signal.topPlatform
                ? ` — notably ${signal.topPlatform} (${signal.topPlatformCount} critical paths)`
                : ''}
              .
            </p>
          </div>
          <div className="portfolio-signal-actions">
            <button
              type="button"
              className="btn primary primary-button"
              onClick={reviewOwnershipGaps}
            >
              Review Ownership Gaps
            </button>
            <button
              type="button"
              className="btn secondary-button"
              onClick={reviewCriticalDependencies}
            >
              Review Critical Dependencies
            </button>
            <button type="button" className="btn secondary-button" onClick={goFindings}>
              View Related Findings
            </button>
          </div>
        </div>

        <div className="app-health-layout int-health-layout">
          <div className="app-health-card">
            <div className="app-health-card-head">
              <h2>Integration pattern mix</h2>
              <p>How the enterprise actually connects systems.</p>
            </div>
            <ReactECharts option={patternChart} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
            <p className="sub int-pattern-note">
              Point-to-point accounts for {p2pShare}% of assets — context matters before treating
              every instance as technical debt.
            </p>
            <div className="decision-legend">
              {patterns.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  className={`decision-leg${
                    {
                      'Managed API': 'API',
                      'Event / Streaming': 'Event',
                      'Service Integration': 'Service',
                      'Point-to-Point': 'Point-to-Point',
                      'Batch / File': 'Batch',
                      'Database Integration': 'Database Integration',
                    }[m.key] === filters.assetType
                      ? ' active'
                      : ''
                  }`}
                  onClick={() => {
                    const patternToAsset = {
                      'Managed API': 'API',
                      'Event / Streaming': 'Event',
                      'Service Integration': 'Service',
                      'Point-to-Point': 'Point-to-Point',
                      'Batch / File': 'Batch',
                      'Database Integration': 'Database Integration',
                    }
                    const next = patternToAsset[m.key] || ''
                    patchFilters({
                      assetType: filters.assetType === next ? '' : next,
                    })
                  }}
                >
                  <i style={{ background: PATTERN_COLORS[m.key] }} />
                  {m.key} · {m.count}
                </button>
              ))}
            </div>
          </div>

          <div className="app-health-card">
            <div className="app-health-card-head">
              <h2>Exposure & reuse</h2>
              <p>Reusable enterprise services versus rebuilt integrations.</p>
            </div>
            <ReactECharts
              option={exposureReuseChart}
              style={{ height: 280 }}
              opts={{ renderer: 'svg' }}
            />
          </div>

          <div className="app-health-card app-matrix-card">
            <div className="app-health-card-head">
              <div>
                <h2>Criticality vs integration risk</h2>
                <p>Prioritise where business value and integration risk concentrate.</p>
              </div>
              {filtered.length > 14 && (
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
                  if (id) openInt(id)
                },
              }}
            />
          </div>
        </div>

        <div className="intel-toolbar app-filters int-filters">
          <input
            type="search"
            placeholder="Search APIs, interfaces, applications or owners"
            value={filters.search}
            onChange={(e) => patchFilters({ search: e.target.value })}
            aria-label="Search integration assets"
          />
          <select
            value={filters.assetType}
            onChange={(e) => patchFilters({ assetType: e.target.value })}
            aria-label="Asset type"
          >
            <option value="">Asset type</option>
            <option value="API">API</option>
            <option value="Event">Event</option>
            <option value="Service">Service</option>
            <option value="Batch">Batch</option>
            <option value="Point-to-Point">Point-to-Point</option>
            <option value="Database Integration">Database Integration</option>
          </select>
          <select
            value={filters.exposure}
            onChange={(e) => patchFilters({ exposure: e.target.value })}
            aria-label="Exposure"
          >
            <option value="">Exposure</option>
            <option value="Internal">Internal</option>
            <option value="Partner">Partner</option>
            <option value="Public">Public</option>
          </select>
          <select
            value={filters.criticality}
            onChange={(e) => patchFilters({ criticality: e.target.value })}
            aria-label="Criticality"
          >
            <option value="">Criticality</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filters.risk}
            onChange={(e) => patchFilters({ risk: e.target.value })}
            aria-label="Risk"
          >
            <option value="">Risk</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={filters.ownership}
            onChange={(e) => patchFilters({ ownership: e.target.value })}
            aria-label="Ownership"
          >
            <option value="">Ownership</option>
            <option value="assigned">Assigned</option>
            <option value="unassigned">Unassigned</option>
          </select>
          <select
            value={filters.lifecycle}
            onChange={(e) => patchFilters({ lifecycle: e.target.value })}
            aria-label="Lifecycle"
          >
            <option value="">Lifecycle</option>
            {PORTFOLIO_LIFECYCLES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={filters.compliance}
            onChange={(e) => patchFilters({ compliance: e.target.value })}
            aria-label="Compliance"
          >
            <option value="">Compliance</option>
            <option value="Compliant">Compliant</option>
            <option value="Partial">Partial</option>
            <option value="Non-Compliant">Non-Compliant</option>
          </select>
          <select
            value={filters.reuse}
            onChange={(e) => patchFilters({ reuse: e.target.value })}
            aria-label="Reuse"
          >
            <option value="">Reuse</option>
            <option value="Enterprise Reusable">Enterprise Reusable</option>
            <option value="Multi-Consumer">Multi-Consumer</option>
            <option value="Single Consumer">Single Consumer</option>
          </select>
          <select
            value={filters.platform}
            onChange={(e) => patchFilters({ platform: e.target.value })}
            aria-label="Platform"
          >
            <option value="">Platform</option>
            {platformOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={filters.capabilityId}
            onChange={(e) => patchFilters({ capabilityId: e.target.value })}
            aria-label="Business capability"
          >
            <option value="">Business capability</option>
            {capabilityOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="app-register-meta">
          <span>
            {sorted.length} of {enriched.length} integration assets
          </span>
          {hasFilters && (
            <button type="button" className="text-link" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        <div className="tablewrap portfolio-table-desktop app-register">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort('name')}>
                    Integration / API
                  </button>
                </th>
                <th>Type</th>
                <th>Provider</th>
                <th>Consumers</th>
                <th>Exposure</th>
                <th>
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => toggleSort('criticality')}
                  >
                    Criticality
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort('risk')}>
                    Risk
                  </button>
                </th>
                <th>Owner</th>
                <th>
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => toggleSort('lifecycle')}
                  >
                    Lifecycle
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr
                  key={row.int.id}
                  className="clickable-row"
                  onClick={() => openInt(row.int.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openInt(row.int.id)
                    }
                  }}
                  tabIndex={0}
                  role="link"
                >
                  <td>
                    <strong>{row.int.name}</strong>
                    <div className="sub">{row.int.apiOrInterfaceName}</div>
                  </td>
                  <td>{row.assetType}</td>
                  <td>{row.providerName}</td>
                  <td>
                    {row.consumerNames.length <= 2
                      ? row.consumerNames.join(', ')
                      : `${row.consumerNames.slice(0, 2).join(', ')} +${row.consumerNames.length - 2}`}
                  </td>
                  <td>{row.exposure}</td>
                  <td>
                    <StatusTag tone={critTone(row.int.criticality)}>
                      {formatCriticality(row.int.criticality)}
                    </StatusTag>
                  </td>
                  <td>
                    <StatusTag tone={riskTone(row.architectureRisk)}>
                      {row.architectureRisk}
                    </StatusTag>
                  </td>
                  <td>
                    {row.ownershipGap ? (
                      <StatusTag tone="bad">Unassigned</StatusTag>
                    ) : (
                      row.integrationOwnerLabel || row.technicalOwnerLabel
                    )}
                  </td>
                  <td>
                    <StatusTag tone={row.lifecycleStage === 'Retire' || row.lifecycleStage === 'Deprecated' ? 'warn' : 'muted'}>
                      {row.lifecycleStage}
                    </StatusTag>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <p className="sub">No integration assets match the current filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="portfolio-mobile app-register-mobile int-mobile">
          {sorted.map((row) => (
            <button
              key={row.int.id}
              type="button"
              className="app-mobile-card"
              onClick={() => openInt(row.int.id)}
            >
              <div className="app-mobile-card-head">
                <strong>{row.int.name}</strong>
                <StatusTag tone={riskTone(row.architectureRisk)}>{row.architectureRisk}</StatusTag>
              </div>
              <p className="sub">
                {row.assetType} · {row.providerName} · {row.exposure}
              </p>
              <div className="chip-row">
                <StatusTag tone={critTone(row.int.criticality)}>
                  {formatCriticality(row.int.criticality)}
                </StatusTag>
                <StatusTag tone={complianceTone(row.standardsCompliance)}>
                  {row.standardsCompliance}
                </StatusTag>
                <StatusTag tone="muted">{row.lifecycleStage}</StatusTag>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
