import { usePrototypeStore } from '../../state/prototypeStore'
import { askEA360, executiveBriefing } from '../../lib/ai'
import { getDemoAsOfDate } from '../../domain/demo/demoClock'
import { QUESTION_BY_ID } from '../../lib/ai/questionCatalog'

/**
 * Apply a guided-demo step to the prototype store and navigate.
 * Selection is applied AFTER navigation so hash/navigate keepSelection is respected.
 * Briefing steps actually generate a briefing into Ask state.
 */
export function applyDemoStepWithStore(step, opts = {}, state = usePrototypeStore.getState()) {
  const action = step.action || {}
  const view = action.view === 'overview' ? 'executive' : action.view
  const keepSelection = Boolean(action.selectEntity) || Boolean(opts.keepSelection)

  if (action.scenarioId) state.setScenarioId(action.scenarioId)
  if (action.heatmapMode) state.setHeatmapMode(action.heatmapMode)

  if (action.filters) {
    applyFilters(action.filters, state)
  }

  if (action.screenState) {
    applyScreenState(action.screenState, state)
  }

  if (action.graphRoot) {
    state.setGraphRoot({
      id: action.graphRoot.id,
      type: action.graphRoot.type,
    })
    state.setImpactMode(action.impactMode !== false)
    if (action.graphDirection) state.setGraphDirection?.(action.graphDirection)
    if (action.graphDepth != null) state.setRelationshipDepth?.(action.graphDepth)
  } else if (action.graphRoot === null) {
    state.setGraphRoot(null)
  }

  // Navigate first, preserving selection when a record is about to be selected
  if (opts.navigate) {
    opts.navigate(view, { keepSelection: true })
  } else {
    state.setView(view)
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'executive' ? '' : view
    }
  }

  // Apply selection after navigation so clearSelection from navigate cannot wipe it
  if (action.selectEntity) {
    // Defer one tick so React hash/view effects settle
    const entity = {
      id: action.selectEntity.id,
      type: action.selectEntity.type,
    }
    state.selectEntity(entity)
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(() => {
        usePrototypeStore.getState().selectEntity(entity)
      })
    }
  } else if (action.selectEntity === null && !keepSelection) {
    state.clearSelection()
  }

  const askCmd = action.ask || (action.openBriefing ? { mode: 'briefing', executeOnEnter: true } : null) ||
    (action.openAsk ? { mode: 'ask', executeOnEnter: false } : null)

  if (askCmd) {
    state.setAskOpen(true)
    if (askCmd.tab) state.setAskTab?.(askCmd.tab)
    if (askCmd.mode === 'briefing' || action.openBriefing) {
      state.setAskTab?.('briefing')
      if (askCmd.executeOnEnter !== false) {
        runBriefingCommand(state, askCmd)
      }
    } else if (askCmd.executeOnEnter && askCmd.questionId) {
      runAskCommand(state, askCmd)
    }
  }

  return { view, selected: action.selectEntity || null }
}

function applyFilters(f, state) {
  if (f.capability || f.capabilityId) {
    state.setCapabilityFilters({
      ...(typeof f.capability === 'object' ? f.capability : {}),
      ...(f.capabilityId ? { search: '', domain: '' } : {}),
    })
  }
  if (f.portfolio || f.applicationId || f.timeClass || f.criticality) {
    state.setPortfolioFilters({
      ...(typeof f.portfolio === 'object' ? f.portfolio : {}),
      ...(f.applicationId ? { search: f.applicationId } : {}),
      ...(f.timeClass ? { timeClass: f.timeClass } : {}),
      ...(f.criticality ? { criticality: f.criticality } : {}),
      ...(f.capabilityId ? { capabilityId: f.capabilityId } : {}),
    })
  }
  if (f.integration || f.integrationType || f.pointToPoint) {
    state.setIntegrationFilters({
      ...(typeof f.integration === 'object' ? f.integration : {}),
      ...(f.integrationType ? { integrationType: f.integrationType } : {}),
      ...(f.pointToPoint != null ? { pointToPoint: String(f.pointToPoint) } : {}),
      ...(f.criticality ? { criticality: f.criticality } : {}),
    })
  }
  if (f.period || f.businessUnit || f.domain) {
    state.setFilters({
      ...(f.period ? { period: f.period } : {}),
      ...(f.businessUnit ? { businessUnit: f.businessUnit } : {}),
    })
  }
  // Entity-specific filter IDs are stored on navContext for views to honour
  if (
    f.findingId ||
    f.recommendationId ||
    f.initiativeId ||
    f.decisionId ||
    f.evidenceId ||
    f.capabilityId ||
    f.applicationId ||
    f.integrationId ||
    f.technologyId ||
    f.dataObjectId ||
    f.aiSolutionId ||
    f.kpiId
  ) {
    state.setNavContext({
      fromView: 'demo',
      entityId:
        f.findingId ||
        f.recommendationId ||
        f.initiativeId ||
        f.decisionId ||
        f.evidenceId ||
        f.capabilityId ||
        f.applicationId ||
        f.integrationId ||
        f.technologyId ||
        f.dataObjectId ||
        f.aiSolutionId ||
        f.kpiId,
      filters: f,
    })
  }
}

function applyScreenState(screenState, state) {
  if (screenState.tab && state.setScreenTab) {
    state.setScreenTab(screenState.tab)
  }
  if (screenState.governanceTab && state.setGovernanceTab) {
    state.setGovernanceTab(screenState.governanceTab)
  }
  if (screenState.aiGovTab && state.setAiGovTab) {
    state.setAiGovTab(screenState.aiGovTab)
  }
}

function runBriefingCommand(state, askCmd) {
  try {
    const repo = state.getRepo()
    const tenant = repo.getTenant()
    const prefs = state.briefingPreferences || {}
    const response = executiveBriefing({
      tenantId: tenant.id,
      userRole: state.role || 'executive',
      query: askCmd.questionId
        ? QUESTION_BY_ID[askCmd.questionId]?.label || 'Generate an executive briefing.'
        : 'Generate an executive briefing.',
      intent: 'executive_briefing',
      briefingRole: prefs.role || askCmd.audience || 'Executive Committee',
      briefingEmphasis: prefs.emphasis || 'balanced',
      filters: {
        period: prefs.period,
        domain: prefs.domain,
        objectiveId: prefs.objectiveId,
      },
      asOfDate: state.demoAsOfDate || getDemoAsOfDate(),
      dataRevision: state.dataRevision,
      contextEntityIds: state.selectedEntity?.id ? [state.selectedEntity.id] : [],
    })
    state.recordAiResponse(response)
    state.setLastBriefingResponseId?.(response.id)
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[EA360] Briefing generation failed', err)
  }
}

function runAskCommand(state, askCmd) {
  try {
    const repo = state.getRepo()
    const tenant = repo.getTenant()
    const def = askCmd.questionId ? QUESTION_BY_ID[askCmd.questionId] : null
    const response = askEA360({
      tenantId: tenant.id,
      userRole: state.role || 'executive',
      query: def?.label || askCmd.query || '',
      intent: def?.intent,
      questionId: askCmd.questionId,
      asOfDate: state.demoAsOfDate || getDemoAsOfDate(),
      dataRevision: state.dataRevision,
      contextEntityIds: state.selectedEntity?.id ? [state.selectedEntity.id] : [],
      view: state.view,
    })
    state.recordAiResponse(response)
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[EA360] Ask command failed', err)
  }
}
