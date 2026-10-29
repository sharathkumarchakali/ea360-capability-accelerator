/**
 * Acceptance tests for the guided journeys and the workflows they drive
 * (journeys brief AT01–AT03, AT12–AT14, AT16, AT17, AT20).
 * Everything runs against the synthetic seed packs; runtime workspaces are removed after each test.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearTenantCache,
  createRuntimeWorkspace,
  listAvailableTenants,
  loadTenantPack,
} from '../../data/repositories/tenantRepository'
import { clearRuntimeWorkspaces, isKnownTenant } from '../../data/tenants/registry'
import { cloneStarterPack, STARTER_OPTIONS } from '../../data/tenants/runtimeWorkspaces'
import {
  autoMapColumns,
  buildApplicationSamples,
  canCommitImport,
  mergeApplicationImport,
  parseCsv,
  toStagedValidation,
  validateApplicationImport,
} from '../../data/templates/applicationImport'
import { configureEA360AI, askEA360, draftRecommendation, executiveBriefing, QUESTION_BY_ID } from '../../lib/ai'
import { usePrototypeStore } from '../../state/prototypeStore'
import { resetDemoAsOfDate } from '../../domain/demo/demoClock'
import { validateNoOrphanRelationships } from '../../domain/metrics/graph'
import {
  canCreateInitiativeFromDecision,
  canCreateInitiativeFromRecommendation,
  canTransitionDecision,
  canTransitionFinding,
  canTransitionRecommendation,
} from '../../domain/workflow'
import { applyDemoStepWithStore } from './applyDemoStep'
import {
  DEMO_PLAYLISTS,
  buildPlaylistJourney,
  evaluatePredicate,
  getDemoJourneys,
  resolveStepForRun,
  validateJourneyContract,
} from './journeyDefinitions'
import { JOURNEY_IDS, getJourneyBinding, resolveRunSlot } from './journeyBindings'
import { findPackEntity, preflightAllJourneys, preflightJourney } from './scenarioPreflight'

const store = () => usePrototypeStore.getState()
const pack = () => store().workingPack!
const snapshot = () => JSON.stringify(pack())

const PROFILE = {
  name: 'Acme Revenue Service',
  code: 'ACME',
  sector: 'Revenue Authority',
  country: 'Ghana',
  currency: 'GHS',
  timezone: 'Africa/Accra',
  synthetic: true,
}

beforeEach(() => {
  clearTenantCache()
  resetDemoAsOfDate()
  clearRuntimeWorkspaces()
  store().resetAllTenants()
  configureEA360AI({ getRepo: () => store().getRepo(), getMutations: () => store().mutations })
})

afterEach(() => {
  resetDemoAsOfDate()
  clearRuntimeWorkspaces()
})

/* ------------------------------------------------------------------ */
describe('AT01 — preflight and bindings', () => {
  const EXPECTED = {
    GRA: ['Ready', 'Ready', 'Ready', 'Ready', 'Ready', 'Needs setup', 'Needs setup', 'Ready'],
    BOG: ['Ready', 'Ready', 'Ready', 'Unavailable', 'Unavailable', 'Unavailable', 'Needs setup', 'Ready'],
    FIDELITY: ['Ready', 'Ready', 'Ready', 'Unavailable', 'Unavailable', 'Unavailable', 'Needs setup', 'Ready'],
    GENERIC: ['Ready', 'Ready', 'Ready', 'Unavailable', 'Unavailable', 'Unavailable', 'Needs setup', 'Ready'],
  } as const

  it.each(Object.keys(EXPECTED))('%s reports the expected status for J1–J8', (code) => {
    const results = preflightAllJourneys(loadTenantPack(code as 'GRA', { bypassCache: true }), code)
    expect(JOURNEY_IDS.map((j) => results[j].status)).toEqual([...EXPECTED[code as keyof typeof EXPECTED]])
  })

  it('a Ready journey has no missing records and every bound record exists with the bound type', () => {
    for (const code of ['GRA', 'BOG', 'FIDELITY', 'GENERIC'] as const) {
      const p = loadTenantPack(code, { bypassCache: true })
      for (const j of JOURNEY_IDS) {
        const result = preflightJourney(p, code, j)
        if (result.status !== 'Ready') continue
        expect(result.missing, `${code} ${j}`).toEqual([])
        const binding = getJourneyBinding(code, j)!
        for (const ref of Object.values(binding.refs)) {
          expect(findPackEntity(p, ref.type, ref.id), `${code} ${j} ${ref.type}:${ref.id}`).toBeTruthy()
        }
      }
    }
  })

  it('never substitutes GRA records into another sector', () => {
    for (const code of ['BOG', 'FIDELITY', 'GENERIC'] as const) {
      for (const j of JOURNEY_IDS) {
        const binding = getJourneyBinding(code, j)!
        for (const ref of Object.values(binding.refs)) expect(ref.id, `${code} ${j}`).not.toMatch(/-gra-/)
      }
      expect(preflightJourney(loadTenantPack(code), code, 'J4').status).toBe('Unavailable')
      expect(store().prepareDemoFixture).toBeTypeOf('function')
    }
  })

  it('every journey is structurally valid, uses catalogue questions and registered targets', () => {
    for (const code of ['GRA', 'BOG', 'FIDELITY', 'GENERIC']) {
      const journeys = getDemoJourneys(code)
      expect(journeys.map((j) => j.journeyId)).toEqual([...JOURNEY_IDS])
      for (const journey of journeys) {
        expect(validateJourneyContract(journey), `${code} ${journey.journeyId}`).toEqual([])
        for (const step of journey.steps) {
          if (step.ask?.questionId) expect(QUESTION_BY_ID[step.ask.questionId], `${code} ${step.id}`).toBeTruthy()
        }
      }
    }
  })

  it('playlists reference only real journeys and produce runnable journeys', () => {
    expect(DEMO_PLAYLISTS.length).toBeGreaterThan(0)
    for (const playlist of DEMO_PLAYLISTS) {
      const journey = buildPlaylistJourney('GRA', playlist.id)
      expect(journey, playlist.id).toBeTruthy()
      expect(journey!.steps.length).toBeGreaterThan(0)
      expect(validateJourneyContract(journey!), playlist.id).toEqual([])
    }
  })

  it('"Prepare synthetic example" turns J6 and J7 Ready, is idempotent and is tagged', () => {
    for (const j of ['J6', 'J7'] as const) {
      expect(preflightJourney(pack(), 'GRA', j).status).toBe('Needs setup')
      const first = store().prepareDemoFixture(j)
      expect(first.ok, first.error).toBe(true)
      expect(first.created!.length).toBeGreaterThan(0)
      expect(preflightJourney(pack(), 'GRA', j).status).toBe('Ready')
      const second = store().prepareDemoFixture(j)
      expect(second.ok).toBe(true)
      expect(second.created).toEqual([])
    }
    const practice = pack().findings.find((f) => f.id === 'demo-gra-payment-finding')!
    expect(practice.tags).toContain('synthetic-demo-fixture')
    expect(practice.recommendationIds).toEqual([])
  })

  it('a fixture is refused where the journey has no validated data', () => {
    store().switchTenant('BOG')
    const before = snapshot()
    expect(store().prepareDemoFixture('J6').ok).toBe(false)
    expect(snapshot()).toBe(before)
  })

  it('does not change the seed pack when fixtures are prepared', () => {
    const seedBefore = JSON.stringify(loadTenantPack('GRA', { bypassCache: true }))
    store().prepareDemoFixture('J7')
    expect(JSON.stringify(loadTenantPack('GRA', { bypassCache: true }))).toBe(seedBefore)
  })
})

/* ------------------------------------------------------------------ */
describe('AT02 — every step navigates and selects the bound record', () => {
  it.each(['J1', 'J2', 'J3', 'J4', 'J5', 'J8'])('GRA %s', (journeyId) => {
    const journey = getDemoJourneys('GRA').find((j) => j.journeyId === journeyId)!
    const binding = getJourneyBinding('GRA', journeyId as 'J1')!
    for (const step of journey.steps) {
      store().clearSelection()
      const navigate = vi.fn()
      const resolved = resolveStepForRun(step, pack(), binding)
      applyDemoStepWithStore(resolved.step, { navigate })
      const view = step.action.view === 'overview' ? 'executive' : step.action.view
      expect(navigate, `${journeyId} ${step.id}`).toHaveBeenCalledWith(view, { keepSelection: true })
      const wanted = resolved.step.action.selectEntity
      if (wanted) {
        expect(store().selectedEntity, `${journeyId} ${step.id}`).toMatchObject({ id: wanted.id, type: wanted.type })
        expect(findPackEntity(pack(), wanted.type as 'finding', wanted.id), `${step.id} selects ${wanted.id}`).toBeTruthy()
      }
      if (step.action.graphRoot) {
        expect(store().graphRoot).toMatchObject({ id: step.action.graphRoot.id, type: step.action.graphRoot.type })
      }
    }
  })

  it('graph steps set the direction and depth they declare', () => {
    const j3 = getDemoJourneys('GRA').find((j) => j.journeyId === 'J3')!
    const graphStep = j3.steps.find((s) => s.action.graphRoot && s.action.graphDirection)
    expect(graphStep).toBeTruthy()
    applyDemoStepWithStore(graphStep!, { navigate: vi.fn() })
    expect(store().graphDirection).toBe(graphStep!.action.graphDirection)
    if (graphStep!.action.graphDepth != null) expect(store().relationshipDepth).toBe(graphStep!.action.graphDepth)
    expect(store().impactMode).toBe(graphStep!.action.impactMode !== false)
  })

  it('a step that selects nothing keeps no stale selection from the step before', () => {
    store().selectEntity({ id: 'find-gra-02', type: 'finding' })
    const step = getDemoJourneys('GRA')[0].steps.find((s) => s.action.selectEntity === null)
    if (step) {
      applyDemoStepWithStore(step, { navigate: vi.fn() })
      expect(store().selectedEntity).toBeNull()
    }
  })
})

/* ------------------------------------------------------------------ */
describe('AT03 — retry and restart', () => {
  it('Retry bumps the nonce on the same step so the step is re-applied', () => {
    store().startGuidedTour('J1')
    store().setGuidedStep(2)
    store().retryGuidedStep()
    store().retryGuidedStep()
    const tour = store().guidedTour!
    expect(tour.stepIndex).toBe(2)
    expect(tour.retryNonce).toBe(2)
    expect(tour.active).toBe(true)
  })

  it('Restart returns to step one with a clean nonce; Exit clears the tour and closes Ask', () => {
    store().startGuidedTour('J2')
    store().setGuidedStep(3)
    store().retryGuidedStep()
    store().restartGuidedTour()
    expect(store().guidedTour).toMatchObject({ stepIndex: 0, retryNonce: 0, journeyId: 'J2', active: true })
    store().setAskOpen(true)
    store().exitGuidedTour()
    expect(store().guidedTour).toBeNull()
    expect(store().askOpen).toBe(false)
  })

  it('retry on a no-op does nothing when no tour is running', () => {
    store().exitGuidedTour()
    store().retryGuidedStep()
    expect(store().guidedTour).toBeNull()
  })

  it('the guided bar re-applies the step when the nonce changes', () => {
    const source = readFileSync(resolve(__dirname, 'GuidedDemoBar.jsx'), 'utf8')
    expect(source).toMatch(/\}, \[step, guidedTour\?\.active, stepIndex, retryNonce,/)
  })
})

/* ------------------------------------------------------------------ */
describe('AT12 — AI draft becomes a Draft recommendation only through a human action', () => {
  function makeDraft(findingId: string) {
    const response = draftRecommendation({
      tenantId: pack().tenant.id,
      userRole: 'executive',
      query: 'Draft a recommendation for this finding.',
      intent: 'recommendation_draft',
      contextEntityIds: [findingId],
    })
    store().recordAiResponse(response)
    return response
  }

  function save(response: ReturnType<typeof makeDraft>) {
    return store().saveRecommendationDraft({
      findingId: response.recommendationDraft!.findingId,
      responseId: response.id,
      summary: response.summary,
      explanation: response.explanation,
      evidenceIds: response.evidenceIds,
      reviewStatus: 'unreviewed',
      payload: response.recommendationDraft,
    })
  }

  it('generating or saving a draft never touches the pack', () => {
    const before = snapshot()
    const response = makeDraft('find-gra-10')
    expect(response.recommendationDraft).toBeTruthy()
    expect(snapshot()).toBe(before)
    expect(save(response).ok).toBe(true)
    expect(snapshot()).toBe(before)
  })

  it('saving the same response twice yields the same saved draft', () => {
    const response = makeDraft('find-gra-10')
    const a = save(response)
    const b = save(response)
    expect(b.id).toBe(a.id)
    expect(store().recommendationDrafts.filter((d) => d.responseId === response.id)).toHaveLength(1)
  })

  it('converting creates one recommendation in Draft status, linked to the finding, never approved', () => {
    const response = makeDraft('find-gra-10')
    const draftId = save(response).id!
    const recsBefore = pack().recommendations.length
    const decisionsBefore = JSON.stringify(pack().decisions)
    const auditBefore = pack().auditHistory.length

    const result = store().convertRecommendationDraftToEntity(draftId)
    expect(result.ok, result.error).toBe(true)
    expect(result.existing).toBeFalsy()

    const rec = pack().recommendations.find((r) => r.id === result.id)!
    expect(pack().recommendations).toHaveLength(recsBefore + 1)
    expect(rec.workflowStatus).toBe('Draft')
    expect(rec.status).toBe('draft')
    expect(rec.findingIds).toEqual(['find-gra-10'])
    expect(rec.tags).toContain('ai-assisted')
    expect(rec.evidenceIds.length).toBeGreaterThan(0)
    expect(rec.assumptions.join(' ')).toMatch(/Not submitted and not approved/)
    expect(pack().findings.find((f) => f.id === 'find-gra-10')!.recommendationIds).toContain(rec.id)
    expect(JSON.stringify(pack().decisions)).toBe(decisionsBefore)
    expect(pack().auditHistory.length).toBe(auditBefore + 1)
    expect(pack().auditHistory.at(-1)).toMatchObject({ action: 'recommendation_draft_created', entityId: rec.id })
    expect(store().recommendationDrafts.find((d) => d.id === draftId)!.recommendationId).toBe(rec.id)
  })

  it('is idempotent: converting again returns the same recommendation and adds nothing', () => {
    const response = makeDraft('find-gra-10')
    const draftId = save(response).id!
    const first = store().convertRecommendationDraftToEntity(draftId)
    const count = pack().recommendations.length
    const revision = store().dataRevision
    const second = store().convertRecommendationDraftToEntity(draftId)
    expect(second.ok).toBe(true)
    expect(second.existing).toBe(true)
    expect(second.id).toBe(first.id)
    expect(pack().recommendations).toHaveLength(count)
    expect(store().dataRevision).toBe(revision)
  })

  it('converts a draft that was saved earlier even if the saved-draft link is lost', () => {
    const response = makeDraft('find-gra-10')
    const draftId = save(response).id!
    const first = store().convertRecommendationDraftToEntity(draftId)
    usePrototypeStore.setState({
      recommendationDrafts: store().recommendationDrafts.map((d) => ({ ...d, recommendationId: undefined })),
    })
    const again = store().convertRecommendationDraftToEntity(draftId)
    expect(again.id).toBe(first.id)
    expect(pack().recommendations.filter((r) => (r.sourceRefs ?? []).includes(draftId))).toHaveLength(1)
  })

  it('refuses unknown drafts and findings with no evidence, leaving the pack unchanged', () => {
    const before = snapshot()
    expect(store().convertRecommendationDraftToEntity('ai-draft-does-not-exist').ok).toBe(false)
    usePrototypeStore.setState({
      recommendationDrafts: [
        ...store().recommendationDrafts,
        {
          id: 'ai-draft-no-evidence',
          findingId: 'find-gra-ai-007',
          responseId: 'resp-x',
          summary: 'x',
          explanation: 'x',
          evidenceIds: [],
          createdAt: new Date().toISOString(),
          reviewStatus: 'unreviewed',
        },
      ],
    })
    const result = store().convertRecommendationDraftToEntity('ai-draft-no-evidence')
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/no linked evidence/i)
    expect(snapshot()).toBe(before)
  })

  it('the new Draft can only move forward through the normal workflow', () => {
    const draftId = save(makeDraft('find-gra-10')).id!
    const id = store().convertRecommendationDraftToEntity(draftId).id!
    expect(store().approve({ id }).ok).toBe(false)
    expect(store().submit({ id }).ok).toBe(true)
    expect(pack().recommendations.find((r) => r.id === id)!.workflowStatus).toBe('Ready for Review')
  })
})

/* ------------------------------------------------------------------ */
describe('AT13 — J7 transition eligibility', () => {
  it('transition tables forbid skipping steps', () => {
    expect(canTransitionFinding('Draft', 'Accepted')).toBe(false)
    expect(canTransitionFinding('Under Review', 'Validated')).toBe(true)
    expect(canTransitionFinding('Resolved', 'Draft')).toBe(false)
    expect(canTransitionRecommendation('Draft', 'Approved')).toBe(false)
    expect(canTransitionRecommendation('Ready for Review', 'Under Review')).toBe(true)
    expect(canTransitionDecision('Rejected', 'Approved')).toBe(false)
    expect(canTransitionDecision('Pending', 'Approved with Conditions')).toBe(true)
  })

  it('runs the practice flow in order and each step is only available after the one before', () => {
    expect(store().prepareDemoFixture('J7').ok).toBe(true)
    const binding = getJourneyBinding('GRA', 'J7')!
    const findingId = binding.refs.finding.id
    const evidenceId = binding.refs.evidenceReview.id
    const finding = () => pack().findings.find((f) => f.id === findingId)!
    const evidence = () => pack().evidence.find((e) => e.id === evidenceId)!
    const predicate = (name: Parameters<typeof evaluatePredicate>[0]) =>
      evaluatePredicate(name, { pack: pack(), binding, recommendationDrafts: store().recommendationDrafts, tenantCode: 'GRA' })

    // Nothing exists downstream of the practice finding yet.
    expect(finding().workflowStatus).toBe('Under Review')
    expect(resolveRunSlot(pack(), binding, 'recommendation')).toBeNull()
    expect(predicate('evidence-verified')).toBe(false)
    expect(predicate('finding-accepted')).toBe(false)
    expect(predicate('recommendation-submitted')).toBe(false)
    expect(predicate('initiative-created')).toBe(false)

    // Evidence verification.
    expect(evidence().verificationStatus).toBe('unverified')
    expect(store().markVerified({ id: evidenceId }).ok).toBe(true)
    expect(predicate('evidence-verified')).toBe(true)

    // Finding: validate, then it can produce a recommendation.
    expect(store().validateFinding({ id: findingId }).ok).toBe(true)
    expect(store().validateFinding({ id: findingId }).ok).toBe(false)
    const created = store().createRecommendationFromFinding({ id: findingId })
    expect(created.ok, created.error).toBe(true)
    expect(predicate('finding-accepted')).toBe(true)
    const recId = resolveRunSlot(pack(), binding, 'recommendation')!
    expect(recId).toBe(created.id)
    const rec = () => pack().recommendations.find((r) => r.id === recId)!
    expect(rec().workflowStatus).toBe('Draft')

    // Recommendation cannot be approved or turned into an initiative early.
    expect(store().approve({ id: recId }).ok).toBe(false)
    expect(canCreateInitiativeFromRecommendation(rec() as never).ok).toBe(false)
    expect(store().submit({ id: recId }).ok).toBe(true)
    expect(rec().workflowStatus).toBe('Ready for Review')
    expect(predicate('recommendation-submitted')).toBe(false)

    // Sending to ARB creates the decision (Pending).
    expect(store().sendToARB({ id: recId }).ok).toBe(true)
    const decisionId = resolveRunSlot(pack(), binding, 'decision')!
    expect(predicate('recommendation-submitted')).toBe(true)
    const decision = () => pack().decisions.find((d) => d.id === decisionId)!
    expect(decision().decisionStatus).toBe('Pending')
    expect(canCreateInitiativeFromDecision(decision() as never).ok).toBe(false)
    const early = store().createInitiative({ decisionId })
    expect(early.ok).toBe(false)
    expect(resolveRunSlot(pack(), binding, 'initiative')).toBeNull()

    // Approve with conditions, then (and only then) create the initiative.
    expect(store().approveDecisionWithConditions({ id: decisionId, conditions: 'Review monthly' }).ok).toBe(true)
    expect(predicate('decision-conditional')).toBe(true)
    expect(canCreateInitiativeFromDecision(decision() as never).ok).toBe(true)
    expect(store().approveDecisionWithConditions({ id: decisionId, conditions: 'again' }).ok).toBe(false)
    const initiative = store().createInitiative({ decisionId })
    expect(initiative.ok, initiative.error).toBe(true)
    expect(predicate('initiative-created')).toBe(true)
    expect(rec().workflowStatus).toBe('Converted to Initiative')
  })

  it('a practice run never changes the real GRA records', () => {
    const real = (p: ReturnType<typeof pack>) => JSON.stringify([p.findings.filter((f) => !f.id.startsWith('demo-')), p.decisions.length, p.recommendations.length])
    const before = real(pack())
    store().prepareDemoFixture('J7')
    const binding = getJourneyBinding('GRA', 'J7')!
    store().markVerified({ id: binding.refs.evidenceReview.id })
    store().validateFinding({ id: binding.refs.finding.id })
    const created = store().createRecommendationFromFinding({ id: binding.refs.finding.id })
    expect(created.ok).toBe(true)
    // Only the practice scenario moved.
    expect(JSON.stringify([pack().findings.filter((f) => !f.id.startsWith('demo-')), pack().decisions.length]))
      .toBe(JSON.stringify([JSON.parse(before)[0], JSON.parse(before)[1]]))
  })

  it('"resetDemo" returns the workspace to its seed state', () => {
    store().prepareDemoFixture('J7')
    expect(pack().findings.some((f) => f.id === 'demo-gra-payment-finding')).toBe(true)
    store().resetDemo()
    expect(pack().findings.some((f) => f.id === 'demo-gra-payment-finding')).toBe(false)
    expect(store().mutations).toEqual([])
  })
})

/* ------------------------------------------------------------------ */
describe('AT14 — data revision and stale answers', () => {
  const ask = () =>
    askEA360({
      tenantId: pack().tenant.id,
      userRole: 'executive',
      query: QUESTION_BY_ID.Q01.label,
      intent: 'critical_risks',
      questionId: 'Q01',
      asOfDate: store().demoAsOfDate,
      dataRevision: store().dataRevision,
    })

  it('answers carry the revision and as-of date they were generated for', () => {
    const r = ask()
    expect(r.dataRevision).toBe(store().dataRevision)
    expect(r.asOfDate).toBe(store().demoAsOfDate)
    expect(r.request).toMatchObject({ questionId: 'Q01' })
  })

  it('a pack change makes the earlier answer stale; re-running it produces a current one', () => {
    const r = ask()
    const evidenceId = pack().evidence.find((e) => e.verificationStatus !== 'verified')!.id
    expect(store().markVerified({ id: evidenceId }).ok).toBe(true)
    expect(store().dataRevision).toBeGreaterThan(r.dataRevision!)
    const again = ask()
    expect(again.dataRevision).toBe(store().dataRevision)
    expect(again.dataRevision).not.toBe(r.dataRevision)
  })

  it('changing the as-of date and a rejected change behave as expected', () => {
    const r = ask()
    expect(store().setDemoAsOfDate('2027-03-01').ok).toBe(true)
    expect(store().dataRevision).toBeGreaterThan(r.dataRevision!)
    const revision = store().dataRevision
    expect(store().setDemoAsOfDate('31/02/2027').ok).toBe(false)
    expect(store().dataRevision).toBe(revision)
    expect(store().demoAsOfDate).toBe('2027-03-01')
  })

  it('a failed action does not bump the revision', () => {
    const revision = store().dataRevision
    expect(store().approve({ id: 'rec-does-not-exist' }).ok).toBe(false)
    expect(store().dataRevision).toBe(revision)
  })

  it('revisions are tracked per workspace', () => {
    store().markVerified({ id: pack().evidence.find((e) => e.verificationStatus !== 'verified')!.id })
    const gra = store().dataRevision
    expect(gra).toBeGreaterThan(0)
    store().switchTenant('BOG')
    expect(store().dataRevision).toBe(0)
    store().switchTenant('GRA')
    expect(store().dataRevision).toBe(gra)
  })
})

/* ------------------------------------------------------------------ */
describe('AT16 — application import is validated and atomic', () => {
  const samples = () => buildApplicationSamples(pack())
  const validate = (text: string, map?: ReturnType<typeof autoMapColumns>) => {
    const parsed = parseCsv(text)
    return validateApplicationImport(parsed, map ?? autoMapColumns(parsed.header), pack())
  }

  it('the clean sample validates, with one unchanged row and two new ones', () => {
    const result = validate(samples().clean)
    expect(result.errors).toEqual([])
    expect(canCommitImport(result)).toBe(true)
    expect([result.created, result.updated, result.unchanged]).toEqual([2, 0, 1])
  })

  it('the error sample reports each problem with its line and blocks commit', () => {
    const result = validate(samples().error)
    expect(canCommitImport(result)).toBe(false)
    const byLine = (n: number) => result.errors.filter((e) => e.line === n).map((e) => e.field)
    expect(byLine(3)).toContain('capabilityId')
    expect(byLine(4)).toContain('name')
    expect(byLine(5)).toContain('id')
    expect(result.warnings.some((w) => w.line === 5)).toBe(true)
  })

  it('maps differently named and re-ordered columns and honours quoted commas', () => {
    const capabilityId = pack().capabilities[0].id
    const text = `Tier,Application Name,Capability,Application ID\nhigh,"Records, archive (sample)",${capabilityId},app-sample-901\n`
    const parsed = parseCsv(text)
    const map = autoMapColumns(parsed.header)
    expect(map).toMatchObject({ id: 3, name: 1, capabilityId: 2, criticality: 0 })
    const result = validateApplicationImport(parsed, map, pack())
    expect(result.errors).toEqual([])
    expect(result.rows[0]).toMatchObject({ id: 'app-sample-901', name: 'Records, archive (sample)', criticality: 'high' })
  })

  it('an unmapped required column blocks commit', () => {
    const parsed = parseCsv(samples().clean)
    const map = { ...autoMapColumns(parsed.header), capabilityId: -1 }
    const result = validateApplicationImport(parsed, map, pack())
    expect(canCommitImport(result)).toBe(false)
  })

  it('an empty file and an unclosed quote are errors, not crashes', () => {
    expect(canCommitImport(validate(''))).toBe(false)
    expect(canCommitImport(validate('id,name,capabilityId,criticality\n"app-1,Unclosed,cap-gra-01,high'))).toBe(false)
  })

  it('a file with errors cannot be committed and leaves the workspace untouched', () => {
    const result = validate(samples().error)
    const before = snapshot()
    const revision = store().dataRevision
    expect(() => mergeApplicationImport(structuredClone(pack()), result)).toThrow()
    const committed = store().commitApplicationImport(result, { draftId: 'import-bad' })
    expect(committed.ok).toBe(false)
    expect(snapshot()).toBe(before)
    expect(store().dataRevision).toBe(revision)
  })

  it('a clean commit merges, audits, bumps the revision and clears the staged validation', () => {
    const result = validate(samples().clean)
    store().setImportValidation(toStagedValidation(result, { draftId: 'import-ok', tenantCode: 'GRA' }))
    const apps = pack().applications.length
    const revision = store().dataRevision
    const committed = store().commitApplicationImport(result, { draftId: 'import-ok', fileName: 'applications-clean.csv' })
    expect(committed.ok, committed.error).toBe(true)
    expect(pack().applications).toHaveLength(apps + 2)
    const added = pack().applications.find((a) => a.id === 'app-sample-101')!
    expect(added.supportedCapabilityIds).toEqual(['cap-gra-01'])
    expect(store().dataRevision).toBe(revision + 1)
    expect(store().importValidation).toBeNull()
    expect(pack().auditHistory.at(-1)).toMatchObject({ action: 'import_committed', entityId: 'import-ok' })
    // Seed data is not touched.
    expect(loadTenantPack('GRA').applications.some((a) => a.id === 'app-sample-101')).toBe(false)
  })

  it('importing the same file again changes nothing structurally (idempotent)', () => {
    store().commitApplicationImport(validate(samples().clean), { draftId: 'import-1' })
    const apps = pack().applications.length
    const again = validate(samples().clean)
    expect([again.created, again.updated, again.unchanged]).toEqual([0, 0, 3])
    expect(store().commitApplicationImport(again, { draftId: 'import-2' }).ok).toBe(true)
    expect(pack().applications).toHaveLength(apps)
  })

  it('the staged validation is what Ask Q32 explains, and only for the workspace it was staged in', () => {
    const result = validate(samples().error)
    store().setImportValidation(toStagedValidation(result, { draftId: 'import-q32', tenantCode: 'GRA', fileName: 'x.csv' }))
    const staged = store().importValidation!
    expect(staged.tenantCode).toBe('GRA')
    expect(staged.errors.length).toBe(result.errors.length)
    const r = askEA360({
      tenantId: pack().tenant.id,
      userRole: 'executive',
      query: QUESTION_BY_ID.Q32.label,
      intent: 'import_validation',
      questionId: 'Q32',
      importValidation: staged,
    })
    expect(r.summary).toContain('import-q32')
    expect(r.summary).toContain(`${result.errors.length} blocking`)
    expect(r.explanation).toMatch(/Row 3/)
  })

  it('the static sample files match the GRA workspace', () => {
    const read = (name: string) => readFileSync(resolve(__dirname, '../../../public/samples', name), 'utf8')
    const clean = validate(read('applications-clean.csv'))
    expect(clean.errors).toEqual([])
    expect(clean.rows).toHaveLength(3)
    const errors = validate(read('applications-errors.csv'))
    expect(errors.errors.length).toBeGreaterThanOrEqual(3)
  })
})

/* ------------------------------------------------------------------ */
describe('AT17 — runtime workspace clones are remapped and isolated', () => {
  const seedIds = (code: 'GRA' | 'BOG' | 'FIDELITY' | 'GENERIC') => {
    const p = loadTenantPack(code, { bypassCache: true }) as unknown as Record<string, Array<{ id?: string }>>
    const ids = new Set<string>()
    for (const key of ['capabilities', 'applications', 'integrations', 'findings', 'evidence', 'recommendations', 'decisions', 'initiatives', 'kpis', 'dataObjects', 'technologies', 'relationships']) {
      for (const item of p[key] ?? []) if (item.id) ids.add(item.id)
    }
    return ids
  }

  it('clones every starter with all identifiers remapped and no link left pointing at the seed', () => {
    for (const starter of STARTER_OPTIONS) {
      const source = loadTenantPack(starter.code, { bypassCache: true })
      const { pack: clone, idMap } = cloneStarterPack(source, { ...PROFILE, code: 'CLN' }, starter.label)
      expect(clone.tenant.id).toBe('tenant-cln')
      expect(idMap.size).toBeGreaterThan(50)
      const own = new Set<string>()
      const cloneRecord = clone as unknown as Record<string, Array<{ id?: string }>>
      for (const key of ['capabilities', 'applications', 'integrations', 'findings', 'evidence', 'recommendations', 'decisions', 'initiatives', 'kpis']) {
        for (const item of cloneRecord[key] ?? []) {
          expect(item.id, `${starter.code} ${key}`).toMatch(/-cln$/)
          own.add(item.id!)
        }
      }
      const seeds = seedIds(starter.code)
      for (const id of own) expect(seeds.has(id)).toBe(false)
      // Serialised clone must not mention any seed id as a whole token.
      const json = JSON.stringify(clone)
      for (const id of [...seeds].slice(0, 60)) {
        expect(json.includes(`"${id}"`), `${starter.code} still references ${id}`).toBe(false)
      }
      const everyId = new Set<string>()
      for (const list of Object.values(cloneRecord)) if (Array.isArray(list)) for (const x of list) if (x?.id) everyId.add(x.id)
      expect(validateNoOrphanRelationships(clone.relationships ?? [], everyId), `orphan relationships in ${starter.code} clone`).toEqual([])
    }
  })

  it('creates a workspace, registers it, and leaves the seed packs untouched', () => {
    const seedBefore = JSON.stringify(loadTenantPack('GRA', { bypassCache: true }))
    const created = createRuntimeWorkspace(PROFILE, 'GRA')
    expect(created.ok).toBe(true)
    if (!created.ok) return
    expect(created.code).toBe('ACME')
    expect(created.remappedIds).toBeGreaterThan(50)
    expect(isKnownTenant('ACME')).toBe(true)
    expect(listAvailableTenants().map((t) => t.code)).toContain('ACME')
    expect(listAvailableTenants()).toHaveLength(5)
    expect(JSON.stringify(loadTenantPack('GRA', { bypassCache: true }))).toBe(seedBefore)
  })

  it('refuses invalid, duplicate and non-synthetic profiles without registering anything', () => {
    const attempts = [
      { ...PROFILE, code: 'GRA' },
      { ...PROFILE, code: 'bad code!' },
      { ...PROFILE, name: '  ' },
      { ...PROFILE, country: '' },
      { ...PROFILE, synthetic: false },
    ]
    for (const profile of attempts) {
      const result = createRuntimeWorkspace(profile, 'GRA')
      expect(result.ok, JSON.stringify(profile)).toBe(false)
    }
    expect(createRuntimeWorkspace(PROFILE, 'NOPE').ok).toBe(false)
    expect(listAvailableTenants()).toHaveLength(4)
    expect(createRuntimeWorkspace(PROFILE, 'GRA').ok).toBe(true)
    expect(createRuntimeWorkspace(PROFILE, 'GRA').ok).toBe(false)
    expect(listAvailableTenants()).toHaveLength(5)
  })

  it('switching to the new workspace gives it its own data, selection and revision', () => {
    store().selectEntity({ id: 'find-gra-02', type: 'finding' })
    const result = store().createWorkspaceFromStarter(PROFILE, 'GRA')
    expect(result.ok, result.error).toBe(true)
    expect(store().tenantCode).toBe('ACME')
    expect(store().selectedEntity).toBeNull()
    expect(pack().tenant.id).toBe('tenant-acme')
    expect(pack().tenant.name).toBe(PROFILE.name)
    expect(pack().findings.every((f) => f.id.endsWith('-acme') && f.tenantId === 'tenant-acme')).toBe(true)
    expect(store().getRepo().getTenant().id).toBe('tenant-acme')
    expect(store().dataRevision).toBe(0)
  })

  it('an answer in the clone cites only the clone’s records and never the starter’s', () => {
    store().createWorkspaceFromStarter(PROFILE, 'GRA')
    const known = new Set<string>()
    const record = pack() as unknown as Record<string, Array<{ id?: string }>>
    for (const key of Object.keys(record)) if (Array.isArray(record[key])) for (const x of record[key]) if (x?.id) known.add(x.id)
    for (const id of ['Q01', 'Q04', 'Q06', 'Q08', 'Q10', 'Q20', 'Q33']) {
      const def = QUESTION_BY_ID[id]
      const r = askEA360({ tenantId: pack().tenant.id, userRole: 'executive', query: def.label, intent: def.intent, questionId: id })
      expect(r.grounded, id).toBe(true)
      expect(r.tenantId).toBe('tenant-acme')
      for (const ref of r.entityRefs) {
        expect(known.has(ref.id), `${id} cites ${ref.id}`).toBe(true)
        expect(ref.id).not.toMatch(/-gra-\d+$/)
      }
    }
    const asGra = askEA360({ tenantId: 'tenant-gra', userRole: 'executive', query: QUESTION_BY_ID.Q01.label })
    expect(asGra.intent).toBe('cross_tenant_refused')
  })

  it('edits in the clone do not leak into the starter', () => {
    store().createWorkspaceFromStarter(PROFILE, 'GRA')
    const evidenceId = pack().evidence.find((e) => e.verificationStatus !== 'verified')!.id
    expect(store().markVerified({ id: evidenceId }).ok).toBe(true)
    store().switchTenant('GRA')
    const original = pack().evidence.find((e) => e.id === evidenceId.replace(/-acme$/, ''))!
    expect(original.verificationStatus).not.toBe('verified')
  })

  it('the clone is labelled synthetic and keeps the illustrative disclosure', () => {
    store().createWorkspaceFromStarter(PROFILE, 'GRA')
    expect(pack().tenant.synthetic).toBe(true)
    expect(pack().tenant.story).toMatch(/synthetic/i)
    expect(pack().tenant.story).toMatch(/not customer data/i)
  })
})

/* ------------------------------------------------------------------ */
describe('AT20 — briefing steps generate a real briefing', () => {
  it('applying a briefing step opens Ask on the Briefing tab with a recorded briefing', () => {
    const step = getDemoJourneys('GRA')
      .flatMap((j) => j.steps)
      .find((s) => s.action.openBriefing || s.ask?.mode === 'briefing')
    expect(step, 'a journey step opens the briefing').toBeTruthy()
    const historyBefore = store().aiHistory.length
    applyDemoStepWithStore(step!, { navigate: vi.fn() })
    expect(store().askOpen).toBe(true)
    expect(store().askTab).toBe('briefing')
    expect(store().aiHistory.length).toBe(historyBefore + 1)
    const response = store().aiHistory.at(-1)!
    expect(response.intent).toBe('executive_briefing')
    expect(store().lastBriefingResponseId).toBe(response.id)
    expect(response.asOfDate).toBe(store().demoAsOfDate)
    expect(response.dataRevision).toBe(store().dataRevision)
  })

  it('an Ask step runs its question; a step that only opens Ask does not run anything', () => {
    const asks = getDemoJourneys('GRA').flatMap((j) => j.steps).filter((s) => s.action.ask?.executeOnEnter && s.action.ask.questionId && s.action.ask.mode !== 'briefing')
    expect(asks.length).toBeGreaterThan(0)
    const step = asks[0]
    const before = store().aiHistory.length
    applyDemoStepWithStore(step, { navigate: vi.fn() })
    expect(store().aiHistory.length).toBe(before + 1)
    expect(store().aiHistory.at(-1)!.questionId).toBe(step.action.ask!.questionId)

    const opensOnly = getDemoJourneys('GRA').flatMap((j) => j.steps).find((s) => s.action.ask && !s.action.ask.executeOnEnter)
    if (opensOnly) {
      const count = store().aiHistory.length
      applyDemoStepWithStore(opensOnly, { navigate: vi.fn() })
      expect(store().aiHistory.length).toBe(count)
    }
  })

  it('draft and save steps never run on entry', () => {
    for (const step of getDemoJourneys('GRA').flatMap((j) => j.steps)) {
      if (step.ask?.mode === 'draft') expect(step.ask.executeOnEnter, step.id).toBe(false)
    }
  })

  it('a briefing is available for a freshly created runtime workspace too', () => {
    store().createWorkspaceFromStarter(PROFILE, 'BOG')
    const r = executiveBriefing({ tenantId: pack().tenant.id, userRole: 'executive', query: 'Generate an executive briefing.', intent: 'executive_briefing' })
    expect(r.grounded).toBe(true)
    expect(r.tenantId).toBe('tenant-acme')
  })
})
