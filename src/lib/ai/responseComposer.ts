import type { EA360AIResponse, AIIntent, EntityReference, SuggestedAction, CalculationReference } from './types'

let seq = 0

export function nextResponseId() {
  seq += 1
  return `ai-resp-${Date.now()}-${seq}`
}

export function baseResponse(partial: {
  intent: AIIntent
  tenantId: string
  summary: string
  explanation: string
  whyItMatters?: string
  evidenceIds?: string[]
  entityRefs?: EntityReference[]
  assumptions?: string[]
  calculations?: CalculationReference[]
  confidence: EA360AIResponse['confidence']
  confidenceReason: string
  suggestedActions?: SuggestedAction[]
  facts?: string[]
  inferences?: string[]
}): Omit<EA360AIResponse, 'grounded' | 'groundingErrors'> {
  return {
    id: nextResponseId(),
    intent: partial.intent,
    summary: partial.summary,
    explanation: partial.explanation,
    whyItMatters: partial.whyItMatters || 'Supports evidence-based architecture and transformation decisions.',
    evidenceIds: partial.evidenceIds || [],
    entityRefs: partial.entityRefs || [],
    assumptions: partial.assumptions || [],
    calculations: partial.calculations,
    confidence: partial.confidence,
    confidenceReason: partial.confidenceReason,
    suggestedActions: partial.suggestedActions || [],
    generatedAt: new Date().toISOString(),
    reviewStatus: 'unreviewed',
    tenantId: partial.tenantId,
    facts: partial.facts || [],
    inferences: partial.inferences || [],
  }
}

export function refsFromIds(
  ids: string[],
  resolve: (id: string) => EntityReference | null,
): EntityReference[] {
  const out: EntityReference[] = []
  for (const id of ids) {
    const r = resolve(id)
    if (r && !out.some((x) => x.id === r.id)) out.push(r)
  }
  return out
}
