import { useEffect, useMemo, useRef, useState } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { getDemoJourneys } from './demoJourneys'
import { applyDemoStepWithStore } from './applyDemoStep'

function targetSelector(step) {
  if (step?.highlightTarget) return `[data-demo-target="${step.highlightTarget}"]`
  const legacy = {
    '.explorer-canvas': '[data-demo-target="relationship-explorer"]',
    '.maturity-card': '[data-demo-target="executive-health"], .maturity-card',
    '.findings-register': '[data-demo-target="findings-register"], .findings-register',
    '.heat-cell': '[data-demo-target="capability-heatmap"], .heat-cell',
    '.rec-card': '[data-demo-target="recommendations-list"], .rec-card',
    '.roadmap-board': '[data-demo-target="roadmap-board"], .roadmap-board',
    '.decision-card': '[data-demo-target="governance-decisions"]',
    '.portfolio-table': '[data-demo-target="application-portfolio"], .portfolio-table-desktop',
    '.topology-card': '[data-demo-target="integration-topology"], .topology-card',
    '.evidence-card': '[data-demo-target="evidence-panel"], .evidence-card',
    '.cockpit-metrics': '[data-demo-target="executive-health"], .cockpit-metrics',
  }
  if (step?.highlightSelector) return legacy[step.highlightSelector] || step.highlightSelector
  // Default for explorer steps
  if (step?.action?.view === 'explorer') return '[data-demo-target="relationship-explorer"]'
  return null
}

function waitForTarget(selector, { timeoutMs = 2500, intervalMs = 80 } = {}) {
  return new Promise((resolve) => {
    if (!selector || typeof document === 'undefined') {
      resolve(null)
      return
    }
    const started = Date.now()
    const tick = () => {
      const el = document.querySelector(selector)
      if (el) {
        resolve(el)
        return
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(null)
        return
      }
      setTimeout(tick, intervalMs)
    }
    tick()
  })
}

export default function GuidedDemoBar({ onNavigate }) {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const guidedTour = usePrototypeStore((s) => s.guidedTour)
  const setGuidedStep = usePrototypeStore((s) => s.setGuidedStep)
  const exitGuidedTour = usePrototypeStore((s) => s.exitGuidedTour)
  const restartGuidedTour = usePrototypeStore((s) => s.restartGuidedTour)
  const skipGuidedStep = usePrototypeStore((s) => s.skipGuidedStep)
  const [targetMissing, setTargetMissing] = useState(false)
  const [ready, setReady] = useState(false)
  const highlightRef = useRef([])
  const applyGen = useRef(0)

  const journey = useMemo(() => {
    if (!guidedTour?.journeyId) return null
    return getDemoJourneys(tenantCode).find((j) => j.id === guidedTour.journeyId) || null
  }, [tenantCode, guidedTour?.journeyId])

  const stepIndex = guidedTour?.stepIndex ?? 0
  const step = journey?.steps[stepIndex] || null
  const total = journey?.steps.length || 0

  useEffect(() => {
    if (!step || !guidedTour?.active) return undefined

    const gen = ++applyGen.current
    setReady(false)
    setTargetMissing(false)

    // Clear previous highlights
    highlightRef.current.forEach((n) => n.classList.remove('demo-highlight'))
    highlightRef.current = []

    applyDemoStepWithStore(step, { navigate: onNavigate }, usePrototypeStore.getState())

    const selector = targetSelector(step)
    let cancelled = false

    ;(async () => {
      // Allow lazy view to mount after navigation
      await new Promise((r) => setTimeout(r, 120))
      if (cancelled || gen !== applyGen.current) return

      const el = await waitForTarget(selector)
      if (cancelled || gen !== applyGen.current) return

      if (selector && !el) {
        if (import.meta.env.DEV) {
          console.warn('[EA360] Guided demo target missing', {
            stepId: step.id,
            selector,
            view: step.action?.view,
          })
        }
        setTargetMissing(true)
        setReady(true)
        return
      }

      if (el) {
        el.classList.add('demo-highlight')
        highlightRef.current = [el]
        try {
          el.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
        } catch {
          /* ignore */
        }
      }
      setTargetMissing(false)
      setReady(true)
    })()

    return () => {
      cancelled = true
      highlightRef.current.forEach((n) => n.classList.remove('demo-highlight'))
      highlightRef.current = []
    }
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
        {targetMissing && (
          <p className="guided-warning" role="status">
            This step’s highlight target is not available on screen. You can retry, skip, or continue
            with the relationship list / current view.
          </p>
        )}
        {!ready && <p className="sub">Preparing step…</p>}
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
        <button
          type="button"
          className="btn tiny secondary-button"
          onClick={() => {
            // Retry current step application
            applyGen.current += 1
            setGuidedStep(stepIndex)
          }}
        >
          Retry
        </button>
        <button
          type="button"
          className="btn tiny secondary-button"
          onClick={() => {
            if (stepIndex >= total - 1) exitGuidedTour()
            else if (skipGuidedStep) skipGuidedStep()
            else setGuidedStep(stepIndex + 1)
          }}
        >
          Skip
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
