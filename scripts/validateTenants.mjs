/**
 * Manual / CI-friendly tenant pack validation (not a Vitest suite).
 * Usage: npx vite-node scripts/validateTenants.mjs
 */
import { listValidatedTenantCodes } from '../src/data/tenants/registry.ts'
import { loadTenantPack } from '../src/data/repositories/tenantRepository.ts'
import { validateTenantPack } from '../src/data/validators/validateTenant.ts'

const codes = listValidatedTenantCodes()
let failed = 0

for (const code of codes) {
  try {
    const pack = loadTenantPack(code, { bypassCache: true })
    validateTenantPack(pack)
    const rels = pack.relationships?.length ?? 0
    const scenarios = pack.scenarios?.length ?? 0
    console.log(
      `OK ${code} tenant=${pack.tenant.id} caps=${pack.capabilities.length} apps=${pack.applications.length} ints=${pack.integrations.length} findings=${pack.findings.length} rels=${rels} scenarios=${scenarios}`,
    )
  } catch (e) {
    failed += 1
    console.error(`FAIL ${code}: ${e.message}`)
    if (e.details?.length) {
      for (const d of e.details.slice(0, 25)) console.error(`  - ${d}`)
    }
  }
}

if (failed) {
  console.error(`Validation failed for ${failed} tenant(s).`)
  process.exit(1)
}

console.log(`All ${codes.length} tenants validated.`)
