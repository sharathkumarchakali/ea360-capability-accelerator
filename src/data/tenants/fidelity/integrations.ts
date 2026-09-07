import type { TenantPack } from '@/domain/schemas'
import { entityBase } from '../_shared/seedHelpers'

const T = 'tenant-fid'

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
      'fidelity-seed-v1',
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
    lastReviewDate: fields.lastReviewDate ?? '2026-06-20',
    documentationStatus: fields.documentationStatus,
    monitoringStatus: fields.monitoringStatus,
    pointToPoint: fields.pointToPoint,
    middlewarePlatform: fields.middlewarePlatform,
    dataObjectIds: fields.dataObjectIds ?? [],
    technologyIds: fields.technologyIds ?? [],
  }
}

/** ~38 synthetic Fidelity integrations — illustrative commercial-bank inventory. */
export const fidelityIntegrations: TenantPack['integrations'] = [
  int('int-fid-01', 'Branch Onboarding → Core Banking (direct)', 'Branch suite creates CIF directly in core without CDM merge.', {
    pattern: 'point-to-point', integrationType: 'Database integration', sourceApplicationId: 'app-fid-04', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-retail', technologyOwnerId: 'person-fid-unknown',
    supportedCapabilityIds: ['cap-fid-03', 'cap-fid-02'], supportedProcessIds: ['prc-fid-01'],
    apiOrInterfaceName: 'BranchCIFCreate_ODBC', protocol: 'ODBC', dataFormat: 'SQL row', authenticationMethod: 'DB credential',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'point-to-point',
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-fid-01'], technologyIds: ['tech-fid-03'], tags: ['customer360', 'p2p'],
  }),
  int('int-fid-02', 'Digital Onboarding → Core Banking', 'Digital portal opens accounts with parallel CIF numbering scheme.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-05', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-digital', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-03', 'cap-fid-14'], supportedProcessIds: ['prc-fid-02'],
    apiOrInterfaceName: 'DigitalAccountOpenAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'point-to-point', consumerCount: 2,
    transactionVolumeBand: 'high', documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: true,
    dataObjectIds: ['data-fid-01', 'data-fid-02'], tags: ['customer360'],
  }),
  int('int-fid-03', 'Legacy CRM → Core Banking sync', 'Nightly batch sync of customer attributes bypassing CDM.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-fid-06', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-retail', technologyOwnerId: 'person-fid-unknown',
    supportedCapabilityIds: ['cap-fid-02', 'cap-fid-06'], supportedProcessIds: ['prc-fid-03'],
    apiOrInterfaceName: 'CRMCustomerBatchSync', protocol: 'ETL', dataFormat: 'CSV',
    lifecycleStatus: 'Restricted', criticality: 'high', reusabilityStatus: 'point-to-point',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-fid-01'], tags: ['customer360', 'shadow'],
  }),
  int('int-fid-04', 'Branch Onboarding → Customer Data Master', 'Partial feed to CDM without digital channel events.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-fid-04', targetApplicationId: 'app-fid-03',
    businessOwnerId: 'person-fid-domain-customer', technologyOwnerId: 'person-fid-cdo',
    supportedCapabilityIds: ['cap-fid-02', 'cap-fid-03'], supportedProcessIds: ['prc-fid-01'],
    apiOrInterfaceName: 'BranchPartyFeed', protocol: 'ETL',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'candidate', consumerCount: 2,
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'Informatica', dataObjectIds: ['data-fid-01'], technologyIds: ['tech-fid-09'],
    tags: ['customer360'],
  }),
  int('int-fid-05', 'Digital Onboarding → Customer Data Master', 'Event feed of digital enrolments into CDM staging.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-fid-05', targetApplicationId: 'app-fid-03',
    businessOwnerId: 'person-fid-domain-digital', technologyOwnerId: 'person-fid-cdo',
    supportedCapabilityIds: ['cap-fid-02', 'cap-fid-03'], supportedProcessIds: ['prc-fid-02'],
    apiOrInterfaceName: 'DigitalPartyEvent', protocol: 'Kafka', dataFormat: 'Avro',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'candidate', consumerCount: 2,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Kafka', dataObjectIds: ['data-fid-01', 'data-fid-02'], technologyIds: ['tech-fid-18'],
    tags: ['customer360'],
  }),
  int('int-fid-06', 'CDM → Customer Analytics Hub', 'Golden record extracts for segmentation models.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-03', targetApplicationId: 'app-fid-14',
    businessOwnerId: 'person-fid-cdo', technologyOwnerId: 'person-fid-cdo',
    supportedCapabilityIds: ['cap-fid-02', 'cap-fid-34'], supportedProcessIds: ['prc-fid-04'],
    apiOrInterfaceName: 'PartyGoldenRecordAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Planned', criticality: 'medium', reusabilityStatus: 'reusable', consumerCount: 0,
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: false,
    middlewarePlatform: 'Fidelity API Hub', dataObjectIds: ['data-fid-01'], technologyIds: ['tech-fid-04'],
    tags: ['customer360', 'api-led'],
  }),
  int('int-fid-07', 'CDM → Data Lake', 'Party master replication for analytics and reporting.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-fid-03', targetApplicationId: 'app-fid-22',
    businessOwnerId: 'person-fid-cdo', technologyOwnerId: 'person-fid-cdo',
    supportedCapabilityIds: ['cap-fid-34', 'cap-fid-35'], supportedProcessIds: ['prc-fid-04'],
    apiOrInterfaceName: 'PartyLakeETL', protocol: 'ETL', dataFormat: 'Parquet',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'candidate', consumerCount: 3,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Informatica', dataObjectIds: ['data-fid-01'], technologyIds: ['tech-fid-09'],
  }),
  int('int-fid-08', 'Data Lake → Parallel BI (shadow)', 'Uncertified customer metrics pulled via ODBC.', {
    pattern: 'point-to-point', integrationType: 'Database integration', sourceApplicationId: 'app-fid-22', targetApplicationId: 'app-fid-32',
    businessOwnerId: 'person-fid-domain-retail', technologyOwnerId: 'person-fid-unknown',
    supportedCapabilityIds: ['cap-fid-34', 'cap-fid-06'], supportedProcessIds: ['prc-fid-05'],
    apiOrInterfaceName: 'LakeODBC_ShadowBI', protocol: 'ODBC', authenticationMethod: 'DB credential',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'point-to-point',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-fid-03'], tags: ['duplicate', 'shadow'],
  }),
  int('int-fid-09', 'AML Monitor → Core Banking transactions', 'Real-time transaction screening feed.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-fid-01', targetApplicationId: 'app-fid-19',
    businessOwnerId: 'person-fid-cro', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-29', 'cap-fid-22'], supportedProcessIds: ['prc-fid-06'],
    apiOrInterfaceName: 'TxnScreeningEvent', protocol: 'MQ', dataFormat: 'JSON',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 4,
    transactionVolumeBand: 'very-high', documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'IBM MQ', dataObjectIds: ['data-fid-04'], technologyIds: ['tech-fid-16'],
    tags: ['compliance'],
  }),
  int('int-fid-10', 'Mobile Banking → Core Banking (P2P)', 'Direct account enquiry JDBC bypassing API hub.', {
    pattern: 'point-to-point', integrationType: 'Database integration', sourceApplicationId: 'app-fid-07', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-digital', technologyOwnerId: 'person-fid-unknown',
    supportedCapabilityIds: ['cap-fid-14', 'cap-fid-05'], supportedProcessIds: ['prc-fid-07'],
    apiOrInterfaceName: 'MobileBalance_ODBC', protocol: 'ODBC', authenticationMethod: 'DB credential',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'point-to-point',
    transactionVolumeBand: 'very-high', availabilityTarget: '99.9%', dataSensitivity: 'restricted',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-fid-08'], tags: ['api-led', 'p2p', 'channels'],
  }),
  int('int-fid-11', 'USSD Gateway → Core Banking', 'USSD session queries via proprietary socket link.', {
    pattern: 'point-to-point', integrationType: 'Database integration', sourceApplicationId: 'app-fid-08', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-digital', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-15', 'cap-fid-05'], supportedProcessIds: ['prc-fid-08'],
    apiOrInterfaceName: 'USSDCoreSocket', protocol: 'TCP/proprietary', authenticationMethod: 'shared secret',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'point-to-point',
    transactionVolumeBand: 'high', documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: true,
    dataObjectIds: ['data-fid-08'], tags: ['channels', 'p2p'],
  }),
  int('int-fid-12', 'Mobile Banking → Core (legacy ODBC)', 'Aging ODBC path for balance and mini-statement.', {
    pattern: 'point-to-point', integrationType: 'Database integration', sourceApplicationId: 'app-fid-07', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-digital', technologyOwnerId: 'person-fid-unknown',
    supportedCapabilityIds: ['cap-fid-14'], supportedProcessIds: ['prc-fid-07'],
    apiOrInterfaceName: 'MobileLegacy_ODBC', protocol: 'ODBC', authenticationMethod: 'DB credential',
    lifecycleStatus: 'Deprecated', criticality: 'critical', reusabilityStatus: 'point-to-point',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-fid-08'], tags: ['channels', 'p2p', 'resilience'],
  }),
  int('int-fid-13', 'Agency POS → Core Banking', 'Agent cash-in/out posts via file drop.', {
    pattern: 'file', integrationType: 'File transfer', sourceApplicationId: 'app-fid-09', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-digital', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-15', 'cap-fid-22'], supportedProcessIds: ['prc-fid-09'],
    apiOrInterfaceName: 'AgencyTxnFileDrop', protocol: 'SFTP', dataFormat: 'fixed-width', authenticationMethod: 'SSH key',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'point-to-point',
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: true,
    dataObjectIds: ['data-fid-09'], tags: ['channels'],
  }),
  int('int-fid-14', 'Internet Banking → Payments Switch', 'Web-initiated transfers to GHIPSS connector.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-16', targetApplicationId: 'app-fid-17',
    businessOwnerId: 'person-fid-domain-payments', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-14', 'cap-fid-22'], supportedProcessIds: ['prc-fid-10'],
    apiOrInterfaceName: 'WebTransferAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'candidate', consumerCount: 2,
    transactionVolumeBand: 'high', documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Fidelity API Hub', dataObjectIds: ['data-fid-10'], technologyIds: ['tech-fid-04'],
    tags: ['channels'],
  }),
  int('int-fid-15', 'Payments Switch → GHIPSS', 'Domestic instant payment routing.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-17', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-payments', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-22', 'cap-fid-21'], supportedProcessIds: ['prc-fid-10'],
    apiOrInterfaceName: 'GHIPSSInstantPay', protocol: 'HTTPS/ISO20022', dataFormat: 'XML', authenticationMethod: 'mTLS',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 5,
    transactionVolumeBand: 'very-high', availabilityTarget: '99.95%', dataSensitivity: 'restricted',
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    dataObjectIds: ['data-fid-10'], technologyIds: ['tech-fid-22'],
    tags: ['payments'],
  }),
  int('int-fid-16', 'Standing Order Engine → Core Banking', 'Recurring debit execution batch.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-fid-30', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-payments', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-23', 'cap-fid-21'], supportedProcessIds: ['prc-fid-11'],
    apiOrInterfaceName: 'StandingOrderBatch', protocol: 'ETL',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'candidate',
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Informatica', dataObjectIds: ['data-fid-11'], technologyIds: ['tech-fid-09'],
  }),
  int('int-fid-17', 'Card System → Core Banking', 'Card authorisation and settlement posting.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-13', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-cards', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-25', 'cap-fid-24'], supportedProcessIds: ['prc-fid-12'],
    apiOrInterfaceName: 'CardPostAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 3,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    dataObjectIds: ['data-fid-12'], technologyIds: ['tech-fid-04'],
  }),
  int('int-fid-18', 'ATM Switch → Core Banking', 'ATM transaction authorisation messages.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-fid-29', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-retail', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-05', 'cap-fid-25'], supportedProcessIds: ['prc-fid-13'],
    apiOrInterfaceName: 'ATMAuthMessage', protocol: 'ISO8583', dataFormat: 'binary',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'point-to-point',
    transactionVolumeBand: 'very-high', documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: true,
    dataObjectIds: ['data-fid-12'], technologyIds: ['tech-fid-16'],
  }),
  int('int-fid-19', 'Treasury → Core Banking GL', 'End-of-day treasury postings to GL.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-fid-18', targetApplicationId: 'app-fid-02',
    businessOwnerId: 'person-fid-domain-finance', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-32', 'cap-fid-31'], supportedProcessIds: ['prc-fid-14'],
    apiOrInterfaceName: 'TreasuryGLFeed', protocol: 'ETL',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'candidate',
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Informatica', dataObjectIds: ['data-fid-13'], technologyIds: ['tech-fid-09'],
  }),
  int('int-fid-20', 'Loan Origination → Credit Workbench', 'Manual handoff of application packages for analyst review.', {
    pattern: 'file', integrationType: 'Manual exchange', sourceApplicationId: 'app-fid-10', targetApplicationId: 'app-fid-11',
    businessOwnerId: 'person-fid-domain-lending', technologyOwnerId: 'person-fid-unknown',
    supportedCapabilityIds: ['cap-fid-18', 'cap-fid-20'], supportedProcessIds: ['prc-fid-15'],
    apiOrInterfaceName: 'LoanPackEmailDrop', protocol: 'manual', dataFormat: 'PDF/XLSX', authenticationMethod: 'N/A',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'point-to-point',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-fid-05'], tags: ['lending', 'manual'],
  }),
  int('int-fid-21', 'Credit Workbench → Core Lending', 'Approved facilities booked via re-keyed batch file.', {
    pattern: 'file', integrationType: 'File transfer', sourceApplicationId: 'app-fid-11', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-domain-lending', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-18', 'cap-fid-19'], supportedProcessIds: ['prc-fid-16'],
    apiOrInterfaceName: 'FacilityBookingFile', protocol: 'SFTP', dataFormat: 'CSV', authenticationMethod: 'SSH key',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'point-to-point',
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: true,
    dataObjectIds: ['data-fid-06'], tags: ['lending'],
  }),
  int('int-fid-22', 'Loan Origination → Document Vault', 'KYC and collateral documents archived.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-10', targetApplicationId: 'app-fid-20',
    businessOwnerId: 'person-fid-domain-lending', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-18', 'cap-fid-03'], supportedProcessIds: ['prc-fid-15'],
    apiOrInterfaceName: 'LoanDocArchiveAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'reusable', consumerCount: 3,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    dataObjectIds: ['data-fid-07'],
  }),
  int('int-fid-23', 'SME Workbench → Loan Origination', 'Relationship manager referrals into origination queue.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-23', targetApplicationId: 'app-fid-10',
    businessOwnerId: 'person-fid-domain-corporate', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-19', 'cap-fid-08'], supportedProcessIds: ['prc-fid-17'],
    apiOrInterfaceName: 'SMEReferralAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'candidate', consumerCount: 2,
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    dataObjectIds: ['data-fid-05'],
  }),
  int('int-fid-24', 'Collateral Registry → Credit Workbench', 'Collateral valuation lookup during approval.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-12', targetApplicationId: 'app-fid-11',
    businessOwnerId: 'person-fid-domain-lending', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-20', 'cap-fid-19'], supportedProcessIds: ['prc-fid-15'],
    apiOrInterfaceName: 'CollateralLookupAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'reusable', consumerCount: 2,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    dataObjectIds: ['data-fid-06'],
  }),
  int('int-fid-25', 'Core Banking → Regulatory Reporting', 'Prudential returns extract for BoG filing.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-fid-01', targetApplicationId: 'app-fid-31',
    businessOwnerId: 'person-fid-cro', technologyOwnerId: 'person-fid-cdo',
    supportedCapabilityIds: ['cap-fid-35', 'cap-fid-28'], supportedProcessIds: ['prc-fid-18'],
    apiOrInterfaceName: 'PrudentialReturnETL', protocol: 'ETL',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'candidate',
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Informatica', dataObjectIds: ['data-fid-14'], technologyIds: ['tech-fid-09'],
  }),
  int('int-fid-26', 'HR Suite → IAM provisioning', 'Joiner-mover-leaver identity events.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-fid-21', targetApplicationId: 'app-fid-26',
    businessOwnerId: 'person-fid-domain-finance', technologyOwnerId: 'person-fid-ciso',
    supportedCapabilityIds: ['cap-fid-43', 'cap-fid-44'], supportedProcessIds: ['prc-fid-19'],
    apiOrInterfaceName: 'JMLIdentityEvent', protocol: 'SCIM', dataFormat: 'JSON',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 8,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Fidelity API Hub', dataObjectIds: ['data-fid-15'], technologyIds: ['tech-fid-07'],
  }),
  int('int-fid-27', 'IAM → Digital channels SSO', 'Customer and staff authentication for digital properties.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-26', targetApplicationId: 'app-fid-07',
    businessOwnerId: 'person-fid-ciso', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-43', 'cap-fid-14'],
    apiOrInterfaceName: 'OIDC_SSO', protocol: 'OIDC', dataFormat: 'JWT',
    lifecycleStatus: 'Active', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 6,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Keycloak', dataObjectIds: ['data-fid-15'], technologyIds: ['tech-fid-07'],
  }),
  int('int-fid-28', 'SOC → Core health events', 'Cyber and availability alerts for core banking.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-fid-25', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-ciso', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-43', 'cap-fid-44'], supportedProcessIds: ['prc-fid-20'],
    apiOrInterfaceName: 'CoreHealthAlert', protocol: 'Syslog/JSON', authenticationMethod: 'certificate',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'candidate',
    documentationStatus: 'partial', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'SIEM bus', dataObjectIds: ['data-fid-16'], technologyIds: ['tech-fid-17'],
    tags: ['cyber'],
  }),
  int('int-fid-29', 'Portfolio Tracker → Architecture Repository', 'Late-bound design artefacts pushed after build starts.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-28', targetApplicationId: 'app-fid-27',
    businessOwnerId: 'person-fid-chief-architect', technologyOwnerId: 'person-fid-domain-transformation',
    supportedCapabilityIds: ['cap-fid-41', 'cap-fid-42'], supportedProcessIds: ['prc-fid-21'],
    apiOrInterfaceName: 'DesignArtefactSync', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'candidate',
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'Fidelity API Hub', dataObjectIds: ['data-fid-17'], technologyIds: ['tech-fid-04'],
    tags: ['governance'], lastReviewDate: '2025-10-15',
  }),
  int('int-fid-30', 'Architecture Repository → Hub standards', 'Published API standards consumed by hub team.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-27', targetApplicationId: 'app-fid-15',
    businessOwnerId: 'person-fid-chief-architect', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-41', 'cap-fid-42'], supportedProcessIds: ['prc-fid-22'],
    apiOrInterfaceName: 'APIStandardPublish', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Planned', criticality: 'medium', reusabilityStatus: 'reusable', consumerCount: 0,
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: false,
    middlewarePlatform: 'Fidelity API Hub', dataObjectIds: ['data-fid-17'], technologyIds: ['tech-fid-04'],
    tags: ['governance', 'api-led'],
  }),
  int('int-fid-31', 'ERP → Data Lake finance extracts', 'Budget and cost centres for transformation reporting.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-fid-24', targetApplicationId: 'app-fid-22',
    businessOwnerId: 'person-fid-domain-finance', technologyOwnerId: 'person-fid-cdo',
    supportedCapabilityIds: ['cap-fid-31', 'cap-fid-34'], supportedProcessIds: ['prc-fid-23'],
    apiOrInterfaceName: 'FinanceCostETL', protocol: 'ETL',
    lifecycleStatus: 'Active', criticality: 'low', reusabilityStatus: 'candidate',
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    middlewarePlatform: 'Informatica', dataObjectIds: ['data-fid-18'], technologyIds: ['tech-fid-09'],
  }),
  int('int-fid-32', 'Hub → Account enquiry facade', 'Target reusable account API replacing mobile ODBC.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-15', targetApplicationId: 'app-fid-01',
    businessOwnerId: 'person-fid-chief-architect', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-14', 'cap-fid-42'], supportedProcessIds: ['prc-fid-07'],
    apiOrInterfaceName: 'AccountEnquiryAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Planned', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 0,
    transactionVolumeBand: 'very-high', availabilityTarget: '99.9%', dataSensitivity: 'restricted',
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: false,
    middlewarePlatform: 'Fidelity API Hub', dataObjectIds: ['data-fid-08'], technologyIds: ['tech-fid-04'],
    tags: ['api-led', 'channels'],
  }),
  int('int-fid-33', 'Hub → Transfer initiation facade', 'Mediated transfer API for mobile and web channels.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-15', targetApplicationId: 'app-fid-17',
    businessOwnerId: 'person-fid-domain-payments', technologyOwnerId: 'person-fid-chief-architect',
    supportedCapabilityIds: ['cap-fid-22', 'cap-fid-42'], supportedProcessIds: ['prc-fid-10'],
    apiOrInterfaceName: 'TransferInitiationAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Planned', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 0,
    transactionVolumeBand: 'very-high', availabilityTarget: '99.95%',
    documentationStatus: 'partial', monitoringStatus: 'unmonitored', pointToPoint: false,
    middlewarePlatform: 'Fidelity API Hub', dataObjectIds: ['data-fid-10'], technologyIds: ['tech-fid-04'],
    tags: ['api-led', 'payments'],
  }),
  int('int-fid-34', 'Mobile → Hub account enquiry (pilot)', 'Pilot REST path for balance enquiry via hub.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-07', targetApplicationId: 'app-fid-15',
    businessOwnerId: 'person-fid-domain-digital', technologyOwnerId: 'person-fid-chief-architect',
    supportedCapabilityIds: ['cap-fid-14', 'cap-fid-42'], supportedProcessIds: ['prc-fid-07'],
    apiOrInterfaceName: 'MobileHubBalancePilot', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Planned', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 1,
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'Fidelity API Hub', dataObjectIds: ['data-fid-08'], technologyIds: ['tech-fid-04', 'tech-fid-18'],
    tags: ['api-led', 'channels'],
  }),
  int('int-fid-35', 'Core → Hub transaction events (pilot)', 'Pilot event publication for channel consumers.', {
    pattern: 'event', integrationType: 'Event or message', sourceApplicationId: 'app-fid-01', targetApplicationId: 'app-fid-15',
    businessOwnerId: 'person-fid-domain-digital', technologyOwnerId: 'person-fid-chief-architect',
    supportedCapabilityIds: ['cap-fid-42', 'cap-fid-14'], supportedProcessIds: ['prc-fid-07'],
    apiOrInterfaceName: 'AccountChangeEvent', protocol: 'Kafka', dataFormat: 'Avro',
    lifecycleStatus: 'Planned', criticality: 'critical', reusabilityStatus: 'reusable', consumerCount: 1,
    transactionVolumeBand: 'very-high', availabilityTarget: '99.9%',
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: false,
    middlewarePlatform: 'Fidelity API Hub', dataObjectIds: ['data-fid-08'], technologyIds: ['tech-fid-04', 'tech-fid-18'],
    tags: ['api-led', 'channels'],
  }),
  int('int-fid-36', 'Parallel BI → Intranet KPI publish', 'Uncertified retail KPIs published to intranet.', {
    pattern: 'file', integrationType: 'Manual exchange', sourceApplicationId: 'app-fid-32', targetApplicationId: 'app-fid-14',
    businessOwnerId: 'person-fid-domain-retail', technologyOwnerId: 'person-fid-unknown',
    supportedCapabilityIds: ['cap-fid-34', 'cap-fid-06'], supportedProcessIds: ['prc-fid-05'],
    apiOrInterfaceName: 'ManualKPIUpload', protocol: 'manual', dataFormat: 'XLSX', authenticationMethod: 'N/A',
    lifecycleStatus: 'Active', criticality: 'medium', reusabilityStatus: 'point-to-point',
    documentationStatus: 'missing', monitoringStatus: 'unmonitored', pointToPoint: true,
    dataObjectIds: ['data-fid-03'], tags: ['shadow', 'duplicate'],
  }),
  int('int-fid-37', 'ERP → Portfolio Tracker costs', 'Initiative spend actuals.', {
    pattern: 'batch', integrationType: 'Batch integration', sourceApplicationId: 'app-fid-24', targetApplicationId: 'app-fid-28',
    businessOwnerId: 'person-fid-domain-transformation', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-41'], supportedProcessIds: ['prc-fid-21'],
    apiOrInterfaceName: 'InitiativeCostFeed', protocol: 'CSV/SFTP', dataFormat: 'CSV', authenticationMethod: 'SSH key',
    lifecycleStatus: 'Active', criticality: 'low', reusabilityStatus: 'point-to-point',
    documentationStatus: 'partial', monitoringStatus: 'partial', pointToPoint: true,
    dataObjectIds: ['data-fid-18'],
  }),
  int('int-fid-38', 'Loan Origination → AML screening', 'Pre-approval AML name screening.', {
    pattern: 'api', integrationType: 'REST API', sourceApplicationId: 'app-fid-10', targetApplicationId: 'app-fid-19',
    businessOwnerId: 'person-fid-cro', technologyOwnerId: 'person-fid-cio',
    supportedCapabilityIds: ['cap-fid-29', 'cap-fid-18'], supportedProcessIds: ['prc-fid-15'],
    apiOrInterfaceName: 'LoanAMLScreenAPI', protocol: 'HTTPS/JSON',
    lifecycleStatus: 'Active', criticality: 'high', reusabilityStatus: 'reusable', consumerCount: 2,
    documentationStatus: 'documented', monitoringStatus: 'monitored', pointToPoint: false,
    dataObjectIds: ['data-fid-04'], technologyIds: ['tech-fid-04'],
    tags: ['compliance', 'lending'],
  }),
]

export default fidelityIntegrations
