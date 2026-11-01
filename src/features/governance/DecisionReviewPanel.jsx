import { useState } from 'react'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { callStoreAction } from '../workflow/callStoreAction'

function formatStatus(d) {
  return d?.status || d?.decisionStatus || 'Unknown'
}

function formatOwner(id) {
  if (!id) return 'Unknown'
  return String(id).replace(/^person-/, '').replace(/-/g, ' ')
}

/**
 * Canonical governed decision review — shared by Decision register and entity drawer.
 */
export default function DecisionReviewPanel({
  decision,
  repo,
  linkedRecommendation,
  compact = false,
  onRecorded,
}) {
  const [reviewMode, setReviewMode] = useState(false)
  const [rationale, setRationale] = useState('')
  const [conditions, setConditions] = useState('')
  const [confirm, setConfirm] = useState(null)

  if (!decision) return null

  const rec = linkedRecommendation || (decision.recommendationId ? repo.getRecommendation?.(decision.recommendationId) : null)
  const evidenceIds = rec?.findingIds?.flatMap((fid) => repo.getFinding(fid)?.evidenceIds || []) || []
  const evidence = [...new Set(evidenceIds)]
    .map((id) => repo.getEvidence?.(id))
    .filter(Boolean)

  function runConfirm() {
    if (!confirm) return
    const payload = {
      decisionId: decision.id,
      rationale: rationale.trim() || undefined,
      conditions: conditions.trim() || undefined,
    }
    const action = confirm.action
    if (action === 'approve') callStoreAction('approveDecision', payload)
    else if (action === 'approveWithConditions') {
      if (!conditions.trim()) return
      callStoreAction('approveDecisionWithConditions', payload)
    } else if (action === 'reject') callStoreAction('rejectDecision', payload)
    else if (action === 'defer') callStoreAction('deferDecision', payload)
    setConfirm(null)
    setRationale('')
    setConditions('')
    setReviewMode(false)
    onRecorded?.()
  }

  return (
    <div className="decision-review-panel">
      <dl className="decision-review-facts">
        <div>
          <dt>Workflow status</dt>
          <dd>{formatStatus(decision)}</dd>
        </div>
        <div>
          <dt>Business reason</dt>
          <dd>{decision.summary || decision.rationale || rec?.outcome || 'Not recorded'}</dd>
        </div>
        <div>
          <dt>Authority / owner</dt>
          <dd>{formatOwner(decision.ownerId || decision.approverId)}</dd>
        </div>
        <div>
          <dt>Deadline</dt>
          <dd>{decision.deadline || decision.targetDate || 'Not specified'}</dd>
        </div>
        <div>
          <dt>Delivery link</dt>
          <dd>{rec?.name || decision.recommendationId || 'None linked'}</dd>
        </div>
      </dl>

      {evidence.length > 0 && (
        <div className="decision-review-evidence">
          <h4>Evidence</h4>
          <ul className="drawer-list">
            {evidence.map((e) => (
              <li key={e.id}>{e.name}</li>
            ))}
          </ul>
        </div>
      )}

      {!reviewMode ? (
        <button type="button" className="btn primary primary-button" onClick={() => setReviewMode(true)}>
          Review decision
        </button>
      ) : (
        <>
          <label className="field grow">
            <span>Rationale {compact ? '' : '(required for approval)'}</span>
            <textarea
              rows={2}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Why this decision is appropriate…"
            />
          </label>
          <label className="field grow">
            <span>Conditions (required for approve with conditions)</span>
            <input
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="Enter conditions — not pre-filled"
            />
          </label>
          <div className="toolbar wrap-actions">
            <button
              type="button"
              className="btn primary primary-button"
              disabled={!rationale.trim()}
              onClick={() =>
                setConfirm({
                  action: 'approve',
                  title: 'Approve decision?',
                  message: `Record approval for “${decision.name || decision.id}”.`,
                })
              }
            >
              Approve
            </button>
            <button
              type="button"
              className="btn secondary-button"
              disabled={!conditions.trim()}
              onClick={() =>
                setConfirm({
                  action: 'approveWithConditions',
                  title: 'Approve with conditions?',
                  message: conditions.trim(),
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
                  message: 'Reject and return to governance queue.',
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
                  message: 'Defer until more evidence is available.',
                })
              }
            >
              Defer
            </button>
            <button type="button" className="btn secondary-button" onClick={() => setReviewMode(false)}>
              Cancel review
            </button>
          </div>
        </>
      )}

      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          message={confirm.message}
          onConfirm={runConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}
