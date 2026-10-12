import {
  formatDeployment,
  formatLifecycle,
  relatedFindings,
  relatedInitiatives,
  TECH_STANDARDS,
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

export default function TechnologyDetailPanel({
  row,
  repo,
  onOpenEntity,
  onNavigateFindings,
  onNavigateIntegrations,
  onNavigateData,
}) {
  if (!row) return null
  const { tech: t } = row
  const apps = (t.applicationIds || [])
    .map((id) => repo.getApplication(id))
    .filter(Boolean)
  const integrations = (t.integrationIds || [])
    .map((id) => repo.getIntegration(id))
    .filter(Boolean)
  const dataObjs = (t.dataDomainIds || [])
    .map((id) => repo.getDataObject(id))
    .filter(Boolean)
  const findings =
    relatedFindings(t.id, repo.listFindings()).length > 0
      ? relatedFindings(t.id, repo.listFindings())
      : repo.findingsForTechnology?.(t.id) || []
  const initiatives = relatedInitiatives(row, repo.listInitiatives())
  const standards = (t.standardIds || [])
    .map((id) => TECH_STANDARDS[id] || { id, name: id })
    .filter(Boolean)
  const activeInit = initiatives.find(
    (init) => !['completed', 'cancelled', 'retired'].includes((init.status || '').toLowerCase()),
  )

  return (
    <div className="app-detail-panel tech-detail-panel">
      <p className="app-detail-desc">{t.description}</p>
      <p className="sub">
        {t.id} · {row.categoryNorm} · {formatLifecycle(t.lifecycle)}
        {t.isSynthetic !== false ? ' · Synthetic demo data' : ''}
      </p>

      <Section title="What is this technology?">
        <div className="drawer-metrics">
          <div>
            <span>Category</span>
            <strong>{row.categoryNorm}</strong>
          </div>
          <div>
            <span>Version</span>
            <strong>{t.version || '—'}</strong>
          </div>
          <div>
            <span>Lifecycle</span>
            <strong>{formatLifecycle(t.lifecycle)}</strong>
          </div>
          <div>
            <span>Deployment</span>
            <strong>{formatDeployment(t.deploymentModel)}</strong>
          </div>
        </div>
      </Section>

      <Section title="Why does it matter?">
        <div className="drawer-metrics">
          <div>
            <span>Dependent applications</span>
            <strong>{apps.length}</strong>
          </div>
          <div>
            <span>Critical applications</span>
            <strong>{row.criticalApplicationCount}</strong>
          </div>
          <div>
            <span>Architecture risk</span>
            <strong>{row.architectureRisk}</strong>
          </div>
          <div>
            <span>Transformation relevance</span>
            <strong>{row.inTransformation ? 'Active programme' : 'Stable'}</strong>
          </div>
        </div>
        {activeInit && (
          <p className="sub">
            Linked to <strong>{activeInit.name}</strong> — sequencing and migration risk should be
            reviewed alongside lifecycle status.
          </p>
        )}
      </Section>

      <Section title="Ownership">
        {row.ownershipGap && <div className="ownership-gap">Ownership Gap</div>}
        <div className="drawer-metrics">
          <div>
            <span>Technology owner</span>
            <strong>{row.technologyOwnerLabel || 'Ownership Gap'}</strong>
          </div>
          <div>
            <span>Platform owner</span>
            <strong>{row.platformOwnerLabel || 'Ownership Gap'}</strong>
          </div>
          <div>
            <span>Operational owner</span>
            <strong>{row.operationalOwnerLabel || 'Ownership Gap'}</strong>
          </div>
        </div>
      </Section>

      <Section title="Vendor / support">
        <div className="drawer-metrics">
          <div>
            <span>Vendor / community</span>
            <strong>{t.vendor || '—'}</strong>
          </div>
          <div>
            <span>Support status</span>
            <strong>{t.supportStatus || 'Not assessed'}</strong>
          </div>
          <div>
            <span>Support end date</span>
            <strong>
              {t.supportEndDate
                ? `${t.supportEndDate}${t.supportEndDateSynthetic ? ' (synthetic demo)' : ''}`
                : '—'}
            </strong>
          </div>
        </div>
      </Section>

      <Section title="Lifecycle">
        <div className="drawer-metrics">
          <div>
            <span>Current lifecycle</span>
            <strong>{formatLifecycle(t.lifecycle)}</strong>
          </div>
          <div>
            <span>Target lifecycle</span>
            <strong>{t.targetLifecycle ? formatLifecycle(t.targetLifecycle) : '—'}</strong>
          </div>
          <div>
            <span>Target date</span>
            <strong>{t.targetLifecycleDate || '—'}</strong>
          </div>
        </div>
        {t.targetLifecycleReason && <p className="sub">{t.targetLifecycleReason}</p>}
      </Section>

      <Section title="Dependent applications">
        <div className="chip-row">
          {apps.length === 0 && <span className="sub">No linked applications</span>}
          {apps.map((a) => (
            <Chip
              key={a.id}
              onClick={() => onOpenEntity?.({ id: a.id, type: 'application' })}
              title="Open application"
            >
              {a.name}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Integration dependencies">
        <div className="chip-row">
          {integrations.length === 0 && <span className="sub">No linked integrations</span>}
          {integrations.map((i) => (
            <Chip
              key={i.id}
              onClick={() => onOpenEntity?.({ id: i.id, type: 'integration' })}
              title="Open integration"
            >
              {i.name}
            </Chip>
          ))}
        </div>
        {integrations.length > 0 && (
          <button type="button" className="text-link" onClick={onNavigateIntegrations}>
            View in Integrations & APIs portfolio
          </button>
        )}
      </Section>

      <Section title="Data dependencies">
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
        {dataObjs.length > 0 && (
          <button type="button" className="text-link" onClick={onNavigateData}>
            View in Data & Information portfolio
          </button>
        )}
      </Section>

      <Section title="Standards">
        <div className="drawer-metrics">
          <div>
            <span>Standard status</span>
            <strong>{row.standardStatus}</strong>
          </div>
          <div>
            <span>Active exceptions</span>
            <strong>{t.exceptionIds?.length || 0}</strong>
          </div>
        </div>
        {standards.length > 0 && (
          <ul className="drawer-list">
            {standards.map((s) => (
              <li key={s.id}>
                {s.id} — {s.name}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Resilience">
        <div className="app-health-grid">
          <RiskTag label="HA" value={t.haStatus || 'Unknown'} />
          <RiskTag label="DR" value={t.drStatus || t.resilienceStatus || 'Not Assessed'} />
          <RiskTag label="RTO tier" value={t.rtoTier || '—'} />
          <RiskTag label="RPO" value={t.rpoTier || '—'} />
        </div>
        <p className="sub">Architecture-level metadata — not operational monitoring.</p>
      </Section>

      <Section title="Security posture">
        <div className="drawer-metrics">
          <div>
            <span>Security review</span>
            <strong>{t.securityReviewStatus || 'Not Assessed'}</strong>
          </div>
          <div>
            <span>Critical findings</span>
            <strong>{findings.filter((f) => f.severity === 'critical').length}</strong>
          </div>
          <div>
            <span>Known architecture exceptions</span>
            <strong>{t.exceptionIds?.length || 0}</strong>
          </div>
        </div>
      </Section>

      <Section title="Transformation">
        <div className="chip-row">
          {initiatives.length === 0 && <span className="sub">No linked initiatives</span>}
          {initiatives.map((init) => (
            <Chip
              key={init.id}
              onClick={() => onOpenEntity?.({ id: init.id, type: 'initiative' })}
            >
              {init.name} · {init.status}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Findings">
        <div className="chip-row">
          {findings.length === 0 && <span className="sub">No linked findings</span>}
          {findings.map((f) => (
            <Chip key={f.id} onClick={() => onOpenEntity?.({ id: f.id, type: 'finding' })}>
              {f.id} — {f.name}
            </Chip>
          ))}
        </div>
        {findings.length > 0 && (
          <button type="button" className="text-link" onClick={onNavigateFindings}>
            View in Findings & Risks
          </button>
        )}
      </Section>

      <Section title="Portfolio recommendation">
        <div className={`portfolio-decision-banner decision-${row.portfolioDecision.toLowerCase()}`}>
          <strong>{row.portfolioDecision}</strong>
        </div>
        <p className="sub">{t.portfolioDecisionReason || 'Seeded portfolio decision for demo.'}</p>
      </Section>
    </div>
  )
}
