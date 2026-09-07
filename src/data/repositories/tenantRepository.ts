import type { TenantPack } from '../../domain/schemas'
import type { TenantCode, TenantConfig } from '../../domain/tenants/config'
import { deriveExecutiveMetrics } from '../../domain/metrics'
import { assertValidInDev } from '../validators/validateTenant'
import graPack from '../tenants/gra/pack'
import { applyPhase3Enrichment } from '../tenants/gra/governance'
import bogPack from '../tenants/bog/pack'
import { applyBogEnrichment } from '../tenants/bog/governance'
import fidelityPack from '../tenants/fidelity/pack'
import { applyFidelityEnrichment } from '../tenants/fidelity/governance'
import genericPack from '../tenants/generic/pack'
import { applyGenericEnrichment } from '../tenants/generic/governance'
import { getTenantConfig as getConfigFromRegistry, listTenantConfigs } from '../tenants/registry'

export type { TenantCode }

const seedFactories: Record<TenantCode, () => TenantPack> = {
  GRA: () => applyPhase3Enrichment(structuredClone(graPack) as TenantPack),
  BOG: () => applyBogEnrichment(structuredClone(bogPack) as TenantPack),
  FIDELITY: () => applyFidelityEnrichment(structuredClone(fidelityPack) as TenantPack),
  GENERIC: () => applyGenericEnrichment(structuredClone(genericPack) as TenantPack),
}

const validatedCache = new Map<TenantCode, TenantPack>()

export type AvailableTenant = {
  code: TenantCode
  name: string
  shortName: string
  tenantType: string
  storyline: string
  lettermark: string
  synthetic: true
}

/** Available tenants that have seed packs, sourced from TenantConfig. */
export function listAvailableTenants(): AvailableTenant[] {
  return listTenantConfigs().map((c) => ({
    code: c.code,
    name: c.displayName,
    shortName: c.shortName,
    tenantType: c.tenantType,
    storyline: c.storyline,
    lettermark: c.lettermark,
    synthetic: true as const,
  }))
}

export function getTenantConfig(code: TenantCode): TenantConfig {
  return getConfigFromRegistry(code)
}

export function loadTenantPack(code: TenantCode, { bypassCache = false } = {}): TenantPack {
  if (!bypassCache && validatedCache.has(code)) {
    return structuredClone(validatedCache.get(code)!) as TenantPack
  }
  const factory = seedFactories[code]
  if (!factory) {
    throw new Error(`No seed pack registered for tenant ${code}`)
  }
  const pack = assertValidInDev(factory(), `${code} seed`)
  validatedCache.set(code, pack)
  return structuredClone(pack) as TenantPack
}

/** Test helper: clear validated cache. */
export function clearTenantCache() {
  validatedCache.clear()
}

export function createTenantRepository(pack: TenantPack) {
  return {
    getPack: () => pack,
    getTenant: () => pack.tenant,
    listCapabilities: () => pack.capabilities,
    getCapability: (id: string) => pack.capabilities.find((c) => c.id === id),
    listApplications: () => pack.applications,
    getApplication: (id: string) => pack.applications.find((a) => a.id === id),
    listIntegrations: () => pack.integrations,
    getIntegration: (id: string) => pack.integrations.find((i) => i.id === id),
    listScenarios: () => pack.scenarios ?? [],
    getScenario: (id: string) => (pack.scenarios ?? []).find((s) => s.id === id),
    listProcesses: () => pack.processes,
    getProcess: (id: string) => pack.processes.find((p) => p.id === id),
    listDataObjects: () => pack.dataObjects,
    getDataObject: (id: string) => pack.dataObjects.find((d) => d.id === id),
    listTechnologies: () => pack.technologies,
    getTechnology: (id: string) => pack.technologies.find((t) => t.id === id),
    resolveEntityName: (id: string) => {
      const hit =
        pack.capabilities.find((c) => c.id === id) ||
        pack.applications.find((a) => a.id === id) ||
        pack.integrations.find((i) => i.id === id) ||
        pack.processes.find((p) => p.id === id) ||
        pack.dataObjects.find((d) => d.id === id) ||
        pack.technologies.find((t) => t.id === id) ||
        pack.findings.find((f) => f.id === id) ||
        pack.evidence.find((e) => e.id === id) ||
        pack.recommendations.find((r) => r.id === id) ||
        (pack.decisions ?? []).find((d) => d.id === id) ||
        pack.initiatives.find((n) => n.id === id) ||
        pack.kpis.find((k) => k.id === id) ||
        pack.strategicObjectives.find((o) => o.id === id)
      return hit?.name || id
    },
    resolveGraphNode: (id: string) => {
      const c = pack.capabilities.find((x) => x.id === id)
      if (c) return { id: c.id, type: 'capability' as const, name: c.name, criticality: undefined, status: c.status }
      const a = pack.applications.find((x) => x.id === id)
      if (a) return { id: a.id, type: 'application' as const, name: a.name, criticality: a.criticality, status: a.status }
      const i = pack.integrations.find((x) => x.id === id)
      if (i) return { id: i.id, type: 'integration' as const, name: i.name, criticality: i.criticality, status: i.lifecycleStatus }
      const p = pack.processes.find((x) => x.id === id)
      if (p) return { id: p.id, type: 'process' as const, name: p.name, status: p.status }
      const d = pack.dataObjects.find((x) => x.id === id)
      if (d) return { id: d.id, type: 'dataObject' as const, name: d.name, status: d.status }
      const t = pack.technologies.find((x) => x.id === id)
      if (t) return { id: t.id, type: 'technology' as const, name: t.name, status: t.lifecycle }
      const f = pack.findings.find((x) => x.id === id)
      if (f) return { id: f.id, type: 'finding' as const, name: f.name, criticality: f.severity, status: f.workflowStatus ?? f.status }
      const e = pack.evidence.find((x) => x.id === id)
      if (e) return { id: e.id, type: 'evidence' as const, name: e.name, status: e.verificationStatus ?? e.status }
      const r = pack.recommendations.find((x) => x.id === id)
      if (r) return { id: r.id, type: 'recommendation' as const, name: r.name, status: r.workflowStatus ?? r.status }
      const dec = (pack.decisions ?? []).find((x) => x.id === id)
      if (dec) return { id: dec.id, type: 'decision' as const, name: dec.name, status: dec.decisionStatus }
      const n = pack.initiatives.find((x) => x.id === id)
      if (n) return { id: n.id, type: 'initiative' as const, name: n.name, status: n.status }
      const k = pack.kpis.find((x) => x.id === id)
      if (k) return { id: k.id, type: 'kpi' as const, name: k.name, status: k.status }
      const o = pack.strategicObjectives.find((x) => x.id === id)
      if (o) return { id: o.id, type: 'strategicObjective' as const, name: o.name, status: o.status }
      return null
    },
    integrationsForCapability: (capabilityId: string) =>
      pack.integrations.filter((i) => i.supportedCapabilityIds.includes(capabilityId)),
    findingsForIntegration: (integrationId: string) =>
      pack.findings.filter((f) => f.linkedObjectIds.includes(integrationId)),
    recommendationsForIntegration: (integrationId: string) =>
      pack.recommendations.filter(
        (r) =>
          r.affectedApplicationIds.some((aid) => {
            const i = pack.integrations.find((x) => x.id === integrationId)
            return i && (i.sourceApplicationId === aid || i.targetApplicationId === aid)
          }) ||
          r.affectedCapabilityIds.some((cid) => {
            const i = pack.integrations.find((x) => x.id === integrationId)
            return i?.supportedCapabilityIds.includes(cid)
          }) ||
          (r.affectedIntegrationIds ?? []).includes(integrationId),
      ),
    listFindings: () => pack.findings,
    getFinding: (id: string) => pack.findings.find((f) => f.id === id),
    listEvidence: () => pack.evidence,
    getEvidence: (id: string) => pack.evidence.find((e) => e.id === id),
    listRecommendations: () => pack.recommendations,
    getRecommendation: (id: string) => pack.recommendations.find((r) => r.id === id),
    listDecisions: () => pack.decisions ?? [],
    getDecision: (id: string) => (pack.decisions ?? []).find((d) => d.id === id),
    listArbQueue: () =>
      (pack.decisions ?? []).filter((d) =>
        ['Pending', 'Deferred', 'pending', 'deferred'].includes(d.decisionStatus),
      ),
    listInitiatives: () => pack.initiatives,
    getInitiative: (id: string) => pack.initiatives.find((i) => i.id === id),
    listKpis: () => pack.kpis,
    getKpi: (id: string) => pack.kpis.find((k) => k.id === id),
    listObjectives: () => pack.strategicObjectives,
    listRelationships: () => pack.relationships,
    listAuditHistory: () => pack.auditHistory ?? [],
    relationshipsFor: (entityId: string) =>
      pack.relationships.filter((r) => r.sourceId === entityId || r.targetId === entityId),
    applicationsForCapability: (capabilityId: string) => {
      const appIds = new Set(
        pack.relationships
          .filter(
            (r) =>
              r.sourceId === capabilityId &&
              r.targetType === 'application' &&
              (r.relationshipType === 'uses' || r.relationshipType === 'depends-on'),
          )
          .map((r) => r.targetId),
      )
      pack.applications.forEach((a) => {
        if (a.supportedCapabilityIds.includes(capabilityId)) appIds.add(a.id)
      })
      pack.findings
        .filter((f) => f.linkedObjectIds.includes(capabilityId))
        .forEach((f) =>
          f.linkedObjectIds.forEach((id) => {
            if (pack.applications.some((a) => a.id === id)) appIds.add(id)
          }),
        )
      return pack.applications.filter((a) => appIds.has(a.id))
    },
    capabilitiesForApplication: (applicationId: string) => {
      const app = pack.applications.find((a) => a.id === applicationId)
      if (!app) return []
      const ids = new Set(app.supportedCapabilityIds)
      pack.relationships
        .filter(
          (r) =>
            r.targetId === applicationId &&
            r.sourceType === 'capability' &&
            (r.relationshipType === 'uses' || r.relationshipType === 'depends-on'),
        )
        .forEach((r) => ids.add(r.sourceId))
      return pack.capabilities.filter((c) => ids.has(c.id))
    },
    processesForCapability: (capabilityId: string) =>
      pack.processes.filter((p) => p.capabilityIds.includes(capabilityId)),
    findingsForApplication: (applicationId: string) =>
      pack.findings.filter((f) => f.linkedObjectIds.includes(applicationId)),
    recommendationsForCapability: (capabilityId: string) =>
      pack.recommendations.filter((r) => r.affectedCapabilityIds.includes(capabilityId)),
    recommendationsForApplication: (applicationId: string) =>
      pack.recommendations.filter((r) => r.affectedApplicationIds.includes(applicationId)),
    initiativesForCapability: (capabilityId: string) =>
      pack.initiatives.filter((i) => i.capabilityIds.includes(capabilityId)),
    initiativesForApplication: (applicationId: string) =>
      pack.initiatives.filter((i) =>
        pack.recommendations.some(
          (r) =>
            i.recommendationIds.includes(r.id) && r.affectedApplicationIds.includes(applicationId),
        ),
      ),
    dataObjectsForApplication: (applicationId: string) => {
      const ids = new Set(
        pack.relationships
          .filter(
            (r) =>
              (r.sourceId === applicationId && r.targetType === 'dataObject') ||
              (r.targetId === applicationId && r.sourceType === 'dataObject'),
          )
          .map((r) => (r.sourceId === applicationId ? r.targetId : r.sourceId)),
      )
      return pack.dataObjects.filter((d) => ids.has(d.id))
    },
    technologiesForApplication: (applicationId: string) => {
      const ids = new Set(
        pack.relationships
          .filter(
            (r) =>
              r.sourceId === applicationId &&
              r.targetType === 'technology' &&
              r.relationshipType === 'runs-on',
          )
          .map((r) => r.targetId),
      )
      return pack.technologies.filter((t) => ids.has(t.id))
    },
    integrationsForApplications: (applicationIds: string[]) => {
      const set = new Set(applicationIds)
      return pack.integrations.filter(
        (i) => set.has(i.sourceApplicationId) || set.has(i.targetApplicationId),
      )
    },
    findingsForCapability: (capabilityId: string) =>
      pack.findings.filter((f) => f.linkedObjectIds.includes(capabilityId)),
    recommendationsForFinding: (findingId: string) =>
      pack.recommendations.filter((r) => r.findingIds.includes(findingId)),
    decisionsForRecommendation: (recommendationId: string) =>
      (pack.decisions ?? []).filter((d) => d.recommendationId === recommendationId),
    initiativesForRecommendation: (recommendationId: string) =>
      pack.initiatives.filter((i) => i.recommendationIds.includes(recommendationId)),
    getExecutiveMetrics: () =>
      deriveExecutiveMetrics({
        capabilities: pack.capabilities,
        applications: pack.applications,
        findings: pack.findings,
        initiatives: pack.initiatives,
        kpis: pack.kpis,
        recommendations: pack.recommendations,
      }),
    getPriorityCapability: () =>
      [...pack.capabilities].sort((a, b) => b.riskScore - a.riskScore)[0],
  }
}

export function getTenantRepository(code: TenantCode) {
  return createTenantRepository(loadTenantPack(code))
}

export type TenantRepository = ReturnType<typeof createTenantRepository>
