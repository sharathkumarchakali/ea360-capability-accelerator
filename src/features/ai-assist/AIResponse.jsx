import { usePrototypeStore } from '../../state/prototypeStore'
import ConfidenceIndicator from './ConfidenceIndicator'
import AssumptionList from './AssumptionList'
import EvidenceReferences from './EvidenceReferences'

const REVIEW_ACTIONS = [
  { status: 'helpful', label: 'Helpful' },
  { status: 'not_helpful', label: 'Not helpful' },
  { status: 'accepted', label: 'Accept for further review' },
  { status: 'rejected', label: 'Reject' },
]

function formatWhen(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function AIResponse({ response, onAction, compact }) {
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const reviewAiResponse = usePrototypeStore((s) => s.reviewAiResponse)
  const getRepo = usePrototypeStore((s) => s.getRepo)

  if (!response) return null

  const tenant = getRepo().getTenant?.()
  const tenantLabel = tenant?.shortName || response.tenantId

  return (
    <article className={`ai-response${compact ? ' compact' : ''}`}>
      <header className="ai-response-head">
        <div className="chip-row">
          <span className="tag blue">AI-assisted</span>
          <span className="tag">{tenantLabel}</span>
          <span className={`tag ${response.grounded === false ? 'amber' : 'green'}`}>
            {response.grounded === false ? 'Grounding check failed' : 'Grounded'}
          </span>
          {response.reviewStatus && response.reviewStatus !== 'unreviewed' ? (
            <span className="tag">{response.reviewStatus.replace(/_/g, ' ')}</span>
          ) : null}
        </div>
        <p className="sub">{formatWhen(response.generatedAt)} · intent {response.intent}</p>
      </header>

      <h3 className="ai-response-summary">{response.summary}</h3>
      {response.whyItMatters ? (
        <p>
          <strong>Why it matters.</strong> {response.whyItMatters}
        </p>
      ) : null}
      {response.explanation ? (
        <div className="ai-explanation">
          {response.explanation.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      ) : null}

      <div className="ai-fact-split">
        <div className="ai-fact-col">
          <h4 className="drawer-section-title">Facts</h4>
          {response.facts?.length ? (
            <ul>
              {response.facts.map((f, i) => (
                <li key={`f-${i}`}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="sub">None listed.</p>
          )}
        </div>
        <div className="ai-inference-col">
          <h4 className="drawer-section-title">Inferences</h4>
          {response.inferences?.length ? (
            <ul>
              {response.inferences.map((f, i) => (
                <li key={`i-${i}`}>{f}</li>
              ))}
            </ul>
          ) : (
            <p className="sub">None listed.</p>
          )}
        </div>
      </div>

      <h4 className="drawer-section-title">Evidence</h4>
      <EvidenceReferences evidenceIds={response.evidenceIds || []} />

      <h4 className="drawer-section-title">Related objects</h4>
      <div className="chip-row">
        {(response.entityRefs || []).map((ref) => (
          <button
            key={ref.id}
            type="button"
            className="link-chip"
            onClick={() => selectEntity({ id: ref.id, type: ref.type })}
          >
            {ref.name || ref.id}
            <span className="sub"> · {ref.type}</span>
          </button>
        ))}
        {!response.entityRefs?.length && <span className="sub">None</span>}
      </div>

      <h4 className="drawer-section-title">Assumptions</h4>
      <AssumptionList assumptions={response.assumptions} />

      <ConfidenceIndicator confidence={response.confidence} reason={response.confidenceReason} />

      {response.calculations?.length ? (
        <>
          <h4 className="drawer-section-title">Calculations</h4>
          <ul className="ai-calc-list">
            {response.calculations.map((c) => (
              <li key={c.id}>
                <strong>{c.label}</strong>: {c.formula} → <em>{String(c.result)}</em>
                {c.inputs?.length ? (
                  <span className="sub"> · inputs {c.inputs.join(', ')}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {response.suggestedActions?.length ? (
        <>
          <h4 className="drawer-section-title">Suggested actions</h4>
          <div className="toolbar wrap-actions">
            {response.suggestedActions.map((a) => (
              <button
                key={a.id}
                type="button"
                className="btn secondary-button"
                onClick={() => onAction?.(a, response)}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
      ) : null}

      <h4 className="drawer-section-title">Human review</h4>
      <div className="toolbar wrap-actions">
        {REVIEW_ACTIONS.map((a) => (
          <button
            key={a.status}
            type="button"
            className="btn tiny secondary-button"
            onClick={() => reviewAiResponse(response.id, a.status)}
          >
            {a.label}
          </button>
        ))}
        <button
          type="button"
          className="btn tiny secondary-button"
          onClick={() =>
            reviewAiResponse(response.id, 'rejected', 'Reported incorrect relationship')
          }
        >
          Report incorrect relationship
        </button>
      </div>
    </article>
  )
}
