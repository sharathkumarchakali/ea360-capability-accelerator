import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Download, FileUp, ShieldCheck } from 'lucide-react'
import { usePrototypeStore } from '../../state/prototypeStore'
import { formatDemoAsOfLabel, getDemoAsOfDate } from '../../domain/demo/demoClock'
import { INGESTION_AUDIT_KEY } from '../demo/journeyDefinitions'
import {
  APPLICATION_CSV_HEADER,
  IMPORT_FIELDS,
  autoMapColumns,
  buildApplicationSamples,
  canCommitImport,
  parseCsv,
  toStagedValidation,
  validateApplicationImport,
} from '../../data/templates/applicationImport'

const FIELD_LABELS = {
  id: 'Application id',
  name: 'Application name',
  capabilityId: 'Capability id',
  criticality: 'Criticality',
}

function readAudit(tenantCode) {
  try {
    const raw = window.localStorage.getItem(INGESTION_AUDIT_KEY(tenantCode))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function downloadText(fileName, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export default function DataIngestionCenter() {
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  // Remount on workspace switch so staged text, mapping and results never leak across workspaces.
  return <IngestionPanel key={tenantCode} tenantCode={tenantCode} />
}

function IngestionPanel({ tenantCode }) {
  const pack = usePrototypeStore((s) => s.workingPack)
  const dataRevision = usePrototypeStore((s) => s.dataRevision)
  const showToast = usePrototypeStore((s) => s.showToast)
  const setImportValidation = usePrototypeStore((s) => s.setImportValidation)
  const commitApplicationImport = usePrototypeStore((s) => s.commitApplicationImport)

  const samples = useMemo(() => buildApplicationSamples(pack), [pack])
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [override, setOverride] = useState(null)
  const [staged, setStaged] = useState(null)
  const [committed, setCommitted] = useState(null)
  const [auditLocal, setAuditLocal] = useState(() => readAudit(tenantCode))
  const fileRef = useRef(null)

  const parsed = useMemo(() => parseCsv(text), [text])
  const headerKey = parsed.header.join('|')
  const autoMap = useMemo(() => autoMapColumns(parsed.header), [parsed.header])
  const columnMap = override && override.headerKey === headerKey ? override.map : autoMap
  const mapKey = IMPORT_FIELDS.map((f) => columnMap[f]).join(',')

  // A result is only trustworthy for the exact text, mapping and workspace revision it was computed from.
  const currentKey = `${text}\u0000${mapKey}\u0000${dataRevision}`
  const stale = Boolean(staged) && staged.key !== currentKey
  const result = staged?.result ?? null
  const canCommit = Boolean(result) && !stale && canCommitImport(result)

  useEffect(() => {
    if (stale) setImportValidation(null)
  }, [stale, setImportValidation])

  function stage(nextText, nextFile) {
    setText(nextText)
    setFileName(nextFile)
    setOverride(null)
    setStaged(null)
    setCommitted(null)
    setImportValidation(null)
  }

  function onFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => stage(String(reader.result ?? ''), file.name)
    reader.onerror = () => showToast('The file could not be read.')
    reader.readAsText(file)
    e.target.value = ''
  }

  function onMap(field, value) {
    setOverride({ headerKey, map: { ...columnMap, [field]: Number(value) } })
  }

  function runValidation() {
    const res = validateApplicationImport(parsed, columnMap, pack)
    const draftId = `import-${tenantCode.toLowerCase()}-${Date.now().toString(36)}`
    setStaged({ key: currentKey, result: res, draftId })
    setCommitted(null)
    setImportValidation(toStagedValidation(res, { draftId, tenantCode, fileName: fileName || undefined }))
  }

  function commit() {
    if (!canCommit) return
    const outcome = commitApplicationImport(result, { draftId: staged.draftId, fileName: fileName || undefined })
    if (!outcome.ok) {
      showToast(`Nothing was imported: ${outcome.error}`)
      return
    }
    const entry = {
      at: new Date().toISOString(),
      tenantCode,
      asOf: getDemoAsOfDate(),
      source: 'csv-applications',
      fileName: fileName || null,
      rows: result.totalRows,
      created: result.created,
      updated: result.updated,
      unchanged: result.unchanged,
      warnings: result.warnings.length,
      synthetic: true,
    }
    try {
      const next = [...readAudit(tenantCode), entry]
      window.localStorage.setItem(INGESTION_AUDIT_KEY(tenantCode), JSON.stringify(next))
      setAuditLocal(next)
    } catch {
      /* the pack audit entry already records the commit */
    }
    setCommitted({ created: result.created, updated: result.updated, unchanged: result.unchanged })
    setStaged(null)
    showToast(`Import committed: ${result.created} new, ${result.updated} updated.`)
  }

  const packAudit = useMemo(
    () =>
      (pack?.auditHistory ?? [])
        .filter((a) => a.action === 'import_committed')
        .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
        .slice(0, 8),
    [pack],
  )
  const auditCount = Math.max(packAudit.length, auditLocal.length)

  return (
    <section className="view active wv-view" data-demo-target="data-ingestion-center">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">Workspace · Data Ingestion</div>
            <h1 className="page-title">Data Ingestion Center</h1>
            <p>
              Stage an applications CSV, map its columns, validate every row against this workspace, then commit
              explicitly. A file with blocking errors cannot be committed, and a commit is all-or-nothing.
            </p>
            <p className="sub">{formatDemoAsOfLabel()}</p>
          </div>
          <div className="synthetic-pill">ILLUSTRATIVE DATA</div>
        </div>

        <div className="wv-panel">
          <h2>1. Stage a file</h2>
          <p className="sub">
            Expected columns: {APPLICATION_CSV_HEADER}. Samples use this workspace’s own capability ids.
          </p>
          <div className="wv-actions">
            <button type="button" className="btn secondary-button" onClick={() => stage(samples.clean, 'applications-clean.csv')}>
              Load clean sample
            </button>
            <button type="button" className="btn secondary-button" onClick={() => stage(samples.error, 'applications-errors.csv')}>
              Load sample with errors
            </button>
            <button type="button" className="btn secondary-button" onClick={() => fileRef.current?.click()}>
              <FileUp size={18} aria-hidden="true" />
              Upload CSV
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="wv-hidden-input"
              onChange={onFile}
              aria-label="Upload CSV file"
              tabIndex={-1}
            />
          </div>
          <div className="wv-actions">
            <button type="button" className="btn secondary-button" onClick={() => downloadText('applications-clean.csv', samples.clean)}>
              <Download size={18} aria-hidden="true" />
              Download clean sample
            </button>
            <button type="button" className="btn secondary-button" onClick={() => downloadText('applications-errors.csv', samples.error)}>
              <Download size={18} aria-hidden="true" />
              Download error sample
            </button>
          </div>
          <label className="field">
            <span>CSV content{fileName ? ` · ${fileName}` : ''}</span>
            <textarea
              rows={7}
              value={text}
              spellCheck={false}
              placeholder={APPLICATION_CSV_HEADER}
              onChange={(e) => {
                setText(e.target.value)
                setCommitted(null)
              }}
            />
          </label>
        </div>

        {parsed.header.length > 0 && (
          <div className="wv-panel">
            <h2>2. Map columns</h2>
            <p className="sub">
              {parsed.rows.length} data row{parsed.rows.length === 1 ? '' : 's'} found. Choose which file column feeds each field.
            </p>
            <div className="wv-map-grid">
              {IMPORT_FIELDS.map((field) => (
                <label className="field" key={field}>
                  <span>{FIELD_LABELS[field]}</span>
                  <select value={columnMap[field]} onChange={(e) => onMap(field, e.target.value)}>
                    <option value={-1}>Not mapped</option>
                    {parsed.header.map((h, i) => (
                      <option key={`${h}-${i}`} value={i}>
                        {h || `Column ${i + 1}`}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
            <div className="wv-actions">
              <button type="button" className="btn primary primary-button" disabled={!text.trim()} onClick={runValidation}>
                <ShieldCheck size={18} aria-hidden="true" />
                Validate
              </button>
            </div>
          </div>
        )}

        {result && (
          <div className="wv-panel" aria-live="polite">
            <h2>3. Validation result</h2>
            {stale && <p className="wv-error">The text, mapping or workspace changed after validation. Validate again before committing.</p>}
            <div className="app-metric-strip" role="group" aria-label="Validation counts">
              <div className="app-metric">
                <span>Rows</span>
                <strong>{result.totalRows}</strong>
              </div>
              <div className="app-metric">
                <span>Valid</span>
                <strong>{result.rows.length}</strong>
              </div>
              <div className="app-metric">
                <span>Blocking errors</span>
                <strong>{result.errors.length}</strong>
              </div>
              <div className="app-metric">
                <span>Warnings</span>
                <strong>{result.warnings.length}</strong>
              </div>
              <div className="app-metric">
                <span>New / updated / unchanged</span>
                <strong>
                  {result.created} / {result.updated} / {result.unchanged}
                </strong>
              </div>
            </div>

            {result.issues.length > 0 && (
              <div className="table-wrap">
                <table>
                  <caption className="wv-caption">Row issues</caption>
                  <thead>
                    <tr>
                      <th scope="col">Line</th>
                      <th scope="col">Field</th>
                      <th scope="col">Severity</th>
                      <th scope="col">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.issues.map((i, n) => (
                      <tr key={`${i.line}-${i.field}-${n}`}>
                        <td>{i.line}</td>
                        <td>{i.field ?? 'row'}</td>
                        <td>
                          <span className={`status-tag ${i.severity === 'error' ? 'tone-bad' : 'tone-warn'}`}>
                            {i.severity === 'error' ? 'Blocking' : 'Warning'}
                          </span>
                        </td>
                        <td>{i.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.rows.length > 0 && (
              <div className="table-wrap">
                <table>
                  <caption className="wv-caption">Valid rows (first 10)</caption>
                  <thead>
                    <tr>
                      <th scope="col">Line</th>
                      <th scope="col">Id</th>
                      <th scope="col">Name</th>
                      <th scope="col">Capability</th>
                      <th scope="col">Criticality</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.slice(0, 10).map((r) => (
                      <tr key={`${r.line}-${r.id}`}>
                        <td>{r.line}</td>
                        <td>{r.id}</td>
                        <td>{r.name}</td>
                        <td>{r.capabilityId}</td>
                        <td>{r.criticality}</td>
                        <td>{r.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="wv-actions">
              <button type="button" className="btn primary primary-button" disabled={!canCommit} onClick={commit}>
                Commit import
              </button>
              {!canCommit && (
                <span className="sub">
                  {result.errors.length > 0
                    ? 'Correct the blocking errors to enable commit.'
                    : stale
                      ? 'Validate again to enable commit.'
                      : 'There are no valid rows to commit.'}
                </span>
              )}
            </div>
            <p className="sub">
              The staged result is also available to Ask EA360 (“What is blocking this data import?”). Nothing changes in the
              workspace until you commit.
            </p>
          </div>
        )}

        {committed && (
          <div className="wv-panel" role="status">
            <h2>
              <CheckCircle2 size={20} aria-hidden="true" /> Import committed
            </h2>
            <p>
              {committed.created} application{committed.created === 1 ? '' : 's'} created, {committed.updated} updated,{' '}
              {committed.unchanged} unchanged. The change is recorded in this workspace’s audit history.
            </p>
          </div>
        )}

        <div className="wv-panel">
          <h2>Import audit</h2>
          {auditCount === 0 ? (
            <p className="sub">No imports committed for this workspace yet.</p>
          ) : (
            <ul className="wv-issues">
              {(packAudit.length > 0 ? packAudit : auditLocal.slice().reverse()).map((a, n) => (
                <li key={a.id ?? `${a.at}-${n}`}>
                  {String(a.timestamp ?? a.at).slice(0, 19).replace('T', ' ')} · {a.comment ?? `${a.rows} rows, ${a.created} new, ${a.updated} updated`}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="sub synthetic-disclosure">Illustrative synthetic samples only.</p>
      </div>
    </section>
  )
}
