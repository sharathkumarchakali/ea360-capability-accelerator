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

  // Exact ID match (highest priority)
  const pack = repo.getPack()
  const allNodes = [
    ...repo.listCapabilities().map((x) => ({ id: x.id, type: 'capability', name: x.name })),
    ...repo.listApplications().map((x) => ({ id: x.id, type: 'application', name: x.name })),
    ...repo.listIntegrations().map((x) => ({
      id: x.id,
      type: 'integration',
      name: x.name,
      extra: x.apiOrInterfaceName,
    })),
    ...repo.listTechnologies().map((x) => ({ id: x.id, type: 'technology', name: x.name })),
    ...repo.listFindings().map((x) => ({ id: x.id, type: 'finding', name: x.name })),
    ...repo.listRecommendations().map((x) => ({ id: x.id, type: 'recommendation', name: x.name })),
    ...repo.listInitiatives().map((x) => ({ id: x.id, type: 'initiative', name: x.name })),
    ...repo.listObjectives().map((x) => ({ id: x.id, type: 'strategicObjective', name: x.name })),
    ...repo.listDataObjects().map((x) => ({ id: x.id, type: 'dataObject', name: x.name })),
    ...(pack.evidence ?? []).map((x) => ({ id: x.id, type: 'evidence', name: x.name })),
    ...(pack.decisions ?? []).map((x) => ({ id: x.id, type: 'decision', name: x.name })),
    ...(pack.kpis ?? []).map((x) => ({ id: x.id, type: 'kpi', name: x.name })),
    ...(pack.processes ?? []).map((x) => ({ id: x.id, type: 'process', name: x.name })),
    ...(repo.listAiSolutions?.() ?? []).map((x) => ({ id: x.id, type: 'aiSolution', name: x.name })),
    ...(repo.listAiModels?.() ?? []).map((x) => ({ id: x.id, type: 'aiModel', name: x.name })),
  ]

  for (const n of allNodes) {
    if (q === normalize(n.id) || query.toLowerCase().includes(n.id.toLowerCase())) {
      candidates.push({ id: n.id, type: n.type, name: n.name, score: 120 })
    }
  }

  for (const c of repo.listCapabilities()) push(c.id, 'capability', c.name)
  for (const a of repo.listApplications()) push(a.id, 'application', a.name)
  for (const i of repo.listIntegrations()) {
    push(i.id, 'integration', i.name, i.apiOrInterfaceName)
    // Approved aliases for payment demo
    if (/paymentadvice/i.test(i.apiOrInterfaceName || '') || /payment advice/i.test(i.name)) {
      push(i.id, 'integration', i.name, 'PaymentAdviceAPI payment advice API')
    }
  }
  for (const t of repo.listTechnologies()) push(t.id, 'technology', t.name)
  for (const f of repo.listFindings()) push(f.id, 'finding', f.name)
  for (const r of repo.listRecommendations()) push(r.id, 'recommendation', r.name)
  for (const n of repo.listInitiatives()) push(n.id, 'initiative', n.name)
  for (const o of repo.listObjectives()) push(o.id, 'strategicObjective', o.name)
  for (const d of repo.listDataObjects()) {
    push(d.id, 'dataObject', d.name)
    if (/taxpayer data/i.test(d.name)) push(d.id, 'dataObject', d.name, 'Taxpayer Data')
  }
  for (const e of pack.evidence ?? []) push(e.id, 'evidence', e.name)
  for (const dec of pack.decisions ?? []) push(dec.id, 'decision', dec.name)
  for (const k of pack.kpis ?? []) push(k.id, 'kpi', k.name)
  for (const p of pack.processes ?? []) push(p.id, 'process', p.name)
  for (const s of repo.listAiSolutions?.() ?? []) {
    push(s.id, 'aiSolution', s.name)
    if (/fraud investigation agent/i.test(s.name)) {
      push(s.id, 'aiSolution', s.name, 'Fraud Investigation Agent')
    }
  }
  for (const m of repo.listAiModels?.() ?? []) push(m.id, 'aiModel', m.name)

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
