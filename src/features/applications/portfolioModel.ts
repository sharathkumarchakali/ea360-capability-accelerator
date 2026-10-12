import type {
  Application,
  Capability,
  Criticality,
  Decision,
  Finding,
  Initiative,
  Integration,
  Process,
} from '../../domain/entities/types'

/** EA360 portfolio decisions — distinct from legacy TIME labels. */
export type PortfolioDecision =
  | 'Invest'
  | 'Modernise'
  | 'Consolidate'
  | 'Tolerate'
  | 'Retire'

export type PortfolioLifecycle =
  | 'Strategic'
  | 'Current'
  | 'Legacy'
  | 'End-of-Life Risk'
  | 'Planned Retirement'

export type RiskLevel = 'Critical' | 'High' | 'Medium' | 'Low'

export type MatrixQuadrant = 'Protect' | 'Prioritise' | 'Simplify' | 'Monitor'

export type PortfolioApp = {
  app: Application
  portfolioDecision: PortfolioDecision
  lifecycleStage: PortfolioLifecycle
  architectureRisk: RiskLevel
  securityRisk: RiskLevel
  resilienceStatus: RiskLevel
  standardsCompliance: RiskLevel
  lifecycleRisk: boolean
  ownershipGap: boolean
  businessOwnerLabel: string | null
  technicalOwnerLabel: string | null
  supportTeam: string
  inTransformation: boolean
  capabilityNames: string[]
  primaryCapability: string
  recommendationWhy: string
  recommendationAction: string
  citizenImpact: string
  matrixQuadrant: MatrixQuadrant
  riskScore: number
  criticalityScore: number
}

export const PORTFOLIO_DECISIONS: PortfolioDecision[] = [
  'Invest',
  'Modernise',
  'Consolidate',
  'Tolerate',
  'Retire',
]

export const PORTFOLIO_LIFECYCLES: PortfolioLifecycle[] = [
  'Strategic',
  'Current',
  'Legacy',
  'End-of-Life Risk',
  'Planned Retirement',
]

export const DECISION_COLORS: Record<PortfolioDecision, string> = {
  Invest: '#1E8CAA',
  Modernise: '#C47B2C',
  Consolidate: '#7A6BB5',
  Tolerate: '#6B7C85',
  Retire: '#B42318',
}

const UNKNOWN_OWNER = /unknown|unassigned|none|tbd/i

export function personLabel(id?: string | null): string | null {
  if (!id || UNKNOWN_OWNER.test(id)) return null
  return id
    .replace(/^person-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Explicit portfolio decision from seed lifecycle intent.
 * Seed packs already assign lifecycle deliberately; we map that intent
 * into EA360 decision language without a scoring formula.
 */
export function resolvePortfolioDecision(app: Application): PortfolioDecision {
  if (app.duplicationClusterId && (app.lifecycle === 'eliminate' || app.lifecycle === 'tolerate')) {
    return 'Consolidate'
  }
  switch (app.lifecycle) {
    case 'strategic':
    case 'invest':
      return 'Invest'
    case 'migrate':
    case 'legacy':
      return 'Modernise'
    case 'eliminate':
      return 'Retire'
    case 'tolerate':
    default:
      return 'Tolerate'
  }
}

function monthsUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const t = Date.parse(dateStr)
  if (Number.isNaN(t)) return null
  return (t - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)
}

export function resolveLifecycleStage(app: Application): PortfolioLifecycle {
  const months = monthsUntil(app.endOfSupportDate)
  if (app.lifecycle === 'eliminate') return 'Planned Retirement'
  if (months !== null && months <= 18) return 'End-of-Life Risk'
  if (app.lifecycle === 'strategic') return 'Strategic'
  if (app.lifecycle === 'migrate' || app.lifecycle === 'legacy') return 'Legacy'
  if (app.lifecycle === 'invest' && app.strategicAlignment >= 4.5 && app.technicalHealth >= 3.4) {
    return 'Strategic'
  }
  return 'Current'
}

export function riskFromHealth(score: number): RiskLevel {
  if (score <= 2.2) return 'Critical'
  if (score <= 2.8) return 'High'
  if (score <= 3.5) return 'Medium'
  return 'Low'
}

function securityRisk(app: Application): RiskLevel {
  const base = riskFromHealth(app.technicalHealth)
  if (app.dataSensitivity === 'restricted' && (base === 'High' || base === 'Critical')) {
    return 'Critical'
  }
  if (app.dataSensitivity === 'restricted' || app.dataSensitivity === 'confidential') {
    if (base === 'Low') return 'Medium'
  }
  return base
}

function resilienceStatus(app: Application): RiskLevel {
  if (app.criticality === 'critical' && app.technicalHealth < 3) return 'Critical'
  if (app.deploymentModel === 'on-prem' && app.technicalHealth < 3) return 'High'
  return riskFromHealth(Math.min(5, app.technicalHealth + 0.4))
}

function standardsCompliance(app: Application): RiskLevel {
  if (app.lifecycle === 'strategic' || app.lifecycle === 'invest') {
    return app.technicalHealth >= 3.2 ? 'Low' : 'Medium'
  }
  if (app.lifecycle === 'eliminate' || app.lifecycle === 'legacy') return 'High'
  return riskFromHealth(app.technicalHealth)
}

function criticalityScore(c: Criticality): number {
  if (c === 'critical') return 4
  if (c === 'high') return 3
  if (c === 'medium') return 2
  return 1
}

function riskScore(level: RiskLevel): number {
  if (level === 'Critical') return 4
  if (level === 'High') return 3
  if (level === 'Medium') return 2
  return 1
}

function isHighCrit(c: Criticality) {
  return c === 'critical' || c === 'high'
}

function isElevatedRisk(level: RiskLevel) {
  return level === 'Critical' || level === 'High'
}

export function resolveMatrixQuadrant(
  criticality: Criticality,
  architectureRisk: RiskLevel,
): MatrixQuadrant {
  const hiC = isHighCrit(criticality)
  const hiR = isElevatedRisk(architectureRisk)
  if (hiC && !hiR) return 'Protect'
  if (hiC && hiR) return 'Prioritise'
  if (!hiC && hiR) return 'Simplify'
  return 'Monitor'
}

function citizenImpact(app: Application, caps: Capability[]): string {
  const names = caps
    .map((c) => c.name)
    .slice(0, 2)
    .join(' and ')
  if (app.criticality === 'critical') {
    return names
      ? `Citizen or customer-facing disruption across ${names} if unavailable.`
      : 'Severe disruption to critical enterprise services if unavailable.'
  }
  if (app.criticality === 'high') {
    return names
      ? `Material degradation of ${names} and related channels.`
      : 'Material degradation of key business services.'
  }
  if (app.criticality === 'medium') {
    return 'Contained operational impact with workarounds available for most users.'
  }
  return 'Limited local impact; alternative paths remain available.'
}

function recommendationCopy(
  decision: PortfolioDecision,
  app: Application,
  architectureRisk: RiskLevel,
  inTransformation: boolean,
): { why: string; action: string } {
  const crit = app.criticality
  switch (decision) {
    case 'Invest':
      return {
        why: `Strategic or high-value application with acceptable architecture posture (${architectureRisk.toLowerCase()} risk) and strong business criticality (${crit}).`,
        action:
          'Protect funding and strengthen platform capabilities aligned to strategic objectives.',
      }
    case 'Modernise':
      return {
        why: `High business relevance combined with ${architectureRisk.toLowerCase()} architecture or lifecycle risk${inTransformation ? ' and active transformation dependency' : ''}.`,
        action:
          'Complete target architecture and migration sequencing during the current transformation planning cycle.',
      }
    case 'Consolidate':
      return {
        why: 'Overlapping capability coverage indicates rationalisation opportunity across duplicate or shadow applications.',
        action:
          'Confirm target system of record and plan consolidation cutover with capability owners.',
      }
    case 'Retire':
      return {
        why: 'Application is a retirement candidate based on lifecycle intent and declining strategic contribution.',
        action:
          'Confirm decommission plan, data retention and consumer cutover before retirement.',
      }
    case 'Tolerate':
    default:
      return {
        why: 'Application remains acceptable for current operations but is not a strategic investment priority.',
        action: 'Monitor risk posture and revisit portfolio decision at the next architecture review.',
      }
  }
}

export function enrichApplication(
  app: Application,
  ctx: {
    capabilities: Capability[]
    initiatives: Initiative[]
  },
): PortfolioApp {
  const caps = app.supportedCapabilityIds
    .map((id) => ctx.capabilities.find((c) => c.id === id))
    .filter(Boolean) as Capability[]
  const portfolioDecision = resolvePortfolioDecision(app)
  const lifecycleStage = resolveLifecycleStage(app)
  const architectureRisk = riskFromHealth(app.technicalHealth)
  const inTransformation = ctx.initiatives.some(
    (i) =>
      (i.applicationIds ?? []).includes(app.id) &&
      !['completed', 'cancelled', 'retired'].includes((i.status || '').toLowerCase()),
  )
  const businessOwnerLabel = personLabel(app.businessOwnerId)
  const technicalOwnerLabel = personLabel(app.technologyOwnerId)
  const ownershipGap = !businessOwnerLabel || !technicalOwnerLabel
  const { why, action } = recommendationCopy(
    portfolioDecision,
    app,
    architectureRisk,
    inTransformation,
  )

  return {
    app,
    portfolioDecision,
    lifecycleStage,
    architectureRisk,
    securityRisk: securityRisk(app),
    resilienceStatus: resilienceStatus(app),
    standardsCompliance: standardsCompliance(app),
    lifecycleRisk:
      lifecycleStage === 'End-of-Life Risk' || lifecycleStage === 'Planned Retirement',
    ownershipGap,
    businessOwnerLabel,
    technicalOwnerLabel,
    supportTeam: app.deploymentModel === 'saas' ? 'Vendor-managed' : 'Internal platform support',
    inTransformation,
    capabilityNames: caps.map((c) => c.name),
    primaryCapability: caps[0]?.name || '—',
    recommendationWhy: why,
    recommendationAction: action,
    citizenImpact: citizenImpact(app, caps),
    matrixQuadrant: resolveMatrixQuadrant(app.criticality, architectureRisk),
    riskScore: riskScore(architectureRisk),
    criticalityScore: criticalityScore(app.criticality),
  }
}

export type PortfolioMetrics = {
  total: number
  businessCritical: number
  highRisk: number
  moderniseReplace: number
  ownershipCoverage: number
  lifecycleRisk: number
}

export function computePortfolioMetrics(rows: PortfolioApp[]): PortfolioMetrics {
  const total = rows.length
  const businessCritical = rows.filter((r) => r.app.criticality === 'critical').length
  const highRisk = rows.filter(
    (r) =>
      isElevatedRisk(r.architectureRisk) ||
      r.lifecycleRisk ||
      isElevatedRisk(r.securityRisk),
  ).length
  const moderniseReplace = rows.filter((r) =>
    ['Modernise', 'Consolidate', 'Retire'].includes(r.portfolioDecision),
  ).length
  const owned = rows.filter((r) => !r.ownershipGap).length
  const ownershipCoverage = total ? Math.round((owned / total) * 100) : 100
  const lifecycleRisk = rows.filter((r) => r.lifecycleRisk).length
  return {
    total,
    businessCritical,
    highRisk,
    moderniseReplace,
    ownershipCoverage,
    lifecycleRisk,
  }
}

export function decisionMix(rows: PortfolioApp[]) {
  return PORTFOLIO_DECISIONS.map((key) => ({
    key,
    count: rows.filter((r) => r.portfolioDecision === key).length,
    color: DECISION_COLORS[key],
  }))
}

export function lifecycleMix(rows: PortfolioApp[]) {
  return PORTFOLIO_LIFECYCLES.map((key) => ({
    key,
    count: rows.filter((r) => r.lifecycleStage === key).length,
  }))
}

export function portfolioSignal(rows: PortfolioApp[]) {
  const priority = rows.filter(
    (r) => isHighCrit(r.app.criticality) && (isElevatedRisk(r.architectureRisk) || r.lifecycleRisk),
  )
  const withInit = priority.filter((r) => r.inTransformation).length
  const eos = priority.filter((r) => r.lifecycleRisk).length
  return {
    count: priority.length,
    withInit,
    eos,
    ids: priority.map((r) => r.app.id),
  }
}

/** Select up to 15 representative apps for the 2×2 matrix. */
export function matrixSample(rows: PortfolioApp[], limit = 15): PortfolioApp[] {
  if (rows.length <= limit) return rows
  const byQuad: Record<MatrixQuadrant, PortfolioApp[]> = {
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
        a.app.name.localeCompare(b.app.name),
    )
  }
  const out: PortfolioApp[] = []
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

export type AppFilterState = {
  search: string
  criticality: string
  portfolioDecision: string
  lifecycle: string
  risk: string
  ownership: '' | 'assigned' | 'unassigned'
  capabilityId: string
  transformation: '' | 'in' | 'none'
  idSet: string[]
}

export const emptyAppFilters: AppFilterState = {
  search: '',
  criticality: '',
  portfolioDecision: '',
  lifecycle: '',
  risk: '',
  ownership: '',
  capabilityId: '',
  transformation: '',
  idSet: [],
}

export function filterPortfolioApps(rows: PortfolioApp[], filters: AppFilterState): PortfolioApp[] {
  const q = filters.search.trim().toLowerCase()
  const idSet = filters.idSet?.length ? new Set(filters.idSet) : null
  return rows.filter((row) => {
    const { app } = row
    if (idSet && !idSet.has(app.id)) return false
    if (filters.criticality === 'business-critical') {
      if (app.criticality !== 'critical' && app.criticality !== 'high') return false
    } else if (filters.criticality && app.criticality !== filters.criticality) {
      return false
    }
    if (filters.portfolioDecision === 'modernise-replace') {
      if (!(['Modernise', 'Consolidate', 'Retire'] as string[]).includes(row.portfolioDecision)) return false
    } else if (filters.portfolioDecision && row.portfolioDecision !== filters.portfolioDecision) {
      return false
    }
    if (filters.lifecycle === 'lifecycle-attention') {
      if (!row.lifecycleRisk) return false
    } else if (filters.lifecycle && row.lifecycleStage !== filters.lifecycle) {
      return false
    }
    if (filters.risk === 'elevated') {
      if (row.architectureRisk !== 'Critical' && row.architectureRisk !== 'High') return false
    } else if (filters.risk && row.architectureRisk !== filters.risk) {
      return false
    }
    if (filters.ownership === 'assigned' && row.ownershipGap) return false
    if (filters.ownership === 'unassigned' && !row.ownershipGap) return false
    if (filters.capabilityId && !app.supportedCapabilityIds.includes(filters.capabilityId)) {
      return false
    }
    if (filters.transformation === 'in' && !row.inTransformation) return false
    if (filters.transformation === 'none' && row.inTransformation) return false
    if (q) {
      const owner = (row.businessOwnerLabel || '') + ' ' + (row.technicalOwnerLabel || '')
      const hay = (app.name + ' ' + app.description + ' ' + owner + ' ' + row.capabilityNames.join(' ') + ' ' + app.vendorProduct).toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export function relatedProcesses(app: Application, processes: Process[]): Process[] {
  const capSet = new Set(app.supportedCapabilityIds)
  return processes.filter((p) => (p.capabilityIds || []).some((id) => capSet.has(id))).slice(0, 6)
}

export function relatedApis(appId: string, integrations: Integration[]): Integration[] {
  return integrations
    .filter(
      (i) =>
        (i.sourceApplicationId === appId || i.targetApplicationId === appId) &&
        (i.integrationType === 'REST API' ||
          i.integrationType === 'SOAP service' ||
          i.pattern === 'api'),
    )
    .slice(0, 8)
}

export function relatedDecisions(
  appId: string,
  findings: Finding[],
  decisions: Decision[],
  initiatives: Initiative[],
): Decision[] {
  const findingIds = new Set(
    findings.filter((f) => f.linkedObjectIds.includes(appId)).map((f) => f.id),
  )
  const initIds = new Set(
    initiatives.filter((i) => (i.applicationIds || []).includes(appId)).map((i) => i.id),
  )
  const recIds = new Set(
    findings
      .filter((f) => findingIds.has(f.id))
      .flatMap((f) => f.recommendationIds || []),
  )
  return decisions
    .filter(
      (d) =>
        (d.affectedObjectIds || []).includes(appId) ||
        (d.initiativeId ? initIds.has(d.initiativeId) : false) ||
        recIds.has(d.recommendationId),
    )
    .slice(0, 5)
}

export function formatCriticality(c: Criticality) {
  return c.charAt(0).toUpperCase() + c.slice(1)
}
