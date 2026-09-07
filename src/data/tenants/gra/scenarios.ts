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

const T = 'tenant-gra'

export const graScenarios: GraphScenario[] = [
  {
    id: 'scenario-identity',
    tenantId: T,
    name: 'Taxpayer Identity Fragmentation',
    summary:
      'Taxpayer identity is exchanged through multiple inconsistent interfaces across portal, contact centre, customs and overlapping TIN stores.',
    keyRisk: 'Divergent taxpayer masters and cascading channel outages when any P2P identity path fails.',
    startingEntityId: 'app-gra-08',
    startingEntityType: 'application',
    visibleEntityIds: [
      'app-gra-08',
      'app-gra-13',
      'app-gra-03',
      'app-gra-04',
      'app-gra-02',
      'app-gra-07',
      'int-gra-01',
      'int-gra-03',
      'int-gra-07',
      'int-gra-17',
      'int-gra-18',
      'int-gra-30',
      'cap-gra-02',
      'cap-gra-27',
      'data-gra-01',
      'data-gra-02',
      'find-gra-01',
      'find-gra-02',
      'ev-gra-01',
      'ev-gra-02',
    ],
    affectedCapabilityIds: ['cap-gra-02', 'cap-gra-27', 'cap-gra-13'],
    evidenceIds: ['ev-gra-01', 'ev-gra-02', 'ev-gra-05'],
    findingId: 'find-gra-02',
    recommendedAction: 'Consolidate identity access onto TaxpayerIdentityAPI via the Integration Hub.',
    topologyFocusIntegrationIds: ['int-gra-01', 'int-gra-03', 'int-gra-07', 'int-gra-17', 'int-gra-18', 'int-gra-30'],
  },
  {
    id: 'scenario-payment',
    tenantId: T,
    name: 'Payment Confirmation Dependency',
    summary:
      'Payment confirmation depends on a critical chain from channels through the payments gateway into Domestic Tax Core and event subscribers.',
    keyRisk: 'Failure of PaymentAdviceAPI or the confirmation event bus delays posting and assurance visibility.',
    startingEntityId: 'int-gra-05',
    startingEntityType: 'integration',
    visibleEntityIds: [
      'app-gra-05',
      'app-gra-01',
      'app-gra-03',
      'app-gra-12',
      'app-gra-07',
      'app-gra-02',
      'int-gra-05',
      'int-gra-06',
      'int-gra-16',
      'int-gra-29',
      'int-gra-02',
      'cap-gra-05',
      'cap-gra-25',
      'data-gra-04',
      'data-gra-05',
      'find-gra-03',
      'ev-gra-06',
    ],
    affectedCapabilityIds: ['cap-gra-05', 'cap-gra-25', 'cap-gra-06'],
    evidenceIds: ['ev-gra-06'],
    findingId: 'find-gra-03',
    recommendedAction: 'Protect PaymentAdviceAPI SLO and expand reusable payment confirmation consumers via the hub.',
    topologyFocusIntegrationIds: ['int-gra-05', 'int-gra-06', 'int-gra-16', 'int-gra-29'],
  },
  {
    id: 'scenario-assurance',
    tenantId: T,
    name: 'Revenue Assurance Reconciliation',
    summary:
      'Revenue-assurance reconciliation still relies on batch and manual extracts into spreadsheet workbenches.',
    keyRisk: 'Multi-day leakage detection lag and unmonitored extracts create audit exposure.',
    startingEntityId: 'app-gra-06',
    startingEntityType: 'application',
    visibleEntityIds: [
      'app-gra-06',
      'app-gra-01',
      'app-gra-05',
      'app-gra-07',
      'int-gra-08',
      'int-gra-09',
      'int-gra-29',
      'int-gra-31',
      'cap-gra-06',
      'cap-gra-21',
      'prc-gra-05',
      'data-gra-07',
      'find-gra-03',
      'ev-gra-03',
      'ev-gra-06',
      'rec-gra-03',
      'init-gra-03',
    ],
    affectedCapabilityIds: ['cap-gra-06', 'cap-gra-21'],
    evidenceIds: ['ev-gra-03', 'ev-gra-06'],
    findingId: 'find-gra-03',
    recommendedAction: 'Replace spreadsheet extracts with automated matching subscribed to payment confirmation events.',
    topologyFocusIntegrationIds: ['int-gra-08', 'int-gra-09', 'int-gra-31', 'int-gra-29'],
  },
]
