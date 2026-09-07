import { describe, expect, it } from 'vitest'
import bogPack from '@/data/tenants/bog/pack'
import { bogConfig } from '@/data/tenants/bog/config'
import { validateTenantPack } from '@/data/validators/validateTenant'

describe('BoG tenant pack', () => {
  it('passes Zod + reference integrity validation', () => {
    const pack = validateTenantPack(bogPack)
    expect(pack.tenant.id).toBe('tenant-bog')
    expect(pack.tenant.code).toBe('BOG')
  })

  it('meets approximate volume targets and scenario requirements', () => {
    const pack = validateTenantPack(bogPack)
    expect(pack.strategicObjectives.length).toBeGreaterThanOrEqual(6)
    expect(pack.strategicObjectives.length).toBeLessThanOrEqual(8)
    expect(pack.capabilities.length).toBeGreaterThanOrEqual(30)
    expect(pack.capabilities.length).toBeLessThanOrEqual(45)
    expect(pack.processes.length).toBeGreaterThanOrEqual(20)
    expect(pack.applications.length).toBeGreaterThanOrEqual(25)
    expect(pack.integrations.length).toBeGreaterThanOrEqual(30)
    expect(pack.dataObjects.length).toBeGreaterThanOrEqual(15)
    expect(pack.technologies.length).toBeGreaterThanOrEqual(20)
    expect(pack.findings.length).toBeGreaterThanOrEqual(12)
    expect(pack.evidence.length).toBeGreaterThanOrEqual(12)
    expect(pack.recommendations.length).toBeGreaterThanOrEqual(8)
    expect(pack.decisions?.length).toBeGreaterThanOrEqual(5)
    expect(pack.initiatives.length).toBeGreaterThanOrEqual(6)
    expect(pack.kpis.length).toBeGreaterThanOrEqual(10)
    expect(pack.scenarios?.map((s) => s.id).sort()).toEqual([
      'scenario-bog-governance',
      'scenario-bog-lineage',
      'scenario-bog-payments',
    ])
    expect(bogConfig.defaultScenarioId).toBe('scenario-bog-payments')
    expect(bogConfig.displayName).toBe('Bank of Ghana')
    expect(bogConfig.lettermark).toBe('BG')
    expect(bogConfig.accentColor).toBe('#1a4a66')
    expect(bogConfig.code).toBe('BOG')
    expect(bogConfig.roleLabels.length).toBeGreaterThan(0)
  })

  it('ensures critical findings have evidence and recommendations address findings', () => {
    const pack = validateTenantPack(bogPack)
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
