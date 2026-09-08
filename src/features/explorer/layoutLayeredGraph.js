/**
 * Deterministic layered dependency layout for Relationship Explorer.
 * Upstream left -> root centre -> downstream right.
 */

export const NODE_W = 176
export const NODE_H = 72
export const ROOT_W = 196
export const ROOT_H = 82

const H_GAP = 64
const V_SEP = 32
const LAYER_STEP = Math.max(NODE_W, ROOT_W) + H_GAP

function buildAdjacency(edges) {
  const outAdj = new Map()
  const inAdj = new Map()
  for (const e of edges || []) {
    if (!e?.source || !e?.target) continue
    if (!outAdj.has(e.source)) outAdj.set(e.source, [])
    if (!inAdj.has(e.target)) inAdj.set(e.target, [])
    outAdj.get(e.source).push(e.target)
    inAdj.get(e.target).push(e.source)
  }
  return { outAdj, inAdj }
}

function bfsLayers(rootId, getNeighbors) {
  const dist = new Map([[rootId, 0]])
  const q = [rootId]
  while (q.length) {
    const id = q.shift()
    for (const n of getNeighbors(id) || []) {
      if (dist.has(n)) continue
      dist.set(n, dist.get(id) + 1)
      q.push(n)
    }
  }
  return dist
}

export function assignLayers(nodeIds, edges, rootId, direction = 'both') {
  const { outAdj, inAdj } = buildAdjacency(edges)
  const layer = new Map()
  if (!rootId) return layer
  layer.set(rootId, 0)

  if (direction === 'downstream' || direction === 'both') {
    const down = bfsLayers(rootId, (id) => outAdj.get(id))
    for (const [id, d] of down) {
      if (id === rootId) continue
      layer.set(id, d)
    }
  }

  if (direction === 'upstream' || direction === 'both') {
    const up = bfsLayers(rootId, (id) => inAdj.get(id))
    for (const [id, d] of up) {
      if (id === rootId) continue
      if (!layer.has(id)) layer.set(id, -d)
    }
  }

  for (const id of nodeIds) {
    if (!layer.has(id)) {
      layer.set(id, direction === 'upstream' ? -1 : 1)
    }
  }
  return layer
}

function median(values) {
  if (!values.length) return 0
  const s = [...values].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}

function orderLayers(layerMap, edges, rootId) {
  const byLayer = new Map()
  for (const [id, l] of layerMap) {
    if (!byLayer.has(l)) byLayer.set(l, [])
    byLayer.get(l).push(id)
  }

  const layers = [...byLayer.keys()].sort((a, b) => a - b)
  const order = new Map()

  for (const l of layers) {
    const ids = byLayer.get(l).sort((a, b) => a.localeCompare(b))
    ids.forEach((id, idx) => order.set(id, idx))
  }
  if (rootId) order.set(rootId, 0)

  const { outAdj, inAdj } = buildAdjacency(edges)

  const sweep = (forward) => {
    const seq = forward ? layers : [...layers].reverse()
    for (const l of seq) {
      if (l === 0) continue
      const ids = byLayer.get(l)
      const scored = ids.map((id) => {
        const neighbors =
          l > 0
            ? [...(inAdj.get(id) || []), ...(outAdj.get(id) || [])].filter(
                (n) => layerMap.get(n) === l - 1 || layerMap.get(n) === 0,
              )
            : [...(outAdj.get(id) || []), ...(inAdj.get(id) || [])].filter(
                (n) => layerMap.get(n) === l + 1 || layerMap.get(n) === 0,
              )
        const positions = neighbors.map((n) => order.get(n)).filter((p) => p != null)
        return { id, score: positions.length ? median(positions) : order.get(id) ?? 0 }
      })
      scored.sort((a, b) => a.score - b.score || a.id.localeCompare(b.id))
      scored.forEach((s, idx) => order.set(s.id, idx))
    }
  }
  sweep(true)
  sweep(false)

  return { byLayer, layers, order }
}

export function layoutLayeredGraph(graphNodes, graphEdges, rootId, direction = 'both') {
  if (!graphNodes?.length || !rootId) return []

  const nodeIds = graphNodes.map((n) => n.id)
  const layerMap = assignLayers(nodeIds, graphEdges, rootId, direction)
  const { byLayer, layers, order } = orderLayers(layerMap, graphEdges, rootId)

  const connCount = new Map()
  for (const e of graphEdges || []) {
    connCount.set(e.source, (connCount.get(e.source) || 0) + 1)
    connCount.set(e.target, (connCount.get(e.target) || 0) + 1)
  }

  const minLayer = layers[0] ?? 0
  const placed = []

  for (const l of layers) {
    const ids = [...byLayer.get(l)].sort(
      (a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0) || a.localeCompare(b),
    )
    const isRootLayer = l === 0
    const h = isRootLayer ? ROOT_H : NODE_H
    const totalH = ids.length * h + Math.max(0, ids.length - 1) * V_SEP
    const y0 = Math.max(24, 180 - totalH / 2)

    ids.forEach((id, idx) => {
      const node = graphNodes.find((n) => n.id === id)
      if (!node) return
      const isRoot = id === rootId
      const x = (l - minLayer) * LAYER_STEP + (isRoot ? 0 : (ROOT_W - NODE_W) / 2)
      const y = y0 + idx * (h + V_SEP)
      placed.push({
        id: node.id,
        type: 'entity',
        position: { x, y },
        style: {
          width: isRoot ? ROOT_W : NODE_W,
          height: isRoot ? ROOT_H : NODE_H,
        },
        data: {
          label: node.name,
          entityType: node.type,
          criticality: node.criticality,
          status: node.status,
          isRoot,
          connectionCount: connCount.get(node.id) || 0,
        },
      })
    })
  }

  return placed
}