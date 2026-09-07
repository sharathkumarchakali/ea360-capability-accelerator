import { getTenantConfig, usePrototypeStore } from '../../state/prototypeStore'
import { SUGGESTED_QUESTIONS } from '../../lib/ai'

export default function SuggestedQuestions({ onSelect, disabled }) {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const questions = getTenantConfig(tenantCode).suggestedQuestions?.length
    ? getTenantConfig(tenantCode).suggestedQuestions
    : SUGGESTED_QUESTIONS

  return (
    <div className="ai-suggested-questions">
      <div className="kicker">Suggested questions</div>
      <div className="chip-row">
        {questions.map((q) => (
          <button
            key={q}
            type="button"
            className="ai-question-chip"
            disabled={disabled}
            onClick={() => onSelect?.(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
