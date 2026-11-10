import { describe, expect, it } from 'vitest'
import { loadTenantPack } from '../data/repositories/tenantRepository'
import { preflightJourney } from '../features/demo/scenarioPreflight'
import { mergeBogJourneySeeds } from './prototypeStore'

function staleBogPack() {
  const seed = loadTenantPack('BOG', { bypassCache: true })
  const stale = structuredClone(seed)
  stale.aiModels = []
  stale.aiSolutions = []
  stale.evidence = stale.evidence.filter((e) => e.id !== 'ev-bog-demo-ai-01')
  stale.findings = stale.findings.filter((f) => f.id !== 'find-bog-demo-ai-01')
  const lineage = stale.findings.find((f) => f.id === 'find-bog-01')!
  lineage.linkedObjectIds = lineage.linkedObjectIds.filter((id) => id !== 'data-bog-02')
  lineage.workflowStatus = 'Remediation Planned'
  return stale
}

describe('mergeBogJourneySeeds', () => {
  it('leaves non-BoG packs untouched', () => {
    const gra = loadTenantPack('GRA')
    expect(mergeBogJourneySeeds(gra)).toBe(gra)
  })

  it('backfills J4/J6 seeds, preserves edits, and is idempotent', () => {
    const stale = staleBogPack()
    expect(preflightJourney(stale, 'BOG', 'J4').status).not.toBe('Ready')
    expect(preflightJourney(stale, 'BOG', 'J6').status).not.toBe('Ready')

    const once = mergeBogJourneySeeds(stale)!
    expect(once.findings.find((f) => f.id === 'find-bog-01')?.workflowStatus).toBe('Remediation Planned')
    expect(once.findings.find((f) => f.id === 'find-bog-01')?.linkedObjectIds).toContain('data-bog-02')
    expect(once.aiSolutions.some((s) => s.id === 'ai-bog-demo-01')).toBe(true)
    expect(once.aiModels.some((m) => m.id === 'aim-bog-demo-01')).toBe(true)
    expect(once.evidence.filter((e) => e.id === 'ev-bog-demo-ai-01')).toHaveLength(1)
    expect(once.findings.filter((f) => f.id === 'find-bog-demo-ai-01')).toHaveLength(1)
    expect(preflightJourney(once, 'BOG', 'J4').status).toBe('Ready')
    expect(preflightJourney(once, 'BOG', 'J6').status).toBe('Ready')
    expect(preflightJourney(once, 'BOG', 'J7').status).toBe('Needs setup')

    const twice = mergeBogJourneySeeds(once)!
    expect(twice).toBe(once)
    expect(twice.evidence.filter((e) => e.id === 'ev-bog-demo-ai-01')).toHaveLength(1)
    expect(twice.findings.filter((f) => f.id === 'find-bog-demo-ai-01')).toHaveLength(1)
  })
})