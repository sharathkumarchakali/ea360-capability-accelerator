import type { EntityType } from '@/domain/entities/types'

export type GraphScenario = {
  id: string
  tenantId: string
  name: string
  summary: string
  keyRisk: string
  startingEntityId: string
  startingEntityType: EntityType
  visibleEntityIds: string[]
  affectedCapabilityIds: string[]
  evidenceIds: string[]
  findingId: string
  recommendedAction: string
  topologyFocusIntegrationIds: string[]
}

const T = 'tenant-gen'

export const genericScenarios: GraphScenario[] = [
  {
    id: 'scenario-gen-cx',
    tenantId: T,
    name: 'Customer Experience Fragmentation',
    summary:
      'Customer profiles and service interactions arrive through overlapping web, mobile, contact-centre, and partner channels with inconsistent definitions and incomplete lineage into the enterprise data lake.',
    keyRisk:
      'Conflicting customer metrics and degraded service when profile data diverges across Customer Portal, Contact Centre CRM, Mobile Backend, and legacy intake paths.',
    startingEntityId: 'app-gen-02',
    startingEntityType: 'application',
    visibleEntityIds: [
      'app-gen-02',
      'app-gen-01',
      'app-gen-03',
      'app-gen-04',
      'app-gen-22',
      'app-gen-12',
      'app-gen-14',
      'int-gen-01',
      'int-gen-02',
      'int-gen-03',
      'int-gen-06',
      'int-gen-07',
      'int-gen-22',
      'cap-gen-01',
      'cap-gen-02',
      'cap-gen-03',
      'cap-gen-04',
      'data-gen-01',
      'data-gen-02',
      'find-gen-01',
      'find-gen-02',
      'ev-gen-01',
      'ev-gen-02',
      'ev-gen-03',
      'rec-gen-01',
    ],
    affectedCapabilityIds: ['cap-gen-01', 'cap-gen-02', 'cap-gen-03', 'cap-gen-04'],
    evidenceIds: ['ev-gen-01', 'ev-gen-02', 'ev-gen-03'],
    findingId: 'find-gen-01',
    recommendedAction:
      'Establish a governed customer data product catalogue with mandatory lineage from channel intake through certified enterprise datasets.',
    topologyFocusIntegrationIds: [
      'int-gen-01',
      'int-gen-02',
      'int-gen-03',
      'int-gen-06',
      'int-gen-07',
      'int-gen-22',
    ],
  },
  {
    id: 'scenario-gen-simplify',
    tenantId: T,
    name: 'Application Portfolio Simplification',
    summary:
      'Overlapping CRM, service-desk, and marketing platforms duplicate capability coverage while legacy intake and unmediated point-to-point integrations increase change cost.',
    keyRisk:
      'Sustained duplication spend and brittle change paths if Contact Centre CRM, Service Desk Platform, and Spreadsheet Analytics remain unconsolidated.',
    startingEntityId: 'app-gen-06',
    startingEntityType: 'application',
    visibleEntityIds: [
      'app-gen-06',
      'app-gen-02',
      'app-gen-16',
      'app-gen-04',
      'app-gen-17',
      'app-gen-18',
      'int-gen-10',
      'int-gen-23',
      'int-gen-14',
      'int-gen-25',
      'tech-gen-03',
      'tech-gen-11',
      'cap-gen-29',
      'cap-gen-03',
      'cap-gen-02',
      'find-gen-04',
      'find-gen-05',
      'find-gen-06',
      'ev-gen-04',
      'ev-gen-05',
      'ev-gen-06',
      'rec-gen-03',
      'dec-gen-02',
      'init-gen-03',
    ],
    affectedCapabilityIds: ['cap-gen-29', 'cap-gen-03', 'cap-gen-02', 'cap-gen-25'],
    evidenceIds: ['ev-gen-04', 'ev-gen-05', 'ev-gen-06'],
    findingId: 'find-gen-04',
    recommendedAction:
      'Rationalise overlapping customer-service and analytics applications with a governed retire/migrate plan and hub-mediated interfaces.',
    topologyFocusIntegrationIds: ['int-gen-10', 'int-gen-23', 'int-gen-14', 'int-gen-25'],
  },
  {
    id: 'scenario-gen-data',
    tenantId: T,
    name: 'Data Platform & Analytics Fragmentation',
    summary:
      'Enterprise analytics consumers pull from certified lake products, shadow spreadsheet tools, and ungoverned bypass loads — weakening a single source of truth for group KPIs.',
    keyRisk:
      'Executive decisions based on conflicting revenue and customer metrics when Spreadsheet Analytics and lake bypass paths publish parallel KPIs.',
    startingEntityId: 'app-gen-14',
    startingEntityType: 'application',
    visibleEntityIds: [
      'app-gen-14',
      'app-gen-15',
      'app-gen-16',
      'app-gen-07',
      'app-gen-04',
      'int-gen-02',
      'int-gen-03',
      'int-gen-04',
      'int-gen-05',
      'int-gen-17',
      'int-gen-24',
      'cap-gen-23',
      'cap-gen-24',
      'cap-gen-25',
      'data-gen-02',
      'data-gen-03',
      'find-gen-07',
      'find-gen-08',
      'ev-gen-07',
      'ev-gen-08',
      'ev-gen-09',
      'rec-gen-04',
      'dec-gen-01',
      'init-gen-01',
    ],
    affectedCapabilityIds: ['cap-gen-23', 'cap-gen-24', 'cap-gen-25'],
    evidenceIds: ['ev-gen-07', 'ev-gen-08', 'ev-gen-09'],
    findingId: 'find-gen-07',
    recommendedAction:
      'Mandate certified data products for group KPIs, retire shadow analytics extracts, and block ungoverned lake bypass loads.',
    topologyFocusIntegrationIds: [
      'int-gen-02',
      'int-gen-03',
      'int-gen-04',
      'int-gen-05',
      'int-gen-17',
      'int-gen-24',
    ],
  },
]

export default genericScenarios
