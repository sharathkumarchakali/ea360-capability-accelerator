import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { getTenantConfig, usePrototypeStore } from '../../state/prototypeStore'
import {
  agentsAndAutomations,
  AI_LIFECYCLES,
  AUTONOMY_LABELS,
  computePortfolioMetrics,
  controlCoverage,
  emptyAiFilters,
  enrichAiSolution,
  filterPortfolioAi,
  formatCriticality,
  formatLifecycle,
  governanceTone,
  humanOversightByAutonomy,
  lifecycleMix,
  matrixSample,
  modelProviderConcentration,
  outcomeCoverage,
  permissionLabel,
  portfolioInsights,
  portfolioSignal,
  toolMatrixAgents,
} from './portfolioModel'

function StatusTag({ children, tone }) {
  return <span className={`status-tag tone-${tone || 'muted'}`}>{children}</span>
}

function riskTone(r) {
  if (r === 'Critical' || r === 'High') return 'bad'
  if (r === 'Medium') return 'warn'
  return 'good'
}

const LIFECYCLE_COLORS = {
  EXPERIMENT: '#52CFE4',
  APPROVED: '#0D6B7A',
  PRODUCTION: '#1E8CAA',
  RESTRICTED: '#C47B2C',
  RETIRED: '#6B7280',
}

const QUAD_COLORS = {
  'Govern Closely': '#B42318',
  Protect: '#1E8CAA',
  Review: '#C47B2C',
  Monitor: '#6B7280',
}

const MATRIX_TOOL_IDS = ['int-gra-30', 'int-gra-05', 'int-gra-27', 'int-gra-29']

export default function AIAutomationView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const [filters, setFilters] = useState(emptyAiFilters())
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [tab, setTab] = useState('use-cases')
  const [showAllMatrix, setShowAllMatrix] = useState(false)

  const solutions = repo.listAiSolutions()
  const models = repo.listAiModels()
  const caps = repo.listCapabilities()
  const apps = repo.listApplications()
  const ints = repo.listIntegrations()
  const techs = repo.listTechnologies()
  const orgName = config.shortName || config.displayName || tenantCode || 'Organisation'
  const syntheticDisclaimer =
    config.syntheticDisclaimer ||
    "Synthetic demonstration data — not an authoritative representation of the organisation's technology or AI environment."

  const enriched = useMemo(
    () =>
      solutions.map((s) =>
        enrichAiSolution(s, {
          capabilities: caps,
          models,
          integrations: ints,
          applications: apps,
          technologies: techs,
        }),
      ),
    [solutions, caps, models, ints, apps, techs],
  )

  const metrics = useMemo(() => computePortfolioMetrics(enriched), [enriched])
  const lifecycles = useMemo(() => lifecycleMix(enriched), [enriched])
  const coverage = useMemo(() => controlCoverage(enriched), [enriched])
  const signal = useMemo(() => portfolioSignal(enriched), [enriched])
  const concentration = useMemo(
    () => modelProviderConcentration(enriched, models),
    [enriched, models],
  )
  const oversightBands = useMemo(() => humanOversightByAutonomy(enriched), [enriched])
  const outcomes = useMemo(() => outcomeCoverage(enriched), [enriched])
  const insights = useMemo(
    () => portfolioInsights(enriched, models, metrics),
    [enriched, models, metrics],
  )

  const filtered = useMemo(() => filterPortfolioAi(enriched, filters), [enriched, filters])

  const sorted = useMemo(() => {
    const list = [...filtered]
    const critOrder = { critical: 4, high: 3, medium: 2, low: 1 }
    const riskOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 }
    const lifeOrder = Object.fromEntries(AI_LIFECYCLES.map((k, i) => [k, i]))
    list.sort((a, b) => {
      let ka
      let kb
      if (sort.key === 'name') {
        ka = a.sol.name
        kb = b.sol.name
      } else if (sort.key === 'lifecycle') {
        ka = lifeOrder[a.sol.lifecycle] ?? 0
        kb = lifeOrder[b.sol.lifecycle] ?? 0
      } else if (sort.key === 'autonomy') {
        ka = a.sol.autonomyLevel
        kb = b.sol.autonomyLevel
      } else if (sort.key === 'criticality') {
        ka = critOrder[a.sol.businessCriticality] || 0
        kb = critOrder[b.sol.businessCriticality] || 0
      } else if (sort.key === 'risk') {
        ka = riskOrder[a.sol.riskLevel] || 0
        kb = riskOrder[b.sol.riskLevel] || 0
      } else {
        ka = a.sol.name
        kb = b.sol.name
      }
      if (ka === kb) return a.sol.name.localeCompare(b.sol.name)
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
    const data = lifecycles.filter((p) => p.count > 0)
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
            name: formatLifecycle(d.key),
            value: d.count,
            itemStyle: { color: LIFECYCLE_COLORS[d.key] || '#6B7280' },
          })),
        },
      ],
    }
  }, [lifecycles])

  const matrixChart = useMemo(() => {
    const data = matrixRows.map((r) => ({
      name: r.sol.name,
      value: [r.autonomyScore + 1, r.criticalityScore, r.sol.id],
      itemStyle: { color: QUAD_COLORS[r.matrixQuadrant] },
    }))
    return {
      grid: { left: 52, right: 16, top: 28, bottom: 44 },
      tooltip: {
        formatter: (p) => {
          const row = matrixRows.find((r) => r.sol.id === p.data.value[2])
          if (!row) return p.name
          return [
            `<strong>${row.sol.name}</strong>`,
            `${row.matrixQuadrant}`,
            `Autonomy ${AUTONOMY_LABELS[row.sol.autonomyLevel]}`,
            `Criticality ${formatCriticality(row.sol.businessCriticality)}`,
          ].join('<br/>')
        },
      },
      xAxis: {
        name: 'Autonomy',
        nameLocation: 'middle',
        nameGap: 28,
        min: 0.5,
        max: 5.5,
        interval: 1,
        axisLabel: { formatter: (v) => ({ 1: 'L0', 2: 'L1', 3: 'L2', 4: 'L3', 5: 'L4' }[v] || '') },
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
                  name: 'Govern Closely',
                  xAxis: 3.5,
                  yAxis: 2.5,
                  itemStyle: { color: 'rgba(180,35,24,0.07)' },
                  label: { show: true, position: 'insideTopRight', fontSize: 11, color: '#55717a' },
                },
                { xAxis: 5.5, yAxis: 4.5 },
              ],
              [
                {
                  name: 'Protect',
                  xAxis: 0.5,
                  yAxis: 2.5,
                  itemStyle: { color: 'rgba(30,140,170,0.07)' },
                  label: { show: true, position: 'insideTopLeft', fontSize: 11, color: '#55717a' },
                },
                { xAxis: 3.5, yAxis: 4.5 },
              ],
              [
                {
                  name: 'Review',
                  xAxis: 3.5,
                  yAxis: 0.5,
                  itemStyle: { color: 'rgba(196,123,44,0.07)' },
                  label: { show: true, position: 'insideBottomRight', fontSize: 11, color: '#55717a' },
                },
                { xAxis: 5.5, yAxis: 2.5 },
              ],
              [
                {
                  name: 'Monitor',
                  xAxis: 0.5,
                  yAxis: 0.5,
                  itemStyle: { color: 'rgba(107,114,128,0.06)' },
                  label: { show: true, position: 'insideBottomLeft', fontSize: 11, color: '#55717a' },
                },
                { xAxis: 3.5, yAxis: 2.5 },
              ],
            ],
          },
        },
      ],
    }
  }, [matrixRows])

  const coverageChart = useMemo(
    () => ({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 140, right: 24, top: 8, bottom: 8 },
      xAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
      yAxis: {
        type: 'category',
        data: coverage.map((c) => c.key),
        axisLabel: { color: '#55717a', fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          data: coverage.map((c) => ({
            value: c.pct,
            itemStyle: { color: c.pct >= 80 ? '#1E8CAA' : c.pct >= 65 ? '#C47B2C' : '#B42318' },
          })),
          label: { show: true, position: 'right', formatter: '{c}%' },
        },
      ],
    }),
    [coverage],
  )

  function clearFilters() {
    setFilters(emptyAiFilters())
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
    clearFilters()
    if (kind === 'production') setFilters({ ...emptyAiFilters(), lifecycle: 'PRODUCTION' })
    if (kind === 'highRisk') setFilters({ ...emptyAiFilters(), risk: 'elevated' })
    if (kind === 'governanceGaps') {
      setFilters({ ...emptyAiFilters(), idSet: signal.governanceGapIds })
    }
    if (kind === 'agents') {
      setFilters({
        ...emptyAiFilters(),
        idSet: enriched.filter((r) => r.isAgentOrCopilot).map((r) => r.sol.id),
      })
    }
  }

  function reviewAutonomousAgents() {
    setTab('agents')
    setFilters({ ...emptyAiFilters(), idSet: signal.autonomousAgentIds })
  }

  function reviewGovernanceGaps() {
    setFilters({ ...emptyAiFilters(), idSet: signal.governanceGapIds })
  }

  function reviewElevatedAgents() {
    setTab('agents')
    setFilters({ ...emptyAiFilters(), idSet: signal.elevatedAgentIds })
  }

  function viewAffected() {
    setFilters({ ...emptyAiFilters(), idSet: signal.affectedIds })
  }

  const hasFilters = Object.entries(filters).some(([k, v]) => {
    if (k === 'idSet') return v && v.length > 0
    return Boolean(v)
  })

  const providerOptions = useMemo(() => {
    const set = new Set(enriched.flatMap((r) => r.providerNames))
    return [...set].sort()
  }, [enriched])

  const capabilityOptions = useMemo(() => {
    const ids = new Set(enriched.flatMap((r) => r.sol.businessCapabilityIds))
    return caps.filter((c) => ids.has(c.id)).sort((a, b) => a.name.localeCompare(b.name))
  }, [enriched, caps])

  const dataOptions = useMemo(() => {
    const ids = new Set(enriched.flatMap((r) => r.sol.dataDomainIds))
    return repo
      .listDataObjects()
      .filter((d) => ids.has(d.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [enriched, repo])

  const agentRows = useMemo(() => agentsAndAutomations(enriched), [enriched])
  const matrixAgentRows = useMemo(() => toolMatrixAgents(enriched), [enriched])

  const productionExternalCount = concentration.topCount

  return (
    <section className="view active app-portfolio-view ai-portfolio-view data-portfolio-view">
      <div className="module">
        <div className="module-header app-portfolio-header">
          <div>
            <div className="kicker">Portfolios · {orgName}</div>
            <h1 className="page-title">AI & Automation</h1>
            <p>
              Understand where AI and automation operate across the enterprise, what they can access,
              how autonomous they are, who owns them and what controls govern their use.
            </p>
            <p className="sub synthetic-disclosure">{syntheticDisclaimer}</p>
          </div>
          <div className="synthetic-pill" title={syntheticDisclaimer}>
            SYNTHETIC DEMO DATA
          </div>
        </div>

        <div className="app-metric-strip" role="group" aria-label="AI portfolio summary metrics">
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('all')}>
            <span>AI Use Cases</span>
            <strong>{metrics.total}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('production')}>
            <span>Production</span>
            <strong>{metrics.production}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('agents')}>
            <span>AI Agents / Copilots</span>
            <strong>{metrics.agentsCopilots}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('highRisk')}>
            <span>High-Risk</span>
            <strong>{metrics.highRisk}</strong>
          </button>
          <button type="button" className="app-metric">
            <span>Human Oversight Coverage</span>
            <strong>{metrics.oversightCoverage}%</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetricFilter('governanceGaps')}>
            <span>Governance Gaps</span>
            <strong>{metrics.governanceGaps}</strong>
          </button>
        </div>

        <div className="portfolio-signal">
          <div>
            <div className="kicker">AI Signal</div>
            <h2>
              {signal.productionAgentCount} production AI agents can initiate enterprise actions, but{' '}
              {signal.incompleteControlCount} do not yet have complete human-approval and permission
              controls documented.
            </h2>
            <p>
              These agents interact with customer-facing applications, enterprise APIs and sensitive
              data, making architecture ownership and control important before further expansion.
            </p>
          </div>
          <div className="portfolio-signal-actions">
            <button type="button" className="btn primary primary-button" onClick={reviewAutonomousAgents}>
              Review Autonomous Agents
            </button>
            <button type="button" className="btn secondary-button" onClick={reviewGovernanceGaps}>
              Review Governance Gaps
            </button>
            <button type="button" className="btn secondary-button" onClick={viewAffected}>
              View Affected Systems
            </button>
          </div>
        </div>

        <div className="explorer-segmented ai-portfolio-tabs" role="tablist" aria-label="AI portfolio views">
          <button
            type="button"
            className={tab === 'use-cases' ? 'is-active' : ''}
            onClick={() => setTab('use-cases')}
          >
            Use Cases
          </button>
          <button
            type="button"
            className={tab === 'models' ? 'is-active' : ''}
            onClick={() => setTab('models')}
          >
            Models & Providers
          </button>
          <button
            type="button"
            className={tab === 'agents' ? 'is-active' : ''}
            onClick={() => setTab('agents')}
          >
            Agents & Automations
          </button>
        </div>

        {tab === 'use-cases' && (
          <>
            <div className="app-health-layout data-health-layout">
              <div className="app-health-card">
                <div className="app-health-card-head">
                  <h2>AI lifecycle</h2>
                  <p>How much AI has moved beyond experimentation?</p>
                </div>
                <ReactECharts option={lifecycleChart} style={{ height: 260 }} opts={{ renderer: 'svg' }} />
              </div>
              <div className="app-health-card">
                <div className="app-health-card-head">
                  <h2>Autonomy vs business criticality</h2>
                  <p>Representative AI use cases and agents across control quadrants.</p>
                </div>
                <ReactECharts
                  option={matrixChart}
                  style={{ height: 280 }}
                  opts={{ renderer: 'svg' }}
                  onEvents={{
                    click: (p) => {
                      const id = p?.data?.value?.[2]
                      if (id) selectEntity({ id, type: 'aiSolution' })
                    },
                  }}
                />
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setShowAllMatrix((v) => !v)}
                >
                  {showAllMatrix ? 'Show representative sample' : 'Show all filtered items'}
                </button>
              </div>
              <div className="app-health-card">
                <div className="app-health-card-head">
                  <h2>Control coverage</h2>
                  <p>Architecture control metadata — not regulatory compliance scores.</p>
                </div>
                <ReactECharts option={coverageChart} style={{ height: 280 }} opts={{ renderer: 'svg' }} />
              </div>
            </div>

            <div className="portfolio-insight-grid">
              {insights.map((ins) => (
                <div key={ins.title} className="portfolio-insight-card">
                  <h3>{ins.title}</h3>
                  <p>{ins.body}</p>
                </div>
              ))}
            </div>

            <div className="app-filter-panel">
              <input
                type="search"
                placeholder="Search AI use cases, agents, models, owners or applications"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                aria-label="Search AI portfolio"
              />
              <div className="app-filter-row">
                <select
                  value={filters.aiType}
                  onChange={(e) => setFilters({ ...filters, aiType: e.target.value })}
                  aria-label="AI type"
                >
                  <option value="">AI type</option>
                  {['Assistant', 'Copilot', 'Agent', 'Predictive Model', 'Generative AI', 'Workflow', 'Decision Support'].map(
                    (o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ),
                  )}
                </select>
                <select
                  value={filters.lifecycle}
                  onChange={(e) => setFilters({ ...filters, lifecycle: e.target.value })}
                >
                  <option value="">Lifecycle</option>
                  {AI_LIFECYCLES.map((l) => (
                    <option key={l} value={l}>
                      {formatLifecycle(l)}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.criticality}
                  onChange={(e) => setFilters({ ...filters, criticality: e.target.value })}
                >
                  <option value="">Business criticality</option>
                  {['critical', 'high', 'medium', 'low'].map((c) => (
                    <option key={c} value={c}>
                      {formatCriticality(c)}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.risk}
                  onChange={(e) => setFilters({ ...filters, risk: e.target.value })}
                >
                  <option value="">AI risk</option>
                  <option value="elevated">High / Critical</option>
                  {['Critical', 'High', 'Medium', 'Low'].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.autonomy}
                  onChange={(e) => setFilters({ ...filters, autonomy: e.target.value })}
                >
                  <option value="">Autonomy</option>
                  {[0, 1, 2, 3, 4].map((l) => (
                    <option key={l} value={String(l)}>
                      Level {l}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.oversight}
                  onChange={(e) => setFilters({ ...filters, oversight: e.target.value })}
                >
                  <option value="">Human oversight</option>
                  {[
                    'Every Action',
                    'Exception-Based',
                    'Periodic Review',
                    'Supervisory Monitoring',
                    'None Documented',
                  ].map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.ownership}
                  onChange={(e) => setFilters({ ...filters, ownership: e.target.value })}
                >
                  <option value="">Ownership</option>
                  <option value="assigned">Assigned</option>
                  <option value="unassigned">Unassigned</option>
                </select>
                <select
                  value={filters.provider}
                  onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
                >
                  <option value="">Model provider</option>
                  {providerOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.dataClass}
                  onChange={(e) => setFilters({ ...filters, dataClass: e.target.value })}
                >
                  <option value="">Data domain</option>
                  {dataOptions.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.capabilityId}
                  onChange={(e) => setFilters({ ...filters, capabilityId: e.target.value })}
                >
                  <option value="">Business capability</option>
                  {capabilityOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.governance}
                  onChange={(e) => setFilters({ ...filters, governance: e.target.value })}
                >
                  <option value="">Governance status</option>
                  {['Complete', 'Partial', 'Gap', 'Not Assessed'].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <p className="sub">
                {sorted.length} of {enriched.length} AI solutions
                {hasFilters && (
                  <>
                    {' · '}
                    <button type="button" className="text-link" onClick={clearFilters}>
                      Clear filters
                    </button>
                  </>
                )}
              </p>
            </div>

            <div className="tablewrap portfolio-table-desktop app-register">
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>
                      <button type="button" className="th-sort" onClick={() => toggleSort('name')}>
                        AI use case / solution
                      </button>
                    </th>
                    <th>Type</th>
                    <th>Business capability</th>
                    <th>
                      <button type="button" className="th-sort" onClick={() => toggleSort('lifecycle')}>
                        Lifecycle
                      </button>
                    </th>
                    <th>
                      <button type="button" className="th-sort" onClick={() => toggleSort('autonomy')}>
                        Autonomy
                      </button>
                    </th>
                    <th>
                      <button type="button" className="th-sort" onClick={() => toggleSort('criticality')}>
                        Criticality
                      </button>
                    </th>
                    <th>
                      <button type="button" className="th-sort" onClick={() => toggleSort('risk')}>
                        Risk
                      </button>
                    </th>
                    <th>Owner</th>
                    <th>Governance</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((row) => (
                    <tr
                      key={row.sol.id}
                      className="clickable"
                      onClick={() => selectEntity({ id: row.sol.id, type: 'aiSolution' })}
                    >
                      <td>
                        <strong>{row.sol.name}</strong>
                        <div className="sub">{row.sol.description.slice(0, 72)}…</div>
                      </td>
                      <td>{row.sol.solutionType}</td>
                      <td>{row.capabilityNames[0]}</td>
                      <td>{formatLifecycle(row.sol.lifecycle)}</td>
                      <td>L{row.sol.autonomyLevel}</td>
                      <td>{formatCriticality(row.sol.businessCriticality)}</td>
                      <td>
                        <StatusTag tone={riskTone(row.sol.riskLevel)}>{row.sol.riskLevel}</StatusTag>
                      </td>
                      <td>{row.ownerLabel || '—'}</td>
                      <td>
                        <StatusTag tone={governanceTone(row.sol.governanceStatus)}>
                          {row.sol.governanceStatus}
                        </StatusTag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'models' && (
          <>
            <div className="portfolio-signal portfolio-signal-compact">
              <div>
                <div className="kicker">Model provider concentration</div>
                <h2>
                  {productionExternalCount} production AI use cases depend on one external model
                  provider{concentration.topProvider ? ` (${concentration.topProvider})` : ''}.
                </h2>
              </div>
            </div>
            <div className="tablewrap portfolio-table-desktop app-register">
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>Model</th>
                    <th>Provider</th>
                    <th>Hosting</th>
                    <th>Use cases</th>
                    <th>Critical uses</th>
                    <th>Risk</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => {
                    const uses = enriched.filter((r) => r.sol.modelIds.includes(m.id))
                    const criticalUses = uses.filter((r) => isHighCrit(r.sol.businessCriticality)).length
                    return (
                      <tr key={m.id}>
                        <td>{m.name}</td>
                        <td>{m.provider}</td>
                        <td>{m.hosting}</td>
                        <td>{uses.length}</td>
                        <td>{criticalUses}</td>
                        <td>
                          <StatusTag tone={riskTone(m.riskLevel)}>{m.riskLevel}</StatusTag>
                        </td>
                        <td>{m.status}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'agents' && (
          <>
            <div className="portfolio-signal portfolio-signal-compact">
              <div>
                <p>
                  {metrics.agentsCopilots > 0
                    ? `${enriched.filter((r) => r.hasElevatedPermissions).length} agents can modify enterprise systems; ${enriched.filter((r) => r.hasElevatedPermissions && (r.oversightGap || r.governanceGap)).length} have incomplete approval controls documented.`
                    : 'No agents in register.'}
                </p>
              </div>
              <button type="button" className="btn secondary-button" onClick={reviewElevatedAgents}>
                Review elevated agents
              </button>
            </div>

            <div className="portfolio-insight-grid">
              <div className="portfolio-insight-card">
                <h3>Human oversight by autonomy level</h3>
                <ul className="drawer-list">
                  {oversightBands.map((b) => (
                    <li key={b.label}>
                      {b.label}: {b.pct}% documented ({b.count} assets)
                    </li>
                  ))}
                </ul>
                <p className="sub">
                  Higher-autonomy AI requires stronger—not weaker—ownership and oversight.
                </p>
              </div>
              <div className="portfolio-insight-card">
                <h3>AI outcome coverage</h3>
                <ul className="drawer-list">
                  <li>AI assets with documented outcome: {outcomes.withOutcomePct}%</li>
                  <li>AI assets with baseline: {outcomes.withBaselinePct}%</li>
                  <li>AI assets with target: {outcomes.withTargetPct}%</li>
                  <li>Production AI with measurable outcome: {outcomes.prodMeasurablePct}%</li>
                </ul>
              </div>
            </div>

            <div className="tablewrap portfolio-table-desktop app-register">
              <table className="portfolio-table">
                <thead>
                  <tr>
                    <th>Agent / automation</th>
                    <th>Purpose</th>
                    <th>Autonomy</th>
                    <th>Tools</th>
                    <th>Human oversight</th>
                    <th>Lifecycle</th>
                    <th>Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {agentRows.map((row) => (
                    <tr
                      key={row.sol.id}
                      className="clickable"
                      onClick={() => selectEntity({ id: row.sol.id, type: 'aiSolution' })}
                    >
                      <td>{row.sol.agentName || row.sol.name}</td>
                      <td>{row.sol.businessPurpose.slice(0, 64)}…</td>
                      <td>L{row.sol.autonomyLevel}</td>
                      <td>{row.sol.toolPermissions.length}</td>
                      <td>{row.sol.humanOversightType}</td>
                      <td>{formatLifecycle(row.sol.lifecycle)}</td>
                      <td>
                        <StatusTag tone={riskTone(row.sol.riskLevel)}>{row.sol.riskLevel}</StatusTag>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="app-health-card ai-tool-matrix">
              <div className="app-health-card-head">
                <h2>Agent tool access matrix</h2>
                <p>High-risk agents and representative API permissions (architecture metadata).</p>
              </div>
              <div className="tablewrap">
                <table className="portfolio-table">
                  <thead>
                    <tr>
                      <th>Agent</th>
                      {MATRIX_TOOL_IDS.map((id) => {
                        const int = ints.find((i) => i.id === id)
                        return <th key={id}>{int?.apiOrInterfaceName || int?.name || id}</th>
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {matrixAgentRows.map((row) => (
                      <tr key={row.sol.id}>
                        <td>{row.sol.agentName || row.sol.name}</td>
                        {MATRIX_TOOL_IDS.map((tid) => {
                          const tp = row.sol.toolPermissions.find((p) => p.integrationId === tid)
                          return <td key={tid}>{tp ? permissionLabel(tp.permission) : '—'}</td>
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

function isHighCrit(c) {
  return c === 'critical' || c === 'high'
}
