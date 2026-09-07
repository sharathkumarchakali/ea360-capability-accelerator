/** Tenant configuration - product metadata separate from entity pack data. */

export type TenantCode = 'GRA' | 'BOG' | 'FIDELITY' | 'GENERIC'

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
}

export const DEFAULT_SYNTHETIC_DISCLAIMER =
  'Synthetic demonstration data - not supplied or validated by the named institution.'