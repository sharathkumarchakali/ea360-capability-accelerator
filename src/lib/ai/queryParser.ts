import type { TenantRepository } from '../../data/repositories/tenantRepository'
import type { EntityReference } from './types'

export type EntityMatch = EntityReference & { score: number }

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

/**
 * Match entity names / API names mentioned in the query against the active tenant pack.
 */
export function matchEntitiesInQuery(
  query: string,
  repo: TenantRepository,
  limit = 8,
): EntityMatch[] {
  const q = normalize(query)
  if (!q) return []

  const candidates: EntityMatch[] = []
  const push = (id: string, type: string, name: string, extra = '') => {
    const n = normalize(name)
    const e = normalize(extra)
    let score = 0
    if (q.includes(n) && n.length > 3) score = 100
    else if (n.split(' ').filter((w) => w.length > 3 && q.includes(w)).length >= 2) score = 70
    else if (e && q.includes(e) && e.length > 4) score = 90
    else {
      const tokens = n.split(' ').filter((w) => w.length > 4)
      const hits = tokens.filter((t) => q.includes(t)).length
      if (hits >= 1 && tokens.length <= 2) score = 50
      else if (hits >= 2) score = 60
    }
    if (score > 0) candidates.push({ id, type, name, score })
  }

  for (const c of repo.listCapabilities()) push(c.id, 'capability', c.name)
  for (const a of repo.listApplications()) push(a.id, 'application', a.name)
  for (const i of repo.listIntegrations()) {
    push(i.id, 'integration', i.name, i.apiOrInterfaceName)
  }
  for (const t of repo.listTechnologies()) push(t.id, 'technology', t.name)
  for (const f of repo.listFindings()) push(f.id, 'finding', f.name)
  for (const r of repo.listRecommendations()) push(r.id, 'recommendation', r.name)
  for (const n of repo.listInitiatives()) push(n.id, 'initiative', n.name)
  for (const o of repo.listObjectives()) push(o.id, 'strategicObjective', o.name)
  for (const d of repo.listDataObjects()) push(d.id, 'dataObject', d.name)

  const byId = new Map<string, EntityMatch>()
  for (const c of candidates.sort((a, b) => b.score - a.score)) {
    if (!byId.has(c.id)) byId.set(c.id, c)
  }
  return [...byId.values()].slice(0, limit)
}

export function resolveContextEntities(
  ids: string[] | undefined,
  repo: TenantRepository,
): EntityReference[] {
  if (!ids?.length) return []
  return ids
    .map((id) => {
      const node = repo.resolveGraphNode(id)
      return node ? { id: node.id, type: node.type, name: node.name } : null
    })
    .filter(Boolean) as EntityReference[]
}
