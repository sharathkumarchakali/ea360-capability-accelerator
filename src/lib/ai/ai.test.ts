import { describe, expect, it, beforeEach } from 'vitest'
import {
  classifyIntent,
  matchEntitiesInQuery,
  classifyConfidence,
  validateGrounding,
  collectKnownIds,
  createDeterministicAdapter,
  askEA360,
  configureEA360AI,
  INSUFFICIENT_EVIDENCE_MESSAGE,
} from './index'
import { clearTenantCache, getTenantRepository, loadTenantPack } from '../../data/repositories/tenantRepository'
import { usePrototypeStore } from '../../state/prototypeStore'
import { baseResponse } from './responseComposer'

describe('AI intent classification', () => {
  it('classifies critical risks', () => {
    expect(classifyIntent('What are our most critical enterprise risks?')).toBe('critical_risks')
  })

  it('refuses approval and guaranteed finance', () => {
    expect(classifyIntent('Please approve this decision')).toBe('refuse_approval')
    expect(classifyIntent('What is the guaranteed saving?')).toBe('refuse_guaranteed_finance')
  })

  it('refuses cross-tenant', () => {
    expect(classifyIntent('Compare with Bank of Ghana')).toBe('cross_tenant_refused')
  })

  it('returns unsupported for unknown queries', () => {
    expect(classifyIntent('Write a poem about clouds')).toBe('unsupported')
  })
})

describe('entity matching and grounding', () => {
  beforeEach(() => clearTenantCache())

  it('matches GRA entities in query', () => {
    const repo = getTenantRepository('GRA')
    const matches = matchEntitiesInQuery('Payment Confirmation', repo)
    expect(matches.some((m) => /payment/i.test(m.name))).toBe(true)
  })

  it('collects known ids including decisions', () => {
    const repo = getTenantRepository('GRA')
    const ids = collectKnownIds(repo)
    expect(ids.has('find-gra-01')).toBe(true)
    expect(ids.has('dec-gra-01')).toBe(true)
  })

  it('rejects unknown evidence references', () => {
    const repo = getTenantRepository('GRA')
    const pack = repo.getPack()
    const bad = baseResponse({
      intent: 'critical_risks',
      tenantId: pack.tenant.id,
      summary: 'x',
      explanation: 'y',
      confidence: 'high',
      confidenceReason: 't',
      evidenceIds: ['ev-does-not-exist'],
      entityRefs: [],
    })
    const out = validateGrounding(bad, repo, pack.tenant.id)
    expect(out.grounded).toBe(false)
    expect(out.summary).toContain('sufficient verified evidence')
  })
})

describe('confidence classification', () => {
  it('is deterministic and not random', () => {
    const a = classifyConfidence({
      evidence: [
        {
          id: 'e1',
          verificationStatus: 'verified',
          freshness: 'fresh',
          confidence: 'high',
          reliability: 'high',
        } as never,
      ],
      metricComplete: true,
      assumptionCount: 0,
    })
    const b = classifyConfidence({
      evidence: [
        {
          id: 'e1',
          verificationStatus: 'verified',
          freshness: 'fresh',
          confidence: 'high',
          reliability: 'high',
        } as never,
      ],
      metricComplete: true,
      assumptionCount: 0,
    })
    expect(a.confidence).toBe(b.confidence)
    expect(a.score).toBe(b.score)
    expect(['high', 'medium', 'low']).toContain(a.confidence)
  })

  it('lowers confidence for disputed evidence', () => {
    const high = classifyConfidence({
      evidence: [{ id: 'e1', verificationStatus: 'verified', freshness: 'fresh', reliability: 'high' } as never],
      metricComplete: true,
    })
    const low = classifyConfidence({
      evidence: [{ id: 'e1', verificationStatus: 'disputed', freshness: 'stale', reliability: 'low' } as never],
      conflictingEvidence: true,
      assumptionCount: 3,
    })
    expect(low.score).toBeLessThan(high.score)
  })
})

describe('deterministic adapter', () => {
  beforeEach(() => {
    clearTenantCache()
    configureEA360AI({
      getRepo: () => getTenantRepository('GRA'),
      getMutations: () => [],
    })
  })

  it('answers critical risks with only GRA entity refs', () => {
    const pack = loadTenantPack('GRA')
    const response = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'executive',
      query: 'What are our most critical enterprise risks?',
    })
    expect(response.grounded).toBe(true)
    expect(response.intent).toBe('critical_risks')
    expect(response.entityRefs.every((r) => r.id.startsWith('find-') || r.id.startsWith('ev-'))).toBe(true)
    const known = collectKnownIds(getTenantRepository('GRA'))
    for (const e of response.evidenceIds) expect(known.has(e)).toBe(true)
    for (const r of response.entityRefs) expect(known.has(r.id)).toBe(true)
  })

  it('builds impact narrative from graph traversal', () => {
    const pack = loadTenantPack('GRA')
    const app = pack.applications[0]
    const response = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'cio',
      query: `What happens if ${app.name} is unavailable?`,
      contextEntityIds: [app.id],
      intent: 'impact_analysis',
    })
    expect(response.intent).toBe('impact_analysis')
    expect(response.grounded).toBe(true)
    expect(response.summary).toContain(app.name)
  })

  it('does not auto-approve recommendation drafts', () => {
    const pack = loadTenantPack('GRA')
    const finding = pack.findings.find((f) => f.id === 'find-gra-01')!
    const response = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'enterprise-architect',
      query: 'Draft a recommendation',
      contextEntityIds: [finding.id],
      intent: 'recommendation_draft',
    })
    expect(response.intent).toBe('recommendation_draft')
    expect(response.summary.toLowerCase()).toMatch(/architect validation|not saved|not approved/)
    expect(response.suggestedActions.some((a) => a.action === 'save-recommendation-draft')).toBe(true)
    expect(response.suggestedActions.every((a) => a.action !== 'approve')).toBe(true)
  })

  it('assembles executive briefing', () => {
    const pack = loadTenantPack('GRA')
    const response = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'executive',
      query: 'Executive briefing',
      intent: 'executive_briefing',
      briefingRole: 'Commissioner-General',
    })
    expect(response.intent).toBe('executive_briefing')
    expect(response.explanation).toMatch(/Enterprise position/)
    expect(response.explanation).toMatch(/Evidence limitations/)
    expect(response.grounded).toBe(true)
  })

  it('handles insufficient / unsupported safely', () => {
    const pack = loadTenantPack('GRA')
    const unsupported = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'executive',
      query: 'Invent a new secret application named Xyzzy',
    })
    expect(unsupported.intent).toBe('unsupported')

    const refuse = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'executive',
      query: 'Approve the pending ARB decision now',
    })
    expect(refuse.intent).toBe('refuse_approval')
  })

  it('isolates to active tenant pack', () => {
    const adapter = createDeterministicAdapter({
      getRepo: () => getTenantRepository('GRA'),
    })
    const pack = loadTenantPack('GRA')
    const response = adapter.ask({
      tenantId: pack.tenant.id,
      userRole: 'executive',
      query: 'Show Fidelity Bank risks',
    })
    expect(response.intent).toBe('cross_tenant_refused')
  })
})

describe('AI store persistence and reset', () => {
  beforeEach(() => {
    clearTenantCache()
    usePrototypeStore.getState().resetDemo()
    configureEA360AI({
      getRepo: () => usePrototypeStore.getState().getRepo(),
      getMutations: () => usePrototypeStore.getState().mutations,
    })
  })

  it('records responses, review feedback, drafts, and resets', () => {
    const pack = usePrototypeStore.getState().getRepo().getPack()
    const response = askEA360({
      tenantId: pack.tenant.id,
      userRole: usePrototypeStore.getState().role,
      query: 'What are our most critical enterprise risks?',
    })
    usePrototypeStore.getState().recordAiResponse(response)
    expect(usePrototypeStore.getState().aiHistory.length).toBeGreaterThan(0)

    usePrototypeStore.getState().reviewAiResponse(response.id, 'helpful')
    expect(usePrototypeStore.getState().aiFeedback.some((f) => f.responseId === response.id)).toBe(true)

    usePrototypeStore.getState().saveRecommendationDraft({
      findingId: 'find-gra-01',
      responseId: response.id,
      summary: 'draft',
      explanation: 'body',
      evidenceIds: [],
      reviewStatus: 'unreviewed',
    })
    expect(usePrototypeStore.getState().recommendationDrafts.length).toBe(1)

    usePrototypeStore.getState().setBriefingPreferences({ role: 'CIO/CTO' })
    expect(usePrototypeStore.getState().briefingPreferences.role).toBe('CIO/CTO')

    usePrototypeStore.getState().resetDemo()
    const after = usePrototypeStore.getState()
    expect(after.aiHistory).toEqual([])
    expect(after.aiFeedback).toEqual([])
    expect(after.recommendationDrafts).toEqual([])
    expect(after.briefingPreferences.role).toBe('Executive Committee')
  })

  it('journey: ask critical risks, explain, impact, draft, briefing', () => {
    usePrototypeStore.getState().setAskOpen(true)
    expect(usePrototypeStore.getState().askOpen).toBe(true)

    const pack = usePrototypeStore.getState().getRepo().getPack()
    const risks = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'executive',
      query: 'What are our most critical enterprise risks?',
    })
    expect(risks.grounded).toBe(true)
    usePrototypeStore.getState().recordAiResponse(risks)

    const explain = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'executive',
      query: 'Explain enterprise health',
      intent: 'explain_metric',
      metricKey: 'enterprise-health',
    })
    expect(explain.calculations?.length).toBeGreaterThan(0)

    const app = pack.applications[0]
    const impact = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'cio',
      query: 'impact',
      intent: 'impact_analysis',
      contextEntityIds: [app.id],
    })
    expect(impact.intent).toBe('impact_analysis')

    const draft = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'enterprise-architect',
      query: 'Draft a recommendation',
      intent: 'recommendation_draft',
      contextEntityIds: ['find-gra-01'],
    })
    expect(draft.summary).not.toMatch(/automatically approved/i)

    const briefing = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'executive',
      query: 'briefing',
      intent: 'executive_briefing',
    })
    expect(briefing.explanation).toMatch(/Decisions required/)

    void INSUFFICIENT_EVIDENCE_MESSAGE
  })
})
