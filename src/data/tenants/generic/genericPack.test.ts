import { describe, expect, it } from 'vitest'
import genericPack from '@/data/tenants/generic/pack'
import { genericConfig } from '@/data/tenants/generic/config'
import { validateTenantPack } from '@/data/validators/validateTenant'

describe('Generic tenant pack', () => {
  it('passes Zod + reference integrity validation', () => {
    const pack = validateTenantPack(genericPack)
    expect(pack.tenant.id).toBe('tenant-gen')
    expect(pack.tenant.code).toBe('GENERIC')
  })

  it('meets volume targets and scenario requirements', () => {
    const pack = validateTenantPack(genericPack)
    expect(pack.strategicObjectives.length).toBeGreaterThanOrEqual(5)
    expect(pack.capabilities.length).toBeGreaterThanOrEqual(24)
    expect(pack.processes.length).toBeGreaterThanOrEqual(15)
    expect(pack.applications.length).toBeGreaterThanOrEqual(20)
    expect(pack.integrations.length).toBeGreaterThanOrEqual(25)
    expect(pack.dataObjects.length).toBeGreaterThanOrEqual(12)
    expect(pack.technologies.length).toBeGreaterThanOrEqual(15)
    expect(pack.findings.length).toBeGreaterThanOrEqual(10)
    expect(pack.evidence.length).toBeGreaterThanOrEqual(10)
    expect(pack.recommendations.length).toBeGreaterThanOrEqual(6)
    expect(pack.decisions?.length).toBeGreaterThanOrEqual(4)
    expect(pack.initiatives.length).toBeGreaterThanOrEqual(5)
    expect(pack.kpis.length).toBeGreaterThanOrEqual(8)
    expect(pack.scenarios?.map((s) => s.id).sort()).toEqual([
      'scenario-gen-cx',
      'scenario-gen-data',
      'scenario-gen-simplify',
    ])
    expect(genericConfig.defaultScenarioId).toBe('scenario-gen-cx')
  })

  it('ensures critical findings have evidence and recommendations address findings', () => {
    const pack = validateTenantPack(genericPack)
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
