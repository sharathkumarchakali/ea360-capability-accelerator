const TONE = {
  high: 'green',
  medium: 'amber',
  low: 'red',
}

export default function ConfidenceIndicator({ confidence, reason }) {
  const level = confidence || 'low'
  const tone = TONE[level] || 'amber'
  return (
    <div className="ai-confidence">
      <span className={`tag ${tone}`}>Confidence · {level}</span>
      {reason ? <p className="sub ai-confidence-reason">{reason}</p> : null}
    </div>
  )
}
