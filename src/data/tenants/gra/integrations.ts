import type { TenantPack } from '@/domain/schemas'

const T = 'tenant-gra'
const now = '2026-09-01T00:00:00.000Z'

function base(
  id: string,
  name: string,
  description: string,
  ownerId: string,
  status: TenantPack['integrations'][number]['status'] = 'active',
  tags: string[] = [],
) {
  return {
    id,
    tenantId: T,
    name,
    description,
    status,
    ownerId,
    createdAt: now,
    updatedAt: now,
    dataQuality: 'high' as const,
    sourceRefs: ['gra-seed-v2'],
    tags,
  }
}

type IntFields = {
  pattern: TenantPack['integrations'][number]['pattern']
  integrationType: TenantPack['integrations'][number]['integrationType']
  sourceApplicationId: string
  targetApplicationId: string
  direction?: TenantPack['integrations'][number]['direction']
  businessOwnerId: string
  technologyOwnerId: string
  supportedCapabilityIds?: string[]
  supportedProcessIds?: string[]
  apiOrInterfaceName: string
  protocol: string
  dataFormat?: string
  authenticationMethod?: string
  environment?: TenantPack['integrations'][number]['environment']
  lifecycleStatus: TenantPack['integrations'][number]['lifecycleStatus']
  criticality: TenantPack['integrations'][number]['criticality']
  reusabilityStatus: TenantPack['integrations'][number]['reusabilityStatus']
  consumerCount?: number
  transactionVolumeBand?: TenantPack['integrations'][number]['transactionVolumeBand']
  availabilityTarget?: string
  dataSensitivity?: TenantPack['integrations'][number]['dataSensitivity']
  lastReviewDate?: string
  documentationStatus: TenantPack['integrations'][number]['documentationStatus']
  monitoringStatus: TenantPack['integrations'][number]['monitoringStatus']
  pointToPoint: boolean
  middlewarePlatform?: string
  dataObjectIds?: string[]
  technologyIds?: string[]
  tags?: string[]
  status?: TenantPack['integrations'][number]['status']
  ownerId?: string
  providerApplicationId?: string
  consumerApplicationIds?: string[]
  integrationOwnerId?: string
  exposure?: TenantPack['integrations'][number]['exposure']
  portfolioDecision?: TenantPack['integrations'][number]['portfolioDecision']
  portfolioLifecycle?: TenantPack['integrations'][number]['portfolioLifecycle']
  assetType?: TenantPack['integrations'][number]['assetType']
  integrationPattern?: string
  architectureRisk?: TenantPack['integrations'][number]['architectureRisk']
  standardsCompliance?: TenantPack['integrations'][number]['standardsCompliance']
  reuseClassification?: TenantPack['integrations'][number]['reuseClassification']
  runtime?: string
  gateway?: string
  securityClassification?: string
  resilienceStatus?: TenantPack['integrations'][number]['resilienceStatus']
  observabilityStatus?: TenantPack['integrations'][number]['observabilityStatus']
  standardIds?: string[]
  initiativeIds?: string[]
  recommendationWhy?: string
  recommendationAction?: string
}

function int(
  id: string,
  name: string,
  description: string,
  fields: IntFields,
): TenantPack['integrations'][number] {
  return {
    ...base(id, name, description, fields.ownerId || fields.technologyOwnerId, fields.status ?? 'active', fields.tags ?? []),
    pattern: fields.pattern,
    integrationType: fields.integrationType,
    sourceApplicationId: fields.sourceApplicationId,
    targetApplicationId: fields.targetApplicationId,
    direction: fields.direction ?? 'outbound',
    businessOwnerId: fields.businessOwnerId,
    technologyOwnerId: fields.technologyOwnerId,
    supportedCapabilityIds: fields.supportedCapabilityIds ?? [],
    supportedProcessIds: fields.supportedProcessIds ?? [],
    apiOrInterfaceName: fields.apiOrInterfaceName,
    protocol: fields.protocol,
    dataFormat: fields.dataFormat ?? 'JSON',
    authenticationMethod: fields.authenticationMethod ?? 'mTLS',
    environment: fields.environment ?? 'production',
    lifecycleStatus: fields.lifecycleStatus,
    criticality: fields.criticality,
    reusabilityStatus: fields.reusabilityStatus,
    consumerCount: fields.consumerCount ?? 1,
    transactionVolumeBand: fields.transactionVolumeBand ?? 'medium',
    availabilityTarget: fields.availabilityTarget ?? '99.5%',
    dataSensitivity: fields.dataSensitivity ?? 'confidential',
    lastReviewDate: fields.lastReviewDate ?? '2026-06-01',
    documentationStatus: fields.documentationStatus,
    monitoringStatus: fields.monitoringStatus,
    pointToPoint: fields.pointToPoint,
    middlewarePlatform: fields.middlewarePlatform,
    dataObjectIds: fields.dataObjectIds ?? [],
    technologyIds: fields.technologyIds ?? [],
    providerApplicationId: fields.providerApplicationId,
    consumerApplicationIds: fields.consumerApplicationIds,
    integrationOwnerId: fields.integrationOwnerId,
    exposure: fields.exposure,
    portfolioDecision: fields.portfolioDecision,
    portfolioLifecycle: fields.portfolioLifecycle,
    assetType: fields.assetType,
    integrationPattern: fields.integrationPattern,
    architectureRisk: fields.architectureRisk,
    standardsCompliance: fields.standardsCompliance,
    reuseClassification: fields.reuseClassification,
    runtime: fields.runtime,
    gateway: fields.gateway,
    securityClassification: fields.securityClassification,
    resilienceStatus: fields.resilienceStatus,
    observabilityStatus: fields.observabilityStatus,
    standardIds: fields.standardIds,
    initiativeIds: fields.initiativeIds,
    recommendationWhy: fields.recommendationWhy,
    recommendationAction: fields.recommendationAction,
    isSynthetic: true,
  }
}

/** ~42 synthetic GRA integrations — illustrative, not an official inventory. */
const graIntegrationsRaw: TenantPack['integrations'] = [
  int('int-gra-01', 'Portal → TIN Registry (direct)', 'Direct taxpayer lookup from portal bypassing hub.', {
    pattern: 'point-to-point', integrationType: 'SOAP service', sourceApplicationId: 'app-gra-03', targetApplicationId: 'app-gra-08',
    businessOwnerId: 'person-domain-taxpayer', technologyOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-02', 'cap-gra-13'], supportedProcessIds: ['prc-gra-01'],
    apiOrInterfaceName: 'TINLookupSoap', protocol: 'SOAP', dataFormat: 'XML', authenticationMethod: 'basic',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gra-02'], tags: ['p2p', 'identity'],
  }),
  int('int-gra-02', 'Portal → Domestic Tax Core filing', 'Filing submission path from portal to tax core.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-03', targetApplicationId: 'app-gra-01',
    businessOwnerId: 'person-domain-tax', technologyOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-17', 'cap-gra-04'], supportedProcessIds: ['prc-gra-03'],
    apiOrInterfaceName: 'FilingSubmitAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'candidate', consumerCount: 2,
    transactionVolumeBand: 'very-high', documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: undefined, dataObjectIds: ['data-gra-03'], technologyIds: ['tech-gra-02'],
  }),
  int('int-gra-03', 'Contact Centre → TIN Registry', 'Duplicate identity lookup from agent desktop.', {
    pattern: 'point-to-point', integrationType: 'Database integration', sourceApplicationId: 'app-gra-04', targetApplicationId: 'app-gra-08',
    businessOwnerId: 'person-domain-taxpayer', technologyOwnerId: 'person-unknown',
    supportedCapabilityIds: ['cap-gra-03', 'cap-gra-13'], supportedProcessIds: ['prc-gra-08'],
    apiOrInterfaceName: 'TIN_ODBC_VIEW', protocol: 'ODBC', dataFormat: 'SQL row', authenticationMethod: 'DB credential',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gra-02'], tags: ['p2p', 'duplicate', 'identity'],
  }),
  int('int-gra-04', 'Contact Centre → Domestic Tax Core', 'Account enquiry path from agent desktop.', {
    pattern: 'point-to-point', integrationType: 'SOAP service', sourceApplicationId: 'app-gra-04', targetApplicationId: 'app-gra-01',
    businessOwnerId: 'person-domain-taxpayer', technologyOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-03'], apiOrInterfaceName: 'AccountEnquirySoap', protocol: 'SOAP', dataFormat: 'XML',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: true, tags: ['p2p'],
  }),
  int('int-gra-05', 'Payments Gateway → Domestic Tax Core', 'Near-real-time payment confirmation to tax core.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-05', targetApplicationId: 'app-gra-01',
    businessOwnerId: 'person-domain-finance', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-05', 'cap-gra-25'], supportedProcessIds: ['prc-gra-04'],
    apiOrInterfaceName: 'PaymentAdviceAPI', protocol: 'HTTPS/JSON', authenticationMethod: 'mTLS',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 4,
    transactionVolumeBand: 'very-high', availabilityTarget: '99.9%', dataSensitivity: 'restricted',
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'WSO2', dataObjectIds: ['data-gra-04'], technologyIds: ['tech-gra-04'],
  }),
  int('int-gra-06', 'Payments Gateway → Customs', 'Duty payment advice via batch file.', {
    pattern: 'batch', integrationType: 'File transfer', sourceApplicationId: 'app-gra-05', targetApplicationId: 'app-gra-02',
    businessOwnerId: 'person-domain-finance', technologyOwnerId: 'person-domain-customs',
    supportedCapabilityIds: ['cap-gra-07', 'cap-gra-19'], apiOrInterfaceName: 'DutyPaymentAdvice', protocol: 'SFTP', dataFormat: 'CSV',
    authenticationMethod: 'SSH key', lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'point-to-point',
    consumerCount: 1, documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: true,
    dataObjectIds: ['data-gra-04'], tags: ['p2p', 'payments'],
  }),
  int('int-gra-07', 'Customs → TIN Registry', 'Trader identity check via nightly file.', {
    pattern: 'file', integrationType: 'File transfer', sourceApplicationId: 'app-gra-02', targetApplicationId: 'app-gra-08',
    businessOwnerId: 'person-domain-customs', technologyOwnerId: 'person-unknown',
    supportedCapabilityIds: ['cap-gra-19'], apiOrInterfaceName: 'TraderTinFile', protocol: 'file', dataFormat: 'fixed-width',
    lifecycleStatus: 'Deprecated', criticality: 'medium', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gra-02'], tags: ['p2p', 'duplicate', 'identity'],
  }),
  int('int-gra-08', 'Tax Core → Assurance Workbench', 'Nightly liability extract for manual reconciliation.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-gra-01', targetApplicationId: 'app-gra-06',
    businessOwnerId: 'person-cro', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-06', 'cap-gra-21'], supportedProcessIds: ['prc-gra-05', 'prc-gra-09'],
    apiOrInterfaceName: 'LiabilityExtract', protocol: 'CSV/SFTP', dataFormat: 'CSV',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gra-05', 'data-gra-07'], technologyIds: ['tech-gra-05'], tags: ['manual', 'assurance'],
  }),
  int('int-gra-09', 'Payments → Assurance Workbench', 'Payment extract for spreadsheet reconciliation.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-gra-05', targetApplicationId: 'app-gra-06',
    businessOwnerId: 'person-cro', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-06', 'cap-gra-21'], supportedProcessIds: ['prc-gra-05'],
    apiOrInterfaceName: 'PaymentExtract', protocol: 'CSV/SFTP', dataFormat: 'CSV',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gra-04', 'data-gra-07'], tags: ['manual', 'assurance'],
  }),
  int('int-gra-10', 'Tax Core → Data Warehouse', 'Operational reporting feed.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-gra-01', targetApplicationId: 'app-gra-09',
    businessOwnerId: 'person-cdo', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-11', 'cap-gra-09'], apiOrInterfaceName: 'TaxOpsETL', protocol: 'ETL', dataFormat: 'relational',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'candidate', consumerCount: 2,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Informatica', technologyIds: ['tech-gra-08'],
  }),
  int('int-gra-11', 'Customs → Data Warehouse', 'Customs analytics feed.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-gra-02', targetApplicationId: 'app-gra-09',
    businessOwnerId: 'person-cdo', technologyOwnerId: 'person-domain-customs',
    supportedCapabilityIds: ['cap-gra-11'], apiOrInterfaceName: 'CustomsETL', protocol: 'ETL',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: true, tags: ['p2p'],
  }),
  int('int-gra-12', 'Hub → Domestic Tax Core', 'Mediated account and identity APIs via hub.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-07', targetApplicationId: 'app-gra-01',
    businessOwnerId: 'person-chief-architect', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-29', 'cap-gra-08'], apiOrInterfaceName: 'TaxCoreFacadeAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'reusable', consumerCount: 5,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'WSO2', technologyIds: ['tech-gra-04'],
  }),
  int('int-gra-13', 'Portal → Hub taxpayer API', 'Draft reusable taxpayer API through hub.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-03', targetApplicationId: 'app-gra-07',
    businessOwnerId: 'person-domain-taxpayer', technologyOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-29', 'cap-gra-02'], apiOrInterfaceName: 'TaxpayerAPI-v1', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Planned', criticality: 'medium', reusabilityStatus: 'reusable', consumerCount: 3,
    status: 'proposed', documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'WSO2', tags: ['api-led'], technologyIds: ['tech-gra-04'], dataObjectIds: ['data-gra-01'],
  }),
  int('int-gra-14', 'Case Management → Tax Core', 'Case context lookup over SOAP.', {
    pattern: 'point-to-point', integrationType: 'SOAP service', sourceApplicationId: 'app-gra-11', targetApplicationId: 'app-gra-01',
    businessOwnerId: 'person-domain-compliance', technologyOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-12'], apiOrInterfaceName: 'CaseContextSoap', protocol: 'SOAP',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: true, tags: ['p2p'],
  }),
  int('int-gra-15', 'Mobile → Portal BFF', 'Mobile companion reuses portal BFF APIs.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-12', targetApplicationId: 'app-gra-03',
    businessOwnerId: 'person-domain-taxpayer', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-13', 'cap-gra-14'], apiOrInterfaceName: 'PortalBFF', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 2,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
  }),
  int('int-gra-16', 'Mobile → Payments Gateway', 'Mobile payment initiation.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-12', targetApplicationId: 'app-gra-05',
    businessOwnerId: 'person-domain-finance', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-05'], apiOrInterfaceName: 'MobilePayAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'candidate', consumerCount: 1,
    dataSensitivity: 'restricted', documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    dataObjectIds: ['data-gra-04'],
  }),
  int('int-gra-17', 'TIN Registry → Regional TIN Mirror', 'Nightly identity sync between overlapping registries.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-gra-08', targetApplicationId: 'app-gra-13',
    businessOwnerId: 'person-domain-taxpayer', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-27', 'cap-gra-02'], apiOrInterfaceName: 'TinMirrorSync', protocol: 'SFTP', dataFormat: 'CSV',
    lifecycleStatus: 'Retiring', criticality: 'high', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gra-02'], tags: ['duplicate', 'identity'],
  }),
  int('int-gra-18', 'Customs → Regional TIN Mirror', 'Alternate trader identity path.', {
    pattern: 'point-to-point', integrationType: 'Database integration', sourceApplicationId: 'app-gra-02', targetApplicationId: 'app-gra-13',
    businessOwnerId: 'person-domain-customs', technologyOwnerId: 'person-unknown',
    supportedCapabilityIds: ['cap-gra-19'], apiOrInterfaceName: 'MirrorODBC', protocol: 'ODBC',
    lifecycleStatus: 'Deprecated', criticality: 'medium', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true, tags: ['p2p', 'duplicate'],
  }),
  int('int-gra-19', 'Filing Client → Tax Core', 'Legacy thick-client posting.', {
    pattern: 'point-to-point', integrationType: 'Manual exchange', sourceApplicationId: 'app-gra-14', targetApplicationId: 'app-gra-01',
    businessOwnerId: 'person-domain-tax', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-17'], apiOrInterfaceName: 'LegacyPost', protocol: 'proprietary', dataFormat: 'binary',
    lifecycleStatus: 'Deprecated', criticality: 'medium', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    technologyIds: ['tech-gra-10'], tags: ['legacy'],
  }),
  int('int-gra-20', 'Border Risk → Customs', 'Risk score advice on declarations.', {
    pattern: 'api', integrationType: 'Event or message', sourceApplicationId: 'app-gra-15', targetApplicationId: 'app-gra-02',
    businessOwnerId: 'person-domain-customs', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-19'], apiOrInterfaceName: 'RiskScoreEvent', protocol: 'HTTPS/JSON', dataFormat: 'JSON event',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 2,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    dataObjectIds: ['data-gra-08'],
  }),
  int('int-gra-21', 'IdP → Portal', 'Staff/partner SSO for portal admin.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-10', targetApplicationId: 'app-gra-03',
    businessOwnerId: 'person-ciso', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-10'], apiOrInterfaceName: 'OIDC', protocol: 'OIDC', dataFormat: 'JWT',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 6,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false, technologyIds: ['tech-gra-07'],
  }),
  int('int-gra-22', 'IdP → Contact Centre', 'Agent SSO.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-10', targetApplicationId: 'app-gra-04',
    businessOwnerId: 'person-ciso', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-10'], apiOrInterfaceName: 'SAML', protocol: 'SAML', dataFormat: 'XML assertion',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'reusable', consumerCount: 6,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false, technologyIds: ['tech-gra-07'],
  }),
  int('int-gra-23', 'Warehouse → BI Workbench', 'Semantic model refresh.', {
    pattern: 'batch', integrationType: 'Database integration', sourceApplicationId: 'app-gra-09', targetApplicationId: 'app-gra-20',
    businessOwnerId: 'person-cdo', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-11'], apiOrInterfaceName: 'SemanticRefresh', protocol: 'JDBC',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'candidate', consumerCount: 1,
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false, tags: ['duplicate'],
  }),
  int('int-gra-24', 'Warehouse → Shadow Spreadsheets', 'Manual extract into spreadsheet farm.', {
    pattern: 'file', integrationType: 'Manual exchange', sourceApplicationId: 'app-gra-09', targetApplicationId: 'app-gra-17',
    businessOwnerId: 'person-unknown', technologyOwnerId: 'person-unknown',
    supportedCapabilityIds: ['cap-gra-11'], apiOrInterfaceName: 'AdhocCSV', protocol: 'CSV',
    lifecycleStatus: 'Restricted', criticality: 'low', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true, tags: ['manual'],
  }),
  int('int-gra-25', 'Case Management → Access DB', 'Occasional case export into shadow DB.', {
    pattern: 'file', integrationType: 'Manual exchange', sourceApplicationId: 'app-gra-11', targetApplicationId: 'app-gra-16',
    businessOwnerId: 'person-domain-compliance', technologyOwnerId: 'person-unknown',
    supportedCapabilityIds: ['cap-gra-12'], apiOrInterfaceName: 'CaseCSVExport', protocol: 'CSV',
    lifecycleStatus: 'Deprecated', criticality: 'low', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true, tags: ['manual'],
  }),
  int('int-gra-26', 'Collections Dialler → Tax Core', 'Debt account context lookup.', {
    pattern: 'point-to-point', integrationType: 'SOAP service', sourceApplicationId: 'app-gra-21', targetApplicationId: 'app-gra-01',
    businessOwnerId: 'person-domain-finance', technologyOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-25'], apiOrInterfaceName: 'DebtContextSoap', protocol: 'SOAP',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: true, tags: ['p2p'],
  }),
  int('int-gra-27', 'Document Vault → Case Management', 'Attach case evidence documents.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-19', targetApplicationId: 'app-gra-11',
    businessOwnerId: 'person-domain-compliance', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-12'], apiOrInterfaceName: 'DocAttachAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'reusable', consumerCount: 3,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false, dataObjectIds: ['data-gra-09'],
  }),
  int('int-gra-28', 'Hub → Customs enquiry (draft)', 'Proposed mediated customs enquiry API.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-07', targetApplicationId: 'app-gra-02',
    businessOwnerId: 'person-chief-architect', technologyOwnerId: 'person-cto',
    supportedCapabilityIds: ['cap-gra-29', 'cap-gra-07'], apiOrInterfaceName: 'CustomsEnquiryAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Planned', criticality: 'medium', reusabilityStatus: 'reusable', consumerCount: 2,
    status: 'proposed', documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'WSO2', tags: ['api-led'], technologyIds: ['tech-gra-04'],
  }),
  int('int-gra-29', 'Payment confirmation event bus', 'Event publication of confirmed payments for assurance subscribers.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-gra-05', targetApplicationId: 'app-gra-07',
    businessOwnerId: 'person-domain-finance', technologyOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-05', 'cap-gra-06'], apiOrInterfaceName: 'PaymentConfirmedEvent', protocol: 'AMQP', dataFormat: 'JSON event',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 3,
    transactionVolumeBand: 'high', dataSensitivity: 'restricted', documentationStatus: 'documented', monitoringStatus: 'monitored',
    pointToPoint: false, middlewarePlatform: 'WSO2', dataObjectIds: ['data-gra-04'],
  }),
  int('int-gra-30', 'Hub taxpayer identity API (canonical)', 'Reusable mediated taxpayer identity API intended to replace P2P lookups.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-07', targetApplicationId: 'app-gra-08',
    businessOwnerId: 'person-domain-taxpayer', technologyOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-29', 'cap-gra-27', 'cap-gra-02'], apiOrInterfaceName: 'TaxpayerIdentityAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Restricted', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 4,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'WSO2', dataObjectIds: ['data-gra-01', 'data-gra-02'], technologyIds: ['tech-gra-04'], tags: ['api-led'],
  }),
  int('int-gra-31', 'Field assurance toolkit ← payments', 'Offline payment extract into field toolkit.', {
    pattern: 'file', integrationType: 'File transfer', sourceApplicationId: 'app-gra-05', targetApplicationId: 'app-gra-06',
    businessOwnerId: 'person-cro', technologyOwnerId: 'person-unknown',
    supportedCapabilityIds: ['cap-gra-06', 'cap-gra-21'], apiOrInterfaceName: 'FieldPayExtract', protocol: 'CSV',
    lifecycleStatus: 'Deprecated', criticality: 'medium', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true, tags: ['manual', 'assurance'],
  }),
  int('int-gra-32', 'Intranet CMS → Document Vault', 'Policy document publish path with weak ownership.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gra-18', targetApplicationId: 'app-gra-19',
    businessOwnerId: 'person-unknown', technologyOwnerId: 'person-unknown',
    supportedCapabilityIds: ['cap-gra-08'], apiOrInterfaceName: 'PolicyPublishAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'low', reusabilityStatus: 'candidate', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: false, tags: ['ownership-gap'],
  }),
  int('int-gra-33', 'Taxpayer Identity API (canonical)', 'Enterprise reusable taxpayer identity service via hub.', {
    pattern: 'api', integrationType: 'REST API',
    sourceApplicationId: 'app-gra-07', targetApplicationId: 'app-gra-08',
    providerApplicationId: 'app-gra-07',
    consumerApplicationIds: ['app-gra-03', 'app-gra-04', 'app-gra-12'],
    businessOwnerId: 'person-domain-taxpayer', technologyOwnerId: 'person-chief-architect',
    integrationOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-02', 'cap-gra-27', 'cap-gra-29'],
    apiOrInterfaceName: 'TaxpayerIdentityAPI-v2', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 3,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'WSO2', runtime: 'Kubernetes', gateway: 'Enterprise API Gateway',
    exposure: 'Internal', portfolioDecision: 'Reuse', portfolioLifecycle: 'Strategic',
    assetType: 'API', integrationPattern: 'Managed API', architectureRisk: 'medium',
    standardsCompliance: 'Compliant', reuseClassification: 'Enterprise Reusable',
    standardIds: ['STD-API-001', 'STD-SEC-004'], initiativeIds: ['init-gra-01', 'init-gra-02'],
    dataObjectIds: ['data-gra-01', 'data-gra-02'], technologyIds: ['tech-gra-04'],
    recommendationWhy: 'Critical multi-consumer identity service; promote as the canonical enterprise reusable API.',
    recommendationAction: 'Complete remaining channel cutover and retire duplicate P2P TIN lookups.',
    tags: ['api-led', 'canonical'],
  }),
  int('int-gra-34', 'Partner Duty Payment API', 'Partner-facing duty payment confirmation for licensed agents.', {
    pattern: 'api', integrationType: 'REST API',
    sourceApplicationId: 'app-gra-05', targetApplicationId: 'app-gra-02',
    providerApplicationId: 'app-gra-05',
    consumerApplicationIds: ['app-gra-02'],
    businessOwnerId: 'person-domain-finance', technologyOwnerId: 'person-cto',
    integrationOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-07', 'cap-gra-05'],
    apiOrInterfaceName: 'PartnerDutyPaymentAPI', protocol: 'HTTPS/JSON', authenticationMethod: 'OAuth2',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 2,
    dataSensitivity: 'restricted', documentationStatus: 'documented', monitoringStatus: 'monitored',
    pointToPoint: false, middlewarePlatform: 'WSO2', runtime: 'Kubernetes', gateway: 'Partner API Gateway',
    exposure: 'Partner', portfolioDecision: 'Standardise', portfolioLifecycle: 'Strategic',
    assetType: 'API', integrationPattern: 'Managed API', architectureRisk: 'medium',
    standardsCompliance: 'Partial', reuseClassification: 'Multi-Consumer',
    standardIds: ['STD-API-001', 'STD-SEC-004'], initiativeIds: ['init-gra-04'],
    dataObjectIds: ['data-gra-04'], tags: ['partner'],
    recommendationWhy: 'Partner-exposed critical payment path; security and observability controls need full alignment.',
    recommendationAction: 'Complete external API security control attestation and partner onboarding runbook.',
  }),
  int('int-gra-35', 'Declaration Events Stream', 'Streaming customs declaration lifecycle events for risk and analytics.', {
    pattern: 'event', integrationType: 'Event stream',
    sourceApplicationId: 'app-gra-02', targetApplicationId: 'app-gra-15',
    providerApplicationId: 'app-gra-02',
    consumerApplicationIds: ['app-gra-15', 'app-gra-09', 'app-gra-07'],
    businessOwnerId: 'person-domain-customs', technologyOwnerId: 'person-cto',
    integrationOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-19', 'cap-gra-11'],
    apiOrInterfaceName: 'DeclarationLifecycleStream', protocol: 'Kafka', dataFormat: 'JSON event',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 3,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Enterprise Event Broker', runtime: 'Kafka cluster',
    exposure: 'Internal', portfolioDecision: 'Invest', portfolioLifecycle: 'Strategic',
    assetType: 'Event', integrationPattern: 'Event / Streaming', architectureRisk: 'low',
    standardsCompliance: 'Compliant', reuseClassification: 'Enterprise Reusable',
    standardIds: ['STD-EVT-001'], initiativeIds: ['init-gra-04'],
    dataObjectIds: ['data-gra-08'], tags: ['streaming'],
    recommendationWhy: 'Strategic event fabric underpinning risk and analytics consumers.',
    recommendationAction: 'Protect platform capacity and expand governed subscriber onboarding.',
  }),
  int('int-gra-36', 'Collections Work Queue', 'Message queue for outbound collections contact tasks.', {
    pattern: 'event', integrationType: 'Message queue',
    sourceApplicationId: 'app-gra-01', targetApplicationId: 'app-gra-21',
    providerApplicationId: 'app-gra-01', consumerApplicationIds: ['app-gra-21'],
    businessOwnerId: 'person-domain-finance', technologyOwnerId: 'person-cto',
    integrationOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-25'],
    apiOrInterfaceName: 'CollectionsWorkQueue', protocol: 'AMQP', dataFormat: 'JSON',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'candidate', consumerCount: 1,
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'Enterprise Message Broker',
    exposure: 'Internal', portfolioDecision: 'Standardise', portfolioLifecycle: 'Active',
    assetType: 'Event', integrationPattern: 'Event / Streaming', architectureRisk: 'medium',
    standardsCompliance: 'Partial', reuseClassification: 'Single Consumer',
    standardIds: ['STD-EVT-001', 'STD-INT-002'],
  }),
  int('int-gra-37', 'Hub Mediation Service — Account Enquiry', 'ESB-mediated account enquiry replacing channel SOAP fans.', {
    pattern: 'api', integrationType: 'ESB / mediation',
    sourceApplicationId: 'app-gra-07', targetApplicationId: 'app-gra-01',
    providerApplicationId: 'app-gra-07',
    consumerApplicationIds: ['app-gra-03', 'app-gra-04'],
    businessOwnerId: 'person-chief-architect', technologyOwnerId: 'person-cto',
    integrationOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-29', 'cap-gra-03'],
    apiOrInterfaceName: 'AccountEnquiryFacade', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 2,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'WSO2', runtime: 'Kubernetes', gateway: 'Enterprise API Gateway',
    exposure: 'Internal', portfolioDecision: 'Invest', portfolioLifecycle: 'Strategic',
    assetType: 'Service', integrationPattern: 'Service Integration', architectureRisk: 'medium',
    standardsCompliance: 'Compliant', reuseClassification: 'Multi-Consumer',
    standardIds: ['STD-INT-002', 'STD-API-001'], initiativeIds: ['init-gra-02'],
    technologyIds: ['tech-gra-04'],
  }),
  int('int-gra-38', 'Liability Nightly File Export', 'Scheduled liability extract from tax core to warehouse.', {
    pattern: 'batch', integrationType: 'Batch integration',
    sourceApplicationId: 'app-gra-01', targetApplicationId: 'app-gra-09',
    providerApplicationId: 'app-gra-01', consumerApplicationIds: ['app-gra-09'],
    businessOwnerId: 'person-cdo', technologyOwnerId: 'person-cto',
    integrationOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-11', 'cap-gra-09'],
    apiOrInterfaceName: 'LiabilityNightlyExport', protocol: 'SFTP', dataFormat: 'CSV',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'candidate', consumerCount: 1,
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'Informatica',
    exposure: 'Internal', portfolioDecision: 'Modernise', portfolioLifecycle: 'Legacy',
    assetType: 'Batch', integrationPattern: 'Batch / File', architectureRisk: 'medium',
    standardsCompliance: 'Partial', reuseClassification: 'Single Consumer',
    standardIds: ['STD-DAT-003'], initiativeIds: ['init-gra-05'],
    dataObjectIds: ['data-gra-05'],
    recommendationWhy: 'Business value remains but batch file pattern delays assurance and analytics freshness.',
    recommendationAction: 'Modernise toward governed warehouse CDC or event-backed liability publication.',
  }),
  int('int-gra-39', 'Direct Assurance DB Interface', 'Direct database read from tax core into assurance worksheets.', {
    pattern: 'point-to-point', integrationType: 'Database integration',
    sourceApplicationId: 'app-gra-06', targetApplicationId: 'app-gra-01',
    providerApplicationId: 'app-gra-01', consumerApplicationIds: ['app-gra-06'],
    businessOwnerId: 'person-cro', technologyOwnerId: 'person-unknown',
    integrationOwnerId: 'person-unknown',
    supportedCapabilityIds: ['cap-gra-06', 'cap-gra-21'],
    apiOrInterfaceName: 'AssuranceDirectDB', protocol: 'JDBC', dataFormat: 'SQL row', authenticationMethod: 'DB credential',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    exposure: 'Internal', portfolioDecision: 'Replace', portfolioLifecycle: 'Legacy',
    assetType: 'Database Integration', integrationPattern: 'Database Integration', architectureRisk: 'critical',
    standardsCompliance: 'Non-Compliant', reuseClassification: 'Single Consumer',
    resilienceStatus: 'critical', observabilityStatus: 'Blind',
    standardIds: ['STD-INT-002', 'STD-DAT-003'], initiativeIds: ['init-gra-03'],
    dataObjectIds: ['data-gra-05', 'data-gra-07'], tags: ['p2p', 'non-compliant'],
    recommendationWhy: 'Direct database integration violates approved integration standard and creates resilience risk on a critical assurance path.',
    recommendationAction: 'Replace with approved service/API or mediated data product access and revoke DB credentials.',
  }),
  int('int-gra-40', 'Public Filing Status API', 'Public filing status lookup for taxpayers and intermediaries.', {
    pattern: 'api', integrationType: 'REST API',
    sourceApplicationId: 'app-gra-03', targetApplicationId: 'app-gra-01',
    providerApplicationId: 'app-gra-03',
    consumerApplicationIds: ['app-gra-12'],
    businessOwnerId: 'person-domain-tax', technologyOwnerId: 'person-cto',
    integrationOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-17', 'cap-gra-14'],
    apiOrInterfaceName: 'PublicFilingStatusAPI', protocol: 'HTTPS/JSON', authenticationMethod: 'API key',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 2,
    dataSensitivity: 'public', documentationStatus: 'documented', monitoringStatus: 'monitored',
    pointToPoint: false, middlewarePlatform: 'WSO2', gateway: 'Public API Gateway', runtime: 'Kubernetes',
    exposure: 'Public', portfolioDecision: 'Standardise', portfolioLifecycle: 'Strategic',
    assetType: 'API', integrationPattern: 'Managed API', architectureRisk: 'medium',
    standardsCompliance: 'Partial', reuseClassification: 'Multi-Consumer',
    standardIds: ['STD-API-001', 'STD-SEC-004'], tags: ['public'],
  }),
  int('int-gra-41', 'Case Graph Lookup', 'GraphQL case context aggregation for compliance officers.', {
    pattern: 'api', integrationType: 'GraphQL API',
    sourceApplicationId: 'app-gra-11', targetApplicationId: 'app-gra-07',
    providerApplicationId: 'app-gra-07', consumerApplicationIds: ['app-gra-11'],
    businessOwnerId: 'person-domain-compliance', technologyOwnerId: 'person-chief-architect',
    integrationOwnerId: 'person-chief-architect',
    supportedCapabilityIds: ['cap-gra-12'],
    apiOrInterfaceName: 'CaseContextGraph', protocol: 'GraphQL', dataFormat: 'JSON',
    lifecycleStatus: 'Planned', criticality: 'medium', reusabilityStatus: 'candidate', consumerCount: 1,
    status: 'proposed', documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'WSO2',
    exposure: 'Internal', portfolioDecision: 'Invest', portfolioLifecycle: 'Strategic',
    assetType: 'API', integrationPattern: 'Managed API', architectureRisk: 'low',
    standardsCompliance: 'Partial', reuseClassification: 'Single Consumer',
    standardIds: ['STD-API-001'], initiativeIds: ['init-gra-02'],
  }),
  int('int-gra-42', 'Duplicate TIN SOAP Mirror', 'Overlapping SOAP identity lookup competing with the hub identity API.', {
    pattern: 'point-to-point', integrationType: 'SOAP service',
    sourceApplicationId: 'app-gra-03', targetApplicationId: 'app-gra-13',
    providerApplicationId: 'app-gra-13', consumerApplicationIds: ['app-gra-03'],
    businessOwnerId: 'person-domain-taxpayer', technologyOwnerId: 'person-unknown',
    integrationOwnerId: 'person-unknown',
    supportedCapabilityIds: ['cap-gra-02', 'cap-gra-27'],
    apiOrInterfaceName: 'RegionalTinSoap', protocol: 'SOAP', dataFormat: 'XML', authenticationMethod: 'basic',
    lifecycleStatus: 'Deprecated', criticality: 'high', reusabilityStatus: 'point-to-point', consumerCount: 1,
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    exposure: 'Internal', portfolioDecision: 'Consolidate', portfolioLifecycle: 'Deprecated',
    assetType: 'Point-to-Point', integrationPattern: 'Point-to-Point', architectureRisk: 'high',
    standardsCompliance: 'Non-Compliant', reuseClassification: 'Single Consumer',
    standardIds: ['STD-INT-002', 'STD-API-001'], initiativeIds: ['init-gra-01', 'init-gra-02'],
    dataObjectIds: ['data-gra-02'], tags: ['duplicate', 'p2p', 'identity'],
    recommendationWhy: 'Overlaps the canonical taxpayer identity API and prolongs fragmented identity paths.',
    recommendationAction: 'Consolidate consumers onto Taxpayer Identity API and retire the SOAP mirror.',
  }),
]

/** Explicit portfolio overlays for foundational records (seeded decisions, not formula-derived). */
const PORTFOLIO_OVERLAY: Record<string, Partial<TenantPack['integrations'][number]>> = {
  'int-gra-01': {
    providerApplicationId: 'app-gra-08', consumerApplicationIds: ['app-gra-03'],
    exposure: 'Internal', portfolioDecision: 'Replace', portfolioLifecycle: 'Legacy',
    assetType: 'Point-to-Point', integrationPattern: 'Point-to-Point', architectureRisk: 'high',
    standardsCompliance: 'Non-Compliant', reuseClassification: 'Single Consumer',
    initiativeIds: ['init-gra-02'], standardIds: ['STD-INT-002'],
    recommendationWhy: 'Critical identity path still uses unmediated point-to-point SOAP.',
    recommendationAction: 'Replace with hub Taxpayer Identity API and decommission direct portal lookup.',
  },
  'int-gra-02': {
    providerApplicationId: 'app-gra-01', consumerApplicationIds: ['app-gra-03', 'app-gra-12'],
    exposure: 'Internal', portfolioDecision: 'Standardise', portfolioLifecycle: 'Strategic',
    assetType: 'API', integrationPattern: 'Managed API', architectureRisk: 'medium',
    standardsCompliance: 'Compliant', reuseClassification: 'Multi-Consumer',
    middlewarePlatform: 'WSO2', runtime: 'Kubernetes', gateway: 'Enterprise API Gateway',
    standardIds: ['STD-API-001'], initiativeIds: ['init-gra-01'],
  },
  'int-gra-03': {
    providerApplicationId: 'app-gra-08', consumerApplicationIds: ['app-gra-04'],
    exposure: 'Internal', portfolioDecision: 'Replace', portfolioLifecycle: 'Legacy',
    assetType: 'Database Integration', integrationPattern: 'Database Integration', architectureRisk: 'critical',
    standardsCompliance: 'Non-Compliant', reuseClassification: 'Single Consumer',
    initiativeIds: ['init-gra-02'], standardIds: ['STD-INT-002'],
    recommendationWhy: 'Direct database integration violates approved integration standard.',
    recommendationAction: 'Replace with approved service/API integration pattern.',
  },
  'int-gra-05': {
    providerApplicationId: 'app-gra-05', consumerApplicationIds: ['app-gra-01', 'app-gra-02', 'app-gra-12'],
    exposure: 'Partner', portfolioDecision: 'Reuse', portfolioLifecycle: 'Strategic',
    assetType: 'API', integrationPattern: 'Managed API', architectureRisk: 'low',
    standardsCompliance: 'Compliant', reuseClassification: 'Enterprise Reusable',
    runtime: 'Kubernetes', gateway: 'Enterprise API Gateway',
    standardIds: ['STD-API-001', 'STD-SEC-004'],
  },
  'int-gra-08': {
    exposure: 'Internal', portfolioDecision: 'Modernise', portfolioLifecycle: 'Legacy',
    assetType: 'Batch', integrationPattern: 'Batch / File', architectureRisk: 'high',
    standardsCompliance: 'Partial', reuseClassification: 'Single Consumer',
    initiativeIds: ['init-gra-03'],
  },
  'int-gra-17': {
    exposure: 'Internal', portfolioDecision: 'Consolidate', portfolioLifecycle: 'Retire',
    assetType: 'Batch', integrationPattern: 'Batch / File', architectureRisk: 'high',
    standardsCompliance: 'Non-Compliant', reuseClassification: 'Single Consumer',
    initiativeIds: ['init-gra-01'],
  },
  'int-gra-29': {
    providerApplicationId: 'app-gra-05',
    consumerApplicationIds: ['app-gra-07', 'app-gra-06', 'app-gra-09'],
    exposure: 'Internal', portfolioDecision: 'Invest', portfolioLifecycle: 'Strategic',
    assetType: 'Event', integrationPattern: 'Event / Streaming', architectureRisk: 'low',
    standardsCompliance: 'Compliant', reuseClassification: 'Enterprise Reusable',
    standardIds: ['STD-EVT-001'], initiativeIds: ['init-gra-03'],
  },
  'int-gra-30': {
    providerApplicationId: 'app-gra-07',
    consumerApplicationIds: ['app-gra-03', 'app-gra-04', 'app-gra-12', 'app-gra-11'],
    exposure: 'Internal', portfolioDecision: 'Reuse', portfolioLifecycle: 'Strategic',
    assetType: 'API', integrationPattern: 'Managed API', architectureRisk: 'medium',
    standardsCompliance: 'Compliant', reuseClassification: 'Enterprise Reusable',
    runtime: 'Kubernetes', gateway: 'Enterprise API Gateway',
    initiativeIds: ['init-gra-02'], standardIds: ['STD-API-001'],
  },
  'int-gra-32': {
    exposure: 'Internal', portfolioDecision: 'Standardise', portfolioLifecycle: 'Active',
    architectureRisk: 'high', standardsCompliance: 'Non-Compliant',
    reuseClassification: 'Single Consumer',
  },
}

export const graIntegrations: TenantPack['integrations'] = graIntegrationsRaw.map((row) => ({
  ...row,
  ...(PORTFOLIO_OVERLAY[row.id] || {}),
  isSynthetic: true,
}))
