import { useMemo, useState } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import EvidencePanel, { deriveTrustStatus } from '../evidence/EvidencePanel'
import { callStoreAction } from '../workflow/callStoreAction'
import ExplainButton from '../ai-assist/ExplainButton'
import { draftRecommendation } from '../../lib/ai'

const AS_OF = '2026-09-07'
const PAGE_SIZE = 8

function ownerLabel(id) {
  if (!id) return 'Unassigned'
  return id.replace(/^person-/, '')
}

function daysOverdue(targetDate, asOf = AS_OF) {
  if (!targetDate) return 0
  const t = Date.parse(targetDate)
  const a = Date.parse(asOf)
  if (Number.isNaN(t) || Number.isNaN(a)) return 0
  return Math.max(0, Math.round((a - t) / 86400000))
}

function ageingBucket(targetDate, status) {
  if (status === 'mitigated' || status === 'accepted' || status === 'completed') return 'resolved'
  const overdue = daysOverdue(targetDate)
  if (overdue > 90) return '90+ days overdue'
  if (overdue > 30) return '31–90 days overdue'
  if (overdue > 0) return '1–30 days overdue'
  return 'on track'
}

function severityClass(sev) {
  if (sev === 'critical') return 'red'
  if (sev === 'high') return 'amber'
  if (sev === 'medium') return 'blue'
  return 'green'
}

function enrichFinding(f, repo) {
  const recs = repo.recommendationsForFinding(f.id)
  const evidence = (f.evidenceIds || []).map((id) => repo.getEvidence(id)).filter(Boolean)
  const trustStatuses = evidence.map((e) => deriveTrustStatus(e))
  const insufficientEvidence =
    evidence.length === 0 ||
    trustStatuses.every((t) => t === 'unverified' || t === 'stale' || t === 'disputed' || t === 'missing')
  const noRemediation = recs.length === 0 && !(f.recommendedAction || '').trim()
  const noOwner = !f.ownerId || f.ownerId === 'person-unassigned'
  const overdue =
    daysOverdue(f.targetDate) > 0 &&
    !['mitigated', 'accepted', 'completed', 'resolved'].includes(f.status)
  const domain =
    f.domain ||
    f.category?.split('/')[0]?.trim() ||
    (f.linkedObjectIds || [])
      .map((id) => repo.getCapability(id)?.domain)
      .find(Boolean) ||
    'Enterprise'
  return {
    f,
    recs,
    evidence,
    insufficientEvidence,
    noRemediation,
    noOwner,
    overdue,
    domain,
    ageing: ageingBucket(f.targetDate, f.status),
    decisions: f.decisionIds
      ? f.decisionIds.map((id) => repo.getDecision?.(id)).filter(Boolean)
      : [],
    initiatives: recs.flatMap((r) => repo.initiativesForRecommendation(r.id)),
  }
}

export default function FindingsView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const setGraphRoot = usePrototypeStore((s) => s.setGraphRoot)
  const selected = usePrototypeStore((s) => s.selectedEntity)
  const role = usePrototypeStore((s) => s.role)
  const view = usePrototypeStore((s) => s.view)
  const filters = usePrototypeStore((s) => s.filters)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const recordAiResponse = usePrototypeStore((s) => s.recordAiResponse)

  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [owner, setOwner] = useState('')
  const [domain, setDomain] = useState('')
  const [ageing, setAgeing] = useState('')
  const [remediation, setRemediation] = useState('')
  const [kpiFilter, setKpiFilter] = useState('')
  const [sort, setSort] = useState({ key: 'severity', dir: 'desc' })
  const [page, setPage] = useState(0)
  const [detailId, setDetailId] = useState(null)
  const [ownerDraft, setOwnerDraft] = useState('')
  const [dateDraft, setDateDraft] = useState('')

  const findings = repo.listFindings()
  const enriched = useMemo(() => findings.map((f) => enrichFinding(f, repo)), [findings, repo])

  const kpis = useMemo(() => {
    const open = enriched.filter((x) => !['mitigated', 'accepted', 'completed', 'resolved'].includes(x.f.status))
    return {
      open: open.length,
      critical: enriched.filter((x) => x.f.severity === 'critical' && open.includes(x)).length,
      overdue: enriched.filter((x) => x.overdue).length,
      noOwner: enriched.filter((x) => x.noOwner).length,
      insufficientEvidence: enriched.filter((x) => x.insufficientEvidence).length,
      noRemediation: enriched.filter((x) => x.noRemediation).length,
    }
  }, [enriched])

  const concentration = useMemo(() => {
    const byDomain = {}
    const byAge = {}
    enriched.forEach((x) => {
      byDomain[x.domain] = (byDomain[x.domain] || 0) + 1
      byAge[x.ageing] = (byAge[x.ageing] || 0) + 1
    })
    return { byDomain, byAge }
  }, [enriched])

  const categories = useMemo(
    () => [...new Set(findings.map((f) => f.category))].sort(),
    [findings],
  )
  const statuses = useMemo(
    () => [...new Set(findings.map((f) => f.status))].sort(),
    [findings],
  )
  const owners = useMemo(
    () => [...new Set(findings.map((f) => f.ownerId).filter(Boolean))].sort(),
    [findings],
  )
  const domains = useMemo(
    () => [...new Set(enriched.map((x) => x.domain))].sort(),
    [enriched],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enriched.filter((x) => {
      const { f } = x
      if (kpiFilter === 'open' && ['mitigated', 'accepted', 'completed', 'resolved'].includes(f.status)) {
        return false
      }
      if (kpiFilter === 'critical' && f.severity !== 'critical') return false
      if (kpiFilter === 'overdue' && !x.overdue) return false
      if (kpiFilter === 'noOwner' && !x.noOwner) return false
      if (kpiFilter === 'insufficientEvidence' && !x.insufficientEvidence) return false
      if (kpiFilter === 'noRemediation' && !x.noRemediation) return false
      if (severity && f.severity !== severity) return false
      if (category && f.category !== category) return false
      if (status && f.status !== status) return false
      if (owner && f.ownerId !== owner) return false
      if (domain && x.domain !== domain) return false
      if (ageing && x.ageing !== ageing) return false
      if (remediation === 'planned' && x.noRemediation) return false
      if (remediation === 'none' && !x.noRemediation) return false
      if (q) {
        const hay = `${f.name} ${f.problemStatement} ${f.businessImpact} ${f.category}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [
    enriched,
    search,
    severity,
    category,
    status,
    owner,
    domain,
    ageing,
    remediation,
    kpiFilter,
  ])

  const severityRank = { critical: 4, high: 3, medium: 2, low: 1 }

  const sorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      let ka
      let kb
      if (sort.key === 'severity') {
        ka = severityRank[a.f.severity] || 0
        kb = severityRank[b.f.severity] || 0
      } else if (sort.key === 'targetDate') {
        ka = a.f.targetDate || ''
        kb = b.f.targetDate || ''
      } else if (sort.key === 'name') {
        ka = a.f.name
        kb = b.f.name
      } else if (sort.key === 'status') {
        ka = a.f.status
        kb = b.f.status
      } else {
        ka = a.f[sort.key]
        kb = b.f[sort.key]
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

  const activeDetailId =
    detailId ||
    (selected?.type === 'finding' ? selected.id : null) ||
    pageRows[0]?.f.id
  const detail = enriched.find((x) => x.f.id === activeDetailId) || null

  function openFinding(id) {
    setDetailId(id)
    selectEntity({ id, type: 'finding' })
    const hit = enriched.find((x) => x.f.id === id)
    setOwnerDraft(ownerLabel(hit?.f.ownerId))
    setDateDraft(hit?.f.targetDate || '')
  }

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' },
    )
  }

  function applyKpi(key) {
    setPage(0)
    setKpiFilter((prev) => (prev === key ? '' : key))
  }

  function openExplorer(id) {
    setGraphRoot({ id, type: 'finding' })
    setView('explorer')
    window.location.hash = 'explorer'
  }

  const kpiCards = [
    { id: 'open', label: 'Open', value: kpis.open },
    { id: 'critical', label: 'Critical', value: kpis.critical },
    { id: 'overdue', label: 'Overdue', value: kpis.overdue },
    { id: 'noOwner', label: 'No owner', value: kpis.noOwner },
    { id: 'insufficientEvidence', label: 'Insufficient evidence', value: kpis.insufficientEvidence },
    { id: 'noRemediation', label: 'No remediation', value: kpis.noRemediation },
  ]

  return (
    <section className="view active">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Diagnose · Findings & risks</div>
            <h1 className="page-title">Findings & risks</h1>
            <p>
              Evidence-backed architecture findings with ownership, ageing and remediation
              workflow for GRA.
            </p>
          </div>
        </div>

        <div className="int-kpi-grid wf-kpi-grid">
          {kpiCards.map((k) => (
            <button
              key={k.id}
              type="button"
              className={`int-kpi-card${kpiFilter === k.id ? ' active-kpi' : ''}`}
              onClick={() => applyKpi(k.id)}
            >
              <span>{k.label}</span>
              <strong>{k.value}</strong>
            </button>
          ))}
        </div>

        <div className="cards3 risk-summary-row">
          <div className="itemcard">
            <h4>Risk concentration</h4>
            <ul className="drawer-list">
              {Object.entries(concentration.byDomain)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([d, n]) => (
                  <li key={d}>
                    <button type="button" className="text-link" onClick={() => { setDomain(d); setPage(0) }}>
                      {d}
                    </button>
                    {' · '}
                    {n}
                  </li>
                ))}
            </ul>
          </div>
          <div className="itemcard">
            <h4>Ageing summary</h4>
            <ul className="drawer-list">
              {Object.entries(concentration.byAge).map(([bucket, n]) => (
                <li key={bucket}>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      setAgeing(bucket)
                      setPage(0)
                    }}
                  >
                    {bucket}
                  </button>
                  {' · '}
                  {n}
                </li>
              ))}
            </ul>
          </div>
          <div className="itemcard">
            <h4>Register focus</h4>
            <p className="sub">
              Showing {sorted.length} of {findings.length} findings
              {kpiFilter ? ` · KPI filter: ${kpiFilter}` : ''}.
            </p>
            <button
              type="button"
              className="btn secondary-button"
              onClick={() => {
                setSearch('')
                setSeverity('')
                setCategory('')
                setStatus('')
                setOwner('')
                setDomain('')
                setAgeing('')
                setRemediation('')
                setKpiFilter('')
                setPage(0)
              }}
            >
              Clear filters
            </button>
          </div>
        </div>

        <div className="intel-toolbar">
          <label className="field grow">
            <span>Search</span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              placeholder="Finding, impact, category…"
            />
          </label>
          <label className="field">
            <span>Severity</span>
            <select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(0) }}>
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label className="field">
            <span>Category</span>
            <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(0) }}>
              <option value="">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0) }}>
              <option value="">All</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Owner</span>
            <select value={owner} onChange={(e) => { setOwner(e.target.value); setPage(0) }}>
              <option value="">All</option>
              {owners.map((o) => (
                <option key={o} value={o}>{ownerLabel(o)}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Domain</span>
            <select value={domain} onChange={(e) => { setDomain(e.target.value); setPage(0) }}>
              <option value="">All</option>
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Ageing</span>
            <select value={ageing} onChange={(e) => { setAgeing(e.target.value); setPage(0) }}>
              <option value="">All</option>
              <option value="on track">On track</option>
              <option value="1–30 days overdue">1–30 days overdue</option>
              <option value="31–90 days overdue">31–90 days overdue</option>
              <option value="90+ days overdue">90+ days overdue</option>
              <option value="resolved">Resolved</option>
            </select>
          </label>
          <label className="field">
            <span>Remediation</span>
            <select value={remediation} onChange={(e) => { setRemediation(e.target.value); setPage(0) }}>
              <option value="">All</option>
              <option value="planned">Has remediation</option>
              <option value="none">No remediation</option>
            </select>
          </label>
        </div>

        <div className="findings-layout">
          <div className="findings-register">
            <div className="tablewrap int-table-desktop">
              <table>
                <thead>
                  <tr>
                    <th>
                      <button type="button" className="sort-btn" onClick={() => toggleSort('name')}>
                        Finding
                      </button>
                    </th>
                    <th>Category</th>
                    <th>
                      <button type="button" className="sort-btn" onClick={() => toggleSort('severity')}>
                        Severity
                      </button>
                    </th>
                    <th>
                      <button type="button" className="sort-btn" onClick={() => toggleSort('status')}>
                        Status
                      </button>
                    </th>
                    <th>Owner</th>
                    <th>
                      <button type="button" className="sort-btn" onClick={() => toggleSort('targetDate')}>
                        Target
                      </button>
                    </th>
                    <th>Ageing</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((x) => (
                    <tr
                      key={x.f.id}
                      className={`row-click${detail?.f.id === x.f.id ? ' row-selected' : ''}`}
                      onClick={() => openFinding(x.f.id)}
                    >
                      <td>
                        <strong>{x.f.name}</strong>
                        <div className="sub">{x.f.businessImpact}</div>
                      </td>
                      <td>{x.f.category}</td>
                      <td>
                        <span className={`tag ${severityClass(x.f.severity)}`}>{x.f.severity}</span>
                      </td>
                      <td>
                        <span className="wf-status">{x.f.status}</span>
                      </td>
                      <td>{ownerLabel(x.f.ownerId)}</td>
                      <td>{x.f.targetDate}</td>
                      <td>
                        <span className={`ageing-pill ageing-${x.overdue ? 'hot' : 'ok'}`}>
                          {x.ageing}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="int-mobile findings-mobile">
              {pageRows.map((x) => (
                <button
                  key={x.f.id}
                  type="button"
                  className={`itemcard mobile-finding${detail?.f.id === x.f.id ? ' selected' : ''}`}
                  onClick={() => openFinding(x.f.id)}
                >
                  <div className="chip-row">
                    <span className={`tag ${severityClass(x.f.severity)}`}>{x.f.severity}</span>
                    <span className="wf-status">{x.f.status}</span>
                  </div>
                  <h4>{x.f.name}</h4>
                  <p className="sub">
                    {ownerLabel(x.f.ownerId)} · {x.f.targetDate} · {x.ageing}
                  </p>
                </button>
              ))}
            </div>

            <div className="pager toolbar">
              <button
                type="button"
                className="btn secondary-button"
                disabled={pageSafe <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </button>
              <span className="sub">
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

          {detail && (
            <aside className="findings-detail itemcard">
              <div className="kicker">Finding detail</div>
              <h3>{detail.f.name}</h3>
              <div className="chip-row">
                <span className={`tag ${severityClass(detail.f.severity)}`}>{detail.f.severity}</span>
                <span className="wf-status">{detail.f.status}</span>
                <span className="ageing-pill">{detail.ageing}</span>
                <ExplainButton
                  metricKey="severity"
                  query={`Explain severity for ${detail.f.name}`}
                  contextEntityIds={[detail.f.id]}
                  label="Explain severity"
                />
              </div>
              <p><strong>Problem.</strong> {detail.f.problemStatement}</p>
              <p><strong>Root cause.</strong> {detail.f.rootCause}</p>
              <p><strong>Business impact.</strong> {detail.f.businessImpact}</p>
              <p className="sub">
                Recommended action: {detail.f.recommendedAction || '—'} · Urgency {detail.f.urgency}
              </p>

              <h4 className="drawer-section-title">Evidence</h4>
              <EvidencePanel
                evidenceList={detail.evidence}
                findingId={detail.f.id}
                compact
                onOpenEvidence={(id) => selectEntity({ id, type: 'evidence' })}
              />

              <h4 className="drawer-section-title">Linked objects</h4>
              <div className="chip-row">
                {(detail.f.linkedObjectIds || []).map((id) => {
                  const cap = repo.getCapability(id)
                  const app = repo.getApplication(id)
                  const int = repo.getIntegration?.(id)
                  const label = cap?.name || app?.name || int?.name || repo.resolveEntityName?.(id) || id
                  const type = cap ? 'capability' : app ? 'application' : int ? 'integration' : 'capability'
                  return (
                    <button
                      key={id}
                      type="button"
                      className="link-chip"
                      onClick={() => selectEntity({ id, type })}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <h4 className="drawer-section-title">Recommendations</h4>
              <div className="chip-row">
                {detail.recs.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className="link-chip"
                    onClick={() => selectEntity({ id: r.id, type: 'recommendation' })}
                  >
                    {r.name}
                  </button>
                ))}
                {!detail.recs.length && <span className="sub">None yet</span>}
              </div>

              <h4 className="drawer-section-title">Decisions & initiatives</h4>
              <div className="chip-row">
                {detail.initiatives.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    className="link-chip"
                    onClick={() => selectEntity({ id: i.id, type: 'initiative' })}
                  >
                    {i.name}
                  </button>
                ))}
                {!detail.initiatives.length && <span className="sub">No initiative yet</span>}
              </div>

              <h4 className="drawer-section-title">Working actions</h4>
              <div className="toolbar wrap-actions">
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => callStoreAction('submitForReview', { findingId: detail.f.id })}
                >
                  Submit for review
                </button>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => callStoreAction('validateFinding', { findingId: detail.f.id })}
                >
                  Validate
                </button>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => callStoreAction('rejectFinding', { findingId: detail.f.id })}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() =>
                    callStoreAction('createRecommendationFromFinding', { findingId: detail.f.id })
                  }
                >
                  Create recommendation
                </button>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => {
                    const tenant = repo.getTenant()
                    const response = draftRecommendation({
                      tenantId: tenant.id,
                      userRole: role,
                      query: `Draft recommendation for ${detail.f.name}`,
                      intent: 'recommendation_draft',
                      contextEntityIds: [detail.f.id],
                      view,
                      filters: { period: filters.period, businessUnit: filters.businessUnit },
                    })
                    recordAiResponse(response)
                    setAskOpen(true)
                  }}
                >
                  Draft recommendation (AI-assisted)
                </button>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => callStoreAction('markRemediationPlanned', { findingId: detail.f.id })}
                >
                  Mark remediation planned
                </button>
                <button
                  type="button"
                  className="btn primary primary-button"
                  onClick={() => callStoreAction('resolveFinding', { findingId: detail.f.id })}
                >
                  Resolve
                </button>
              </div>

              <div className="toolbar wrap-actions" style={{ marginTop: 8 }}>
                <label className="field">
                  <span>Assign owner</span>
                  <input value={ownerDraft} onChange={(e) => setOwnerDraft(e.target.value)} />
                </label>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() =>
                    callStoreAction('assignOwner', {
                      findingId: detail.f.id,
                      ownerId: ownerDraft.startsWith('person-')
                        ? ownerDraft
                        : `person-${ownerDraft}`,
                    })
                  }
                >
                  Assign
                </button>
                <label className="field">
                  <span>Target date</span>
                  <input
                    type="date"
                    value={dateDraft}
                    onChange={(e) => setDateDraft(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() =>
                    callStoreAction('changeTargetDate', {
                      findingId: detail.f.id,
                      targetDate: dateDraft,
                    })
                  }
                >
                  Update date
                </button>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => openExplorer(detail.f.id)}
                >
                  Open in explorer
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </section>
  )
}
