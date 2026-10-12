import { z } from 'zod'

const entityStatus = z.enum([
  'active',
  'draft',
  'retired',
  'proposed',
  'approved',
  'rejected',
  'in_progress',
  'completed',
  'open',
  'mitigated',
  'accepted',
])

const dataQuality = z.enum(['high', 'medium', 'low'])
const severity = z.enum(['critical', 'high', 'medium', 'low'])
const criticality = z.enum(['critical', 'high', 'medium', 'low'])

const entityBase = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  status: entityStatus,
  ownerId: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  dataQuality,
  sourceRefs: z.array(z.string()),
  tags: z.array(z.string()),
})

export const tenantSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  shortName: z.string().min(1),
  sector: z.string().min(1),
  country: z.string().min(1),
  story: z.string().min(1),
  synthetic: z.literal(true),
})

export const strategicObjectiveSchema = entityBase.extend({
  horizon: z.string(),
  priority: z.number().int().min(1),
})

export const capabilitySchema = entityBase.extend({
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  parentId: z.string().optional(),
  domain: z.string().min(1),
  maturityCurrent: z.number().min(1).max(5),
  maturityTarget: z.number().min(1).max(5),
  strategicImportance: z.number().min(1).max(5),
  riskScore: z.number().min(0).max(5),
  investmentPriority: z.number().min(1).max(5),
  strategicObjectiveIds: z.array(z.string()),
})

export const processSchema = entityBase.extend({
  capabilityIds: z.array(z.string()),
})

export const applicationSchema = entityBase.extend({
  lifecycle: z.enum(['invest', 'tolerate', 'migrate', 'eliminate', 'strategic', 'legacy']),
  businessValue: z.number().min(1).max(5),
  technicalHealth: z.number().min(1).max(5),
  criticality,
  businessOwnerId: z.string().min(1),
  technologyOwnerId: z.string().min(1),
  annualCostBand: z.enum(['low', 'medium', 'high', 'very-high']),
  userReach: z.number().min(1).max(5),
  dataSensitivity: z.enum(['public', 'internal', 'confidential', 'restricted']),
  deploymentModel: z.enum(['on-prem', 'cloud', 'hybrid', 'saas']),
  vendorProduct: z.string(),
  endOfSupportDate: z.string().optional(),
  strategicAlignment: z.number().min(1).max(5),
  duplicationClusterId: z.string().optional(),
  supportedCapabilityIds: z.array(z.string()),
})

export const integrationSchema = entityBase.extend({
  pattern: z.enum(['api', 'batch', 'point-to-point', 'event', 'file']),
  integrationType: z.enum([
    'REST API',
    'SOAP service',
    'GraphQL API',
    'Event or message',
    'File transfer',
    'Database integration',
    'Batch integration',
    'Manual exchange',
    'ESB / mediation',
    'Message queue',
    'Event stream',
  ]),
  sourceApplicationId: z.string(),
  targetApplicationId: z.string(),
  direction: z.enum(['inbound', 'outbound', 'bidirectional']),
  businessOwnerId: z.string().min(1),
  technologyOwnerId: z.string().min(1),
  supportedCapabilityIds: z.array(z.string()),
  supportedProcessIds: z.array(z.string()),
  apiOrInterfaceName: z.string(),
  protocol: z.string(),
  dataFormat: z.string(),
  authenticationMethod: z.string(),
  environment: z.enum(['production', 'uat', 'development', 'multiple']),
  lifecycleStatus: z.enum(['Planned', 'Active', 'Restricted', 'Deprecated', 'Retiring']),
  criticality,
  reusabilityStatus: z.enum(['reusable', 'candidate', 'point-to-point', 'unknown']),
  consumerCount: z.number().int().min(0),
  transactionVolumeBand: z.enum(['low', 'medium', 'high', 'very-high']),
  availabilityTarget: z.string(),
  dataSensitivity: z.enum(['public', 'internal', 'confidential', 'restricted']),
  lastReviewDate: z.string(),
  documentationStatus: z.enum(['documented', 'partial', 'missing']),
  monitoringStatus: z.enum(['monitored', 'partial', 'unmonitored']),
  pointToPoint: z.boolean(),
  middlewarePlatform: z.string().optional(),
  dataObjectIds: z.array(z.string()),
  technologyIds: z.array(z.string()),
  providerApplicationId: z.string().optional(),
  consumerApplicationIds: z.array(z.string()).optional(),
  integrationOwnerId: z.string().optional(),
  exposure: z.enum(['Internal', 'Partner', 'Public']).optional(),
  portfolioDecision: z
    .enum(['Invest', 'Standardise', 'Reuse', 'Modernise', 'Consolidate', 'Replace', 'Retire'])
    .optional(),
  portfolioLifecycle: z
    .enum(['Strategic', 'Active', 'Legacy', 'Deprecated', 'Retire'])
    .optional(),
  assetType: z
    .enum(['API', 'Event', 'Service', 'Batch', 'Point-to-Point', 'Database Integration'])
    .optional(),
  integrationPattern: z.string().optional(),
  architectureRisk: severity.optional(),
  standardsCompliance: z.enum(['Compliant', 'Partial', 'Non-Compliant']).optional(),
  reuseClassification: z
    .enum(['Enterprise Reusable', 'Multi-Consumer', 'Single Consumer'])
    .optional(),
  runtime: z.string().optional(),
  gateway: z.string().optional(),
  securityClassification: z.string().optional(),
  resilienceStatus: severity.optional(),
  observabilityStatus: z.enum(['Observed', 'Partial', 'Blind']).optional(),
  standardIds: z.array(z.string()).optional(),
  initiativeIds: z.array(z.string()).optional(),
  recommendationWhy: z.string().optional(),
  recommendationAction: z.string().optional(),
  isSynthetic: z.boolean().optional(),
})

export const dataObjectSchema = entityBase.extend({
  classification: z.string(),
  domain: z.string(),
  type: z.enum(['Data Domain', 'Data Product', 'Key Information Entity']).optional(),
  businessMeaning: z.string().optional(),
  businessCapabilityIds: z.array(z.string()).optional(),
  businessServiceIds: z.array(z.string()).optional(),
  criticality: criticality.optional(),
  businessOwner: z.string().nullable().optional(),
  dataSteward: z.string().nullable().optional(),
  technicalCustodian: z.string().nullable().optional(),
  authoritativeSourceStatus: z
    .enum(['Confirmed', 'Multiple Sources', 'Under Review', 'Unknown'])
    .optional(),
  systemOfRecordApplicationId: z.string().nullable().optional(),
  primaryApplicationId: z.string().nullable().optional(),
  sourceApplicationIds: z.array(z.string()).optional(),
  consumerApplicationIds: z.array(z.string()).optional(),
  integrationIds: z.array(z.string()).optional(),
  classificationLabel: z
    .enum(['Public', 'Internal', 'Confidential', 'Restricted', 'Highly Sensitive'])
    .optional(),
  containsPersonalData: z.boolean().optional(),
  containsFinancialData: z.boolean().optional(),
  sensitive: z.boolean().optional(),
  residencyRequirement: z.string().optional(),
  hostingLocation: z.string().optional(),
  crossBorderStatus: z.enum(['Yes', 'No', 'Under Review', 'Unknown']).optional(),
  residencyStatus: z.enum(['Compliant', 'Review Required', 'Cross-Border', 'Unknown']).optional(),
  qualityStatus: z.enum(['Good', 'Watch', 'Poor', 'Not Assessed']).optional(),
  completenessStatus: z.enum(['Good', 'Watch', 'Poor', 'Not Assessed']).optional(),
  accuracyStatus: z.enum(['Good', 'Watch', 'Poor', 'Not Assessed']).optional(),
  timelinessStatus: z.enum(['Good', 'Watch', 'Poor', 'Not Assessed']).optional(),
  consistencyStatus: z.enum(['Good', 'Watch', 'Poor', 'Not Assessed']).optional(),
  risk: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
  governanceMaturity: z.enum(['Low', 'Medium', 'High']).optional(),
  aiReadiness: z.enum(['Ready', 'Conditional', 'Not Ready', 'Not Assessed']).optional(),
  aiReadinessReason: z.string().optional(),
  aiReadinessFactors: z.array(z.string()).optional(),
  futureAiUses: z.array(z.string()).optional(),
  dataProducts: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
  dataProductIds: z.array(z.string()).optional(),
  keyEntityNames: z.array(z.string()).optional(),
  findingIds: z.array(z.string()).optional(),
  standardIds: z.array(z.string()).optional(),
  policyIds: z.array(z.string()).optional(),
  decisionIds: z.array(z.string()).optional(),
  initiativeIds: z.array(z.string()).optional(),
  portfolioAction: z
    .enum([
      'Govern',
      'Consolidate',
      'Improve Quality',
      'Modernise',
      'Enable Reuse',
      'Protect',
      'Retire',
    ])
    .optional(),
  portfolioActionReason: z.string().optional(),
  evidenceConfidence: dataQuality.optional(),
  lastReviewedAt: z.string().optional(),
  duplicationGroupId: z.string().optional(),
  duplicationNote: z.string().optional(),
  flowSteps: z
    .array(
      z.object({
        label: z.string(),
        kind: z.enum(['application', 'integration', 'data', 'other']),
        entityId: z.string().optional(),
      }),
    )
    .optional(),
  regulatoryImportance: z.string().optional(),
  citizenImpact: z.string().optional(),
  isSynthetic: z.boolean().optional(),
})

const technologyLifecycle = z.enum([
  'strategic',
  'approved',
  'tolerated',
  'deprecated',
  'retire',
  'end-of-support-risk',
])

export const technologySchema = entityBase.extend({
  category: z.string(),
  subcategory: z.string().optional(),
  lifecycle: technologyLifecycle,
  vendor: z.string().optional(),
  version: z.string().optional(),
  targetLifecycle: technologyLifecycle.optional(),
  targetLifecycleDate: z.string().optional(),
  targetLifecycleReason: z.string().optional(),
  deploymentModel: z
    .enum(['on-premise', 'private-cloud', 'public-cloud', 'hybrid', 'saas'])
    .optional(),
  environments: z.array(z.string()).optional(),
  technologyOwner: z.string().optional(),
  platformOwner: z.string().optional(),
  operationalOwner: z.string().optional(),
  applicationIds: z.array(z.string()).optional(),
  integrationIds: z.array(z.string()).optional(),
  dataDomainIds: z.array(z.string()).optional(),
  criticalApplicationCount: z.number().optional(),
  standardIds: z.array(z.string()).optional(),
  standardStatus: z
    .enum(['Standard', 'Exception', 'Under Review', 'Not Assessed'])
    .optional(),
  exceptionIds: z.array(z.string()).optional(),
  architectureRisk: z.enum(['Critical', 'High', 'Medium', 'Low']).optional(),
  resilienceStatus: z.enum(['Meets Target', 'Gap', 'Not Assessed']).optional(),
  securityReviewStatus: z.enum(['Approved', 'Review Required', 'Not Assessed']).optional(),
  haStatus: z.enum(['Yes', 'Partial', 'No', 'Unknown']).optional(),
  drStatus: z.enum(['Meets Target', 'Gap', 'Not Assessed']).optional(),
  rtoTier: z.string().optional(),
  rpoTier: z.string().optional(),
  supportStatus: z.string().optional(),
  supportEndDate: z.string().optional(),
  supportEndDateSynthetic: z.boolean().optional(),
  findingIds: z.array(z.string()).optional(),
  decisionIds: z.array(z.string()).optional(),
  initiativeIds: z.array(z.string()).optional(),
  portfolioDecision: z
    .enum(['INVEST', 'STANDARDISE', 'MODERNISE', 'CONSOLIDATE', 'TOLERATE', 'REPLACE', 'RETIRE'])
    .optional(),
  portfolioDecisionReason: z.string().optional(),
  lastReviewedAt: z.string().optional(),
  isSynthetic: z.boolean().optional(),
})

export const evidenceSchema = entityBase.extend({
  evidenceType: z.enum([
    'document',
    'interview',
    'system-extract',
    'policy',
    'observation',
    'assessment-response',
    'application-inventory',
    'architecture-document',
    'operational-report',
    'incident-summary',
    'risk-register',
    'standards-review',
    'stakeholder-observation',
    'integration-inventory',
    'technology-lifecycle',
  ]),
  confidence: dataQuality,
  linkedObjectIds: z.array(z.string()),
  sourceName: z.string().optional(),
  sourceReference: z.string().optional(),
  sourceDate: z.string().optional(),
  capturedDate: z.string().optional(),
  freshness: z.enum(['fresh', 'aging', 'stale']).optional(),
  reliability: dataQuality.optional(),
  verificationStatus: z
    .enum(['unverified', 'verified', 'disputed', 'stale', 'missing'])
    .optional(),
  relatedFindingIds: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
  previewText: z.string().optional(),
})

export const findingSchema = entityBase.extend({
  category: z.string(),
  severity,
  problemStatement: z.string(),
  rootCause: z.string(),
  businessImpact: z.string(),
  urgency: severity,
  evidenceIds: z.array(z.string()),
  linkedObjectIds: z.array(z.string()),
  targetDate: z.string(),
  recommendedAction: z.string(),
  workflowStatus: z.string().optional(),
  likelihood: z.number().min(1).max(5).optional(),
  impactScore: z.number().min(1).max(5).optional(),
  riskScore: z.number().min(1).max(25).optional(),
  businessOwnerId: z.string().optional(),
  architectureOwnerId: z.string().optional(),
  dateIdentified: z.string().optional(),
  lastReviewedDate: z.string().optional(),
  relatedRiskIds: z.array(z.string()).optional(),
  recommendationIds: z.array(z.string()).optional(),
  decisionIds: z.array(z.string()).optional(),
  initiativeIds: z.array(z.string()).optional(),
  domain: z.string().optional(),
  confidenceScore: z.number().min(0).max(100).optional(),
})

export const recommendationSchema = entityBase.extend({
  outcome: z.string(),
  findingIds: z.array(z.string()),
  affectedCapabilityIds: z.array(z.string()),
  affectedApplicationIds: z.array(z.string()),
  optionsConsidered: z.array(z.string()),
  expectedValue: z.string(),
  riskReduction: z.string(),
  effortBand: z.enum(['S', 'M', 'L', 'XL']),
  confidence: dataQuality,
  assumptions: z.array(z.string()),
  workflowStatus: z.string().optional(),
  intendedOutcome: z.string().optional(),
  recommendedAction: z.string().optional(),
  preferredOption: z.string().optional(),
  expectedBenefit: z.string().optional(),
  expectedRiskReduction: z.string().optional(),
  costBand: z.string().optional(),
  complexity: z.enum(['low', 'medium', 'high']).optional(),
  dependencies: z.array(z.string()).optional(),
  evidenceIds: z.array(z.string()).optional(),
  affectedIntegrationIds: z.array(z.string()).optional(),
  objectiveIds: z.array(z.string()).optional(),
  kpiIds: z.array(z.string()).optional(),
  decisionId: z.string().optional(),
  targetDecisionDate: z.string().optional(),
  reviewComments: z
    .array(
      z.object({
        id: z.string(),
        at: z.string(),
        authorRole: z.string(),
        text: z.string(),
      }),
    )
    .optional(),
})

export const decisionSchema = entityBase.extend({
  decisionType: z.string(),
  decisionStatus: z.string(),
  decisionDate: z.string().optional(),
  decisionAuthority: z.string(),
  reviewerIds: z.array(z.string()),
  recommendationId: z.string(),
  optionsConsidered: z.array(z.string()),
  selectedOption: z.string().optional(),
  rationale: z.string().optional(),
  conditions: z.array(z.string()).optional(),
  exceptions: z.array(z.string()).optional(),
  expiryReviewDate: z.string().optional(),
  evidenceIds: z.array(z.string()),
  affectedObjectIds: z.array(z.string()),
  initiativeId: z.string().optional(),
  submittedAt: z.string().optional(),
  decisionDeadline: z.string().optional(),
  businessDomain: z.string().optional(),
  riskSeverity: severity.optional(),
  expectedValue: z.string().optional(),
  requiredReviewerIds: z.array(z.string()).optional(),
})

const initiativeDeliveryStatus = z.enum([
  'Proposed',
  'Planned',
  'In Progress',
  'At Risk',
  'Completed',
  'On Hold',
])
const architectureReadiness = z.enum([
  'Ready',
  'Ready with Conditions',
  'Decision Required',
  'Blocked',
  'Not Assessed',
])
const strategicPriority = z.enum(['Critical', 'High', 'Medium', 'Low'])
const architectureRiskLevel = z.enum(['Critical', 'High', 'Medium', 'Low'])

export const initiativeSchema = entityBase.extend({
  recommendationIds: z.array(z.string()),
  objectiveIds: z.array(z.string()),
  capabilityIds: z.array(z.string()),
  horizon: z.enum(['now', 'next', 'later']),
  expectedValue: z.string(),
  costBand: z.string(),
  riskReduction: z.string(),
  progressPercent: z.number().min(0).max(100),
  decisionId: z.string().optional(),
  applicationIds: z.array(z.string()).optional(),
  integrationIds: z.array(z.string()).optional(),
  findingIds: z.array(z.string()).optional(),
  kpiIds: z.array(z.string()).optional(),
  dependsOnInitiativeIds: z.array(z.string()).optional(),
  targetQuarter: z.string().optional(),
  targetPeriod: z.string().optional(),
  intendedOutcome: z.string().optional(),
  effortBand: z.string().optional(),
  blocked: z.boolean().optional(),
  initiativeStatus: initiativeDeliveryStatus.optional(),
  strategicPriority: strategicPriority.optional(),
  architectureReadiness: architectureReadiness.optional(),
  architectureRisk: architectureRiskLevel.optional(),
  executiveSponsorId: z.string().optional(),
  initiativeOwnerId: z.string().optional(),
  architectureOwnerId: z.string().optional(),
  businessProblem: z.string().optional(),
  expectedOutcome: z.string().optional(),
  capabilityImpacts: z
    .array(
      z.object({
        capabilityId: z.string(),
        impact: z.enum(['Enable', 'Improve', 'Transform', 'Retire']),
      }),
    )
    .optional(),
  applicationImpacts: z
    .array(
      z.object({
        applicationId: z.string(),
        impact: z.enum(['Introduce', 'Change', 'Migrate', 'Retire', 'Dependency']),
      }),
    )
    .optional(),
  integrationImpacts: z
    .array(
      z.object({
        integrationId: z.string(),
        impact: z.enum(['Introduce', 'Change', 'Migrate', 'Retire', 'Reuse']),
      }),
    )
    .optional(),
  dataImpacts: z
    .array(
      z.object({
        dataObjectId: z.string(),
        impact: z.enum([
          'Introduce',
          'Improve',
          'Migrate',
          'Retire',
          'Reuse',
          'Establish Source',
        ]),
      }),
    )
    .optional(),
  technologyImpacts: z
    .array(
      z.object({
        technologyId: z.string(),
        impact: z.enum(['Introduce', 'Retain', 'Modernise', 'Retire', 'Dependency']),
      }),
    )
    .optional(),
  aiImpacts: z
    .array(
      z.object({
        aiSolutionId: z.string(),
        impact: z.enum(['Introduce', 'Change', 'Reuse', 'Retire']),
      }),
    )
    .optional(),
  decisionIds: z.array(z.string()).optional(),
  outstandingDecisionIds: z.array(z.string()).optional(),
  standardIds: z.array(z.string()).optional(),
  standardCompliance: z
    .array(
      z.object({
        standardId: z.string(),
        compliance: z.enum(['Aligned', 'Partial', 'Exception']),
      }),
    )
    .optional(),
  exceptionIds: z.array(z.string()).optional(),
  exceptionsDetail: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        standardId: z.string().optional(),
        expiryDate: z.string().optional(),
      }),
    )
    .optional(),
  enablesInitiativeIds: z.array(z.string()).optional(),
  conflictInitiativeIds: z.array(z.string()).optional(),
  overlapInitiativeIds: z.array(z.string()).optional(),
  dependencyReasons: z
    .array(z.object({ initiativeId: z.string(), reason: z.string() }))
    .optional(),
  conflictNotes: z.string().optional(),
  overlapNotes: z.string().optional(),
  risksReduced: z.array(z.string()).optional(),
  risksIntroduced: z.array(z.string()).optional(),
  lastArchitectureReview: z.string().optional(),
  nextArchitectureReview: z.string().optional(),
  roadmapPhase: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  valueMeasureDefined: z.boolean().optional(),
  baselineDefined: z.boolean().optional(),
  targetDefined: z.boolean().optional(),
  currentMeasurement: z.enum(['Available', 'Pending']).optional(),
  isSynthetic: z.boolean().optional(),
})

export const kpiSchema = entityBase.extend({
  unit: z.string(),
  currentValue: z.number(),
  targetValue: z.number(),
  direction: z.enum(['higher-better', 'lower-better']),
  linkedObjectiveIds: z.array(z.string()),
  category: z.string().optional(),
  baselineValue: z.number().optional(),
  measurementFrequency: z.string().optional(),
  expectedContribution: z.string().optional(),
  confidence: dataQuality.optional(),
  linkedInitiativeIds: z.array(z.string()).optional(),
})

export const auditEventSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  action: z.string(),
  actorRole: z.string(),
  timestamp: z.string(),
  entityId: z.string(),
  entityType: z.string(),
  previousState: z.string().optional(),
  newState: z.string().optional(),
  comment: z.string().optional(),
})

export const relationshipSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  sourceId: z.string().min(1),
  sourceType: z.string().min(1),
  targetId: z.string().min(1),
  targetType: z.string().min(1),
  relationshipType: z.string().min(1),
  description: z.string().optional(),
  criticality: criticality.optional(),
  evidenceIds: z.array(z.string()),
})

export const graphScenarioSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  name: z.string().min(1),
  summary: z.string(),
  keyRisk: z.string(),
  startingEntityId: z.string().min(1),
  startingEntityType: z.string().min(1),
  visibleEntityIds: z.array(z.string()),
  affectedCapabilityIds: z.array(z.string()),
  evidenceIds: z.array(z.string()),
  findingId: z.string().min(1),
  recommendedAction: z.string(),
  topologyFocusIntegrationIds: z.array(z.string()),
})

const aiLifecycle = z.enum(['EXPERIMENT', 'APPROVED', 'PRODUCTION', 'RESTRICTED', 'RETIRED'])
const aiPermission = z.enum(['READ', 'WRITE', 'EXECUTE', 'APPROVE', 'NONE'])
const aiGuardrailStatus = z.enum(['Defined', 'Partial', 'Missing', 'Not Assessed'])
const aiGovernanceStatus = z.enum(['Complete', 'Partial', 'Gap', 'Not Assessed'])
const aiPortfolioAction = z.enum([
  'SCALE',
  'GOVERN',
  'REDESIGN',
  'RESTRICT',
  'CONSOLIDATE',
  'EXPERIMENT',
  'RETIRE',
])
const aiHumanOversight = z.enum([
  'Every Action',
  'Exception-Based',
  'Periodic Review',
  'Supervisory Monitoring',
  'None Documented',
])

export const aiModelSchema = entityBase.extend({
  provider: z.string().min(1),
  modelType: z.string().min(1),
  hosting: z.string().min(1),
  status: z.enum(['Active', 'Pilot', 'Deprecated', 'Retired']),
  riskLevel: z.enum(['Critical', 'High', 'Medium', 'Low']),
  isExternalProvider: z.boolean().optional(),
  isSynthetic: z.boolean().optional(),
})

export const aiSolutionSchema = entityBase.extend({
  solutionType: z.string().min(1),
  businessCapabilityIds: z.array(z.string()).min(1),
  businessPurpose: z.string().min(1),
  lifecycle: aiLifecycle,
  businessCriticality: criticality,
  businessOwner: z.string().optional(),
  technicalOwner: z.string().optional(),
  aiOwner: z.string().optional(),
  autonomyLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  humanOversightType: aiHumanOversight,
  humanOversightRole: z.string().optional(),
  escalationOwner: z.string().optional(),
  overrideAvailable: z.boolean().optional(),
  agentName: z.string().optional(),
  agentRole: z.string().optional(),
  modelIds: z.array(z.string()),
  dataDomainIds: z.array(z.string()),
  knowledgeSources: z.array(z.string()).optional(),
  toolPermissions: z.array(
    z.object({
      integrationId: z.string(),
      permission: aiPermission,
    }),
  ),
  applicationIds: z.array(z.string()),
  technologyIds: z.array(z.string()),
  riskLevel: z.enum(['Critical', 'High', 'Medium', 'Low']),
  governanceStatus: aiGovernanceStatus,
  governanceDetail: z
    .object({
      ownership: aiGovernanceStatus,
      dataApproval: aiGovernanceStatus,
      humanOversight: aiGovernanceStatus,
      permissions: aiGovernanceStatus,
      guardrails: aiGovernanceStatus,
      monitoring: aiGovernanceStatus,
    })
    .optional(),
  guardrails: z
    .object({
      approvedUseCase: aiGuardrailStatus,
      allowedActions: aiGuardrailStatus,
      prohibitedActions: aiGuardrailStatus,
      approvedData: aiGuardrailStatus,
      humanApproval: aiGuardrailStatus,
      escalation: aiGuardrailStatus,
      outputReview: aiGuardrailStatus,
      monitoring: aiGuardrailStatus,
    })
    .optional(),
  monitoringStatus: aiGuardrailStatus.optional(),
  outcomeStatement: z.string().optional(),
  outcomeKpiId: z.string().optional(),
  outcomeBaseline: z.string().optional(),
  outcomeCurrent: z.string().optional(),
  outcomeTarget: z.string().optional(),
  decisionSupported: z.string().optional(),
  findingIds: z.array(z.string()),
  decisionIds: z.array(z.string()),
  initiativeIds: z.array(z.string()),
  portfolioAction: aiPortfolioAction,
  portfolioActionReason: z.string().optional(),
  riskFactors: z.array(z.string()).optional(),
  lastReviewedAt: z.string().optional(),
  isSynthetic: z.boolean().optional(),
})

export const tenantPackSchema = z.object({
  tenant: tenantSchema,
  strategicObjectives: z.array(strategicObjectiveSchema),
  capabilities: z.array(capabilitySchema),
  processes: z.array(processSchema),
  applications: z.array(applicationSchema),
  integrations: z.array(integrationSchema),
  dataObjects: z.array(dataObjectSchema),
  technologies: z.array(technologySchema),
  evidence: z.array(evidenceSchema),
  findings: z.array(findingSchema),
  recommendations: z.array(recommendationSchema),
  decisions: z.array(decisionSchema).default([]),
  initiatives: z.array(initiativeSchema),
  kpis: z.array(kpiSchema),
  relationships: z.array(relationshipSchema),
  scenarios: z.array(graphScenarioSchema).default([]),
  auditHistory: z.array(auditEventSchema).default([]),
  aiModels: z.array(aiModelSchema).default([]),
  aiSolutions: z.array(aiSolutionSchema).default([]),
})

export type TenantPack = z.infer<typeof tenantPackSchema>
export type AiModel = z.infer<typeof aiModelSchema>
export type AiSolution = z.infer<typeof aiSolutionSchema>
export type GraphScenario = z.infer<typeof graphScenarioSchema>
