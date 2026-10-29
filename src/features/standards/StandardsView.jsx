import { useMemo, useState } from 'react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { getCatalog } from '../ai-data-governance/governanceModel'
import { daysFromAsOf, formatDemoAsOfLabel } from '../../domain/demo/demoClock'

const TYPES = ['Policy', 'Standard', 'Control']

function statusTone(status) {
  if (status === 'Active') return 'good'
  if (status === 'Under Review' || status === 'Draft') return 'warn'
  return 'muted'
}

function expiryTone(expiry, status) {
  if (status !== 'Active') return 'muted'
  const days = daysFromAsOf(expiry)
  if (days === null) return 'muted'
  if (days < 0) return 'bad'
  if (days <= 45) return 'warn'
  return 'good'
}

export default function StandardsView() {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const catalog = useMemo(() => getCatalog(tenantCode), [tenantCode])
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const policies = catalog.policies ?? []
  const exceptions = catalog.exceptions ?? []
  const visible = policies.filter((p) => {
    if (type && p.type !== type) return false
    if (status && p.status !== status) return false
    const q = search.trim().toLowerCase()
    if (q && !`${p.id} ${p.name} ${p.scope}`.toLowerCase().includes(q)) return false
    return true
  })
  const selected = policies.find((p) => p.id === selectedId) || null
  const selectedExceptions = selected ? exceptions.filter((e) => e.policyId === selected.id || selected.exceptionIds?.includes(e.id)) : []

  return (
    <section className="view active wv-view" data-demo-target="standards-register">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Governance · Standards &amp; Principles</div>
            <h1 className="page-title">Standards &amp; Principles</h1>
            <p>
              The policies, standards and controls recorded for this workspace, with the exceptions granted against
              them. A recorded standard is evidence of intent, not of compliance.
            </p>
            <p className="sub">{formatDemoAsOfLabel()}</p>
          </div>
          <div className="synthetic-pill">ILLUSTRATIVE DATA</div>
        </div>

        <div className="app-metric-strip" role="group" aria-label="Standards metrics">
          <div className="app-metric">
            <span>Policies, standards, controls</span>
            <strong>{policies.length}</strong>
          </div>
          <div className="app-metric">
            <span>Active</span>
            <strong>{policies.filter((p) => p.status === 'Active').length}</strong>
          </div>
          <div className="app-metric">
            <span>Draft or under review</span>
            <strong>{policies.filter((p) => p.status === 'Draft' || p.status === 'Under Review').length}</strong>
          </div>
          <div className="app-metric">
            <span>Active exceptions</span>
            <strong>{exceptions.filter((e) => e.status === 'Active').length}</strong>
          </div>
        </div>

        <div className="wv-filters" role="group" aria-label="Standards filters">
          <label className="field">
            <span>Search</span>
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, id or scope" />
          </label>
          <label className="field">
            <span>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">All types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {['Active', 'Draft', 'Under Review', 'Retired'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="wv-split">
          <div className="table-wrap">
            <table className="data-table">
              <caption className="wv-caption">
                {visible.length} of {policies.length} records. Select a row for requirements and exceptions.
              </caption>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Review date</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6}>No records match these filters.</td>
                  </tr>
                )}
                {visible.map((p) => (
                  <tr
                    key={p.id}
                    className={`clickable-row${p.id === selectedId ? ' is-selected' : ''}`}
                    tabIndex={0}
                    aria-selected={p.id === selectedId}
                    onClick={() => setSelectedId(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelectedId(p.id)
                      }
                    }}
                  >
                    <td>{p.id}</td>
                    <td>{p.name}</td>
                    <td>{p.type}</td>
                    <td>
                      <span className={`status-tag tone-${statusTone(p.status)}`}>{p.status}</span>
                    </td>
                    <td>{p.owner}</td>
                    <td>
                      <span className={`status-tag tone-${expiryTone(p.reviewDate, p.status)}`}>{p.reviewDate || '—'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="wv-panel" aria-label="Selected standard" aria-live="polite">
            {!selected && <p className="sub">Select a record to see its scope, requirements and exceptions.</p>}
            {selected && (
              <>
                <h2>{selected.name}</h2>
                <p className="sub">
                  {selected.id} · {selected.type} · {selected.status}
                </p>
                <p>{selected.summary}</p>
                <p>
                  <strong>Scope:</strong> {selected.scope}
                </p>
                <p>
                  <strong>Applies to:</strong> {selected.applicableAssetIds?.length ?? 0} recorded assets
                </p>
                <h3>Requirements</h3>
                <ul>
                  {(selected.requirements ?? []).map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                <h3>Exceptions</h3>
                {selectedExceptions.length === 0 && <p className="sub">No exceptions recorded.</p>}
                {selectedExceptions.map((e) => (
                  <div className="wv-exception" key={e.id}>
                    <strong>{e.title}</strong>
                    <span className={`status-tag tone-${e.status === 'Active' ? 'warn' : 'muted'}`}>{e.status}</span>
                    <p>{e.rationale}</p>
                    <p className="sub">
                      Expires {e.expiry} · Approver {e.approver}
                    </p>
                    {e.conditions?.length > 0 && (
                      <ul>
                        {e.conditions.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </>
            )}
          </aside>
        </div>
        <p className="sub synthetic-disclosure">
          Illustrative synthetic governance catalogue. Recorded readiness, not a regulatory approval.
        </p>
      </div>
    </section>
  )
}
