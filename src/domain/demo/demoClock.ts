/**
 * Shared demo as-of date for evidence freshness, EOS horizons, imports and reports.
 * Seed demos default to the documented snapshot date until a newer fixture baseline exists.
 */

export const DEFAULT_DEMO_AS_OF = '2026-09-07'

let configuredAsOf: string = DEFAULT_DEMO_AS_OF

export function getDemoAsOfDate(): string {
  return configuredAsOf
}

export function setDemoAsOfDate(isoDate: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    throw new Error(`Invalid demo as-of date: ${isoDate}`)
  }
  configuredAsOf = isoDate
}

export function resetDemoAsOfDate(): void {
  configuredAsOf = DEFAULT_DEMO_AS_OF
}

export function formatDemoAsOfLabel(isoDate = configuredAsOf): string {
  return `Data as of ${isoDate} (illustrative snapshot)`
}

/** Days from as-of to a date string; null if unparseable. */
export function daysFromAsOf(dateStr: string | undefined | null, asOf = configuredAsOf): number | null {
  if (!dateStr) return null
  const a = Date.parse(`${asOf}T00:00:00Z`)
  const b = Date.parse(`${dateStr.slice(0, 10)}T00:00:00Z`)
  if (Number.isNaN(a) || Number.isNaN(b)) return null
  return Math.round((b - a) / (24 * 60 * 60 * 1000))
}

export type SupportHorizon = 'expired' | 'approaching' | 'supported' | 'unknown'

/** Classify support end relative to as-of within a horizon (default 18 months ≈ 548 days). */
export function classifySupportDate(
  supportEndDate: string | undefined | null,
  asOf = configuredAsOf,
  approachingDays = 548,
): SupportHorizon {
  const days = daysFromAsOf(supportEndDate, asOf)
  if (days === null) return 'unknown'
  if (days < 0) return 'expired'
  if (days <= approachingDays) return 'approaching'
  return 'supported'
}
