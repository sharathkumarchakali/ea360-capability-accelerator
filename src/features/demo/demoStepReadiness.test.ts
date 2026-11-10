import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadTenantPack } from '../../data/repositories/tenantRepository'
import { usePrototypeStore } from '../../state/prototypeStore'
import { applyDemoStepWithStore } from './applyDemoStep'
import { getDemoJourneys } from './demoJourneys'
import { getJourneyBinding } from './journeyBindings'
import { shouldOpenDrawerDetailForStep } from './demoStepContract'
import { buildPlaylistJourney, resolveStepForRun } from './journeyDefinitions'
import { readinessBlocksNext, waitForDemoStepReady } from './waitForDemoStepReady'

const store = () => usePrototypeStore.getState()

describe('Demo step readiness (FIX-J01-J08)', () => {
  beforeEach(() => {
    store().resetDemo()
    store().exitGuidedTour()
  })

  it('J4.2 declares entity-detail and opens drawer detail during a guided tour', async () => {
    store().startGuidedTour('J4')
    store().setGuidedStep(1)
    const journey = getDemoJourneys('GRA').find((j) => j.journeyId === 'J4')!
    const step = journey.steps.find((s) => s.id === 'J4.2')!
    expect(step.target.name).toBe('entity-detail')
    expect(shouldOpenDrawerDetailForStep(step)).toBe(true)
    const binding = getJourneyBinding('GRA', 'J4')!
    const resolved = resolveStepForRun(step, store().workingPack, binding).step
    const nonce = store().bumpGuidedApplyNonce()
    applyDemoStepWithStore(resolved, { applyNonce: nonce, stepIndex: 1 }, store())
    await Promise.resolve()
    expect(store().selectedEntity?.type).toBe('dataObject')
    expect(store().entityDetailOpen).toBe(true)
  })

  it('J1.3 keeps the global drawer closed (inline finding detail)', () => {
    store().startGuidedTour('J1')
    const step = getDemoJourneys('GRA').find((j) => j.journeyId === 'J1')!.steps.find((s) => s.id === 'J1.3')!
    expect(shouldOpenDrawerDetailForStep(step)).toBe(false)
    const binding = getJourneyBinding('GRA', 'J1')!
    const resolved = resolveStepForRun(step, store().workingPack, binding).step
    applyDemoStepWithStore(resolved, { applyNonce: store().bumpGuidedApplyNonce(), stepIndex: 2 }, store())
    expect(store().entityDetailOpen).toBe(false)
    expect(store().selectedEntity?.type).toBe('finding')
  })

  it('missing mandatory record blocks Next', () => {
    const step = getDemoJourneys('GRA')[0].steps[0]
    const fake = {
      ...step,
      action: { ...step.action, selectEntity: { id: 'missing-record', type: 'finding' } },
      target: { ...step.target, name: 'entity-detail', requiredForReadiness: true },
    }
    const readiness = {
      routeReady: true,
      selectionReady: false,
      targetReady: false,
      graphRootReady: false,
      blockingReason: 'missing-record' as const,
    }
    expect(readinessBlocksNext(readiness, fake)).toBe(true)
  })

  it('optional missing highlight does not block when readiness marks targetReady true', () => {
    const step = getDemoJourneys('GRA')[0].steps[0]
    const relaxed = {
      ...step,
      target: { name: 'executive-health', requiredForReadiness: false, highlight: true },
    }
    const readiness = {
      routeReady: true,
      selectionReady: true,
      targetReady: true,
      graphRootReady: true,
      highlightWarning: 'missing-target' as const,
    }
    expect(readinessBlocksNext(readiness, relaxed)).toBe(false)
  })

  it('BoG J3 binds the RTGS–oversight interface (int-bog-12), not SWIFT', () => {
    const binding = getJourneyBinding('BOG', 'J3')!
    expect(binding.refs.integration?.id).toBe('int-bog-12')
    expect(binding.refs.finding?.id).toBe('find-bog-04')
    expect(binding.refs.decision?.id).toBe('dec-bog-02')
    expect(binding.refs.evidence?.id).toBe('ev-bog-06')
    expect(binding.refs.initiative?.id).toBe('init-bog-03')
    expect(binding.scenarioId).toBe('scenario-bog-payments')
  })

  it('BoG 7-min resilience playlist stays on payments scenario and ends on briefing', () => {
    const playlist = buildPlaylistJourney('BOG', 'bog-resilience-7')!
    expect(playlist.bound).toBe(true)
    expect(playlist.steps.map((s) => s.id)).toEqual([
      'J1:J1.2',
      'J3:J3.2',
      'J3:J3.3',
      'J3:J3.5b',
      'J3:J3.7',
      'J3:J3.8a',
      'J1:J1.7',
    ])
    for (const step of playlist.steps) {
      expect(step.action.scenarioId).toBe('scenario-bog-payments')
      expect(step.segmentJourneyId).toBe('J3')
    }
    const iface = playlist.steps.find((s) => s.id === 'J3:J3.2')!
    expect(iface.action.selectEntity).toMatchObject({ id: 'int-bog-12', type: 'integration' })
    const graph = playlist.steps.find((s) => s.id === 'J3:J3.3')!
    expect(graph.action.graphRoot).toMatchObject({ id: 'int-bog-12', type: 'integration' })
    const last = playlist.steps[playlist.steps.length - 1]
    expect(last.action.ask?.mode).toBe('briefing')
    expect(buildPlaylistJourney('GRA', 'bog-resilience-7')?.bound).toBe(false)
  })

  it('graph-root mismatch blocks Next', () => {
    const j3 = getDemoJourneys('BOG').find((j) => j.journeyId === 'J3')!
    const graphStep = j3.steps.find((s) => s.action.graphRoot)!
    const readiness = {
      routeReady: true,
      selectionReady: true,
      targetReady: true,
      graphRootReady: false,
      blockingReason: 'graph-root' as const,
    }
    expect(readinessBlocksNext(readiness, graphStep)).toBe(true)
  })

  it('waitForDemoStepReady aborts superseded work', async () => {
    const controller = new AbortController()
    const step = getDemoJourneys('GRA')[0].steps[0]
    controller.abort()
    await expect(
      waitForDemoStepReady({
        step,
        getState: () => ({
          view: store().view,
          selectedEntity: store().selectedEntity,
          workingPack: store().workingPack,
        }),
        signal: controller.signal,
      }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('navigation apply never opens Ask', () => {
    const step = getDemoJourneys('GRA').flatMap((j) => j.steps).find((s) => s.action?.ask)!
    const before = store().aiHistory.length
    store().setAskOpen(false)
    applyDemoStepWithStore(step, { navigate: vi.fn() }, store())
    expect(store().askOpen).toBe(false)
    expect(store().aiHistory.length).toBe(before)
  })

  it('every GRA J4 step resolves bound data selections in pack', () => {
    const pack = loadTenantPack('GRA')
    const binding = getJourneyBinding('GRA', 'J4')!
    const journey = getDemoJourneys('GRA').find((j) => j.journeyId === 'J4')!
    for (const step of journey.steps) {
      const { step: resolved } = resolveStepForRun(step, pack, binding)
      const sel = resolved.action.selectEntity
      if (sel?.type === 'dataObject') {
        expect(pack.dataObjects.some((d) => d.id === sel.id), step.id).toBe(true)
      }
    }
  })

  it('retry nonce increments without changing step index', () => {
    store().startGuidedTour('J1')
    store().setGuidedStep(2)
    store().retryGuidedStep()
    expect(store().guidedTour?.stepIndex).toBe(2)
    expect(store().guidedTour?.retryNonce).toBe(1)
  })
})

describe('GuidedDemoBar wiring', () => {
  it('uses abortable readiness instead of fixed sleep polling', async () => {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const src = readFileSync(resolve(import.meta.dirname, 'GuidedDemoBar.jsx'), 'utf8')
    expect(src).toContain('waitForDemoStepReady')
    expect(src).not.toMatch(/await new Promise\(\(r\) => setTimeout\(r, 120\)\)/)
    expect(src).toMatch(/\}, \[step, guidedTour\?\.active, stepIndex, retryNonce,/)
  })
})
