import { usePrototypeStore } from '../../state/prototypeStore'

const NAV = [
  ['Understand', [
    ['Executive Cockpit', 'executive', '⌘'],
    ['Capabilities', 'capabilities', '▣'],
    ['Applications', 'applications', '⧉'],
  ]],
  ['Diagnose', [
    ['Integration Landscape', 'integrations', '⟷'],
    ['Relationship Explorer', 'explorer', '⬡'],
    ['Findings & Risks', 'findings', '⚑'],
    ['Evidence', 'evidence', '▤'],
  ]],
  ['Decide', [
    ['Recommendations', 'recommendations', '✓'],
    ['Governance & Decisions', 'governance', '▧'],
  ]],
  ['Transform', [['Roadmap', 'roadmap', '⌁']]],
]

export default function Sidebar({ open, onNavigate }) {
  const activeView = usePrototypeStore((s) => s.view)
  const repo = usePrototypeStore((s) => s.getRepo)()
  const metrics = repo.getExecutiveMetrics()

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <nav className="nav">
        {NAV.map(([group, items]) => (
          <div className="group" key={group}>
            <div className="group-title">{group}</div>
            {items.map(([label, id, ico]) => (
              <button
                key={id}
                type="button"
                className={`navitem${activeView === id ? ' active' : ''}`}
                onClick={() => onNavigate(id)}
              >
                <span className="left">
                  <span className="ico">{ico}</span>
                  <span>{label}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidefoot">
        <div className="cap-card">
          <div className="cap-label">Enterprise health</div>
          <div className="cap-score">
            {metrics.enterpriseHealth} <span>/ 100</span>
          </div>
          <div className="progress">
            <div style={{ width: `${metrics.enterpriseHealth}%` }} />
          </div>
          <p>Derived from GRA maturity, risk, application health and initiative progress.</p>
        </div>
        <div className="version">Synthetic demonstration data · v0.1</div>
      </div>
    </aside>
  )
}
