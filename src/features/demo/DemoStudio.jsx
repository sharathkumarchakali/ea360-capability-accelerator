import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, CirclePlay, Eye, EyeOff, Presentation, Wand2 } from 'lucide-react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { listAvailableTenants } from '../../data/repositories/tenantRepository'
import { formatDemoAsOfLabel, getDemoAsOfDate } from '../../domain/demo/demoClock'
import {
  DEMO_PLAYLISTS,
  buildPlaylistJourney,
  getDemoJourneys,
  validateJourneyContract,
} from './journeyDefinitions'
import { getJourneyBinding } from './journeyBindings'
import { preflightJourney } from './scenarioPreflight'

const STATUS_TONE = { Ready: 'good', 'Needs setup': 'warn', Unavailable: 'bad' }

function scenarioLabel(id) {
  if (!id) return 'No scenario'
  const word = id.replace(/^scenario-/, '').replace(/-/g, ' ')
  return `${word.charAt(0).toUpperCase()}${word.slice(1)} scenario`
}

function worst(statuses) {
  if (statuses.includes('Unavailable')) return 'Unavailable'
  if (statuses.includes('Needs setup')) return 'Needs setup'
  return 'Ready'
}

/** Combine static contract errors with the pack preflight for one journey. */
function evaluateJourney(pack, tenantCode, journey) {
  const pre = preflightJourney(pack, tenantCode, journey.journeyId)
  const contract = validateJourneyContract(journey)
  if (contract.length) {
    return {
      ...pre,
      status: 'Unavailable',
      canPrepare: false,
      reasons: [...contract.map((e) => `Contract check: ${e}`), ...pre.reasons],
    }
  }
  return pre
}

export default function DemoStudio({ onNavigate }) {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const workingPack = usePrototypeStore((s) => s.workingPack)
  const switchTenant = usePrototypeStore((s) => s.switchTenant)
  const startGuidedTour = usePrototypeStore((s) => s.startGuidedTour)
  const presentationMode = usePrototypeStore((s) => s.presentationMode)
  const setPresentationMode = usePrototypeStore((s) => s.setPresentationMode)
  const prepareDemoFixture = usePrototypeStore((s) => s.prepareDemoFixture)
  const setStoreAsOf = usePrototypeStore((s) => s.setDemoAsOfDate)
  const showToast = usePrototypeStore((s) => s.showToast)

  const tenants = useMemo(() => listAvailableTenants(), [])
  const sectors = useMemo(() => [...new Set(tenants.map((t) => t.tenantType))], [tenants])
  const activeTenant = tenants.find((t) => t.code === tenantCode)
  const [sector, setSector] = useState(activeTenant?.tenantType || sectors[0])
  const [scenario, setScenario] = useState('')
  const [journeyFilter, setJourneyFilter] = useState('')
  const [audience, setAudience] = useState('')
  const [asOf, setAsOf] = useState(getDemoAsOfDate())
  const [asOfError, setAsOfError] = useState('')
  const [notesVisible, setNotesVisible] = useState(false)
  const [previewId, setPreviewId] = useState(null)

  const journeys = useMemo(() => getDemoJourneys(tenantCode), [tenantCode])
  const bindings = useMemo(
    () => journeys.map((j) => getJourneyBinding(tenantCode, j.journeyId)),
    [journeys, tenantCode],
  )
  const scenarioOptions = useMemo(
    () => [...new Set(bindings.map((b) => b?.scenarioId).filter(Boolean))],
    [bindings],
  )
  const audiences = useMemo(() => [...new Set(journeys.map((j) => j.audience))], [journeys])

  const evaluated = useMemo(
    () =>
      journeys.map((j, i) => ({
        journey: j,
        binding: bindings[i],
        result: evaluateJourney(workingPack, tenantCode, j),
      })),
    // asOf is a dependency so readiness is recomputed after the shared demo clock changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [journeys, bindings, workingPack, tenantCode, asOf],
  )

  const visible = evaluated.filter(({ journey, binding }) => {
    if (journeyFilter && journey.journeyId !== journeyFilter) return false
    if (audience && journey.audience !== audience) return false
    if (scenario && binding?.scenarioId !== scenario) return false
    return true
  })

  const playlists = useMemo(
    () =>
      DEMO_PLAYLISTS.map((p) => {
        const journey = buildPlaylistJourney(tenantCode, p.id)
        const members = p.items
          .map((item) => evaluated.find((e) => e.journey.journeyId === item.journeyId))
          .filter((e) => e && e.journey.bound)
        const statuses = members.map((m) => m.result.status)
        const reasons = members.flatMap((m) =>
          m.result.status === 'Ready' ? [] : m.result.reasons.map((r) => `${m.journey.journeyId}: ${r}`),
        )
        const omitted = p.items.filter((item) => !members.some((m) => m.journey.journeyId === item.journeyId))
        const status = !journey?.bound ? 'Unavailable' : worst(statuses)
        return { playlist: p, journey, status, reasons, omitted }
      }),
    [tenantCode, evaluated],
  )

  const sectorTenants = tenants.filter((t) => t.tenantType === sector)

  function changeSector(next) {
    setSector(next)
    const first = tenants.find((t) => t.tenantType === next)
    if (first && first.code !== tenantCode) switchTenant(first.code)
    setScenario('')
    setPreviewId(null)
  }

  function changeWorkspace(code) {
    switchTenant(code)
    setScenario('')
    setPreviewId(null)
  }

  function changeAsOf(value) {
    setAsOf(value)
    const result = setStoreAsOf(value)
    setAsOfError(result.ok ? '' : 'Enter a valid date.')
  }

  function prepare(journey, binding, result) {
    if (!binding || !result.fixture) return
    const outcome = prepareDemoFixture(journey.journeyId)
    showToast(
      outcome.ok
        ? `Synthetic example prepared for ${journey.journeyId} (${(outcome.created ?? []).length} record${(outcome.created ?? []).length === 1 ? '' : 's'}).`
        : `Could not prepare the example: ${outcome.error}`,
    )
  }

  const notesAllowed = !presentationMode

  return (
    <section className="view active ds-view" data-demo-target="demo-studio">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Workspace · Demo Studio</div>
            <h1 className="page-title">Demo Studio</h1>
            <p>
              Choose a workspace, scenario and audience, check that the journey is ready, then start a guided
              walkthrough. Every figure shown is illustrative synthetic data.
            </p>
            <p className="sub">{formatDemoAsOfLabel(asOf)}</p>
          </div>
          <div className="synthetic-pill">ILLUSTRATIVE DATA</div>
        </div>

        <div className="ds-controls" role="group" aria-label="Demo controls">
          <label className="field">
            <span>Sector</span>
            <select value={sector} onChange={(e) => changeSector(e.target.value)}>
              {sectors.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Workspace</span>
            <select value={sectorTenants.some((t) => t.code === tenantCode) ? tenantCode : ''} onChange={(e) => changeWorkspace(e.target.value)}>
              {!sectorTenants.some((t) => t.code === tenantCode) && <option value="">Select workspace</option>}
              {sectorTenants.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.shortName || t.name} (illustrative)
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Scenario</span>
            <select value={scenario} onChange={(e) => setScenario(e.target.value)}>
              <option value="">All scenarios</option>
              {scenarioOptions.map((id) => (
                <option key={id} value={id}>
                  {scenarioLabel(id)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Journey</span>
            <select value={journeyFilter} onChange={(e) => setJourneyFilter(e.target.value)}>
              <option value="">All journeys</option>
              {journeys.map((j) => (
                <option key={j.journeyId} value={j.journeyId}>
                  {j.journeyId} — {j.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Audience</span>
            <select value={audience} onChange={(e) => setAudience(e.target.value)}>
              <option value="">All audiences</option>
              {audiences.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>As-of date</span>
            <input type="date" value={asOf} onChange={(e) => changeAsOf(e.target.value)} aria-invalid={Boolean(asOfError)} />
            {asOfError && <small className="ds-error">{asOfError}</small>}
          </label>
        </div>

        <div className="ds-toggles">
          <button
            type="button"
            className="btn secondary-button ds-toggle"
            aria-pressed={presentationMode}
            onClick={() => setPresentationMode(!presentationMode)}
          >
            <Presentation size={16} aria-hidden="true" />
            Presentation mode: {presentationMode ? 'On' : 'Off'}
          </button>
          <button
            type="button"
            className="btn secondary-button ds-toggle"
            aria-pressed={notesVisible && notesAllowed}
            disabled={!notesAllowed}
            title={notesAllowed ? undefined : 'Presenter notes are hidden while presentation mode is on'}
            onClick={() => setNotesVisible((v) => !v)}
          >
            {notesVisible && notesAllowed ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
            Presenter notes: {notesVisible && notesAllowed ? 'Shown' : 'Hidden'}
          </button>
        </div>
        <p className="sub">
          Presentation mode simplifies the screen for the audience. Presenter notes are a separate setting and are
          never shown while presentation mode is on.
        </p>

        <h2 className="ds-h2">Journeys</h2>
        {visible.length === 0 && (
          <p className="ds-empty" role="status">
            No journeys match these controls. Clear a filter to see them again.
          </p>
        )}
        <div className="ds-grid">
          {visible.map(({ journey, binding, result }) => {
            const open = previewId === journey.id
            const canStart = result.status === 'Ready'
            return (
              <article className="ds-card" key={journey.id} aria-labelledby={`ds-title-${journey.id}`}>
                <div className="ds-card-head">
                  <span className="ds-code">{journey.journeyId}</span>
                  <span className={`status-tag tone-${STATUS_TONE[result.status]}`}>{result.status}</span>
                </div>
                <h3 id={`ds-title-${journey.id}`}>{journey.title}</h3>
                <p className="ds-meta">
                  {journey.durationLabel} · {journey.audience} · {journey.steps.length} steps
                </p>
                <p>
                  <strong>Outcome:</strong> {journey.businessOutcome}
                </p>
                {result.reasons.length > 0 && (
                  <ul className="ds-reasons" aria-label="Readiness details">
                    {result.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
                <div className="ds-actions">
                  <button
                    type="button"
                    className="btn secondary-button"
                    aria-expanded={open}
                    onClick={() => setPreviewId(open ? null : journey.id)}
                  >
                    {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                    Preview steps
                  </button>
                  <button
                    type="button"
                    className="btn primary primary-button"
                    disabled={!canStart}
                    title={canStart ? undefined : 'Resolve the readiness details before starting'}
                    onClick={() => startGuidedTour(journey.id)}
                  >
                    <CirclePlay size={16} aria-hidden="true" />
                    Start journey
                  </button>
                  {result.status === 'Needs setup' && result.canPrepare && (
                    <button type="button" className="btn secondary-button" onClick={() => prepare(journey, binding, result)}>
                      <Wand2 size={16} aria-hidden="true" />
                      Prepare synthetic example
                    </button>
                  )}
                </div>
                {open && (
                  <ol className="ds-steps">
                    {journey.steps.map((s) => (
                      <li key={s.id}>
                        <strong>{s.title}</strong>
                        {s.optional ? <span className="ds-optional"> (optional)</span> : null}
                        <span className="ds-step-sub">{s.expectedResult}</span>
                        {s.humanAction && <span className="ds-step-sub">Human action: {s.humanAction}</span>}
                        {notesAllowed && notesVisible && <span className="ds-note">Presenter note: {s.presenterNote}</span>}
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            )
          })}
        </div>

        <h2 className="ds-h2">Playlists</h2>
        <div className="ds-grid">
          {playlists.map(({ playlist, journey, status, reasons, omitted }) => {
            const open = previewId === playlist.id
            return (
              <article className="ds-card" key={playlist.id} aria-labelledby={`ds-title-${playlist.id}`}>
                <div className="ds-card-head">
                  <span className="ds-code">Playlist</span>
                  <span className={`status-tag tone-${STATUS_TONE[status]}`}>{status}</span>
                </div>
                <h3 id={`ds-title-${playlist.id}`}>{playlist.title}</h3>
                <p className="ds-meta">
                  {playlist.durationLabel} · {journey?.steps.length ?? 0} steps
                </p>
                <p>{playlist.description}</p>
                {omitted.length > 0 && (
                  <p className="sub">Not available for this workspace and omitted: {omitted.map((o) => o.journeyId).join(', ')}.</p>
                )}
                {reasons.length > 0 && (
                  <ul className="ds-reasons" aria-label="Readiness details">
                    {reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                )}
                <div className="ds-actions">
                  <button
                    type="button"
                    className="btn secondary-button"
                    aria-expanded={open}
                    disabled={!journey}
                    onClick={() => setPreviewId(open ? null : playlist.id)}
                  >
                    {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                    Preview steps
                  </button>
                  <button
                    type="button"
                    className="btn primary primary-button"
                    disabled={status !== 'Ready' || !journey}
                    title={status === 'Ready' ? undefined : 'Prepare or resolve each included journey first'}
                    onClick={() => startGuidedTour(journey.id)}
                  >
                    <CirclePlay size={16} aria-hidden="true" />
                    Start playlist
                  </button>
                </div>
                {open && journey && (
                  <ol className="ds-steps">
                    {journey.steps.map((s) => (
                      <li key={s.id}>
                        <strong>
                          {s.segmentJourneyId}: {s.title}
                        </strong>
                        <span className="ds-step-sub">{s.expectedResult}</span>
                        {notesAllowed && notesVisible && <span className="ds-note">Presenter note: {s.presenterNote}</span>}
                      </li>
                    ))}
                  </ol>
                )}
              </article>
            )
          })}
        </div>

        <p className="sub synthetic-disclosure">
          Illustrative data: workspaces, people, systems and figures are synthetic and do not describe any real
          organisation.{' '}
          <button type="button" className="text-link" onClick={() => onNavigate?.('workspace-settings')}>
            Workspace settings
          </button>
        </p>
      </div>
    </section>
  )
}
