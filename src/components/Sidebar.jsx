import { navGroups } from '../data'

export default function Sidebar({ activeView, onNavigate, open }) {
  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>
      <nav className="nav">
        {navGroups.map(([group, items]) => (
          <div className="group" key={group}>
            <div className="group-title">{group}</div>
            {items.map(([label, id, ico, badge]) => (
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
                {badge ? <span className="badge">{badge}</span> : null}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidefoot">
        <div className="cap-card">
          <div className="cap-label">EA Capability</div>
          <div className="cap-score">
            2.6 <span>/ 5</span>
          </div>
          <div className="progress">
            <div style={{ width: '52%' }} />
          </div>
          <p>Capability visibility is the first step to improving it.</p>
        </div>
        <div className="version">v0.1 · Illustrative Data</div>
      </div>
    </aside>
  )
}
