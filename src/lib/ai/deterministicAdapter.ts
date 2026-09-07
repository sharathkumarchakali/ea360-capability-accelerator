import type { TenantRepository } from '../../data/repositories/tenantRepository'
import { deriveExecutiveMetrics } from '../../domain/metrics'
import { classifyTIME } from '../../domain/metrics/portfolio'
import { deriveIntegrationMetrics } from '../../domain/metrics/integration'
import { analyseImpact } from '../../domain/metrics/graph'
import {
  calculateFindingConfidence,
  coerceFindingWorkflowStatus,
  coerceRecommendationWorkflowStatus,
  isInsufficientlyEvidenced,
} from '../../domain/workflow'
import type { AIContext } from './contextBuilder'
import { buildAIContext } from './contextBuilder'
import { classifyConfidence } from './confidence'
import { validateGrounding } from './groundingValidator'
import { baseResponse, refsFromIds } from './responseComposer'
import type {
  EA360AIRequest,
  EA360AIResponse,
  EA360AIService,
  EntityReference,
  RecommendationDraftPayload,
} from './types'
import { INSUFFICIENT_EVIDENCE_MESSAGE } from './types'

export type DeterministicAdapterOptions = {
  getRepo: () => TenantRepository
  getMutations?: () => Array<{ id: string; at: string; description: string }>
  activeTenantId?: string
}

function resolveRef(repo: TenantRepository, id: string): EntityReference | null {
  const n = repo.resolveGraphNode(id)
  return n ? { id: n.id, type: n.type, name: n.name } : null
}

function evidenceForEntities(repo: TenantRepository, entityIds: string[]) {
  const pack = repo.getPack()
  const set = new Set(entityIds)
  return pack.evidence.filter(
    (e) =>
      e.linkedObjectIds.some((id) => set.has(id)) ||
      (e.relatedFindingIds ?? []).some((id) => set.has(id)),
  )
}

function openFindingStatuses(status: string, workflowStatus?: string) {
  const ws = coerceFindingWorkflowStatus(workflowStatus ?? status)
  return !['Resolved', 'Rejected'].includes(ws)
}

export function createDeterministicAdapter(opts: DeterministicAdapterOptions): EA360AIService {
  const run = (request: EA360AIRequest): EA360AIResponse => {
    const repo = opts.getRepo()
    const pack = repo.getPack()
    const tenantId = pack.tenant.id
    const ctx = buildAIContext(
      { ...request, tenantId: request.tenantId || tenantId },
      repo,
      { mutations: opts.getMutations?.() },
    )

    if (ctx.intent === 'cross_tenant_refused') {
      return finalize(
        baseResponse({
          intent: ctx.intent,
          tenantId,
          summary:
            'Cross-tenant questions are not supported. EA360 answers only from the active tenant dataset.',
          explanation: `This prototype isolates each tenant. Other organisation packs are out of scope while ${pack.tenant.shortName} is active.`,
          confidence: 'high',
          confidenceReason: 'Policy refusal — no cross-tenant reasoning.',
          facts: ['Active tenant only: ' + pack.tenant.shortName],
          inferences: [],
          assumptions: [],
        }),
        repo,
        tenantId,
      )
    }

    if (ctx.intent === 'refuse_approval') {
      return finalize(
        baseResponse({
          intent: ctx.intent,
          tenantId,
          summary:
            'EA360 will not approve decisions. AI may suggest; an accountable authority must record the decision in Governance.',
          explanation: 'Trust model: AI suggests → Evidence is shown → Architect validates → Authority approves → EA360 records.',
          confidence: 'high',
          confidenceReason: 'Hard governance guardrail.',
          suggestedActions: [
            { id: 'gov', label: 'Open Governance & Decisions', action: 'navigate', view: 'governance' },
          ],
          facts: [],
          inferences: [],
        }),
        repo,
        tenantId,
      )
    }

    if (ctx.intent === 'refuse_guaranteed_finance') {
      return finalize(
        baseResponse({
          intent: ctx.intent,
          tenantId,
          summary:
            'EA360 does not state guaranteed financial outcomes. Use indicative value bands subject to validation.',
          explanation: 'Synthetic prototype figures are illustrative ranges, not institutional commitments.',
          confidence: 'high',
          confidenceReason: 'Hard safety guardrail against false precision.',
          facts: [],
          inferences: [],
        }),
        repo,
        tenantId,
      )
    }

    if (ctx.ambiguous) {
      return finalize(
        baseResponse({
          intent: 'clarify_entity',
          tenantId,
          summary: 'Multiple enterprise objects match your question. Select one to continue.',
          explanation: ctx.matchedEntities
            .slice(0, 5)
            .map((e) => `${e.name} (${e.type})`)
            .join('; '),
          confidence: 'medium',
          confidenceReason: 'Ambiguous entity match — clarification required.',
          entityRefs: ctx.matchedEntities.slice(0, 5),
          suggestedActions: ctx.matchedEntities.slice(0, 5).map((e) => ({
            id: `sel-${e.id}`,
            label: `Use ${e.name}`,
            action: 'set-context',
            entityId: e.id,
            entityType: e.type,
          })),
          facts: [],
          inferences: ['Clarification needed before impact or dependency analysis.'],
        }),
        repo,
        tenantId,
      )
    }

    let draft: Omit<EA360AIResponse, 'grounded' | 'groundingErrors'>
    switch (ctx.intent) {
      case 'critical_risks':
        draft = answerCriticalRisks(ctx)
        break
      case 'maturity_gaps':
        draft = answerMaturityGaps(ctx)
        break
      case 'time_migrate_eliminate':
        draft = answerTime(ctx)
        break
      case 'capability_applications':
        draft = answerCapabilityApps(ctx)
        break
      case 'integration_dependents':
        draft = answerDependents(ctx)
        break
      case 'impact_analysis':
        draft = answerImpact(ctx)
        break
      case 'p2p_concentration':
        draft = answerP2P(ctx)
        break
      case 'eos_technologies':
        draft = answerEos(ctx)
        break
      case 'findings_without_remediation':
        draft = answerFindingsNoRemediation(ctx)
        break
      case 'recommendations_awaiting_decision':
        draft = answerAwaitingDecisions(ctx)
        break
      case 'initiatives_for_objective':
        draft = answerInitiativesForObjective(ctx)
        break
      case 'executive_review':
        draft = answerExecutiveReview(ctx)
        break
      case 'evidence_gaps':
        draft = answerEvidenceGaps(ctx)
        break
      case 'demo_changes':
        draft = answerDemoChanges(ctx)
        break
      case 'explain_metric':
        draft = answerExplainMetric(ctx)
        break
      case 'recommendation_draft':
        draft = answerRecommendationDraft(ctx)
        break
      case 'executive_briefing':
        draft = answerExecutiveBriefing(ctx)
        break
      default:
        draft = baseResponse({
          intent: 'unsupported',
          tenantId,
          summary:
            'This question is outside the supported deterministic intents. Try a suggested question or open Explain on a specific insight.',
          explanation:
            'Ask EA360 supports focused enterprise questions (risks, TIME, integrations, findings, decisions, briefings) grounded in GRA records — not unrestricted natural language.',
          confidence: 'low',
          confidenceReason: 'Unsupported query pattern.',
          suggestedActions: [
            { id: 'findings', label: 'Open Findings & Risks', action: 'navigate', view: 'findings' },
            { id: 'explorer', label: 'Open Relationship Explorer', action: 'navigate', view: 'explorer' },
          ],
          facts: [],
          inferences: [],
          assumptions: ['User query did not match a supported intent template.'],
        })
    }

    return finalize(draft, repo, tenantId)
  }

  return {
    ask: run,
    explain: (req) => run({ ...req, intent: req.intent || 'explain_metric' }),
    impactNarrative: (req) => run({ ...req, intent: 'impact_analysis' }),
    draftRecommendation: (req) => run({ ...req, intent: 'recommendation_draft' }),
    executiveBriefing: (req) => run({ ...req, intent: 'executive_briefing' }),
  }
}

function finalize(
  draft: Omit<EA360AIResponse, 'grounded' | 'groundingErrors'>,
  repo: TenantRepository,
  tenantId: string,
): EA360AIResponse {
  return validateGrounding(draft, repo, tenantId)
}

function answerCriticalRisks(ctx: AIContext) {
  const findings = ctx.pack.findings
    .filter((f) => f.severity === 'critical' && openFindingStatuses(f.status, f.workflowStatus))
    .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
  const evidenceIds = [...new Set(findings.flatMap((f) => f.evidenceIds))]
  const evidence = evidenceIds.map((id) => ctx.repo.getEvidence(id)!).filter(Boolean)
  const conf = classifyConfidence({
    evidence,
    dataQualityScores: findings.map((f) => f.dataQuality),
    assumptionCount: 1,
    metricComplete: true,
  })
  const names = findings.slice(0, 5).map((f) => f.name)
  return baseResponse({
    intent: 'critical_risks',
    tenantId: ctx.tenantId,
    summary:
      findings.length === 0
        ? 'No open critical findings are recorded in the active tenant.'
        : `There are ${findings.length} open critical finding(s). Top exposures: ${names.join('; ')}.`,
    explanation: findings
      .slice(0, 5)
      .map(
        (f) =>
          `${f.name} — risk score ${f.riskScore ?? 'n/a'}, impact: ${f.businessImpact}`,
      )
      .join('\n'),
    whyItMatters: 'Critical findings concentrate executive risk and should drive ARB and roadmap attention.',
    evidenceIds,
    entityRefs: refsFromIds(
      findings.slice(0, 8).map((f) => f.id),
      (id) => resolveRef(ctx.repo, id),
    ),
    assumptions: ['Open = not Resolved or Rejected in the workflow model.'],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: [`Open critical findings: ${findings.length}`],
    inferences: ['Prioritisation order uses recorded riskScore when present.'],
    suggestedActions: [
      { id: 'findings', label: 'Open Findings & Risks', action: 'navigate', view: 'findings' },
      ...(findings[0]
        ? [
            {
              id: 'top',
              label: 'Open top finding',
              action: 'select-entity',
              entityId: findings[0].id,
              entityType: 'finding',
            },
          ]
        : []),
    ],
    calculations: [
      {
        id: 'crit-count',
        label: 'Open critical findings',
        formula: "count(findings where severity='critical' and workflow not Resolved/Rejected)",
        inputs: findings.map((f) => f.id),
        result: findings.length,
      },
    ],
  })
}

function answerMaturityGaps(ctx: AIContext) {
  const caps = [...ctx.pack.capabilities]
    .map((c) => ({
      c,
      gap: Math.max(0, c.maturityTarget - c.maturityCurrent),
    }))
    .sort((a, b) => b.gap - a.gap || b.c.riskScore - a.c.riskScore)
  const top = caps.slice(0, 5)
  const evidence = evidenceForEntities(
    ctx.repo,
    top.flatMap((t) => [t.c.id]),
  )
  const conf = classifyConfidence({
    evidence,
    dataQualityScores: top.map((t) => t.c.dataQuality),
    metricComplete: true,
    assumptionCount: 1,
  })
  return baseResponse({
    intent: 'maturity_gaps',
    tenantId: ctx.tenantId,
    summary: `Largest maturity gaps: ${top.map((t) => `${t.c.name} (${t.gap.toFixed(1)})`).join('; ')}.`,
    explanation: top
      .map(
        (t) =>
          `${t.c.name}: current ${t.c.maturityCurrent} → target ${t.c.maturityTarget} (gap ${t.gap.toFixed(1)}), risk ${t.c.riskScore}.`,
      )
      .join('\n'),
    whyItMatters: 'Maturity gaps highlight where capability investment may be needed to support strategic objectives.',
    evidenceIds: evidence.map((e) => e.id),
    entityRefs: top.map((t) => ({ id: t.c.id, type: 'capability', name: t.c.name })),
    assumptions: ['Gap = maturityTarget − maturityCurrent using seeded scores.'],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: top.map((t) => `${t.c.id} gap ${t.gap}`),
    inferences: ['Larger gaps with higher riskScore warrant earlier review.'],
    suggestedActions: [
      { id: 'caps', label: 'Open Capabilities', action: 'navigate', view: 'capabilities' },
    ],
    calculations: top.slice(0, 3).map((t) => ({
      id: `gap-${t.c.id}`,
      label: `${t.c.name} maturity gap`,
      formula: 'maturityTarget - maturityCurrent',
      inputs: [t.c.id],
      result: t.gap,
    })),
  })
}

function answerTime(ctx: AIContext) {
  const p2p: Record<string, number> = {}
  for (const i of ctx.pack.integrations) {
    if (!i.pointToPoint) continue
    p2p[i.sourceApplicationId] = (p2p[i.sourceApplicationId] || 0) + 1
    p2p[i.targetApplicationId] = (p2p[i.targetApplicationId] || 0) + 1
  }
  const classified = ctx.pack.applications.map((a) => ({
    a,
    time: classifyTIME(a, { p2pIntegrationCountByApp: p2p }),
  }))
  const focus = classified.filter((x) => x.time === 'Migrate' || x.time === 'Eliminate')
  const evidence = evidenceForEntities(
    ctx.repo,
    focus.map((f) => f.a.id),
  )
  const conf = classifyConfidence({
    evidence,
    metricComplete: true,
    dataQualityScores: focus.map((f) => f.a.dataQuality),
    assumptionCount: 1,
  })
  return baseResponse({
    intent: 'time_migrate_eliminate',
    tenantId: ctx.tenantId,
    summary: `${focus.length} application(s) classify as Migrate or Eliminate under TIME rules.`,
    explanation: focus
      .slice(0, 8)
      .map((f) => `${f.a.name}: ${f.time} (value ${f.a.businessValue}, health ${f.a.technicalHealth})`)
      .join('\n'),
    whyItMatters: 'TIME candidates inform rationalisation and modernisation sequencing on the roadmap.',
    evidenceIds: evidence.map((e) => e.id),
    entityRefs: focus.slice(0, 10).map((f) => ({
      id: f.a.id,
      type: 'application',
      name: f.a.name,
    })),
    assumptions: ['Classification uses documented TIME rule order; first match wins.'],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: focus.map((f) => `${f.a.id}=${f.time}`),
    inferences: ['Candidates still require architect validation before portfolio action.'],
    suggestedActions: [
      { id: 'apps', label: 'Open Application Portfolio', action: 'navigate', view: 'applications' },
    ],
  })
}

function answerCapabilityApps(ctx: AIContext) {
  const cap =
    ctx.primaryEntity?.type === 'capability'
      ? ctx.repo.getCapability(ctx.primaryEntity.id)
      : ctx.pack.capabilities.find((c) =>
          /taxpayer/i.test(c.name + ' ' + (ctx.query || '')),
        ) || ctx.repo.getCapability(ctx.matchedEntities.find((m) => m.type === 'capability')?.id || '')

  if (!cap) {
    return baseResponse({
      intent: 'insufficient_evidence',
      tenantId: ctx.tenantId,
      summary: INSUFFICIENT_EVIDENCE_MESSAGE,
      explanation: 'No capability could be resolved from the question. Name a capability or select one in context.',
      confidence: 'low',
      confidenceReason: 'Missing capability context.',
      assumptions: ['Capability name was not uniquely matched.'],
    })
  }

  const apps = ctx.repo.applicationsForCapability(cap.id)
  const evidence = evidenceForEntities(
    ctx.repo,
    [cap.id, ...apps.map((a) => a.id)],
  )
  const conf = classifyConfidence({
    evidence,
    relationshipCount: apps.length,
    expectedRelationships: 1,
    dataQualityScores: apps.map((a) => a.dataQuality),
  })
  return baseResponse({
    intent: 'capability_applications',
    tenantId: ctx.tenantId,
    summary: `${apps.length} application(s) support ${cap.name}.`,
    explanation: apps.map((a) => `${a.name} (${a.criticality})`).join('; ') || 'No linked applications in seed.',
    whyItMatters: 'Understanding supporting applications clarifies change impact for this capability.',
    evidenceIds: evidence.map((e) => e.id),
    entityRefs: [
      { id: cap.id, type: 'capability', name: cap.name },
      ...apps.map((a) => ({ id: a.id, type: 'application' as const, name: a.name })),
    ],
    assumptions: ['Links come from supportedCapabilityIds and relationship uses/depends-on edges.'],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: apps.map((a) => a.id),
    inferences: [],
    suggestedActions: [
      {
        id: 'cap',
        label: `Open ${cap.name}`,
        action: 'select-entity',
        entityId: cap.id,
        entityType: 'capability',
      },
    ],
  })
}

function answerDependents(ctx: AIContext) {
  const entity =
    ctx.primaryEntity ||
    ctx.matchedEntities.find((m) => m.type === 'integration' || m.type === 'application')
  if (!entity) {
    return baseResponse({
      intent: 'insufficient_evidence',
      tenantId: ctx.tenantId,
      summary: INSUFFICIENT_EVIDENCE_MESSAGE,
      explanation: 'Name an integration or application (for example Payment Confirmation) or select it first.',
      confidence: 'low',
      confidenceReason: 'No target entity resolved.',
    })
  }

  const impact = analyseImpact({
    rootId: entity.id,
    relationships: ctx.repo.listRelationships(),
    resolveEntity: (id) => ctx.repo.resolveGraphNode(id),
    direction: 'both',
    maxDepth: 2,
  })
  const evidence = evidenceForEntities(
    ctx.repo,
    [entity.id, ...impact.hits.map((h) => h.id)],
  )
  const conf = classifyConfidence({
    evidence,
    relationshipCount: impact.hits.length,
    expectedRelationships: 2,
    metricComplete: true,
  })
  const direct = impact.hits.filter((h) => h.level === 'direct')
  return baseResponse({
    intent: 'integration_dependents',
    tenantId: ctx.tenantId,
    summary: `${direct.length} direct dependent/neighbour object(s) around ${entity.name}.`,
    explanation: direct
      .slice(0, 10)
      .map((h) => `${h.name} (${h.type}, ${h.level})`)
      .join('; '),
    whyItMatters: 'Dependency concentration indicates blast radius for change or outage.',
    evidenceIds: evidence.map((e) => e.id),
    entityRefs: [
      entity,
      ...direct.slice(0, 12).map((h) => ({ id: h.id, type: h.type, name: h.name })),
    ],
    assumptions: ['Neighbourhood from seeded relationships only; depth limited to 2.'],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: [`Root ${entity.id}`, `Direct hits ${direct.length}`],
    inferences: ['Indirect impacts may exist beyond depth 2.'],
    suggestedActions: [
      {
        id: 'explore',
        label: 'Open in Relationship Explorer',
        action: 'explore',
        entityId: entity.id,
        entityType: entity.type,
        view: 'explorer',
      },
    ],
  })
}

function answerImpact(ctx: AIContext) {
  const entity =
    ctx.primaryEntity ||
    ctx.matchedEntities[0] ||
    (ctx.contextEntities[0] ?? undefined)
  if (!entity) {
    return baseResponse({
      intent: 'insufficient_evidence',
      tenantId: ctx.tenantId,
      summary: INSUFFICIENT_EVIDENCE_MESSAGE,
      explanation: 'Select an application, integration, technology or capability to analyse impact.',
      confidence: 'low',
      confidenceReason: 'Missing impact root entity.',
    })
  }

  const impact = analyseImpact({
    rootId: entity.id,
    relationships: ctx.repo.listRelationships(),
    resolveEntity: (id) => ctx.repo.resolveGraphNode(id),
    direction: 'both',
    maxDepth: 3,
  })
  const relatedFindings = ctx.pack.findings.filter(
    (f) =>
      f.linkedObjectIds.includes(entity.id) ||
      impact.hits.some((h) => f.linkedObjectIds.includes(h.id)),
  )
  const remediation = ctx.pack.recommendations.filter((r) =>
    relatedFindings.some((f) => r.findingIds.includes(f.id)),
  )
  const evidenceIds = [
    ...new Set([
      ...relatedFindings.flatMap((f) => f.evidenceIds),
      ...evidenceForEntities(
        ctx.repo,
        [entity.id, ...impact.hits.map((h) => h.id)],
      ).map((e) => e.id),
    ]),
  ]
  const evidence = evidenceIds.map((id) => ctx.repo.getEvidence(id)!).filter(Boolean)
  const conf = classifyConfidence({
    evidence,
    relationshipCount: impact.hits.length,
    expectedRelationships: 3,
    assumptionCount: 2,
    metricComplete: true,
  })

  const direct = impact.hits.filter((h) => h.level === 'direct')
  const indirect = impact.hits.filter((h) => h.level === 'indirect')
  return baseResponse({
    intent: 'impact_analysis',
    tenantId: ctx.tenantId,
    summary: `Impact narrative for ${entity.name}: ${direct.length} direct and ${indirect.length} indirect effects within depth 3.`,
    explanation: [
      `Direct: ${direct.map((h) => h.name).slice(0, 8).join('; ') || 'none recorded'}.`,
      `Indirect: ${indirect.map((h) => h.name).slice(0, 8).join('; ') || 'none recorded'}.`,
      `Affected capabilities (roll-up): ${impact.affectedCapabilities}.`,
      `Affected applications (roll-up): ${impact.affectedApplications}.`,
      `Related findings: ${relatedFindings.map((f) => f.name).slice(0, 5).join('; ') || 'none'}.`,
      `Existing remediation recommendations: ${remediation.map((r) => r.name).slice(0, 4).join('; ') || 'none'}.`,
    ].join('\n'),
    whyItMatters: 'Change-impact narratives help executives see blast radius before approving retirement or cutovers.',
    evidenceIds,
    entityRefs: [
      entity,
      ...impact.hits.slice(0, 15).map((h) => ({ id: h.id, type: h.type, name: h.name })),
      ...relatedFindings.slice(0, 5).map((f) => ({ id: f.id, type: 'finding', name: f.name })),
    ],
    assumptions: [
      'Impact uses seeded relationship graph only.',
      'Depth capped at 3; potential deeper effects are out of scope.',
    ],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: [
      `direct=${direct.length}`,
      `indirect=${indirect.length}`,
      `capabilities=${impact.affectedCapabilities}`,
      `applications=${impact.affectedApplications}`,
    ],
    inferences: [
      'Absence of an edge means no recorded dependency — not proof that none exists in the real estate.',
    ],
    suggestedActions: [
      {
        id: 'explore',
        label: 'Inspect graph',
        action: 'explore',
        entityId: entity.id,
        entityType: entity.type,
        view: 'explorer',
      },
      ...(relatedFindings[0]
        ? [
            {
              id: 'finding',
              label: 'Open related finding',
              action: 'select-entity',
              entityId: relatedFindings[0].id,
              entityType: 'finding',
            },
          ]
        : []),
    ],
  })
}

function answerP2P(ctx: AIContext) {
  const metrics = deriveIntegrationMetrics(ctx.pack.integrations)
  const p2p = ctx.pack.integrations.filter((i) => i.pointToPoint)
  const evidence = evidenceForEntities(
    ctx.repo,
    p2p.map((i) => i.id),
  )
  const conf = classifyConfidence({
    evidence,
    metricComplete: true,
    dataQualityScores: p2p.map((i) => i.dataQuality),
  })
  return baseResponse({
    intent: 'p2p_concentration',
    tenantId: ctx.tenantId,
    summary: `${metrics.pointToPointCount} point-to-point integrations (${metrics.pointToPointPercentage}%). Concentration is highest on the applications listed in integration metrics.`,
    explanation: p2p
      .slice(0, 10)
      .map((i) => `${i.name} (${i.criticality})`)
      .join('; '),
    whyItMatters: 'P2P concentration multiplies change cost and outage blast radius.',
    evidenceIds: evidence.map((e) => e.id),
    entityRefs: p2p.slice(0, 12).map((i) => ({ id: i.id, type: 'integration', name: i.name })),
    assumptions: ['P2P flag and helper metrics come from the integration inventory.'],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: [`p2pCount=${metrics.pointToPointCount}`, `p2pPct=${metrics.pointToPointPercentage}`],
    inferences: [],
    suggestedActions: [
      { id: 'int', label: 'Open Integration Landscape', action: 'navigate', view: 'integrations' },
    ],
    calculations: [
      {
        id: 'p2p-pct',
        label: 'P2P share',
        formula: 'pointToPointCount / totalIntegrations * 100',
        inputs: p2p.map((i) => i.id),
        result: metrics.pointToPointPercentage,
      },
    ],
  })
}

function answerEos(ctx: AIContext) {
  const tech = ctx.pack.technologies.filter((t) =>
    ['deprecated', 'retire', 'tolerated'].includes(t.lifecycle),
  )
  const apps = ctx.pack.applications.filter((a) => {
    if (!a.endOfSupportDate) return false
    const months =
      (Date.parse(a.endOfSupportDate) - Date.parse('2026-09-07')) / (1000 * 60 * 60 * 24 * 30)
    return months <= 18
  })
  const evidence = evidenceForEntities(
    ctx.repo,
    [...tech.map((t) => t.id), ...apps.map((a) => a.id)],
  )
  const conf = classifyConfidence({
    evidence,
    metricComplete: true,
    dataQualityScores: [...tech, ...apps].map((x) => x.dataQuality),
  })
  return baseResponse({
    intent: 'eos_technologies',
    tenantId: ctx.tenantId,
    summary: `${tech.length} technology record(s) on deprecated/retire/tolerated lifecycles; ${apps.length} application(s) with end-of-support within 18 months of the demo as-of date.`,
    explanation: [
      ...tech.slice(0, 6).map((t) => `${t.name}: lifecycle ${t.lifecycle}`),
      ...apps.slice(0, 6).map((a) => `${a.name}: EOS ${a.endOfSupportDate}`),
    ].join('\n'),
    whyItMatters: 'Approaching EOS raises operational and security exposure for critical services.',
    evidenceIds: evidence.map((e) => e.id),
    entityRefs: [
      ...tech.map((t) => ({ id: t.id, type: 'technology', name: t.name })),
      ...apps.map((a) => ({ id: a.id, type: 'application', name: a.name })),
    ],
    assumptions: ['As-of date for EOS window is 2026-09-07.'],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: [`tech=${tech.length}`, `appsEos=${apps.length}`],
    inferences: [],
    suggestedActions: [
      { id: 'apps', label: 'Review applications', action: 'navigate', view: 'applications' },
    ],
  })
}

function answerFindingsNoRemediation(ctx: AIContext) {
  const findings = ctx.pack.findings.filter((f) => {
    if (!openFindingStatuses(f.status, f.workflowStatus)) return false
    const recs = ctx.repo.recommendationsForFinding(f.id)
    const inits = recs.flatMap((r) => ctx.repo.initiativesForRecommendation(r.id))
    return recs.length === 0 || inits.length === 0
  })
  const evidenceIds = [...new Set(findings.flatMap((f) => f.evidenceIds))]
  const evidence = evidenceIds.map((id) => ctx.repo.getEvidence(id)!).filter(Boolean)
  const conf = classifyConfidence({ evidence, metricComplete: true, assumptionCount: 1 })
  return baseResponse({
    intent: 'findings_without_remediation',
    tenantId: ctx.tenantId,
    summary: `${findings.length} open finding(s) lack a linked remediation initiative (or have no recommendation).`,
    explanation: findings
      .slice(0, 8)
      .map((f) => f.name)
      .join('; '),
    whyItMatters: 'Unremediated findings remain executive exposures.',
    evidenceIds,
    entityRefs: findings.slice(0, 10).map((f) => ({ id: f.id, type: 'finding', name: f.name })),
    assumptions: ['Remediation means at least one initiative linked via a recommendation.'],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: findings.map((f) => f.id),
    inferences: [],
    suggestedActions: [
      { id: 'findings', label: 'Open Findings', action: 'navigate', view: 'findings' },
    ],
  })
}

function answerAwaitingDecisions(ctx: AIContext) {
  const pending = (ctx.pack.decisions ?? []).filter((d) =>
    ['Pending', 'Deferred'].includes(d.decisionStatus),
  )
  const recs = ctx.pack.recommendations.filter((r) => {
    const ws = coerceRecommendationWorkflowStatus(r.workflowStatus ?? r.status)
    return ws === 'Under Review' || ws === 'Ready for Review'
  })
  const evidenceIds = [
    ...new Set(pending.flatMap((d) => d.evidenceIds).concat(recs.flatMap((r) => r.evidenceIds ?? []))),
  ]
  const evidence = evidenceIds.map((id) => ctx.repo.getEvidence(id)!).filter(Boolean)
  const conf = classifyConfidence({ evidence, metricComplete: true })
  return baseResponse({
    intent: 'recommendations_awaiting_decision',
    tenantId: ctx.tenantId,
    summary: `${pending.length} ARB decision(s) pending/deferred; ${recs.length} recommendation(s) in review.`,
    explanation: [
      ...pending.map((d) => `Decision: ${d.name} (${d.decisionStatus})`),
      ...recs.slice(0, 5).map((r) => `Recommendation: ${r.name} (${r.workflowStatus ?? r.status})`),
    ].join('\n'),
    whyItMatters: 'Items awaiting decision block governed initiative creation.',
    evidenceIds,
    entityRefs: [
      ...pending.map((d) => ({ id: d.id, type: 'decision', name: d.name })),
      ...recs.slice(0, 5).map((r) => ({ id: r.id, type: 'recommendation', name: r.name })),
    ],
    assumptions: [],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: [`pendingDecisions=${pending.length}`, `recsInReview=${recs.length}`],
    inferences: [],
    suggestedActions: [
      { id: 'gov', label: 'Open Governance', action: 'navigate', view: 'governance' },
    ],
  })
}

function answerInitiativesForObjective(ctx: AIContext) {
  const obj =
    ctx.primaryEntity?.type === 'strategicObjective'
      ? ctx.repo.listObjectives().find((o) => o.id === ctx.primaryEntity!.id)
      : ctx.matchedEntities.find((m) => m.type === 'strategicObjective')
        ? ctx.repo.listObjectives().find((o) => o.id === ctx.matchedEntities.find((m) => m.type === 'strategicObjective')!.id)
        : ctx.pack.strategicObjectives[0]

  if (!obj) {
    return baseResponse({
      intent: 'insufficient_evidence',
      tenantId: ctx.tenantId,
      summary: INSUFFICIENT_EVIDENCE_MESSAGE,
      explanation: 'No strategic objective resolved.',
      confidence: 'low',
      confidenceReason: 'Missing objective context.',
    })
  }

  const inits = ctx.pack.initiatives.filter((i) => i.objectiveIds.includes(obj.id))
  const evidence = evidenceForEntities(
    ctx.repo,
    inits.flatMap((i) => i.findingIds ?? []),
  )
  const conf = classifyConfidence({ evidence, metricComplete: true })
  return baseResponse({
    intent: 'initiatives_for_objective',
    tenantId: ctx.tenantId,
    summary: `${inits.length} initiative(s) support objective “${obj.name}”.`,
    explanation: inits
      .map((i) => `${i.name} — ${i.horizon}, progress ${i.progressPercent}%`)
      .join('\n'),
    whyItMatters: 'Shows whether strategic intent is funded on the transformation roadmap.',
    evidenceIds: evidence.map((e) => e.id),
    entityRefs: [
      { id: obj.id, type: 'strategicObjective', name: obj.name },
      ...inits.map((i) => ({ id: i.id, type: 'initiative', name: i.name })),
    ],
    assumptions: [],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: inits.map((i) => i.id),
    inferences: [],
    suggestedActions: [
      { id: 'roadmap', label: 'Open Roadmap', action: 'navigate', view: 'roadmap' },
    ],
  })
}

function answerExecutiveReview(ctx: AIContext) {
  const metrics = deriveExecutiveMetrics({
    capabilities: ctx.pack.capabilities,
    applications: ctx.pack.applications,
    findings: ctx.pack.findings,
    initiatives: ctx.pack.initiatives,
    kpis: ctx.pack.kpis,
    recommendations: ctx.pack.recommendations,
  })
  const critical = ctx.pack.findings.filter(
    (f) => f.severity === 'critical' && openFindingStatuses(f.status, f.workflowStatus),
  )
  const pending = (ctx.pack.decisions ?? []).filter((d) => d.decisionStatus === 'Pending')
  const evidenceIds = [...new Set(critical.flatMap((f) => f.evidenceIds))]
  const evidence = evidenceIds.map((id) => ctx.repo.getEvidence(id)!).filter(Boolean)
  const conf = classifyConfidence({
    evidence,
    metricComplete: true,
    assumptionCount: 2,
  })
  return baseResponse({
    intent: 'executive_review',
    tenantId: ctx.tenantId,
    summary: `This quarter, review enterprise health ${metrics.enterpriseHealth}/100, ${critical.length} critical open findings, and ${pending.length} pending ARB decision(s).`,
    explanation: [
      `Strategic alignment ${metrics.strategicAlignment}/100; architecture maturity ${metrics.architectureMaturity}.`,
      `Top risks: ${critical
        .slice(0, 3)
        .map((f) => f.name)
        .join('; ')}.`,
      `Pending decisions: ${pending.map((d) => d.name).join('; ') || 'none'}.`,
    ].join('\n'),
    whyItMatters: 'Focuses the executive committee on decisions that unblock transformation.',
    evidenceIds,
    entityRefs: [
      ...critical.slice(0, 5).map((f) => ({ id: f.id, type: 'finding', name: f.name })),
      ...pending.map((d) => ({ id: d.id, type: 'decision', name: d.name })),
    ],
    assumptions: [
      '“This quarter” uses the demo filter period label, not a live calendar engine.',
      'Health score uses documented Phase 1A weights.',
    ],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: [
      `health=${metrics.enterpriseHealth}`,
      `critical=${critical.length}`,
      `pendingDecisions=${pending.length}`,
    ],
    inferences: ['Suggested agenda — not an autonomous decision.'],
    suggestedActions: [
      { id: 'brief', label: 'Generate executive briefing', action: 'briefing', view: 'executive' },
      { id: 'gov', label: 'Open Governance', action: 'navigate', view: 'governance' },
    ],
    calculations: [
      {
        id: 'health',
        label: 'Enterprise health',
        formula: '0.4*maturity + 0.3*inverseRisk + 0.2*appHealth + 0.1*transformProgress',
        inputs: [],
        result: metrics.enterpriseHealth,
      },
    ],
  })
}

function answerEvidenceGaps(ctx: AIContext) {
  const staleOrWeak = ctx.pack.evidence.filter((e) => {
    const v = e.verificationStatus ?? 'unverified'
    return v === 'unverified' || v === 'stale' || v === 'disputed' || e.freshness === 'stale'
  })
  const weakFindings = ctx.pack.findings.filter((f) =>
    isInsufficientlyEvidenced(f, ctx.pack.evidence),
  )
  const conf = classifyConfidence({
    evidence: staleOrWeak,
    metricComplete: true,
    assumptionCount: 0,
    conflictingEvidence: staleOrWeak.some((e) => e.verificationStatus === 'disputed'),
  })
  return baseResponse({
    intent: 'evidence_gaps',
    tenantId: ctx.tenantId,
    summary: `${staleOrWeak.length} evidence item(s) are unverified, stale or disputed; ${weakFindings.length} finding(s) are insufficiently evidenced.`,
    explanation: [
      ...staleOrWeak.slice(0, 6).map((e) => `${e.name}: ${e.verificationStatus ?? 'unverified'}/${e.freshness ?? 'n/a'}`),
      ...weakFindings.slice(0, 4).map((f) => `Finding gap: ${f.name}`),
    ].join('\n'),
    whyItMatters: 'Weak evidence lowers confidence in findings, recommendations and AI-assisted answers.',
    evidenceIds: staleOrWeak.map((e) => e.id),
    entityRefs: [
      ...staleOrWeak.slice(0, 8).map((e) => ({ id: e.id, type: 'evidence', name: e.name })),
      ...weakFindings.slice(0, 5).map((f) => ({ id: f.id, type: 'finding', name: f.name })),
    ],
    assumptions: [],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: [`weakEvidence=${staleOrWeak.length}`, `weakFindings=${weakFindings.length}`],
    inferences: [],
    suggestedActions: [
      { id: 'ev', label: 'Open Evidence', action: 'navigate', view: 'evidence' },
    ],
  })
}

function answerDemoChanges(ctx: AIContext) {
  const mutations = ctx.mutations || []
  const audit = ctx.pack.auditHistory || []
  return baseResponse({
    intent: 'demo_changes',
    tenantId: ctx.tenantId,
    summary:
      mutations.length === 0
        ? 'No local prototype mutations are recorded since the last demo reset.'
        : `${mutations.length} local mutation(s) recorded in this session’s working pack.`,
    explanation: [
      ...mutations.slice(-8).map((m) => `${m.at}: ${m.description}`),
      `Seed audit events: ${audit.length}.`,
    ].join('\n'),
    whyItMatters: 'Shows what changed in the demonstration state versus the restored seed.',
    evidenceIds: [],
    entityRefs: [],
    assumptions: ['Mutation log is prototype-local and not an enterprise audit system of record.'],
    confidence: 'high',
    confidenceReason: 'Derived directly from local prototype state.',
    facts: [`mutations=${mutations.length}`, `auditSeed=${audit.length}`],
    inferences: [],
    suggestedActions: [
      { id: 'reset', label: 'Demo reset available in top bar', action: 'noop' },
    ],
  })
}

function answerExplainMetric(ctx: AIContext) {
  const key = (ctx.metricKey || ctx.query || '').toLowerCase()
  const metrics = deriveExecutiveMetrics({
    capabilities: ctx.pack.capabilities,
    applications: ctx.pack.applications,
    findings: ctx.pack.findings,
    initiatives: ctx.pack.initiatives,
    kpis: ctx.pack.kpis,
    recommendations: ctx.pack.recommendations,
  })

  if (key.includes('health') || /enterprise health/i.test(ctx.query)) {
    return baseResponse({
      intent: 'explain_metric',
      tenantId: ctx.tenantId,
      summary: `Enterprise health is ${metrics.enterpriseHealth}/100.`,
      explanation:
        'Weighted blend: architecture maturity 40%, inverse critical-risk pressure 30%, application health 20%, transformation progress 10%. All inputs are derived from GRA records.',
      whyItMatters: 'A single executive signal for architecture and risk posture — not a financial KPI.',
      evidenceIds: ctx.pack.findings.filter((f) => f.severity === 'critical').flatMap((f) => f.evidenceIds).slice(0, 8),
      entityRefs: [],
      assumptions: ['Weights are product-defined for the prototype.'],
      confidence: 'high',
      confidenceReason: 'Metric formula is fully determined by tenant records.',
      facts: [`enterpriseHealth=${metrics.enterpriseHealth}`],
      inferences: ['Interpretation still requires human judgement.'],
      calculations: [
        {
          id: 'eh',
          label: 'Enterprise health',
          formula: '0.4*maturityPct + 0.3*riskPct + 0.2*appPct + 0.1*transformPct',
          inputs: ['capabilities', 'findings', 'applications', 'initiatives'],
          result: metrics.enterpriseHealth,
        },
      ],
      suggestedActions: [
        { id: 'exec', label: 'Open Executive Cockpit', action: 'navigate', view: 'executive' },
      ],
    })
  }

  if (key.includes('alignment') || /strategic alignment/i.test(ctx.query)) {
    return baseResponse({
      intent: 'explain_metric',
      tenantId: ctx.tenantId,
      summary: `Strategic alignment is ${metrics.strategicAlignment}/100.`,
      explanation:
        'Average of KPI attainment ratios (current/target for higher-better; target/current for lower-better), clamped 0–1 then scaled to 0–100.',
      confidence: 'high',
      confidenceReason: 'Computed from KPI records only.',
      entityRefs: ctx.pack.kpis.slice(0, 6).map((k) => ({ id: k.id, type: 'kpi', name: k.name })),
      evidenceIds: [],
      assumptions: ['KPI targets are synthetic demonstration values.'],
      facts: [`strategicAlignment=${metrics.strategicAlignment}`],
      inferences: [],
      calculations: [
        {
          id: 'sa',
          label: 'Strategic alignment',
          formula: 'avg(KPI attainment ratios) * 100',
          inputs: ctx.pack.kpis.map((k) => k.id),
          result: metrics.strategicAlignment,
        },
      ],
    })
  }

  if (ctx.primaryEntity?.type === 'capability' || key.includes('maturity')) {
    const cap =
      (ctx.primaryEntity?.type === 'capability' && ctx.repo.getCapability(ctx.primaryEntity.id)) ||
      ctx.pack.capabilities[0]
    if (!cap) {
      return baseResponse({
        intent: 'insufficient_evidence',
        tenantId: ctx.tenantId,
        summary: INSUFFICIENT_EVIDENCE_MESSAGE,
        explanation: 'No capability available to explain.',
        confidence: 'low',
        confidenceReason: 'Missing capability.',
      })
    }
    const gap = cap.maturityTarget - cap.maturityCurrent
    const evidence = evidenceForEntities(ctx.repo, [cap.id])
    const conf = classifyConfidence({ evidence, metricComplete: true })
    return baseResponse({
      intent: 'explain_metric',
      tenantId: ctx.tenantId,
      summary: `${cap.name} maturity gap is ${gap.toFixed(1)} (current ${cap.maturityCurrent} → target ${cap.maturityTarget}).`,
      explanation: `Risk score ${cap.riskScore}; strategic importance ${cap.strategicImportance}. Gap is a simple subtraction of seeded maturity scores.`,
      evidenceIds: evidence.map((e) => e.id),
      entityRefs: [{ id: cap.id, type: 'capability', name: cap.name }],
      assumptions: ['Maturity scores are synthetic assessment inputs.'],
      confidence: conf.confidence,
      confidenceReason: conf.reason,
      facts: [`gap=${gap}`, `risk=${cap.riskScore}`],
      inferences: ['Larger gaps may justify roadmap investment — subject to validation.'],
      calculations: [
        {
          id: 'gap',
          label: 'Maturity gap',
          formula: 'maturityTarget - maturityCurrent',
          inputs: [cap.id],
          result: gap,
        },
      ],
    })
  }

  if (ctx.primaryEntity?.type === 'application' || key.includes('time')) {
    const app =
      (ctx.primaryEntity?.type === 'application' && ctx.repo.getApplication(ctx.primaryEntity.id)) ||
      ctx.pack.applications[0]
    if (!app) {
      return baseResponse({
        intent: 'insufficient_evidence',
        tenantId: ctx.tenantId,
        summary: INSUFFICIENT_EVIDENCE_MESSAGE,
        explanation: 'No application to classify.',
        confidence: 'low',
        confidenceReason: 'Missing application.',
      })
    }
    const time = classifyTIME(app)
    return baseResponse({
      intent: 'explain_metric',
      tenantId: ctx.tenantId,
      summary: `${app.name} TIME class is ${time}.`,
      explanation:
        'TIME rules evaluate Eliminate → Migrate → Invest → Tolerate using lifecycle, value, health, EOS and duplication inputs. First match wins.',
      entityRefs: [{ id: app.id, type: 'application', name: app.name }],
      evidenceIds: evidenceForEntities(ctx.repo, [app.id]).map((e) => e.id),
      assumptions: ['See METRIC_DEFINITIONS.md for full rule order.'],
      confidence: 'high',
      confidenceReason: 'Deterministic TIME classifier on application fields.',
      facts: [`time=${time}`, `value=${app.businessValue}`, `health=${app.technicalHealth}`],
      inferences: [],
    })
  }

  if (ctx.primaryEntity?.type === 'finding' || key.includes('severity') || key.includes('finding')) {
    const f =
      (ctx.primaryEntity?.type === 'finding' && ctx.repo.getFinding(ctx.primaryEntity.id)) ||
      ctx.pack.findings[0]
    if (!f) {
      return baseResponse({
        intent: 'insufficient_evidence',
        tenantId: ctx.tenantId,
        summary: INSUFFICIENT_EVIDENCE_MESSAGE,
        explanation: 'No finding selected.',
        confidence: 'low',
        confidenceReason: 'Missing finding.',
      })
    }
    const confScore = calculateFindingConfidence(f, ctx.pack.evidence)
    const evidence = f.evidenceIds.map((id) => ctx.repo.getEvidence(id)!).filter(Boolean)
    const conf = classifyConfidence({ evidence, metricComplete: true })
    return baseResponse({
      intent: 'explain_metric',
      tenantId: ctx.tenantId,
      summary: `${f.name}: severity ${f.severity}, risk score ${f.riskScore ?? 'n/a'}, evidence confidence ${confScore}.`,
      explanation: `Risk score = likelihood × impact (1–5 each). Finding confidence blends linked evidence reliability, freshness and verification.`,
      evidenceIds: f.evidenceIds,
      entityRefs: [{ id: f.id, type: 'finding', name: f.name }],
      assumptions: [],
      confidence: conf.confidence,
      confidenceReason: conf.reason,
      facts: [`severity=${f.severity}`, `riskScore=${f.riskScore}`, `evidenceConfidence=${confScore}`],
      inferences: [],
      calculations: [
        {
          id: 'risk',
          label: 'Risk score',
          formula: 'likelihood * impactScore',
          inputs: [f.id],
          result: f.riskScore ?? 0,
        },
      ],
    })
  }

  return baseResponse({
    intent: 'explain_metric',
    tenantId: ctx.tenantId,
    summary: `Enterprise health ${metrics.enterpriseHealth}; strategic alignment ${metrics.strategicAlignment}; critical risks ${metrics.criticalRiskCount}.`,
    explanation: 'Select a specific metric (Explain on a card) or name enterprise health, alignment, TIME, or a finding for a detailed breakdown.',
    confidence: 'medium',
    confidenceReason: 'General metric overview without a focused metric key.',
    facts: [],
    inferences: [],
    entityRefs: [],
    evidenceIds: [],
    assumptions: [],
  })
}

function answerRecommendationDraft(ctx: AIContext): Omit<EA360AIResponse, 'grounded' | 'groundingErrors'> {
  const finding =
    (ctx.primaryEntity?.type === 'finding' && ctx.repo.getFinding(ctx.primaryEntity.id)) ||
    ctx.pack.findings.find((f) => ctx.matchedEntities.some((m) => m.id === f.id && m.type === 'finding')) ||
    ctx.pack.findings.find((f) => f.severity === 'critical' && openFindingStatuses(f.status, f.workflowStatus))

  if (!finding) {
    return baseResponse({
      intent: 'insufficient_evidence',
      tenantId: ctx.tenantId,
      summary: INSUFFICIENT_EVIDENCE_MESSAGE,
      explanation: 'Select a validated finding before drafting a recommendation.',
      confidence: 'low',
      confidenceReason: 'No finding context.',
    })
  }

  const ws = coerceFindingWorkflowStatus(finding.workflowStatus ?? finding.status)
  if (!['Validated', 'Accepted', 'Remediation Planned'].includes(ws) && ws !== 'Under Review') {
    // Allow Accepted/Validated primarily; also open critical for demo if Accepted-like
    if (!['Validated', 'Accepted', 'Remediation Planned', 'Under Review', 'Draft'].includes(ws)) {
      return baseResponse({
        intent: 'insufficient_evidence',
        tenantId: ctx.tenantId,
        summary: 'Recommendation drafting is available for findings that are under review or validated — not rejected or unresolved drafts without review.',
        explanation: `Finding workflow status is ${ws}. Validate the finding before treating an AI draft as reviewable.`,
        confidence: 'low',
        confidenceReason: 'Finding not in an allowable drafting state.',
        entityRefs: [{ id: finding.id, type: 'finding', name: finding.name }],
      })
    }
  }

  if (isInsufficientlyEvidenced(finding, ctx.pack.evidence)) {
    return baseResponse({
      intent: 'insufficient_evidence',
      tenantId: ctx.tenantId,
      summary: INSUFFICIENT_EVIDENCE_MESSAGE,
      explanation: `Finding “${finding.name}” lacks sufficient verified evidence for a reliable draft.`,
      confidence: 'low',
      confidenceReason: 'Insufficient evidence on finding.',
      entityRefs: [{ id: finding.id, type: 'finding', name: finding.name }],
      evidenceIds: finding.evidenceIds,
    })
  }

  const evidence = finding.evidenceIds.map((id) => ctx.repo.getEvidence(id)!).filter(Boolean)
  const conf = classifyConfidence({
    evidence,
    dataQualityScores: [finding.dataQuality],
    assumptionCount: 3,
    metricComplete: true,
  })

  const draft: RecommendationDraftPayload = {
    findingId: finding.id,
    intendedOutcome: finding.recommendedAction || 'Reduce the recorded business impact of this finding.',
    problemAddressed: finding.problemStatement,
    recommendedAction: finding.recommendedAction,
    optionsConsidered: [
      finding.recommendedAction,
      'Contain risk with compensating controls only',
      'Defer pending further evidence',
    ],
    expectedBenefitBand: 'Indicative benefit band subject to validation — not a guaranteed return.',
    riskReductionRationale: finding.businessImpact,
    indicativeEffort: 'M',
    dependencies: finding.linkedObjectIds.slice(0, 4),
    assumptions: [
      'Owners remain accountable for scope.',
      'Evidence remains applicable through delivery.',
      'AI-assisted draft — requires architect validation.',
    ],
    supportingFindingIds: [finding.id],
    supportingEvidenceIds: finding.evidenceIds,
    affectedObjectIds: finding.linkedObjectIds,
    confidence: conf.confidence,
    aiAssisted: true,
    requiresArchitectValidation: true,
  }

  return baseResponse({
    intent: 'recommendation_draft',
    tenantId: ctx.tenantId,
    summary: `AI-assisted draft recommendation for “${finding.name}”. Requires architect validation — not saved, not submitted, not approved.`,
    explanation: [
      `Intended outcome: ${draft.intendedOutcome}`,
      `Problem: ${draft.problemAddressed}`,
      `Recommended action: ${draft.recommendedAction}`,
      `Options: ${draft.optionsConsidered.join(' | ')}`,
      `Expected benefit: ${draft.expectedBenefitBand}`,
      `Risk reduction: ${draft.riskReductionRationale}`,
      `Effort: ${draft.indicativeEffort}`,
      `Mark: AI-assisted draft — requires architect validation.`,
    ].join('\n'),
    whyItMatters: 'Accelerates drafting while preserving human governance gates.',
    evidenceIds: draft.supportingEvidenceIds,
    entityRefs: [
      { id: finding.id, type: 'finding', name: finding.name },
      ...refsFromIds(finding.linkedObjectIds.slice(0, 8), (id) => resolveRef(ctx.repo, id)),
    ],
    assumptions: draft.assumptions,
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: [`finding=${finding.id}`, `evidence=${finding.evidenceIds.length}`],
    inferences: ['Draft wording is templated from finding fields — not an autonomous decision.'],
    suggestedActions: [
      {
        id: 'save-draft',
        label: 'Save draft for review (does not submit)',
        action: 'save-recommendation-draft',
        entityId: finding.id,
        entityType: 'finding',
      },
      {
        id: 'open-finding',
        label: 'Open finding',
        action: 'select-entity',
        entityId: finding.id,
        entityType: 'finding',
      },
    ],
  })
}

function answerExecutiveBriefing(ctx: AIContext) {
  const role = ctx.briefingRole || 'Executive Committee'
  const metrics = deriveExecutiveMetrics({
    capabilities: ctx.pack.capabilities,
    applications: ctx.pack.applications,
    findings: ctx.pack.findings,
    initiatives: ctx.pack.initiatives,
    kpis: ctx.pack.kpis,
    recommendations: ctx.pack.recommendations,
  })
  const critical = ctx.pack.findings.filter(
    (f) => f.severity === 'critical' && openFindingStatuses(f.status, f.workflowStatus),
  )
  const pending = (ctx.pack.decisions ?? []).filter((d) => d.decisionStatus === 'Pending')
  const inits = ctx.pack.initiatives.filter((i) => i.horizon === 'now')
  const mutations = ctx.mutations || []
  const evidenceIds = [...new Set(critical.flatMap((f) => f.evidenceIds))].slice(0, 12)
  const evidence = evidenceIds.map((id) => ctx.repo.getEvidence(id)!).filter(Boolean)
  const conf = classifyConfidence({
    evidence,
    metricComplete: true,
    assumptionCount: 3,
  })

  const domain = ctx.filters?.domain
  const emphasis = ctx.briefingEmphasis || 'balanced'

  return baseResponse({
    intent: 'executive_briefing',
    tenantId: ctx.tenantId,
    summary: `Executive briefing for ${role} — ${ctx.pack.tenant.shortName} (synthetic).`,
    explanation: [
      `1. Enterprise position — Health ${metrics.enterpriseHealth}/100; alignment ${metrics.strategicAlignment}/100; maturity ${metrics.architectureMaturity}.`,
      `2. What changed — ${mutations.length ? `${mutations.length} local prototype mutation(s) since reset.` : 'No local mutations since last demo reset.'}`,
      `3. Top risks — ${critical
        .slice(0, 3)
        .map((f) => f.name)
        .join('; ') || 'None open critical'}.`,
      `4. Value / service impact — Indicative benefit bands only; validate before investment claims${domain ? ` (focus: ${domain})` : ''}.`,
      `5. Transformation progress — ${inits.length} initiative(s) in Now; mean progress reflected in health score.`,
      `6. Decisions required — ${pending.map((d) => d.name).join('; ') || 'No pending ARB items'}.`,
      `7. Recommended next actions — Review critical findings, clear ARB queue, confirm roadmap Now items.`,
      `8. Evidence limitations — ${evidence.filter((e) => (e.verificationStatus ?? '') !== 'verified').length} cited evidence item(s) not verified; treat inferences separately.`,
      `Emphasis: ${emphasis}.`,
    ].join('\n'),
    whyItMatters: 'Gives leaders a decision-oriented snapshot without architecture jargon or guaranteed financials.',
    evidenceIds,
    entityRefs: [
      ...critical.slice(0, 4).map((f) => ({ id: f.id, type: 'finding', name: f.name })),
      ...pending.map((d) => ({ id: d.id, type: 'decision', name: d.name })),
      ...inits.slice(0, 4).map((i) => ({ id: i.id, type: 'initiative', name: i.name })),
    ],
    assumptions: [
      'Synthetic GRA demonstration data — not official GRA architecture.',
      'Value figures are indicative bands subject to validation.',
      'Role filter changes narrative emphasis only; it does not change underlying facts.',
    ],
    confidence: conf.confidence,
    confidenceReason: conf.reason,
    facts: [
      `health=${metrics.enterpriseHealth}`,
      `critical=${critical.length}`,
      `pending=${pending.length}`,
      `nowInitiatives=${inits.length}`,
    ],
    inferences: ['Recommended next actions are suggestions for human review.'],
    suggestedActions: [
      { id: 'copy', label: 'Copy briefing text', action: 'copy-briefing' },
      { id: 'print', label: 'Print-friendly view', action: 'print-briefing' },
      { id: 'gov', label: 'Open decisions', action: 'navigate', view: 'governance' },
    ],
  })
}
