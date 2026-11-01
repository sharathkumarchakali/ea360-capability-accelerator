import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, MoreHorizontal } from 'lucide-react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { evaluatePredicate, getDemoJourneyById, resolveStepForRun } from './journeyDefinitions'
import { getJourneyBinding } from './journeyBindings'
import { applyDemoStepWithStore, runGuidedAskOffer } from './applyDemoStep'
import { QUESTION_BY_ID } from '../../lib/ai/questionCatalog'
import {
  problemMessageForReadiness,
  readinessBlocksNext,
  waitForDemoStepReady,
} from './waitForDemoStepReady'

function noteDocument(journeyTitle, step, index, total) {
  const esc = (s) =>
    String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Presenter notes</title>
<style>body{font-family:Inter,system-ui,sans-serif;margin:0;padding:20px;line-height:1.5;color:#102a35}
small{opacity:.75}h1{font-size:18px;margin:4px 0 12px}p{font-size:16px;margin:0 0 12px}</style></head>
<body><small>${esc(journeyTitle)} · Step ${index + 1} of ${total} · Illustrative data</small>
<h1>${esc(step.title)}</h1><p><strong>Say / do:</strong> ${esc(step.presenterNote)}</p>
<p><strong>Expect:</strong> ${esc(step.expectedResult)}</p>
${step.humanAction ? `<p><strong>Human action required:</strong> ${esc(step.humanAction)}</p>` : ''}
${step.businessQuestion ? `<p><strong>Business question:</strong> ${esc(step.businessQuestion)}</p>` : ''}
</body></html>`
}

function stepAskOffer(step) {
  const action = step?.action || {}
  if (action.ask?.questionId) {
    return { kind: 'ask', questionId: action.ask.questionId, label: QUESTION_BY_ID[action.ask.questionId]?.label }
  }
  if (action.openBriefing || action.ask?.mode === 'briefing') {
    return { kind: 'briefing', label: 'Generate executive briefing' }
  }
  if (action.openAsk) return { kind: 'ask-open', label: 'Open Ask EA360' }
  return null
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
  const bumpGuidedApplyNonce = usePrototypeStore((s) => s.bumpGuidedApplyNonce)
  const showToast = usePrototypeStore((s) => s.showToast)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const closeEntityDetail = usePrototypeStore((s) => s.closeEntityDetail)
  const [problem, setProblem] = useState(null)
  const [highlightWarning, setHighlightWarning] = useState(null)
  const [ready, setReady] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [tick, setTick] = useState(0)
  const highlightRef = useRef([])
  const stepExecId = useRef(0)
  const abortRef = useRef(null)
  const notesWin = useRef(null)
  const moreRef = useRef(null)

  const journey = useMemo(() => {
    if (!guidedTour?.journeyId) return null
    return getDemoJourneyById(tenantCode, guidedTour.journeyId)
  }, [tenantCode, guidedTour?.journeyId])

  const stepIndex = guidedTour?.stepIndex ?? 0
  const retryNonce = guidedTour?.retryNonce ?? 0
  const step = journey?.steps[stepIndex] || null
  const total = journey?.steps.length || 0
  const skipped = guidedTour?.skipped ?? []
  const askOffer = step ? stepAskOffer(step) : null

  const binding = useMemo(() => {
    if (!journey) return null
    const jid = step?.segmentJourneyId || (journey.journeyId !== 'playlist' ? journey.journeyId : null)
    return jid ? getJourneyBinding(tenantCode, jid) : null
  }, [journey, step?.segmentJourneyId, tenantCode])

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

  useEffect(() => {
    if (!step || !guidedTour?.active) return undefined

    const execId = ++stepExecId.current
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setReady(false)
    setProblem(null)
    setHighlightWarning(null)
    setDetailsOpen(false)
    setMoreOpen(false)

    highlightRef.current.forEach((n) => n.classList.remove('demo-highlight'))
    highlightRef.current = []

    const state = usePrototypeStore.getState()
    if (!step.action?.selectEntity) {
      closeEntityDetail()
    }

    const { step: resolved, unresolvedSlot } = resolveStepForRun(step, state.workingPack, binding)

    if (unresolvedSlot) {
      setProblem({
        kind: 'slot',
        message: `This step needs the ${unresolvedSlot} from an earlier human step. Complete that step, then Retry.`,
      })
      const applyNonce = bumpGuidedApplyNonce()
      applyDemoStepWithStore(
        { ...resolved, action: { ...resolved.action, selectEntity: undefined } },
        { navigate: onNavigate, applyNonce, stepIndex },
        state,
      )
      setReady(false)
      return () => controller.abort()
    }

    const applyNonce = bumpGuidedApplyNonce()
    applyDemoStepWithStore(resolved, { navigate: onNavigate, applyNonce, stepIndex }, state)

    ;(async () => {
      try {
        const readiness = await waitForDemoStepReady({
          step: resolved,
          getState: () => {
            const s = usePrototypeStore.getState()
            return { view: s.view, selectedEntity: s.selectedEntity, workingPack: s.workingPack }
          },
          signal: controller.signal,
        })
        if (execId !== stepExecId.current) return

        if (readiness.highlightWarning === 'missing-target' && !readiness.blockingReason) {
          if (import.meta.env.DEV) {
            console.warn('[EA360 demo] Focus highlight unavailable', {
              journeyId: guidedTour.journeyId,
              stepId: resolved.id,
              route: resolved.route,
              target: resolved.target?.name,
            })
          }
          setHighlightWarning('Focus highlight unavailable')
        }

        const blockMsg = problemMessageForReadiness(readiness, resolved)
        if (readinessBlocksNext(readiness, resolved) && blockMsg) {
          setProblem({
            kind: readiness.blockingReason || 'target',
            message: blockMsg,
          })
          setReady(false)
          return
        }

        const el = readiness.target
        if (el && resolved.target?.highlight !== false) {
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
      } catch (err) {
        if (err?.name === 'AbortError') return
        if (execId !== stepExecId.current) return
        if (import.meta.env.DEV) console.warn('[EA360 demo] Step readiness failed', err)
        setProblem({
          kind: 'target',
          message: 'This step could not be prepared. Retry or use Step details.',
        })
        setReady(false)
      }
    })()

    return () => {
      controller.abort()
      highlightRef.current.forEach((n) => n.classList.remove('demo-highlight'))
      highlightRef.current = []
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, guidedTour?.active, stepIndex, retryNonce, onNavigate, binding])

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

  useEffect(() => {
    if (!moreOpen) return undefined
    function onDoc(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [moreOpen])

  if (!guidedTour?.active || !journey || !step) return null

  const isLast = stepIndex >= total - 1
  const notesAllowed = !presentationMode
  const progressPct = total ? Math.round(((stepIndex + 1) / total) * 100) : 0
  const stepBlocked = Boolean(problem && ['target', 'selection', 'slot', 'route', 'missing-record'].includes(problem.kind))
  const gateBlocked = Boolean(step.humanAction && !gateOpen)
  const runIncomplete = skipped.length > 0

  function tourIncompleteNow() {
    const tour = usePrototypeStore.getState().guidedTour
    if ((tour?.skipped ?? []).length > 0) return true
    if (gateBlocked) return true
    if (stepBlocked) return true
    return false
  }

  function finish() {
    if (tourIncompleteNow()) {
      const n = usePrototypeStore.getState().guidedTour?.skipped?.length ?? 0
      showToast(
        n > 0
          ? `Journey finished — Incomplete (${n} required step${n === 1 ? '' : 's'} skipped).`
          : 'Journey finished — Incomplete (required actions or readiness checks remain).',
      )
    } else {
      showToast('Journey complete.')
    }
    exitGuidedTour()
  }

  function skipCurrentStep(marksIncomplete) {
    const result = skipGuidedStep({ stepId: step.id, marksIncomplete, stepCount: total })
    setMoreOpen(false)
    if (result.atEnd) finish()
  }

  function confirmRestart() {
    if (typeof window !== 'undefined' && !window.confirm('Restart this walkthrough from step 1? Workspace data is kept.')) return
    setAskOpen(false)
    restartGuidedTour()
  }

  function confirmExit() {
    if (typeof window !== 'undefined' && !window.confirm('End this guided walkthrough?')) return
    exitGuidedTour()
  }

  function openNotesWindow() {
    const w = window.open('', 'ea360-presenter-notes', 'width=480,height=520')
    if (!w) {
      showToast('Notes window blocked — use Step details instead.')
      setDetailsOpen(true)
      return
    }
    notesWin.current = w
    w.document.open()
    w.document.write(noteDocument(journey.title, step, stepIndex, total))
    w.document.close()
  }

  function runSuggestedAsk() {
    const resolved = resolveStepForRun(step, usePrototypeStore.getState().workingPack, binding).step
    if (askOffer?.kind === 'ask-open') {
      setAskOpen(true)
      setMoreOpen(false)
      return
    }
    runGuidedAskOffer(resolved, usePrototypeStore.getState())
    setMoreOpen(false)
  }

  return (
    <div className="demo-tour-bar" role="region" aria-label="Guided demonstration">
      <div className="demo-tour-bar__progress">
        <span className="demo-tour-bar__journey">{journey.title}</span>
        <span className="demo-tour-bar__count">
          {stepIndex + 1} of {total}
        </span>
        <div className="demo-tour-bar__meter" aria-hidden="true">
          <span style={{ width: `${progressPct}%` }} />
        </div>
        <progress className="sr-only" max={total} value={stepIndex + 1} aria-label="Journey progress" />
        {runIncomplete && (
          <span className="demo-tour-bar__warn" role="status">
            Incomplete
          </span>
        )}
      </div>

      <div className="demo-tour-bar__step">
        <h2 className="demo-tour-bar__title">{step.title}</h2>
        {!ready && <span className="demo-tour-bar__preparing">Preparing…</span>}
        {problem && (
          <p className="demo-tour-bar__alert" role="alert">
            {problem.message}
          </p>
        )}
        {step.humanAction && !gateOpen && (
          <p className="demo-tour-bar__hint" role="status">
            Complete: {step.humanAction}
          </p>
        )}
        {detailsOpen && (
          <div className="demo-tour-bar__details" role="region" aria-label="Step details">
            {highlightWarning && (
              <p className="demo-tour-bar__hint" role="status">
                {highlightWarning}
              </p>
            )}
            {step.businessQuestion && (
              <p>
                <strong>Business question:</strong> {step.businessQuestion}
              </p>
            )}
            <p>
              <strong>Expect to see:</strong> {step.expectedResult}
            </p>
            {notesAllowed && <p>{step.presenterNote}</p>}
          </div>
        )}
      </div>

      <div className="demo-tour-bar__nav">
        {askOffer?.kind === 'briefing' && (
          <button type="button" className="btn secondary-button demo-tour-btn" onClick={runSuggestedAsk}>
            Generate briefing
          </button>
        )}
        <button
          type="button"
          className="btn secondary-button demo-tour-btn"
          disabled={stepIndex <= 0}
          onClick={() => setGuidedStep(Math.max(0, stepIndex - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="btn primary-button demo-tour-btn demo-tour-btn--primary"
          disabled={!gateOpen || !ready || stepBlocked}
          title={
            stepBlocked
              ? 'Resolve the step issue or Retry first'
              : !gateOpen
                ? 'Complete the required human action first'
                : undefined
          }
          onClick={() => {
            if (isLast) finish()
            else setGuidedStep(stepIndex + 1)
          }}
        >
          {isLast ? 'Finish' : 'Next'}
        </button>

        <div className="demo-tour-more" ref={moreRef}>
          <button
            type="button"
            className="btn secondary-button demo-tour-btn demo-tour-btn--icon"
            aria-expanded={moreOpen}
            aria-haspopup="menu"
            onClick={() => setMoreOpen((v) => !v)}
          >
            <MoreHorizontal size={18} strokeWidth={2} aria-hidden="true" />
            <span>More</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>
          {moreOpen && (
            <div className="demo-tour-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => setDetailsOpen((v) => !v)}>
                {detailsOpen ? 'Hide step details' : 'Step details'}
              </button>
              {askOffer && (
                <button type="button" role="menuitem" onClick={runSuggestedAsk}>
                  {askOffer.kind === 'briefing' ? 'Generate briefing (Ask)' : askOffer.label || 'Run suggested Ask'}
                </button>
              )}
              {problem && (
                <button type="button" role="menuitem" onClick={() => retryGuidedStep()}>
                  Retry step
                </button>
              )}
              {!step.optional && (
                <button type="button" role="menuitem" onClick={() => skipCurrentStep(true)}>
                  Skip step (marks incomplete)
                </button>
              )}
              {step.optional && (
                <button type="button" role="menuitem" onClick={() => skipCurrentStep(false)}>
                  Skip optional step
                </button>
              )}
              {notesAllowed && (
                <button type="button" role="menuitem" onClick={openNotesWindow}>
                  Presenter notes window
                </button>
              )}
              <button type="button" role="menuitem" onClick={confirmRestart}>
                Restart walkthrough
              </button>
              <button type="button" role="menuitem" onClick={confirmExit}>
                End demo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
