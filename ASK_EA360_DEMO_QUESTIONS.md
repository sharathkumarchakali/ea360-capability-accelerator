# Ask EA360 — Demo Questions (Q01–Q33)

Ask EA360 is a **prototype assistant that answers from the active workspace**. It is deterministic: the same
question on the same data gives the same answer, every cited record exists in the workspace, and every answer carries
its as-of date and data revision. Questions are defined in `src/lib/ai/questionCatalog.ts`.

All data shown is illustrative synthetic data.

## How a question is answered

- **Catalogue questions** (below) run their own intent. Questions that need a record use the record selected on screen; the journey step selects it for you.
- **Free text** is matched to the same intents (paraphrases such as "top risks" work). Anything outside them is answered "unsupported" with low confidence.
- **Follow-ups** — "Why?", "Show the evidence", "What is the impact?", "What are the options?" — keep the subject of the previous answer; they never fall back to a different selection.
- **Unknown names** ("What depends on Zebra Gateway?") are reported as not in the workspace; no other record is substituted.
- **Missing evidence** is stated (low confidence, "does not have sufficient verified evidence"); nothing is invented.
- **Stale answers** — when the workspace data or the demo as-of date changes, earlier answers show a banner and an **Ask again** action.
- **Open record** actions navigate to the record, keep the selection and minimise Ask so the record is visible.

## Question catalogue

| Id | Question | Context needed | Journeys | Answer kind |
|---|---|---|---|---|
| Q01 | What are our most critical enterprise risks? | — | J1 | ranked-list |
| Q02 | How is enterprise health calculated? | — | J1 | explanation |
| Q03 | Explain this finding. | Select a finding | J1, J7 | entity-detail |
| Q04 | Which recommendations are awaiting decisions? | — | J1, J7 | ranked-list |
| Q05 | Generate an executive briefing. | — | J1, J7 | briefing |
| Q06 | Which capabilities have the largest maturity gaps? | — | J2 | ranked-list |
| Q07 | Which applications support this capability? | Select a capability | J2 | ranked-list |
| Q08 | Which applications should be migrated or eliminated? | — | J2 | ranked-list |
| Q09 | What is the impact of retiring this application? | Select an application | J2 | impact |
| Q10 | Where are point-to-point integrations concentrated? | — | J3 | ranked-list |
| Q11 | What depends on PaymentAdviceAPI? | Select the payment integration | J3 | impact |
| Q12 | What happens if PaymentAdviceAPI is unavailable? | Select the payment integration | J3 | impact |
| Q13 | Which evidence supports this risk? | Select a finding | J3, J7 | ranked-list |
| Q14 | What are the response options for this recommendation? | Select a recommendation | J3, J7 | options |
| Q15 | Summarise this initiative and its KPIs. | Select an initiative | J1, J3, J7 | summary |
| Q16 | Which critical data domains have governance gaps? | — | J4 | ranked-list |
| Q17 | What are the source and consumers of this data domain? | Select a data domain | J4 | entity-detail |
| Q18 | Is this data domain ready for AI use? | Select a data domain | J4 | summary |
| Q19 | Which reviews or controls are missing for this data? | Select a data domain | J4 | ranked-list |
| Q20 | Which technologies are at or approaching end of support? | — | J5 | ranked-list |
| Q21 | What services depend on this technology? | Select a technology | J5 | impact |
| Q22 | Why should we prioritise this technology? | Select a technology | J5 | explanation |
| Q23 | Summarise this technology risk for the CTO. | Select a technology | J5 | summary |
| Q24 | Which AI use cases need governance attention? | — | J6 | ranked-list |
| Q25 | Explain this agent and its risks. | Select an AI agent / solution | J6 | entity-detail |
| Q26 | What can this agent do, and which controls are missing? | Select an AI agent / solution | J6 | summary |
| Q27 | What depends on this AI model, or what does this agent depend on? | Select an AI model or agent | J6 | impact |
| Q28 | Draft a recommendation for this finding. | Select a finding | J6, J7 | draft |
| Q29 | Approve this recommendation / agent for production. | — | J6, J7 | refusal |
| Q30 | How will we measure this agent’s improvement? | Select an AI agent / solution | J6 | summary |
| Q31 | What changed during this demo? | — | J7 | summary |
| Q32 | Why did this import fail validation? | Validate a file in Data Ingestion | J8 | validation |
| Q33 | Is this workspace ready, and what should I review first? | — | J8 | readiness |

## Behaviour notes the presenter should know

| Topic | Behaviour |
|---|---|
| Q05 briefing | Eight numbered sections (position, what changed, top risks, value/service impact, transformation progress, decisions required, next actions, evidence limitations). Opens on the Briefing tab; journey steps generate it for you. Audience and emphasis can be changed. |
| Q08 | Counts the applications the portfolio views classify as Migrate or Eliminate (same TIME rules and point-to-point definition as the screens). |
| Q20 | Follows the demo as-of date: moving the date forward turns "approaching" into "past support". |
| Q26 / Q30 | Read the agent's recorded tool permissions, guardrails and outcome KPI. An agent with no KPI is told so; another agent's KPI is never borrowed. Declared WRITE/EXECUTE is metadata only and never run. |
| Q28 | Produces a **proposal** with "requires architect validation". Saving it for review is a human click; converting the saved draft creates a recommendation with status *Draft* — never submitted, never approved. A finding with no evidence cannot be drafted. |
| Q29 | Always refused. "Who can approve …?" is a different, informational question and is answered. |
| Q32 | Reads the validation staged in Data Ingestion for the *active* workspace (row, field, message). With nothing staged it says so. |
| Q33 | Counts and the first items to review for the active workspace; does not call an empty workspace "ready". |

## Guardrails

- Approval requests (including "sign off on this") are refused; nothing is changed.
- Guaranteed savings, ROI or benefits are refused; value is expressed as indicative bands.
- Other organisations are never compared or named as data sources ("Compare us with …" is refused).
- Instructions to ignore rules or reveal prompts are treated as unsupported.
- Answers cite only records that exist in the active workspace; an answer that cannot be grounded is replaced by the insufficient-evidence message.
