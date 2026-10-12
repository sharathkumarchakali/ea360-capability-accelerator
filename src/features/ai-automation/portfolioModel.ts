import type {
  AiGovernanceStatus,
  AiHumanOversight,
  AiModel,
  AiPermission,
  AiRiskLevel,
  AiSolution,
  Application,
  Capability,
  Criticality,
  Integration,
  Technology,
} from '../../domain/entities/types'

export type RiskLevel = AiRiskLevel
export type AiMatrixQuadrant = 'Govern Closely' | 'Protect' | 'Review' | 'Monitor'

export const AI_LIFECYCLES = ['EXPERIMENT', 'APPROVED', 'PRODUCTION', 'RESTRICTED', 'RETIRED'] as const

export const AUTONOMY_LABELS: Record<number, string> = {
  0: 'Level 0 — Assist',
  1: 'Level 1 — Recommend',
  2: 'Level 2 — Act With Approval',
  3: 'Level 3 — Act Within Boundaries',
  4: 'Level 4 — High Autonomy',
}

export const AUTONOMY_HELP: Record<number, string> = {
  0: 'AI provides information only. No action.',
  1: 'AI recommends an action. Human decides.',
  2: 'AI may prepare or initiate an action but requires explicit human approval.',
  3: 'AI may execute approved actions within predefined permissions and limits.',
  4: 'AI performs significant actions without per-action approval within delegated authority.',
}

export type PortfolioAiSolution = {
  sol: AiSolution
  capabilityNames: string[]
  ownerLabel: string | null
  ownershipGap: boolean
  matrixQuadrant: AiMatrixQuadrant
  criticalityScore: number
  autonomyScore: number
  isAgentOrCopilot: boolean
  hasElevatedPermissions: boolean
  oversightGap: boolean
  governanceGap: boolean
  providerNames: string[]
  modelNames: string[]
}

export type AiFilters = {
  search: string
  aiType: string
  lifecycle: string
  criticality: string
  risk: string
  autonomy: string
  oversight: string
  ownership: string
  provider: string
  dataClass: string
  capabilityId: string
  governance: string
  idSet: string[] | null
}

export const emptyAiFilters = (): AiFilters => ({
  search: '',
  aiType: '',
  lifecycle: '',
  criticality: '',
  risk: '',
  autonomy: '',
  oversight: '',
  ownership: '',
  provider: '',
  dataClass: '',
  capabilityId: '',
  governance: '',
  idSet: null,
})

const UNKNOWN_OWNER = /unknown|unassigned|none|tbd|^$/i

export function personLabel(id?: string | null): string | null {
  if (!id || UNKNOWN_OWNER.test(String(id).trim())) return null
  const raw = String(id)
  if (!raw.startsWith('person-') && (raw.includes(' ') || /[A-Z]/.test(raw[0] || ''))) return raw
  return raw
    .replace(/^person-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function critScore(c: Criticality): number {
  if (c === 'critical') return 4
  if (c === 'high') return 3
  if (c === 'medium') return 2
  return 1
}

function isHighCrit(c: Criticality) {
  return c === 'critical' || c === 'high'
}

function isHighAutonomy(level: number) {
  return level >= 3
}

function matrixQuadrant(criticality: Criticality, autonomy: number): AiMatrixQuadrant {
  const highCrit = isHighCrit(criticality)
  const highAuto = isHighAutonomy(autonomy)
  if (highCrit && highAuto) return 'Govern Closely'
  if (highCrit && !highAuto) return 'Protect'
  if (!highCrit && highAuto) return 'Review'
  return 'Monitor'
}

function mapAiTypeFilter(solutionType: string): string {
  const t = solutionType.toLowerCase()
  if (t.includes('copilot')) return 'Copilot'
  if (t.includes('agent')) return 'Agent'
  if (t.includes('assistant') || t.includes('generative ai application')) return 'Assistant'
  if (t.includes('predictive') || t.includes('classification') || t.includes('recommendation')) {
    return 'Predictive Model'
  }
  if (t.includes('generative')) return 'Generative AI'
  if (t.includes('workflow') || t.includes('automated workflow')) return 'Workflow'
  if (t.includes('decision')) return 'Decision Support'
  if (t.includes('document')) return 'Generative AI'
  return 'Assistant'
}

export function isAgentOrCopilot(sol: AiSolution) {
  const t = sol.solutionType.toLowerCase()
  return (
    t.includes('copilot') ||
    t.includes('agent') ||
    t.includes('assistant') ||
    t.includes('workflow') ||
    t.includes('generative ai')
  )
}

function hasElevated(toolPermissions: AiSolution['toolPermissions']) {
  return toolPermissions.some((p) => ['WRITE', 'EXECUTE', 'APPROVE'].includes(p.permission))
}

function isGovernanceGap(sol: AiSolution) {
  if (sol.governanceStatus === 'Gap' || sol.governanceStatus === 'Not Assessed') return true
  if (sol.governanceStatus === 'Partial') return true
  const d = sol.governanceDetail
  if (!d) return sol.governanceStatus !== 'Complete'
  return Object.values(d).some((v) => v === 'Gap' || v === 'Partial' || v === 'Not Assessed')
}

function oversightDocumented(o: AiHumanOversight) {
  return o !== 'None Documented'
}

export function enrichAiSolution(
  sol: AiSolution,
  ctx: {
    capabilities: Capability[]
    models: AiModel[]
    integrations: Integration[]
    applications: Application[]
    technologies: Technology[]
  },
): PortfolioAiSolution {
  const capabilityNames = sol.businessCapabilityIds
    .map((id) => ctx.capabilities.find((c) => c.id === id)?.name || id)
    .filter(Boolean)
  const ownerLabel =
    personLabel(sol.businessOwner) ||
    personLabel(sol.aiOwner) ||
    personLabel(sol.technicalOwner) ||
    personLabel(sol.ownerId)
  const ownershipGap = !ownerLabel
  const models = sol.modelIds.map((id) => ctx.models.find((m) => m.id === id)).filter(Boolean) as AiModel[]
  const providerNames = [...new Set(models.map((m) => m.provider))]
  const modelNames = models.map((m) => m.name)
  const oversightGap = isHighAutonomy(sol.autonomyLevel) && !oversightDocumented(sol.humanOversightType)
  return {
    sol,
    capabilityNames,
    ownerLabel,
    ownershipGap,
    matrixQuadrant: matrixQuadrant(sol.businessCriticality, sol.autonomyLevel),
    criticalityScore: critScore(sol.businessCriticality),
    autonomyScore: sol.autonomyLevel,
    isAgentOrCopilot: isAgentOrCopilot(sol),
    hasElevatedPermissions: hasElevated(sol.toolPermissions),
    oversightGap,
    governanceGap: isGovernanceGap(sol),
    providerNames,
    modelNames,
  }
}

export function filterPortfolioAi(rows: PortfolioAiSolution[], f: AiFilters) {
  const q = f.search.trim().toLowerCase()
  return rows.filter((row) => {
    const s = row.sol
    if (f.idSet && f.idSet.length > 0 && !f.idSet.includes(s.id)) return false
    if (q) {
      const hay = [
        s.name,
        s.description,
        s.solutionType,
        s.businessPurpose,
        row.ownerLabel,
        ...row.capabilityNames,
        ...row.modelNames,
        ...row.providerNames,
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (f.aiType && mapAiTypeFilter(s.solutionType) !== f.aiType) return false
    if (f.lifecycle && s.lifecycle !== f.lifecycle) return false
    if (f.criticality && s.businessCriticality !== f.criticality) return false
    if (f.risk) {
      if (f.risk === 'elevated' && s.riskLevel !== 'High' && s.riskLevel !== 'Critical') return false
      if (f.risk !== 'elevated' && s.riskLevel !== f.risk) return false
    }
    if (f.autonomy && String(s.autonomyLevel) !== f.autonomy) return false
    if (f.oversight && s.humanOversightType !== f.oversight) return false
    if (f.ownership === 'assigned' && row.ownershipGap) return false
    if (f.ownership === 'unassigned' && !row.ownershipGap) return false
    if (f.provider && !row.providerNames.includes(f.provider)) return false
    if (f.capabilityId && !s.businessCapabilityIds.includes(f.capabilityId)) return false
    if (f.governance && s.governanceStatus !== f.governance) return false
    if (f.dataClass) {
      const match = s.dataDomainIds.some((id) => id === f.dataClass)
      if (!match) return false
    }
    return true
  })
}

export function computePortfolioMetrics(rows: PortfolioAiSolution[]) {
  const total = rows.length
  const production = rows.filter((r) => r.sol.lifecycle === 'PRODUCTION').length
  const agentsCopilots = rows.filter((r) => r.isAgentOrCopilot).length
  const highRisk = rows.filter((r) => r.sol.riskLevel === 'High' || r.sol.riskLevel === 'Critical').length
  const documented = rows.filter((r) => oversightDocumented(r.sol.humanOversightType)).length
  const oversightCoverage = total ? Math.round((documented / total) * 100) : 0
  const governanceGaps = rows.filter((r) => r.governanceGap).length
  const externalModels = rows.filter((r) =>
    r.sol.modelIds.some((mid) => {
      const m = mid
      return m.includes('aim') // enriched later in view if needed
    }),
  )
  void externalModels
  const externalModelUseCases = new Set<string>()
  rows.forEach((r) => {
    if (r.providerNames.some((p) => p.toLowerCase().includes('external'))) {
      r.sol.modelIds.forEach(() => externalModelUseCases.add(r.sol.id))
    }
  })
  const autonomousAgents = rows.filter(
    (r) => r.sol.solutionType.toLowerCase().includes('agent') && r.sol.autonomyLevel >= 3,
  ).length
  const unowned = rows.filter((r) => r.ownershipGap).length
  return {
    total,
    production,
    agentsCopilots,
    highRisk,
    oversightCoverage,
    governanceGaps,
    externalModelUseCases: externalModelUseCases.size,
    autonomousAgents,
    unowned,
  }
}

export function lifecycleMix(rows: PortfolioAiSolution[]) {
  return AI_LIFECYCLES.map((key) => ({
    key,
    count: rows.filter((r) => r.sol.lifecycle === key).length,
  }))
}

export function controlCoverage(rows: PortfolioAiSolution[]) {
  const n = rows.length || 1
  const hasOwner = rows.filter((r) => !r.ownershipGap).length
  const oversight = rows.filter((r) => oversightDocumented(r.sol.humanOversightType)).length
  const approvedData = rows.filter((r) => {
    const d = r.sol.governanceDetail?.dataApproval
    return d === 'Complete' || d === 'Partial'
  }).length
  const permissions = rows.filter((r) => {
    const p = r.sol.governanceDetail?.permissions
    return p === 'Complete' || p === 'Partial'
  }).length
  const guardrails = rows.filter((r) => {
    const g = r.sol.governanceDetail?.guardrails
    return g === 'Complete' || g === 'Partial'
  }).length
  const monitoring = rows.filter((r) => {
    const m = r.sol.governanceDetail?.monitoring
    return m === 'Complete' || m === 'Partial'
  }).length
  return [
    { key: 'Named Owner', pct: Math.round((hasOwner / n) * 100) },
    { key: 'Human Oversight', pct: Math.round((oversight / n) * 100) },
    { key: 'Approved Data', pct: Math.round((approvedData / n) * 100) },
    { key: 'Permission Definition', pct: Math.round((permissions / n) * 100) },
    { key: 'Guardrails', pct: Math.round((guardrails / n) * 100) },
    { key: 'Monitoring', pct: Math.round((monitoring / n) * 100) },
    { key: 'Lifecycle Decision', pct: Math.round((rows.filter((r) => r.sol.lifecycle !== 'EXPERIMENT').length / n) * 100) },
  ]
}

export function matrixSample(rows: PortfolioAiSolution[], limit = 14) {
  const ranked = [...rows].sort((a, b) => {
    const sa = a.criticalityScore * 10 + a.autonomyScore
    const sb = b.criticalityScore * 10 + b.autonomyScore
    return sb - sa
  })
  return ranked.slice(0, limit)
}

export function portfolioSignal(rows: PortfolioAiSolution[]) {
  const productionAgents = rows.filter(
    (r) =>
      r.sol.lifecycle === 'PRODUCTION' &&
      r.sol.solutionType.toLowerCase().includes('agent') &&
      r.sol.autonomyLevel >= 2,
  )
  const incomplete = productionAgents.filter((r) => r.oversightGap || r.governanceGap)
  const autonomousIds = rows
    .filter((r) => r.sol.autonomyLevel >= 3 && r.sol.solutionType.toLowerCase().includes('agent'))
    .map((r) => r.sol.id)
  const governanceGapIds = rows.filter((r) => r.governanceGap).map((r) => r.sol.id)
  const elevatedIds = rows.filter((r) => r.hasElevatedPermissions).map((r) => r.sol.id)
  return {
    productionAgentCount: productionAgents.length,
    incompleteControlCount: incomplete.length,
    autonomousAgentIds: autonomousIds,
    governanceGapIds,
    elevatedAgentIds: elevatedIds,
    affectedIds: [...new Set(productionAgents.map((r) => r.sol.id))],
  }
}

export function modelProviderConcentration(
  rows: PortfolioAiSolution[],
  models: AiModel[],
) {
  const byProvider = new Map<string, { models: Set<string>; solutions: Set<string>; caps: Set<string> }>()
  rows.forEach((r) => {
    if (r.sol.lifecycle !== 'PRODUCTION') return
    r.sol.modelIds.forEach((mid) => {
      const model = models.find((m) => m.id === mid)
      if (!model?.isExternalProvider) return
      const bucket = byProvider.get(model.provider) || {
        models: new Set(),
        solutions: new Set(),
        caps: new Set(),
      }
      bucket.models.add(model.name)
      bucket.solutions.add(r.sol.name)
      r.sol.businessCapabilityIds.forEach((c) => bucket.caps.add(c))
      byProvider.set(model.provider, bucket)
    })
  })
  let topProvider = ''
  let topCount = 0
  byProvider.forEach((v, provider) => {
    const c = v.solutions.size
    if (c > topCount) {
      topCount = c
      topProvider = provider
    }
  })
  return { byProvider, topProvider, topCount }
}

export function humanOversightByAutonomy(rows: PortfolioAiSolution[]) {
  const bands = [
    { label: 'Level 0/1', levels: [0, 1] },
    { label: 'Level 2', levels: [2] },
    { label: 'Level 3', levels: [3] },
    { label: 'Level 4', levels: [4] },
  ]
  return bands.map((b) => {
    const subset = rows.filter((r) => b.levels.includes(r.sol.autonomyLevel))
    const n = subset.length || 1
    const documented = subset.filter((r) => oversightDocumented(r.sol.humanOversightType)).length
    return { label: b.label, pct: Math.round((documented / n) * 100), count: subset.length }
  })
}

export function outcomeCoverage(rows: PortfolioAiSolution[]) {
  const n = rows.length || 1
  const withOutcome = rows.filter((r) => r.sol.outcomeStatement).length
  const withBaseline = rows.filter((r) => r.sol.outcomeBaseline).length
  const withTarget = rows.filter((r) => r.sol.outcomeTarget).length
  const prodMeasurable = rows.filter(
    (r) =>
      r.sol.lifecycle === 'PRODUCTION' &&
      r.sol.outcomeStatement &&
      r.sol.outcomeBaseline &&
      r.sol.outcomeTarget,
  ).length
  const prod = rows.filter((r) => r.sol.lifecycle === 'PRODUCTION').length || 1
  return {
    withOutcomePct: Math.round((withOutcome / n) * 100),
    withBaselinePct: Math.round((withBaseline / n) * 100),
    withTargetPct: Math.round((withTarget / n) * 100),
    prodMeasurablePct: Math.round((prodMeasurable / prod) * 100),
  }
}

export function portfolioInsights(
  rows: PortfolioAiSolution[],
  models: AiModel[],
  metrics: ReturnType<typeof computePortfolioMetrics>,
) {
  const concentration = modelProviderConcentration(rows, models)
  const highAuto = rows.filter((r) => r.sol.autonomyLevel >= 3).length
  const outcomeMissing = rows.filter((r) => !r.sol.outcomeTarget).length
  const unownedProd = rows.filter(
    (r) => r.sol.lifecycle === 'PRODUCTION' && r.ownershipGap,
  ).length
  const elevated = rows.filter((r) => r.hasElevatedPermissions).length
  const elevatedIncomplete = rows.filter(
    (r) => r.hasElevatedPermissions && (r.oversightGap || r.governanceGap),
  ).length
  return [
    {
      title: `${highAuto} High-Autonomy Agents Require Governance Attention`,
      body: 'Higher-autonomy AI requires stronger—not weaker—ownership and oversight.',
    },
    {
      title: `${outcomeMissing} AI Use Cases Lack Complete Outcome Measures`,
      body: 'Architecture should connect AI investment to documented business outcomes.',
    },
    {
      title: `${unownedProd} Production AI Solutions Have Incomplete Business Ownership`,
      body: 'Named business ownership remains a prerequisite for scaling customer-facing AI.',
    },
    {
      title: `${concentration.topCount} Production AI Use Cases Depend on One Model Provider`,
      body: concentration.topProvider
        ? `${concentration.topProvider} concentration affects multiple production copilots and agents.`
        : 'Review external model dependencies for continuity planning.',
    },
    {
      title: `${elevated} Agents Have Write or Execute Access to Enterprise Systems`,
      body: `${elevatedIncomplete} elevated-permission agents have incomplete oversight documentation.`,
    },
  ]
}

export function agentsAndAutomations(rows: PortfolioAiSolution[]) {
  return rows.filter(
    (r) =>
      r.sol.solutionType.toLowerCase().includes('agent') ||
      r.sol.solutionType.toLowerCase().includes('workflow'),
  )
}

export function toolMatrixAgents(rows: PortfolioAiSolution[]) {
  return rows
    .filter((r) => r.hasElevatedPermissions || r.sol.autonomyLevel >= 2)
    .sort((a, b) => b.autonomyScore - a.autonomyScore)
    .slice(0, 5)
}

export function formatCriticality(c: Criticality) {
  return c.charAt(0).toUpperCase() + c.slice(1)
}

export function formatLifecycle(l: string) {
  return l.charAt(0) + l.slice(1).toLowerCase()
}

export function permissionLabel(p: AiPermission) {
  if (p === 'NONE') return '—'
  if (p === 'READ') return 'Read'
  if (p === 'WRITE') return 'Write'
  if (p === 'EXECUTE') return 'Execute'
  return p
}

export function formatPermissionPair(read?: AiPermission, write?: AiPermission) {
  if (write && write !== 'NONE' && read === 'READ') return 'Read/Write'
  if (write === 'WRITE') return 'Write'
  if (read) return permissionLabel(read)
  return '—'
}

export function governanceTone(s: AiGovernanceStatus) {
  if (s === 'Complete') return 'good'
  if (s === 'Partial') return 'warn'
  return 'bad'
}

export function mapAiTypeFilterLabel(solutionType: string) {
  return mapAiTypeFilter(solutionType)
}
