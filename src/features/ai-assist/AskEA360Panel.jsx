import { useEffect, useMemo, useState } from 'react'
import {
  askEA360,
  draftRecommendation,
  executiveBriefing,
  impactNarrative,
} from '../../lib/ai'
import { usePrototypeStore } from '../../state/prototypeStore'
import AIResponse from './AIResponse'
import SuggestedQuestions from './SuggestedQuestions'
import RecommendationDraft from './RecommendationDraft'
import ExecutiveBriefing from './ExecutiveBriefing'

function buildBaseRequest(getRepo, role, view, filters, extra = {}) {
  const tenant = getRepo().getTenant()
  return {
    tenantId: tenant.id,
    userRole: role,
    view,
    filters: {
      period: filters.period,
      businessUnit: filters.businessUnit,
      ...(extra.filters || {}),
    },
    ...extra,
  }
}

export default function AskEA360Panel() {
  const askOpen = usePrototypeStore((s) => s.askOpen)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const aiHistory = usePrototypeStore((s) => s.aiHistory)
  const lastAiResponseId = usePrototypeStore((s) => s.lastAiResponseId)
  const recordAiResponse = usePrototypeStore((s) => s.recordAiResponse)
  const saveRecommendationDraft = usePrototypeStore((s) => s.saveRecommendationDraft)
  const reviewAiResponse = usePrototypeStore((s) => s.reviewAiResponse)
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

  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('ask')
  const [activeId, setActiveId] = useState(null)
  const [draftResponse, setDraftResponse] = useState(null)

  const historyNewestFirst = useMemo(
    () => [...aiHistory].slice().reverse(),
    [aiHistory],
  )

  const active =
    historyNewestFirst.find((r) => r.id === (activeId || lastAiResponseId)) ||
    historyNewestFirst[0] ||
    null

  useEffect(() => {
    if (!askOpen) return
    if (lastAiResponseId) setActiveId(lastAiResponseId)
  }, [askOpen, lastAiResponseId])

  useEffect(() => {
    if (!askOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setAskOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [askOpen, setAskOpen])

  if (!askOpen) return null

  function runAsk(text) {
    const q = (text ?? query).trim()
    if (!q) return
    const contextEntityIds = selectedEntity?.id ? [selectedEntity.id] : []
    const response = askEA360(
      buildBaseRequest(getRepo, role, view, filters, {
        query: q,
        contextEntityIds,
      }),
    )
    recordAiResponse(response)
    setActiveId(response.id)
    setQuery('')
    if (response.intent === 'recommendation_draft') setDraftResponse(response)
    if (response.intent === 'executive_briefing') setTab('briefing')
  }

  function handleAction(action, response) {
    const act = action.action
    if (act === 'navigate' && action.view) {
      setView(action.view)
      window.location.hash = action.view === 'executive' ? '' : action.view
      setAskOpen(false)
      return
    }
    if (act === 'select-entity' || act === 'set-context') {
      if (action.entityId && action.entityType) {
        selectEntity({ id: action.entityId, type: action.entityType })
      }
      return
    }
    if (act === 'explore') {
      if (action.entityId && action.entityType) {
        setGraphRoot({ id: action.entityId, type: action.entityType })
      } else if (graphRoot) {
        /* keep current root */
      }
      setView('explorer')
      window.location.hash = 'explorer'
      setAskOpen(false)
      return
    }
    if (act === 'save-recommendation-draft') {
      const findingId =
        action.entityId ||
        (response.entityRefs || []).find((r) => r.type === 'finding')?.id
      if (findingId && response) {
        saveRecommendationDraft({
          findingId,
          responseId: response.id,
          summary: response.summary,
          explanation: response.explanation,
          evidenceIds: response.evidenceIds || [],
          reviewStatus: 'accepted',
        })
        reviewAiResponse(response.id, 'accepted', 'Saved via suggested action')
        setDraftResponse(response)
      }
      return
    }
    if (act === 'briefing') {
      setTab('briefing')
      const tenant = getRepo().getTenant()
      const briefing = executiveBriefing(
        buildBaseRequest(getRepo, role, 'executive', filters, {
          query: `Executive briefing for ${briefingPreferences.role}`,
          intent: 'executive_briefing',
          briefingRole: briefingPreferences.role,
          briefingEmphasis: briefingPreferences.emphasis,
          filters: {
            period: briefingPreferences.period || filters.period,
            domain: briefingPreferences.domain || undefined,
          },
        }),
      )
      recordAiResponse(briefing)
      setActiveId(briefing.id)
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
    if (act === 'noop') return
  }

  const contextLabel = selectedEntity
    ? `${selectedEntity.type} ${selectedEntity.id}`
    : graphRoot
      ? `graph root ${graphRoot.type} ${graphRoot.id}`
      : 'none'

  return (
    <div className="ask-root drawer-root" role="dialog" aria-label="Ask EA360">
      <button
        type="button"
        className="drawer-backdrop"
        aria-label="Close Ask EA360"
        onClick={() => setAskOpen(false)}
      />
      <aside className="ask-panel entity-drawer">
        <div className="drawer-head">
          <div>
            <div className="kicker">Assist · Ask EA360</div>
            <h2>Ask EA360</h2>
            <p className="sub">Answers use only the active tenant dataset. AI-assisted — review before acting.</p>
          </div>
          <button type="button" className="iconbtn" aria-label="Close" onClick={() => setAskOpen(false)}>
            ✕
          </button>
        </div>

        <div className="ask-tabs">
          <button
            type="button"
            className={`ask-tab${tab === 'ask' ? ' active' : ''}`}
            onClick={() => setTab('ask')}
          >
            Ask
          </button>
          <button
            type="button"
            className={`ask-tab${tab === 'briefing' ? ' active' : ''}`}
            onClick={() => setTab('briefing')}
          >
            Executive briefing
          </button>
        </div>

        <div className="drawer-body ask-body">
          {tab === 'briefing' ? (
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
                      onClick={() => {
                        const response = draftRecommendation(
                          buildBaseRequest(getRepo, role, view, filters, {
                            query: `Draft recommendation for ${selectedEntity.id}`,
                            intent: 'recommendation_draft',
                            contextEntityIds: [selectedEntity.id],
                          }),
                        )
                        recordAiResponse(response)
                        setActiveId(response.id)
                        setDraftResponse(response)
                      }}
                    >
                      Draft recommendation
                    </button>
                  ) : null}
                  {graphRoot ? (
                    <button
                      type="button"
                      className="btn secondary-button"
                      onClick={() => {
                        const response = impactNarrative(
                          buildBaseRequest(getRepo, role, view, filters, {
                            query: `What happens if ${graphRoot.id} is unavailable?`,
                            intent: 'impact_analysis',
                            contextEntityIds: [graphRoot.id],
                          }),
                        )
                        recordAiResponse(response)
                        setActiveId(response.id)
                      }}
                    >
                      Impact narrative
                    </button>
                  ) : null}
                </div>
              </form>

              <SuggestedQuestions onSelect={(q) => runAsk(q)} />

              {draftResponse ? (
                <RecommendationDraft
                  response={draftResponse}
                  onDiscard={() => setDraftResponse(null)}
                />
              ) : null}

              {active ? (
                <div className="ask-active">
                  <AIResponse response={active} onAction={handleAction} />
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
                            if (r.intent === 'recommendation_draft') setDraftResponse(r)
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
