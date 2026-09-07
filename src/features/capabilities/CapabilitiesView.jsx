import { useMemo } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { heatmapValue, capabilityApplicationSupport } from '../../domain/metrics/portfolio'
import ExplainButton from '../ai-assist/ExplainButton'

const MODES = [
  { id: 'maturity', label: 'Current maturity', unit: '1–5' },
  { id: 'risk', label: 'Risk exposure', unit: '0–5' },
  { id: 'importance', label: 'Strategic importance', unit: '1–5' },
  { id: 'support', label: 'Application support', unit: '1–5' },
  { id: 'investment', label: 'Investment priority', unit: '1–5' },
]

function bandLabel(value, mode) {
  if (mode === 'risk') {
    if (value >= 4) return 'High'
    if (value >= 2.5) return 'Medium'
    return 'Low'
  }
  if (value >= 4) return 'Strong'
  if (value >= 2.5) return 'Moderate'
  return 'Weak'
}

function cellTone(value, mode) {
  // Risk: higher is worse; others: higher is better (except investment = urgency)
  if (mode === 'risk') {
    if (value >= 4) return 'tone-bad'
    if (value >= 2.5) return 'tone-warn'
    return 'tone-good'
  }
  if (mode === 'investment') {
    if (value >= 4) return 'tone-accent'
    if (value >= 2.5) return 'tone-warn'
    return 'tone-muted'
  }
  if (value >= 4) return 'tone-good'
  if (value >= 2.5) return 'tone-warn'
  return 'tone-bad'
}

export default function CapabilitiesView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const heatmapMode = usePrototypeStore((s) => s.heatmapMode)
  const setHeatmapMode = usePrototypeStore((s) => s.setHeatmapMode)
  const capabilityFilters = usePrototypeStore((s) => s.capabilityFilters)
  const setCapabilityFilters = usePrototypeStore((s) => s.setCapabilityFilters)
  const compareIds = usePrototypeStore((s) => s.compareCapabilityIds)
  const toggleCompare = usePrototypeStore((s) => s.toggleCompareCapability)
  const clearCompare = usePrototypeStore((s) => s.clearCompare)
  const selectedEntity = usePrototypeStore((s) => s.selectedEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const setPortfolioFilters = usePrototypeStore((s) => s.setPortfolioFilters)

  const apps = repo.listApplications()
  const caps = repo.listCapabilities()
  const domains = useMemo(
    () => [...new Set(caps.map((c) => c.domain))].sort(),
    [caps],
  )

  const filtered = useMemo(() => {
    const q = capabilityFilters.search.trim().toLowerCase()
    return caps.filter((c) => {
      if (capabilityFilters.domain && c.domain !== capabilityFilters.domain) return false
      if (!q) return true
      return (
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.domain.toLowerCase().includes(q)
      )
    })
  }, [caps, capabilityFilters])

  const tree = useMemo(() => {
    const l1 = filtered.filter((c) => c.level === 1)
    const byParent = new Map()
    for (const c of filtered.filter((c) => c.level > 1)) {
      const list = byParent.get(c.parentId) ?? []
      list.push(c)
      byParent.set(c.parentId, list)
    }
    // Include L1 parents of matched children even if L1 filtered out
    const roots = [...l1]
    const rootIds = new Set(roots.map((r) => r.id))
    for (const c of filtered) {
      if (c.level === 1 || !c.parentId) continue
      let parent = caps.find((p) => p.id === c.parentId)
      while (parent) {
        if (parent.level === 1 && !rootIds.has(parent.id)) {
          if (!capabilityFilters.domain || parent.domain === capabilityFilters.domain) {
            roots.push(parent)
            rootIds.add(parent.id)
          }
        }
        parent = parent.parentId ? caps.find((p) => p.id === parent.parentId) : null
      }
    }
    return roots
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((root) => ({
        root,
        children: (byParent.get(root.id) ?? []).sort((a, b) => b.riskScore - a.riskScore),
      }))
  }, [filtered, caps, capabilityFilters.domain])

  const modeMeta = MODES.find((m) => m.id === heatmapMode) || MODES[1]
  const collapsed = new Set(capabilityFilters.collapsedDomains)

  function toggleDomain(domain) {
    const next = collapsed.has(domain)
      ? capabilityFilters.collapsedDomains.filter((d) => d !== domain)
      : [...capabilityFilters.collapsedDomains, domain]
    setCapabilityFilters({ collapsedDomains: next })
  }

  function openCapability(id) {
    selectEntity({ id, type: 'capability' })
  }

  function openAppsForCap(capId) {
    setPortfolioFilters({ capabilityId: capId, search: '', timeClass: '', criticality: '', lifecycle: '' })
    setView('applications')
    window.location.hash = 'applications'
  }

  const compareCaps = compareIds.map((id) => caps.find((c) => c.id === id)).filter(Boolean)

  return (
    <section className="view active">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Understand · Capability Intelligence</div>
            <h1 className="page-title">Capability intelligence</h1>
            <p>
              Explore illustrative GRA capability domains, compare maturity and risk, then drill into
              supporting applications, findings and investments.
            </p>
          </div>
        </div>

        <div className="intel-toolbar">
          <label className="field">
            <span>Heatmap mode</span>
            <select
              value={heatmapMode}
              onChange={(e) => setHeatmapMode(e.target.value)}
              aria-label="Heatmap mode"
            >
              {MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Domain</span>
            <select
              value={capabilityFilters.domain}
              onChange={(e) => setCapabilityFilters({ domain: e.target.value })}
              aria-label="Filter by domain"
            >
              <option value="">All domains</option>
              {domains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="field grow">
            <span>Search</span>
            <input
              type="search"
              value={capabilityFilters.search}
              onChange={(e) => setCapabilityFilters({ search: e.target.value })}
              placeholder="Search capabilities"
              aria-label="Search capabilities"
            />
          </label>
        </div>

        <div className="viz-card heatmap-panel">
          <div className="viz-head">
            <div>
              <h3 className="section-title">Where is capability risk and maturity concentrated?</h3>
              <p>
                Mode: {modeMeta.label} ({modeMeta.unit}). Colour plus text labels — colour is not the
                only signal. Click a cell for detail; use Compare to select up to three capabilities.
              </p>
            </div>
            <div className="heatmap-legend" aria-label="Legend">
              <span className="leg tone-good">Strong / low risk</span>
              <span className="leg tone-warn">Moderate</span>
              <span className="leg tone-bad">Weak / high risk</span>
              <span className="leg tone-accent">High investment priority</span>
              {selectedEntity?.type === 'capability' ? (
                <ExplainButton
                  metricKey="maturity"
                  query={`Explain maturity for ${selectedEntity.id}`}
                  contextEntityIds={[selectedEntity.id]}
                  label="Explain selected"
                />
              ) : null}
            </div>
          </div>

          {!tree.length ? (
            <div className="empty-state">No capabilities match the current filters.</div>
          ) : (
            <div className="heatmap-desktop" role="tree">
              {tree.map(({ root, children }) => {
                const isCollapsed = collapsed.has(root.domain) || collapsed.has(root.id)
                const rootVal = heatmapValue(heatmapMode, root, apps)
                return (
                  <div key={root.id} className="heat-domain" role="treeitem" aria-expanded={!isCollapsed}>
                    <div className="heat-domain-head">
                      <button
                        type="button"
                        className="heat-collapse"
                        onClick={() => toggleDomain(root.id)}
                        aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${root.name}`}
                      >
                        {isCollapsed ? '+' : '−'}
                      </button>
                      <button
                        type="button"
                        className={`heat-cell L1 ${cellTone(rootVal, heatmapMode)}`}
                        onClick={() => openCapability(root.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openCapability(root.id)
                          }
                        }}
                        title={`${root.name}: ${modeMeta.label} ${rootVal} (${bandLabel(rootVal, heatmapMode)}). Maturity ${root.maturityCurrent}→${root.maturityTarget}.`}
                      >
                        <strong>{root.name}</strong>
                        <span className="heat-meta">
                          L1 · {bandLabel(rootVal, heatmapMode)} · {rootVal}
                        </span>
                        <span className="heat-gap">
                          Maturity {root.maturityCurrent} → {root.maturityTarget}
                        </span>
                      </button>
                      <label className="compare-check">
                        <input
                          type="checkbox"
                          checked={compareIds.includes(root.id)}
                          onChange={() => toggleCompare(root.id)}
                          aria-label={`Compare ${root.name}`}
                        />
                        Compare
                      </label>
                    </div>
                    {!isCollapsed && (
                      <div className="heat-children" role="group">
                        {children.map((c) => {
                          const v = heatmapValue(heatmapMode, c, apps)
                          return (
                            <div key={c.id} className="heat-row">
                              <button
                                type="button"
                                className={`heat-cell L2 ${cellTone(v, heatmapMode)}`}
                                onClick={() => openCapability(c.id)}
                                title={`${c.name}: ${modeMeta.label} ${v}. Owner ${c.ownerId}. Apps ${repo.applicationsForCapability(c.id).length}.`}
                              >
                                <strong>{c.name}</strong>
                                <span className="heat-meta">
                                  L{c.level} · {bandLabel(v, heatmapMode)} · {v}
                                </span>
                                <span className="heat-gap">
                                  {c.maturityCurrent} → {c.maturityTarget} · Risk {c.riskScore}
                                </span>
                              </button>
                              <label className="compare-check">
                                <input
                                  type="checkbox"
                                  checked={compareIds.includes(c.id)}
                                  onChange={() => toggleCompare(c.id)}
                                  aria-label={`Compare ${c.name}`}
                                />
                              </label>
                            </div>
                          )
                        })}
                        {!children.length && (
                          <p className="heat-empty-children">No Level 2 capabilities in this filter.</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="heatmap-mobile" aria-label="Capability list for small screens">
            {filtered
              .slice()
              .sort((a, b) => b.riskScore - a.riskScore)
              .map((c) => {
                const v = heatmapValue(heatmapMode, c, apps)
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`mobile-cap-card ${cellTone(v, heatmapMode)}`}
                    onClick={() => openCapability(c.id)}
                  >
                    <div>
                      <strong>{c.name}</strong>
                      <span>
                        {c.domain} · L{c.level}
                      </span>
                    </div>
                    <div className="mobile-cap-score">
                      <em>{bandLabel(v, heatmapMode)}</em>
                      <strong>{v}</strong>
                    </div>
                  </button>
                )
              })}
          </div>
        </div>

        {compareCaps.length > 0 && (
          <div className="viz-card compare-panel">
            <div className="viz-head">
              <div>
                <h3 className="section-title">Capability comparison</h3>
                <p>Up to three capabilities — maturity, risk, support and investment signals.</p>
              </div>
              <div className="chip-row">
                <ExplainButton
                  metricKey="maturity"
                  query="Explain maturity gaps for compared capabilities"
                  contextEntityIds={compareCaps.map((c) => c.id)}
                  label="Explain maturity"
                />
                <button type="button" className="btn secondary-button" onClick={clearCompare}>
                  Clear comparison
                </button>
              </div>
            </div>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Metric</th>
                    {compareCaps.map((c) => (
                      <th key={c.id}>
                        <button type="button" className="text-link" onClick={() => openCapability(c.id)}>
                          {c.name}
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Current maturity', (c) => c.maturityCurrent],
                    ['Target maturity', (c) => c.maturityTarget],
                    ['Strategic importance', (c) => c.strategicImportance],
                    ['Risk', (c) => c.riskScore],
                    ['Application support', (c) => capabilityApplicationSupport(c.id, apps)],
                    ['Findings', (c) => repo.findingsForCapability(c.id).length],
                    ['Active investments', (c) => repo.initiativesForCapability(c.id).length],
                  ].map(([label, fn]) => (
                    <tr key={label}>
                      <td>{label}</td>
                      {compareCaps.map((c) => (
                        <td key={c.id}>{fn(c)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="chip-row" style={{ marginTop: '0.75rem' }}>
              {compareCaps.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="btn secondary-button"
                  onClick={() => openAppsForCap(c.id)}
                >
                  Apps for {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
