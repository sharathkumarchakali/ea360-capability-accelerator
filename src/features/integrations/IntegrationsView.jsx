import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { usePrototypeStore } from '../../state/prototypeStore'
import {
  concentrationByApplication,
  deriveIntegrationMetrics,
  integrationRiskScore,
  isPointToPoint,
  missingOwner,
  topIntegrationInsights,
  typeDistribution,
} from '../../domain/metrics/integration'

const PAGE_SIZE = 8

const CHART_COLORS = ['#1E8CAA', '#52CFE4', '#0D6B7A', '#62E0C8', '#C47B2C', '#6B7280', '#B42318']

export default function IntegrationsView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const integrationFilters = usePrototypeStore((s) => s.integrationFilters)
  const setIntegrationFilters = usePrototypeStore((s) => s.setIntegrationFilters)
  const scenarioId = usePrototypeStore((s) => s.scenarioId)
  const setScenarioId = usePrototypeStore((s) => s.setScenarioId)
  const setGraphRoot = usePrototypeStore((s) => s.setGraphRoot)
  const setView = usePrototypeStore((s) => s.setView)
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState({ key: 'risk', dir: 'desc' })

  const integrations = repo.listIntegrations()
  const applications = repo.listApplications()
  const scenarios = repo.listScenarios()
  const scenario = repo.getScenario(scenarioId) || scenarios[0]

  const metrics = useMemo(() => deriveIntegrationMetrics(integrations), [integrations])
  const insights = useMemo(() => topIntegrationInsights(integrations), [integrations])
  const concentration = useMemo(
    () => concentrationByApplication(integrations, applications).slice(0, 8),
    [integrations, applications],
  )
  const types = useMemo(() => typeDistribution(integrations), [integrations])

  const enriched = useMemo(
    () =>
      integrations.map((i) => ({
        int: i,
        risk: integrationRiskScore(i),
        p2p: isPointToPoint(i),
        sourceName: repo.getApplication(i.sourceApplicationId)?.name || i.sourceApplicationId,
        targetName: repo.getApplication(i.targetApplicationId)?.name || i.targetApplicationId,
        ownerGap: missingOwner(i),
      })),
    [integrations, repo],
  )

  const filtered = useMemo(() => {
    const q = integrationFilters.search.trim().toLowerCase()
    return enriched.filter(({ int: i, p2p, ownerGap }) => {
      if (integrationFilters.integrationType && i.integrationType !== integrationFilters.integrationType) {
        return false
      }
      if (integrationFilters.criticality && i.criticality !== integrationFilters.criticality) return false
      if (integrationFilters.lifecycleStatus && i.lifecycleStatus !== integrationFilters.lifecycleStatus) {
        return false
      }
      if (integrationFilters.pointToPoint === 'true' && !p2p) return false
      if (integrationFilters.pointToPoint === 'false' && p2p) return false
      if (integrationFilters.reusabilityStatus && i.reusabilityStatus !== integrationFilters.reusabilityStatus) {
        return false
      }
      if (integrationFilters.monitoringStatus && i.monitoringStatus !== integrationFilters.monitoringStatus) {
        return false
      }
      if (integrationFilters.missingOwner === 'true' && !ownerGap) return false
      if (q) {
        const hay = `${i.name} ${i.apiOrInterfaceName} ${i.protocol} ${i.integrationType}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [enriched, integrationFilters])

  const sorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      let ka
      let kb
      if (sort.key === 'risk') {
        ka = a.risk
        kb = b.risk
      } else if (sort.key === 'name') {
        ka = a.int.name
        kb = b.int.name
      } else if (sort.key === 'source') {
        ka = a.sourceName
        kb = b.sourceName
      } else if (sort.key === 'target') {
        ka = a.targetName
        kb = b.targetName
      } else if (sort.key === 'consumers') {
        ka = a.int.consumerCount
        kb = b.int.consumerCount
      } else {
        ka = a.int[sort.key]
        kb = b.int[sort.key]
      }
      if (ka === kb) return 0
      const cmp = ka > kb ? 1 : -1
      return sort.dir === 'asc' ? cmp : -cmp
    })
    return list
  }, [filtered, sort])

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const pageSafe = Math.min(page, pageCount - 1)
  const pageRows = sorted.slice(pageSafe * PAGE_SIZE, pageSafe * PAGE_SIZE + PAGE_SIZE)

  const topology = useMemo(() => {
    if (!scenario) return { nodes: [], edges: [] }
    const focusIds = scenario.topologyFocusIntegrationIds || []
    const focusInts = focusIds.map((id) => repo.getIntegration(id)).filter(Boolean)
    const appIds = new Set()
    focusInts.forEach((i) => {
      appIds.add(i.sourceApplicationId)
      appIds.add(i.targetApplicationId)
    })
    const nodes = [...appIds]
      .map((id) => repo.getApplication(id))
      .filter(Boolean)
      .map((a, idx) => {
        const n = appIds.size
        const angle = (idx / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2
        const cx = 220
        const cy = 160
        const r = Math.min(120, 40 + n * 8)
        return {
          id: a.id,
          name: a.name,
          criticality: a.criticality,
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
        }
      })
    const nodeMap = new Map(nodes.map((n) => [n.id, n]))
    const edges = focusInts
      .filter((i) => nodeMap.has(i.sourceApplicationId) && nodeMap.has(i.targetApplicationId))
      .map((i) => ({
        id: i.id,
        name: i.name,
        source: i.sourceApplicationId,
        target: i.targetApplicationId,
        p2p: isPointToPoint(i),
        criticality: i.criticality,
      }))
    return { nodes, edges }
  }, [scenario, repo])

  const typeChart = useMemo(
    () => ({
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          data: types.map((t, i) => ({
            name: t.type,
            value: t.count,
            itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
          })),
          label: { fontSize: 11 },
        },
      ],
    }),
    [types],
  )

  const reuseChart = useMemo(() => {
    const reusable = metrics.reusableApiCount
    const p2p = metrics.pointToPointCount
    const other = Math.max(0, metrics.totalIntegrations - reusable - p2p)
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 40, right: 16, top: 24, bottom: 32 },
      xAxis: { type: 'category', data: ['Reusable API', 'Point-to-point', 'Other'] },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'bar',
          data: [
            { value: reusable, itemStyle: { color: '#1E8CAA' } },
            { value: p2p, itemStyle: { color: '#C47B2C' } },
            { value: other, itemStyle: { color: '#6B7280' } },
          ],
          barWidth: 36,
        },
      ],
    }
  }, [metrics])

  const concentrationChart = useMemo(
    () => ({
      tooltip: { trigger: 'axis' },
      grid: { left: 12, right: 16, top: 16, bottom: 64, containLabel: true },
      xAxis: {
        type: 'category',
        data: concentration.map((c) => c.application.name),
        axisLabel: { rotate: 28, fontSize: 10 },
      },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          type: 'bar',
          data: concentration.map((c) => c.count),
          itemStyle: { color: '#52CFE4' },
          barWidth: 22,
        },
      ],
    }),
    [concentration],
  )

  const coverageChart = useMemo(() => {
    const documented = integrations.filter((i) => i.documentationStatus === 'documented').length
    const partialDoc = integrations.filter((i) => i.documentationStatus === 'partial').length
    const missingDoc = integrations.filter((i) => i.documentationStatus === 'missing').length
    const monitored = integrations.filter((i) => i.monitoringStatus === 'monitored').length
    const partialMon = integrations.filter((i) => i.monitoringStatus === 'partial').length
    const unmon = integrations.filter((i) => i.monitoringStatus === 'unmonitored').length
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['Documented / Monitored', 'Partial', 'Missing / Unmonitored'], bottom: 0 },
      grid: { left: 40, right: 16, top: 24, bottom: 48 },
      xAxis: { type: 'category', data: ['Documentation', 'Monitoring'] },
      yAxis: { type: 'value', minInterval: 1 },
      series: [
        {
          name: 'Documented / Monitored',
          type: 'bar',
          stack: 'cov',
          data: [documented, monitored],
          itemStyle: { color: '#1E8CAA' },
        },
        {
          name: 'Partial',
          type: 'bar',
          stack: 'cov',
          data: [partialDoc, partialMon],
          itemStyle: { color: '#C47B2C' },
        },
        {
          name: 'Missing / Unmonitored',
          type: 'bar',
          stack: 'cov',
          data: [missingDoc, unmon],
          itemStyle: { color: '#B42318' },
        },
      ],
    }
  }, [integrations])

  function applyInsightFilter(filter) {
    setPage(0)
    setIntegrationFilters({
      search: '',
      integrationType: '',
      criticality: '',
      lifecycleStatus: '',
      pointToPoint: '',
      reusabilityStatus: '',
      monitoringStatus: '',
      missingOwner: '',
      ...filter,
    })
  }

  function openIntegration(id) {
    selectEntity({ id, type: 'integration' })
  }

  function openApplication(id) {
    selectEntity({ id, type: 'application' })
  }

  function openExplorer() {
    if (scenario) {
      setGraphRoot({ id: scenario.startingEntityId, type: scenario.startingEntityType })
      setScenarioId(scenario.id)
    }
    setView('explorer')
    window.location.hash = 'explorer'
  }

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' },
    )
  }

  const kpiCards = [
    {
      id: 'total',
      label: 'Total integrations',
      value: metrics.totalIntegrations,
      filter: {},
    },
    {
      id: 'p2p',
      label: 'Point-to-point %',
      value: `${metrics.pointToPointPercentage}%`,
      filter: { pointToPoint: 'true' },
    },
    {
      id: 'reuse',
      label: 'API reuse rate',
      value: `${metrics.apiReuseRate}%`,
      filter: { reusabilityStatus: 'reusable' },
    },
    {
      id: 'critical',
      label: 'Critical / high',
      value: metrics.criticalIntegrationCount,
      filter: { criticality: 'critical' },
    },
    {
      id: 'unmon',
      label: 'Unmonitored',
      value: metrics.unmonitoredIntegrationCount,
      filter: { monitoringStatus: 'unmonitored' },
    },
    {
      id: 'owners',
      label: 'Missing owners',
      value: metrics.missingOwnerCount,
      filter: { missingOwner: 'true' },
    },
  ]

  return (
    <section className="view active">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Diagnose · Integration Landscape</div>
            <h1 className="page-title">Integration &amp; API intelligence</h1>
            <p>
              Derived reuse, point-to-point concentration and monitoring coverage from synthetic GRA
              interface records — with curated topology for the active decision scenario.
            </p>
          </div>
        </div>

        <div className="int-kpi-grid">
          {kpiCards.map((k) => (
            <button
              key={k.id}
              type="button"
              className="int-kpi-card"
              onClick={() => applyInsightFilter(k.filter)}
            >
              <span>{k.label}</span>
              <strong>{k.value}</strong>
            </button>
          ))}
        </div>

        {insights.length > 0 && (
          <div className="int-insight-row">
            {insights.map((ins) => (
              <button
                key={ins.id}
                type="button"
                className="int-insight-card"
                onClick={() => applyInsightFilter(ins.filter)}
              >
                <strong>{ins.title}</strong>
                <span>{ins.body}</span>
              </button>
            ))}
          </div>
        )}

        <div className="viz-card topology-card" data-demo-target="integration-topology">
          <div className="viz-head">
            <div>
              <h3 className="section-title">Curated scenario topology</h3>
              <p>
                {scenario
                  ? `${scenario.name} — apps as nodes, focus integrations as edges.`
                  : 'No scenario available.'}
              </p>
            </div>
            <div className="topology-controls">
              <label className="field">
                <span>Scenario</span>
                <select
                  value={scenario?.id || ''}
                  onChange={(e) => setScenarioId(e.target.value)}
                  aria-label="Integration scenario"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="btn secondary-button" onClick={openExplorer}>
                Open in Relationship Explorer
              </button>
            </div>
          </div>
          {scenario && (
            <div className="scenario-narrative">
              <p>{scenario.summary}</p>
              <p className="sub">
                <strong>Key risk:</strong> {scenario.keyRisk}
              </p>
              <p className="sub">
                <strong>Recommended action:</strong> {scenario.recommendedAction}
              </p>
            </div>
          )}
          <div className="topology-canvas" role="img" aria-label="Scenario integration topology">
            {topology.nodes.length ? (
              <svg viewBox="0 0 440 320" className="topology-svg">
                {topology.edges.map((e) => {
                  const s = topology.nodes.find((n) => n.id === e.source)
                  const t = topology.nodes.find((n) => n.id === e.target)
                  if (!s || !t) return null
                  return (
                    <g key={e.id}>
                      <line
                        x1={s.x}
                        y1={s.y}
                        x2={t.x}
                        y2={t.y}
                        className={`topo-edge${e.p2p ? ' p2p' : ''}`}
                        onClick={() => openIntegration(e.id)}
                      />
                      <title>{e.name}</title>
                    </g>
                  )
                })}
                {topology.nodes.map((n) => (
                  <g
                    key={n.id}
                    className="topo-node"
                    onClick={() => openApplication(n.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle cx={n.x} cy={n.y} r={22} />
                    <text x={n.x} y={n.y + 36} textAnchor="middle">
                      {n.name.length > 18 ? `${n.name.slice(0, 16)}…` : n.name}
                    </text>
                    <title>{n.name}</title>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="empty-state">No topology integrations for this scenario.</div>
            )}
            <div className="topology-legend">
              <span>
                <i className="leg-line" /> Reusable / hub path
              </span>
              <span>
                <i className="leg-line p2p" /> Point-to-point
              </span>
              <span>Click node → application · Click edge → integration</span>
            </div>
          </div>
        </div>

        <div className="overview-grid int-charts">
          <div className="viz-card">
            <div className="viz-head">
              <div>
                <h3 className="section-title">Integration type distribution</h3>
                <p>Count by interface type across the GRA landscape.</p>
              </div>
            </div>
            <ReactECharts option={typeChart} style={{ height: 280 }} />
          </div>
          <div className="viz-card">
            <div className="viz-head">
              <div>
                <h3 className="section-title">Reusable API vs point-to-point</h3>
                <p>Reuse rate {metrics.apiReuseRate}% · P2P {metrics.pointToPointPercentage}%.</p>
              </div>
            </div>
            <ReactECharts option={reuseChart} style={{ height: 280 }} />
          </div>
          <div className="viz-card">
            <div className="viz-head">
              <div>
                <h3 className="section-title">Applications with most dependencies</h3>
                <p>Top 8 by source + target interface count.</p>
              </div>
            </div>
            <ReactECharts
              option={concentrationChart}
              style={{ height: 280 }}
              onEvents={{
                click: (params) => {
                  const row = concentration[params.dataIndex]
                  if (row) openApplication(row.application.id)
                },
              }}
            />
          </div>
          <div className="viz-card">
            <div className="viz-head">
              <div>
                <h3 className="section-title">Documentation &amp; monitoring coverage</h3>
                <p>
                  Undocumented {metrics.undocumentedIntegrationCount} · Unmonitored{' '}
                  {metrics.unmonitoredIntegrationCount}.
                </p>
              </div>
            </div>
            <ReactECharts option={coverageChart} style={{ height: 280 }} />
          </div>
        </div>

        <div className="intel-toolbar">
          <label className="field grow">
            <span>Search</span>
            <input
              type="search"
              value={integrationFilters.search}
              onChange={(e) => {
                setPage(0)
                setIntegrationFilters({ search: e.target.value })
              }}
              placeholder="Search integrations"
              aria-label="Search integrations"
            />
          </label>
          <label className="field">
            <span>Type</span>
            <select
              value={integrationFilters.integrationType}
              onChange={(e) => {
                setPage(0)
                setIntegrationFilters({ integrationType: e.target.value })
              }}
            >
              <option value="">All</option>
              {[...new Set(integrations.map((i) => i.integrationType))].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Criticality</span>
            <select
              value={integrationFilters.criticality}
              onChange={(e) => {
                setPage(0)
                setIntegrationFilters({ criticality: e.target.value })
              }}
            >
              <option value="">All</option>
              {['critical', 'high', 'medium', 'low'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Lifecycle</span>
            <select
              value={integrationFilters.lifecycleStatus}
              onChange={(e) => {
                setPage(0)
                setIntegrationFilters({ lifecycleStatus: e.target.value })
              }}
            >
              <option value="">All</option>
              {['Planned', 'Active', 'Restricted', 'Deprecated', 'Retiring'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>P2P</span>
            <select
              value={integrationFilters.pointToPoint}
              onChange={(e) => {
                setPage(0)
                setIntegrationFilters({ pointToPoint: e.target.value })
              }}
            >
              <option value="">All</option>
              <option value="true">Point-to-point</option>
              <option value="false">Not P2P</option>
            </select>
          </label>
          <label className="field">
            <span>Reuse</span>
            <select
              value={integrationFilters.reusabilityStatus}
              onChange={(e) => {
                setPage(0)
                setIntegrationFilters({ reusabilityStatus: e.target.value })
              }}
            >
              <option value="">All</option>
              {['reusable', 'candidate', 'point-to-point', 'unknown'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Monitoring</span>
            <select
              value={integrationFilters.monitoringStatus}
              onChange={(e) => {
                setPage(0)
                setIntegrationFilters({ monitoringStatus: e.target.value })
              }}
            >
              <option value="">All</option>
              {['monitored', 'partial', 'unmonitored'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Owners</span>
            <select
              value={integrationFilters.missingOwner}
              onChange={(e) => {
                setPage(0)
                setIntegrationFilters({ missingOwner: e.target.value })
              }}
            >
              <option value="">All</option>
              <option value="true">Missing owner</option>
            </select>
          </label>
        </div>

        <div className="viz-card">
          <div className="viz-head">
            <div>
              <h3 className="section-title">Integration inventory</h3>
              <p>
                Showing {sorted.length} of {integrations.length} interfaces · avg risk{' '}
                {metrics.averageIntegrationRisk}.
              </p>
            </div>
          </div>

          <div className="tablewrap portfolio-table-desktop int-table-desktop">
            {!pageRows.length ? (
              <div className="empty-state">No integrations match filters.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    {[
                      ['name', 'Integration'],
                      ['source', 'Source'],
                      ['target', 'Target'],
                      ['integrationType', 'Type'],
                      ['criticality', 'Criticality'],
                      ['lifecycleStatus', 'Lifecycle'],
                      ['reusabilityStatus', 'Reuse'],
                      ['consumers', 'Consumers'],
                      ['risk', 'Risk'],
                    ].map(([key, label]) => (
                      <th key={key}>
                        <button type="button" className="th-sort" onClick={() => toggleSort(key)}>
                          {label}
                          {sort.key === key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(({ int: i, risk, sourceName, targetName, p2p }) => (
                    <tr
                      key={i.id}
                      className="row-click"
                      onClick={() => openIntegration(i.id)}
                    >
                      <td>
                        <strong>{i.name}</strong>
                        <div className="sub">
                          {i.apiOrInterfaceName}
                          {p2p ? ' · P2P' : ''}
                        </div>
                      </td>
                      <td>{sourceName}</td>
                      <td>{targetName}</td>
                      <td>{i.integrationType}</td>
                      <td>{i.criticality}</td>
                      <td>{i.lifecycleStatus}</td>
                      <td>{i.reusabilityStatus}</td>
                      <td>{i.consumerCount}</td>
                      <td>{risk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="portfolio-mobile int-mobile">
            {pageRows.map(({ int: i, risk, sourceName, targetName, p2p }) => (
              <button
                key={i.id}
                type="button"
                className="mobile-cap-card int-mobile-card"
                onClick={() => openIntegration(i.id)}
              >
                <div>
                  <strong>{i.name}</strong>
                  <span>
                    {i.integrationType} · Risk {risk}
                    {p2p ? ' · P2P' : ''}
                  </span>
                  <span>
                    {sourceName} → {targetName}
                  </span>
                </div>
              </button>
            ))}
            {!pageRows.length && <div className="empty-state">No integrations match filters.</div>}
          </div>

          <div className="pager">
            <button
              type="button"
              className="btn secondary-button"
              disabled={pageSafe <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </button>
            <span>
              Page {pageSafe + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="btn secondary-button"
              disabled={pageSafe >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
