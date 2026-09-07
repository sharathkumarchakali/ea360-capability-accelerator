import { beforeEach, describe, expect, it } from 'vitest'
import {
  clearTenantCache,
  getTenantConfig,
  listAvailableTenants,
  loadTenantPack,
} from '@/data/repositories/tenantRepository'
import { listValidatedTenantCodes } from '@/data/tenants/registry'
import { askEA360, classifyIntent, configureEA360AI } from '@/lib/ai'
import { usePrototypeStore } from '@/state/prototypeStore'

describe('Phase 5 tenant registry', () => {
  it('lists four validated tenant codes with configs', () => {
    expect(listValidatedTenantCodes().sort()).toEqual(['BOG', 'FIDELITY', 'GENERIC', 'GRA'].sort())
    expect(listAvailableTenants()).toHaveLength(4)
    for (const t of listAvailableTenants()) {
      const cfg = getTenantConfig(t.code)
      expect(cfg.displayName).toBe(t.name)
      expect(cfg.lettermark).toBe(t.lettermark)
      expect(t.synthetic).toBe(true)
    }
  })
})

describe('tenant store isolation', () => {
  beforeEach(() => {
    clearTenantCache()
    usePrototypeStore.getState().resetAllTenants()
    configureEA360AI({
      getRepo: () => usePrototypeStore.getState().getRepo(),
      getMutations: () => usePrototypeStore.getState().mutations,
    })
  })

  it('switches tenants without leaking entity ids', () => {
    const store = usePrototypeStore.getState()
    expect(store.tenantCode).toBe('GRA')
    const graFinding = store.getRepo().listFindings()[0]
    expect(graFinding.tenantId).toBe('tenant-gra')
    store.selectEntity({ id: graFinding.id, type: 'finding' })
    store.addMutation('touched GRA finding')

    store.switchTenant('BOG')
    const after = usePrototypeStore.getState()
    expect(after.tenantCode).toBe('BOG')
    expect(after.selectedEntity).toBeNull()
    expect(after.askOpen).toBe(false)
    expect(after.mutations).toEqual([])
    expect(after.getRepo().getTenant().id).toBe('tenant-bog')
    expect(after.getRepo().listFindings().every((f) => f.tenantId === 'tenant-bog')).toBe(true)
    expect(after.getRepo().listFindings().some((f) => f.id === graFinding.id)).toBe(false)
    expect(after.workingPacks.GRA).toBeTruthy()
    expect(after.tenantSlices.GRA?.mutations.length).toBeGreaterThan(0)
  })

  it('restores prior tenant UI slice on switch back', () => {
    const store = usePrototypeStore.getState()
    store.addMutation('gra-mut-1')
    store.switchTenant('FIDELITY')
    expect(usePrototypeStore.getState().mutations).toEqual([])
    usePrototypeStore.getState().switchTenant('GRA')
    expect(usePrototypeStore.getState().mutations.some((m) => m.description === 'gra-mut-1')).toBe(
      true,
    )
    expect(usePrototypeStore.getState().getRepo().getTenant().code).toBe('GRA')
  })

  it('resetDemo resets only the active tenant', () => {
    const store = usePrototypeStore.getState()
    store.addMutation('gra-keep')
    store.switchTenant('GENERIC')
    usePrototypeStore.getState().addMutation('gen-clear')
    usePrototypeStore.getState().resetDemo()
    const after = usePrototypeStore.getState()
    expect(after.tenantCode).toBe('GENERIC')
    expect(after.mutations).toEqual([])
    expect(after.tenantSlices.GRA?.mutations.some((m) => m.description === 'gra-keep')).toBe(true)
  })

  it('resetAllTenants clears working packs and slices', () => {
    const store = usePrototypeStore.getState()
    store.switchTenant('BOG')
    usePrototypeStore.getState().addMutation('bog-mut')
    usePrototypeStore.getState().switchTenant('FIDELITY')
    usePrototypeStore.getState().addMutation('fid-mut')
    usePrototypeStore.getState().resetAllTenants()
    const after = usePrototypeStore.getState()
    expect(Object.keys(after.tenantSlices)).toHaveLength(0)
    expect(after.mutations).toEqual([])
    expect(after.workingPack?.tenant.code).toBe(after.tenantCode)
    expect(after.getRepo().listFindings().every((f) => f.tenantId === after.workingPack!.tenant.id)).toBe(
      true,
    )
  })

  it('AI answers only from the active tenant pack', () => {
    usePrototypeStore.getState().switchTenant('FIDELITY')
    const pack = usePrototypeStore.getState().getRepo().getPack()
    const response = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'executive',
      query: 'What are our most critical enterprise risks?',
    })
    expect(response.tenantId).toBe('tenant-fid')
    expect(response.intent).not.toBe('cross_tenant_refused')
    for (const id of response.evidenceIds || []) {
      expect(id.startsWith('ev-fid-') || pack.evidence.some((e) => e.id === id)).toBe(true)
    }

    const refused = askEA360({
      tenantId: pack.tenant.id,
      userRole: 'executive',
      query: 'Compare with Bank of Ghana',
    })
    expect(refused.intent).toBe('cross_tenant_refused')
  })

  it('does not refuse when the active tenant name is mentioned', () => {
    expect(classifyIntent('What are Fidelity critical risks?', undefined, 'FIDELITY')).not.toBe(
      'cross_tenant_refused',
    )
    expect(classifyIntent('What are Fidelity critical risks?', undefined, 'GRA')).toBe(
      'cross_tenant_refused',
    )
  })

  it('loads seed packs without cross-tenant id prefixes', () => {
    for (const code of listValidatedTenantCodes()) {
      const pack = loadTenantPack(code)
      const prefix =
        code === 'GRA' ? 'gra' : code === 'BOG' ? 'bog' : code === 'FIDELITY' ? 'fid' : 'gen'
      expect(pack.tenant.id).toContain(prefix === 'gra' ? 'gra' : prefix === 'bog' ? 'bog' : prefix)
      expect(pack.findings.every((f) => f.tenantId === pack.tenant.id)).toBe(true)
      expect(pack.applications.every((a) => !a.id.includes('-gra-') || code === 'GRA')).toBe(true)
    }
  })
})