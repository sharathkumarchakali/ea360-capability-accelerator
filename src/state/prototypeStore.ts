import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  clearTenantCache,
  createTenantRepository,
  getTenantConfig,
  listAvailableTenants,
  loadTenantPack,
  type TenantCode,
  type TenantRepository,
} from '../data/repositories/tenantRepository'
import type { TenantPack } from '../domain/schemas'
import type { TenantConfig } from '../domain/tenants/config'
import type { EntityType, TimeClass } from '../domain/entities/types'
import type { AuditAction, InitiativeDraft } from '../domain/workflow'
import type { EA360AIResponse, AIReviewStatus, AIFeedback } from '../lib/ai/types'
import { configureEA360AI } from '../lib/ai'
import {
  assertDecisionTransition,
  assertFindingTransition,
  assertRecommendationTransition,
  canCreateInitiativeFromDecision,
  canCreateInitiativeFromRecommendation,
  coerceDecisionStatus,
  coerceFindingWorkflowStatus,
  coerceRecommendationWorkflowStatus,
  findingStatusToEntityStatus,
  mapRecommendationToInitiativeDraft,
  placeOnRoadmap,
  recommendationStatusToEntityStatus,
  validateInitiativeDraft,
} from '../domain/workflow'

export type DemoRole =
  | 'executive'
  | 'cio'
  | 'enterprise-architect'
  | 'transformation-leader'
  | 'risk-leader'
  | (string & {})

export type SelectedEntity = {
  id: string
  type: EntityType
} | null

export type PrototypeMutation = {
  id: string
  at: string
  description: string
}

export type HeatmapMode = 'maturity' | 'risk' | 'importance' | 'support' | 'investment'

export type PortfolioFilters = {
  search: string
  capabilityId: string
  criticality: string
  lifecycle: string
  timeClass: '' | TimeClass
  domain: string
}

export type CapabilityFilters = {
  search: string
  domain: string
  collapsedDomains: string[]
}

export type IntegrationFilters = {
  search: string
  integrationType: string
  criticality: string
  lifecycleStatus: string
  pointToPoint: '' | 'true' | 'false'
  reusabilityStatus: string
  monitoringStatus: string
  missingOwner: '' | 'true'
}

export type GraphRoot = { id: string; type: EntityType } | null
export type GraphDirection = 'both' | 'upstream' | 'downstream'

type ActionResult = { ok: boolean; error?: string; id?: string; errors?: string[] }

export type BriefingPreferences = {
  role: string
  period: string
  domain: string
  objectiveId: string
  emphasis: string
}

export type SavedRecommendationDraft = {
  id: string
  findingId: string
  responseId: string
  summary: string
  explanation: string
  evidenceIds: string[]
  createdAt: string
  reviewStatus: AIReviewStatus
  humanEdited?: boolean
}

const MAX_AI_HISTORY = 12
const initialBriefingPrefs: BriefingPreferences = {
  role: 'Executive Committee',
  period: 'FY2026 Q2',
  domain: '',
  objectiveId: '',
  emphasis: 'balanced',
}

/** Per-tenant UI + session slice (never shared across tenants). */
export type TenantUiSlice = {
  role: string
  filters: { period: string; businessUnit: string }
  selectedEntity: SelectedEntity
  mutations: PrototypeMutation[]
  heatmapMode: HeatmapMode
  capabilityFilters: CapabilityFilters
  portfolioFilters: PortfolioFilters
  integrationFilters: IntegrationFilters
  scenarioId: string
  graphRoot: GraphRoot
  relationshipDepth: number
  graphDirection: GraphDirection
  entityTypeFilters: EntityType[]
  impactMode: boolean
  compareCapabilityIds: string[]
  navContext: { fromView: string; entityId?: string } | null
  aiHistory: EA360AIResponse[]
  aiFeedback: AIFeedback[]
  recommendationDrafts: SavedRecommendationDraft[]
  briefingPreferences: BriefingPreferences
  lastAiResponseId: string | null
}

type PrototypeState = {
  tenantCode: TenantCode
  role: string
  filters: {
    period: string
    businessUnit: string
  }
  selectedEntity: SelectedEntity
  mutations: PrototypeMutation[]
  workingPack: TenantPack | null
  workingPacks: Partial<Record<TenantCode, TenantPack>>
  tenantSlices: Partial<Record<TenantCode, TenantUiSlice>>
  view: string
  heatmapMode: HeatmapMode
  capabilityFilters: CapabilityFilters
  portfolioFilters: PortfolioFilters
  integrationFilters: IntegrationFilters
  scenarioId: string
  graphRoot: GraphRoot
  relationshipDepth: number
  graphDirection: GraphDirection
  entityTypeFilters: EntityType[]
  impactMode: boolean
  compareCapabilityIds: string[]
  navContext: { fromView: string; entityId?: string } | null
  askOpen: boolean
  aiHistory: EA360AIResponse[]
  aiFeedback: AIFeedback[]
  recommendationDrafts: SavedRecommendationDraft[]
  briefingPreferences: BriefingPreferences
  lastAiResponseId: string | null
  landingComplete: boolean
  presentationMode: boolean
  guidedTour: { active: boolean; journeyId: string; stepIndex: number } | null
  toast: { message: string; show: boolean }
  setAskOpen: (open: boolean) => void
  recordAiResponse: (response: EA360AIResponse) => void
  reviewAiResponse: (responseId: string, status: AIReviewStatus, comment?: string) => void
  saveRecommendationDraft: (draft: Omit<SavedRecommendationDraft, 'id' | 'createdAt'>) => ActionResult
  setBriefingPreferences: (prefs: Partial<BriefingPreferences>) => void
  setView: (view: string) => void
  setRole: (role: string) => void
  setFilters: (filters: Partial<PrototypeState['filters']>) => void
  setHeatmapMode: (mode: HeatmapMode) => void
  setCapabilityFilters: (filters: Partial<CapabilityFilters>) => void
  setPortfolioFilters: (filters: Partial<PortfolioFilters>) => void
  setIntegrationFilters: (filters: Partial<IntegrationFilters>) => void
  setScenarioId: (id: string) => void
  setGraphRoot: (root: GraphRoot) => void
  setRelationshipDepth: (depth: number) => void
  setGraphDirection: (direction: GraphDirection) => void
  setEntityTypeFilters: (types: EntityType[]) => void
  toggleEntityTypeFilter: (type: EntityType) => void
  setImpactMode: (on: boolean) => void
  toggleCompareCapability: (id: string) => void
  clearCompare: () => void
  setNavContext: (ctx: PrototypeState['navContext']) => void
  selectEntity: (entity: SelectedEntity) => void
  clearSelection: () => void
  addMutation: (description: string) => void
  switchTenant: (code: TenantCode) => void
  setTenant: (code: TenantCode) => void
  resetDemo: () => void
  resetAllTenants: () => void
  dismissLanding: () => void
  showLanding: () => void
  setPresentationMode: (on: boolean) => void
  startGuidedTour: (journeyId: string) => void
  setGuidedStep: (stepIndex: number) => void
  exitGuidedTour: () => void
  restartGuidedTour: () => void
  showToast: (message: string) => void
  clearToast: () => void
  getRepo: () => TenantRepository
  ensurePack: () => TenantPack
  updatePack: (fn: (pack: TenantPack) => void, audit?: Omit<AuditFields, 'id' | 'timestamp' | 'tenantId' | 'actorRole'> & { actorRole?: string }) => void
  listAuditHistory: () => TenantPack['auditHistory']
  listDecisions: () => TenantPack['decisions']
  getArbQueue: () => TenantPack['decisions']
  // Finding actions
  submitForReview: (payload: { id: string }) => ActionResult
  validateFinding: (payload: { id: string; comment?: string }) => ActionResult
  rejectFinding: (payload: { id: string; comment?: string }) => ActionResult
  assignOwner: (payload: { id: string; ownerId: string }) => ActionResult
  changeTargetDate: (payload: { id: string; targetDate: string }) => ActionResult
  createRecommendationFromFinding: (payload: { id: string }) => ActionResult
  markRemediationPlanned: (payload: { id: string }) => ActionResult
  resolveFinding: (payload: { id: string }) => ActionResult
  // Evidence
  markVerified: (payload: { id: string }) => ActionResult
  markDisputed: (payload: { id: string; comment?: string }) => ActionResult
  addNote: (payload: { id: string; note: string }) => ActionResult
  // Recommendations
  submit: (payload: { id: string }) => ActionResult
  approve: (payload: { id: string }) => ActionResult
  reject: (payload: { id: string; comment?: string }) => ActionResult
  requestRevision: (payload: { id: string; comment?: string }) => ActionResult
  addComment: (payload: { id: string; text: string }) => ActionResult
  sendToARB: (payload: { id: string }) => ActionResult
  setPreferredOption: (payload: { id: string; option: string }) => ActionResult
  // Decisions
  approveDecision: (payload: { id: string; rationale?: string }) => ActionResult
  approveDecisionWithConditions: (payload: { id: string; conditions: string; rationale?: string }) => ActionResult
  rejectDecision: (payload: { id: string; rationale?: string }) => ActionResult
  deferDecision: (payload: { id: string; rationale?: string }) => ActionResult
  // Initiatives / roadmap
  createInitiative: (payload: InitiativeDraft | { decisionId: string; draft?: Partial<InitiativeDraft> }) => ActionResult
  moveInitiativeHorizon: (payload: { id: string; horizon: 'now' | 'next' | 'later' }) => ActionResult
  changeInitiativeQuarter: (payload: { id: string; targetQuarter: string }) => ActionResult
}

type AuditFields = {
  id: string
  tenantId: string
  action: AuditAction | string
  actorRole: string
  timestamp: string
  entityId: string
  entityType: string
  previousState?: string
  newState?: string
  comment?: string
}

const initialFilters = { period: 'FY2026 Q2', businessUnit: 'Enterprise' }

const initialCapabilityFilters: CapabilityFilters = {
  search: '',
  domain: '',
  collapsedDomains: [],
}

const initialPortfolioFilters: PortfolioFilters = {
  search: '',
  capabilityId: '',
  criticality: '',
  lifecycle: '',
  timeClass: '',
  domain: '',
}

const initialIntegrationFilters: IntegrationFilters = {
  search: '',
  integrationType: '',
  criticality: '',
  lifecycleStatus: '',
  pointToPoint: '',
  reusabilityStatus: '',
  monitoringStatus: '',
  missingOwner: '',
}

const DEFAULT_SCENARIO_ID = 'scenario-identity'
const DEFAULT_ENTITY_TYPE_FILTERS: EntityType[] = []

function captureTenantSlice(state: {
  role: string
  filters: TenantUiSlice['filters']
  selectedEntity: SelectedEntity
  mutations: PrototypeMutation[]
  heatmapMode: HeatmapMode
  capabilityFilters: CapabilityFilters
  portfolioFilters: PortfolioFilters
  integrationFilters: IntegrationFilters
  scenarioId: string
  graphRoot: GraphRoot
  relationshipDepth: number
  graphDirection: GraphDirection
  entityTypeFilters: EntityType[]
  impactMode: boolean
  compareCapabilityIds: string[]
  navContext: TenantUiSlice['navContext']
  aiHistory: EA360AIResponse[]
  aiFeedback: AIFeedback[]
  recommendationDrafts: SavedRecommendationDraft[]
  briefingPreferences: BriefingPreferences
  lastAiResponseId: string | null
}): TenantUiSlice {
  return {
    role: state.role,
    filters: { ...state.filters },
    selectedEntity: state.selectedEntity,
    mutations: [...state.mutations],
    heatmapMode: state.heatmapMode,
    capabilityFilters: {
      ...state.capabilityFilters,
      collapsedDomains: [...state.capabilityFilters.collapsedDomains],
    },
    portfolioFilters: { ...state.portfolioFilters },
    integrationFilters: { ...state.integrationFilters },
    scenarioId: state.scenarioId,
    graphRoot: state.graphRoot,
    relationshipDepth: state.relationshipDepth,
    graphDirection: state.graphDirection,
    entityTypeFilters: [...state.entityTypeFilters],
    impactMode: state.impactMode,
    compareCapabilityIds: [...state.compareCapabilityIds],
    navContext: state.navContext,
    aiHistory: [...state.aiHistory],
    aiFeedback: [...state.aiFeedback],
    recommendationDrafts: [...state.recommendationDrafts],
    briefingPreferences: { ...state.briefingPreferences },
    lastAiResponseId: state.lastAiResponseId,
  }
}

function defaultTenantSlice(config: TenantConfig): TenantUiSlice {
  const primaryRole = config.roleLabels[0]?.id || config.primaryExecutiveRole || 'executive'
  const primaryLabel =
    config.roleLabels.find((r) => r.id === primaryRole)?.label ||
    config.roleLabels[0]?.label ||
    'Executive Committee'
  return {
    role: primaryRole,
    filters: { period: config.defaultReportingPeriod, businessUnit: 'Enterprise' },
    selectedEntity: null,
    mutations: [],
    heatmapMode: 'risk',
    capabilityFilters: { ...initialCapabilityFilters, collapsedDomains: [] },
    portfolioFilters: { ...initialPortfolioFilters },
    integrationFilters: { ...initialIntegrationFilters },
    scenarioId: config.defaultScenarioId,
    graphRoot: null,
    relationshipDepth: 1,
    graphDirection: 'both',
    entityTypeFilters: [...DEFAULT_ENTITY_TYPE_FILTERS],
    impactMode: false,
    compareCapabilityIds: [],
    navContext: null,
    aiHistory: [],
    aiFeedback: [],
    recommendationDrafts: [],
    briefingPreferences: {
      ...initialBriefingPrefs,
      role: primaryLabel,
      period: config.defaultReportingPeriod,
    },
    lastAiResponseId: null,
  }
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function stamp() {
  return new Date().toISOString()
}

function pushAudit(pack: TenantPack, event: Omit<AuditFields, 'id' | 'timestamp' | 'tenantId'> & { tenantId?: string }) {
  const entry: AuditFields = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    tenantId: event.tenantId || pack.tenant.id,
    timestamp: stamp(),
    action: event.action,
    actorRole: event.actorRole,
    entityId: event.entityId,
    entityType: event.entityType,
    previousState: event.previousState,
    newState: event.newState,
    comment: event.comment,
  }
  pack.auditHistory = [...(pack.auditHistory ?? []), entry]
}

export const usePrototypeStore = create<PrototypeState>()(
  persist(
    (set, get) => {
      const ensurePack = (): TenantPack => {
        const code = get().tenantCode
        const existing = get().workingPack
        if (existing && existing.tenant.code === code) return existing
        const fromMap = get().workingPacks[code]
        if (fromMap) {
          set({ workingPack: fromMap })
          return fromMap
        }
        const pack = loadTenantPack(code, { bypassCache: true })
        set({
          workingPack: pack,
          workingPacks: { ...get().workingPacks, [code]: pack },
        })
        return pack
      }

      const updatePack = (
        fn: (pack: TenantPack) => void,
        audit?: Omit<AuditFields, 'id' | 'timestamp' | 'tenantId' | 'actorRole'> & { actorRole?: string },
      ) => {
        const code = get().tenantCode
        const pack = structuredClone(ensurePack()) as TenantPack
        fn(pack)
        if (audit) {
          pushAudit(pack, {
            ...audit,
            actorRole: audit.actorRole || get().role,
          })
        }
        const mutations = [
          ...get().mutations,
          {
            id: `mut-${Date.now()}`,
            at: stamp(),
            description: audit?.action
              ? `${audit.action}${audit.entityId ? ` (${audit.entityId})` : ''}`
              : 'pack-updated',
          },
        ]
        set({
          workingPack: pack,
          workingPacks: { ...get().workingPacks, [code]: pack },
          mutations,
        })
      }

      const transitionFinding = (id: string, to: string, comment?: string): ActionResult => {
        try {
          updatePack(
            (pack) => {
              const f = pack.findings.find((x) => x.id === id)
              if (!f) throw new Error(`Finding ${id} not found`)
              const from = coerceFindingWorkflowStatus(f.workflowStatus ?? f.status)
              assertFindingTransition(from, to as Parameters<typeof assertFindingTransition>[1])
              f.workflowStatus = to
              f.status = findingStatusToEntityStatus(to as Parameters<typeof findingStatusToEntityStatus>[0])
              f.lastReviewedDate = today()
              f.updatedAt = today()
            },
            {
              action:
                to === 'Validated'
                  ? 'finding_validated'
                  : to === 'Rejected'
                    ? 'finding_rejected'
                    : to === 'Under Review'
                      ? 'finding_submitted'
                      : to === 'Remediation Planned'
                        ? 'finding_remediation_planned'
                        : to === 'Resolved'
                          ? 'finding_resolved'
                          : 'finding_validated',
              entityId: id,
              entityType: 'finding',
              previousState: undefined,
              newState: to,
              comment,
            },
          )
          return { ok: true }
        } catch (e) {
          return { ok: false, error: (e as Error).message }
        }
      }

      const transitionRecommendation = (id: string, to: string, comment?: string): ActionResult => {
        try {
          updatePack(
            (pack) => {
              const r = pack.recommendations.find((x) => x.id === id)
              if (!r) throw new Error(`Recommendation ${id} not found`)
              const from = coerceRecommendationWorkflowStatus(r.workflowStatus ?? r.status)
              assertRecommendationTransition(from, to as Parameters<typeof assertRecommendationTransition>[1])
              r.workflowStatus = to
              r.status = recommendationStatusToEntityStatus(
                to as Parameters<typeof recommendationStatusToEntityStatus>[0],
              )
              r.updatedAt = today()
              if (comment) {
                r.reviewComments = [
                  ...(r.reviewComments ?? []),
                  { id: `c-${Date.now()}`, at: stamp(), authorRole: get().role, text: comment },
                ]
              }
            },
            {
              action:
                to === 'Approved'
                  ? 'recommendation_approved'
                  : to === 'Rejected'
                    ? 'recommendation_rejected'
                    : to === 'Revision Requested'
                      ? 'recommendation_revision_requested'
                      : to === 'Ready for Review' || to === 'Under Review'
                        ? 'recommendation_submitted'
                        : 'recommendation_submitted',
              entityId: id,
              entityType: 'recommendation',
              newState: to,
              comment,
            },
          )
          return { ok: true }
        } catch (e) {
          return { ok: false, error: (e as Error).message }
        }
      }

      const recordDecision = (
        id: string,
        to: string,
        extras?: { rationale?: string; conditions?: string[] },
      ): ActionResult => {
        try {
          updatePack(
            (pack) => {
              const d = (pack.decisions ?? []).find((x) => x.id === id)
              if (!d) throw new Error(`Decision ${id} not found`)
              const from = coerceDecisionStatus(d.decisionStatus)
              assertDecisionTransition(from, to as Parameters<typeof assertDecisionTransition>[1])
              d.decisionStatus = to
              d.decisionDate = today()
              d.updatedAt = today()
              d.status =
                to === 'Approved' || to === 'Approved with Conditions'
                  ? 'approved'
                  : to === 'Rejected'
                    ? 'rejected'
                    : to === 'Deferred'
                      ? 'open'
                      : d.status
              if (extras?.rationale) d.rationale = extras.rationale
              if (extras?.conditions) d.conditions = extras.conditions
            },
            {
              action: to === 'Deferred' ? 'decision_deferred' : 'decision_recorded',
              entityId: id,
              entityType: 'decision',
              newState: to,
              comment: extras?.rationale,
            },
          )
          return { ok: true }
        } catch (e) {
          return { ok: false, error: (e as Error).message }
        }
      }

      return {
        tenantCode: 'GRA',
        role: 'executive',
        filters: { ...initialFilters },
        selectedEntity: null,
        mutations: [],
        workingPack: null,
        workingPacks: {},
        tenantSlices: {},
        view: 'executive',
        heatmapMode: 'risk',
        capabilityFilters: { ...initialCapabilityFilters },
        portfolioFilters: { ...initialPortfolioFilters },
        integrationFilters: { ...initialIntegrationFilters },
        scenarioId: DEFAULT_SCENARIO_ID,
        graphRoot: null,
        relationshipDepth: 1,
        graphDirection: 'both',
        entityTypeFilters: [...DEFAULT_ENTITY_TYPE_FILTERS],
        impactMode: false,
        compareCapabilityIds: [],
        navContext: null,
        askOpen: false,
        aiHistory: [],
        aiFeedback: [],
        recommendationDrafts: [],
        briefingPreferences: { ...initialBriefingPrefs },
        lastAiResponseId: null,
        landingComplete: false,
        presentationMode: false,
        guidedTour: null,
        toast: { message: '', show: false },
        setAskOpen: (askOpen) => set({ askOpen }),
        dismissLanding: () => set({ landingComplete: true }),
        showLanding: () => set({ landingComplete: false, guidedTour: null }),
        setPresentationMode: (presentationMode) => set({ presentationMode }),
        startGuidedTour: (journeyId) =>
          set({
            guidedTour: { active: true, journeyId, stepIndex: 0 },
            landingComplete: true,
          }),
        setGuidedStep: (stepIndex) => {
          const tour = get().guidedTour
          if (!tour?.active) return
          set({ guidedTour: { ...tour, stepIndex } })
        },
        exitGuidedTour: () => set({ guidedTour: null, askOpen: false }),
        restartGuidedTour: () => {
          const tour = get().guidedTour
          if (!tour?.journeyId) return
          set({ guidedTour: { active: true, journeyId: tour.journeyId, stepIndex: 0 } })
        },
        showToast: (message) => set({ toast: { message, show: true } }),
        clearToast: () => set({ toast: { message: '', show: false } }),
        recordAiResponse: (response) =>
          set({
            aiHistory: [...get().aiHistory, response].slice(-MAX_AI_HISTORY),
            lastAiResponseId: response.id,
          }),
        reviewAiResponse: (responseId, status, comment) => {
          set({
            aiHistory: get().aiHistory.map((r) =>
              r.id === responseId ? { ...r, reviewStatus: status } : r,
            ),
            aiFeedback: [
              ...get().aiFeedback,
              { responseId, status, comment, at: stamp() },
            ].slice(-40),
            recommendationDrafts: get().recommendationDrafts.map((d) =>
              d.responseId === responseId ? { ...d, reviewStatus: status } : d,
            ),
          })
        },
        saveRecommendationDraft: (draft) => {
          const id = `ai-draft-${Date.now()}`
          set({
            recommendationDrafts: [
              ...get().recommendationDrafts,
              { ...draft, id, createdAt: stamp() },
            ],
          })
          get().addMutation(`Saved AI recommendation draft ${id} for finding ${draft.findingId}`)
          return { ok: true, id }
        },
        setBriefingPreferences: (prefs) =>
          set({ briefingPreferences: { ...get().briefingPreferences, ...prefs } }),
        setView: (view) => set({ view }),
        setRole: (role) => set({ role }),
        setFilters: (filters) => set({ filters: { ...get().filters, ...filters } }),
        setHeatmapMode: (heatmapMode) => set({ heatmapMode }),
        setCapabilityFilters: (filters) =>
          set({ capabilityFilters: { ...get().capabilityFilters, ...filters } }),
        setPortfolioFilters: (filters) =>
          set({ portfolioFilters: { ...get().portfolioFilters, ...filters } }),
        setIntegrationFilters: (filters) =>
          set({ integrationFilters: { ...get().integrationFilters, ...filters } }),
        setScenarioId: (scenarioId) => set({ scenarioId }),
        setGraphRoot: (graphRoot) => set({ graphRoot }),
        setRelationshipDepth: (relationshipDepth) => set({ relationshipDepth }),
        setGraphDirection: (graphDirection) => set({ graphDirection }),
        setEntityTypeFilters: (entityTypeFilters) => set({ entityTypeFilters }),
        toggleEntityTypeFilter: (type) => {
          const current = get().entityTypeFilters
          if (current.includes(type)) {
            set({ entityTypeFilters: current.filter((t) => t !== type) })
            return
          }
          set({ entityTypeFilters: [...current, type] })
        },
        setImpactMode: (impactMode) => set({ impactMode }),
        toggleCompareCapability: (id) => {
          const current = get().compareCapabilityIds
          if (current.includes(id)) {
            set({ compareCapabilityIds: current.filter((x) => x !== id) })
            return
          }
          if (current.length >= 3) return
          set({ compareCapabilityIds: [...current, id] })
        },
        clearCompare: () => set({ compareCapabilityIds: [] }),
        setNavContext: (navContext) => set({ navContext }),
        selectEntity: (entity) => set({ selectedEntity: entity }),
        clearSelection: () => set({ selectedEntity: null }),
        addMutation: (description) =>
          set({
            mutations: [
              ...get().mutations,
              { id: `mut-${Date.now()}`, at: stamp(), description },
            ],
          }),
        ensurePack,
        updatePack,
        getRepo: () => createTenantRepository(ensurePack()),
        listAuditHistory: () => ensurePack().auditHistory ?? [],
        listDecisions: () => ensurePack().decisions ?? [],
        getArbQueue: () =>
          (ensurePack().decisions ?? []).filter((d) =>
            ['Pending', 'Deferred'].includes(coerceDecisionStatus(d.decisionStatus)),
          ),
        resetDemo: () => {
          const code = get().tenantCode
          clearTenantCache()
          const pack = loadTenantPack(code, { bypassCache: true })
          const config = getTenantConfig(code)
          const slice = defaultTenantSlice(config)
          const { tenantSlices, workingPacks } = get()
          const nextSlices = { ...tenantSlices }
          delete nextSlices[code]
          set({
            workingPack: pack,
            workingPacks: { ...workingPacks, [code]: pack },
            tenantSlices: nextSlices,
            askOpen: false,
            selectedEntity: null,
            ...slice,
            view: 'executive',
            guidedTour: null,
            graphRoot: null,
            toast: { message: 'Demonstration restored for the active organisation.', show: true },
          })
        },

        resetAllTenants: () => {
          clearTenantCache()
          const code: TenantCode = 'GRA'
          const pack = loadTenantPack(code, { bypassCache: true })
          const slice = defaultTenantSlice(getTenantConfig(code))
          set({
            tenantCode: code,
            workingPack: pack,
            workingPacks: { [code]: pack },
            tenantSlices: {},
            askOpen: false,
            ...slice,
            selectedEntity: null,
            view: 'executive',
          })
        },

        switchTenant: (code: TenantCode) => {
          const state = get()
          if (state.tenantCode === code) return

          const persistedSlice = captureTenantSlice(state)
          const workingPacks: Partial<Record<TenantCode, TenantPack>> = {
            ...state.workingPacks,
          }
          if (state.workingPack) {
            workingPacks[state.tenantCode] = state.workingPack
          }
          const tenantSlices: Partial<Record<TenantCode, TenantUiSlice>> = {
            ...state.tenantSlices,
            [state.tenantCode]: persistedSlice,
          }

          const config = getTenantConfig(code)
          const pack =
            workingPacks[code] ?? loadTenantPack(code, { bypassCache: true })
          workingPacks[code] = pack

          const restored = tenantSlices[code]
            ? { ...tenantSlices[code]! }
            : defaultTenantSlice(config)

          set({
            tenantCode: code,
            workingPack: pack,
            workingPacks,
            tenantSlices,
            askOpen: false,
            selectedEntity: null,
            guidedTour: null,
            view: 'executive',
            role: restored.role,
            filters: restored.filters,
            mutations: restored.mutations,
            heatmapMode: restored.heatmapMode,
            capabilityFilters: restored.capabilityFilters,
            portfolioFilters: restored.portfolioFilters,
            integrationFilters: restored.integrationFilters,
            scenarioId: restored.scenarioId,
            graphRoot: null,
            relationshipDepth: restored.relationshipDepth,
            graphDirection: restored.graphDirection,
            entityTypeFilters: restored.entityTypeFilters,
            impactMode: restored.impactMode,
            compareCapabilityIds: restored.compareCapabilityIds,
            navContext: null,
            aiHistory: restored.aiHistory,
            aiFeedback: restored.aiFeedback,
            recommendationDrafts: restored.recommendationDrafts,
            briefingPreferences: restored.briefingPreferences,
            lastAiResponseId: restored.lastAiResponseId,
          })
          if (typeof window !== 'undefined') {
            window.location.hash = ''
          }
        },

        setTenant: (code: TenantCode) => get().switchTenant(code),

        submitForReview: ({ id }) => transitionFinding(id, 'Under Review'),
        validateFinding: ({ id, comment }) => transitionFinding(id, 'Validated', comment),
        rejectFinding: ({ id, comment }) => transitionFinding(id, 'Rejected', comment),
        assignOwner: ({ id, ownerId }) => {
          if (!ownerId?.trim()) return { ok: false, error: 'Owner is required' }
          updatePack(
            (pack) => {
              const f = pack.findings.find((x) => x.id === id)
              if (!f) throw new Error('Finding not found')
              f.ownerId = ownerId
              f.businessOwnerId = ownerId
              f.updatedAt = today()
            },
            {
              action: 'finding_owner_changed',
              entityId: id,
              entityType: 'finding',
              newState: ownerId,
            },
          )
          return { ok: true }
        },
        changeTargetDate: ({ id, targetDate }) => {
          if (!targetDate) return { ok: false, error: 'Target date is required' }
          updatePack(
            (pack) => {
              const f = pack.findings.find((x) => x.id === id)
              if (!f) throw new Error('Finding not found')
              f.targetDate = targetDate
              f.updatedAt = today()
            },
            {
              action: 'finding_target_date_changed',
              entityId: id,
              entityType: 'finding',
              newState: targetDate,
            },
          )
          return { ok: true }
        },
        createRecommendationFromFinding: ({ id }) => {
          let newId = ''
          try {
            updatePack(
              (pack) => {
                const f = pack.findings.find((x) => x.id === id)
                if (!f) throw new Error('Finding not found')
                newId = `rec-gra-${Date.now()}`
                pack.recommendations.push({
                  id: newId,
                  tenantId: pack.tenant.id,
                  name: `Remediate: ${f.name}`,
                  description: f.recommendedAction || f.problemStatement,
                  status: 'draft',
                  ownerId: f.architectureOwnerId || f.ownerId,
                  createdAt: today(),
                  updatedAt: today(),
                  dataQuality: 'medium',
                  sourceRefs: ['prototype'],
                  tags: ['generated'],
                  outcome: f.recommendedAction || 'Reduce finding risk',
                  findingIds: [f.id],
                  affectedCapabilityIds: f.linkedObjectIds.filter((x) =>
                    pack.capabilities.some((c) => c.id === x),
                  ),
                  affectedApplicationIds: f.linkedObjectIds.filter((x) =>
                    pack.applications.some((a) => a.id === x),
                  ),
                  optionsConsidered: [f.recommendedAction || 'Address finding', 'Do nothing'],
                  expectedValue: 'Risk reduction — subject to validation',
                  riskReduction: f.businessImpact,
                  effortBand: 'M',
                  confidence: 'medium',
                  assumptions: ['Owners confirm scope'],
                  workflowStatus: 'Draft',
                  evidenceIds: [...f.evidenceIds],
                  preferredOption: f.recommendedAction || 'Address finding',
                  reviewComments: [],
                })
                f.recommendationIds = [...(f.recommendationIds ?? []), newId]
                const ws = coerceFindingWorkflowStatus(f.workflowStatus ?? f.status)
                if (ws === 'Validated' || ws === 'Accepted') {
                  f.workflowStatus = 'Remediation Planned'
                  f.status = 'in_progress'
                }
              },
              {
                action: 'recommendation_submitted',
                entityId: newId,
                entityType: 'recommendation',
                newState: 'Draft',
                comment: `Created from finding ${id}`,
              },
            )
            return { ok: true, id: newId }
          } catch (e) {
            return { ok: false, error: (e as Error).message }
          }
        },
        markRemediationPlanned: ({ id }) => {
          const f = ensurePack().findings.find((x) => x.id === id)
          if (!f) return { ok: false, error: 'Finding not found' }
          const from = coerceFindingWorkflowStatus(f.workflowStatus ?? f.status)
          if (from === 'Accepted') return transitionFinding(id, 'Remediation Planned')
          if (from === 'Validated') {
            const a = transitionFinding(id, 'Accepted')
            if (!a.ok) return a
            return transitionFinding(id, 'Remediation Planned')
          }
          return transitionFinding(id, 'Remediation Planned')
        },
        resolveFinding: ({ id }) => transitionFinding(id, 'Resolved'),

        markVerified: ({ id }) => {
          updatePack(
            (pack) => {
              const e = pack.evidence.find((x) => x.id === id)
              if (!e) throw new Error('Evidence not found')
              e.verificationStatus = 'verified'
              e.updatedAt = today()
            },
            { action: 'evidence_verified', entityId: id, entityType: 'evidence', newState: 'verified' },
          )
          return { ok: true }
        },
        markDisputed: ({ id, comment }) => {
          updatePack(
            (pack) => {
              const e = pack.evidence.find((x) => x.id === id)
              if (!e) throw new Error('Evidence not found')
              e.verificationStatus = 'disputed'
              if (comment) e.notes = [...(e.notes ?? []), comment]
              e.updatedAt = today()
            },
            {
              action: 'evidence_disputed',
              entityId: id,
              entityType: 'evidence',
              newState: 'disputed',
              comment,
            },
          )
          return { ok: true }
        },
        addNote: ({ id, note }) => {
          if (!note?.trim()) return { ok: false, error: 'Note is required' }
          updatePack(
            (pack) => {
              const e = pack.evidence.find((x) => x.id === id)
              if (!e) throw new Error('Evidence not found')
              e.notes = [...(e.notes ?? []), note]
              e.updatedAt = today()
            },
            { action: 'evidence_note_added', entityId: id, entityType: 'evidence', comment: note },
          )
          return { ok: true }
        },

        submit: ({ id }) => {
          const r = ensurePack().recommendations.find((x) => x.id === id)
          if (!r) return { ok: false, error: 'Recommendation not found' }
          const from = coerceRecommendationWorkflowStatus(r.workflowStatus ?? r.status)
          if (from === 'Draft') return transitionRecommendation(id, 'Ready for Review')
          if (from === 'Ready for Review') return transitionRecommendation(id, 'Under Review')
          if (from === 'Revision Requested') return transitionRecommendation(id, 'Ready for Review')
          return transitionRecommendation(id, 'Under Review')
        },
        approve: ({ id }) => transitionRecommendation(id, 'Approved'),
        reject: ({ id, comment }) => transitionRecommendation(id, 'Rejected', comment),
        requestRevision: ({ id, comment }) =>
          transitionRecommendation(id, 'Revision Requested', comment),
        addComment: ({ id, text }) => {
          if (!text?.trim()) return { ok: false, error: 'Comment is required' }
          updatePack(
            (pack) => {
              const r = pack.recommendations.find((x) => x.id === id)
              if (!r) throw new Error('Recommendation not found')
              r.reviewComments = [
                ...(r.reviewComments ?? []),
                { id: `c-${Date.now()}`, at: stamp(), authorRole: get().role, text },
              ]
              r.updatedAt = today()
            },
            {
              action: 'recommendation_comment_added',
              entityId: id,
              entityType: 'recommendation',
              comment: text,
            },
          )
          return { ok: true }
        },
        sendToARB: ({ id }) => {
          try {
            updatePack(
              (pack) => {
                const r = pack.recommendations.find((x) => x.id === id)
                if (!r) throw new Error('Recommendation not found')
                const from = coerceRecommendationWorkflowStatus(r.workflowStatus ?? r.status)
                if (from === 'Draft') {
                  assertRecommendationTransition(from, 'Ready for Review')
                  r.workflowStatus = 'Ready for Review'
                  r.status = 'proposed'
                }
                if (
                  coerceRecommendationWorkflowStatus(r.workflowStatus ?? r.status) ===
                  'Ready for Review'
                ) {
                  assertRecommendationTransition('Ready for Review', 'Under Review')
                  r.workflowStatus = 'Under Review'
                  r.status = 'in_progress'
                }
                r.updatedAt = today()
                const existing = (pack.decisions ?? []).find((d) => d.recommendationId === id)
                if (!existing) {
                  const decId = `dec-gra-${Date.now()}`
                  pack.decisions = [
                    ...(pack.decisions ?? []),
                    {
                      id: decId,
                      tenantId: pack.tenant.id,
                      name: `ARB: ${r.name}`,
                      description: r.outcome,
                      status: 'proposed',
                      ownerId: r.ownerId,
                      createdAt: today(),
                      updatedAt: today(),
                      dataQuality: 'medium',
                      sourceRefs: ['prototype'],
                      tags: ['arb'],
                      decisionType: 'Architecture',
                      decisionStatus: 'Pending',
                      decisionAuthority: 'Architecture Review Board',
                      reviewerIds: [r.ownerId],
                      requiredReviewerIds: [r.ownerId],
                      recommendationId: r.id,
                      optionsConsidered: [...r.optionsConsidered],
                      evidenceIds: [...(r.evidenceIds ?? [])],
                      affectedObjectIds: [
                        ...r.affectedCapabilityIds,
                        ...r.affectedApplicationIds,
                      ],
                      submittedAt: today(),
                      decisionDeadline: r.targetDecisionDate || '2026-12-31',
                      businessDomain: 'Enterprise',
                      riskSeverity: 'high',
                      expectedValue: r.expectedValue,
                    },
                  ]
                  r.decisionId = decId
                }
              },
              {
                action: 'recommendation_sent_to_arb',
                entityId: id,
                entityType: 'recommendation',
                newState: 'Under Review',
              },
            )
            return { ok: true }
          } catch (e) {
            return { ok: false, error: (e as Error).message }
          }
        },
        setPreferredOption: ({ id, option }) => {
          updatePack((pack) => {
            const r = pack.recommendations.find((x) => x.id === id)
            if (!r) throw new Error('Recommendation not found')
            r.preferredOption = option
            r.updatedAt = today()
          })
          return { ok: true }
        },

        approveDecision: ({ id, rationale }) => recordDecision(id, 'Approved', { rationale }),
        approveDecisionWithConditions: ({ id, conditions, rationale }) =>
          recordDecision(id, 'Approved with Conditions', {
            rationale,
            conditions: conditions
              ? conditions.split('\n').map((s) => s.trim()).filter(Boolean)
              : [],
          }),
        rejectDecision: ({ id, rationale }) => recordDecision(id, 'Rejected', { rationale }),
        deferDecision: ({ id, rationale }) => recordDecision(id, 'Deferred', { rationale }),

        createInitiative: (payload) => {
          try {
            const pack = ensurePack()
            let draft: InitiativeDraft
            const raw = payload as Record<string, unknown>

            // UI modal shape: { name, description, decisionId, recommendationIds, ... }
            if (raw.name && (raw.decisionId || (raw.recommendationIds as string[] | undefined)?.length)) {
              const decisionId = String(raw.decisionId || '')
              const recommendationId =
                (raw.recommendationIds as string[] | undefined)?.[0] ||
                String(raw.recommendationId || '')
              const decision =
                (pack.decisions ?? []).find((d) => d.id === decisionId) ||
                (pack.decisions ?? []).find((d) => d.recommendationId === recommendationId)
              if (!decision) {
                return {
                  ok: false,
                  error: 'An approved decision is required before creating an initiative.',
                }
              }
              const gateD = canCreateInitiativeFromDecision(decision)
              if (!gateD.ok) return { ok: false, errors: gateD.errors, error: gateD.errors.join('; ') }
              const rec =
                pack.recommendations.find((r) => r.id === recommendationId) ||
                pack.recommendations.find((r) => r.id === decision.recommendationId)
              if (!rec) return { ok: false, error: 'Recommendation not found' }
              // Ensure recommendation is approved when decision is approved
              const recWs = coerceRecommendationWorkflowStatus(rec.workflowStatus ?? rec.status)
              if (recWs !== 'Approved' && recWs !== 'Converted to Initiative') {
                if (recWs === 'Under Review' || recWs === 'Ready for Review') {
                  // Decision approval implies recommendation approval for initiative creation
                } else {
                  const gateR = canCreateInitiativeFromRecommendation(rec)
                  if (!gateR.ok) {
                    return { ok: false, errors: gateR.errors, error: gateR.errors.join('; ') }
                  }
                }
              }
              draft = {
                ...mapRecommendationToInitiativeDraft(rec, decision),
                title: String(raw.name),
                intendedOutcome: String(raw.description || raw.intendedOutcome || rec.outcome),
                ownerId: String(raw.ownerId || rec.ownerId),
                objectiveIds: (raw.objectiveIds as string[]) || [],
                capabilityIds:
                  (raw.capabilityIds as string[]) || [...rec.affectedCapabilityIds],
                expectedBenefit: String(raw.expectedValue || rec.expectedValue),
                expectedRiskReduction: String(raw.riskReduction || rec.riskReduction),
                costBand: String(raw.costBand || rec.costBand || 'TBD'),
                horizon: (raw.horizon as InitiativeDraft['horizon']) || 'next',
                recommendationId: rec.id,
                decisionId: decision.id,
                kpiIds: (raw.kpiIds as string[]) || rec.kpiIds || [],
              }
            } else if ('recommendationId' in payload && 'decisionId' in payload && 'title' in payload) {
              draft = payload as InitiativeDraft
            } else {
              const decisionId = (payload as { decisionId: string }).decisionId
              const decision = (pack.decisions ?? []).find((d) => d.id === decisionId)
              if (!decision) return { ok: false, error: 'Decision not found' }
              const rec = pack.recommendations.find((r) => r.id === decision.recommendationId)
              if (!rec) return { ok: false, error: 'Recommendation not found' }
              const gateD = canCreateInitiativeFromDecision(decision)
              if (!gateD.ok) return { ok: false, errors: gateD.errors, error: gateD.errors.join('; ') }
              const gateR = canCreateInitiativeFromRecommendation(rec)
              if (!gateR.ok) {
                const ws = coerceRecommendationWorkflowStatus(rec.workflowStatus ?? rec.status)
                if (ws !== 'Under Review' && ws !== 'Approved' && ws !== 'Converted to Initiative') {
                  return { ok: false, errors: gateR.errors, error: gateR.errors.join('; ') }
                }
              }
              draft = {
                ...mapRecommendationToInitiativeDraft(rec, decision),
                ...((payload as { draft?: Partial<InitiativeDraft> }).draft || {}),
              }
            }

            // Ensure at least one KPI for validation when UI omits it
            if (!draft.kpiIds?.length) {
              const linked = pack.kpis
                .filter((k) =>
                  draft.objectiveIds.some((oid) => k.linkedObjectiveIds.includes(oid)),
                )
                .map((k) => k.id)
              draft.kpiIds = linked.length ? [linked[0]] : pack.kpis[0] ? [pack.kpis[0].id] : []
            }

            const validation = validateInitiativeDraft(draft)
            if (!validation.ok) {
              return { ok: false, errors: validation.errors, error: validation.errors.join('; ') }
            }

            const decision = (pack.decisions ?? []).find((d) => d.id === draft.decisionId)
            if (!decision) return { ok: false, error: 'Approved decision is required' }
            const gate = canCreateInitiativeFromDecision(decision)
            if (!gate.ok) return { ok: false, errors: gate.errors, error: gate.errors.join('; ') }

            let newId = ''
            updatePack(
              (p) => {
                newId = `init-gra-${Date.now()}`
                p.initiatives.push({
                  id: newId,
                  tenantId: p.tenant.id,
                  name: draft.title,
                  description: draft.intendedOutcome,
                  status: 'proposed',
                  ownerId: draft.ownerId,
                  createdAt: today(),
                  updatedAt: today(),
                  dataQuality: 'medium',
                  sourceRefs: ['prototype'],
                  tags: ['roadmap'],
                  recommendationIds: [draft.recommendationId],
                  objectiveIds: draft.objectiveIds,
                  capabilityIds: draft.capabilityIds,
                  horizon: draft.horizon,
                  expectedValue: draft.expectedBenefit,
                  costBand: draft.costBand,
                  riskReduction: draft.expectedRiskReduction,
                  progressPercent: 0,
                  decisionId: draft.decisionId,
                  applicationIds: draft.applicationIds,
                  integrationIds: draft.integrationIds,
                  findingIds: draft.findingIds,
                  kpiIds: draft.kpiIds,
                  dependsOnInitiativeIds: [],
                  targetQuarter: draft.targetQuarter,
                  targetPeriod: draft.targetPeriod,
                  intendedOutcome: draft.intendedOutcome,
                  effortBand: draft.effortBand,
                })
                const dec = (p.decisions ?? []).find((d) => d.id === draft.decisionId)
                if (dec) dec.initiativeId = newId
                const rec = p.recommendations.find((r) => r.id === draft.recommendationId)
                if (rec) {
                  const from = coerceRecommendationWorkflowStatus(rec.workflowStatus ?? rec.status)
                  if (from === 'Under Review' || from === 'Ready for Review') {
                    rec.workflowStatus = 'Approved'
                    rec.status = 'approved'
                  }
                  if (
                    coerceRecommendationWorkflowStatus(rec.workflowStatus ?? rec.status) === 'Approved'
                  ) {
                    rec.workflowStatus = 'Converted to Initiative'
                    rec.status = 'completed'
                  }
                  rec.decisionId = draft.decisionId
                }
                for (const kid of draft.kpiIds) {
                  const k = p.kpis.find((x) => x.id === kid)
                  if (k) {
                    k.linkedInitiativeIds = [...new Set([...(k.linkedInitiativeIds ?? []), newId])]
                  }
                }
              },
              {
                action: 'initiative_created',
                entityId: newId,
                entityType: 'initiative',
                newState: draft.horizon,
                comment: `From decision ${draft.decisionId}`,
              },
            )
            return { ok: true, id: newId }
          } catch (e) {
            return { ok: false, error: (e as Error).message }
          }
        },

        moveInitiativeHorizon: ({ id, horizon }) => {
          updatePack(
            (pack) => {
              const i = pack.initiatives.find((x) => x.id === id)
              if (!i) throw new Error('Initiative not found')
              const next = placeOnRoadmap(i, horizon)
              Object.assign(i, next)
            },
            {
              action: 'roadmap_placement_changed',
              entityId: id,
              entityType: 'initiative',
              newState: horizon,
            },
          )
          return { ok: true }
        },
        changeInitiativeQuarter: ({ id, targetQuarter }) => {
          updatePack(
            (pack) => {
              const i = pack.initiatives.find((x) => x.id === id)
              if (!i) throw new Error('Initiative not found')
              i.targetQuarter = targetQuarter
              i.updatedAt = today()
            },
            {
              action: 'roadmap_placement_changed',
              entityId: id,
              entityType: 'initiative',
              newState: targetQuarter,
            },
          )
          return { ok: true }
        },
      }
    },
    {
      name: 'ea360-prototype-v6',
      partialize: (s) => ({
        tenantCode: s.tenantCode,
        workingPacks: s.workingPacks,
        tenantSlices: {
          ...s.tenantSlices,
          [s.tenantCode]: captureTenantSlice(s),
        },
        view: s.view,
        landingComplete: s.landingComplete,
        presentationMode: s.presentationMode,
        // Active flattened fields for immediate hydrate (also in tenantSlices)
        role: s.role,
        filters: s.filters,
        mutations: s.mutations,
        workingPack: s.workingPack,
        heatmapMode: s.heatmapMode,
        capabilityFilters: {
          search: s.capabilityFilters.search,
          domain: s.capabilityFilters.domain,
          collapsedDomains: s.capabilityFilters.collapsedDomains,
        },
        portfolioFilters: s.portfolioFilters,
        integrationFilters: s.integrationFilters,
        scenarioId: s.scenarioId,
        relationshipDepth: s.relationshipDepth,
        graphDirection: s.graphDirection,
        entityTypeFilters: s.entityTypeFilters,
        impactMode: s.impactMode,
        compareCapabilityIds: s.compareCapabilityIds,
        aiHistory: s.aiHistory.slice(-MAX_AI_HISTORY),
        aiFeedback: s.aiFeedback.slice(-20),
        recommendationDrafts: s.recommendationDrafts,
        briefingPreferences: s.briefingPreferences,
      }),
    },
  ),
)

configureEA360AI({
  getRepo: () => usePrototypeStore.getState().getRepo(),
  getMutations: () => usePrototypeStore.getState().mutations,
})

export { listAvailableTenants, getTenantConfig }
