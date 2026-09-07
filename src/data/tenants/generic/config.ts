import type { TenantConfig } from '@/domain/tenants/config'

/** Tenant presentation & demo configuration for Acme Enterprise Group (synthetic). */
export const genericConfig: TenantConfig = {
  code: 'GENERIC',
  tenantId: 'tenant-gen',
  displayName: 'Acme Enterprise Group',
  shortName: 'Acme',
  lettermark: 'AE',
  tenantType: 'Multi-business enterprise group',
  description:
    'Synthetic multi-division enterprise demonstrating customer experience unification, portfolio simplification, and data platform consolidation themes.',
  geographicContext: 'Multi-region operations across North America and EMEA',
  industry: 'Diversified enterprise (manufacturing, services, digital)',
  currency: 'USD',
  primaryExecutiveRole: 'Group Chief Executive',
  roleLabels: [
    { id: 'group-ceo', label: 'Group Chief Executive' },
    { id: 'division-president', label: 'Division President' },
    { id: 'group-cio', label: 'Group CIO' },
    { id: 'group-cdo', label: 'Group Chief Data Officer' },
    { id: 'group-cfo', label: 'Group CFO' },
    { id: 'enterprise-architect', label: 'Enterprise Architect' },
    { id: 'portfolio-board', label: 'Portfolio Review Board' },
    { id: 'transformation-office', label: 'Transformation Office' },
  ],
  businessTerminology: {
    customer: 'Customer or account',
    product: 'Product or service offering',
    division: 'Business division',
    initiative: 'Transformation initiative',
    capability: 'Business capability',
  },
  capabilityDomainLabels: [
    'Customer Experience',
    'Product and Service Delivery',
    'Shared Services',
    'Finance and Control',
    'People and Workforce',
    'Supply and Operations',
    'Digital Platforms',
    'Data and Insights',
    'Risk and Compliance',
    'Technology Operations',
  ],
  defaultScenarioId: 'scenario-gen-cx',
  defaultReportingPeriod: 'FY2026 Q2',
  enabledFeatures: [
    'executive-cockpit',
    'relationship-explorer',
    'applications-view',
    'integrations-view',
    'findings-view',
    'recommendations-view',
    'roadmap-view',
    'ai-assist',
    'governance-view',
  ],
  syntheticDisclaimer:
    'Synthetic demonstration data for Acme Enterprise Group themes. Not a real enterprise architecture, application inventory, or risk register.',
  accentColor: '#2d5a87',
  storyline:
    'Acme Enterprise Group operates multiple divisions with overlapping customer channels, duplicated application portfolios, and fragmented analytics. Customer data diverges across web, contact centre, and partner portals; legacy intake and shadow integrations persist on critical paths; spreadsheet analytics and parallel BI tools undermine a single source of truth. Transformation programmes need clearer capability linkage and earlier architecture review.',
  suggestedQuestions: [
    'Where does customer profile data diverge across channels?',
    'Which CRM and service-desk applications overlap in capability coverage?',
    'What integrations bypass the enterprise hub on customer order flows?',
    'How many analytics platforms publish the same revenue KPIs?',
    'Which legacy applications are approaching end of support?',
    'What initiatives lack capability or objective linkage?',
    'Show the Customer Experience fragmentation scenario chain.',
    'Which critical findings still lack an approved decision?',
  ],
}

export default genericConfig
