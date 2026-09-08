import { describe, expect, it } from 'vitest'
import { assignLayers, layoutLayeredGraph } from './layoutLayeredGraph'

describe('layoutLayeredGraph', () => {
  const nodes = [
    { id: 'root', type: 'application', name: 'Root' },
    { id: 'up1', type: 'capability', name: 'Up1' },
    { id: 'up2', type: 'capability', name: 'Up2' },
    { id: 'down1', type: 'integration', name: 'Down1' },
    { id: 'down2', type: 'integration', name: 'Down2' },
  ]
  const edges = [
    { id: 'e1', source: 'up1', target: 'root' },
    { id: 'e2', source: 'up2', target: 'root' },
    { id: 'e3', source: 'root', target: 'down1' },
    { id: 'e4', source: 'down1', target: 'down2' },
  ]

  it('places upstream left, root centre, downstream right for both', () => {
    const laid = layoutLayeredGraph(nodes, edges, 'root', 'both')
    const byId = Object.fromEntries(laid.map((n) => [n.id, n]))
    expect(byId.root.data.isRoot).toBe(true)
    expect(byId.up1.position.x).toBeLessThan(byId.root.position.x)
    expect(byId.up2.position.x).toBeLessThan(byId.root.position.x)
    expect(byId.down1.position.x).toBeGreaterThan(byId.root.position.x)
    expect(byId.down2.position.x).toBeGreaterThan(byId.down1.position.x)
  })

  it('keeps vertical separation of at least 32px within a layer', () => {
    const laid = layoutLayeredGraph(nodes, edges, 'root', 'both')
    const ups = laid
      .filter((n) => n.id === 'up1' || n.id === 'up2')
      .sort((a, b) => a.position.y - b.position.y)
    const gap = ups[1].position.y - ups[0].position.y
    expect(gap).toBeGreaterThanOrEqual(72 + 32)
  })

  it('assigns negative layers for upstream neighbours', () => {
    const layers = assignLayers(['root', 'up1', 'up2'], edges, 'root', 'upstream')
    expect(layers.get('root')).toBe(0)
    expect(layers.get('up1')).toBeLessThan(0)
    expect(layers.get('up2')).toBeLessThan(0)
  })

  it('is deterministic across runs', () => {
    const a = layoutLayeredGraph(nodes, edges, 'root', 'both')
    const b = layoutLayeredGraph(nodes, edges, 'root', 'both')
    expect(a.map((n) => `${n.id}:${n.position.x},${n.position.y}`)).toEqual(
      b.map((n) => `${n.id}:${n.position.x},${n.position.y}`),
    )
  })
})