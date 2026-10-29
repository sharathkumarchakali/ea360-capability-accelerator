import { useMemo, useState } from 'react'
import { Building2, CheckCircle2 } from 'lucide-react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { loadTenantPack, validateWorkspaceProfile } from '../../data/repositories/tenantRepository'
import { STARTER_OPTIONS } from '../../data/tenants/runtimeWorkspaces'
import { formatDemoAsOfLabel } from '../../domain/demo/demoClock'
import { getDemoJourneys } from '../demo/journeyDefinitions'

const DRAFT_KEY = 'ea360-onboarding-draft'
const COUNTED = [
  ['capabilities', 'Capabilities'],
  ['applications', 'Applications'],
  ['integrations', 'Integrations'],
  ['findings', 'Findings'],
  ['evidence', 'Evidence'],
  ['recommendations', 'Recommendations'],
  ['decisions', 'Decisions'],
  ['initiatives', 'Initiatives'],
  ['kpis', 'KPIs'],
]
const CURRENCIES = ['USD', 'EUR', 'GBP', 'GHS', 'NGN', 'KES', 'ZAR']
const TIMEZONES = ['UTC', 'Africa/Accra', 'Africa/Lagos', 'Africa/Nairobi', 'Europe/London', 'America/New_York']
const EMPTY_PROFILE = {
  name: '',
  code: '',
  sector: STARTER_OPTIONS[0].sector,
  country: '',
  currency: 'USD',
  timezone: 'UTC',
  synthetic: false,
}

function readDraft() {
  try {
    return JSON.parse(window.localStorage.getItem(DRAFT_KEY) || 'null')
  } catch {
    return null
  }
}

function saveDraft(profile, starter) {
  try {
    window.localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ profile, starter, savedAt: new Date().toISOString(), synthetic: true }),
    )
  } catch {
    /* a draft is a convenience only */
  }
}

function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY)
  } catch {
    /* nothing to clear */
  }
}

const starterForSector = (sector) => STARTER_OPTIONS.find((s) => s.sector === sector)?.code ?? STARTER_OPTIONS[0].code

export default function CustomerOnboardingWizard({ onNavigate }) {
  const createWorkspaceFromStarter = usePrototypeStore((s) => s.createWorkspaceFromStarter)
  const saved = useMemo(() => readDraft(), [])
  const [step, setStep] = useState(1)
  const [profile, setProfile] = useState(() => ({ ...EMPTY_PROFILE, ...(saved?.profile ?? {}) }))
  const [starter, setStarter] = useState(() =>
    STARTER_OPTIONS.some((s) => s.code === saved?.starter) ? saved.starter : starterForSector(saved?.profile?.sector ?? EMPTY_PROFILE.sector),
  )
  const [touched, setTouched] = useState(false)
  const [createErrors, setCreateErrors] = useState([])
  const [created, setCreated] = useState(null)

  const code = profile.code.trim().toUpperCase()
  const errors = useMemo(
    () => validateWorkspaceProfile({ ...profile, code }, starter),
    [profile, code, starter],
  )

  const starterPack = useMemo(() => loadTenantPack(starter), [starter])
  const supported = useMemo(() => getDemoJourneys(starter).filter((j) => j.bound), [starter])
  const starterLabel = STARTER_OPTIONS.find((s) => s.code === starter)?.label ?? starter

  function update(key, value) {
    setProfile((p) => ({ ...p, [key]: value }))
    if (key === 'sector') setStarter(starterForSector(value))
    setCreateErrors([])
  }

  function next() {
    setTouched(true)
    if (errors.length === 0) {
      saveDraft({ ...profile, code }, starter)
      setStep(2)
    }
  }

  function create() {
    const outcome = createWorkspaceFromStarter({ ...profile, code }, starter)
    if (!outcome.ok) {
      setCreateErrors(outcome.errors ?? [outcome.error])
      return
    }
    clearDraft()
    setCreated({ code: outcome.code, persisted: outcome.persisted })
  }

  if (created) {
    return (
      <section className="view active wv-view" data-demo-target="onboarding-wizard">
        <div className="module">
          <div className="module-header">
            <div>
              <div className="kicker">Workspace · Customer Onboarding</div>
              <h1 className="page-title">Workspace created</h1>
              <p className="sub">{formatDemoAsOfLabel()}</p>
            </div>
            <div className="synthetic-pill">ILLUSTRATIVE DATA</div>
          </div>
          <div className="wv-panel" role="status">
            <h2>
              <CheckCircle2 size={20} aria-hidden="true" /> {profile.name.trim()} ({created.code}) is ready
            </h2>
            <p>
              The workspace is a synthetic clone of the {starterLabel} starter with every identifier remapped, and it is now the
              active workspace. Seed workspaces were not changed.
            </p>
            {!created.persisted && (
              <p className="wv-error" role="alert">
                Browser storage is unavailable, so this workspace exists for this session only and will be lost on reload.
              </p>
            )}
            <div className="wv-actions">
              <button type="button" className="btn primary primary-button" onClick={() => onNavigate?.('executive')}>
                Open the executive view
              </button>
              <button type="button" className="btn secondary-button" onClick={() => onNavigate?.('data-ingestion')}>
                Import applications
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="view active wv-view" data-demo-target="onboarding-wizard">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Workspace · Customer Onboarding</div>
            <h1 className="page-title">Customer Onboarding</h1>
            <p>
              Describe the organisation, preview the starter it would be cloned from, then create a synthetic workspace. Seed
              workspaces are never modified.
            </p>
            <p className="sub">{formatDemoAsOfLabel()}</p>
          </div>
          <div className="synthetic-pill">ILLUSTRATIVE DATA</div>
        </div>

        <ol className="wv-stepper" aria-label="Onboarding steps">
          <li aria-current={step === 1 ? 'step' : undefined} className={step === 1 ? 'is-current' : ''}>
            1. Customer profile
          </li>
          <li aria-current={step === 2 ? 'step' : undefined} className={step === 2 ? 'is-current' : ''}>
            2. Starter and create
          </li>
        </ol>

        {step === 1 && (
          <form
            className="wv-panel wv-form"
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              next()
            }}
          >
            <label className="field">
              <span>Organisation name</span>
              <input value={profile.name} onChange={(e) => update('name', e.target.value)} autoComplete="off" />
            </label>
            <label className="field">
              <span>Workspace code</span>
              <input value={profile.code} onChange={(e) => update('code', e.target.value)} placeholder="e.g. ACME" autoComplete="off" />
            </label>
            <label className="field">
              <span>Sector</span>
              <select value={profile.sector} onChange={(e) => update('sector', e.target.value)}>
                {STARTER_OPTIONS.map((s) => (
                  <option key={s.code} value={s.sector}>
                    {s.sector}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Country</span>
              <input value={profile.country} onChange={(e) => update('country', e.target.value)} autoComplete="off" />
            </label>
            <label className="field">
              <span>Currency</span>
              <select value={profile.currency} onChange={(e) => update('currency', e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Time zone</span>
              <select value={profile.timezone} onChange={(e) => update('timezone', e.target.value)}>
                {TIMEZONES.map((z) => (
                  <option key={z}>{z}</option>
                ))}
              </select>
            </label>
            <label className="wv-check">
              <input type="checkbox" checked={profile.synthetic} onChange={(e) => update('synthetic', e.target.checked)} />
              <span>This workspace will contain synthetic (illustrative) data only.</span>
            </label>
            {touched && errors.length > 0 && (
              <ul className="wv-issues" role="alert">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <div className="wv-actions">
              <button type="submit" className="btn primary primary-button">
                Next: starter preview
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="wv-panel">
            <h2>
              <Building2 size={20} aria-hidden="true" /> Starter for {profile.name.trim() || code}
            </h2>
            <label className="field">
              <span>Starter workspace</span>
              <select
                value={starter}
                onChange={(e) => {
                  setStarter(e.target.value)
                  setCreateErrors([])
                }}
              >
                {STARTER_OPTIONS.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label} (illustrative)
                  </option>
                ))}
              </select>
            </label>
            <h3>Clone preview</h3>
            <div className="app-metric-strip" role="group" aria-label="Records that would be cloned">
              {COUNTED.map(([key, label]) => (
                <div className="app-metric" key={key}>
                  <span>{label}</span>
                  <strong>{Array.isArray(starterPack?.[key]) ? starterPack[key].length : 0}</strong>
                </div>
              ))}
            </div>
            <h3>Journeys this starter supports</h3>
            <p>{supported.length ? supported.map((j) => `${j.journeyId} ${j.title}`).join(' · ') : 'None are bound for this starter.'}</p>
            <p className="sub">
              Creating the workspace clones these records under new identifiers (suffix “-{code.toLowerCase()}”), saves it in this
              browser and makes it the active workspace.
            </p>
            {createErrors.length > 0 && (
              <ul className="wv-issues" role="alert">
                {createErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <div className="wv-actions">
              <button type="button" className="btn secondary-button" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="button" className="btn primary primary-button" onClick={create}>
                Create synthetic workspace
              </button>
            </div>
          </div>
        )}
        <p className="sub synthetic-disclosure">Illustrative synthetic starters only.</p>
      </div>
    </section>
  )
}
