import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  useEdgesState,
  useNodesState,
  Handle,
  Position,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { usePrototypeStore, getTenantConfig } from '../../state/prototypeStore'
import { analyseImpact, buildNeighbourhoodGraph } from '../../domain/metrics/graph'
import { impactNarrative } from '../../lib/ai'
import { resolveExplorerRoot } from './resolveExplorerRoot'
import { validateFlowGraph } from './validateFlowGraph'

const ENTITY_FILTER_OPTIONS = [
  'capability',
  'application',
  'integration',
  'process',
  'dataObject',
  'technology',
  'finding',
  'recommendation',
  'initiative',
]

const TYPE_COLORS = {
  capability: '#1E8CAA',
  application: '#0D6B7A',
  integration: '#C47B2C',
  process: '#6B7280',
  dataObject: '#52CFE4',
  technology: '#62E0C8',
  finding: '#B42318',
  recommendation: '#1E8CAA',
  initiative: '#0D6B7A',
  evidence: '#6B7280',
  kpi: '#1E8CAA',
  strategicObjective: '#0D6B7A',
}

function EntityNode({ data }) {
  const color = TYPE_COLORS[data.entityType] || '#1E8CAA'
  return (
    <div
      className={`rf-entity-node${data.isRoot ? ' root' : ''}${data.impactLevel ? ` impact-${data.impactLevel}` : ''}`}
      style={{ borderColor: color }}
      data-demo-target={data.isRoot ? 'graph-node' : undefined}
    >
      <Handle type="target" position={Position.Left} />
      <div className="rf-node-type" style={{ color }}>
        {data.entityType}
      </div>
      <div className="rf-node-name">{data.label}</div>
      {data.criticality && <div className="rf-node-meta">{data.criticality}</div>}
      {data.impactLevel && <div className="rf-node-impact">{data.impactLevel}</div>}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

/** Stable outside render — required by React Flow */
const nodeTypes = { entity: EntityNode }

function layoutNodes(graphNodes, rootId) {
  const others = graphNodes.filter((n) => n.id !== rootId)
  const root = graphNodes.find((n) => n.id === rootId)
  const placed = []
  if (root) {
    placed.push({
      id: root.id,
      type: 'entity',
      position: { x: 280, y: 220 },
      data: {
        label: root.name,
        entityType: root.type,
        criticality: root.criticality,
        isRoot: true,
      },
    })
  }
  const n = others.length
  others.forEach((node, idx) => {
    const angle = (idx / Math.max(n, 1)) * Math.PI * 2 - Math.PI / 2
    const ring = 1 + Math.floor(idx / 10)
    const radius = 160 * ring
    placed.push({
      id: node.id,
      type: 'entity',
      position: {
        x: 280 + Math.cos(angle) * radius,
        y: 220 + Math.sin(angle) * radius,
      },
      data: {
        label: node.name,
        entityType: node.type,
        criticality: node.criticality,
        isRoot: false,
      },
    })
  })
  return placed
}

function ExplorerCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onNodeDoubleClick,
  onInit,
}) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      onNodeDoubleClick={onNodeDoubleClick}
      nodeTypes={nodeTypes}
      onInit={onInit}
      fitView={nodes.length > 0}
      minZoom={0.3}
      maxZoom={1.6}
      proOptions={{ hideAttribution: true }}
    >
      <Background gap={18} color="#c0f0f2" />
      <Controls showInteractive={false} />
      <MiniMap
        nodeColor={(n) => TYPE_COLORS[n.data?.entityType] || '#1E8CAA'}
        maskColor="rgba(255,255,255,0.7)"
      />
    </ReactFlow>
  )
}

export default function RelationshipExplorer({ onNavigate }) {
  const workingPack = usePrototypeStore((s) => s.workingPack)
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const getRepo = usePrototypeStore((s) => s.getRepo)
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const scenarioId = usePrototypeStore((s) => s.scenarioId)
  const setScenarioId = usePrototypeStore((s) => s.setScenarioId)
  const graphRoot = usePrototypeStore((s) => s.graphRoot)
  const setGraphRoot = usePrototypeStore((s) => s.setGraphRoot)
  const relationshipDepth = usePrototypeStore((s) => s.relationshipDepth)
  const setRelationshipDepth = usePrototypeStore((s) => s.setRelationshipDepth)
  const graphDirection = usePrototypeStore((s) => s.graphDirection)
  const setGraphDirection = usePrototypeStore((s) => s.setGraphDirection)
  const entityTypeFilters = usePrototypeStore((s) => s.entityTypeFilters)
  const toggleEntityTypeFilter = usePrototypeStore((s) => s.toggleEntityTypeFilter)
  const setEntityTypeFilters = usePrototypeStore((s) => s.setEntityTypeFilters)
  const impactMode = usePrototypeStore((s) => s.impactMode)
  const setImpactMode = usePrototypeStore((s) => s.setImpactMode)
  const role = usePrototypeStore((s) => s.role)
  const view = usePrototypeStore((s) => s.view)
  const filters = usePrototypeStore((s) => s.filters)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const recordAiResponse = usePrototypeStore((s) => s.recordAiResponse)
  const setView = usePrototypeStore((s) => s.setView)
  const [fitToken, setFitToken] = useState(0)
  const [selectedSideId, setSelectedSideId] = useState(null)
  const [graphFailed, setGraphFailed] = useState(false)
  const [forceList, setForceList] = useState(false)

  // Stable repo: only rebuild when the active pack / tenant changes (prevents render loops)
  const repo = useMemo(() => getRepo(), [getRepo, workingPack, tenantCode])
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])

  const scenarios = useMemo(() => repo.listScenarios(), [repo])
  const scenario = useMemo(
    () => repo.getScenario(scenarioId) || scenarios[0] || null,
    [repo, scenarioId, scenarios],
  )

  const root = useMemo(
    () =>
      resolveExplorerRoot({
        navRoot: graphRoot,
        scenarioRoot: scenario
          ? { id: scenario.startingEntityId, type: scenario.startingEntityType }
          : null,
        configDefault: config.defaultScenarioId
          ? (() => {
              const def = repo.getScenario(config.defaultScenarioId)
              return def
                ? { id: def.startingEntityId, type: def.startingEntityType }
                : null
            })()
          : null,
        resolveEntity: (id) => repo.resolveGraphNode(id),
        listApplications: () => repo.listApplications(),
        listCapabilities: () => repo.listCapabilities(),
      }),
    [graphRoot, scenario, config.defaultScenarioId, repo],
  )

  const graph = useMemo(() => {
    if (!root) return { nodes: [], edges: [] }
    try {
      return buildNeighbourhoodGraph({
        rootId: root.id,
        rootType: root.type,
        rootName: root.name,
        relationships: repo.listRelationships() || [],
        resolveEntity: (id) => repo.resolveGraphNode(id),
        depth: Math.min(Math.max(relationshipDepth || 1, 1), 3),
        direction: graphDirection,
        entityTypes: entityTypeFilters.length ? entityTypeFilters : undefined,
        maxNodes: 28,
      })
    } catch (err) {
      console.error('[EA360] buildNeighbourhoodGraph failed', err)
      return { nodes: [], edges: [], _failed: true }
    }
  }, [root, repo, relationshipDepth, graphDirection, entityTypeFilters])

  const impact = useMemo(() => {
    if (!root || !impactMode) return null
    try {
      return analyseImpact({
        rootId: root.id,
        relationships: repo.listRelationships() || [],
        resolveEntity: (id) => repo.resolveGraphNode(id),
        direction: graphDirection,
        maxDepth: Math.max(relationshipDepth, 3),
      })
    } catch (err) {
      console.error('[EA360] analyseImpact failed', err)
      return null
    }
  }, [root, impactMode, repo, graphDirection, relationshipDepth])

  const impactMap = useMemo(() => {
    const map = new Map()
    if (!impact) return map
    for (const h of impact.hits) map.set(h.id, h.level)
    return map
  }, [impact])

  const tenantEntityIds = useMemo(() => {
    const ids = new Set()
    for (const n of graph.nodes) ids.add(n.id)
    return ids
  }, [graph.nodes])

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [rfInstance, setRfInstance] = useState(null)

  useEffect(() => {
    if (!root) {
      setNodes([])
      setEdges([])
      return
    }
    if (graph._failed) {
      setGraphFailed(true)
      setNodes([])
      setEdges([])
      return
    }
    try {
      const laid = layoutNodes(graph.nodes, root.id).map((n) => ({
        ...n,
        data: {
          ...n.data,
          impactLevel: impactMap.get(n.id) || null,
        },
      }))
      const flowEdges = (graph.edges || []).map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        style: {
          stroke:
            e.criticality === 'critical' || e.criticality === 'high' ? '#B42318' : '#1E8CAA',
          strokeWidth: e.criticality === 'critical' ? 2.2 : 1.4,
        },
        labelStyle: { fontSize: 10, fill: '#053642' },
      }))
      const validated = validateFlowGraph({
        nodes: laid,
        edges: flowEdges,
        tenantEntityIds,
        maxNodes: 28,
      })
      if (import.meta.env.DEV && validated.warnings.length) {
        console.warn('[EA360] Explorer graph validation', validated.warnings)
      }
      setNodes(validated.nodes)
      setEdges(validated.edges)
      setSelectedSideId(root.id)
      setGraphFailed(false)
    } catch (err) {
      console.error('[EA360] Explorer graph prepare failed', err)
      setNodes([])
      setEdges([])
      setGraphFailed(true)
    }
  }, [graph, root, impactMap, tenantEntityIds, setNodes, setEdges])

  useEffect(() => {
    if (!rfInstance || !fitToken || !nodes.length) return undefined
    const t = setTimeout(() => {
      try {
        rfInstance.fitView({ padding: 0.2 })
      } catch (err) {
        console.warn('[EA360] fitView skipped', err)
      }
    }, 60)
    return () => clearTimeout(t)
  }, [rfInstance, fitToken, nodes])

  useEffect(() => {
    setFitToken((t) => t + 1)
  }, [scenarioId, relationshipDepth, graphDirection, entityTypeFilters, impactMode, root?.id])

  const sideEntity = useMemo(() => {
    const id = selectedSideId || root?.id
    if (!id) return null
    return repo.resolveGraphNode(id)
  }, [selectedSideId, root, repo])

  const sideRels = useMemo(() => {
    if (!sideEntity) return []
    return repo.relationshipsFor(sideEntity.id) || []
  }, [sideEntity, repo])

  const upstreamList = useMemo(() => {
    if (!root) return []
    return (repo.relationshipsFor(root.id) || [])
      .filter((r) => r.targetId === root.id)
      .map((r) => ({
        id: r.id,
        other: repo.resolveGraphNode(r.sourceId),
        type: r.relationshipType,
      }))
  }, [root, repo])

  const downstreamList = useMemo(() => {
    if (!root) return []
    return (repo.relationshipsFor(root.id) || [])
      .filter((r) => r.sourceId === root.id)
      .map((r) => ({
        id: r.id,
        other: repo.resolveGraphNode(r.targetId),
        type: r.relationshipType,
      }))
  }, [root, repo])

  const onNodeClick = useCallback((_e, node) => {
    setSelectedSideId(node.id)
  }, [])

  const onNodeDoubleClick = useCallback(
    (_e, node) => {
      const resolved = repo.resolveGraphNode(node.id)
      if (!resolved) return
      setGraphRoot({ id: resolved.id, type: resolved.type })
      setSelectedSideId(resolved.id)
    },
    [repo, setGraphRoot],
  )

  function openDetail() {
    if (!sideEntity) return
    selectEntity({ id: sideEntity.id, type: sideEntity.type })
  }

  function expandFromSide() {
    if (!sideEntity) return
    setGraphRoot({ id: sideEntity.id, type: sideEntity.type })
  }

  function resetGraph() {
    setGraphFailed(false)
    setForceList(false)
    if (scenario) {
      const node = repo.resolveGraphNode(scenario.startingEntityId)
      if (node) {
        setGraphRoot({ id: node.id, type: node.type })
      } else {
        setGraphRoot(null)
      }
      setScenarioId(scenario.id)
    } else {
      setGraphRoot(null)
    }
    setRelationshipDepth(1)
    setGraphDirection('both')
    setEntityTypeFilters([])
    setImpactMode(false)
    setFitToken((t) => t + 1)
  }

  function onScenarioChange(id) {
    setScenarioId(id)
    const next = repo.getScenario(id)
    if (next) {
      const node = repo.resolveGraphNode(next.startingEntityId)
      if (node) setGraphRoot({ id: node.id, type: node.type })
      else setGraphRoot(null)
    }
  }

  function goCockpit() {
    if (onNavigate) onNavigate('executive')
    else {
      setView('executive')
      window.location.hash = ''
    }
  }

  const mobileList = useMemo(() => {
    return (graph.edges || []).map((e) => {
      const from = repo.resolveGraphNode(e.source)
      const to = repo.resolveGraphNode(e.target)
      return {
        id: e.id,
        label: e.label,
        from: from?.name || e.source,
        to: to?.name || e.target,
        fromId: e.source,
        toId: e.target,
      }
    })
  }, [graph.edges, repo])

  const showListFallback = forceList || graphFailed

  return (
    <section className="view active" data-demo-target="relationship-explorer">
      <div className="module explorer-module">
        <div className="module-header">
          <div>
            <div className="kicker">Enterprise Map · Relationship Explorer</div>
            <h1 className="page-title">Connected enterprise explorer</h1>
            <p>
              Traverse typed relationships from a curated scenario root. Expand nodes, filter entity
              types, and run deterministic impact analysis.
            </p>
          </div>
        </div>

        <div className="explorer-toolbar">
          <label className="field">
            <span>Scenario</span>
            <select
              value={scenario?.id || ''}
              onChange={(e) => onScenarioChange(e.target.value)}
              aria-label="Explorer scenario"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Depth</span>
            <select
              value={String(relationshipDepth)}
              onChange={(e) => setRelationshipDepth(Number(e.target.value))}
              aria-label="Relationship depth"
            >
              {[1, 2, 3].map((d) => (
                <option key={d} value={d}>
                  {d} hop{d > 1 ? 's' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Direction</span>
            <select
              value={graphDirection}
              onChange={(e) => setGraphDirection(e.target.value)}
              aria-label="Graph direction"
            >
              <option value="both">Both</option>
              <option value="upstream">Upstream</option>
              <option value="downstream">Downstream</option>
            </select>
          </label>
          <button type="button" className="btn secondary-button" onClick={() => setFitToken((t) => t + 1)}>
            Fit view
          </button>
          <button type="button" className="btn secondary-button" onClick={resetGraph}>
            Reset Explorer
          </button>
          <button
            type="button"
            className={`btn secondary-button${impactMode ? ' active-toggle' : ''}`}
            data-demo-target="impact-analysis"
            onClick={() => setImpactMode(!impactMode)}
          >
            Impact analysis {impactMode ? 'on' : 'off'}
          </button>
          <button
            type="button"
            className={`btn secondary-button${forceList ? ' active-toggle' : ''}`}
            onClick={() => setForceList((v) => !v)}
          >
            {forceList ? 'Show graph' : 'List view'}
          </button>
          <button
            type="button"
            className="btn secondary-button"
            disabled={!root}
            onClick={() => {
              if (!root) return
              const tenant = repo.getTenant()
              const response = impactNarrative({
                tenantId: tenant.id,
                userRole: role,
                query: `What happens if ${root.name} is unavailable?`,
                intent: 'impact_analysis',
                contextEntityIds: [root.id],
                view,
                filters: { period: filters.period, businessUnit: filters.businessUnit },
              })
              recordAiResponse(response)
              setAskOpen(true)
            }}
          >
            Impact narrative
          </button>
        </div>

        <div className="entity-type-filters">
          {ENTITY_FILTER_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              className={`etype-chip${entityTypeFilters.includes(t) ? ' active' : ''}`}
              onClick={() => toggleEntityTypeFilter(t)}
            >
              {t}
            </button>
          ))}
          {entityTypeFilters.length > 0 && (
            <button type="button" className="text-link" onClick={() => setEntityTypeFilters([])}>
              Clear type filters
            </button>
          )}
        </div>

        {scenario && (
          <div className="scenario-narrative explorer-narrative">
            <strong>{scenario.name}</strong>
            <p>{scenario.summary}</p>
            <p className="sub">
              <strong>Key risk:</strong> {scenario.keyRisk}
            </p>
            <p className="sub">
              <strong>Action:</strong> {scenario.recommendedAction}
            </p>
            {impactMode && impact && (
              <div className="impact-summary" data-demo-target="impact-analysis">
                <span>{impact.affectedCapabilities} capabilities</span>
                <span>{impact.affectedApplications} applications</span>
                <span>{impact.criticalDependencies} critical deps</span>
                <span>{impact.hits.filter((h) => h.level === 'direct').length} direct</span>
                <span>{impact.hits.filter((h) => h.level === 'indirect').length} indirect</span>
              </div>
            )}
          </div>
        )}

        {!root ? (
          <div className="empty-state explorer-empty" role="status">
            <p>No connected enterprise object is available for this view.</p>
            <div className="hero-actions">
              {scenarios[0] && (
                <button
                  type="button"
                  className="btn primary primary-button"
                  onClick={() => onScenarioChange(scenarios[0].id)}
                >
                  Open default scenario
                </button>
              )}
              <button type="button" className="btn secondary-button" onClick={resetGraph}>
                Reset Explorer
              </button>
              <button type="button" className="btn secondary-button" onClick={goCockpit}>
                Return to Executive Cockpit
              </button>
            </div>
          </div>
        ) : (
          <div className="explorer-layout">
            <div
              className="explorer-canvas-wrap explorer-desktop explorer-canvas"
              data-demo-target="relationship-explorer"
              style={{ width: '100%', height: 520 }}
            >
              {graphFailed && (
                <div className="explorer-graph-fallback-banner" role="status">
                  Visual graph could not be prepared. Showing relationship lists instead.
                </div>
              )}
              {!showListFallback ? (
                <ReactFlowProvider>
                  <ExplorerCanvas
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onInit={setRfInstance}
                  />
                </ReactFlowProvider>
              ) : (
                <div className="explorer-list-fallback" data-demo-target="relationship-explorer">
                  <h3 className="section-title">Selected entity</h3>
                  <p>
                    <strong>{root.name}</strong> · {root.type}
                    {root.criticality ? ` · ${root.criticality}` : ''}
                  </p>
                  <div className="explorer-list-columns">
                    <div>
                      <h4>Upstream</h4>
                      <ul className="rel-mobile-list">
                        {upstreamList.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              className="rel-mobile-item"
                              onClick={() => r.other && setSelectedSideId(r.other.id)}
                            >
                              <strong>{r.type}</strong>
                              <span>{r.other?.name || '—'}</span>
                            </button>
                          </li>
                        ))}
                        {!upstreamList.length && <li className="empty-state">No upstream links.</li>}
                      </ul>
                    </div>
                    <div>
                      <h4>Downstream</h4>
                      <ul className="rel-mobile-list">
                        {downstreamList.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              className="rel-mobile-item"
                              onClick={() => r.other && setSelectedSideId(r.other.id)}
                            >
                              <strong>{r.type}</strong>
                              <span>{r.other?.name || '—'}</span>
                            </button>
                          </li>
                        ))}
                        {!downstreamList.length && (
                          <li className="empty-state">No downstream links.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  {!forceList && graphFailed && (
                    <button
                      type="button"
                      className="btn secondary-button"
                      onClick={() => {
                        setGraphFailed(false)
                        setFitToken((t) => t + 1)
                      }}
                    >
                      Retry graph
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="explorer-mobile">
              <h3 className="section-title">Relationships</h3>
              <p className="sub">
                Root: {root?.name || '—'} · {graph.edges.length} edges · depth {relationshipDepth}
              </p>
              <ul className="rel-mobile-list">
                {mobileList.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className="rel-mobile-item"
                      onClick={() => {
                        setSelectedSideId(r.toId === (selectedSideId || root?.id) ? r.fromId : r.toId)
                      }}
                    >
                      <strong>{r.label}</strong>
                      <span>
                        {r.from} → {r.to}
                      </span>
                    </button>
                  </li>
                ))}
                {!mobileList.length && <li className="empty-state">No relationships at this depth.</li>}
              </ul>
            </div>

            <aside className="explorer-side" data-demo-target="entity-detail">
              <h3 className="section-title">Entity detail</h3>
              {sideEntity ? (
                <>
                  <div className="kicker">{sideEntity.type}</div>
                  <h4>{sideEntity.name}</h4>
                  {sideEntity.criticality && (
                    <p className="sub">Criticality: {sideEntity.criticality}</p>
                  )}
                  {sideEntity.status && <p className="sub">Status: {sideEntity.status}</p>}
                  {impactMap.get(sideEntity.id) && (
                    <p className="sub">Impact: {impactMap.get(sideEntity.id)}</p>
                  )}
                  <div className="chip-row" style={{ marginTop: 8 }}>
                    <button type="button" className="btn primary primary-button" onClick={openDetail}>
                      Open full detail
                    </button>
                    <button type="button" className="btn secondary-button" onClick={expandFromSide}>
                      Expand from here
                    </button>
                  </div>
                  <h4 className="drawer-section-title">Linked relationships</h4>
                  <ul className="drawer-list">
                    {sideRels.slice(0, 12).map((r) => {
                      const otherId = r.sourceId === sideEntity.id ? r.targetId : r.sourceId
                      const other = repo.resolveGraphNode(otherId)
                      return (
                        <li key={r.id}>
                          <button
                            type="button"
                            className="text-link"
                            onClick={() => {
                              if (other) {
                                setSelectedSideId(other.id)
                                setGraphRoot({ id: other.id, type: other.type })
                              }
                            }}
                          >
                            {r.relationshipType}: {other?.name || otherId}
                          </button>
                        </li>
                      )
                    })}
                    {!sideRels.length && <li className="sub">No direct relationships.</li>}
                  </ul>
                </>
              ) : (
                <p className="sub">Select a node to inspect.</p>
              )}
            </aside>
          </div>
        )}
      </div>
    </section>
  )
}
