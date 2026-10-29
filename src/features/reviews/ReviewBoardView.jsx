import { useMemo, useState } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { getCatalog } from '../ai-data-governance/governanceModel'
import { formatDemoAsOfLabel } from '../../domain/demo/demoClock'

const AWAITING = ['Pending', 'Deferred']

function statusTone(status) {
  if (status === 'Approved' || status === 'Approved with Conditions') return 'good'
  if (status === 'Rejected') return 'bad'
  return 'warn'
}

function DecisionPanel({ decision, recommendation, standards, pack }) {
  const approveWithConditions = usePrototypeStore((s) => s.approveDecisionWithConditions)
  const rejectDecision = usePrototypeStore((s) => s.rejectDecision)
  const deferDecision = usePrototypeStore((s) => s.deferDecision)
  const showToast = usePrototypeStore((s) => s.showToast)
  const [rationale, setRationale] = useState('')
  const [conditions, setConditions] = useState('')
  const [error, setError] = useState('')

  const awaiting = AWAITING.includes(decision.decisionStatus)
  const evidence = (pack.evidence ?? []).filter((e) => decision.evidenceIds?.includes(e.id))

  function run(kind) {
    const text = rationale.trim()
    if (!text) {
      setError('Enter a rationale before recording a decision.')
      return
    }
    if (kind === 'conditions' && !conditions.trim()) {
      setError('List at least one condition (one per line) for an Approved with Conditions decision.')
      return
    }
    setError('')
    const payload = { id: decision.id, rationale: text }
    const result =
      kind === 'conditions'
        ? approveWithConditions({ ...payload, conditions })
        : kind === 'reject'
          ? rejectDecision(payload)
          : deferDecision(payload)
    if (result?.ok) {
      showToast(
        kind === 'conditions' ? 'Decision recorded: Approved with Conditions.' : kind === 'reject' ? 'Decision recorded: Rejected.' : 'Decision deferred.',
      )
    } else {
      setError(result?.error || 'The decision could not be recorded.')
    }
  }

  return (
    <aside className="wv-panel" aria-label="Decision record" aria-live="polite">
      <h2>{decision.name}</h2>
      <p className="sub">
        {decision.id} · {decision.decisionAuthority}
      </p>
      <p>
        <span className={`status-tag tone-${statusTone(decision.decisionStatus)}`}>{decision.decisionStatus}</span>
      </p>
      {recommendation && (
        <p>
          <strong>Recommendation:</strong> {recommendation.name}
        </p>
      )}
      <p>
        <strong>Evidence:</strong> {evidence.length ? evidence.map((e) => e.name).join('; ') : 'No evidence linked'}
      </p>
      {decision.optionsConsidered?.length > 0 && (
        <>
          <h3>Options considered</h3>
          <ul>
            {decision.optionsConsidered.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </>
      )}
      <p>
        <strong>Required reviewers:</strong>{' '}
        {(decision.requiredReviewerIds ?? decision.reviewerIds ?? []).length || 'None recorded'}
      </p>
      <h3>Applicable standards</h3>
      {standards.length === 0 ? (
        <p className="sub">No recorded standard applies to the affected assets.</p>
      ) : (
        <ul>
          {standards.map((s) => (
            <li key={s.id}>
              {s.name} ({s.type})
            </li>
          ))}
        </ul>
      )}

      {awaiting ? (
        <form
          className="wv-form"
          onSubmit={(e) => {
            e.preventDefault()
            run('conditions')
          }}
        >
          <p className="sub">The board decides. The assistant cannot approve, reject or defer on anyone’s behalf.</p>
          <label className="field">
            <span>Rationale</span>
            <textarea rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)} />
          </label>
          <label className="field">
            <span>Conditions (one per line)</span>
            <textarea rows={3} value={conditions} onChange={(e) => setConditions(e.target.value)} />
          </label>
          {error && (
            <p className="wv-error" role="alert">
              {error}
            </p>
          )}
          <div className="wv-actions">
            <button type="submit" className="btn primary primary-button">
              Approve with conditions
            </button>
            <button type="button" className="btn secondary-button" onClick={() => run('defer')}>
              Defer
            </button>
            <button type="button" className="btn secondary-button" onClick={() => run('reject')}>
              Reject
            </button>
          </div>
        </form>
      ) : (
        <>
          <h3>Recorded outcome</h3>
          <p>{decision.rationale || 'No rationale recorded.'}</p>
          {Array.isArray(decision.conditions) && decision.conditions.length > 0 && (
            <ul>
              {decision.conditions.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}
          {decision.decisionDate && <p className="sub">Recorded {decision.decisionDate}</p>}
        </>
      )}
    </aside>
  )
}

export default function ReviewBoardView() {
  const pack = usePrototypeStore((s) => s.workingPack)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const selectedEntity = usePrototypeStore((s) => s.selectedEntity)
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const [filter, setFilter] = useState('awaiting')
  const [localId, setLocalId] = useState(null)

  const decisions = useMemo(() => pack?.decisions ?? [], [pack])
  const catalog = useMemo(() => getCatalog(tenantCode), [tenantCode])
  const queue = decisions.filter((d) => AWAITING.includes(d.decisionStatus))
  const visible = filter === 'awaiting' ? queue : decisions

  const selectedId = selectedEntity?.type === 'decision' ? selectedEntity.id : localId
  const selected = decisions.find((d) => d.id === selectedId) || null
  const recommendation = selected ? (pack.recommendations ?? []).find((r) => r.id === selected.recommendationId) : null
  const standards = selected
    ? (catalog.policies ?? []).filter((p) => p.applicableAssetIds?.some((id) => selected.affectedObjectIds?.includes(id)))
    : []

  function open(id) {
    setLocalId(id)
    selectEntity({ id, type: 'decision' })
  }

  if (!pack) return null

  return (
    <section className="view active wv-view" data-demo-target="review-board">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Governance · Review Board</div>
            <h1 className="page-title">Review Board</h1>
            <p>Decisions waiting for the board, with the evidence, options and standards needed to decide.</p>
            <p className="sub">{formatDemoAsOfLabel()}</p>
          </div>
          <div className="synthetic-pill">ILLUSTRATIVE DATA</div>
        </div>

        <div className="app-metric-strip" role="group" aria-label="Review board metrics">
          <div className="app-metric">
            <span>Awaiting decision</span>
            <strong>{queue.filter((d) => d.decisionStatus === 'Pending').length}</strong>
          </div>
          <div className="app-metric">
            <span>Deferred</span>
            <strong>{queue.filter((d) => d.decisionStatus === 'Deferred').length}</strong>
          </div>
          <div className="app-metric">
            <span>Decided</span>
            <strong>{decisions.length - queue.length}</strong>
          </div>
        </div>

        <div className="wv-filters" role="group" aria-label="Queue filter">
          <label className="field">
            <span>Show</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="awaiting">Awaiting decision (Pending and Deferred)</option>
              <option value="all">All decisions</option>
            </select>
          </label>
        </div>

        <div className="wv-split">
          <div className="table-wrap">
            <table className="data-table">
              <caption className="wv-caption">{visible.length} decisions. Select one to open its record.</caption>
              <thead>
                <tr>
                  <th>Decision</th>
                  <th>Status</th>
                  <th>Authority</th>
                  <th>Deadline</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5}>Nothing is waiting for the board.</td>
                  </tr>
                )}
                {visible.map((d) => (
                  <tr
                    key={d.id}
                    className={`clickable-row${d.id === selectedId ? ' is-selected' : ''}`}
                    tabIndex={0}
                    aria-selected={d.id === selectedId}
                    onClick={() => open(d.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        open(d.id)
                      }
                    }}
                  >
                    <td>{d.name}</td>
                    <td>
                      <span className={`status-tag tone-${statusTone(d.decisionStatus)}`}>{d.decisionStatus}</span>
                    </td>
                    <td>{d.decisionAuthority}</td>
                    <td>{d.decisionDeadline || '—'}</td>
                    <td>{d.riskSeverity || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {selected ? (
            <DecisionPanel key={selected.id} decision={selected} recommendation={recommendation} standards={standards} pack={pack} />
          ) : (
            <aside className="wv-panel">
              <p className="sub">Select a decision to review the recommendation, evidence and options.</p>
            </aside>
          )}
        </div>
        <p className="sub synthetic-disclosure">Illustrative synthetic review queue — not a record of any real board.</p>
      </div>
    </section>
  )
}
