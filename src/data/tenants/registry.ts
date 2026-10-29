import type { SeedTenantCode, TenantCode, TenantConfig } from '@/domain/tenants/config'
import type { TenantPack } from '@/domain/schemas'
import { graConfig } from './gra/config'
import { bogConfig } from './bog/config'
import { fidelityConfig } from './fidelity/config'
import { genericConfig } from './generic/config'
import graPack from './gra/pack'
import bogPack from './bog/pack'
import fidelityPack from './fidelity/pack'
import genericPack from './generic/pack'
import {
  readRuntimeRecords,
  writeRuntimeRecords,
  type RuntimeWorkspaceRecord,
} from './runtimeWorkspaces'

/** Configs for tenants that have registered seed packs. */
const CONFIGS: Record<SeedTenantCode, TenantConfig> = {
  GRA: graConfig,
  BOG: bogConfig,
  FIDELITY: fidelityConfig,
  GENERIC: genericConfig,
}

/** Pack modules keyed by tenant code (for registry completeness checks). */
const PACKS: Record<SeedTenantCode, TenantPack> = {
  GRA: graPack as TenantPack,
  BOG: bogPack as TenantPack,
  FIDELITY: fidelityPack as TenantPack,
  GENERIC: genericPack as TenantPack,
}

const REGISTERED_CODES = (Object.keys(CONFIGS) as SeedTenantCode[]).filter(
  (code) => Boolean(PACKS[code] && CONFIGS[code]),
)

/* ------------------------------------------------------------------ */
/* Runtime prospect workspaces (never overwrite seeds)                  */
/* ------------------------------------------------------------------ */
const runtime = new Map<string, RuntimeWorkspaceRecord>()

function hydrateRuntimeFromStorage() {
  for (const record of readRuntimeRecords()) {
    if (!isSeedCode(record.code)) runtime.set(record.code, record)
  }
}

export function isSeedCode(code: string): code is SeedTenantCode {
  return Object.prototype.hasOwnProperty.call(CONFIGS, code)
}

hydrateRuntimeFromStorage()

/** True for a workspace created at runtime through onboarding. */
export function isRuntimeTenant(code: TenantCode): boolean {
  return runtime.has(code)
}

export function isKnownTenant(code: TenantCode): boolean {
  return isSeedCode(code) || runtime.has(code)
}

export function getRuntimeWorkspace(code: TenantCode): RuntimeWorkspaceRecord | undefined {
  return runtime.get(code)
}

export function listRuntimeWorkspaces(): RuntimeWorkspaceRecord[] {
  return [...runtime.values()]
}

/**
 * Register (and persist) a runtime workspace. Seed codes are rejected, so a seed can never be
 * overwritten. Returns whether browser storage accepted the write.
 */
export function registerRuntimeWorkspace(record: RuntimeWorkspaceRecord): { persisted: boolean } {
  if (isSeedCode(record.code)) throw new Error(`Code ${record.code} belongs to a seed workspace.`)
  runtime.set(record.code, record)
  const persisted = writeRuntimeRecords([...runtime.values()])
  return { persisted }
}

export function removeRuntimeWorkspace(code: TenantCode): void {
  if (runtime.delete(code)) writeRuntimeRecords([...runtime.values()])
}

/** Test helper: drop runtime workspaces from memory and storage. */
export function clearRuntimeWorkspaces(): void {
  runtime.clear()
  writeRuntimeRecords([])
}

export function getTenantConfig(code: TenantCode): TenantConfig {
  const cfg = isSeedCode(code) ? CONFIGS[code] : runtime.get(code)?.config
  if (!cfg) throw new Error(`No tenant config for ${code}`)
  return cfg
}

/** Seed configs followed by runtime workspaces. */
export function listTenantConfigs(): TenantConfig[] {
  return [...REGISTERED_CODES.map((code) => CONFIGS[code]), ...[...runtime.values()].map((r) => r.config)]
}

/** Seed tenant codes only (runtime workspaces are validated at creation time). */
export function listValidatedTenantCodes(): TenantCode[] {
  return [...REGISTERED_CODES]
}

export { CONFIGS, PACKS }
