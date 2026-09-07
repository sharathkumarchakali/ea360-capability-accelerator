import { useState } from 'react'
import { callStoreAction } from '../workflow/callStoreAction'

const TRUST_LABELS = {
  verified: 'Verified',
  unverified: 'Unverified',
  stale: 'Stale',
  disputed: 'Disputed',
  missing: 'Missing',
}

/** Derive trust badge when extended Evidence.trustStatus is absent. */
export function deriveTrustStatus(evidence, { asOf = '2026-09-07' } = {}) {
  if (!evidence) return 'missing'
  if (evidence.trustStatus) return evidence.trustStatus
  if (evidence.verificationStatus) return evidence.verificationStatus
  if (evidence.disputed) return 'disputed'
  const updated = (evidence.updatedAt || evidence.createdAt || '').slice(0, 10)
  if (updated && updated < '2025-09-01') return 'stale'
  if (evidence.confidence === 'high' && evidence.status === 'active') return 'verified'
  if (evidence.confidence === 'low') return 'unverified'
  return 'unverified'
}

function TrustBadge({ status }) {
  const key = TRUST_LABELS[status] ? status : 'unverified'
  return <span className={`trust-badge trust-${key}`}>{TRUST_LABELS[key]}</span>
}

/**
 * Reusable evidence panel: trust badges, synthetic preview, verify/dispute/note actions.
 */
export default function EvidencePanel({
  evidenceList = [],
  findingId,
  compact = false,
  onOpenEvidence,
}) {
  const [noteDrafts, setNoteDrafts] = useState({})
  const [previewId, setPreviewId] = useState(null)

  if (!evidenceList.length) {
    return (
      <div className="evidence-panel empty">
        <span className="trust-badge trust-missing">Missing</span>
        <p className="sub">No evidence linked. Attach or validate sources before remediation.</p>
      </div>
    )
  }

  return (
    <div className={`evidence-panel${compact ? ' compact' : ''}`}>
      {evidenceList.map((e) => {
        const trust = deriveTrustStatus(e)
        const open = previewId === e.id
        return (
          <article key={e.id} className="evidence-card">
            <header className="evidence-card-head">
              <div>
                <strong>{e.name}</strong>
                <div className="sub">
                  {e.evidenceType} · confidence {e.confidence} · owner{' '}
                  {(e.ownerId || '').replace('person-', '') || 'unassigned'}
                </div>
              </div>
              <TrustBadge status={trust} />
            </header>
            {!compact && <p>{e.description}</p>}
            <div className="toolbar evidence-actions">
              <button
                type="button"
                className="btn secondary-button"
                onClick={() => setPreviewId(open ? null : e.id)}
              >
                {open ? 'Hide preview' : 'Synthetic preview'}
              </button>
              {onOpenEvidence && (
                <button
                  type="button"
                  className="btn secondary-button"
                  onClick={() => onOpenEvidence(e.id)}
                >
                  Open
                </button>
              )}
              <button
                type="button"
                className="btn secondary-button"
                onClick={() =>
                  callStoreAction('markVerified', { evidenceId: e.id, findingId })
                }
              >
                Mark verified
              </button>
              <button
                type="button"
                className="btn secondary-button"
                onClick={() =>
                  callStoreAction('markDisputed', { evidenceId: e.id, findingId })
                }
              >
                Mark disputed
              </button>
            </div>
            {open && (
              <div className="evidence-preview" aria-live="polite">
                <div className="kicker">Synthetic document preview</div>
                <h4>{e.name}</h4>
                <p>
                  Illustrative extract for demo purposes. Type: {e.evidenceType}. Linked objects:{' '}
                  {(e.linkedObjectIds || []).join(', ') || 'none'}. Source refs:{' '}
                  {(e.sourceRefs || []).join(', ') || 'gra-seed'}.
                </p>
                <p className="sub">
                  No file upload in this prototype — preview is generated from seed metadata.
                </p>
              </div>
            )}
            <div className="evidence-note">
              <label className="field grow">
                <span>Add note</span>
                <input
                  value={noteDrafts[e.id] || ''}
                  onChange={(ev) =>
                    setNoteDrafts((prev) => ({ ...prev, [e.id]: ev.target.value }))
                  }
                  placeholder="Observation or caveat…"
                />
              </label>
              <button
                type="button"
                className="btn primary primary-button"
                disabled={!(noteDrafts[e.id] || '').trim()}
                onClick={() => {
                  const note = (noteDrafts[e.id] || '').trim()
                  callStoreAction('addNote', { evidenceId: e.id, findingId, note })
                  setNoteDrafts((prev) => ({ ...prev, [e.id]: '' }))
                }}
              >
                Save note
              </button>
            </div>
          </article>
        )
      })}
    </div>
  )
}
