export const domains = [
  ['Strategy', '3.0', '#2f5cff'],
  ['Governance', '1.8', '#eb4d4d'],
  ['Business', '2.1', '#c98500'],
  ['Data', '2.5', '#2f5cff'],
  ['Applications', '2.8', '#2f5cff'],
  ['Integration & APIs', '2.0', '#c98500'],
  ['Security', '2.2', '#c98500'],
  ['Infrastructure & Cloud', '2.7', '#2f5cff'],
  ['Resilience', '2.4', '#2f5cff'],
  ['Technology Standards', '1.9', '#eb4d4d'],
  ['AI Governance', '1.2', '#eb4d4d'],
  ['People & Capability', '2.0', '#c98500'],
]

export const navGroups = [
  ['Workspace', [['Overview', 'overview', '⌘']]],
  [
    'Assess',
    [
      ['Assessment', 'assessment', '▣'],
      ['Findings', 'findings', '⚑', '9'],
      ['Evidence', 'evidence', '▤'],
    ],
  ],
  [
    'Improve',
    [
      ['Recommendations', 'recommendations', '✓'],
      ['Roadmap', 'roadmap', '⌁'],
    ],
  ],
  [
    'Govern',
    [
      ['Architecture Reviews', 'reviews', '⚖'],
      ['Decisions', 'decisions', '▧'],
      ['Exceptions', 'exceptions', '◈'],
      ['Standards', 'standards', '⌁'],
    ],
  ],
  ['Capability', [['People & Skills', 'people', '♙']]],
  [
    'Measure',
    [
      ['KPIs', 'kpis', '▥'],
      ['Executive Report', 'report', '▤'],
    ],
  ],
  [
    'Admin',
    [
      ['Organisation', 'organisation', '▦'],
      ['Assessment Model', 'assessment-model', '◔'],
      ['Settings', 'settings', '⌘'],
    ],
  ],
]

export const organisations = [
  'National Digital Bank — Demo Organisation',
  'Ghana Revenue Authority — Demo',
  'Bank of Ghana — Demo',
  'Development Bank Ghana — Demo',
  'Consolidated Bank Ghana — Demo',
  'Fidelity Bank Ghana — Demo',
]

export const searchableExtra = [
  ['AI agents deployed without architecture governance', 'findings', 'Finding'],
  ['22% of APIs lack documented ownership', 'findings', 'Finding'],
  ['Establish Architecture Review Board', 'recommendations', 'Recommendation'],
  ['Enterprise API standards', 'standards', 'Standard'],
  ['WSO2 API Manager', 'standards', 'Technology'],
]

export const moduleData = {
  assessment: {
    title: 'Assessment Workspace',
    desc: 'Assess all 12 enterprise architecture domains, capture evidence, score maturity and identify gaps.',
    metrics: [
      ['Overall maturity', '2.3 / 5'],
      ['Target', '3.5 / 5'],
      ['Assessment complete', '78%'],
      ['Evidence completeness', '64%'],
    ],
    type: 'assessment-cards',
  },
  findings: {
    title: 'Findings & Risk Register',
    desc: 'One view of architecture gaps, business impact, risk, ownership and remediation.',
    metrics: [
      ['Open findings', '29'],
      ['Critical', '5'],
      ['High', '8'],
      ['Overdue', '4'],
    ],
    type: 'table',
    columns: ['Finding', 'Domain', 'Risk', 'Business Impact', 'Owner', 'Status'],
    rows: [
      [
        'Architecture Review Board lacks decision authority',
        'Governance',
        { tag: 'red', text: 'Critical' },
        'Transformation decisions can bypass EA controls',
        'Chief Architect',
        'Open',
      ],
      [
        '22% of APIs lack documented ownership',
        'Integration & APIs',
        { tag: 'red', text: 'Critical' },
        'Higher operational and security exposure',
        'Head of Integration',
        'Open',
      ],
      [
        'Cloud landing-zone controls vary by workload',
        'Infrastructure & Cloud',
        { tag: 'amber', text: 'High' },
        'Inconsistent security and resilience posture',
        'Cloud Lead',
        'In progress',
      ],
      [
        'Technology standards catalogue is incomplete',
        'Technology Standards',
        { tag: 'amber', text: 'High' },
        'Duplicate technologies and lifecycle risk',
        'EA Office',
        'Open',
      ],
    ],
  },
  evidence: {
    title: 'Evidence',
    desc: 'Evidence supporting maturity scores, findings and architecture decisions.',
    metrics: [
      ['Evidence items', '126'],
      ['Verified', '81'],
      ['Needs review', '29'],
      ['Missing', '16'],
    ],
    type: 'table',
    columns: ['Evidence', 'Domain', 'Type', 'Confidence', 'Owner'],
    rows: [
      ['EA Charter FY2026', 'Governance', 'Document', { tag: 'green', text: 'High' }, 'EA Office'],
      [
        'API Inventory Export',
        'Integration & APIs',
        'System extract',
        { tag: 'amber', text: 'Medium' },
        'Integration Team',
      ],
      [
        'Cloud Platform Standards',
        'Infrastructure & Cloud',
        'Policy',
        { tag: 'green', text: 'High' },
        'Cloud Team',
      ],
    ],
  },
  recommendations: {
    title: 'Recommendations',
    desc: 'Prioritised actions that convert architecture gaps into business outcomes.',
    metrics: [
      ['Recommendations', '24'],
      ['P1', '7'],
      ['In progress', '9'],
      ['Completed', '5'],
    ],
    type: 'cards',
    cards: [
      {
        tag: { className: 'red', text: '0–30 days · P1' },
        title: 'Establish Architecture Review Board',
        body: 'Define decision rights, mandatory review gates and evidence-based approval criteria.',
      },
      {
        tag: { className: 'red', text: '31–90 days · P1' },
        title: 'Establish enterprise API standards',
        body: 'Create ownership, lifecycle, security, observability and reuse standards for APIs.',
      },
      {
        tag: { className: 'amber', text: '3–6 months · P2' },
        title: 'Standardise cloud landing zones',
        body: 'Define approved platform controls, resilience patterns and security baselines.',
      },
    ],
  },
  roadmap: {
    title: 'EA Roadmap',
    desc: 'A sequenced improvement journey across governance, platforms, standards and capability.',
    metrics: [
      ['0–90 day actions', '12'],
      ['3–6 month actions', '18'],
      ['6–12 month actions', '14'],
      ['Dependencies', '9'],
    ],
    type: 'table',
    columns: ['Workstream', '0–90 Days', '3–6 Months', '6–12 Months'],
    rows: [
      ['Governance', 'Review Board + project gates', 'Compliance KPIs', 'Continuous governance'],
      ['Integration', 'API standards', 'API catalogue + observability', 'Reuse metrics'],
      ['Cloud', 'Landing-zone controls', 'Lifecycle + FinOps', 'Policy automation'],
      ['AI Governance', 'AI use-case inventory', 'Architecture standards', 'Model/agent governance'],
    ],
  },
  reviews: {
    title: 'Architecture Reviews',
    desc: 'Operational governance for programmes, projects and material architecture changes.',
    metrics: [
      ['Open reviews', '14'],
      ['Approved', '36'],
      ['Conditional', '9'],
      ['Rework required', '4'],
    ],
    type: 'table',
    columns: ['Project', 'Review Type', 'Domain', 'Architect', 'Decision', 'Status'],
    rows: [
      [
        'Digital Banking Modernisation',
        'Solution Review',
        'Applications',
        'A. Mensah',
        { tag: 'amber', text: 'Approved with Conditions' },
        'Open',
      ],
      [
        'API Partner Gateway',
        'Architecture Gate',
        'Integration & APIs',
        'K. Owusu',
        { tag: 'green', text: 'Approved' },
        'Closed',
      ],
    ],
  },
  decisions: {
    title: 'Architecture Decisions',
    desc: 'Evidence-backed decisions with rationale, options and impacted systems.',
    metrics: [
      ['Decisions', '67'],
      ['This quarter', '11'],
      ['Superseded', '5'],
      ['Pending', '4'],
    ],
    type: 'table',
    columns: ['Decision', 'Context', 'Owner', 'Date', 'Status'],
    rows: [
      [
        'Adopt API-first integration standard',
        'Reduce point-to-point integrations',
        'Chief Architect',
        '12 Aug 2026',
        { tag: 'green', text: 'Approved' },
      ],
      [
        'Standard Kubernetes platform baseline',
        'Platform consistency',
        'Cloud Architect',
        '03 Aug 2026',
        { tag: 'blue', text: 'Active' },
      ],
    ],
  },
  exceptions: {
    title: 'Architecture Exceptions',
    desc: 'Track deviations from standards, risk acceptance, expiry and remediation.',
    metrics: [
      ['Active exceptions', '11'],
      ['Expiring soon', '3'],
      ['High risk', '2'],
      ['Remediated', '18'],
    ],
    type: 'table',
    columns: ['Standard', 'Exception', 'Risk', 'Expiry', 'Remediation'],
    rows: [
      [
        'Approved Integration Pattern',
        'Legacy batch point-to-point',
        { tag: 'amber', text: 'High' },
        '30 Nov 2026',
        'Migrate to managed integration layer',
      ],
      [
        'Cloud Landing Zone',
        'Legacy workload exception',
        { tag: '', text: 'Medium' },
        '31 Dec 2026',
        'Replatform during Q4',
      ],
    ],
  },
  standards: {
    title: 'Technology Standards',
    desc: 'Lifecycle-aware standards for approved, tolerated, deprecated and retiring technologies.',
    metrics: [
      ['Standards', '143'],
      ['Strategic', '18'],
      ['Deprecated', '21'],
      ['Retire', '7'],
    ],
    type: 'table',
    columns: ['Technology', 'Category', 'Status', 'Owner', 'Approved Use'],
    rows: [
      ['Kubernetes', 'Platform', { tag: 'green', text: 'Strategic' }, 'Cloud Platform', 'Container workloads'],
      [
        'WSO2 API Manager',
        'Integration & APIs',
        { tag: 'green', text: 'Approved' },
        'Integration Architecture',
        'Enterprise API management',
      ],
      [
        'Legacy ESB v1',
        'Integration',
        { tag: 'amber', text: 'Deprecated' },
        'Integration Team',
        'Existing workloads only',
      ],
    ],
  },
  people: {
    title: 'People & Skills',
    desc: 'EA capability visibility across roles, domains, competency and development priorities.',
    metrics: [
      ['Architects', '18'],
      ['Enterprise Architects', '3'],
      ['Critical skill gaps', '2'],
      ['Avg competency', '2.6 / 5'],
    ],
    type: 'cards',
    cards: [
      {
        title: 'Business Architecture',
        tag: { className: 'red', text: 'HIGH GAP' },
        tagAfterTitle: true,
        body: 'Increase capability mapping, value-stream and operating-model expertise.',
      },
      {
        title: 'Security Architecture',
        tag: { className: 'red', text: 'HIGH GAP' },
        tagAfterTitle: true,
        body: 'Strengthen security design governance and review capability.',
      },
      {
        title: 'AI Architecture',
        tag: { className: 'red', text: 'CRITICAL GAP' },
        tagAfterTitle: true,
        body: 'Build governance, model-risk, agent-security and lifecycle skills.',
      },
    ],
  },
  kpis: {
    title: 'Business Value KPIs',
    desc: 'Measure whether Enterprise Architecture is improving transformation outcomes, not just producing artefacts.',
    metrics: [
      ['Projects reviewed', '83%'],
      ['Standards compliance', '68%'],
      ['Applications catalogued', '81%'],
      ['Recommendations completed', '48%'],
    ],
    type: 'table',
    columns: ['KPI', 'Current', 'Target', 'Trend'],
    rows: [
      [
        'Applications with identified owners',
        '72%',
        '90%',
        { tag: 'green', text: '↑ Improving' },
      ],
      ['Critical technologies mapped', '74%', '95%', { tag: 'green', text: '↑ Improving' }],
      ['Target roadmaps documented', '62%', '85%', { tag: 'amber', text: '→ Stable' }],
      ['Internal EA competency', '2.6 / 5', '3.5 / 5', { tag: 'green', text: '↑ Improving' }],
    ],
  },
  report: {
    title: 'Executive Report',
    desc: 'Board-ready view of architecture health, risks, priorities, roadmap and expected outcomes.',
    metrics: [
      ['Report pages', '7'],
      ['Critical risks', '5'],
      ['Strategic recommendations', '8'],
      ['90-day priorities', '12'],
    ],
    type: 'cards',
    cards: [
      {
        tag: { className: 'blue', text: 'Page 1' },
        title: 'Overall Architecture Health',
        body: '2.3 / 5 — Emerging. Governance, Integration & APIs and AI Governance constrain transformation control.',
      },
      {
        tag: { className: 'blue', text: 'Page 2' },
        title: 'Domain Maturity Heatmap',
        body: '12-domain current and target maturity with risk interpretation.',
      },
      {
        tag: { className: 'blue', text: 'Page 3' },
        title: 'Top Risks',
        body: 'Executive summary of the most material transformation risks and owners.',
      },
      {
        tag: { className: 'blue', text: 'Page 4' },
        title: 'Strategic Recommendations',
        body: 'Prioritised interventions linked to business outcomes.',
      },
      {
        tag: { className: 'blue', text: 'Page 5' },
        title: '90-Day Priorities',
        body: 'Immediate actions to establish control and visible momentum.',
      },
      {
        tag: { className: 'blue', text: 'Page 6–7' },
        title: '12-Month Roadmap & Outcomes',
        body: 'Target maturity progression and measurable expected outcomes.',
      },
    ],
  },
  organisation: {
    title: 'Organisation',
    desc: 'Manage organisation context used by assessments, governance and reporting.',
    metrics: [
      ['Employees', '2,500'],
      ['Applications', '65'],
      ['APIs', '180'],
      ['Data centres', '2'],
    ],
    type: 'cards',
    cards: [
      {
        title: 'National Digital Bank — Demo Organisation',
        body: 'Hybrid infrastructure, growing cloud adoption, digital banking programme and AI initiatives underway.',
      },
      {
        title: 'Business Context',
        body: 'Regulated financial institution with mission-critical digital services and multi-vendor technology estate.',
      },
      {
        title: 'Data Classification',
        body: null,
        tagInline: { className: 'blue', text: 'Illustrative Data' },
        bodyAfter: ' This prototype does not claim live customer data.',
      },
    ],
  },
  'assessment-model': {
    title: 'Assessment Model',
    desc: 'Configure EA360’s maturity model, domains, capabilities and assessment criteria.',
    metrics: [
      ['Domains', '12'],
      ['Maturity levels', '5'],
      ['Criteria', '118'],
      ['Active version', 'v0.1'],
    ],
    type: 'table',
    columns: ['Level', 'Name', 'Description'],
    rows: [
      ['1', 'Initial', 'Ad hoc, reactive and dependent on individuals.'],
      ['2', 'Emerging', 'Some repeatable practices exist but adoption is inconsistent.'],
      ['3', 'Defined', 'Documented processes, standards and governance are broadly adopted.'],
      ['4', 'Managed', 'Practices are measured, governed and connected to business outcomes.'],
      ['5', 'Optimised', 'Continuous improvement and architecture-driven strategic planning.'],
    ],
  },
  settings: {
    title: 'Settings',
    desc: 'Prototype-level application preferences and future enterprise configuration.',
    metrics: [
      ['Deployment', 'Prototype'],
      ['Authentication', 'Demo'],
      ['RBAC', 'Planned'],
      ['Audit logs', 'Planned'],
    ],
    type: 'cards',
    cards: [
      {
        title: 'Security & Access',
        body: 'SSO/OIDC, RBAC, audit logs, data residency and retention are future enterprise controls.',
        footerTag: { className: '', text: 'Coming Soon' },
      },
      {
        title: 'Integrations',
        body: 'Future connections to architecture repositories, ITSM, CMDB and evidence sources.',
        footerTag: { className: '', text: 'Coming Soon' },
      },
      {
        title: 'AI Assistance',
        body: 'Future evidence summarisation, maturity suggestions and recommendation drafting.',
        footerTag: { className: '', text: 'Coming Soon' },
      },
    ],
  },
}
