import { useEffect, useMemo, useRef, useState } from 'react'
import { navGroups, searchableExtra } from '../data'

export default function SearchOverlay({ open, onClose, onNavigate }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  const searchable = useMemo(() => {
    const items = []
    navGroups.flatMap((g) => g[1]).forEach(([label, id]) => {
      items.push({ label, id, type: 'Module' })
    })
    searchableExtra.forEach(([label, id, type]) => {
      items.push({ label, id, type })
    })
    return items
  }, [])

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
          placeholder="Search EA360 modules, findings, standards, actions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="search-results">
          {results.map((r) => (
            <div
              className="sres"
              key={`${r.type}-${r.label}`}
              onClick={() => {
                onClose()
                onNavigate(r.id)
              }}
            >
              <strong>{r.label}</strong>
              <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 2 }}>
                {r.type}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
