import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  MiniMap,
  MarkerType,
  Panel,
  Handle,
  Position,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  AlertTriangle,
  AppWindow,
  Boxes,
  Cable,
  ChevronDown,
  Database,
  Filter,
  Focus,
  GitBranch,
  Layers,
  Lightbulb,
  List,
  Maximize2,
  Minus,
  Network,
  Plus,
  Rocket,
  Server,
  Workflow,
  X,
  Zap,
} from 'lucide-react'
import { usePrototypeStore, getTenantConfig } from '../../state/prototypeStore'
import { analyseImpact, buildNeighbourhoodGraph } from '../../domain/metrics/graph'
import { impactNarrative } from '../../lib/ai'
import { resolveExplorerRoot } from './resolveExplorerRoot'
import { validateFlowGraph } from './validateFlowGraph'
import { layoutLayeredGraph } from './layoutLayeredGraph'

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

const TYPE_LABELS = {
  capability: 'Capability',
  application: 'Application',
  integration: 'Integration',
  process: 'Process',
  dataObject: 'Data object',
  technology: 'Technology',
  finding: 'Finding',
  recommendation: 'Recommendation',
  initiative: 'Initiative',
  evidence: 'Evidence',
  kpi: 'KPI',
  strategicObjective: 'Objective',
}

const TYPE_COLORS = {
  capability: '#1E8CAA',
  application: '#0D6B7A',
  integration: '#C47B2C',
  process: '#6B7280',
  dataObject: '#1E8CAA',
  technology: '#0D6B7A',
  finding: '#C0392B',
  recommendation: '#1E8CAA',
  initiative: '#0D6B7A',
  evidence: '#6B7280',
  kpi: '#1E8CAA',
  strategicObjective: '#0D6B7A',
}

const IMPACT_UI = {
  direct: { label: 'Direct', className: 'direct' },
  indirect: { label: 'Near', className: 'near' },
  potential: { label: 'Extended', className: 'extended' },
}

function EntityTypeIcon({ type, size = 14 }) {
  const props = { size, strokeWidth: 2, 'aria-hidden': true }
  switch (type) {
    case 'capability':
      return <Layers {...props} />
    case 'application':
      return <AppWindow {...props} />
    case 'integration':
      return <Cable {...props} />
    case 'process':
      return <Workflow {...props} />
    case 'dataObject':
      return <Database {...props} />
    case 'technology':
      return <Server {...props} />
    case 'finding':
      return <AlertTriangle {...props} />
    case 'recommendation':
      return <Lightbulb {...props} />
    case 'initiative':
      return <Rocket {...props} />
    case 'evidence':
      return <Boxes {...props} />
    default:
      return <Network {...props} />
  }
}

function formatType(type) {
  return TYPE_LABELS[type] || type || 'Entity'
}

function riskTone(value) {
  const s = String(value || '').toLowerCase()
  if (['critical', 'high', 'severe', 'open'].includes(s)) return 'risk'
  if (['medium', 'moderate', 'watch', 'warn'].includes(s)) return 'warn'
  if (['low', 'stable', 'good', 'resolved', 'closed'].includes(s)) return 'good'
  return 'neutral'
}

function EntityNode({ data, selected }) {
  const color = TYPE_COLORS[data.entityType] || '#1E8CAA'
  const isRisk = data.entityType === 'finding' || riskTone(data.criticality) === 'risk'
  const isWarn =
    data.entityType === 'finding' ||
    riskTone(data.criticality) === 'warn' ||
    data.impactLevel === 'indirect'
  const meta =
    data.impactLevel && IMPACT_UI[data.impactLevel]
      ? IMPACT_UI[data.impactLevel].label
      : data.criticality || data.status || null
  const impactClass = data.impactLevel ? ` impact-${IMPACT_UI[data.impactLevel]?.className || data.impactLevel}` : ''
  const dimClass = data.dimmed ? ' is-dimmed' : ''
  const selClass = selected || data.isSelected ? ' is-selected' : ''

  return (
    <div
      className={`rf-entity-node${data.isRoot ? ' root' : ''}${isRisk ? ' is-risk' : ''}${isWarn && !isRisk ? ' is-warn' : ''}${impactClass}${dimClass}${selClass}`}
      style={{ borderColor: data.isRoot ? undefined : color }}
      data-demo-target={data.isRoot ? 'graph-node' : undefined}
    >
      <Handle type="target" position={Position.Left} className="rf-handle" />
      <div className="rf-node-top">
        <span className="rf-node-icon" style={{ color }}>
          <EntityTypeIcon type={data.entityType} size={14} />
        </span>
        <span className="rf-node-type" style={{ color }}>
          {formatType(data.entityType)}
        </span>
        {data.isRoot && <span className="rf-node-focus">Focus</span>}
        {(isRisk || isWarn) && (
          <span className={`rf-node-risk-dot tone-${isRisk ? 'risk' : 'warn'}`} aria-hidden="true" />
        )}
      </div>
      <div className="rf-node-name" title={data.label}>
        {data.label}
      </div>
      <div className="rf-node-foot">
        {meta && <span className="rf-node-meta">{meta}</span>}
        {data.connectionCount > 0 && (
          <span className="rf-node-conn">
            <GitBranch size={11} aria-hidden="true" /> {data.connectionCount}
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="rf-handle" />
    </div>
  )
}

/** Stable outside render — required by React Flow */
const nodeTypes = { entity: EntityNode }

function GraphToolbar({ onFit, onCenterRoot, onList, listActive }) {
  const { zoomIn, zoomOut } = useReactFlow()
  return (
    <Panel position="top-right" className="explorer-graph-toolbar">
      <button type="button" title="Zoom in" aria-label="Zoom in" onClick={() => zoomIn({ duration: 160 })}>
        <Plus size={15} />
      </button>
      <button type="button" title="Zoom out" aria-label="Zoom out" onClick={() => zoomOut({ duration: 160 })}>
        <Minus size={15} />
      </button>
      <button type="button" title="Fit view" aria-label="Fit view" onClick={onFit}>
        <Maximize2 size={15} />
      </button>
      <button type="button" title="Centre root" aria-label="Centre root" onClick={onCenterRoot}>
        <Focus size={15} />
      </button>
      <button
        type="button"
        title="List view"
        aria-label="List view"
        className={listActive ? 'is-active' : ''}
        onClick={onList}
      >
        <List size={15} />
      </button>
    </Panel>
  )
}

function ExplorerCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onNodeClick,
  onNodeDoubleClick,
  onInit,
  onFit,
  onCenterRoot,
  onList,
  listActive,
  emptyState,
}) {
  const showMiniMap = nodes.length > 12
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
      minZoom={0.25}
      maxZoom={1.6}
      proOptions={{ hideAttribution: true }}
      nodesDraggable
      elementsSelectable
      defaultEdgeOptions={{
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: '#8aa0a8' },
      }}
    >
      <Background id="explorer-dots" gap={18} size={1.1} color="#c5d4d9" />
      <GraphToolbar
        onFit={onFit}
        onCenterRoot={onCenterRoot}
        onList={onList}
        listActive={listActive}
      />
      {showMiniMap && (
        <MiniMap
          nodeColor={(n) => TYPE_COLORS[n.data?.entityType] || '#1E8CAA'}
          maskColor="rgba(255,255,255,0.72)"
          pannable
          zoomable
          className="explorer-minimap"
        />
      )}
      {emptyState}
    </ReactFlow>
  )
}

function Segmented({ label, value, options, onChange, ariaLabel }) {
  return (
    <div className="explorer-control">
      <span className="explorer-control-label">{label}</span>
      <div className="explorer-segmented" role="group" aria-label={ariaLabel || label}>
        {options.map((opt) => (
          <button
            key={String(opt.value)}
            type="button"
            className={value === opt.value ? 'is-active' : ''}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function EntityTypePopover({ selected, onToggle, onClear }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const count = selected.length
  const summary = count === 0 ? '9 of 9 types' : `${count} of 9 types`

  useEffect(() => {
    if (!open) return undefined
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div className="explorer-control explorer-etype" ref={ref}>
      <span className="explorer-control-label">Entity types</span>
      <button
        type="button"
        className={`explorer-etype-trigger${open ? ' is-open' : ''}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <span>{summary}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="explorer-etype-menu" role="listbox" aria-label="Entity types">
          {ENTITY_FILTER_OPTIONS.map((t) => {
            const active = selected.length === 0 || selected.includes(t)
            const checked = selected.length === 0 ? true : selected.includes(t)
            return (
              <label key={t} className={`explorer-etype-option${active ? ' is-on' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    if (selected.length === 0) {
                      // Start filtering: keep all except leave toggle semantics via store
                      onToggle(t, 'start-from-all')
                    } else {
                      onToggle(t)
                    }
                  }}
                />
                <EntityTypeIcon type={t} size={13} />
                <span>{formatType(t)}</span>
              </label>
            )
          })}
          {selected.length > 0 && (
            <button type="button" className="explorer-text-action" onClick={onClear}>
              Show all types
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ControlRail({
  scenarios,
  scenario,
  root,
  relationshipDepth,
  graphDirection,
  entityTypeFilters,
  onScenarioChange,
  setRelationshipDepth,
  setGraphDirection,
  setEntityTypeFilters,
  onReset,
  scenarioOpen,
  setScenarioOpen,
}) {
  function handleTypeToggle(t, mode) {
    if (mode === 'start-from-all') {
      // Empty filter = all types. Unchecking one leaves the other eight.
      setEntityTypeFilters(ENTITY_FILTER_OPTIONS.filter((x) => x !== t))
      return
    }
    const next = entityTypeFilters.includes(t)
      ? entityTypeFilters.filter((x) => x !== t)
      : [...entityTypeFilters, t]
    // All nine selected → treat as unfiltered (show all)
    if (next.length === ENTITY_FILTER_OPTIONS.length) setEntityTypeFilters([])
    else setEntityTypeFilters(next)
  }

  const scenarioTone = scenario?.keyRisk ? 'warn' : 'neutral'

  return (
    <aside className="explorer-rail" aria-label="Explorer controls">
      <div className="explorer-control">
        <span className="explorer-control-label">Scenario</span>
        <select
          className="explorer-select"
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
      </div>

      <div className="explorer-control">
        <span className="explorer-control-label">Root entity</span>
        <div className="explorer-root-chip">
          {root ? (
            <>
              <span className="explorer-root-icon" style={{ color: TYPE_COLORS[root.type] || '#1E8CAA' }}>
                <EntityTypeIcon type={root.type} size={14} />
              </span>
              <span className="explorer-root-text">
                <strong title={root.name}>{root.name}</strong>
                <em>{formatType(root.type)}</em>
              </span>
            </>
          ) : (
            <span className="explorer-muted">No root resolved</span>
          )}
        </div>
      </div>

      {scenario && (
        <div className="explorer-scenario-block">
          <div className="explorer-scenario-line">
            <span className="explorer-scenario-title" title={scenario.name}>
              {scenario.name}
            </span>
            <span className={`explorer-status tone-${scenarioTone}`}>Risk</span>
          </div>
          <button
            type="button"
            className="explorer-disclosure"
            aria-expanded={scenarioOpen}
            onClick={() => setScenarioOpen((v) => !v)}
          >
            Scenario context
            <ChevronDown size={14} className={scenarioOpen ? 'is-open' : ''} />
          </button>
          {scenarioOpen && (
            <div className="explorer-scenario-body">
              <p>
                <strong>Situation.</strong> {scenario.summary}
              </p>
              <p>
                <strong>Key risk.</strong> {scenario.keyRisk}
              </p>
              <p>
                <strong>Recommended action.</strong> {scenario.recommendedAction}
              </p>
            </div>
          )}
        </div>
      )}

      <Segmented
        label="Relationship depth"
        ariaLabel="Relationship depth"
        value={relationshipDepth}
        onChange={setRelationshipDepth}
        options={[
          { value: 1, label: '1' },
          { value: 2, label: '2' },
          { value: 3, label: '3' },
        ]}
      />

      <Segmented
        label="Direction"
        ariaLabel="Graph direction"
        value={graphDirection}
        onChange={setGraphDirection}
        options={[
          { value: 'upstream', label: 'Upstream' },
          { value: 'both', label: 'Both' },
          { value: 'downstream', label: 'Downstream' },
        ]}
      />

      <EntityTypePopover
        selected={entityTypeFilters}
        onToggle={handleTypeToggle}
        onClear={() => setEntityTypeFilters([])}
      />

      <div className="explorer-control">
        <span className="explorer-control-label">View options</span>
        <p className="explorer-hint">
          Upstream left · Focus centre · Downstream right. Use the canvas toolbar to fit or list.
        </p>
      </div>

      <button type="button" className="explorer-text-action explorer-reset" onClick={onReset}>
        Reset Explorer
      </button>
    </aside>
  )
}

function Inspector({
  sideEntity,
  impactMap,
  impact,
  impactMode,
  repo,
  onOpenDetail,
  onExpand,
  onImpact,
  onSelectRelated,
  onExplain,
  linkedFinding,
  linkedRec,
}) {
  const sideRels = useMemo(() => {
    if (!sideEntity) return []
    return repo.relationshipsFor(sideEntity.id) || []
  }, [sideEntity, repo])

  const upstream = useMemo(() => {
    if (!sideEntity) return []
    return sideRels
      .filter((r) => r.targetId === sideEntity.id)
      .map((r) => ({
        id: r.id,
        other: repo.resolveGraphNode(r.sourceId),
        type: r.relationshipType,
        criticality: r.criticality,
      }))
  }, [sideEntity, sideRels, repo])

  const downstream = useMemo(() => {
    if (!sideEntity) return []
    return sideRels
      .filter((r) => r.sourceId === sideEntity.id)
      .map((r) => ({
        id: r.id,
        other: repo.resolveGraphNode(r.targetId),
        type: r.relationshipType,
        criticality: r.criticality,
      }))
  }, [sideEntity, sideRels, repo])

  const risks = useMemo(() => {
    if (!sideEntity) return []
    const fromRels = sideRels
      .map((r) => {
        const otherId = r.sourceId === sideEntity.id ? r.targetId : r.sourceId
        return repo.resolveGraphNode(otherId)
      })
      .filter((n) => n && (n.type === 'finding' || n.type === 'recommendation'))
    const extra = []
    if (sideEntity.type === 'capability' && repo.findingsForCapability) {
      extra.push(...(repo.findingsForCapability(sideEntity.id) || []))
    }
    if (sideEntity.type === 'application' && repo.findingsForApplication) {
      extra.push(...(repo.findingsForApplication(sideEntity.id) || []))
    }
    if (sideEntity.type === 'integration' && repo.findingsForIntegration) {
      extra.push(...(repo.findingsForIntegration(sideEntity.id) || []))
    }
    const map = new Map()
    for (const n of [...fromRels, ...extra]) {
      if (n?.id) map.set(n.id, n)
    }
    return [...map.values()].slice(0, 8)
  }, [sideEntity, sideRels, repo])

  const evidenceRecs = useMemo(() => {
    if (!sideEntity) return []
    const items = sideRels
      .map((r) => {
        const otherId = r.sourceId === sideEntity.id ? r.targetId : r.sourceId
        return repo.resolveGraphNode(otherId)
      })
      .filter((n) => n && (n.type === 'evidence' || n.type === 'recommendation' || n.type === 'initiative'))
    return items.slice(0, 8)
  }, [sideEntity, sideRels, repo])

  const attrs = useMemo(() => {
    if (!sideEntity) return []
    const rows = []
    if (sideEntity.criticality) rows.push(['Criticality', sideEntity.criticality])
    if (sideEntity.status) rows.push(['Status', sideEntity.status])
    if (sideEntity.type) rows.push(['Type', formatType(sideEntity.type)])
    const lvl = impactMap.get(sideEntity.id)
    if (lvl && IMPACT_UI[lvl]) rows.push(['Impact', IMPACT_UI[lvl].label])
    return rows
  }, [sideEntity, impactMap])

  if (!sideEntity) {
    return (
      <aside className="explorer-inspector" data-demo-target="entity-detail">
        <p className="explorer-muted">Select a node to inspect dependencies, risks and actions.</p>
      </aside>
    )
  }

  const tone = riskTone(sideEntity.criticality)

  return (
    <aside className="explorer-inspector" data-demo-target="entity-detail">
      {impactMode && impact && (
        <div className="explorer-impact-summary" data-demo-target="impact-analysis">
          <div className="explorer-impact-head">
            <Zap size={14} aria-hidden="true" />
            <strong>Impact summary</strong>
          </div>
          <div className="explorer-impact-grid">
            <div>
              <span>Affected</span>
              <strong>{impact.hits.length}</strong>
            </div>
            <div>
              <span>Critical deps</span>
              <strong>{impact.criticalDependencies}</strong>
            </div>
            <div>
              <span>Capabilities</span>
              <strong>{impact.affectedCapabilities}</strong>
            </div>
            <div>
              <span>Linked risks</span>
              <strong>{impact.findingIds?.length || 0}</strong>
            </div>
          </div>
          <div className="explorer-impact-levels">
            <span className="lvl direct">
              Direct {impact.hits.filter((h) => h.level === 'direct').length}
            </span>
            <span className="lvl near">
              Near {impact.hits.filter((h) => h.level === 'indirect').length}
            </span>
            <span className="lvl extended">
              Extended {impact.hits.filter((h) => h.level === 'potential').length}
            </span>
          </div>
          <button type="button" className="explorer-btn primary" onClick={onExplain}>
            Explain impact
          </button>
        </div>
      )}

      <header className="explorer-inspector-head">
        <span
          className="explorer-inspector-icon"
          style={{ color: TYPE_COLORS[sideEntity.type] || '#1E8CAA' }}
        >
          <EntityTypeIcon type={sideEntity.type} size={18} />
        </span>
        <div className="explorer-inspector-titles">
          <span className="explorer-inspector-type">{formatType(sideEntity.type)}</span>
          <h3 title={sideEntity.name}>{sideEntity.name}</h3>
        </div>
        {sideEntity.criticality && (
          <span className={`explorer-status tone-${tone}`}>{sideEntity.criticality}</span>
        )}
      </header>

      <section className="explorer-insp-section">
        <h4>Key attributes</h4>
        <dl className="explorer-attr-list">
          {attrs.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
          {!attrs.length && <p className="explorer-muted">No attributes.</p>}
        </dl>
      </section>

      <section className="explorer-insp-section">
        <h4>Upstream dependencies</h4>
        <ul className="explorer-rel-rows">
          {upstream.slice(0, 10).map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="explorer-rel-row"
                onClick={() => r.other && onSelectRelated(r.other)}
              >
                <EntityTypeIcon type={r.other?.type} size={13} />
                <span className="explorer-rel-main">
                  <strong>{r.other?.name || '—'}</strong>
                  <em>{r.type}</em>
                </span>
              </button>
            </li>
          ))}
          {!upstream.length && <li className="explorer-muted">None</li>}
        </ul>
      </section>

      <section className="explorer-insp-section">
        <h4>Downstream dependencies</h4>
        <ul className="explorer-rel-rows">
          {downstream.slice(0, 10).map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className="explorer-rel-row"
                onClick={() => r.other && onSelectRelated(r.other)}
              >
                <EntityTypeIcon type={r.other?.type} size={13} />
                <span className="explorer-rel-main">
                  <strong>{r.other?.name || '—'}</strong>
                  <em>{r.type}</em>
                </span>
              </button>
            </li>
          ))}
          {!downstream.length && <li className="explorer-muted">None</li>}
        </ul>
      </section>

      <section className="explorer-insp-section">
        <h4>Risks / findings</h4>
        <ul className="explorer-rel-rows">
          {risks.map((n) => (
            <li key={n.id}>
              <button type="button" className="explorer-rel-row" onClick={() => onSelectRelated(n)}>
                <EntityTypeIcon type={n.type} size={13} />
                <span className="explorer-rel-main">
                  <strong>{n.name}</strong>
                  <em>{formatType(n.type)}</em>
                </span>
              </button>
            </li>
          ))}
          {!risks.length && <li className="explorer-muted">None linked</li>}
        </ul>
      </section>

      <section className="explorer-insp-section">
        <h4>Evidence and recommendations</h4>
        <ul className="explorer-rel-rows">
          {evidenceRecs.map((n) => (
            <li key={n.id}>
              <button type="button" className="explorer-rel-row" onClick={() => onSelectRelated(n)}>
                <EntityTypeIcon type={n.type} size={13} />
                <span className="explorer-rel-main">
                  <strong>{n.name}</strong>
                  <em>{formatType(n.type)}</em>
                </span>
              </button>
            </li>
          ))}
          {!evidenceRecs.length && <li className="explorer-muted">None linked</li>}
        </ul>
      </section>

      <section className="explorer-insp-section explorer-actions">
        <h4>Actions</h4>
        <div className="explorer-action-stack">
          <button type="button" className="explorer-btn primary" onClick={onOpenDetail}>
            Open full detail
          </button>
          <button type="button" className="explorer-btn" onClick={onExpand}>
            Expand from here
          </button>
          <button type="button" className="explorer-btn" onClick={onImpact}>
            Run impact analysis
          </button>
          {linkedFinding && (
            <button
              type="button"
              className="explorer-btn"
              onClick={() => onSelectRelated(linkedFinding)}
            >
              Open linked finding
            </button>
          )}
          {linkedRec && (
            <button type="button" className="explorer-btn" onClick={() => onSelectRelated(linkedRec)}>
              Open linked recommendation
            </button>
          )}
        </div>
      </section>
    </aside>
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
  const [scenarioOpen, setScenarioOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [mobileGraph, setMobileGraph] = useState(false)

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
      const laid = layoutLayeredGraph(graph.nodes, graph.edges, root.id, graphDirection).map(
        (n) => ({
          ...n,
          data: {
            ...n.data,
            impactLevel: impactMap.get(n.id) || null,
          },
        }),
      )
      const flowEdges = (graph.edges || []).map((e) => {
        const critical = e.criticality === 'critical' || e.criticality === 'high'
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: undefined,
          data: { label: e.label, criticality: e.criticality },
          type: 'smoothstep',
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 14,
            height: 14,
            color: critical ? '#C0392B' : '#8aa0a8',
          },
          style: {
            stroke: critical ? '#C0392B' : '#8aa0a8',
            strokeWidth: critical ? 2 : 1.5,
          },
        }
      })
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
  }, [graph, root, impactMap, tenantEntityIds, graphDirection, setNodes, setEdges])

  useEffect(() => {
    if (!rfInstance || !fitToken || !nodes.length) return undefined
    const t = setTimeout(() => {
      try {
        rfInstance.fitView({ padding: 0.18 })
      } catch (err) {
        console.warn('[EA360] fitView skipped', err)
      }
    }, 60)
    return () => clearTimeout(t)
  }, [rfInstance, fitToken, nodes])

  useEffect(() => {
    setFitToken((t) => t + 1)
  }, [scenarioId, relationshipDepth, graphDirection, entityTypeFilters, impactMode, root?.id])

  const connectedIds = useMemo(() => {
    const set = new Set()
    if (!selectedSideId) return set
    set.add(selectedSideId)
    for (const e of edges) {
      if (e.source === selectedSideId || e.target === selectedSideId) {
        set.add(e.source)
        set.add(e.target)
      }
    }
    return set
  }, [selectedSideId, edges])

  const displayNodes = useMemo(() => {
    return nodes.map((n) => {
      const isSelected = n.id === selectedSideId
      let dimmed = false
      if (impactMode && impact) {
        dimmed = n.id !== root?.id && !impactMap.has(n.id)
      } else if (selectedSideId && connectedIds.size > 1) {
        dimmed = !connectedIds.has(n.id)
      }
      return {
        ...n,
        selected: isSelected,
        data: {
          ...n.data,
          isSelected,
          dimmed,
          impactLevel: impactMap.get(n.id) || n.data?.impactLevel || null,
        },
        style: {
          ...n.style,
          opacity: dimmed ? 0.5 : 1,
        },
      }
    })
  }, [nodes, selectedSideId, connectedIds, impactMode, impact, impactMap, root?.id])

  const displayEdges = useMemo(() => {
    return edges.map((e) => {
      const critical = e.data?.criticality === 'critical' || e.data?.criticality === 'high'
      const onPath =
        selectedSideId && (e.source === selectedSideId || e.target === selectedSideId)
      const inImpact =
        impactMode &&
        impact &&
        (impactMap.has(e.source) || e.source === root?.id) &&
        (impactMap.has(e.target) || e.target === root?.id)
      const highlight = onPath || (impactMode && inImpact)
      const showLabel = onPath || (selectedSideId && (e.source === selectedSideId || e.target === selectedSideId))
      const stroke = critical ? '#C0392B' : highlight ? '#0D6B7A' : '#8aa0a8'
      return {
        ...e,
        label: showLabel ? e.data?.label : undefined,
        labelStyle: showLabel
          ? { fontSize: 11, fill: '#053642', fontWeight: 600 }
          : undefined,
        labelBgStyle: showLabel ? { fill: '#fff', fillOpacity: 0.92 } : undefined,
        labelBgPadding: showLabel ? [4, 6] : undefined,
        style: {
          ...e.style,
          stroke,
          strokeWidth: highlight ? 2.75 : critical ? 2 : 1.5,
          opacity: impactMode && impact && !inImpact && !onPath ? 0.28 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: stroke,
        },
        animated: false,
      }
    })
  }, [edges, selectedSideId, impactMode, impact, impactMap, root?.id])

  const sideEntity = useMemo(() => {
    const id = selectedSideId || root?.id
    if (!id) return null
    return repo.resolveGraphNode(id)
  }, [selectedSideId, root, repo])

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

  const linkedFinding = useMemo(() => {
    if (!scenario?.findingId) return null
    return repo.resolveGraphNode(scenario.findingId)
  }, [scenario, repo])

  const linkedRec = useMemo(() => {
    if (!linkedFinding || !repo.recommendationsForFinding) return null
    return (repo.recommendationsForFinding(linkedFinding.id) || [])[0] || null
  }, [linkedFinding, repo])

  const onNodeClick = useCallback((_e, node) => {
    setSelectedSideId(node.id)
    setInspectorOpen(true)
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

  function explainImpact() {
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
  }

  function resetGraph() {
    setGraphFailed(false)
    setForceList(false)
    setScenarioOpen(false)
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

  function centerRoot() {
    if (!rfInstance || !root) return
    const node = nodes.find((n) => n.id === root.id)
    if (!node) {
      setFitToken((t) => t + 1)
      return
    }
    const w = node.style?.width || 196
    const h = node.style?.height || 82
    try {
      rfInstance.setCenter(node.position.x + w / 2, node.position.y + h / 2, {
        zoom: 1,
        duration: 200,
      })
    } catch (err) {
      console.warn('[EA360] centre root skipped', err)
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
  const graphEmpty = !graphFailed && root && nodes.length <= 1 && (graph.edges || []).length === 0
  const filterActive = entityTypeFilters.length > 0

  const emptyState =
    graphEmpty || (root && !nodes.length && !graphFailed) ? (
      <Panel position="top-center" className="explorer-canvas-empty">
        <strong>No relationships to display</strong>
        <p>
          {filterActive
            ? `Entity-type filters are limiting the neighbourhood (${entityTypeFilters.length} of 9 types).`
            : `Depth ${relationshipDepth} · ${graphDirection} · no neighbours found for this root.`}
        </p>
        <button type="button" className="explorer-btn" onClick={resetGraph}>
          Reset filters
        </button>
      </Panel>
    ) : null

  const railProps = {
    scenarios,
    scenario,
    root,
    relationshipDepth,
    graphDirection,
    entityTypeFilters,
    onScenarioChange,
    setRelationshipDepth,
    setGraphDirection,
    setEntityTypeFilters,
    onReset: resetGraph,
    scenarioOpen,
    setScenarioOpen,
  }

  return (
    <section
      className="view active relationship-explorer"
      data-demo-target="relationship-explorer"
    >
      <div className="explorer-workspace">
        <header className="explorer-page-header">
          <div className="explorer-page-header-left">
            <h1>Relationship Explorer</h1>
            <p className="explorer-context-line">
              {scenario ? scenario.name : 'No scenario'}
              {root ? ` · ${root.name}` : ''}
              {impactMode ? ' · Impact on' : ''}
            </p>
          </div>
          <div className="explorer-page-header-right">
            <button
              type="button"
              className="explorer-btn explorer-filters-btn"
              onClick={() => setFiltersOpen(true)}
            >
              <Filter size={14} /> Filters
            </button>
            <button
              type="button"
              className={`explorer-btn${impactMode ? ' is-active' : ''}`}
              data-demo-target="impact-analysis"
              onClick={() => setImpactMode(!impactMode)}
            >
              <Zap size={14} /> Impact analysis
            </button>
            <button
              type="button"
              className="explorer-btn explorer-inspector-btn"
              onClick={() => setInspectorOpen(true)}
            >
              Inspect
            </button>
            <details className="explorer-overflow">
              <summary aria-label="More actions">···</summary>
              <div className="explorer-overflow-menu">
                <button type="button" onClick={explainImpact} disabled={!root}>
                  Explain impact
                </button>
                <button type="button" onClick={resetGraph}>
                  Reset Explorer
                </button>
                <button type="button" onClick={goCockpit}>
                  Executive Cockpit
                </button>
                <button type="button" onClick={() => setForceList((v) => !v)}>
                  {forceList ? 'Show graph' : 'List view'}
                </button>
              </div>
            </details>
          </div>
        </header>

        {!root ? (
          <div className="explorer-empty" role="status">
            <p>No connected enterprise object is available for this view.</p>
            <div className="explorer-empty-actions">
              {scenarios[0] && (
                <button
                  type="button"
                  className="explorer-btn primary"
                  onClick={() => onScenarioChange(scenarios[0].id)}
                >
                  Open default scenario
                </button>
              )}
              <button type="button" className="explorer-btn" onClick={resetGraph}>
                Reset Explorer
              </button>
              <button type="button" className="explorer-btn" onClick={goCockpit}>
                Return to Executive Cockpit
              </button>
            </div>
          </div>
        ) : (
          <div className="explorer-body">
            <div className="explorer-rail-slot">
              <ControlRail {...railProps} />
            </div>

            <div
              className="explorer-canvas-wrap explorer-desktop explorer-canvas"
              data-demo-target="relationship-explorer"
            >
              {graphFailed && (
                <div className="explorer-graph-fallback-banner" role="status">
                  Visual graph could not be prepared. Showing relationship lists instead.
                </div>
              )}
              {!showListFallback ? (
                <ReactFlowProvider>
                  <ExplorerCanvas
                    nodes={displayNodes}
                    edges={displayEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    onNodeDoubleClick={onNodeDoubleClick}
                    onInit={setRfInstance}
                    onFit={() => setFitToken((t) => t + 1)}
                    onCenterRoot={centerRoot}
                    onList={() => setForceList(true)}
                    listActive={forceList}
                    emptyState={emptyState}
                  />
                </ReactFlowProvider>
              ) : (
                <div className="explorer-list-fallback" data-demo-target="relationship-explorer">
                  <div className="explorer-list-fallback-head">
                    <h3>Selected entity</h3>
                    {!graphFailed && (
                      <button
                        type="button"
                        className="explorer-btn"
                        onClick={() => setForceList(false)}
                      >
                        Show graph
                      </button>
                    )}
                  </div>
                  <p>
                    <strong>{root.name}</strong> · {formatType(root.type)}
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
                        {!upstreamList.length && <li className="explorer-muted">No upstream links.</li>}
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
                          <li className="explorer-muted">No downstream links.</li>
                        )}
                      </ul>
                    </div>
                  </div>
                  {!forceList && graphFailed && (
                    <button
                      type="button"
                      className="explorer-btn"
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

            <div className="explorer-inspector-slot">
              <Inspector
                sideEntity={sideEntity}
                impactMap={impactMap}
                impact={impact}
                impactMode={impactMode}
                repo={repo}
                onOpenDetail={openDetail}
                onExpand={expandFromSide}
                onImpact={() => setImpactMode(true)}
                onSelectRelated={(ent) => {
                  if (!ent) return
                  setSelectedSideId(ent.id)
                  if (ent.type === 'finding' || ent.type === 'recommendation') {
                    selectEntity({ id: ent.id, type: ent.type })
                  }
                }}
                onExplain={explainImpact}
                linkedFinding={linkedFinding}
                linkedRec={linkedRec}
              />
            </div>

            {/* Mobile list (default) */}
            <div className="explorer-mobile">
              <div className="explorer-mobile-bar">
                <h3>Relationships</h3>
                <button
                  type="button"
                  className="explorer-btn"
                  onClick={() => setMobileGraph((v) => !v)}
                >
                  {mobileGraph ? 'List view' : 'Graph view'}
                </button>
              </div>
              <p className="explorer-muted">
                Root: {root?.name || '—'} · {graph.edges.length} edges · depth {relationshipDepth}
              </p>
              {mobileGraph && !graphFailed ? (
                <div className="explorer-mobile-graph">
                  <ReactFlowProvider>
                    <ExplorerCanvas
                      nodes={displayNodes}
                      edges={displayEdges}
                      onNodesChange={onNodesChange}
                      onEdgesChange={onEdgesChange}
                      onNodeClick={onNodeClick}
                      onNodeDoubleClick={onNodeDoubleClick}
                      onInit={setRfInstance}
                      onFit={() => setFitToken((t) => t + 1)}
                      onCenterRoot={centerRoot}
                      onList={() => setMobileGraph(false)}
                      listActive={!mobileGraph}
                      emptyState={emptyState}
                    />
                  </ReactFlowProvider>
                </div>
              ) : (
                <ul className="rel-mobile-list">
                  {mobileList.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="rel-mobile-item"
                        onClick={() => {
                          setSelectedSideId(
                            r.toId === (selectedSideId || root?.id) ? r.fromId : r.toId,
                          )
                          setInspectorOpen(true)
                        }}
                      >
                        <strong>{r.label}</strong>
                        <span>
                          {r.from} → {r.to}
                        </span>
                      </button>
                    </li>
                  ))}
                  {!mobileList.length && (
                    <li className="explorer-muted">No relationships at this depth.</li>
                  )}
                </ul>
              )}
              <button
                type="button"
                className="explorer-btn"
                style={{ marginTop: 12 }}
                onClick={() => setInspectorOpen(true)}
              >
                Open inspector
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filters drawer (tablet) */}
      {filtersOpen && (
        <div className="explorer-drawer-root" role="presentation">
          <button
            type="button"
            className="explorer-drawer-backdrop"
            aria-label="Close filters"
            onClick={() => setFiltersOpen(false)}
          />
          <div className="explorer-drawer explorer-drawer-left" role="dialog" aria-label="Filters">
            <div className="explorer-drawer-head">
              <strong>Filters</strong>
              <button type="button" className="explorer-icon-btn" onClick={() => setFiltersOpen(false)}>
                <X size={16} />
              </button>
            </div>
            <ControlRail {...railProps} />
          </div>
        </div>
      )}

      {/* Inspector drawer (narrow) */}
      {inspectorOpen && (
        <div className="explorer-drawer-root explorer-inspector-drawer" role="presentation">
          <button
            type="button"
            className="explorer-drawer-backdrop"
            aria-label="Close inspector"
            onClick={() => setInspectorOpen(false)}
          />
          <div className="explorer-drawer explorer-drawer-right" role="dialog" aria-label="Entity inspector">
            <div className="explorer-drawer-head">
              <strong>Entity inspector</strong>
              <button
                type="button"
                className="explorer-icon-btn"
                onClick={() => setInspectorOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <Inspector
              sideEntity={sideEntity}
              impactMap={impactMap}
              impact={impact}
              impactMode={impactMode}
              repo={repo}
              onOpenDetail={openDetail}
              onExpand={expandFromSide}
              onImpact={() => setImpactMode(true)}
              onSelectRelated={(ent) => {
                if (!ent) return
                setSelectedSideId(ent.id)
                if (ent.type === 'finding' || ent.type === 'recommendation') {
                  selectEntity({ id: ent.id, type: ent.type })
                }
              }}
              onExplain={explainImpact}
              linkedFinding={linkedFinding}
              linkedRec={linkedRec}
            />
          </div>
        </div>
      )}
    </section>
  )
}
