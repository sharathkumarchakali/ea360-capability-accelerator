import { useEffect, useMemo, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'
import {
  QUESTION_BY_ID,
  askEA360,
  availableFollowUps,
  draftRecommendation,
  executiveBriefing,
  impactNarrative,
  matchFollowUpKind,
  resolveFollowUp,
  suggestedQuestionsForContext,
} from '../../lib/ai'
import { usePrototypeStore } from '../../state/prototypeStore'
import { getDemoJourneyById } from '../demo/journeyDefinitions'
import AIResponse from './AIResponse'
import RecommendationDraftReview from './RecommendationDraftReview'
import ExecutiveBriefing from './ExecutiveBriefing'

export const ASK_PANEL_LABEL = 'Prototype assistant · answers from this workspace'

/** Default screen for an entity type when an Ask action opens a record. */
const VIEW_FOR_TYPE = {
  finding: 'findings',
  evidence: 'evidence',
  recommendation: 'recommendations',
  decision: 'governance',
  initiative: 'initiatives',
  capability: 'capabilities',
  application: 'applications',
  integration: 'integrations',
  dataObject: 'data-information',
  technology: 'technology-infrastructure',
  aiSolution: 'ai-automation',
  aiModel: 'ai-automation',
  kpi: 'kpis',
}

/** Local Ask state is keyed by workspace + data revision, so a tenant switch or pack change clears it. */
export default function AskEA360Panel({ onNavigate }) {
  const askOpen = usePrototypeStore((s) => s.askOpen)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const dataRevision = usePrototypeStore((s) => s.dataRevision)
  if (!askOpen) return null
  return <AskPanelBody key={`${tenantCode}:${dataRevision}`} onNavigate={onNavigate} />
}

function AskPanelBody({ onNavigate }) {
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const aiHistory = usePrototypeStore((s) => s.aiHistory)
  const lastAiResponseId = usePrototypeStore((s) => s.lastAiResponseId)
  const recordAiResponse = usePrototypeStore((s) => s.recordAiResponse)
  const saveRecommendationDraft = usePrototypeStore((s) => s.saveRecommendationDraft)
  const reviewAiResponse = usePrototypeStore((s) => s.reviewAiResponse)
  const recommendationDrafts = usePrototypeStore((s) => s.recommendationDrafts)
  const role = usePrototypeStore((s) => s.role)
  const view = usePrototypeStore((s) => s.view)
  const filters = usePrototypeStore((s) => s.filters)
  const selectedEntity = usePrototypeStore((s) => s.selectedEntity)
  const graphRoot = usePrototypeStore((s) => s.graphRoot)
  const getRepo = usePrototypeStore((s) => s.getRepo)
  const setView = usePrototypeStore((s) => s.setView)
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setGraphRoot = usePrototypeStore((s) => s.setGraphRoot)
  const briefingPreferences = usePrototypeStore((s) => s.briefingPreferences)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const demoAsOfDate = usePrototypeStore((s) => s.demoAsOfDate)
  const dataRevision = usePrototypeStore((s) => s.dataRevision)
  const importValidation = usePrototypeStore((s) => s.importValidation)
  const askTab = usePrototypeStore((s) => s.askTab)
  const setAskTab = usePrototypeStore((s) => s.setAskTab)
  const setLastBriefingResponseId = usePrototypeStore((s) => s.setLastBriefingResponseId)
  const guidedTour = usePrototypeStore((s) => s.guidedTour)

  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [hiddenDrafts, setHiddenDrafts] = useState(() => new Set())
  const [notice, setNotice] = useState('')

  const historyNewestFirst = useMemo(() => [...aiHistory].slice().reverse(), [aiHistory])
  const active =
    historyNewestFirst.find((r) => r.id === (activeId || lastAiResponseId)) || historyNewestFirst[0] || null

  const savedDraftForActive = active ? recommendationDrafts.find((d) => d.responseId === active.id) : null
  // A saved draft is the user's own change; it should not make its own answer look stale.
  const stale =
    Boolean(active) &&
    active.dataRevision != null &&
    active.dataRevision < dataRevision &&
    !(active.intent === 'recommendation_draft' && savedDraftForActive)
  const draftResponse =
    active && active.intent === 'recommendation_draft' && !hiddenDrafts.has(active.id) ? active : null

  const suggestions = useMemo(() => {
    let journeyStepQuestionIds
    if (guidedTour?.active) {
      const journey = getDemoJourneyById(tenantCode, guidedTour.journeyId)
      const qid = journey?.steps?.[guidedTour.stepIndex]?.ask?.questionId
      if (qid) journeyStepQuestionIds = [qid]
    }
    return suggestedQuestionsForContext({ view, entityType: selectedEntity?.type ?? null, journeyStepQuestionIds })
  }, [view, selectedEntity?.type, guidedTour, tenantCode])

  const followUps = useMemo(() => availableFollowUps(active), [active])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setAskOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [setAskOpen])

  function baseRequest(extra = {}) {
    const tenant = getRepo().getTenant()
    return {
      tenantId: tenant.id,
      userRole: role,
      view,
      filters: { period: filters.period, businessUnit: filters.businessUnit, ...(extra.filters || {}) },
      asOfDate: demoAsOfDate,
      dataRevision,
      // Only a validation staged for this workspace may inform Q32.
      importValidation: importValidation && importValidation.tenantCode === tenantCode ? importValidation : undefined,
      ...extra,
    }
  }

  function record(response) {
    recordAiResponse(response)
    setActiveId(response.id)
    setNotice('')
    if (response.intent === 'executive_briefing') {
      setLastBriefingResponseId(response.id)
      setAskTab('briefing')
    } else {
      setAskTab('ask')
    }
    return response
  }

  function generateBriefing(query = 'Generate an executive briefing.') {
    return record(
      executiveBriefing(
        baseRequest({
          query,
          intent: 'executive_briefing',
          questionId: 'Q05',
          view: 'executive',
          briefingRole: briefingPreferences.role,
          briefingEmphasis: briefingPreferences.emphasis,
          filters: {
            period: briefingPreferences.period || filters.period,
            domain: briefingPreferences.domain || undefined,
            objectiveId: briefingPreferences.objectiveId || undefined,
          },
          contextEntityIds: selectedEntity?.id ? [selectedEntity.id] : [],
        }),
      ),
    )
  }

  function runQuestion(def) {
    if (def.intent === 'executive_briefing') {
      generateBriefing(def.label)
      return
    }
    record(
      askEA360(
        baseRequest({
          query: def.label,
          intent: def.intent,
          questionId: def.id,
          contextEntityIds: selectedEntity?.id ? [selectedEntity.id] : [],
        }),
      ),
    )
  }

  function runAsk(text) {
    const q = (text ?? query).trim()
    if (!q) return
    setQuery('')

    // Follow-ups ("Why?", "Show the evidence") keep the subject of the previous answer.
    const kind = matchFollowUpKind(q)
    if (kind) {
      const followUp = resolveFollowUp(kind, active)
      if (!followUp) {
        setNotice(
          active
            ? `“${q}” does not apply to the previous answer. Ask about a specific record, or select one first.`
            : `“${q}” continues a previous answer. Ask a question first.`,
        )
        return
      }
      record(
        askEA360(
          baseRequest({
            query: followUp.query,
            intent: followUp.intent,
            questionId: followUp.questionId,
            contextEntityIds: [followUp.subject.id],
            followUpOf: followUp.followUpOf,
          }),
        ),
      )
      return
    }

    const catalogue = Object.values(QUESTION_BY_ID).find((d) => d.label.toLowerCase() === q.toLowerCase())
    if (catalogue) {
      runQuestion(catalogue)
      return
    }
    const response = askEA360(baseRequest({ query: q, contextEntityIds: selectedEntity?.id ? [selectedEntity.id] : [] }))
    record(response)
  }

  function rerunActive() {
    const req = active?.request
    if (!req) return
    if (req.questionId && QUESTION_BY_ID[req.questionId]?.intent === 'executive_briefing') {
      generateBriefing(req.query)
      return
    }
    record(
      askEA360(
        baseRequest({
          query: req.query,
          intent: req.intent,
          questionId: req.questionId,
          contextEntityIds: req.contextEntityIds,
          followUpOf: req.followUpOf,
        }),
      ),
    )
  }

  function go(viewId, keepSelection) {
    if (onNavigate) {
      onNavigate(viewId, { keepSelection })
    } else {
      setView(viewId)
      window.location.hash = viewId === 'executive' ? '' : viewId
    }
  }

  function openEntity(entityId, entityType, viewId) {
    const target = viewId || VIEW_FOR_TYPE[entityType]
    if (target) go(target, true)
    // Select after navigating so the navigation cannot clear the selection.
    selectEntity({ id: entityId, type: entityType })
    setAskOpen(false)
  }

  function handleAction(action, response) {
    const act = action.action
    if (act === 'navigate' && action.view) {
      go(action.view, false)
      setAskOpen(false)
      return
    }
    if (act === 'set-context') {
      if (action.entityId && action.entityType) selectEntity({ id: action.entityId, type: action.entityType })
      return
    }
    if (act === 'select-entity') {
      if (action.entityId && action.entityType) openEntity(action.entityId, action.entityType, action.view)
      return
    }
    if (act === 'explore') {
      if (action.entityId && action.entityType) {
        setGraphRoot({ id: action.entityId, type: action.entityType })
      }
      go('explorer', true)
      setAskOpen(false)
      return
    }
    if (act === 'save-recommendation-draft') {
      const findingId = action.entityId || (response.entityRefs || []).find((r) => r.type === 'finding')?.id
      if (findingId && response) {
        const result = saveRecommendationDraft({
          findingId,
          responseId: response.id,
          summary: response.summary,
          explanation: response.explanation,
          evidenceIds: response.evidenceIds || [],
          reviewStatus: 'accepted',
          payload: response.recommendationDraft,
        })
        if (result.ok) reviewAiResponse(response.id, 'accepted', 'Saved via suggested action')
        setHiddenDrafts((prev) => {
          const next = new Set(prev)
          next.delete(response.id)
          return next
        })
      }
      return
    }
    if (act === 'briefing') {
      generateBriefing(`Executive briefing for ${briefingPreferences.role}`)
      return
    }
    if (act === 'copy' || act === 'copy-briefing') {
      const text = [response?.summary, response?.explanation].filter(Boolean).join('\n\n')
      navigator.clipboard?.writeText(text)
      return
    }
    if (act === 'print-briefing') {
      window.print()
      return
    }
  }

  const contextLabel = selectedEntity
    ? `${selectedEntity.type} ${selectedEntity.id}`
    : graphRoot
      ? `graph root ${graphRoot.type} ${graphRoot.id}`
      : 'none'

  return (
    <div className="ask-root drawer-root" role="dialog" aria-label="Ask EA360">
      <button type="button" className="drawer-backdrop" aria-label="Close Ask EA360" onClick={() => setAskOpen(false)} />
      <aside className="ask-panel entity-drawer">
        <div className="drawer-head">
          <div>
            <div className="kicker">Assist · Ask EA360</div>
            <h2>Ask EA360</h2>
            <p className="ask-panel-label">{ASK_PANEL_LABEL}</p>
            <p className="sub">AI-assisted — review before acting. Illustrative data.</p>
          </div>
          <button type="button" className="iconbtn" aria-label="Close" onClick={() => setAskOpen(false)}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="ask-tabs" role="tablist" aria-label="Ask EA360 mode">
          <button
            type="button"
            role="tab"
            aria-selected={askTab === 'ask'}
            className={`ask-tab${askTab === 'ask' ? ' active' : ''}`}
            onClick={() => setAskTab('ask')}
          >
            Ask
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={askTab === 'briefing'}
            className={`ask-tab${askTab === 'briefing' ? ' active' : ''}`}
            onClick={() => setAskTab('briefing')}
          >
            Executive briefing
          </button>
        </div>

        <div className="drawer-body ask-body">
          {askTab === 'briefing' ? (
            <ExecutiveBriefing onAction={handleAction} embedded />
          ) : (
            <>
              <p className="sub">Context: {contextLabel}</p>
              <form
                className="ask-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  runAsk()
                }}
              >
                <label className="field grow">
                  <span>Question</span>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    rows={3}
                    placeholder="Ask about risks, maturity, TIME, dependencies…"
                    aria-label="Ask EA360 question"
                  />
                </label>
                <div className="toolbar wrap-actions">
                  <button type="submit" className="btn primary primary-button" disabled={!query.trim()}>
                    Ask
                  </button>
                  {selectedEntity?.type === 'finding' ? (
                    <button
                      type="button"
                      className="btn secondary-button"
                      onClick={() =>
                        record(
                          draftRecommendation(
                            baseRequest({
                              query: 'Draft a recommendation for this finding.',
                              intent: 'recommendation_draft',
                              questionId: 'Q28',
                              contextEntityIds: [selectedEntity.id],
                            }),
                          ),
                        )
                      }
                    >
                      Draft recommendation
                    </button>
                  ) : null}
                  {graphRoot ? (
                    <button
                      type="button"
                      className="btn secondary-button"
                      onClick={() =>
                        record(
                          impactNarrative(
                            baseRequest({
                              query: `What happens if ${graphRoot.id} is unavailable?`,
                              intent: 'impact_analysis',
                              contextEntityIds: [graphRoot.id],
                            }),
                          ),
                        )
                      }
                    >
                      Impact narrative
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="ai-suggested-questions">
                <div className="kicker">Suggested questions</div>
                <div className="chip-row">
                  {suggestions.map((def) => (
                    <button key={def.id} type="button" className="ai-question-chip" onClick={() => runQuestion(def)}>
                      {def.label}
                    </button>
                  ))}
                </div>
              </div>

              {notice ? (
                <p className="ai-stale-banner" role="status">
                  {notice}
                </p>
              ) : null}

              {draftResponse ? (
                <RecommendationDraftReview
                  response={draftResponse}
                  onDiscard={(r) => setHiddenDrafts((prev) => new Set(prev).add(r.id))}
                />
              ) : null}

              {stale ? (
                <div className="ai-stale-banner" role="status">
                  <span>Workspace data changed after this answer was generated. It may no longer be accurate.</span>
                  {active?.request ? (
                    <button type="button" className="btn tiny secondary-button" onClick={rerunActive}>
                      <RefreshCw size={14} aria-hidden="true" /> Ask again
                    </button>
                  ) : null}
                </div>
              ) : null}

              {active ? (
                <div className="ask-active">
                  <AIResponse response={active} onAction={handleAction} />
                  {followUps.length ? (
                    <div className="ai-followups">
                      <div className="kicker">Follow up on this answer</div>
                      <div className="chip-row">
                        {followUps.map((f) => (
                          <button key={f.kind} type="button" className="ai-question-chip" onClick={() => runAsk(f.label)}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="sub">Ask a question or pick a suggestion to begin.</p>
              )}

              {historyNewestFirst.length > 1 ? (
                <div className="ask-history">
                  <h4 className="drawer-section-title">Recent answers</h4>
                  <ul className="ask-history-list">
                    {historyNewestFirst.map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          className={`text-link${r.id === active?.id ? ' active-history' : ''}`}
                          onClick={() => {
                            setActiveId(r.id)
                            setNotice('')
                          }}
                        >
                          {r.summary.slice(0, 90)}
                          {r.summary.length > 90 ? '…' : ''}
                        </button>
                        <span className="sub"> · {r.confidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          )}
        </div>
      </aside>
    </div>
  )
}
