/**
 * Typed Ask EA360 question catalogue (Q01–Q33) from the journeys brief.
 * Labels are presenter-facing; intents dispatch through the deterministic adapter.
 */

import type { AIIntent } from './types'

export type QuestionResponseKind =
  | 'ranked-list'
  | 'explanation'
  | 'entity-detail'
  | 'impact'
  | 'options'
  | 'briefing'
  | 'draft'
  | 'refusal'
  | 'readiness'
  | 'validation'
  | 'summary'

export type QuestionDefinition = {
  id: string
  label: string
  intent: AIIntent
  requiredContextType?: string | null
  scenarioBindingKey?: string
  supportedScopes: Array<'portfolio' | 'selection' | 'graph' | 'ingestion' | 'workspace'>
  expectedResponseKind: QuestionResponseKind
  paraphrases?: string[]
}

export const QUESTION_CATALOG: QuestionDefinition[] = [
  {
    id: 'Q01',
    label: 'What are our most critical enterprise risks?',
    intent: 'critical_risks',
    supportedScopes: ['portfolio'],
    expectedResponseKind: 'ranked-list',
    paraphrases: ['top risks', 'biggest enterprise risks', 'most critical risks'],
  },
  {
    id: 'Q02',
    label: 'How is enterprise health calculated?',
    intent: 'explain_metric',
    supportedScopes: ['portfolio'],
    expectedResponseKind: 'explanation',
    paraphrases: ['explain enterprise health', 'health formula'],
  },
  {
    id: 'Q03',
    label: 'Explain this finding.',
    intent: 'explain_finding',
    requiredContextType: 'finding',
    supportedScopes: ['selection'],
    expectedResponseKind: 'entity-detail',
    paraphrases: ['explain this finding', 'what is this finding'],
  },
  {
    id: 'Q04',
    label: 'Which recommendations are awaiting decisions?',
    intent: 'recommendations_awaiting_decision',
    supportedScopes: ['portfolio'],
    expectedResponseKind: 'ranked-list',
    paraphrases: ['awaiting decision', 'pending recommendations'],
  },
  {
    id: 'Q05',
    label: 'Generate an executive briefing.',
    intent: 'executive_briefing',
    supportedScopes: ['portfolio'],
    expectedResponseKind: 'briefing',
    paraphrases: ['board summary', 'executive briefing', 'brief the board'],
  },
  {
    id: 'Q06',
    label: 'Which capabilities have the largest maturity gaps?',
    intent: 'maturity_gaps',
    supportedScopes: ['portfolio'],
    expectedResponseKind: 'ranked-list',
    paraphrases: ['largest maturity gaps', 'capability gaps'],
  },
  {
    id: 'Q07',
    label: 'Which applications support this capability?',
    intent: 'capability_applications',
    requiredContextType: 'capability',
    supportedScopes: ['selection'],
    expectedResponseKind: 'ranked-list',
    paraphrases: ['applications supporting', 'apps for this capability'],
  },
  {
    id: 'Q08',
    label: 'Which applications should be migrated or eliminated?',
    intent: 'time_migrate_eliminate',
    supportedScopes: ['portfolio'],
    expectedResponseKind: 'ranked-list',
    paraphrases: ['migrate or eliminate', 'TIME candidates'],
  },
  {
    id: 'Q09',
    label: 'What is the impact of retiring this application?',
    intent: 'impact_analysis',
    requiredContextType: 'application',
    supportedScopes: ['selection', 'graph'],
    expectedResponseKind: 'impact',
    paraphrases: ['retire this app', 'impact of retiring this application'],
  },
  {
    id: 'Q10',
    label: 'Where are point-to-point integrations concentrated?',
    intent: 'p2p_concentration',
    supportedScopes: ['portfolio'],
    expectedResponseKind: 'ranked-list',
    paraphrases: ['P2P concentration', 'point-to-point integrations'],
  },
  {
    id: 'Q11',
    label: 'What depends on PaymentAdviceAPI?',
    intent: 'integration_dependents',
    scenarioBindingKey: 'paymentIntegrationId',
    requiredContextType: 'integration',
    supportedScopes: ['selection', 'graph'],
    expectedResponseKind: 'impact',
    paraphrases: ['who uses PaymentAdviceAPI', 'consumers of payment advice API'],
  },
  {
    id: 'Q12',
    label: 'What happens if PaymentAdviceAPI is unavailable?',
    intent: 'impact_analysis',
    scenarioBindingKey: 'paymentIntegrationId',
    requiredContextType: 'integration',
    supportedScopes: ['selection', 'graph'],
    expectedResponseKind: 'impact',
    paraphrases: ['if PaymentAdviceAPI is unavailable', 'payment advice unavailable'],
  },
  {
    id: 'Q13',
    label: 'Which evidence supports this risk?',
    intent: 'evidence_for_finding',
    requiredContextType: 'finding',
    supportedScopes: ['selection'],
    expectedResponseKind: 'ranked-list',
    paraphrases: ['show the evidence', 'evidence for this risk'],
  },
  {
    id: 'Q14',
    label: 'What are the response options for this recommendation?',
    intent: 'recommendation_options',
    requiredContextType: 'recommendation',
    supportedScopes: ['selection'],
    expectedResponseKind: 'options',
    paraphrases: ['response options', 'what should we do'],
  },
  {
    id: 'Q15',
    label: 'Summarise this initiative and its KPIs.',
    intent: 'initiative_kpi_summary',
    requiredContextType: 'initiative',
    supportedScopes: ['selection'],
    expectedResponseKind: 'summary',
    paraphrases: ['summarise this initiative', 'initiative KPIs'],
  },
  {
    id: 'Q16',
    label: 'Which critical data domains have governance gaps?',
    intent: 'data_governance_gaps',
    supportedScopes: ['portfolio'],
    expectedResponseKind: 'ranked-list',
    paraphrases: ['data governance gaps', 'critical data gaps'],
  },
  {
    id: 'Q17',
    label: 'What are the source and consumers of this data domain?',
    intent: 'data_lineage',
    requiredContextType: 'dataObject',
    supportedScopes: ['selection'],
    expectedResponseKind: 'entity-detail',
    paraphrases: ['source and consumers', 'data lineage'],
  },
  {
    id: 'Q18',
    label: 'Is this data domain ready for AI use?',
    intent: 'data_ai_readiness',
    requiredContextType: 'dataObject',
    supportedScopes: ['selection'],
    expectedResponseKind: 'summary',
    paraphrases: ['ready for AI', 'AI readiness'],
  },
  {
    id: 'Q19',
    label: 'Which reviews or controls are missing for this data?',
    intent: 'data_controls_missing',
    requiredContextType: 'dataObject',
    supportedScopes: ['selection'],
    expectedResponseKind: 'ranked-list',
    paraphrases: ['missing controls', 'missing reviews for this data'],
  },
  {
    id: 'Q20',
    label: 'Which technologies are at or approaching end of support?',
    intent: 'eos_technologies',
    supportedScopes: ['portfolio'],
    expectedResponseKind: 'ranked-list',
    paraphrases: ['EOS technologies', 'unsupported technology', 'end of support'],
  },
  {
    id: 'Q21',
    label: 'What services depend on this technology?',
    intent: 'technology_dependents',
    requiredContextType: 'technology',
    supportedScopes: ['selection', 'graph'],
    expectedResponseKind: 'impact',
    paraphrases: ['services depend on', 'what depends on this technology'],
  },
  {
    id: 'Q22',
    label: 'Why should we prioritise this technology?',
    intent: 'technology_priority',
    requiredContextType: 'technology',
    supportedScopes: ['selection'],
    expectedResponseKind: 'explanation',
    paraphrases: ['prioritise this technology', 'why this technology'],
  },
  {
    id: 'Q23',
    label: 'Summarise this technology risk for the CTO.',
    intent: 'technology_cto_summary',
    requiredContextType: 'technology',
    supportedScopes: ['selection'],
    expectedResponseKind: 'summary',
    paraphrases: ['CTO summary', 'technology risk summary'],
  },
  {
    id: 'Q24',
    label: 'Which AI use cases need governance attention?',
    intent: 'ai_governance_attention',
    supportedScopes: ['portfolio'],
    expectedResponseKind: 'ranked-list',
    paraphrases: ['AI use cases needing governance', 'AI governance gaps'],
  },
  {
    id: 'Q25',
    label: 'Explain this agent and its risks.',
    intent: 'ai_agent_explain',
    requiredContextType: 'aiSolution',
    supportedScopes: ['selection'],
    expectedResponseKind: 'entity-detail',
    paraphrases: ['explain this agent', 'agent risks'],
  },
  {
    id: 'Q26',
    label: 'What can this agent do, and which controls are missing?',
    intent: 'ai_agent_permissions',
    requiredContextType: 'aiSolution',
    supportedScopes: ['selection'],
    expectedResponseKind: 'summary',
    paraphrases: ['agent guardrail gaps', 'what permissions does this agent have'],
  },
  {
    id: 'Q27',
    label: 'What depends on this AI model, or what does this agent depend on?',
    intent: 'ai_model_dependencies',
    supportedScopes: ['selection', 'graph'],
    expectedResponseKind: 'impact',
    paraphrases: ['model dependencies', 'agent dependencies'],
  },
  {
    id: 'Q28',
    label: 'Draft a recommendation for this finding.',
    intent: 'recommendation_draft',
    requiredContextType: 'finding',
    supportedScopes: ['selection'],
    expectedResponseKind: 'draft',
    paraphrases: ['draft a recommendation', 'draft recommendation'],
  },
  {
    id: 'Q29',
    label: 'Approve this recommendation / agent for production.',
    intent: 'refuse_approval',
    supportedScopes: ['selection'],
    expectedResponseKind: 'refusal',
    paraphrases: ['approve this for production', 'approve this recommendation'],
  },
  {
    id: 'Q30',
    label: 'How will we measure this agent’s improvement?',
    intent: 'ai_agent_kpi',
    requiredContextType: 'aiSolution',
    supportedScopes: ['selection'],
    expectedResponseKind: 'summary',
    paraphrases: ['measure this agent', 'agent improvement KPI'],
  },
  {
    id: 'Q31',
    label: 'What changed during this demo?',
    intent: 'demo_changes',
    supportedScopes: ['workspace'],
    expectedResponseKind: 'summary',
    paraphrases: ['what changed', 'demo changes'],
  },
  {
    id: 'Q32',
    label: 'Why did this import fail validation?',
    intent: 'import_validation',
    supportedScopes: ['ingestion'],
    expectedResponseKind: 'validation',
    paraphrases: ['import fail', 'validation issues', 'what is blocking this data import', 'blocking this import'],
  },
  {
    id: 'Q33',
    label: 'Is this workspace ready, and what should I review first?',
    intent: 'workspace_readiness',
    supportedScopes: ['workspace'],
    expectedResponseKind: 'readiness',
    paraphrases: ['workspace ready', 'first priorities', 'readiness'],
  },
]

export const QUESTION_BY_ID = Object.fromEntries(
  QUESTION_CATALOG.map((q) => [q.id, q]),
) as Record<string, QuestionDefinition>

/** Resolve a chip or free-text prompt to a catalogue question when possible. */
export function resolveQuestionDefinition(text: string): QuestionDefinition | null {
  const q = text.trim().toLowerCase()
  if (!q) return null
  for (const def of QUESTION_CATALOG) {
    if (def.label.toLowerCase() === q) return def
    if (def.paraphrases?.some((p) => q.includes(p.toLowerCase()) || p.toLowerCase() === q)) {
      return def
    }
  }
  return null
}

/** Contextual suggested questions for a view / selected entity type. */
export function suggestedQuestionsForContext(opts: {
  view?: string
  entityType?: string | null
  journeyStepQuestionIds?: string[]
}): QuestionDefinition[] {
  const { view, entityType, journeyStepQuestionIds } = opts
  if (journeyStepQuestionIds?.length) {
    return journeyStepQuestionIds.map((id) => QUESTION_BY_ID[id]).filter(Boolean)
  }

  const picks: string[] = []
  if (entityType === 'finding') picks.push('Q03', 'Q13', 'Q28')
  else if (entityType === 'application') picks.push('Q08', 'Q09')
  else if (entityType === 'capability') picks.push('Q06', 'Q07')
  else if (entityType === 'integration') picks.push('Q11', 'Q12', 'Q10')
  else if (entityType === 'dataObject') picks.push('Q17', 'Q18', 'Q19')
  else if (entityType === 'technology') picks.push('Q20', 'Q21', 'Q22', 'Q23')
  else if (entityType === 'aiSolution' || entityType === 'aiModel') {
    picks.push('Q25', 'Q26', 'Q27', 'Q30')
  } else if (entityType === 'recommendation') picks.push('Q14', 'Q04', 'Q29')
  else if (entityType === 'initiative') picks.push('Q15', 'Q31')
  else if (view === 'executive' || view === 'demo-studio') picks.push('Q01', 'Q02', 'Q04', 'Q05')
  else if (view === 'data-information' || view === 'ai-data-governance') {
    picks.push('Q16', 'Q18', 'Q19')
  } else if (view === 'ai-automation') picks.push('Q24', 'Q25', 'Q26')
  else if (view === 'technology-infrastructure') picks.push('Q20', 'Q21', 'Q23')
  else if (view === 'integrations') picks.push('Q10', 'Q11', 'Q12')
  else if (view === 'onboarding' || view === 'data-ingestion') picks.push('Q32', 'Q33')
  else picks.push('Q01', 'Q04', 'Q05', 'Q08', 'Q20', 'Q24')

  const unique = [...new Set(picks)].slice(0, 6)
  return unique.map((id) => QUESTION_BY_ID[id]).filter(Boolean)
}
