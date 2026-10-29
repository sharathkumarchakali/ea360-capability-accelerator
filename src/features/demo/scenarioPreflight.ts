/**
 * Static scenario preflight (spec §9.2, layer 1).
 * Pure function of the working pack + binding: no writes, no DOM, no chat history.
 *
 * Status contract
 *  - Ready        every route, question handler, fixed record, relationship and catalogue entry resolves
 *  - Needs setup  only an explicit synthetic fixture is missing (presenter may choose "Prepare synthetic example")
 *  - Unavailable  a required feature/record is absent and cannot be created by a fixture
 */
import type { TenantPack } from '../../domain/schemas'
import { IMPLEMENTED_FEATURE_ROUTES } from '../../config/routes'
import { QUESTION_BY_ID } from '../../lib/ai/questionCatalog'
import { getCatalog } from '../ai-data-governance/governanceModel'
import {
  type BindingEntityType,
  type FixtureKind,
  type JourneyId,
  type JourneyScenarioBinding,
  getJourneyBinding,
  JOURNEY_IDS,
} from './journeyBindings'

export type PreflightStatus = 'Ready' | 'Needs setup' | 'Unavailable'

export type PreflightResult = {
  status: PreflightStatus
  reasons: string[]
  /** true when "Prepare synthetic example" would resolve every Needs-setup reason. */
  canPrepare: boolean
  fixture?: FixtureKind
  missing: string[]
}

/** Intents the deterministic adapter dispatches (kept in step with deterministicAdapter.ts). */
const SUPPORTED_ASK_INTENTS = new Set([
  'critical_risks',
  'maturity_gaps',
  'time_migrate_eliminate',
  'capability_applications',
  'integration_dependents',
  'impact_analysis',
  'p2p_concentration',
  'eos_technologies',
  'findings_without_remediation',
  'recommendations_awaiting_decision',
  'initiatives_for_objective',
  'executive_review',
  'evidence_gaps',
  'explain_finding',
  'evidence_for_finding',
  'recommendation_options',
  'initiative_kpi_summary',
  'data_governance_gaps',
  'data_lineage',
  'data_ai_readiness',
  'data_controls_missing',
  'technology_dependents',
  'technology_priority',
  'technology_cto_summary',
  'ai_governance_attention',
  'ai_agent_explain',
  'ai_agent_permissions',
  'ai_model_dependencies',
  'ai_agent_kpi',
  'import_validation',
  'workspace_readiness',
  'approval_authority',
  'approved_items',
  'demo_changes',
  'explain_metric',
  'recommendation_draft',
  'executive_briefing',
  'refuse_approval',
])

const COLLECTION_BY_TYPE: Record<BindingEntityType, string> = {
  scenario: 'scenarios',
  capability: 'capabilities',
  process: 'processes',
  application: 'applications',
  integration: 'integrations',
  dataObject: 'dataObjects',
  technology: 'technologies',
  evidence: 'evidence',
  finding: 'findings',
  recommendation: 'recommendations',
  decision: 'decisions',
  initiative: 'initiatives',
  kpi: 'kpis',
  aiSolution: 'aiSolutions',
  aiModel: 'aiModels',
  strategicObjective: 'strategicObjectives',
}

type AnyRec = { id: string } & Record<string, unknown>

function collection(pack: TenantPack, type: BindingEntityType): AnyRec[] {
  const key = COLLECTION_BY_TYPE[type]
  return ((pack as unknown as Record<string, AnyRec[] | undefined>)[key] ?? []) as AnyRec[]
}

export function findPackEntity(pack: TenantPack, type: BindingEntityType, id: string): AnyRec | undefined {
  return collection(pack, type).find((e) => e.id === id)
}

/** Which collection (if any) actually holds an ID — used to report wrong-type bindings. */
function actualTypeOf(pack: TenantPack, id: string): BindingEntityType | null {
  for (const type of Object.keys(COLLECTION_BY_TYPE) as BindingEntityType[]) {
    if (collection(pack, type).some((e) => e.id === id)) return type
  }
  return null
}

/**
 * Two records are "linked" when a registered relationship joins them, or either record
 * explicitly references the other's ID (linkedObjectIds, applicationIds, kpiIds, visibleEntityIds, …).
 */
export function isLinked(pack: TenantPack, a: AnyRec, b: AnyRec): boolean {
  const rels = (pack.relationships ?? []) as Array<{ sourceId: string; targetId: string }>
  if (rels.some((r) => (r.sourceId === a.id && r.targetId === b.id) || (r.sourceId === b.id && r.targetId === a.id))) {
    return true
  }
  const refs = (rec: AnyRec, id: string) => JSON.stringify(rec).includes(`"${id}"`)
  return refs(a, b.id) || refs(b, a.id)
}

function catalogHas(pack: TenantPack, kind: string, id: string): boolean {
  const catalog = getCatalog(pack.tenant.code)
  if (kind === 'policy' || kind === 'standard' || kind === 'control') {
    return catalog.policies.some((p) => p.id === id)
  }
  if (kind === 'exception') {
    if (catalog.exceptions.some((e) => e.id === id)) return true
    const inInitiative = (pack.initiatives ?? []).some(
      (i) =>
        ((i as unknown as { exceptionIds?: string[] }).exceptionIds ?? []).includes(id) ||
        ((i as unknown as { exceptionsDetail?: Array<{ id: string }> }).exceptionsDetail ?? []).some((x) => x.id === id),
    )
    if (inInitiative) return true
    return (pack.technologies ?? []).some((t) =>
      ((t as unknown as { exceptionIds?: string[] }).exceptionIds ?? []).includes(id),
    )
  }
  return false
}

export function runScenarioPreflight(
  pack: TenantPack | null | undefined,
  binding: JourneyScenarioBinding | null | undefined,
): PreflightResult {
  if (!binding) {
    return { status: 'Unavailable', reasons: ['No scenario binding exists for this workspace.'], canPrepare: false, missing: [] }
  }
  if (!binding.available) {
    return {
      status: 'Unavailable',
      reasons: [binding.unavailableReason || 'This journey is not available for this workspace.'],
      canPrepare: false,
      missing: [],
    }
  }
  if (!pack) {
    return { status: 'Unavailable', reasons: ['Workspace data is not loaded.'], canPrepare: false, missing: [] }
  }

  const blocking: string[] = []
  const setup: string[] = []
  const missing: string[] = []

  // 1. Routes registered
  for (const route of binding.routes) {
    if (!IMPLEMENTED_FEATURE_ROUTES.has(route)) blocking.push(`Route “${route}” is not registered.`)
  }

  // 2. Question handlers
  for (const qid of binding.questionIds) {
    const def = QUESTION_BY_ID[qid]
    if (!def) blocking.push(`Question ${qid} is not in the question catalogue.`)
    else if (!SUPPORTED_ASK_INTENTS.has(def.intent)) blocking.push(`Question ${qid} has no registered answer handler (${def.intent}).`)
  }

  // 3. Fixed records exist with the expected type
  const resolved: Record<string, AnyRec | undefined> = {}
  let fixtureMissing = 0
  for (const [key, ref] of Object.entries(binding.refs)) {
    const hit = findPackEntity(pack, ref.type, ref.id)
    resolved[key] = hit
    if (hit) continue
    if (ref.fixture) {
      fixtureMissing += 1
      missing.push(ref.id)
      continue
    }
    const actual = actualTypeOf(pack, ref.id)
    missing.push(ref.id)
    blocking.push(
      actual
        ? `${ref.id} exists as ${actual}, expected ${ref.type}.`
        : `Required ${ref.type} ${ref.id} was not found in this workspace.`,
    )
  }

  if (fixtureMissing > 0) {
    setup.push(
      `Synthetic practice scenario is not prepared in this workspace (${fixtureMissing} fixture record${fixtureMissing === 1 ? '' : 's'} missing).`,
    )
  }

  // 4. Governance catalogue entries (policies / standards / controls / exceptions)
  for (const ref of Object.values(binding.catalog ?? {})) {
    if (!catalogHas(pack, ref.kind, ref.id)) {
      missing.push(ref.id)
      blocking.push(`Required ${ref.kind} ${ref.id} was not found in this workspace's governance catalogue.`)
    }
  }

  // 5. Relationships form the intended story
  for (const [aKey, bKey] of binding.links ?? []) {
    const a = resolved[aKey]
    const b = resolved[bKey]
    if (!a || !b) continue
    if (!isLinked(pack, a, b)) {
      blocking.push(`No registered link between ${binding.refs[aKey].id} and ${binding.refs[bKey].id}.`)
    }
  }

  // 6. Journey-specific fixtures and initial workflow state
  let canPrepare = setup.length > 0 && blocking.length === 0
  if (binding.requiresFixture === 'j6-permission-evidence') {
    const agent = resolved.agent
    const finding = resolved.finding as (AnyRec & { evidenceIds?: string[] }) | undefined
    if (agent && finding) {
      const verifiedRelevant = (finding.evidenceIds ?? []).some((evId) => {
        const ev = findPackEntity(pack, 'evidence', evId) as (AnyRec & { verificationStatus?: string; linkedObjectIds?: string[] }) | undefined
        return ev?.verificationStatus === 'verified' && (ev.linkedObjectIds ?? []).includes(agent.id)
      })
      if (!verifiedRelevant) {
        setup.push('Verified permission/guardrail evidence for this agent has not been prepared; the existing finding cites only broad architecture evidence.')
        canPrepare = blocking.length === 0
      }
    }
  }
  if (binding.requiresFixture === 'j7-practice') {
    const finding = resolved.finding as (AnyRec & { workflowStatus?: string }) | undefined
    if (finding) {
      const advanced = (pack.recommendations ?? []).some((r) => (r.findingIds ?? []).includes(finding.id))
      if (advanced || (finding.workflowStatus && !['Under Review', 'Draft'].includes(finding.workflowStatus))) {
        setup.push(
          `Practice scenario has already progressed (finding is ${finding.workflowStatus ?? 'unknown'}). Reset the workspace to restore the practice baseline.`,
        )
        canPrepare = false
      }
    }
  }

  if (blocking.length) {
    return { status: 'Unavailable', reasons: blocking, canPrepare: false, fixture: binding.requiresFixture, missing }
  }
  if (setup.length) {
    return { status: 'Needs setup', reasons: setup, canPrepare, fixture: binding.requiresFixture, missing }
  }

  const checked = Object.keys(binding.refs).length + Object.keys(binding.catalog ?? {}).length
  return {
    status: 'Ready',
    reasons: [
      checked > 0
        ? `All ${checked} bound records, ${binding.routes.length} routes and ${binding.questionIds.length} question handlers resolved.`
        : `${binding.routes.length} routes and ${binding.questionIds.length} question handlers resolved.`,
    ],
    canPrepare: false,
    fixture: binding.requiresFixture,
    missing: [],
  }
}

export function preflightJourney(pack: TenantPack | null | undefined, tenantCode: string, journeyId: JourneyId): PreflightResult {
  return runScenarioPreflight(pack, getJourneyBinding(tenantCode, journeyId))
}

export function preflightAllJourneys(pack: TenantPack | null | undefined, tenantCode: string): Record<JourneyId, PreflightResult> {
  return Object.fromEntries(JOURNEY_IDS.map((id) => [id, preflightJourney(pack, tenantCode, id)])) as Record<JourneyId, PreflightResult>
}
