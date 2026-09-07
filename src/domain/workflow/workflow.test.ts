import { describe, expect, it, beforeEach } from 'vitest'
import {
  calculateRiskScore,
  calculateFindingConfidence,
  canTransitionFinding,
  canTransitionRecommendation,
  canTransitionDecision,
  canCreateInitiativeFromRecommendation,
  canCreateInitiativeFromDecision,
  validateInitiativeDraft,
  mapRecommendationToInitiativeDraft,
  placeOnRoadmap,
  detectBlockedInitiatives,
  coerceFindingWorkflowStatus,
} from './index'
import { clearTenantCache, loadTenantPack } from '../../data/repositories/tenantRepository'
import { usePrototypeStore } from '../../state/prototypeStore'

describe('workflow scoring', () => {
  it('calculates risk score as likelihood × impact', () => {
    expect(calculateRiskScore(5, 5)).toBe(25)
    expect(calculateRiskScore(3, 4)).toBe(12)
    expect(calculateRiskScore(0, 9)).toBe(5) // clamped
  })

  it('derives finding confidence from evidence', () => {
    const finding = { evidenceIds: ['e1'] }
    const evidence = [
      {
        id: 'e1',
        confidence: 'high',
        reliability: 'high',
        verificationStatus: 'verified',
        freshness: 'fresh',
        sourceDate: '2026-08-01',
      },
    ]
    expect(calculateFindingConfidence(finding as never, evidence as never)).toBeGreaterThan(70)
    expect(calculateFindingConfidence({ evidenceIds: [] }, [])).toBe(15)
  })
})

describe('workflow transitions', () => {
  it('allows valid finding transitions and blocks invalid ones', () => {
    expect(canTransitionFinding('Draft', 'Under Review')).toBe(true)
    expect(canTransitionFinding('Draft', 'Resolved')).toBe(false)
    expect(canTransitionFinding('Validated', 'Accepted')).toBe(true)
  })

  it('enforces recommendation approval before conversion', () => {
    expect(canTransitionRecommendation('Draft', 'Approved')).toBe(false)
    expect(canTransitionRecommendation('Under Review', 'Approved')).toBe(true)
    expect(canTransitionRecommendation('Approved', 'Converted to Initiative')).toBe(true)
  })

  it('enforces decision transitions', () => {
    expect(canTransitionDecision('Pending', 'Approved')).toBe(true)
    expect(canTransitionDecision('Approved', 'Rejected')).toBe(false)
  })

  it('coerces legacy statuses', () => {
    expect(coerceFindingWorkflowStatus('open')).toBe('Accepted')
    expect(coerceFindingWorkflowStatus('mitigated')).toBe('Resolved')
  })
})

describe('initiative creation rules', () => {
  it('rejects unapproved recommendations', () => {
    const result = canCreateInitiativeFromRecommendation({
      workflowStatus: 'Draft',
      status: 'draft',
    } as never)
    expect(result.ok).toBe(false)
  })

  it('allows approved recommendations', () => {
    expect(
      canCreateInitiativeFromRecommendation({ workflowStatus: 'Approved', status: 'approved' } as never)
        .ok,
    ).toBe(true)
  })

  it('requires approved decision', () => {
    expect(canCreateInitiativeFromDecision({ decisionStatus: 'Pending' } as never).ok).toBe(false)
    expect(canCreateInitiativeFromDecision({ decisionStatus: 'Approved' } as never).ok).toBe(true)
    expect(
      canCreateInitiativeFromDecision({ decisionStatus: 'Approved with Conditions' } as never).ok,
    ).toBe(true)
  })

  it('validates initiative draft requirements', () => {
    const bad = validateInitiativeDraft({
      title: '',
      intendedOutcome: '',
      ownerId: '',
      objectiveIds: [],
      capabilityIds: [],
      applicationIds: [],
      integrationIds: [],
      findingIds: [],
      recommendationId: 'r1',
      decisionId: '',
      expectedBenefit: '',
      expectedRiskReduction: '',
      costBand: '',
      effortBand: '',
      dependencies: [],
      targetPeriod: '',
      horizon: 'next',
      targetQuarter: '',
      kpiIds: [],
    })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.errors.length).toBeGreaterThan(2)

    const good = validateInitiativeDraft({
      title: 'Test',
      intendedOutcome: 'Outcome',
      ownerId: 'person-cio',
      objectiveIds: ['obj-1'],
      capabilityIds: [],
      applicationIds: [],
      integrationIds: [],
      findingIds: [],
      recommendationId: 'r1',
      decisionId: 'd1',
      expectedBenefit: 'Band',
      expectedRiskReduction: 'Risk',
      costBand: 'M',
      effortBand: 'M',
      dependencies: [],
      targetPeriod: 'FY2026 Q4',
      horizon: 'next',
      targetQuarter: '2026-Q4',
      kpiIds: ['kpi-1'],
    })
    expect(good.ok).toBe(true)
  })

  it('maps recommendation to initiative draft', () => {
    const draft = mapRecommendationToInitiativeDraft(
      {
        id: 'rec-1',
        name: 'Rec',
        outcome: 'Better identity',
        ownerId: 'person-a',
        affectedCapabilityIds: ['c1'],
        affectedApplicationIds: ['a1'],
        findingIds: ['f1'],
        expectedValue: 'Value band',
        riskReduction: 'Risk',
        effortBand: 'L',
      } as never,
      { id: 'dec-1' } as never,
    )
    expect(draft.decisionId).toBe('dec-1')
    expect(draft.recommendationId).toBe('rec-1')
    expect(draft.capabilityIds).toContain('c1')
  })

  it('places initiatives on roadmap and detects blockers', () => {
    const placed = placeOnRoadmap(
      { id: 'i1', horizon: 'later', progressPercent: 0 } as never,
      'now',
      '2026-Q3',
    )
    expect(placed.horizon).toBe('now')
    expect(placed.targetQuarter).toBe('2026-Q3')

    const blocked = detectBlockedInitiatives([
      { id: 'i1', dependsOnInitiativeIds: [], progressPercent: 10, status: 'in_progress' },
      { id: 'i2', dependsOnInitiativeIds: ['i1'], progressPercent: 0, status: 'proposed' },
    ] as never)
    expect(blocked.find((b) => b.id === 'i2')?.blockedBy).toContain('i1')
  })
})

describe('GRA pack phase 3 enrichment', () => {
  beforeEach(() => clearTenantCache())

  it('validates enriched pack with decisions and audit history', () => {
    const pack = loadTenantPack('GRA', { bypassCache: true })
    expect(pack.decisions.length).toBeGreaterThanOrEqual(3)
    expect(pack.findings.every((f) => (f.evidenceIds?.length ?? 0) > 0 || f.dataQuality === 'low')).toBe(
      true,
    )
    expect(pack.auditHistory.length).toBeGreaterThan(0)
    expect(pack.recommendations.find((r) => r.id === 'rec-gra-08')).toBeTruthy()
    expect(pack.initiatives.find((i) => i.id === 'init-gra-06')).toBeTruthy()
  })
})

describe('prototype store workflow journey', () => {
  beforeEach(() => {
    clearTenantCache()
    usePrototypeStore.getState().resetDemo()
  })

  it('runs finding → evidence → recommendation → decision → initiative → roadmap → reset', () => {
    const store = usePrototypeStore.getState()
    store.resetDemo()

    // Open critical finding and validate path
    const finding = store.getRepo().listFindings().find((f) => f.id === 'find-gra-01')
    expect(finding).toBeTruthy()

    // Evidence verify
    const ev = finding!.evidenceIds[0]
    expect(store.markVerified({ id: ev }).ok).toBe(true)
    expect(store.getRepo().getEvidence(ev)?.verificationStatus).toBe('verified')

    // Use a draft-like finding for transition: find-gra-05 may be remediation
    // Create recommendation from finding works
    const created = store.createRecommendationFromFinding({ id: 'find-gra-09' })
    expect(created.ok).toBe(true)

    // Submit + approve recommendation path on a Ready/Under Review item
    const pendingDec = store.getArbQueue().find((d) => d.id === 'dec-gra-04')
    expect(pendingDec).toBeTruthy()

    expect(store.approveDecision({ id: 'dec-gra-04', rationale: 'Proceed with identity APIs' }).ok).toBe(
      true,
    )
    expect(store.getRepo().getDecision('dec-gra-04')?.decisionStatus).toBe('Approved')

    expect(store.approve({ id: 'rec-gra-02' }).ok).toBe(true)

    const initResult = store.createInitiative({
      decisionId: 'dec-gra-04',
      name: 'API-led identity wave initiative',
      description: 'Migrate identity APIs first',
      ownerId: 'person-chief-architect',
      objectiveIds: ['obj-gra-03'],
      capabilityIds: ['cap-gra-08'],
      recommendationIds: ['rec-gra-02'],
      expectedValue: 'Lower change cost',
      riskReduction: 'P2P concentration',
      costBand: 'GHS 3–5m',
      horizon: 'next',
      kpiIds: ['kpi-gra-03'],
      targetPeriod: 'FY2026 Q4',
      targetQuarter: '2026-Q4',
    } as never)
    expect(initResult.ok).toBe(true)
    expect(initResult.id).toBeTruthy()

    const moved = store.moveInitiativeHorizon({ id: initResult.id!, horizon: 'now' })
    expect(moved.ok).toBe(true)
    expect(store.getRepo().getInitiative(initResult.id!)?.horizon).toBe('now')

    // KPI linkage visible
    const kpi = store.getRepo().getKpi('kpi-gra-03')
    expect(kpi?.linkedInitiativeIds?.includes(initResult.id!)).toBe(true)

    // Audit history grew
    expect(store.listAuditHistory().length).toBeGreaterThan(3)

    // Reset restores seed
    store.resetDemo()
    expect(store.getRepo().getDecision('dec-gra-04')?.decisionStatus).toBe('Pending')
    expect(store.getRepo().listInitiatives().some((i) => i.id === initResult.id)).toBe(false)
  })

  it('blocks initiative creation from unapproved recommendation without approved decision', () => {
    const store = usePrototypeStore.getState()
    store.resetDemo()
    const result = store.createInitiative({
      decisionId: 'missing',
      name: 'Nope',
      description: 'Nope',
      recommendationIds: ['rec-gra-05'],
    } as never)
    expect(result.ok).toBe(false)
  })
})
