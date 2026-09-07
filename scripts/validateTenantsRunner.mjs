/**
 * Validate all tenant packs without Vitest.
 * Usage: node scripts/validateTenantsRunner.mjs
 */
import { createServer } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(root, '..')

const server = await createServer({
  root: projectRoot,
  configFile: path.join(projectRoot, 'vite.config.js'),
  server: { middlewareMode: true },
  appType: 'custom',
})

try {
  const { listValidatedTenantCodes } = await server.ssrLoadModule('/src/data/tenants/registry.ts')
  const { loadTenantPack } = await server.ssrLoadModule('/src/data/repositories/tenantRepository.ts')
  const { validateTenantPack } = await server.ssrLoadModule('/src/data/validators/validateTenant.ts')

  const codes = listValidatedTenantCodes()
  let failed = 0

  for (const code of codes) {
    try {
      const pack = loadTenantPack(code, { bypassCache: true })
      validateTenantPack(pack)
      console.log(
        `OK ${code} tenant=${pack.tenant.id} caps=${pack.capabilities.length} apps=${pack.applications.length} ints=${pack.integrations.length} findings=${pack.findings.length} rels=${pack.relationships.length} scenarios=${pack.scenarios?.length ?? 0}`,
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
    process.exitCode = 1
  } else {
    console.log(`All ${codes.length} tenants validated.`)
  }
} finally {
  await server.close()
}
