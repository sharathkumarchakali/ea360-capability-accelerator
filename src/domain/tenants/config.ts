/** Tenant configuration - product metadata separate from entity pack data. */

/** Seed tenants that ship with validated synthetic packs. */
export type SeedTenantCode = 'GRA' | 'BOG' | 'FIDELITY' | 'GENERIC'

/** Seed code or a runtime prospect workspace code (see runtimeWorkspaces). */
export type TenantCode = SeedTenantCode | (string & {})

export type TenantRoleOption = {
  id: string
  label: string
}

export type TenantConfig = {
  code: TenantCode
  tenantId: string
  displayName: string
  shortName: string
  tenantType: string
  description: string
  geographicContext: string
  industry: string
  currency: string
  primaryExecutiveRole: string
  roleLabels: TenantRoleOption[]
  businessTerminology: Record<string, string>
  capabilityDomainLabels: string[]
  defaultScenarioId: string
  defaultReportingPeriod: string
  enabledFeatures: string[]
  syntheticDisclaimer: string
  lettermark: string
  accentColor?: string
  storyline: string
  suggestedQuestions: string[]
  /** Runtime prospect workspace metadata (absent on seed tenants). */
  runtime?: boolean
  starterCode?: SeedTenantCode
  timezone?: string
  country?: string
  createdAt?: string
}

export const DEFAULT_SYNTHETIC_DISCLAIMER =
  'Synthetic demonstration data - not supplied or validated by the named institution.'