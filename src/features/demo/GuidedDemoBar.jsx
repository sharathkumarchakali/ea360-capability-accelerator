import { useEffect, useMemo } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { getDemoJourneys } from './demoJourneys'
import { applyDemoStepWithStore } from './applyDemoStep'

export default function GuidedDemoBar({ onNavigate }) {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const guidedTour = usePrototypeStore((s) => s.guidedTour)
  const setGuidedStep = usePrototypeStore((s) => s.setGuidedStep)
  const exitGuidedTour = usePrototypeStore((s) => s.exitGuidedTour)
  const restartGuidedTour = usePrototypeStore((s) => s.restartGuidedTour)

  const journey = useMemo(() => {
    if (!guidedTour?.journeyId) return null
    return getDemoJourneys(tenantCode).find((j) => j.id === guidedTour.journeyId) || null
  }, [tenantCode, guidedTour?.journeyId])

  const stepIndex = guidedTour?.stepIndex ?? 0
  const step = journey?.steps[stepIndex] || null
  const total = journey?.steps.length || 0

  useEffect(() => {
    if (!step || !guidedTour?.active) return
    applyDemoStepWithStore(step, { navigate: onNavigate }, usePrototypeStore.getState())

    const selector = step.highlightSelector
    if (!selector || typeof document === 'undefined') return undefined
    const nodes = document.querySelectorAll(selector)
    nodes.forEach((n) => n.classList.add('demo-highlight'))
    return () => nodes.forEach((n) => n.classList.remove('demo-highlight'))
  }, [step, guidedTour?.active, guidedTour?.stepIndex, onNavigate])

  if (!guidedTour?.active || !journey || !step) return null

  return (
    <div className="guided-demo-bar" role="region" aria-label="Guided demonstration">
      <div className="guided-demo-meta">
        <span className="guided-pill">{journey.title}</span>
        <span className="guided-progress">
          Step {stepIndex + 1} of {total}
        </span>
      </div>
      <div className="guided-demo-copy">
        <strong>{step.title}</strong>
        <p>{step.businessRelevance}</p>
      </div>
      <div className="guided-demo-actions">
        <button
          type="button"
          className="btn tiny secondary-button"
          disabled={stepIndex <= 0}
          onClick={() => setGuidedStep(Math.max(0, stepIndex - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="btn tiny primary-button"
          onClick={() => {
            if (stepIndex >= total - 1) exitGuidedTour()
            else setGuidedStep(stepIndex + 1)
          }}
        >
          {stepIndex >= total - 1 ? 'Finish' : 'Next'}
        </button>
        <button type="button" className="btn tiny secondary-button" onClick={() => restartGuidedTour()}>
          Restart
        </button>
        <button type="button" className="btn tiny secondary-button" onClick={() => exitGuidedTour()}>
          Exit
        </button>
      </div>
    </div>
  )
}
