import { useMemo, useState } from 'react'
import { usePrototypeStore, getTenantConfig } from '../../state/prototypeStore'
import { deriveIntegrationMetrics } from '../../domain/metrics/integration'

const SECTION_DEFS = [
  { id: 'cover', label: 'Cover' },
  { id: 'summary', label: 'Executive summary' },
  { id: 'health', label: 'Enterprise health' },
  { id: 'alignment', label: 'Strategic alignment' },
  { id: 'capability', label: 'Capability position' },
  { id: 'applications', label: 'Application and technology exposure' },
  { id: 'integration', label: 'Integration and resilience risks' },
  { id: 'findings', label: 'Priority findings' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'decisions', label: 'Decisions required' },
  { id: 'roadmap', label: 'Transformation roadmap' },
  { id: 'value', label: 'Expected value and risk reduction' },
  { id: 'kpi', label: 'KPI outlook' },
  { id: 'limitations', label: 'Evidence limitations' },
  { id: 'disclaimer', label: 'Synthetic-data disclaimer' },
]

const DEFAULT_SECTIONS = SECTION_DEFS.map((s) => s.id)

export default function ExecutiveReport({ onNavigate }) {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const role = usePrototypeStore((s) => s.role)
  const filters = usePrototypeStore((s) => s.filters)
  const setFilters = usePrototypeStore((s) => s.setFilters)
  const briefingPreferences = usePrototypeStore((s) => s.briefingPreferences)
  const setBriefingPreferences = usePrototypeStore((s) => s.setBriefingPreferences)
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const tenant = repo.getTenant()
  const metrics = useMemo(() => repo.getExecutiveMetrics(), [repo])
  const intMetrics = useMemo(() => deriveIntegrationMetrics(repo.listIntegrations()), [repo])
  const objectives = repo.listObjectives()
  const capabilities = repo.listCapabilities()
  const applications = repo.listApplications()
  const findings = [...repo.listFindings()].sort((a, b) => {
    const rank = { critical: 0, high: 1, medium: 2, low: 3 }
    return (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9)
  })
  const recommendations = repo.listRecommendations()
  const decisions = usePrototypeStore
    .getState()
    .listDecisions()
    .filter((d) => ['Pending', 'Deferred'].includes(d.decisionStatus || d.status))
  const initiatives = repo.listInitiatives()
  const kpis = repo.listKpis()

  const [included, setIncluded] = useState(() => new Set(DEFAULT_SECTIONS))
  const [domainFilter, setDomainFilter] = useState('')
  const [objectiveId, setObjectiveId] = useState('')
  const [copied, setCopied] = useState(false)

  const roleLabel =
    config.roleLabels.find((r) => r.id === role)?.label || briefingPreferences.role || role

  const filteredFindings = findings.filter((f) => {
    if (!domainFilter) return true
    const caps = (f.linkedObjectIds || []).filter((id) => id.startsWith('cap-'))
    return caps.some((id) => {
      const c = capabilities.find((x) => x.id === id)
      return c?.domain === domainFilter
    })
  })

  const summaryText = useMemo(() => {
    const top = filteredFindings[0]
    const pending = decisions.length
    return [
      `${tenant.displayName || tenant.name} (${tenant.shortName}) — ${filters.period}.`,
      `Enterprise health ${metrics.enterpriseHealth}/100; architecture maturity ${metrics.architectureMaturity}/5; application health ${metrics.applicationHealth}/5.`,
      `${metrics.openFindings} open findings (${metrics.criticalRiskCount} critical). Point-to-point concentration ${intMetrics.pointToPointPercentage}%.`,
      top
        ? `Priority finding: ${top.name}. Recommended next step is governed remediation via the linked recommendation and roadmap initiative.`
        : 'No priority finding in the current filter.',
      `${pending} decision(s) require Architecture / Portfolio Review Board attention.`,
      'Figures are indicative and derived from synthetic demonstration data.',
    ].join(' ')
  }, [
    tenant,
    filters.period,
    metrics,
    intMetrics,
    filteredFindings,
    decisions.length,
  ])

  function toggleSection(id) {
    setIncluded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function show(id) {
    return included.has(id)
  }

  function copySummary() {
    navigator.clipboard?.writeText(summaryText).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function openEntity(id, type) {
    selectEntity({ id, type })
  }

  const domains = [...new Set(capabilities.map((c) => c.domain).filter(Boolean))]

  return (
    <section className="view active report-view">
      <div className="report-toolbar no-print">
        <div>
          <h1 className="page-title">Executive Report</h1>
          <p className="page-desc">
            Data-driven briefing for {tenant.shortName}. Configure sections, then print or save as PDF.
          </p>
        </div>
        <div className="report-toolbar-actions">
          <button type="button" className="btn secondary-button" onClick={copySummary}>
            {copied ? 'Copied' : 'Copy executive summary'}
          </button>
          <button type="button" className="btn primary primary-button" onClick={() => window.print()}>
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="report-config no-print viz-card">
        <h3 className="section-title">Report configuration</h3>
        <div className="report-config-grid">
          <label>
            <span>Tenant</span>
            <input readOnly value={config.displayName} />
          </label>
          <label>
            <span>Executive role</span>
            <input readOnly value={roleLabel} />
          </label>
          <label>
            <span>Reporting period</span>
            <input
              value={filters.period}
              onChange={(e) => {
                setFilters({ period: e.target.value })
                setBriefingPreferences({ period: e.target.value })
              }}
            />
          </label>
          <label>
            <span>Business domain</span>
            <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)}>
              <option value="">All domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Strategic objective</span>
            <select value={objectiveId} onChange={(e) => setObjectiveId(e.target.value)}>
              <option value="">All objectives</option>
              {objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="report-section-toggles">
          {SECTION_DEFS.map((s) => (
            <label key={s.id} className="demo-check">
              <input
                type="checkbox"
                checked={included.has(s.id)}
                onChange={() => toggleSection(s.id)}
              />
              <span>{s.label}</span>
            </label>
          ))}
        </div>
      </div>

      <article className="executive-report print-friendly" id="executive-report">
        {show('cover') && (
          <section className="report-page report-cover">
            <p className="report-kicker">EA360 · Kulana</p>
            <h1>Executive Report</h1>
            <h2>{tenant.displayName || tenant.name}</h2>
            <p>{config.storyline}</p>
            <dl className="report-meta">
              <div>
                <dt>Period</dt>
                <dd>{filters.period}</dd>
              </div>
              <div>
                <dt>Prepared for</dt>
                <dd>{roleLabel}</dd>
              </div>
              <div>
                <dt>Organisation type</dt>
                <dd>{tenant.tenantType || config.tenantType}</dd>
              </div>
            </dl>
          </section>
        )}

        {show('summary') && (
          <section className="report-page">
            <h2>Executive summary</h2>
            <p>{summaryText}</p>
          </section>
        )}

        {show('health') && (
          <section className="report-page">
            <h2>Enterprise health</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">Metric</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Enterprise health</td>
                  <td>{metrics.enterpriseHealth} / 100</td>
                </tr>
                <tr>
                  <td>Architecture maturity</td>
                  <td>{metrics.architectureMaturity} / 5</td>
                </tr>
                <tr>
                  <td>Application health</td>
                  <td>{metrics.applicationHealth} / 5</td>
                </tr>
                <tr>
                  <td>Strategic alignment</td>
                  <td>{metrics.strategicAlignment}</td>
                </tr>
                <tr>
                  <td>Transformation progress</td>
                  <td>{metrics.transformationProgress}%</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {show('alignment') && (
          <section className="report-page">
            <h2>Strategic alignment</h2>
            <ul className="report-list">
              {(objectiveId ? objectives.filter((o) => o.id === objectiveId) : objectives)
                .slice(0, 8)
                .map((o) => (
                  <li key={o.id}>
                    <strong>{o.name}</strong>
                    {o.description ? ` — ${o.description}` : ''}
                  </li>
                ))}
            </ul>
            {!objectives.length && <p>No strategic objectives in the active pack.</p>}
          </section>
        )}

        {show('capability') && (
          <section className="report-page">
            <h2>Capability position</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">Capability</th>
                  <th scope="col">Domain</th>
                  <th scope="col">Maturity</th>
                  <th scope="col">Risk</th>
                </tr>
              </thead>
              <tbody>
                {[...capabilities]
                  .filter((c) => !domainFilter || c.domain === domainFilter)
                  .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
                  .slice(0, 12)
                  .map((c) => (
                    <tr key={c.id}>
                      <td>
                        <button
                          type="button"
                          className="text-link no-print"
                          onClick={() => openEntity(c.id, 'capability')}
                        >
                          {c.name}
                        </button>
                        <span className="print-only">{c.name}</span>
                      </td>
                      <td>{c.domain}</td>
                      <td>{c.maturityScore ?? c.maturity ?? '—'}</td>
                      <td>{c.riskScore ?? '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        )}

        {show('applications') && (
          <section className="report-page">
            <h2>Application and technology exposure</h2>
            <p>
              Portfolio size {applications.length}. Average health {metrics.applicationHealth}/5.
              Time-class focus is available in the Application Portfolio.
            </p>
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">Application</th>
                  <th scope="col">Criticality</th>
                  <th scope="col">Lifecycle</th>
                  <th scope="col">Time class</th>
                </tr>
              </thead>
              <tbody>
                {[...applications]
                  .sort((a, b) => (b.criticality === 'critical') - (a.criticality === 'critical'))
                  .slice(0, 12)
                  .map((a) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td>{a.criticality || '—'}</td>
                      <td>{a.lifecycleStatus || a.lifecycle || '—'}</td>
                      <td>{a.timeClass || '—'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </section>
        )}

        {show('integration') && (
          <section className="report-page">
            <h2>Integration and resilience risks</h2>
            <ul className="report-list">
              <li>Integrations monitored: {intMetrics.totalCount ?? repo.listIntegrations().length}</li>
              <li>
                Point-to-point share: {intMetrics.pointToPointPercentage}% (
                {intMetrics.pointToPointCount} interfaces)
              </li>
              <li>Critical integrations: {intMetrics.criticalCount ?? '—'}</li>
            </ul>
          </section>
        )}

        {show('findings') && (
          <section className="report-page">
            <h2>Priority findings</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">Finding</th>
                  <th scope="col">Severity</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredFindings.slice(0, 10).map((f) => (
                  <tr key={f.id}>
                    <td>
                      <button
                        type="button"
                        className="text-link no-print"
                        onClick={() => {
                          openEntity(f.id, 'finding')
                          onNavigate?.('findings')
                        }}
                      >
                        {f.name}
                      </button>
                      <span className="print-only">{f.name}</span>
                    </td>
                    <td>{f.severity}</td>
                    <td>{f.workflowStatus || f.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {show('recommendations') && (
          <section className="report-page">
            <h2>Recommendations</h2>
            <ul className="report-list">
              {recommendations.slice(0, 8).map((r) => (
                <li key={r.id}>
                  <strong>{r.name}</strong> — {r.status || r.workflowStatus}
                  {r.summary ? `: ${r.summary}` : ''}
                </li>
              ))}
            </ul>
          </section>
        )}

        {show('decisions') && (
          <section className="report-page">
            <h2>Decisions required</h2>
            {decisions.length === 0 ? (
              <p>No pending decisions in the active tenant.</p>
            ) : (
              <ul className="report-list">
                {decisions.map((d) => (
                  <li key={d.id}>
                    <strong>{d.name || d.title || d.id}</strong> — {d.decisionStatus || d.status}
                    <button
                      type="button"
                      className="text-link no-print"
                      onClick={() => {
                        openEntity(d.id, 'decision')
                        onNavigate?.('governance')
                      }}
                    >
                      {' '}
                      Open
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {show('roadmap') && (
          <section className="report-page">
            <h2>Transformation roadmap</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">Initiative</th>
                  <th scope="col">Horizon</th>
                  <th scope="col">Quarter</th>
                  <th scope="col">Progress</th>
                </tr>
              </thead>
              <tbody>
                {initiatives.map((i) => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td>{i.horizon || '—'}</td>
                    <td>{i.targetQuarter || '—'}</td>
                    <td>{i.progressPercent != null ? `${i.progressPercent}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {show('value') && (
          <section className="report-page">
            <h2>Expected value and risk reduction</h2>
            <p>
              Indicative outcomes are derived from initiative value statements and linked findings.
              They are not guaranteed financial returns.
            </p>
            <ul className="report-list">
              {initiatives.slice(0, 6).map((i) => (
                <li key={i.id}>
                  <strong>{i.name}</strong>
                  {i.expectedValue || i.valueStatement
                    ? `: ${i.expectedValue || i.valueStatement}`
                    : ': Risk reduction and capability uplift (indicative).'}
                </li>
              ))}
            </ul>
          </section>
        )}

        {show('kpi') && (
          <section className="report-page">
            <h2>KPI outlook</h2>
            <table className="report-table">
              <thead>
                <tr>
                  <th scope="col">KPI</th>
                  <th scope="col">Current</th>
                  <th scope="col">Target</th>
                </tr>
              </thead>
              <tbody>
                {kpis.slice(0, 10).map((k) => (
                  <tr key={k.id}>
                    <td>{k.name}</td>
                    <td>{k.currentValue ?? k.value ?? '—'}</td>
                    <td>{k.targetValue ?? k.target ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!kpis.length && <p>No KPIs recorded for this tenant pack.</p>}
          </section>
        )}

        {show('limitations') && (
          <section className="report-page">
            <h2>Evidence limitations</h2>
            <ul className="report-list">
              <li>Evidence coverage varies by finding; disputed or incomplete items reduce confidence.</li>
              <li>AI-assisted narratives are grounded in the active tenant only and remain human-reviewed.</li>
              <li>Metrics are prototype-derived and may not reconcile to operational finance systems.</li>
            </ul>
          </section>
        )}

        {show('disclaimer') && (
          <section className="report-page report-disclaimer">
            <h2>Synthetic-data disclaimer</h2>
            <p>{config.syntheticDisclaimer}</p>
            <p>
              Synthetic demonstration data — not supplied or validated by the named institution.
            </p>
          </section>
        )}
      </article>
    </section>
  )
}
