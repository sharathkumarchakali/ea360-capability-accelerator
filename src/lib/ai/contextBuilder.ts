import type { TenantRepository } from '../../data/repositories/tenantRepository'
import type { EA360AIRequest, EntityReference } from './types'
import { matchEntitiesInQuery, resolveContextEntities } from './queryParser'
import { classifyIntent } from './intents'
import type { AIIntent } from './types'
import { getDemoAsOfDate } from '../../domain/demo/demoClock'
import { assertTenantIsolation } from './groundingValidator'
import { resolveQuestionDefinition } from './questionCatalog'

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
  unknownExplicitName: boolean
  pack: ReturnType<TenantRepository['getPack']>
  repo: TenantRepository
  metricKey?: string
  mutations?: Array<{ id: string; at: string; description: string }>
  briefingRole?: string
  briefingEmphasis?: string
  filters?: EA360AIRequest['filters']
  asOfDate: string
  dataRevision?: number
  importValidation?: EA360AIRequest['importValidation']
  questionId?: string
  tenantGuardError?: string
}

export type ContextExtras = {
  mutations?: AIContext['mutations']
  followUpSubject?: EntityReference | null
}

const ENTITY_REQUIRED_INTENTS: AIIntent[] = [
  'explain_finding',
  'evidence_for_finding',
  'recommendation_options',
  'initiative_kpi_summary',
  'data_lineage',
  'data_ai_readiness',
  'data_controls_missing',
  'technology_dependents',
  'technology_priority',
  'technology_cto_summary',
  'ai_agent_explain',
  'ai_agent_permissions',
  'ai_model_dependencies',
  'ai_agent_kpi',
  'capability_applications',
  'integration_dependents',
  'impact_analysis',
  'recommendation_draft',
]

const GENERIC_SUBJECTS = /^(this|that|it|them|these|those|the (application|app|system|integration|finding|recommendation|initiative|capability|technology|agent|model))\b/i
const METRIC_WORDS = /\b(health|alignment|maturity|score|metric|calculat|risk|readiness|briefing)\b/i

/**
 * A capitalised subject in an entity question ("What depends on Zebra Gateway?", "Explain the Zebra Mainframe 9000
 * system") that the caller has not selected and that matches no record. Returns the subject text or null.
 */
export function extractUnknownNamedSubject(query: string): string | null {
  const m = query.match(
    /\b(?:what depends on|what happens if|impact of(?: retiring)?|retiring|retire|explain|describe|tell me about)\s+(?:the\s+)?(.+?)(?:\s+(?:is|are)\s+(?:unavailable|down|retired))?\s*[?.!]?$/i,
  )
  if (!m) return null
  const subject = m[1]
    .replace(/\s+(system|application|app|platform|service|integration|finding|agent|model)$/i, '')
    .trim()
  if (!subject || GENERIC_SUBJECTS.test(subject) || METRIC_WORDS.test(subject)) return null
  // Only proper names (leading capital) count; lower-case phrases are ordinary questions.
  if (!/^[A-Z]/.test(subject)) return null
  return subject
}

export function buildAIContext(
  request: EA360AIRequest,
  repo: TenantRepository,
  extras: ContextExtras = {},
): AIContext {
  const pack = repo.getPack()
  const tenantGuardError =
    assertTenantIsolation(request.tenantId, pack.tenant.id, pack.tenant.code) ?? undefined

  const catalogHit = resolveQuestionDefinition(request.query)
  const intent = tenantGuardError
    ? 'cross_tenant_refused'
    : classifyIntent(request.query, request.intent || catalogHit?.intent, pack.tenant.code)

  const matched = matchEntitiesInQuery(request.query, repo)
  const contextEntities = resolveContextEntities(request.contextEntityIds, repo)

  // Explicit named entity in the question overrides older selection when score is strong
  const strongMatches = matched.filter((m) => m.score >= 90)
  let primary: EntityReference | undefined
  if (strongMatches.length === 1) {
    primary = strongMatches[0]
  } else if (contextEntities[0]) {
    primary = contextEntities[0]
  } else if (extras.followUpSubject) {
    primary = extras.followUpSubject
  } else if (matched[0] && matched[0].score >= 50) {
    primary = matched[0]
  }

  const combined = [...contextEntities]
  for (const m of matched) {
    if (!combined.some((c) => c.id === m.id)) combined.push(m)
  }

  // Detect quoted / Title-Case names that matched nothing
  const quoted = request.query.match(/["“]([^"”]+)["”]/)
  const unknownQuotedName = Boolean(
    quoted &&
      quoted[1] &&
      !matched.some((m) => m.name.toLowerCase() === quoted[1].toLowerCase()),
  )
  // Free-text names ("What depends on Zebra Gateway?") that match nothing must not fall back to a portfolio answer.
  const unknownNamedSubject =
    !catalogHit &&
    !['refuse_approval', 'refuse_guaranteed_finance', 'cross_tenant_refused', 'approval_authority'].includes(intent) &&
    !contextEntities.length &&
    !extras.followUpSubject &&
    !matched.some((m) => m.score >= 50) &&
    Boolean(extractUnknownNamedSubject(request.query))
  const unknownExplicitName = unknownQuotedName || unknownNamedSubject

  const ambiguous =
    !unknownExplicitName &&
    strongMatches.length > 1 &&
    !request.contextEntityIds?.length &&
    ENTITY_REQUIRED_INTENTS.includes(intent)

  return {
    tenantId: pack.tenant.id,
    tenantCode: pack.tenant.code,
    userRole: request.userRole,
    intent: unknownExplicitName ? 'unknown_entity' : intent,
    query: request.query,
    view: request.view,
    matchedEntities: matched,
    contextEntities,
    primaryEntity: primary,
    ambiguous,
    unknownExplicitName,
    pack,
    repo,
    metricKey: request.metricKey,
    mutations: extras.mutations,
    briefingRole: request.briefingRole,
    briefingEmphasis: request.briefingEmphasis,
    filters: request.filters,
    asOfDate: request.asOfDate || getDemoAsOfDate(),
    dataRevision: request.dataRevision,
    importValidation: request.importValidation,
    questionId: request.questionId || catalogHit?.id,
    tenantGuardError,
  }
}
