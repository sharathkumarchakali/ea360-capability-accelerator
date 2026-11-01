import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePrototypeStore } from '../../state/prototypeStore'
import { applyDemoStepWithStore } from './applyDemoStep'
import { getDemoJourneys } from './demoJourneys'

const store = () => usePrototypeStore.getState()

describe('Prospect demo presentation fixes', () => {
  beforeEach(() => {
    store().resetDemo()
    store().exitGuidedTour()
  })

  it('selectEntity without openDetail keeps drawer closed', () => {
    store().selectEntity({ id: 'find-gra-02', type: 'finding' }, { openDetail: false })
    expect(store().selectedEntity?.id).toBe('find-gra-02')
    expect(store().entityDetailOpen).toBe(false)
  })

  it('closeEntityDetail preserves selected subject', () => {
    store().selectEntity({ id: 'find-gra-02', type: 'finding' }, { openDetail: true })
    store().closeEntityDetail()
    expect(store().selectedEntity?.id).toBe('find-gra-02')
    expect(store().entityDetailOpen).toBe(false)
  })

  it('guided step apply does not open entity drawer', () => {
    store().startGuidedTour('J1')
    const step = getDemoJourneys('GRA').find((j) => j.journeyId === 'J1')?.steps.find((s) => s.id === 'J1.3')
    expect(step).toBeTruthy()
    const nonce = store().bumpGuidedApplyNonce()
    applyDemoStepWithStore(step, { applyNonce: nonce, stepIndex: 2 }, store())
    expect(store().entityDetailOpen).toBe(false)
    expect(store().askOpen).toBe(false)
  })

  it('required skip marks incomplete and optional skip does not', () => {
    store().startGuidedTour('J1')
    const journey = getDemoJourneys('GRA').find((j) => j.journeyId === 'J1')!
    const step = journey.steps[1]
    store().setGuidedStep(1)
    const opt = store().skipGuidedStep({ stepId: step.id, marksIncomplete: false, stepCount: journey.steps.length })
    expect(store().guidedTour?.skipped ?? []).toHaveLength(0)
    expect(opt.incomplete).toBe(false)
    store().skipGuidedStep({ stepId: step.id, marksIncomplete: true, stepCount: journey.steps.length })
    expect(store().guidedTour?.skipped).toContain(step.id)
  })

  it('final-step required skip does not advance past last index', () => {
    store().startGuidedTour('J1')
    const journey = getDemoJourneys('GRA').find((j) => j.journeyId === 'J1')!
    const last = journey.steps.length - 1
    store().setGuidedStep(last)
    const step = journey.steps[last]
    const result = store().skipGuidedStep({
      stepId: step.id,
      marksIncomplete: true,
      stepCount: journey.steps.length,
    })
    expect(result.atEnd).toBe(true)
    expect(store().guidedTour?.stepIndex).toBe(last)
  })

  it('navigation apply does not append AI history', () => {
    const step = getDemoJourneys('GRA').flatMap((j) => j.steps).find((s) => s.action?.ask)
    expect(step).toBeTruthy()
    const before = store().aiHistory.length
    store().setAskOpen(false)
    applyDemoStepWithStore(step!, { navigate: vi.fn() }, store())
    expect(store().aiHistory.length).toBe(before)
    expect(store().askOpen).toBe(false)
  })
})
