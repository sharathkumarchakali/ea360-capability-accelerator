/** Provider-independent AI assistance types for EA360. */

export type AIConfidence = 'high' | 'medium' | 'low'

export type AIReviewStatus = 'unreviewed' | 'accepted' | 'rejected' | 'helpful' | 'not_helpful'

export type AIIntent =
  | 'critical_risks'
  | 'maturity_gaps'
  | 'time_migrate_eliminate'
  | 'capability_applications'
  | 'integration_dependents'
  | 'impact_analysis'
  | 'p2p_concentration'
  | 'eos_technologies'
  | 'findings_without_remediation'
  | 'recommendations_awaiting_decision'
  | 'initiatives_for_objective'
  | 'executive_review'
  | 'evidence_gaps'
  | 'evidence_for_finding'
  | 'explain_finding'
  | 'recommendation_options'
  | 'initiative_kpi_summary'
  | 'data_governance_gaps'
  | 'data_lineage'
  | 'data_ai_readiness'
  | 'data_controls_missing'
  | 'technology_dependents'
  | 'technology_priority'
  | 'technology_cto_summary'
  | 'ai_governance_attention'
  | 'ai_agent_explain'
  | 'ai_agent_permissions'
  | 'ai_agent_permissions_why'
  | 'ai_model_dependencies'
  | 'ai_agent_kpi'
  | 'import_validation'
  | 'workspace_readiness'
  | 'approval_authority'
  | 'approved_items'
  | 'demo_changes'
  | 'explain_metric'
  | 'recommendation_draft'
  | 'executive_briefing'
  | 'clarify_entity'
  | 'insufficient_evidence'
  | 'unsupported'
  | 'refuse_approval'
  | 'refuse_guaranteed_finance'
  | 'cross_tenant_refused'
  | 'unknown_entity'

export type EntityReference = {
  id: string
  type: string
  name: string
}

export type CalculationReference = {
  id: string
  label: string
  formula: string
  inputs: string[]
  result: string | number
}

export type SuggestedAction = {
  id: string
  label: string
  action: string
  entityId?: string
  entityType?: string
  view?: string
}

export type EnterpriseFilters = {
  period?: string
  businessUnit?: string
  domain?: string
  objectiveId?: string
}

export type EA360AIRequest = {
  tenantId: string
  userRole: string
  intent?: AIIntent
  query: string
  contextEntityIds?: string[]
  contextEntityTypes?: string[]
  filters?: EnterpriseFilters
  view?: string
  metricKey?: string
  briefingRole?: string
  briefingEmphasis?: string
  /** Demo as-of date (ISO); defaults to shared demo clock. */
  asOfDate?: string
  /** Workspace data revision for cache invalidation labels. */
  dataRevision?: number
  /** Staged import validation result for Q32 (not committed pack). */
  importValidation?: {
    draftId: string
    errors: Array<{ row?: number; field?: string; message: string; severity?: string }>
    validCount?: number
    warningCount?: number
  }
  questionId?: string
  followUpOf?: string
}

export type ClaimKind = 'recorded' | 'computed' | 'inference' | 'proposal'

export type StructuredClaim = {
  text: string
  kind: ClaimKind
  sourceIds?: string[]
}

export type EA360AIResponse = {
  id: string
  intent: AIIntent
  summary: string
  explanation: string
  whyItMatters: string
  evidenceIds: string[]
  entityRefs: EntityReference[]
  assumptions: string[]
  calculations?: CalculationReference[]
  confidence: AIConfidence
  confidenceReason: string
  suggestedActions: SuggestedAction[]
  generatedAt: string
  reviewStatus: AIReviewStatus
  tenantId: string
  facts: string[]
  inferences: string[]
  grounded: boolean
  groundingErrors?: string[]
  asOfDate?: string
  dataRevision?: number
  questionId?: string
  claims?: StructuredClaim[]
  stale?: boolean
  recommendationDraft?: RecommendationDraftPayload
  /** The request this answer was generated for (lets the UI re-run a stale answer). */
  request?: {
    query: string
    intent?: AIIntent
    questionId?: string
    contextEntityIds?: string[]
    followUpOf?: string
  }
}

export type AIFeedback = {
  responseId: string
  status: AIReviewStatus
  comment?: string
  at: string
}

export type RecommendationDraftPayload = {
  findingId: string
  intendedOutcome: string
  problemAddressed: string
  recommendedAction: string
  optionsConsidered: string[]
  expectedBenefitBand: string
  riskReductionRationale: string
  indicativeEffort: string
  dependencies: string[]
  assumptions: string[]
  supportingFindingIds: string[]
  supportingEvidenceIds: string[]
  affectedObjectIds: string[]
  confidence: AIConfidence
  aiAssisted: true
  requiresArchitectValidation: true
}

export type EA360AIService = {
  ask: (request: EA360AIRequest) => EA360AIResponse
  explain: (request: EA360AIRequest) => EA360AIResponse
  impactNarrative: (request: EA360AIRequest) => EA360AIResponse
  draftRecommendation: (request: EA360AIRequest) => EA360AIResponse
  executiveBriefing: (request: EA360AIRequest) => EA360AIResponse
}

export const INSUFFICIENT_EVIDENCE_MESSAGE =
  'EA360 does not have sufficient verified evidence to answer this reliably. Review the identified data gaps before making a decision.'
