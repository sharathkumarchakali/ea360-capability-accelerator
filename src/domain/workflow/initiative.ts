import type { Decision, Initiative, Recommendation } from '../entities/types'
import type { InitiativeDraft } from './types'
import { coerceDecisionStatus, coerceRecommendationWorkflowStatus } from './transitions'

export type ValidationResult = { ok: true } | { ok: false; errors: string[] }

export function canCreateInitiativeFromRecommendation(
  recommendation: Recommendation,
): ValidationResult {
  const ws = coerceRecommendationWorkflowStatus(
    recommendation.workflowStatus ?? recommendation.status,
  )
  if (ws !== 'Approved' && ws !== 'Converted to Initiative') {
    return {
      ok: false,
      errors: ['Recommendation must be Approved before an initiative can be created.'],
    }
  }
  return { ok: true }
}

export function canCreateInitiativeFromDecision(decision: Decision): ValidationResult {
  const status = coerceDecisionStatus(decision.decisionStatus ?? decision.status)
  if (status !== 'Approved' && status !== 'Approved with Conditions') {
    return {
      ok: false,
      errors: ['Decision must be Approved (or Approved with Conditions) to create an initiative.'],
    }
  }
  return { ok: true }
}

export function validateInitiativeDraft(draft: InitiativeDraft): ValidationResult {
  const errors: string[] = []
  if (!draft.decisionId) errors.push('An approved decision is required.')
  if (!draft.ownerId?.trim()) errors.push('Initiative owner is required.')
  if (!draft.intendedOutcome?.trim()) errors.push('Intended outcome is required.')
  if (!draft.title?.trim()) errors.push('Initiative title is required.')
  if (!draft.objectiveIds?.length && !draft.capabilityIds?.length) {
    errors.push('Link at least one strategic objective or capability.')
  }
  if (!draft.kpiIds?.length) errors.push('Link or define at least one KPI.')
  if (!draft.targetPeriod?.trim() && !draft.targetQuarter?.trim() && !draft.horizon) {
    errors.push('Target period is required.')
  }
  return errors.length ? { ok: false, errors } : { ok: true }
}

export function mapRecommendationToInitiativeDraft(
  recommendation: Recommendation,
  decision: Decision,
  defaults?: Partial<InitiativeDraft>,
): InitiativeDraft {
  return {
    title: recommendation.name,
    intendedOutcome: recommendation.outcome || recommendation.intendedOutcome || '',
    ownerId: recommendation.ownerId,
    objectiveIds: recommendation.objectiveIds ?? [],
    capabilityIds: [...(recommendation.affectedCapabilityIds ?? [])],
    applicationIds: [...(recommendation.affectedApplicationIds ?? [])],
    integrationIds: [...(recommendation.affectedIntegrationIds ?? [])],
    findingIds: [...(recommendation.findingIds ?? [])],
    recommendationId: recommendation.id,
    decisionId: decision.id,
    expectedBenefit: recommendation.expectedValue || recommendation.expectedBenefit || '',
    expectedRiskReduction: recommendation.expectedRiskReduction || recommendation.riskReduction || '',
    costBand: recommendation.costBand || 'TBD',
    effortBand: recommendation.effortBand || 'M',
    dependencies: [...(recommendation.dependencies ?? [])],
    targetPeriod: defaults?.targetPeriod || 'FY2026 Q4',
    horizon: defaults?.horizon || 'next',
    targetQuarter: defaults?.targetQuarter || '2026-Q4',
    kpiIds: [...(recommendation.kpiIds ?? [])],
    ...defaults,
  }
}

export function detectBlockedInitiatives(
  initiatives: Initiative[],
): Array<{ id: string; blockedBy: string[] }> {
  const byId = new Map(initiatives.map((i) => [i.id, i]))
  return initiatives
    .map((i) => {
      const deps = i.dependsOnInitiativeIds ?? []
      const blockedBy = deps.filter((depId) => {
        const dep = byId.get(depId)
        if (!dep) return true
        return dep.progressPercent < 100 && dep.status !== 'completed'
      })
      return { id: i.id, blockedBy }
    })
    .filter((x) => x.blockedBy.length > 0)
}

export function placeOnRoadmap(
  initiative: Initiative,
  horizon: 'now' | 'next' | 'later',
  targetQuarter?: string,
): Initiative {
  return {
    ...initiative,
    horizon,
    targetQuarter: targetQuarter ?? initiative.targetQuarter,
    updatedAt: new Date().toISOString().slice(0, 10),
  }
}
