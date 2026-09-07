import { tenantPackSchema, type TenantPack } from '../../domain/schemas'

export class TenantValidationError extends Error {
  constructor(message: string, readonly details: string[] = []) {
    super(message)
    this.name = 'TenantValidationError'
  }
}

/** Collect every entity id in the pack for reference checks. */
export function collectEntityIds(pack: TenantPack): Map<string, string> {
  const map = new Map<string, string>()
  const add = (id: string, type: string) => {
    if (map.has(id)) {
      throw new TenantValidationError(`Duplicate entity id: ${id}`)
    }
    map.set(id, type)
  }

  add(pack.tenant.id, 'tenant')
  for (const o of pack.strategicObjectives) add(o.id, 'strategicObjective')
  for (const c of pack.capabilities) add(c.id, 'capability')
  for (const p of pack.processes) add(p.id, 'process')
  for (const a of pack.applications) add(a.id, 'application')
  for (const i of pack.integrations) add(i.id, 'integration')
  for (const d of pack.dataObjects) add(d.id, 'dataObject')
  for (const t of pack.technologies) add(t.id, 'technology')
  for (const e of pack.evidence) add(e.id, 'evidence')
  for (const f of pack.findings) add(f.id, 'finding')
  for (const r of pack.recommendations) add(r.id, 'recommendation')
  for (const d of pack.decisions ?? []) add(d.id, 'decision')
  for (const n of pack.initiatives) add(n.id, 'initiative')
  for (const k of pack.kpis) add(k.id, 'kpi')
  return map
}

export function validateTenantPack(pack: unknown): TenantPack {
  const parsed = tenantPackSchema.safeParse(pack)
  if (!parsed.success) {
    const details = parsed.error.issues.map(
      (i) => `${i.path.join('.') || '(root)'}: ${i.message}`,
    )
    throw new TenantValidationError('Tenant pack failed Zod validation', details)
  }

  const data = parsed.data
  const errors: string[] = []
  const ids = collectEntityIds(data)

  const ensure = (id: string, ctx: string) => {
    if (!ids.has(id)) errors.push(`${ctx} references missing id ${id}`)
  }

  for (const c of data.capabilities) {
    if (c.parentId) ensure(c.parentId, `capability ${c.id}.parentId`)
    c.strategicObjectiveIds.forEach((id) =>
      ensure(id, `capability ${c.id}.strategicObjectiveIds`),
    )
    if (c.tenantId !== data.tenant.id) errors.push(`capability ${c.id} tenant mismatch`)
  }

  for (const p of data.processes) {
    p.capabilityIds.forEach((id) => ensure(id, `process ${p.id}.capabilityIds`))
  }

  for (const a of data.applications) {
    a.supportedCapabilityIds.forEach((id) =>
      ensure(id, `application ${a.id}.supportedCapabilityIds`),
    )
  }

  for (const i of data.integrations) {
    ensure(i.sourceApplicationId, `integration ${i.id}.sourceApplicationId`)
    ensure(i.targetApplicationId, `integration ${i.id}.targetApplicationId`)
    i.supportedCapabilityIds.forEach((id) =>
      ensure(id, `integration ${i.id}.supportedCapabilityIds`),
    )
    i.supportedProcessIds.forEach((id) => ensure(id, `integration ${i.id}.supportedProcessIds`))
    i.dataObjectIds.forEach((id) => ensure(id, `integration ${i.id}.dataObjectIds`))
    i.technologyIds.forEach((id) => ensure(id, `integration ${i.id}.technologyIds`))
  }

  for (const sc of data.scenarios ?? []) {
    ensure(sc.startingEntityId, `scenario ${sc.id}.startingEntityId`)
    ensure(sc.findingId, `scenario ${sc.id}.findingId`)
    sc.visibleEntityIds.forEach((id) => ensure(id, `scenario ${sc.id}.visibleEntityIds`))
    sc.affectedCapabilityIds.forEach((id) =>
      ensure(id, `scenario ${sc.id}.affectedCapabilityIds`),
    )
    sc.evidenceIds.forEach((id) => ensure(id, `scenario ${sc.id}.evidenceIds`))
    sc.topologyFocusIntegrationIds.forEach((id) =>
      ensure(id, `scenario ${sc.id}.topologyFocusIntegrationIds`),
    )
  }

  for (const e of data.evidence) {
    e.linkedObjectIds.forEach((id) => ensure(id, `evidence ${e.id}.linkedObjectIds`))
  }

  for (const f of data.findings) {
    f.evidenceIds.forEach((id) => ensure(id, `finding ${f.id}.evidenceIds`))
    f.linkedObjectIds.forEach((id) => ensure(id, `finding ${f.id}.linkedObjectIds`))
  }

  for (const r of data.recommendations) {
    r.findingIds.forEach((id) => ensure(id, `recommendation ${r.id}.findingIds`))
    r.affectedCapabilityIds.forEach((id) => ensure(id, `recommendation ${r.id}.affectedCapabilityIds`))
    r.affectedApplicationIds.forEach((id) => ensure(id, `recommendation ${r.id}.affectedApplicationIds`))
    r.evidenceIds?.forEach((id) => ensure(id, `recommendation ${r.id}.evidenceIds`))
    r.affectedIntegrationIds?.forEach((id) => ensure(id, `recommendation ${r.id}.affectedIntegrationIds`))
    r.objectiveIds?.forEach((id) => ensure(id, `recommendation ${r.id}.objectiveIds`))
    r.kpiIds?.forEach((id) => ensure(id, `recommendation ${r.id}.kpiIds`))
    if (r.decisionId) ensure(r.decisionId, `recommendation ${r.id}.decisionId`)
  }

  for (const d of data.decisions ?? []) {
    ensure(d.recommendationId, `decision ${d.id}.recommendationId`)
    d.evidenceIds.forEach((id) => ensure(id, `decision ${d.id}.evidenceIds`))
    d.affectedObjectIds.forEach((id) => ensure(id, `decision ${d.id}.affectedObjectIds`))
    if (d.initiativeId) ensure(d.initiativeId, `decision ${d.id}.initiativeId`)
  }

  for (const n of data.initiatives) {
    n.recommendationIds.forEach((id) => ensure(id, `initiative ${n.id}.recommendationIds`))
    n.objectiveIds.forEach((id) => ensure(id, `initiative ${n.id}.objectiveIds`))
    n.capabilityIds.forEach((id) => ensure(id, `initiative ${n.id}.capabilityIds`))
    n.applicationIds?.forEach((id) => ensure(id, `initiative ${n.id}.applicationIds`))
    n.integrationIds?.forEach((id) => ensure(id, `initiative ${n.id}.integrationIds`))
    n.findingIds?.forEach((id) => ensure(id, `initiative ${n.id}.findingIds`))
    n.kpiIds?.forEach((id) => ensure(id, `initiative ${n.id}.kpiIds`))
    n.dependsOnInitiativeIds?.forEach((id) => ensure(id, `initiative ${n.id}.dependsOnInitiativeIds`))
    if (n.decisionId) ensure(n.decisionId, `initiative ${n.id}.decisionId`)
  }

  for (const k of data.kpis) {
    k.linkedObjectiveIds.forEach((id) => ensure(id, `kpi ${k.id}.linkedObjectiveIds`))
  }

  for (const rel of data.relationships) {
    ensure(rel.sourceId, `relationship ${rel.id}.sourceId`)
    ensure(rel.targetId, `relationship ${rel.id}.targetId`)
    rel.evidenceIds.forEach((id) => ensure(id, `relationship ${rel.id}.evidenceIds`))
    if (rel.tenantId !== data.tenant.id) {
      errors.push(`relationship ${rel.id} tenant mismatch`)
    }
  }

  if (errors.length) {
    throw new TenantValidationError('Broken relationship or reference detected', errors)
  }

  return data
}

export function assertValidInDev(pack: unknown, label: string) {
  try {
    return validateTenantPack(pack)
  } catch (err) {
    if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
      const details =
        err instanceof TenantValidationError ? `\n- ${err.details.join('\n- ')}` : ''
      const message = `[EA360] ${label} validation failed: ${(err as Error).message}${details}`
      console.error(message)
      throw new Error(message)
    }
    throw err
  }
}
