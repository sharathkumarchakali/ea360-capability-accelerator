# EA360 Demo Runbook

**Product:** EA360 — Enterprise Intelligence and Transformation Governance  
**Prototype:** Synthetic demonstration (Phases 1-6)  
**Last updated:** 7 September 2026  

---

## Pre-demo preparation

1. Use a private Netlify Deploy Preview or 
pm run build && npm run preview locally.
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
