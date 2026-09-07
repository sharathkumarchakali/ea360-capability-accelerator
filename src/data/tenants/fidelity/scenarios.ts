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

const T = 'tenant-fid'

export const fidelityScenarios: GraphScenario[] = [
  {
    id: 'scenario-fid-customer360',
    tenantId: T,
    name: 'Customer 360 & Digital Onboarding Duplication',
    summary:
      'Retail and digital onboarding channels maintain parallel customer profiles without a governed golden record, causing KYC rework and inconsistent party identifiers across CRM, core banking and mobile wallet enrolment.',
    keyRisk:
      'Regulatory KYC gaps and poor cross-sell insight when Branch Onboarding Suite, Digital Onboarding Portal and legacy CRM each create independent CIF numbers.',
    startingEntityId: 'app-fid-03',
    startingEntityType: 'application',
    visibleEntityIds: [
      'app-fid-03',
      'app-fid-04',
      'app-fid-05',
      'app-fid-06',
      'app-fid-14',
      'app-fid-22',
      'int-fid-01',
      'int-fid-02',
      'int-fid-03',
      'int-fid-04',
      'int-fid-05',
      'cap-fid-01',
      'cap-fid-02',
      'cap-fid-03',
      'cap-fid-13',
      'data-fid-01',
      'data-fid-02',
      'find-fid-01',
      'find-fid-02',
      'ev-fid-01',
      'ev-fid-02',
      'ev-fid-03',
      'rec-fid-01',
      'init-fid-01',
    ],
    affectedCapabilityIds: ['cap-fid-01', 'cap-fid-02', 'cap-fid-03', 'cap-fid-13'],
    evidenceIds: ['ev-fid-01', 'ev-fid-02', 'ev-fid-03'],
    findingId: 'find-fid-01',
    recommendedAction:
      'Establish a governed Customer 360 golden record with mandatory match-and-merge before account opening across branch and digital channels.',
    topologyFocusIntegrationIds: [
      'int-fid-01',
      'int-fid-02',
      'int-fid-03',
      'int-fid-04',
      'int-fid-05',
    ],
  },
  {
    id: 'scenario-fid-api',
    tenantId: T,
    name: 'API-Led Channel Modernisation',
    summary:
      'Mobile banking, USSD gateway and agency banking interfaces connect to core banking through overlapping point-to-point paths while the Enterprise API Hub facades remain Planned.',
    keyRisk:
      'Channel outages and slow feature delivery when Mobile Banking App, USSD Gateway and Agency POS each maintain bespoke core integrations without monitoring or reuse.',
    startingEntityId: 'app-fid-15',
    startingEntityType: 'application',
    visibleEntityIds: [
      'app-fid-15',
      'app-fid-07',
      'app-fid-08',
      'app-fid-09',
      'app-fid-01',
      'app-fid-16',
      'int-fid-10',
      'int-fid-11',
      'int-fid-12',
      'int-fid-13',
      'int-fid-14',
      'int-fid-35',
      'cap-fid-13',
      'cap-fid-14',
      'cap-fid-41',
      'cap-fid-42',
      'data-fid-08',
      'find-fid-04',
      'find-fid-05',
      'ev-fid-04',
      'ev-fid-05',
      'ev-fid-06',
      'rec-fid-03',
      'init-fid-03',
    ],
    affectedCapabilityIds: ['cap-fid-13', 'cap-fid-14', 'cap-fid-41', 'cap-fid-42'],
    evidenceIds: ['ev-fid-04', 'ev-fid-05', 'ev-fid-06'],
    findingId: 'find-fid-04',
    recommendedAction:
      'Prioritise hub-mediated account and payment APIs with monitoring, throttling and a staged retirement of critical P2P channel integrations.',
    topologyFocusIntegrationIds: [
      'int-fid-10',
      'int-fid-11',
      'int-fid-12',
      'int-fid-13',
      'int-fid-14',
      'int-fid-35',
    ],
  },
  {
    id: 'scenario-fid-lending',
    tenantId: T,
    name: 'Lending Process Simplification',
    summary:
      'Retail and SME lending journeys span Loan Origination Portal, Credit Workbench and spreadsheet trackers with manual document handoffs and duplicated credit policy checks.',
    keyRisk:
      'Extended time-to-yes and policy breaches when credit analysts re-key facility terms and collateral data across Origination Portal, Core Lending and offline approval packs.',
    startingEntityId: 'app-fid-10',
    startingEntityType: 'application',
    visibleEntityIds: [
      'app-fid-10',
      'app-fid-11',
      'app-fid-01',
      'app-fid-12',
      'app-fid-23',
      'int-fid-20',
      'int-fid-21',
      'int-fid-22',
      'int-fid-23',
      'cap-fid-17',
      'cap-fid-18',
      'cap-fid-19',
      'cap-fid-25',
      'data-fid-05',
      'data-fid-06',
      'find-fid-07',
      'find-fid-08',
      'ev-fid-07',
      'ev-fid-08',
      'ev-fid-09',
      'rec-fid-05',
      'dec-fid-03',
      'init-fid-05',
    ],
    affectedCapabilityIds: ['cap-fid-17', 'cap-fid-18', 'cap-fid-19', 'cap-fid-25'],
    evidenceIds: ['ev-fid-07', 'ev-fid-08', 'ev-fid-09'],
    findingId: 'find-fid-07',
    recommendedAction:
      'Consolidate lending origination onto a single workflow with embedded policy rules, digital document vault handoffs and straight-through booking to core lending.',
    topologyFocusIntegrationIds: [
      'int-fid-20',
      'int-fid-21',
      'int-fid-22',
      'int-fid-23',
    ],
  },
]

export default fidelityScenarios
