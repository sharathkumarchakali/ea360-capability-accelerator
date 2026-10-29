import { ExternalLink, FilePlus2, Save, ShieldAlert } from 'lucide-react'
import { usePrototypeStore } from '../../state/prototypeStore'

/**
 * Review panel for an AI recommendation draft (Ask Q28).
 *
 * Two explicit human steps, both idempotent:
 *   1. "Save for review" stores the draft (saving the same answer again reuses the saved draft).
 *   2. "Create recommendation draft" creates a real pack Recommendation with status Draft.
 * Nothing here submits, sends to ARB or approves; approval stays in Governance.
 */
export default function RecommendationDraftReview({ response, onDiscard }) {
  const drafts = usePrototypeStore((s) => s.recommendationDrafts)
  const recommendations = usePrototypeStore((s) => s.workingPack?.recommendations)
  const saveRecommendationDraft = usePrototypeStore((s) => s.saveRecommendationDraft)
  const convertRecommendationDraftToEntity = usePrototypeStore((s) => s.convertRecommendationDraftToEntity)
  const reviewAiResponse = usePrototypeStore((s) => s.reviewAiResponse)
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const showToast = usePrototypeStore((s) => s.showToast)

  if (!response || response.intent !== 'recommendation_draft') return null

  const findingRef = (response.entityRefs || []).find((r) => r.type === 'finding')
  const findingId = findingRef?.id
  const payload = response.recommendationDraft
  const saved = drafts.find((d) => d.responseId === response.id)
  const entity = saved?.recommendationId ? (recommendations || []).find((r) => r.id === saved.recommendationId) : null

  function save() {
    if (!findingId) return
    const result = saveRecommendationDraft({
      findingId,
      responseId: response.id,
      summary: response.summary,
      explanation: response.explanation,
      evidenceIds: response.evidenceIds || [],
      reviewStatus: 'accepted',
      humanEdited: false,
      payload,
    })
    if (result.ok) {
      reviewAiResponse(response.id, 'accepted', 'Saved AI draft for architect review')
      showToast('Draft saved for review. It has not been submitted or approved.')
    }
  }

  function createDraft() {
    if (!saved) return
    const result = convertRecommendationDraftToEntity(saved.id)
    showToast(
      result.ok
        ? result.existing
          ? 'This draft was already converted. Opening the existing recommendation draft.'
          : 'Recommendation draft created with status Draft. It has not been submitted or approved.'
        : result.error || 'The recommendation draft could not be created.',
    )
  }

  function openRecommendation() {
    if (!saved?.recommendationId) return
    setView('recommendations')
    window.location.hash = 'recommendations'
    selectEntity({ id: saved.recommendationId, type: 'recommendation' })
    setAskOpen(false)
  }

  return (
    <section className="ai-draft-banner" aria-label="Recommendation draft review">
      <div className="kicker">Recommendation draft</div>
      <p className="ai-draft-warning">
        <ShieldAlert size={16} aria-hidden="true" /> AI-assisted draft — requires architect validation. Not submitted and
        not approved.
      </p>
      <p className="sub">
        Finding: {findingRef?.name || findingId || '—'} · Confidence {response.confidence} ·{' '}
        {(response.evidenceIds || []).length} evidence item(s)
      </p>
      {payload ? (
        <dl className="ai-draft-fields">
          <dt>Intended outcome</dt>
          <dd>{payload.intendedOutcome}</dd>
          <dt>Recommended action</dt>
          <dd>{payload.recommendedAction}</dd>
          <dt>Options considered</dt>
          <dd>{(payload.optionsConsidered || []).join(' · ')}</dd>
          <dt>Indicative effort</dt>
          <dd>{payload.indicativeEffort}</dd>
        </dl>
      ) : null}

      <ol className="ai-draft-steps" aria-label="Draft lifecycle">
        <li className={saved ? 'is-done' : 'is-current'}>1. Save for review{saved ? ' — saved' : ''}</li>
        <li className={entity ? 'is-done' : saved ? 'is-current' : ''}>
          2. Create recommendation draft{entity ? ` — ${entity.workflowStatus || entity.status}` : ''}
        </li>
        <li>3. Submit and approve in Governance (human decision, not available here)</li>
      </ol>

      <div className="toolbar wrap-actions">
        {!saved ? (
          <button type="button" className="btn primary primary-button" disabled={!findingId} onClick={save}>
            <Save size={16} aria-hidden="true" /> Save for review
          </button>
        ) : null}
        {saved && !entity ? (
          <button type="button" className="btn primary primary-button" onClick={createDraft}>
            <FilePlus2 size={16} aria-hidden="true" /> Create recommendation draft
          </button>
        ) : null}
        {entity ? (
          <button type="button" className="btn primary primary-button" onClick={openRecommendation}>
            <ExternalLink size={16} aria-hidden="true" /> Open recommendation draft
          </button>
        ) : null}
        <button type="button" className="btn secondary-button" onClick={() => onDiscard?.(response)}>
          Hide
        </button>
      </div>
      {saved && !entity ? (
        <p className="sub">Creating the recommendation draft adds a Draft record to this workspace. It is not submitted or approved.</p>
      ) : null}
    </section>
  )
}
