import type { GraphEdge, GraphNode } from '@/domain/metrics/graph'

export type FlowNode = {
  id: string
  type?: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export type FlowEdge = {
  id: string
  source: string
  target: string
  label?: string
  [key: string]: unknown
}

export type GraphValidationResult = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  warnings: string[]
}

const DEFAULT_MAX_NODES = 28

/**
 * Validate and sanitise graph data before React Flow render.
 * Always returns arrays (never undefined).
 */
export function validateFlowGraph(input: {
  nodes: Array<
    | FlowNode
    | (GraphNode & {
        position?: { x: number; y: number }
        data?: Record<string, unknown>
        type?: string
      })
  >
  edges: Array<Partial<FlowEdge> & { id?: string; source?: string; target?: string }>
  tenantEntityIds?: Set<string>
  maxNodes?: number
  allowSelfEdges?: boolean
}): GraphValidationResult {
  const warnings: string[] = []
  const maxNodes = input.maxNodes ?? DEFAULT_MAX_NODES
  const seenNode = new Set<string>()
  const nodes: FlowNode[] = []

  for (const raw of input.nodes || []) {
    if (!raw?.id) {
      warnings.push('Dropped node without id')
      continue
    }
    if (seenNode.has(raw.id)) {
      warnings.push(`Duplicate node removed: ${raw.id}`)
      continue
    }
    if (input.tenantEntityIds && !input.tenantEntityIds.has(raw.id)) {
      warnings.push(`Cross-tenant/orphan node removed: ${raw.id}`)
      continue
    }
    if (nodes.length >= maxNodes) {
      warnings.push(`Node cap ${maxNodes} reached; remaining nodes truncated`)
      break
    }
    seenNode.add(raw.id)
    const asFlow = raw as FlowNode
    nodes.push({
      id: raw.id,
      type: asFlow.type || 'entity',
      position: asFlow.position || { x: 0, y: 0 },
      data: asFlow.data || {
        label: (raw as GraphNode).name || raw.id,
        entityType: (raw as GraphNode).type,
        criticality: (raw as GraphNode).criticality,
      },
    })
  }

  const nodeIds = new Set(nodes.map((n) => n.id))
  const seenEdge = new Set<string>()
  const edges: FlowEdge[] = []

  for (const raw of input.edges || []) {
    if (!raw?.id || !raw.source || !raw.target) {
      warnings.push('Dropped edge with missing id/source/target')
      continue
    }
    if (!input.allowSelfEdges && raw.source === raw.target) {
      warnings.push(`Self-edge removed: ${raw.id}`)
      continue
    }
    if (!nodeIds.has(raw.source) || !nodeIds.has(raw.target)) {
      warnings.push(`Edge removed (missing endpoint): ${raw.id}`)
      continue
    }
    const key = `${raw.source}|${raw.target}|${raw.id}`
    if (seenEdge.has(key) || seenEdge.has(raw.id)) {
      warnings.push(`Duplicate edge removed: ${raw.id}`)
      continue
    }
    seenEdge.add(key)
    seenEdge.add(raw.id)
    edges.push({
      ...raw,
      id: raw.id,
      source: raw.source,
      target: raw.target,
    } as FlowEdge)
  }

  return { nodes, edges, warnings }
}
