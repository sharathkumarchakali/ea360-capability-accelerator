import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { getTenantConfig, usePrototypeStore } from '../../state/prototypeStore'
import { AI_LIFECYCLES, AUTONOMY_LABELS, governanceTone } from '../ai-automation/portfolioModel'
import {
  aiAutonomyRiskPoints,
  aiTypeLabel,
  approvalTone,
  computeGovernanceMetrics,
  dataCriticalityGapPoints,
  emptyGovAiFilters,
  emptyGovDataFilters,
  enrichAiForGovernance,
  enrichDataForGovernance,
  filterGovernanceAi,
  filterGovernanceData,
  getCatalog,
  governanceStatusTone,
  isDataDomain,
  mapDataGovStatus,
  resolveAiApprovalStatus,
} from './governanceModel'

function StatusTag({ children, tone }) {
  return <span className={`status-tag tone-${tone || 'muted'}`}>{children}</span>
}

function riskTone(r) {
  if (r === 'Critical' || r === 'High') return 'bad'
  if (r === 'Medium') return 'warn'
  return 'good'
}

function expiryClass(expiry) {
  if (!expiry) return ''
  const days = Math.round((Date.parse(expiry) - Date.parse('2026-09-07')) / 86400000)
  if (days < 0) return 'ageing-pill is-stale'
  if (days <= 45) return 'ageing-pill is-warn'
  return 'ageing-pill'
}

const TABS = [
  { id: 'ai', label: 'AI Governance' },
  { id: 'data', label: 'Data Governance' },
  { id: 'policies', label: 'Policies & Controls' },
  { id: 'approvals', label: 'Approvals & Exceptions' },
]

export default function AIDataGovernanceView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const catalog = useMemo(() => getCatalog(tenantCode), [tenantCode])

  const [tab, setTab] = useState('ai')
  const [aiFilters, setAiFilters] = useState(emptyGovAiFilters())
  const [dataFilters, setDataFilters] = useState(emptyGovDataFilters())
  const [policySearch, setPolicySearch] = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [approvalSearch, setApprovalSearch] = useState('')
  const [selectedPolicyId, setSelectedPolicyId] = useState(null)
  const [selectedApprovalId, setSelectedApprovalId] = useState(null)
  const [showAllAiMatrix, setShowAllAiMatrix] = useState(false)
  const [showAllDataMatrix, setShowAllDataMatrix] = useState(false)

  const orgName = config.shortName || config.displayName || tenantCode || 'Organisation'
  const syntheticDisclaimer =
    config.syntheticDisclaimer ||
    "Synthetic demonstration data — not an authoritative representation of the organisation's governance posture."

  const caps = repo.listCapabilities()
  const apps = repo.listApplications()
  const ints = repo.listIntegrations()
  const techs = repo.listTechnologies()
  const models = repo.listAiModels()
  const inits = repo.listInitiatives()

  const aiEnriched = useMemo(
    () =>
      repo.listAiSolutions().map((s) =>
        enrichAiForGovernance(s, {
          capabilities: caps,
          models,
          integrations: ints,
          applications: apps,
          technologies: techs,
        }),
      ),
    [repo, caps, models, ints, apps, techs],
  )

  const dataEnriched = useMemo(
    () =>
      repo
        .listDataObjects()
        .filter(isDataDomain)
        .map((d) =>
          enrichDataForGovernance(d, {
            applications: apps,
            capabilities: caps,
            initiatives: inits,
            integrations: ints,
          }),
        ),
    [repo, apps, caps, inits, ints],
  )

  const metrics = useMemo(
    () => computeGovernanceMetrics(aiEnriched, dataEnriched, catalog),
    [aiEnriched, dataEnriched, catalog],
  )

  const aiFiltered = useMemo(
    () => filterGovernanceAi(aiEnriched, aiFilters, catalog),
    [aiEnriched, aiFilters, catalog],
  )

  const dataFiltered = useMemo(
    () => filterGovernanceData(dataEnriched, dataFilters),
    [dataEnriched, dataFilters],
  )

  const aiRiskChart = useMemo(() => {
    const points = aiAutonomyRiskPoints(aiFiltered)
    const sample = showAllAiMatrix ? points : points.slice(0, 14)
    const data = sample.map((p) => ({
      name: p.name,
      value: [p.autonomy, p.riskScore, p.id],
      itemStyle: { color: p.flags.length ? '#B42318' : '#1E8CAA' },
    }))
    return {
      grid: { left: 52, right: 16, top: 28, bottom: 44 },
      tooltip: {
        formatter: (params) => {
          const p = sample.find((r) => r.id === params.data.value[2])
          if (!p) return params.name
          return [`<strong>${p.name}</strong>`, `Risk score ${p.riskScore}`, `Autonomy L${p.autonomy - 1}`, p.flags.join(' · ') || 'Within guardrails'].join('<br/>')
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
        name: 'Risk',
        nameLocation: 'middle',
        nameGap: 36,
        min: 0.5,
        max: 4.5,
        interval: 1,
        axisLabel: { formatter: (v) => ({ 1: 'Low', 2: 'Med', 3: 'High', 4: 'Crit' }[v] || '') },
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } },
      },
      series: [{ type: 'scatter', symbolSize: 16, data }],
    }
  }, [aiFiltered, showAllAiMatrix])

  const dataGapChart = useMemo(() => {
    const points = dataCriticalityGapPoints(dataFiltered)
    const sample = showAllDataMatrix ? points : points.slice(0, 14)
    const data = sample.map((p) => ({
      name: p.name,
      value: [p.gapScore, p.criticalityScore, p.id],
      itemStyle: { color: p.flags.length ? '#C47B2C' : '#0D6B7A' },
    }))
    return {
      grid: { left: 52, right: 16, top: 28, bottom: 44 },
      tooltip: {
        formatter: (params) => {
          const p = sample.find((r) => r.id === params.data.value[2])
          if (!p) return params.name
          return [`<strong>${p.name}</strong>`, `Governance gap ${p.gapScore}`, `Criticality ${p.criticalityScore}`, p.flags.join(' · ') || 'Stable'].join('<br/>')
        },
      },
      xAxis: {
        name: 'Governance gap',
        nameLocation: 'middle',
        nameGap: 28,
        min: 0.5,
        max: 4.5,
        interval: 1,
        axisLabel: { formatter: (v) => ({ 1: 'Low', 2.5: 'Med', 4: 'High' }[v] || '') },
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } },
      },
      yAxis: {
        name: 'Criticality',
        nameLocation: 'middle',
        nameGap: 36,
        min: 0.5,
        max: 4.5,
        interval: 1,
        axisLabel: { formatter: (v) => ({ 1: 'Low', 2: 'Med', 3: 'High', 4: 'Crit' }[v] || '') },
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.35 } },
      },
      series: [{ type: 'scatter', symbolSize: 16, data }],
    }
  }, [dataFiltered, showAllDataMatrix])

  const policiesFiltered = useMemo(() => {
    const q = policySearch.trim().toLowerCase()
    return catalog.policies.filter((p) => {
      if (!q) return true
      return `${p.id} ${p.name} ${p.scope} ${p.owner}`.toLowerCase().includes(q)
    })
  }, [catalog.policies, policySearch])

  const selectedPolicy = policiesFiltered.find((p) => p.id === selectedPolicyId) || policiesFiltered[0] || null

  const approvalRows = useMemo(() => {
    const exceptionRows = catalog.exceptions.map((e) => ({
      id: e.id,
      item: e.title,
      type: 'Exception',
      owner: e.owner,
      risk: e.risk,
      approver: e.approver,
      decision: e.status,
      conditions: e.conditions,
      expiry: e.expiry,
      status: e.status,
      subjectId: e.subjectId,
    }))
    const approvalItems = catalog.approvals.map((a) => ({
      id: a.id,
      item: a.item,
      type: a.itemType,
      owner: a.owner,
      risk: a.risk,
      approver: a.approver,
      decision: a.decision,
      conditions: a.conditions,
      expiry: a.expiry,
      status: a.status,
      subjectId: a.subjectId,
      notes: a.notes,
    }))
    return [...approvalItems, ...exceptionRows]
  }, [catalog])

  const approvalsFiltered = useMemo(() => {
    const q = approvalSearch.trim().toLowerCase()
    return approvalRows.filter((row) => {
      if (approvalFilter && row.status !== approvalFilter) return false
      if (!q) return true
      return `${row.item} ${row.type} ${row.owner} ${row.approver}`.toLowerCase().includes(q)
    })
  }, [approvalRows, approvalFilter, approvalSearch])

  const selectedApproval =
    approvalsFiltered.find((r) => r.id === selectedApprovalId) || approvalsFiltered[0] || null

  function applyMetric(key) {
    if (key === 'aiGoverned') {
      setTab('ai')
      setAiFilters({ ...emptyGovAiFilters(), governance: 'Complete' })
      return
    }
    if (key === 'highRisk') {
      setTab('ai')
      setAiFilters({ ...emptyGovAiFilters(), risk: 'elevated' })
      return
    }
    if (key === 'gaps') {
      setTab('ai')
      setAiFilters({ ...emptyGovAiFilters(), governance: 'Gap' })
      return
    }
    if (key === 'dataGoverned') {
      setTab('data')
      setDataFilters({ ...emptyGovDataFilters(), governance: 'Complete' })
      return
    }
    if (key === 'openApprovals') {
      setTab('approvals')
      setApprovalFilter('Pending')
      return
    }
    if (key === 'exceptions') {
      setTab('approvals')
      setApprovalFilter('Active')
    }
  }

  function openAiRow(id) {
    selectEntity({ id, type: 'aiSolution' })
  }

  function openDataRow(id) {
    selectEntity({ id, type: 'dataObject' })
  }

  return (
    <section className="view active app-portfolio-view ai-gov-view data-portfolio-view">
      <div className="module">
        <div className="module-header app-portfolio-header">
          <div>
            <div className="kicker">Governance · {orgName}</div>
            <h1 className="page-title">AI & Data Governance</h1>
            <p>
              Govern enterprise AI and data through policies, ownership, risk, controls, approvals and
              lifecycle decisions.
            </p>
            <p className="sub synthetic-disclosure">{syntheticDisclaimer}</p>
          </div>
          <div className="synthetic-pill" title={syntheticDisclaimer}>SYNTHETIC DEMO DATA</div>
        </div>

        <div className="app-metric-strip" role="group" aria-label="AI and data governance metrics">
          <button type="button" className="app-metric" onClick={() => applyMetric('aiGoverned')}>
            <span>AI Assets Governed</span>
            <strong>{metrics.aiAssetsGoverned}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetric('highRisk')}>
            <span>High-Risk AI</span>
            <strong>{metrics.highRiskAi}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetric('gaps')}>
            <span>Governance Gaps</span>
            <strong>{metrics.governanceGaps}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetric('dataGoverned')}>
            <span>Data Domains Governed</span>
            <strong>{metrics.dataDomainsGoverned}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetric('openApprovals')}>
            <span>Open Approvals</span>
            <strong>{metrics.openApprovals}</strong>
          </button>
          <button type="button" className="app-metric" onClick={() => applyMetric('exceptions')}>
            <span>Active Exceptions</span>
            <strong>{metrics.activeExceptions}</strong>
          </button>
        </div>

        <div className="explorer-segmented ai-gov-tabs" role="tablist" aria-label="Governance views">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={tab === t.id ? 'is-active' : ''}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'ai' && (
          <div className="ai-gov-panel">
            <div className="app-health-layout data-health-layout">
              <div className="app-health-card">
                <div className="app-health-card-head">
                  <h3>Autonomy vs Risk</h3>
                  <button type="button" className="text-link" onClick={() => setShowAllAiMatrix((v) => !v)}>
                    {showAllAiMatrix ? 'Show sample' : 'Show all'}
                  </button>
                </div>
                <ReactECharts option={aiRiskChart} style={{ height: 320 }} />
              </div>
            </div>

            <div className="portfolio-filters">
              <input
                type="search"
                placeholder="Search AI assets"
                value={aiFilters.search}
                onChange={(e) => setAiFilters((f) => ({ ...f, search: e.target.value }))}
              />
              <select value={aiFilters.risk} onChange={(e) => setAiFilters((f) => ({ ...f, risk: e.target.value }))}>
                <option value="">All risk</option>
                <option value="elevated">High / Critical</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <select value={aiFilters.autonomy} onChange={(e) => setAiFilters((f) => ({ ...f, autonomy: e.target.value }))}>
                <option value="">All autonomy</option>
                {[0, 1, 2, 3, 4].map((l) => (
                  <option key={l} value={String(l)}>Level {l}</option>
                ))}
              </select>
              <select value={aiFilters.lifecycle} onChange={(e) => setAiFilters((f) => ({ ...f, lifecycle: e.target.value }))}>
                <option value="">All lifecycle</option>
                {AI_LIFECYCLES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <select value={aiFilters.ownership} onChange={(e) => setAiFilters((f) => ({ ...f, ownership: e.target.value }))}>
                <option value="">All ownership</option>
                <option value="assigned">Owner assigned</option>
                <option value="unassigned">Ownership gap</option>
              </select>
              <select value={aiFilters.governance} onChange={(e) => setAiFilters((f) => ({ ...f, governance: e.target.value }))}>
                <option value="">All governance</option>
                <option value="Complete">Complete</option>
                <option value="Partial">Partial</option>
                <option value="Gap">Gap</option>
                <option value="Not Assessed">Not Assessed</option>
              </select>
              <select value={aiFilters.approval} onChange={(e) => setAiFilters((f) => ({ ...f, approval: e.target.value }))}>
                <option value="">All approvals</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Approved with Conditions">Approved with conditions</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>AI Asset</th>
                    <th>Type</th>
                    <th>Risk</th>
                    <th>Autonomy</th>
                    <th>Human Oversight</th>
                    <th>Governance Status</th>
                    <th>Owner</th>
                    <th>Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {aiFiltered.map((row) => {
                    const s = row.sol
                    const approval = resolveAiApprovalStatus(s, catalog)
                    return (
                      <tr key={s.id} className="clickable-row" onClick={() => openAiRow(s.id)}>
                        <td>{s.name}</td>
                        <td>{aiTypeLabel(s.solutionType)}</td>
                        <td><StatusTag tone={riskTone(s.riskLevel)}>{s.riskLevel}</StatusTag></td>
                        <td>{AUTONOMY_LABELS[s.autonomyLevel]?.replace(/^Level \d+ — /, 'L') || s.autonomyLevel}</td>
                        <td>{s.humanOversightType}</td>
                        <td><StatusTag tone={governanceTone(s.governanceStatus)}>{s.governanceStatus}</StatusTag></td>
                        <td>{row.ownerLabel || '—'}</td>
                        <td><StatusTag tone={approvalTone(approval)}>{approval}</StatusTag></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'data' && (
          <div className="ai-gov-panel">
            <div className="app-health-layout data-health-layout">
              <div className="app-health-card">
                <div className="app-health-card-head">
                  <h3>Criticality vs Governance Gap</h3>
                  <button type="button" className="text-link" onClick={() => setShowAllDataMatrix((v) => !v)}>
                    {showAllDataMatrix ? 'Show sample' : 'Show all'}
                  </button>
                </div>
                <ReactECharts option={dataGapChart} style={{ height: 320 }} />
              </div>
            </div>

            <div className="portfolio-filters">
              <input
                type="search"
                placeholder="Search data domains"
                value={dataFilters.search}
                onChange={(e) => setDataFilters((f) => ({ ...f, search: e.target.value }))}
              />
              <select value={dataFilters.classification} onChange={(e) => setDataFilters((f) => ({ ...f, classification: e.target.value }))}>
                <option value="">All classification</option>
                <option value="Public">Public</option>
                <option value="Internal">Internal</option>
                <option value="Confidential">Confidential</option>
                <option value="Restricted">Restricted</option>
                <option value="Highly Sensitive">Highly Sensitive</option>
              </select>
              <select value={dataFilters.ownership} onChange={(e) => setDataFilters((f) => ({ ...f, ownership: e.target.value }))}>
                <option value="">All ownership</option>
                <option value="assigned">Owner assigned</option>
                <option value="unassigned">Ownership gap</option>
              </select>
              <select value={dataFilters.residency} onChange={(e) => setDataFilters((f) => ({ ...f, residency: e.target.value }))}>
                <option value="">All residency</option>
                <option value="In-Country">In-Country</option>
                <option value="Cross-Border">Cross-Border</option>
                <option value="Review Required">Review Required</option>
                <option value="Unknown">Unknown</option>
              </select>
              <select value={dataFilters.quality} onChange={(e) => setDataFilters((f) => ({ ...f, quality: e.target.value }))}>
                <option value="">All quality</option>
                <option value="Good">Good</option>
                <option value="Watch">Watch</option>
                <option value="Poor">Poor</option>
                <option value="Not Assessed">Not Assessed</option>
              </select>
              <select value={dataFilters.risk} onChange={(e) => setDataFilters((f) => ({ ...f, risk: e.target.value }))}>
                <option value="">All risk</option>
                <option value="elevated">High / Critical</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
              <select value={dataFilters.governance} onChange={(e) => setDataFilters((f) => ({ ...f, governance: e.target.value }))}>
                <option value="">All governance</option>
                <option value="Complete">Complete</option>
                <option value="Partial">Partial</option>
                <option value="Gap">Gap</option>
              </select>
            </div>

            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data Domain</th>
                    <th>Classification</th>
                    <th>Owner</th>
                    <th>Steward</th>
                    <th>Source of Truth</th>
                    <th>Residency</th>
                    <th>Risk</th>
                    <th>Governance</th>
                  </tr>
                </thead>
                <tbody>
                  {dataFiltered.map((row) => {
                    const gov = mapDataGovStatus(row.governanceMaturity)
                    return (
                      <tr key={row.data.id} className="clickable-row" onClick={() => openDataRow(row.data.id)}>
                        <td>{row.data.name}</td>
                        <td>{row.classificationLabel}</td>
                        <td>{row.businessOwnerLabel || '—'}</td>
                        <td>{row.dataStewardLabel || '—'}</td>
                        <td>{row.authoritativeSourceStatus}</td>
                        <td>{row.residencyStatus}</td>
                        <td><StatusTag tone={riskTone(row.risk)}>{row.risk}</StatusTag></td>
                        <td><StatusTag tone={governanceStatusTone(gov)}>{gov}</StatusTag></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'policies' && (
          <div className="gov-layout ai-gov-policy-layout">
            <div>
              <div className="portfolio-filters">
                <input
                  type="search"
                  placeholder="Search policies and controls"
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                />
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Scope</th>
                      <th>Type</th>
                      <th>Owner</th>
                      <th>Status</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policiesFiltered.map((p) => (
                      <tr
                        key={p.id}
                        className={`clickable-row ${selectedPolicy?.id === p.id ? 'row-selected' : ''}`}
                        onClick={() => setSelectedPolicyId(p.id)}
                      >
                        <td>{p.id}</td>
                        <td>{p.name}</td>
                        <td>{p.scope}</td>
                        <td>{p.type}</td>
                        <td>{p.owner}</td>
                        <td>{p.status}</td>
                        <td>{p.reviewDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedPolicy && (
              <aside className="gov-detail ai-gov-inline-detail">
                <h3>{selectedPolicy.name}</h3>
                <p className="muted">{selectedPolicy.id} · {selectedPolicy.type}</p>
                <p>{selectedPolicy.summary}</p>
                <dl className="app-detail-dl">
                  <div><dt>Scope</dt><dd>{selectedPolicy.scope}</dd></div>
                  <div><dt>Owner</dt><dd>{selectedPolicy.owner}</dd></div>
                  <div><dt>Status</dt><dd>{selectedPolicy.status}</dd></div>
                  <div><dt>Review date</dt><dd>{selectedPolicy.reviewDate}</dd></div>
                  <div>
                    <dt>Applicable assets</dt>
                    <dd>{selectedPolicy.applicableAssetIds.join(', ') || '—'}</dd>
                  </div>
                  <div>
                    <dt>Linked exceptions</dt>
                    <dd>{selectedPolicy.exceptionIds.join(', ') || '—'}</dd>
                  </div>
                </dl>
                <h4>Requirements</h4>
                <ul className="drawer-list">
                  {selectedPolicy.requirements.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </aside>
            )}
          </div>
        )}

        {tab === 'approvals' && (
          <div className="gov-layout ai-gov-policy-layout">
            <div>
              <div className="portfolio-filters">
                <input
                  type="search"
                  placeholder="Search approvals and exceptions"
                  value={approvalSearch}
                  onChange={(e) => setApprovalSearch(e.target.value)}
                />
                <select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Approved with Conditions">Approved with conditions</option>
                  <option value="Rejected">Rejected</option>
                  <option value="Expired">Expired</option>
                  <option value="Active">Active exceptions</option>
                </select>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Type</th>
                      <th>Owner</th>
                      <th>Risk</th>
                      <th>Approver</th>
                      <th>Decision</th>
                      <th>Expiry</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvalsFiltered.map((row) => (
                      <tr
                        key={row.id}
                        className={`clickable-row ${selectedApproval?.id === row.id ? 'row-selected' : ''}`}
                        onClick={() => setSelectedApprovalId(row.id)}
                      >
                        <td>{row.item}</td>
                        <td>{row.type}</td>
                        <td>{row.owner}</td>
                        <td>{row.risk}</td>
                        <td>{row.approver}</td>
                        <td>{row.decision}</td>
                        <td>
                          {row.expiry ? (
                            <span className={expiryClass(row.expiry)}>{row.expiry}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td><StatusTag tone={approvalTone(row.status)}>{row.status}</StatusTag></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {selectedApproval && (
              <aside className="gov-detail ai-gov-inline-detail">
                <h3>{selectedApproval.item}</h3>
                <p className="muted">{selectedApproval.type} · {selectedApproval.id}</p>
                <dl className="app-detail-dl">
                  <div><dt>Owner</dt><dd>{selectedApproval.owner}</dd></div>
                  <div><dt>Risk</dt><dd>{selectedApproval.risk}</dd></div>
                  <div><dt>Approver</dt><dd>{selectedApproval.approver}</dd></div>
                  <div><dt>Decision</dt><dd>{selectedApproval.decision}</dd></div>
                  <div><dt>Status</dt><dd>{selectedApproval.status}</dd></div>
                  <div>
                    <dt>Expiry</dt>
                    <dd>
                      {selectedApproval.expiry ? (
                        <span className={expiryClass(selectedApproval.expiry)}>{selectedApproval.expiry}</span>
                      ) : (
                        '—'
                      )}
                    </dd>
                  </div>
                  <div><dt>Subject</dt><dd>{selectedApproval.subjectId}</dd></div>
                </dl>
                {selectedApproval.conditions?.length > 0 && (
                  <>
                    <h4>Conditions</h4>
                    <ul className="drawer-list">
                      {selectedApproval.conditions.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </>
                )}
                {selectedApproval.notes && <p>{selectedApproval.notes}</p>}
                {selectedApproval.subjectId && (
                  <button
                    type="button"
                    className="btn secondary-button"
                    onClick={() => {
                      if (selectedApproval.subjectId.startsWith('ai-')) openAiRow(selectedApproval.subjectId)
                      else if (selectedApproval.subjectId.startsWith('data-')) openDataRow(selectedApproval.subjectId)
                    }}
                  >
                    Open linked asset
                  </button>
                )}
              </aside>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
