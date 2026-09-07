import type { EntityType } from '../entities/types'
import type { EnterpriseRelationship, RelationshipType } from '../relationships/types'

export type GraphNode = {
  id: string
  type: EntityType
  name: string
  criticality?: string
  status?: string
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  relationshipType: RelationshipType
  label: string
  criticality?: string
}

export type ImpactLevel = 'direct' | 'indirect' | 'potential'

export type ImpactHit = {
  id: string
  type: EntityType
  name: string
  level: ImpactLevel
  path: string[]
  criticality?: string
  relationshipTypes: RelationshipType[]
}

const LABEL: Record<RelationshipType, string> = {
  supports: 'Supports',
  realizes: 'Realises',
  uses: 'Uses',
  integrates: 'Integrates with',
  exchanges: 'Exchanges',
  stores: 'Stores',
  'runs-on': 'Runs on',
  evidences: 'Evidenced by',
  addresses: 'Addresses',
  implements: 'Implements',
  measures: 'Measured by',
  'depends-on': 'Depends on',
  owns: 'Owns',
  'creates-risk-for': 'Creates risk for',
  'delivered-through': 'Delivered through',
  executes: 'Executes',
}

export function relationshipLabel(type: RelationshipType) {
  return LABEL[type] || type
}

/** Deduplicate relationships by source|target|type */
export function uniqueRelationships(rels: EnterpriseRelationship[]) {
  const seen = new Set<string>()
  const out: EnterpriseRelationship[] = []
  for (const r of rels) {
    const key = `${r.sourceId}|${r.targetId}|${r.relationshipType}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r)
  }
  return out
}

export function relationshipsForEntity(rels: EnterpriseRelationship[], entityId: string) {
  return uniqueRelationships(rels.filter((r) => r.sourceId === entityId || r.targetId === entityId))
}

/**
 * Build neighbourhood graph around a root (depth hops).
 * Caps visible nodes to maxNodes to avoid hairballs.
 */
export function buildNeighbourhoodGraph(input: {
  rootId: string
  rootType: EntityType
  rootName: string
  relationships: EnterpriseRelationship[]
  resolveEntity: (id: string) => GraphNode | null
  depth?: number
  direction?: 'upstream' | 'downstream' | 'both'
  entityTypes?: EntityType[]
  relationshipTypes?: RelationshipType[]
  maxNodes?: number
}): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const depth = input.depth ?? 1
  const direction = input.direction ?? 'both'
  const maxNodes = input.maxNodes ?? 28
  const rels = uniqueRelationships(input.relationships)
  const nodes = new Map<string, GraphNode>()
  const edges: GraphEdge[] = []
  const edgeKeys = new Set<string>()

  const root: GraphNode = {
    id: input.rootId,
    type: input.rootType,
    name: input.rootName,
  }
  nodes.set(root.id, root)

  let frontier = [root.id]
  for (let d = 0; d < depth; d++) {
    const next: string[] = []
    for (const id of frontier) {
      for (const r of rels) {
        if (input.relationshipTypes?.length && !input.relationshipTypes.includes(r.relationshipType)) {
          continue
        }
        let neighbourId: string | null = null
        let source = r.sourceId
        let target = r.targetId
        if (r.sourceId === id && (direction === 'downstream' || direction === 'both')) {
          neighbourId = r.targetId
        } else if (r.targetId === id && (direction === 'upstream' || direction === 'both')) {
          neighbourId = r.sourceId
          // keep edge orientation as stored
        } else {
          continue
        }
        if (!neighbourId || neighbourId === id) continue
        const entity = input.resolveEntity(neighbourId)
        if (!entity) continue
        if (input.entityTypes?.length && !input.entityTypes.includes(entity.type)) continue
        if (!nodes.has(entity.id) && nodes.size >= maxNodes) continue
        if (!nodes.has(entity.id)) {
          nodes.set(entity.id, entity)
          next.push(entity.id)
        }
        const ekey = `${source}|${target}|${r.relationshipType}`
        if (!edgeKeys.has(ekey) && nodes.has(source) && nodes.has(target)) {
          edgeKeys.add(ekey)
          edges.push({
            id: r.id,
            source,
            target,
            relationshipType: r.relationshipType,
            label: relationshipLabel(r.relationshipType),
            criticality: r.criticality,
          })
        }
      }
    }
    frontier = next
    if (!frontier.length) break
  }

  return { nodes: [...nodes.values()], edges }
}

/**
 * Deterministic BFS impact analysis from a root entity.
 * Direct = depth 1; Indirect = depth 2..maxDepth; Potential = criticality medium+ beyond direct.
 */
export function analyseImpact(input: {
  rootId: string
  relationships: EnterpriseRelationship[]
  resolveEntity: (id: string) => GraphNode | null
  direction?: 'upstream' | 'downstream' | 'both'
  maxDepth?: number
}): {
  hits: ImpactHit[]
  affectedCapabilities: number
  affectedApplications: number
  criticalDependencies: number
  findingIds: string[]
} {
  const maxDepth = input.maxDepth ?? 3
  const direction = input.direction ?? 'both'
  const rels = uniqueRelationships(input.relationships)
  const visited = new Map<string, ImpactHit>()
  const queue: Array<{ id: string; depth: number; path: string[]; relTypes: RelationshipType[] }> = [
    { id: input.rootId, depth: 0, path: [input.rootId], relTypes: [] },
  ]

  while (queue.length) {
    const cur = queue.shift()!
    for (const r of rels) {
      let neighbour: string | null = null
      if (r.sourceId === cur.id && (direction === 'downstream' || direction === 'both')) {
        neighbour = r.targetId
      } else if (r.targetId === cur.id && (direction === 'upstream' || direction === 'both')) {
        neighbour = r.sourceId
      }
      if (!neighbour || cur.path.includes(neighbour)) continue
      const depth = cur.depth + 1
      if (depth > maxDepth) continue
      const entity = input.resolveEntity(neighbour)
      if (!entity) continue
      const level: ImpactLevel =
        depth === 1 ? 'direct' : depth === 2 ? 'indirect' : 'potential'
      const existing = visited.get(neighbour)
      if (existing && depthOrder(existing.level) <= depthOrder(level)) continue
      const hit: ImpactHit = {
        id: neighbour,
        type: entity.type,
        name: entity.name,
        level,
        path: [...cur.path, neighbour],
        criticality: r.criticality || entity.criticality,
        relationshipTypes: [...cur.relTypes, r.relationshipType],
      }
      visited.set(neighbour, hit)
      queue.push({
        id: neighbour,
        depth,
        path: hit.path,
        relTypes: hit.relationshipTypes,
      })
    }
  }

  const hits = [...visited.values()]
  return {
    hits,
    affectedCapabilities: hits.filter((h) => h.type === 'capability').length,
    affectedApplications: hits.filter((h) => h.type === 'application').length,
    criticalDependencies: hits.filter(
      (h) => h.criticality === 'critical' || h.criticality === 'high',
    ).length,
    findingIds: hits.filter((h) => h.type === 'finding').map((h) => h.id),
  }
}

function depthOrder(level: ImpactLevel) {
  return level === 'direct' ? 1 : level === 'indirect' ? 2 : 3
}

/** Shortest path between two entity ids via undirected relationship edges */
export function shortestRelationshipPath(
  relationships: EnterpriseRelationship[],
  fromId: string,
  toId: string,
): string[] | null {
  if (fromId === toId) return [fromId]
  const rels = uniqueRelationships(relationships)
  const adj = new Map<string, string[]>()
  for (const r of rels) {
    if (!adj.has(r.sourceId)) adj.set(r.sourceId, [])
    if (!adj.has(r.targetId)) adj.set(r.targetId, [])
    adj.get(r.sourceId)!.push(r.targetId)
    adj.get(r.targetId)!.push(r.sourceId)
  }
  const queue = [fromId]
  const prev = new Map<string, string | null>([[fromId, null]])
  while (queue.length) {
    const cur = queue.shift()!
    for (const n of adj.get(cur) || []) {
      if (prev.has(n)) continue
      prev.set(n, cur)
      if (n === toId) {
        const path = [toId]
        let p: string | null | undefined = cur
        while (p) {
          path.unshift(p)
          p = prev.get(p) ?? null
        }
        return path
      }
      queue.push(n)
    }
  }
  return null
}

export function validateNoOrphanRelationships(
  relationships: EnterpriseRelationship[],
  knownIds: Set<string>,
) {
  return relationships.filter((r) => !knownIds.has(r.sourceId) || !knownIds.has(r.targetId))
}
