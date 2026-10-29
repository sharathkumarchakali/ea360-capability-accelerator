import { useEffect, useMemo, useRef, useState } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { DEMO_TARGET_SELECTORS, evaluatePredicate, getDemoJourneyById, resolveStepForRun } from './journeyDefinitions'
import { getJourneyBinding } from './journeyBindings'
import { applyDemoStepWithStore } from './applyDemoStep'

function targetSelector(step) {
  const name = step?.highlightTarget || step?.target?.name
  if (name && DEMO_TARGET_SELECTORS[name]) return DEMO_TARGET_SELECTORS[name]
  if (name) return `[data-demo-target="${name}"]`
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

function noteDocument(journeyTitle, step, index, total) {
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Presenter notes</title>
<style>body{font-family:Inter,system-ui,sans-serif;margin:0;padding:20px;line-height:1.5;color:#073642}
small{opacity:.75}h1{font-size:18px;margin:4px 0 12px}p{font-size:16px;margin:0 0 12px}</style></head>
<body><small>${esc(journeyTitle)} · Step ${index + 1} of ${total} · Illustrative data</small>
<h1>${esc(step.title)}</h1><p><strong>Say / do:</strong> ${esc(step.presenterNote)}</p>
<p><strong>Expect:</strong> ${esc(step.expectedResult)}</p>
${step.humanAction ? `<p><strong>Human action required:</strong> ${esc(step.humanAction)}</p>` : ''}
</body></html>`
}

export default function GuidedDemoBar({ onNavigate }) {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const guidedTour = usePrototypeStore((s) => s.guidedTour)
  const presentationMode = usePrototypeStore((s) => s.presentationMode)
  const workingPack = usePrototypeStore((s) => s.workingPack)
  const drafts = usePrototypeStore((s) => s.recommendationDrafts)
  const setGuidedStep = usePrototypeStore((s) => s.setGuidedStep)
  const retryGuidedStep = usePrototypeStore((s) => s.retryGuidedStep)
  const exitGuidedTour = usePrototypeStore((s) => s.exitGuidedTour)
  const restartGuidedTour = usePrototypeStore((s) => s.restartGuidedTour)
  const skipGuidedStep = usePrototypeStore((s) => s.skipGuidedStep)
  const showToast = usePrototypeStore((s) => s.showToast)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const [problem, setProblem] = useState(null)
  const [ready, setReady] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const highlightRef = useRef([])
  const applyGen = useRef(0)
  const notesWin = useRef(null)

  const journey = useMemo(() => {
    if (!guidedTour?.journeyId) return null
    return getDemoJourneyById(tenantCode, guidedTour.journeyId)
  }, [tenantCode, guidedTour?.journeyId])

  const stepIndex = guidedTour?.stepIndex ?? 0
  const retryNonce = guidedTour?.retryNonce ?? 0
  const step = journey?.steps[stepIndex] || null
  const total = journey?.steps.length || 0
  const skipped = guidedTour?.skipped ?? []
  const incomplete = skipped.length > 0

  const binding = useMemo(() => {
    if (!journey) return null
    const jid = step?.segmentJourneyId || (journey.journeyId !== 'playlist' ? journey.journeyId : null)
    return jid ? getJourneyBinding(tenantCode, jid) : null
  }, [journey, step?.segmentJourneyId, tenantCode])

  // Poll only for localStorage-backed predicates (import commit).
  useEffect(() => {
    if (!step?.completesWhen?.includes('import-committed')) return undefined
    const t = setInterval(() => setTick((n) => n + 1), 700)
    return () => clearInterval(t)
  }, [step])

  const gateOpen = useMemo(() => {
    if (!step?.completesWhen?.length) return true
    return step.completesWhen.every((p) =>
      evaluatePredicate(p, { pack: workingPack, binding, recommendationDrafts: drafts, tenantCode }),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, workingPack, binding, drafts, tenantCode, tick])

  // Apply the step. Re-runs on explicit Retry (retryNonce) even when the index is unchanged.
  useEffect(() => {
    if (!step || !guidedTour?.active) return undefined

    const gen = ++applyGen.current
    setReady(false)
    setProblem(null)

    highlightRef.current.forEach((n) => n.classList.remove('demo-highlight'))
    highlightRef.current = []

    const state = usePrototypeStore.getState()
    const { step: resolved, unresolvedSlot } = resolveStepForRun(step, state.workingPack, binding)

    if (unresolvedSlot) {
      setProblem({
        kind: 'slot',
        message: `This step needs the ${unresolvedSlot} created in an earlier human step. Complete that step, then Retry.`,
      })
      applyDemoStepWithStore({ ...resolved, action: { ...resolved.action, selectEntity: undefined } }, { navigate: onNavigate }, state)
      setReady(true)
      return undefined
    }

    applyDemoStepWithStore(resolved, { navigate: onNavigate }, state)

    const selector = targetSelector(resolved)
    const expectedId = resolved.action?.selectEntity?.id
    let cancelled = false

    ;(async () => {
      await new Promise((r) => setTimeout(r, 120))
      if (cancelled || gen !== applyGen.current) return

      const el = await waitForTarget(selector)
      if (cancelled || gen !== applyGen.current) return

      if (selector && !el) {
        setProblem({
          kind: 'target',
          message: `The expected screen area (“${resolved.target?.name}”) did not appear. The journey is paused rather than highlighting something unrelated.`,
        })
        setReady(true)
        return
      }

      if (expectedId && usePrototypeStore.getState().selectedEntity?.id !== expectedId) {
        setProblem({
          kind: 'selection',
          message: 'The bound record did not open. The journey is paused rather than showing a different record.',
        })
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
      setProblem(null)
      setReady(true)
    })()

    return () => {
      cancelled = true
      highlightRef.current.forEach((n) => n.classList.remove('demo-highlight'))
      highlightRef.current = []
    }
    // retryNonce intentionally included so Retry re-applies the same step index.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, guidedTour?.active, stepIndex, retryNonce, onNavigate, binding])

  // Presenter notes window follows the current step.
  useEffect(() => {
    const w = notesWin.current
    if (!w || w.closed || !step || !journey) return
    w.document.open()
    w.document.write(noteDocument(journey.title, step, stepIndex, total))
    w.document.close()
  }, [step, journey, stepIndex, total])

  useEffect(
    () => () => {
      if (notesWin.current && !notesWin.current.closed) notesWin.current.close()
    },
    [],
  )

  if (!guidedTour?.active || !journey || !step) return null

  const isLast = stepIndex >= total - 1
  const notesAllowed = !presentationMode

  function finish() {
    if (incomplete) {
      showToast(`Journey finished — Incomplete (${skipped.length} required step${skipped.length === 1 ? '' : 's'} skipped).`)
    } else {
      showToast('Journey complete.')
    }
    exitGuidedTour()
  }

  function openNotesWindow() {
    const w = window.open('', 'ea360-presenter-notes', 'width=480,height=520')
    if (!w) {
      showToast('The notes window was blocked by the browser. Use the in-page panel instead.')
      setNotesOpen(true)
      return
    }
    notesWin.current = w
    w.document.open()
    w.document.write(noteDocument(journey.title, step, stepIndex, total))
    w.document.close()
  }

  function returnToStudio() {
    exitGuidedTour()
    onNavigate?.('demo-studio')
  }

  return (
    <div className="guided-demo-bar" role="region" aria-label="Guided demonstration">
      <div className="guided-demo-meta">
        <span className="guided-pill">{journey.title}</span>
        <span className="guided-progress">
          Step {stepIndex + 1} of {total}
        </span>
        <progress className="guided-meter" max={total} value={stepIndex + 1} aria-label="Journey progress" />
        {incomplete && (
          <span className="guided-incomplete" role="status">
            Incomplete — {skipped.length} required step{skipped.length === 1 ? '' : 's'} skipped
          </span>
        )}
      </div>
      <div className="guided-demo-copy">
        {step.segmentStart && (
          <p className="sub">
            Segment {step.segmentJourneyId}: starts at its own baseline. Reset the workspace first if you need an
            untouched starting position.
          </p>
        )}
        <strong>{step.title}</strong>
        <p>
          <span className="guided-label">Business question</span> {step.businessQuestion}
        </p>
        <p>
          <span className="guided-label">Expect to see</span> {step.expectedResult}
        </p>
        {step.humanAction && !gateOpen && (
          <p className="guided-warning" role="status">
            Human action needed: {step.humanAction} Next unlocks when it is done.
          </p>
        )}
        {problem && (
          <p className="guided-warning" role="alert">
            {problem.message}
          </p>
        )}
        {!ready && <p className="sub">Preparing step…</p>}
        {notesAllowed && notesOpen && (
          <div className="guided-notes-panel" role="note" aria-label="Presenter notes">
            <strong>Presenter notes (not shown in presentation mode)</strong>
            <p>{step.presenterNote}</p>
          </div>
        )}
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
          disabled={!gateOpen}
          title={!gateOpen ? 'Complete the required human action first' : undefined}
          onClick={() => {
            if (isLast) finish()
            else setGuidedStep(stepIndex + 1)
          }}
        >
          {isLast ? 'Finish' : 'Next'}
        </button>
        <button type="button" className="btn tiny secondary-button" onClick={() => retryGuidedStep()}>
          Retry
        </button>
        <button
          type="button"
          className="btn tiny secondary-button"
          title={step.optional ? 'Optional exploration step' : 'Skipping a required step marks the run Incomplete'}
          onClick={() => {
            skipGuidedStep(step.id, !step.optional)
            if (isLast) finish()
          }}
        >
          Skip
        </button>
        <button
          type="button"
          className="btn tiny secondary-button"
          title="Return to step 1 and clear this run's Ask panel. Workspace data is kept; use Workspace Settings to reset."
          onClick={() => {
            setAskOpen(false)
            restartGuidedTour()
          }}
        >
          Restart journey
        </button>
        {notesAllowed && (
          <>
            <button
              type="button"
              className="btn tiny secondary-button"
              aria-pressed={notesOpen}
              onClick={() => setNotesOpen((v) => !v)}
            >
              {notesOpen ? 'Hide notes' : 'Notes'}
            </button>
            <button type="button" className="btn tiny secondary-button" onClick={openNotesWindow}>
              Notes window
            </button>
          </>
        )}
        {problem && (
          <button type="button" className="btn tiny secondary-button" onClick={returnToStudio}>
            Return to Studio
          </button>
        )}
        <button type="button" className="btn tiny secondary-button" onClick={() => exitGuidedTour()}>
          Exit
        </button>
      </div>
    </div>
  )
}
