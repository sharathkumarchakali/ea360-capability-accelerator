import type {
  Application,
  Capability,
  Criticality,
  Finding,
  Initiative,
  Integration,
  IntegrationAssetType,
  IntegrationExposure,
  IntegrationPortfolioDecision,
  IntegrationPortfolioLifecycle,
  IntegrationReuseClass,
  Severity,
  StandardsComplianceStatus,
} from '../../domain/entities/types'
import {
  integrationRiskScore,
  isPointToPoint,
  missingOwner,
} from '../../domain/metrics/integration'

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low'
export type MatrixQuadrant = 'Protect' | 'Prioritise' | 'Simplify' | 'Monitor'

export type PortfolioIntegration = {
  int: Integration
  assetType: IntegrationAssetType
  integrationPattern: string
  exposure: IntegrationExposure
  portfolioDecision: IntegrationPortfolioDecision
  lifecycleStage: IntegrationPortfolioLifecycle
  architectureRisk: RiskLevel
  standardsCompliance: StandardsComplianceStatus
  reuseClassification: IntegrationReuseClass
  providerApplicationId: string
  consumerApplicationIds: string[]
  providerName: string
  consumerNames: string[]
  businessOwnerLabel: string | null
  technicalOwnerLabel: string | null
  integrationOwnerLabel: string | null
  ownershipGap: boolean
  capabilityNames: string[]
  platform: string
  runtime: string
  gateway: string
  securityClassification: string
  resilienceStatus: RiskLevel
  observabilityStatus: 'Observed' | 'Partial' | 'Blind'
  recommendationWhy: string
  recommendationAction: string
  inTransformation: boolean
  matrixQuadrant: MatrixQuadrant
  riskScore: number
  criticalityScore: number
  riskNumeric: number
  standardIds: string[]
  initiativeIds: string[]
}

export const PORTFOLIO_DECISIONS: IntegrationPortfolioDecision[] = [
  'Invest',
  'Standardise',
  'Reuse',
  'Modernise',
  'Consolidate',
  'Replace',
  'Retire',
]

export const PORTFOLIO_LIFECYCLES: IntegrationPortfolioLifecycle[] = [
  'Strategic',
  'Active',
  'Legacy',
  'Deprecated',
  'Retire',
]

export const PATTERN_MIX_KEYS = [
  'Managed API',
  'Event / Streaming',
  'Service Integration',
  'Point-to-Point',
  'Batch / File',
  'Database Integration',
] as const

export const DECISION_COLORS: Record<IntegrationPortfolioDecision, string> = {
  Invest: '#1E8CAA',
  Standardise: '#0D6B7A',
  Reuse: '#62E0C8',
  Modernise: '#C47B2C',
  Consolidate: '#A76B5B',
  Replace: '#B45309',
  Retire: '#B42318',
}

export const INTEGRATION_STANDARDS: Record<string, { id: string; name: string }> = {
  'STD-API-001': { id: 'STD-API-001', name: 'Enterprise API Design Standard' },
  'STD-SEC-004': { id: 'STD-SEC-004', name: 'External API Security Control' },
  'STD-INT-002': { id: 'STD-INT-002', name: 'Approved Integration Patterns' },
  'STD-EVT-001': { id: 'STD-EVT-001', name: 'Enterprise Event Design Standard' },
  'STD-DAT-003': { id: 'STD-DAT-003', name: 'Data Exchange and Lineage Control' },
}

const UNKNOWN_OWNER = /unknown|unassigned|none|tbd/i

export function personLabel(id?: string | null): string | null {
  if (!id || UNKNOWN_OWNER.test(id)) return null
  return id
    .replace(/^person-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function titleRisk(s?: Severity | RiskLevel | string | null): RiskLevel | null {
  if (!s) return null
  const v = String(s).toLowerCase()
  if (v === 'critical') return 'Critical'
  if (v === 'high') return 'High'
  if (v === 'medium') return 'Medium'
  if (v === 'low') return 'Low'
  return null
}

function scoreToRisk(score: number): RiskLevel {
  if (score >= 70) return 'Critical'
  if (score >= 50) return 'High'
  if (score >= 30) return 'Medium'
  return 'Low'
}

function isElevated(r: RiskLevel) {
  return r === 'Critical' || r === 'High'
}

function isHighCrit(c: Criticality) {
  return c === 'critical' || c === 'high'
}

function criticalityScore(c: Criticality): number {
  if (c === 'critical') return 4
  if (c === 'high') return 3
  if (c === 'medium') return 2
  return 1
}

function riskScoreOf(r: RiskLevel): number {
  if (r === 'Critical') return 4
  if (r === 'High') return 3
  if (r === 'Medium') return 2
  return 1
}

export function resolveAssetType(i: Integration): IntegrationAssetType {
  if (i.assetType) return i.assetType
  if (i.integrationType === 'Database integration') return 'Database Integration'
  if (i.pointToPoint || i.pattern === 'point-to-point') return 'Point-to-Point'
  if (
    i.integrationType === 'Event or message' ||
    i.integrationType === 'Event stream' ||
    i.integrationType === 'Message queue' ||
    i.pattern === 'event'
  ) {
    return 'Event'
  }
  if (
    i.integrationType === 'Batch integration' ||
    i.integrationType === 'File transfer' ||
    i.integrationType === 'Manual exchange' ||
    i.pattern === 'batch' ||
    i.pattern === 'file'
  ) {
    return 'Batch'
  }
  if (i.integrationType === 'ESB / mediation') return 'Service'
  if (
    i.integrationType === 'REST API' ||
    i.integrationType === 'SOAP service' ||
    i.integrationType === 'GraphQL API' ||
    i.pattern === 'api'
  ) {
    return 'API'
  }
  return 'Service'
}

export function resolveIntegrationPattern(i: Integration): string {
  if (i.integrationPattern) return i.integrationPattern
  const asset = resolveAssetType(i)
  if (asset === 'Point-to-Point') return 'Point-to-Point'
  if (asset === 'Database Integration') return 'Database Integration'
  if (asset === 'Batch') return 'Batch / File'
  if (asset === 'Event') return 'Event / Streaming'
  if (asset === 'Service' || i.middlewarePlatform) return 'Service Integration'
  if (asset === 'API' && !isPointToPoint(i)) return 'Managed API'
  return 'Service Integration'
}

export function resolveProviderId(i: Integration): string {
  if (i.providerApplicationId) return i.providerApplicationId
  if (
    i.pattern === 'event' ||
    i.integrationType === 'Event or message' ||
    i.integrationType === 'Event stream' ||
    i.integrationType === 'Message queue'
  ) {
    return i.sourceApplicationId
  }
  return i.targetApplicationId
}

export function resolveConsumerIds(i: Integration): string[] {
  if (i.consumerApplicationIds?.length) return [...new Set(i.consumerApplicationIds)]
  const provider = resolveProviderId(i)
  const fallback =
    provider === i.sourceApplicationId ? i.targetApplicationId : i.sourceApplicationId
  return fallback ? [fallback] : []
}

export function resolveExposure(i: Integration): IntegrationExposure {
  if (i.exposure) return i.exposure
  if (i.dataSensitivity === 'public' || (i.tags || []).includes('public')) return 'Public'
  if ((i.tags || []).includes('partner') || i.dataSensitivity === 'restricted') {
    if ((i.tags || []).includes('partner')) return 'Partner'
  }
  if ((i.tags || []).includes('partner')) return 'Partner'
  return 'Internal'
}

export function resolveLifecycleStage(i: Integration): IntegrationPortfolioLifecycle {
  if (i.portfolioLifecycle) return i.portfolioLifecycle
  switch (i.lifecycleStatus) {
    case 'Planned':
      return 'Strategic'
    case 'Active':
      return i.criticality === 'critical' && i.reusabilityStatus === 'reusable'
        ? 'Strategic'
        : 'Active'
    case 'Restricted':
      return 'Legacy'
    case 'Deprecated':
      return 'Deprecated'
    case 'Retiring':
      return 'Retire'
    default:
      return 'Active'
  }
}

/**
 * Prefer seeded portfolio decisions. Fallback maps lifecycle / pattern intent
 * without a crude scoring formula.
 */
export function resolvePortfolioDecision(i: Integration): IntegrationPortfolioDecision {
  if (i.portfolioDecision) return i.portfolioDecision
  if (i.lifecycleStatus === 'Retiring' || i.lifecycleStatus === 'Deprecated') {
    if (i.pointToPoint || i.integrationType === 'Database integration') return 'Replace'
    return 'Retire'
  }
  if ((i.tags || []).includes('duplicate')) return 'Consolidate'
  if (i.pointToPoint && (i.criticality === 'critical' || i.criticality === 'high')) {
    return 'Modernise'
  }
  if (i.reusabilityStatus === 'reusable' && i.consumerCount >= 3) return 'Reuse'
  if (i.lifecycleStatus === 'Planned' || i.reusabilityStatus === 'candidate') return 'Invest'
  if (i.documentationStatus === 'partial' || i.monitoringStatus === 'partial') return 'Standardise'
  if (i.lifecycleStatus === 'Restricted') return 'Modernise'
  return 'Standardise'
}

export function resolveReuse(i: Integration): IntegrationReuseClass {
  if (i.reuseClassification) return i.reuseClassification
  if (i.reusabilityStatus === 'reusable' && i.consumerCount >= 3) return 'Enterprise Reusable'
  if (i.consumerCount >= 2 || i.reusabilityStatus === 'candidate') return 'Multi-Consumer'
  return 'Single Consumer'
}

function resolveStandards(i: Integration): StandardsComplianceStatus {
  if (i.standardsCompliance) return i.standardsCompliance
  if (i.integrationType === 'Database integration' && i.pointToPoint) return 'Non-Compliant'
  if (i.documentationStatus === 'missing' || i.authenticationMethod === 'basic') {
    return 'Non-Compliant'
  }
  if (i.documentationStatus === 'partial' || i.monitoringStatus === 'partial') return 'Partial'
  if (i.pointToPoint) return 'Partial'
  return 'Compliant'
}

function resolveArchitectureRisk(i: Integration): RiskLevel {
  const seeded = titleRisk(i.architectureRisk)
  if (seeded) return seeded
  return scoreToRisk(integrationRiskScore(i))
}

function resolveResilience(i: Integration): RiskLevel {
  const seeded = titleRisk(i.resilienceStatus)
  if (seeded) return seeded
  if (i.criticality === 'critical' && (i.pointToPoint || i.monitoringStatus === 'unmonitored')) {
    return 'Critical'
  }
  if (i.monitoringStatus === 'unmonitored') return 'High'
  if (i.monitoringStatus === 'partial') return 'Medium'
  return 'Low'
}

function resolveObservability(i: Integration): 'Observed' | 'Partial' | 'Blind' {
  if (i.observabilityStatus) return i.observabilityStatus
  if (i.monitoringStatus === 'monitored') return 'Observed'
  if (i.monitoringStatus === 'partial') return 'Partial'
  return 'Blind'
}

export function resolveMatrixQuadrant(
  criticality: Criticality,
  architectureRisk: RiskLevel,
): MatrixQuadrant {
  const hiC = isHighCrit(criticality)
  const hiR = isElevated(architectureRisk)
  if (hiC && !hiR) return 'Protect'
  if (hiC && hiR) return 'Prioritise'
  if (!hiC && hiR) return 'Simplify'
  return 'Monitor'
}

function recommendationCopy(
  decision: IntegrationPortfolioDecision,
  i: Integration,
  risk: RiskLevel,
): { why: string; action: string } {
  if (i.recommendationWhy && i.recommendationAction) {
    return { why: i.recommendationWhy, action: i.recommendationAction }
  }
  switch (decision) {
    case 'Invest':
      return {
        why: `Strategic integration capability with ${i.criticality} business criticality and an approved platform path.`,
        action: 'Fund delivery and protect funding through the next architecture review cycle.',
      }
    case 'Standardise':
      return {
        why: `Current integration remains valuable but ownership, documentation or observability controls require strengthening (${risk.toLowerCase()} risk).`,
        action: 'Align to enterprise integration standards and confirm accountable ownership.',
      }
    case 'Reuse':
      return {
        why: 'Multiple consumers already depend on this interface; promoting it as an enterprise reusable service reduces duplication.',
        action: 'Publish as a reusable enterprise service and migrate remaining point-to-point consumers.',
      }
    case 'Modernise':
      return {
        why: 'Business value remains but the implementation pattern, lifecycle or monitoring posture create avoidable risk.',
        action: 'Modernise onto an approved API, event or mediated service pattern.',
      }
    case 'Consolidate':
      return {
        why: 'Overlapping interfaces serve similar capability needs and inflate integration cost and ownership burden.',
        action: 'Confirm the canonical interface and plan consumer cutover with capability owners.',
      }
    case 'Replace':
      return {
        why: 'Current pattern violates approved integration standards or creates concentration risk on a fragile path.',
        action: 'Replace with an approved service or API integration pattern and decommission the legacy path.',
      }
    case 'Retire':
      return {
        why: 'Integration no longer provides sufficient value relative to operational and compliance cost.',
        action: 'Confirm decommission plan, data retention and consumer cutover before retirement.',
      }
    default:
      return {
        why: 'Retain under active architecture oversight.',
        action: 'Revisit portfolio decision at the next integration review.',
      }
  }
}

function appName(id: string, apps: Application[]): string {
  return apps.find((a) => a.id === id)?.name || id
}

export function enrichIntegration(
  i: Integration,
  ctx: {
    applications: Application[]
    capabilities: Capability[]
    initiatives: Initiative[]
  },
): PortfolioIntegration {
  const providerApplicationId = resolveProviderId(i)
  const consumerApplicationIds = resolveConsumerIds(i)
  const assetType = resolveAssetType(i)
  const integrationPattern = resolveIntegrationPattern(i)
  const exposure = resolveExposure(i)
  const portfolioDecision = resolvePortfolioDecision(i)
  const lifecycleStage = resolveLifecycleStage(i)
  const architectureRisk = resolveArchitectureRisk(i)
  const standardsCompliance = resolveStandards(i)
  const reuseClassification = resolveReuse(i)
  const businessOwnerLabel = personLabel(i.businessOwnerId)
  const technicalOwnerLabel = personLabel(i.technologyOwnerId)
  const integrationOwnerLabel = personLabel(i.integrationOwnerId || i.ownerId)
  const ownershipGap =
    missingOwner(i) || !businessOwnerLabel || !technicalOwnerLabel || !integrationOwnerLabel
  const caps = i.supportedCapabilityIds
    .map((id) => ctx.capabilities.find((c) => c.id === id))
    .filter(Boolean) as Capability[]
  const initiativeIds = [
    ...(i.initiativeIds || []),
    ...ctx.initiatives
      .filter((init) => (init.integrationIds || []).includes(i.id))
      .map((init) => init.id),
  ]
  const uniqueInitIds = [...new Set(initiativeIds)]
  const inTransformation = ctx.initiatives.some(
    (init) =>
      uniqueInitIds.includes(init.id) &&
      !['completed', 'cancelled', 'retired'].includes((init.status || '').toLowerCase()),
  )
  const { why, action } = recommendationCopy(portfolioDecision, i, architectureRisk)
  const resilienceStatus = resolveResilience(i)
  const observabilityStatus = resolveObservability(i)

  return {
    int: i,
    assetType,
    integrationPattern,
    exposure,
    portfolioDecision,
    lifecycleStage,
    architectureRisk,
    standardsCompliance,
    reuseClassification,
    providerApplicationId,
    consumerApplicationIds,
    providerName: appName(providerApplicationId, ctx.applications),
    consumerNames: consumerApplicationIds.map((id) => appName(id, ctx.applications)),
    businessOwnerLabel,
    technicalOwnerLabel,
    integrationOwnerLabel,
    ownershipGap,
    capabilityNames: caps.map((c) => c.name),
    platform: i.middlewarePlatform || 'Direct / none',
    runtime: i.runtime || (i.middlewarePlatform ? 'Platform-managed' : 'Application-hosted'),
    gateway: i.gateway || (i.middlewarePlatform ? 'API Gateway' : '—'),
    securityClassification:
      i.securityClassification ||
      (i.dataSensitivity === 'restricted'
        ? 'Restricted'
        : i.dataSensitivity === 'confidential'
          ? 'Confidential'
          : i.dataSensitivity === 'public'
            ? 'Public'
            : 'Internal'),
    resilienceStatus,
    observabilityStatus,
    recommendationWhy: why,
    recommendationAction: action,
    inTransformation,
    matrixQuadrant: resolveMatrixQuadrant(i.criticality, architectureRisk),
    riskScore: riskScoreOf(architectureRisk),
    criticalityScore: criticalityScore(i.criticality),
    riskNumeric: integrationRiskScore(i),
    standardIds: i.standardIds?.length
      ? i.standardIds
      : standardsCompliance === 'Compliant'
        ? ['STD-API-001']
        : standardsCompliance === 'Partial'
          ? ['STD-INT-002']
          : ['STD-INT-002', 'STD-SEC-004'],
    initiativeIds: uniqueInitIds,
  }
}

export type PortfolioIntMetrics = {
  total: number
  businessCritical: number
  ownershipCoverage: number
  standardsCompliance: number
  reuseCoverage: number
  highRisk: number
  pointToPoint: number
}

export function computePortfolioMetrics(rows: PortfolioIntegration[]): PortfolioIntMetrics {
  const total = rows.length
  const businessCritical = rows.filter((r) => r.int.criticality === 'critical').length
  const owned = rows.filter((r) => !r.ownershipGap).length
  const compliant = rows.filter((r) => r.standardsCompliance === 'Compliant').length
  const reusable = rows.filter(
    (r) =>
      r.reuseClassification === 'Enterprise Reusable' ||
      r.reuseClassification === 'Multi-Consumer',
  ).length
  const highRisk = rows.filter((r) => isElevated(r.architectureRisk)).length
  const pointToPoint = rows.filter((r) => r.integrationPattern === 'Point-to-Point').length
  return {
    total,
    businessCritical,
    ownershipCoverage: total ? Math.round((owned / total) * 100) : 100,
    standardsCompliance: total ? Math.round((compliant / total) * 100) : 100,
    reuseCoverage: total ? Math.round((reusable / total) * 100) : 0,
    highRisk,
    pointToPoint,
  }
}

export function patternMix(rows: PortfolioIntegration[]) {
  return PATTERN_MIX_KEYS.map((key) => ({
    key,
    count: rows.filter((r) => r.integrationPattern === key).length,
  }))
}

export function exposureReuseMix(rows: PortfolioIntegration[]) {
  const exposures: IntegrationExposure[] = ['Internal', 'Partner', 'Public']
  const reuses: IntegrationReuseClass[] = [
    'Enterprise Reusable',
    'Multi-Consumer',
    'Single Consumer',
  ]
  return {
    exposure: exposures.map((key) => ({
      key,
      count: rows.filter((r) => r.exposure === key).length,
    })),
    reuse: reuses.map((key) => ({
      key,
      count: rows.filter((r) => r.reuseClassification === key).length,
    })),
  }
}

export function portfolioSignal(rows: PortfolioIntegration[]) {
  const unowned = rows.filter((r) => r.ownershipGap)
  const pct = rows.length ? Math.round((unowned.length / rows.length) * 100) : 0
  const criticalOnFragile = rows.filter(
    (r) =>
      isHighCrit(r.int.criticality) &&
      (r.integrationPattern === 'Point-to-Point' ||
        r.platform !== 'Direct / none' ||
        isElevated(r.architectureRisk)),
  )
  const platforms = new Map<string, number>()
  for (const r of criticalOnFragile) {
    if (r.platform && r.platform !== 'Direct / none') {
      platforms.set(r.platform, (platforms.get(r.platform) || 0) + 1)
    }
  }
  const topPlatform = [...platforms.entries()].sort((a, b) => b[1] - a[1])[0]
  return {
    ownershipGapPct: pct,
    ownershipGapCount: unowned.length,
    ownershipGapIds: unowned.map((r) => r.int.id),
    criticalDependencyCount: criticalOnFragile.length,
    criticalDependencyIds: criticalOnFragile.map((r) => r.int.id),
    topPlatform: topPlatform?.[0] || null,
    topPlatformCount: topPlatform?.[1] || 0,
  }
}

export function matrixSample(rows: PortfolioIntegration[], limit = 14): PortfolioIntegration[] {
  if (rows.length <= limit) return rows
  const byQuad: Record<MatrixQuadrant, PortfolioIntegration[]> = {
    Protect: [],
    Prioritise: [],
    Simplify: [],
    Monitor: [],
  }
  for (const r of rows) byQuad[r.matrixQuadrant].push(r)
  for (const q of Object.keys(byQuad) as MatrixQuadrant[]) {
    byQuad[q].sort(
      (a, b) =>
        b.criticalityScore + b.riskScore - (a.criticalityScore + a.riskScore) ||
        a.int.name.localeCompare(b.int.name),
    )
  }
  const out: PortfolioIntegration[] = []
  const order: MatrixQuadrant[] = ['Prioritise', 'Protect', 'Simplify', 'Monitor']
  let i = 0
  while (out.length < limit) {
    let added = false
    for (const q of order) {
      if (out.length >= limit) break
      const candidate = byQuad[q][i]
      if (candidate) {
        out.push(candidate)
        added = true
      }
    }
    if (!added) break
    i += 1
  }
  return out
}

export type IntFilterState = {
  search: string
  assetType: string
  exposure: string
  criticality: string
  risk: string
  ownership: '' | 'assigned' | 'unassigned'
  lifecycle: string
  compliance: string
  reuse: string
  platform: string
  capabilityId: string
  idSet: string[]
}

export const emptyIntFilters: IntFilterState = {
  search: '',
  assetType: '',
  exposure: '',
  criticality: '',
  risk: '',
  ownership: '',
  lifecycle: '',
  compliance: '',
  reuse: '',
  platform: '',
  capabilityId: '',
  idSet: [],
}

export function filterPortfolioIntegrations(
  rows: PortfolioIntegration[],
  filters: IntFilterState,
): PortfolioIntegration[] {
  const q = filters.search.trim().toLowerCase()
  const idSet = filters.idSet?.length ? new Set(filters.idSet) : null
  return rows.filter((row) => {
    const { int: i } = row
    if (idSet && !idSet.has(i.id)) return false
    if (filters.assetType && row.assetType !== filters.assetType) return false
    if (filters.exposure && row.exposure !== filters.exposure) return false
    if (filters.criticality === 'business-critical') {
      if (i.criticality !== 'critical' && i.criticality !== 'high') return false
    } else if (filters.criticality && i.criticality !== filters.criticality) {
      return false
    }
    if (filters.risk === 'elevated') {
      if (!isElevated(row.architectureRisk)) return false
    } else if (filters.risk && row.architectureRisk !== filters.risk) {
      return false
    }
    if (filters.ownership === 'assigned' && row.ownershipGap) return false
    if (filters.ownership === 'unassigned' && !row.ownershipGap) return false
    if (filters.lifecycle && row.lifecycleStage !== filters.lifecycle) return false
    if (filters.compliance && row.standardsCompliance !== filters.compliance) return false
    if (filters.reuse && row.reuseClassification !== filters.reuse) return false
    if (filters.platform && row.platform !== filters.platform) return false
    if (filters.capabilityId && !i.supportedCapabilityIds.includes(filters.capabilityId)) {
      return false
    }
    if (q) {
      const hay = [
        i.name,
        i.description,
        i.apiOrInterfaceName,
        i.protocol,
        row.providerName,
        row.consumerNames.join(' '),
        row.businessOwnerLabel || '',
        row.technicalOwnerLabel || '',
        row.integrationOwnerLabel || '',
        row.assetType,
        row.platform,
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export function formatCriticality(c: Criticality) {
  return c.charAt(0).toUpperCase() + c.slice(1)
}

export function relatedFindings(integrationId: string, findings: Finding[]): Finding[] {
  return findings.filter((f) => (f.linkedObjectIds || []).includes(integrationId))
}

export function relatedInitiatives(
  row: PortfolioIntegration,
  initiatives: Initiative[],
): Initiative[] {
  const ids = new Set(row.initiativeIds)
  return initiatives.filter((i) => ids.has(i.id))
}
