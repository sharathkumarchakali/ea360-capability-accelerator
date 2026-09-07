import type { TenantCode, TenantConfig } from '@/domain/tenants/config'
import type { TenantPack } from '@/domain/schemas'
import { graConfig } from './gra/config'
import { bogConfig } from './bog/config'
import { fidelityConfig } from './fidelity/config'
import { genericConfig } from './generic/config'
import graPack from './gra/pack'
import bogPack from './bog/pack'
import fidelityPack from './fidelity/pack'
import genericPack from './generic/pack'

/** Configs for tenants that have registered seed packs. */
const CONFIGS: Record<TenantCode, TenantConfig> = {
  GRA: graConfig,
  BOG: bogConfig,
  FIDELITY: fidelityConfig,
  GENERIC: genericConfig,
}

/** Pack modules keyed by tenant code (for registry completeness checks). */
const PACKS: Record<TenantCode, TenantPack> = {
  GRA: graPack as TenantPack,
  BOG: bogPack as TenantPack,
  FIDELITY: fidelityPack as TenantPack,
  GENERIC: genericPack as TenantPack,
}

const REGISTERED_CODES = (Object.keys(CONFIGS) as TenantCode[]).filter(
  (code) => Boolean(PACKS[code] && CONFIGS[code]),
)

export function getTenantConfig(code: TenantCode): TenantConfig {
  const cfg = CONFIGS[code]
  if (!cfg) throw new Error(`No tenant config for ${code}`)
  return cfg
}

export function listTenantConfigs(): TenantConfig[] {
  return REGISTERED_CODES.map((code) => CONFIGS[code])
}

export function listValidatedTenantCodes(): TenantCode[] {
  return [...REGISTERED_CODES]
}

export { CONFIGS, PACKS }
