import { useMemo, useState } from 'react'
import {
  getTenantConfig,
  listAvailableTenants,
  usePrototypeStore,
} from '../../state/prototypeStore'
import ConfirmDialog from '../ui/ConfirmDialog'

export default function Topbar({
  onMobileMenu,
  onSearch,
  notifOpen,
  profileOpen,
  onToggleNotif,
  onToggleProfile,
}) {
  const tenants = listAvailableTenants()
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const role = usePrototypeStore((s) => s.role)
  const setRole = usePrototypeStore((s) => s.setRole)
  const switchTenant = usePrototypeStore((s) => s.switchTenant)
  const resetDemo = usePrototypeStore((s) => s.resetDemo)
  const mutations = usePrototypeStore((s) => s.mutations)
  const filters = usePrototypeStore((s) => s.filters)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const tenant = tenants.find((t) => t.code === tenantCode)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const [pendingTenant, setPendingTenant] = useState(null)

  function requestTenantSwitch(nextCode) {
    if (nextCode === tenantCode) return
    if (mutations.length > 0) {
      setPendingTenant(nextCode)
      return
    }
    switchTenant(nextCode)
  }

  return (
    <header className="topbar">
      <button
        className="iconbtn mobile-menu"
        aria-label="Open navigation"
        type="button"
        onClick={onMobileMenu}
      >
        ☰
      </button>
      <div className="brand">
        <div className="brandmark" aria-hidden="true">
          EA
        </div>
        <div className="brandtext">
          <strong>EA360</strong>
          <span>Know Your Enterprise. Shape What’s Next.</span>
        </div>
      </div>
      <div className="tenant-select-wrap">
        <span className="tenant-lettermark" aria-hidden="true">
          {tenant?.lettermark || config.lettermark}
        </span>
        <select
          className="orgselect"
          aria-label="Organisation"
          value={tenantCode}
          onChange={(e) => requestTenantSwitch(e.target.value)}
        >
          {tenants.map((t) => (
            <option key={t.code} value={t.code}>
              {t.name} ({t.shortName}) · {t.tenantType} · Synthetic
            </option>
          ))}
        </select>
      </div>
      <select
        className="orgselect role-select"
        aria-label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        {config.roleLabels.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </select>
      <div className="top-actions">
        <span className="pill period">{filters.period}</span>
        <button
          className="pill ask-pill"
          type="button"
          onClick={() => setAskOpen(true)}
          title="Ask EA360"
        >
          Ask EA360
        </button>
        <button className="pill" type="button" onClick={onSearch}>
          ⌕ Search
        </button>
        <button
          className="pill"
          type="button"
          onClick={() => {
            resetDemo()
            window.location.hash = ''
          }}
          title="Restore seeded state for the active tenant"
        >
          Reset demo
        </button>
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
          {tenant?.lettermark || 'EA'}
        </button>
        <div className={`popover${notifOpen ? ' show' : ''}`}>
          <h4>Decision inbox</h4>
          <p>
            {tenant?.shortName}: review pending recommendations in the Decide section.
          </p>
        </div>
        <div className={`popover${profileOpen ? ' show' : ''}`}>
          <h4>EA360 prototype</h4>
          <p>Enterprise Intelligence and Transformation Governance · Kulana</p>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingTenant)}
        title="Switch organisation?"
        message={`You have ${mutations.length} unsaved demo mutation(s) on ${tenant?.shortName || tenantCode}. Switching tenants isolates session state; continue?`}
        confirmLabel="Switch tenant"
        cancelLabel="Stay"
        tone="danger"
        onCancel={() => setPendingTenant(null)}
        onConfirm={() => {
          const next = pendingTenant
          setPendingTenant(null)
          if (next) switchTenant(next)
        }}
      />
    </header>
  )
}
