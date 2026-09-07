import type { TenantRepository } from '../../data/repositories/tenantRepository'
import type { EA360AIResponse } from './types'
import { INSUFFICIENT_EVIDENCE_MESSAGE } from './types'

/**
 * Validate that every entity/evidence reference exists in the active tenant pack.
 * Rejects cross-tenant IDs and invented references.
 */
export function validateGrounding(
  response: Omit<EA360AIResponse, 'grounded' | 'groundingErrors'>,
  repo: TenantRepository,
  expectedTenantId: string,
): EA360AIResponse {
  const errors: string[] = []
  const pack = repo.getPack()

  if (response.tenantId !== expectedTenantId && response.tenantId !== pack.tenant.id) {
    errors.push(`Tenant mismatch: response tenant ${response.tenantId}`)
  }

  const known = collectKnownIds(repo)

  for (const ref of response.entityRefs) {
    if (!known.has(ref.id)) errors.push(`Unknown entity reference: ${ref.id}`)
  }
  for (const eid of response.evidenceIds) {
    if (!known.has(eid)) errors.push(`Unknown evidence reference: ${eid}`)
    else if (!pack.evidence.some((e) => e.id === eid)) {
      errors.push(`Evidence id not in evidence collection: ${eid}`)
    }
  }

  if (errors.length) {
    return {
      ...response,
      grounded: false,
      groundingErrors: errors,
      summary: INSUFFICIENT_EVIDENCE_MESSAGE,
      explanation:
        'The drafted response failed grounding validation and was withheld. ' + errors.slice(0, 3).join(' '),
      whyItMatters: 'Ungrounded statements must not be presented as enterprise facts.',
      evidenceIds: response.evidenceIds.filter((id) => pack.evidence.some((e) => e.id === id)),
      entityRefs: response.entityRefs.filter((r) => known.has(r.id)),
      confidence: 'low',
      confidenceReason: 'Grounding validation failed.',
      facts: [],
      inferences: ['Response withheld pending data correction.'],
      suggestedActions: [
        {
          id: 'review-gaps',
          label: 'Review evidence gaps',
          action: 'navigate',
          view: 'evidence',
        },
      ],
    }
  }

  return { ...response, grounded: true, groundingErrors: [] }
}

export function collectKnownIds(repo: TenantRepository): Set<string> {
  const pack = repo.getPack()
  return new Set<string>([
    pack.tenant.id,
    ...pack.strategicObjectives.map((x) => x.id),
    ...pack.capabilities.map((x) => x.id),
    ...pack.processes.map((x) => x.id),
    ...pack.applications.map((x) => x.id),
    ...pack.integrations.map((x) => x.id),
    ...pack.dataObjects.map((x) => x.id),
    ...pack.technologies.map((x) => x.id),
    ...pack.evidence.map((x) => x.id),
    ...pack.findings.map((x) => x.id),
    ...pack.recommendations.map((x) => x.id),
    ...(pack.decisions ?? []).map((x) => x.id),
    ...pack.initiatives.map((x) => x.id),
    ...pack.kpis.map((x) => x.id),
  ])
}

export function assertTenantIsolation(
  requestTenantId: string,
  packTenantId: string,
): string | null {
  if (requestTenantId && requestTenantId !== packTenantId && requestTenantId !== 'GRA') {
    // Allow code GRA vs id tenant-gra
    if (requestTenantId !== 'tenant-gra' && packTenantId !== requestTenantId) {
      return 'Cross-tenant requests are not supported in this prototype.'
    }
  }
  return null
}
