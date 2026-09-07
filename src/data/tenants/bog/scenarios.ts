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

const T = 'tenant-bog'

export const bogScenarios: GraphScenario[] = [
  {
    id: 'scenario-bog-lineage',
    tenantId: T,
    name: 'Regulatory Data Lineage',
    summary:
      'Supervisory and statistical returns arrive through overlapping intake channels with inconsistent definitions, incomplete lineage into the data lake, and parallel analytics products.',
    keyRisk:
      'Conflicting regulatory metrics and delayed supervisory interventions when lineage breaks across Legacy Returns Intake, Off-site Returns Engine and shadow BI.',
    startingEntityId: 'app-bog-11',
    startingEntityType: 'application',
    visibleEntityIds: [
      'app-bog-11',
      'app-bog-04',
      'app-bog-22',
      'app-bog-12',
      'app-bog-13',
      'app-bog-10',
      'app-bog-14',
      'int-bog-01',
      'int-bog-02',
      'int-bog-03',
      'int-bog-04',
      'int-bog-05',
      'int-bog-06',
      'cap-bog-30',
      'cap-bog-31',
      'cap-bog-32',
      'cap-bog-33',
      'data-bog-01',
      'data-bog-02',
      'data-bog-03',
      'find-bog-01',
      'find-bog-02',
      'ev-bog-01',
      'ev-bog-02',
      'ev-bog-03',
      'rec-bog-01',
    ],
    affectedCapabilityIds: ['cap-bog-30', 'cap-bog-31', 'cap-bog-32', 'cap-bog-33'],
    evidenceIds: ['ev-bog-01', 'ev-bog-02', 'ev-bog-03'],
    findingId: 'find-bog-01',
    recommendedAction:
      'Establish a governed regulatory data product catalogue with mandatory lineage from intake through certified supervisory datasets.',
    topologyFocusIntegrationIds: [
      'int-bog-01',
      'int-bog-02',
      'int-bog-03',
      'int-bog-04',
      'int-bog-05',
      'int-bog-06',
    ],
  },
  {
    id: 'scenario-bog-payments',
    tenantId: T,
    name: 'Payment-System Resilience',
    summary:
      'RTGS settlement, SWIFT messaging and retail-payments oversight form a critical dependency chain with limited failover monitoring and aging middleware.',
    keyRisk:
      'Prolonged settlement halt or opaque recovery if RTGS Core, SWIFT Gateway or unmonitored P2P settlement advice paths fail during peak windows.',
    startingEntityId: 'app-bog-06',
    startingEntityType: 'application',
    visibleEntityIds: [
      'app-bog-06',
      'app-bog-07',
      'app-bog-26',
      'app-bog-14',
      'app-bog-23',
      'app-bog-15',
      'int-bog-10',
      'int-bog-11',
      'int-bog-12',
      'int-bog-13',
      'int-bog-14',
      'int-bog-15',
      'cap-bog-14',
      'cap-bog-15',
      'cap-bog-16',
      'cap-bog-17',
      'data-bog-08',
      'data-bog-09',
      'find-bog-04',
      'find-bog-05',
      'ev-bog-06',
      'ev-bog-07',
      'ev-bog-08',
      'rec-bog-03',
      'init-bog-03',
    ],
    affectedCapabilityIds: ['cap-bog-14', 'cap-bog-15', 'cap-bog-16', 'cap-bog-17'],
    evidenceIds: ['ev-bog-06', 'ev-bog-07', 'ev-bog-08'],
    findingId: 'find-bog-04',
    recommendedAction:
      'Harden RTGS and SWIFT settlement paths with monitored failover, dead-letter handling and Architecture Review Board resilience gates.',
    topologyFocusIntegrationIds: [
      'int-bog-10',
      'int-bog-11',
      'int-bog-12',
      'int-bog-13',
      'int-bog-14',
      'int-bog-15',
    ],
  },
  {
    id: 'scenario-bog-governance',
    tenantId: T,
    name: 'Architecture Governance Operationalisation',
    summary:
      'Major change programmes reach implementation before Architecture Review Board engagement; end-of-support stacks and weak repository coverage undermine design assurance.',
    keyRisk:
      'Unreviewed architecture decisions lock in brittle integrations and extend exposure on Legacy Returns Intake and aging RTGS middleware.',
    startingEntityId: 'app-bog-20',
    startingEntityType: 'application',
    visibleEntityIds: [
      'app-bog-20',
      'app-bog-21',
      'app-bog-22',
      'app-bog-06',
      'app-bog-14',
      'int-bog-20',
      'int-bog-21',
      'tech-bog-03',
      'tech-bog-08',
      'tech-bog-12',
      'cap-bog-42',
      'cap-bog-43',
      'cap-bog-46',
      'cap-bog-47',
      'find-bog-07',
      'find-bog-08',
      'find-bog-09',
      'ev-bog-10',
      'ev-bog-11',
      'ev-bog-12',
      'rec-bog-05',
      'dec-bog-03',
      'init-bog-05',
    ],
    affectedCapabilityIds: ['cap-bog-42', 'cap-bog-43', 'cap-bog-46', 'cap-bog-47'],
    evidenceIds: ['ev-bog-10', 'ev-bog-11', 'ev-bog-12'],
    findingId: 'find-bog-07',
    recommendedAction:
      'Mandate early ARB gates for critical programmes, link every initiative to capabilities, and retire or wrap end-of-support platforms on a governed roadmap.',
    topologyFocusIntegrationIds: ['int-bog-20', 'int-bog-21'],
  },
]

export default bogScenarios
