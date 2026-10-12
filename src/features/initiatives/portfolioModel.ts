import type {
  ArchitectureReadiness,
  ArchitectureRiskLevel,
  Initiative,
  InitiativeDeliveryStatus,
  StrategicPriority,
} from '../../domain/entities/types'

export type MatrixQuadrant = 'Accelerate' | 'Govern Closely' | 'Simplify' | 'Monitor'

export type PortfolioImpactFilter =
  | 'Applications'
  | 'Integrations & APIs'
  | 'Data'
  | 'Technology'
  | 'AI & Automation'

export type PortfolioInitiative = {
  init: Initiative
  deliveryStatus: InitiativeDeliveryStatus
  strategicPriority: StrategicPriority
  architectureReadiness: ArchitectureReadiness
  architectureRisk: ArchitectureRiskLevel
  horizonLabel: 'Now' | 'Next' | 'Later'
  ownerLabel: string
  architectureOwnerLabel: string
  executiveSponsorLabel: string
  strategicOutcome: string
  expectedOutcome: string
  progressPercent: number
  valueMeasureDefined: boolean
  baselineDefined: boolean
  targetDefined: boolean
  outstandingDecisionCount: number
  activeExceptionCount: number
  hasCriticalDependency: boolean
  matrixQuadrant: MatrixQuadrant
  riskScore: number
  importanceScore: number
  capabilityNames: string[]
  objectiveNames: string[]
  isArchitectureAligned: boolean
  isAtRisk: boolean
  isActive: boolean
  portfolioImpacts: PortfolioImpactFilter[]
}

export const DELIVERY_STATUSES: InitiativeDeliveryStatus[] = [
  'Proposed',
  'Planned',
  'In Progress',
  'At Risk',
  'Completed',
  'On Hold',
]

export const READINESS_LEVELS: ArchitectureReadiness[] = [
  'Ready',
  'Ready with Conditions',
  'Decision Required',
  'Blocked',
  'Not Assessed',
]

export const PRIORITIES: StrategicPriority[] = ['Critical', 'High', 'Medium', 'Low']
export const RISK_LEVELS: ArchitectureRiskLevel[] = ['Critical', 'High', 'Medium', 'Low']
export const HORIZONS = ['Now', 'Next', 'Later'] as const
export const PORTFOLIO_IMPACTS: PortfolioImpactFilter[] = [
  'Applications',
  'Integrations & APIs',
  'Data',
  'Technology',
  'AI & Automation',
]

export const STATUS_COLORS: Record<InitiativeDeliveryStatus, string> = {
  Proposed: '#7A6BB5',
  Planned: '#52CFE4',
  'In Progress': '#1E8CAA',
  'At Risk': '#B42318',
  Completed: '#0D6B7A',
  'On Hold': '#6B7280',
}

export const READINESS_COLORS: Record<ArchitectureReadiness, string> = {
  Ready: '#0D6B7A',
  'Ready with Conditions': '#1E8CAA',
  'Decision Required': '#C47B2C',
  Blocked: '#B42318',
  'Not Assessed': '#6B7280',
}

export const QUAD_COLORS: Record<MatrixQuadrant, string> = {
  Accelerate: '#1E8CAA',
  'Govern Closely': '#B42318',
  Simplify: '#C47B2C',
  Monitor: '#6B7280',
}

const UNKNOWN_OWNER = /unknown|unassigned|none|tbd|^$/i

export function personLabel(id?: string | null): string {
  if (!id || UNKNOWN_OWNER.test(String(id).trim())) return '—'
  return String(id)
    .replace(/^person-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export function resolveDeliveryStatus(i: Initiative): InitiativeDeliveryStatus {
  if (i.initiativeStatus) return i.initiativeStatus
  if (i.blocked) return 'On Hold'
  const s = (i.status || '').toLowerCase()
  if (s === 'completed') return 'Completed'
  if (s === 'in_progress') return 'In Progress'
  if (s === 'proposed') return 'Proposed'
  if (s === 'draft') return 'Planned'
  if (s === 'retired') return 'On Hold'
  if ((i.tags || []).includes('at-risk')) return 'At Risk'
  return 'Proposed'
}

export function resolveReadiness(i: Initiative): ArchitectureReadiness {
  if (i.architectureReadiness) return i.architectureReadiness
  if ((i.outstandingDecisionIds || []).length > 0) return 'Decision Required'
  if (i.blocked) return 'Blocked'
  return 'Not Assessed'
}

export function resolvePriority(i: Initiative): StrategicPriority {
  if (i.strategicPriority) return i.strategicPriority
  return 'Medium'
}

export function resolveRisk(i: Initiative): ArchitectureRiskLevel {
  if (i.architectureRisk) return i.architectureRisk
  return 'Medium'
}

export function horizonLabel(h: Initiative['horizon']): 'Now' | 'Next' | 'Later' {
  if (h === 'now') return 'Now'
  if (h === 'next') return 'Next'
  return 'Later'
}

function scoreRisk(r: ArchitectureRiskLevel): number {
  return { Low: 1, Medium: 2, High: 3, Critical: 4 }[r]
}

function scorePriority(p: StrategicPriority): number {
  return { Low: 1, Medium: 2, High: 3, Critical: 4 }[p]
}

function matrixQuadrant(importance: number, risk: number): MatrixQuadrant {
  const highValue = importance >= 3
  const highRisk = risk >= 3
  if (highValue && !highRisk) return 'Accelerate'
  if (highValue && highRisk) return 'Govern Closely'
  if (!highValue && highRisk) return 'Simplify'
  return 'Monitor'
}

function portfolioImpacts(i: Initiative): PortfolioImpactFilter[] {
  const out: PortfolioImpactFilter[] = []
  if ((i.applicationImpacts || []).length || (i.applicationIds || []).length) {
    out.push('Applications')
  }
  if ((i.integrationImpacts || []).length || (i.integrationIds || []).length) {
    out.push('Integrations & APIs')
  }
  if ((i.dataImpacts || []).length) out.push('Data')
  if ((i.technologyImpacts || []).length) out.push('Technology')
  if ((i.aiImpacts || []).length) out.push('AI & Automation')
  return out
}

export function enrichInitiative(
  init: Initiative,
  ctx: {
    capabilities: { id: string; name: string }[]
    objectives: { id: string; name: string }[]
  },
): PortfolioInitiative {
  const deliveryStatus = resolveDeliveryStatus(init)
  const strategicPriority = resolvePriority(init)
  const architectureReadiness = resolveReadiness(init)
  const architectureRisk = resolveRisk(init)
  const riskScore = scoreRisk(architectureRisk)
  const importanceScore = scorePriority(strategicPriority)
  const outstandingDecisionCount = (init.outstandingDecisionIds || []).length
  const activeExceptionCount = (init.exceptionsDetail || init.exceptionIds || []).length
  const hasCriticalDependency = (init.dependsOnInitiativeIds || []).length > 0 && riskScore >= 3
  const valueMeasureDefined =
    init.valueMeasureDefined ?? Boolean((init.kpiIds || []).length > 0)
  const baselineDefined = init.baselineDefined ?? valueMeasureDefined
  const targetDefined = init.targetDefined ?? valueMeasureDefined
  const isActive = !['Completed', 'On Hold'].includes(deliveryStatus)
  const isAtRisk =
    deliveryStatus === 'At Risk' ||
    architectureRisk === 'High' ||
    architectureRisk === 'Critical' ||
    architectureReadiness === 'Blocked'
  const isArchitectureAligned =
    architectureReadiness === 'Ready' || architectureReadiness === 'Ready with Conditions'

  const capMap = new Map(ctx.capabilities.map((c) => [c.id, c.name]))
  const objMap = new Map(ctx.objectives.map((o) => [o.id, o.name]))

  return {
    init,
    deliveryStatus,
    strategicPriority,
    architectureReadiness,
    architectureRisk,
    horizonLabel: horizonLabel(init.horizon),
    ownerLabel: personLabel(init.initiativeOwnerId || init.ownerId),
    architectureOwnerLabel: personLabel(init.architectureOwnerId),
    executiveSponsorLabel: personLabel(init.executiveSponsorId),
    strategicOutcome:
      (init.objectiveIds || [])
        .map((id) => objMap.get(id))
        .filter(Boolean)
        .join(' · ') || init.expectedValue,
    expectedOutcome: init.expectedOutcome || init.intendedOutcome || init.expectedValue,
    progressPercent: init.progressPercent ?? 0,
    valueMeasureDefined,
    baselineDefined,
    targetDefined,
    outstandingDecisionCount,
    activeExceptionCount,
    hasCriticalDependency,
    matrixQuadrant: matrixQuadrant(importanceScore, riskScore),
    riskScore,
    importanceScore,
    capabilityNames: (init.capabilityIds || [])
      .map((id) => capMap.get(id))
      .filter(Boolean) as string[],
    objectiveNames: (init.objectiveIds || [])
      .map((id) => objMap.get(id))
      .filter(Boolean) as string[],
    isArchitectureAligned,
    isAtRisk,
    isActive,
    portfolioImpacts: portfolioImpacts(init),
  }
}

export type InitiativeFilters = {
  search: string
  status: string
  readiness: string
  priority: string
  risk: string
  horizon: string
  ownerId: string
  capabilityId: string
  portfolioImpact: string
  decisions: string
  valueMeasures: string
  idSet: string[]
}

export function emptyInitFilters(): InitiativeFilters {
  return {
    search: '',
    status: '',
    readiness: '',
    priority: '',
    risk: '',
    horizon: '',
    ownerId: '',
    capabilityId: '',
    portfolioImpact: '',
    decisions: '',
    valueMeasures: '',
    idSet: [],
  }
}

export function filterPortfolioInitiatives(
  rows: PortfolioInitiative[],
  filters: InitiativeFilters,
): PortfolioInitiative[] {
  const q = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.idSet?.length && !filters.idSet.includes(row.init.id)) return false
    if (filters.status && row.deliveryStatus !== filters.status) return false
    if (filters.readiness && row.architectureReadiness !== filters.readiness) return false
    if (filters.priority && row.strategicPriority !== filters.priority) return false
    if (filters.risk === 'elevated') {
      if (row.architectureRisk !== 'High' && row.architectureRisk !== 'Critical') return false
    } else if (filters.risk && row.architectureRisk !== filters.risk) return false
    if (filters.horizon && row.horizonLabel !== filters.horizon) return false
    if (filters.ownerId) {
      const owner = row.init.initiativeOwnerId || row.init.ownerId
      if (owner !== filters.ownerId) return false
    }
    if (filters.capabilityId && !(row.init.capabilityIds || []).includes(filters.capabilityId)) {
      return false
    }
    if (
      filters.portfolioImpact &&
      !row.portfolioImpacts.includes(filters.portfolioImpact as PortfolioImpactFilter)
    ) {
      return false
    }
    if (filters.decisions === 'Outstanding' && row.outstandingDecisionCount === 0) return false
    if (filters.decisions === 'Complete' && row.outstandingDecisionCount > 0) return false
    if (filters.valueMeasures === 'Defined' && !row.valueMeasureDefined) return false
    if (filters.valueMeasures === 'Missing' && row.valueMeasureDefined) return false
    if (q) {
      const hay = [
        row.init.name,
        row.init.description,
        row.ownerLabel,
        row.strategicOutcome,
        row.expectedOutcome,
        ...row.capabilityNames,
        ...(row.init.applicationIds || []),
        ...(row.init.tags || []),
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export function computePortfolioMetrics(rows: PortfolioInitiative[]) {
  const active = rows.filter((r) => r.isActive)
  const architectureAligned = active.filter((r) => r.isArchitectureAligned).length
  const atRisk = rows.filter((r) => r.isAtRisk).length
  const decisionsRequired = rows.filter((r) => r.outstandingDecisionCount > 0).length
  const criticalDependencies = rows.filter((r) => r.hasCriticalDependency).length
  const withValue = rows.filter((r) => r.valueMeasureDefined).length
  const valuePct = rows.length ? Math.round((withValue / rows.length) * 100) : 0
  const standardsExceptions = rows.reduce((s, r) => s + r.activeExceptionCount, 0)
  return {
    active: active.length,
    architectureAligned,
    atRisk,
    decisionsRequired,
    criticalDependencies,
    valueMeasuresDefinedPct: valuePct,
    standardsExceptions,
    total: rows.length,
  }
}

export function statusMix(rows: PortfolioInitiative[]) {
  return DELIVERY_STATUSES.map((key) => ({
    key,
    count: rows.filter((r) => r.deliveryStatus === key).length,
    color: STATUS_COLORS[key],
  }))
}

export function readinessMix(rows: PortfolioInitiative[]) {
  return READINESS_LEVELS.map((key) => ({
    key,
    count: rows.filter((r) => r.architectureReadiness === key).length,
    color: READINESS_COLORS[key],
  }))
}

export function transformationSignal(rows: PortfolioInitiative[]) {
  const unresolvedDeps = rows.filter(
    (r) =>
      r.isActive &&
      (r.hasCriticalDependency ||
        r.architectureReadiness === 'Decision Required' ||
        r.architectureReadiness === 'Blocked'),
  )
  const techRetireDeps = rows.filter((r) =>
    (r.init.technologyImpacts || []).some((t) => t.impact === 'Retire'),
  ).length
  const decisionBlocked = rows.filter((r) => r.outstandingDecisionCount > 0).length
  const conflicts = rows.filter((r) => (r.init.conflictInitiativeIds || []).length > 0)
  const overlaps = rows.filter((r) => (r.init.overlapInitiativeIds || []).length > 0)

  const conflictPairs = new Set<string>()
  for (const r of conflicts) {
    for (const other of r.init.conflictInitiativeIds || []) {
      const key = [r.init.id, other].sort().join('|')
      conflictPairs.add(key)
    }
  }

  return {
    unresolvedCount: unresolvedDeps.length,
    unresolvedIds: unresolvedDeps.map((r) => r.init.id),
    techRetireDeps,
    decisionBlocked,
    conflictCount: conflictPairs.size,
    overlapCount: Math.ceil(overlaps.length / 2) || overlaps.length,
    headline:
      unresolvedDeps.length > 0
        ? `${unresolvedDeps.length} active initiatives have unresolved architecture dependencies that could affect delivery or target-state alignment.`
        : 'Transformation initiatives currently show no unresolved critical architecture dependencies.',
    support:
      unresolvedDeps.length > 0
        ? `${techRetireDeps} involve technology scheduled for retirement, while ${decisionBlocked} require architecture decisions before implementation can proceed safely.`
        : 'Continue monitoring readiness, conflicts and value measures as programmes progress.',
  }
}

export function criticalDependencyRows(rows: PortfolioInitiative[]) {
  return rows
    .filter((r) => (r.init.dependsOnInitiativeIds || []).length > 0 && r.isActive)
    .flatMap((r) =>
      (r.init.dependsOnInitiativeIds || []).map((depId) => {
        const dep = rows.find((x) => x.init.id === depId)
        const reason =
          (r.init.dependencyReasons || []).find((d) => d.initiativeId === depId)?.reason ||
          'Architecture sequencing dependency.'
        return {
          fromId: r.init.id,
          fromName: r.init.name,
          toId: depId,
          toName: dep?.init.name || depId,
          reason,
        }
      }),
    )
    .slice(0, 8)
}

export function conflictInsight(rows: PortfolioInitiative[]) {
  const withConflicts = rows.filter((r) => (r.init.conflictInitiativeIds || []).length > 0)
  if (!withConflicts.length) return null
  const sample = withConflicts[0]
  return {
    count: Math.ceil(withConflicts.length / 2),
    headline: `${Math.ceil(withConflicts.length / 2)} initiatives currently propose conflicting future states for the same application or identity path.`,
    note: sample.init.conflictNotes || 'Review sequencing and target-state ownership.',
    ids: withConflicts.map((r) => r.init.id),
  }
}

export function overlapInsight(rows: PortfolioInitiative[]) {
  const withOverlap = rows.filter((r) => (r.init.overlapInitiativeIds || []).length > 0)
  if (!withOverlap.length) return null
  return {
    count: withOverlap.length,
    headline: 'Potential overlap detected between transformation programmes.',
    note:
      withOverlap[0].init.overlapNotes ||
      'Architecture review required before funding duplicate platform investment.',
    ids: withOverlap.map((r) => r.init.id),
  }
}

export function matrixSample(rows: PortfolioInitiative[], limit = 12) {
  if (rows.length <= limit) return rows
  const ranked = [...rows].sort(
    (a, b) => b.importanceScore + b.riskScore - (a.importanceScore + a.riskScore),
  )
  return ranked.slice(0, limit)
}

export const STANDARD_LABELS: Record<string, string> = {
  'STD-API-001': 'API Design Standard',
  'STD-SEC-004': 'Integration Security Standard',
  'STD-INT-002': 'Approved Integration Patterns',
  'STD-EVT-001': 'Enterprise Event Design Standard',
  'STD-DAT-003': 'Data Exchange and Lineage Control',
  'STD-DATA-001': 'Data Ownership Standard',
  'STD-TECH-002': 'Enterprise Database Standard',
  'STD-TECH-003': 'Enterprise API & Integration Standard',
  'STD-TECH-006': 'Cloud Platform Standard',
}

export function standardLabel(id: string) {
  return STANDARD_LABELS[id] || id
}

export function statusTone(s: InitiativeDeliveryStatus) {
  if (s === 'At Risk') return 'bad'
  if (s === 'In Progress') return 'accent'
  if (s === 'Completed') return 'good'
  if (s === 'On Hold') return 'muted'
  if (s === 'Planned') return 'info'
  return 'warn'
}

export function readinessTone(r: ArchitectureReadiness) {
  if (r === 'Ready') return 'good'
  if (r === 'Ready with Conditions') return 'accent'
  if (r === 'Decision Required') return 'warn'
  if (r === 'Blocked') return 'bad'
  return 'muted'
}

export function riskTone(r: ArchitectureRiskLevel) {
  if (r === 'Critical' || r === 'High') return 'bad'
  if (r === 'Medium') return 'warn'
  return 'good'
}
