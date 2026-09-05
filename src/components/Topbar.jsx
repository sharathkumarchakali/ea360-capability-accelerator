import { organisations } from '../data'

export default function Topbar({
  organisation,
  onOrganisationChange,
  onMobileMenu,
  onSearch,
  notifOpen,
  profileOpen,
  onToggleNotif,
  onToggleProfile,
  onProfileSettings,
}) {
  return (
    <header className="topbar">
      <button
        id="mobileMenu"
        className="iconbtn mobile-menu"
        aria-label="Open navigation"
        type="button"
        onClick={onMobileMenu}
      >
        ☰
      </button>
      <div className="brand">
        <div className="brandmark">EA</div>
        <div className="brandtext">
          <strong>EA360</strong>
          <span>Know Your Enterprise</span>
        </div>
      </div>
      <select
        className="orgselect"
        aria-label="Organisation"
        value={organisation}
        onChange={(e) => onOrganisationChange(e.target.value)}
      >
        {organisations.map((org) => (
          <option key={org} value={org}>
            {org}
          </option>
        ))}
      </select>
      <div className="top-actions">
        <button className="pill" type="button" onClick={onSearch}>
          ⌕&nbsp; Search
        </button>
        <span className="pill period">FY2026 · Q2</span>
        <button
          className="iconbtn blue"
          type="button"
          aria-label="Notifications"
          aria-expanded={notifOpen}
          onClick={onToggleNotif}
        >
          ♢
        </button>
        <button
          className="iconbtn dark"
          type="button"
          aria-label="Profile"
          aria-expanded={profileOpen}
          onClick={onToggleProfile}
        >
          SK
        </button>
        <div className={`popover${notifOpen ? ' show' : ''}`}>
          <h4>Notifications</h4>
          <p>
            No operational alerts. Demo notifications are intentionally limited in
            this prototype.
          </p>
        </div>
        <div className={`popover${profileOpen ? ' show' : ''}`}>
          <h4>Sharath Kumar</h4>
          <p>EA360 Prototype</p>
          <button
            className="btn"
            type="button"
            style={{ width: '100%' }}
            onClick={onProfileSettings}
          >
            Profile settings
          </button>
        </div>
      </div>
    </header>
  )
}
