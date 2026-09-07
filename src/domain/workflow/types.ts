/** Phase 3 governed transformation workflow types. */

export type FindingWorkflowStatus =
  | 'Draft'
  | 'Under Review'
  | 'Validated'
  | 'Accepted'
  | 'Remediation Planned'
  | 'Resolved'
  | 'Rejected'

export type EvidenceVerificationStatus =
  | 'unverified'
  | 'verified'
  | 'disputed'
  | 'stale'
  | 'missing'

export type RecommendationWorkflowStatus =
  | 'Draft'
  | 'Ready for Review'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Revision Requested'
  | 'Converted to Initiative'

export type DecisionStatus =
  | 'Pending'
  | 'Approved'
  | 'Approved with Conditions'
  | 'Rejected'
  | 'Deferred'
  | 'Superseded'

export type DecisionType =
  | 'Architecture'
  | 'Investment'
  | 'Exception'
  | 'Standard'
  | 'Remediation'

export type AuditAction =
  | 'finding_submitted'
  | 'finding_validated'
  | 'finding_rejected'
  | 'finding_owner_changed'
  | 'finding_target_date_changed'
  | 'finding_remediation_planned'
  | 'finding_resolved'
  | 'evidence_verified'
  | 'evidence_disputed'
  | 'evidence_note_added'
  | 'recommendation_submitted'
  | 'recommendation_approved'
  | 'recommendation_rejected'
  | 'recommendation_revision_requested'
  | 'recommendation_comment_added'
  | 'recommendation_sent_to_arb'
  | 'decision_recorded'
  | 'decision_deferred'
  | 'initiative_created'
  | 'roadmap_placement_changed'
  | 'kpi_progress_updated'

export interface AuditEvent {
  id: string
  tenantId: string
  action: AuditAction
  actorRole: string
  timestamp: string
  entityId: string
  entityType: string
  previousState?: string
  newState?: string
  comment?: string
}

export interface ReviewComment {
  id: string
  at: string
  authorRole: string
  text: string
}

export type KpiCategory =
  | 'Revenue/value'
  | 'Cost efficiency'
  | 'Service experience'
  | 'Risk reduction'
  | 'Resilience'
  | 'Compliance'
  | 'Delivery performance'
  | 'Architecture maturity'

export interface InitiativeDraft {
  title: string
  intendedOutcome: string
  ownerId: string
  objectiveIds: string[]
  capabilityIds: string[]
  applicationIds: string[]
  integrationIds: string[]
  findingIds: string[]
  recommendationId: string
  decisionId: string
  expectedBenefit: string
  expectedRiskReduction: string
  costBand: string
  effortBand: string
  dependencies: string[]
  targetPeriod: string
  horizon: 'now' | 'next' | 'later'
  targetQuarter: string
  kpiIds: string[]
}
