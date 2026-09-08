import { useCallback, useMemo, useState } from 'react'
import { Bell, Menu, MessageSquareText, Search } from 'lucide-react'
import {
  getTenantConfig,
  listAvailableTenants,
  usePrototypeStore,
} from '../../state/prototypeStore'
import ConfirmDialog from '../ui/ConfirmDialog'
import SyntheticBadge from './SyntheticBanner'
import DemoControls from './ContextBar'

export default function Topbar({
  onMobileMenu,
  onSearch,
  onOpenDemoHome,
  notifOpen,
  profileOpen,
  onToggleNotif,
  onToggleProfile,
}) {
  const tenants = listAvailableTenants()
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const switchTenant = usePrototypeStore((s) => s.switchTenant)
  const mutations = usePrototypeStore((s) => s.mutations)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const tenant = tenants.find((t) => t.code === tenantCode)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const [pendingTenant, setPendingTenant] = useState(null)
  const [demoOpen, setDemoOpen] = useState(false)

  const closeDemo = useCallback(() => setDemoOpen(false), [])

  function requestTenantSwitch(nextCode) {
    if (nextCode === tenantCode) return
    if (mutations.length > 0) {
      setPendingTenant(nextCode)
      return
    }
    switchTenant(nextCode)
  }

  function toggleNotif() {
    setDemoOpen(false)
    onToggleNotif()
  }

  function toggleProfile() {
    setDemoOpen(false)
    onToggleProfile()
  }

  function toggleDemo() {
    setDemoOpen((v) => !v)
    if (notifOpen) onToggleNotif()
    if (profileOpen) onToggleProfile()
  }

  return (
    <header className="topbar">
      <button
        className="iconbtn mobile-menu"
        aria-label="Open navigation"
        type="button"
        onClick={onMobileMenu}
      >
        <Menu size={18} strokeWidth={2} aria-hidden="true" />
      </button>

      <div className="brand">
        <div className="brandmark" aria-hidden="true">
          EA
        </div>
        <div className="brandtext">
          <strong>EA360</strong>
        </div>
      </div>

      <div className="tenant-select-wrap">
        <span className="tenant-lettermark" aria-hidden="true">
          {tenant?.lettermark || config.lettermark}
        </span>
        <select
          className="orgselect tenant-select"
          aria-label="Organisation"
          title={
            tenant
              ? `${tenant.name} (${tenant.shortName}) · ${tenant.tenantType}`
              : 'Organisation'
          }
          value={tenantCode}
          onChange={(e) => requestTenantSwitch(e.target.value)}
        >
          {tenants.map((t) => (
            <option key={t.code} value={t.code} title={`${t.name} · ${t.tenantType}`}>
              {t.shortName} · {t.tenantType}
            </option>
          ))}
        </select>
        <SyntheticBadge />
      </div>

      <div className="top-actions">
        <button className="pill search-pill" type="button" onClick={onSearch}>
          <Search size={15} strokeWidth={2} aria-hidden="true" />
          <span>Search</span>
        </button>
        <button
          className="pill ask-pill"
          type="button"
          onClick={() => setAskOpen(true)}
          title="Ask EA360"
        >
          <MessageSquareText size={15} strokeWidth={2} aria-hidden="true" />
          <span>Ask EA360</span>
        </button>
        <button
          className="iconbtn"
          type="button"
          aria-label="Decision inbox"
          aria-expanded={notifOpen}
          onClick={toggleNotif}
        >
          <Bell size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          className="iconbtn profile-btn"
          type="button"
          aria-label="Profile"
          aria-expanded={profileOpen}
          onClick={toggleProfile}
        >
          {tenant?.lettermark || 'EA'}
        </button>
        <DemoControls
          open={demoOpen}
          onToggle={toggleDemo}
          onClose={closeDemo}
          onOpenDemoHome={onOpenDemoHome}
        />
        <div className={`popover${notifOpen ? ' show' : ''}`}>
          <h4>Decision inbox</h4>
          <p>
            {tenant?.shortName}: review pending recommendations and decisions under Governance.
          </p>
        </div>
        <div className={`popover profile-popover${profileOpen ? ' show' : ''}`}>
          <h4>EA360 prototype</h4>
          <p>Enterprise Intelligence and Transformation Governance · Kulana</p>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingTenant)}
        title="Switch organisation?"
        message={`You have ${mutations.length} demo mutation(s) on ${tenant?.shortName || tenantCode}. Switching tenants isolates session state; continue?`}
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
