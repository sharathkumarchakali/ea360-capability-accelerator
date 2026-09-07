import { usePrototypeStore } from '../../state/prototypeStore'
import {
  buildP2PCounts,
  classifyTIME,
  explainTIME,
} from '../../domain/metrics/portfolio'
import {
  integrationRiskScore,
  isPointToPoint,
  isReusableApi,
  missingOwner,
} from '../../domain/metrics/integration'
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
    const ctx = { p2pIntegrationCountByApp: buildP2PCounts(repo.listIntegrations()) }
    const time = classifyTIME(a, ctx)
    title = a.name
    subtitle = `Application · TIME ${time} · ${a.lifecycle}`
    const ints = repo.integrationsForApplications([a.id])
    const caps = repo.capabilitiesForApplication(a.id)
    const findings = repo.findingsForApplication(a.id)
    const recs = repo.recommendationsForApplication(a.id)
    const inits = repo.initiativesForApplication(a.id)
    const dataObjs = repo.dataObjectsForApplication(a.id)
    const techs = repo.technologiesForApplication(a.id)
    const upstream = ints.filter((i) => i.targetApplicationId === a.id)
    const downstream = ints.filter((i) => i.sourceApplicationId === a.id)
    body = (
      <>
        <p>{a.description}</p>
        <div className="drawer-metrics">
          <div><span>Business value</span><strong>{a.businessValue}</strong></div>
          <div><span>Technical health</span><strong>{a.technicalHealth}</strong></div>
          <div><span>Criticality</span><strong>{a.criticality}</strong></div>
          <div><span>Cost band</span><strong>{a.annualCostBand}</strong></div>
          <div><span>User reach</span><strong>{a.userReach}</strong></div>
          <div><span>Alignment</span><strong>{a.strategicAlignment}</strong></div>
        </div>
        <p className="sub">
          Business owner {a.businessOwnerId.replace('person-', '')} · Tech owner{' '}
          {a.technologyOwnerId.replace('person-', '')} · {a.deploymentModel} · {a.vendorProduct}
          {a.endOfSupportDate ? ` · EOS ${a.endOfSupportDate}` : ''}
        </p>
        <Section title="TIME classification">
          <p>
            <span className={`time-pill time-${time.toLowerCase()}`}>{time}</span> —{' '}
            {explainTIME(a, time, ctx)}
          </p>
        </Section>
        <Section title="Supported capabilities">
          <div className="chip-row">
            {caps.map((c) => (
              <LinkChip key={c.id} id={c.id} type="capability" label={c.name} onOpen={open} />
            ))}
          </div>
          <button type="button" className="text-link" onClick={() => goView('capabilities')}>
            Open capability intelligence
          </button>
        </Section>
        <Section title="Integrations">
          <div className="chip-row">
            {ints.map((i) => (
              <LinkChip key={i.id} id={i.id} type="integration" label={i.name} onOpen={open} />
            ))}
          </div>
          <button type="button" className="text-link" onClick={() => goView('integrations')}>
            Open integration landscape
          </button>
        </Section>
        <Section title="Upstream / downstream summary">
          <p className="sub">
            Upstream feeds: {upstream.length || 'none'} · Downstream consumers:{' '}
            {downstream.length || 'none'}
          </p>
          <button
            type="button"
            className="btn secondary-button"
            onClick={() => {
              setGraphRoot({ id: a.id, type: 'application' })
              goView('explorer')
            }}
          >
            Open in Relationship Explorer
          </button>
        </Section>
        <Section title="Data objects">
          <ul className="drawer-list">
            {dataObjs.map((d) => (
              <li key={d.id}>{d.name} · {d.classification}</li>
            ))}
          </ul>
        </Section>
        <Section title="Technology components">
          <ul className="drawer-list">
            {techs.map((t) => (
              <li key={t.id}>{t.name} · {t.lifecycle}</li>
            ))}
          </ul>
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
        <Section title="Roadmap initiatives">
          <div className="chip-row">
            {inits.map((i) => (
              <LinkChip key={i.id} id={i.id} type="initiative" label={i.name} onOpen={open} />
            ))}
          </div>
        </Section>
      </>
    )
  }

  if (selected.type === 'integration') {
    const i = repo.getIntegration(selected.id)
    if (!i) return null
    const source = repo.getApplication(i.sourceApplicationId)
    const target = repo.getApplication(i.targetApplicationId)
    const findings = repo.findingsForIntegration(i.id)
    const recs = repo.recommendationsForIntegration(i.id)
    const caps = i.supportedCapabilityIds
      .map((id) => repo.getCapability(id))
      .filter(Boolean)
    const dataObjs = i.dataObjectIds
      .map((id) => repo.listDataObjects().find((d) => d.id === id))
      .filter(Boolean)
    title = i.name
    subtitle = `Integration · ${i.integrationType} · ${i.lifecycleStatus}`
    body = (
      <>
        <p>{i.description}</p>
        <div className="drawer-metrics">
          <div><span>Criticality</span><strong>{i.criticality}</strong></div>
          <div><span>Risk score</span><strong>{integrationRiskScore(i)}</strong></div>
          <div><span>Consumers</span><strong>{i.consumerCount}</strong></div>
          <div><span>Reuse</span><strong>{i.reusabilityStatus}</strong></div>
          <div><span>Monitoring</span><strong>{i.monitoringStatus}</strong></div>
          <div><span>Documentation</span><strong>{i.documentationStatus}</strong></div>
        </div>
        <p className="sub">
          {i.apiOrInterfaceName} · {i.protocol} · {i.dataFormat} · {i.authenticationMethod}
          {isPointToPoint(i) ? ' · Point-to-point' : ''}
          {isReusableApi(i) ? ' · Reusable API' : ''}
          {missingOwner(i) ? ' · Ownership gap' : ''}
        </p>
        <Section title="Source and target applications">
          <div className="chip-row">
            {source && (
              <LinkChip id={source.id} type="application" label={`Source: ${source.name}`} onOpen={open} />
            )}
            {target && (
              <LinkChip id={target.id} type="application" label={`Target: ${target.name}`} onOpen={open} />
            )}
          </div>
        </Section>
        <Section title="Supported capabilities">
          <div className="chip-row">
            {caps.map((c) => (
              <LinkChip key={c.id} id={c.id} type="capability" label={c.name} onOpen={open} />
            ))}
          </div>
        </Section>
        <Section title="Data objects">
          <ul className="drawer-list">
            {dataObjs.map((d) => (
              <li key={d.id}>{d.name} · {d.classification}</li>
            ))}
          </ul>
        </Section>
        <Section title="Ownership">
          <p className="sub">
            Business {i.businessOwnerId.replace('person-', '')} · Technology{' '}
            {i.technologyOwnerId.replace('person-', '')} · Last review {i.lastReviewDate}
          </p>
        </Section>
        <Section title="Findings">
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
        <div className="chip-row" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="btn primary primary-button"
            onClick={() => {
              setGraphRoot({ id: i.id, type: 'integration' })
              goView('explorer')
            }}
          >
            Explore relationships
          </button>
          <button type="button" className="btn secondary-button" onClick={() => goView('integrations')}>
            Open integration landscape
          </button>
        </div>
      </>
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
              if (cap) return <LinkChip key={id} id={id} type="capability" label={cap.name} onOpen={open} />
              if (app) return <LinkChip key={id} id={id} type="application" label={app.name} onOpen={open} />
              if (int) return <LinkChip key={id} id={id} type="integration" label={int.name} onOpen={open} />
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
    title = i.name
    subtitle = `Initiative · ${i.horizon} · ${i.progressPercent}%`
    body = (
      <>
        <p>{i.description}</p>
        <div className="drawer-metrics">
          <div><span>Progress</span><strong>{i.progressPercent}%</strong></div>
          <div><span>Cost band</span><strong>{i.costBand}</strong></div>
          <div><span>Risk reduction</span><strong>{i.riskReduction}</strong></div>
          <div><span>Expected value</span><strong>{i.expectedValue}</strong></div>
        </div>
        <Section title="From recommendations">
          <div className="chip-row">
            {i.recommendationIds.map((id) => {
              const r = repo.getRecommendation(id)
              return r ? <LinkChip key={id} id={id} type="recommendation" label={r.name} onOpen={open} /> : null
            })}
          </div>
        </Section>
        <Section title="Affected capabilities">
          <div className="chip-row">
            {i.capabilityIds.map((id) => {
              const c = repo.getCapability(id)
              return c ? <LinkChip key={id} id={id} type="capability" label={c.name} onOpen={open} /> : null
            })}
          </div>
        </Section>
        <Section title="Roadmap actions">
          <div className="toolbar wrap-actions">
            {['now', 'next', 'later'].filter((h) => h !== i.horizon).map((h) => (
              <button
                key={h}
                type="button"
                className="btn secondary-button"
                onClick={() => callStoreAction('moveInitiativeHorizon', { initiativeId: i.id, horizon: h })}
              >
                Move to {h}
              </button>
            ))}
            <button
              type="button"
              className="btn secondary-button"
              onClick={() => {
                setGraphRoot({ id: i.id, type: 'initiative' })
                goView('explorer')
              }}
            >
              Explore
            </button>
            <button type="button" className="btn secondary-button" onClick={() => goView('roadmap')}>
              Open roadmap
            </button>
          </div>
        </Section>
      </>
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
