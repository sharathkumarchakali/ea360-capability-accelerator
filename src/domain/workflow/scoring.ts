import type { Evidence, Finding } from '../entities/types'
import type { EvidenceVerificationStatus } from './types'

/** Risk score = likelihood (1–5) × impact (1–5), capped 25. */
export function calculateRiskScore(likelihood: number, impactScore: number): number {
  const l = clampScore(likelihood)
  const i = clampScore(impactScore)
  return l * i
}

export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 1
  return Math.min(5, Math.max(1, Math.round(n)))
}

export function severityFromRiskScore(riskScore: number): 'critical' | 'high' | 'medium' | 'low' {
  if (riskScore >= 20) return 'critical'
  if (riskScore >= 12) return 'high'
  if (riskScore >= 6) return 'medium'
  return 'low'
}

/**
 * Finding confidence 0–100 from linked evidence reliability + freshness + verification.
 */
export function calculateFindingConfidence(
  finding: Pick<Finding, 'evidenceIds'>,
  evidence: Evidence[],
  asOf = '2026-09-07',
): number {
  if (!finding.evidenceIds.length) return 15
  const linked = evidence.filter((e) => finding.evidenceIds.includes(e.id))
  if (!linked.length) return 15

  const scores = linked.map((e) => evidenceItemConfidence(e, asOf))
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return Math.round(avg)
}

export function evidenceItemConfidence(e: Evidence, asOf = '2026-09-07'): number {
  const verification = e.verificationStatus ?? 'unverified'
  const reliability = e.reliability ?? e.confidence ?? 'medium'
  const freshness = e.freshness ?? deriveFreshness(e, asOf)

  let score = 40
  if (reliability === 'high') score += 25
  else if (reliability === 'medium') score += 12
  else score += 0

  if (freshness === 'fresh') score += 20
  else if (freshness === 'aging') score += 8
  else score -= 10

  if (verification === 'verified') score += 20
  else if (verification === 'disputed') score -= 25
  else if (verification === 'stale' || verification === 'missing') score -= 15

  return Math.min(100, Math.max(0, score))
}

export function deriveFreshness(
  e: Pick<Evidence, 'sourceDate' | 'capturedDate' | 'freshness'>,
  asOf = '2026-09-07',
): 'fresh' | 'aging' | 'stale' {
  if (e.freshness === 'fresh' || e.freshness === 'aging' || e.freshness === 'stale') {
    return e.freshness
  }
  const dateStr = e.sourceDate || e.capturedDate
  if (!dateStr) return 'aging'
  const days = Math.round((Date.parse(asOf) - Date.parse(dateStr)) / 86400000)
  if (Number.isNaN(days)) return 'aging'
  if (days <= 90) return 'fresh'
  if (days <= 270) return 'aging'
  return 'stale'
}

export function deriveEvidenceTrustStatus(
  e: Evidence,
  asOf = '2026-09-07',
): EvidenceVerificationStatus {
  if (e.verificationStatus === 'disputed') return 'disputed'
  if (e.verificationStatus === 'missing') return 'missing'
  const freshness = deriveFreshness(e, asOf)
  if (freshness === 'stale') return 'stale'
  if (e.verificationStatus === 'verified') return 'verified'
  return 'unverified'
}

export function isInsufficientlyEvidenced(
  finding: Pick<Finding, 'evidenceIds'>,
  evidence: Evidence[],
  asOf = '2026-09-07',
): boolean {
  if (!finding.evidenceIds.length) return true
  const linked = evidence.filter((e) => finding.evidenceIds.includes(e.id))
  if (!linked.length) return true
  return linked.every((e) => {
    const t = deriveEvidenceTrustStatus(e, asOf)
    return t === 'unverified' || t === 'stale' || t === 'disputed' || t === 'missing'
  })
}
