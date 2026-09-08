import {
  Boxes,
  CheckSquare,
  FileText,
  Flag,
  FolderOpen,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Network,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  Shield,
} from 'lucide-react'
import { usePrototypeStore } from '../../state/prototypeStore'

const NAV = [
  [
    'Executive',
    [['Executive Cockpit', 'executive', LayoutDashboard]],
  ],
  [
    'Enterprise Map',
    [
      ['Relationship Explorer', 'explorer', Network],
      ['Capabilities', 'capabilities', Boxes],
    ],
  ],
  [
    'Portfolios',
    [
      ['Applications', 'applications', FolderOpen],
      ['Integrations and APIs', 'integrations', GitBranch],
    ],
  ],
  [
    'Insights',
    [
      ['Findings and Risks', 'findings', Flag],
      ['Evidence', 'evidence', FileText],
      ['Recommendations', 'recommendations', CheckSquare],
    ],
  ],
  [
    'Transformation',
    [['Roadmap', 'roadmap', Route]],
  ],
  [
    'Governance',
    [['Decisions', 'governance', Shield]],
  ],
  [
    'Reports',
    [['Executive Report', 'reports', Gauge]],
  ],
]

export default function Sidebar({ open, collapsed, onToggleCollapse, onNavigate }) {
  const activeView = usePrototypeStore((s) => s.view)

  return (
    <aside
      className={`sidebar${open ? ' open' : ''}${collapsed ? ' is-collapsed' : ''}`}
      aria-label="Primary"
    >
      <div className="sidebar-toolbar">
        <button
          type="button"
          className="sidebar-collapse-btn"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-pressed={collapsed}
          onClick={onToggleCollapse}
        >
          {collapsed ? (
            <PanelLeftOpen size={16} strokeWidth={2} aria-hidden="true" />
          ) : (
            <PanelLeftClose size={16} strokeWidth={2} aria-hidden="true" />
          )}
          <span className="sidebar-collapse-label">Collapse</span>
        </button>
      </div>

      <nav className="nav">
        {NAV.map(([group, items]) => (
          <div className="group" key={group}>
            <div className="group-title">{group}</div>
            {items.map(([label, id, Icon]) => (
              <button
                key={id}
                type="button"
                className={`navitem${activeView === id ? ' active' : ''}`}
                aria-current={activeView === id ? 'page' : undefined}
                title={label}
                onClick={() => onNavigate(id)}
              >
                <span className="left">
                  <span className="ico" aria-hidden="true">
                    <Icon size={16} strokeWidth={2} />
                  </span>
                  <span className="nav-label">{label}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
