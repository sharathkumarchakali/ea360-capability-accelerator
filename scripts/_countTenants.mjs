import { loadTenantPack, clearTenantCache } from '../src/data/repositories/tenantRepository.ts'

clearTenantCache()
for (const code of ['GRA','BOG','FIDELITY','GENERIC']) {
  const p = loadTenantPack(code, { bypassCache: true })
  console.log(JSON.stringify({ code,
    strategicObjectives: p.strategicObjectives.length,
    capabilities: p.capabilities.length,
    processes: p.processes.length,
    applications: p.applications.length,
    integrations: p.integrations.length,
    dataObjects: p.dataObjects.length,
    technologies: p.technologies.length,
    evidence: p.evidence.length,
    findings: p.findings.length,
    recommendations: p.recommendations.length,
    decisions: (p.decisions ?? []).length,
    initiatives: p.initiatives.length,
    kpis: p.kpis.length,
    relationships: p.relationships.length,
    scenarios: (p.scenarios ?? []).length,
  }))
}
