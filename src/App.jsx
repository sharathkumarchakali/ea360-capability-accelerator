import { useCallback, useEffect, useState } from 'react'
import Topbar from './components/shell/Topbar'
import Sidebar from './components/shell/Sidebar'
import SyntheticBanner from './components/shell/SyntheticBanner'
import EntityDrawer from './components/enterprise/EntityDrawer'
import SearchOverlay from './components/SearchOverlay'
import AskEA360Panel from './features/ai-assist/AskEA360Panel'
import ExecutiveCockpit from './features/executive/ExecutiveCockpit'
import CapabilitiesView from './features/capabilities/CapabilitiesView'
import ApplicationsView from './features/applications/ApplicationsView'
import IntegrationsView from './features/integrations/IntegrationsView'
import RelationshipExplorer from './features/explorer/RelationshipExplorer'
import FindingsView from './features/findings/FindingsView'
import EvidenceView from './features/evidence/EvidenceView'
import RecommendationsView from './features/recommendations/RecommendationsView'
import GovernanceView from './features/governance/GovernanceView'
import RoadmapView from './features/roadmap/RoadmapView'
import { usePrototypeStore } from './state/prototypeStore'
import { getTenantConfig, loadTenantPack } from './data/repositories/tenantRepository'

const VALID_VIEWS = new Set([
  'executive',
  'capabilities',
  'applications',
  'integrations',
  'explorer',
  'findings',
  'evidence',
  'recommendations',
  'governance',
  'roadmap',
])

function viewFromHash() {
  const hash = window.location.hash.replace('#', '')
  if (hash === '' || hash === 'overview') return 'executive'
  return VALID_VIEWS.has(hash) ? hash : 'executive'
}

loadTenantPack('GRA')

export default function App() {
  const view = usePrototypeStore((s) => s.view)
  const setView = usePrototypeStore((s) => s.setView)
  const clearSelection = usePrototypeStore((s) => s.clearSelection)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toast, setToast] = useState({ message: '', show: false })

  useEffect(() => {
    const accent = getTenantConfig(tenantCode).accentColor
    if (accent) {
      document.documentElement.style.setProperty('--tenant-accent', accent)
      document.documentElement.setAttribute('data-tenant', tenantCode)
    }
  }, [tenantCode])

  const closeMobile = useCallback(() => setSidebarOpen(false), [])

  const navigate = useCallback(
    (id, { keepSelection = false } = {}) => {
      const next = id === 'overview' ? 'executive' : id
      if (!VALID_VIEWS.has(next)) return
      setView(next)
      window.location.hash = next === 'executive' ? '' : next
      closeMobile()
      setNotifOpen(false)
      setProfileOpen(false)
      if (!keepSelection) clearSelection()
    },
    [closeMobile, setView, clearSelection],
  )

  useEffect(() => {
    setView(viewFromHash())
    const onHash = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [setView])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setSearchOpen(false)
      closeMobile()
      setNotifOpen(false)
      setProfileOpen(false)
      setAskOpen(false)
      clearSelection()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeMobile, clearSelection, setAskOpen])

  useEffect(() => {
    if (!toast.show) return
    const t = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2600)
    return () => clearTimeout(t)
  }, [toast])

  let content = <ExecutiveCockpit onNavigate={navigate} />
  if (view === 'capabilities') content = <CapabilitiesView />
  if (view === 'applications') content = <ApplicationsView />
  if (view === 'integrations') content = <IntegrationsView />
  if (view === 'explorer') content = <RelationshipExplorer />
  if (view === 'findings') content = <FindingsView />
  if (view === 'evidence') content = <EvidenceView />
  if (view === 'recommendations') content = <RecommendationsView />
  if (view === 'governance') content = <GovernanceView />
  if (view === 'roadmap') content = <RoadmapView />

  return (
    <>
      <div className="app">
        <SyntheticBanner />
        <Topbar
          onMobileMenu={() => setSidebarOpen(true)}
          onSearch={() => setSearchOpen(true)}
          notifOpen={notifOpen}
          profileOpen={profileOpen}
          onToggleNotif={() => {
            setNotifOpen((v) => !v)
            setProfileOpen(false)
          }}
          onToggleProfile={() => {
            setProfileOpen((v) => !v)
            setNotifOpen(false)
          }}
        />

        <div className="shell">
          <div
            className={`overlay${sidebarOpen ? ' show' : ''}`}
            onClick={closeMobile}
          />
          <Sidebar open={sidebarOpen} onNavigate={navigate} />
          <main className="main">{content}</main>
        </div>
      </div>

      <EntityDrawer />

      <div className={`toast${toast.show ? ' show' : ''}`} role="status" aria-live="polite">
        {toast.message}
      </div>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
      />

      <AskEA360Panel />
    </>
  )
}
