import { usePrototypeStore } from '../../state/prototypeStore'

/**
 * Apply a guided-demo step to the prototype store and navigate.
 */
export function applyDemoStepWithStore(step, opts = {}, state = usePrototypeStore.getState()) {
  const action = step.action || {}
  const view = action.view === 'overview' ? 'executive' : action.view

  if (action.scenarioId) state.setScenarioId(action.scenarioId)
  if (action.heatmapMode) state.setHeatmapMode(action.heatmapMode)

  if (action.filters) {
    const f = action.filters
    if (f.capability) state.setCapabilityFilters(f.capability)
    if (f.portfolio) state.setPortfolioFilters(f.portfolio)
    if (f.integration) state.setIntegrationFilters(f.integration)
    if (f.period || f.businessUnit) {
      state.setFilters({
        ...(f.period ? { period: f.period } : {}),
        ...(f.businessUnit ? { businessUnit: f.businessUnit } : {}),
      })
    }
  }

  if (action.graphRoot) {
    state.setGraphRoot({
      id: action.graphRoot.id,
      type: action.graphRoot.type,
    })
    state.setImpactMode(true)
  } else if (action.graphRoot === null) {
    state.setGraphRoot(null)
  }

  if (action.selectEntity) {
    state.selectEntity({
      id: action.selectEntity.id,
      type: action.selectEntity.type,
    })
  } else if (action.selectEntity === null) {
    state.clearSelection()
  }

  if (action.openAsk || action.openBriefing) {
    state.setAskOpen(true)
  }

  if (opts.navigate) {
    opts.navigate(view)
  } else {
    state.setView(view)
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'executive' ? '' : view
    }
  }
}
