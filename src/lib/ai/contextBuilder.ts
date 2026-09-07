import type { TenantRepository } from '../../data/repositories/tenantRepository'
import type { EA360AIRequest, EntityReference } from './types'
import { matchEntitiesInQuery, resolveContextEntities } from './queryParser'
import { classifyIntent } from './intents'
import type { AIIntent } from './types'

export type AIContext = {
  tenantId: string
  tenantCode: string
  userRole: string
  intent: AIIntent
  query: string
  view?: string
  matchedEntities: EntityReference[]
  contextEntities: EntityReference[]
  primaryEntity?: EntityReference
  ambiguous: boolean
  pack: ReturnType<TenantRepository['getPack']>
  repo: TenantRepository
  metricKey?: string
  mutations?: Array<{ id: string; at: string; description: string }>
  briefingRole?: string
  briefingEmphasis?: string
  filters?: EA360AIRequest['filters']
}

export type ContextExtras = {
  mutations?: AIContext['mutations']
}

export function buildAIContext(
  request: EA360AIRequest,
  repo: TenantRepository,
  extras: ContextExtras = {},
): AIContext {
  const pack = repo.getPack()
  const intent = classifyIntent(request.query, request.intent, pack.tenant.code)
  const matched = matchEntitiesInQuery(request.query, repo)
  const contextEntities = resolveContextEntities(request.contextEntityIds, repo)

  const combined = [...contextEntities]
  for (const m of matched) {
    if (!combined.some((c) => c.id === m.id)) combined.push(m)
  }

  const ambiguous =
    matched.filter((m) => m.score >= 70).length > 3 &&
    !request.contextEntityIds?.length &&
    ['impact_analysis', 'integration_dependents', 'capability_applications'].includes(intent)

  return {
    tenantId: request.tenantId || pack.tenant.id,
    tenantCode: pack.tenant.code,
    userRole: request.userRole,
    intent,
    query: request.query,
    view: request.view,
    matchedEntities: matched,
    contextEntities,
    primaryEntity: contextEntities[0] || matched[0],
    ambiguous,
    pack,
    repo,
    metricKey: request.metricKey,
    mutations: extras.mutations,
    briefingRole: request.briefingRole,
    briefingEmphasis: request.briefingEmphasis,
    filters: request.filters,
  }
}
