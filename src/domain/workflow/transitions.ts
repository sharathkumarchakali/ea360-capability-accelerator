import type {
  DecisionStatus,
  FindingWorkflowStatus,
  RecommendationWorkflowStatus,
} from './types'

const FINDING_TRANSITIONS: Record<FindingWorkflowStatus, FindingWorkflowStatus[]> = {
  Draft: ['Under Review', 'Rejected'],
  'Under Review': ['Validated', 'Rejected', 'Draft'],
  Validated: ['Accepted', 'Rejected'],
  Accepted: ['Remediation Planned', 'Resolved'],
  'Remediation Planned': ['Resolved', 'Accepted'],
  Resolved: [],
  Rejected: ['Draft'],
}

const REC_TRANSITIONS: Record<RecommendationWorkflowStatus, RecommendationWorkflowStatus[]> = {
  Draft: ['Ready for Review'],
  'Ready for Review': ['Under Review', 'Draft'],
  'Under Review': ['Approved', 'Rejected', 'Revision Requested'],
  Approved: ['Converted to Initiative'],
  Rejected: ['Draft'],
  'Revision Requested': ['Draft', 'Ready for Review'],
  'Converted to Initiative': [],
}

const DECISION_TRANSITIONS: Record<DecisionStatus, DecisionStatus[]> = {
  Pending: ['Approved', 'Approved with Conditions', 'Rejected', 'Deferred'],
  Approved: ['Superseded'],
  'Approved with Conditions': ['Superseded', 'Approved'],
  Rejected: [],
  Deferred: ['Pending', 'Approved', 'Approved with Conditions', 'Rejected'],
  Superseded: [],
}

export function canTransitionFinding(
  from: FindingWorkflowStatus,
  to: FindingWorkflowStatus,
): boolean {
  return FINDING_TRANSITIONS[from]?.includes(to) ?? false
}

export function canTransitionRecommendation(
  from: RecommendationWorkflowStatus,
  to: RecommendationWorkflowStatus,
): boolean {
  return REC_TRANSITIONS[from]?.includes(to) ?? false
}

export function canTransitionDecision(from: DecisionStatus, to: DecisionStatus): boolean {
  return DECISION_TRANSITIONS[from]?.includes(to) ?? false
}

export function assertFindingTransition(
  from: FindingWorkflowStatus,
  to: FindingWorkflowStatus,
): void {
  if (!canTransitionFinding(from, to)) {
    throw new Error(`Invalid finding transition: ${from} → ${to}`)
  }
}

export function assertRecommendationTransition(
  from: RecommendationWorkflowStatus,
  to: RecommendationWorkflowStatus,
): void {
  if (!canTransitionRecommendation(from, to)) {
    throw new Error(`Invalid recommendation transition: ${from} → ${to}`)
  }
}

export function assertDecisionTransition(from: DecisionStatus, to: DecisionStatus): void {
  if (!canTransitionDecision(from, to)) {
    throw new Error(`Invalid decision transition: ${from} → ${to}`)
  }
}

/** Map legacy EntityStatus values into workflow status. */
export function coerceFindingWorkflowStatus(raw: string | undefined): FindingWorkflowStatus {
  if (!raw) return 'Draft'
  if (raw in FINDING_TRANSITIONS) return raw as FindingWorkflowStatus
  const map: Record<string, FindingWorkflowStatus> = {
    draft: 'Draft',
    open: 'Accepted',
    in_progress: 'Remediation Planned',
    mitigated: 'Resolved',
    completed: 'Resolved',
    resolved: 'Resolved',
    rejected: 'Rejected',
    accepted: 'Accepted',
    proposed: 'Under Review',
  }
  return map[raw] ?? 'Draft'
}

export function coerceRecommendationWorkflowStatus(
  raw: string | undefined,
): RecommendationWorkflowStatus {
  if (!raw) return 'Draft'
  if (raw in REC_TRANSITIONS) return raw as RecommendationWorkflowStatus
  const map: Record<string, RecommendationWorkflowStatus> = {
    draft: 'Draft',
    proposed: 'Ready for Review',
    in_progress: 'Under Review',
    approved: 'Approved',
    rejected: 'Rejected',
    completed: 'Converted to Initiative',
  }
  return map[raw] ?? 'Draft'
}

export function coerceDecisionStatus(raw: string | undefined): DecisionStatus {
  if (!raw) return 'Pending'
  if (raw in DECISION_TRANSITIONS) return raw as DecisionStatus
  const map: Record<string, DecisionStatus> = {
    pending: 'Pending',
    open: 'Pending',
    in_review: 'Pending',
    submitted: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    deferred: 'Deferred',
    superseded: 'Superseded',
  }
  return map[raw] ?? 'Pending'
}

export function findingStatusToEntityStatus(
  ws: FindingWorkflowStatus,
): 'draft' | 'open' | 'in_progress' | 'mitigated' | 'rejected' | 'accepted' {
  switch (ws) {
    case 'Draft':
      return 'draft'
    case 'Under Review':
    case 'Validated':
      return 'open'
    case 'Accepted':
      return 'accepted'
    case 'Remediation Planned':
      return 'in_progress'
    case 'Resolved':
      return 'mitigated'
    case 'Rejected':
      return 'rejected'
  }
}

export function recommendationStatusToEntityStatus(
  ws: RecommendationWorkflowStatus,
): 'draft' | 'proposed' | 'in_progress' | 'approved' | 'rejected' | 'completed' {
  switch (ws) {
    case 'Draft':
      return 'draft'
    case 'Ready for Review':
      return 'proposed'
    case 'Under Review':
    case 'Revision Requested':
      return 'in_progress'
    case 'Approved':
      return 'approved'
    case 'Rejected':
      return 'rejected'
    case 'Converted to Initiative':
      return 'completed'
  }
}

export { FINDING_TRANSITIONS, REC_TRANSITIONS, DECISION_TRANSITIONS }
