import {
  personLabel,
  readinessTone,
  riskTone,
  standardLabel,
  statusTone,
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

function Chip({ children, onClick }) {
  if (onClick) {
    return (
      <button type="button" className="link-chip" onClick={onClick}>
        {children}
      </button>
    )
  }
  return <span className="link-chip static">{children}</span>
}

function StatusTag({ children, tone }) {
  return <span className={`status-tag tone-${tone || 'muted'}`}>{children}</span>
}

function ImpactList({ items, onOpen, type }) {
  if (!items?.length) return <p className="sub">None documented.</p>
  return (
    <ul className="drawer-list">
      {items.map((item) => (
        <li key={item.id}>
          <button type="button" className="text-link" onClick={() => onOpen?.({ id: item.id, type })}>
            {item.name}
          </button>{' '}
          — {item.impact}
        </li>
      ))}
    </ul>
  )
}

function groupByImpact(items) {
  const groups = {}
  for (const item of items || []) {
    const key = item.impact || 'Change'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}

/**
 * Initiative architecture context — used by EntityDrawer.
 */
export default function InitiativeDetailPanel({
  row,
  repo,
  onOpenEntity,
  onNavigateRoadmap,
  onNavigateGovernance,
  onNavigateFindings,
}) {
  if (!row) return null
  const i = row.init

  const objectives = (i.objectiveIds || [])
    .map((id) => repo.listObjectives().find((o) => o.id === id))
    .filter(Boolean)
  const findings = (i.findingIds || []).map((id) => repo.getFinding(id)).filter(Boolean)
  const recommendations = (i.recommendationIds || [])
    .map((id) => repo.getRecommendation(id))
    .filter(Boolean)
  const decisions = [...new Set([...(i.decisionIds || []), i.decisionId].filter(Boolean))]
    .map((id) => repo.getDecision?.(id))
    .filter(Boolean)
  const outstanding = (i.outstandingDecisionIds || [])
    .map((id) => repo.getDecision?.(id))
    .filter(Boolean)
  const kpis = (i.kpiIds || []).map((id) => repo.getKpi(id)).filter(Boolean)

  const capabilityItems = (i.capabilityImpacts || []).map((x) => {
    const c = repo.getCapability(x.capabilityId)
    return c ? { id: c.id, name: c.name, impact: x.impact } : null
  }).filter(Boolean)

  const applicationItems = (i.applicationImpacts || []).map((x) => {
    const a = repo.getApplication(x.applicationId)
    return a ? { id: a.id, name: a.name, impact: x.impact } : null
  }).filter(Boolean)
  const appGroups = groupByImpact(applicationItems)

  const integrationItems = (i.integrationImpacts || []).map((x) => {
    const int = repo.getIntegration(x.integrationId)
    return int
      ? { id: int.id, name: int.apiOrInterfaceName || int.name, impact: x.impact }
      : null
  }).filter(Boolean)

  const dataItems = (i.dataImpacts || []).map((x) => {
    const d = repo.getDataObject(x.dataObjectId)
    return d ? { id: d.id, name: d.name, impact: x.impact } : null
  }).filter(Boolean)

  const techItems = (i.technologyImpacts || []).map((x) => {
    const t = repo.getTechnology(x.technologyId)
    return t ? { id: t.id, name: t.name, impact: x.impact } : null
  }).filter(Boolean)
  const techGroups = groupByImpact(techItems)

  const aiItems = (i.aiImpacts || []).map((x) => {
    const s = repo.getAiSolution(x.aiSolutionId)
    return s ? { id: s.id, name: s.name, impact: x.impact } : null
  }).filter(Boolean)

  const dependsOn = (i.dependsOnInitiativeIds || [])
    .map((id) => repo.getInitiative(id))
    .filter(Boolean)
  const enables = (i.enablesInitiativeIds || [])
    .map((id) => repo.getInitiative(id))
    .filter(Boolean)
  const conflicts = (i.conflictInitiativeIds || [])
    .map((id) => repo.getInitiative(id))
    .filter(Boolean)
  const overlaps = (i.overlapInitiativeIds || [])
    .map((id) => repo.getInitiative(id))
    .filter(Boolean)

  const standards = (i.standardCompliance || []).map((s) => ({
    ...s,
    name: standardLabel(s.standardId),
  }))

  return (
    <div className="app-detail-panel initiative-detail-panel">
      <p className="app-detail-desc">{i.description}</p>
      <p className="sub">
        {i.id} · {row.deliveryStatus} · {row.horizonLabel}
        {i.isSynthetic !== false ? ' · Synthetic demo data' : ''}
      </p>

      <Section title="Why are we doing this?">
        <dl className="app-detail-dl">
          <div>
            <dt>Initiative</dt>
            <dd>{i.name}</dd>
          </div>
          <div>
            <dt>Strategic objective</dt>
            <dd>{objectives.map((o) => o.name).join(' · ') || '—'}</dd>
          </div>
          <div>
            <dt>Business problem</dt>
            <dd>{i.businessProblem || i.description}</dd>
          </div>
          <div>
            <dt>Expected outcome</dt>
            <dd>{row.expectedOutcome}</dd>
          </div>
          <div>
            <dt>Executive sponsor</dt>
            <dd>{row.executiveSponsorLabel}</dd>
          </div>
          <div>
            <dt>Initiative owner</dt>
            <dd>{row.ownerLabel}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Architecture readiness">
        <div className="drawer-metrics">
          <div>
            <span>Architecture readiness</span>
            <strong>
              <StatusTag tone={readinessTone(row.architectureReadiness)}>
                {row.architectureReadiness}
              </StatusTag>
            </strong>
          </div>
          <div>
            <span>Architecture risk</span>
            <strong>
              <StatusTag tone={riskTone(row.architectureRisk)}>{row.architectureRisk}</StatusTag>
            </strong>
          </div>
          <div>
            <span>Architecture owner</span>
            <strong>{row.architectureOwnerLabel}</strong>
          </div>
          <div>
            <span>Last architecture review</span>
            <strong>{i.lastArchitectureReview || '—'}</strong>
          </div>
          <div>
            <span>Next review</span>
            <strong>{i.nextArchitectureReview || '—'}</strong>
          </div>
          <div>
            <span>Outstanding decisions</span>
            <strong>{row.outstandingDecisionCount}</strong>
          </div>
          <div>
            <span>Active exceptions</span>
            <strong>{row.activeExceptionCount}</strong>
          </div>
        </div>
      </Section>

      <Section title="Business capability impact">
        <ImpactList items={capabilityItems} onOpen={onOpenEntity} type="capability" />
      </Section>

      <Section title="Application impact">
        {Object.keys(appGroups).length === 0 ? (
          <p className="sub">None documented.</p>
        ) : (
          Object.entries(appGroups).map(([impact, items]) => (
            <div key={impact} className="impact-group">
              <h5>{impact === 'Dependency' ? 'Unchanged dependency' : impact}</h5>
              <div className="chip-row">
                {items.map((a) => (
                  <Chip key={a.id} onClick={() => onOpenEntity?.({ id: a.id, type: 'application' })}>
                    {a.name}
                  </Chip>
                ))}
              </div>
            </div>
          ))
        )}
      </Section>

      <Section title="Integration & API impact">
        <ImpactList items={integrationItems} onOpen={onOpenEntity} type="integration" />
      </Section>

      <Section title="Data impact">
        <ImpactList items={dataItems} onOpen={onOpenEntity} type="dataObject" />
      </Section>

      <Section title="Technology impact">
        {Object.keys(techGroups).length === 0 ? (
          <p className="sub">None documented.</p>
        ) : (
          Object.entries(techGroups).map(([impact, items]) => (
            <div key={impact} className="impact-group">
              <h5>
                {impact === 'Introduce'
                  ? 'Platforms introduced'
                  : impact === 'Retain'
                    ? 'Technologies retained'
                    : impact === 'Modernise'
                      ? 'Technologies modernised'
                      : impact === 'Retire'
                        ? 'Technologies retired'
                        : 'Strategic dependency'}
              </h5>
              <div className="chip-row">
                {items.map((t) => (
                  <Chip key={t.id} onClick={() => onOpenEntity?.({ id: t.id, type: 'technology' })}>
                    {t.name}
                  </Chip>
                ))}
              </div>
            </div>
          ))
        )}
      </Section>

      {aiItems.length > 0 && (
        <Section title="AI & automation impact">
          <ImpactList items={aiItems} onOpen={onOpenEntity} type="aiSolution" />
        </Section>
      )}

      <Section title="Findings & risks">
        <h5>Findings addressed</h5>
        <div className="chip-row">
          {findings.map((f) => (
            <Chip key={f.id} onClick={() => onOpenEntity?.({ id: f.id, type: 'finding' })}>
              {f.id.toUpperCase().replace('FIND-', 'FND-')} — {f.name}
            </Chip>
          ))}
        </div>
        {(i.risksReduced || []).length > 0 && (
          <>
            <h5>Existing risks reduced</h5>
            <ul className="drawer-list">
              {(i.risksReduced || []).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}
        {(i.risksIntroduced || []).length > 0 && (
          <>
            <h5>New risks introduced</h5>
            <ul className="drawer-list">
              {(i.risksIntroduced || []).map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </>
        )}
        {onNavigateFindings && (
          <button type="button" className="text-link" onClick={onNavigateFindings}>
            View findings register
          </button>
        )}
      </Section>

      <Section title="Architecture decisions">
        <ul className="drawer-list">
          {decisions.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className="text-link"
                onClick={() => onOpenEntity?.({ id: d.id, type: 'decision' })}
              >
                {d.name}
              </button>{' '}
              — {d.decisionStatus || d.status}
            </li>
          ))}
        </ul>
        {outstanding.length > 0 && (
          <>
            <h5>Decisions required before next gate</h5>
            <ul className="drawer-list">
              {outstanding.map((d) => (
                <li key={d.id}>
                  <StatusTag tone="warn">Required</StatusTag>{' '}
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => onOpenEntity?.({ id: d.id, type: 'decision' })}
                  >
                    {d.name}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        {onNavigateGovernance && (
          <button type="button" className="text-link" onClick={onNavigateGovernance}>
            Open decision register
          </button>
        )}
      </Section>

      <Section title="Standards & exceptions">
        <ul className="drawer-list">
          {standards.map((s) => (
            <li key={s.standardId}>
              {s.name} — <StatusTag tone={s.compliance === 'Aligned' ? 'good' : s.compliance === 'Partial' ? 'warn' : 'bad'}>{s.compliance}</StatusTag>
            </li>
          ))}
        </ul>
        {(i.exceptionsDetail || []).length > 0 && (
          <>
            <h5>Active exceptions</h5>
            <ul className="drawer-list">
              {(i.exceptionsDetail || []).map((e) => (
                <li key={e.id}>
                  {e.name}
                  {e.expiryDate ? ` · expires ${e.expiryDate}` : ''}
                </li>
              ))}
            </ul>
          </>
        )}
      </Section>

      <Section title="Dependencies">
        <h5>Depends on</h5>
        {dependsOn.length === 0 ? (
          <p className="sub">None</p>
        ) : (
          <ul className="drawer-list">
            {dependsOn.map((d) => {
              const reason = (i.dependencyReasons || []).find((x) => x.initiativeId === d.id)?.reason
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => onOpenEntity?.({ id: d.id, type: 'initiative' })}
                  >
                    {d.name}
                  </button>
                  {reason ? <div className="sub">{reason}</div> : null}
                </li>
              )
            })}
          </ul>
        )}
        <h5>Enables</h5>
        <div className="chip-row">
          {enables.map((d) => (
            <Chip key={d.id} onClick={() => onOpenEntity?.({ id: d.id, type: 'initiative' })}>
              {d.name}
            </Chip>
          ))}
        </div>
        {conflicts.length > 0 && (
          <>
            <h5>Conflicts with</h5>
            <div className="chip-row">
              {conflicts.map((d) => (
                <Chip key={d.id} onClick={() => onOpenEntity?.({ id: d.id, type: 'initiative' })}>
                  {d.name}
                </Chip>
              ))}
            </div>
            {i.conflictNotes && <p className="sub">{i.conflictNotes}</p>}
          </>
        )}
        {overlaps.length > 0 && (
          <>
            <h5>Potential overlap</h5>
            <div className="chip-row">
              {overlaps.map((d) => (
                <Chip key={d.id} onClick={() => onOpenEntity?.({ id: d.id, type: 'initiative' })}>
                  {d.name}
                </Chip>
              ))}
            </div>
            <p className="sub">{i.overlapNotes || 'Architecture review required.'}</p>
            <StatusTag tone="warn">Architecture review required</StatusTag>
          </>
        )}
      </Section>

      <Section title="Value & outcomes">
        <dl className="app-detail-dl">
          <div>
            <dt>Expected outcome</dt>
            <dd>{row.expectedOutcome}</dd>
          </div>
          <div>
            <dt>Value measure defined</dt>
            <dd>{row.valueMeasureDefined ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt>Baseline available</dt>
            <dd>{row.baselineDefined ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt>Target defined</dt>
            <dd>{row.targetDefined ? 'Yes' : 'No'}</dd>
          </div>
          <div>
            <dt>Current measurement</dt>
            <dd>{i.currentMeasurement || (row.valueMeasureDefined ? 'Available' : 'Pending')}</dd>
          </div>
        </dl>
        {kpis.map((k) => (
          <div key={k.id} className="kpi-value-block">
            <strong>{k.name}</strong>
            <div className="sub">{k.id}</div>
            <div className="drawer-metrics">
              <div>
                <span>Baseline</span>
                <strong>
                  {k.baselineValue ?? '—'}
                  {k.unit ? ` ${k.unit}` : ''}
                </strong>
              </div>
              <div>
                <span>Current</span>
                <strong>
                  {k.currentValue}
                  {k.unit ? ` ${k.unit}` : ''}
                </strong>
              </div>
              <div>
                <span>Target</span>
                <strong>
                  {k.targetValue}
                  {k.unit ? ` ${k.unit}` : ''}
                </strong>
              </div>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Transformation traceability">
        <ol className="traceability-chain">
          <li>
            <span>Strategic objective</span>
            <strong>{objectives.map((o) => o.name).join(' · ') || '—'}</strong>
          </li>
          <li>
            <span>Finding / opportunity</span>
            <strong>{findings.map((f) => f.name).join(' · ') || '—'}</strong>
          </li>
          <li>
            <span>Recommendation</span>
            <strong>{recommendations.map((r) => r.name).join(' · ') || '—'}</strong>
          </li>
          <li>
            <span>Initiative</span>
            <strong>{i.name}</strong>
          </li>
          <li>
            <span>Architecture decision</span>
            <strong>{decisions.map((d) => d.name).join(' · ') || '—'}</strong>
          </li>
          <li>
            <span>Architecture change</span>
            <strong>
              {[
                applicationItems.length ? `${applicationItems.length} apps` : null,
                integrationItems.length ? `${integrationItems.length} integrations` : null,
                dataItems.length ? `${dataItems.length} data domains` : null,
              ]
                .filter(Boolean)
                .join(' · ') || '—'}
            </strong>
          </li>
          <li>
            <span>KPI / outcome</span>
            <strong>{kpis.map((k) => k.name).join(' · ') || row.expectedOutcome}</strong>
          </li>
        </ol>
      </Section>

      <Section title="Roadmap relationship">
        <dl className="app-detail-dl">
          <div>
            <dt>Horizon</dt>
            <dd>{row.horizonLabel}</dd>
          </div>
          <div>
            <dt>Roadmap phase</dt>
            <dd>{i.roadmapPhase || '—'}</dd>
          </div>
          <div>
            <dt>Start</dt>
            <dd>{i.startDate || '—'}</dd>
          </div>
          <div>
            <dt>Target</dt>
            <dd>{i.targetDate || i.targetQuarter || '—'}</dd>
          </div>
          <div>
            <dt>Progress</dt>
            <dd>{row.progressPercent}%</dd>
          </div>
        </dl>
        <p className="sub">
          Initiatives describe what transformation is being executed. The roadmap sequences how it
          lands over time.
        </p>
        {onNavigateRoadmap && (
          <button type="button" className="btn secondary-button" onClick={onNavigateRoadmap}>
            View on Roadmap
          </button>
        )}
      </Section>

      <Section title="Ownership">
        <dl className="app-detail-dl">
          <div>
            <dt>Executive sponsor</dt>
            <dd>{row.executiveSponsorLabel}</dd>
          </div>
          <div>
            <dt>Initiative owner</dt>
            <dd>{row.ownerLabel}</dd>
          </div>
          <div>
            <dt>Architecture owner</dt>
            <dd>{row.architectureOwnerLabel}</dd>
          </div>
          <div>
            <dt>Strategic priority</dt>
            <dd>
              <StatusTag tone={statusTone(row.deliveryStatus)}>{row.strategicPriority}</StatusTag>
            </dd>
          </div>
        </dl>
        <p className="sub">Owners: {personLabel(i.ownerId)}</p>
      </Section>
    </div>
  )
}
