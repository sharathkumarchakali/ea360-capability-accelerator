import fs from 'fs'
import path from 'path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')

function w(rel, content) {
  const p = path.join(root, rel)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.writeFileSync(p, content, 'utf8')
}

// --- aiDataGovernance.ts ---
w(
  'src/data/tenants/gra/aiDataGovernance.ts',
  `export type GovernancePolicyStatus = 'Active' | 'Draft' | 'Under Review' | 'Retired'

export type GovernanceItemType = 'Policy' | 'Control' | 'Standard'

export type GovernancePolicyRecord = {
  id: string
  name: string
  scope: string
  type: GovernanceItemType
  owner: string
  status: GovernancePolicyStatus
  applicableAssetIds: string[]
  reviewDate: string
  exceptionIds: string[]
  summary: string
  requirements: string[]
}

export type GovernanceApprovalStatus =
  | 'Pending'
  | 'Approved'
  | 'Approved with Conditions'
  | 'Rejected'
  | 'Expired'

export type GovernanceApprovalRecord = {
  id: string
  item: string
  itemType: 'AI Solution' | 'Data Domain' | 'Control Exception' | 'Model Release'
  subjectId: string
  owner: string
  risk: string
  approver: string
  decision: GovernanceApprovalStatus
  conditions: string[]
  expiry: string | null
  status: GovernanceApprovalStatus
  submittedAt: string
  notes?: string
}

export type GovernanceExceptionRecord = {
  id: string
  title: string
  subjectId: string
  subjectType: 'aiSolution' | 'dataObject' | 'policy'
  owner: string
  risk: string
  approver: string
  decision: 'Active' | 'Expired' | 'Revoked'
  conditions: string[]
  expiry: string
  status: 'Active' | 'Expired' | 'Revoked'
  policyId?: string
  rationale: string
}

export type AiApprovalOverride = {
  approvalStatus: GovernanceApprovalStatus
  approver?: string
  conditions?: string[]
  expiry?: string | null
}

export type GovernanceCatalog = {
  tenantCode: string
  featuredAiSolutionIds: string[]
  featuredDataObjectIds: string[]
  policies: GovernancePolicyRecord[]
  aiApprovalOverrides: Record<string, AiApprovalOverride>
  approvals: GovernanceApprovalRecord[]
  exceptions: GovernanceExceptionRecord[]
}

const POLICIES: GovernancePolicyRecord[] = [
  {
    id: 'POL-AI-001',
    name: 'AI Usage Policy',
    scope: 'Enterprise AI solutions, copilots and agents',
    type: 'Policy',
    owner: 'Chief Data & Analytics Officer',
    status: 'Active',
    applicableAssetIds: ['ai-gra-01', 'ai-gra-05', 'ai-gra-16', 'ai-gra-08'],
    reviewDate: '2026-12-15',
    exceptionIds: ['exc-gra-ai-002'],
    summary: 'Defines permitted AI use, prohibited actions and escalation paths for revenue-facing automation.',
    requirements: [
      'Document business purpose and owner before production use',
      'Classify risk before expanding autonomy or data scope',
      'Maintain human accountability for taxpayer-facing advice',
    ],
  },
  {
    id: 'POL-AI-002',
    name: 'Human Oversight Policy',
    scope: 'Agents and workflows with autonomy level 2+',
    type: 'Policy',
    owner: 'Enterprise Architecture',
    status: 'Active',
    applicableAssetIds: ['ai-gra-05', 'ai-gra-08', 'ai-gra-16'],
    reviewDate: '2027-01-31',
    exceptionIds: ['exc-gra-ai-001'],
    summary: 'Requires documented human oversight, override paths and exception handling for autonomous actions.',
    requirements: [
      'Name oversight role and escalation owner',
      'Exception-based review for level 3+ agents',
      'Periodic review for predictive models influencing assurance priorities',
    ],
  },
  {
    id: 'CTL-AI-003',
    name: 'Agent Permission Control',
    scope: 'Tool integrations accessed by AI agents',
    type: 'Control',
    owner: 'CISO Office',
    status: 'Active',
    applicableAssetIds: ['ai-gra-05', 'ai-gra-16', 'ai-gra-08'],
    reviewDate: '2026-11-30',
    exceptionIds: ['exc-gra-ai-001'],
    summary: 'Least-privilege permissions for agent READ/WRITE/EXECUTE access with integration owner sign-off.',
    requirements: [
      'Inventory integrations and permission level per agent',
      'Separate read-only copilots from execute-capable agents',
      'Re-certify permissions quarterly for production agents',
    ],
  },
  {
    id: 'POL-DATA-004',
    name: 'Sensitive Data Handling Policy',
    scope: 'Restricted and highly sensitive data domains',
    type: 'Policy',
    owner: 'Data Protection Lead',
    status: 'Active',
    applicableAssetIds: ['data-gra-01', 'data-gra-04', 'data-gra-09'],
    reviewDate: '2026-10-20',
    exceptionIds: ['exc-gra-data-001'],
    summary: 'Classification, access and sharing rules for taxpayer, payment and compliance information.',
    requirements: [
      'Apply classification labels before new sharing patterns',
      'Document lawful basis for cross-channel reuse',
      'Mask direct identifiers in non-production analytics sandboxes',
    ],
  },
  {
    id: 'STD-DATA-001',
    name: 'Data Ownership Standard',
    scope: 'Enterprise data domains',
    type: 'Standard',
    owner: 'Chief Data Officer',
    status: 'Active',
    applicableAssetIds: ['data-gra-01', 'data-gra-04', 'data-gra-05', 'data-gra-06', 'data-gra-09'],
    reviewDate: '2027-03-01',
    exceptionIds: [],
    summary: 'Requires business owner, data steward and technical custodian for governed domains.',
    requirements: [
      'Publish RACI for each critical domain',
      'Steward approves schema and quality rule changes',
      'Custodian maintains platform controls and residency posture',
    ],
  },
  {
    id: 'POL-DATA-005',
    name: 'Data Residency Policy',
    scope: 'Cross-border and hosted analytics workloads',
    type: 'Policy',
    owner: 'Legal & Compliance',
    status: 'Active',
    applicableAssetIds: ['data-gra-04', 'data-gra-06', 'data-gra-08'],
    reviewDate: '2026-09-30',
    exceptionIds: ['exc-gra-data-002'],
    summary: 'Residency review for payment, customs and risk data used in external model hosting.',
    requirements: [
      'Confirm hosting region before production AI training',
      'Document cross-border transfers with review date',
      'Prefer in-country processing for taxpayer identity data',
    ],
  },
  {
    id: 'CTL-AI-004',
    name: 'Model Risk Control',
    scope: 'Predictive models and scoring services',
    type: 'Control',
    owner: 'Model Risk Forum',
    status: 'Active',
    applicableAssetIds: ['ai-gra-06', 'ai-gra-11', 'ai-gra-16'],
    reviewDate: '2026-12-01',
    exceptionIds: [],
    summary: 'Validation, bias review and performance monitoring for models affecting revenue outcomes.',
    requirements: [
      'Baseline and challenger metrics before production promotion',
      'Document training data lineage',
      'Trigger review when drift exceeds agreed thresholds',
    ],
  },
  {
    id: 'CTL-AI-005',
    name: 'Monitoring Requirement',
    scope: 'Production AI and automated workflows',
    type: 'Control',
    owner: 'Technology Operations',
    status: 'Active',
    applicableAssetIds: ['ai-gra-01', 'ai-gra-05', 'ai-gra-08', 'ai-gra-11'],
    reviewDate: '2026-08-31',
    exceptionIds: [],
    summary: 'Operational monitoring, audit logs and incident hooks for AI-mediated enterprise actions.',
    requirements: [
      'Retain decision logs for agent execute actions',
      'Alert on permission denials and guardrail triggers',
      'Link monitoring gaps to architecture findings',
    ],
  },
]

export const graGovernanceCatalog: GovernanceCatalog = {
  tenantCode: 'GRA',
  featuredAiSolutionIds: [
    'ai-gra-01',
    'ai-gra-05',
    'ai-gra-06',
    'ai-gra-08',
    'ai-gra-11',
    'ai-gra-16',
  ],
  featuredDataObjectIds: [
    'data-gra-01',
    'data-gra-04',
    'data-gra-05',
    'data-gra-06',
    'data-gra-09',
  ],
  policies: POLICIES,
  aiApprovalOverrides: {
    'ai-gra-01': { approvalStatus: 'Approved', approver: 'AI Governance Board', expiry: '2027-06-30' },
    'ai-gra-05': {
      approvalStatus: 'Approved with Conditions',
      approver: 'CISO Office',
      conditions: ['Complete permission re-certification by Q4', 'Document supervisor override runbook'],
      expiry: '2026-12-31',
    },
    'ai-gra-06': { approvalStatus: 'Approved', approver: 'Revenue Assurance Director', expiry: '2027-03-31' },
    'ai-gra-08': {
      approvalStatus: 'Approved with Conditions',
      approver: 'Architecture Review Board',
      conditions: ['Match proposals require analyst sign-off for high-value cases'],
      expiry: '2027-01-31',
    },
    'ai-gra-11': { approvalStatus: 'Pending', approver: 'Model Risk Forum', expiry: null },
    'ai-gra-16': {
      approvalStatus: 'Approved with Conditions',
      approver: 'Border Operations Director',
      conditions: ['Execute permissions limited to advisory preparation only'],
      expiry: '2026-11-15',
    },
  },
  approvals: [
    {
      id: 'appr-gra-ai-001',
      item: 'Taxpayer Service Copilot production release',
      itemType: 'AI Solution',
      subjectId: 'ai-gra-01',
      owner: 'AI Enablement Lead',
      risk: 'Medium',
      approver: 'AI Governance Board',
      decision: 'Approved',
      conditions: [],
      expiry: '2027-06-30',
      status: 'Approved',
      submittedAt: '2026-04-12',
    },
    {
      id: 'appr-gra-ai-002',
      item: 'IT Service Desk Agent autonomy expansion',
      itemType: 'AI Solution',
      subjectId: 'ai-gra-05',
      owner: 'IT Operations Manager',
      risk: 'High',
      approver: 'CISO Office',
      decision: 'Approved with Conditions',
      conditions: ['Quarterly permission review', 'Supervisor override within 4 hours'],
      expiry: '2026-12-31',
      status: 'Approved with Conditions',
      submittedAt: '2026-07-18',
    },
    {
      id: 'appr-gra-ai-003',
      item: 'Leakage Anomaly Detector model promotion',
      itemType: 'Model Release',
      subjectId: 'ai-gra-11',
      owner: 'Assurance Data Scientist',
      risk: 'High',
      approver: 'Model Risk Forum',
      decision: 'Pending',
      conditions: ['Awaiting challenger model comparison'],
      expiry: null,
      status: 'Pending',
      submittedAt: '2026-08-28',
    },
    {
      id: 'appr-gra-data-001',
      item: 'Taxpayer Data stewardship confirmation',
      itemType: 'Data Domain',
      subjectId: 'data-gra-01',
      owner: 'Chief Data Officer',
      risk: 'High',
      approver: 'Data Governance Council',
      decision: 'Approved with Conditions',
      conditions: ['Complete overlap remediation with TIN registry initiative'],
      expiry: '2027-02-28',
      status: 'Approved with Conditions',
      submittedAt: '2026-05-02',
    },
    {
      id: 'appr-gra-data-002',
      item: 'Payment Data residency review',
      itemType: 'Data Domain',
      subjectId: 'data-gra-04',
      owner: 'Payments Platform Owner',
      risk: 'Medium',
      approver: 'Legal & Compliance',
      decision: 'Pending',
      conditions: [],
      expiry: null,
      status: 'Pending',
      submittedAt: '2026-09-01',
    },
    {
      id: 'appr-gra-ai-004',
      item: 'Legacy analytics copilot experiment',
      itemType: 'AI Solution',
      subjectId: 'ai-gra-19',
      owner: 'Analytics Lead',
      risk: 'Low',
      approver: 'AI Governance Board',
      decision: 'Rejected',
      conditions: ['Insufficient monitoring and data approval documentation'],
      expiry: null,
      status: 'Rejected',
      submittedAt: '2026-03-08',
      notes: 'Resubmit after monitoring control CTL-AI-005 is satisfied.',
    },
    {
      id: 'appr-gra-ai-005',
      item: 'Pilot document assistant retirement',
      itemType: 'AI Solution',
      subjectId: 'ai-gra-14',
      owner: 'Digital Channels Architect',
      risk: 'Low',
      approver: 'AI Governance Board',
      decision: 'Expired',
      conditions: [],
      expiry: '2026-06-30',
      status: 'Expired',
      submittedAt: '2025-11-20',
    },
  ],
  exceptions: [
    {
      id: 'exc-gra-ai-001',
      title: 'Temporary elevated execute permissions for service desk agent',
      subjectId: 'ai-gra-05',
      subjectType: 'aiSolution',
      owner: 'IT Operations Manager',
      risk: 'High',
      approver: 'CISO Office',
      decision: 'Active',
      conditions: ['Limited to password reset and ticket update flows', 'Expires end of peak season'],
      expiry: '2026-12-31',
      status: 'Active',
      policyId: 'CTL-AI-003',
      rationale: 'Peak filing season workload; full permission hardening tracked in initiative backlog.',
    },
    {
      id: 'exc-gra-ai-002',
      title: 'Copilot knowledge source refresh deferral',
      subjectId: 'ai-gra-01',
      subjectType: 'aiSolution',
      owner: 'AI Enablement Lead',
      risk: 'Medium',
      approver: 'AI Governance Board',
      decision: 'Active',
      conditions: ['Manual review of outbound templates until refresh completes'],
      expiry: '2026-10-31',
      status: 'Active',
      policyId: 'POL-AI-001',
      rationale: 'Procedure library migration in progress; refresh scheduled with content owners.',
    },
    {
      id: 'exc-gra-data-001',
      title: 'Compliance case analytics sandbox access',
      subjectId: 'data-gra-09',
      subjectType: 'dataObject',
      owner: 'Audit Case Director',
      risk: 'High',
      approver: 'Data Protection Lead',
      decision: 'Active',
      conditions: ['Pseudonymised extracts only', 'No export outside approved workspace'],
      expiry: '2026-11-30',
      status: 'Active',
      policyId: 'POL-DATA-004',
      rationale: 'Short-term analytics pilot while case platform API controls are enhanced.',
    },
    {
      id: 'exc-gra-data-002',
      title: 'Cross-border risk score replication',
      subjectId: 'data-gra-08',
      subjectType: 'dataObject',
      owner: 'Customs Risk Director',
      risk: 'Medium',
      approver: 'Legal & Compliance',
      decision: 'Expired',
      conditions: [],
      expiry: '2026-06-30',
      status: 'Expired',
      policyId: 'POL-DATA-005',
      rationale: 'Expired replication waiver; renewed residency assessment required.',
    },
  ],
}

export const genericGovernanceCatalog: GovernanceCatalog = {
  tenantCode: 'GENERIC',
  featuredAiSolutionIds: [],
  featuredDataObjectIds: [],
  policies: [
    {
      id: 'POL-AI-001',
      name: 'AI Usage Policy',
      scope: 'Enterprise',
      type: 'Policy',
      owner: 'Enterprise Architecture',
      status: 'Draft',
      applicableAssetIds: [],
      reviewDate: '2027-01-01',
      exceptionIds: [],
      summary: 'Template AI usage policy for demonstration tenants.',
      requirements: ['Define owners', 'Classify risk', 'Document oversight'],
    },
  ],
  aiApprovalOverrides: {},
  approvals: [],
  exceptions: [],
}
`,
)

console.log('wrote aiDataGovernance.ts')
