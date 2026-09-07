import { describe, expect, it, beforeEach } from 'vitest'
import {
  classifyTIME,
  buildP2PCounts,
  findDuplicationClusters,
  portfolioInsights,
  validateCapabilityHierarchy,
  heatmapValue,
  capabilityApplicationSupport,
} from './portfolio'
import { clearTenantCache, loadTenantPack, getTenantRepository } from '../../data/repositories/tenantRepository'
import { usePrototypeStore } from '../../state/prototypeStore'

describe('Phase 1B portfolio metrics', () => {
  beforeEach(() => {
    clearTenantCache()
  })

  it('validates GRA capability hierarchy', () => {
    const pack = loadTenantPack('GRA')
    const errors = validateCapabilityHierarchy(pack.capabilities)
    expect(errors).toEqual([])
  })

  it('classifies TIME by documented rules', () => {
    const eliminate = classifyTIME({
      id: 'x',
      lifecycle: 'eliminate',
      businessValue: 2,
      technicalHealth: 2,
      strategicAlignment: 2,
    })
    expect(eliminate).toBe('Eliminate')

    const migrate = classifyTIME({
      id: 'y',
      lifecycle: 'active',
      businessValue: 4,
      technicalHealth: 2.2,
      strategicAlignment: 4,
      endOfSupportDate: '2026-11-01',
    })
    expect(migrate).toBe('Migrate')

    const invest = classifyTIME({
      id: 'z',
      lifecycle: 'invest',
      businessValue: 4,
      technicalHealth: 3.5,
      strategicAlignment: 4,
    })
    expect(invest).toBe('Invest')

    const tolerate = classifyTIME({
      id: 't',
      lifecycle: 'tolerate',
      businessValue: 3,
      technicalHealth: 3,
      strategicAlignment: 3,
    })
    expect(tolerate).toBe('Tolerate')
  })

  it('produces expected TIME mix in GRA seed', () => {
    const pack = loadTenantPack('GRA')
    const ctx = { p2pIntegrationCountByApp: buildP2PCounts(pack.integrations) }
    const counts = { Invest: 0, Tolerate: 0, Migrate: 0, Eliminate: 0 }
    for (const app of pack.applications) {
      counts[classifyTIME(app, ctx)] += 1
    }
    expect(counts.Invest).toBeGreaterThanOrEqual(3)
    expect(counts.Migrate).toBeGreaterThanOrEqual(3)
    expect(counts.Eliminate).toBeGreaterThanOrEqual(2)
    expect(counts.Tolerate).toBeGreaterThanOrEqual(2)
  })

  it('detects duplication clusters', () => {
    const pack = loadTenantPack('GRA')
    const clusters = findDuplicationClusters(pack.applications)
    expect(clusters.length).toBeGreaterThanOrEqual(2)
    for (const c of clusters) {
      expect(c.applications.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('computes portfolio insights linked to applications', () => {
    const pack = loadTenantPack('GRA')
    const insights = portfolioInsights({
      applications: pack.applications,
      integrations: pack.integrations,
      findings: pack.findings,
      capabilities: pack.capabilities,
    })
    expect(insights.endOfSupport.length).toBeGreaterThan(0)
    expect(insights.weakCritical.length).toBeGreaterThan(0)
  })

  it('heatmap values match source capability fields', () => {
    const pack = loadTenantPack('GRA')
    const cap = pack.capabilities[0]
    expect(heatmapValue('maturity', cap, pack.applications)).toBe(cap.maturityCurrent)
    expect(heatmapValue('risk', cap, pack.applications)).toBe(cap.riskScore)
    expect(heatmapValue('importance', cap, pack.applications)).toBe(cap.strategicImportance)
    expect(heatmapValue('investment', cap, pack.applications)).toBe(cap.investmentPriority)
    const support = capabilityApplicationSupport(cap.id, pack.applications)
    expect(support).toBeGreaterThanOrEqual(1)
    expect(support).toBeLessThanOrEqual(5)
  })

  it('repository resolves capability ↔ application both ways', () => {
    const repo = getTenantRepository('GRA')
    const cap = repo.getPriorityCapability()
    const apps = repo.applicationsForCapability(cap.id)
    expect(apps.length).toBeGreaterThan(0)
    const back = repo.capabilitiesForApplication(apps[0].id)
    expect(back.some((c) => c.id === cap.id || apps[0].supportedCapabilityIds.includes(c.id))).toBe(
      true,
    )
  })

  it('demo reset restores Phase 1B defaults', () => {
    const store = usePrototypeStore.getState()
    store.setHeatmapMode('support')
    store.setPortfolioFilters({ timeClass: 'Eliminate', search: 'x' })
    store.setView('applications')
    store.selectEntity({ id: 'app-gra-01', type: 'application' })
    store.resetDemo()
    const after = usePrototypeStore.getState()
    expect(after.heatmapMode).toBe('risk')
    expect(after.portfolioFilters.timeClass).toBe('')
    expect(after.portfolioFilters.search).toBe('')
    expect(after.view).toBe('executive')
    expect(after.selectedEntity).toBeNull()
    expect(after.compareCapabilityIds).toEqual([])
  })
})

describe('Phase 1B connected journey selectors', () => {
  beforeEach(() => clearTenantCache())

  it('supports high-risk capability → app → finding path', () => {
    const repo = getTenantRepository('GRA')
    const highRisk = [...repo.listCapabilities()].sort((a, b) => b.riskScore - a.riskScore)[0]
    expect(highRisk.riskScore).toBeGreaterThan(3)
    const apps = repo.applicationsForCapability(highRisk.id)
    const findings =
      repo.findingsForCapability(highRisk.id).length > 0
        ? repo.findingsForCapability(highRisk.id)
        : apps.flatMap((a) => repo.findingsForApplication(a.id))
    expect(apps.length + findings.length).toBeGreaterThan(0)
  })
})
