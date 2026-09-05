import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  moduleData,
  organisations,
} from './data'
import Overview from './components/Overview'
import ModuleView from './components/ModuleView'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import SearchOverlay from './components/SearchOverlay'

const VALID_VIEWS = new Set(['overview', ...Object.keys(moduleData)])

function orgShortName(org) {
  return org.replace(' — Demo Organisation', '').replace(' — Demo', '')
}

function initialView() {
  const hash = window.location.hash.replace('#', '')
  return VALID_VIEWS.has(hash) ? hash : 'overview'
}

export default function App() {
  const [view, setView] = useState(initialView)
  const [organisation, setOrganisation] = useState(organisations[0])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [toast, setToast] = useState({ message: '', show: false })

  const orgLabel = useMemo(() => orgShortName(organisation), [organisation])

  const closeMobile = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  const navigate = useCallback(
    (id) => {
      if (!VALID_VIEWS.has(id)) return
      setView(id)
      window.location.hash = id === 'overview' ? '' : id
      closeMobile()
      setNotifOpen(false)
      setProfileOpen(false)
    },
    [closeMobile],
  )

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace('#', '')
      if (VALID_VIEWS.has(hash)) setView(hash)
      else if (!hash) setView('overview')
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      setSearchOpen(false)
      closeMobile()
      setNotifOpen(false)
      setProfileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [closeMobile])

  useEffect(() => {
    if (!toast.show) return
    const t = setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 2600)
    return () => clearTimeout(t)
  }, [toast])

  function showToast(message) {
    setToast({ message, show: true })
  }

  function handleAction(kind) {
    if (kind === 'create') {
      showToast(
        'Prototype workspace: record creation is ready for the next product phase.',
      )
    } else {
      showToast('Export is available in the enterprise-enabled product phase.')
    }
  }

  return (
    <>
      <div className="app">
        <Topbar
          organisation={organisation}
          onOrganisationChange={setOrganisation}
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
          onProfileSettings={() => {
            setProfileOpen(false)
            navigate('settings')
          }}
        />

        <div className="shell">
          <div
            className={`overlay${sidebarOpen ? ' show' : ''}`}
            onClick={closeMobile}
          />
          <Sidebar
            activeView={view}
            onNavigate={navigate}
            open={sidebarOpen}
          />
          <main className="main">
            {view === 'overview' ? (
              <Overview orgLabel={orgLabel} />
            ) : (
              <ModuleView
                id={view}
                data={moduleData[view]}
                onAction={handleAction}
              />
            )}
          </main>
        </div>
      </div>

      <div
        className={`toast${toast.show ? ' show' : ''}`}
        role="status"
        aria-live="polite"
      >
        {toast.message}
      </div>

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={navigate}
      />
    </>
  )
}
