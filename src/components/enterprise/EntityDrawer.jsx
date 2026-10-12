import { usePrototypeStore } from '../../state/prototypeStore'
import ApplicationDetailPanel from '../../features/applications/ApplicationDetailPanel'
import { enrichApplication } from '../../features/applications/portfolioModel'
import IntegrationDetailPanel from '../../features/integrations/IntegrationDetailPanel'
import { enrichIntegration } from '../../features/integrations/portfolioModel'
import DataDetailPanel from '../../features/data-information/DataDetailPanel'
import { enrichDataDomain } from '../../features/data-information/portfolioModel'
import TechnologyDetailPanel from '../../features/technology-infrastructure/TechnologyDetailPanel'
import { enrichTechnology } from '../../features/technology-infrastructure/portfolioModel'
import AIDetailPanel from '../../features/ai-automation/AIDetailPanel'
import { enrichAiSolution } from '../../features/ai-automation/portfolioModel'
import InitiativeDetailPanel from '../../features/initiatives/InitiativeDetailPanel'
import { enrichInitiative } from '../../features/initiatives/portfolioModel'
import EvidencePanel, { deriveTrustStatus } from '../../features/evidence/EvidencePanel'
import { callStoreAction } from '../../features/workflow/callStoreAction'

function Section({ title, children }) {
  if (!children || (Array.isArray(children) && !children.length)) return null
  return (
    <div className="drawer-section">
      <h4>{title}</h4>
      {children}
    </div>
  )
}

function formatCritLabel(c) {
  if (!c) return '—'
  return String(c).charAt(0).toUpperCase() + String(c).slice(1)
}

function LinkChip({ id, type, label, onOpen }) {
  return (
    <button type="button" className="link-chip" onClick={() => onOpen({ id, type })}>
      {label}
    </button>
  )
}

export default function EntityDrawer() {
  const selected = usePrototypeStore((s) => s.selectedEntity)
  const clearSelection = usePrototypeStore((s) => s.clearSelection)
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const setNavContext = usePrototypeStore((s) => s.setNavContext)
  const setGraphRoot = usePrototypeStore((s) => s.setGraphRoot)
  const view = usePrototypeStore((s) => s.view)
  const repo = usePrototypeStore((s) => s.getRepo)()

  if (!selected) return null

  const open = (entity) => {
    setNavContext({ fromView: view, entityId: selected.id })
    selectEntity(entity)
  }

  const goView = (nextView) => {
    setView(nextView)
    window.location.hash = nextView === 'executive' ? '' : nextView
  }

  let title = selected.id
  let subtitle = selected.type
  let body = null

  if (selected.type === 'capability') {
    const c = repo.getCapability(selected.id)
    if (!c) return null
    const parent = c.parentId ? repo.getCapability(c.parentId) : null
    title = c.name
    subtitle = `Capability · L${c.level} · ${c.domain} · Risk ${c.riskScore}`
    const apps = repo.applicationsForCapability(c.id)
    const ints = repo.integrationsForApplications(apps.map((a) => a.id))
    const findings = repo.findingsForCapability(c.id)
    const processes = repo.processesForCapability(c.id)
    const recs = repo.recommendationsForCapability(c.id)
    const inits = repo.initiativesForCapability(c.id)
    const objectives = c.strategicObjectiveIds
      .map((id) => repo.listObjectives().find((o) => o.id === id))
      .filter(Boolean)
    body = (
      <>
        <p>{c.description}</p>
        <div className="drawer-metrics">
          <div><span>Current maturity</span><strong>{c.maturityCurrent}</strong></div>
          <div><span>Target</span><strong>{c.maturityTarget}</strong></div>
          <div><span>Strategic importance</span><strong>{c.strategicImportance}</strong></div>
          <div><span>Investment priority</span><strong>{c.investmentPriority}</strong></div>
          <div><span>Risk exposure</span><strong>{c.riskScore}</strong></div>
          <div><span>Owner</span><strong>{c.ownerId.replace('person-', '')}</strong></div>
        </div>
        <p className="sub">
          Level {c.level}
          {parent ? ` · Parent: ${parent.name}` : ''} · Data quality {c.dataQuality} · Updated{' '}
          {c.updatedAt.slice(0, 10)}
        </p>
        <Section title="Linked strategic objectives">
          <ul className="drawer-list">
            {objectives.map((o) => (
              <li key={o.id}>{o.name}</li>
            ))}
          </ul>
        </Section>
        <Section title="Supporting processes">
          <ul className="drawer-list">
            {processes.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </Section>
        <Section title="Supporting applications">
          <div className="chip-row">
            {apps.map((a) => (
              <LinkChip key={a.id} id={a.id} type="application" label={a.name} onOpen={open} />
            ))}
          </div>
          <button type="button" className="text-link" onClick={() => goView('applications')}>
            View in application portfolio
          </button>
        </Section>
        <Section title="Related integrations and data">
          <div className="chip-row">
            {ints.map((i) => (
              <LinkChip key={i.id} id={i.id} type="integration" label={`${i.name} · ${i.pattern}`} onOpen={open} />
            ))}
          </div>
        </Section>
        <Section title="Findings and evidence">
          <div className="chip-row">
            {findings.map((f) => (
              <LinkChip key={f.id} id={f.id} type="finding" label={f.name} onOpen={open} />
            ))}
          </div>
        </Section>
        <Section title="Recommendations">
          <div className="chip-row">
            {recs.map((r) => (
              <LinkChip key={r.id} id={r.id} type="recommendation" label={r.name} onOpen={open} />
            ))}
          </div>
        </Section>
        <Section title="Active roadmap initiatives">
          <div className="chip-row">
            {inits.map((i) => (
              <LinkChip key={i.id} id={i.id} type="initiative" label={i.name} onOpen={open} />
            ))}
          </div>
        </Section>
      </>
    )
  }

  if (selected.type === 'application') {
    const a = repo.getApplication(selected.id)
    if (!a) return null
    const capsAll = repo.listCapabilities()
    const initsAll = repo.listInitiatives()
    const row = enrichApplication(a, { capabilities: capsAll, initiatives: initsAll })
    title = a.name
    subtitle = `Application · ${row.portfolioDecision} · ${row.lifecycleStage}`
    body = (
      <ApplicationDetailPanel
        row={row}
        repo={repo}
        onOpenEntity={open}
        onNavigateFindings={() => goView('findings')}
        onFuturePortfolio={(key) => {
          if (key === 'integrations') {
            goView('integrations')
            return
          }
          if (key === 'data') {
            goView('data-information')
            return
          }
          if (key === 'technology') {
            goView('technology-infrastructure')
            return
          }
          if (key === 'ai') {
            goView('ai-automation')
            return
          }
          usePrototypeStore.getState().showToast('Module scheduled for a subsequent phase.')
        }}
      />
    )
  }

  if (selected.type === 'integration') {
    const i = repo.getIntegration(selected.id)
    if (!i) return null
    const appsAll = repo.listApplications()
    const capsAll = repo.listCapabilities()
    const initsAll = repo.listInitiatives()
    const row = enrichIntegration(i, {
      applications: appsAll,
      capabilities: capsAll,
      initiatives: initsAll,
    })
    title = i.name
    subtitle = `Integration · ${row.portfolioDecision} · ${row.lifecycleStage}`
    body = (
      <IntegrationDetailPanel
        row={row}
        repo={repo}
        onOpenEntity={open}
        onNavigateFindings={() => goView('findings')}
        onFuturePortfolio={(key) => {
          if (key === 'data') {
            goView('data-information')
            return
          }
          if (key === 'technology') {
            goView('technology-infrastructure')
            return
          }
          if (key === 'ai') {
            goView('ai-automation')
            return
          }
          usePrototypeStore.getState().showToast('Module scheduled for a subsequent phase.')
        }}
      />
    )
  }

  if (selected.type === 'dataObject') {
    const d = repo.getDataObject(selected.id)
    if (!d) return null
    const appsAll = repo.listApplications()
    const capsAll = repo.listCapabilities()
    const initsAll = repo.listInitiatives()
    const intsAll = repo.listIntegrations()
    const row = enrichDataDomain(d, {
      applications: appsAll,
      capabilities: capsAll,
      initiatives: initsAll,
      integrations: intsAll,
    })
    title = d.name
    subtitle = `Data · ${row.authoritativeSourceStatus} · ${formatCritLabel(row.criticality)}`
    body = (
      <DataDetailPanel
        row={row}
        repo={repo}
        onOpenEntity={open}
        onNavigateFindings={() => goView('findings')}
        onNavigateGovernance={() => goView('governance')}
        onFuturePortfolio={(key) => {
          if (key === 'ai') {
            goView('ai-automation')
            return
          }
          usePrototypeStore.getState().showToast('Module scheduled for a subsequent phase.')
        }}
      />
    )
  }

  if (selected.type === 'aiSolution') {
    const ai = repo.getAiSolution(selected.id)
    if (!ai) return null
    const row = enrichAiSolution(ai, {
      capabilities: repo.listCapabilities(),
      models: repo.listAiModels(),
      integrations: repo.listIntegrations(),
      applications: repo.listApplications(),
      technologies: repo.listTechnologies(),
    })
    title = ai.name
    subtitle = `AI · ${ai.solutionType} · ${ai.lifecycle}`
    body = (
      <AIDetailPanel
        row={row}
        repo={repo}
        onOpenEntity={open}
        onNavigateFindings={() => goView('findings')}
        onNavigateGovernance={() => goView('governance')}
        onNavigateAiGovernance={() =>
          usePrototypeStore.getState().showToast('AI & Data Governance is scheduled for a subsequent phase.')
        }
      />
    )
  }

  if (selected.type === 'technology') {
    const t = repo.getTechnology(selected.id)
    if (!t) return null
    const appsAll = repo.listApplications()
    const intsAll = repo.listIntegrations()
    const initsAll = repo.listInitiatives()
    const row = enrichTechnology(t, {
      applications: appsAll,
      integrations: intsAll,
      initiatives: initsAll,
    })
    title = t.name
    subtitle = `Technology · ${row.portfolioDecision} · ${row.lifecycleLabel}`
    body = (
      <TechnologyDetailPanel
        row={row}
        repo={repo}
        onOpenEntity={open}
        onNavigateFindings={() => goView('findings')}
        onNavigateIntegrations={() => goView('integrations')}
        onNavigateData={() => goView('data-information')}
      />
    )
  }

  if (selected.type === 'evidence') {
    const e = repo.getEvidence(selected.id)
    if (!e) return null
    title = e.name
    subtitle = `Evidence · ${e.evidenceType} · ${deriveTrustStatus(e)}`
    body = (
      <>
        <p>{e.description}</p>
        <EvidencePanel
          evidenceList={[e]}
          onOpenEvidence={(id) => open({ id, type: 'evidence' })}
        />
        <Section title="Linked objects">
          <div className="chip-row">
            {(e.linkedObjectIds || []).map((id) => (
              <span key={id} className="link-chip static">
                {repo.resolveEntityName?.(id) || id}
              </span>
            ))}
          </div>
        </Section>
      </>
    )
  }

  if (selected.type === 'finding') {
    const f = repo.getFinding(selected.id)
    if (!f) return null
    title = f.name
    subtitle = `Finding · ${f.severity} · ${f.status}`
    const recs = repo.recommendationsForFinding(f.id)
    const evidence = f.evidenceIds.map((id) => repo.getEvidence(id)).filter(Boolean)
    const inits = recs.flatMap((r) => repo.initiativesForRecommendation(r.id))
    body = (
      <>
        <p><strong>Problem.</strong> {f.problemStatement}</p>
        <p><strong>Root cause.</strong> {f.rootCause}</p>
        <p><strong>Business impact.</strong> {f.businessImpact}</p>
        <p className="sub">
          Owner {(f.ownerId || '').replace('person-', '') || 'unassigned'} · Target {f.targetDate} ·
          Urgency {f.urgency}
        </p>
        <Section title="Evidence">
          <EvidencePanel evidenceList={evidence} findingId={f.id} compact />
        </Section>
        <Section title="Recommendations">
          <div className="chip-row">
            {recs.map((r) => (
              <LinkChip key={r.id} id={r.id} type="recommendation" label={r.name} onOpen={open} />
            ))}
          </div>
        </Section>
        <Section title="Initiatives">
          <div className="chip-row">
            {inits.map((i) => (
              <LinkChip key={i.id} id={i.id} type="initiative" label={i.name} onOpen={open} />
            ))}
          </div>
        </Section>
        <Section title="Affected capabilities and applications">
          <div className="chip-row">
            {f.linkedObjectIds.map((id) => {
              const cap = repo.getCapability(id)
              const app = repo.getApplication(id)
              const int = repo.getIntegration?.(id)
              const tech = repo.getTechnology?.(id)
              if (cap) return <LinkChip key={id} id={id} type="capability" label={cap.name} onOpen={open} />
              if (app) return <LinkChip key={id} id={id} type="application" label={app.name} onOpen={open} />
              if (int) return <LinkChip key={id} id={id} type="integration" label={int.name} onOpen={open} />
              if (tech) return <LinkChip key={id} id={id} type="technology" label={tech.name} onOpen={open} />
              return <span key={id} className="link-chip static">{id}</span>
            })}
          </div>
        </Section>
        <Section title="Workflow">
          <div className="toolbar wrap-actions">
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('submitForReview', { findingId: f.id })}>Submit for review</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('validateFinding', { findingId: f.id })}>Validate</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('rejectFinding', { findingId: f.id })}>Reject</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('createRecommendationFromFinding', { findingId: f.id })}>Create recommendation</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('markRemediationPlanned', { findingId: f.id })}>Remediation planned</button>
            <button type="button" className="btn primary primary-button" onClick={() => callStoreAction('resolveFinding', { findingId: f.id })}>Resolve</button>
            <button
              type="button"
              className="btn secondary-button"
              onClick={() => {
                setGraphRoot({ id: f.id, type: 'finding' })
                goView('explorer')
              }}
            >
              Explore
            </button>
          </div>
        </Section>
      </>
    )
  }

  if (selected.type === 'recommendation') {
    const r = repo.getRecommendation(selected.id)
    if (!r) return null
    title = r.name
    subtitle = `Recommendation · ${r.status} · Effort ${r.effortBand}`
    const inits = repo.initiativesForRecommendation(r.id)
    body = (
      <>
        <p><strong>Outcome.</strong> {r.outcome}</p>
        <p><strong>Expected value.</strong> {r.expectedValue}</p>
        <p><strong>Risk reduction.</strong> {r.riskReduction}</p>
        <p className="sub">Confidence {r.confidence} · Preferred: {r.preferredOption || r.optionsConsidered?.[0] || '—'}</p>
        <Section title="Options considered">
          <ul className="drawer-list">
            {(r.optionsConsidered || []).map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </Section>
        <Section title="Supporting findings">
          <div className="chip-row">
            {r.findingIds.map((id) => {
              const f = repo.getFinding(id)
              return f ? <LinkChip key={id} id={id} type="finding" label={f.name} onOpen={open} /> : null
            })}
          </div>
        </Section>
        <Section title="Affected capabilities">
          <div className="chip-row">
            {r.affectedCapabilityIds.map((id) => {
              const c = repo.getCapability(id)
              return c ? <LinkChip key={id} id={id} type="capability" label={c.name} onOpen={open} /> : null
            })}
          </div>
        </Section>
        <Section title="Affected applications">
          <div className="chip-row">
            {r.affectedApplicationIds.map((id) => {
              const a = repo.getApplication(id)
              return a ? <LinkChip key={id} id={id} type="application" label={a.name} onOpen={open} /> : null
            })}
          </div>
        </Section>
        <Section title="Roadmap initiatives">
          <div className="chip-row">
            {inits.map((i) => (
              <LinkChip key={i.id} id={i.id} type="initiative" label={i.name} onOpen={open} />
            ))}
          </div>
        </Section>
        <Section title="Workflow">
          <div className="toolbar wrap-actions">
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('submit', { recommendationId: r.id })}>Submit</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('approve', { recommendationId: r.id })}>Approve</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('reject', { recommendationId: r.id })}>Reject</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('requestRevision', { recommendationId: r.id })}>Request revision</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('sendToARB', { recommendationId: r.id })}>Send to ARB</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('addComment', { recommendationId: r.id, comment: 'Drawer review note' })}>Add comment</button>
            {r.status === 'approved' ? (
              <button type="button" className="btn primary primary-button" onClick={() => callStoreAction('createInitiative', { recommendationIds: [r.id], name: `${r.name} — initiative`, description: r.outcome, horizon: 'next', expectedValue: r.expectedValue, riskReduction: r.riskReduction, capabilityIds: r.affectedCapabilityIds, costBand: 'GHS 3–5m', status: 'proposed', progressPercent: 0 })}>
                Create initiative
              </button>
            ) : (
              <p className="gate-message">Approve this recommendation before creating an initiative.</p>
            )}
          </div>
        </Section>
      </>
    )
  }

  if (selected.type === 'decision') {
    const decisions =
      (typeof repo.listDecisions === 'function' && repo.listDecisions()) ||
      usePrototypeStore.getState().workingPack?.decisions ||
      []
    const d = (Array.isArray(decisions) ? decisions : []).find((x) => x.id === selected.id)
    if (!d) return null
    title = d.name || d.id
    subtitle = `Decision · ${d.status}`
    body = (
      <>
        <p>{d.rationale || d.summary || d.description}</p>
        {d.conditions && <p className="sub">Conditions: {d.conditions}</p>}
        <Section title="Workflow">
          <div className="toolbar wrap-actions">
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('approveDecision', { decisionId: d.id })}>Approve</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('approveDecisionWithConditions', { decisionId: d.id, conditions: d.conditions || 'Follow wave-1 constraints' })}>Approve with conditions</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('rejectDecision', { decisionId: d.id })}>Reject</button>
            <button type="button" className="btn secondary-button" onClick={() => callStoreAction('deferDecision', { decisionId: d.id })}>Defer</button>
            {(d.status === 'approved' || d.status === 'approved_with_conditions') && (
              <button type="button" className="btn primary primary-button" onClick={() => callStoreAction('createInitiative', { decisionId: d.id, recommendationIds: d.recommendationId ? [d.recommendationId] : d.recommendationIds || [], name: `${d.name || d.id} — initiative`, description: d.rationale || '', horizon: 'next', expectedValue: '', riskReduction: '', capabilityIds: [], costBand: 'medium', status: 'proposed', progressPercent: 0 })}>
                Create initiative
              </button>
            )}
          </div>
        </Section>
      </>
    )
  }

  if (selected.type === 'initiative') {
    const i = repo.getInitiative(selected.id)
    if (!i) return null
    const row = enrichInitiative(i, {
      capabilities: repo.listCapabilities(),
      objectives: repo.listObjectives(),
    })
    title = i.name
    subtitle = `Initiative · ${row.architectureReadiness} · ${row.horizonLabel}`
    body = (
      <InitiativeDetailPanel
        row={row}
        repo={repo}
        onOpenEntity={open}
        onNavigateRoadmap={() => goView('roadmap')}
        onNavigateGovernance={() => goView('governance')}
        onNavigateFindings={() => goView('findings')}
      />
    )
  }

  return (
    <div className="drawer-root" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="drawer-backdrop" aria-label="Close detail" onClick={clearSelection} />
      <aside className="entity-drawer">
        <header className="drawer-head">
          <div>
            <div className="kicker">{subtitle}</div>
            <h2>{title}</h2>
          </div>
          <button type="button" className="btn secondary-button" onClick={clearSelection}>
            Close
          </button>
        </header>
        <div className="drawer-body">{body}</div>
      </aside>
    </div>
  )
}
