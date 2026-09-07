import type { EntityType } from '@/domain/entities/types'
import type { GraphNode } from '@/domain/metrics/graph'

export type ExplorerRootCandidate = {
  id: string
  type: EntityType | string
} | null

export type ResolveExplorerRootInput = {
  /** Explicit navigation / store graph root */
  navRoot?: ExplorerRootCandidate
  /** Active scenario starting entity */
  scenarioRoot?: ExplorerRootCandidate
  /** Tenant-configured default explorer entity (optional) */
  configDefault?: ExplorerRootCandidate
  resolveEntity: (id: string) => GraphNode | null
  listApplications: () => Array<{ id: string; name: string; criticality?: string }>
  listCapabilities: () => Array<{ id: string; name: string; riskScore?: number }>
}

/**
 * Safe Explorer root resolution. Never throws; returns null when empty-state is required.
 * Order: nav → scenario → config default → first critical app/capability → null
 */
export function resolveExplorerRoot(input: ResolveExplorerRootInput): GraphNode | null {
  const tryResolve = (candidate?: ExplorerRootCandidate): GraphNode | null => {
    if (!candidate?.id) return null
    const node = input.resolveEntity(candidate.id)
    if (!node) return null
    return node
  }

  const fromNav = tryResolve(input.navRoot)
  if (fromNav) return fromNav

  const fromScenario = tryResolve(input.scenarioRoot)
  if (fromScenario) return fromScenario

  const fromConfig = tryResolve(input.configDefault)
  if (fromConfig) return fromConfig

  const apps = input.listApplications() || []
  const criticalApp =
    apps.find((a) => String(a.criticality || '').toLowerCase() === 'critical') || apps[0]
  if (criticalApp) {
    const node = input.resolveEntity(criticalApp.id)
    if (node) return node
  }

  const caps = [...(input.listCapabilities() || [])].sort(
    (a, b) => (b.riskScore || 0) - (a.riskScore || 0),
  )
  if (caps[0]) {
    const node = input.resolveEntity(caps[0].id)
    if (node) return node
  }

  return null
}
