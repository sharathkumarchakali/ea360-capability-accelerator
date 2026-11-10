import type { BindingEntityType } from './journeyBindings'
import type { DemoStep } from './journeyDefinitions'
import { expectedRouteForStep, queryVisibleDemoTarget } from './demoStepContract'
import { findPackEntity } from './scenarioPreflight'

type DemoReadinessState = {
  view: string
  selectedEntity: { id: string; type: string } | null
  graphRoot?: { id: string; type: string } | null
  workingPack: import('../../data/repositories/tenantRepository').TenantPack | null
}

export type StepReadiness = {
  routeReady: boolean
  selectionReady: boolean
  targetReady: boolean
  graphRootReady: boolean
  target?: HTMLElement
  blockingReason?: 'route' | 'selection' | 'missing-record' | 'graph-root'
  highlightWarning?: 'missing-target' | 'hidden-target'
}

export type WaitForDemoStepReadyOptions = {
  step: DemoStep
  getState: () => DemoReadinessState
  signal?: AbortSignal
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 6000

function normalizeView(view: string): string {
  if (!view || view === 'overview') return 'executive'
  return view
}

function evaluateReadiness(step: DemoStep, state: DemoReadinessState): StepReadiness {
  const expectedRoute = expectedRouteForStep(step)
  const routeReady = normalizeView(state.view) === expectedRoute

  const wanted = step.action?.selectEntity
  let selectionReady = true
  if (wanted) {
    selectionReady =
      state.selectedEntity?.id === wanted.id && state.selectedEntity?.type === wanted.type
    if (selectionReady && state.workingPack) {
      const found = findPackEntity(
        state.workingPack,
        wanted.type as BindingEntityType,
        wanted.id,
      )
      if (!found) {
        return {
          routeReady,
          selectionReady: false,
          targetReady: false,
          graphRootReady: false,
          blockingReason: 'missing-record',
        }
      }
    }
  }

  const wantedRoot = step.action?.graphRoot
  let graphRootReady = true
  if (wantedRoot) {
    graphRootReady =
      state.graphRoot?.id === wantedRoot.id && state.graphRoot?.type === wantedRoot.type
  }

  const targetName = step.target?.name || step.highlightTarget || 'view-root'
  const requiredForReadiness = step.target?.requiredForReadiness !== false

  let target: HTMLElement | undefined
  let targetReady = true

  if (targetName === 'entity-detail' && wanted) {
    target =
      queryVisibleDemoTarget('entity-detail', {
        entityId: wanted.id,
        entityType: wanted.type,
        activeView: state.view,
      }) ?? undefined
    targetReady = Boolean(target)
  } else if (targetName !== 'view-root' || requiredForReadiness) {
    target = queryVisibleDemoTarget(targetName, { activeView: state.view }) ?? undefined
    targetReady = requiredForReadiness ? Boolean(target) : routeReady && (!wanted || selectionReady)
  } else {
    targetReady = routeReady
  }

  // Graph steps: require the root node (or explorer shell) before Next; highlight is still optional.
  if (wantedRoot && graphRootReady && normalizeView(state.view) === 'explorer') {
    const graphNode =
      queryVisibleDemoTarget('graph-node', {
        activeView: state.view,
      }) ?? undefined
    const explorer =
      queryVisibleDemoTarget('relationship-explorer', {
        activeView: state.view,
      }) ?? undefined
    if (graphNode) {
      target = graphNode
      targetReady = true
    } else if (explorer && targetReady) {
      // Inspector/detail may be ready before React Flow paints; keep waiting for the root node.
      targetReady = false
      target = explorer
    } else if (!targetReady) {
      target = explorer
    }
  }

  if (!routeReady) {
    return {
      routeReady: false,
      selectionReady,
      targetReady: false,
      graphRootReady: false,
      blockingReason: 'route',
    }
  }
  if (wanted && !selectionReady) {
    return {
      routeReady: true,
      selectionReady: false,
      targetReady: false,
      graphRootReady,
      blockingReason: 'selection',
    }
  }
  if (wantedRoot && !graphRootReady) {
    return {
      routeReady: true,
      selectionReady,
      targetReady: false,
      graphRootReady: false,
      blockingReason: 'graph-root',
    }
  }

  if (!targetReady && requiredForReadiness) {
    return { routeReady: true, selectionReady, targetReady: false, graphRootReady }
  }

  if (!targetReady && !requiredForReadiness) {
    return {
      routeReady: true,
      selectionReady,
      targetReady: true,
      graphRootReady,
      highlightWarning: 'missing-target',
    }
  }

  return { routeReady: true, selectionReady, targetReady: true, graphRootReady, target }
}

export async function waitForDemoStepReady(opts: WaitForDemoStepReadyOptions): Promise<StepReadiness> {
  const { step, getState, signal, timeoutMs = DEFAULT_TIMEOUT_MS } = opts
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError')
  }
  const started = Date.now()

  const immediate = evaluateReadiness(step, getState())
  if (immediate.blockingReason) return immediate
  if (
    immediate.routeReady &&
    immediate.selectionReady &&
    immediate.graphRootReady &&
    immediate.targetReady
  ) {
    return immediate
  }
  if (
    immediate.routeReady &&
    immediate.selectionReady &&
    immediate.graphRootReady &&
    immediate.highlightWarning === 'missing-target'
  ) {
    return immediate
  }

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }

    let observer: MutationObserver | null = null
    let interval: ReturnType<typeof setInterval> | null = null

    const finish = (result: StepReadiness) => {
      observer?.disconnect()
      if (interval) clearInterval(interval)
      resolve(result)
    }

    const tick = () => {
      if (signal?.aborted) {
        observer?.disconnect()
        if (interval) clearInterval(interval)
        reject(new DOMException('Aborted', 'AbortError'))
        return
      }
      const result = evaluateReadiness(step, getState())
      if (result.blockingReason) {
        finish(result)
        return
      }
      if (result.routeReady && result.selectionReady && result.graphRootReady && result.targetReady) {
        finish(result)
        return
      }
      if (
        result.routeReady &&
        result.selectionReady &&
        result.graphRootReady &&
        result.highlightWarning === 'missing-target'
      ) {
        finish(result)
        return
      }
      if (Date.now() - started >= timeoutMs) {
        finish(result)
      }
    }

    if (typeof MutationObserver !== 'undefined' && typeof document !== 'undefined') {
      observer = new MutationObserver(tick)
      observer.observe(document.body, { childList: true, subtree: true, attributes: true })
    }
    interval = setInterval(tick, 80)
    tick()
  })
}

export function readinessBlocksNext(readiness: StepReadiness, step: DemoStep): boolean {
  if (readiness.blockingReason) return true
  if (!readiness.routeReady) return true
  const wanted = step.action?.selectEntity
  if (wanted && !readiness.selectionReady) return true
  if (step.action?.graphRoot && !readiness.graphRootReady) return true
  if (step.target?.requiredForReadiness !== false && !readiness.targetReady) return true
  return false
}

export function problemMessageForReadiness(readiness: StepReadiness, step: DemoStep): string | null {
  if (readiness.blockingReason === 'route') {
    return `Expected screen "${expectedRouteForStep(step)}" is not active. Retry or use Step details.`
  }
  if (readiness.blockingReason === 'missing-record') {
    return 'The bound record is not in this workspace. Check tenant bindings or Demo Studio status, then Retry.'
  }
  if (readiness.blockingReason === 'selection') {
    return 'The bound record did not open. Retry after the record is visible.'
  }
  if (readiness.blockingReason === 'graph-root') {
    const root = step.action?.graphRoot
    return root
      ? `Expected graph root (${root.type}) did not resolve. Retry or use Step details.`
      : 'Expected graph root did not resolve. Retry or use Step details.'
  }
  if (
    step.target?.name === 'entity-detail' &&
    step.action?.selectEntity &&
    !readiness.targetReady &&
    step.target?.requiredForReadiness !== false
  ) {
    return 'The record detail surface did not appear. Retry or use Step details.'
  }
  if (!readiness.targetReady && step.target?.requiredForReadiness !== false) {
    return `Expected area ("${step.target?.name}") did not appear. Retry or use Step details.`
  }
  return null
}
