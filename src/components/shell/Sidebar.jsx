import { usePrototypeStore } from '../../state/prototypeStore'
import { getTenantConfig } from '../../state/prototypeStore'

const NAV = [
  [
    'Executive',
    [['Executive Cockpit', 'executive', '⌘']],
  ],
  [
    'Enterprise Map',
    [
      ['Relationship Explorer', 'explorer', '⬡'],
      ['Capabilities', 'capabilities', '▣'],
    ],
  ],
  [
    'Portfolios',
    [
      ['Applications', 'applications', '⧉'],
      ['Integrations and APIs', 'integrations', '⟷'],
    ],
  ],
  [
    'Insights',
    [
      ['Findings and Risks', 'findings', '⚑'],
      ['Evidence', 'evidence', '▤'],
      ['Recommendations', 'recommendations', '✓'],
    ],
  ],
  [
    'Transformation',
    [['Roadmap', 'roadmap', '⌁']],
  ],
  [
    'Governance',
    [['Decisions', 'governance', '▧']],
  ],
  [
    'Reports',
    [['Executive Report', 'reports', '▥']],
  ],
]

export default function Sidebar({ open, onNavigate }) {
  const activeView = usePrototypeStore((s) => s.view)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const repo = usePrototypeStore((s) => s.getRepo)()
  const metrics = repo.getExecutiveMetrics()
  const config = getTenantConfig(tenantCode)
  const tenant = repo.getTenant()

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Primary">
      <nav className="nav">
        {NAV.map(([group, items]) => (
          <div className="group" key={group}>
            <div className="group-title">{group}</div>
            {items.map(([label, id, ico]) => (
              <button
                key={id}
                type="button"
                className={`navitem${activeView === id ? ' active' : ''}`}
                aria-current={activeView === id ? 'page' : undefined}
                onClick={() => onNavigate(id)}
              >
                <span className="left">
                  <span className="ico" aria-hidden="true">
                    {ico}
                  </span>
                  <span>{label}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidefoot">
        <div className="cap-card">
          <div className="cap-label">Enterprise health · {tenant.shortName}</div>
          <div className="cap-score">
            {metrics.enterpriseHealth} <span>/ 100</span>
          </div>
          <div className="progress" aria-hidden="true">
            <div style={{ width: `${metrics.enterpriseHealth}%` }} />
          </div>
          <p>
            Derived from {tenant.shortName} maturity, risk, application health and initiative
            progress.
          </p>
        </div>
        <div className="version">{config.syntheticDisclaimer}</div>
      </div>
    </aside>
  )
}
