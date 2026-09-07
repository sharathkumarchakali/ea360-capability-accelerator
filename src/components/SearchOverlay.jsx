import { useEffect, useMemo, useRef, useState } from 'react'
import { usePrototypeStore } from '../state/prototypeStore'

const MODULES = [
  { label: 'Executive Cockpit', id: 'executive', type: 'Module' },
  { label: 'Capabilities', id: 'capabilities', type: 'Module' },
  { label: 'Applications', id: 'applications', type: 'Module' },
  { label: 'Integration Landscape', id: 'integrations', type: 'Module' },
  { label: 'Relationship Explorer', id: 'explorer', type: 'Module' },
  { label: 'Findings & Risks', id: 'findings', type: 'Module' },
  { label: 'Evidence', id: 'evidence', type: 'Module' },
  { label: 'Recommendations', id: 'recommendations', type: 'Module' },
  { label: 'Governance & Decisions', id: 'governance', type: 'Module' },
  { label: 'Roadmap', id: 'roadmap', type: 'Module' },
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
          placeholder="Search capabilities, applications, integrations, findings…"
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
