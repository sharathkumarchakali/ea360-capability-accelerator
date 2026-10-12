import {
  formatCriticality,
  INTEGRATION_STANDARDS,
  relatedFindings,
  relatedInitiatives,
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
 * Integrations & APIs portfolio detail body — used by EntityDrawer.
 */
export default function IntegrationDetailPanel({
  row,
  repo,
  onOpenEntity,
  onNavigateFindings,
  onFuturePortfolio,
}) {
  if (!row) return null
  const { int: i } = row
  const findings = relatedFindings(i.id, repo.listFindings?.() || repo.findingsForIntegration?.(i.id) || [])
  const linkedFindings =
    findings.length > 0 ? findings : repo.findingsForIntegration?.(i.id) || []
  const initiatives = relatedInitiatives(row, repo.listInitiatives?.() || [])
  const processes = (i.supportedProcessIds || [])
    .map((id) => repo.getProcess?.(id) || (repo.listProcesses?.() || []).find((p) => p.id === id))
    .filter(Boolean)
  const dataObjs = (i.dataObjectIds || [])
    .map((id) => (repo.listDataObjects?.() || []).find((d) => d.id === id))
    .filter(Boolean)
  const standards = (row.standardIds || [])
    .map((id) => INTEGRATION_STANDARDS[id] || { id, name: id })
    .filter(Boolean)
  const activeInit = initiatives.find(
    (init) => !['completed', 'cancelled', 'retired'].includes((init.status || '').toLowerCase()),
  )

  return (
    <div className="app-detail-panel int-detail-panel">
      <p className="app-detail-desc">{i.description}</p>
      <p className="sub">
        {i.id} · {row.assetType} · {i.protocol || i.integrationType}
        {i.isSynthetic !== false ? ' · Synthetic demo data' : ''}
      </p>

      <Section title="What is this integration?">
        <div className="drawer-metrics">
          <div>
            <span>Type</span>
            <strong>{i.integrationType}</strong>
          </div>
          <div>
            <span>Pattern</span>
            <strong>{row.integrationPattern}</strong>
          </div>
          <div>
            <span>Lifecycle</span>
            <strong>{row.lifecycleStage}</strong>
          </div>
          <div>
            <span>Exposure</span>
            <strong>{row.exposure}</strong>
          </div>
        </div>
        <p className="sub">
          {i.apiOrInterfaceName} · {i.dataFormat} · {i.authenticationMethod}
        </p>
      </Section>

      <Section title="Why does it matter?">
        <div className="drawer-metrics">
          <div>
            <span>Business criticality</span>
            <strong>{formatCriticality(i.criticality)}</strong>
          </div>
          <div>
            <span>Portfolio decision</span>
            <strong>{row.portfolioDecision}</strong>
          </div>
        </div>
        <div className="chip-row">
          {row.capabilityNames.map((name, idx) => (
            <Chip
              key={`${name}-${idx}`}
              onClick={() => {
                const cap = (i.supportedCapabilityIds || [])[idx]
                if (cap) onOpenEntity?.({ id: cap, type: 'capability' })
              }}
            >
              {name}
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
      </Section>

      <Section title="Provider & consumers">
        <div className="int-dep-flow">
          <div className="int-dep-consumers">
            {row.consumerNames.map((name, idx) => (
              <Chip
                key={`c-${idx}`}
                onClick={() =>
                  onOpenEntity?.({
                    id: row.consumerApplicationIds[idx],
                    type: 'application',
                  })
                }
              >
                {name}
              </Chip>
            ))}
          </div>
          <div className="int-dep-arrow" aria-hidden="true">
            →
          </div>
          <div className="int-dep-hub">
            <strong>{i.apiOrInterfaceName || i.name}</strong>
          </div>
          <div className="int-dep-arrow" aria-hidden="true">
            →
          </div>
          <Chip
            onClick={() =>
              onOpenEntity?.({ id: row.providerApplicationId, type: 'application' })
            }
          >
            {row.providerName}
          </Chip>
        </div>
      </Section>

      <Section title="Ownership">
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
            <span>Integration owner</span>
            <strong>{row.integrationOwnerLabel || 'Unassigned'}</strong>
          </div>
          <div>
            <span>Last reviewed</span>
            <strong>{i.lastReviewDate || '—'}</strong>
          </div>
        </div>
      </Section>

      <Section title="Architecture health">
        <div className="app-health-grid">
          <RiskTag label="Architecture risk" value={row.architectureRisk} />
          <RiskTag label="Security" value={row.securityClassification} />
          <RiskTag label="Standards" value={row.standardsCompliance} />
          <RiskTag
            label="Lifecycle risk"
            value={
              row.lifecycleStage === 'Deprecated' || row.lifecycleStage === 'Retire'
                ? 'High'
                : row.lifecycleStage === 'Legacy'
                  ? 'Medium'
                  : 'Low'
            }
          />
          <RiskTag label="Resilience" value={row.resilienceStatus} />
          <RiskTag label="Observability" value={row.observabilityStatus} />
          <RiskTag label="Reuse" value={row.reuseClassification} />
        </div>
      </Section>

      <Section title="Platform / runtime">
        <div className="drawer-metrics">
          <div>
            <span>Platform</span>
            <strong>{row.platform}</strong>
          </div>
          <div>
            <span>Runtime</span>
            <strong>{row.runtime}</strong>
          </div>
          <div>
            <span>Gateway</span>
            <strong>{row.gateway}</strong>
          </div>
          <div>
            <span>Environment</span>
            <strong>{i.environment}</strong>
          </div>
        </div>
        <p className="sub">
          EA360 understands how these platforms affect the enterprise — it does not administer them.
        </p>
      </Section>

      <Section title="Data">
        <div className="chip-row">
          {dataObjs.length === 0 && <span className="sub">No linked data domains</span>}
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
      </Section>

      <Section title="Standards">
        <ul className="drawer-list">
          {standards.map((s) => (
            <li key={s.id}>
              <strong>{s.id}</strong> — {s.name}
              <span className={`status-tag tone-${row.standardsCompliance === 'Compliant' ? 'good' : row.standardsCompliance === 'Partial' ? 'warn' : 'bad'}`} style={{ marginLeft: 8 }}>
                {row.standardsCompliance}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Findings & risks">
        {linkedFindings.length === 0 && <p className="sub">No linked findings.</p>}
        <ul className="app-finding-list">
          {linkedFindings.slice(0, 5).map((f) => (
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
        {linkedFindings.length > 0 && (
          <button
            type="button"
            className="btn secondary-button"
            onClick={() => onNavigateFindings?.()}
          >
            View related findings
          </button>
        )}
      </Section>

      <Section title="Transformation">
        {activeInit ? (
          <>
            <div className="drawer-metrics">
              <div>
                <span>Initiative</span>
                <strong>{activeInit.name}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{activeInit.status}</strong>
              </div>
              <div>
                <span>Owner</span>
                <strong>
                  {(activeInit.ownerId || '').replace(/^person-/, '').replace(/-/g, ' ') || '—'}
                </strong>
              </div>
              <div>
                <span>Target</span>
                <strong>{activeInit.targetQuarter || activeInit.targetPeriod || activeInit.horizon || '—'}</strong>
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

      <Section title="Recommendation">
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
