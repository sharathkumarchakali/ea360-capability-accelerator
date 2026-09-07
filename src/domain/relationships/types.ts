import type { Criticality, EntityType } from '../entities/types'

export type RelationshipType =
  | 'supports'
  | 'realizes'
  | 'uses'
  | 'integrates'
  | 'exchanges'
  | 'stores'
  | 'runs-on'
  | 'evidences'
  | 'addresses'
  | 'implements'
  | 'measures'
  | 'depends-on'
  | 'owns'
  | 'creates-risk-for'
  | 'delivered-through'
  | 'executes'
  | 'decides'

export interface EnterpriseRelationship {
  id: string
  tenantId: string
  sourceId: string
  sourceType: EntityType
  targetId: string
  targetType: EntityType
  relationshipType: RelationshipType
  description?: string
  criticality?: Criticality
  evidenceIds: string[]
}
