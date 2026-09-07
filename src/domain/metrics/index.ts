import type {
  Application,
  Capability,
  Finding,
  Initiative,
  KPI,
  Recommendation,
} from '../entities/types'

/**
 * Enterprise health (0–100)
 * Formula: weighted blend of architecture maturity (40%), inverse critical-risk pressure (30%),
 * application health (20%), and transformation progress (10%).
 * riskPressure = min(1, criticalFindings / max(1, totalFindings)) then inverted.
 */
export function enterpriseHealth(input: {
  architectureMaturity: number
  criticalFindings: number
  totalFindings: number
  applicationHealth: number
  transformationProgress: number
}): number {
  const maturityPct = (input.architectureMaturity / 5) * 100
  const riskPressure = Math.min(1, input.criticalFindings / Math.max(1, input.totalFindings))
  const riskPct = (1 - riskPressure) * 100
  const appPct = (input.applicationHealth / 5) * 100
  const transformPct = input.transformationProgress
  const score =
    maturityPct * 0.4 + riskPct * 0.3 + appPct * 0.2 + transformPct * 0.1
  return round1(score)
}

/**
 * Strategic alignment (0–100)
 * Formula: average of KPI attainment ratios (current/target clamped 0–1), weighted equally.
 * For lower-better KPIs, attainment = target/current when current > 0.
 */
export function strategicAlignment(kpis: KPI[]): number {
  if (!kpis.length) return 0
  const ratios = kpis.map((k) => {
    if (k.direction === 'higher-better') {
      if (k.targetValue <= 0) return 0
      return clamp01(k.currentValue / k.targetValue)
    }
    if (k.currentValue <= 0) return 1
    return clamp01(k.targetValue / k.currentValue)
  })
  return round1((average(ratios) || 0) * 100)
}

/**
 * Architecture maturity (1–5)
 * Formula: mean of capability.maturityCurrent across all capabilities.
 */
export function architectureMaturity(capabilities: Capability[]): number {
  if (!capabilities.length) return 0
  return round1(average(capabilities.map((c) => c.maturityCurrent)))
}

/**
 * Critical-risk count
 * Formula: count of findings where severity === 'critical' and status is open|in_progress|accepted.
 */
export function criticalRiskCount(findings: Finding[]): number {
  return findings.filter(
    (f) =>
      f.severity === 'critical' &&
      (f.status === 'open' || f.status === 'in_progress' || f.status === 'accepted'),
  ).length
}

/**
 * Application health (1–5)
 * Formula: mean of application.technicalHealth across active applications.
 */
export function applicationHealth(applications: Application[]): number {
  const active = applications.filter((a) => a.status === 'active')
  if (!active.length) return 0
  return round1(average(active.map((a) => a.technicalHealth)))
}

/**
 * Transformation progress (0–100)
 * Formula: mean of initiative.progressPercent across all initiatives.
 * If none, 0.
 */
export function transformationProgress(initiatives: Initiative[]): number {
  if (!initiatives.length) return 0
  return round1(average(initiatives.map((i) => i.progressPercent)))
}

export function deriveExecutiveMetrics(pack: {
  capabilities: Capability[]
  applications: Application[]
  findings: Finding[]
  initiatives: Initiative[]
  kpis: KPI[]
  recommendations: Recommendation[]
}) {
  const maturity = architectureMaturity(pack.capabilities)
  const appHealth = applicationHealth(pack.applications)
  const critical = criticalRiskCount(pack.findings)
  const transform = transformationProgress(pack.initiatives)
  const alignment = strategicAlignment(pack.kpis)
  const health = enterpriseHealth({
    architectureMaturity: maturity,
    criticalFindings: critical,
    totalFindings: pack.findings.length,
    applicationHealth: appHealth,
    transformationProgress: transform,
  })
  return {
    enterpriseHealth: health,
    strategicAlignment: alignment,
    architectureMaturity: maturity,
    criticalRiskCount: critical,
    applicationHealth: appHealth,
    transformationProgress: transform,
    openFindings: pack.findings.filter((f) => f.status === 'open' || f.status === 'in_progress')
      .length,
    approvedRecommendations: pack.recommendations.filter((r) => r.status === 'approved').length,
  }
}

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export * from './portfolio'
export * from './integration'
export * from './graph'
