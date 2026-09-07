import { describe, expect, it, beforeEach } from 'vitest'
import {
  analyseImpact,
  buildNeighbourhoodGraph,
  uniqueRelationships,
  validateNoOrphanRelationships,
} from './graph'
import { clearTenantCache, getTenantRepository, loadTenantPack } from '../../data/repositories/tenantRepository'
import type { EnterpriseRelationship } from '../relationships/types'

const baseRel = (
  id: string,
  sourceId: string,
  targetId: string,
  relationshipType: EnterpriseRelationship['relationshipType'] = 'depends-on',
): EnterpriseRelationship => ({
  id,
  tenantId: 't',
  sourceId,
  sourceType: 'application',
  targetId,
  targetType: 'application',
  relationshipType,
  evidenceIds: [],
  criticality: 'high',
})

describe('Phase 2 relationship graph', () => {
  beforeEach(() => clearTenantCache())

  it('prevents duplicate relationships in uniqueRelationships', () => {
    const rels = [
      baseRel('r1', 'a', 'b'),
      baseRel('r2', 'a', 'b'),
      baseRel('r3', 'a', 'c'),
      baseRel('r1-dup', 'a', 'b'),
    ]
    const unique = uniqueRelationships(rels)
    expect(unique).toHaveLength(2)
    expect(unique.map((r) => `${r.sourceId}->${r.targetId}`).sort()).toEqual(['a->b', 'a->c'])
  })

  it('traverses neighbourhood with depth and direction', () => {
    const nodes = new Map([
      ['root', { id: 'root', type: 'application' as const, name: 'Root' }],
      ['down1', { id: 'down1', type: 'application' as const, name: 'Down1' }],
      ['down2', { id: 'down2', type: 'application' as const, name: 'Down2' }],
      ['up1', { id: 'up1', type: 'application' as const, name: 'Up1' }],
    ])
    const relationships = [
      baseRel('d1', 'root', 'down1'),
      baseRel('d2', 'down1', 'down2'),
      baseRel('u1', 'up1', 'root'),
    ]
    const resolve = (id: string) => nodes.get(id) || null

    const depth1 = buildNeighbourhoodGraph({
      rootId: 'root',
      rootType: 'application',
      rootName: 'Root',
      relationships,
      resolveEntity: resolve,
      depth: 1,
      direction: 'both',
    })
    expect(depth1.nodes.map((n) => n.id).sort()).toEqual(['down1', 'root', 'up1'])
    expect(depth1.nodes.some((n) => n.id === 'down2')).toBe(false)

    const depth2 = buildNeighbourhoodGraph({
      rootId: 'root',
      rootType: 'application',
      rootName: 'Root',
      relationships,
      resolveEntity: resolve,
      depth: 2,
      direction: 'downstream',
    })
    expect(depth2.nodes.map((n) => n.id).sort()).toEqual(['down1', 'down2', 'root'])
    expect(depth2.nodes.some((n) => n.id === 'up1')).toBe(false)

    const upstream = buildNeighbourhoodGraph({
      rootId: 'root',
      rootType: 'application',
      rootName: 'Root',
      relationships,
      resolveEntity: resolve,
      depth: 1,
      direction: 'upstream',
    })
    expect(upstream.nodes.map((n) => n.id).sort()).toEqual(['root', 'up1'])
  })

  it('does not emit duplicate edges when traversing', () => {
    const nodes = new Map([
      ['a', { id: 'a', type: 'application' as const, name: 'A' }],
      ['b', { id: 'b', type: 'application' as const, name: 'B' }],
    ])
    const relationships = [baseRel('r1', 'a', 'b'), baseRel('r2', 'a', 'b'), baseRel('r3', 'b', 'a', 'uses')]
    const graph = buildNeighbourhoodGraph({
      rootId: 'a',
      rootType: 'application',
      rootName: 'A',
      relationships,
      resolveEntity: (id) => nodes.get(id) || null,
      depth: 2,
      direction: 'both',
    })
    const keys = graph.edges.map((e) => `${e.source}|${e.target}|${e.relationshipType}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('classifies direct and indirect impact', () => {
    const nodes = new Map([
      ['root', { id: 'root', type: 'application' as const, name: 'Root', criticality: 'critical' }],
      ['d1', { id: 'd1', type: 'capability' as const, name: 'Cap1', criticality: 'high' }],
      ['d2', { id: 'd2', type: 'application' as const, name: 'App2', criticality: 'medium' }],
      ['d3', { id: 'd3', type: 'finding' as const, name: 'Find1', criticality: 'critical' }],
    ])
    const relationships = [
      baseRel('r1', 'root', 'd1'),
      baseRel('r2', 'd1', 'd2'),
      baseRel('r3', 'd2', 'd3'),
    ]
    const impact = analyseImpact({
      rootId: 'root',
      relationships,
      resolveEntity: (id) => nodes.get(id) || null,
      direction: 'downstream',
      maxDepth: 3,
    })
    const byId = Object.fromEntries(impact.hits.map((h) => [h.id, h.level]))
    expect(byId.d1).toBe('direct')
    expect(byId.d2).toBe('indirect')
    expect(byId.d3).toBe('potential')
    expect(impact.affectedCapabilities).toBe(1)
    expect(impact.affectedApplications).toBe(1)
    expect(impact.findingIds).toContain('d3')
    expect(impact.criticalDependencies).toBeGreaterThanOrEqual(1)
  })

  it('builds neighbourhood from GRA seed via repository resolve', () => {
    const repo = getTenantRepository('GRA')
    const scenario = repo.getScenario('scenario-identity')!
    const root = repo.resolveGraphNode(scenario.startingEntityId)!
    const graph = buildNeighbourhoodGraph({
      rootId: root.id,
      rootType: root.type,
      rootName: root.name,
      relationships: repo.listRelationships(),
      resolveEntity: (id) => repo.resolveGraphNode(id),
      depth: 2,
      direction: 'both',
      maxNodes: 28,
    })
    expect(graph.nodes.some((n) => n.id === root.id)).toBe(true)
    expect(graph.nodes.length).toBeGreaterThan(1)
    expect(graph.edges.length).toBeGreaterThan(0)
    expect(graph.nodes.length).toBeLessThanOrEqual(28)
  })

  it('runs impact analysis on GRA payment scenario root', () => {
    const repo = getTenantRepository('GRA')
    const scenario = repo.getScenario('scenario-payment')!
    const impact = analyseImpact({
      rootId: scenario.startingEntityId,
      relationships: repo.listRelationships(),
      resolveEntity: (id) => repo.resolveGraphNode(id),
      direction: 'both',
      maxDepth: 3,
    })
    expect(impact.hits.length).toBeGreaterThan(0)
    expect(impact.hits.some((h) => h.level === 'direct')).toBe(true)
  })

  it('reports no orphan relationships against known GRA ids', () => {
    const pack = loadTenantPack('GRA')
    const known = new Set<string>([
      ...pack.capabilities.map((x) => x.id),
      ...pack.applications.map((x) => x.id),
      ...pack.integrations.map((x) => x.id),
      ...pack.processes.map((x) => x.id),
      ...pack.dataObjects.map((x) => x.id),
      ...pack.technologies.map((x) => x.id),
      ...pack.findings.map((x) => x.id),
      ...pack.evidence.map((x) => x.id),
      ...pack.recommendations.map((x) => x.id),
      ...(pack.decisions ?? []).map((x) => x.id),
      ...pack.initiatives.map((x) => x.id),
      ...pack.kpis.map((x) => x.id),
      ...pack.strategicObjectives.map((x) => x.id),
    ])
    const orphans = validateNoOrphanRelationships(pack.relationships, known)
    expect(orphans).toEqual([])
  })
})
