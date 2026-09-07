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
