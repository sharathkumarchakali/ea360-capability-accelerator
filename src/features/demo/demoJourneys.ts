/**
 * Phase 6 guided-demo journeys — one executive (~5 min), architecture (~10 min),
 * and transformation (~10 min) path per tenant. Steps reference real scenario entity IDs.
 */

export type DemoJourneyKind = 'executive' | 'architecture' | 'transformation'

export type DemoStepAction = {
  view: string
  scenarioId?: string
  selectEntity?: { id: string; type: string } | null
  graphRoot?: { id: string; type: string } | null
  heatmapMode?: string
  openAsk?: boolean
  openBriefing?: boolean
  filters?: Record<string, unknown>
}

export type DemoStep = {
  id: string
  title: string
  businessRelevance: string
  highlightSelector?: string
  action: DemoStepAction
}

export type DemoJourney = {
  id: string
  kind: DemoJourneyKind
  title: string
  durationLabel: string
  description: string
  steps: DemoStep[]
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
    description: 'Ten-minute trace from capability risk through integrations, evidence and roadmap.',
    journeyKind: 'architecture',
  },
  {
    id: 'explore',
    label: 'Explore EA360',
    description: 'Enter the selected tenant without a guided tour.',
    journeyKind: null,
  },
]

type JourneySeed = {
  code: string
  exec: {
    scenarioId: string
    findingId: string
    capabilityId: string
    applicationId: string
    recommendationId: string
    initiativeId: string
    pendingDecisionId: string
    findingTitle: string
    capabilityTitle: string
    initiativeTitle: string
    storyNoun: string
  }
  arch: {
    scenarioId: string
    findingId: string
    capabilityId: string
    applicationId: string
    integrationId: string
    evidenceId: string
    recommendationId: string
    decisionId: string
    initiativeId: string
    capabilityTitle: string
    findingTitle: string
  }
  xform: {
    scenarioId: string
    findingId: string
    recommendationId: string
    decisionId: string
    initiativeId: string
    findingTitle: string
    recommendationTitle: string
    initiativeTitle: string
  }
}

function executiveJourney(seed: JourneySeed): DemoJourney {
  const { exec } = seed
  const prefix = seed.code.toLowerCase()
  return {
    id: `${prefix}-executive`,
    kind: 'executive',
    title: 'Executive health & decisions',
    durationLabel: '~5 min',
    description: `Review ${seed.code} enterprise health, open the top ${exec.storyNoun} risk, and close on the decision and briefing.`,
    steps: [
      {
        id: `${prefix}-exec-1`,
        title: 'Enterprise health',
        businessRelevance: `Open the executive cockpit to establish overall ${seed.code} posture before diving into a single risk.`,
        highlightSelector: '.maturity-card',
        action: {
          view: 'executive',
          scenarioId: exec.scenarioId,
        },
      },
      {
        id: `${prefix}-exec-2`,
        title: 'Top risk finding',
        businessRelevance: `Surface "${exec.findingTitle}" as the priority exposure for this demo scenario.`,
        highlightSelector: '.findings-register',
        action: {
          view: 'findings',
          scenarioId: exec.scenarioId,
          selectEntity: { id: exec.findingId, type: 'finding' },
          filters: { findingId: exec.findingId },
        },
      },
      {
        id: `${prefix}-exec-3`,
        title: 'Affected capability',
        businessRelevance: `Show how the finding lands on "${exec.capabilityTitle}" and related applications.`,
        highlightSelector: '.heat-cell',
        action: {
          view: 'capabilities',
          scenarioId: exec.scenarioId,
          selectEntity: { id: exec.capabilityId, type: 'capability' },
          heatmapMode: 'risk',
          filters: { capabilityId: exec.capabilityId },
        },
      },
      {
        id: `${prefix}-exec-4`,
        title: 'Recommended response',
        businessRelevance: 'Move from diagnosis to the governed recommendation that addresses the finding.',
        highlightSelector: '.rec-card',
        action: {
          view: 'recommendations',
          scenarioId: exec.scenarioId,
          selectEntity: { id: exec.recommendationId, type: 'recommendation' },
          filters: { recommendationId: exec.recommendationId },
        },
      },
      {
        id: `${prefix}-exec-5`,
        title: 'Roadmap initiative',
        businessRelevance: `Confirm "${exec.initiativeTitle}" is the funded vehicle that implements the recommendation.`,
        highlightSelector: '.roadmap-board',
        action: {
          view: 'roadmap',
          scenarioId: exec.scenarioId,
          selectEntity: { id: exec.initiativeId, type: 'initiative' },
          filters: { initiativeId: exec.initiativeId },
        },
      },
      {
        id: `${prefix}-exec-6`,
        title: 'Ask EA360 & briefing',
        businessRelevance: 'Demonstrate grounded executive Q&A and generate the briefing from live tenant context.',
        highlightSelector: '.maturity-card',
        action: {
          view: 'executive',
          scenarioId: exec.scenarioId,
          openAsk: true,
          openBriefing: true,
        },
      },
      {
        id: `${prefix}-exec-7`,
        title: 'Decision required',
        businessRelevance: 'Close on the Architecture / Portfolio Review Board item still awaiting a decision.',
        highlightSelector: '.decision-card',
        action: {
          view: 'governance',
          scenarioId: exec.scenarioId,
          selectEntity: { id: exec.pendingDecisionId, type: 'decision' },
          filters: { decisionId: exec.pendingDecisionId, decisionStatus: 'Pending' },
        },
      },
    ],
  }
}

function architectureJourney(seed: JourneySeed): DemoJourney {
  const { arch } = seed
  const prefix = seed.code.toLowerCase()
  return {
    id: `${prefix}-architecture`,
    kind: 'architecture',
    title: 'Architecture risk trace',
    durationLabel: '~10 min',
    description: `Trace a high-risk ${seed.code} capability through applications, integrations, evidence and governance.`,
    steps: [
      {
        id: `${prefix}-arch-1`,
        title: 'Capability heatmap',
        businessRelevance: 'Orient on enterprise capability risk before selecting a hot cell.',
        highlightSelector: '.heat-cell',
        action: {
          view: 'capabilities',
          scenarioId: arch.scenarioId,
          heatmapMode: 'risk',
        },
      },
      {
        id: `${prefix}-arch-2`,
        title: 'High-risk capability',
        businessRelevance: `Select "${arch.capabilityTitle}" as the focal high-risk capability.`,
        highlightSelector: '.heat-cell',
        action: {
          view: 'capabilities',
          scenarioId: arch.scenarioId,
          selectEntity: { id: arch.capabilityId, type: 'capability' },
          heatmapMode: 'risk',
          filters: { capabilityId: arch.capabilityId },
        },
      },
      {
        id: `${prefix}-arch-3`,
        title: 'Supporting applications',
        businessRelevance: 'Inspect the application cluster that realises the capability.',
        highlightSelector: '.portfolio-table',
        action: {
          view: 'applications',
          scenarioId: arch.scenarioId,
          selectEntity: { id: arch.applicationId, type: 'application' },
          filters: { capabilityId: arch.capabilityId, applicationId: arch.applicationId },
        },
      },
      {
        id: `${prefix}-arch-4`,
        title: 'Critical integrations',
        businessRelevance: 'Expose brittle or unmonitored interfaces on the critical path.',
        highlightSelector: '.topology-card',
        action: {
          view: 'integrations',
          scenarioId: arch.scenarioId,
          selectEntity: { id: arch.integrationId, type: 'integration' },
          filters: { integrationId: arch.integrationId, pointToPoint: 'true' },
        },
      },
      {
        id: `${prefix}-arch-5`,
        title: 'Relationship explorer',
        businessRelevance: 'Walk the graph from the scenario root so dependencies are visible end to end.',
        highlightSelector: '.explorer-canvas',
        action: {
          view: 'explorer',
          scenarioId: arch.scenarioId,
          graphRoot: { id: arch.applicationId, type: 'application' },
          selectEntity: { id: arch.applicationId, type: 'application' },
        },
      },
      {
        id: `${prefix}-arch-6`,
        title: 'Finding and evidence',
        businessRelevance: `Open "${arch.findingTitle}" with its supporting evidence pack.`,
        highlightSelector: '.evidence-card',
        action: {
          view: 'findings',
          scenarioId: arch.scenarioId,
          selectEntity: { id: arch.findingId, type: 'finding' },
          filters: { findingId: arch.findingId, evidenceId: arch.evidenceId },
        },
      },
      {
        id: `${prefix}-arch-7`,
        title: 'Recommendation & decision',
        businessRelevance: 'Validate the recommendation and the governance decision that gates delivery.',
        highlightSelector: '.decision-card',
        action: {
          view: 'governance',
          scenarioId: arch.scenarioId,
          selectEntity: { id: arch.decisionId, type: 'decision' },
          filters: {
            recommendationId: arch.recommendationId,
            decisionId: arch.decisionId,
          },
        },
      },
      {
        id: `${prefix}-arch-8`,
        title: 'Roadmap placement',
        businessRelevance: 'Confirm the initiative that implements the architecture response is on the roadmap.',
        highlightSelector: '.roadmap-board',
        action: {
          view: 'roadmap',
          scenarioId: arch.scenarioId,
          selectEntity: { id: arch.initiativeId, type: 'initiative' },
          filters: { initiativeId: arch.initiativeId },
        },
      },
    ],
  }
}

function transformationJourney(seed: JourneySeed): DemoJourney {
  const { xform } = seed
  const prefix = seed.code.toLowerCase()
  return {
    id: `${prefix}-transformation`,
    kind: 'transformation',
    title: 'Transformation value path',
    durationLabel: '~10 min',
    description: `Walk ${seed.code} from finding through recommendation, decision and initiative value on the roadmap.`,
    steps: [
      {
        id: `${prefix}-xform-1`,
        title: 'Open the finding',
        businessRelevance: `Start from "${xform.findingTitle}" as the transformation trigger.`,
        highlightSelector: '.findings-register',
        action: {
          view: 'findings',
          scenarioId: xform.scenarioId,
          selectEntity: { id: xform.findingId, type: 'finding' },
          filters: { findingId: xform.findingId },
        },
      },
      {
        id: `${prefix}-xform-2`,
        title: 'Approved recommendation',
        businessRelevance: `Review "${xform.recommendationTitle}" as the preferred response option.`,
        highlightSelector: '.rec-card',
        action: {
          view: 'recommendations',
          scenarioId: xform.scenarioId,
          selectEntity: { id: xform.recommendationId, type: 'recommendation' },
          filters: { recommendationId: xform.recommendationId },
        },
      },
      {
        id: `${prefix}-xform-3`,
        title: 'Governance decision',
        businessRelevance: 'Show the board decision that authorises (or conditions) delivery.',
        highlightSelector: '.decision-card',
        action: {
          view: 'governance',
          scenarioId: xform.scenarioId,
          selectEntity: { id: xform.decisionId, type: 'decision' },
          filters: { decisionId: xform.decisionId },
        },
      },
      {
        id: `${prefix}-xform-4`,
        title: 'Create / review initiative',
        businessRelevance: `Open "${xform.initiativeTitle}" as the pre-populated delivery vehicle.`,
        highlightSelector: '.roadmap-board',
        action: {
          view: 'roadmap',
          scenarioId: xform.scenarioId,
          selectEntity: { id: xform.initiativeId, type: 'initiative' },
          filters: { initiativeId: xform.initiativeId, mode: 'review' },
        },
      },
      {
        id: `${prefix}-xform-5`,
        title: 'Roadmap positioning',
        businessRelevance: 'Place the initiative in the active wave relative to dependencies and capacity.',
        highlightSelector: '.roadmap-board',
        action: {
          view: 'roadmap',
          scenarioId: xform.scenarioId,
          selectEntity: { id: xform.initiativeId, type: 'initiative' },
          filters: { initiativeId: xform.initiativeId, mode: 'position' },
        },
      },
      {
        id: `${prefix}-xform-6`,
        title: 'Value and risk reduction',
        businessRelevance: 'Close on expected value, KPI linkage and residual risk after the initiative lands.',
        highlightSelector: '.cockpit-metrics',
        action: {
          view: 'roadmap',
          scenarioId: xform.scenarioId,
          selectEntity: { id: xform.initiativeId, type: 'initiative' },
          filters: { initiativeId: xform.initiativeId, mode: 'value-risk' },
        },
      },
    ],
  }
}

function journeysFor(seed: JourneySeed): DemoJourney[] {
  return [executiveJourney(seed), architectureJourney(seed), transformationJourney(seed)]
}

/** GRA — identity (exec/arch), assurance automation (xform). */
const GRA_SEED: JourneySeed = {
  code: 'GRA',
  exec: {
    scenarioId: 'scenario-identity',
    findingId: 'find-gra-02',
    capabilityId: 'cap-gra-02',
    applicationId: 'app-gra-08',
    recommendationId: 'rec-gra-02',
    initiativeId: 'init-gra-02',
    pendingDecisionId: 'dec-gra-04',
    findingTitle: 'Duplicate point-to-point identity lookups',
    capabilityTitle: 'Taxpayer Registration',
    initiativeTitle: 'API-led integration wave 1',
    storyNoun: 'taxpayer-identity',
  },
  arch: {
    scenarioId: 'scenario-identity',
    findingId: 'find-gra-02',
    capabilityId: 'cap-gra-02',
    applicationId: 'app-gra-08',
    integrationId: 'int-gra-01',
    evidenceId: 'ev-gra-02',
    recommendationId: 'rec-gra-02',
    decisionId: 'dec-gra-04',
    initiativeId: 'init-gra-02',
    capabilityTitle: 'Taxpayer Registration',
    findingTitle: 'Duplicate point-to-point identity lookups',
  },
  xform: {
    scenarioId: 'scenario-assurance',
    findingId: 'find-gra-03',
    recommendationId: 'rec-gra-03',
    decisionId: 'dec-gra-03',
    initiativeId: 'init-gra-03',
    findingTitle: 'Manual revenue-assurance reconciliation',
    recommendationTitle: 'Automate revenue-assurance matching',
    initiativeTitle: 'Revenue assurance automation',
  },
}

/** BoG — payments (exec/arch), governance operationalisation (xform). */
const BOG_SEED: JourneySeed = {
  code: 'BOG',
  exec: {
    scenarioId: 'scenario-bog-payments',
    findingId: 'find-bog-04',
    capabilityId: 'cap-bog-14',
    applicationId: 'app-bog-06',
    recommendationId: 'rec-bog-03',
    initiativeId: 'init-bog-03',
    pendingDecisionId: 'dec-bog-04',
    findingTitle: 'Critical payment-system visibility gap',
    capabilityTitle: 'RTGS Settlement',
    initiativeTitle: 'Payment-system resilience hardening',
    storyNoun: 'payment-system',
  },
  arch: {
    scenarioId: 'scenario-bog-payments',
    findingId: 'find-bog-04',
    capabilityId: 'cap-bog-14',
    applicationId: 'app-bog-06',
    integrationId: 'int-bog-10',
    evidenceId: 'ev-bog-06',
    recommendationId: 'rec-bog-03',
    decisionId: 'dec-bog-02',
    initiativeId: 'init-bog-03',
    capabilityTitle: 'RTGS Settlement',
    findingTitle: 'Critical payment-system visibility gap',
  },
  xform: {
    scenarioId: 'scenario-bog-governance',
    findingId: 'find-bog-07',
    recommendationId: 'rec-bog-05',
    decisionId: 'dec-bog-03',
    initiativeId: 'init-bog-05',
    findingTitle: 'Architecture reviews occur too late in delivery',
    recommendationTitle: 'Mandate early Architecture Review Board gates',
    initiativeTitle: 'Architecture governance operationalisation',
  },
}

/** Fidelity — Customer 360 (exec), API-led channels (arch), lending (xform). */
const FIDELITY_SEED: JourneySeed = {
  code: 'FIDELITY',
  exec: {
    scenarioId: 'scenario-fid-customer360',
    findingId: 'find-fid-01',
    capabilityId: 'cap-fid-01',
    applicationId: 'app-fid-03',
    recommendationId: 'rec-fid-01',
    initiativeId: 'init-fid-01',
    pendingDecisionId: 'dec-fid-04',
    findingTitle: 'Duplicate customer golden record',
    capabilityTitle: 'Customer & Party Management',
    initiativeTitle: 'Customer 360 golden record programme',
    storyNoun: 'customer-360',
  },
  arch: {
    scenarioId: 'scenario-fid-api',
    findingId: 'find-fid-04',
    capabilityId: 'cap-fid-14',
    applicationId: 'app-fid-15',
    integrationId: 'int-fid-10',
    evidenceId: 'ev-fid-04',
    recommendationId: 'rec-fid-03',
    decisionId: 'dec-fid-02',
    initiativeId: 'init-fid-03',
    capabilityTitle: 'Mobile Banking',
    findingTitle: 'Critical mobile channel P2P dependency',
  },
  xform: {
    scenarioId: 'scenario-fid-lending',
    findingId: 'find-fid-07',
    recommendationId: 'rec-fid-05',
    decisionId: 'dec-fid-03',
    initiativeId: 'init-fid-05',
    findingTitle: 'Manual lending handoffs extend turnaround',
    recommendationTitle: 'Deploy unified lending workflow',
    initiativeTitle: 'Unified lending workflow programme',
  },
}

/** Generic — CX lineage (exec), portfolio simplify (arch), data platform (xform). */
const GENERIC_SEED: JourneySeed = {
  code: 'GENERIC',
  exec: {
    scenarioId: 'scenario-gen-cx',
    findingId: 'find-gen-01',
    capabilityId: 'cap-gen-01',
    applicationId: 'app-gen-02',
    recommendationId: 'rec-gen-01',
    initiativeId: 'init-gen-01',
    pendingDecisionId: 'dec-gen-04',
    findingTitle: 'Incomplete customer data lineage',
    capabilityTitle: 'Customer Experience',
    initiativeTitle: 'Enterprise data lineage programme',
    storyNoun: 'customer-experience',
  },
  arch: {
    scenarioId: 'scenario-gen-simplify',
    findingId: 'find-gen-04',
    capabilityId: 'cap-gen-29',
    applicationId: 'app-gen-06',
    integrationId: 'int-gen-10',
    evidenceId: 'ev-gen-04',
    recommendationId: 'rec-gen-03',
    decisionId: 'dec-gen-02',
    initiativeId: 'init-gen-03',
    capabilityTitle: 'Service Management',
    findingTitle: 'Overlapping CRM and service-desk platforms',
  },
  xform: {
    scenarioId: 'scenario-gen-data',
    findingId: 'find-gen-07',
    recommendationId: 'rec-gen-04',
    decisionId: 'dec-gen-04',
    initiativeId: 'init-gen-02',
    findingTitle: 'Ungoverned lake bypass loads',
    recommendationTitle: 'Rationalise overlapping analytics platforms',
    initiativeTitle: 'Analytics platform rationalisation',
  },
}

const JOURNEYS_BY_TENANT: Record<string, DemoJourney[]> = {
  GRA: journeysFor(GRA_SEED),
  BOG: journeysFor(BOG_SEED),
  FIDELITY: journeysFor(FIDELITY_SEED),
  GENERIC: journeysFor(GENERIC_SEED),
}

/** Return the three guided journeys for a tenant code (GRA | BOG | FIDELITY | GENERIC). */
export function getDemoJourneys(tenantCode: string): DemoJourney[] {
  const key = tenantCode.trim().toUpperCase()
  return JOURNEYS_BY_TENANT[key] ?? []
}

export default getDemoJourneys
