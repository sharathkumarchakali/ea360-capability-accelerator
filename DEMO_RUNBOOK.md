# EA360 Demo Runbook

**Product:** EA360 — Enterprise Intelligence and Transformation Governance  
**Prototype:** Synthetic demonstration (Phases 1-6)  
**Last updated:** 28 October 2026  

---

## Pre-demo preparation

1. Use a private Netlify Deploy Preview, or run `npm run build && npm run preview` locally.
2. Open a clean browser profile (or Incognito) to avoid stale localStorage keys from older persist versions.
3. Hard-refresh once after deploy.
4. Click **Demo home** (or load the landing overlay) and confirm the synthetic disclaimer is visible.
5. Select the customer-relevant organisation, role, and optional **Present** mode.
6. Click **Reset demo** and confirm success toast before the customer joins.
7. Close Ask EA360 and any drawers.

**Recommended browser:** Latest Chrome or Edge.  
**Recommended resolution:** 1440x900 or 1280x800 desktop; tablet landscape 1024x768 for secondary walkthrough.

---

## Demo reset

1. Topbar -> **Reset demo** -> confirm.
2. Expect toast: Demonstration restored for the active organisation.
3. Confirm Executive Cockpit loads for the active tenant only.
4. Optional: **Demo home** to restart guided entry.

Reset restores seeded pack, filters, AI history, recommendations/decisions/initiatives, and clears the guided tour for the **active** tenant only.

---

## Tenant selection

| Code | Story emphasis |
|---|---|
| GRA | Taxpayer identity, payment resilience, revenue assurance |
| BOG | Regulatory lineage, payment-system resilience, EA governance |
| FIDELITY | Customer 360 / onboarding, API-led channels, lending simplification |
| GENERIC | CX transformation, estate simplification, data ownership |

Switching tenants returns to Executive Cockpit and must not show prior-tenant records.

---

## Five-minute executive scripts

### GRA
1. Landing -> Start Executive Demo.
2. Health gauge -> critical risks -> Taxpayer Registration capability.
3. Recommendation + roadmap initiative -> Ask EA360 briefing -> pending decision.
4. Close on decision-required language; keep financial claims indicative.

### BoG
1. Select Bank of Ghana -> Executive Demo.
2. Emphasise payment-system resilience and supervisory risk.
3. Briefing -> decision inbox under Governance.

### Fidelity
1. Select Fidelity -> Executive Demo (Customer 360).
2. Link onboarding friction to applications and API concentration.
3. End on roadmap initiative and pending decision.

### Generic
1. Select Acme Enterprise Group -> Executive Demo (CX).
2. Show portfolio simplification pressure and data lineage risk.
3. End on decision required + indicative value.

---

## Ten-minute architecture scripts

1. Capability Intelligence (risk heatmap) -> high-risk capability.
2. Supporting applications -> critical integration.
3. Relationship Explorer (upstream/downstream).
4. Finding + evidence -> recommendation -> decision -> initiative/KPI.

Use the Guided scenario selector for the tenant architecture journey.

---

## Ten-minute transformation scripts

1. Evidence-backed finding -> recommendation -> governance decision.
2. Review linked initiative -> roadmap horizon/quarter.
3. Expected value and risk reduction (indicative only).

---

## Expected screen sequence (executive)

Landing -> Executive Cockpit -> Findings -> Capabilities -> Recommendations -> Roadmap -> Ask EA360 / briefing -> Governance -> (optional) Executive Report print.

---

## Key talking points

- Lead with business outcomes, then show architecture detail.
- One connected story beats a feature tour.
- AI is AI-assisted, grounded, human-reviewed — never authoritative.
- All figures are synthetic / indicative.
- Always voice the disclaimer: Synthetic demonstration data — not supplied or validated by the named institution.

---

## Likely customer questions

| Question | Answer direction |
|---|---|
| Is this our data? | No — synthetic themes only. |
| Can AI approve change? | No — architects validate; authority decides; EA360 records. |
| Multi-tenant? | Four synthetic tenants, isolated sessions. |
| Export? | Executive Report -> browser Print / Save as PDF. |
| Next step? | Discovery engagement or governed pilot on customer sources. |

---

## Prototype limitations

- No backend, auth, external LLM, or live integrations.
- Demo roles are not permission gates.
- Pattern-based Ask EA360 intents.
- Guided demo is lightweight (not a full product-tour engine).
- Some dense graphs simplify on mobile.

---

## Recovery instructions

| Issue | Action |
|---|---|
| Blank / error view | Error boundary -> Return to Cockpit or Reset demo |
| Wrong tenant residue | Switch tenant or Reset demo |
| Broken deep link | Invalid-route panel -> Cockpit |
| Stuck filters | Reset demo |
| Ask EA360 unsupported | Rephrase using suggested questions |
| Print issues | Open Reports -> Executive Report, then Print |

---

## Post-demo validation questions

1. Which problem was most relevant?
2. How is it handled today?
3. What does it cost in time, money, risk, or delayed change?
4. Who owns the problem and budget?
5. Which data sources could support a pilot?
6. What outcome would justify action this quarter?

---

## Presentation guidance

- Lead with outcomes.
- Show architecture only after executive relevance is clear.
- Demonstrate one connected story.
- Use Ask EA360 selectively.
- End with a proposed discovery engagement or pilot.

---

## Guided journeys (J1–J8)

Use **Demo Studio** to pick the organisation, journey and as-of date. Each journey shows a preflight status:

| Status | Meaning | What to do |
|---|---|---|
| Ready | Every bound record, route and question resolves. | Start. |
| Needs setup | A synthetic example is required (J6, J7). | Click **Prepare synthetic example**, then start. Safe to repeat. |
| Unavailable | No validated data for this sector (J4–J6 outside GRA). | Choose another journey or organisation. |

Journey, playlist and workspace details: `DEMO_JOURNEYS.md`. Ask EA360 questions per journey: `ASK_EA360_DEMO_QUESTIONS.md`.

### Before a journey demo

1. Confirm the as-of date in Demo Studio (default 7 September 2026). Changing it marks earlier Ask answers stale.
2. For J6 or J7, prepare the synthetic example in advance and check the status turns **Ready**.
3. For J8, decide the workspace code in advance; clear runtime workspaces by clearing site data for the demo browser profile.
4. **Reset demo** restores the active organisation, including removing prepared fixtures.

### During a journey

- Steps that need a human action (J7 gates, J8 commit) keep **Next** disabled until the action is done. Do the action on screen; do not skip it.
- **Retry** re-applies the current step; **Restart** returns to step one; **Exit** closes the guided bar and Ask.
- Ask EA360 answers come from the active workspace. If an answer shows a *stale* banner, use **Ask again**.
- AI drafts are proposals. **Save for review** then **Create recommendation draft** are explicit clicks; the result is a *Draft* recommendation, never an approval.

### J8 onboarding and ingestion script (about 8 minutes)

1. Customer Onboarding: fill the profile, tick the synthetic-data confirmation, choose the starter, review the clone preview, **Create synthetic workspace**.
2. Data Ingestion: **Load sample with errors**, map columns, **Validate**; show the blocking lines and that **Commit import** is disabled; ask Q32.
3. **Load clean sample**, **Validate**, **Commit import**; show the audit entry and the new applications.
4. Ask Q33 for readiness; open Workspace settings for export and isolation.

### Recovery for journeys

| Issue | Action |
|---|---|
| Journey shows Needs setup | Prepare synthetic example. |
| Step highlight missing | Retry; if it persists, Restart. |
| Ask answer looks out of date | Use **Ask again** on the stale banner. |
| Imported rows look wrong | Reset demo (seed workspaces) or create a new workspace code (runtime workspaces). |
| Runtime workspace disappeared | Browser storage was cleared or blocked; recreate it. The app returns to GRA. |

### Journey limitations

- Runtime workspaces and ingestion audit entries are stored in browser `localStorage`.
- Ask EA360 is a prototype assistant: deterministic, pattern-based, answering from the active workspace.
- J4–J6 are validated for GRA only.