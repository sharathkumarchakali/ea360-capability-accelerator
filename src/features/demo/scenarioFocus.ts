import type { JourneyScenarioBinding } from './journeyBindings'
import type { TenantRepository } from '../../data/repositories/tenantRepository'

export type ScenarioFocusChain = {
  scenario: { id: string; name: string } | null
  capability: ReturnType<TenantRepository['getCapability']> | null
  finding: ReturnType<TenantRepository['getFinding']> | null
  recommendation: ReturnType<TenantRepository['getRecommendation']> | null
  decision: { id: string; name?: string; status?: string } | null
  initiative: ReturnType<TenantRepository['getInitiative']> | null
  kpi: { id: string; name?: string } | null
  applications: ReturnType<TenantRepository['listApplications']>
}

export function resolveScenarioFocus(
  binding: JourneyScenarioBinding | null | undefined,
  repo: TenantRepository,
): ScenarioFocusChain | null {
  if (!binding?.available || !binding.refs) return null
  const id = (key: string) => binding.refs[key]?.id
  const scenario = binding.scenarioId ? repo.getScenario(binding.scenarioId) : null
  const capability = id('capability') ? repo.getCapability(id('capability')!) : null
  const finding = id('finding') ? repo.getFinding(id('finding')!) : null
  const recommendation = id('recommendation') ? repo.getRecommendation(id('recommendation')!) : null
  const decisionRaw = id('decision')
  const decisions = repo.listDecisions?.() || []
  const decision =
    decisionRaw && Array.isArray(decisions)
      ? decisions.find((d) => d.id === decisionRaw) || { id: decisionRaw, name: decisionRaw }
      : null
  const initiative = id('initiative') ? repo.getInitiative(id('initiative')!) : null
  const kpiId = id('kpi')
  const kpi = kpiId ? repo.listKpis?.().find((k) => k.id === kpiId) || { id: kpiId } : null
  const apps = capability ? repo.applicationsForCapability(capability.id) : []

  return {
    scenario: scenario ? { id: scenario.id, name: scenario.name } : null,
    capability,
    finding,
    recommendation,
    decision,
    initiative,
    kpi,
    applications: apps,
  }
}
