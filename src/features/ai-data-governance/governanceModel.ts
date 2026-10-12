import type { AiGovernanceStatus, AiSolution, DataGovernanceMaturity } from '../../domain/entities/types'
import {
  genericGovernanceCatalog,
  graGovernanceCatalog,
  type GovernanceApprovalStatus,
  type GovernanceCatalog,
  type GovernanceExceptionRecord,
  type GovernancePolicyRecord,
} from '../../data/tenants/gra/aiDataGovernance'
import {
  enrichAiSolution,
  governanceTone,
  mapAiTypeFilterLabel,
  type PortfolioAiSolution,
} from '../ai-automation/portfolioModel'
import {
  enrichDataDomain,
  isDataDomain,
  type PortfolioDataDomain,
} from '../data-information/portfolioModel'

export { isDataDomain }

export type { GovernanceCatalog, GovernancePolicyRecord, GovernanceApprovalStatus }

export type GovAiFilters = {
  search: string
  risk: string
  autonomy: string
  lifecycle: string
  ownership: '' | 'assigned' | 'unassigned'
  governance: string
  approval: string
  idSet: string[] | null
}

export type GovDataFilters = {
  search: string
  classification: string
  ownership: '' | 'assigned' | 'unassigned'
  residency: string
  quality: string
  risk: string
  governance: string
  idSet: string[] | null
}

export const emptyGovAiFilters = (): GovAiFilters => ({
  search: '',
  risk: '',
  autonomy: '',
  lifecycle: '',
  ownership: '',
  governance: '',
  approval: '',
  idSet: null,
})

export const emptyGovDataFilters = (): GovDataFilters => ({
  search: '',
  classification: '',
  ownership: '',
  residency: '',
  quality: '',
  risk: '',
  governance: '',
  idSet: null,
})

export function getCatalog(tenantCode: string): GovernanceCatalog {
  const code = (tenantCode || '').toUpperCase()
  if (code === 'GRA') return graGovernanceCatalog
  return genericGovernanceCatalog
}

export function mapDataGovStatus(maturity: DataGovernanceMaturity): AiGovernanceStatus {
  if (maturity === 'High') return 'Complete'
  if (maturity === 'Medium') return 'Partial'
  return 'Gap'
}

export function dataGovernanceGapScore(maturity: DataGovernanceMaturity): number {
  if (maturity === 'High') return 1
  if (maturity === 'Medium') return 2.5
  return 4
}

function riskScore(r: string): number {
  if (r === 'Critical') return 4
  if (r === 'High') return 3
  if (r === 'Medium') return 2
  return 1
}

export function resolveAiApprovalStatus(
  sol: AiSolution,
  catalog: GovernanceCatalog,
): GovernanceApprovalStatus {
  const override = catalog.aiApprovalOverrides[sol.id]
  if (override) return override.approvalStatus
  if (sol.lifecycle === 'RETIRED') return 'Expired'
  if (sol.governanceStatus === 'Complete' && sol.lifecycle !== 'EXPERIMENT') return 'Approved'
  if (sol.governanceStatus === 'Partial') return 'Approved with Conditions'
  if (sol.governanceStatus === 'Gap' || sol.governanceStatus === 'Not Assessed') {
    if (sol.lifecycle === 'EXPERIMENT') return 'Pending'
    return 'Pending'
  }
  return 'Pending'
}

export function policiesForAsset(catalog: GovernanceCatalog, assetId: string): GovernancePolicyRecord[] {
  return catalog.policies.filter((p) => p.applicableAssetIds.includes(assetId))
}

export function exceptionsForSubject(
  catalog: GovernanceCatalog,
  subjectId: string,
): GovernanceExceptionRecord[] {
  return catalog.exceptions.filter((e) => e.subjectId === subjectId)
}

export function isAiGoverned(sol: AiSolution): boolean {
  return sol.governanceStatus === 'Complete' || sol.governanceStatus === 'Partial'
}

export function isDataGoverned(row: PortfolioDataDomain): boolean {
  const status = mapDataGovStatus(row.governanceMaturity)
  return status === 'Complete' || status === 'Partial'
}

export type GovernanceMetrics = {
  aiAssetsGoverned: number
  highRiskAi: number
  governanceGaps: number
  dataDomainsGoverned: number
  openApprovals: number
  activeExceptions: number
}

export function computeGovernanceMetrics(
  aiRows: PortfolioAiSolution[],
  dataRows: PortfolioDataDomain[],
  catalog: GovernanceCatalog,
): GovernanceMetrics {
  const aiAssetsGoverned = aiRows.filter((r) => isAiGoverned(r.sol)).length
  const highRiskAi = aiRows.filter(
    (r) => r.sol.riskLevel === 'High' || r.sol.riskLevel === 'Critical',
  ).length
  const governanceGaps =
    aiRows.filter((r) => r.governanceGap).length +
    dataRows.filter((r) => mapDataGovStatus(r.governanceMaturity) === 'Gap').length
  const dataDomainsGoverned = dataRows.filter((r) => isDataGoverned(r)).length
  const openApprovals = catalog.approvals.filter((a) => a.status === 'Pending').length
  const activeExceptions = catalog.exceptions.filter((e) => e.status === 'Active').length
  return {
    aiAssetsGoverned,
    highRiskAi,
    governanceGaps,
    dataDomainsGoverned,
    openApprovals,
    activeExceptions,
  }
}

export function filterGovernanceAi(
  rows: PortfolioAiSolution[],
  filters: GovAiFilters,
  catalog: GovernanceCatalog,
): PortfolioAiSolution[] {
  const q = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    const s = row.sol
    if (filters.idSet?.length && !filters.idSet.includes(s.id)) return false
    if (q) {
      const hay = [s.name, s.description, s.solutionType, row.ownerLabel || ''].join(' ').toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (filters.risk === 'elevated') {
      if (s.riskLevel !== 'High' && s.riskLevel !== 'Critical') return false
    } else if (filters.risk && s.riskLevel !== filters.risk) return false
    if (filters.autonomy && String(s.autonomyLevel) !== filters.autonomy) return false
    if (filters.lifecycle && s.lifecycle !== filters.lifecycle) return false
    if (filters.ownership === 'assigned' && row.ownershipGap) return false
    if (filters.ownership === 'unassigned' && !row.ownershipGap) return false
    if (filters.governance && s.governanceStatus !== filters.governance) return false
    if (filters.approval) {
      const status = resolveAiApprovalStatus(s, catalog)
      if (status !== filters.approval) return false
    }
    return true
  })
}

export function filterGovernanceData(
  rows: PortfolioDataDomain[],
  filters: GovDataFilters,
): PortfolioDataDomain[] {
  const q = filters.search.trim().toLowerCase()
  return rows.filter((row) => {
    if (!isDataDomain(row.data)) return false
    const d = row.data
    if (filters.idSet?.length && !filters.idSet.includes(d.id)) return false
    if (q) {
      const hay = [
        d.name,
        d.description,
        row.businessOwnerLabel || '',
        row.dataStewardLabel || '',
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (filters.classification && row.classificationLabel !== filters.classification) return false
    if (filters.ownership === 'assigned' && row.ownershipGap) return false
    if (filters.ownership === 'unassigned' && !row.ownershipGap) return false
    if (filters.residency && row.residencyStatus !== filters.residency) return false
    if (filters.quality && row.qualityStatus !== filters.quality) return false
    if (filters.risk === 'elevated') {
      if (row.risk !== 'High' && row.risk !== 'Critical') return false
    } else if (filters.risk && row.risk !== filters.risk) return false
    if (filters.governance) {
      if (mapDataGovStatus(row.governanceMaturity) !== filters.governance) return false
    }
    return true
  })
}

export type AiAutonomyRiskHighlight = {
  id: string
  name: string
  riskScore: number
  autonomy: number
  flags: string[]
}

export function aiAutonomyRiskPoints(rows: PortfolioAiSolution[]): AiAutonomyRiskHighlight[] {
  return rows.map((row) => {
    const s = row.sol
    const flags: string[] = []
    if (s.autonomyLevel >= 3 && (s.riskLevel === 'High' || s.riskLevel === 'Critical')) {
      flags.push('High autonomy + high risk')
    }
    if (row.oversightGap) flags.push('Missing oversight')
    if (row.hasElevatedPermissions) flags.push('Elevated permissions')
    if (row.governanceGap) flags.push('Governance gap')
    const gd = s.governanceDetail
    if (gd && (gd.guardrails === 'Gap' || gd.guardrails === 'Partial')) {
      flags.push('Incomplete guardrails')
    }
    return {
      id: s.id,
      name: s.name,
      riskScore: riskScore(s.riskLevel),
      autonomy: s.autonomyLevel + 1,
      flags,
    }
  })
}

export type DataCriticalityGapHighlight = {
  id: string
  name: string
  criticalityScore: number
  gapScore: number
  flags: string[]
}

export function dataCriticalityGapPoints(rows: PortfolioDataDomain[]): DataCriticalityGapHighlight[] {
  return rows
    .filter((r) => isDataDomain(r.data))
    .map((row) => {
      const flags: string[] = []
      if (row.ownershipGap) flags.push('Ownership gap')
      if (row.authoritativeSourceStatus === 'Multiple Sources') flags.push('Multiple sources')
      if (
        row.residencyStatus === 'Review Required' ||
        row.residencyStatus === 'Cross-Border'
      ) {
        flags.push('Residency review')
      }
      if (row.qualityStatus === 'Poor' || row.qualityStatus === 'Watch') {
        flags.push('Quality concern')
      }
      if (!row.dataStewardLabel) flags.push('Missing stewardship')
      return {
        id: row.data.id,
        name: row.data.name,
        criticalityScore: row.criticalityScore,
        gapScore: dataGovernanceGapScore(row.governanceMaturity),
        flags,
      }
    })
}

export function approvalTone(status: GovernanceApprovalStatus | string) {
  if (status === 'Approved') return 'good'
  if (status === 'Approved with Conditions' || status === 'Pending') return 'warn'
  if (status === 'Active') return 'warn'
  return 'bad'
}

export function governanceStatusTone(status: AiGovernanceStatus) {
  return governanceTone(status)
}

export function enrichAiForGovernance(
  sol: AiSolution,
  ctx: Parameters<typeof enrichAiSolution>[1],
) {
  return enrichAiSolution(sol, ctx)
}

export function enrichDataForGovernance(
  data: Parameters<typeof enrichDataDomain>[0],
  ctx: Parameters<typeof enrichDataDomain>[1],
) {
  return enrichDataDomain(data, ctx)
}

export function aiTypeLabel(solutionType: string) {
  return mapAiTypeFilterLabel(solutionType)
}
