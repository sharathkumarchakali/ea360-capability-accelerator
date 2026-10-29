/**
 * Additional deterministic Ask handlers for Q03, Q13–Q19, Q21–Q27, Q30, Q32–Q33
 * and informational approval queries.
 */
import { classifySupportDate, getDemoAsOfDate } from '../../domain/demo/demoClock'
import { analyseImpact } from '../../domain/metrics/graph'
import {
  calculateFindingConfidence,
  coerceFindingWorkflowStatus,
  isInsufficientlyEvidenced,
} from '../../domain/workflow'
import type { AIContext } from './contextBuilder'
import { baseResponse, refsFromIds } from './responseComposer'
import type { EA360AIResponse, EntityReference } from './types'
import { INSUFFICIENT_EVIDENCE_MESSAGE } from './types'

type Draft = Omit<EA360AIResponse, 'grounded' | 'groundingErrors'>

function resolveRef(repo: AIContext['repo'], id: string): EntityReference | null {
  const n = repo.resolveGraphNode(id)
  return n ? { id: n.id, type: n.type, name: n.name } : null
}

function needEntity(ctx: AIContext, types: string[], label: string): Draft | null {
  const pe = ctx.primaryEntity
  if (pe && types.includes(pe.type)) return null
  const match = ctx.matchedEntities.find((m) => types.includes(m.type))
  if (match) return null
  return baseResponse({
    intent: 'insufficient_evidence',
    tenantId: ctx.tenantId,
    summary: `Select a ${label} (or name one in the question) to continue.`,
    explanation: `This question requires a specific ${label} in the active workspace.`,
    confidence: 'low',
    confidenceReason: 'Missing required entity context.',
    facts: [],
    inferences: [],
    suggestedActions: [
      { id: 'pick', label: `Open ${label} portfolio`, action: 'navigate', view: types[0] === 'finding' ? 'findings' : types[0] === 'dataObject' ? 'data-information' : types[0] === 'technology' ? 'technology-infrastructure' : types[0] === 'aiSolution' ? 'ai-automation' : 'executive' },
    ],
    asOfDate: ctx.asOfDate,
  })
}

function entityOfType(ctx: AIContext, types: string[]) {
  if (ctx.primaryEntity && types.includes(ctx.primaryEntity.type)) return ctx.primaryEntity
  return ctx.matchedEntities.find((m) => types.includes(m.type))
}

export function answerExplainFinding(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['finding'], 'finding')
  if (missing) return missing
  const ref = entityOfType(ctx, ['finding'])!
  const f = ctx.repo.getFinding(ref.id)
  if (!f) {
    return baseResponse({
      intent: 'unknown_entity',
      tenantId: ctx.tenantId,
      summary: `Finding “${ref.id}” is not in the active workspace.`,
      explanation: 'Unknown entities are not substituted with another record.',
      confidence: 'high',
      confidenceReason: 'Explicit unknown entity.',
      facts: [],
      inferences: [],
    })
  }
  const evidence = (f.evidenceIds ?? [])
    .map((id) => ctx.repo.getEvidence(id))
    .filter(Boolean)
  const conf = calculateFindingConfidence(f, ctx.pack.evidence)
  const ws = coerceFindingWorkflowStatus(f.workflowStatus ?? f.status)
  return baseResponse({
    intent: 'explain_finding',
    tenantId: ctx.tenantId,
    questionId: 'Q03',
    asOfDate: ctx.asOfDate,
    summary: `${f.name} — ${f.severity} severity, workflow ${ws}, risk score ${f.riskScore ?? 'n/a'}.`,
    explanation: [
      `Problem: ${f.problemStatement || f.description}`,
      `Business impact: ${f.businessImpact}`,
      `Owner: ${f.businessOwnerId || f.ownerId || 'unknown'}`,
      `Evidence confidence (recorded): ${conf}`,
      `Evidence items: ${evidence.length}`,
    ].join('\n'),
    whyItMatters: 'Understanding the finding’s recorded state and evidence is required before any decision.',
    evidenceIds: evidence.map((e) => e!.id),
    entityRefs: [{ id: f.id, type: 'finding', name: f.name }],
    assumptions: ['Risk score uses recorded likelihood × impact when present.'],
    confidence: evidence.length ? 'high' : 'low',
    confidenceReason: evidence.length
      ? 'Finding fields and linked evidence present in workspace.'
      : 'Finding has no linked evidence in this workspace.',
    facts: [
      `severity=${f.severity}`,
      `workflowStatus=${ws}`,
      `riskScore=${f.riskScore ?? 'unknown'}`,
      `evidenceCount=${evidence.length}`,
    ],
    inferences: [],
    claims: [
      { text: `Severity is recorded as ${f.severity}`, kind: 'recorded', sourceIds: [f.id] },
      { text: `Workflow status is ${ws}`, kind: 'recorded', sourceIds: [f.id] },
    ],
    suggestedActions: [
      { id: 'ev', label: 'Open evidence', action: 'navigate', view: 'evidence' },
      {
        id: 'open',
        label: 'Open finding',
        action: 'select-entity',
        entityId: f.id,
        entityType: 'finding',
      },
    ],
  })
}

export function answerEvidenceForFinding(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['finding'], 'finding')
  if (missing) return missing
  const ref = entityOfType(ctx, ['finding'])!
  const f = ctx.repo.getFinding(ref.id)!
  const evidence = (f.evidenceIds ?? [])
    .map((id) => ctx.repo.getEvidence(id))
    .filter(Boolean)
  if (!evidence.length) {
    return baseResponse({
      intent: 'insufficient_evidence',
      tenantId: ctx.tenantId,
      questionId: 'Q13',
      asOfDate: ctx.asOfDate,
      summary: INSUFFICIENT_EVIDENCE_MESSAGE,
      explanation: `Finding “${f.name}” has an empty evidence list in this workspace. No unrelated evidence is substituted.`,
      whyItMatters: 'Recommendations must not be grounded on unrelated citations.',
      confidence: 'low',
      confidenceReason: 'No linked evidence.',
      entityRefs: [{ id: f.id, type: 'finding', name: f.name }],
      facts: ['evidenceCount=0'],
      inferences: [],
      suggestedActions: [
        { id: 'gaps', label: 'Review evidence gaps', action: 'navigate', view: 'evidence' },
      ],
    })
  }
  return baseResponse({
    intent: 'evidence_for_finding',
    tenantId: ctx.tenantId,
    questionId: 'Q13',
    asOfDate: ctx.asOfDate,
    summary: `${evidence.length} linked evidence item(s) support “${f.name}”.`,
    explanation: evidence
      .map(
        (e) =>
          `${e!.name}: ${e!.verificationStatus ?? 'unverified'}, freshness ${e!.freshness ?? 'unknown'}, captured ${e!.capturedDate ?? 'unknown'}`,
      )
      .join('\n'),
    whyItMatters: 'Only linked evidence may substantiate this risk.',
    evidenceIds: evidence.map((e) => e!.id),
    entityRefs: [
      { id: f.id, type: 'finding', name: f.name },
      ...evidence.map((e) => ({ id: e!.id, type: 'evidence', name: e!.name })),
    ],
    assumptions: [],
    confidence: 'high',
    confidenceReason: 'Evidence list taken from finding.evidenceIds.',
    facts: evidence.map((e) => `${e!.id}:${e!.verificationStatus}`),
    inferences: [],
    suggestedActions: evidence.slice(0, 3).map((e) => ({
      id: e!.id,
      label: `Open ${e!.name}`,
      action: 'select-entity',
      entityId: e!.id,
      entityType: 'evidence',
      view: 'evidence',
    })),
  })
}

export function answerRecommendationOptions(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['recommendation'], 'recommendation')
  if (missing) return missing
  const ref = entityOfType(ctx, ['recommendation'])!
  const r = ctx.repo.getRecommendation(ref.id)
  if (!r) {
    return baseResponse({
      intent: 'unknown_entity',
      tenantId: ctx.tenantId,
      summary: 'Recommendation not found in active workspace.',
      explanation: '',
      confidence: 'high',
      confidenceReason: 'Unknown entity.',
      facts: [],
      inferences: [],
    })
  }
  const options = r.optionsConsidered ?? []
  return baseResponse({
    intent: 'recommendation_options',
    tenantId: ctx.tenantId,
    questionId: 'Q14',
    asOfDate: ctx.asOfDate,
    summary: `Recommendation “${r.name}” records ${options.length} option(s); preferred: ${r.preferredOption || 'not recorded'}.`,
    explanation: [
      ...options.map((o, i) => `Option ${i + 1}: ${o}`),
      `Preferred: ${r.preferredOption || 'not recorded'}`,
      `Rationale / outcome: ${r.intendedOutcome || r.outcome || 'not recorded'}`,
      `Dependencies: ${(r.dependencies ?? []).join('; ') || 'none recorded'}`,
    ].join('\n'),
    whyItMatters: 'Options are recorded proposals for human ARB review — not automatic decisions.',
    evidenceIds: r.evidenceIds ?? [],
    entityRefs: [{ id: r.id, type: 'recommendation', name: r.name }],
    assumptions: options.length ? [] : ['No optionsConsidered array on this recommendation.'],
    confidence: options.length ? 'high' : 'medium',
    confidenceReason: 'Drawn from recommendation record fields.',
    facts: [`preferred=${r.preferredOption || 'unknown'}`, `options=${options.length}`],
    inferences: [],
    claims: options.map((o) => ({
      text: o,
      kind: 'recorded' as const,
      sourceIds: [r.id],
    })),
    suggestedActions: [
      {
        id: 'open',
        label: 'Open recommendation',
        action: 'select-entity',
        entityId: r.id,
        entityType: 'recommendation',
        view: 'recommendations',
      },
      { id: 'gov', label: 'Open Review Board', action: 'navigate', view: 'reviews' },
    ],
  })
}

export function answerInitiativeKpiSummary(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['initiative'], 'initiative')
  if (missing) return missing
  const ref = entityOfType(ctx, ['initiative'])!
  const init = ctx.repo.getInitiative(ref.id)
  if (!init) {
    return baseResponse({
      intent: 'unknown_entity',
      tenantId: ctx.tenantId,
      summary: 'Initiative not found.',
      explanation: '',
      confidence: 'high',
      confidenceReason: 'Unknown entity.',
      facts: [],
      inferences: [],
    })
  }
  const kpis = (init.kpiIds ?? [])
    .map((id) => ctx.pack.kpis.find((k) => k.id === id))
    .filter(Boolean)
  const decision = init.decisionId
    ? (ctx.pack.decisions ?? []).find((d) => d.id === init.decisionId)
    : undefined
  return baseResponse({
    intent: 'initiative_kpi_summary',
    tenantId: ctx.tenantId,
    questionId: 'Q15',
    asOfDate: ctx.asOfDate,
    summary: `Initiative “${init.name}” — owner ${init.ownerId}, horizon ${init.horizon}, progress ${init.progressPercent}%.`,
    explanation: [
      `Objectives: ${(init.objectiveIds ?? []).join(', ') || 'none'}`,
      `Decision: ${decision ? `${decision.name} (${decision.decisionStatus})` : 'none linked'}`,
      `Conditions: ${(decision?.conditions ?? []).join('; ') || 'none recorded'}`,
      `Dependencies: ${(init.dependsOnInitiativeIds ?? []).join(', ') || 'none'}`,
      ...kpis.map(
        (k) =>
          `KPI ${k!.name}: baseline ${k!.baselineValue ?? 'n/a'} / current ${k!.currentValue} / target ${k!.targetValue} ${k!.unit}`,
      ),
    ].join('\n'),
    whyItMatters: 'Delivery ownership and KPI targets are recorded commitments, not measured outcomes of viewing this screen.',
    evidenceIds: [],
    entityRefs: [
      { id: init.id, type: 'initiative', name: init.name },
      ...kpis.map((k) => ({ id: k!.id, type: 'kpi', name: k!.name })),
    ],
    assumptions: ['KPI current values are seed/demo measurements, not live telemetry.'],
    confidence: 'high',
    confidenceReason: 'Initiative and linked KPI fields from workspace.',
    facts: kpis.map(
      (k) => `${k!.id}:${k!.baselineValue}/${k!.currentValue}/${k!.targetValue}`,
    ),
    inferences: [],
    suggestedActions: [
      { id: 'roadmap', label: 'Open Roadmap', action: 'navigate', view: 'roadmap' },
      { id: 'kpis', label: 'Open KPIs', action: 'navigate', view: 'kpis' },
    ],
  })
}

export function answerDataGovernanceGaps(ctx: AIContext): Draft {
  const critical = ctx.pack.dataObjects.filter((d) => {
    const crit = (d as { criticality?: string }).criticality
    const sens = (d as { classification?: string }).classification
    return (
      crit === 'critical' ||
      crit === 'high' ||
      /personal|restricted|confidential/i.test(sens || '') ||
      d.tags?.includes('critical')
    )
  })
  const gaps = critical.filter((d) => {
    const owner = d.ownerId
    const quality = (d as { qualityScore?: number }).qualityScore
    const sot = (d as { sourceOfTruth?: string }).sourceOfTruth
    return !owner || quality == null || quality < 3 || !sot || /multiple|unknown/i.test(sot)
  })
  return baseResponse({
    intent: 'data_governance_gaps',
    tenantId: ctx.tenantId,
    questionId: 'Q16',
    asOfDate: ctx.asOfDate,
    summary: `${gaps.length} of ${critical.length} critical/sensitive data domain(s) show ownership, quality or source-of-truth gaps.`,
    explanation: gaps
      .slice(0, 8)
      .map((d) => {
        const sot = (d as { sourceOfTruth?: string }).sourceOfTruth || 'unknown'
        const q = (d as { qualityScore?: number }).qualityScore
        return `${d.name}: SoT=${sot}, quality=${q ?? 'unknown'}, owner=${d.ownerId || 'missing'}`
      })
      .join('\n'),
    whyItMatters: 'Gaps in stewardship and source of truth constrain safe sharing and AI use.',
    evidenceIds: [],
    entityRefs: gaps.slice(0, 10).map((d) => ({ id: d.id, type: 'dataObject', name: d.name })),
    assumptions: ['Criticality inferred from recorded criticality/classification/tags.'],
    confidence: 'medium',
    confidenceReason: 'Derived from data-object metadata fields.',
    facts: [`critical=${critical.length}`, `gaps=${gaps.length}`],
    inferences: [],
    suggestedActions: [
      { id: 'data', label: 'Open Data portfolio', action: 'navigate', view: 'data-information' },
      { id: 'gov', label: 'Open AI & Data Governance', action: 'navigate', view: 'ai-data-governance' },
    ],
  })
}

export function answerDataLineage(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['dataObject'], 'data domain')
  if (missing) return missing
  const ref = entityOfType(ctx, ['dataObject'])!
  const d = ctx.repo.getDataObject(ref.id)!
  const sot = (d as { sourceOfTruth?: string }).sourceOfTruth || 'unknown'
  const sources = (d as { sourceApplicationIds?: string[] }).sourceApplicationIds ?? []
  const consumers = (d as { consumerApplicationIds?: string[] }).consumerApplicationIds ?? []
  const rels = ctx.pack.relationships.filter(
    (r) => r.sourceId === d.id || r.targetId === d.id,
  )
  return baseResponse({
    intent: 'data_lineage',
    tenantId: ctx.tenantId,
    questionId: 'Q17',
    asOfDate: ctx.asOfDate,
    summary: `“${d.name}” source-of-truth status: ${sot}. ${sources.length} source app(s), ${consumers.length} consumer app(s), ${rels.length} registered relationship(s).`,
    explanation: [
      `Source of truth: ${sot}`,
      `Source apps: ${sources.join(', ') || 'none recorded'}`,
      `Consumers: ${consumers.join(', ') || 'none recorded'}`,
      `Relationship links: ${rels.length} (declared in pack relationships)`,
    ].join('\n'),
    whyItMatters: 'Lineage gaps must be shown as gaps — orphaned links are not authoritative flows.',
    evidenceIds: [],
    entityRefs: [
      { id: d.id, type: 'dataObject', name: d.name },
      ...refsFromIds([...sources, ...consumers], (id) => resolveRef(ctx.repo, id)),
    ],
    assumptions: ['Consumer/source arrays are metadata; graph edges may add further paths.'],
    confidence: 'medium',
    confidenceReason: 'Based on recorded data-object fields and relationships.',
    facts: [`sot=${sot}`, `sources=${sources.length}`, `consumers=${consumers.length}`],
    inferences: [],
    suggestedActions: [
      {
        id: 'graph',
        label: 'Open lineage graph',
        action: 'explore',
        entityId: d.id,
        entityType: 'dataObject',
      },
      {
        id: 'open',
        label: 'Open data record',
        action: 'select-entity',
        entityId: d.id,
        entityType: 'dataObject',
        view: 'data-information',
      },
    ],
  })
}

export function answerDataAiReadiness(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['dataObject'], 'data domain')
  if (missing) return missing
  const ref = entityOfType(ctx, ['dataObject'])!
  const d = ctx.repo.getDataObject(ref.id)!
  const readiness = (d as { aiReadiness?: string }).aiReadiness || 'unknown'
  const classification = (d as { classification?: string }).classification || 'unknown'
  const quality = (d as { qualityScore?: number }).qualityScore
  const sot = (d as { sourceOfTruth?: string }).sourceOfTruth || 'unknown'
  const reasons: string[] = []
  if (/conditional|not.?ready|unknown/i.test(readiness)) reasons.push(`Recorded AI readiness: ${readiness}`)
  if (/personal|restricted/i.test(classification)) reasons.push(`Sensitivity: ${classification}`)
  if (quality != null && quality < 3) reasons.push(`Quality score ${quality} below preferred threshold`)
  if (/multiple|unknown/i.test(sot)) reasons.push(`Source-of-truth: ${sot}`)
  return baseResponse({
    intent: 'data_ai_readiness',
    tenantId: ctx.tenantId,
    questionId: 'Q18',
    asOfDate: ctx.asOfDate,
    summary: `“${d.name}” AI readiness is recorded as ${readiness}. This is not a regulatory approval.`,
    explanation: [
      `Classification: ${classification}`,
      `Quality: ${quality ?? 'unknown'}`,
      `Source of truth: ${sot}`,
      reasons.length ? `Constraints: ${reasons.join('; ')}` : 'No blocking constraints recorded beyond readiness flag.',
    ].join('\n'),
    whyItMatters: 'Conditional readiness requires human governance before AI exposure.',
    evidenceIds: [],
    entityRefs: [{ id: d.id, type: 'dataObject', name: d.name }],
    assumptions: ['Readiness is seed metadata, not a legal determination.'],
    confidence: 'medium',
    confidenceReason: 'Based on recorded data-object readiness fields.',
    facts: [`aiReadiness=${readiness}`, `classification=${classification}`],
    inferences: reasons.map((r) => r),
    suggestedActions: [
      { id: 'gov', label: 'Open Data Governance', action: 'navigate', view: 'ai-data-governance' },
      {
        id: 'open',
        label: 'Open data record',
        action: 'select-entity',
        entityId: d.id,
        entityType: 'dataObject',
      },
    ],
  })
}

export function answerDataControlsMissing(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['dataObject'], 'data domain')
  if (missing) return missing
  const ref = entityOfType(ctx, ['dataObject'])!
  const d = ctx.repo.getDataObject(ref.id)!
  const gov = ctx.pack.aiDataGovernance as
    | {
        policies?: Array<{ id: string; name: string; relatedObjectIds?: string[] }>
        standards?: Array<{ id: string; name: string }>
        approvals?: Array<{ id: string; name: string; status?: string; relatedObjectIds?: string[] }>
        exceptions?: Array<{ id: string; name: string; relatedObjectIds?: string[] }>
      }
    | undefined
  const policies = (gov?.policies ?? []).filter(
    (p) =>
      (p.relatedObjectIds ?? []).includes(d.id) ||
      /data|privacy|personal/i.test(p.name) ||
      /POL-DATA/i.test(p.id),
  )
  const approvals = (gov?.approvals ?? []).filter((a) =>
    (a.relatedObjectIds ?? []).includes(d.id),
  )
  return baseResponse({
    intent: 'data_controls_missing',
    tenantId: ctx.tenantId,
    questionId: 'Q19',
    asOfDate: ctx.asOfDate,
    summary:
      approvals.length === 0
        ? `No recorded data-specific approval/exception tied to “${d.name}”. ${policies.length} related polic(ies)/standard(s) found in catalogue.`
        : `${approvals.length} approval/exception record(s) relate to “${d.name}”.`,
    explanation: [
      ...policies.slice(0, 5).map((p) => `Policy/standard: ${p.name} (${p.id})`),
      ...approvals.map((a) => `Approval: ${a.name} — ${a.status || 'unknown'}`),
      approvals.length === 0 ? 'Explicitly: no pending/conditional approval is recorded for this object.' : '',
    ]
      .filter(Boolean)
      .join('\n'),
    whyItMatters: 'Missing reviews must be stated clearly — absence is not clearance.',
    evidenceIds: [],
    entityRefs: [
      { id: d.id, type: 'dataObject', name: d.name },
      ...policies.slice(0, 5).map((p) => ({ id: p.id, type: 'policy', name: p.name })),
    ],
    assumptions: ['Catalogue linkage may be by naming convention when relatedObjectIds are sparse.'],
    confidence: 'medium',
    confidenceReason: 'Catalogue scan within active workspace only.',
    facts: [`policies=${policies.length}`, `approvals=${approvals.length}`],
    inferences: [],
    suggestedActions: [
      { id: 'gov', label: 'Open Policies', action: 'navigate', view: 'ai-data-governance' },
      { id: 'std', label: 'Open Standards', action: 'navigate', view: 'standards' },
    ],
  })
}

export function answerTechnologyDependents(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['technology'], 'technology')
  if (missing) return missing
  const ref = entityOfType(ctx, ['technology'])!
  const result = analyseImpact({
    rootId: ref.id,
    relationships: ctx.pack.relationships,
    resolveEntity: (id) => ctx.repo.resolveGraphNode(id),
    direction: 'both',
    maxDepth: 3,
  })
  const hits = result.hits.slice(0, 12)
  return baseResponse({
    intent: 'technology_dependents',
    tenantId: ctx.tenantId,
    questionId: 'Q21',
    asOfDate: ctx.asOfDate,
    summary: `${result.hits.length} dependent object(s) reachable from “${ref.name}” (${result.affectedApplications} application(s), ${result.affectedCapabilities} capability(ies)).`,
    explanation: hits
      .map((h) => `${h.name} (${h.type}, path ${h.path.length})`)
      .join('; '),
    whyItMatters: 'Business services on obsolete technology inherit support and resilience exposure.',
    evidenceIds: [],
    entityRefs: [
      ref,
      ...hits.map((h) => ({
        id: h.id,
        type: h.type,
        name: h.name,
      })),
    ],
    assumptions: ['Impact uses directed dependency edges only; administrative links excluded.'],
    confidence: 'medium',
    confidenceReason: 'Graph traversal over registered relationships.',
    facts: [
      `affected=${result.hits.length}`,
      `apps=${result.affectedApplications}`,
      `caps=${result.affectedCapabilities}`,
    ],
    inferences: [],
    suggestedActions: [
      {
        id: 'graph',
        label: 'Open impact graph',
        action: 'explore',
        entityId: ref.id,
        entityType: 'technology',
      },
    ],
  })
}

export function answerTechnologyPriority(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['technology'], 'technology')
  if (missing) return missing
  const ref = entityOfType(ctx, ['technology'])!
  const t = ctx.repo.getTechnology(ref.id)!
  const supportEnd =
    (t as { supportEndDate?: string }).supportEndDate ||
    (t as { endOfSupportDate?: string }).endOfSupportDate
  const horizon = classifySupportDate(supportEnd, ctx.asOfDate)
  const apps = ctx.pack.relationships
    .filter((r) => r.targetId === t.id || r.sourceId === t.id)
    .map((r) => (r.sourceId === t.id ? r.targetId : r.sourceId))
  return baseResponse({
    intent: 'technology_priority',
    tenantId: ctx.tenantId,
    questionId: 'Q22',
    asOfDate: ctx.asOfDate,
    summary: `Prioritise “${t.name}” because support horizon is ${horizon} (support end ${supportEnd || 'unknown'}) and ${apps.length} linked asset(s) depend on it.`,
    explanation: [
      `Lifecycle: ${t.lifecycle}`,
      `Support end: ${supportEnd || 'unknown'} (${horizon})`,
      `As-of: ${ctx.asOfDate}`,
      `Linked assets: ${apps.slice(0, 8).join(', ') || 'none recorded'}`,
      'Proposed priority is inferred from exposure — distinct from any recorded finding severity.',
    ].join('\n'),
    whyItMatters: 'Obsolete technology under critical services elevates operational risk.',
    evidenceIds: [],
    entityRefs: [ref, ...refsFromIds(apps.slice(0, 8), (id) => resolveRef(ctx.repo, id))],
    assumptions: ['Support dates are seed metadata, not independently verified vendor notices.'],
    confidence: supportEnd ? 'high' : 'medium',
    confidenceReason: 'Normalized support fields + relationship count.',
    facts: [`horizon=${horizon}`, `lifecycle=${t.lifecycle}`, `links=${apps.length}`],
    inferences: ['Priority proposal — not an ARB decision.'],
    suggestedActions: [
      {
        id: 'open',
        label: 'Open technology',
        action: 'select-entity',
        entityId: t.id,
        entityType: 'technology',
        view: 'technology-infrastructure',
      },
    ],
  })
}

export function answerTechnologyCtoSummary(ctx: AIContext): Draft {
  const base = answerTechnologyPriority(ctx)
  if (base.intent !== 'technology_priority') return base
  return {
    ...base,
    intent: 'technology_cto_summary',
    questionId: 'Q23',
    summary: `CTO briefing: ${base.summary}`,
    whyItMatters: 'Concise exposure for technology leadership — containment remains a human decision.',
    suggestedActions: [
      ...(base.suggestedActions || []),
      { id: 'findings', label: 'Open linked findings', action: 'navigate', view: 'findings' },
      { id: 'roadmap', label: 'Open roadmap', action: 'navigate', view: 'roadmap' },
    ],
  }
}

export function answerAiGovernanceAttention(ctx: AIContext): Draft {
  const solutions = ctx.repo.listAiSolutions?.() ?? ctx.pack.aiSolutions ?? []
  const ranked = solutions
    .map((s) => {
      const risk = (s as { riskLevel?: string }).riskLevel || ''
      const autonomy = (s as { autonomyLevel?: string }).autonomyLevel || ''
      const oversight = (s as { humanOversight?: string }).humanOversight || ''
      const perms = (s as { permissions?: unknown[] }).permissions ?? []
      let score = 0
      if (/high|critical/i.test(risk)) score += 3
      if (/autonomous|high/i.test(autonomy)) score += 2
      if (!oversight || /partial|none|missing/i.test(oversight)) score += 2
      if (Array.isArray(perms) && perms.length > 2) score += 1
      return { s, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
  return baseResponse({
    intent: 'ai_governance_attention',
    tenantId: ctx.tenantId,
    questionId: 'Q24',
    asOfDate: ctx.asOfDate,
    summary: `${ranked.length} AI use case(s) show elevated governance attention signals (risk, autonomy, oversight or permissions).`,
    explanation: ranked
      .slice(0, 8)
      .map(({ s, score }) => `${s.name} (attention score ${score})`)
      .join('\n'),
    whyItMatters: 'High-autonomy or weakly governed agents need human review before production expansion.',
    evidenceIds: [],
    entityRefs: ranked.slice(0, 8).map(({ s }) => ({ id: s.id, type: 'aiSolution', name: s.name })),
    assumptions: ['Attention score is a prototype heuristic over recorded metadata.'],
    confidence: 'medium',
    confidenceReason: 'Derived from AI solution metadata in workspace.',
    facts: [`candidates=${ranked.length}`],
    inferences: [],
    suggestedActions: [
      { id: 'ai', label: 'Open AI portfolio', action: 'navigate', view: 'ai-automation' },
      { id: 'gov', label: 'Open AI Governance', action: 'navigate', view: 'ai-data-governance' },
    ],
  })
}

export function answerAiAgentExplain(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['aiSolution'], 'AI agent/solution')
  if (missing) return missing
  const ref = entityOfType(ctx, ['aiSolution'])!
  const s = ctx.repo.getAiSolution?.(ref.id) || (ctx.pack.aiSolutions ?? []).find((x) => x.id === ref.id)
  if (!s) {
    return baseResponse({
      intent: 'unknown_entity',
      tenantId: ctx.tenantId,
      summary: 'AI solution not found in active workspace.',
      explanation: '',
      confidence: 'high',
      confidenceReason: 'Unknown entity.',
      facts: [],
      inferences: [],
    })
  }
  return baseResponse({
    intent: 'ai_agent_explain',
    tenantId: ctx.tenantId,
    questionId: 'Q25',
    asOfDate: ctx.asOfDate,
    summary: `${s.name}: ${(s as { businessPurpose?: string }).businessPurpose || s.description}`,
    explanation: [
      `Autonomy: ${(s as { autonomyLevel?: string }).autonomyLevel || 'unknown'}`,
      `Risk: ${(s as { riskLevel?: string }).riskLevel || 'unknown'}`,
      `Owner: ${s.ownerId || 'unknown'}`,
      `Human oversight: ${(s as { humanOversight?: string }).humanOversight || 'unknown'}`,
      `Models: ${((s as { modelIds?: string[] }).modelIds ?? []).join(', ') || 'none recorded'}`,
    ].join('\n'),
    whyItMatters: 'Agent purpose and oversight must be clear before expanding permissions.',
    evidenceIds: [],
    entityRefs: [{ id: s.id, type: 'aiSolution', name: s.name }],
    assumptions: ['Described permissions are not executed by this prototype.'],
    confidence: 'high',
    confidenceReason: 'Fields from AI solution record.',
    facts: [`risk=${(s as { riskLevel?: string }).riskLevel}`, `autonomy=${(s as { autonomyLevel?: string }).autonomyLevel}`],
    inferences: [],
    suggestedActions: [
      {
        id: 'open',
        label: 'Open agent',
        action: 'select-entity',
        entityId: s.id,
        entityType: 'aiSolution',
        view: 'ai-automation',
      },
    ],
  })
}

export function answerAiAgentPermissions(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['aiSolution'], 'AI agent/solution')
  if (missing) return missing
  const ref = entityOfType(ctx, ['aiSolution'])!
  const s =
    ctx.repo.getAiSolution?.(ref.id) || (ctx.pack.aiSolutions ?? []).find((x) => x.id === ref.id)!
  // Schema: toolPermissions = [{ integrationId, permission }]; guardrails = { <control>: Defined | Partial | Missing | Not Assessed }.
  const toolPermissions =
    (s as { toolPermissions?: Array<{ integrationId: string; permission: string }> }).toolPermissions ?? []
  const perms = toolPermissions.map((p) => ({
    access: p.permission,
    resource: (ctx.pack.integrations ?? []).find((i) => i.id === p.integrationId)?.name ?? p.integrationId,
  }))
  const guardrailMap = ((s as { guardrails?: Record<string, string> }).guardrails ?? {}) as Record<string, string>
  const guardrailEntries = Object.entries(guardrailMap)
  const defined = guardrailEntries.filter(([, status]) => status === 'Defined')
  const missingControls = guardrailEntries.filter(([, status]) => status !== 'Defined')
  const writeCount = perms.filter((p) => /WRITE|EXECUTE|ADMIN/i.test(String(p.access))).length
  return baseResponse({
    intent: 'ai_agent_permissions',
    tenantId: ctx.tenantId,
    questionId: 'Q26',
    asOfDate: ctx.asOfDate,
    summary: `“${s.name}” has ${perms.length} recorded tool permission(s) (${writeCount} WRITE/EXECUTE) and ${defined.length} of ${guardrailEntries.length} guardrail control(s) defined; ${missingControls.length} missing or partial. Declared permissions are metadata only — not executed here.`,
    explanation: [
      ...perms.map((p) => `${p.access} → ${p.resource}`),
      missingControls.length
        ? `Controls missing or partial: ${missingControls.map(([k, v]) => `${k} (${v})`).join('; ')}`
        : guardrailEntries.length
          ? 'All recorded guardrail controls are defined.'
          : 'No guardrail assessment is recorded for this agent.',
    ].join('\n'),
    whyItMatters: 'Least privilege and human checkpoints must be reviewed before production scope expands.',
    evidenceIds: [],
    entityRefs: [{ id: s.id, type: 'aiSolution', name: s.name }],
    assumptions: ['Permission rows are catalogue metadata, not runtime telemetry.'],
    confidence: perms.length && guardrailEntries.length ? 'high' : 'medium',
    confidenceReason: 'Tool permissions and guardrail statuses from the AI solution record.',
    facts: [
      `permissions=${perms.length}`,
      `writeOrExecute=${writeCount}`,
      `guardrailsDefined=${defined.length}`,
      `guardrailsMissingOrPartial=${missingControls.length}`,
    ],
    inferences: [],
    suggestedActions: [
      { id: 'gov', label: 'Open AI Governance', action: 'navigate', view: 'ai-data-governance' },
      { id: 'findings', label: 'Open related findings', action: 'navigate', view: 'findings' },
    ],
  })
}

export function answerAiModelDependencies(ctx: AIContext): Draft {
  const model = entityOfType(ctx, ['aiModel'])
  const agent = entityOfType(ctx, ['aiSolution'])
  if (!model && !agent) {
    return needEntity(ctx, ['aiModel', 'aiSolution'], 'AI model or agent')!
  }
  if (model) {
    const dependents = (ctx.pack.aiSolutions ?? []).filter((s) =>
      ((s as { modelIds?: string[] }).modelIds ?? []).includes(model.id),
    )
    return baseResponse({
      intent: 'ai_model_dependencies',
      tenantId: ctx.tenantId,
      questionId: 'Q27',
      asOfDate: ctx.asOfDate,
      summary: `${dependents.length} AI solution(s) depend on model “${model.name}”.`,
      explanation: dependents.map((s) => s.name).join('; ') || 'No dependents recorded.',
      whyItMatters: 'Model concentration creates correlated failure and governance exposure.',
      evidenceIds: [],
      entityRefs: [
        model,
        ...dependents.map((s) => ({ id: s.id, type: 'aiSolution', name: s.name })),
      ],
      assumptions: [],
      confidence: 'high',
      confidenceReason: 'modelIds linkage on AI solutions.',
      facts: [`dependents=${dependents.length}`],
      inferences: [],
      suggestedActions: [
        {
          id: 'graph',
          label: 'Open model graph',
          action: 'explore',
          entityId: model.id,
          entityType: 'aiModel',
        },
      ],
    })
  }
  const s =
    ctx.repo.getAiSolution?.(agent!.id) ||
    (ctx.pack.aiSolutions ?? []).find((x) => x.id === agent!.id)!
  const modelIds = (s as { modelIds?: string[] }).modelIds ?? []
  const dataIds = (s as { dataDomainIds?: string[] }).dataDomainIds ?? []
  return baseResponse({
    intent: 'ai_model_dependencies',
    tenantId: ctx.tenantId,
    questionId: 'Q27',
    asOfDate: ctx.asOfDate,
    summary: `Agent “${s.name}” depends on ${modelIds.length} model(s) and ${dataIds.length} data domain(s).`,
    explanation: [
      `Models: ${modelIds.join(', ') || 'none'}`,
      `Data: ${dataIds.join(', ') || 'none'}`,
    ].join('\n'),
    whyItMatters: 'Agent blast radius includes model and data dependencies.',
    evidenceIds: [],
    entityRefs: [
      { id: s.id, type: 'aiSolution', name: s.name },
      ...refsFromIds([...modelIds, ...dataIds], (id) => resolveRef(ctx.repo, id)),
    ],
    assumptions: [],
    confidence: 'high',
    confidenceReason: 'Declared dependency metadata on agent.',
    facts: [`models=${modelIds.length}`, `data=${dataIds.length}`],
    inferences: [],
    suggestedActions: [
      {
        id: 'graph',
        label: 'Open agent graph',
        action: 'explore',
        entityId: s.id,
        entityType: 'aiSolution',
      },
    ],
  })
}

export function answerAiAgentKpi(ctx: AIContext): Draft {
  const missing = needEntity(ctx, ['aiSolution'], 'AI agent/solution')
  if (missing) return missing
  const ref = entityOfType(ctx, ['aiSolution'])!
  const s =
    ctx.repo.getAiSolution?.(ref.id) || (ctx.pack.aiSolutions ?? []).find((x) => x.id === ref.id)!
  // Schema: the outcome KPI is a single `outcomeKpiId`; `kpiIds` is accepted for packs that list several.
  const kpiIds = [...new Set([...((s as { kpiIds?: string[] }).kpiIds ?? []), (s as { outcomeKpiId?: string }).outcomeKpiId ?? ''].filter(Boolean))]
  const kpis = kpiIds.map((id) => ctx.pack.kpis.find((k) => k.id === id)).filter(Boolean)
  // Do not borrow unrelated copilot KPIs
  if (!kpis.length) {
    return baseResponse({
      intent: 'ai_agent_kpi',
      tenantId: ctx.tenantId,
      questionId: 'Q30',
      asOfDate: ctx.asOfDate,
      summary: `No agent-specific KPI is linked to “${s.name}”. Propose a control metric with owner and baseline before claiming measured improvement.`,
      explanation:
        'Do not reuse unrelated copilot handling-time KPIs for agent-control measurement.',
      whyItMatters: 'Measurement must match the governed control objective.',
      confidence: 'medium',
      confidenceReason: 'No kpiIds on this AI solution.',
      entityRefs: [{ id: s.id, type: 'aiSolution', name: s.name }],
      facts: ['linkedKpis=0'],
      inferences: [
        'Proposed metric: permission/guardrail exception rate with nominated measurement owner.',
      ],
      assumptions: ['Proposal only — not a recorded KPI.'],
      suggestedActions: [
        { id: 'kpis', label: 'Open KPIs', action: 'navigate', view: 'kpis' },
      ],
    })
  }
  return baseResponse({
    intent: 'ai_agent_kpi',
    tenantId: ctx.tenantId,
    questionId: 'Q30',
    asOfDate: ctx.asOfDate,
    summary: `${kpis.length} KPI(s) linked to “${s.name}”.`,
    explanation: kpis
      .map(
        (k) =>
          `${k!.name}: baseline ${k!.baselineValue ?? 'n/a'} / current ${k!.currentValue} / target ${k!.targetValue} ${k!.unit}`,
      )
      .join('\n'),
    whyItMatters: 'Linked KPIs are the only measured outcomes attributable to this agent in the workspace.',
    evidenceIds: [],
    entityRefs: [
      { id: s.id, type: 'aiSolution', name: s.name },
      ...kpis.map((k) => ({ id: k!.id, type: 'kpi', name: k!.name })),
    ],
    assumptions: ['Values are synthetic demo measurements.'],
    confidence: 'high',
    confidenceReason: 'kpiIds on AI solution resolve in workspace.',
    facts: kpis.map((k) => `${k!.id}:${k!.currentValue}`),
    inferences: [],
    suggestedActions: [{ id: 'kpis', label: 'Open KPIs', action: 'navigate', view: 'kpis' }],
  })
}

export function answerImportValidation(ctx: AIContext): Draft {
  const result = ctx.importValidation
  if (!result) {
    return baseResponse({
      intent: 'import_validation',
      tenantId: ctx.tenantId,
      questionId: 'Q32',
      asOfDate: ctx.asOfDate,
      summary: 'No staged import validation result is available in the current onboarding draft.',
      explanation:
        'Open Data Ingestion, upload a sample, and re-ask after validation runs. Uncommitted customer IDs are not treated as active tenants.',
      confidence: 'high',
      confidenceReason: 'No staged validation context on request.',
      facts: [],
      inferences: [],
      suggestedActions: [
        { id: 'ingest', label: 'Open Data Ingestion', action: 'navigate', view: 'data-ingestion' },
      ],
    })
  }
  return baseResponse({
    intent: 'import_validation',
    tenantId: ctx.tenantId,
    questionId: 'Q32',
    asOfDate: ctx.asOfDate,
    summary: `Import draft ${result.draftId}: ${result.errors.length} blocking issue(s); valid=${result.validCount ?? 'n/a'}, warnings=${result.warningCount ?? 'n/a'}.`,
    explanation: result.errors
      .slice(0, 12)
      .map(
        (e) =>
          `Row ${e.row ?? '?'} field ${e.field ?? '?'}: ${e.message} (${e.severity || 'error'})`,
      )
      .join('\n'),
    whyItMatters: 'Broken references must be corrected before commit — partial import is not allowed.',
    confidence: 'high',
    confidenceReason: 'Grounded in staged validation result only.',
    facts: result.errors.slice(0, 8).map((e) => e.message),
    inferences: [],
    assumptions: [],
    entityRefs: [],
    evidenceIds: [],
    suggestedActions: [
      { id: 'ingest', label: 'Open validation errors', action: 'navigate', view: 'data-ingestion' },
    ],
  })
}

export function answerWorkspaceReadiness(ctx: AIContext): Draft {
  const pack = ctx.pack
  const findings = pack.findings.filter((f) => {
    const ws = coerceFindingWorkflowStatus(f.workflowStatus ?? f.status)
    return !['Resolved', 'Rejected'].includes(ws)
  })
  const critical = findings.filter((f) => f.severity === 'critical')
  const relCoverage = pack.relationships.length
  const evCoverage = pack.evidence.length
  return baseResponse({
    intent: 'workspace_readiness',
    tenantId: ctx.tenantId,
    questionId: 'Q33',
    asOfDate: ctx.asOfDate || getDemoAsOfDate(),
    summary: critical.length
      ? `Workspace “${pack.tenant.name}” has ${critical.length} open critical finding(s). Review those first, then pending decisions.`
      : `Workspace “${pack.tenant.name}” has no open critical findings. Review data/relationship coverage next (${relCoverage} relationships, ${evCoverage} evidence).`,
    explanation: [
      `Capabilities ${pack.capabilities.length}, applications ${pack.applications.length}, integrations ${pack.integrations.length}`,
      `Findings open ${findings.length} (critical ${critical.length})`,
      `Evidence ${evCoverage}, relationships ${relCoverage}`,
      formatDemoNote(ctx.asOfDate),
    ].join('\n'),
    whyItMatters: 'Readiness is component measures — not an invented percentage score.',
    evidenceIds: critical.flatMap((f) => f.evidenceIds).slice(0, 8),
    entityRefs: critical.slice(0, 5).map((f) => ({ id: f.id, type: 'finding', name: f.name })),
    assumptions: ['Counts from committed workspace pack only.'],
    confidence: 'high',
    confidenceReason: 'Direct pack inventory.',
    facts: [
      `apps=${pack.applications.length}`,
      `findingsOpen=${findings.length}`,
      `critical=${critical.length}`,
    ],
    inferences: [],
    suggestedActions: critical[0]
      ? [
          {
            id: 'top',
            label: 'Open top critical finding',
            action: 'select-entity',
            entityId: critical[0].id,
            entityType: 'finding',
            view: 'findings',
          },
          { id: 'studio', label: 'Open Demo Studio', action: 'navigate', view: 'demo-studio' },
        ]
      : [
          { id: 'data', label: 'Review data readiness', action: 'navigate', view: 'data-information' },
          { id: 'studio', label: 'Open Demo Studio', action: 'navigate', view: 'demo-studio' },
        ],
  })
}

function formatDemoNote(asOf?: string) {
  return `Data as of ${asOf || getDemoAsOfDate()} (illustrative snapshot)`
}

export function answerApprovalAuthority(ctx: AIContext): Draft {
  const pending = (ctx.pack.decisions ?? []).filter((d) =>
    ['Pending', 'Deferred'].includes(d.decisionStatus),
  )
  const rec = entityOfType(ctx, ['recommendation', 'decision', 'aiSolution'])
  const focus = rec
    ? (ctx.pack.decisions ?? []).find((d) => d.id === rec.id) ||
      (ctx.pack.recommendations ?? []).find((r) => r.id === rec.id)
    : pending[0]
  const authority =
    (focus as { decisionAuthority?: string; authority?: string })?.decisionAuthority ||
    (focus as { authority?: string })?.authority ||
    'Recorded ARB / accountable authority on the decision record'
  return baseResponse({
    intent: 'approval_authority',
    tenantId: ctx.tenantId,
    asOfDate: ctx.asOfDate,
    summary: `Recorded approval authority: ${authority}. EA360 will not execute the approval.`,
    explanation: pending
      .slice(0, 5)
      .map((d) => `${d.name}: authority ${(d as { decisionAuthority?: string }).decisionAuthority || d.ownerId || 'see record'}`)
      .join('\n'),
    whyItMatters: 'Informational approval questions are allowed; executing approval is not.',
    confidence: 'high',
    confidenceReason: 'Authority fields from decision/recommendation records.',
    entityRefs: pending.slice(0, 5).map((d) => ({ id: d.id, type: 'decision', name: d.name })),
    facts: pending.map((d) => d.id),
    inferences: [],
    suggestedActions: [
      { id: 'gov', label: 'Open Governance', action: 'navigate', view: 'governance' },
    ],
  })
}

export function answerApprovedItems(ctx: AIContext): Draft {
  const approved = (ctx.pack.decisions ?? []).filter((d) =>
    /approved/i.test(d.decisionStatus || ''),
  )
  return baseResponse({
    intent: 'approved_items',
    tenantId: ctx.tenantId,
    asOfDate: ctx.asOfDate,
    summary: `${approved.length} decision(s) have a recorded Approved status (including conditional).`,
    explanation: approved
      .map((d) => `${d.name}: ${d.decisionStatus}`)
      .join('\n'),
    whyItMatters: '“Approved” describes recorded workflow status only — not live institutional clearance.',
    confidence: 'high',
    confidenceReason: 'decisionStatus field scan.',
    entityRefs: approved.map((d) => ({ id: d.id, type: 'decision', name: d.name })),
    facts: approved.map((d) => `${d.id}:${d.decisionStatus}`),
    inferences: [],
    suggestedActions: [
      { id: 'gov', label: 'Open Decision Register', action: 'navigate', view: 'governance' },
    ],
  })
}

export function answerUnknownEntity(ctx: AIContext): Draft {
  return baseResponse({
    intent: 'unknown_entity',
    tenantId: ctx.tenantId,
    asOfDate: ctx.asOfDate,
    summary: 'That named object is not in the active workspace. No other record was substituted.',
    explanation: `Query: ${ctx.query}`,
    whyItMatters: 'Unknown names must not silently fall back to the top risk or selected entity.',
    confidence: 'high',
    confidenceReason: 'Explicit unknown-entity handling.',
    facts: [],
    inferences: [],
    suggestedActions: [
      { id: 'search', label: 'Open portfolio search via Executive', action: 'navigate', view: 'executive' },
    ],
  })
}

/** Re-export helper used by EOS answers elsewhere */
export function evidenceLinked(ctx: AIContext, entityIds: string[]) {
  const set = new Set(entityIds)
  return ctx.pack.evidence.filter(
    (e) =>
      e.linkedObjectIds.some((id) => set.has(id)) ||
      (e.relatedFindingIds ?? []).some((id) => set.has(id)),
  )
}

export function findingIsWeak(ctx: AIContext, findingId: string) {
  const f = ctx.repo.getFinding(findingId)
  if (!f) return true
  return isInsufficientlyEvidenced(f, ctx.pack.evidence)
}
