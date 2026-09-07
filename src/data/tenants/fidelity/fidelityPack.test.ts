import { describe, expect, it } from 'vitest'
import fidelityPack from '@/data/tenants/fidelity/pack'
import { fidelityConfig } from '@/data/tenants/fidelity/config'
import { validateTenantPack } from '@/data/validators/validateTenant'

describe('Fidelity tenant pack', () => {
  it('passes Zod + reference integrity validation', () => {
    const pack = validateTenantPack(fidelityPack)
    expect(pack.tenant.id).toBe('tenant-fid')
    expect(pack.tenant.code).toBe('FIDELITY')
  })

  it('meets approximate volume targets and scenario requirements', () => {
    const pack = validateTenantPack(fidelityPack)
    expect(pack.strategicObjectives.length).toBeGreaterThanOrEqual(6)
    expect(pack.strategicObjectives.length).toBeLessThanOrEqual(8)
    expect(pack.capabilities.length).toBeGreaterThanOrEqual(30)
    expect(pack.capabilities.length).toBeLessThanOrEqual(45)
    expect(pack.processes.length).toBeGreaterThanOrEqual(20)
    expect(pack.applications.length).toBeGreaterThanOrEqual(25)
    expect(pack.integrations.length).toBeGreaterThanOrEqual(35)
    expect(pack.dataObjects.length).toBeGreaterThanOrEqual(15)
    expect(pack.technologies.length).toBeGreaterThanOrEqual(20)
    expect(pack.findings.length).toBeGreaterThanOrEqual(12)
    expect(pack.evidence.length).toBeGreaterThanOrEqual(12)
    expect(pack.recommendations.length).toBeGreaterThanOrEqual(8)
    expect(pack.decisions?.length).toBeGreaterThanOrEqual(5)
    expect(pack.initiatives.length).toBeGreaterThanOrEqual(6)
    expect(pack.kpis.length).toBeGreaterThanOrEqual(10)
    expect(pack.scenarios?.map((s) => s.id).sort()).toEqual([
      'scenario-fid-api',
      'scenario-fid-customer360',
      'scenario-fid-lending',
    ])
    expect(fidelityConfig.defaultScenarioId).toBe('scenario-fid-customer360')
  })

  it('ensures critical findings have evidence and recommendations address findings', () => {
    const pack = validateTenantPack(fidelityPack)
    for (const f of pack.findings.filter((x) => x.severity === 'critical')) {
      expect(f.evidenceIds.length, f.id).toBeGreaterThan(0)
    }
    for (const r of pack.recommendations) {
      expect(r.findingIds.length, r.id).toBeGreaterThan(0)
    }
    for (const d of pack.decisions ?? []) {
      expect(pack.recommendations.some((r) => r.id === d.recommendationId), d.id).toBe(true)
    }
    for (const i of pack.initiatives) {
      expect(i.objectiveIds.length + i.capabilityIds.length, i.id).toBeGreaterThan(0)
      expect(i.recommendationIds.length > 0 || Boolean(i.decisionId), i.id).toBe(true)
    }
  })
})
