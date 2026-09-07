import { describe, expect, it, beforeEach } from 'vitest'
import {
  concentrationByApplication,
  deriveIntegrationMetrics,
  integrationRiskScore,
  isPointToPoint,
  isReusableApi,
  missingOwner,
  topIntegrationInsights,
  typeDistribution,
} from './integration'
import { clearTenantCache, loadTenantPack, getTenantRepository } from '../../data/repositories/tenantRepository'
import { usePrototypeStore } from '../../state/prototypeStore'
import type { Integration } from '../entities/types'

function sampleIntegration(overrides: Partial<Integration> = {}): Integration {
  return {
    id: 'int-test',
    tenantId: 'tenant-gra',
    name: 'Test Integration',
    description: 'test',
    status: 'active',
    ownerId: 'person-architect',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    dataQuality: 'high',
    sourceRefs: [],
    tags: [],
    pattern: 'api',
    integrationType: 'REST API',
    sourceApplicationId: 'app-a',
    targetApplicationId: 'app-b',
    direction: 'outbound',
    businessOwnerId: 'person-architect',
    technologyOwnerId: 'person-architect',
    supportedCapabilityIds: [],
    supportedProcessIds: [],
    apiOrInterfaceName: 'TestAPI',
    protocol: 'HTTPS',
    dataFormat: 'JSON',
    authenticationMethod: 'OAuth2',
    environment: 'production',
    lifecycleStatus: 'Active',
    criticality: 'medium',
    reusabilityStatus: 'reusable',
    consumerCount: 2,
    transactionVolumeBand: 'medium',
    availabilityTarget: '99.5%',
    dataSensitivity: 'internal',
    lastReviewDate: '2026-06-01',
    documentationStatus: 'documented',
    monitoringStatus: 'monitored',
    pointToPoint: false,
    dataObjectIds: [],
    technologyIds: [],
    ...overrides,
  }
}

describe('Phase 2 integration metrics', () => {
  beforeEach(() => {
    clearTenantCache()
  })

  it('classifies point-to-point and reusable APIs', () => {
    const p2pFlag = sampleIntegration({ pointToPoint: true, reusabilityStatus: 'point-to-point', pattern: 'point-to-point' })
    const p2pReuse = sampleIntegration({ pointToPoint: false, reusabilityStatus: 'point-to-point' })
    const reusable = sampleIntegration({
      pointToPoint: false,
      reusabilityStatus: 'reusable',
      integrationType: 'REST API',
      pattern: 'api',
    })
    expect(isPointToPoint(p2pFlag)).toBe(true)
    expect(isPointToPoint(p2pReuse)).toBe(true)
    expect(isReusableApi(reusable)).toBe(true)
    expect(isReusableApi(p2pFlag)).toBe(false)
  })

  it('detects missing owners', () => {
    expect(missingOwner(sampleIntegration({ businessOwnerId: 'person-unknown' }))).toBe(true)
    expect(missingOwner(sampleIntegration({ technologyOwnerId: 'unassigned' }))).toBe(true)
    expect(missingOwner(sampleIntegration())).toBe(false)
  })

  it('scores integration risk with documented weights', () => {
    const healthy = sampleIntegration({ criticality: 'low' })
    const risky = sampleIntegration({
      criticality: 'critical',
      pointToPoint: true,
      reusabilityStatus: 'point-to-point',
      documentationStatus: 'missing',
      monitoringStatus: 'unmonitored',
      lifecycleStatus: 'Deprecated',
      businessOwnerId: 'person-unknown',
      technologyOwnerId: 'person-unknown',
    })
    expect(integrationRiskScore(healthy)).toBeLessThan(integrationRiskScore(risky))
    expect(integrationRiskScore(risky)).toBeGreaterThan(70)
  })

  it('derives GRA portfolio metrics without hard-coded totals', () => {
    const pack = loadTenantPack('GRA')
    const metrics = deriveIntegrationMetrics(pack.integrations)
    expect(pack.integrations.length).toBe(32)
    expect(metrics.totalIntegrations).toBe(pack.integrations.length)
    expect(metrics.pointToPointCount).toBe(pack.integrations.filter(isPointToPoint).length)
    expect(metrics.reusableApiCount).toBe(pack.integrations.filter(isReusableApi).length)
    expect(metrics.pointToPointPercentage).toBe(
      Math.round((metrics.pointToPointCount / metrics.totalIntegrations) * 1000) / 10,
    )
    expect(metrics.apiReuseRate).toBe(
      Math.round((metrics.reusableApiCount / metrics.totalIntegrations) * 1000) / 10,
    )
    expect(metrics.unmonitoredIntegrationCount).toBeGreaterThan(0)
    expect(metrics.missingOwnerCount).toBeGreaterThan(0)
  })

  it('builds type distribution and application concentration', () => {
    const pack = loadTenantPack('GRA')
    const types = typeDistribution(pack.integrations)
    expect(types.reduce((s, t) => s + t.count, 0)).toBe(pack.integrations.length)
    const conc = concentrationByApplication(pack.integrations, pack.applications)
    expect(conc[0].count).toBeGreaterThanOrEqual(conc[conc.length - 1].count)
    expect(conc.every((c) => c.count > 0)).toBe(true)
  })

  it('produces actionable insights with filter payloads', () => {
    const pack = loadTenantPack('GRA')
    const insights = topIntegrationInsights(pack.integrations)
    expect(insights.length).toBeGreaterThan(0)
    expect(insights.length).toBeLessThanOrEqual(3)
    for (const insight of insights) {
      expect(insight.filter).toBeTruthy()
      expect(Object.keys(insight.filter).length).toBeGreaterThan(0)
    }
  })

  it('derives scenario topology focus from pack scenarios', () => {
    const repo = getTenantRepository('GRA')
    const scenario = repo.getScenario('scenario-identity')
    expect(scenario).toBeTruthy()
    expect(scenario!.topologyFocusIntegrationIds.length).toBeGreaterThan(0)
    for (const id of scenario!.topologyFocusIntegrationIds) {
      expect(repo.getIntegration(id)).toBeTruthy()
    }
    const apps = new Set<string>()
    for (const id of scenario!.topologyFocusIntegrationIds) {
      const i = repo.getIntegration(id)!
      apps.add(i.sourceApplicationId)
      apps.add(i.targetApplicationId)
    }
    expect(apps.size).toBeGreaterThanOrEqual(3)
    expect(apps.size).toBeLessThanOrEqual(20)
  })

  it('demo reset restores Phase 2 integration and explorer defaults', () => {
    const store = usePrototypeStore.getState()
    store.setIntegrationFilters({
      search: 'tin',
      pointToPoint: 'true',
      monitoringStatus: 'unmonitored',
      missingOwner: 'true',
    })
    store.setScenarioId('scenario-payment')
    store.setGraphRoot({ id: 'app-gra-01', type: 'application' })
    store.setRelationshipDepth(3)
    store.setGraphDirection('upstream')
    store.setEntityTypeFilters(['application', 'integration'])
    store.setImpactMode(true)
    store.setView('explorer')
    store.resetDemo()
    const after = usePrototypeStore.getState()
    expect(after.integrationFilters.search).toBe('')
    expect(after.integrationFilters.pointToPoint).toBe('')
    expect(after.integrationFilters.monitoringStatus).toBe('')
    expect(after.integrationFilters.missingOwner).toBe('')
    expect(after.scenarioId).toBe('scenario-identity')
    expect(after.graphRoot).toBeNull()
    expect(after.relationshipDepth).toBe(1)
    expect(after.graphDirection).toBe('both')
    expect(after.entityTypeFilters).toEqual([])
    expect(after.impactMode).toBe(false)
    expect(after.view).toBe('executive')
  })
})
