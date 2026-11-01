import type { RouteId } from '../../config/routes'
import type { DemoStep } from './journeyDefinitions'

/** Routes that surface selected records in a global drawer rather than an inline panel. */
export const DRAWER_ENTITY_DETAIL_ROUTES = new Set<string>([
  'data-information',
  'applications',
  'integrations',
  'technology-infrastructure',
  'ai-automation',
  'capabilities',
  'initiatives',
  'recommendations',
  'evidence',
])

export function normalizeDemoView(view: string | undefined): string {
  if (!view || view === 'overview') return 'executive'
  return view
}

export function stepExpectsEntityDetail(step: DemoStep | null | undefined): boolean {
  if (!step) return false
  const name = step.target?.name || step.highlightTarget
  return name === 'entity-detail'
}

export function shouldOpenDrawerDetailForStep(step: DemoStep): boolean {
  if (!stepExpectsEntityDetail(step)) return false
  if (!step.action?.selectEntity) return false
  return DRAWER_ENTITY_DETAIL_ROUTES.has(normalizeDemoView(step.action.view))
}

export function isElementVisible(el: HTMLElement): boolean {
  if (!el.isConnected) return false
  const style = typeof window !== 'undefined' ? window.getComputedStyle(el) : null
  if (style && (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0')) {
    return false
  }
  const rect = el.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0
}

/** Prefer a demo target inside the active route root; skip hidden duplicates. */
export function queryVisibleDemoTarget(
  targetName: string,
  opts: { entityId?: string; entityType?: string; activeView?: string } = {},
): HTMLElement | null {
  if (typeof document === 'undefined') return null
  const roots = Array.from(document.querySelectorAll('#main-content .view.active, #main-content .view'))
  const scopedRoots = roots.length ? roots : [document.body]

  const matches: HTMLElement[] = []
  for (const root of scopedRoots) {
    const nodes = root.querySelectorAll(`[data-demo-target="${targetName}"]`)
    nodes.forEach((n) => {
      if (n instanceof HTMLElement && isElementVisible(n)) matches.push(n)
    })
  }

  let candidates = matches
  if (opts.entityId) {
    const withId = candidates.filter((el) => el.getAttribute('data-demo-entity-id') === opts.entityId)
    if (withId.length) candidates = withId
  }
  if (opts.entityType) {
    const withType = candidates.filter((el) => el.getAttribute('data-demo-entity-type') === opts.entityType)
    if (withType.length) candidates = withType
  }

  return candidates[0] ?? null
}

export function expectedRouteForStep(step: DemoStep): RouteId | string {
  return normalizeDemoView(step.action?.view) as RouteId
}
