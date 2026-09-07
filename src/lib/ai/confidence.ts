import type { Evidence } from '../../domain/entities/types'
import { deriveEvidenceTrustStatus, deriveFreshness } from '../../domain/workflow'
import type { AIConfidence } from './types'

export type ConfidenceInput = {
  evidence: Evidence[]
  relationshipCount?: number
  expectedRelationships?: number
  metricComplete?: boolean
  assumptionCount?: number
  conflictingEvidence?: boolean
  dataQualityScores?: Array<'high' | 'medium' | 'low'>
}

/**
 * Deterministic confidence from measurable evidence and completeness factors.
 * Documented in METRIC_DEFINITIONS.md / AI_ASSISTANCE_MODEL.md.
 *
 * Score starts at 50 and adjusts:
 * + verified evidence, freshness, high DQ, relationship coverage, metric completeness
 * − unverified/stale/disputed, missing evidence, assumptions, conflicts, incomplete graph
 */
export function classifyConfidence(input: ConfidenceInput): {
  confidence: AIConfidence
  reason: string
  score: number
} {
  let score = 50
  const reasons: string[] = []

  const evidence = input.evidence || []
  if (!evidence.length) {
    score -= 25
    reasons.push('no linked evidence')
  } else {
    const verified = evidence.filter((e) => (e.verificationStatus ?? 'unverified') === 'verified')
    const disputed = evidence.filter((e) => e.verificationStatus === 'disputed')
    const stale = evidence.filter((e) => {
      const t = deriveEvidenceTrustStatus(e)
      return t === 'stale' || deriveFreshness(e) === 'stale'
    })
    score += Math.min(25, verified.length * 8)
    if (verified.length) reasons.push(`${verified.length} verified evidence item(s)`)
    score -= disputed.length * 12
    if (disputed.length) reasons.push(`${disputed.length} disputed evidence`)
    score -= stale.length * 8
    if (stale.length) reasons.push(`${stale.length} stale evidence`)
    const unverified = evidence.length - verified.length - disputed.length
    if (unverified > 0) {
      score -= unverified * 4
      reasons.push(`${unverified} unverified evidence`)
    }
  }

  const dq = input.dataQualityScores || []
  if (dq.length) {
    const high = dq.filter((d) => d === 'high').length
    const low = dq.filter((d) => d === 'low').length
    score += Math.min(10, high * 3)
    score -= low * 5
    if (low) reasons.push('low data-quality records present')
  }

  if (input.metricComplete === false) {
    score -= 10
    reasons.push('metric inputs incomplete')
  } else if (input.metricComplete) {
    score += 5
    reasons.push('metric inputs complete')
  }

  const rel = input.relationshipCount ?? 0
  const expected = input.expectedRelationships ?? 0
  if (expected > 0) {
    const ratio = Math.min(1, rel / expected)
    score += Math.round(ratio * 10)
    if (ratio < 0.5) reasons.push('relationship coverage incomplete')
    else reasons.push('relationship coverage adequate')
  }

  const assumptions = input.assumptionCount ?? 0
  if (assumptions > 0) {
    score -= Math.min(20, assumptions * 5)
    reasons.push(`${assumptions} explicit assumption(s)`)
  }

  if (input.conflictingEvidence) {
    score -= 15
    reasons.push('conflicting evidence signals')
  }

  score = Math.max(0, Math.min(100, score))
  const confidence: AIConfidence = score >= 72 ? 'high' : score >= 45 ? 'medium' : 'low'
  const reason =
    reasons.length > 0
      ? `Confidence ${confidence} (score ${score}): ${reasons.slice(0, 4).join('; ')}.`
      : `Confidence ${confidence} (score ${score}) from available tenant records.`

  return { confidence, reason, score }
}
