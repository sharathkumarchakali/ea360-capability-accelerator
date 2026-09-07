import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import Topbar from './components/shell/Topbar'
import Sidebar from './components/shell/Sidebar'
import SyntheticBanner from './components/shell/SyntheticBanner'
import EntityDrawer from './components/enterprise/EntityDrawer'
import SearchOverlay from './components/SearchOverlay'
import ErrorBoundary from './components/shell/ErrorBoundary'
import AskEA360Panel from './features/ai-assist/AskEA360Panel'
import DemoLanding from './features/demo/DemoLanding'
import GuidedDemoBar from './features/demo/GuidedDemoBar'
import { usePrototypeStore } from './state/prototypeStore'
import { getTenantConfig, loadTenantPack } from './data/repositories/tenantRepository'

const ExecutiveCockpit = lazy(() => import('./features/executive/ExecutiveCockpit'))
const CapabilitiesView = lazy(() => import('./features/capabilities/CapabilitiesView'))
const ApplicationsView = lazy(() => import('./features/applications/ApplicationsView'))
const IntegrationsView = lazy(() => import('./features/integrations/IntegrationsView'))
const RelationshipExplorer = lazy(() => import('./features/explorer/RelationshipExplorer'))
const FindingsView = lazy(() => import('./features/findings/FindingsView'))
const EvidenceView = lazy(() => import('./features/evidence/EvidenceView'))
const RecommendationsView = lazy(() => import('./features/recommendations/RecommendationsView'))
const GovernanceView = lazy(() => import('./features/governance/GovernanceView'))
const RoadmapView = lazy(() => import('./features/roadmap/RoadmapView'))
const ExecutiveReport = lazy(() => import('./features/reports/ExecutiveReport'))

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
  'reports',
])

function viewFromHash() {
  const hash = window.location.hash.replace('#', '').split('?')[0]
  if (hash === '' || hash === 'overview') return 'executive'
  if (!VALID_VIEWS.has(hash)) return 'invalid'
  return hash
}

loadTenantPack('GRA')

function ViewFallback() {
  return (
    <div className="view-loading" role="status" aria-live="polite">
      Loading view…
    </div>
  )
}

function InvalidRoute({ onRecover }) {
  return (
    <section className="view active error-boundary" role="alert">
      <h2>Page not found</h2>
      <p>That deep link is not available in this prototype. Returning to the Executive Cockpit is safe.</p>
      <button type="button" className="btn primary primary-button" onClick={onRecover}>
        Return to Executive Cockpit
      </button>
    </section>
  )
}

export default function App() {
  const view = usePrototypeStore((s) => s.view)
  const setView = usePrototypeStore((s) => s.setView)
  const clearSelection = usePrototypeStore((s) => s.clearSelection)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const landingComplete = usePrototypeStore((s) => s.landingComplete)
  const presentationMode = usePrototypeStore((s) => s.presentationMode)
  const toast = usePrototypeStore((s) => s.toast)
  const clearToast = usePrototypeStore((s) => s.clearToast)
  const resetDemo = usePrototypeStore((s) => s.resetDemo)
  const showLanding = usePrototypeStore((s) => s.showLanding)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [routeInvalid, setRouteInvalid] = useState(false)

  useEffect(() => {
    const accent = getTenantConfig(tenantCode).accentColor
    if (accent) {
      document.documentElement.style.setProperty('--tenant-accent', accent)
      document.documentElement.setAttribute('data-tenant', tenantCode)
    }
  }, [tenantCode])

  useEffect(() => {
    document.documentElement.classList.toggle('presentation-mode', presentationMode)
  }, [presentationMode])

  const closeMobile = useCallback(() => setSidebarOpen(false), [])

  const navigate = useCallback(
    (id, { keepSelection = false } = {}) => {
      const next = id === 'overview' ? 'executive' : id
      if (!VALID_VIEWS.has(next)) {
        setRouteInvalid(true)
        setView('executive')
        return
      }
      setRouteInvalid(false)
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
    const resolved = viewFromHash()
    if (resolved === 'invalid') {
      setRouteInvalid(true)
      setView('executive')
    } else {
      setRouteInvalid(false)
      setView(resolved)
    }
    const onHash = () => {
      const next = viewFromHash()
      if (next === 'invalid') {
        setRouteInvalid(true)
        setView('executive')
      } else {
        setRouteInvalid(false)
        setView(next)
      }
    }
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
    const t = setTimeout(() => clearToast(), 2800)
    return () => clearTimeout(t)
  }, [toast, clearToast])

  function recover(kind) {
    if (kind === 'reset') {
      resetDemo()
      window.location.hash = ''
      return
    }
    setRouteInvalid(false)
    navigate('executive')
  }

  let content = <ExecutiveCockpit onNavigate={navigate} />
  if (routeInvalid) content = <InvalidRoute onRecover={() => recover('cockpit')} />
  else if (view === 'capabilities') content = <CapabilitiesView />
  else if (view === 'applications') content = <ApplicationsView />
  else if (view === 'integrations') content = <IntegrationsView />
  else if (view === 'explorer') content = <RelationshipExplorer />
  else if (view === 'findings') content = <FindingsView />
  else if (view === 'evidence') content = <EvidenceView />
  else if (view === 'recommendations') content = <RecommendationsView />
  else if (view === 'governance') content = <GovernanceView />
  else if (view === 'roadmap') content = <RoadmapView />
  else if (view === 'reports') content = <ExecutiveReport onNavigate={navigate} />

  return (
    <>
      {!landingComplete && <DemoLanding onStart={() => navigate('executive')} />}

      <div className={`app${presentationMode ? ' is-presentation' : ''}`}>
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
          onOpenDemoHome={() => showLanding()}
        />

        <GuidedDemoBar onNavigate={navigate} />

        <div className="shell">
          <div
            className={`overlay${sidebarOpen ? ' show' : ''}`}
            onClick={closeMobile}
            aria-hidden={!sidebarOpen}
          />
          <Sidebar open={sidebarOpen} onNavigate={navigate} />
          <main className="main" id="main-content">
            <ErrorBoundary onRecover={recover}>
              <Suspense fallback={<ViewFallback />}>{content}</Suspense>
            </ErrorBoundary>
          </main>
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
