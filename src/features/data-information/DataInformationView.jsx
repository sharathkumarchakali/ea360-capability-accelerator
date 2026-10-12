import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { getTenantConfig, usePrototypeStore } from '../../state/prototypeStore'
import {
  classificationMix,
  computePortfolioMetrics,
  emptyDataFilters,
  enrichDataDomain,
  filterPortfolioData,
  formatCriticality,
  isDataDomain,
  matrixSample,
  portfolioInsights,
  portfolioSignal,
  sourceOfTruthMix,
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

function qualityTone(q) {
  if (q === 'Good') return 'good'
  if (q === 'Watch') return 'warn'
  if (q === 'Poor') return 'bad'
  return 'muted'
}

function aiTone(a) {
  if (a === 'Ready') return 'good'
  if (a === 'Conditional') return 'warn'
  if (a === 'Not Ready') return 'bad'
  return 'muted'
}

const SOURCE_COLORS = {
  Confirmed: '#1E8CAA',
  'Multiple Sources': '#B42318',
  'Under Review': '#C47B2C',
  Unknown: '#6B7280',
}

const CLASS_COLORS = {
  Public: '#6B7280',
  Internal: '#0D6B7A',
  Confidential: '#1E8CAA',
  Restricted: '#C47B2C',
  'Highly Sensitive': '#B42318',
}

const QUAD_COLORS = {
  Protect: '#1E8CAA',
  Prioritise: '#B42318',
  Improve: '#C47B2C',
  Monitor: '#6B7280',
}

export default function DataInformationView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const [filters, setFilters] = useState(emptyDataFilters)
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [showAllMatrix, setShowAllMatrix] = useState(false)

  const packData = repo.listDataObjects().filter(isDataDomain)
  const applications = repo.listApplications()
  const caps = repo.listCapabilities()
  const initiatives = repo.listInitiatives()
  const integrations = repo.listIntegrations()
  const orgName = config.shortName || config.displayName || tenantCode || 'Organisation'

  const enriched = useMemo(
    () =>
      packData.map((d) =>
        enrichDataDomain(d, { applications, capabilities: caps, initiatives, integrations }),
      ),
    [packData, applications, caps, initiatives, integrations],
  )

  const metrics = useMemo(() => computePortfolioMetrics(enriched), [enriched])
  const sources = useMemo(() => sourceOfTruthMix(enriched), [enriched])
  const classes = useMemo(() => classificationMix(enriched), [enriched])
  const signal = useMemo(() => portfolioSignal(enriched), [enriched])
  const insights = useMemo(() => portfolioInsights(enriched), [enriched])

  const filtered = useMemo(() => filterPortfolioData(enriched, filters), [enriched, filters])

  const sorted = useMemo(() => {
    const list = [...filtered]
    const critOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const riskOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
    const qualityOrder = { Good: 4, Watch: 3, Poor: 2, 'Not Assessed': 1 }
    const aiOrder = { Ready: 4, Conditional: 3, 'Not Ready': 2, 'Not Assessed': 1 }
    list.sort((a, b) => {
      let ka
      let kb
      if (sort.key === 'name') {
        ka = a.data.name
        kb = b.data.name
      } else if (sort.key === 'criticality') {
        ka = critOrder[a.criticality] || 0
        kb = critOrder[b.criticality] || 0
      } else if (sort.key === 'risk') {
        ka = riskOrder[a.risk] || 0
        kb = riskOrder[b.risk] || 0
      } else if (sort.key === 'quality') {
        ka = qualityOrder[a.qualityStatus] || 0
        kb = qualityOrder[b.qualityStatus] || 0
      } else if (sort.key === 'ai') {
        ka = aiOrder[a.aiReadiness] || 0
        kb = aiOrder[b.aiReadiness] || 0
      } else {
        ka = a.data.name
        kb = b.data.name
      }
      if (ka === kb) return a.data.name.localeCompare(b.data.name)
      const cmp = ka > kb ? 1 : -1
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [filtered, sort])

  const matrixRows = useMemo(
    () => (showAllMatrix ? filtered : matrixSample(filtered, 12)),
    [filtered, showAllMatrix],
  )

  const matrixChart = useMemo(() => {
    const data = matrixRows.map((r) => ({
      name: r.data.name.replace(/ Data$/, ''),
      value: [r.governanceScore, r.criticalityScore, r.data.id],
      itemStyle: { color: QUAD_COLORS[r.matrixQuadrant] },
    }))
    return {
      grid: { left: 52, right: 16, top: 28, bottom: 44 },
      tooltip: {
        formatter: (p) => {
          const row = matrixRows.find((r) => r.data.id === p.data.value[2])
          if (!row) return p.name
          return [
            `<strong>${row.data.name}</strong>`,
            `${row.matrixQuadrant} · ${formatCriticality(row.criticality)}`,
            `Governance: ${row.governanceMaturity}`,
            `Risk: ${row.risk}`,
          ].join('<br/>')
        },
      },
      xAxis: {
        name: 'Governance maturity',
        nameLocation: 'middle',
        nameGap: 28,
        min: 0.5,
        max: 4.5,
        interval: 1,
        axisLabel: {
          formatter: (v) => ({ 1: 'Low', 2.5: 'Med', 4: 'High' }[v] || ''),
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
              return n.length > 12 ? `${n.slice(0, 10)}…` : n
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
                  xAxis: 2.5,
                  yAxis: 2.5,
                  itemStyle: { color: 'rgba(30,140,170,0.06)' },
                  label: { show: true, position: 'insideTopRight', color: '#55717a', fontSize: 11 },
                },
                { xAxis: 4.5, yAxis: 4.5 },
              ],
              [
                {
                  name: 'Prioritise',
                  xAxis: 0.5,
                  yAxis: 2.5,
                  itemStyle: { color: 'rgba(180,35,24,0.06)' },
                  label: { show: true, position: 'insideTopLeft', color: '#55717a', fontSize: 11 },
                },
                { xAxis: 2.5, yAxis: 4.5 },
              ],
              [
                {
                  name: 'Improve',
                  xAxis: 0.5,
                  yAxis: 0.5,
                  itemStyle: { color: 'rgba(196,123,44,0.06)' },
                  label: {
                    show: true,
                    position: 'insideBottomLeft',
                    color: '#55717a',
                    fontSize: 11,
                  },
                },
                { xAxis: 2.5, yAxis: 2.5 },
              ],
              [
                {
                  name: 'Monitor',
                  xAxis: 2.5,
                  yAxis: 0.5,
                  itemStyle: { color: 'rgba(107,114,128,0.05)' },
                  label: {
                    show: true,
                    position: 'insideBottomRight',
                    color: '#55717a',
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

  const sourceChart = useMemo(() => {
    const data = sources.filter((s) => s.count > 0)
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
            itemStyle: { color: SOURCE_COLORS[d.key] || '#6B7280' },
          })),
        },
      ],
    }
  }, [sources])

  const classChart = useMemo(() => {
    const categories = classes.map((c) => c.key)
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 48, right: 12, top: 16, bottom: 36 },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: {
          color: '#55717a',
          fontSize: 11,
          rotate: 20,
          formatter: (v) => (v.length > 10 ? `${v.slice(0, 9)}…` : v),
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } },
      },
      series: [
        {
          type: 'bar',
          barWidth: 22,
          data: classes.map((c) => ({
            value: c.count,
            itemStyle: { color: CLASS_COLORS[c.key] || '#6B7280' },
          })),
        },
      ],
    }
  }, [classes])

  function patchFilters(patch) {
    setFilters((f) => ({ ...f, ...patch }))
  }

  function clearFilters() {
    setFilters(emptyDataFilters)
  }

  function openData(id) {
    selectEntity({ id, type: 'dataObject' })
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
      setFilters({ ...emptyDataFilters, criticality: 'critical' })
      return
    }
    if (kind === 'ownership') {
      setFilters({ ...emptyDataFilters, ownership: 'unassigned' })
      return
    }
    if (kind === 'trusted') {
      setFilters({
        ...emptyDataFilters,
        idSet: enriched
          .filter((r) => r.authoritativeSourceStatus !== 'Confirmed')
          .map((r) => r.data.id),
      })
      return
    }
    if (kind === 'highRisk') {
      setFilters({ ...emptyDataFilters, risk: 'elevated' })
      return
    }
    if (kind === 'ai') {
      setFilters({ ...emptyDataFilters, aiReadiness: 'ai-suitable' })
    }
  }

  function reviewCriticalData() {
    setFilters({
      ...emptyDataFilters,
      criticality: '',
      idSet: signal.criticalIssueIds,
    })
  }

  function reviewOwnershipGaps() {
    setFilters({
      ...emptyDataFilters,
      ownership: 'unassigned',
      idSet: signal.ownershipGapIds,
    })
  }

  function goFindings() {
    setView('findings')
    window.location.hash = 'findings'
  }

  const hasFilters =
    Boolean(filters.search) ||
    Boolean(filters.criticality) ||
    Boolean(filters.ownership) ||
    Boolean(filters.authoritativeSource) ||
    Boolean(filters.classification) ||
    Boolean(filters.risk) ||
    Boolean(filters.quality) ||
    Boolean(filters.residency) ||
    Boolean(filters.aiReadiness) ||
    Boolean(filters.capabilityId) ||
    Boolean(filters.applicationId) ||
    (filters.idSet && filters.idSet.length > 0)

  const capabilityOptions = useMemo(() => {
    const ids = new Set(packData.flatMap((d) => d.businessCapabilityIds || []))
    return caps.filter((c) => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [packData, caps])

  const applicationOptions = useMemo(() => {
    const ids = new Set(
      packData.flatMap((d) => [
        d.systemOfRecordApplicationId,
        d.primaryApplicationId,
        ...(d.sourceApplicationIds || []),
        ...(d.consumerApplicationIds || []),
      ]),
    )
    return applications
      .filter((a) => ids.has(a.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [packData, applications])

  return (
    <section className="view active app-portfolio-view data-portfolio-view">
      <div className="module">
        <div className="module-header app-portfolio-header">
          <div>
            <div className="kicker">Portfolios · {orgName}</div>
            <h1 className="page-title">Data & Information</h1>
            <p>
              Understand the information the enterprise depends on — where it comes from, who owns
              it, how it moves and where governance or quality risk exists.
            </p>
          </div>
          <div className="synthetic-pill" title="Illustrative seed data for demonstration">
            SYNTHETIC DEMO DATA
          </div>
        </div>

        <div className="app-metric-strip" role="group" aria-label="Data portfolio summary metrics">
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('all')}>
            <span>Data Domains</span>
            <strong>{metrics.total}</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('critical')}
          >
            <span>Critical Data Domains</span>
            <strong>{metrics.criticalDomains}</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('ownership')}
          >
            <span>Ownership Coverage</span>
            <strong>{metrics.ownershipCoverage}%</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('trusted')}>
            <span>Trusted Source Coverage</span>
            <strong>{metrics.trustedSourceCoverage}%</strong>
          </button>
          <button
            type="button"
            className="app-metric"
            onClick={() => applyMetricFilter('highRisk')}
          >
            <span>High-Risk Data Domains</span>
            <strong>{metrics.highRisk}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('ai')}>
            <span>AI-Ready Data</span>
            <strong>{metrics.aiReadyPct}%</strong>
          </button>
        </div>

        <div className="portfolio-signal">
          <div>
            <div className="kicker">Data Signal</div>
            <h2>
              {signal.headlineCount} critical data domains have unresolved ownership, quality or
              source-of-truth issues.
            </h2>
            <p>
              {signal.supportingNames
                ? `${signal.supportingNames} data are widely reused across digital channels, integration services and analytics but remain dependent on overlapping or incomplete sources.`
                : 'Critical information assets are reused across channels and analytics without complete ownership or a single confirmed authoritative source.'}
            </p>
          </div>
          <div className="portfolio-signal-actions">
            <button type="button" className="btn primary primary-button" onClick={reviewCriticalData}>
              Review Critical Data
            </button>
            <button
              type="button"
              className="btn secondary-button"
              onClick={reviewOwnershipGaps}
            >
              Review Ownership Gaps
            </button>
            <button type="button" className="btn secondary-button" onClick={goFindings}>
              View Related Findings
            </button>
          </div>
        </div>

        <div className="app-health-layout data-health-layout">
          <div className="app-health-card">
            <div className="app-health-card-head">
              <h3>Data Domain Health</h3>
              <button
                type="button"
                className="text-link"
                onClick={() => setShowAllMatrix((v) => !v)}
              >
                {showAllMatrix ? 'Show sample' : 'Show all'}
              </button>
            </div>
            <p className="sub int-pattern-note">
              Governance maturity × business criticality — click a point for detail.
            </p>
            <ReactECharts
              option={matrixChart}
              style={{ height: 280 }}
              onEvents={{
                click: (params) => {
                  const id = params?.data?.value?.[2]
                  if (id) openData(id)
                },
              }}
            />
          </div>

          <div className="app-health-card">
            <div className="app-health-card-head">
              <h3>Source-of-Truth Coverage</h3>
            </div>
            <p className="sub int-pattern-note">
              Do we know where the authoritative version of important information lives?
            </p>
            <ReactECharts
              option={sourceChart}
              style={{ height: 280 }}
              onEvents={{
                click: (params) => {
                  if (params?.name) {
                    setFilters({ ...emptyDataFilters, authoritativeSource: params.name })
                  }
                },
              }}
            />
          </div>

          <div className="app-health-card">
            <div className="app-health-card-head">
              <h3>Data Classification</h3>
            </div>
            <p className="sub int-pattern-note">Sensitivity distribution across data domains.</p>
            <ReactECharts
              option={classChart}
              style={{ height: 280 }}
              onEvents={{
                click: (params) => {
                  const key = classes[params?.dataIndex]?.key
                  if (key) setFilters({ ...emptyDataFilters, classification: key })
                },
              }}
            />
          </div>
        </div>

        {insights.length > 0 && (
          <div className="data-insights" aria-label="Portfolio insights">
            {insights.map((ins) => (
              <button
                key={ins.id}
                type="button"
                className="data-insight-chip"
                onClick={() => setFilters({ ...emptyDataFilters, idSet: ins.ids })}
              >
                {ins.title}
              </button>
            ))}
          </div>
        )}

        <div className="app-filters int-filters data-filters">
          <input
            type="search"
            placeholder="Search data domains, owners, systems or information assets"
            aria-label="Search data domains"
            value={filters.search}
            onChange={(e) => patchFilters({ search: e.target.value })}
          />
          <select
            aria-label="Criticality"
            value={filters.criticality}
            onChange={(e) => patchFilters({ criticality: e.target.value })}
          >
            <option value="">Criticality</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
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
            aria-label="Authoritative source"
            value={filters.authoritativeSource}
            onChange={(e) => patchFilters({ authoritativeSource: e.target.value })}
          >
            <option value="">Authoritative Source</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Multiple Sources">Multiple Sources</option>
            <option value="Under Review">Under Review</option>
            <option value="Unknown">Unknown</option>
          </select>
          <select
            aria-label="Classification"
            value={filters.classification}
            onChange={(e) => patchFilters({ classification: e.target.value })}
          >
            <option value="">Classification</option>
            <option value="Public">Public</option>
            <option value="Internal">Internal</option>
            <option value="Confidential">Confidential</option>
            <option value="Restricted">Restricted</option>
            <option value="Highly Sensitive">Highly Sensitive</option>
          </select>
          <select
            aria-label="Risk"
            value={filters.risk}
            onChange={(e) => patchFilters({ risk: e.target.value })}
          >
            <option value="">Risk</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            aria-label="Quality"
            value={filters.quality}
            onChange={(e) => patchFilters({ quality: e.target.value })}
          >
            <option value="">Quality</option>
            <option value="Good">Good</option>
            <option value="Watch">Watch</option>
            <option value="Poor">Poor</option>
            <option value="Not Assessed">Not Assessed</option>
          </select>
          <select
            aria-label="Residency"
            value={filters.residency}
            onChange={(e) => patchFilters({ residency: e.target.value })}
          >
            <option value="">Residency</option>
            <option value="Compliant">Compliant</option>
            <option value="Review Required">Review Required</option>
            <option value="Cross-Border">Cross-Border</option>
            <option value="Unknown">Unknown</option>
          </select>
          <select
            aria-label="AI readiness"
            value={filters.aiReadiness}
            onChange={(e) => patchFilters({ aiReadiness: e.target.value })}
          >
            <option value="">AI Readiness</option>
            <option value="Ready">Ready</option>
            <option value="Conditional">Conditional</option>
            <option value="Not Ready">Not Ready</option>
            <option value="Not Assessed">Not Assessed</option>
          </select>
          <select
            aria-label="Business capability"
            value={filters.capabilityId}
            onChange={(e) => patchFilters({ capabilityId: e.target.value })}
          >
            <option value="">Business Capability</option>
            {capabilityOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Application"
            value={filters.applicationId}
            onChange={(e) => patchFilters({ applicationId: e.target.value })}
          >
            <option value="">Application</option>
            {applicationOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <div className="app-filter-meta">
            <span>
              {sorted.length} of {metrics.total} data domains
            </span>
            {hasFilters ? (
              <button type="button" className="text-link" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        </div>

        <div className="tablewrap portfolio-table-desktop app-register">
          <table className="portfolio-table">
            <thead>
              <tr>
                <th>
                  <button type="button" className="sort-btn" onClick={() => toggleSort('name')}>
                    Data Domain
                  </button>
                </th>
                <th>
                  <button
                    type="button"
                    className="sort-btn"
                    onClick={() => toggleSort('criticality')}
                  >
                    Criticality
                  </button>
                </th>
                <th>Owner</th>
                <th>Authoritative Source</th>
                <th>Classification</th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => toggleSort('quality')}>
                    Quality
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => toggleSort('risk')}>
                    Risk
                  </button>
                </th>
                <th>
                  <button type="button" className="sort-btn" onClick={() => toggleSort('ai')}>
                    AI Readiness
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.data.id} onClick={() => openData(row.data.id)}>
                  <td>
                    <strong>{row.data.name}</strong>
                    <div className="sub">{row.systemOfRecordName || row.data.domain}</div>
                  </td>
                  <td>
                    <StatusTag tone={critTone(row.criticality)}>
                      {formatCriticality(row.criticality)}
                    </StatusTag>
                  </td>
                  <td>
                    {row.businessOwnerLabel || (
                      <span className="ownership-gap inline">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <StatusTag
                      tone={
                        row.authoritativeSourceStatus === 'Confirmed'
                          ? 'good'
                          : row.authoritativeSourceStatus === 'Multiple Sources' ||
                              row.authoritativeSourceStatus === 'Unknown'
                            ? 'bad'
                            : 'warn'
                      }
                    >
                      {row.authoritativeSourceStatus}
                    </StatusTag>
                  </td>
                  <td>{row.classificationLabel}</td>
                  <td>
                    <StatusTag tone={qualityTone(row.qualityStatus)}>{row.qualityStatus}</StatusTag>
                  </td>
                  <td>
                    <StatusTag tone={riskTone(row.risk)}>{row.risk}</StatusTag>
                  </td>
                  <td>
                    <StatusTag tone={aiTone(row.aiReadiness)}>{row.aiReadiness}</StatusTag>
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="empty-state">No data domains match the current filters.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="portfolio-mobile app-register-mobile data-mobile">
          {sorted.map((row) => (
            <button
              key={row.data.id}
              type="button"
              className="app-mobile-card"
              onClick={() => openData(row.data.id)}
            >
              <div className="app-mobile-card-head">
                <strong>{row.data.name}</strong>
                <StatusTag tone={critTone(row.criticality)}>
                  {formatCriticality(row.criticality)}
                </StatusTag>
              </div>
              <div className="sub">
                {row.businessOwnerLabel || 'Owner unassigned'} · {row.authoritativeSourceStatus}
              </div>
              <div className="chip-row" style={{ marginTop: 8 }}>
                <StatusTag tone={qualityTone(row.qualityStatus)}>{row.qualityStatus}</StatusTag>
                <StatusTag tone={riskTone(row.risk)}>{row.risk}</StatusTag>
                <StatusTag tone={aiTone(row.aiReadiness)}>{row.aiReadiness}</StatusTag>
              </div>
            </button>
          ))}
          {sorted.length === 0 && (
            <div className="empty-state">No data domains match the current filters.</div>
          )}
        </div>
      </div>
    </section>
  )
}
