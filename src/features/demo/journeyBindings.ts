/**
 * Explicit journey ↔ scenario bindings per workspace (spec §5).
 * No ID-prefix guessing: every record a journey needs is named here and verified by preflight.
 * All referenced data is synthetic / illustrative.
 */
import type { RouteId } from '../../config/routes'

export type JourneyId = 'J1' | 'J2' | 'J3' | 'J4' | 'J5' | 'J6' | 'J7' | 'J8'

export const JOURNEY_IDS: JourneyId[] = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6', 'J7', 'J8']

export type BindingEntityType =
  | 'scenario'
  | 'capability'
  | 'process'
  | 'application'
  | 'integration'
  | 'dataObject'
  | 'technology'
  | 'evidence'
  | 'finding'
  | 'recommendation'
  | 'decision'
  | 'initiative'
  | 'kpi'
  | 'aiSolution'
  | 'aiModel'
  | 'strategicObjective'

/** A record that must already exist in the workspace pack (or be created by a fixture). */
export type FixedRef = {
  type: BindingEntityType
  id: string
  /** Presenter-facing hint only; the pack remains the source of truth for display names. */
  label?: string
  /** true → produced by an explicit "Prepare synthetic example" action (Needs setup, not Unavailable). */
  fixture?: boolean
}

/** Policy / standard / control / exception records held in the governance catalogue or embedded on initiatives. */
export type CatalogRef = {
  kind: 'policy' | 'standard' | 'control' | 'exception'
  id: string
  label?: string
}

/** Entity created during the run (J7); resolved from the pack by relationship, never hardcoded. */
export type RunSlotRef = {
  type: 'recommendation' | 'decision' | 'initiative' | 'kpi'
  slot: string
  label?: string
}

export type FixtureKind = 'j7-practice' | 'j6-permission-evidence'

export type JourneyScenarioBinding = {
  tenantCode: string
  journeyId: JourneyId
  scenarioId?: string
  available: boolean
  unavailableReason?: string
  /** J7 only: practice = fresh fixture; read-only = inspect existing chain. */
  variant?: 'practice' | 'read-only'
  requiresFixture?: FixtureKind
  refs: Record<string, FixedRef>
  slots?: Record<string, RunSlotRef>
  catalog?: Record<string, CatalogRef>
  /** Pairs of ref keys that must be linked in the pack (relationship or cross-reference). */
  links?: Array<[string, string]>
  questionIds: string[]
  routes: RouteId[]
  /** Template records cloned by the fixture builder. */
  fixtureTemplate?: { findingId: string; kpiIds: string[]; scenarioId?: string }
  note?: string
}

const r = (type: BindingEntityType, id: string, label?: string, fixture?: boolean): FixedRef => ({
  type,
  id,
  ...(label ? { label } : {}),
  ...(fixture ? { fixture: true } : {}),
})

const SYNTH = 'Illustrative synthetic data'

function unavailable(
  tenantCode: string,
  journeyId: JourneyId,
  reason: string,
  routes: RouteId[],
  questionIds: string[],
): JourneyScenarioBinding {
  return { tenantCode, journeyId, available: false, unavailableReason: reason, refs: {}, questionIds, routes }
}

/** J7 practice fixture IDs — workspace-specific, opaque to the user, deterministic for restart. */
export function practiceIds(tenantCode: string) {
  const p = `demo-${tenantCode.toLowerCase()}-payment`
  return {
    finding: `${p}-finding`,
    evidenceVerified: `${p}-evidence-verified`,
    evidenceReview: `${p}-evidence-review`,
    kpi1: `${p}-kpi-availability`,
    kpi2: `${p}-kpi-lag`,
  }
}

function j7Practice(
  tenantCode: string,
  templateFindingId: string,
  templateKpiIds: string[],
  scenarioId: string,
): JourneyScenarioBinding {
  const ids = practiceIds(tenantCode)
  return {
    tenantCode,
    journeyId: 'J7',
    scenarioId,
    available: true,
    variant: 'practice',
    requiresFixture: 'j7-practice',
    refs: {
      finding: r('finding', ids.finding, 'Practice payment-resilience finding (synthetic)', true),
      evidenceVerified: r('evidence', ids.evidenceVerified, 'Verified evidence (synthetic)', true),
      evidenceReview: r('evidence', ids.evidenceReview, 'Unverified evidence (synthetic)', true),
      kpi1: r('kpi', ids.kpi1, 'Availability KPI (synthetic)', true),
      kpi2: r('kpi', ids.kpi2, 'Lag KPI (synthetic)', true),
    },
    slots: {
      recommendation: { type: 'recommendation', slot: 'recommendation' },
      decision: { type: 'decision', slot: 'decision' },
      initiative: { type: 'initiative', slot: 'initiative' },
    },
    fixtureTemplate: { findingId: templateFindingId, kpiIds: templateKpiIds, scenarioId },
    questionIds: ['Q03', 'Q13', 'Q28', 'Q04', 'Q14', 'Q29', 'Q15', 'Q31', 'Q05'],
    routes: ['findings', 'evidence', 'recommendations', 'reviews', 'initiatives', 'roadmap', 'kpis', 'reports'],
    note: `${SYNTH}: fresh practice scenario; no recommendation, decision or initiative exists until a human creates them.`,
  }
}

const J8_BINDING = (tenantCode: string): JourneyScenarioBinding => ({
  tenantCode,
  journeyId: 'J8',
  available: true,
  refs: {},
  questionIds: ['Q32', 'Q33'],
  routes: ['onboarding', 'data-ingestion', 'workspace-settings'],
  note: 'Studio / global scope — a new runtime workspace is created by the human, separate from seed workspaces.',
})

const NOT_VALIDATED = (what: string) =>
  `No validated ${what} supplement exists for this sector pack yet; GRA assets are never substituted.`

/* ------------------------------------------------------------------ */
/* GRA — full-product acceptance workspace (spec §5.1)                  */
/* ------------------------------------------------------------------ */
const GRA_BINDINGS: JourneyScenarioBinding[] = [
  {
    tenantCode: 'GRA',
    journeyId: 'J1',
    scenarioId: 'scenario-identity',
    available: true,
    refs: {
      scenario: r('scenario', 'scenario-identity'),
      capability: r('capability', 'cap-gra-02', 'Taxpayer registration'),
      application: r('application', 'app-gra-08'),
      finding: r('finding', 'find-gra-02', 'Duplicate point-to-point identity lookups'),
      evidence: r('evidence', 'ev-gra-02'),
      recommendation: r('recommendation', 'rec-gra-02'),
      decision: r('decision', 'dec-gra-04'),
      initiative: r('initiative', 'init-gra-02', 'API-led integration wave 1'),
      kpi: r('kpi', 'kpi-gra-03'),
    },
    links: [
      ['finding', 'evidence'],
      ['finding', 'recommendation'],
      ['recommendation', 'decision'],
      ['recommendation', 'initiative'],
      ['scenario', 'capability'],
    ],
    questionIds: ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q15'],
    routes: ['executive', 'findings', 'capabilities', 'recommendations', 'decisions', 'initiatives', 'roadmap', 'reports'],
    note: 'rec-gra-02 is Under Review and dec-gra-04 is Pending; init-gra-02 has outstanding governance and is not described as funded.',
  },
  {
    tenantCode: 'GRA',
    journeyId: 'J2',
    scenarioId: 'scenario-identity',
    available: true,
    refs: {
      scenario: r('scenario', 'scenario-identity'),
      capability: r('capability', 'cap-gra-02', 'Taxpayer registration'),
      application: r('application', 'app-gra-08'),
      application2: r('application', 'app-gra-13'),
      finding: r('finding', 'find-gra-02'),
      evidence: r('evidence', 'ev-gra-02'),
      evidence2: r('evidence', 'ev-gra-07'),
      recommendation: r('recommendation', 'rec-gra-02'),
      decision: r('decision', 'dec-gra-04'),
      initiative: r('initiative', 'init-gra-02'),
    },
    links: [
      ['scenario', 'application'],
      ['scenario', 'application2'],
      ['scenario', 'capability'],
      ['finding', 'recommendation'],
      ['recommendation', 'initiative'],
    ],
    questionIds: ['Q06', 'Q07', 'Q08', 'Q09'],
    routes: ['assessment', 'capabilities', 'applications', 'explorer', 'findings', 'evidence', 'recommendations', 'standards', 'roadmap'],
    note: 'Read-only example of an existing rationalisation chain. A TIME classification is not an approved retirement decision.',
  },
  {
    tenantCode: 'GRA',
    journeyId: 'J3',
    scenarioId: 'scenario-payment',
    available: true,
    refs: {
      scenario: r('scenario', 'scenario-payment'),
      integration: r('integration', 'int-gra-05', 'Payment advice interface'),
      integration2: r('integration', 'int-gra-29'),
      application: r('application', 'app-gra-05'),
      application2: r('application', 'app-gra-01'),
      data: r('dataObject', 'data-gra-04'),
      finding: r('finding', 'find-gra-10'),
      evidence: r('evidence', 'ev-gra-10'),
      evidence2: r('evidence', 'ev-gra-11'),
      recommendation: r('recommendation', 'rec-gra-08'),
      decision: r('decision', 'dec-gra-02'),
      initiative: r('initiative', 'init-gra-06'),
      kpi: r('kpi', 'kpi-gra-07'),
      kpi2: r('kpi', 'kpi-gra-08'),
    },
    links: [
      ['scenario', 'integration'],
      ['finding', 'integration'],
      ['finding', 'evidence'],
      ['finding', 'recommendation'],
      ['recommendation', 'decision'],
      ['recommendation', 'initiative'],
      ['initiative', 'kpi'],
    ],
    questionIds: ['Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15'],
    routes: ['integrations', 'explorer', 'findings', 'recommendations', 'standards', 'decisions', 'initiatives', 'roadmap', 'kpis'],
    note: 'Uses the explicit payment-resilience chain (find-gra-10), not scenario-payment\'s find-gra-03. dec-gra-02 is already Approved with Conditions; read-only.',
  },
  {
    tenantCode: 'GRA',
    journeyId: 'J4',
    scenarioId: 'scenario-identity',
    available: true,
    refs: {
      data: r('dataObject', 'data-gra-01', 'Taxpayer Data'),
      data2: r('dataObject', 'data-gra-02'),
      finding: r('finding', 'find-gra-01'),
      recommendation: r('recommendation', 'rec-gra-01'),
      decision: r('decision', 'dec-gra-01'),
      initiative: r('initiative', 'init-gra-01'),
    },
    catalog: {
      policy: { kind: 'policy', id: 'POL-DATA-004' },
      standard: { kind: 'standard', id: 'STD-DATA-001' },
    },
    links: [
      ['finding', 'data'],
      ['finding', 'recommendation'],
      ['recommendation', 'decision'],
      ['recommendation', 'initiative'],
    ],
    questionIds: ['Q16', 'Q17', 'Q18', 'Q19'],
    routes: ['data-information', 'explorer', 'ai-data-governance', 'findings', 'initiatives'],
    note: 'rec-gra-01 is already Converted to Initiative. Readiness is conditional; not a regulatory approval.',
  },
  {
    tenantCode: 'GRA',
    journeyId: 'J5',
    scenarioId: 'scenario-assurance',
    available: true,
    refs: {
      technology: r('technology', 'tech-gra-03', 'Legacy Customs COBOL Stack'),
      application: r('application', 'app-gra-02'),
      application2: r('application', 'app-gra-15'),
      finding: r('finding', 'find-gra-04'),
      initiative: r('initiative', 'init-gra-04'),
    },
    catalog: { exception: { kind: 'exception', id: 'EXC-TECH-001' } },
    links: [
      ['finding', 'technology'],
      ['technology', 'application'],
      ['technology', 'initiative'],
    ],
    questionIds: ['Q20', 'Q21', 'Q22', 'Q23'],
    routes: ['technology-infrastructure', 'explorer', 'standards', 'findings', 'initiatives', 'roadmap'],
    note: 'Support date and lifecycle are illustrative seed metadata, not independently verified vendor dates.',
  },
  {
    tenantCode: 'GRA',
    journeyId: 'J6',
    available: true,
    requiresFixture: 'j6-permission-evidence',
    refs: {
      agent: r('aiSolution', 'ai-gra-02', 'Fraud Investigation Agent'),
      finding: r('finding', 'find-gra-ai-003'),
      integration: r('integration', 'int-gra-27'),
      integration2: r('integration', 'int-gra-29'),
      data: r('dataObject', 'data-gra-01'),
      data2: r('dataObject', 'data-gra-04'),
      data3: r('dataObject', 'data-gra-08'),
      model: r('aiModel', 'aim-gra-01'),
      copilot: r('aiSolution', 'ai-gra-01'),
      modelFinding: r('finding', 'find-gra-ai-011'),
      copilotKpi: r('kpi', 'kpi-gra-ai-01'),
      missingEvidenceFinding: r('finding', 'find-gra-ai-007'),
    },
    catalog: {
      control: { kind: 'control', id: 'CTL-AI-003' },
      policy: { kind: 'policy', id: 'POL-AI-002' },
    },
    links: [
      ['finding', 'agent'],
      ['modelFinding', 'model'],
    ],
    questionIds: ['Q24', 'Q25', 'Q26', 'Q27', 'Q28', 'Q29', 'Q30'],
    routes: ['ai-automation', 'explorer', 'ai-data-governance', 'findings', 'reviews'],
    note: 'Existing evidence on find-gra-ai-003 is a broad integration inventory; a synthetic permission review fixture is prepared explicitly. Recorded WRITE/EXECUTE tools are never invoked.',
  },
  j7Practice('GRA', 'find-gra-10', ['kpi-gra-07', 'kpi-gra-08'], 'scenario-payment'),
  J8_BINDING('GRA'),
]

/* ------------------------------------------------------------------ */
/* BOG / FIDELITY / GENERIC — J1, J2, J3, J7 from existing seeds        */
/* ------------------------------------------------------------------ */
type SeedParts = {
  code: string
  j1: {
    scenarioId: string
    capabilityId: string
    applicationId: string
    findingId: string
    evidenceId: string
    recommendationId: string
    decisionId: string
    initiativeId: string
    kpiId?: string
  }
  j2: {
    scenarioId: string
    capabilityId: string
    applicationId: string
    application2Id: string
    findingId: string
    evidenceId: string
    recommendationId: string
    decisionId: string
    initiativeId: string
  }
  j3: {
    scenarioId: string
    integrationId: string
    applicationId: string
    findingId: string
    evidenceId: string
    recommendationId: string
    decisionId: string
    initiativeId: string
    kpiIds: string[]
  }
  j7: { templateFindingId: string; templateKpiIds: string[]; scenarioId: string }
}

const STD_ROUTES = {
  J1: ['executive', 'findings', 'capabilities', 'recommendations', 'decisions', 'initiatives', 'roadmap', 'reports'] as RouteId[],
  J2: ['assessment', 'capabilities', 'applications', 'explorer', 'findings', 'evidence', 'recommendations', 'standards', 'roadmap'] as RouteId[],
  J3: ['integrations', 'explorer', 'findings', 'recommendations', 'standards', 'decisions', 'initiatives', 'roadmap', 'kpis'] as RouteId[],
}

function seededBindings(p: SeedParts, reasons: Record<'J4' | 'J5' | 'J6', string>): JourneyScenarioBinding[] {
  const { code } = p
  return [
    {
      tenantCode: code,
      journeyId: 'J1',
      scenarioId: p.j1.scenarioId,
      available: true,
      refs: {
        scenario: r('scenario', p.j1.scenarioId),
        capability: r('capability', p.j1.capabilityId),
        application: r('application', p.j1.applicationId),
        finding: r('finding', p.j1.findingId),
        evidence: r('evidence', p.j1.evidenceId),
        recommendation: r('recommendation', p.j1.recommendationId),
        decision: r('decision', p.j1.decisionId),
        initiative: r('initiative', p.j1.initiativeId),
        ...(p.j1.kpiId ? { kpi: r('kpi', p.j1.kpiId) } : {}),
      },
      links: [
        ['finding', 'evidence'],
        ['finding', 'capability'],
        ['finding', 'recommendation'],
        ['recommendation', 'decision'],
        ['recommendation', 'initiative'],
      ],
      questionIds: ['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q15'],
      routes: STD_ROUTES.J1,
    },
    {
      tenantCode: code,
      journeyId: 'J2',
      scenarioId: p.j2.scenarioId,
      available: true,
      refs: {
        scenario: r('scenario', p.j2.scenarioId),
        capability: r('capability', p.j2.capabilityId),
        application: r('application', p.j2.applicationId),
        application2: r('application', p.j2.application2Id),
        finding: r('finding', p.j2.findingId),
        evidence: r('evidence', p.j2.evidenceId),
        recommendation: r('recommendation', p.j2.recommendationId),
        decision: r('decision', p.j2.decisionId),
        initiative: r('initiative', p.j2.initiativeId),
      },
      links: [
        ['scenario', 'application'],
        ['scenario', 'application2'],
        ['recommendation', 'initiative'],
      ],
      questionIds: ['Q06', 'Q07', 'Q08', 'Q09'],
      routes: STD_ROUTES.J2,
      note: 'Read-only example of an existing chain; duplicate coverage is not treated as interchangeable systems.',
    },
    {
      tenantCode: code,
      journeyId: 'J3',
      scenarioId: p.j3.scenarioId,
      available: true,
      refs: {
        scenario: r('scenario', p.j3.scenarioId),
        integration: r('integration', p.j3.integrationId),
        application: r('application', p.j3.applicationId),
        finding: r('finding', p.j3.findingId),
        evidence: r('evidence', p.j3.evidenceId),
        recommendation: r('recommendation', p.j3.recommendationId),
        decision: r('decision', p.j3.decisionId),
        initiative: r('initiative', p.j3.initiativeId),
        kpi: r('kpi', p.j3.kpiIds[0]),
        ...(p.j3.kpiIds[1] ? { kpi2: r('kpi', p.j3.kpiIds[1]) } : {}),
      },
      links: [
        ['scenario', 'integration'],
        ['recommendation', 'decision'],
        ['recommendation', 'initiative'],
      ],
      questionIds: ['Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15'],
      routes: STD_ROUTES.J3,
      note: 'Read-only inspection of the existing resilience change.',
    },
    unavailable(code, 'J4', reasons.J4, ['data-information', 'ai-data-governance'], ['Q16', 'Q17', 'Q18', 'Q19']),
    unavailable(code, 'J5', reasons.J5, ['technology-infrastructure', 'standards'], ['Q20', 'Q21', 'Q22', 'Q23']),
    unavailable(code, 'J6', reasons.J6, ['ai-automation', 'ai-data-governance'], ['Q24', 'Q25', 'Q26', 'Q27', 'Q28', 'Q29', 'Q30']),
    j7Practice(code, p.j7.templateFindingId, p.j7.templateKpiIds, p.j7.scenarioId),
    J8_BINDING(code),
  ]
}

const BOG_BINDINGS = seededBindings(
  {
    code: 'BOG',
    j1: {
      scenarioId: 'scenario-bog-lineage',
      capabilityId: 'cap-bog-33',
      applicationId: 'app-bog-12',
      findingId: 'find-bog-03',
      evidenceId: 'ev-bog-03',
      recommendationId: 'rec-bog-02',
      decisionId: 'dec-bog-04',
      initiativeId: 'init-bog-02',
      kpiId: 'kpi-bog-03',
    },
    j2: {
      scenarioId: 'scenario-bog-payments',
      capabilityId: 'cap-bog-14',
      applicationId: 'app-bog-06',
      application2Id: 'app-bog-07',
      findingId: 'find-bog-04',
      evidenceId: 'ev-bog-06',
      recommendationId: 'rec-bog-03',
      decisionId: 'dec-bog-02',
      initiativeId: 'init-bog-03',
    },
    j3: {
      scenarioId: 'scenario-bog-payments',
      integrationId: 'int-bog-10',
      applicationId: 'app-bog-06',
      findingId: 'find-bog-04',
      evidenceId: 'ev-bog-06',
      recommendationId: 'rec-bog-03',
      decisionId: 'dec-bog-02',
      initiativeId: 'init-bog-03',
      kpiIds: ['kpi-bog-04', 'kpi-bog-05'],
    },
    j7: { templateFindingId: 'find-bog-04', templateKpiIds: ['kpi-bog-04', 'kpi-bog-05'], scenarioId: 'scenario-bog-payments' },
  },
  {
    J4: NOT_VALIDATED('data-trust (J4)'),
    J5: NOT_VALIDATED('technology-lifecycle (J5)'),
    J6: NOT_VALIDATED('governed-AI (J6)') + ' This pack has no AI solutions or models.',
  },
)

const FIDELITY_BINDINGS = seededBindings(
  {
    code: 'FIDELITY',
    j1: {
      scenarioId: 'scenario-fid-customer360',
      capabilityId: 'cap-fid-34',
      applicationId: 'app-fid-06',
      findingId: 'find-fid-03',
      evidenceId: 'ev-fid-03',
      recommendationId: 'rec-fid-02',
      decisionId: 'dec-fid-04',
      initiativeId: 'init-fid-02',
      kpiId: 'kpi-fid-03',
    },
    j2: {
      scenarioId: 'scenario-fid-customer360',
      capabilityId: 'cap-fid-01',
      applicationId: 'app-fid-03',
      application2Id: 'app-fid-04',
      findingId: 'find-fid-01',
      evidenceId: 'ev-fid-01',
      recommendationId: 'rec-fid-01',
      decisionId: 'dec-fid-01',
      initiativeId: 'init-fid-01',
    },
    j3: {
      scenarioId: 'scenario-fid-api',
      integrationId: 'int-fid-10',
      applicationId: 'app-fid-15',
      findingId: 'find-fid-04',
      evidenceId: 'ev-fid-04',
      recommendationId: 'rec-fid-03',
      decisionId: 'dec-fid-02',
      initiativeId: 'init-fid-03',
      kpiIds: ['kpi-fid-04', 'kpi-fid-05'],
    },
    j7: { templateFindingId: 'find-fid-04', templateKpiIds: ['kpi-fid-04', 'kpi-fid-05'], scenarioId: 'scenario-fid-api' },
  },
  {
    J4: NOT_VALIDATED('data-trust (J4)'),
    J5: NOT_VALIDATED('technology-lifecycle (J5)'),
    J6: NOT_VALIDATED('governed-AI (J6)') + ' This pack has no AI solutions or models.',
  },
)

const GENERIC_BINDINGS = seededBindings(
  {
    code: 'GENERIC',
    j1: {
      scenarioId: 'scenario-gen-data',
      capabilityId: 'cap-gen-24',
      applicationId: 'app-gen-14',
      findingId: 'find-gen-07',
      evidenceId: 'ev-gen-07',
      recommendationId: 'rec-gen-04',
      decisionId: 'dec-gen-04',
      initiativeId: 'init-gen-02',
      kpiId: 'kpi-gen-07',
    },
    j2: {
      scenarioId: 'scenario-gen-simplify',
      capabilityId: 'cap-gen-29',
      applicationId: 'app-gen-06',
      application2Id: 'app-gen-02',
      findingId: 'find-gen-04',
      evidenceId: 'ev-gen-04',
      recommendationId: 'rec-gen-03',
      decisionId: 'dec-gen-02',
      initiativeId: 'init-gen-03',
    },
    j3: {
      scenarioId: 'scenario-gen-simplify',
      integrationId: 'int-gen-10',
      applicationId: 'app-gen-06',
      findingId: 'find-gen-04',
      evidenceId: 'ev-gen-04',
      recommendationId: 'rec-gen-03',
      decisionId: 'dec-gen-02',
      initiativeId: 'init-gen-03',
      kpiIds: ['kpi-gen-05', 'kpi-gen-03'],
    },
    j7: { templateFindingId: 'find-gen-04', templateKpiIds: ['kpi-gen-05', 'kpi-gen-03'], scenarioId: 'scenario-gen-simplify' },
  },
  {
    J4: NOT_VALIDATED('data-trust (J4)'),
    J5: NOT_VALIDATED('technology-lifecycle (J5)'),
    J6: NOT_VALIDATED('governed-AI (J6)') + ' This pack has no AI solutions or models.',
  },
)

export const JOURNEY_BINDINGS: Record<string, JourneyScenarioBinding[]> = {
  GRA: GRA_BINDINGS,
  BOG: BOG_BINDINGS,
  FIDELITY: FIDELITY_BINDINGS,
  GENERIC: GENERIC_BINDINGS,
}

export function getJourneyBinding(tenantCode: string, journeyId: JourneyId): JourneyScenarioBinding | null {
  const key = (tenantCode || '').trim().toUpperCase()
  return JOURNEY_BINDINGS[key]?.find((b) => b.journeyId === journeyId) ?? null
}

/** Legacy journey ids (`gra-executive`, `bog-architecture`, …) → current journey ids. */
export const LEGACY_JOURNEY_KIND_MAP: Record<string, JourneyId[]> = {
  executive: ['J1'],
  architecture: ['J2', 'J3'],
  transformation: ['J7'],
}

/** Resolve `gra-executive` → ['J1'], `gra-architecture` → ['J2','J3'], `gra-transformation` → ['J7']. */
export function resolveLegacyJourneyId(id: string): { tenantCode: string; journeyIds: JourneyId[] } | null {
  const m = /^([a-z]+)-(executive|architecture|transformation)$/i.exec((id || '').trim())
  if (!m) return null
  return { tenantCode: m[1].toUpperCase(), journeyIds: LEGACY_JOURNEY_KIND_MAP[m[2].toLowerCase()] }
}

/* ------------------------------------------------------------------ */
/* Run-slot resolution (J7) — derived from the pack, so it is idempotent */
/* ------------------------------------------------------------------ */
type PackLike = {
  recommendations?: Array<{ id: string; findingIds?: string[] }>
  decisions?: Array<{ id: string; recommendationId?: string }>
  initiatives?: Array<{ id: string; recommendationIds?: string[] }>
}

export function resolveRunSlot(
  pack: PackLike | null | undefined,
  binding: JourneyScenarioBinding,
  slot: string,
): string | null {
  if (!pack) return null
  const findingId = binding.refs.finding?.id
  if (!findingId) return null
  const rec = (pack.recommendations ?? []).find((x) => (x.findingIds ?? []).includes(findingId))
  if (slot === 'recommendation') return rec?.id ?? null
  if (!rec) return null
  if (slot === 'decision') return (pack.decisions ?? []).find((d) => d.recommendationId === rec.id)?.id ?? null
  if (slot === 'initiative') {
    return (pack.initiatives ?? []).find((i) => (i.recommendationIds ?? []).includes(rec.id))?.id ?? null
  }
  return null
}
