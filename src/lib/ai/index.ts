import type { TenantRepository } from '../../data/repositories/tenantRepository'
import type { EA360AIRequest, EA360AIResponse, EA360AIService } from './types'
import { createDeterministicAdapter } from './deterministicAdapter'

export * from './types'
export * from './intents'
export { classifyConfidence } from './confidence'
export { validateGrounding, collectKnownIds } from './groundingValidator'
export { buildAIContext } from './contextBuilder'
export { matchEntitiesInQuery } from './queryParser'
export { createDeterministicAdapter } from './deterministicAdapter'

type ServiceFactory = () => EA360AIService

let serviceFactory: ServiceFactory | null = null

/** Register the active AI service (deterministic now; LLM adapter later). */
export function setEA360AIServiceFactory(factory: ServiceFactory) {
  serviceFactory = factory
}

export function getEA360AIService(): EA360AIService {
  if (!serviceFactory) {
    throw new Error('EA360 AI service is not configured. Call configureEA360AI first.')
  }
  return serviceFactory()
}

export function configureEA360AI(opts: {
  getRepo: () => TenantRepository
  getMutations?: () => Array<{ id: string; at: string; description: string }>
}) {
  setEA360AIServiceFactory(() => createDeterministicAdapter(opts))
}

/** UI-facing helpers — never call the adapter from feature code except via these. */
export function askEA360(request: EA360AIRequest): EA360AIResponse {
  return getEA360AIService().ask(request)
}

export function explainInsight(request: EA360AIRequest): EA360AIResponse {
  return getEA360AIService().explain(request)
}

export function impactNarrative(request: EA360AIRequest): EA360AIResponse {
  return getEA360AIService().impactNarrative(request)
}

export function draftRecommendation(request: EA360AIRequest): EA360AIResponse {
  return getEA360AIService().draftRecommendation(request)
}

export function executiveBriefing(request: EA360AIRequest): EA360AIResponse {
  return getEA360AIService().executiveBriefing(request)
}
