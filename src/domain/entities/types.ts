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
  | 'aiSolution'
  | 'aiModel'

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

export type IntegrationExposure = 'Internal' | 'Partner' | 'Public'
export type IntegrationPortfolioDecision =
  | 'Invest'
  | 'Standardise'
  | 'Reuse'
  | 'Modernise'
  | 'Consolidate'
  | 'Replace'
  | 'Retire'
export type IntegrationPortfolioLifecycle =
  | 'Strategic'
  | 'Active'
  | 'Legacy'
  | 'Deprecated'
  | 'Retire'
export type IntegrationAssetType =
  | 'API'
  | 'Event'
  | 'Service'
  | 'Batch'
  | 'Point-to-Point'
  | 'Database Integration'
export type IntegrationReuseClass = 'Enterprise Reusable' | 'Multi-Consumer' | 'Single Consumer'
export type StandardsComplianceStatus = 'Compliant' | 'Partial' | 'Non-Compliant'

export interface Integration extends EntityBase {
  /** Legacy pattern retained for compatibility; prefer integrationType + pointToPoint */
  pattern: 'api' | 'batch' | 'point-to-point' | 'event' | 'file'
  integrationType:
    | 'REST API'
    | 'SOAP service'
    | 'GraphQL API'
    | 'Event or message'
    | 'File transfer'
    | 'Database integration'
    | 'Batch integration'
    | 'Manual exchange'
    | 'ESB / mediation'
    | 'Message queue'
    | 'Event stream'
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
  /** Portfolio intelligence fields (optional — derived when absent). */
  providerApplicationId?: string
  consumerApplicationIds?: string[]
  integrationOwnerId?: string
  exposure?: IntegrationExposure
  portfolioDecision?: IntegrationPortfolioDecision
  portfolioLifecycle?: IntegrationPortfolioLifecycle
  assetType?: IntegrationAssetType
  integrationPattern?: string
  architectureRisk?: Severity
  standardsCompliance?: StandardsComplianceStatus
  reuseClassification?: IntegrationReuseClass
  runtime?: string
  gateway?: string
  securityClassification?: string
  resilienceStatus?: Severity
  observabilityStatus?: 'Observed' | 'Partial' | 'Blind'
  standardIds?: string[]
  initiativeIds?: string[]
  recommendationWhy?: string
  recommendationAction?: string
  isSynthetic?: boolean
}

export type DataAssetType = 'Data Domain' | 'Data Product' | 'Key Information Entity'
export type DataAuthoritativeSourceStatus =
  | 'Confirmed'
  | 'Multiple Sources'
  | 'Under Review'
  | 'Unknown'
export type DataClassificationLabel =
  | 'Public'
  | 'Internal'
  | 'Confidential'
  | 'Restricted'
  | 'Highly Sensitive'
export type DataQualityStatus = 'Good' | 'Watch' | 'Poor' | 'Not Assessed'
export type DataRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low'
export type DataResidencyStatus = 'Compliant' | 'Review Required' | 'Cross-Border' | 'Unknown'
export type DataAiReadiness = 'Ready' | 'Conditional' | 'Not Ready' | 'Not Assessed'
export type DataPortfolioAction =
  | 'Govern'
  | 'Consolidate'
  | 'Improve Quality'
  | 'Modernise'
  | 'Enable Reuse'
  | 'Protect'
  | 'Retire'
export type DataCrossBorderStatus = 'Yes' | 'No' | 'Under Review' | 'Unknown'
export type DataGovernanceMaturity = 'Low' | 'Medium' | 'High'

export interface DataFlowStep {
  label: string
  kind: 'application' | 'integration' | 'data' | 'other'
  entityId?: string
}

export interface DataProductRef {
  id: string
  name: string
  description?: string
}

export interface DataObject extends EntityBase {
  /** Legacy domain label retained for compatibility. */
  classification: string
  domain: string
  /** Portfolio intelligence fields (optional — derived when absent). */
  type?: DataAssetType
  businessMeaning?: string
  businessCapabilityIds?: string[]
  businessServiceIds?: string[]
  criticality?: Criticality
  businessOwner?: string | null
  dataSteward?: string | null
  technicalCustodian?: string | null
  authoritativeSourceStatus?: DataAuthoritativeSourceStatus
  systemOfRecordApplicationId?: string | null
  primaryApplicationId?: string | null
  sourceApplicationIds?: string[]
  consumerApplicationIds?: string[]
  integrationIds?: string[]
  classificationLabel?: DataClassificationLabel
  containsPersonalData?: boolean
  containsFinancialData?: boolean
  sensitive?: boolean
  residencyRequirement?: string
  hostingLocation?: string
  crossBorderStatus?: DataCrossBorderStatus
  residencyStatus?: DataResidencyStatus
  qualityStatus?: DataQualityStatus
  completenessStatus?: DataQualityStatus
  accuracyStatus?: DataQualityStatus
  timelinessStatus?: DataQualityStatus
  consistencyStatus?: DataQualityStatus
  risk?: DataRiskLevel
  governanceMaturity?: DataGovernanceMaturity
  aiReadiness?: DataAiReadiness
  aiReadinessReason?: string
  aiReadinessFactors?: string[]
  futureAiUses?: string[]
  dataProducts?: DataProductRef[]
  dataProductIds?: string[]
  keyEntityNames?: string[]
  findingIds?: string[]
  standardIds?: string[]
  policyIds?: string[]
  decisionIds?: string[]
  initiativeIds?: string[]
  portfolioAction?: DataPortfolioAction
  portfolioActionReason?: string
  evidenceConfidence?: DataQuality
  lastReviewedAt?: string
  duplicationGroupId?: string
  duplicationNote?: string
  flowSteps?: DataFlowStep[]
  regulatoryImportance?: string
  citizenImpact?: string
  isSynthetic?: boolean
}

export type TechnologyLifecycle =
  | 'strategic'
  | 'approved'
  | 'tolerated'
  | 'deprecated'
  | 'retire'
  | 'end-of-support-risk'

export type TechnologyPortfolioDecision =
  | 'INVEST'
  | 'STANDARDISE'
  | 'MODERNISE'
  | 'CONSOLIDATE'
  | 'TOLERATE'
  | 'REPLACE'
  | 'RETIRE'

export type TechnologyRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low'

export type TechnologyStandardStatus = 'Standard' | 'Exception' | 'Under Review' | 'Not Assessed'

export type TechnologyDeploymentModel =
  | 'on-premise'
  | 'private-cloud'
  | 'public-cloud'
  | 'hybrid'
  | 'saas'

export interface Technology extends EntityBase {
  category: string
  subcategory?: string
  lifecycle: TechnologyLifecycle
  vendor?: string
  version?: string
  targetLifecycle?: TechnologyLifecycle
  targetLifecycleDate?: string
  targetLifecycleReason?: string
  deploymentModel?: TechnologyDeploymentModel
  environments?: string[]
  technologyOwner?: string
  platformOwner?: string
  operationalOwner?: string
  applicationIds?: string[]
  integrationIds?: string[]
  dataDomainIds?: string[]
  criticalApplicationCount?: number
  standardIds?: string[]
  standardStatus?: TechnologyStandardStatus
  exceptionIds?: string[]
  architectureRisk?: TechnologyRiskLevel
  resilienceStatus?: 'Meets Target' | 'Gap' | 'Not Assessed'
  securityReviewStatus?: 'Approved' | 'Review Required' | 'Not Assessed'
  haStatus?: 'Yes' | 'Partial' | 'No' | 'Unknown'
  drStatus?: 'Meets Target' | 'Gap' | 'Not Assessed'
  rtoTier?: string
  rpoTier?: string
  supportStatus?: string
  supportEndDate?: string
  supportEndDateSynthetic?: boolean
  findingIds?: string[]
  decisionIds?: string[]
  initiativeIds?: string[]
  portfolioDecision?: TechnologyPortfolioDecision
  portfolioDecisionReason?: string
  lastReviewedAt?: string
  isSynthetic?: boolean
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

export type InitiativeDeliveryStatus =
  | 'Proposed'
  | 'Planned'
  | 'In Progress'
  | 'At Risk'
  | 'Completed'
  | 'On Hold'

export type ArchitectureReadiness =
  | 'Ready'
  | 'Ready with Conditions'
  | 'Decision Required'
  | 'Blocked'
  | 'Not Assessed'

export type StrategicPriority = 'Critical' | 'High' | 'Medium' | 'Low'
export type ArchitectureRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low'

export type CapabilityImpactKind = 'Enable' | 'Improve' | 'Transform' | 'Retire'
export type ApplicationImpactKind = 'Introduce' | 'Change' | 'Migrate' | 'Retire' | 'Dependency'
export type IntegrationImpactKind = 'Introduce' | 'Change' | 'Migrate' | 'Retire' | 'Reuse'
export type DataImpactKind =
  | 'Introduce'
  | 'Improve'
  | 'Migrate'
  | 'Retire'
  | 'Reuse'
  | 'Establish Source'
export type TechnologyImpactKind = 'Introduce' | 'Retain' | 'Modernise' | 'Retire' | 'Dependency'
export type AiImpactKind = 'Introduce' | 'Change' | 'Reuse' | 'Retire'
export type StandardsComplianceLevel = 'Aligned' | 'Partial' | 'Exception'
export type CurrentMeasurementStatus = 'Available' | 'Pending'

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
  /** Delivery status for transformation programmes (distinct from EntityBase.status). */
  initiativeStatus?: InitiativeDeliveryStatus
  strategicPriority?: StrategicPriority
  architectureReadiness?: ArchitectureReadiness
  architectureRisk?: ArchitectureRiskLevel
  executiveSponsorId?: string
  initiativeOwnerId?: string
  architectureOwnerId?: string
  businessProblem?: string
  expectedOutcome?: string
  capabilityImpacts?: { capabilityId: string; impact: CapabilityImpactKind }[]
  applicationImpacts?: { applicationId: string; impact: ApplicationImpactKind }[]
  integrationImpacts?: { integrationId: string; impact: IntegrationImpactKind }[]
  dataImpacts?: { dataObjectId: string; impact: DataImpactKind }[]
  technologyImpacts?: { technologyId: string; impact: TechnologyImpactKind }[]
  aiImpacts?: { aiSolutionId: string; impact: AiImpactKind }[]
  decisionIds?: string[]
  outstandingDecisionIds?: string[]
  standardIds?: string[]
  standardCompliance?: { standardId: string; compliance: StandardsComplianceLevel }[]
  exceptionIds?: string[]
  exceptionsDetail?: {
    id: string
    name: string
    standardId?: string
    expiryDate?: string
  }[]
  enablesInitiativeIds?: string[]
  conflictInitiativeIds?: string[]
  overlapInitiativeIds?: string[]
  dependencyReasons?: { initiativeId: string; reason: string }[]
  conflictNotes?: string
  overlapNotes?: string
  risksReduced?: string[]
  risksIntroduced?: string[]
  lastArchitectureReview?: string
  nextArchitectureReview?: string
  roadmapPhase?: string
  startDate?: string
  targetDate?: string
  valueMeasureDefined?: boolean
  baselineDefined?: boolean
  targetDefined?: boolean
  currentMeasurement?: CurrentMeasurementStatus
  isSynthetic?: boolean
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

export type AiLifecycle = 'EXPERIMENT' | 'APPROVED' | 'PRODUCTION' | 'RESTRICTED' | 'RETIRED'
export type AiPermission = 'READ' | 'WRITE' | 'EXECUTE' | 'APPROVE' | 'NONE'
export type AiGuardrailStatus = 'Defined' | 'Partial' | 'Missing' | 'Not Assessed'
export type AiGovernanceStatus = 'Complete' | 'Partial' | 'Gap' | 'Not Assessed'
export type AiPortfolioAction =
  | 'SCALE'
  | 'GOVERN'
  | 'REDESIGN'
  | 'RESTRICT'
  | 'CONSOLIDATE'
  | 'EXPERIMENT'
  | 'RETIRE'
export type AiHumanOversight =
  | 'Every Action'
  | 'Exception-Based'
  | 'Periodic Review'
  | 'Supervisory Monitoring'
  | 'None Documented'
export type AiRiskLevel = 'Critical' | 'High' | 'Medium' | 'Low'

export interface AiModel extends EntityBase {
  provider: string
  modelType: string
  hosting: string
  status: 'Active' | 'Pilot' | 'Deprecated' | 'Retired'
  riskLevel: AiRiskLevel
  isExternalProvider?: boolean
  isSynthetic?: boolean
}

export interface AiToolPermission {
  integrationId: string
  permission: AiPermission
}

export interface AiSolution extends EntityBase {
  solutionType: string
  businessCapabilityIds: string[]
  businessPurpose: string
  lifecycle: AiLifecycle
  businessCriticality: Criticality
  businessOwner?: string
  technicalOwner?: string
  aiOwner?: string
  autonomyLevel: 0 | 1 | 2 | 3 | 4
  humanOversightType: AiHumanOversight
  humanOversightRole?: string
  escalationOwner?: string
  overrideAvailable?: boolean
  agentName?: string
  agentRole?: string
  modelIds: string[]
  dataDomainIds: string[]
  knowledgeSources?: string[]
  toolPermissions: AiToolPermission[]
  applicationIds: string[]
  technologyIds: string[]
  riskLevel: AiRiskLevel
  governanceStatus: AiGovernanceStatus
  governanceDetail?: {
    ownership: AiGovernanceStatus
    dataApproval: AiGovernanceStatus
    humanOversight: AiGovernanceStatus
    permissions: AiGovernanceStatus
    guardrails: AiGovernanceStatus
    monitoring: AiGovernanceStatus
  }
  guardrails?: {
    approvedUseCase: AiGuardrailStatus
    allowedActions: AiGuardrailStatus
    prohibitedActions: AiGuardrailStatus
    approvedData: AiGuardrailStatus
    humanApproval: AiGuardrailStatus
    escalation: AiGuardrailStatus
    outputReview: AiGuardrailStatus
    monitoring: AiGuardrailStatus
  }
  monitoringStatus?: AiGuardrailStatus
  outcomeStatement?: string
  outcomeKpiId?: string
  outcomeBaseline?: string
  outcomeCurrent?: string
  outcomeTarget?: string
  decisionSupported?: string
  findingIds: string[]
  decisionIds: string[]
  initiativeIds: string[]
  portfolioAction: AiPortfolioAction
  portfolioActionReason?: string
  riskFactors?: string[]
  lastReviewedAt?: string
  isSynthetic?: boolean
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
  | AiModel
  | AiSolution
