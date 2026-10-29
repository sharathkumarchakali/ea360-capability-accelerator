/**
 * Journeys J1–J8 (spec §3, §6) as typed, route-specific step contracts.
 * Steps never hardcode record IDs: they reference scenario bindings (journeyBindings.ts) by key,
 * so one definition serves every workspace that has a validated binding.
 * All content is illustrative synthetic data.
 */
import type { RouteId } from '../../config/routes'
import { IMPLEMENTED_FEATURE_ROUTES } from '../../config/routes'
import { QUESTION_BY_ID } from '../../lib/ai/questionCatalog'
import {
  type BindingEntityType,
  type JourneyId,
  type JourneyScenarioBinding,
  JOURNEY_IDS,
  getJourneyBinding,
  resolveLegacyJourneyId,
  resolveRunSlot,
} from './journeyBindings'

export type DemoJourneyKind =
  | 'executive'
  | 'architecture'
  | 'integration'
  | 'data'
  | 'technology'
  | 'ai'
  | 'transformation'
  | 'onboarding'
  | 'playlist'

export type EntityBinding =
  | { kind: 'fixed'; type: BindingEntityType; id: string }
  | { kind: 'run-slot'; type: BindingEntityType; slot: string }

export type AskMode = 'ask' | 'explain' | 'draft' | 'briefing'

export type DemoAskCommand = {
  mode: AskMode
  questionId?: string
  /** Permitted only for read-only generation; drafts/saves always wait for a human. */
  executeOnEnter: boolean
  audience?: string
}

export type DemoPredicate =
  | 'evidence-verified'
  | 'finding-accepted'
  | 'draft-saved'
  | 'recommendation-submitted'
  | 'decision-conditional'
  | 'initiative-created'
  | 'import-committed'

export type ScreenState = {
  tab?: string
  governanceTab?: string
  aiGovTab?: string
  heatmapMode?: 'maturity' | 'risk' | 'importance' | 'support' | 'investment'
}

export type StepFilters = Partial<{
  capabilityId: string
  applicationId: string
  integrationId: string
  findingId: string
  recommendationId: string
  decisionId: string
  initiativeId: string
  evidenceId: string
  technologyId: string
  dataObjectId: string
  aiSolutionId: string
  kpiId: string
  timeClass: string
  criticality: string
  pointToPoint: boolean
  decisionStatus: string
  mode: string
}>

export const SUPPORTED_FILTER_KEYS = new Set<string>([
  'capabilityId',
  'applicationId',
  'integrationId',
  'findingId',
  'recommendationId',
  'decisionId',
  'initiativeId',
  'evidenceId',
  'technologyId',
  'dataObjectId',
  'aiSolutionId',
  'kpiId',
  'timeClass',
  'criticality',
  'pointToPoint',
  'decisionStatus',
  'mode',
])

/** Central registry of `data-demo-target` names → selectors (spec §4.3). */
export const DEMO_TARGET_SELECTORS: Record<string, string> = {
  'executive-health': '[data-demo-target="executive-health"]',
  'findings-register': '[data-demo-target="findings-register"]',
  'capability-heatmap': '[data-demo-target="capability-heatmap"]',
  'recommendations-list': '[data-demo-target="recommendations-list"]',
  'roadmap-board': '[data-demo-target="roadmap-board"]',
  'governance-decisions': '[data-demo-target="governance-decisions"]',
  'evidence-panel': '[data-demo-target="evidence-panel"]',
  'relationship-explorer': '[data-demo-target="relationship-explorer"]',
  'entity-detail': '[data-demo-target="entity-detail"]',
  'application-portfolio': '[data-demo-target="application-portfolio"], .portfolio-table-desktop',
  'integration-topology': '[data-demo-target="integration-topology"], .portfolio-table-desktop',
  'architecture-health': '[data-demo-target="architecture-health"]',
  'standards-register': '[data-demo-target="standards-register"]',
  'review-board': '[data-demo-target="review-board"]',
  'kpi-register': '[data-demo-target="kpi-register"]',
  'demo-studio': '[data-demo-target="demo-studio"]',
  'onboarding-wizard': '[data-demo-target="onboarding-wizard"]',
  'data-ingestion-center': '[data-demo-target="data-ingestion-center"]',
  'workspace-settings': '[data-demo-target="workspace-settings"]',
  'view-root': '#main-content .view',
}

export type DemoGraphContext = {
  root: EntityBinding
  direction: 'upstream' | 'downstream' | 'both'
  depth: number
  impactMode: boolean
}

export type DemoStepV2 = {
  id: string
  title: string
  businessQuestion: string
  presenterNote: string
  expectedResult: string
  route: RouteId
  screenState?: ScreenState
  filters?: StepFilters
  selection?: EntityBinding
  graph?: DemoGraphContext
  target: { name: string; entity?: EntityBinding }
  ask?: DemoAskCommand
  /** A visible human action is required; Next waits for `completesWhen`. */
  humanAction?: string
  completesWhen?: DemoPredicate[]
  optional?: boolean
  /** Declared run-slot dependencies resolved from the pack at runtime. */
  slotsRequired?: string[]
}

export type DemoStepAction = {
  view: string
  scenarioId?: string
  selectEntity?: { id: string; type: string } | null
  graphRoot?: { id: string; type: string } | null
  graphDirection?: 'upstream' | 'downstream' | 'both'
  graphDepth?: number
  impactMode?: boolean
  heatmapMode?: string
  openAsk?: boolean
  openBriefing?: boolean
  filters?: StepFilters
  screenState?: ScreenState
  ask?: DemoAskCommand
}

/** Runtime step: typed V2 contract plus the compatibility `action` consumed by applyDemoStep. */
export type DemoStep = DemoStepV2 & {
  /** Legacy alias of `businessQuestion`. */
  businessRelevance: string
  highlightTarget: string
  action: DemoStepAction
  segmentJourneyId?: JourneyId
  segmentStart?: boolean
}

export type DemoJourney = {
  id: string
  journeyId: JourneyId | 'playlist'
  tenantCode: string
  kind: DemoJourneyKind
  title: string
  audience: string
  durationLabel: string
  durationMinutes: number
  description: string
  businessOutcome: string
  businessQuestion: string
  legacyIds: string[]
  steps: DemoStep[]
  /** Static binding availability; Studio refines with pack preflight. */
  bound: boolean
  boundReason?: string
  playlistId?: string
}

export type DemoEntryOption = {
  id: 'start-executive' | 'start-architecture' | 'explore'
  label: string
  description: string
  journeyKind: DemoJourneyKind | null
}

/** Landing-page entry points into a guided demo or free exploration. */
export const DEMO_ENTRY_OPTIONS: DemoEntryOption[] = [
  {
    id: 'start-executive',
    label: 'Start Executive Demo',
    description: 'Five-minute path from enterprise health to required decisions and briefing.',
    journeyKind: 'executive',
  },
  {
    id: 'start-architecture',
    label: 'Start Architecture Demo',
    description: 'Eight-minute trace from capability impact through applications, evidence and roadmap.',
    journeyKind: 'architecture',
  },
  {
    id: 'explore',
    label: 'Explore EA360',
    description: 'Enter the selected tenant without a guided tour.',
    journeyKind: null,
  },
]

/* ------------------------------------------------------------------ */
/* Journey metadata                                                    */
/* ------------------------------------------------------------------ */
type JourneyMeta = {
  kind: DemoJourneyKind
  title: string
  audience: string
  durationMinutes: number
  durationLabel: string
  businessQuestion: string
  businessOutcome: string
  description: string
}

const META: Record<JourneyId, JourneyMeta> = {
  J1: {
    kind: 'executive',
    title: 'Executive decision and briefing',
    audience: 'CEO/CIO, sponsor, executive committee',
    durationMinutes: 5,
    durationLabel: '~5 min',
    businessQuestion: 'What requires a decision, and why now?',
    businessOutcome: 'One named decision, its accountable authority, supporting evidence and linked delivery outcome.',
    description: 'See the enterprise position, understand one material exposure and leave with a clear decision.',
  },
  J2: {
    kind: 'architecture',
    title: 'Capability impact and application rationalisation',
    audience: 'Enterprise, business and application architects',
    durationMinutes: 8,
    durationLabel: '~8 min',
    businessQuestion: 'Which overlapping applications can we simplify safely?',
    businessOutcome: 'A governed consolidation candidate with its capability, process and dependency exposure — not an automatic retirement.',
    description: 'Simplify applications while protecting the capabilities and processes they serve.',
  },
  J3: {
    kind: 'integration',
    title: 'Integration and payment resilience',
    audience: 'Integration/API architect, operations, CIO',
    durationMinutes: 8,
    durationLabel: '~8 min',
    businessQuestion: 'What depends on this interface, and how do we reduce failure exposure?',
    businessOutcome: 'One interface anchors table, graph, risk, decision and initiative; exposure is recorded dependency, not predicted outage.',
    description: 'Reveal the business exposure of a critical interface and trace a practical resilience response.',
  },
  J4: {
    kind: 'data',
    title: 'Data trust, lineage and AI readiness',
    audience: 'CDO, data owner, compliance',
    durationMinutes: 7,
    durationLabel: '~7 min',
    businessQuestion: 'Which data is trustworthy enough to use, share or expose to AI?',
    businessOutcome: 'Source of truth, conditions for AI use and missing reviews — recorded readiness, not a regulatory approval.',
    description: 'Identify the source of truth and the conditions required before data can support AI.',
  },
  J5: {
    kind: 'technology',
    title: 'Technology lifecycle and resilience',
    audience: 'CTO, infrastructure, security',
    durationMinutes: 7,
    durationLabel: '~7 min',
    businessQuestion: 'Where does obsolete technology threaten important services?',
    businessOutcome: 'A prioritised, governed containment path tied to business service exposure and an explicit as-of date.',
    description: 'Prioritise obsolete technology by business impact and govern the transition.',
  },
  J6: {
    kind: 'ai',
    title: 'Governed AI, models and agents',
    audience: 'AI lead, risk, architect, review board',
    durationMinutes: 8,
    durationLabel: '~8 min',
    businessQuestion: 'What can this agent do, and are its controls sufficient?',
    businessOutcome: 'Recorded agent permissions and guardrail gaps, a reviewable remediation draft and an explicit human approval boundary.',
    description: 'Show what an agent can access and influence, then govern its permissions and oversight.',
  },
  J7: {
    kind: 'transformation',
    title: 'Evidence to human decision, delivery and KPI',
    audience: 'ARB, transformation lead, PMO',
    durationMinutes: 10,
    durationLabel: '~10 min',
    businessQuestion: 'How does an observed risk become an accountable, measurable change?',
    businessOutcome: 'A navigable, auditable chain from finding to recommendation, decision, initiative and KPI created through human actions.',
    description: 'Turn one observed problem into a reviewed change with clear authority, delivery ownership and measurement.',
  },
  J8: {
    kind: 'onboarding',
    title: 'New customer onboarding and data ingestion',
    audience: 'Presenter, prospect architect, workspace admin',
    durationMinutes: 5,
    durationLabel: '~5 min sample / ~8 min CSV',
    businessQuestion: 'How does a new organisation get started and trust its imported baseline?',
    businessOutcome: 'A validated illustrative workspace profile, staged import with row-level errors and an explicit commit.',
    description: 'Create an illustrative organisation, validate its data and reach the first useful decision.',
  },
}

/* ------------------------------------------------------------------ */
/* Step builders                                                       */
/* ------------------------------------------------------------------ */
type Ctx = {
  tenantCode: string
  b: JourneyScenarioBinding
  fx: (key: string) => EntityBinding | undefined
  slot: (name: string) => EntityBinding | undefined
  graph: (
    key: string,
    direction?: 'upstream' | 'downstream' | 'both',
    depth?: number,
  ) => DemoGraphContext | undefined
}

type StepInput = Omit<DemoStepV2, 'id' | 'target'> & { id?: string; target?: string; targetEntity?: EntityBinding }

function makeCtx(b: JourneyScenarioBinding): Ctx {
  const fx = (key: string): EntityBinding | undefined => {
    const ref = b.refs[key]
    return ref ? { kind: 'fixed', type: ref.type, id: ref.id } : undefined
  }
  const slot = (name: string): EntityBinding | undefined => {
    const s = b.slots?.[name]
    return s ? { kind: 'run-slot', type: s.type, slot: s.slot } : undefined
  }
  return {
    tenantCode: b.tenantCode,
    b,
    fx,
    slot,
    graph: (key, direction = 'both', depth = 2) => {
      const root = fx(key)
      return root ? { root, direction, depth, impactMode: true } : undefined
    },
  }
}

function defaultTarget(route: RouteId): string {
  switch (route) {
    case 'executive':
      return 'executive-health'
    case 'findings':
      return 'findings-register'
    case 'capabilities':
      return 'capability-heatmap'
    case 'recommendations':
      return 'recommendations-list'
    case 'roadmap':
      return 'roadmap-board'
    case 'decisions':
    case 'governance':
      return 'governance-decisions'
    case 'evidence':
      return 'evidence-panel'
    case 'explorer':
      return 'relationship-explorer'
    case 'applications':
      return 'application-portfolio'
    case 'integrations':
      return 'integration-topology'
    case 'assessment':
      return 'architecture-health'
    case 'standards':
      return 'standards-register'
    case 'reviews':
      return 'review-board'
    case 'kpis':
      return 'kpi-register'
    case 'demo-studio':
      return 'demo-studio'
    case 'onboarding':
      return 'onboarding-wizard'
    case 'data-ingestion':
      return 'data-ingestion-center'
    case 'workspace-settings':
      return 'workspace-settings'
    default:
      return 'view-root'
  }
}

/* ------------------------------------------------------------------ */
/* J1–J8 templates                                                     */
/* ------------------------------------------------------------------ */
type Template = (c: Ctx) => Array<StepInput & { id: string }>

const J1: Template = (c) => [
  {
    id: 'J1.1',
    title: 'Choose organisation, journey and role',
    businessQuestion: 'What requires a decision, and why now?',
    presenterNote: 'In Demo Studio select the organisation, the Executive journey and the audience role, then Start. Confirm preflight shows Ready.',
    expectedResult: 'Branded title card, active organisation, illustrative-data label and a decision-focused outcome; preflight passed before entering the cockpit.',
    route: 'demo-studio',
  },
  {
    id: 'J1.2',
    title: 'Enterprise health and priority risks',
    businessQuestion: 'How healthy is the enterprise and what are the top risks?',
    presenterNote: 'Point at the health and maturity tiles, then use Explain on enterprise health. Mention the as-of date.',
    expectedResult: 'Health, maturity, priority risks and pending decisions come from the same workspace snapshot; formula and inputs are explainable.',
    route: 'executive',
    ask: { mode: 'ask', questionId: 'Q01', executeOnEnter: true },
  },
  {
    id: 'J1.3',
    title: 'Open the material risk',
    businessQuestion: 'What is the exposure, who owns it and what supports it?',
    presenterNote: 'The bound finding opens with its impact, severity, owner and evidence. Ask “Explain this finding”.',
    expectedResult: 'Business impact, severity, owner, source evidence and review state for the selected finding; the record visibly opens.',
    route: 'findings',
    selection: c.fx('finding'),
    filters: { findingId: c.b.refs.finding?.id },
    ask: { mode: 'explain', questionId: 'Q03', executeOnEnter: true },
  },
  {
    id: 'J1.4',
    title: 'Affected capability',
    businessQuestion: 'Which capability and applications does this risk land on?',
    presenterNote: 'Show the bound capability in the risk heatmap, then open a supporting application from its real links.',
    expectedResult: 'Affected capability, supporting applications and business meaning match the finding.',
    route: 'capabilities',
    screenState: { heatmapMode: 'risk' },
    selection: c.fx('capability'),
    filters: { capabilityId: c.b.refs.capability?.id },
  },
  {
    id: 'J1.5a',
    title: 'Recommended response',
    businessQuestion: 'What response is proposed and where does it stand?',
    presenterNote: 'Open the recommendation. Its state is Under Review (not approved) for the bound GRA scenario.',
    expectedResult: 'Response option, evidence and review state; not shown as approved.',
    route: 'recommendations',
    selection: c.fx('recommendation'),
    filters: { recommendationId: c.b.refs.recommendation?.id },
  },
  {
    id: 'J1.5b',
    title: 'Decision awaiting authority',
    businessQuestion: 'What awaits a decision, from whom, by when?',
    presenterNote: 'Open the linked decision. Pending is clearly distinct from Approved. Ask which recommendations await decisions.',
    expectedResult: 'Pending decision with authority, evidence and deadline.',
    route: 'decisions',
    selection: c.fx('decision'),
    filters: { decisionId: c.b.refs.decision?.id, decisionStatus: 'Pending' },
    ask: { mode: 'ask', questionId: 'Q04', executeOnEnter: true },
  },
  {
    id: 'J1.6',
    title: 'Delivery vehicle and intended outcome',
    businessQuestion: 'How would this be delivered and measured?',
    presenterNote: 'Open the initiative on the roadmap. Do not call it funded without funding evidence; show the linked KPI as an intended outcome.',
    expectedResult: 'Proposed delivery, owner, dependencies and outstanding governance; the linked KPI target is shown as intent, not result.',
    route: 'roadmap',
    selection: c.fx('initiative'),
    filters: { initiativeId: c.b.refs.initiative?.id },
  },
  {
    id: 'J1.7',
    title: 'Executive briefing',
    businessQuestion: 'Can we leave with a one-page position?',
    presenterNote: 'Generate the briefing for the selected audience. Generation is executed on entry; Copy and Open report are available on the briefing.',
    expectedResult: 'A generated briefing with position, top risks, decision needed, delivery outlook, limitations and next action.',
    route: 'executive',
    ask: { mode: 'briefing', questionId: 'Q05', executeOnEnter: true, audience: 'Executive Committee' },
  },
  {
    id: 'J1.8',
    title: 'Report and print',
    businessQuestion: 'Does the printed view tell the same story?',
    presenterNote: 'Preview the Executive Report and use Print / Save as PDF.',
    expectedResult: 'Same facts, workspace, as-of date, Kulana identity, source references and the synthetic disclaimer.',
    route: 'reports',
    optional: true,
  },
]

const J2: Template = (c) => [
  {
    id: 'J2.1',
    title: 'Architecture health in scope',
    businessQuestion: 'Where is the architecture weakest in this workspace?',
    presenterNote: 'Open Architecture Health and read the domain current/target gap; ask how the figure is calculated.',
    expectedResult: 'Workspace-derived maturity current/target, evidence coverage and gap; no tenant-independent totals.',
    route: 'assessment',
    ask: { mode: 'explain', questionId: 'Q02', executeOnEnter: true },
  },
  {
    id: 'J2.2',
    title: 'Capability maturity gap',
    businessQuestion: 'Which capabilities have the largest maturity gaps?',
    presenterNote: 'Select the bound capability and toggle maturity / risk. The same capability stays selected.',
    expectedResult: 'Current/target gap, importance, owner and related objectives visible for the selected capability.',
    route: 'capabilities',
    screenState: { heatmapMode: 'maturity' },
    selection: c.fx('capability'),
    filters: { capabilityId: c.b.refs.capability?.id },
    ask: { mode: 'ask', questionId: 'Q06', executeOnEnter: true },
  },
  {
    id: 'J2.3',
    title: 'Supporting processes and applications',
    businessQuestion: 'Which applications and processes support this capability?',
    presenterNote: 'Open the capability detail and follow its processes and supported applications.',
    expectedResult: 'Actual process names and supported applications from registered links.',
    route: 'capabilities',
    selection: c.fx('capability'),
    ask: { mode: 'ask', questionId: 'Q07', executeOnEnter: true },
  },
  {
    id: 'J2.4',
    title: 'Overlapping applications',
    businessQuestion: 'Which applications are migration or elimination candidates?',
    presenterNote: 'Filter the overlap cluster and select the primary application. TIME class is a classification, not a decision.',
    expectedResult: 'TIME class, business value, health, cost band, lifecycle, owner and duplicated capability coverage.',
    route: 'applications',
    selection: c.fx('application'),
    filters: { capabilityId: c.b.refs.capability?.id, applicationId: c.b.refs.application?.id },
    ask: { mode: 'ask', questionId: 'Q08', executeOnEnter: true },
  },
  {
    id: 'J2.5',
    title: 'Compare the two applications',
    businessQuestion: 'How do the two applications really differ?',
    presenterNote: 'Open the second application and compare coverage, technology, integration, data and owner. Duplicate coverage does not mean interchangeable systems.',
    expectedResult: 'Differences in coverage, technology, integrations, data and owner; missing values labelled unknown.',
    route: 'applications',
    selection: c.fx('application2'),
    filters: { applicationId: c.b.refs.application2?.id },
  },
  {
    id: 'J2.6',
    title: 'Impact of retiring the application',
    businessQuestion: 'What would retirement affect?',
    presenterNote: 'Root the graph at the primary application in impact mode and read direction and provenance.',
    expectedResult: 'Linked capabilities, consumers, APIs, data and technology with directional traversal.',
    route: 'explorer',
    selection: c.fx('application'),
    graph: c.graph('application', 'both', 2),
    ask: { mode: 'ask', questionId: 'Q09', executeOnEnter: true },
  },
  {
    id: 'J2.7a',
    title: 'Duplication finding',
    businessQuestion: 'What risk does the duplication create?',
    presenterNote: 'Open the bound finding.',
    expectedResult: 'Finding with severity, owner, impact and linked evidence.',
    route: 'findings',
    selection: c.fx('finding'),
    filters: { findingId: c.b.refs.finding?.id },
  },
  {
    id: 'J2.7b',
    title: 'Source evidence',
    businessQuestion: 'What evidence supports the finding?',
    presenterNote: 'Open the source evidence record and read its verification status.',
    expectedResult: 'Evidence metadata, verification and freshness.',
    route: 'evidence',
    selection: c.fx('evidence'),
    filters: { evidenceId: c.b.refs.evidence?.id },
  },
  {
    id: 'J2.7c',
    title: 'Existing recommendation and standards',
    businessQuestion: 'Which governed response already exists?',
    presenterNote: 'Open the existing recommendation; do not invent a new remediation link. Show the applicable standard.',
    expectedResult: 'Existing recommendation state, decision and initiative; applicable standard visible.',
    route: 'recommendations',
    selection: c.fx('recommendation'),
    filters: { recommendationId: c.b.refs.recommendation?.id },
  },
  {
    id: 'J2.8',
    title: 'Roadmap and filtered export',
    businessQuestion: 'Is consolidation sequenced and governed?',
    presenterNote: 'Open the linked initiative; then export the filtered application portfolio CSV from Applications. Close: a candidate for governed consolidation, not automatic retirement.',
    expectedResult: 'Sequenced migration, dependencies, remaining governance and intended KPI.',
    route: 'roadmap',
    selection: c.fx('initiative'),
    filters: { initiativeId: c.b.refs.initiative?.id },
  },
]

const J3: Template = (c) => [
  {
    id: 'J3.1',
    title: 'Critical interfaces',
    businessQuestion: 'Where are integrations concentrated and critical?',
    presenterNote: 'Filter critical interfaces. Counts must match the visible scope.',
    expectedResult: 'Asset type, owner, source/target, monitoring, reuse and criticality; counts match the visible scope.',
    route: 'integrations',
    filters: { criticality: 'critical', pointToPoint: true },
    ask: { mode: 'ask', questionId: 'Q10', executeOnEnter: true },
  },
  {
    id: 'J3.2',
    title: 'Open the interface',
    businessQuestion: 'What depends on this interface?',
    presenterNote: 'Open the bound interface. Names come from the repository; IDs are not shown to the audience.',
    expectedResult: 'Interface name, endpoints/applications, related data and monitoring gaps from metadata.',
    route: 'integrations',
    selection: c.fx('integration'),
    filters: { integrationId: c.b.refs.integration?.id },
    ask: { mode: 'ask', questionId: 'Q11', executeOnEnter: true },
  },
  {
    id: 'J3.3',
    title: 'Dependency graph',
    businessQuestion: 'Which channels, data and capabilities sit around it?',
    presenterNote: 'Open the explorer rooted at the interface in impact mode and describe dependency direction.',
    expectedResult: 'Channels/gateway, core platform, events, data and impacted capabilities with direction and path labels.',
    route: 'explorer',
    selection: c.fx('integration'),
    graph: c.graph('integration', 'both', 2),
  },
  {
    id: 'J3.4',
    title: 'What if it is unavailable?',
    businessQuestion: 'What exposure follows if this interface is unavailable?',
    presenterNote: 'Ask the unavailability question. Potential exposure is based on recorded dependencies; no outage has occurred.',
    expectedResult: 'Exposure from recorded dependencies, no outage duration or loss claim; Show affected objects and Open graph work.',
    route: 'explorer',
    selection: c.fx('integration'),
    graph: c.graph('integration', 'downstream', 2),
    ask: { mode: 'ask', questionId: 'Q12', executeOnEnter: true },
  },
  {
    id: 'J3.5a',
    title: 'Resilience finding',
    businessQuestion: 'Which risk is recorded for this path?',
    presenterNote: 'Open the explicit resilience finding.',
    expectedResult: 'Finding with severity, owner and review state.',
    route: 'findings',
    selection: c.fx('finding'),
    filters: { findingId: c.b.refs.finding?.id },
  },
  {
    id: 'J3.5b',
    title: 'Supporting evidence',
    businessQuestion: 'Which evidence supports this risk?',
    presenterNote: 'Open the evidence and check verification and freshness.',
    expectedResult: 'Outage/monitoring evidence metadata, freshness and verification.',
    route: 'evidence',
    selection: c.fx('evidence'),
    filters: { evidenceId: c.b.refs.evidence?.id },
    ask: { mode: 'ask', questionId: 'Q13', executeOnEnter: true },
  },
  {
    id: 'J3.6a',
    title: 'Response options',
    businessQuestion: 'What response is recommended?',
    presenterNote: 'Open the recommendation. Proposed patterns are recommendations, not facts about the estate.',
    expectedResult: 'Delivery/retry/dead-letter/monitoring response with options; proposals labelled as such.',
    route: 'recommendations',
    selection: c.fx('recommendation'),
    filters: { recommendationId: c.b.refs.recommendation?.id },
    ask: { mode: 'ask', questionId: 'Q14', executeOnEnter: true },
  },
  {
    id: 'J3.6b',
    title: 'Applicable standards',
    businessQuestion: 'Which integration rules apply?',
    presenterNote: 'Open Standards & Principles and show the integration rules.',
    expectedResult: 'Tenant-scoped applicable standards and exceptions.',
    route: 'standards',
  },
  {
    id: 'J3.7',
    title: 'Decision with conditions',
    businessQuestion: 'What is the status of the governance decision?',
    presenterNote: 'Open the decision. It is already Approved with Conditions; never describe it as unconditional clearance. Use J7 to create a fresh decision.',
    expectedResult: 'Approved with Conditions, its conditions and any exception expiry visible.',
    route: 'decisions',
    selection: c.fx('decision'),
    filters: { decisionId: c.b.refs.decision?.id },
  },
  {
    id: 'J3.8a',
    title: 'Initiative and delivery',
    businessQuestion: 'How is the response being delivered?',
    presenterNote: 'Open the initiative on the roadmap.',
    expectedResult: 'Owner, period, dependencies and linked KPIs.',
    route: 'roadmap',
    selection: c.fx('initiative'),
    filters: { initiativeId: c.b.refs.initiative?.id },
  },
  {
    id: 'J3.8b',
    title: 'KPI baseline, current and target',
    businessQuestion: 'How will improvement be measured?',
    presenterNote: 'Open the linked KPI. Targets are intent; they have not been achieved by approving a change. Export the filtered integration CSV if asked.',
    expectedResult: 'Baseline / current / target, unit, frequency, owner and source from the current seed.',
    route: 'kpis',
    selection: c.fx('kpi'),
    filters: { kpiId: c.b.refs.kpi?.id },
    ask: { mode: 'ask', questionId: 'Q15', executeOnEnter: true },
  },
]

const J4: Template = (c) => [
  {
    id: 'J4.1',
    title: 'Critical and sensitive data',
    businessQuestion: 'Where are the governance gaps in critical data?',
    presenterNote: 'Filter critical/sensitive data and read ownership, stewardship and quality.',
    expectedResult: 'Domain, classification, owner, stewardship, quality and authoritative-source status.',
    route: 'data-information',
    ask: { mode: 'ask', questionId: 'Q16', executeOnEnter: true },
  },
  {
    id: 'J4.2',
    title: 'Open the data domain',
    businessQuestion: 'Who owns it and where does it come from?',
    presenterNote: 'Open the bound data domain overview. Unknown fields stay unknown.',
    expectedResult: 'Sources, sensitivity, owner/steward/custodian, source/consumer applications and recorded residency status.',
    route: 'data-information',
    selection: c.fx('data'),
    filters: { dataObjectId: c.b.refs.data?.id },
  },
  {
    id: 'J4.3',
    title: 'Lineage',
    businessQuestion: 'What are the source and consumers?',
    presenterNote: 'Open lineage and the explorer rooted at the data domain. Metadata links and inferred links are distinguished.',
    expectedResult: 'Registered source → interface → data → consumer paths; gaps shown as gaps.',
    route: 'explorer',
    selection: c.fx('data'),
    graph: c.graph('data', 'both', 2),
    ask: { mode: 'ask', questionId: 'Q17', executeOnEnter: true },
  },
  {
    id: 'J4.4',
    title: 'Is it ready for AI use?',
    businessQuestion: 'Is this data ready for AI use?',
    presenterNote: 'Ask the AI-readiness question. The answer is conditional and not a regulatory approval.',
    expectedResult: 'Conditional readiness with quality, source conflicts and personal-data constraints from the record.',
    route: 'data-information',
    selection: c.fx('data'),
    ask: { mode: 'ask', questionId: 'Q18', executeOnEnter: true },
  },
  {
    id: 'J4.5a',
    title: 'Governance — data tab',
    businessQuestion: 'What do ownership, quality and access look like?',
    presenterNote: 'Open AI & Data Governance, Data tab, with the data domain in context.',
    expectedResult: 'Ownership, quality, residency, access and evidence gaps.',
    route: 'ai-data-governance',
    screenState: { aiGovTab: 'data' },
    selection: c.fx('data'),
  },
  {
    id: 'J4.5b',
    title: 'Governance — policies and standards',
    businessQuestion: 'Which policy and standard apply?',
    presenterNote: 'Switch to Policies and open the bound policy and standard.',
    expectedResult: 'Policy and standard references resolve within this workspace.',
    route: 'ai-data-governance',
    screenState: { aiGovTab: 'policies' },
    selection: c.fx('data'),
  },
  {
    id: 'J4.6',
    title: 'Approvals and exceptions',
    businessQuestion: 'Which reviews or controls are missing?',
    presenterNote: 'Open Approvals & Exceptions. If none is recorded, say so explicitly.',
    expectedResult: 'Relevant pending/conditional items with authority, owner and expiry, or an explicit statement that none is recorded.',
    route: 'ai-data-governance',
    screenState: { aiGovTab: 'approvals' },
    selection: c.fx('data'),
    ask: { mode: 'ask', questionId: 'Q19', executeOnEnter: true },
  },
  {
    id: 'J4.7a',
    title: 'Finding and remediation',
    businessQuestion: 'What remediation already exists?',
    presenterNote: 'Open the linked finding.',
    expectedResult: 'Finding with owner and linked recommendation.',
    route: 'findings',
    selection: c.fx('finding'),
    filters: { findingId: c.b.refs.finding?.id },
  },
  {
    id: 'J4.7b',
    title: 'Delivery and intended data outcome',
    businessQuestion: 'Who delivers the improvement?',
    presenterNote: 'Open the initiative. Do not claim automatic quality improvement. Export the filtered data portfolio CSV if needed.',
    expectedResult: 'Existing consolidation chain, remediation owner and intended data outcome.',
    route: 'initiatives',
    selection: c.fx('initiative'),
    filters: { initiativeId: c.b.refs.initiative?.id },
    optional: true,
  },
]

const J5: Template = (c) => [
  {
    id: 'J5.1',
    title: 'Obsolete and high-risk technology',
    businessQuestion: 'Which technologies are at or approaching end of support?',
    presenterNote: 'Filter expired / retire / high-risk technology against the visible as-of date.',
    expectedResult: 'Support status, lifecycle, standard status, application exposure and resilience.',
    route: 'technology-infrastructure',
    ask: { mode: 'ask', questionId: 'Q20', executeOnEnter: true },
  },
  {
    id: 'J5.2',
    title: 'Open the technology',
    businessQuestion: 'What does this technology support and what is its gap?',
    presenterNote: 'Clarify that dates are seed metadata, not independently verified vendor dates.',
    expectedResult: 'Support date, target lifecycle, owner, affected applications, HA/DR gap and exception.',
    route: 'technology-infrastructure',
    selection: c.fx('technology'),
    filters: { technologyId: c.b.refs.technology?.id },
  },
  {
    id: 'J5.3',
    title: 'Service dependency graph',
    businessQuestion: 'What services depend on it?',
    presenterNote: 'Open the explorer rooted at the technology in impact mode.',
    expectedResult: 'Dependent applications, capabilities and related dependencies from registered links.',
    route: 'explorer',
    selection: c.fx('technology'),
    graph: c.graph('technology', 'upstream', 2),
    ask: { mode: 'ask', questionId: 'Q21', executeOnEnter: true },
  },
  {
    id: 'J5.4',
    title: 'Standards and exception',
    businessQuestion: 'Is this an approved, tolerated or excepted position?',
    presenterNote: 'Open Standards & Principles and show the technology exception with owner, review date and containment conditions.',
    expectedResult: 'Approved/tolerated/exception context, exception owner, review date and containment conditions.',
    route: 'standards',
    screenState: { tab: 'exceptions' },
  },
  {
    id: 'J5.5',
    title: 'Linked risk and evidence',
    businessQuestion: 'Why prioritise this technology?',
    presenterNote: 'Open the finding and its evidence; separate proposed priority from recorded severity.',
    expectedResult: 'Technology risk tied to business service exposure with evidence completeness.',
    route: 'findings',
    selection: c.fx('finding'),
    filters: { findingId: c.b.refs.finding?.id },
    ask: { mode: 'ask', questionId: 'Q22', executeOnEnter: true },
  },
  {
    id: 'J5.6',
    title: 'Containment initiative',
    businessQuestion: 'What is the containment or migration plan?',
    presenterNote: 'Open the initiative. Do not invent a recommendation or decision if none is linked; name outstanding governance.',
    expectedResult: 'Plan, dependencies and intended outcome; outstanding governance stated.',
    route: 'roadmap',
    selection: c.fx('initiative'),
    filters: { initiativeId: c.b.refs.initiative?.id },
  },
  {
    id: 'J5.7',
    title: 'CTO summary and export',
    businessQuestion: 'What should the CTO decide?',
    presenterNote: 'Ask for the CTO summary and export the filtered technology rows. Viewing the roadmap does not fix support or resilience.',
    expectedResult: 'Evidence-grounded support exposure, proposed action and decision required.',
    route: 'technology-infrastructure',
    selection: c.fx('technology'),
    ask: { mode: 'ask', questionId: 'Q23', executeOnEnter: true },
  },
]

const J6: Template = (c) => [
  {
    id: 'J6.1',
    title: 'High-risk AI portfolio',
    businessQuestion: 'Which AI use cases need governance attention?',
    presenterNote: 'Select the high-risk AI / agent segment.',
    expectedResult: 'Lifecycle, risk/autonomy, ownership, governance coverage and outcome coverage.',
    route: 'ai-automation',
    ask: { mode: 'ask', questionId: 'Q24', executeOnEnter: true },
  },
  {
    id: 'J6.2',
    title: 'Open the agent',
    businessQuestion: 'What is this agent for and who is accountable?',
    presenterNote: 'Open the bound agent and read purpose, autonomy, owner, oversight and model dependencies.',
    expectedResult: 'Business purpose, criticality, autonomy, accountable owner, human oversight and model dependencies.',
    route: 'ai-automation',
    selection: c.fx('agent'),
    filters: { aiSolutionId: c.b.refs.agent?.id },
    ask: { mode: 'explain', questionId: 'Q25', executeOnEnter: true },
  },
  {
    id: 'J6.3',
    title: 'Permissions and data access',
    businessQuestion: 'What can the agent do and which controls are missing?',
    presenterNote: 'Read the recorded READ/WRITE/EXECUTE metadata. The prototype never executes these tools.',
    expectedResult: 'Recorded permissions with linked APIs, personal/sensitive data and guardrails (partial / missing).',
    route: 'ai-automation',
    screenState: { tab: 'permissions' },
    selection: c.fx('agent'),
    ask: { mode: 'ask', questionId: 'Q26', executeOnEnter: true },
  },
  {
    id: 'J6.4',
    title: 'Model and dependency graph',
    businessQuestion: 'What does the agent depend on?',
    presenterNote: 'Root the graph at the agent. Relationships synthesised from declared metadata are labelled.',
    expectedResult: 'Real model, data, application, technology and tool links with provenance.',
    route: 'explorer',
    selection: c.fx('agent'),
    graph: c.graph('agent', 'both', 2),
    ask: { mode: 'ask', questionId: 'Q27', executeOnEnter: true },
  },
  {
    id: 'J6.5a',
    title: 'Governance — AI tab',
    businessQuestion: 'Where is the permission gap recorded?',
    presenterNote: 'Open AI & Data Governance, AI tab.',
    expectedResult: 'Permission gap and review information for the agent.',
    route: 'ai-data-governance',
    screenState: { aiGovTab: 'ai' },
    selection: c.fx('agent'),
  },
  {
    id: 'J6.5b',
    title: 'Governance — controls and policies',
    businessQuestion: 'Which control and policy apply?',
    presenterNote: 'Open Policies and the permission control and human-oversight policy.',
    expectedResult: 'Control and policy details resolve within this workspace.',
    route: 'ai-data-governance',
    screenState: { aiGovTab: 'policies' },
    selection: c.fx('agent'),
  },
  {
    id: 'J6.5c',
    title: 'Governance — approvals and exceptions',
    businessQuestion: 'Who has authority and what is the status?',
    presenterNote: 'Open Approvals & Exceptions.',
    expectedResult: 'Actual authority, status and review information.',
    route: 'ai-data-governance',
    screenState: { aiGovTab: 'approvals' },
    selection: c.fx('agent'),
  },
  {
    id: 'J6.6',
    title: 'Draft a remediation recommendation',
    businessQuestion: 'What should change to tighten the permission boundary?',
    presenterNote: 'Select the permission finding and ask for a draft. The draft separates facts from proposed controls; Save for review is a human action and saves a Draft only.',
    expectedResult: 'Editable draft proposing least privilege, explicit action boundaries, human checkpoints and monitoring.',
    route: 'findings',
    selection: c.fx('finding'),
    filters: { findingId: c.b.refs.finding?.id },
    ask: { mode: 'draft', questionId: 'Q28', executeOnEnter: false },
  },
  {
    id: 'J6.7',
    title: 'Approve for production?',
    businessQuestion: 'Can the assistant approve this agent for production?',
    presenterNote: 'Ask the approval question: it must refuse and point to the governance review. No status, permission or lifecycle changes.',
    expectedResult: 'Human approval is required; the relevant governance review opens; nothing is mutated.',
    route: 'ai-data-governance',
    screenState: { aiGovTab: 'approvals' },
    selection: c.fx('agent'),
    ask: { mode: 'ask', questionId: 'Q29', executeOnEnter: true },
  },
  {
    id: 'J6.8',
    title: 'Measure improvement',
    businessQuestion: 'How will we measure this agent\'s improvement?',
    presenterNote: 'Show an agent-control KPI if present, otherwise a clearly proposed metric and measurement owner. Do not borrow the copilot handling-time KPI.',
    expectedResult: 'Agent-specific KPI or an explicitly proposed metric with owner and baseline needed.',
    route: 'kpis',
    ask: { mode: 'ask', questionId: 'Q30', executeOnEnter: true },
  },
  {
    id: 'J6.9',
    title: 'Missing-evidence path',
    businessQuestion: 'What happens when a finding has no evidence?',
    presenterNote: 'Select the evidence-free finding and request a draft. The assistant must show the gap, not borrow another finding.',
    expectedResult: 'Explicit missing-evidence response with Review evidence gaps.',
    route: 'findings',
    selection: c.fx('missingEvidenceFinding'),
    filters: { findingId: c.b.refs.missingEvidenceFinding?.id },
    ask: { mode: 'draft', questionId: 'Q28', executeOnEnter: false },
    optional: true,
  },
  {
    id: 'J6.10',
    title: 'Model concentration',
    businessQuestion: 'What depends on this shared model?',
    presenterNote: 'Open the model and its dependent copilots, then the concentration finding. Keep the copilot and the fraud agent separate.',
    expectedResult: 'Dependent copilots and the model-concentration finding; copilot KPI shown only for the copilot.',
    route: 'ai-automation',
    selection: c.fx('model'),
    filters: { aiSolutionId: c.b.refs.copilot?.id },
    ask: { mode: 'ask', questionId: 'Q27', executeOnEnter: true },
    optional: true,
  },
]

const J7: Template = (c) => [
  {
    id: 'J7.1',
    title: 'Open the practice finding',
    businessQuestion: 'What problem was observed?',
    presenterNote: 'The finding title identifies this as a synthetic practice scenario. Read the problem, impact, owner, risk score and Under Review state.',
    expectedResult: 'Problem, impact, owner, risk score and Under Review; source evidence exists.',
    route: 'findings',
    selection: c.fx('finding'),
    filters: { findingId: c.b.refs.finding?.id },
    ask: { mode: 'explain', questionId: 'Q03', executeOnEnter: true },
  },
  {
    id: 'J7.2',
    title: 'Verify the second evidence item',
    businessQuestion: 'Is the evidence sound enough to rely on?',
    presenterNote: 'Inspect source preview, reference and capture date, then verify the second item with a comment. Re-ask which evidence supports the risk afterwards.',
    expectedResult: 'Verified record updates, confidence recalculates and the audit entry records actor role, time and before/after.',
    route: 'evidence',
    selection: c.fx('evidenceReview'),
    filters: { evidenceId: c.b.refs.evidenceReview?.id },
    humanAction: 'Verify the unverified evidence item with a comment.',
    completesWhen: ['evidence-verified'],
    ask: { mode: 'ask', questionId: 'Q13', executeOnEnter: true },
  },
  {
    id: 'J7.3',
    title: 'Validate and accept the finding',
    businessQuestion: 'Is the finding accepted as a basis for change?',
    presenterNote: 'Validate, then accept, using the allowed transitions.',
    expectedResult: 'Under Review → Validated → Accepted; audit trail and UI agree.',
    route: 'findings',
    selection: c.fx('finding'),
    humanAction: 'Validate the finding, then accept it.',
    completesWhen: ['finding-accepted'],
  },
  {
    id: 'J7.4',
    title: 'Draft and save for review',
    businessQuestion: 'What response should be proposed?',
    presenterNote: 'Ask for a draft, review and edit it, then click Save for review. Saving alone grants no approval.',
    expectedResult: 'AI-assisted review draft saved once with evidence, assumptions, options and proposed action.',
    route: 'findings',
    selection: c.fx('finding'),
    humanAction: 'Review the draft and click Save for review.',
    completesWhen: ['draft-saved'],
    ask: { mode: 'draft', questionId: 'Q28', executeOnEnter: false },
  },
  {
    id: 'J7.5',
    title: 'Create and submit the recommendation',
    businessQuestion: 'Is the recommendation formally on its way to the board?',
    presenterNote: 'Open the draft review, create a recommendation draft, complete required fields and Submit for review. Repeated clicks must be idempotent.',
    expectedResult: 'An actual Recommendation exists and is submitted; a Pending decision is generated with visible links.',
    route: 'recommendations',
    humanAction: 'Create the recommendation draft and Submit for review.',
    completesWhen: ['recommendation-submitted'],
  },
  {
    id: 'J7.6',
    title: 'Review Board queue',
    businessQuestion: 'What awaits the board and why?',
    presenterNote: 'Open the generated queue item and compare response options.',
    expectedResult: 'Recommendation, evidence, options, required reviewers, rationale and conditions form; applicable standards displayed.',
    route: 'reviews',
    selection: c.slot('decision'),
    slotsRequired: ['decision'],
    ask: { mode: 'ask', questionId: 'Q04', executeOnEnter: true },
  },
  {
    id: 'J7.7',
    title: 'Record the decision',
    businessQuestion: 'What does the authority decide, and on what conditions?',
    presenterNote: 'Ask first whether the assistant can approve it (it refuses), then a human records Approved with Conditions with rationale and explicit conditions.',
    expectedResult: 'Decision becomes Approved with Conditions; the recommendation follows an allowed transition; conditions and audit visible.',
    route: 'reviews',
    selection: c.slot('decision'),
    slotsRequired: ['decision'],
    humanAction: 'Record Approved with Conditions with rationale and conditions.',
    completesWhen: ['decision-conditional'],
    ask: { mode: 'ask', questionId: 'Q29', executeOnEnter: true },
  },
  {
    id: 'J7.8',
    title: 'Create the initiative',
    businessQuestion: 'Who delivers the change?',
    presenterNote: 'Create the initiative from the decision with owner, objective/capability, intended outcome, KPI and period. Duplicate creation is blocked.',
    expectedResult: 'Initiative created through the validated domain action; finding → recommendation → decision → initiative links preserved.',
    route: 'initiatives',
    selection: c.slot('initiative'),
    humanAction: 'Create the initiative from the decision.',
    completesWhen: ['initiative-created'],
  },
  {
    id: 'J7.9',
    title: 'Place on the roadmap',
    businessQuestion: 'When and in what sequence?',
    presenterNote: 'Position Now / Next / Later and choose a dependency. Outstanding conditions stay visible; there is no auto-waiver.',
    expectedResult: 'Placement persists; dependency warnings and outstanding conditions visible.',
    route: 'roadmap',
    selection: c.slot('initiative'),
    slotsRequired: ['initiative'],
    ask: { mode: 'ask', questionId: 'Q15', executeOnEnter: true },
  },
  {
    id: 'J7.10a',
    title: 'Linked KPI',
    businessQuestion: 'How will the outcome be measured?',
    presenterNote: 'Open the linked metric. Approving the decision does not improve its current value.',
    expectedResult: 'Baseline/current/target, unit, frequency, measurement owner and source; current value unchanged by approval.',
    route: 'kpis',
    selection: c.fx('kpi1'),
    filters: { kpiId: c.b.refs.kpi1?.id },
    ask: { mode: 'ask', questionId: 'Q31', executeOnEnter: true },
  },
  {
    id: 'J7.10b',
    title: 'Updated briefing and report',
    businessQuestion: 'What changed during this demonstration?',
    presenterNote: 'Generate the updated briefing and open the report.',
    expectedResult: 'New decision and initiative are reflected in the briefing and audit.',
    route: 'executive',
    ask: { mode: 'briefing', questionId: 'Q05', executeOnEnter: true, audience: 'Executive Committee' },
  },
]

const J8: Template = () => [
  {
    id: 'J8.1',
    title: 'Customer profile',
    businessQuestion: 'How does a new organisation get started?',
    presenterNote: 'Enter name/code, sector, country, currency and timezone; the synthetic flag is required. Code must be unique; no seed is overwritten.',
    expectedResult: 'Validated profile with the public-prototype synthetic flag set.',
    route: 'onboarding',
  },
  {
    id: 'J8.2',
    title: 'Starter selection',
    businessQuestion: 'Which sector starter fits?',
    presenterNote: 'Choose a starter and read the clone preview. Nothing is committed yet.',
    expectedResult: 'Record counts and supported journeys for the chosen starter.',
    route: 'onboarding',
  },
  {
    id: 'J8.3',
    title: 'Data sources',
    businessQuestion: 'How is data brought in?',
    presenterNote: 'Sample path, CSV upload or manual entry. Connector catalogue entries are Preview / Not connected.',
    expectedResult: 'Sample path finishes quickly; no fake sync is shown.',
    route: 'onboarding',
    optional: true,
  },
  {
    id: 'J8.4',
    title: 'Upload with an invalid reference',
    businessQuestion: 'Why did this import fail validation?',
    presenterNote: 'Load the provided error sample. Commit stays disabled. Ask Q32 once the staged result is visible.',
    expectedResult: 'Row-level errors, valid/warning counts and a disabled commit.',
    route: 'data-ingestion',
    ask: { mode: 'ask', questionId: 'Q32', executeOnEnter: false },
  },
  {
    id: 'J8.5',
    title: 'Correct and preview changes',
    businessQuestion: 'Is the corrected baseline clean?',
    presenterNote: 'Switch to the clean sample (or fix the reference) and preview the changes.',
    expectedResult: 'Valid new/updated/unchanged records; zero blocking errors.',
    route: 'data-ingestion',
  },
  {
    id: 'J8.6',
    title: 'Commit the import',
    businessQuestion: 'Can the import be committed explicitly?',
    presenterNote: 'A human clicks Commit. Nothing is committed silently.',
    expectedResult: 'Import audit recorded; counts reconcile.',
    route: 'data-ingestion',
    humanAction: 'Click Commit import.',
    completesWhen: ['import-committed'],
  },
  {
    id: 'J8.7',
    title: 'Readiness summary',
    businessQuestion: 'Is this workspace ready, and what should be reviewed first?',
    presenterNote: 'Read counts, reference status and warnings. Q33 needs a committed workspace snapshot.',
    expectedResult: 'Counts, validation status, warnings and available journeys.',
    route: 'data-ingestion',
    ask: { mode: 'ask', questionId: 'Q33', executeOnEnter: false },
  },
  {
    id: 'J8.8',
    title: 'Export and isolation',
    businessQuestion: 'Can the workspace be exported and kept isolated?',
    presenterNote: 'Export JSON from Workspace Settings, then switch to a seed tenant and return.',
    expectedResult: 'Versioned JSON export; workspace state remains isolated per tenant.',
    route: 'workspace-settings',
  },
]

const TEMPLATES: Record<JourneyId, Template> = { J1, J2, J3, J4, J5, J6, J7, J8 }

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */
function toEntity(b: EntityBinding | undefined): { id: string; type: string } | null {
  return b?.kind === 'fixed' ? { id: b.id, type: b.type } : null
}

function buildStep(input: StepInput & { id: string }, b: JourneyScenarioBinding): DemoStep {
  const target = input.target ?? defaultTarget(input.route)
  const selection = input.selection
  const graph = input.graph
  const action: DemoStepAction = {
    view: input.route,
    ...(b.scenarioId && input.route !== 'demo-studio' ? { scenarioId: b.scenarioId } : {}),
    selectEntity: toEntity(selection),
    ...(graph
      ? {
          graphRoot: toEntity(graph.root),
          graphDirection: graph.direction,
          graphDepth: graph.depth,
          impactMode: graph.impactMode,
        }
      : {}),
    ...(input.screenState?.heatmapMode ? { heatmapMode: input.screenState.heatmapMode } : {}),
    ...(input.filters ? { filters: stripUndefined(input.filters) } : {}),
    ...(input.screenState ? { screenState: input.screenState } : {}),
    ...(input.ask ? { ask: input.ask, openAsk: true } : {}),
  }
  if (!selection) delete action.selectEntity
  return {
    id: input.id,
    title: input.title,
    businessQuestion: input.businessQuestion,
    presenterNote: input.presenterNote,
    expectedResult: input.expectedResult,
    route: input.route,
    screenState: input.screenState,
    filters: input.filters ? stripUndefined(input.filters) : undefined,
    selection,
    graph,
    target: { name: target, entity: selection ?? input.targetEntity },
    ask: input.ask,
    humanAction: input.humanAction,
    completesWhen: input.completesWhen,
    optional: input.optional,
    slotsRequired: input.slotsRequired,
    businessRelevance: input.businessQuestion,
    highlightTarget: target,
    action,
  }
}

function stripUndefined<T extends Record<string, unknown>>(o: T): T {
  return Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T
}

function buildJourney(tenantCode: string, journeyId: JourneyId): DemoJourney {
  const code = tenantCode.trim().toUpperCase()
  const prefix = code.toLowerCase()
  const meta = META[journeyId]
  const b =
    getJourneyBinding(code, journeyId) ??
    ({
      tenantCode: code,
      journeyId,
      available: false,
      unavailableReason: 'No scenario binding exists for this workspace.',
      refs: {},
      questionIds: [],
      routes: [],
    } as JourneyScenarioBinding)
  const ctx = makeCtx(b)
  const steps = TEMPLATES[journeyId](ctx).map((s) => buildStep(s, b))
  const legacy = [`${prefix}-${journeyId.toLowerCase()}`]
  if (journeyId === 'J1') legacy.push(`${prefix}-executive`)
  if (journeyId === 'J2') legacy.push(`${prefix}-architecture`)
  if (journeyId === 'J7') legacy.push(`${prefix}-transformation`)
  return {
    id: `${prefix}-${journeyId.toLowerCase()}`,
    journeyId,
    tenantCode: code,
    kind: meta.kind,
    title: meta.title,
    audience: meta.audience,
    durationLabel: meta.durationLabel,
    durationMinutes: meta.durationMinutes,
    description: meta.description,
    businessOutcome: meta.businessOutcome,
    businessQuestion: meta.businessQuestion,
    legacyIds: legacy.filter((id) => id !== `${prefix}-${journeyId.toLowerCase()}`),
    steps,
    bound: b.available,
    boundReason: b.available ? undefined : b.unavailableReason,
  }
}

const cache = new Map<string, DemoJourney[]>()

/** All eight journeys for a tenant code (GRA | BOG | FIDELITY | GENERIC). Unbound journeys are still listed. */
export function getDemoJourneys(tenantCode: string): DemoJourney[] {
  const key = (tenantCode || '').trim().toUpperCase()
  if (!getJourneyBinding(key, 'J1')) return []
  if (!cache.has(key)) cache.set(key, JOURNEY_IDS.map((id) => buildJourney(key, id)))
  return cache.get(key)!
}

/* ------------------------------------------------------------------ */
/* Playlists (reference the same journey definitions)                  */
/* ------------------------------------------------------------------ */
export type PlaylistItem = { journeyId: JourneyId; stepIds?: string[] }
export type DemoPlaylist = {
  id: 'full-product' | 'prospect-15'
  title: string
  durationLabel: string
  description: string
  items: PlaylistItem[]
}

export const DEMO_PLAYLISTS: DemoPlaylist[] = [
  {
    id: 'full-product',
    title: 'Full product walkthrough',
    durationLabel: '~60–70 min',
    description: 'J8 → J1 → J2 → J3 → J4 → J5 → J6 → J7 with transitions. Each journey starts at its own validated baseline.',
    items: [
      { journeyId: 'J8' },
      { journeyId: 'J1' },
      { journeyId: 'J2' },
      { journeyId: 'J3' },
      { journeyId: 'J4' },
      { journeyId: 'J5' },
      { journeyId: 'J6' },
      { journeyId: 'J7' },
    ],
  },
  {
    id: 'prospect-15',
    title: '15-minute prospect walkthrough',
    durationLabel: '~15 min',
    description: 'Selected steps from J1, J3, J6 and J7 for a prospect conversation.',
    items: [
      { journeyId: 'J1', stepIds: ['J1.2', 'J1.3', 'J1.5b', 'J1.7'] },
      { journeyId: 'J3', stepIds: ['J3.2', 'J3.4', 'J3.7', 'J3.8b'] },
      { journeyId: 'J6', stepIds: ['J6.2', 'J6.3', 'J6.6', 'J6.7'] },
      { journeyId: 'J7', stepIds: ['J7.1', 'J7.4', 'J7.10a'] },
    ],
  },
]

/** Build a flattened runnable journey from a playlist, skipping journeys that are not bound for the tenant. */
export function buildPlaylistJourney(tenantCode: string, playlistId: string): DemoJourney | null {
  const playlist = DEMO_PLAYLISTS.find((p) => p.id === playlistId)
  if (!playlist) return null
  const code = tenantCode.trim().toUpperCase()
  const all = getDemoJourneys(code)
  const steps: DemoStep[] = []
  const skipped: string[] = []
  for (const item of playlist.items) {
    const j = all.find((x) => x.journeyId === item.journeyId)
    if (!j || !j.bound) {
      skipped.push(item.journeyId)
      continue
    }
    const chosen = item.stepIds ? j.steps.filter((s) => item.stepIds!.includes(s.id)) : j.steps
    chosen.forEach((s, i) => {
      const subset = Boolean(item.stepIds)
      steps.push({
        ...s,
        // Selected-step playlists are presentation subsets: human gates cannot be satisfied by skipped prerequisites.
        optional: subset ? true : s.optional,
        completesWhen: subset ? undefined : s.completesWhen,
        humanAction: subset ? undefined : s.humanAction,
        id: `${j.journeyId}:${s.id}`,
        segmentJourneyId: j.journeyId as JourneyId,
        segmentStart: i === 0,
      })
    })
  }
  const minutes = playlist.id === 'full-product' ? 65 : 15
  return {
    id: `${code.toLowerCase()}-playlist-${playlist.id}`,
    journeyId: 'playlist',
    tenantCode: code,
    kind: 'playlist',
    title: playlist.title,
    audience: 'Presenter',
    durationLabel: playlist.durationLabel,
    durationMinutes: minutes,
    description:
      playlist.description + (skipped.length ? ` Not bound for this workspace and omitted: ${skipped.join(', ')}.` : ''),
    businessOutcome: 'See each journey outcome in sequence.',
    businessQuestion: playlist.description,
    legacyIds: [],
    steps,
    bound: steps.length > 0,
    boundReason: steps.length ? undefined : 'None of the playlist journeys are bound for this workspace.',
    playlistId: playlist.id,
  }
}

/** Resolve a journey by current id, legacy id (`gra-executive`) or playlist id. */
export function getDemoJourneyById(tenantCode: string, id: string): DemoJourney | null {
  if (!id) return null
  const key = tenantCode.trim().toUpperCase()
  const playlistMatch = /-playlist-(.+)$/.exec(id)
  if (playlistMatch) return buildPlaylistJourney(key, playlistMatch[1])
  const all = getDemoJourneys(key)
  const direct = all.find((j) => j.id === id || j.legacyIds.includes(id))
  if (direct) return direct
  const legacy = resolveLegacyJourneyId(id)
  if (legacy) {
    const first = legacy.journeyIds[0]
    return all.find((j) => j.journeyId === first) ?? null
  }
  return null
}

/** Journeys that a legacy id maps to (architecture → J2 and J3). */
export function legacyJourneyTargets(id: string): JourneyId[] {
  return resolveLegacyJourneyId(id)?.journeyIds ?? []
}

/* ------------------------------------------------------------------ */
/* Runtime resolution + validation                                     */
/* ------------------------------------------------------------------ */
type PackLike = {
  recommendations?: Array<{ id: string; findingIds?: string[] }>
  decisions?: Array<{ id: string; recommendationId?: string; decisionStatus?: string }>
  initiatives?: Array<{ id: string; recommendationIds?: string[] }>
  findings?: Array<{ id: string; workflowStatus?: string }>
  evidence?: Array<{ id: string; verificationStatus?: string }>
}

/**
 * Resolve run-slot selections against the working pack. Returns the step to apply and the first
 * unresolved slot (so the bar can pause with a readable message instead of highlighting something unrelated).
 */
export function resolveStepForRun(
  step: DemoStep,
  pack: PackLike | null | undefined,
  binding: JourneyScenarioBinding | null,
): { step: DemoStep; unresolvedSlot?: string } {
  if (!step.selection || step.selection.kind !== 'run-slot') return { step }
  if (!binding) return { step, unresolvedSlot: step.selection.slot }
  const id = resolveRunSlot(pack, binding, step.selection.slot)
  if (!id) return { step, unresolvedSlot: step.selection.slot }
  return {
    step: {
      ...step,
      action: { ...step.action, selectEntity: { id, type: step.selection.type } },
      target: { ...step.target, entity: { kind: 'fixed', type: step.selection.type, id } },
    },
  }
}

export type PredicateContext = {
  pack: PackLike | null | undefined
  binding: JourneyScenarioBinding | null
  recommendationDrafts?: Array<{ findingId?: string }>
  tenantCode: string
}

export const INGESTION_AUDIT_KEY = (tenantCode: string) => `ea360-ingestion-audit-${tenantCode.toUpperCase()}`

export function evaluatePredicate(name: DemoPredicate, ctx: PredicateContext): boolean {
  const { pack, binding } = ctx
  if (name === 'import-committed') {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(INGESTION_AUDIT_KEY(ctx.tenantCode)) : null
      return Boolean(raw && JSON.parse(raw).length > 0)
    } catch {
      return false
    }
  }
  if (!pack || !binding) return false
  const findingId = binding.refs.finding?.id
  switch (name) {
    case 'evidence-verified': {
      const id = binding.refs.evidenceReview?.id
      return Boolean(id && pack.evidence?.find((e) => e.id === id)?.verificationStatus === 'verified')
    }
    case 'finding-accepted': {
      const wf = pack.findings?.find((f) => f.id === findingId)?.workflowStatus
      return Boolean(wf && ['Accepted', 'Remediation Planned', 'Resolved'].includes(wf))
    }
    case 'draft-saved':
      return Boolean(findingId && (ctx.recommendationDrafts ?? []).some((d) => d.findingId === findingId))
    case 'recommendation-submitted':
      return Boolean(resolveRunSlot(pack, binding, 'decision'))
    case 'decision-conditional': {
      const decId = resolveRunSlot(pack, binding, 'decision')
      return Boolean(decId && pack.decisions?.find((d) => d.id === decId)?.decisionStatus === 'Approved with Conditions')
    }
    case 'initiative-created':
      return Boolean(resolveRunSlot(pack, binding, 'initiative'))
    default:
      return false
  }
}

/** Structural contract validation: registered routes, supported filter keys, known questions and targets. */
export function validateJourneyContract(journey: DemoJourney): string[] {
  const errors: string[] = []
  for (const s of journey.steps) {
    if (!IMPLEMENTED_FEATURE_ROUTES.has(s.route)) errors.push(`${s.id}: route ${s.route} is not registered.`)
    for (const key of Object.keys(s.filters ?? {})) {
      if (!SUPPORTED_FILTER_KEYS.has(key)) errors.push(`${s.id}: filter “${key}” is not supported by any screen contract.`)
    }
    if (s.ask?.questionId && !QUESTION_BY_ID[s.ask.questionId]) errors.push(`${s.id}: question ${s.ask.questionId} is not in the catalogue.`)
    if (!DEMO_TARGET_SELECTORS[s.target.name]) errors.push(`${s.id}: target ${s.target.name} is not registered.`)
    if (s.ask?.executeOnEnter && s.ask.mode === 'draft') errors.push(`${s.id}: drafts must wait for a human action.`)
    if (s.completesWhen?.length && !s.humanAction) errors.push(`${s.id}: a completion predicate requires a declared human action.`)
  }
  return errors
}

export default getDemoJourneys
