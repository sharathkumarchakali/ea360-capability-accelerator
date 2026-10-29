/**
 * Versioned synthetic demo fixture builders (spec §5.2).
 * They only run when a presenter explicitly chooses "Prepare synthetic example",
 * always against a clone of the active working pack, and every record is tagged
 * `synthetic-demo-fixture`. Existing records are never overwritten.
 */
import type { TenantPack } from '../../domain/schemas'
import type { FixtureKind, JourneyScenarioBinding } from '../../features/demo/journeyBindings'
import { practiceIds } from '../../features/demo/journeyBindings'

export const FIXTURE_VERSION = 'demo-fixtures-v1'
export const FIXTURE_PROVENANCE = 'synthetic-demo-fixture'

export type FixtureResult = { ok: boolean; created: string[]; error?: string }

function tag<T extends { sourceRefs?: string[]; tags?: string[] }>(rec: T): T {
  rec.sourceRefs = [...new Set([...(rec.sourceRefs ?? []), FIXTURE_PROVENANCE, FIXTURE_VERSION])]
  rec.tags = [...new Set([...(rec.tags ?? []), FIXTURE_PROVENANCE])]
  return rec
}

/** J7 — fresh payment-resilience practice scenario with no recommendation / decision / initiative. */
export function applyJ7PracticeFixture(pack: TenantPack, binding: JourneyScenarioBinding): FixtureResult {
  const template = binding.fixtureTemplate
  if (!template) return { ok: false, created: [], error: 'No fixture template is bound for this workspace.' }
  const ids = practiceIds(binding.tenantCode)
  if (pack.findings.some((f) => f.id === ids.finding)) return { ok: true, created: [] }

  const baseFinding = pack.findings.find((f) => f.id === template.findingId)
  if (!baseFinding) {
    return { ok: false, created: [], error: `Template finding ${template.findingId} was not found in this workspace.` }
  }

  const templateEvidence = (baseFinding.evidenceIds ?? [])
    .map((id) => pack.evidence.find((e) => e.id === id))
    .filter(Boolean) as TenantPack['evidence']
  if (templateEvidence.length === 0) {
    return { ok: false, created: [], error: 'The template finding has no evidence to clone from.' }
  }
  const [evA, evB = evA] = templateEvidence
  const now = new Date().toISOString()
  const created: string[] = []

  const verified = tag(structuredClone(evA))
  verified.id = ids.evidenceVerified
  verified.name = `${evA.name} (synthetic practice)`
  verified.verificationStatus = 'verified'
  verified.relatedFindingIds = [ids.finding]
  verified.sourceReference = `PRACTICE-${binding.tenantCode}-V1`
  verified.createdAt = now
  verified.updatedAt = now

  const review = tag(structuredClone(evB))
  review.id = ids.evidenceReview
  review.name = `${evB.name} (synthetic practice, awaiting verification)`
  review.verificationStatus = 'unverified'
  review.relatedFindingIds = [ids.finding]
  review.sourceReference = `PRACTICE-${binding.tenantCode}-V2`
  review.createdAt = now
  review.updatedAt = now

  const finding = tag(structuredClone(baseFinding))
  finding.id = ids.finding
  finding.name = `Practice scenario (synthetic): ${baseFinding.name}`
  finding.description = `${baseFinding.description} Synthetic practice scenario for guided demonstration.`
  finding.workflowStatus = 'Under Review'
  finding.evidenceIds = [verified.id, review.id]
  finding.recommendationIds = []
  finding.decisionIds = []
  finding.initiativeIds = []
  finding.createdAt = now
  finding.updatedAt = now

  pack.evidence.push(verified, review)
  pack.findings.push(finding)
  created.push(verified.id, review.id, finding.id)

  const kpiTargets = [ids.kpi1, ids.kpi2]
  template.kpiIds.slice(0, 2).forEach((kpiId, i) => {
    const base = pack.kpis.find((k) => k.id === kpiId)
    if (!base || pack.kpis.some((k) => k.id === kpiTargets[i])) return
    const kpi = tag(structuredClone(base))
    kpi.id = kpiTargets[i]
    kpi.name = `${base.name} (practice)`
    kpi.linkedInitiativeIds = []
    kpi.createdAt = now
    kpi.updatedAt = now
    pack.kpis.push(kpi)
    created.push(kpi.id)
  })

  return { ok: true, created }
}

/** J6 — permission/guardrail review evidence substantiating the agent permission finding. */
export function applyJ6PermissionEvidenceFixture(pack: TenantPack, binding: JourneyScenarioBinding): FixtureResult {
  const agentId = binding.refs.agent?.id
  const findingId = binding.refs.finding?.id
  if (!agentId || !findingId) return { ok: false, created: [], error: 'Agent or finding binding is missing.' }
  const evId = `demo-${binding.tenantCode.toLowerCase()}-agent-permission-review`
  if (pack.evidence.some((e) => e.id === evId)) return { ok: true, created: [] }

  const finding = pack.findings.find((f) => f.id === findingId)
  if (!finding) return { ok: false, created: [], error: `Finding ${findingId} was not found.` }
  const base = pack.evidence.find((e) => finding.evidenceIds?.includes(e.id)) ?? pack.evidence[0]
  if (!base) return { ok: false, created: [], error: 'No evidence record is available to clone.' }

  const now = new Date().toISOString()
  const linked = [agentId, binding.refs.integration?.id, binding.refs.integration2?.id].filter(Boolean) as string[]
  const ev = tag(structuredClone(base))
  ev.id = evId
  ev.name = 'Agent permission and guardrail review (synthetic)'
  ev.description =
    'Synthetic review of recorded READ/WRITE/EXECUTE tool permissions and partial guardrails. Described permissions are not executed by this prototype.'
  ev.evidenceType = 'assessment-response'
  ev.linkedObjectIds = linked
  ev.relatedFindingIds = [findingId]
  ev.verificationStatus = 'verified'
  ev.sourceReference = `PRACTICE-${binding.tenantCode}-AI-PERM`
  ev.previewText = ev.description
  ev.createdAt = now
  ev.updatedAt = now

  pack.evidence.push(ev)
  finding.evidenceIds = [...new Set([...(finding.evidenceIds ?? []), ev.id])]
  return { ok: true, created: [ev.id] }
}

export function applyFixture(pack: TenantPack, kind: FixtureKind, binding: JourneyScenarioBinding): FixtureResult {
  if (kind === 'j7-practice') return applyJ7PracticeFixture(pack, binding)
  if (kind === 'j6-permission-evidence') return applyJ6PermissionEvidenceFixture(pack, binding)
  return { ok: false, created: [], error: `Unknown fixture ${kind}` }
}
