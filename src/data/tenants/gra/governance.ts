import type { TenantPack } from '../../../domain/schemas'
import {
  calculateFindingConfidence,
  calculateRiskScore,
  coerceFindingWorkflowStatus,
  coerceRecommendationWorkflowStatus,
  deriveFreshness,
} from '../../../domain/workflow'

const T = 'tenant-gra'

/** Seed Architecture Review Board decisions for GRA Phase 3 scenarios. */
export const graDecisions = [
  {
    ...decisionBase(
      'dec-gra-01',
      'Approve Unified Taxpayer View programme',
      'Architecture decision to establish a governed taxpayer domain service.',
    ),
    decisionType: 'Architecture',
    decisionStatus: 'Approved',
    decisionDate: '2026-03-18',
    decisionAuthority: 'Architecture Review Board',
    reviewerIds: ['person-cio', 'person-chief-architect', 'person-cdo'],
    requiredReviewerIds: ['person-cio', 'person-chief-architect'],
    recommendationId: 'rec-gra-01',
    optionsConsidered: ['Big-bang MDM replace', 'API facade over existing masters', 'Do nothing'],
    selectedOption: 'API facade over existing masters',
    rationale: 'Balances delivery risk with identity coherence; aligns with hub-first standards.',
    conditions: [],
    exceptions: [],
    expiryReviewDate: '2026-12-31',
    evidenceIds: ['ev-gra-01', 'ev-gra-05', 'ev-gra-08'],
    affectedObjectIds: ['cap-gra-02', 'app-gra-08', 'app-gra-01', 'data-gra-01'],
    initiativeId: 'init-gra-01',
    submittedAt: '2026-03-01',
    decisionDeadline: '2026-03-20',
    businessDomain: 'Taxpayer',
    riskSeverity: 'critical' as const,
    expectedValue: 'Indicative annual benefit: GHS 10–20 million, subject to validation',
    status: 'approved' as const,
  },
  {
    ...decisionBase(
      'dec-gra-02',
      'Conditional approval — payment confirmation resilience',
      'Approve resilient event-driven payment confirmation with monitoring conditions.',
    ),
    decisionType: 'Remediation',
    decisionStatus: 'Approved with Conditions',
    decisionDate: '2026-05-12',
    decisionAuthority: 'Architecture Review Board',
    reviewerIds: ['person-cio', 'person-cto', 'person-cro'],
    requiredReviewerIds: ['person-cto', 'person-cro'],
    recommendationId: 'rec-gra-08',
    optionsConsidered: [
      'Strengthen batch retries only',
      'Event-driven confirmation with DLQ',
      'Defer until hub rewrite',
    ],
    selectedOption: 'Event-driven confirmation with DLQ',
    rationale: 'Critical payment path needs resilience before peak filing season.',
    conditions: [
      'Publish runbook and on-call rota before go-live',
      'Demonstrate reconciliation lag ≤ 15 minutes in UAT',
    ],
    exceptions: ['Legacy bank file adapters may remain for two quarters'],
    expiryReviewDate: '2026-11-30',
    evidenceIds: ['ev-gra-10', 'ev-gra-11'],
    affectedObjectIds: ['int-gra-05', 'app-gra-05', 'cap-gra-05'],
    initiativeId: 'init-gra-06',
    submittedAt: '2026-04-28',
    decisionDeadline: '2026-05-15',
    businessDomain: 'Payments',
    riskSeverity: 'critical' as const,
    expectedValue: 'Indicative availability uplift: 99.5% → 99.9% path, subject to validation',
    status: 'approved' as const,
  },
  {
    ...decisionBase(
      'dec-gra-03',
      'Approve revenue assurance automation',
      'Approve automated matching and exception management for revenue assurance.',
    ),
    decisionType: 'Investment',
    decisionStatus: 'Approved',
    decisionDate: '2026-06-02',
    decisionAuthority: 'Architecture Review Board',
    reviewerIds: ['person-cro', 'person-cio', 'person-chief-architect'],
    requiredReviewerIds: ['person-cro', 'person-cio'],
    recommendationId: 'rec-gra-03',
    optionsConsidered: ['Enhance warehouse matching', 'Operational matching service', 'More staff'],
    selectedOption: 'Operational matching service',
    rationale: 'Operational service shortens cycle time without waiting for warehouse redesign.',
    conditions: [],
    exceptions: [],
    expiryReviewDate: '2027-01-31',
    evidenceIds: ['ev-gra-03', 'ev-gra-06'],
    affectedObjectIds: ['cap-gra-06', 'app-gra-06', 'prc-gra-05'],
    initiativeId: 'init-gra-03',
    submittedAt: '2026-05-20',
    decisionDeadline: '2026-06-05',
    businessDomain: 'Assurance',
    riskSeverity: 'high' as const,
    expectedValue: 'Indicative leakage-risk reduction band: 15–30%, subject to validation',
    status: 'approved' as const,
  },
  {
    ...decisionBase(
      'dec-gra-04',
      'Pending — API-led identity access wave',
      'ARB review of consolidating identity lookups via Integration Hub.',
    ),
    decisionType: 'Architecture',
    decisionStatus: 'Pending',
    decisionAuthority: 'Architecture Review Board',
    reviewerIds: ['person-chief-architect', 'person-cto'],
    requiredReviewerIds: ['person-chief-architect', 'person-cio'],
    recommendationId: 'rec-gra-02',
    optionsConsidered: ['Mediate all traffic immediately', 'Migrate identity APIs first', 'Continue P2P'],
    evidenceIds: ['ev-gra-02', 'ev-gra-07'],
    affectedObjectIds: ['cap-gra-08', 'app-gra-07', 'int-gra-01'],
    submittedAt: '2026-08-15',
    decisionDeadline: '2026-09-30',
    businessDomain: 'Integration',
    riskSeverity: 'critical' as const,
    expectedValue: 'Lower change cost; improved resilience',
    status: 'proposed' as const,
  },
]

function decisionBase(id: string, name: string, description: string) {
  return {
    id,
    tenantId: T,
    name,
    description,
    ownerId: 'person-chief-architect',
    createdAt: '2026-01-15',
    updatedAt: '2026-08-01',
    dataQuality: 'high' as const,
    sourceRefs: ['synthetic'],
    tags: ['arb', 'governance'],
  }
}

const EXTRA_EVIDENCE = [
  {
    id: 'ev-gra-10',
    tenantId: T,
    name: 'Payment confirmation outage summary',
    description: 'Synthetic incident summary for payment confirmation lag spikes.',
    status: 'active' as const,
    ownerId: 'person-cto',
    createdAt: '2026-04-01',
    updatedAt: '2026-04-10',
    dataQuality: 'high' as const,
    sourceRefs: ['synthetic'],
    tags: ['resilience'],
    evidenceType: 'incident-summary' as const,
    confidence: 'high' as const,
    linkedObjectIds: ['int-gra-05', 'app-gra-05', 'cap-gra-05'],
    sourceName: 'Operations bridge',
    sourceReference: 'INC-2026-0412',
    sourceDate: '2026-04-08',
    capturedDate: '2026-04-10',
    freshness: 'fresh' as const,
    reliability: 'high' as const,
    verificationStatus: 'verified' as const,
    relatedFindingIds: ['find-gra-10'],
    notes: [],
    previewText:
      'Confirmation lag exceeded 45 minutes during peak window; batch retry exhausted without operator alert.',
  },
  {
    id: 'ev-gra-11',
    tenantId: T,
    name: 'Integration monitoring coverage report',
    description: 'Coverage of critical payment integrations under active monitoring.',
    status: 'active' as const,
    ownerId: 'person-chief-architect',
    createdAt: '2026-03-20',
    updatedAt: '2026-05-01',
    dataQuality: 'medium' as const,
    sourceRefs: ['synthetic'],
    tags: ['monitoring'],
    evidenceType: 'operational-report' as const,
    confidence: 'medium' as const,
    linkedObjectIds: ['int-gra-05', 'app-gra-07'],
    sourceName: 'Integration ops',
    sourceReference: 'MON-Q1-2026',
    sourceDate: '2026-03-31',
    capturedDate: '2026-04-02',
    freshness: 'aging' as const,
    reliability: 'medium' as const,
    verificationStatus: 'unverified' as const,
    relatedFindingIds: ['find-gra-10'],
    notes: [],
    previewText: 'Payment confirmation channel has basic uptime checks; no dead-letter or lag SLO.',
  },
]

const EXTRA_FINDING = {
  id: 'find-gra-10',
  tenantId: T,
  name: 'Payment confirmation path lacks resilience',
  description: 'Critical payment confirmation depends on fragile batch/P2P paths without DLQ.',
  status: 'open' as const,
  ownerId: 'person-cto',
  createdAt: '2026-04-12',
  updatedAt: '2026-05-01',
  dataQuality: 'high' as const,
  sourceRefs: ['synthetic'],
  tags: ['resilience', 'payments'],
  category: 'Operational resilience',
  severity: 'critical' as const,
  problemStatement:
    'Payment confirmation to taxpayers and ledgers can stall without automated recovery.',
  rootCause: 'Point-to-point/batch confirmation without event buffering or monitored retries.',
  businessImpact: 'Delayed receipts, reconciliation backlog, and taxpayer trust erosion.',
  urgency: 'critical' as const,
  evidenceIds: ['ev-gra-10', 'ev-gra-11'],
  linkedObjectIds: ['int-gra-05', 'app-gra-05', 'cap-gra-05', 'cap-gra-21'],
  targetDate: '2026-10-31',
  recommendedAction: 'Introduce resilient event-driven confirmation with monitoring SLOs.',
  workflowStatus: 'Accepted',
  likelihood: 4,
  impactScore: 5,
  riskScore: 20,
  businessOwnerId: 'person-cro',
  architectureOwnerId: 'person-cto',
  dateIdentified: '2026-04-12',
  lastReviewedDate: '2026-05-01',
  domain: 'Payments',
  recommendationIds: ['rec-gra-08'],
  decisionIds: ['dec-gra-02'],
  initiativeIds: ['init-gra-06'],
}

const EXTRA_RECOMMENDATION = {
  id: 'rec-gra-08',
  tenantId: T,
  name: 'Resilient event-driven payment confirmation',
  description: 'Replace fragile confirmation path with buffered events, DLQ and lag SLOs.',
  status: 'approved' as const,
  ownerId: 'person-cto',
  createdAt: '2026-04-20',
  updatedAt: '2026-05-12',
  dataQuality: 'high' as const,
  sourceRefs: ['synthetic'],
  tags: ['payments', 'resilience'],
  outcome: 'Reliable payment confirmation with monitored recovery.',
  findingIds: ['find-gra-10'],
  affectedCapabilityIds: ['cap-gra-05', 'cap-gra-21'],
  affectedApplicationIds: ['app-gra-05', 'app-gra-07'],
  optionsConsidered: [
    'Strengthen batch retries only',
    'Event-driven confirmation with DLQ',
    'Defer until hub rewrite',
  ],
  expectedValue: 'Indicative availability uplift toward 99.9%, subject to validation',
  riskReduction: 'Critical confirmation outage exposure',
  effortBand: 'L' as const,
  confidence: 'high' as const,
  assumptions: ['Message platform capacity is available', 'Banks retain dual-run for one season'],
  workflowStatus: 'Approved',
  intendedOutcome: 'Resilient confirmation and faster reconciliation',
  preferredOption: 'Event-driven confirmation with DLQ',
  expectedBenefit: 'Indicative availability uplift toward 99.9%, subject to validation',
  expectedRiskReduction: 'Critical confirmation outage exposure',
  costBand: 'GHS 5–9m',
  complexity: 'high' as const,
  dependencies: ['Integration Hub monitoring baseline'],
  evidenceIds: ['ev-gra-10', 'ev-gra-11'],
  affectedIntegrationIds: ['int-gra-05'],
  objectiveIds: ['obj-gra-01', 'obj-gra-03'],
  kpiIds: ['kpi-gra-07', 'kpi-gra-08'],
  decisionId: 'dec-gra-02',
  targetDecisionDate: '2026-05-15',
  reviewComments: [],
}

const EXTRA_INITIATIVE = {
  id: 'init-gra-06',
  tenantId: T,
  name: 'Payment confirmation modernisation',
  description: 'Deliver resilient event-driven payment confirmation with monitoring.',
  status: 'in_progress' as const,
  ownerId: 'person-cto',
  createdAt: '2026-05-15',
  updatedAt: '2026-08-01',
  dataQuality: 'high' as const,
  sourceRefs: ['synthetic'],
  tags: ['payments'],
  recommendationIds: ['rec-gra-08'],
  objectiveIds: ['obj-gra-01', 'obj-gra-03'],
  capabilityIds: ['cap-gra-05', 'cap-gra-21'],
  horizon: 'now' as const,
  expectedValue: 'Indicative availability uplift toward 99.9%, subject to validation',
  costBand: 'GHS 5–9m',
  riskReduction: 'Critical confirmation outage exposure',
  progressPercent: 18,
  decisionId: 'dec-gra-02',
  applicationIds: ['app-gra-05', 'app-gra-07'],
  integrationIds: ['int-gra-05'],
  findingIds: ['find-gra-10'],
  kpiIds: ['kpi-gra-07', 'kpi-gra-08'],
  dependsOnInitiativeIds: ['init-gra-02'],
  targetQuarter: '2026-Q4',
  targetPeriod: 'FY2026 Q4',
  intendedOutcome: 'Resilient confirmation and faster reconciliation',
  effortBand: 'L',
}

const EXTRA_KPIS = [
  {
    id: 'kpi-gra-07',
    tenantId: T,
    name: 'Payment confirmation availability',
    description: 'Synthetic availability of payment confirmation channel.',
    status: 'active' as const,
    ownerId: 'person-cto',
    createdAt: '2026-05-01',
    updatedAt: '2026-08-01',
    dataQuality: 'medium' as const,
    sourceRefs: ['synthetic'],
    tags: ['resilience'],
    unit: '%',
    currentValue: 99.5,
    targetValue: 99.9,
    direction: 'higher-better' as const,
    linkedObjectiveIds: ['obj-gra-01'],
    category: 'Resilience',
    baselineValue: 99.2,
    measurementFrequency: 'Weekly',
    expectedContribution: 'Initiative targets ~0.4pp availability uplift band',
    confidence: 'medium' as const,
    linkedInitiativeIds: ['init-gra-06'],
  },
  {
    id: 'kpi-gra-08',
    tenantId: T,
    name: 'Payment reconciliation lag',
    description: 'Minutes from bank confirmation to ledger match.',
    status: 'active' as const,
    ownerId: 'person-cro',
    createdAt: '2026-05-01',
    updatedAt: '2026-08-01',
    dataQuality: 'medium' as const,
    sourceRefs: ['synthetic'],
    tags: ['payments'],
    unit: 'minutes',
    currentValue: 42,
    targetValue: 15,
    direction: 'lower-better' as const,
    linkedObjectiveIds: ['obj-gra-02'],
    category: 'Risk reduction',
    baselineValue: 55,
    measurementFrequency: 'Daily',
    expectedContribution: 'Event path expected to cut lag into 10–20 minute band',
    confidence: 'medium' as const,
    linkedInitiativeIds: ['init-gra-06'],
  },
]

/**
 * Enrich GRA pack with Phase 3 workflow fields, decisions, and E2E scenario entities.
 */
export function applyPhase3Enrichment(pack: TenantPack): TenantPack {
  const next = structuredClone(pack) as TenantPack

  // Merge extra evidence / findings / recommendations / initiatives / kpis if missing
  for (const e of EXTRA_EVIDENCE) {
    if (!next.evidence.some((x) => x.id === e.id)) next.evidence.push(e)
  }
  if (!next.findings.some((x) => x.id === EXTRA_FINDING.id)) next.findings.push(EXTRA_FINDING)
  if (!next.recommendations.some((x) => x.id === EXTRA_RECOMMENDATION.id)) {
    next.recommendations.push(EXTRA_RECOMMENDATION)
  }
  if (!next.initiatives.some((x) => x.id === EXTRA_INITIATIVE.id)) {
    next.initiatives.push(EXTRA_INITIATIVE)
  }
  for (const k of EXTRA_KPIS) {
    if (!next.kpis.some((x) => x.id === k.id)) next.kpis.push(k)
  }

  next.decisions = structuredClone(graDecisions) as TenantPack['decisions']

  next.evidence = next.evidence.map((e) => ({
    ...e,
    sourceName: e.sourceName ?? e.name,
    sourceReference: e.sourceReference ?? e.id.toUpperCase(),
    sourceDate: e.sourceDate ?? e.createdAt,
    capturedDate: e.capturedDate ?? e.updatedAt,
    freshness: e.freshness ?? deriveFreshness(e),
    reliability: e.reliability ?? e.confidence,
    verificationStatus:
      e.verificationStatus ??
      (e.confidence === 'high' ? 'verified' : e.confidence === 'low' ? 'unverified' : 'unverified'),
    relatedFindingIds:
      e.relatedFindingIds ??
      next.findings.filter((f) => f.evidenceIds.includes(e.id)).map((f) => f.id),
    notes: e.notes ?? [],
    previewText: e.previewText ?? e.description,
  }))

  next.findings = next.findings.map((f) => {
    const likelihood = f.likelihood ?? (f.severity === 'critical' ? 5 : f.severity === 'high' ? 4 : 3)
    const impactScore = f.impactScore ?? (f.urgency === 'critical' ? 5 : f.urgency === 'high' ? 4 : 3)
    const riskScore = f.riskScore ?? calculateRiskScore(likelihood, impactScore)
    const workflowStatus = f.workflowStatus ?? coerceFindingWorkflowStatus(f.status)
    const confidenceScore =
      f.confidenceScore ?? calculateFindingConfidence(f, next.evidence)
    const recommendationIds =
      f.recommendationIds ??
      next.recommendations.filter((r) => r.findingIds.includes(f.id)).map((r) => r.id)
    const decisionIds =
      f.decisionIds ??
      next.decisions
        .filter((d) => recommendationIds.includes(d.recommendationId))
        .map((d) => d.id)
    const initiativeIds =
      f.initiativeIds ??
      next.initiatives
        .filter((i) => i.recommendationIds.some((rid) => recommendationIds.includes(rid)))
        .map((i) => i.id)

    return {
      ...f,
      workflowStatus,
      likelihood,
      impactScore,
      riskScore,
      confidenceScore,
      businessOwnerId: f.businessOwnerId ?? f.ownerId,
      architectureOwnerId: f.architectureOwnerId ?? 'person-chief-architect',
      dateIdentified: f.dateIdentified ?? f.createdAt,
      lastReviewedDate: f.lastReviewedDate ?? f.updatedAt,
      relatedRiskIds: f.relatedRiskIds ?? [],
      recommendationIds,
      decisionIds,
      initiativeIds,
      domain: f.domain ?? f.category.split('/')[0]?.trim() ?? 'Enterprise',
    }
  })

  next.recommendations = next.recommendations.map((r) => {
    const workflowStatus = r.workflowStatus ?? coerceRecommendationWorkflowStatus(r.status)
    const decision = next.decisions.find((d) => d.recommendationId === r.id)
    return {
      ...r,
      workflowStatus,
      intendedOutcome: r.intendedOutcome ?? r.outcome,
      preferredOption: r.preferredOption ?? r.optionsConsidered[0],
      expectedBenefit: r.expectedBenefit ?? r.expectedValue,
      expectedRiskReduction: r.expectedRiskReduction ?? r.riskReduction,
      costBand: r.costBand ?? 'TBD',
      complexity: r.complexity ?? (r.effortBand === 'XL' || r.effortBand === 'L' ? 'high' : 'medium'),
      dependencies: r.dependencies ?? [],
      evidenceIds:
        r.evidenceIds ??
        Array.from(
          new Set(
            r.findingIds.flatMap(
              (fid) => next.findings.find((f) => f.id === fid)?.evidenceIds ?? [],
            ),
          ),
        ),
      affectedIntegrationIds: r.affectedIntegrationIds ?? [],
      objectiveIds: r.objectiveIds ?? [],
      kpiIds: r.kpiIds ?? [],
      decisionId: r.decisionId ?? decision?.id,
      targetDecisionDate: r.targetDecisionDate ?? decision?.decisionDeadline,
      reviewComments: r.reviewComments ?? [],
    }
  })

  // Scenario wiring for Unified Taxpayer + Assurance
  const patchRec = (id: string, patch: Record<string, unknown>) => {
    const idx = next.recommendations.findIndex((r) => r.id === id)
    if (idx >= 0) next.recommendations[idx] = { ...next.recommendations[idx], ...patch }
  }
  patchRec('rec-gra-01', {
    workflowStatus: 'Converted to Initiative',
    status: 'completed',
    preferredOption: 'API facade over existing masters',
    costBand: 'GHS 8–12m',
    objectiveIds: ['obj-gra-01'],
    kpiIds: ['kpi-gra-01'],
    decisionId: 'dec-gra-01',
    evidenceIds: ['ev-gra-01', 'ev-gra-05', 'ev-gra-08'],
  })
  patchRec('rec-gra-03', {
    workflowStatus: 'Converted to Initiative',
    status: 'completed',
    preferredOption: 'Operational matching service',
    costBand: 'GHS 4–7m',
    objectiveIds: ['obj-gra-02'],
    kpiIds: ['kpi-gra-02', 'kpi-gra-06'],
    decisionId: 'dec-gra-03',
    evidenceIds: ['ev-gra-03', 'ev-gra-06'],
  })
  patchRec('rec-gra-02', {
    workflowStatus: 'Under Review',
    status: 'in_progress',
    decisionId: 'dec-gra-04',
    preferredOption: 'Migrate identity APIs first',
    costBand: 'GHS 3–5m',
    objectiveIds: ['obj-gra-03'],
    kpiIds: ['kpi-gra-03', 'kpi-gra-04'],
  })

  next.initiatives = next.initiatives.map((i) => {
    const rec = next.recommendations.find((r) => i.recommendationIds.includes(r.id))
    const decision = next.decisions.find(
      (d) => d.initiativeId === i.id || (rec && d.recommendationId === rec.id),
    )
    return {
      ...i,
      decisionId: i.decisionId ?? decision?.id,
      applicationIds: i.applicationIds ?? rec?.affectedApplicationIds ?? [],
      integrationIds: i.integrationIds ?? rec?.affectedIntegrationIds ?? [],
      findingIds: i.findingIds ?? rec?.findingIds ?? [],
      kpiIds: i.kpiIds ?? rec?.kpiIds ?? [],
      dependsOnInitiativeIds: i.dependsOnInitiativeIds ?? [],
      targetQuarter:
        i.targetQuarter ??
        (i.horizon === 'now' ? '2026-Q3' : i.horizon === 'next' ? '2026-Q4' : '2027-Q2'),
      targetPeriod: i.targetPeriod ?? `FY${i.targetQuarter?.startsWith('2027') ? '2027' : '2026'}`,
      intendedOutcome: i.intendedOutcome ?? rec?.outcome ?? i.expectedValue,
      effortBand: i.effortBand ?? rec?.effortBand,
    }
  })

  next.kpis = next.kpis.map((k) => ({
    ...k,
    category:
      k.category ??
      (k.id.includes('01')
        ? 'Service experience'
        : k.id.includes('02') || k.id.includes('06')
          ? 'Risk reduction'
          : k.id.includes('03') || k.id.includes('04')
            ? 'Architecture maturity'
            : 'Delivery performance'),
    baselineValue: k.baselineValue ?? Math.round(k.currentValue * 0.9),
    measurementFrequency: k.measurementFrequency ?? 'Monthly',
    expectedContribution: k.expectedContribution ?? 'Linked initiative expected contribution band',
    confidence: k.confidence ?? 'medium',
    linkedInitiativeIds:
      k.linkedInitiativeIds ??
      next.initiatives.filter((i) => (i.kpiIds ?? []).includes(k.id)).map((i) => i.id),
  }))

  // Relationships for new scenario entities
  const extraRels = [
    {
      id: 'rel-gra-p3-01',
      tenantId: T,
      sourceId: 'find-gra-10',
      sourceType: 'finding',
      targetId: 'int-gra-05',
      targetType: 'integration',
      relationshipType: 'addresses',
      criticality: 'critical' as const,
      evidenceIds: ['ev-gra-10'],
      description: 'Finding targets payment confirmation integration',
    },
    {
      id: 'rel-gra-p3-02',
      tenantId: T,
      sourceId: 'rec-gra-08',
      sourceType: 'recommendation',
      targetId: 'find-gra-10',
      targetType: 'finding',
      relationshipType: 'addresses',
      criticality: 'critical' as const,
      evidenceIds: ['ev-gra-10'],
      description: 'Resilience recommendation addresses confirmation finding',
    },
    {
      id: 'rel-gra-p3-03',
      tenantId: T,
      sourceId: 'dec-gra-02',
      sourceType: 'decision',
      targetId: 'rec-gra-08',
      targetType: 'recommendation',
      relationshipType: 'decides',
      criticality: 'critical' as const,
      evidenceIds: ['ev-gra-10'],
      description: 'Conditional ARB decision on payment resilience',
    },
    {
      id: 'rel-gra-p3-04',
      tenantId: T,
      sourceId: 'init-gra-06',
      sourceType: 'initiative',
      targetId: 'dec-gra-02',
      targetType: 'decision',
      relationshipType: 'implements',
      criticality: 'high' as const,
      evidenceIds: [],
      description: 'Initiative implements approved decision',
    },
    {
      id: 'rel-gra-p3-05',
      tenantId: T,
      sourceId: 'dec-gra-01',
      sourceType: 'decision',
      targetId: 'rec-gra-01',
      targetType: 'recommendation',
      relationshipType: 'decides',
      criticality: 'critical' as const,
      evidenceIds: ['ev-gra-01'],
      description: 'ARB approved unified taxpayer view',
    },
    {
      id: 'rel-gra-p3-06',
      tenantId: T,
      sourceId: 'dec-gra-03',
      sourceType: 'decision',
      targetId: 'rec-gra-03',
      targetType: 'recommendation',
      relationshipType: 'decides',
      criticality: 'high' as const,
      evidenceIds: ['ev-gra-06'],
      description: 'ARB approved assurance automation',
    },
    {
      id: 'rel-gra-p3-07',
      tenantId: T,
      sourceId: 'kpi-gra-07',
      sourceType: 'kpi',
      targetId: 'init-gra-06',
      targetType: 'initiative',
      relationshipType: 'measures',
      evidenceIds: [],
      description: 'Availability KPI linked to confirmation initiative',
    },
  ]

  for (const rel of extraRels) {
    if (!next.relationships.some((r) => r.id === rel.id)) next.relationships.push(rel)
  }

  next.auditHistory = next.auditHistory?.length
    ? next.auditHistory
    : [
        {
          id: 'audit-gra-01',
          tenantId: T,
          action: 'decision_recorded',
          actorRole: 'enterprise-architect',
          timestamp: '2026-03-18T10:00:00.000Z',
          entityId: 'dec-gra-01',
          entityType: 'decision',
          previousState: 'Pending',
          newState: 'Approved',
          comment: 'Unified Taxpayer View approved',
        },
        {
          id: 'audit-gra-02',
          tenantId: T,
          action: 'decision_recorded',
          actorRole: 'cio',
          timestamp: '2026-05-12T14:30:00.000Z',
          entityId: 'dec-gra-02',
          entityType: 'decision',
          previousState: 'Pending',
          newState: 'Approved with Conditions',
          comment: 'Payment resilience conditional approval',
        },
        {
          id: 'audit-gra-03',
          tenantId: T,
          action: 'initiative_created',
          actorRole: 'transformation-leader',
          timestamp: '2026-05-15T09:00:00.000Z',
          entityId: 'init-gra-06',
          entityType: 'initiative',
          newState: 'in_progress',
          comment: 'Created from dec-gra-02',
        },
      ]

  return next
}
