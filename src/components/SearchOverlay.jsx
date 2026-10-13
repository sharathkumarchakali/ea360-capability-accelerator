import { useEffect, useMemo, useRef, useState } from 'react'
import { usePrototypeStore } from '../state/prototypeStore'

const MODULES = [
  { label: 'Executive Overview', id: 'executive', type: 'Module' },
  { label: 'Applications', id: 'applications', type: 'Module' },
  { label: 'Integrations & APIs', id: 'integrations', type: 'Module' },
  { label: 'Data & Information', id: 'data-information', type: 'Module' },
  {
    label: 'Technology & Infrastructure',
    id: 'technology-infrastructure',
    type: 'Module',
  },
  { label: 'AI & Automation', id: 'ai-automation', type: 'Module' },
  { label: 'Architecture Health', id: 'assessment', type: 'Module' },
  { label: 'Findings & Risks', id: 'findings', type: 'Module' },
  { label: 'Evidence', id: 'evidence', type: 'Module' },
  { label: 'Recommendations', id: 'recommendations', type: 'Module' },
  { label: 'Roadmap', id: 'roadmap', type: 'Module' },
  { label: 'Initiatives', id: 'initiatives', type: 'Module' },
  { label: 'KPIs', id: 'kpis', type: 'Module' },
  { label: 'Standards & Principles', id: 'standards', type: 'Module' },
  { label: 'Decision Register', id: 'decisions', type: 'Module' },
  { label: 'Review Board', id: 'reviews', type: 'Module' },
  { label: 'AI & Data Governance', id: 'ai-data-governance', type: 'Module' },
]

export default function SearchOverlay({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)

  const searchable = useMemo(() => {
    const items = [...MODULES]
    repo.listFindings().forEach((f) => items.push({ label: f.name, id: f.id, type: 'Finding', entityType: 'finding' }))
    repo.listEvidence().forEach((e) =>
      items.push({ label: e.name, id: e.id, type: 'Evidence', entityType: 'evidence' }),
    )
    repo.listCapabilities().forEach((c) =>
      items.push({ label: c.name, id: c.id, type: 'Capability', entityType: 'capability' }),
    )
    repo.listApplications().forEach((a) =>
      items.push({ label: a.name, id: a.id, type: 'Application', entityType: 'application' }),
    )
    repo.listIntegrations().forEach((i) =>
      items.push({ label: i.name, id: i.id, type: 'Integration', entityType: 'integration' }),
    )
    repo.listDataObjects().forEach((d) =>
      items.push({ label: d.name, id: d.id, type: 'Data Domain', entityType: 'dataObject' }),
    )
    repo.listTechnologies().forEach((t) =>
      items.push({ label: t.name, id: t.id, type: 'Technology', entityType: 'technology' }),
    )
    repo.listAiSolutions().forEach((s) =>
      items.push({ label: s.name, id: s.id, type: 'AI Solution', entityType: 'aiSolution' }),
    )
    repo.listRecommendations().forEach((r) =>
      items.push({ label: r.name, id: r.id, type: 'Recommendation', entityType: 'recommendation' }),
    )
    repo.listInitiatives().forEach((i) =>
      items.push({ label: i.name, id: i.id, type: 'Initiative', entityType: 'initiative' }),
    )
    return items
  }, [repo])

  const results = useMemo(() => {
    const s = query.trim().toLowerCase()
    return searchable
      .filter((x) => !s || x.label.toLowerCase().includes(s))
      .slice(0, 12)
  }, [query, searchable])

  useEffect(() => {
    if (open) {
      setQuery('')
      const t = setTimeout(() => inputRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="search-overlay show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="searchbox">
        <input
          ref={inputRef}
          placeholder="Search AI use cases, agents, models, capabilities, applications, findings…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="search-results">
          {results.map((r) => (
            <div
              className="sres"
              key={`${r.type}-${r.id}`}
              onClick={() => {
                onClose()
                if (r.entityType) {
                  selectEntity({ id: r.id, type: r.entityType })
                  if (r.entityType === 'finding') onNavigate('findings', { keepSelection: true })
                  if (r.entityType === 'capability') onNavigate('capabilities', { keepSelection: true })
                  if (r.entityType === 'application') onNavigate('applications', { keepSelection: true })
                  if (r.entityType === 'integration') onNavigate('integrations', { keepSelection: true })
                  if (r.entityType === 'dataObject') onNavigate('data-information', { keepSelection: true })
                  if (r.entityType === 'technology') {
                    onNavigate('technology-infrastructure', { keepSelection: true })
                  }
                  if (r.entityType === 'aiSolution') {
                    onNavigate('ai-automation', { keepSelection: true })
                  }
                  if (r.entityType === 'recommendation') onNavigate('recommendations', { keepSelection: true })
                  if (r.entityType === 'initiative') onNavigate('roadmap', { keepSelection: true })
                } else {
                  onNavigate(r.id)
                }
              }}
            >
              <strong>{r.label}</strong>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{r.type}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
