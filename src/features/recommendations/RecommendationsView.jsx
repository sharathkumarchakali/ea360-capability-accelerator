import { useMemo, useState } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import CreateInitiativeModal from '../initiatives/CreateInitiativeModal'
import { callStoreAction } from '../workflow/callStoreAction'

function statusClass(status) {
  if (status === 'approved') return 'green'
  if (status === 'rejected') return 'red'
  if (status === 'in_review' || status === 'submitted') return 'amber'
  return 'blue'
}

export default function RecommendationsView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const selected = usePrototypeStore((s) => s.selectedEntity)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [detailId, setDetailId] = useState(null)
  const [comment, setComment] = useState('')
  const [preferredOption, setPreferredOption] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [gateMessage, setGateMessage] = useState('')

  const recs = repo.listRecommendations()
  const objectives = repo.listObjectives()
  const capabilities = repo.listCapabilities().filter((c) => c.level === 1 || c.level === 2)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return recs.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false
      if (!q) return true
      return `${r.name} ${r.outcome} ${r.expectedValue}`.toLowerCase().includes(q)
    })
  }, [recs, search, statusFilter])

  const activeId =
    detailId ||
    (selected?.type === 'recommendation' ? selected.id : null) ||
    filtered[0]?.id
  const detail = recs.find((r) => r.id === activeId) || null

  function openRec(id) {
    setDetailId(id)
    setGateMessage('')
    selectEntity({ id, type: 'recommendation' })
    const r = recs.find((x) => x.id === id)
    setPreferredOption(r?.preferredOption || r?.optionsConsidered?.[0] || '')
  }

  function tryCreateInitiative() {
    if (!detail) return
    const approved = detail.status === 'approved'
    const decisions =
      (typeof repo.listDecisions === 'function' ? repo.listDecisions() : null) ||
      usePrototypeStore.getState().listDecisions?.() ||
      []
    const linkedDecision = (Array.isArray(decisions) ? decisions : []).find(
      (d) =>
        d.status === 'approved' &&
        (d.recommendationId === detail.id ||
          (d.recommendationIds || []).includes(detail.id)),
    )
    if (!approved) {
      setGateMessage('Create initiative is available only after the recommendation is approved.')
      return
    }
    if (!linkedDecision && detail.status === 'approved') {
      // Prefer decision first, but allow create with soft warning if no decision entity yet
      setGateMessage(
        'Prefer an approved ARB decision before creating an initiative. You can still proceed for demo.',
      )
    } else {
      setGateMessage('')
    }
    setCreateOpen(true)
  }

  const initiatives = detail ? repo.initiativesForRecommendation(detail.id) : []
  const findings = detail
    ? detail.findingIds.map((id) => repo.getFinding(id)).filter(Boolean)
    : []

  return (
    <section className="view active">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Decide · Recommendations</div>
            <h1 className="page-title">Recommendations</h1>
            <p>
              Structured options with value, effort and risk reduction. Approve, revise, or send to
              ARB — then create roadmap initiatives from approved items.
            </p>
          </div>
        </div>

        <div className="intel-toolbar">
          <label className="field grow">
            <span>Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Outcome, value…"
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="proposed">Proposed</option>
              <option value="submitted">Submitted</option>
              <option value="in_review">In review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
        </div>

        <div className="recs-layout">
          <div className="recs-list">
            <div className="cards3">
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`itemcard rec-card${detail?.id === r.id ? ' selected' : ''}`}
                  onClick={() => openRec(r.id)}
                >
                  <span className={`tag ${statusClass(r.status)}`}>{r.status}</span>
                  <h4>{r.name}</h4>
                  <p>{r.outcome}</p>
                  <p className="sub">
                    Effort {r.effortBand} · Confidence {r.confidence} · {r.riskReduction}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {detail && (
            <aside className="recs-detail itemcard">
              <div className="kicker">Recommendation detail</div>
              <h3>{detail.name}</h3>
              <div className="chip-row">
                <span className={`tag ${statusClass(detail.status)}`}>{detail.status}</span>
                <span className="wf-status">Effort {detail.effortBand}</span>
                <span className="wf-status">Confidence {detail.confidence}</span>
              </div>
              <p><strong>Outcome.</strong> {detail.outcome}</p>
              <p><strong>Expected value.</strong> {detail.expectedValue}</p>
              <p><strong>Cost / effort.</strong> Band {detail.effortBand} · indicative delivery cost scales with scope.</p>
              <p><strong>Risk reduction.</strong> {detail.riskReduction}</p>

              <h4 className="drawer-section-title">Options considered</h4>
              <ul className="drawer-list option-list">
                {(detail.optionsConsidered || []).map((opt) => (
                  <li key={opt}>
                    <label className="option-row">
                      <input
                        type="radio"
                        name={`pref-${detail.id}`}
                        checked={preferredOption === opt}
                        onChange={() => {
                          setPreferredOption(opt)
                          callStoreAction('setPreferredOption', {
                            recommendationId: detail.id,
                            option: opt,
                          })
                        }}
                      />
                      <span>
                        {opt}
                        {(detail.preferredOption || preferredOption) === opt ? ' · preferred' : ''}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>

              <h4 className="drawer-section-title">Assumptions</h4>
              <ul className="drawer-list">
                {(detail.assumptions || []).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>

              <h4 className="drawer-section-title">Supporting findings</h4>
              <div className="chip-row">
                {findings.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className="link-chip"
                    onClick={() => selectEntity({ id: f.id, type: 'finding' })}
                  >
                    {f.name}
                  </button>
                ))}
              </div>

              <h4 className="drawer-section-title">Affected capabilities & applications</h4>
              <div className="chip-row">
                {detail.affectedCapabilityIds.map((id) => {
                  const c = repo.getCapability(id)
                  return c ? (
                    <button
                      key={id}
                      type="button"
                      className="link-chip"
                      onClick={() => selectEntity({ id, type: 'capability' })}
                    >
                      {c.name}
                    </button>
                  ) : null
                })}
                {detail.affectedApplicationIds.map((id) => {
                  const a = repo.getApplication(id)
                  return a ? (
                    <button
                      key={id}
                      type="button"
                      className="link-chip"
                      onClick={() => selectEntity({ id, type: 'application' })}
                    >
                      {a.name}
                    </button>
                  ) : null
                })}
              </div>

              <h4 className="drawer-section-title">Roadmap initiatives</h4>
              <div className="chip-row">
                {initiatives.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    className="link-chip"
                    onClick={() => {
                      selectEntity({ id: i.id, type: 'initiative' })
                      setView('roadmap')
                      window.location.hash = 'roadmap'
                    }}
                  >
                    {i.name}
                  </button>
                ))}
                {!initiatives.length && <span className="sub">None linked yet</span>}
              </div>

              <h4 className="drawer-section-title">Workflow actions</h4>
              <div className="toolbar wrap-actions">
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => callStoreAction('submit', { recommendationId: detail.id })}
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => callStoreAction('approve', { recommendationId: detail.id })}
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => callStoreAction('reject', { recommendationId: detail.id })}
                >
                  Reject
                </button>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() =>
                    callStoreAction('requestRevision', {
                      recommendationId: detail.id,
                      comment: comment || 'Revision requested',
                    })
                  }
                >
                  Request revision
                </button>
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => callStoreAction('sendToARB', { recommendationId: detail.id })}
                >
                  Send to ARB
                </button>
                <button
                  type="button"
                  className="btn primary primary-button"
                  onClick={tryCreateInitiative}
                >
                  Create initiative
                </button>
              </div>
              {gateMessage && (
                <p className="gate-message" role="status">
                  {gateMessage}
                </p>
              )}

              <div className="toolbar wrap-actions" style={{ marginTop: 8 }}>
                <label className="field grow">
                  <span>Comment</span>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Review comment…"
                  />
                </label>
                <button
                  type="button"
                  className="btn secondary-button"
                  disabled={!comment.trim()}
                  onClick={() => {
                    callStoreAction('addComment', {
                      recommendationId: detail.id,
                      comment: comment.trim(),
                    })
                    setComment('')
                  }}
                >
                  Add comment
                </button>
              </div>
            </aside>
          )}
        </div>
      </div>

      <CreateInitiativeModal
        open={createOpen}
        source={{
          recommendation: detail,
          recommendationIds: detail ? [detail.id] : [],
          objectiveIds: [],
          capabilityIds: detail?.affectedCapabilityIds || [],
        }}
        objectives={objectives}
        capabilities={capabilities}
        onClose={() => setCreateOpen(false)}
      />
    </section>
  )
}
