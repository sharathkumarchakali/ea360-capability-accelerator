import type {
  Application,
  Criticality,
  Finding,
  Initiative,
  Integration,
  Technology,
  TechnologyDeploymentModel,
  TechnologyLifecycle,
  TechnologyPortfolioDecision,
  TechnologyRiskLevel,
  TechnologyStandardStatus,
} from '../../domain/entities/types'

export type TechMatrixQuadrant = 'Protect' | 'Prioritise' | 'Simplify' | 'Monitor'

export type PortfolioTechnology = {
  tech: Technology
  categoryNorm: string
  lifecycleLabel: string
  lifecycleStage: string
  deploymentLabel: string
  vendorLabel: string
  architectureRisk: TechnologyRiskLevel
  standardStatus: TechnologyStandardStatus
  portfolioDecision: TechnologyPortfolioDecision
  criticalApplicationCount: number
  applicationNames: string[]
  hasCriticalAppDependency: boolean
  ownershipGap: boolean
  technologyOwnerLabel: string | null
  platformOwnerLabel: string | null
  operationalOwnerLabel: string | null
  inTransformation: boolean
  matrixQuadrant: TechMatrixQuadrant
  criticalityScore: number
  riskScore: number
  lifecycleAttention: boolean
  standardsException: boolean
  resilienceGap: boolean
}

export const PORTFOLIO_LIFECYCLES = [
  'Strategic',
  'Approved',
  'Tolerated',
  'Deprecated',
  'Retire',
  'End-of-Support Risk',
] as const

export const TECH_STANDARDS: Record<string, { id: string; name: string }> = {
  'STD-TECH-002': { id: 'STD-TECH-002', name: 'Enterprise Database Standard' },
  'STD-TECH-003': { id: 'STD-TECH-003', name: 'Enterprise API & Integration Standard' },
  'STD-TECH-004': { id: 'STD-TECH-004', name: 'Enterprise Container Platform Standard' },
  'STD-TECH-005': { id: 'STD-TECH-005', name: 'Identity & Access Platform Standard' },
  'STD-TECH-006': { id: 'STD-TECH-006', name: 'Public Cloud Landing Zone Standard' },
}

export const DECISION_COLORS: Record<TechnologyPortfolioDecision, string> = {
  INVEST: '#1E8CAA',
  STANDARDISE: '#0D6B7A',
  MODERNISE: '#C47B2C',
  CONSOLIDATE: '#6B7280',
  TOLERATE: '#52CFE4',
  REPLACE: '#B42318',
  RETIRE: '#B42318',
}

const UNKNOWN_OWNER = /unknown|unassigned|none|tbd|^$/i

const LIFECYCLE_LABEL: Record<TechnologyLifecycle, string> = {
  strategic: 'Strategic',
  approved: 'Approved',
  tolerated: 'Tolerated',
  deprecated: 'Deprecated',
  retire: 'Retire',
  'end-of-support-risk': 'End-of-Support Risk',
}

const DEPLOYMENT_LABEL: Record<TechnologyDeploymentModel, string> = {
  'on-premise': 'On-Premise',
  'private-cloud': 'Private Cloud',
  'public-cloud': 'Public Cloud',
  hybrid: 'Hybrid',
  saas: 'SaaS',
}

function personLabel(id?: string | null): string | null {
  if (!id || UNKNOWN_OWNER.test(String(id).trim())) return null
  const raw = String(id)
  if (!raw.startsWith('person-') && (raw.includes(' ') || /[A-Z]/.test(raw[0] || ''))) return raw
  return raw
    .replace(/^person-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function normalizeCategory(raw: string): string {
  const c = raw.toLowerCase()
  if (c.includes('platform')) return 'Platform'
  if (c.includes('runtime') || c === 'ui') return 'Runtime'
  if (c.includes('database')) return 'Database'
  if (c.includes('cloud')) return 'Cloud'
  if (c.includes('middleware') || c.includes('integration')) return 'Middleware'
  if (c.includes('security')) return 'Security'
  if (c.includes('infrastructure') || c.includes('end-user')) return 'Infrastructure'
  return raw
}

function riskScoreOf(r: TechnologyRiskLevel): number {
  if (r === 'Critical') return 4
  if (r === 'High') return 3
  if (r === 'Medium') return 2
  return 1
}

function deriveRisk(tech: Technology, criticalCount: number): TechnologyRiskLevel {
  if (tech.architectureRisk) return tech.architectureRisk
  if (tech.lifecycle === 'retire' || tech.lifecycle === 'end-of-support-risk') {
    return criticalCount >= 2 ? 'High' : 'Medium'
  }
  if (tech.lifecycle === 'deprecated') return criticalCount > 0 ? 'High' : 'Medium'
  if (tech.lifecycle === 'strategic' || tech.lifecycle === 'approved') return 'Low'
  return 'Medium'
}

function deriveDecision(tech: Technology): TechnologyPortfolioDecision {
  if (tech.portfolioDecision) return tech.portfolioDecision
  if (tech.lifecycle === 'strategic') return 'INVEST'
  if (tech.lifecycle === 'retire') return 'RETIRE'
  if (tech.lifecycle === 'deprecated' || tech.lifecycle === 'end-of-support-risk') return 'REPLACE'
  if (tech.lifecycle === 'tolerated') return 'TOLERATE'
  return 'STANDARDISE'
}

function isHighCritApp(app: Application) {
  return app.criticality === 'critical' || app.criticality === 'high'
}

function criticalityScoreFromCount(criticalCount: number, totalApps: number): number {
  if (criticalCount >= 3) return 4
  if (criticalCount >= 1) return 3
  if (totalApps >= 2) return 2
  if (totalApps >= 1) return 1.5
  return 1
}

function resolveMatrixQuadrant(criticalityScore: number, riskScore: number): TechMatrixQuadrant {
  const hiC = criticalityScore >= 2.5
  const hiR = riskScore >= 3
  if (hiC && !hiR) return 'Protect'
  if (hiC && hiR) return 'Prioritise'
  if (!hiC && hiR) return 'Simplify'
  return 'Monitor'
}

function lifecycleAttention(lifecycle: TechnologyLifecycle): boolean {
  return (
    lifecycle === 'deprecated' ||
    lifecycle === 'retire' ||
    lifecycle === 'end-of-support-risk' ||
    lifecycle === 'tolerated'
  )
}

export function formatLifecycle(lifecycle: TechnologyLifecycle): string {
  return LIFECYCLE_LABEL[lifecycle] || lifecycle
}

export function formatDeployment(model?: TechnologyDeploymentModel): string {
  if (!model) return 'Not classified'
  return DEPLOYMENT_LABEL[model] || model
}

export function enrichTechnology(
  tech: Technology,
  ctx: {
    applications: Application[]
    integrations: Integration[]
    initiatives: Initiative[]
  },
): PortfolioTechnology {
  const appIds = new Set(tech.applicationIds || [])
  const linkedApps = ctx.applications.filter((a) => appIds.has(a.id))
  const criticalCount =
    tech.criticalApplicationCount ??
    linkedApps.filter(isHighCritApp).length
  const architectureRisk = deriveRisk(tech, criticalCount)
  const portfolioDecision = deriveDecision(tech)
  const lifecycleLabel = formatLifecycle(tech.lifecycle)
  const criticalityScore = criticalityScoreFromCount(criticalCount, linkedApps.length)
  const riskScore = riskScoreOf(architectureRisk)
  const techOwner = personLabel(tech.technologyOwner || tech.ownerId)
  const platformOwner = personLabel(tech.platformOwner)
  const operationalOwner = personLabel(tech.operationalOwner)
  const ownershipGap = !techOwner && !platformOwner && !operationalOwner
  const inTransformation = (tech.initiativeIds || []).some((id) =>
    ctx.initiatives.some(
      (i) =>
        i.id === id &&
        !['completed', 'cancelled', 'retired'].includes((i.status || '').toLowerCase()),
    ),
  )
  const standardStatus: TechnologyStandardStatus =
    tech.standardStatus ||
    (tech.exceptionIds?.length ? 'Exception' : 'Not Assessed')

  return {
    tech,
    categoryNorm: normalizeCategory(tech.category),
    lifecycleLabel,
    lifecycleStage: lifecycleLabel,
    deploymentLabel: formatDeployment(tech.deploymentModel),
    vendorLabel: tech.vendor || '—',
    architectureRisk,
    standardStatus,
    portfolioDecision,
    criticalApplicationCount: criticalCount,
    applicationNames: linkedApps.map((a) => a.name),
    hasCriticalAppDependency: criticalCount > 0,
    ownershipGap,
    technologyOwnerLabel: techOwner,
    platformOwnerLabel: platformOwner,
    operationalOwnerLabel: operationalOwner,
    inTransformation,
    matrixQuadrant: resolveMatrixQuadrant(criticalityScore, riskScore),
    criticalityScore,
    riskScore,
    lifecycleAttention: lifecycleAttention(tech.lifecycle),
    standardsException: standardStatus === 'Exception',
    resilienceGap: tech.drStatus === 'Gap' || tech.resilienceStatus === 'Gap',
  }
}

export type PortfolioTechMetrics = {
  total: number
  strategicApprovedPct: number
  lifecycleRisk: number
  endOfSupport: number
  standardsExceptions: number
  criticalPlatformDependencies: number
  resilienceGaps: number
  vendorConcentration: number
}

export function computePortfolioMetrics(rows: PortfolioTechnology[]): PortfolioTechMetrics {
  const total = rows.length
  const strategicApproved = rows.filter(
    (r) => r.tech.lifecycle === 'strategic' || r.tech.lifecycle === 'approved',
  ).length
  const lifecycleRisk = rows.filter((r) =>
    ['deprecated', 'retire', 'end-of-support-risk'].includes(r.tech.lifecycle),
  ).length
  const endOfSupport = rows.filter(
    (r) => r.tech.lifecycle === 'end-of-support-risk' || r.tech.lifecycle === 'retire',
  ).length
  const standardsExceptions = rows.filter((r) => r.standardsException).length
  const criticalPlatformDependencies = rows.filter(
    (r) => r.hasCriticalAppDependency && r.criticalApplicationCount >= 2,
  ).length
  const resilienceGaps = rows.filter((r) => r.resilienceGap).length
  const vendorCounts = new Map<string, number>()
  for (const r of rows) {
    const v = (r.tech.vendor || 'Unknown').trim()
    vendorCounts.set(v, (vendorCounts.get(v) || 0) + 1)
  }
  const vendorConcentration = [...vendorCounts.values()].filter((c) => c >= 4).length

  return {
    total,
    strategicApprovedPct: total ? Math.round((strategicApproved / total) * 100) : 0,
    lifecycleRisk,
    endOfSupport,
    standardsExceptions,
    criticalPlatformDependencies,
    resilienceGaps,
    vendorConcentration,
  }
}

export function lifecycleMix(rows: PortfolioTechnology[]) {
  return PORTFOLIO_LIFECYCLES.map((key) => ({
    key,
    count: rows.filter((r) => r.lifecycleLabel === key).length,
  }))
}

export function deploymentMix(rows: PortfolioTechnology[]) {
  const keys = ['On-Premise', 'Private Cloud', 'Public Cloud', 'Hybrid', 'SaaS', 'Not classified']
  return keys.map((key) => ({
    key,
    count: rows.filter((r) => r.deploymentLabel === key).length,
  }))
}

export function portfolioSignal(rows: PortfolioTechnology[]) {
  const atRisk = rows.filter(
    (r) =>
      (r.tech.lifecycle === 'retire' ||
        r.tech.lifecycle === 'end-of-support-risk' ||
        r.tech.lifecycle === 'deprecated') &&
      r.hasCriticalAppDependency,
  )
  const withInit = atRisk.filter((r) => r.inTransformation)
  const criticalApps = new Set<string>()
  for (const r of atRisk) {
    for (const id of r.tech.applicationIds || []) {
      criticalApps.add(id)
    }
  }
  return {
    count: atRisk.length,
    withInitiatives: withInit.length,
    criticalAppCount: criticalApps.size,
    techIds: atRisk.map((r) => r.tech.id),
    appIds: [...criticalApps],
    initiativeIds: [
      ...new Set(withInit.flatMap((r) => r.tech.initiativeIds || [])),
    ],
  }
}

export function matrixSample(rows: PortfolioTechnology[], limit = 14): PortfolioTechnology[] {
  if (rows.length <= limit) return rows
  const byQuad: Record<TechMatrixQuadrant, PortfolioTechnology[]> = {
    Protect: [],
    Prioritise: [],
    Simplify: [],
    Monitor: [],
  }
  for (const r of rows) byQuad[r.matrixQuadrant].push(r)
  const order: TechMatrixQuadrant[] = ['Prioritise', 'Protect', 'Simplify', 'Monitor']
  const out: PortfolioTechnology[] = []
  let i = 0
  while (out.length < limit && i < limit * 4) {
    for (const q of order) {
      const cand = byQuad[q].shift()
      if (cand) out.push(cand)
      if (out.length >= limit) break
    }
    i += 1
  }
  return out
}

export type TechFilterState = {
  search: string
  category: string
  lifecycle: string
  risk: string
  deployment: string
  standardStatus: string
  vendor: string
  ownership: string
  criticalApp: string
  resilience: string
  portfolioDecision: string
  idSet: string[] | null
}

export const emptyTechFilters: TechFilterState = {
  search: '',
  category: '',
  lifecycle: '',
  risk: '',
  deployment: '',
  standardStatus: '',
  vendor: '',
  ownership: '',
  criticalApp: '',
  resilience: '',
  portfolioDecision: '',
  idSet: null,
}

export function filterPortfolioTechnologies(
  rows: PortfolioTechnology[],
  filters: TechFilterState,
): PortfolioTechnology[] {
  const q = filters.search.trim().toLowerCase()
  const idSet = filters.idSet?.length ? new Set(filters.idSet) : null

  return rows.filter((row) => {
    const { tech: t } = row
    if (idSet && !idSet.has(t.id)) return false

    if (filters.category && row.categoryNorm !== filters.category) return false

    if (filters.lifecycle) {
      if (filters.lifecycle === 'lifecycle-attention') {
        if (!row.lifecycleAttention) return false
      } else if (row.lifecycleLabel !== filters.lifecycle) return false
    }

    if (filters.risk && row.architectureRisk !== filters.risk) return false

    if (filters.deployment && row.deploymentLabel !== filters.deployment) return false

    if (filters.standardStatus) {
      if (filters.standardStatus === 'non-standard') {
        if (row.standardStatus === 'Standard') return false
      } else if (row.standardStatus !== filters.standardStatus) return false
    }

    if (filters.vendor && row.vendorLabel !== filters.vendor) return false

    if (filters.ownership === 'assigned' && row.ownershipGap) return false
    if (filters.ownership === 'unassigned' && !row.ownershipGap) return false

    if (filters.criticalApp === 'yes' && !row.hasCriticalAppDependency) return false
    if (filters.criticalApp === 'no' && row.hasCriticalAppDependency) return false

    if (filters.resilience === 'Gap' && !row.resilienceGap) return false
    if (filters.resilience === 'Meets Target' && row.resilienceGap) return false
    if (filters.resilience === 'Not Assessed') {
      if (t.drStatus !== 'Not Assessed' && t.resilienceStatus !== 'Not Assessed') return false
    }

    if (filters.portfolioDecision && row.portfolioDecision !== filters.portfolioDecision) {
      return false
    }

    if (q) {
      const hay =
        `${t.name} ${t.description} ${row.vendorLabel} ${row.applicationNames.join(' ')}`.toLowerCase()
      if (!hay.includes(q)) return false
    }

    return true
  })
}

export function relatedFindings(techId: string, findings: Finding[]): Finding[] {
  return findings.filter(
    (f) =>
      f.linkedObjectIds.includes(techId) ||
      (f.id && f.linkedObjectIds.some((x) => x === techId)),
  )
}

export function relatedInitiatives(row: PortfolioTechnology, initiatives: Initiative[]): Initiative[] {
  const ids = new Set(row.tech.initiativeIds || [])
  return initiatives.filter((i) => ids.has(i.id))
}

export function formatCriticality(c: Criticality) {
  if (!c) return '—'
  return c.charAt(0).toUpperCase() + c.slice(1)
}
