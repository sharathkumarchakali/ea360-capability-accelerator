import type { TenantConfig } from '@/domain/tenants/config'

/** Tenant presentation & demo configuration for Bank of Ghana (synthetic). */
export const bogConfig: TenantConfig = {
  code: 'BOG',
  tenantId: 'tenant-bog',
  displayName: 'Bank of Ghana',
  shortName: 'BoG',
  lettermark: 'BG',
  tenantType: 'Central bank',
  description:
    'Synthetic demonstration of central-bank regulatory oversight, payment-system resilience, data governance and EA operationalisation.',
  geographicContext: 'Ghana',
  industry: 'Central banking and financial regulation',
  currency: 'GHS',
  primaryExecutiveRole: 'governor',
  roleLabels: [
    { id: 'governor', label: 'Governor' },
    { id: 'deputy-governor', label: 'Deputy Governor' },
    { id: 'executive', label: 'Executive Committee' },
    { id: 'cio', label: 'CIO/CTO' },
    { id: 'enterprise-architect', label: 'Architecture Review Board' },
    { id: 'risk-leader', label: 'Financial Stability Committee' },
    { id: 'transformation-leader', label: 'Risk and Compliance Committee' },
  ],
  businessTerminology: {
    returns: 'Supervisory / statistical returns',
    rtgs: 'Real-time gross settlement',
    supervision: 'Banking supervision',
    arb: 'Architecture Review Board',
    lineage: 'Regulatory data lineage',
  },
  capabilityDomainLabels: [
    'Monetary Policy',
    'Financial Stability',
    'Banking Supervision',
    'Payment Systems',
    'Currency and Issuance',
    'Reserves Management',
    'Regulatory Data',
    'Enterprise Architecture',
    'Cyber and Operational Resilience',
    'Technology Operations',
  ],
  defaultScenarioId: 'scenario-bog-payments',
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
    'Synthetic demonstration data for Bank of Ghana themes. Not an official BoG architecture, inventory, or risk register.',
  accentColor: '#1a4a66',
  storyline:
    'Strengthen regulatory oversight, operational resilience, data governance and EA operationalisation. Multiple reporting channels lack consistent definitions and lineage; payment-system dependencies concentrate resilience risk; technology end-of-support and late architecture reviews slow remediation; overlapping analytical platforms weaken data ownership; some transformation initiatives lack clear capability linkage.',
  suggestedQuestions: [
    'Where is regulatory reporting data lineage incomplete?',
    'Which payment-system integrations are single points of failure?',
    'What end-of-support technologies threaten RTGS and returns intake?',
    'Which analytical platforms duplicate supervisory data products?',
    'How many architecture reviews occurred after delivery started?',
    'What initiatives lack a clear capability or objective link?',
    'Show the Payment-System Resilience scenario chain.',
    'Which critical findings still lack an approved decision?',
  ],
}

export default bogConfig
