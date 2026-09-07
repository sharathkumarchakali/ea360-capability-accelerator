import type { Application, Capability, Criticality, Integration } from '../entities/types'

export function isPointToPoint(i: Integration): boolean {
  return i.pointToPoint || i.reusabilityStatus === 'point-to-point' || i.pattern === 'point-to-point'
}

export function isReusableApi(i: Integration): boolean {
  return i.reusabilityStatus === 'reusable' && (i.integrationType === 'REST API' || i.pattern === 'api')
}

export function isActiveIntegration(i: Integration): boolean {
  return i.lifecycleStatus === 'Active' || i.lifecycleStatus === 'Restricted' || i.status === 'active'
}

export function missingOwner(i: Integration): boolean {
  const blank = (v: string) => !v || v === 'unassigned' || v === 'person-unknown'
  return blank(i.businessOwnerId) || blank(i.technologyOwnerId) || blank(i.ownerId)
}

/**
 * Integration risk score (0–100)
 * Weighted: criticality 30%, P2P 20%, undocumented 15%, unmonitored 15%,
 * deprecated/retiring 10%, missing owner 10%.
 */
export function integrationRiskScore(i: Integration): number {
  const crit =
    i.criticality === 'critical' ? 1 : i.criticality === 'high' ? 0.75 : i.criticality === 'medium' ? 0.4 : 0.15
  const p2p = isPointToPoint(i) ? 1 : 0
  const undoc = i.documentationStatus === 'missing' ? 1 : i.documentationStatus === 'partial' ? 0.5 : 0
  const unmon = i.monitoringStatus === 'unmonitored' ? 1 : i.monitoringStatus === 'partial' ? 0.5 : 0
  const life =
    i.lifecycleStatus === 'Deprecated' || i.lifecycleStatus === 'Retiring'
      ? 1
      : i.lifecycleStatus === 'Restricted'
        ? 0.5
        : 0
  const owner = missingOwner(i) ? 1 : 0
  const score =
    crit * 30 + p2p * 20 + undoc * 15 + unmon * 15 + life * 10 + owner * 10
  return Math.round(score * 10) / 10
}

export function highDependencyIntegrations(integrations: Integration[], threshold = 3): Integration[] {
  return integrations.filter((i) => i.consumerCount >= threshold)
}

export function deriveIntegrationMetrics(integrations: Integration[]) {
  const total = integrations.length
  const active = integrations.filter(isActiveIntegration).length
  const reusable = integrations.filter(isReusableApi).length
  const p2p = integrations.filter(isPointToPoint).length
  const critical = integrations.filter((i) => i.criticality === 'critical' || i.criticality === 'high').length
  const deprecated = integrations.filter(
    (i) => i.lifecycleStatus === 'Deprecated' || i.lifecycleStatus === 'Retiring',
  ).length
  const unmonitored = integrations.filter((i) => i.monitoringStatus === 'unmonitored').length
  const undocumented = integrations.filter((i) => i.documentationStatus === 'missing').length
  const missingOwners = integrations.filter(missingOwner).length
  const highDep = highDependencyIntegrations(integrations).length
  const apiReuseRate = total ? Math.round((reusable / total) * 1000) / 10 : 0
  const p2pPct = total ? Math.round((p2p / total) * 1000) / 10 : 0
  const avgRisk =
    total === 0
      ? 0
      : Math.round((integrations.reduce((s, i) => s + integrationRiskScore(i), 0) / total) * 10) / 10

  return {
    totalIntegrations: total,
    activeIntegrations: active,
    reusableApiCount: reusable,
    apiReuseRate,
    pointToPointCount: p2p,
    pointToPointPercentage: p2pPct,
    criticalIntegrationCount: critical,
    deprecatedIntegrationCount: deprecated,
    unmonitoredIntegrationCount: unmonitored,
    undocumentedIntegrationCount: undocumented,
    missingOwnerCount: missingOwners,
    highDependencyCount: highDep,
    averageIntegrationRisk: avgRisk,
  }
}

export function concentrationByApplication(integrations: Integration[], applications: Application[]) {
  const map = new Map<string, number>()
  for (const i of integrations) {
    map.set(i.sourceApplicationId, (map.get(i.sourceApplicationId) ?? 0) + 1)
    map.set(i.targetApplicationId, (map.get(i.targetApplicationId) ?? 0) + 1)
  }
  return applications
    .map((a) => ({ application: a, count: map.get(a.id) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
}

export function concentrationByCapability(integrations: Integration[], capabilities: Capability[]) {
  const map = new Map<string, number>()
  for (const i of integrations) {
    for (const cid of i.supportedCapabilityIds) {
      map.set(cid, (map.get(cid) ?? 0) + 1)
    }
  }
  return capabilities
    .map((c) => ({ capability: c, count: map.get(c.id) ?? 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
}

export function concentrationByProtocol(integrations: Integration[]) {
  const map = new Map<string, number>()
  for (const i of integrations) {
    const key = i.protocol || 'unknown'
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  return [...map.entries()]
    .map(([protocol, count]) => ({ protocol, count }))
    .sort((a, b) => b.count - a.count)
}

export function typeDistribution(integrations: Integration[]) {
  const map = new Map<string, number>()
  for (const i of integrations) {
    map.set(i.integrationType, (map.get(i.integrationType) ?? 0) + 1)
  }
  return [...map.entries()].map(([type, count]) => ({ type, count }))
}

export function criticalityByLifecycle(integrations: Integration[]) {
  const rows: Array<{ lifecycle: string; criticality: Criticality; count: number }> = []
  const map = new Map<string, number>()
  for (const i of integrations) {
    const key = `${i.lifecycleStatus}|${i.criticality}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  for (const [key, count] of map) {
    const [lifecycle, criticality] = key.split('|') as [string, Criticality]
    rows.push({ lifecycle, criticality, count })
  }
  return rows
}

export function topIntegrationInsights(integrations: Integration[]) {
  const metrics = deriveIntegrationMetrics(integrations)
  const insights: Array<{ id: string; title: string; body: string; filter: Record<string, string> }> = []
  if (metrics.pointToPointPercentage >= 30) {
    insights.push({
      id: 'p2p',
      title: 'Point-to-point concentration',
      body: `${metrics.pointToPointPercentage}% of interfaces are point-to-point, multiplying change and outage cost.`,
      filter: { pointToPoint: 'true' },
    })
  }
  if (metrics.unmonitoredIntegrationCount > 0) {
    insights.push({
      id: 'unmon',
      title: 'Unmonitored critical paths',
      body: `${metrics.unmonitoredIntegrationCount} integrations lack monitoring coverage.`,
      filter: { monitoringStatus: 'unmonitored' },
    })
  }
  if (metrics.deprecatedIntegrationCount > 0) {
    insights.push({
      id: 'dep',
      title: 'Deprecated interface exposure',
      body: `${metrics.deprecatedIntegrationCount} deprecated or retiring interfaces remain in the path.`,
      filter: { lifecycleStatus: 'Deprecated' },
    })
  }
  if (metrics.apiReuseRate < 40) {
    insights.push({
      id: 'reuse',
      title: 'Low API reuse',
      body: `Only ${metrics.apiReuseRate}% of integrations are classified as reusable APIs.`,
      filter: { reusabilityStatus: 'reusable' },
    })
  }
  if (metrics.missingOwnerCount > 0) {
    insights.push({
      id: 'owner',
      title: 'Ownership gaps',
      body: `${metrics.missingOwnerCount} integrations lack clear business or technology ownership.`,
      filter: { missingOwner: 'true' },
    })
  }
  return insights.slice(0, 3)
}
