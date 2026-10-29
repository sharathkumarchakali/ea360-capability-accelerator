/**
 * Application CSV import (Data Ingestion Center, journey J8).
 *
 * Pure functions: parse -> map columns -> validate -> merge. Nothing here touches the store, so
 * validation can be staged freely and a commit can be proven atomic (a file with blocking errors
 * never produces a changed pack). All sample data is synthetic / illustrative.
 */
import type { TenantPack } from '../../domain/schemas'

export const IMPORT_FIELDS = ['id', 'name', 'capabilityId', 'criticality'] as const
export type ImportField = (typeof IMPORT_FIELDS)[number]

export const APPLICATION_CSV_HEADER = IMPORT_FIELDS.join(',')
export const CRITICALITY_VALUES = ['critical', 'high', 'medium', 'low'] as const
export const MAX_IMPORT_ROWS = 2000

export const IMPORT_SOURCE = 'csv-applications'
export const IMPORT_PROVENANCE = 'synthetic-import-sample'

/* ------------------------------------------------------------------ */
/* Parsing                                                             */
/* ------------------------------------------------------------------ */

export type ParsedCsv = {
  header: string[]
  rows: Array<{ line: number; cells: string[] }>
  parseErrors: Array<{ line: number; message: string }>
}

/** Minimal RFC-4180 style parser: quoted fields, escaped quotes, CRLF/LF, optional BOM. */
export function parseCsv(input: string): ParsedCsv {
  const text = input.replace(/^\uFEFF/, '')
  const records: Array<{ line: number; cells: string[] }> = []
  const parseErrors: ParsedCsv['parseErrors'] = []
  let cells: string[] = []
  let cell = ''
  let inQuotes = false
  let line = 1
  let startLine = 1
  let sawContent = false

  const endCell = () => {
    cells.push(cell.trim())
    cell = ''
  }
  const endRecord = () => {
    endCell()
    if (sawContent || cells.some((c) => c !== '')) records.push({ line: startLine, cells })
    cells = []
    sawContent = false
  }

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        if (ch === '\n') line++
        cell += ch
      }
      continue
    }
    if (ch === '"' && cell === '') {
      inQuotes = true
      sawContent = true
    } else if (ch === ',') {
      sawContent = true
      endCell()
    } else if (ch === '\r') {
      /* handled with \n */
    } else if (ch === '\n') {
      endRecord()
      line++
      startLine = line
    } else {
      sawContent = true
      cell += ch
    }
  }
  if (inQuotes) parseErrors.push({ line: startLine, message: 'A quoted value is not closed.' })
  if (cell !== '' || cells.length > 0 || sawContent) endRecord()

  const [head, ...rest] = records
  return { header: head?.cells ?? [], rows: rest, parseErrors }
}

/* ------------------------------------------------------------------ */
/* Column mapping                                                      */
/* ------------------------------------------------------------------ */

export type ColumnMap = Record<ImportField, number>

const SYNONYMS: Record<ImportField, string[]> = {
  id: ['id', 'applicationid', 'appid', 'application_id'],
  name: ['name', 'applicationname', 'appname', 'application'],
  capabilityId: ['capabilityid', 'capability', 'capabilityref', 'capability_id'],
  criticality: ['criticality', 'businesscriticality', 'tier', 'priority'],
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9_]/g, '')

/** Best-effort mapping from CSV header names to import fields (-1 = no column found). */
export function autoMapColumns(header: string[]): ColumnMap {
  const map = {} as ColumnMap
  const used = new Set<number>()
  for (const field of IMPORT_FIELDS) {
    const idx = header.findIndex((h, i) => !used.has(i) && SYNONYMS[field].includes(norm(h)))
    map[field] = idx
    if (idx >= 0) used.add(idx)
  }
  return map
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export type ImportIssue = {
  /** 1-based file line (header is line 1). */
  line: number
  field?: ImportField | 'file'
  message: string
  severity: 'error' | 'warning'
}

export type ImportRow = {
  line: number
  id: string
  name: string
  capabilityId: string
  criticality: (typeof CRITICALITY_VALUES)[number]
  action: 'create' | 'update' | 'unchanged'
}

export type ImportValidationResult = {
  issues: ImportIssue[]
  errors: ImportIssue[]
  warnings: ImportIssue[]
  /** Rows that passed every blocking check. */
  rows: ImportRow[]
  totalRows: number
  created: number
  updated: number
  unchanged: number
}

const emptyResult = (issues: ImportIssue[], totalRows: number): ImportValidationResult => ({
  issues,
  errors: issues.filter((i) => i.severity === 'error'),
  warnings: issues.filter((i) => i.severity === 'warning'),
  rows: [],
  totalRows,
  created: 0,
  updated: 0,
  unchanged: 0,
})

/** Row-level validation against the target workspace. Never mutates the pack. */
export function validateApplicationImport(
  parsed: ParsedCsv,
  columnMap: ColumnMap,
  pack: Pick<TenantPack, 'capabilities' | 'applications'> | null | undefined,
): ImportValidationResult {
  const issues: ImportIssue[] = []
  for (const pe of parsed.parseErrors) issues.push({ line: pe.line, field: 'file', message: pe.message, severity: 'error' })

  if (parsed.header.length === 0) {
    issues.push({ line: 1, field: 'file', message: 'The file is empty.', severity: 'error' })
    return emptyResult(issues, 0)
  }
  if (parsed.rows.length === 0) {
    issues.push({ line: 1, field: 'file', message: 'The file has a header but no data rows.', severity: 'error' })
    return emptyResult(issues, 0)
  }
  if (parsed.rows.length > MAX_IMPORT_ROWS) {
    issues.push({
      line: 1,
      field: 'file',
      message: `The file has ${parsed.rows.length} rows; the prototype limit is ${MAX_IMPORT_ROWS}.`,
      severity: 'error',
    })
    return emptyResult(issues, parsed.rows.length)
  }
  const unmapped = IMPORT_FIELDS.filter((f) => columnMap[f] == null || columnMap[f] < 0 || columnMap[f] >= parsed.header.length)
  if (unmapped.length) {
    for (const f of unmapped) {
      issues.push({ line: 1, field: f, message: `No CSV column is mapped to “${f}”.`, severity: 'error' })
    }
    return emptyResult(issues, parsed.rows.length)
  }
  const mapped = IMPORT_FIELDS.map((f) => columnMap[f])
  if (new Set(mapped).size !== mapped.length) {
    issues.push({ line: 1, field: 'file', message: 'Each field must be mapped to a different column.', severity: 'error' })
    return emptyResult(issues, parsed.rows.length)
  }

  const capIds = new Set((pack?.capabilities ?? []).map((c) => c.id))
  const appsById = new Map((pack?.applications ?? []).map((a) => [a.id, a]))
  // Ids used by any non-application record must not be re-used for an application.
  const otherIds = new Set<string>()
  for (const [key, list] of Object.entries((pack ?? {}) as Record<string, unknown>)) {
    if (key === 'applications' || !Array.isArray(list)) continue
    for (const item of list as Array<{ id?: unknown }>) {
      if (item && typeof item.id === 'string') otherIds.add(item.id)
    }
  }
  const seen = new Map<string, number>()
  const rows: ImportRow[] = []
  let created = 0
  let updated = 0
  let unchanged = 0

  for (const { line, cells } of parsed.rows) {
    const before = issues.filter((i) => i.severity === 'error').length
    if (cells.length !== parsed.header.length) {
      issues.push({
        line,
        field: 'file',
        message: `Expected ${parsed.header.length} columns but found ${cells.length}.`,
        severity: 'error',
      })
      continue
    }
    const value = (f: ImportField) => (cells[columnMap[f]] ?? '').trim()
    const id = value('id')
    const name = value('name')
    const capabilityId = value('capabilityId')
    const rawCriticality = value('criticality').toLowerCase()

    if (!id) issues.push({ line, field: 'id', message: 'Missing id.', severity: 'error' })
    else if (seen.has(id)) {
      issues.push({ line, field: 'id', message: `Duplicate id “${id}” (first used on line ${seen.get(id)}).`, severity: 'error' })
    } else {
      seen.set(id, line)
      if (otherIds.has(id)) {
        issues.push({ line, field: 'id', message: `Id “${id}” is already used by a non-application record.`, severity: 'error' })
      }
    }
    if (!name) issues.push({ line, field: 'name', message: 'Missing name.', severity: 'error' })
    if (!capabilityId) issues.push({ line, field: 'capabilityId', message: 'Missing capability reference.', severity: 'error' })
    else if (!capIds.has(capabilityId)) {
      issues.push({ line, field: 'capabilityId', message: `Unknown capability reference “${capabilityId}”.`, severity: 'error' })
    }
    const knownCriticality = (CRITICALITY_VALUES as readonly string[]).includes(rawCriticality)
    if (!knownCriticality) {
      issues.push({
        line,
        field: 'criticality',
        message: `Criticality “${value('criticality')}” is not recognised; it would be imported as medium.`,
        severity: 'warning',
      })
    }

    if (issues.filter((i) => i.severity === 'error').length !== before) continue

    const criticality = (knownCriticality ? rawCriticality : 'medium') as ImportRow['criticality']
    const current = appsById.get(id)
    let action: ImportRow['action'] = 'create'
    if (current) {
      const same =
        current.name === name &&
        current.criticality === criticality &&
        (current.supportedCapabilityIds ?? []).includes(capabilityId)
      action = same ? 'unchanged' : 'update'
    }
    if (action === 'create') created += 1
    else if (action === 'update') updated += 1
    else unchanged += 1
    rows.push({ line, id, name, capabilityId, criticality, action })
  }

  return {
    issues,
    errors: issues.filter((i) => i.severity === 'error'),
    warnings: issues.filter((i) => i.severity === 'warning'),
    rows,
    totalRows: parsed.rows.length,
    created,
    updated,
    unchanged,
  }
}

/** True only when a commit is permitted: no blocking issues and at least one valid row. */
export function canCommitImport(result: ImportValidationResult | null | undefined): boolean {
  return Boolean(result && result.errors.length === 0 && result.rows.length > 0)
}

/* ------------------------------------------------------------------ */
/* Merge                                                               */
/* ------------------------------------------------------------------ */

/**
 * Merge validated rows into `pack` in place. Callers pass a clone (the store's `updatePack` does).
 * Throws before touching the pack when the result has blocking errors, so a bad file can never
 * produce a partial import.
 */
export function mergeApplicationImport(
  pack: TenantPack,
  result: ImportValidationResult,
  today = new Date().toISOString().slice(0, 10),
): { created: string[]; updated: string[] } {
  if (!canCommitImport(result)) {
    throw new Error('Import has blocking errors or no valid rows; nothing was imported.')
  }
  const created: string[] = []
  const updated: string[] = []
  const draftApps: TenantPack['applications'] = []
  const draftRels: TenantPack['relationships'] = []

  for (const row of result.rows) {
    if (row.action === 'unchanged') continue
    const cap = pack.capabilities.find((c) => c.id === row.capabilityId)
    if (!cap) throw new Error(`Capability ${row.capabilityId} is no longer in this workspace; nothing was imported.`)
    const existing = pack.applications.find((a) => a.id === row.id)
    if (existing) {
      const next = structuredClone(existing)
      next.name = row.name
      next.criticality = row.criticality
      next.supportedCapabilityIds = [...new Set([...(next.supportedCapabilityIds ?? []), row.capabilityId])]
      next.updatedAt = today
      draftApps.push(next)
      updated.push(row.id)
    } else {
      draftApps.push({
        id: row.id,
        tenantId: pack.tenant.id,
        name: row.name,
        description: 'Imported from CSV (synthetic sample data).',
        status: 'active',
        ownerId: cap.ownerId,
        createdAt: today,
        updatedAt: today,
        dataQuality: 'low',
        sourceRefs: [IMPORT_SOURCE],
        tags: ['imported', 'synthetic'],
        lifecycle: 'tolerate',
        businessValue: 3,
        technicalHealth: 3,
        criticality: row.criticality,
        businessOwnerId: cap.ownerId,
        technologyOwnerId: cap.ownerId,
        annualCostBand: 'medium',
        userReach: 3,
        dataSensitivity: 'internal',
        deploymentModel: 'cloud',
        vendorProduct: 'Unspecified (imported)',
        strategicAlignment: 3,
        supportedCapabilityIds: [row.capabilityId],
      } as TenantPack['applications'][number])
      draftRels.push({
        id: `rel-import-${row.capabilityId}-${row.id}`,
        tenantId: pack.tenant.id,
        sourceId: row.capabilityId,
        sourceType: 'capability',
        targetId: row.id,
        targetType: 'application',
        relationshipType: 'uses',
        description: 'Imported from CSV (synthetic sample data).',
        evidenceIds: [],
      })
      created.push(row.id)
    }
  }

  // Commit to the pack only after every row was processed without throwing.
  for (const app of draftApps) {
    const idx = pack.applications.findIndex((a) => a.id === app.id)
    if (idx >= 0) pack.applications[idx] = app
    else pack.applications.push(app)
  }
  for (const rel of draftRels) {
    if (!pack.relationships.some((r) => r.id === rel.id)) pack.relationships.push(rel)
  }
  return { created, updated }
}

/* ------------------------------------------------------------------ */
/* Samples                                                             */
/* ------------------------------------------------------------------ */

const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
const csvLine = (cells: string[]) => cells.map(csvCell).join(',')

/** Clean + error sample files built from the workspace's own capability ids so references are real. */
export function buildApplicationSamples(
  pack: Pick<TenantPack, 'capabilities' | 'applications'> | null | undefined,
): { clean: string; error: string } {
  const caps = pack?.capabilities ?? []
  const apps = pack?.applications ?? []
  const capA = caps[0]?.id ?? 'cap-1'
  const capB = caps[1]?.id ?? capA
  const existing = apps[0]
  const clean = [
    APPLICATION_CSV_HEADER,
    existing
      ? csvLine([existing.id, existing.name, existing.supportedCapabilityIds?.[0] ?? capA, existing.criticality ?? 'medium'])
      : csvLine(['app-sample-100', 'Existing sample application', capA, 'medium']),
    csvLine(['app-sample-101', 'Case intake portal (sample)', capA, 'high']),
    csvLine(['app-sample-102', 'Records archive (sample)', capB, 'medium']),
  ].join('\n')
  const error = [
    APPLICATION_CSV_HEADER,
    csvLine(['app-sample-201', 'Case intake portal (sample)', capA, 'high']),
    csvLine(['app-sample-202', 'Records archive (sample)', 'cap-does-not-exist', 'medium']),
    csvLine(['app-sample-203', '', capB, 'medium']),
    csvLine(['app-sample-201', 'Duplicate identifier (sample)', capA, 'urgent']),
  ].join('\n')
  return { clean, error }
}

/** Shape stored in the prototype store so Ask EA360 (Q32) can read the staged validation. */
export type StagedImportValidation = {
  draftId: string
  tenantCode: string
  source: string
  stagedAt: string
  fileName?: string
  errors: Array<{ row?: number; field?: string; message: string; severity?: string }>
  validCount: number
  warningCount: number
  rowCount: number
}

export function toStagedValidation(
  result: ImportValidationResult,
  meta: { draftId: string; tenantCode: string; fileName?: string; stagedAt?: string },
): StagedImportValidation {
  return {
    draftId: meta.draftId,
    tenantCode: meta.tenantCode,
    source: IMPORT_SOURCE,
    stagedAt: meta.stagedAt ?? new Date().toISOString(),
    fileName: meta.fileName,
    errors: result.errors.map((e) => ({ row: e.line, field: e.field, message: e.message, severity: e.severity })),
    validCount: result.rows.length,
    warningCount: result.warnings.length,
    rowCount: result.totalRows,
  }
}
