export default function AssumptionList({ assumptions = [] }) {
  if (!assumptions.length) {
    return <p className="sub">No assumptions recorded.</p>
  }
  return (
    <ul className="ai-assumption-list">
      {assumptions.map((a, i) => (
        <li key={`${i}-${String(a).slice(0, 24)}`}>{a}</li>
      ))}
    </ul>
  )
}
