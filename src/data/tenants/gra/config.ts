import type { TenantConfig } from '@/domain/tenants/config'
import { SUGGESTED_QUESTIONS } from '@/lib/ai/intents'

/** Tenant presentation & demo configuration for Ghana Revenue Authority (synthetic). */
export const graConfig: TenantConfig = {
  code: 'GRA',
  tenantId: 'tenant-gra',
  displayName: 'Ghana Revenue Authority',
  shortName: 'GRA',
  lettermark: 'GR',
  tenantType: 'Revenue authority',
  description:
    'Synthetic demonstration of revenue-administration capability, application portfolio and transformation journeys across tax and customs services.',
  geographicContext: 'Ghana',
  industry: 'Public revenue administration',
  currency: 'GHS',
  primaryExecutiveRole: 'executive',
  roleLabels: [
    { id: 'executive', label: 'Executive Committee' },
    { id: 'cio', label: 'CIO / CTO' },
    { id: 'enterprise-architect', label: 'Enterprise architect' },
    { id: 'transformation-leader', label: 'Transformation leader' },
    { id: 'risk-leader', label: 'Risk / compliance' },
  ],
  businessTerminology: {
    taxpayer: 'Taxpayer',
    return: 'Tax return / filing',
    customs: 'Customs declaration',
    tin: 'Taxpayer identification number',
    revenue: 'Assessed / collected revenue',
  },
  capabilityDomainLabels: [
    'Taxpayer Management',
    'Tax Operations',
    'Customs Operations',
    'Payments and Collections',
    'Revenue Assurance',
    'Digital Channels',
    'Data and Analytics',
    'Technology Operations',
  ],
  defaultScenarioId: 'scenario-identity',
  defaultReportingPeriod: 'FY2026 Q2',
  enabledFeatures: [
    'executive-cockpit',
    'capabilities',
    'applications',
    'integrations',
    'findings',
    'recommendations',
    'roadmap',
    'relationship-explorer',
    'ai-assist',
    'governance',
    'evidence',
  ],
  syntheticDisclaimer:
    'Synthetic demonstration data for Ghana Revenue Authority themes. Not an official GRA architecture, inventory, or risk register.',
  accentColor: '#0e7c66',
  storyline:
    'Improve revenue assurance, taxpayer experience and interoperability across tax and customs services. Fragmented taxpayer identity, brittle point-to-point integrations, legacy customs components and incomplete evidence on critical findings slow transformation.',
  suggestedQuestions: [...SUGGESTED_QUESTIONS],
}

export default graConfig
