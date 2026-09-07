import { useMemo, useState } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import EvidencePanel, { deriveTrustStatus } from './EvidencePanel'

export default function EvidenceView() {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const [search, setSearch] = useState('')
  const [trustFilter, setTrustFilter] = useState('')

  const evidence = repo.listEvidence()
  const enriched = useMemo(
    () =>
      evidence.map((e) => ({
        e,
        trust: deriveTrustStatus(e),
      })),
    [evidence],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enriched.filter(({ e, trust }) => {
      if (trustFilter && trust !== trustFilter) return false
      if (!q) return true
      return `${e.name} ${e.description} ${e.evidenceType}`.toLowerCase().includes(q)
    })
  }, [enriched, search, trustFilter])

  const counts = useMemo(() => {
    const c = { verified: 0, unverified: 0, stale: 0, disputed: 0, missing: 0 }
    enriched.forEach(({ trust }) => {
      c[trust] = (c[trust] || 0) + 1
    })
    return c
  }, [enriched])

  return (
    <section className="view active">
      <div className="module">
        <div className="module-header" data-demo-target="evidence-panel">
          <div>
            <div className="kicker">Diagnose · Evidence</div>
            <h1 className="page-title">Evidence register</h1>
            <p>
              Synthetic evidence items linked to findings and enterprise objects. Verify, dispute
              or annotate without file upload.
            </p>
          </div>
        </div>

        <div className="int-kpi-grid wf-kpi-grid">
          {Object.entries(counts).map(([key, value]) => (
            <button
              key={key}
              type="button"
              className={`int-kpi-card${trustFilter === key ? ' active-kpi' : ''}`}
              onClick={() => setTrustFilter((prev) => (prev === key ? '' : key))}
            >
              <span>{key}</span>
              <strong>{value}</strong>
            </button>
          ))}
        </div>

        <div className="intel-toolbar">
          <label className="field grow">
            <span>Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Evidence title, type…"
            />
          </label>
          <label className="field">
            <span>Trust</span>
            <select value={trustFilter} onChange={(e) => setTrustFilter(e.target.value)}>
              <option value="">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
              <option value="stale">Stale</option>
              <option value="disputed">Disputed</option>
            </select>
          </label>
        </div>

        <EvidencePanel
          evidenceList={filtered.map(({ e }) => e)}
          onOpenEvidence={(id) => selectEntity({ id, type: 'evidence' })}
        />
      </div>
    </section>
  )
}
