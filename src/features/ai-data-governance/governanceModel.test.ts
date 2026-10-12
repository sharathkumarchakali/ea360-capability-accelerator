import { describe, expect, it } from 'vitest'
import { loadTenantPack } from '@/data/repositories/tenantRepository'
import { graGovernanceCatalog } from '@/data/tenants/gra/aiDataGovernance'
import { enrichAiSolution } from '../ai-automation/portfolioModel'
import { enrichDataDomain, isDataDomain } from '../data-information/portfolioModel'
import {
  computeGovernanceMetrics,
  getCatalog,
  mapDataGovStatus,
  resolveAiApprovalStatus,
} from './governanceModel'

describe('AI & Data governance model', () => {
  const pack = loadTenantPack('GRA')

  it('returns GRA catalog for GRA tenant', () => {
    expect(getCatalog('GRA').policies.length).toBeGreaterThanOrEqual(8)
    expect(getCatalog('BOG').policies.length).toBeGreaterThanOrEqual(1)
  })

  it('maps data governance maturity to governance status labels', () => {
    expect(mapDataGovStatus('High')).toBe('Complete')
    expect(mapDataGovStatus('Medium')).toBe('Partial')
    expect(mapDataGovStatus('Low')).toBe('Gap')
  })

  it('resolves AI approval from catalog overrides', () => {
    const sol = pack.aiSolutions.find((s) => s.id === 'ai-gra-11')
    expect(sol).toBeTruthy()
    expect(resolveAiApprovalStatus(sol!, graGovernanceCatalog)).toBe('Pending')
  })

  it('computes non-zero governance metrics for GRA', () => {
    const aiRows = pack.aiSolutions.map((s) =>
      enrichAiSolution(s, {
        capabilities: pack.capabilities,
        models: pack.aiModels,
        integrations: pack.integrations,
        applications: pack.applications,
        technologies: pack.technologies,
      }),
    )
    const dataRows = pack.dataObjects
      .filter(isDataDomain)
      .map((d) =>
        enrichDataDomain(d, {
          applications: pack.applications,
          capabilities: pack.capabilities,
          initiatives: pack.initiatives,
          integrations: pack.integrations,
        }),
      )
    const metrics = computeGovernanceMetrics(aiRows, dataRows, graGovernanceCatalog)
    expect(metrics.aiAssetsGoverned).toBeGreaterThan(0)
    expect(metrics.dataDomainsGoverned).toBeGreaterThan(0)
    expect(metrics.openApprovals).toBeGreaterThan(0)
    expect(metrics.activeExceptions).toBeGreaterThan(0)
  })
})
