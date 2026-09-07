import type { TenantPack } from '../../../domain/schemas'

const now = '2026-09-01T00:00:00.000Z'

export function entityBase(
  tenantId: string,
  id: string,
  name: string,
  description: string,
  ownerId: string,
  status: TenantPack['capabilities'][number]['status'] = 'active',
  tags: string[] = [],
  sourceRefs: string[] = ['synthetic-seed'],
) {
  return {
    id,
    tenantId,
    name,
    description,
    status,
    ownerId,
    createdAt: now,
    updatedAt: now,
    dataQuality: 'high' as const,
    sourceRefs,
    tags,
  }
}

export function rel(
  tenantId: string,
  id: string,
  sourceId: string,
  sourceType: string,
  targetId: string,
  targetType: string,
  relationshipType: string,
  evidenceIds: string[] = [],
  criticality?: 'critical' | 'high' | 'medium' | 'low',
  description?: string,
) {
  return {
    id,
    tenantId,
    sourceId,
    sourceType,
    targetId,
    targetType,
    relationshipType,
    evidenceIds,
    criticality,
    description,
  }
}
