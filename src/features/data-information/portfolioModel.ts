import type {
  Application,
  Capability,
  Criticality,
  DataAiReadiness,
  DataAuthoritativeSourceStatus,
  DataClassificationLabel,
  DataGovernanceMaturity,
  DataObject,
  DataPortfolioAction,
  DataQualityStatus,
  DataResidencyStatus,
  DataRiskLevel,
  Finding,
  Initiative,
  Integration,
} from '../../domain/entities/types'

export type MatrixQuadrant = 'Protect' | 'Prioritise' | 'Improve' | 'Monitor'

export type PortfolioDataDomain = {
  data: DataObject
  type: string
  criticality: Criticality
  businessOwnerLabel: string | null
  dataStewardLabel: string | null
  technicalCustodianLabel: string | null
  ownershipGap: boolean
  ownershipComplete: boolean
  authoritativeSourceStatus: DataAuthoritativeSourceStatus
  systemOfRecordName: string | null
  primaryApplicationName: string | null
  sourceApplicationNames: string[]
  consumerApplicationNames: string[]
  integrationNames: string[]
  classificationLabel: DataClassificationLabel
  qualityStatus: DataQualityStatus
  risk: DataRiskLevel
  governanceMaturity: DataGovernanceMaturity
  residencyStatus: DataResidencyStatus
  aiReadiness: DataAiReadiness
  portfolioAction: DataPortfolioAction | null
  capabilityNames: string[]
  matrixQuadrant: MatrixQuadrant
  criticalityScore: number
  governanceScore: number
  riskScore: number
  qualityScore: number
  aiScore: number
  inTransformation: boolean
  hasSourceConflict: boolean
}

export const DATA_STANDARDS: Record<string, { id: string; name: string }> = {
  'STD-DATA-001': { id: 'STD-DATA-001', name: 'Enterprise Data Ownership Standard' },
  'STD-DAT-003': { id: 'STD-DAT-003', name: 'Data Exchange and Lineage Control' },
  'STD-API-001': { id: 'STD-API-001', name: 'Enterprise API Design Standard' },
}

export const DATA_POLICIES: Record<string, { id: string; name: string }> = {
  'POL-DATA-004': { id: 'POL-DATA-004', name: 'Sensitive Data Handling Policy' },
}

const UNKNOWN_OWNER = /unknown|unassigned|none|tbd|^$/i

function personLabel(id?: string | null): string | null {
  if (!id || UNKNOWN_OWNER.test(String(id).trim())) return null
  const raw = String(id)
  if (!raw.startsWith('person-') && (raw.includes(' ') || /[A-Z]/.test(raw[0] || ''))) return raw
  return raw
    .replace(/^person-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function titleCaseClass(raw?: string | null): DataClassificationLabel {
  const v = (raw || '').toLowerCase()
  if (v === 'public') return 'Public'
  if (v === 'internal') return 'Internal'
  if (v === 'restricted' || v === 'highly sensitive' || v === 'highly-sensitive') {
    return v.includes('high') ? 'Highly Sensitive' : 'Restricted'
  }
  if (v === 'confidential') return 'Confidential'
  if (raw === 'Public' || raw === 'Internal' || raw === 'Confidential' || raw === 'Restricted' || raw === 'Highly Sensitive') {
    return raw
  }
  return 'Internal'
}

function isElevated(r: DataRiskLevel) {
  return r === 'Critical' || r === 'High'
}

function isHighCrit(c: Criticality) {
  return c === 'critical' || c === 'high'
}

function criticalityScore(c: Criticality): number {
  if (c === 'critical') return 4
  if (c === 'high') return 3
  if (c === 'medium') return 2
  return 1
}

function riskScoreOf(r: DataRiskLevel): number {
  if (r === 'Critical') return 4
  if (r === 'High') return 3
  if (r === 'Medium') return 2
  return 1
}

function qualityScoreOf(q: DataQualityStatus): number {
  if (q === 'Good') return 4
  if (q === 'Watch') return 3
  if (q === 'Poor') return 2
  return 1
}

function aiScoreOf(a: DataAiReadiness): number {
  if (a === 'Ready') return 4
  if (a === 'Conditional') return 3
  if (a === 'Not Ready') return 2
  return 1
}

function governanceScoreOf(g: DataGovernanceMaturity): number {
  if (g === 'High') return 4
  if (g === 'Medium') return 2.5
  return 1
}

function appName(id: string | null | undefined, apps: Application[]): string | null {
  if (!id) return null
  return apps.find((a) => a.id === id)?.name || id
}

function deriveGovernance(
  ownershipComplete: boolean,
  source: DataAuthoritativeSourceStatus,
  quality: DataQualityStatus,
  seeded?: DataGovernanceMaturity,
): DataGovernanceMaturity {
  if (seeded) return seeded
  if (ownershipComplete && source === 'Confirmed' && quality === 'Good') return 'High'
  if (!ownershipComplete || source === 'Unknown' || quality === 'Poor') return 'Low'
  return 'Medium'
}

function deriveRisk(
  criticality: Criticality,
  ownershipGap: boolean,
  source: DataAuthoritativeSourceStatus,
  quality: DataQualityStatus,
  seeded?: DataRiskLevel,
): DataRiskLevel {
  if (seeded) return seeded
  if (isHighCrit(criticality) && (ownershipGap || source === 'Unknown' || quality === 'Poor')) return 'High'
  if (source === 'Multiple Sources' || quality === 'Poor') return 'High'
  if (quality === 'Watch' || source === 'Under Review') return 'Medium'
  return 'Low'
}

function resolveMatrixQuadrant(
  criticality: Criticality,
  governance: DataGovernanceMaturity,
): MatrixQuadrant {
  const highCrit = isHighCrit(criticality)
  const strongGov = governance === 'High'
  if (highCrit && strongGov) return 'Protect'
  if (highCrit && !strongGov) return 'Prioritise'
  if (!highCrit && !strongGov) return 'Improve'
  return 'Monitor'
}

export function isDataDomain(d: DataObject) {
  return (d.type || 'Data Domain') === 'Data Domain'
}

export function enrichDataDomain(
  d: DataObject,
  ctx: {
    applications: Application[]
    capabilities: Capability[]
    initiatives: Initiative[]
    integrations?: Integration[]
  },
): PortfolioDataDomain {
  const criticality = d.criticality || 'medium'
  const businessOwnerLabel = personLabel(d.businessOwner ?? d.ownerId)
  const dataStewardLabel = personLabel(d.dataSteward)
  const technicalCustodianLabel = personLabel(d.technicalCustodian)
  const ownershipComplete = Boolean(businessOwnerLabel && dataStewardLabel && technicalCustodianLabel)
  const ownershipGap = !ownershipComplete
  const authoritativeSourceStatus: DataAuthoritativeSourceStatus =
    d.authoritativeSourceStatus || 'Unknown'
  const qualityStatus: DataQualityStatus = d.qualityStatus || 'Not Assessed'
  const classificationLabel = d.classificationLabel || titleCaseClass(d.classification)
  const governanceMaturity = deriveGovernance(
    ownershipComplete,
    authoritativeSourceStatus,
    qualityStatus,
    d.governanceMaturity,
  )
  const risk = deriveRisk(criticality, ownershipGap, authoritativeSourceStatus, qualityStatus, d.risk)
  const residencyStatus: DataResidencyStatus = d.residencyStatus || 'Unknown'
  const aiReadiness: DataAiReadiness = d.aiReadiness || 'Not Assessed'
  const caps = (d.businessCapabilityIds || [])
    .map((id) => ctx.capabilities.find((c) => c.id === id))
    .filter(Boolean) as Capability[]
  const initiativeIds = [
    ...(d.initiativeIds || []),
    ...ctx.initiatives
      .filter((init) => (init as Initiative & { dataObjectIds?: string[] }).dataObjectIds?.includes(d.id))
      .map((init) => init.id),
  ]
  const uniqueInitIds = [...new Set(initiativeIds)]
  const inTransformation = ctx.initiatives.some(
    (init) =>
      uniqueInitIds.includes(init.id) &&
      !['completed', 'cancelled', 'retired'].includes((init.status || '').toLowerCase()),
  )
  const sourceIds = d.sourceApplicationIds || []
  const consumerIds = d.consumerApplicationIds || []
  const intIds = d.integrationIds || []
  const intMap = new Map((ctx.integrations || []).map((i) => [i.id, i]))

  return {
    data: { ...d, initiativeIds: uniqueInitIds },
    type: d.type || 'Data Domain',
    criticality,
    businessOwnerLabel,
    dataStewardLabel,
    technicalCustodianLabel,
    ownershipGap,
    ownershipComplete,
    authoritativeSourceStatus,
    systemOfRecordName: appName(d.systemOfRecordApplicationId, ctx.applications),
    primaryApplicationName: appName(d.primaryApplicationId || d.systemOfRecordApplicationId, ctx.applications),
    sourceApplicationNames: sourceIds.map((id) => appName(id, ctx.applications) || id),
    consumerApplicationNames: consumerIds.map((id) => appName(id, ctx.applications) || id),
    integrationNames: intIds.map((id) => intMap.get(id)?.name || intMap.get(id)?.apiOrInterfaceName || id),
    classificationLabel,
    qualityStatus,
    risk,
    governanceMaturity,
    residencyStatus,
    aiReadiness,
    portfolioAction: d.portfolioAction || null,
    capabilityNames: caps.map((c) => c.name),
    matrixQuadrant: resolveMatrixQuadrant(criticality, governanceMaturity),
    criticalityScore: criticalityScore(criticality),
    governanceScore: governanceScoreOf(governanceMaturity),
    riskScore: riskScoreOf(risk),
    qualityScore: qualityScoreOf(qualityStatus),
    aiScore: aiScoreOf(aiReadiness),
    inTransformation,
    hasSourceConflict: authoritativeSourceStatus === 'Multiple Sources',
  }
}

export type PortfolioDataMetrics = {
  total: number
  criticalDomains: number
  ownershipCoverage: number
  trustedSourceCoverage: number
  highRisk: number
  aiReadyPct: number
  residencyIssues: number
  qualityIssues: number
}

export function computePortfolioMetrics(rows: PortfolioDataDomain[]): PortfolioDataMetrics {
  const domains = rows.filter((r) => r.type === 'Data Domain')
  const total = domains.length
  const criticalDomains = domains.filter((r) => r.criticality === 'critical').length
  const owned = domains.filter((r) => r.ownershipComplete).length
  const trusted = domains.filter((r) => r.authoritativeSourceStatus === 'Confirmed').length
  const highRisk = domains.filter((r) => isElevated(r.risk)).length
  const aiReady = domains.filter((r) => r.aiReadiness === 'Ready').length
  const residencyIssues = domains.filter(
    (r) => r.residencyStatus === 'Review Required' || r.residencyStatus === 'Cross-Border',
  ).length
  const qualityIssues = domains.filter(
    (r) => r.qualityStatus === 'Poor' || r.qualityStatus === 'Watch',
  ).length
  return {
    total,
    criticalDomains,
    ownershipCoverage: total ? Math.round((owned / total) * 100) : 100,
    trustedSourceCoverage: total ? Math.round((trusted / total) * 100) : 100,
    highRisk,
    aiReadyPct: total ? Math.round((aiReady / total) * 100) : 0,
    residencyIssues,
    qualityIssues,
  }
}

export function sourceOfTruthMix(rows: PortfolioDataDomain[]) {
  const keys: DataAuthoritativeSourceStatus[] = [
    'Confirmed',
    'Multiple Sources',
    'Under Review',
    'Unknown',
  ]
  return keys.map((key) => ({
    key,
    count: rows.filter((r) => r.type === 'Data Domain' && r.authoritativeSourceStatus === key).length,
  }))
}

export function classificationMix(rows: PortfolioDataDomain[]) {
  const keys: DataClassificationLabel[] = [
    'Public',
    'Internal',
    'Confidential',
    'Restricted',
    'Highly Sensitive',
  ]
  return keys.map((key) => ({
    key,
    count: rows.filter((r) => r.type === 'Data Domain' && r.classificationLabel === key).length,
  }))
}

export function portfolioSignal(rows: PortfolioDataDomain[]) {
  const domains = rows.filter((r) => r.type === 'Data Domain')
  const criticalIssues = domains.filter(
    (r) =>
      isHighCrit(r.criticality) &&
      (r.ownershipGap ||
        r.authoritativeSourceStatus !== 'Confirmed' ||
        r.qualityStatus === 'Poor' ||
        r.qualityStatus === 'Watch' ||
        isElevated(r.risk)),
  )
  const ownershipGaps = domains.filter((r) => r.ownershipGap)
  const criticalOwnershipGaps = domains.filter((r) => isHighCrit(r.criticality) && r.ownershipGap)
  const criticalNoSource = domains.filter(
    (r) => isHighCrit(r.criticality) && r.authoritativeSourceStatus !== 'Confirmed',
  )
  const highValueNotAiReady = domains.filter(
    (r) =>
      isHighCrit(r.criticality) &&
      (r.aiReadiness === 'Not Ready' || r.aiReadiness === 'Conditional' || r.aiReadiness === 'Not Assessed'),
  )
  const crossBorderReview = domains.filter(
    (r) =>
      isHighCrit(r.criticality) &&
      (r.residencyStatus === 'Review Required' || r.residencyStatus === 'Cross-Border'),
  )
  const topReuse = [...domains].sort(
    (a, b) =>
      (b.data.consumerApplicationIds || []).length +
      (b.data.sourceApplicationIds || []).length -
      ((a.data.consumerApplicationIds || []).length + (a.data.sourceApplicationIds || []).length),
  )[0]
  const reusedAppCount = topReuse
    ? new Set([
        ...(topReuse.data.consumerApplicationIds || []),
        ...(topReuse.data.sourceApplicationIds || []),
      ]).size
    : 0

  const headlineCount = criticalIssues.length
  const supportingNames = criticalIssues
    .slice(0, 2)
    .map((r) => r.data.name.replace(/ Data$/, ''))
    .join(' and ')

  return {
    headlineCount,
    supportingNames,
    criticalIssueIds: criticalIssues.map((r) => r.data.id),
    ownershipGapIds: ownershipGaps.map((r) => r.data.id),
    ownershipGapCount: ownershipGaps.length,
    criticalOwnershipGapCount: criticalOwnershipGaps.length,
    criticalOwnershipGapPct: domains.filter((r) => isHighCrit(r.criticality)).length
      ? Math.round(
          (criticalOwnershipGaps.length /
            domains.filter((r) => isHighCrit(r.criticality)).length) *
            100,
        )
      : 0,
    criticalNoSourceCount: criticalNoSource.length,
    criticalNoSourceIds: criticalNoSource.map((r) => r.data.id),
    highValueNotAiReadyCount: highValueNotAiReady.length,
    highValueNotAiReadyIds: highValueNotAiReady.map((r) => r.data.id),
    crossBorderReviewCount: crossBorderReview.length,
    crossBorderReviewIds: crossBorderReview.map((r) => r.data.id),
    topReuseName: topReuse?.data.name || null,
    topReuseAppCount: reusedAppCount,
  }
}

export function portfolioInsights(rows: PortfolioDataDomain[]) {
  const signal = portfolioSignal(rows)
  const insights: { id: string; title: string; ids: string[] }[] = []
  if (signal.criticalNoSourceCount > 0) {
    insights.push({
      id: 'no-source',
      title: `${signal.criticalNoSourceCount} Critical Domains Lack a Confirmed Source of Truth`,
      ids: signal.criticalNoSourceIds,
    })
  }
  if (signal.ownershipGapCount > 0) {
    insights.push({
      id: 'ownership',
      title: `${signal.ownershipGapCount} Data Domains Have Incomplete Ownership`,
      ids: signal.ownershipGapIds,
    })
  }
  if (signal.highValueNotAiReadyCount > 0) {
    insights.push({
      id: 'ai',
      title: `${signal.highValueNotAiReadyCount} High-Value Domains Are Not Yet AI-Ready`,
      ids: signal.highValueNotAiReadyIds,
    })
  }
  if (signal.crossBorderReviewCount > 0) {
    insights.push({
      id: 'residency',
      title: `${signal.crossBorderReviewCount} Critical Domains Have Cross-Border Review Requirements`,
      ids: signal.crossBorderReviewIds,
    })
  }
  if (signal.topReuseName && signal.topReuseAppCount >= 3) {
    insights.push({
      id: 'reuse',
      title: `${signal.topReuseName} Appears Across ${signal.topReuseAppCount} Core Applications`,
      ids: signal.criticalIssueIds.filter((id) => id === rows.find((r) => r.data.name === signal.topReuseName)?.data.id),
    })
  }
  return insights.slice(0, 5)
}

export function matrixSample(rows: PortfolioDataDomain[], limit = 12): PortfolioDataDomain[] {
  const domains = rows.filter((r) => r.type === 'Data Domain')
  if (domains.length <= limit) return domains
  const byQuad: Record<MatrixQuadrant, PortfolioDataDomain[]> = {
    Protect: [],
    Prioritise: [],
    Improve: [],
    Monitor: [],
  }
  for (const r of domains) byQuad[r.matrixQuadrant].push(r)
  for (const q of Object.keys(byQuad) as MatrixQuadrant[]) {
    byQuad[q].sort(
      (a, b) =>
        b.criticalityScore + b.riskScore - (a.criticalityScore + a.riskScore) ||
        a.data.name.localeCompare(b.data.name),
    )
  }
  const out: PortfolioDataDomain[] = []
  const order: MatrixQuadrant[] = ['Prioritise', 'Protect', 'Improve', 'Monitor']
  let i = 0
  while (out.length < limit) {
    let added = false
    for (const q of order) {
      if (out.length >= limit) break
      const candidate = byQuad[q][i]
      if (candidate) {
        out.push(candidate)
        added = true
      }
    }
    if (!added) break
    i += 1
  }
  return out
}

export type DataFilterState = {
  search: string
  criticality: string
  ownership: '' | 'assigned' | 'unassigned'
  authoritativeSource: string
  classification: string
  risk: string
  quality: string
  residency: string
  aiReadiness: string
  capabilityId: string
  applicationId: string
  idSet: string[]
}

export const emptyDataFilters: DataFilterState = {
  search: '',
  criticality: '',
  ownership: '',
  authoritativeSource: '',
  classification: '',
  risk: '',
  quality: '',
  residency: '',
  aiReadiness: '',
  capabilityId: '',
  applicationId: '',
  idSet: [],
}

export function filterPortfolioData(
  rows: PortfolioDataDomain[],
  filters: DataFilterState,
): PortfolioDataDomain[] {
  const q = filters.search.trim().toLowerCase()
  const idSet = filters.idSet?.length ? new Set(filters.idSet) : null
  return rows.filter((row) => {
    if (row.type !== 'Data Domain') return false
    const d = row.data
    if (idSet && !idSet.has(d.id)) return false
    if (filters.criticality && row.criticality !== filters.criticality) return false
    if (filters.ownership === 'assigned' && row.ownershipGap) return false
    if (filters.ownership === 'unassigned' && !row.ownershipGap) return false
    if (filters.authoritativeSource && row.authoritativeSourceStatus !== filters.authoritativeSource) {
      return false
    }
    if (filters.classification && row.classificationLabel !== filters.classification) return false
    if (filters.risk === 'elevated') {
      if (!isElevated(row.risk)) return false
    } else if (filters.risk && row.risk !== filters.risk) {
      return false
    }
    if (filters.quality && row.qualityStatus !== filters.quality) return false
    if (filters.residency && row.residencyStatus !== filters.residency) return false
    if (filters.aiReadiness === 'ai-suitable') {
      if (row.aiReadiness !== 'Ready' && row.aiReadiness !== 'Conditional') return false
    } else if (filters.aiReadiness && row.aiReadiness !== filters.aiReadiness) {
      return false
    }
    if (filters.capabilityId && !(d.businessCapabilityIds || []).includes(filters.capabilityId)) {
      return false
    }
    if (filters.applicationId) {
      const apps = new Set([
        d.systemOfRecordApplicationId,
        d.primaryApplicationId,
        ...(d.sourceApplicationIds || []),
        ...(d.consumerApplicationIds || []),
      ])
      if (!apps.has(filters.applicationId)) return false
    }
    if (q) {
      const hay = [
        d.name,
        d.description,
        d.domain,
        d.businessMeaning || '',
        row.businessOwnerLabel || '',
        row.dataStewardLabel || '',
        row.technicalCustodianLabel || '',
        row.systemOfRecordName || '',
        row.sourceApplicationNames.join(' '),
        row.consumerApplicationNames.join(' '),
        row.integrationNames.join(' '),
        ...(d.keyEntityNames || []),
        ...(d.dataProducts || []).map((p) => p.name),
      ]
        .join(' ')
        .toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
}

export function formatCriticality(c: Criticality) {
  return c.charAt(0).toUpperCase() + c.slice(1)
}

export function relatedFindings(dataId: string, findings: Finding[], findingIds?: string[]): Finding[] {
  const explicit = new Set(findingIds || [])
  return findings.filter(
    (f) => explicit.has(f.id) || (f.linkedObjectIds || []).includes(dataId),
  )
}

export function relatedInitiatives(row: PortfolioDataDomain, initiatives: Initiative[]): Initiative[] {
  const ids = new Set(row.data.initiativeIds || [])
  return initiatives.filter((i) => ids.has(i.id))
}
