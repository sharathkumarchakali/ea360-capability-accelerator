import { usePrototypeStore } from '../../state/prototypeStore'

/**
 * Banner + actions for an AI recommendation draft.
 * Never auto-approves — Save for review only persists a draft.
 */
export default function RecommendationDraft({ response, onDiscard }) {
  const saveRecommendationDraft = usePrototypeStore((s) => s.saveRecommendationDraft)
  const reviewAiResponse = usePrototypeStore((s) => s.reviewAiResponse)

  if (!response || response.intent !== 'recommendation_draft') return null

  const findingRef = (response.entityRefs || []).find((r) => r.type === 'finding')
  const findingId = findingRef?.id

  function save() {
    if (!findingId) return
    saveRecommendationDraft({
      findingId,
      responseId: response.id,
      summary: response.summary,
      explanation: response.explanation,
      evidenceIds: response.evidenceIds || [],
      reviewStatus: 'accepted',
      humanEdited: false,
    })
    reviewAiResponse(response.id, 'accepted', 'Saved AI draft for architect review')
  }

  return (
    <div className="ai-draft-banner">
      <div className="kicker">Recommendation draft</div>
      <p className="ai-draft-warning">
        AI-assisted draft — requires architect validation. Not submitted and not approved.
      </p>
      <p className="sub">
        Finding: {findingRef?.name || findingId || '—'} · Confidence {response.confidence}
      </p>
      <div className="toolbar wrap-actions">
        <button
          type="button"
          className="btn primary primary-button"
          disabled={!findingId}
          onClick={save}
        >
          Save for review
        </button>
        <button type="button" className="btn secondary-button" onClick={() => onDiscard?.(response)}>
          Discard
        </button>
      </div>
    </div>
  )
}
