import type { Application, Capability, Finding, TimeClass } from '../entities/types'
import type { EnterpriseRelationship } from '../relationships/types'

export type TimeContext = {
  p2pIntegrationCountByApp: Record<string, number>
}

/**
 * TIME classification rules (documented in METRIC_DEFINITIONS.md)
 *
 * Evaluate in order; first match wins:
 * 1. Eliminate — lifecycle eliminate, OR (businessValue <= 2.5 AND technicalHealth <= 2.5),
 *    OR (strategicAlignment <= 2 AND businessValue <= 3 AND technicalHealth < 3)
 * 2. Migrate — lifecycle migrate|legacy, OR end-of-support within 18 months,
 *    OR (businessValue >= 3.5 AND technicalHealth < 3),
 *    OR (duplicationClusterId set AND technicalHealth < 3.2 AND businessValue >= 3)
 * 3. Invest — lifecycle invest|strategic, OR (businessValue >= 4 AND technicalHealth >= 3.2 AND strategicAlignment >= 3.5)
 * 4. Tolerate — default remaining active applications
 */
export function classifyTIME(app: Application, ctx?: TimeContext): TimeClass {
  const eosSoon = isEndOfSupportSoon(app.endOfSupportDate, 18)
  const p2p = ctx?.p2pIntegrationCountByApp[app.id] ?? 0

  if (
    app.lifecycle === 'eliminate' ||
    (app.businessValue <= 2.5 && app.technicalHealth <= 2.5) ||
    (app.strategicAlignment <= 2 && app.businessValue <= 3 && app.technicalHealth < 3)
  ) {
    return 'Eliminate'
  }

  if (
    app.lifecycle === 'migrate' ||
    app.lifecycle === 'legacy' ||
    eosSoon ||
    (app.businessValue >= 3.5 && app.technicalHealth < 3) ||
    (Boolean(app.duplicationClusterId) && app.technicalHealth < 3.2 && app.businessValue >= 3) ||
    (p2p >= 3 && app.technicalHealth < 3.2)
  ) {
    return 'Migrate'
  }

  if (
    app.lifecycle === 'invest' ||
    app.lifecycle === 'strategic' ||
    (app.businessValue >= 4 && app.technicalHealth >= 3.2 && app.strategicAlignment >= 3.5)
  ) {
    return 'Invest'
  }

  return 'Tolerate'
}

export function explainTIME(app: Application, time: TimeClass, ctx?: TimeContext): string {
  const eosSoon = isEndOfSupportSoon(app.endOfSupportDate, 18)
  const p2p = ctx?.p2pIntegrationCountByApp[app.id] ?? 0
  if (time === 'Eliminate') {
    return `Low strategic contribution (value ${app.businessValue}, health ${app.technicalHealth}, alignment ${app.strategicAlignment}). Candidate to retire or consolidate.`
  }
  if (time === 'Migrate') {
    const reasons = []
    if (app.lifecycle === 'migrate' || app.lifecycle === 'legacy') reasons.push(`lifecycle ${app.lifecycle}`)
    if (eosSoon) reasons.push('end-of-support within 18 months')
    if (app.businessValue >= 3.5 && app.technicalHealth < 3) reasons.push('high value / weak health')
    if (app.duplicationClusterId) reasons.push('duplication cluster')
    if (p2p >= 3) reasons.push(`${p2p} point-to-point integrations`)
    return `Migrate because ${reasons.join('; ') || 'portfolio rules'}.`
  }
  if (time === 'Invest') {
    return `Invest to scale: value ${app.businessValue}, health ${app.technicalHealth}, alignment ${app.strategicAlignment}.`
  }
  return `Tolerate while monitoring: balanced value/health with limited transformation urgency.`
}

export function buildP2PCounts(integrations: { id: string; pattern: string; sourceApplicationId: string; targetApplicationId: string }[]) {
  const counts: Record<string, number> = {}
  for (const i of integrations) {
    if (i.pattern !== 'point-to-point') continue
    counts[i.sourceApplicationId] = (counts[i.sourceApplicationId] ?? 0) + 1
    counts[i.targetApplicationId] = (counts[i.targetApplicationId] ?? 0) + 1
  }
  return counts
}

export function timeDistribution(apps: Application[], ctx: TimeContext) {
  const buckets: Record<TimeClass, Application[]> = {
    Invest: [],
    Tolerate: [],
    Migrate: [],
    Eliminate: [],
  }
  for (const app of apps) {
    buckets[classifyTIME(app, ctx)].push(app)
  }
  return buckets
}

export function costBandWeight(band: Application['annualCostBand']) {
  switch (band) {
    case 'low':
      return 1
    case 'medium':
      return 2
    case 'high':
      return 3
    case 'very-high':
      return 4
    default:
      return 1
  }
}

/**
 * Application support for a capability (1–5):
 * mean technicalHealth of supporting apps, or 1 if none.
 */
export function capabilityApplicationSupport(capabilityId: string, apps: Application[]): number {
  const supporting = apps.filter((a) => a.supportedCapabilityIds.includes(capabilityId))
  if (!supporting.length) return 1
  const avg = supporting.reduce((s, a) => s + a.technicalHealth, 0) / supporting.length
  return Math.round(avg * 10) / 10
}

export function heatmapValue(
  mode: 'maturity' | 'risk' | 'importance' | 'support' | 'investment',
  cap: Capability,
  apps: Application[],
): number {
  switch (mode) {
    case 'maturity':
      return cap.maturityCurrent
    case 'risk':
      return cap.riskScore
    case 'importance':
      return cap.strategicImportance
    case 'support':
      return capabilityApplicationSupport(cap.id, apps)
    case 'investment':
      return cap.investmentPriority
  }
}

export function findDuplicationClusters(apps: Application[]) {
  const map = new Map<string, Application[]>()
  for (const app of apps) {
    if (!app.duplicationClusterId) continue
    const list = map.get(app.duplicationClusterId) ?? []
    list.push(app)
    map.set(app.duplicationClusterId, list)
  }
  return [...map.entries()]
    .filter(([, list]) => list.length >= 2)
    .map(([id, list]) => ({ clusterId: id, applications: list }))
}

export function portfolioInsights(input: {
  applications: Application[]
  integrations: { id: string; pattern: string; sourceApplicationId: string; targetApplicationId: string; name: string }[]
  findings: Finding[]
  capabilities: Capability[]
}) {
  const ctx = { p2pIntegrationCountByApp: buildP2PCounts(input.integrations) }
  const classified = input.applications.map((a) => ({ app: a, time: classifyTIME(a, ctx) }))
  const duplicates = findDuplicationClusters(input.applications)
  const eos = input.applications.filter((a) => isEndOfSupportSoon(a.endOfSupportDate, 24))
  const highCostLowValue = input.applications.filter(
    (a) => (a.annualCostBand === 'high' || a.annualCostBand === 'very-high') && a.businessValue <= 3,
  )
  const weakCritical = input.applications.filter(
    (a) => (a.criticality === 'critical' || a.criticality === 'high') && a.technicalHealth < 3,
  )
  const heavyP2P = input.applications.filter((a) => (ctx.p2pIntegrationCountByApp[a.id] ?? 0) >= 3)

  return {
    ctx,
    classified,
    duplicates,
    endOfSupport: eos,
    highCostLowValue,
    weakCritical,
    heavyP2P,
    timeBuckets: timeDistribution(input.applications, ctx),
  }
}

export function validateCapabilityHierarchy(capabilities: Capability[]) {
  const errors: string[] = []
  const byId = new Map(capabilities.map((c) => [c.id, c]))
  for (const c of capabilities) {
    if (c.level === 1 && c.parentId) errors.push(`${c.id}: L1 cannot have parentId`)
    if (c.level > 1) {
      if (!c.parentId) {
        errors.push(`${c.id}: L${c.level} requires parentId`)
        continue
      }
      const parent = byId.get(c.parentId)
      if (!parent) errors.push(`${c.id}: missing parent ${c.parentId}`)
      else if (parent.level !== c.level - 1 && !(c.level === 2 && parent.level === 1)) {
        // allow L2 under L1; L3 under L2
        if (!(c.level === 3 && parent.level === 2)) {
          errors.push(`${c.id}: parent level mismatch`)
        }
      }
    }
  }
  return errors
}

function isEndOfSupportSoon(date: string | undefined, months: number) {
  if (!date) return false
  const eos = new Date(date)
  if (Number.isNaN(eos.getTime())) return false
  const limit = new Date()
  limit.setMonth(limit.getMonth() + months)
  return eos <= limit
}

export type { EnterpriseRelationship }
