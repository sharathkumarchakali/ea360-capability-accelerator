import { useMemo, useState } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import CreateInitiativeModal from '../initiatives/CreateInitiativeModal'
import { callStoreAction } from '../workflow/callStoreAction'

function queueAgeDays(iso, asOf = '2026-09-07') {
  if (!iso) return 0
  const a = Date.parse(asOf)
  const t = Date.parse(iso)
  if (Number.isNaN(a) || Number.isNaN(t)) return 0
  return Math.max(0, Math.round((a - t) / 86400000))
}

function buildArbQueue(repo, store) {
  if (typeof store.getArbQueue === 'function') {
    return store.getArbQueue()
  }
  if (typeof repo.listArbQueue === 'function') {
    return repo.listArbQueue()
  }
  const decisions =
    (typeof repo.listDecisions === 'function' && repo.listDecisions()) ||
    (typeof store.listDecisions === 'function' && store.listDecisions()) ||
    store.workingPack?.decisions ||
    []
  if (Array.isArray(decisions) && decisions.length) {
    return decisions.filter((d) =>
      ['pending', 'in_review', 'deferred', 'submitted', 'open'].includes(d.status),
    )
  }
  // Fallback: recommendations awaiting governance
  return repo
    .listRecommendations()
    .filter((r) => ['proposed', 'submitted', 'in_review'].includes(r.status))
    .map((r) => ({
      id: `arb-${r.id}`,
      recommendationId: r.id,
      name: r.name,
      status: r.status === 'proposed' ? 'pending' : r.status,
      submittedAt: r.updatedAt,
      ownerId: r.ownerId,
      summary: r.outcome,
      riskReduction: r.riskReduction,
      effortBand: r.effortBand,
      type: 'recommendation-review',
    }))
}

function listDecisions(repo, store) {
  if (typeof store.listDecisions === 'function') return store.listDecisions()
  if (typeof repo.listDecisions === 'function') return repo.listDecisions()
  return store.workingPack?.decisions || store.decisions || []
}

function listAudit(store) {
  if (typeof store.listAuditHistory === 'function') return store.listAuditHistory()
  if (Array.isArray(store.auditLog)) return store.auditLog
  return store.mutations || []
}

export default function GovernanceView() {
  const storeSlice = usePrototypeStore()
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const mutations = usePrototypeStore((s) => s.mutations)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [conditions, setConditions] = useState('')
  const [rationale, setRationale] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const queue = useMemo(
    () => buildArbQueue(repo, usePrototypeStore.getState()),
    [repo, mutations, storeSlice],
  )
  const decisions = useMemo(
    () => listDecisions(repo, usePrototypeStore.getState()),
    [repo, mutations, storeSlice],
  )
  const audit = useMemo(() => {
    const entries = listAudit(usePrototypeStore.getState())
    return [...entries].reverse().slice(0, 40)
  }, [mutations, storeSlice])

  const filteredQueue = useMemo(() => {
    const q = search.trim().toLowerCase()
    return queue.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false
      if (!q) return true
      return `${item.name} ${item.summary || ''} ${item.id}`.toLowerCase().includes(q)
    })
  }, [queue, search, statusFilter])

  const selected = filteredQueue.find((i) => i.id === selectedId) || filteredQueue[0] || null
  const linkedRec = selected?.recommendationId
    ? repo.getRecommendation(selected.recommendationId)
    : null

  function runDecision(action) {
    if (!selected) return
    const payload = {
      queueItemId: selected.id,
      recommendationId: selected.recommendationId,
      decisionId: selected.decisionId || selected.id,
      rationale: rationale || undefined,
      conditions: conditions || undefined,
      action,
    }
    if (action === 'approve') callStoreAction('approveDecision', payload)
    else if (action === 'approveWithConditions') callStoreAction('approveDecisionWithConditions', payload)
    else if (action === 'reject') callStoreAction('rejectDecision', payload)
    else if (action === 'defer') callStoreAction('deferDecision', payload)
    setConfirm(null)
    setRationale('')
    setConditions('')
  }

  function openCreateFromDecision(decision) {
    const recId = decision.recommendationId || linkedRec?.id
    const rec = recId ? repo.getRecommendation(recId) : linkedRec
    if (!rec && !decision) return
    setCreateOpen({
      decision,
      recommendation: rec,
      recommendationIds: rec ? [rec.id] : [],
      decisionId: decision.id,
    })
  }

  const approvedDecisions = (Array.isArray(decisions) ? decisions : []).filter(
    (d) => d.status === 'approved' || d.status === 'approved_with_conditions',
  )

  return (
    <section className="view active">
      <div className="module">
        <div className="module-header" data-demo-target="governance-decisions">
          <div>
            <div className="kicker">Decide · Governance & decisions</div>
            <h1 className="page-title">Architecture Review Board</h1>
            <p>
              Queue of items awaiting review, decision records with conditions, and an audit-style
              history of prototype governance actions.
            </p>
          </div>
        </div>

        <div className="int-kpi-grid wf-kpi-grid">
          <div className="int-kpi-card">
            <span>ARB queue</span>
            <strong>{queue.length}</strong>
          </div>
          <div className="int-kpi-card">
            <span>Avg age (days)</span>
            <strong>
              {queue.length
                ? Math.round(
                    queue.reduce((s, i) => s + queueAgeDays(i.submittedAt || i.updatedAt), 0) /
                      queue.length,
                  )
                : 0}
            </strong>
          </div>
          <div className="int-kpi-card">
            <span>Decisions recorded</span>
            <strong>{(Array.isArray(decisions) ? decisions : []).length}</strong>
          </div>
          <div className="int-kpi-card">
            <span>Audit events</span>
            <strong>{audit.length}</strong>
          </div>
        </div>

        <div className="intel-toolbar">
          <label className="field grow">
            <span>Search queue</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Item, recommendation…"
            />
          </label>
          <label className="field">
            <span>Status</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="in_review">In review</option>
              <option value="submitted">Submitted</option>
              <option value="deferred">Deferred</option>
            </select>
          </label>
        </div>

        <div className="gov-layout">
          <div className="gov-queue">
            <h3 className="section-title">ARB queue</h3>
            <div className="tablewrap int-table-desktop">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Status</th>
                    <th>Age</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQueue.map((item) => (
                    <tr
                      key={item.id}
                      className={`row-click${selected?.id === item.id ? ' row-selected' : ''}`}
                      onClick={() => setSelectedId(item.id)}
                    >
                      <td>
                        <strong>{item.name}</strong>
                        <div className="sub">{item.summary || item.type}</div>
                      </td>
                      <td>
                        <span className="wf-status">{item.status}</span>
                      </td>
                      <td>{queueAgeDays(item.submittedAt || item.updatedAt)}d</td>
                      <td>{(item.ownerId || '').replace('person-', '') || '—'}</td>
                    </tr>
                  ))}
                  {!filteredQueue.length && (
                    <tr>
                      <td colSpan={4}>
                        <span className="sub">Queue is empty for the current filters.</span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="int-mobile">
              {filteredQueue.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`itemcard${selected?.id === item.id ? ' selected' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="wf-status">{item.status}</span>
                  <h4>{item.name}</h4>
                  <p className="sub">
                    Age {queueAgeDays(item.submittedAt || item.updatedAt)}d ·{' '}
                    {(item.ownerId || '').replace('person-', '')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <aside className="gov-detail itemcard">
            {selected ? (
              <>
                <div className="kicker">Review item</div>
                <h3>{selected.name}</h3>
                <p>{selected.summary || linkedRec?.outcome}</p>
                <p className="sub">
                  Status {selected.status} · Age{' '}
                  {queueAgeDays(selected.submittedAt || selected.updatedAt)} days · Effort{' '}
                  {selected.effortBand || linkedRec?.effortBand || '—'}
                </p>
                {linkedRec && (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() =>
                      selectEntity({ id: linkedRec.id, type: 'recommendation' })
                    }
                  >
                    Open recommendation: {linkedRec.name}
                  </button>
                )}
                <label className="field grow" style={{ marginTop: 12 }}>
                  <span>Rationale</span>
                  <textarea
                    rows={2}
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    placeholder="Decision rationale…"
                  />
                </label>
                <label className="field grow">
                  <span>Conditions (if approving with conditions)</span>
                  <input
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    placeholder="e.g. migrate identity APIs in wave 1"
                  />
                </label>
                <div className="toolbar wrap-actions">
                  <button
                    type="button"
                    className="btn primary primary-button"
                    onClick={() =>
                      setConfirm({
                        action: 'approve',
                        title: 'Approve decision?',
                        message: `Approve “${selected.name}” for implementation planning.`,
                      })
                    }
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn secondary-button"
                    onClick={() =>
                      setConfirm({
                        action: 'approveWithConditions',
                        title: 'Approve with conditions?',
                        message: conditions
                          ? `Approve “${selected.name}” with conditions: ${conditions}`
                          : `Approve “${selected.name}” with conditions (enter conditions above).`,
                      })
                    }
                  >
                    Approve with conditions
                  </button>
                  <button
                    type="button"
                    className="btn secondary-button"
                    onClick={() =>
                      setConfirm({
                        action: 'reject',
                        title: 'Reject decision?',
                        message: `Reject “${selected.name}”. This records a governance decision.`,
                        tone: 'danger',
                      })
                    }
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    className="btn secondary-button"
                    onClick={() =>
                      setConfirm({
                        action: 'defer',
                        title: 'Defer decision?',
                        message: `Defer “${selected.name}” to a later ARB cycle.`,
                      })
                    }
                  >
                    Defer
                  </button>
                </div>
              </>
            ) : (
              <p className="sub">Select a queue item to review.</p>
            )}
          </aside>
        </div>

        <div className="gov-lower">
          <div className="itemcard">
            <h3 className="section-title">Decision records</h3>
            {(Array.isArray(decisions) ? decisions : []).length === 0 && (
              <p className="sub">
                No persisted Decision entities yet — approve queue items to record decisions via
                store actions. Approved recommendations may still create initiatives.
              </p>
            )}
            <ul className="drawer-list">
              {(Array.isArray(decisions) ? decisions : []).map((d) => (
                <li key={d.id}>
                  <strong>{d.name || d.id}</strong> · {d.status}
                  {d.rationale ? ` — ${d.rationale}` : ''}
                  {(d.status === 'approved' || d.status === 'approved_with_conditions') && (
                    <>
                      {' '}
                      <button
                        type="button"
                        className="text-link"
                        onClick={() => openCreateFromDecision(d)}
                      >
                        Create initiative
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
            {selected && linkedRec?.status === 'approved' && (
              <button
                type="button"
                className="btn primary primary-button"
                style={{ marginTop: 10 }}
                onClick={() =>
                  openCreateFromDecision({
                    id: selected.id,
                    recommendationId: linkedRec.id,
                    status: 'approved',
                    name: `Decision on ${linkedRec.name}`,
                  })
                }
              >
                Create initiative from approved source
              </button>
            )}
            {approvedDecisions.length > 0 && (
              <p className="sub" style={{ marginTop: 8 }}>
                {approvedDecisions.length} approved decision(s) ready for initiative creation.
              </p>
            )}
          </div>

          <div className="itemcard">
            <h3 className="section-title">Audit history</h3>
            <ul className="audit-list">
              {audit.map((entry) => (
                <li key={entry.id || `${entry.at}-${entry.description}`}>
                  <time>{(entry.at || '').slice(0, 19).replace('T', ' ')}</time>
                  <span>{entry.description || entry.message || entry.action || 'Event'}</span>
                </li>
              ))}
              {!audit.length && <li className="sub">No audit events yet.</li>}
            </ul>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        message={confirm?.message}
        tone={confirm?.tone || 'default'}
        confirmLabel="Confirm"
        onCancel={() => setConfirm(null)}
        onConfirm={() => runDecision(confirm.action)}
      />

      <CreateInitiativeModal
        open={Boolean(createOpen)}
        source={createOpen || null}
        objectives={repo.listObjectives()}
        capabilities={repo.listCapabilities().filter((c) => c.level <= 2)}
        onClose={() => setCreateOpen(false)}
      />
    </section>
  )
}
