/**
 * Runtime prospect workspaces (journey J8).
 *
 * A runtime workspace is a *clone* of one of the four seed packs with every entity id remapped,
 * stored under the `ea360-runtime-workspaces` localStorage key. Seed packs are never modified.
 * All runtime workspaces are synthetic / illustrative by construction.
 *
 * This module is pure (no registry import) so the registry can depend on it.
 */
import type { TenantPack } from '../../domain/schemas'
import type { SeedTenantCode, TenantConfig } from '../../domain/tenants/config'

export const RUNTIME_WORKSPACES_KEY = 'ea360-runtime-workspaces'

export type StarterOption = { code: SeedTenantCode; label: string; sector: string }

/** Starter families offered by the onboarding wizard. */
export const STARTER_OPTIONS: StarterOption[] = [
  { code: 'BOG', label: 'Central Bank', sector: 'Central Bank' },
  { code: 'GRA', label: 'Revenue Authority', sector: 'Revenue Authority' },
  { code: 'FIDELITY', label: 'Commercial Bank', sector: 'Commercial Bank' },
  { code: 'GENERIC', label: 'Generic enterprise', sector: 'Generic' },
]

export type RuntimeWorkspaceProfile = {
  name: string
  code: string
  sector: string
  country: string
  currency: string
  timezone: string
  synthetic: boolean
}

export type RuntimeWorkspaceRecord = {
  code: string
  starterCode: SeedTenantCode
  createdAt: string
  config: TenantConfig
  pack: TenantPack
}

/** Collections whose `id` values participate in remapping. */
const ID_COLLECTIONS = [
  'strategicObjectives',
  'capabilities',
  'processes',
  'applications',
  'integrations',
  'dataObjects',
  'technologies',
  'evidence',
  'findings',
  'recommendations',
  'decisions',
  'initiatives',
  'kpis',
  'relationships',
  'scenarios',
  'aiModels',
  'aiSolutions',
] as const

export const WORKSPACE_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,14}$/

export type CloneResult = { pack: TenantPack; idMap: Map<string, string> }

/**
 * Deep-clone a starter pack, remapping every entity id (and every reference to it) to a fresh,
 * workspace-specific id. References are rewritten by exact string match on the collected id set,
 * so cross-links such as `linkedObjectIds`, `findingIds`, relationship endpoints and `tenantId`
 * stay consistent. The audit trail is reset to a single "workspace created" event.
 */
export function cloneStarterPack(
  starter: TenantPack,
  profile: Pick<RuntimeWorkspaceProfile, 'name' | 'code' | 'sector' | 'country'>,
  starterLabel: string,
  now = new Date().toISOString(),
): CloneResult {
  const code = profile.code.trim().toUpperCase()
  const suffix = code.toLowerCase().replace(/_/g, '-')
  const newTenantId = `tenant-${suffix}`
  const source = structuredClone(starter) as TenantPack & Record<string, unknown>

  const idMap = new Map<string, string>()
  idMap.set(source.tenant.id, newTenantId)
  for (const key of ID_COLLECTIONS) {
    const list = source[key] as Array<{ id?: string }> | undefined
    for (const item of list ?? []) {
      if (item && typeof item.id === 'string' && !idMap.has(item.id)) {
        idMap.set(item.id, `${item.id}-${suffix}`)
      }
    }
  }

  const remap = (value: unknown): unknown => {
    if (typeof value === 'string') return idMap.get(value) ?? value
    if (Array.isArray(value)) return value.map(remap)
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        out[idMap.get(k) ?? k] = remap(v)
      }
      return out
    }
    return value
  }

  const cloned = remap(source) as TenantPack & Record<string, unknown>
  cloned.tenant = {
    id: newTenantId,
    code,
    name: profile.name.trim(),
    shortName: profile.name.trim(),
    sector: profile.sector,
    country: profile.country.trim(),
    story: `Illustrative synthetic workspace for ${profile.name.trim()}, cloned from the ${starterLabel} starter. Not customer data.`,
    synthetic: true,
  }
  cloned.auditHistory = [
    {
      id: `audit-${suffix}-created`,
      tenantId: newTenantId,
      action: 'workspace_created',
      actorRole: 'presenter',
      timestamp: now,
      entityId: newTenantId,
      entityType: 'tenant',
      newState: 'created',
      comment: `Runtime workspace cloned from the ${starterLabel} starter (${starter.tenant.code}); ${idMap.size} identifiers remapped.`,
    },
  ]
  return { pack: cloned as TenantPack, idMap }
}

export function buildRuntimeConfig(
  starterConfig: TenantConfig,
  profile: RuntimeWorkspaceProfile,
  idMap: Map<string, string>,
  starterLabel: string,
  now = new Date().toISOString(),
): TenantConfig {
  const code = profile.code.trim().toUpperCase()
  const name = profile.name.trim()
  const lettermark =
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 3)
      .toUpperCase() || code.slice(0, 2)
  return {
    ...starterConfig,
    code,
    tenantId: idMap.get(starterConfig.tenantId) ?? `tenant-${code.toLowerCase()}`,
    displayName: name,
    shortName: name.length > 24 ? code : name,
    tenantType: profile.sector,
    description: `Illustrative synthetic prospect workspace for ${name}, cloned from the ${starterLabel} starter.`,
    geographicContext: profile.country.trim(),
    country: profile.country.trim(),
    currency: profile.currency,
    timezone: profile.timezone,
    industry: starterConfig.industry,
    defaultScenarioId: idMap.get(starterConfig.defaultScenarioId) ?? starterConfig.defaultScenarioId,
    storyline: `Illustrative prospect workspace cloned from the ${starterLabel} starter. Replace synthetic records with the customer's own data through Data Ingestion.`,
    lettermark,
    runtime: true,
    starterCode: starterConfig.code as SeedTenantCode,
    createdAt: now,
    syntheticDisclaimer: 'Illustrative synthetic prospect workspace - not customer data.',
  }
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null
  } catch {
    return null
  }
}

export function readRuntimeRecords(): RuntimeWorkspaceRecord[] {
  const ls = storage()
  if (!ls) return []
  try {
    const raw = ls.getItem(RUNTIME_WORKSPACES_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (r): r is RuntimeWorkspaceRecord =>
        Boolean(r && typeof r.code === 'string' && r.config && r.pack?.tenant?.code === r.code),
    )
  } catch {
    return []
  }
}

/** Returns false when browser storage is unavailable or full; callers must then abort the commit. */
export function writeRuntimeRecords(records: RuntimeWorkspaceRecord[]): boolean {
  const ls = storage()
  if (!ls) return false
  try {
    ls.setItem(RUNTIME_WORKSPACES_KEY, JSON.stringify(records))
    return true
  } catch {
    return false
  }
}
