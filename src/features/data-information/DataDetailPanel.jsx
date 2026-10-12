import {
  DATA_POLICIES,
  DATA_STANDARDS,
  formatCriticality,
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
    <div className={`app-health-pill risk-${(value || 'low').toLowerCase().replace(/\s+/g, '-')}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

/**
 * Data & Information portfolio detail body — used by EntityDrawer.
 */
export default function DataDetailPanel({
  row,
  repo,
  onOpenEntity,
  onNavigateFindings,
  onNavigateGovernance,
  onFuturePortfolio,
}) {
  if (!row) return null
  const d = row.data
  const findings = relatedFindings(d.id, repo.listFindings?.() || [], d.findingIds)
  const initiatives = relatedInitiatives(row, repo.listInitiatives?.() || [])
  const services = (d.businessServiceIds || [])
    .map((id) => repo.getProcess?.(id) || (repo.listProcesses?.() || []).find((p) => p.id === id))
    .filter(Boolean)
  const standards = (d.standardIds || [])
    .map((id) => DATA_STANDARDS[id] || { id, name: id })
    .filter(Boolean)
  const policies = (d.policyIds || [])
    .map((id) => DATA_POLICIES[id] || { id, name: id })
    .filter(Boolean)
  const activeInit = initiatives.find(
    (init) => !['completed', 'cancelled', 'retired'].includes((init.status || '').toLowerCase()),
  )
  const otherSources = (d.sourceApplicationIds || []).filter(
    (id) => id && id !== d.systemOfRecordApplicationId,
  )
  const sourceConflict = row.authoritativeSourceStatus === 'Multiple Sources'

  return (
    <div className="app-detail-panel data-detail-panel">
      <p className="app-detail-desc">{d.description}</p>
      <p className="sub">
        {d.id} · {row.type} · {d.domain}
        {d.isSynthetic !== false ? ' · Synthetic demo data' : ''}
      </p>

      <Section title="What is this data?">
        <div className="drawer-metrics">
          <div>
            <span>Data domain</span>
            <strong>{d.name}</strong>
          </div>
          <div>
            <span>Stable ID</span>
            <strong>{d.id}</strong>
          </div>
          <div>
            <span>Type</span>
            <strong>{row.type}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{d.status}</strong>
          </div>
        </div>
        {d.businessMeaning && <p className="sub">{d.businessMeaning}</p>}
        {(d.keyEntityNames || []).length > 0 && (
          <div className="chip-row">
            {(d.keyEntityNames || []).map((name) => (
              <Chip key={name}>{name}</Chip>
            ))}
          </div>
        )}
      </Section>

      <Section title="Why does it matter?">
        <div className="drawer-metrics">
          <div>
            <span>Business criticality</span>
            <strong>{formatCriticality(row.criticality)}</strong>
          </div>
          <div>
            <span>Governance maturity</span>
            <strong>{row.governanceMaturity}</strong>
          </div>
        </div>
        <div className="chip-row">
          {row.capabilityNames.map((name, idx) => (
            <Chip
              key={`${name}-${idx}`}
              onClick={() => {
                const cap = (d.businessCapabilityIds || [])[idx]
                if (cap) onOpenEntity?.({ id: cap, type: 'capability' })
              }}
            >
              {name}
            </Chip>
          ))}
        </div>
        {services.length > 0 && (
          <ul className="drawer-list">
            {services.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        )}
        {d.regulatoryImportance && (
          <p className="sub">
            <strong>Regulatory importance.</strong> {d.regulatoryImportance}
          </p>
        )}
        {d.citizenImpact && (
          <p className="sub">
            <strong>Citizen / customer impact.</strong> {d.citizenImpact}
          </p>
        )}
      </Section>

      <Section title="Ownership">
        {row.ownershipGap && <div className="ownership-gap">Ownership Gap</div>}
        <div className="drawer-metrics">
          <div>
            <span>Business data owner</span>
            <strong>{row.businessOwnerLabel || 'Unassigned'}</strong>
          </div>
          <div>
            <span>Data steward</span>
            <strong>{row.dataStewardLabel || 'Unassigned'}</strong>
          </div>
          <div>
            <span>Technical custodian</span>
            <strong>{row.technicalCustodianLabel || 'Unassigned'}</strong>
          </div>
          <div>
            <span>Last reviewed</span>
            <strong>{d.lastReviewedAt || '—'}</strong>
          </div>
        </div>
      </Section>

      <Section title="Authoritative source">
        {sourceConflict && <div className="ownership-gap">Source-of-Truth Conflict</div>}
        <div className="drawer-metrics">
          <div>
            <span>Status</span>
            <strong>{row.authoritativeSourceStatus}</strong>
          </div>
          <div>
            <span>System of record</span>
            <strong>
              {row.systemOfRecordName ? (
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    onOpenEntity?.({
                      id: d.systemOfRecordApplicationId,
                      type: 'application',
                    })
                  }
                >
                  {row.systemOfRecordName}
                </button>
              ) : (
                'Unknown'
              )}
            </strong>
          </div>
          <div>
            <span>Primary application</span>
            <strong>{row.primaryApplicationName || '—'}</strong>
          </div>
        </div>
        {otherSources.length > 0 && (
          <>
            <p className="sub">Other known sources</p>
            <div className="chip-row">
              {otherSources.map((id) => {
                const app = repo.getApplication?.(id)
                return (
                  <Chip
                    key={id}
                    onClick={() => onOpenEntity?.({ id, type: 'application' })}
                  >
                    {app?.name || id}
                  </Chip>
                )
              })}
            </div>
          </>
        )}
        {d.duplicationNote && (
          <div className="data-dup-note">
            <div className="kicker">Potential Source Duplication</div>
            <p>{d.duplicationNote}</p>
            <p className="sub">Requires Architecture / Data Governance Review</p>
          </div>
        )}
      </Section>

      <Section title="Data consumers">
        <div className="chip-row">
          {(d.consumerApplicationIds || []).length === 0 && (
            <span className="sub">No consumer applications linked</span>
          )}
          {(d.consumerApplicationIds || []).map((id, idx) => (
            <Chip
              key={id}
              onClick={() => onOpenEntity?.({ id, type: 'application' })}
              title="Open application"
            >
              {row.consumerApplicationNames[idx] || id}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="APIs & integrations">
        <div className="chip-row">
          {(d.integrationIds || []).length === 0 && (
            <span className="sub">No linked integrations</span>
          )}
          {(d.integrationIds || []).map((id, idx) => (
            <Chip
              key={id}
              onClick={() => onOpenEntity?.({ id, type: 'integration' })}
              title="Open integration"
            >
              {row.integrationNames[idx] || id}
            </Chip>
          ))}
        </div>
      </Section>

      {(d.flowSteps || []).length > 0 && (
        <Section title="Data flow">
          <div className="data-flow-view" aria-label="Compact data flow">
            {(d.flowSteps || []).map((step, idx) => (
              <div key={`${step.label}-${idx}`} className="data-flow-step">
                {idx > 0 && (
                  <div className="int-dep-arrow" aria-hidden="true">
                    ↓
                  </div>
                )}
                <Chip
                  onClick={
                    step.entityId && (step.kind === 'application' || step.kind === 'integration')
                      ? () => onOpenEntity?.({ id: step.entityId, type: step.kind })
                      : undefined
                  }
                >
                  {step.label}
                </Chip>
              </div>
            ))}
          </div>
          <p className="sub">
            Compact flow view for architecture context — not a full lineage engine.
          </p>
        </Section>
      )}

      <Section title="Classification & controls">
        <div className="drawer-metrics">
          <div>
            <span>Classification</span>
            <strong>{row.classificationLabel}</strong>
          </div>
          <div>
            <span>Personal data</span>
            <strong>{d.containsPersonalData ? 'Yes' : 'No'}</strong>
          </div>
          <div>
            <span>Financial data</span>
            <strong>{d.containsFinancialData ? 'Yes' : 'No'}</strong>
          </div>
          <div>
            <span>Regulatory / sensitive</span>
            <strong>{d.sensitive ? 'Yes' : 'No'}</strong>
          </div>
          <div>
            <span>Residency requirement</span>
            <strong>{d.residencyRequirement || '—'}</strong>
          </div>
          <div>
            <span>Hosting</span>
            <strong>{d.hostingLocation || '—'}</strong>
          </div>
          <div>
            <span>Cross-border flow</span>
            <strong>{d.crossBorderStatus || 'Unknown'}</strong>
          </div>
          <div>
            <span>Residency status</span>
            <strong>
              {row.residencyStatus === 'Review Required' || row.residencyStatus === 'Cross-Border'
                ? 'Requires governance review'
                : row.residencyStatus}
            </strong>
          </div>
        </div>
        <p className="sub">Architecture metadata — not a legal compliance conclusion.</p>
      </Section>

      <Section title="Data quality">
        <div className="app-health-grid">
          <RiskTag label="Overall" value={row.qualityStatus} />
          <RiskTag label="Completeness" value={d.completenessStatus || 'Not Assessed'} />
          <RiskTag label="Accuracy" value={d.accuracyStatus || 'Not Assessed'} />
          <RiskTag label="Timeliness" value={d.timelinessStatus || 'Not Assessed'} />
          <RiskTag label="Consistency" value={d.consistencyStatus || 'Not Assessed'} />
        </div>
        <div className="drawer-metrics" style={{ marginTop: 12 }}>
          <div>
            <span>Last reviewed</span>
            <strong>{d.lastReviewedAt || '—'}</strong>
          </div>
          <div>
            <span>Evidence confidence</span>
            <strong>{d.evidenceConfidence || d.dataQuality || '—'}</strong>
          </div>
        </div>
      </Section>

      <Section title="AI readiness">
        <div className="app-reco-card data-ai-card">
          <div className="kicker">AI readiness</div>
          <h3>{row.aiReadiness.toUpperCase()}</h3>
          {d.aiReadinessReason && <p>{d.aiReadinessReason}</p>}
          {(d.aiReadinessFactors || []).length > 0 && (
            <ul className="drawer-list">
              {(d.aiReadinessFactors || []).map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          )}
          <p className="sub">
            Architecture suitability for analytics and AI use — not a legal assessment.
          </p>
        </div>
        {(d.futureAiUses || []).length > 0 && (
          <>
            <p className="sub" style={{ marginTop: 12 }}>
              Future AI uses
            </p>
            <div className="chip-row">
              {(d.futureAiUses || []).map((use) => (
                <Chip key={use} onClick={() => onFuturePortfolio?.('ai')} title="AI & Automation">
                  {use}
                </Chip>
              ))}
            </div>
            <p className="sub">
              AI & Automation Portfolio will be implemented in a subsequent phase.
            </p>
          </>
        )}
      </Section>

      {(d.dataProducts || []).length > 0 && (
        <Section title="Data products">
          <ul className="drawer-list">
            {(d.dataProducts || []).map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong>
                {p.description ? ` — ${p.description}` : ''}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Findings & risks">
        {findings.length === 0 && <p className="sub">No linked findings.</p>}
        <ul className="app-finding-list">
          {findings.slice(0, 6).map((f) => (
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
          <button
            type="button"
            className="btn secondary-button"
            onClick={() => onNavigateFindings?.()}
          >
            View related findings
          </button>
        )}
      </Section>

      <Section title="Governance">
        {(standards.length > 0 || policies.length > 0) && (
          <ul className="drawer-list">
            {standards.map((s) => (
              <li key={s.id}>
                <strong>{s.id}</strong> — {s.name}
              </li>
            ))}
            {policies.map((p) => (
              <li key={p.id}>
                <strong>{p.id}</strong> — {p.name}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          className="btn secondary-button"
          onClick={() => onNavigateGovernance?.()}
        >
          Open governance register
        </button>
        <p className="sub">Linked standards and policies are illustrative architecture metadata.</p>
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
                <strong>
                  {activeInit.targetQuarter || activeInit.targetPeriod || activeInit.horizon || '—'}
                </strong>
              </div>
            </div>
            <p className="sub">
              Expected data impact:{' '}
              {activeInit.intendedOutcome || activeInit.expectedValue || activeInit.description}
            </p>
            <Chip onClick={() => onOpenEntity?.({ id: activeInit.id, type: 'initiative' })}>
              Open initiative
            </Chip>
          </>
        ) : (
          <p className="sub">No active transformation initiative linked.</p>
        )}
        {initiatives.length > 1 && (
          <div className="chip-row" style={{ marginTop: 8 }}>
            {initiatives.map((i) => (
              <Chip key={i.id} onClick={() => onOpenEntity?.({ id: i.id, type: 'initiative' })}>
                {i.name}
              </Chip>
            ))}
          </div>
        )}
      </Section>

      {row.portfolioAction && (
        <Section title="Portfolio action">
          <div className="app-reco-card">
            <div className="kicker">Recommended action</div>
            <h3>{row.portfolioAction.toUpperCase()}</h3>
            <p>
              {d.portfolioActionReason ||
                'Deterministic portfolio action seeded from architecture metadata.'}
            </p>
          </div>
        </Section>
      )}
    </div>
  )
}
