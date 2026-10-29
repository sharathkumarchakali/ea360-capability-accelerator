import {
  Activity,
  BarChart3,
  BookMarked,
  Building2,
  Clapperboard,
  FileText,
  Gauge,
  Network,
  Settings,
  Upload,
  CircleCheck,
  Database,
  FileCheck,
  LayoutDashboard,
  LayoutGrid,
  Lightbulb,
  PanelLeftClose,
  PanelLeftOpen,
  Rocket,
  Route,
  Server,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Users,
  Waypoints,
} from 'lucide-react'
import { usePrototypeStore } from '../../state/prototypeStore'

/** Primary product IA — Phase 0 navigation only. */
const NAV = [
  [
    'Home',
    [
      {
        label: 'Executive Overview',
        id: 'executive',
        Icon: LayoutDashboard,
      },
    ],
  ],
  [
    'Portfolios',
    [
      { label: 'Capabilities', id: 'capabilities', Icon: Gauge },
      { label: 'Applications', id: 'applications', Icon: LayoutGrid },
      { label: 'Integrations & APIs', id: 'integrations', Icon: Waypoints },
      {
        label: 'Data & Information',
        id: 'data-information',
        Icon: Database,
      },
      {
        label: 'Technology & Infrastructure',
        id: 'technology-infrastructure',
        Icon: Server,
      },
      {
        label: 'AI & Automation',
        id: 'ai-automation',
        Icon: Sparkles,
      },
    ],
  ],
  [
    'Insights',
    [
      { label: 'Architecture Health', id: 'assessment', Icon: Activity },
      { label: 'Relationship Explorer', id: 'explorer', Icon: Network },
      { label: 'Findings & Risks', id: 'findings', Icon: TriangleAlert },
      { label: 'Evidence', id: 'evidence', Icon: FileCheck },
      { label: 'Recommendations', id: 'recommendations', Icon: Lightbulb },
    ],
  ],
  [
    'Transform',
    [
      { label: 'Roadmap', id: 'roadmap', Icon: Route },
      {
        label: 'Initiatives',
        id: 'initiatives',
        Icon: Rocket,
      },
      { label: 'KPIs', id: 'kpis', Icon: BarChart3 },
      { label: 'Reports', id: 'reports', Icon: FileText },
    ],
  ],
  [
    'Governance',
    [
      { label: 'Standards & Principles', id: 'standards', Icon: BookMarked },
      { label: 'Decision Register', id: 'decisions', Icon: CircleCheck },
      { label: 'Review Board', id: 'reviews', Icon: Users },
      {
        label: 'AI & Data Governance',
        id: 'ai-data-governance',
        Icon: ShieldCheck,
      },
    ],
  ],
  [
    'Workspace',
    [
      { label: 'Demo Studio', id: 'demo-studio', Icon: Clapperboard },
      { label: 'Customer Onboarding', id: 'onboarding', Icon: Building2 },
      { label: 'Data Ingestion', id: 'data-ingestion', Icon: Upload },
      { label: 'Workspace Settings', id: 'workspace-settings', Icon: Settings },
    ],
  ],
]

const COMING_NEXT_MESSAGE = 'Module scheduled for the next implementation phase.'

/** Decision Register shares the existing governance screen / deep links. */
function isNavActive(id, activeView) {
  if (id === 'decisions') return activeView === 'decisions' || activeView === 'governance'
  return activeView === id
}

export default function Sidebar({ open, collapsed, onToggleCollapse, onNavigate }) {
  const activeView = usePrototypeStore((s) => s.view)
  const showToast = usePrototypeStore((s) => s.showToast)

  function handleNav(item) {
    if (item.comingNext) {
      showToast(COMING_NEXT_MESSAGE)
      return
    }
    onNavigate(item.id)
  }

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
            {items.map((item) => {
              const { label, id, Icon, comingNext } = item
              const active = !comingNext && isNavActive(id, activeView)
              const title = comingNext ? `${label} — Coming next` : label

              return (
                <button
                  key={id}
                  type="button"
                  className={`navitem${active ? ' active' : ''}${comingNext ? ' is-coming' : ''}`}
                  aria-current={active ? 'page' : undefined}
                  aria-label={comingNext ? `${label}, coming next` : undefined}
                  title={title}
                  onClick={() => handleNav(item)}
                >
                  <span className="left">
                    <span className="ico" aria-hidden="true">
                      <Icon size={16} strokeWidth={2} />
                    </span>
                    <span className="nav-label">{label}</span>
                  </span>
                  {comingNext ? (
                    <span className="nav-coming" aria-hidden="true">
                      Coming next
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
