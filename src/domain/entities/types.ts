/** Common fields required on every EA360 enterprise entity. */
export type EntityStatus = 'active' | 'draft' | 'retired' | 'proposed' | 'approved' | 'rejected' | 'in_progress' | 'completed' | 'open' | 'mitigated' | 'accepted'
export type DataQuality = 'high' | 'medium' | 'low'
export type Severity = 'critical' | 'high' | 'medium' | 'low'
export type Criticality = 'critical' | 'high' | 'medium' | 'low'

export type EntityType =
  | 'tenant'
  | 'strategicObjective'
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

export interface EntityBase {
  id: string
  tenantId: string
  name: string
  description: string
  status: EntityStatus
  ownerId: string
  createdAt: string
  updatedAt: string
  dataQuality: DataQuality
  sourceRefs: string[]
  tags: string[]
}

export interface Tenant {
  id: string
  code: string
  name: string
  shortName: string
  sector: string
  country: string
  story: string
  synthetic: true
}

export interface StrategicObjective extends EntityBase {
  horizon: string
  priority: number
}

export interface Capability extends EntityBase {
  level: 1 | 2 | 3
  parentId?: string
  domain: string
  maturityCurrent: number
  maturityTarget: number
  strategicImportance: number
  riskScore: number
  investmentPriority: number
  strategicObjectiveIds: string[]
}

export interface Process extends EntityBase {
  capabilityIds: string[]
}

export type TimeClass = 'Tolerate' | 'Invest' | 'Migrate' | 'Eliminate'
export type CostBand = 'low' | 'medium' | 'high' | 'very-high'
export type DeploymentModel = 'on-prem' | 'cloud' | 'hybrid' | 'saas'

export interface Application extends EntityBase {
  lifecycle: 'invest' | 'tolerate' | 'migrate' | 'eliminate' | 'strategic' | 'legacy'
  businessValue: number
  technicalHealth: number
  criticality: Criticality
  businessOwnerId: string
  technologyOwnerId: string
  annualCostBand: CostBand
  /** Relative user/customer reach score 1–5 */
  userReach: number
  dataSensitivity: 'public' | 'internal' | 'confidential' | 'restricted'
  deploymentModel: DeploymentModel
  vendorProduct: string
  endOfSupportDate?: string
  /** 1–5 how well app aligns to current strategic objectives */
  strategicAlignment: number
  /** Explicit duplication cluster id when part of an overlap set */
  duplicationClusterId?: string
  supportedCapabilityIds: string[]
}

export interface Integration extends EntityBase {
  /** Legacy pattern retained for compatibility; prefer integrationType + pointToPoint */
  pattern: 'api' | 'batch' | 'point-to-point' | 'event' | 'file'
  integrationType:
    | 'REST API'
    | 'SOAP service'
    | 'Event or message'
    | 'File transfer'
    | 'Database integration'
    | 'Batch integration'
    | 'Manual exchange'
  sourceApplicationId: string
  targetApplicationId: string
  direction: 'inbound' | 'outbound' | 'bidirectional'
  businessOwnerId: string
  technologyOwnerId: string
  supportedCapabilityIds: string[]
  supportedProcessIds: string[]
  apiOrInterfaceName: string
  protocol: string
  dataFormat: string
  authenticationMethod: string
  environment: 'production' | 'uat' | 'development' | 'multiple'
  lifecycleStatus: 'Planned' | 'Active' | 'Restricted' | 'Deprecated' | 'Retiring'
  criticality: Criticality
  reusabilityStatus: 'reusable' | 'candidate' | 'point-to-point' | 'unknown'
  consumerCount: number
  transactionVolumeBand: 'low' | 'medium' | 'high' | 'very-high'
  availabilityTarget: string
  dataSensitivity: 'public' | 'internal' | 'confidential' | 'restricted'
  lastReviewDate: string
  documentationStatus: 'documented' | 'partial' | 'missing'
  monitoringStatus: 'monitored' | 'partial' | 'unmonitored'
  pointToPoint: boolean
  middlewarePlatform?: string
  dataObjectIds: string[]
  technologyIds: string[]
}

export interface DataObject extends EntityBase {
  classification: string
  domain: string
}

export interface Technology extends EntityBase {
  category: string
  lifecycle: 'strategic' | 'approved' | 'tolerated' | 'deprecated' | 'retire'
}

export type EvidenceType =
  | 'document'
  | 'interview'
  | 'system-extract'
  | 'policy'
  | 'observation'
  | 'assessment-response'
  | 'application-inventory'
  | 'architecture-document'
  | 'operational-report'
  | 'incident-summary'
  | 'risk-register'
  | 'standards-review'
  | 'stakeholder-observation'
  | 'integration-inventory'
  | 'technology-lifecycle'

export interface Evidence extends EntityBase {
  evidenceType: EvidenceType
  confidence: DataQuality
  linkedObjectIds: string[]
  sourceName?: string
  sourceReference?: string
  sourceDate?: string
  capturedDate?: string
  freshness?: 'fresh' | 'aging' | 'stale'
  reliability?: DataQuality
  verificationStatus?: 'unverified' | 'verified' | 'disputed' | 'stale' | 'missing'
  relatedFindingIds?: string[]
  notes?: string[]
  previewText?: string
}

export interface Finding extends EntityBase {
  category: string
  severity: Severity
  problemStatement: string
  rootCause: string
  businessImpact: string
  urgency: Severity
  evidenceIds: string[]
  linkedObjectIds: string[]
  targetDate: string
  recommendedAction: string
  workflowStatus?: string
  likelihood?: number
  impactScore?: number
  riskScore?: number
  businessOwnerId?: string
  architectureOwnerId?: string
  dateIdentified?: string
  lastReviewedDate?: string
  relatedRiskIds?: string[]
  recommendationIds?: string[]
  decisionIds?: string[]
  initiativeIds?: string[]
  domain?: string
  confidenceScore?: number
}

export interface Recommendation extends EntityBase {
  outcome: string
  findingIds: string[]
  affectedCapabilityIds: string[]
  affectedApplicationIds: string[]
  optionsConsidered: string[]
  expectedValue: string
  riskReduction: string
  effortBand: 'S' | 'M' | 'L' | 'XL'
  confidence: DataQuality
  assumptions: string[]
  workflowStatus?: string
  intendedOutcome?: string
  recommendedAction?: string
  preferredOption?: string
  expectedBenefit?: string
  expectedRiskReduction?: string
  costBand?: string
  complexity?: 'low' | 'medium' | 'high'
  dependencies?: string[]
  evidenceIds?: string[]
  affectedIntegrationIds?: string[]
  objectiveIds?: string[]
  kpiIds?: string[]
  decisionId?: string
  targetDecisionDate?: string
  reviewComments?: Array<{ id: string; at: string; authorRole: string; text: string }>
}

export interface Decision extends EntityBase {
  decisionType: string
  decisionStatus: string
  decisionDate?: string
  decisionAuthority: string
  reviewerIds: string[]
  recommendationId: string
  optionsConsidered: string[]
  selectedOption?: string
  rationale?: string
  conditions?: string[]
  exceptions?: string[]
  expiryReviewDate?: string
  evidenceIds: string[]
  affectedObjectIds: string[]
  initiativeId?: string
  submittedAt?: string
  decisionDeadline?: string
  businessDomain?: string
  riskSeverity?: Severity
  expectedValue?: string
  requiredReviewerIds?: string[]
}

export interface Initiative extends EntityBase {
  recommendationIds: string[]
  objectiveIds: string[]
  capabilityIds: string[]
  horizon: 'now' | 'next' | 'later'
  expectedValue: string
  costBand: string
  riskReduction: string
  progressPercent: number
  decisionId?: string
  applicationIds?: string[]
  integrationIds?: string[]
  findingIds?: string[]
  kpiIds?: string[]
  dependsOnInitiativeIds?: string[]
  targetQuarter?: string
  targetPeriod?: string
  intendedOutcome?: string
  effortBand?: string
  blocked?: boolean
}

export interface KPI extends EntityBase {
  unit: string
  currentValue: number
  targetValue: number
  direction: 'higher-better' | 'lower-better'
  linkedObjectiveIds: string[]
  category?: string
  baselineValue?: number
  measurementFrequency?: string
  expectedContribution?: string
  confidence?: DataQuality
  linkedInitiativeIds?: string[]
}

export type AnyEntity =
  | StrategicObjective
  | Capability
  | Process
  | Application
  | Integration
  | DataObject
  | Technology
  | Evidence
  | Finding
  | Recommendation
  | Decision
  | Initiative
  | KPI
