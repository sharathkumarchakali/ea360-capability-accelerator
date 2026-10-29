/** Central route registry for navigation, journeys and Ask actions. */

export const ROUTE_IDS = [
  'executive',
  'capabilities',
  'applications',
  'integrations',
  'data-information',
  'technology-infrastructure',
  'ai-automation',
  'explorer',
  'assessment',
  'findings',
  'evidence',
  'recommendations',
  'roadmap',
  'initiatives',
  'kpis',
  'standards',
  'decisions',
  'governance',
  'reviews',
  'ai-data-governance',
  'reports',
  'demo-studio',
  'onboarding',
  'data-ingestion',
  'workspace-settings',
] as const

export type RouteId = (typeof ROUTE_IDS)[number]

export const VALID_VIEWS = new Set<string>(ROUTE_IDS)

/** Routes that map to real feature views (not placeholders). */
export const IMPLEMENTED_FEATURE_ROUTES = new Set<RouteId>([
  'executive',
  'capabilities',
  'applications',
  'integrations',
  'data-information',
  'technology-infrastructure',
  'ai-automation',
  'explorer',
  'assessment',
  'findings',
  'evidence',
  'recommendations',
  'roadmap',
  'initiatives',
  'kpis',
  'standards',
  'decisions',
  'governance',
  'reviews',
  'ai-data-governance',
  'reports',
  'demo-studio',
  'onboarding',
  'data-ingestion',
  'workspace-settings',
])

export function normalizeRoute(id: string): RouteId | 'invalid' {
  if (id === '' || id === 'overview') return 'executive'
  if (VALID_VIEWS.has(id)) return id as RouteId
  return 'invalid'
}
