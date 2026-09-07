import { describe, expect, it } from 'vitest'
import graPack from '@/data/tenants/gra/pack'
import {
  clearTenantCache,
  getTenantRepository,
  listAvailableTenants,
  loadTenantPack,
} from '@/data/repositories/tenantRepository'
import { validateTenantPack, TenantValidationError } from '@/data/validators/validateTenant'
import {
  applicationHealth,
  architectureMaturity,
  criticalRiskCount,
  deriveExecutiveMetrics,
  enterpriseHealth,
  strategicAlignment,
  transformationProgress,
} from '@/domain/metrics'

describe('GRA seed validation', () => {
  it('validates the GRA pack', () => {
    const pack = validateTenantPack(graPack)
    expect(pack.tenant.code).toBe('GRA')
    expect(pack.capabilities.length).toBeGreaterThanOrEqual(24)
    expect(pack.capabilities.length).toBeLessThanOrEqual(30)
    expect(pack.applications.length).toBeGreaterThanOrEqual(18)
    expect(pack.applications.length).toBeLessThanOrEqual(24)
    expect(pack.integrations.length).toBeGreaterThanOrEqual(25)
    expect(pack.integrations.length).toBeLessThanOrEqual(35)
    expect(pack.findings.length).toBeGreaterThanOrEqual(8)
    expect(pack.findings.length).toBeLessThanOrEqual(10)
    expect(pack.recommendations.length).toBeGreaterThanOrEqual(6)
    expect(pack.recommendations.length).toBeLessThanOrEqual(8)
    expect(pack.initiatives.length).toBeGreaterThanOrEqual(4)
    expect(pack.initiatives.length).toBeLessThanOrEqual(6)
    expect(pack.kpis.length).toBe(6)
  })

  it('loads through repository without throwing', () => {
    clearTenantCache()
    const pack = loadTenantPack('GRA')
    expect(pack.tenant.id).toBe('tenant-gra')
  })
})

describe('Broken relationship detection', () => {
  it('fails when a relationship points at a missing id', () => {
    const broken = structuredClone(graPack)
    broken.relationships.push({
      id: 'rel-broken',
      tenantId: broken.tenant.id,
      sourceId: 'missing-source',
      sourceType: 'capability',
      targetId: 'cap-gra-01',
      targetType: 'capability',
      relationshipType: 'depends-on',
      evidenceIds: [],
    })
    expect(() => validateTenantPack(broken)).toThrow(TenantValidationError)
  })

  it('fails when finding evidence id is missing', () => {
    const broken = structuredClone(graPack)
    broken.findings[0].evidenceIds = ['ev-does-not-exist']
    expect(() => validateTenantPack(broken)).toThrow(TenantValidationError)
  })
})

describe('Metric calculations', () => {
  const pack = validateTenantPack(graPack)

  it('computes architecture maturity as mean capability maturity', () => {
    const expected =
      pack.capabilities.reduce((s, c) => s + c.maturityCurrent, 0) / pack.capabilities.length
    expect(architectureMaturity(pack.capabilities)).toBe(Math.round(expected * 10) / 10)
  })

  it('counts critical open findings', () => {
    expect(criticalRiskCount(pack.findings)).toBe(
      pack.findings.filter(
        (f) =>
          f.severity === 'critical' &&
          (f.status === 'open' || f.status === 'in_progress' || f.status === 'accepted'),
      ).length,
    )
  })

  it('computes application health and transformation progress', () => {
    expect(applicationHealth(pack.applications)).toBeGreaterThan(0)
    expect(transformationProgress(pack.initiatives)).toBeGreaterThan(0)
    expect(strategicAlignment(pack.kpis)).toBeGreaterThan(0)
  })

  it('keeps enterprise health within 0–100 and reconciles with deriveExecutiveMetrics', () => {
    const derived = deriveExecutiveMetrics(pack)
    const health = enterpriseHealth({
      architectureMaturity: derived.architectureMaturity,
      criticalFindings: derived.criticalRiskCount,
      totalFindings: pack.findings.length,
      applicationHealth: derived.applicationHealth,
      transformationProgress: derived.transformationProgress,
    })
    expect(health).toBe(derived.enterpriseHealth)
    expect(health).toBeGreaterThanOrEqual(0)
    expect(health).toBeLessThanOrEqual(100)
  })
})

describe('Tenant repository isolation', () => {
  it('exposes all registered Phase 5 tenants', () => {
    expect(listAvailableTenants().map((t) => t.code).sort()).toEqual(
      ['BOG', 'FIDELITY', 'GENERIC', 'GRA'].sort(),
    )
  })

  it('repository returns only GRA tenant ids', () => {
    const repo = getTenantRepository('GRA')
    expect(repo.getTenant().id).toBe('tenant-gra')
    expect(repo.listCapabilities().every((c) => c.tenantId === 'tenant-gra')).toBe(true)
    expect(repo.listFindings().every((f) => f.tenantId === 'tenant-gra')).toBe(true)
  })

  it('supports connected journey from priority capability', () => {
    const repo = getTenantRepository('GRA')
    const cap = repo.getPriorityCapability()
    expect(cap).toBeTruthy()
    const apps = repo.applicationsForCapability(cap!.id)
    expect(apps.length).toBeGreaterThan(0)
    const findings = repo.findingsForCapability(cap!.id)
    expect(findings.length).toBeGreaterThan(0)
    const recs = repo.recommendationsForFinding(findings[0].id)
    expect(recs.length).toBeGreaterThan(0)
    const inits = repo.initiativesForRecommendation(recs[0].id)
    expect(inits.length).toBeGreaterThan(0)
  })
})
