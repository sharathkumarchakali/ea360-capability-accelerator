import type { TenantPack } from '@/domain/schemas'
import { entityBase } from '../_shared/seedHelpers'

const T = 'tenant-gen'

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
}

function int(
  id: string,
  name: string,
  description: string,
  fields: IntFields,
): TenantPack['integrations'][number] {
  return {
    ...entityBase(T, id, name, description, fields.ownerId || fields.technologyOwnerId, fields.status ?? 'active', fields.tags ?? [], [
      'generic-seed-v1',
    ]),
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
    authenticationMethod: fields.authenticationMethod ?? 'OAuth2',
    environment: fields.environment ?? 'production',
    lifecycleStatus: fields.lifecycleStatus,
    criticality: fields.criticality,
    reusabilityStatus: fields.reusabilityStatus,
    consumerCount: fields.consumerCount ?? 1,
    transactionVolumeBand: fields.transactionVolumeBand ?? 'medium',
    availabilityTarget: fields.availabilityTarget ?? '99.5%',
    dataSensitivity: fields.dataSensitivity ?? 'confidential',
    lastReviewDate: fields.lastReviewDate ?? '2026-06-15',
    documentationStatus: fields.documentationStatus,
    monitoringStatus: fields.monitoringStatus,
    pointToPoint: fields.pointToPoint,
    middlewarePlatform: fields.middlewarePlatform,
    dataObjectIds: fields.dataObjectIds ?? [],
    technologyIds: fields.technologyIds ?? [],
  }
}

/** ~28 synthetic Acme integrations — illustrative multi-division enterprise inventory. */
export const genericIntegrations: TenantPack['integrations'] = [
  int('int-gen-01', 'Legacy Intake → Customer Master (file)', 'Nightly batch customer updates from legacy intake still bypass validation.', {
    pattern: 'file', integrationType: 'File transfer', sourceApplicationId: 'app-gen-04', targetApplicationId: 'app-gen-02',
    businessOwnerId: 'person-gen-domain-cx', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-02', 'cap-gen-24'], supportedProcessIds: ['prc-gen-01'],
    apiOrInterfaceName: 'LegacyCustomerFileDrop', protocol: 'SFTP', dataFormat: 'CSV', authenticationMethod: 'SSH key',
    lifecycleStatus: 'Deprecated', criticality: 'high', reusabilityStatus: 'point-to-point',
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gen-01'], technologyIds: ['tech-gen-03'], tags: ['cx', 'legacy'],
  }),
  int('int-gen-02', 'CRM → Enterprise Data Lake', 'Primary ETL of validated customer profiles into the lake.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-gen-02', targetApplicationId: 'app-gen-14',
    businessOwnerId: 'person-gen-domain-cx', technologyOwnerId: 'person-gen-cdo',
    supportedCapabilityIds: ['cap-gen-02', 'cap-gen-24'], supportedProcessIds: ['prc-gen-02'],
    apiOrInterfaceName: 'CustomerProfileETL', protocol: 'ETL', dataFormat: 'Parquet',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'candidate', consumerCount: 3,
    transactionVolumeBand: 'high', documentationStatus: 'documented', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'Informatica', dataObjectIds: ['data-gen-01', 'data-gen-02'], technologyIds: ['tech-gen-09'],
    tags: ['cx', 'lineage'],
  }),
  int('int-gen-03', 'Legacy Intake → Data Lake (bypass)', 'Direct load bypassing CRM validation and catalogue registration.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-gen-04', targetApplicationId: 'app-gen-14',
    businessOwnerId: 'person-gen-domain-cx', technologyOwnerId: 'person-gen-unknown',
    supportedCapabilityIds: ['cap-gen-24'], supportedProcessIds: ['prc-gen-01'],
    apiOrInterfaceName: 'ShadowCustomerLoad', protocol: 'JDBC', dataFormat: 'relational', authenticationMethod: 'DB credential',
    lifecycleStatus: 'Restricted', criticality: 'high', reusabilityStatus: 'point-to-point',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gen-01'], tags: ['shadow', 'p2p'],
  }),
  int('int-gen-04', 'Data Lake → Analytics Workbench', 'Certified extract for enterprise dashboards.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gen-14', targetApplicationId: 'app-gen-15',
    businessOwnerId: 'person-gen-domain-data', technologyOwnerId: 'person-gen-cdo',
    supportedCapabilityIds: ['cap-gen-25', 'cap-gen-24'], supportedProcessIds: ['prc-gen-03'],
    apiOrInterfaceName: 'EnterpriseDatasetAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 4,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Acme Integration Hub', dataObjectIds: ['data-gen-02', 'data-gen-03'], technologyIds: ['tech-gen-04'],
  }),
  int('int-gen-05', 'Data Lake → Spreadsheet Analytics (unmediated)', 'Parallel analytics tool pulls raw lake tables without semantic layer.', {
    pattern: 'point-to-point', integrationType: 'Database integration', sourceApplicationId: 'app-gen-14', targetApplicationId: 'app-gen-16',
    businessOwnerId: 'person-gen-domain-finance', technologyOwnerId: 'person-gen-unknown',
    supportedCapabilityIds: ['cap-gen-25', 'cap-gen-12'], supportedProcessIds: ['prc-gen-04'],
    apiOrInterfaceName: 'LakeODBC_ShadowBI', protocol: 'ODBC', dataFormat: 'SQL row', authenticationMethod: 'DB credential',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'point-to-point',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gen-02'], tags: ['duplicate', 'shadow'],
  }),
  int('int-gen-06', 'Customer Portal → CRM enquiry', 'Real-time customer profile lookup from web channel.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gen-01', targetApplicationId: 'app-gen-02',
    businessOwnerId: 'person-gen-domain-cx', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-02', 'cap-gen-04'], supportedProcessIds: ['prc-gen-05'],
    apiOrInterfaceName: 'CustomerEnquiryAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'candidate', consumerCount: 2,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Acme Integration Hub', dataObjectIds: ['data-gen-01'], technologyIds: ['tech-gen-04'],
  }),
  int('int-gen-07', 'Mobile Backend → CRM sync', 'Mobile app customer events into CRM without hub mediation.', {
    pattern: 'point-to-point', integrationType: 'REST API', sourceApplicationId: 'app-gen-03', targetApplicationId: 'app-gen-02',
    businessOwnerId: 'person-gen-domain-cx', technologyOwnerId: 'person-gen-unknown',
    supportedCapabilityIds: ['cap-gen-04', 'cap-gen-02'], supportedProcessIds: ['prc-gen-06'],
    apiOrInterfaceName: 'MobileCRM_Direct', protocol: 'HTTPS/JSON', authenticationMethod: 'API key',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'point-to-point',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gen-01'], tags: ['cx', 'p2p'],
  }),
  int('int-gen-08', 'Partner Portal → Order Management', 'Partner-submitted orders into OMS.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gen-22', targetApplicationId: 'app-gen-11',
    businessOwnerId: 'person-gen-domain-product', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-07', 'cap-gen-18'], supportedProcessIds: ['prc-gen-07'],
    apiOrInterfaceName: 'PartnerOrderAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 3,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Acme Integration Hub', dataObjectIds: ['data-gen-04'], technologyIds: ['tech-gen-04'],
  }),
  int('int-gen-09', 'OMS → Warehouse Management', 'Order fulfilment instructions to warehouse.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-gen-11', targetApplicationId: 'app-gen-10',
    businessOwnerId: 'person-gen-domain-supply', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-18', 'cap-gen-19'], supportedProcessIds: ['prc-gen-08'],
    apiOrInterfaceName: 'FulfilmentEvent', protocol: 'AMQP', dataFormat: 'JSON',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'candidate', consumerCount: 2,
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'RabbitMQ', dataObjectIds: ['data-gen-05'], technologyIds: ['tech-gen-15'],
  }),
  int('int-gen-10', 'Service Desk → CRM case sync', 'Duplicate case records between service platforms.', {
    pattern: 'point-to-point', integrationType: 'Database integration', sourceApplicationId: 'app-gen-06', targetApplicationId: 'app-gen-02',
    businessOwnerId: 'person-gen-domain-cx', technologyOwnerId: 'person-gen-unknown',
    supportedCapabilityIds: ['cap-gen-03', 'cap-gen-02'], supportedProcessIds: ['prc-gen-09'],
    apiOrInterfaceName: 'DeskCRM_ODBC', protocol: 'ODBC', dataFormat: 'SQL row', authenticationMethod: 'DB credential',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'point-to-point',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gen-06'], tags: ['duplicate', 'p2p'],
  }),
  int('int-gen-11', 'ERP Finance → Data Lake', 'Finance extracts for enterprise reporting.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-gen-07', targetApplicationId: 'app-gen-14',
    businessOwnerId: 'person-gen-domain-finance', technologyOwnerId: 'person-gen-cdo',
    supportedCapabilityIds: ['cap-gen-12', 'cap-gen-25'], supportedProcessIds: ['prc-gen-10'],
    apiOrInterfaceName: 'FinanceCostETL', protocol: 'ETL',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'candidate',
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Informatica', dataObjectIds: ['data-gen-07'], technologyIds: ['tech-gen-09'],
  }),
  int('int-gen-12', 'HR Suite → IAM provisioning', 'Joiner-mover-leaver identity events.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-gen-08', targetApplicationId: 'app-gen-13',
    businessOwnerId: 'person-gen-domain-hr', technologyOwnerId: 'person-gen-ciso',
    supportedCapabilityIds: ['cap-gen-15', 'cap-gen-22'], supportedProcessIds: ['prc-gen-11'],
    apiOrInterfaceName: 'JMLIdentityEvent', protocol: 'SCIM', dataFormat: 'JSON', authenticationMethod: 'OAuth2',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 6,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Acme Integration Hub', dataObjectIds: ['data-gen-08'], technologyIds: ['tech-gen-07'],
  }),
  int('int-gen-13', 'IAM → Customer Portal SSO', 'Customer-facing SSO for authenticated portal users.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gen-13', targetApplicationId: 'app-gen-01',
    businessOwnerId: 'person-gen-ciso', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-22', 'cap-gen-04'],
    apiOrInterfaceName: 'OIDC_SSO', protocol: 'OIDC', dataFormat: 'JWT', authenticationMethod: 'OAuth2',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 8,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Keycloak', dataObjectIds: ['data-gen-08'], technologyIds: ['tech-gen-07'],
  }),
  int('int-gen-14', 'Portfolio Tracker → Architecture Repository', 'Late-bound design artefacts pushed after build starts.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gen-18', targetApplicationId: 'app-gen-17',
    businessOwnerId: 'person-gen-chief-architect', technologyOwnerId: 'person-gen-domain-transformation',
    supportedCapabilityIds: ['cap-gen-29', 'cap-gen-21'], supportedProcessIds: ['prc-gen-12'],
    apiOrInterfaceName: 'DesignArtefactSync', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'candidate',
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'Acme Integration Hub', dataObjectIds: ['data-gen-09'], technologyIds: ['tech-gen-04'],
    tags: ['governance'], lastReviewDate: '2025-11-02',
  }),
  int('int-gen-15', 'Hub → CRM customer facade', 'Target reusable customer API for channel cutover.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gen-12', targetApplicationId: 'app-gen-02',
    businessOwnerId: 'person-gen-chief-architect', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-02', 'cap-gen-21'], supportedProcessIds: ['prc-gen-02'],
    apiOrInterfaceName: 'CustomerFacadeAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Planned', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 0,
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: false,
    middlewarePlatform: 'Acme Integration Hub', dataObjectIds: ['data-gen-01'], technologyIds: ['tech-gen-04'],
    tags: ['api-led'],
  }),
  int('int-gen-16', 'Hub → OMS order events', 'Target event publication replacing P2P mobile sync paths.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-gen-11', targetApplicationId: 'app-gen-12',
    businessOwnerId: 'person-gen-domain-supply', technologyOwnerId: 'person-gen-chief-architect',
    supportedCapabilityIds: ['cap-gen-18', 'cap-gen-21'], supportedProcessIds: ['prc-gen-07'],
    apiOrInterfaceName: 'OrderFinalityEvent', protocol: 'Kafka', dataFormat: 'Avro',
    lifecycleStatus: 'Planned', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 1,
    transactionVolumeBand: 'high', availabilityTarget: '99.9%', dataSensitivity: 'confidential',
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'Acme Integration Hub', dataObjectIds: ['data-gen-04', 'data-gen-05'], technologyIds: ['tech-gen-04', 'tech-gen-18'],
    tags: ['api-led'],
  }),
  int('int-gen-17', 'Spreadsheet Analytics → Intranet KPI publish', 'Uncertified revenue KPIs published to intranet.', {
    pattern: 'file', integrationType: 'Manual exchange', sourceApplicationId: 'app-gen-16', targetApplicationId: 'app-gen-20',
    businessOwnerId: 'person-gen-domain-finance', technologyOwnerId: 'person-gen-unknown',
    supportedCapabilityIds: ['cap-gen-25', 'cap-gen-12'], supportedProcessIds: ['prc-gen-04'],
    apiOrInterfaceName: 'ManualKPIUpload', protocol: 'manual', dataFormat: 'XLSX', authenticationMethod: 'N/A',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'point-to-point',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gen-03'], tags: ['shadow'],
  }),
  int('int-gen-18', 'ERP → Portfolio Tracker costs', 'Initiative spend actuals.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-gen-07', targetApplicationId: 'app-gen-18',
    businessOwnerId: 'person-gen-domain-transformation', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-29', 'cap-gen-12'], supportedProcessIds: ['prc-gen-12'],
    apiOrInterfaceName: 'InitiativeCostFeed', protocol: 'CSV/SFTP', dataFormat: 'CSV', authenticationMethod: 'SSH key',
    lifecycleStatus: 'Active', criticality: 'low', reusabilityStatus: 'point-to-point',
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: true,
    dataObjectIds: ['data-gen-07'],
  }),
  int('int-gen-19', 'SOC → IAM privileged alerts', 'Privileged access anomaly events.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-gen-19', targetApplicationId: 'app-gen-13',
    businessOwnerId: 'person-gen-ciso', technologyOwnerId: 'person-gen-ciso',
    supportedCapabilityIds: ['cap-gen-22'], supportedProcessIds: ['prc-gen-13'],
    apiOrInterfaceName: 'PrivAccessAlert', protocol: 'Webhook', dataFormat: 'JSON', authenticationMethod: 'HMAC',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'candidate',
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    dataObjectIds: ['data-gen-10', 'data-gen-08'], technologyIds: ['tech-gen-17'],
  }),
  int('int-gen-20', 'Product Hub → Marketing Automation', 'Product catalogue sync for campaigns.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gen-05', targetApplicationId: 'app-gen-21',
    businessOwnerId: 'person-gen-domain-product', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-06'], supportedProcessIds: ['prc-gen-14'],
    apiOrInterfaceName: 'ProductCatalogAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'reusable', consumerCount: 2,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Acme Integration Hub', dataObjectIds: ['data-gen-11'],
  }),
  int('int-gen-21', 'Procurement → ERP finance', 'Purchase order accruals into finance core.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-gen-09', targetApplicationId: 'app-gen-07',
    businessOwnerId: 'person-gen-domain-shared', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-09', 'cap-gen-13'], supportedProcessIds: ['prc-gen-15'],
    apiOrInterfaceName: 'POAccrualFeed', protocol: 'ETL',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'candidate',
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Informatica', dataObjectIds: ['data-gen-12'], technologyIds: ['tech-gen-09'],
  }),
  int('int-gen-22', 'Legacy Intake → Customer Portal (ad-hoc)', 'Analysts pull raw legacy files for quick customer checks.', {
    pattern: 'file', integrationType: 'Manual exchange', sourceApplicationId: 'app-gen-04', targetApplicationId: 'app-gen-01',
    businessOwnerId: 'person-gen-domain-cx', technologyOwnerId: 'person-gen-unknown',
    supportedCapabilityIds: ['cap-gen-02', 'cap-gen-04'], supportedProcessIds: ['prc-gen-05'],
    apiOrInterfaceName: 'AdHocLegacyDownload', protocol: 'SMB', dataFormat: 'CSV', authenticationMethod: 'AD',
    lifecycleStatus: 'Deprecated', criticality: 'medium', reusabilityStatus: 'point-to-point',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-gen-01'], technologyIds: ['tech-gen-03'], tags: ['legacy', 'p2p'],
  }),
  int('int-gen-23', 'CRM → Service Desk (duplicate)', 'Second CRM-to-desk sync overlapping case management capability.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gen-02', targetApplicationId: 'app-gen-06',
    businessOwnerId: 'person-gen-domain-cx', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-03'], supportedProcessIds: ['prc-gen-09'],
    apiOrInterfaceName: 'CRMCaseSync', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'point-to-point',
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: true,
    dataObjectIds: ['data-gen-06'], tags: ['duplicate'],
  }),
  int('int-gen-24', 'Analytics Workbench → Finance dashboards', 'Certified revenue metrics for group reporting.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gen-15', targetApplicationId: 'app-gen-07',
    businessOwnerId: 'person-gen-domain-finance', technologyOwnerId: 'person-gen-cdo',
    supportedCapabilityIds: ['cap-gen-25', 'cap-gen-12'], supportedProcessIds: ['prc-gen-03'],
    apiOrInterfaceName: 'RevenueMetricsAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 3,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Acme Integration Hub', dataObjectIds: ['data-gen-03'], technologyIds: ['tech-gen-04'],
  }),
  int('int-gen-25', 'Architecture Repository → Hub standards', 'Published interface standards consumed by hub.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gen-17', targetApplicationId: 'app-gen-12',
    businessOwnerId: 'person-gen-chief-architect', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-29', 'cap-gen-21'], supportedProcessIds: ['prc-gen-12'],
    apiOrInterfaceName: 'InterfaceStandardAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Planned', criticality: 'medium', reusabilityStatus: 'reusable', consumerCount: 0,
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: false,
    middlewarePlatform: 'Acme Integration Hub', dataObjectIds: ['data-gen-09'], technologyIds: ['tech-gen-04'],
    tags: ['governance'],
  }),
  int('int-gen-26', 'Mobile Backend → Hub customer events (pilot)', 'Pilot event publication for hub-mediated mobile consumers.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-gen-03', targetApplicationId: 'app-gen-12',
    businessOwnerId: 'person-gen-domain-cx', technologyOwnerId: 'person-gen-chief-architect',
    supportedCapabilityIds: ['cap-gen-04', 'cap-gen-21'], supportedProcessIds: ['prc-gen-06'],
    apiOrInterfaceName: 'MobileCustomerEvent', protocol: 'Kafka', dataFormat: 'Avro',
    lifecycleStatus: 'Planned', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 1,
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'Acme Integration Hub', dataObjectIds: ['data-gen-01'], technologyIds: ['tech-gen-04', 'tech-gen-18'],
    tags: ['cx', 'api-led'],
  }),
  int('int-gen-27', 'WMS → ERP inventory sync', 'Inventory levels back to finance and planning.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-gen-10', targetApplicationId: 'app-gen-07',
    businessOwnerId: 'person-gen-domain-supply', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-19', 'cap-gen-12'], supportedProcessIds: ['prc-gen-08'],
    apiOrInterfaceName: 'InventorySyncETL', protocol: 'ETL',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'candidate',
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Informatica', dataObjectIds: ['data-gen-05'], technologyIds: ['tech-gen-09'],
  }),
  int('int-gen-28', 'Document Vault → Service Desk', 'Knowledge articles linked to case resolution.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-gen-20', targetApplicationId: 'app-gen-06',
    businessOwnerId: 'person-gen-domain-cx', technologyOwnerId: 'person-gen-cio',
    supportedCapabilityIds: ['cap-gen-03'], supportedProcessIds: ['prc-gen-09'],
    apiOrInterfaceName: 'KnowledgeArticleAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'low', reusabilityStatus: 'reusable', consumerCount: 2,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    dataObjectIds: ['data-gen-06'],
  }),
]

export default genericIntegrations
