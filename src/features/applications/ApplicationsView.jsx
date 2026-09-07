import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { usePrototypeStore } from '../../state/prototypeStore'
import {
  classifyTIME,
  costBandWeight,
  explainTIME,
  portfolioInsights,
} from '../../domain/metrics/portfolio'
import ExplainButton from '../ai-assist/ExplainButton'

const PAGE_SIZE = 8

const TIME_COLORS = {
  Invest: '#1E8CAA',
  Tolerate: '#6B7280',
  Migrate: '#C47B2C',
  Eliminate: '#B42318',
}

export default function ApplicationsView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const portfolioFilters = usePrototypeStore((s) => s.portfolioFilters)
  const setPortfolioFilters = usePrototypeStore((s) => s.setPortfolioFilters)
  const setView = usePrototypeStore((s) => s.setView)
  const [page, setPage] = useState(0)
  const [sort, setSort] = useState({ key: 'businessValue', dir: 'desc' })

  const packApps = repo.listApplications()
  const caps = repo.listCapabilities()
  const integrations = repo.listIntegrations()
  const findings = repo.listFindings()

  const insights = useMemo(
    () =>
      portfolioInsights({
        applications: packApps,
        integrations,
        findings,
        capabilities: caps,
      }),
    [packApps, integrations, findings, caps],
  )

  const ctx = insights.ctx

  const enriched = useMemo(
    () =>
      packApps.map((app) => {
        const time = classifyTIME(app, ctx)
        return {
          app,
          time,
          explain: explainTIME(app, time, ctx),
          findingCount: repo.findingsForApplication(app.id).length,
          action:
            time === 'Invest'
              ? 'Scale / strengthen'
              : time === 'Migrate'
                ? 'Plan migration'
                : time === 'Eliminate'
                  ? 'Retire / consolidate'
                  : 'Monitor',
        }
      }),
    [packApps, ctx, repo],
  )

  const filtered = useMemo(() => {
    const q = portfolioFilters.search.trim().toLowerCase()
    return enriched.filter(({ app, time }) => {
      if (portfolioFilters.capabilityId && !app.supportedCapabilityIds.includes(portfolioFilters.capabilityId)) {
        return false
      }
      if (portfolioFilters.criticality && app.criticality !== portfolioFilters.criticality) return false
      if (portfolioFilters.lifecycle && app.lifecycle !== portfolioFilters.lifecycle) return false
      if (portfolioFilters.timeClass && time !== portfolioFilters.timeClass) return false
      if (q) {
        const hay = `${app.name} ${app.vendorProduct} ${app.businessOwnerId}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [enriched, portfolioFilters])

  const sorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      let ka
      let kb
      if (sort.key === 'time') {
        ka = a.time
        kb = b.time
      } else if (sort.key === 'findingCount') {
        ka = a.findingCount
        kb = b.findingCount
      } else if (sort.key === 'name') {
        ka = a.app.name
        kb = b.app.name
      } else {
        ka = a.app[sort.key]
        kb = b.app[sort.key]
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

  const bubbleOption = useMemo(() => {
    const data = filtered.map(({ app, time }) => ({
      name: app.name,
      value: [
        app.technicalHealth,
        app.businessValue,
        costBandWeight(app.annualCostBand) * 12 + app.userReach * 4,
        app.id,
      ],
      time,
      itemStyle: { color: TIME_COLORS[time] },
    }))
    return {
      grid: { left: 48, right: 24, top: 24, bottom: 48 },
      tooltip: {
        formatter: (p) => {
          const row = filtered.find((f) => f.app.id === p.data.value[3])
          if (!row) return p.name
          return [
            `<strong>${row.app.name}</strong>`,
            `TIME: ${row.time}`,
            `Value ${row.app.businessValue} · Health ${row.app.technicalHealth}`,
            `Cost ${row.app.annualCostBand} · Reach ${row.app.userReach}`,
            row.explain,
          ].join('<br/>')
        },
      },
      xAxis: {
        name: 'Technical health (1–5)',
        nameLocation: 'middle',
        nameGap: 28,
        min: 1,
        max: 5,
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } },
      },
      yAxis: {
        name: 'Business value (1–5)',
        nameLocation: 'middle',
        nameGap: 36,
        min: 1,
        max: 5,
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } },
      },
      series: [
        {
          type: 'scatter',
          symbolSize: (val) => Math.max(12, Math.min(42, val[2])),
          data,
        },
      ],
    }
  }, [filtered])

  const timeSummary = useMemo(() => {
    return (['Invest', 'Tolerate', 'Migrate', 'Eliminate']).map((key) => {
      const list = insights.timeBuckets[key]
      const cost = list.reduce((s, a) => s + costBandWeight(a.annualCostBand), 0)
      const critical = list.filter((a) => a.criticality === 'critical' || a.criticality === 'high')
      return { key, count: list.length, cost, critical, action: recommendedAction(key) }
    })
  }, [insights])

  function openApp(id) {
    selectEntity({ id, type: 'application' })
  }

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' },
    )
  }

  return (
    <section className="view active">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Understand · Application Portfolio</div>
            <h1 className="page-title">Application portfolio intelligence</h1>
            <p>
              TIME classification, value-versus-health positioning and evidence-based duplication /
              obsolescence insights from synthetic GRA records.
            </p>
          </div>
        </div>

        <div className="intel-toolbar">
          <label className="field grow">
            <span>Search</span>
            <input
              type="search"
              value={portfolioFilters.search}
              onChange={(e) => {
                setPage(0)
                setPortfolioFilters({ search: e.target.value })
              }}
              placeholder="Search applications"
              aria-label="Search applications"
            />
          </label>
          <label className="field">
            <span>Capability</span>
            <select
              value={portfolioFilters.capabilityId}
              onChange={(e) => {
                setPage(0)
                setPortfolioFilters({ capabilityId: e.target.value })
              }}
            >
              <option value="">All</option>
              {caps.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Criticality</span>
            <select
              value={portfolioFilters.criticality}
              onChange={(e) => {
                setPage(0)
                setPortfolioFilters({ criticality: e.target.value })
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
              value={portfolioFilters.lifecycle}
              onChange={(e) => {
                setPage(0)
                setPortfolioFilters({ lifecycle: e.target.value })
              }}
            >
              <option value="">All</option>
              {['invest', 'tolerate', 'migrate', 'eliminate', 'strategic', 'legacy'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>TIME</span>
            <select
              value={portfolioFilters.timeClass}
              onChange={(e) => {
                setPage(0)
                setPortfolioFilters({ timeClass: e.target.value })
              }}
            >
              <option value="">All</option>
              {['Invest', 'Tolerate', 'Migrate', 'Eliminate'].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="time-grid">
          {timeSummary.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`time-card time-${t.key.toLowerCase()}${portfolioFilters.timeClass === t.key ? ' active' : ''}`}
              onClick={() =>
                setPortfolioFilters({
                  timeClass: portfolioFilters.timeClass === t.key ? '' : t.key,
                })
              }
            >
              <div className="time-label">{t.key}</div>
              <strong>{t.count}</strong>
              <span>apps · cost weight {t.cost}</span>
              <span>{t.critical.length} critical/high</span>
              <em>{t.action}</em>
            </button>
          ))}
        </div>
        <div className="chip-row" style={{ marginBottom: '0.75rem' }}>
          <ExplainButton
            metricKey="time"
            query="Explain TIME classification"
            contextEntityIds={
              portfolioFilters.timeClass
                ? enriched
                    .filter((r) => r.time === portfolioFilters.timeClass)
                    .slice(0, 1)
                    .map((r) => r.app.id)
                : enriched.slice(0, 1).map((r) => r.app.id)
            }
            label="Explain TIME"
          />
        </div>

        <div className="overview-grid">
          <div className="viz-card">
            <div className="viz-head">
              <div>
                <h3 className="section-title">Which high-value applications are technically weak?</h3>
                <p>
                  X = technical health (1–5), Y = business value (1–5). Bubble size = cost band × reach.
                  Colour = TIME. Click a bubble for application detail.
                </p>
              </div>
              <div className="heatmap-legend">
                {Object.entries(TIME_COLORS).map(([k, c]) => (
                  <span key={k} className="leg" style={{ borderColor: c, color: c }}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
            {filtered.length ? (
              <ReactECharts
                option={bubbleOption}
                style={{ height: 360 }}
                onEvents={{
                  click: (params) => {
                    const id = params?.data?.value?.[3]
                    if (id) openApp(id)
                  },
                }}
              />
            ) : (
              <div className="empty-state">No applications match the current filters.</div>
            )}
          </div>

          <div className="viz-card">
            <div className="viz-head">
              <div>
                <h3 className="section-title">Portfolio insights from records</h3>
                <p>Evidence-linked duplication, EOS and cost/value pressures — not generic narrative.</p>
              </div>
            </div>
            <ul className="insight-list">
              <InsightBlock
                title="Likely duplicate clusters"
                items={insights.duplicates.flatMap((d) => d.applications)}
                onOpen={openApp}
                empty="No duplication clusters in seed."
              />
              <InsightBlock
                title="End-of-support within 24 months"
                items={insights.endOfSupport}
                onOpen={openApp}
                empty="No near-term EOS records."
              />
              <InsightBlock
                title="High-cost / low-value"
                items={insights.highCostLowValue}
                onOpen={openApp}
                empty="None in current seed."
              />
              <InsightBlock
                title="Critical apps with weak health"
                items={insights.weakCritical}
                onOpen={openApp}
                empty="None in current seed."
              />
              <InsightBlock
                title="Heavy point-to-point integrations"
                items={insights.heavyP2P}
                onOpen={openApp}
                empty="None in current seed."
              />
            </ul>
            <button
              type="button"
              className="btn secondary-button"
              style={{ marginTop: '0.75rem' }}
              onClick={() => {
                setView('capabilities')
                window.location.hash = 'capabilities'
              }}
            >
              Open capability intelligence
            </button>
          </div>
        </div>

        <div className="viz-card" style={{ marginTop: '1rem' }}>
          <div className="viz-head">
            <div>
              <h3 className="section-title">Portfolio table</h3>
              <p>
                Sortable inventory with TIME and recommended action. Showing {sorted.length} of{' '}
                {packApps.length} applications.
              </p>
            </div>
          </div>

          <div className="tablewrap portfolio-table-desktop">
            {!pageRows.length ? (
              <div className="empty-state">No rows match filters.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    {[
                      ['name', 'Application'],
                      ['businessOwnerId', 'Business owner'],
                      ['businessValue', 'Value'],
                      ['technicalHealth', 'Health'],
                      ['criticality', 'Criticality'],
                      ['lifecycle', 'Lifecycle'],
                      ['time', 'TIME'],
                      ['findingCount', 'Findings'],
                    ].map(([key, label]) => (
                      <th key={key}>
                        <button type="button" className="th-sort" onClick={() => toggleSort(key)}>
                          {label}
                          {sort.key === key ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''}
                        </button>
                      </th>
                    ))}
                    <th>Capabilities</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(({ app, time, findingCount, action }) => (
                    <tr
                      key={app.id}
                      className="row-click"
                      onClick={() => openApp(app.id)}
                    >
                      <td>
                        <strong>{app.name}</strong>
                        <div className="sub">{app.vendorProduct}</div>
                      </td>
                      <td>{app.businessOwnerId.replace('person-', '')}</td>
                      <td>{app.businessValue}</td>
                      <td>{app.technicalHealth}</td>
                      <td>{app.criticality}</td>
                      <td>{app.lifecycle}</td>
                      <td>
                        <span className={`time-pill time-${time.toLowerCase()}`}>{time}</span>
                      </td>
                      <td>{findingCount}</td>
                      <td>
                        {app.supportedCapabilityIds
                          .slice(0, 2)
                          .map((id) => caps.find((c) => c.id === id)?.name || id)
                          .join(', ')}
                        {app.supportedCapabilityIds.length > 2 ? '…' : ''}
                      </td>
                      <td>{action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="portfolio-mobile">
            {pageRows.map(({ app, time, action, findingCount }) => (
              <button
                key={app.id}
                type="button"
                className="mobile-cap-card"
                onClick={() => openApp(app.id)}
              >
                <div>
                  <strong>{app.name}</strong>
                  <span>
                    {time} · Value {app.businessValue} · Health {app.technicalHealth}
                  </span>
                  <span>
                    {findingCount} findings · {action}
                  </span>
                </div>
              </button>
            ))}
            {!pageRows.length && <div className="empty-state">No applications match filters.</div>}
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

function InsightBlock({ title, items, onOpen, empty }) {
  return (
    <li>
      <strong>{title}</strong>
      {items.length ? (
        <div className="chip-row">
          {items.map((a) => (
            <button
              key={a.id}
              type="button"
              className="link-chip"
              onClick={() => onOpen(a.id)}
            >
              {a.name}
            </button>
          ))}
        </div>
      ) : (
        <span className="sub">{empty}</span>
      )}
    </li>
  )
}

function recommendedAction(time) {
  switch (time) {
    case 'Invest':
      return 'Fund modernisation / scale'
    case 'Tolerate':
      return 'Maintain with monitoring'
    case 'Migrate':
      return 'Plan target-state move'
    case 'Eliminate':
      return 'Retire or consolidate'
    default:
      return ''
  }
}
