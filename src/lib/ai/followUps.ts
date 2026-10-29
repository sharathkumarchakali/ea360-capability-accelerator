/**
 * Follow-up questions ("Why?", "Show the evidence") that keep the subject of the previous answer.
 *
 * The subject is the first related object of the previous response. A follow-up is rewritten into a
 * catalogue question with that subject pinned as context, so the deterministic adapter answers about
 * the same object instead of falling back to a portfolio-level answer or a different selection.
 */
import type { AIIntent, EA360AIResponse, EntityReference } from './types'

export type FollowUpKind = 'why' | 'evidence' | 'impact' | 'options'

export type ResolvedFollowUp = {
  kind: FollowUpKind
  subject: EntityReference
  /** Catalogue-style question text to send to the assistant. */
  query: string
  intent: AIIntent
  questionId?: string
  followUpOf: string
}

const FOLLOW_UP_PATTERNS: Array<{ kind: FollowUpKind; re: RegExp }> = [
  { kind: 'why', re: /^(why( is that| is this| does (this|that) matter)?|explain( this| that| further)?|tell me more)\??$/i },
  { kind: 'evidence', re: /^(show( me)?( the)? evidence|what evidence( supports (this|that))?|which evidence supports (this|that)|show( me)? sources?)\??$/i },
  { kind: 'impact', re: /^(what('| i)?s the )?impact\??$|^what happens (if|then)\??$|^what depends on (this|that)\??$/i },
  { kind: 'options', re: /^(what (should|can) we do|what are the options|response options|show( me)? options)\??$/i },
]

export const FOLLOW_UP_LABELS: Array<{ kind: FollowUpKind; label: string }> = [
  { kind: 'why', label: 'Why?' },
  { kind: 'evidence', label: 'Show the evidence' },
  { kind: 'impact', label: 'What is the impact?' },
  { kind: 'options', label: 'What are the options?' },
]

const WHY_BY_TYPE: Record<string, { intent: AIIntent; query: string; questionId?: string }> = {
  finding: { intent: 'explain_finding', query: 'Explain this finding.', questionId: 'Q03' },
  recommendation: { intent: 'recommendation_options', query: 'What are the response options for this recommendation?', questionId: 'Q14' },
  initiative: { intent: 'initiative_kpi_summary', query: 'Summarise this initiative and its KPIs.', questionId: 'Q15' },
  dataObject: { intent: 'data_lineage', query: 'What are the source and consumers of this data domain?', questionId: 'Q17' },
  technology: { intent: 'technology_priority', query: 'Why should we prioritise this technology?', questionId: 'Q22' },
  aiSolution: { intent: 'ai_agent_explain', query: 'Explain this agent and its risks.', questionId: 'Q25' },
  capability: { intent: 'capability_applications', query: 'Which applications support this capability?', questionId: 'Q07' },
  application: { intent: 'impact_analysis', query: 'What is the impact of retiring this application?', questionId: 'Q09' },
  integration: { intent: 'integration_dependents', query: 'What depends on this integration?' },
}

const IMPACT_TYPES = new Set(['application', 'integration', 'technology', 'capability', 'aiSolution', 'aiModel'])

export function matchFollowUpKind(text: string): FollowUpKind | null {
  const q = text.trim()
  if (!q) return null
  return FOLLOW_UP_PATTERNS.find((p) => p.re.test(q))?.kind ?? null
}

/** The object a follow-up is about: the first related object of the previous answer. */
export function followUpSubject(previous: EA360AIResponse | null | undefined): EntityReference | null {
  if (!previous) return null
  if (['unsupported', 'cross_tenant_refused', 'refuse_approval', 'refuse_guaranteed_finance', 'unknown_entity', 'clarify_entity'].includes(previous.intent)) {
    return null
  }
  return previous.entityRefs?.[0] ?? null
}

/**
 * Resolve a follow-up kind against the previous answer. Returns null when there is no subject or the
 * follow-up does not apply to the subject type (callers should then say so rather than guess).
 */
export function resolveFollowUp(
  kind: FollowUpKind,
  previous: EA360AIResponse | null | undefined,
): ResolvedFollowUp | null {
  const subject = followUpSubject(previous)
  if (!previous || !subject) return null
  const base = { kind, subject, followUpOf: previous.id }

  if (kind === 'why') {
    const row = WHY_BY_TYPE[subject.type]
    return row ? { ...base, ...row } : null
  }
  if (kind === 'evidence') {
    if (subject.type !== 'finding') return null
    return { ...base, intent: 'evidence_for_finding', query: 'Which evidence supports this risk?', questionId: 'Q13' }
  }
  if (kind === 'impact') {
    if (!IMPACT_TYPES.has(subject.type)) return null
    if (subject.type === 'integration') {
      return { ...base, intent: 'impact_analysis', query: 'What happens if this integration is unavailable?', questionId: 'Q12' }
    }
    if (subject.type === 'technology') {
      return { ...base, intent: 'technology_dependents', query: 'What services depend on this technology?', questionId: 'Q21' }
    }
    return { ...base, intent: 'impact_analysis', query: 'What is the impact of retiring this application?', questionId: 'Q09' }
  }
  if (kind === 'options') {
    if (subject.type === 'recommendation') {
      return { ...base, intent: 'recommendation_options', query: 'What are the response options for this recommendation?', questionId: 'Q14' }
    }
    if (subject.type === 'finding') {
      return { ...base, intent: 'recommendation_draft', query: 'Draft a recommendation for this finding.', questionId: 'Q28' }
    }
    return null
  }
  return null
}

/** Which follow-up chips make sense for an answer (only those that resolve to a real question). */
export function availableFollowUps(previous: EA360AIResponse | null | undefined) {
  return FOLLOW_UP_LABELS.filter((f) => resolveFollowUp(f.kind, previous) !== null)
}
