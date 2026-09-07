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
    'Event or message',
    'File transfer',
    'Database integration',
    'Batch integration',
    'Manual exchange',
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
})

export const dataObjectSchema = entityBase.extend({
  classification: z.string(),
  domain: z.string(),
})

export const technologySchema = entityBase.extend({
  category: z.string(),
  lifecycle: z.enum(['strategic', 'approved', 'tolerated', 'deprecated', 'retire']),
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
})

export type TenantPack = z.infer<typeof tenantPackSchema>
export type GraphScenario = z.infer<typeof graphScenarioSchema>
