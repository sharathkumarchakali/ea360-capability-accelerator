import type { AIIntent } from './types'

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
      /\b(approve|autonomously decide|make the decision|sign off)\b/i,
      /\bapprove (this |the )?(decision|recommendation|initiative)\b/i,
    ],
  },
  {
    intent: 'refuse_guaranteed_finance',
    priority: 100,
    patterns: [
      /\bguaranteed (saving|return|roi|benefit)\b/i,
      /\bexact (saving|cost|roi)\b/i,
      /\bwill save exactly\b/i,
    ],
  },
  {
    intent: 'cross_tenant_refused',
    priority: 100,
    // Broad markers; buildAIContext narrows using active tenant so self-mentions are allowed.
    patterns: [
      /\b(bog|bank of ghana|fidelity|ghana revenue|gra|acme|other tenant|another tenant|cross[- ]tenant)\b/i,
    ],
  },
  {
    intent: 'critical_risks',
    priority: 80,
    patterns: [
      /\bcritical (enterprise )?risks?\b/i,
      /\bmost critical\b/i,
      /\btop risks?\b/i,
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
      /\bsupport(s|ing)? .+ (management|capability)\b/i,
    ],
  },
  {
    intent: 'integration_dependents',
    priority: 75,
    patterns: [
      /\bwhat depends on\b/i,
      /\bdepend(s|encies)? on\b/i,
      /\bconsumers? of\b/i,
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
      /\bend of support\b/i,
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
    intent: 'evidence_gaps',
    priority: 80,
    patterns: [
      /\bevidence (incomplete|stale|gaps?|missing)\b/i,
      /\bstale evidence\b/i,
      /\binsufficient(ly)? evidenced\b/i,
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
  if (/\b(other tenant|another tenant|cross[- ]tenant)\b/i.test(q)) return true
  for (const [code, re] of Object.entries(TENANT_MENTION_PATTERNS)) {
    if (activeTenantCode && code === activeTenantCode) continue
    if (re.test(q)) return true
  }
  return false
}

export function classifyIntent(
  query: string,
  explicit?: AIIntent,
  activeTenantCode?: string,
): AIIntent {
  if (explicit && explicit !== 'unsupported') return explicit
  const q = query.trim()
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
    if (row.patterns.some((re) => re.test(q))) {
      if (!best || row.priority > best.priority) {
        best = { intent: row.intent, priority: row.priority }
      }
    }
  }
  return best?.intent ?? 'unsupported'
}

export const SUGGESTED_QUESTIONS = [
  'What are our most critical enterprise risks?',
  'Which capabilities have the largest maturity gaps?',
  'Which applications should be migrated or eliminated?',
  'What depends on the Payment Confirmation API?',
  'Where are point-to-point integrations concentrated?',
  'Which technologies are approaching end of support?',
  'Which findings do not have remediation initiatives?',
  'Which recommendations are awaiting decisions?',
  'Where is evidence incomplete or stale?',
  'What should the executive committee review this quarter?',
]
