import type { AIIntent } from './types'
import { resolveQuestionDefinition } from './questionCatalog'

export type IntentPattern = {
  intent: AIIntent
  patterns: RegExp[]
  priority: number
}

/** Ordered intent patterns for deterministic query classification. */
export const INTENT_PATTERNS: IntentPattern[] = [
  {
    intent: 'refuse_approval',
    priority: 100,
    patterns: [
      /^(please\s+)?approve\b/i,
      /\bapprove (this|the) (recommendation|decision|initiative|agent|finding)\b/i,
      /\bapprove .+ for production\b/i,
      /\bautonomously decide\b/i,
      /\bmake the decision\b/i,
      /\bsign off (on|this)\b/i,
    ],
  },
  {
    intent: 'approval_authority',
    priority: 95,
    patterns: [
      /\bwho can approve\b/i,
      /\bwho (is|are) (the )?approver/i,
      /\bapproval authority\b/i,
      /\brequired (approver|authority)\b/i,
    ],
  },
  {
    intent: 'approved_items',
    priority: 95,
    patterns: [
      /\bwhich .+ (are|is) approved\b/i,
      /\blist (approved|approvals)\b/i,
      /\bapproved (recommendations|decisions|items)\b/i,
    ],
  },
  {
    intent: 'refuse_guaranteed_finance',
    priority: 100,
    patterns: [
      /\bguaranteed? (the )?(saving|return|roi|benefit|payback)s?\b/i,
      /\bguarantee\b.*\b(saving|return|roi|benefit|payback)s?\b/i,
      /\bexact (saving|cost|roi)\b/i,
      /\bwill save exactly\b/i,
    ],
  },
  {
    intent: 'cross_tenant_refused',
    priority: 100,
    patterns: [
      /\b(other tenant|another tenant|cross[- ]tenant|compare with another)\b/i,
    ],
  },
  {
    intent: 'critical_risks',
    priority: 80,
    patterns: [
      /\bcritical (enterprise )?risks?\b/i,
      /\bmost critical\b/i,
      /\btop risks?\b/i,
      /\bbiggest (enterprise )?risks?\b/i,
      /\benterprise risks?\b/i,
    ],
  },
  {
    intent: 'maturity_gaps',
    priority: 80,
    patterns: [
      /\bmaturity gaps?\b/i,
      /\blargest maturity\b/i,
      /\bcapability.*gap\b/i,
      /\bgap.*capacit/i,
    ],
  },
  {
    intent: 'time_migrate_eliminate',
    priority: 80,
    patterns: [
      /\b(migrate|eliminate)\b/i,
      /\bTIME\b/,
      /\bshould be (migrated|eliminated|retired)\b/i,
    ],
  },
  {
    intent: 'capability_applications',
    priority: 70,
    patterns: [
      /\bwhich applications support\b/i,
      /\bapplications (for|supporting)\b/i,
      /\bapps? (supporting|for) (this |the )?capacit/i,
      /\bsupport(s|ing)? .+ (management|capability)\b/i,
    ],
  },
  {
    intent: 'integration_dependents',
    priority: 78,
    patterns: [
      /\bwhat depends on\b/i,
      /\bwho uses\b/i,
      /\bconsumers? of\b/i,
      /\bdepend(s|encies)? on\b/i,
    ],
  },
  {
    intent: 'impact_analysis',
    priority: 75,
    patterns: [
      /\bwhat happens if\b/i,
      /\bunavailable\b/i,
      /\bimpact (of|analysis|if)\b/i,
      /\bretire(ment|d)?\b/i,
      /\bfailure\b/i,
    ],
  },
  {
    intent: 'p2p_concentration',
    priority: 80,
    patterns: [
      /\bpoint[- ]to[- ]point\b/i,
      /\bp2p\b/i,
      /\bintegrations? concentrated\b/i,
    ],
  },
  {
    intent: 'eos_technologies',
    priority: 80,
    patterns: [
      /\bend of support\b/i,
      /\beos\b/i,
      /\bunsupported technolog/i,
      /\bapproaching (end|eos|retirement)\b/i,
      /\btechnologies? .*(legacy|deprecated|retire)\b/i,
    ],
  },
  {
    intent: 'findings_without_remediation',
    priority: 80,
    patterns: [
      /\bfindings? (without|with no) (remediation|initiative)/i,
      /\bno remediation\b/i,
      /\bwithout initiatives?\b/i,
    ],
  },
  {
    intent: 'recommendations_awaiting_decision',
    priority: 80,
    patterns: [
      /\bawaiting (decision|review|arb)\b/i,
      /\brecommendations? .*(pending|awaiting)\b/i,
      /\barb queue\b/i,
    ],
  },
  {
    intent: 'initiatives_for_objective',
    priority: 70,
    patterns: [
      /\binitiatives? (support|for|linked to)\b/i,
      /\bsupport(s|ing)? (this |the )?strategic objective\b/i,
    ],
  },
  {
    intent: 'executive_review',
    priority: 70,
    patterns: [
      /\bexecutive (committee )?review\b/i,
      /\bthis quarter\b/i,
      /\bshould .+ review\b/i,
    ],
  },
  {
    intent: 'evidence_for_finding',
    priority: 85,
    patterns: [
      /\bwhich evidence supports\b/i,
      /\bevidence (for|supporting) (this |the )?(risk|finding)\b/i,
      /\bshow (the )?evidence\b/i,
    ],
  },
  {
    intent: 'evidence_gaps',
    priority: 80,
    patterns: [
      /\bevidence (incomplete|stale|gaps?|missing)\b/i,
      /\bstale evidence\b/i,
      /\binsufficient(ly)? evidenced\b/i,
    ],
  },
  {
    intent: 'explain_finding',
    priority: 82,
    patterns: [
      /\bexplain (this |the )?finding\b/i,
      /\bwhat is (this |the )?finding\b/i,
    ],
  },
  {
    intent: 'recommendation_options',
    priority: 82,
    patterns: [
      /\bresponse options?\b/i,
      /\boptions (for|on) (this |the )?recommendation\b/i,
      /\bwhat (are|were) the (response )?options\b/i,
    ],
  },
  {
    intent: 'initiative_kpi_summary',
    priority: 82,
    patterns: [
      /\bsummarise (this |the )?initiative\b/i,
      /\bsummarize (this |the )?initiative\b/i,
      /\binitiative .+ kpi/i,
      /\bkpis? (for|of) (this |the )?initiative\b/i,
    ],
  },
  {
    intent: 'data_governance_gaps',
    priority: 82,
    patterns: [
      /\bdata (domain )?governance gaps?\b/i,
      /\bcritical data .+ gaps?\b/i,
      /\bgovernance gaps?.{0,40}data\b/i,
    ],
  },
  {
    intent: 'data_lineage',
    priority: 82,
    patterns: [
      /\bsource and consumers?\b/i,
      /\bdata lineage\b/i,
      /\bconsumers? of .{0,40}data\b/i,
    ],
  },
  {
    intent: 'data_ai_readiness',
    priority: 85,
    patterns: [
      /\bready for ai\b/i,
      /\bai readiness\b/i,
      /\bready for ai use\b/i,
    ],
  },
  {
    intent: 'data_controls_missing',
    priority: 82,
    patterns: [
      /\b(reviews?|controls?) .{0,30}missing\b/i,
      /\bmissing (reviews?|controls?)\b/i,
    ],
  },
  {
    intent: 'technology_dependents',
    priority: 82,
    patterns: [
      /\bservices? depend(s|ing)? on\b/i,
      /\bwhat (services?|apps?) depend on .{0,40}(technolog|stack|cobol|legacy)/i,
    ],
  },
  {
    intent: 'technology_priority',
    priority: 82,
    patterns: [
      /\bprioriti[sz]e (this |the )?technolog/i,
      /\bwhy .{0,20}(this |the )?technolog/i,
    ],
  },
  {
    intent: 'technology_cto_summary',
    priority: 82,
    patterns: [
      /\bcto summary\b/i,
      /\bsummarise .{0,30}technolog/i,
      /\btechnology risk (for|summary)\b/i,
    ],
  },
  {
    intent: 'ai_governance_attention',
    priority: 82,
    patterns: [
      /\bai use cases? need/i,
      /\bai .{0,20}governance (attention|gaps?)\b/i,
      /\bgovernance attention\b/i,
    ],
  },
  {
    intent: 'ai_agent_explain',
    priority: 82,
    patterns: [
      /\bexplain .{0,40}agent\b/i,
      /\bagent .{0,20}risks?\b/i,
    ],
  },
  {
    intent: 'ai_agent_permissions',
    priority: 85,
    patterns: [
      /\bwhat can (this |the )?agent do\b/i,
      /\bagent (guardrail|permission)/i,
      /\bpermissions? does (this |the )?agent\b/i,
      /\bcontrols? (are )?missing\b/i,
    ],
  },
  {
    intent: 'ai_model_dependencies',
    priority: 82,
    patterns: [
      /\bdepends on (this |the )?(ai )?model\b/i,
      /\bmodel dependenc/i,
      /\bagent depend(s| on)\b/i,
    ],
  },
  {
    intent: 'ai_agent_kpi',
    priority: 82,
    patterns: [
      /\bmeasure (this |the )?agent\b/i,
      /\bagent.{0,20}(improvement|kpi|metric)\b/i,
      /\bhow will we measure\b/i,
    ],
  },
  {
    intent: 'import_validation',
    priority: 85,
    patterns: [
      /\bimport (fail|validation)\b/i,
      /\bwhy did .{0,20}import\b/i,
      /\bvalidation (issues?|errors?)\b/i,
    ],
  },
  {
    intent: 'workspace_readiness',
    priority: 85,
    patterns: [
      /\bworkspace ready\b/i,
      /\breadiness\b/i,
      /\bwhat should i review first\b/i,
      /\bfirst priorities\b/i,
    ],
  },
  {
    intent: 'demo_changes',
    priority: 80,
    patterns: [
      /\bwhat changed\b/i,
      /\bdemo(nstration)? (state|changes)\b/i,
      /\bmutations?\b/i,
    ],
  },
  {
    intent: 'executive_briefing',
    priority: 85,
    patterns: [
      /\bexecutive briefing\b/i,
      /\bboard summary\b/i,
      /\bbriefing\b/i,
      /\bbrief the (commissioner|cio|board|committee)\b/i,
    ],
  },
  {
    intent: 'recommendation_draft',
    priority: 85,
    patterns: [
      /\bdraft (a )?recommendation\b/i,
      /\brecommendation draft\b/i,
      /\bsuggest (a )?recommendation\b/i,
    ],
  },
  {
    intent: 'explain_metric',
    priority: 60,
    patterns: [
      /\bexplain\b/i,
      /\bhow (is|was) .+ calculated\b/i,
      /\bwhy (is|does)\b/i,
    ],
  },
]

/** Alias patterns for known synthetic tenants (exclude active tenant when classifying). */
export const TENANT_MENTION_PATTERNS: Record<string, RegExp> = {
  GRA: /\b(gra|ghana revenue)\b/i,
  BOG: /\b(bog|bank of ghana)\b/i,
  FIDELITY: /\b(fidelity)\b/i,
  GENERIC: /\b(acme)\b/i,
}

export function mentionsOtherTenant(query: string, activeTenantCode?: string): boolean {
  const q = query.trim()
  if (/\b(other tenant|another tenant|cross[- ]tenant|compare with another)\b/i.test(q)) {
    return true
  }
  for (const [code, re] of Object.entries(TENANT_MENTION_PATTERNS)) {
    if (activeTenantCode && code === activeTenantCode) continue
    if (re.test(q)) return true
  }
  return false
}

/** True when the user is asking to execute an approval, not asking about approvals. */
export function isApprovalExecutionRequest(query: string): boolean {
  const q = query.trim()
  if (/\bwho can approve\b/i.test(q)) return false
  if (/\bwhich .+ (are|is) approved\b/i.test(q)) return false
  if (/\bapproved status\b/i.test(q)) return false
  if (/\bapproval authority\b/i.test(q)) return false
  return (
    /^(please\s+)?approve\b/i.test(q) ||
    /\bapprove (this|the) (recommendation|decision|initiative|agent|finding)\b/i.test(q) ||
    /\bapprove .+ for production\b/i.test(q) ||
    /\bautonomously decide\b/i.test(q) ||
    /\bsign off (on|this)\b/i.test(q)
  )
}

const GUARD_INTENTS: AIIntent[] = [
  'refuse_approval',
  'refuse_guaranteed_finance',
  'cross_tenant_refused',
]

/**
 * Classify intent. Guardrails always win over an explicit caller-supplied intent.
 * Catalogue question IDs and paraphrases resolve before free-text patterns.
 */
export function classifyIntent(
  query: string,
  explicit?: AIIntent,
  activeTenantCode?: string,
): AIIntent {
  const q = query.trim()
  if (!q && !explicit) return 'unsupported'

  if (mentionsOtherTenant(q, activeTenantCode)) return 'cross_tenant_refused'
  if (isApprovalExecutionRequest(q)) return 'refuse_approval'
  if (/\bguaranteed (saving|return|roi|benefit)\b/i.test(q) || /\bwill save exactly\b/i.test(q)) {
    return 'refuse_guaranteed_finance'
  }

  if (explicit && !GUARD_INTENTS.includes(explicit) && explicit !== 'unsupported') {
    return explicit
  }

  const fromCatalog = resolveQuestionDefinition(q)
  if (fromCatalog) return fromCatalog.intent

  if (!q) return 'unsupported'

  let best: { intent: AIIntent; priority: number } | null = null
  for (const row of INTENT_PATTERNS) {
    if (row.intent === 'cross_tenant_refused') {
      if (!mentionsOtherTenant(q, activeTenantCode)) continue
      if (!best || row.priority > best.priority) {
        best = { intent: row.intent, priority: row.priority }
      }
      continue
    }
    if (row.intent === 'refuse_approval' && !isApprovalExecutionRequest(q)) continue
    if (row.patterns.some((re) => re.test(q))) {
      if (!best || row.priority > best.priority) {
        best = { intent: row.intent, priority: row.priority }
      }
    }
  }
  return best?.intent ?? 'unsupported'
}

/** @deprecated Prefer suggestedQuestionsForContext from questionCatalog. */
export const SUGGESTED_QUESTIONS = [
  'What are our most critical enterprise risks?',
  'Which capabilities have the largest maturity gaps?',
  'Which applications should be migrated or eliminated?',
  'What depends on PaymentAdviceAPI?',
  'Where are point-to-point integrations concentrated?',
  'Which technologies are at or approaching end of support?',
  'Which findings do not have remediation initiatives?',
  'Which recommendations are awaiting decisions?',
  'Where is evidence incomplete or stale?',
  'Generate an executive briefing.',
]
