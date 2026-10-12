import {
  formatCriticality,
  relatedApis,
  relatedDecisions,
  relatedProcesses,
} from './portfolioModel'

function Section({ title, children }) {
  if (!children) return null
  if (Array.isArray(children) && children.length === 0) return null
  return (
    <div className="drawer-section app-drawer-section">
      <h4>{title}</h4>
      {children}
    </div>
  )
}

function Chip({ children, onClick, title }) {
  if (onClick) {
    return (
      <button type="button" className="link-chip" onClick={onClick} title={title}>
        {children}
      </button>
    )
  }
  return <span className="link-chip static">{children}</span>
}

function RiskTag({ label, value }) {
  return (
    <div className={`app-health-pill risk-${(value || 'low').toLowerCase()}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

/**
 * Application portfolio detail body — used by EntityDrawer.
 */
export default function ApplicationDetailPanel({
  row,
  repo,
  onOpenEntity,
  onNavigateFindings,
  onFuturePortfolio,
}) {
  if (!row) return null
  const { app } = row
  const caps = repo.capabilitiesForApplication(app.id)
  const processes = relatedProcesses(app, repo.listProcesses?.() || [])
  const findings = repo.findingsForApplication(app.id)
  const initiatives = repo.initiativesForApplication(app.id)
  const dataObjs = repo.dataObjectsForApplication(app.id)
  const techs = repo.technologiesForApplication(app.id)
  const ints = repo.integrationsForApplications([app.id])
  const apis = relatedApis(app.id, ints)
  const decisions = relatedDecisions(
    app.id,
    findings,
    repo.listDecisions?.() || [],
    initiatives,
  )
  const peerApps = ints
    .flatMap((i) => [i.sourceApplicationId, i.targetApplicationId])
    .filter((id) => id && id !== app.id)
  const uniquePeers = [...new Set(peerApps)]
    .map((id) => repo.getApplication(id))
    .filter(Boolean)
    .slice(0, 6)

  const activeInit = initiatives.find(
    (i) => !['completed', 'cancelled', 'retired'].includes((i.status || '').toLowerCase()),
  )

  return (
    <div className="app-detail-panel">
      <p className="app-detail-desc">{app.description}</p>
      <p className="sub">
        {app.id} · {app.status} · {row.lifecycleStage}
        {app.isSynthetic !== false ? ' · Synthetic demo data' : ''}
      </p>

      <Section title="Why it matters">
        <div className="drawer-metrics">
          <div>
            <span>Business criticality</span>
            <strong>{formatCriticality(app.criticality)}</strong>
          </div>
          <div>
            <span>Portfolio decision</span>
            <strong>{row.portfolioDecision}</strong>
          </div>
        </div>
        <div className="chip-row">
          {caps.map((c) => (
            <Chip key={c.id} onClick={() => onOpenEntity?.({ id: c.id, type: 'capability' })}>
              {c.name}
            </Chip>
          ))}
        </div>
        {processes.length > 0 && (
          <ul className="drawer-list">
            {processes.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        )}
        <p className="sub">{row.citizenImpact}</p>
      </Section>

      <Section title="Who owns it">
        {row.ownershipGap && <div className="ownership-gap">Ownership Gap</div>}
        <div className="drawer-metrics">
          <div>
            <span>Business owner</span>
            <strong>{row.businessOwnerLabel || 'Unassigned'}</strong>
          </div>
          <div>
            <span>Technical owner</span>
            <strong>{row.technicalOwnerLabel || 'Unassigned'}</strong>
          </div>
          <div>
            <span>Support team</span>
            <strong>{row.supportTeam}</strong>
          </div>
          <div>
            <span>Vendor</span>
            <strong>{app.vendorProduct || '—'}</strong>
          </div>
        </div>
      </Section>

      <Section title="Architecture health">
        <div className="app-health-grid">
          <RiskTag label="Architecture risk" value={row.architectureRisk} />
          <RiskTag label="Lifecycle risk" value={row.lifecycleRisk ? 'High' : 'Low'} />
          <RiskTag label="Security risk" value={row.securityRisk} />
          <RiskTag label="Resilience" value={row.resilienceStatus} />
          <RiskTag label="Standards" value={row.standardsCompliance} />
        </div>
      </Section>

      <Section title="Dependencies">
        <div className="dep-block">
          <h5>APIs</h5>
          <div className="chip-row">
            {apis.length === 0 && <span className="sub">No API integrations linked</span>}
            {apis.map((i) => (
              <Chip
                key={i.id}
                onClick={() => onOpenEntity?.({ id: i.id, type: 'integration' })}
                title="Open integration"
              >
                {i.apiOrInterfaceName || i.name}
              </Chip>
            ))}
          </div>
        </div>
        <div className="dep-block">
          <h5>Data</h5>
          <div className="chip-row">
            {dataObjs.length === 0 && <span className="sub">No data objects linked</span>}
            {dataObjs.map((d) => (
              <Chip
                key={d.id}
                onClick={() => onOpenEntity?.({ id: d.id, type: 'dataObject' })}
                title="Open data domain"
              >
                {d.name}
              </Chip>
            ))}
          </div>
        </div>
        <div className="dep-block">
          <h5>Technology</h5>
          <div className="chip-row">
            {techs.length === 0 && <span className="sub">No technology components linked</span>}
            {techs.map((t) => (
              <Chip
                key={t.id}
                onClick={() => onOpenEntity?.({ id: t.id, type: 'technology' })}
                title="Open technology detail"
              >
                {t.name}
              </Chip>
            ))}
          </div>
        </div>
        <div className="dep-block">
          <h5>Applications</h5>
          <div className="chip-row">
            {uniquePeers.length === 0 && <span className="sub">No dependent applications linked</span>}
            {uniquePeers.map((a) => (
              <Chip key={a.id} onClick={() => onOpenEntity?.({ id: a.id, type: 'application' })}>
                {a.name}
              </Chip>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Transformation">
        {activeInit ? (
          <>
            <div className="drawer-metrics">
              <div>
                <span>Active initiative</span>
                <strong>{activeInit.name}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{activeInit.status}</strong>
              </div>
              <div>
                <span>Owner</span>
                <strong>{(activeInit.ownerId || '').replace(/^person-/, '') || '—'}</strong>
              </div>
              <div>
                <span>Target</span>
                <strong>{activeInit.targetQuarter || activeInit.targetPeriod || '—'}</strong>
              </div>
            </div>
            <p className="sub">
              {activeInit.intendedOutcome || activeInit.expectedValue || activeInit.description}
            </p>
            <Chip onClick={() => onOpenEntity?.({ id: activeInit.id, type: 'initiative' })}>
              Open initiative
            </Chip>
          </>
        ) : (
          <p className="sub">No active transformation initiative linked.</p>
        )}
      </Section>

      <Section title="Findings & risks">
        {findings.length === 0 && <p className="sub">No linked findings.</p>}
        <ul className="app-finding-list">
          {findings.slice(0, 5).map((f) => (
            <li key={f.id}>
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  onOpenEntity?.({ id: f.id, type: 'finding' })
                  onNavigateFindings?.()
                }}
              >
                {f.id.toUpperCase()} — {f.name}
              </button>
              <span className={`status-tag severity-${(f.severity || '').toLowerCase()}`}>
                {f.severity}
              </span>
            </li>
          ))}
        </ul>
        {findings.length > 0 && (
          <button type="button" className="btn secondary-button" onClick={() => onNavigateFindings?.()}>
            View related findings
          </button>
        )}
      </Section>

      <Section title="Architecture decisions">
        {decisions.length === 0 && <p className="sub">No linked decisions yet.</p>}
        <ul className="drawer-list">
          {decisions.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className="text-link"
                onClick={() => onOpenEntity?.({ id: d.id, type: 'decision' })}
              >
                {d.id.toUpperCase()} — {d.name}
              </button>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Portfolio recommendation">
        <div className="app-reco-card">
          <div className="kicker">Decision</div>
          <h3>{row.portfolioDecision.toUpperCase()}</h3>
          <p>
            <strong>Why.</strong> {row.recommendationWhy}
          </p>
          <p>
            <strong>Recommended next action.</strong> {row.recommendationAction}
          </p>
        </div>
      </Section>
    </div>
  )
}
