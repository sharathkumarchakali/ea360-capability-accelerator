# Kulana EA360 — Product Demonstration Journeys and Ask AI Implementation Brief

**Prepared for:** Sharath Kumar Chakali / Cursor implementation  
**Date:** 28 October 2026  
**Repository:** https://github.com/sharathkumarchakali/ea360-capability-accelerator  
**Deployed prototype:** https://ea360.netlify.app/  
**Source inspected:** `main`, commit `0088295d267c23d1d9a69cbe2e612c3793c73f72`  
**Status:** Build specification. The proposed changes and journeys have not been implemented or browser-tested as part of this brief.

## 1. Instruction to Cursor

Implement this brief in the existing React/Vite application. Preserve its working portfolio, graph, governance, tenant and reporting features. Read the actual current branch before editing: this specification is based on the commit above, and the supplied earlier build plan cites a different commit.

This brief expands the supplied **Kulana EA360 — Build-Ready Prototype Plan**. Retain its browser-only onboarding/import architecture and Kulana branding direction. Replace its high-level journey descriptions with the detailed contracts below. Its five proposed journeys are retained as J1, J2, J3, J6 and J8; J4, J5 and J7 complete data, technology and governed transformation coverage.

The required outcome is a presenter-ready prototype in which a person can:

1. Select an organisation, scenario and audience.
2. Start a complete business story, with dependable navigation and relevant records.
3. Ask contextual questions and receive useful, repeatable answers with working source links.
4. Inspect evidence, compare options, record a human decision and trace delivery to a KPI.
5. Create a synthetic prospect workspace and import sample data without code changes.
6. Restart a journey and reproduce the same starting position.

**Ask EA360 must function, not just display a chat panel.** Use the existing deterministic adapter and live browser-held workspace data. No external LLM, API key, backend, authentication service or live connector is required for this release. Label it `Prototype assistant · answers from this workspace` and retain the illustrative-data label. Deterministic means consistent rules and grounded answers; it does not mean canned answers that ignore record changes.

Do not deploy or change the existing site's audience as part of implementing this brief unless separately instructed. Produce reviewable code, validation results and a presenter runbook first.

## 2. Verified foundation and concrete gaps

The following are source-review findings, not claims of runtime verification.

| Existing code | Implementation implication |
| --- | --- |
| Four seed tenants: GRA, BOG, FIDELITY, GENERIC | Preserve their existing data and isolated sessions. Add runtime prospects through a separate registry. |
| `demoJourneys.ts` supplies Executive, Architecture and Transformation paths | Extend this engine; retain old journey IDs through compatibility mappings. |
| `applyDemoStep.js` selects an entity before calling navigation; `App.jsx` navigation normally clears selection | Navigation must complete before selection is applied, or explicitly retain selection. Test this integration. |
| Journey filters contain `findingId`, `recommendationId`, `initiativeId`, etc.; the runner only handles selected nested filters | Replace untyped filter payloads with explicit screen contracts. Every declared filter must be applied or rejected in validation. |
| `openBriefing` currently only opens Ask EA360 | Add explicit Ask tab, prompt and generate commands. Opening a briefing step must show the requested generated briefing. |
| Retry sets the same step index; the effect may not re-run | Introduce an explicit step execution nonce/retry action. |
| Ask panel has local query, draft and tab state; briefing preview also has component-local state | Clear/key these by workspace and reset epoch. Store isolation alone does not clear mounted component state. |
| Suggested questions are strings passed to pattern matching | Use typed question definitions with supported intent and validated context; retain free typing. |
| Query matching omits AI solutions/models and several record types | Extend matching and context resolution to every record used in the journeys. |
| `collectKnownIds` omits AI solutions/models | Add them and any governed catalogue references through a tenant-scoped resolver. Do not treat policies as fake graph entities. |
| Intent classifier returns a supplied explicit intent before applying guardrails | Apply tenant and approval safeguards before explicit-intent dispatch. |
| The approval pattern matches any occurrence of “approve” | Distinguish a request to execute approval from informational questions about approvals, approvers and approved status. |
| `assertTenantIsolation` has GRA-specific exceptions; the adapter does not demonstrate a strict request-tenant gate | Replace special cases with canonical ID validation at the service boundary. |
| Adapter text contains hardcoded GRA wording and some date calculations use `2026-09-07` | Use active workspace metadata and a shared, visible demo as-of date. |
| Briefing domain/emphasis selections do not consistently change the underlying selection/calculations | Scope records first, then derive metrics and narrative. If a filter is unsupported, say so. |
| AI draft saving writes to `recommendationDrafts`, not a reviewable Recommendation entity | Add an explicit human-reviewed conversion to a real Draft recommendation, with source links. |
| `assessment`, `standards`, `reviews`, `kpis` are legacy `ModuleView` screens backed by static data | Replace these with small, useful workspace-backed views. Static rows cannot demonstrate workflow changes. |
| Source has rich GRA AI/technology/data assets; other packs are thinner | Advertise journey availability from validated bindings, never substitute another tenant's records. |
| No runtime onboarding/import modules exist in inspected source | J8 requires implementation; do not describe it as already available. |

## 3. Journey catalogue and product coverage

| ID | Journey | Audience | Target time | Main business question |
| --- | --- | --- | ---: | --- |
| J1 | Executive decision and briefing | CEO/CIO, sponsor, executive committee | 5 min | What requires a decision, and why now? |
| J2 | Capability impact and application rationalisation | Enterprise/business/application architect | 8 min | Which overlapping applications can we simplify safely? |
| J3 | Integration and payment resilience | Integration/API architect, operations, CIO | 8 min | What depends on this interface, and how do we reduce failure exposure? |
| J4 | Data trust, lineage and AI readiness | CDO, data owner, compliance | 7 min | Which data is trustworthy enough to use, share or expose to AI? |
| J5 | Technology lifecycle and resilience | CTO, infrastructure, security | 7 min | Where does obsolete technology threaten important services? |
| J6 | Governed AI, models and agents | AI lead, risk, architect, review board | 8 min | What can this agent do, and are its controls sufficient? |
| J7 | Evidence to human decision, delivery and KPI | ARB, transformation lead, PMO | 10 min | How does an observed risk become an accountable, measurable change? |
| J8 | New customer onboarding and data ingestion | Presenter, prospect architect, workspace admin | 5 min sample / 8 min CSV | How does a new organisation get started and trust its imported baseline? |

Times are presentation targets, not performance guarantees. Keep deeper tabs available for free exploration.

| Product area | Demonstrated in |
| --- | --- |
| Executive cockpit and Architecture Health | J1, J2, J7 |
| Capabilities, objectives and business processes | J2, J3, J7 |
| Applications / Integrations / Data / Technology / AI portfolios | J2 / J3 / J4 / J5 / J6 |
| Relationship Explorer and impact analysis | J2–J6 |
| Findings, evidence and recommendations | J1–J7 |
| Decision Register, Review Board and standards | J1, J3, J5, J7 |
| AI & Data Governance: AI, data, policies, approvals and exceptions | J4, J6 |
| Roadmap, initiatives, dependencies and KPIs | J1, J3, J5, J7 |
| Ask EA360, explain, draft and briefing | Every journey, with the capabilities specified below |
| Executive Report, portfolio export and print | J1, J7; filtered portfolio CSV in J2–J6 |
| Onboarding, import/export, workspace settings | J8 |
| Tenant switching, reset, presenter mode and Demo Studio | Every journey; explicit isolation demonstration in J8 |

Provide a `Full product walkthrough` playlist: J8 → J1 → J2 → J3 → J4 → J5 → J6 → J7. Allocate approximately 60–70 minutes including transitions. Also provide a 15-minute prospect playlist with selected steps from J1, J3, J6 and J7. These are playlists referencing the same journey definitions, not duplicate scripts. Launch each journey at its own validated baseline; do not silently combine mutation histories from separate demonstrations.

## 4. Shared presentation and navigation contract

### 4.1 Demo Studio

Add the `demo-studio` route. Controls: workspace, sector, scenario, journey, audience role, as-of date and presentation mode. Show duration, business outcome, required records and preflight status. Each card offers `Preview steps` and `Start journey`.

Display `Ready`, `Needs setup` or `Unavailable` with a specific reason. A missing feature/record blocks Start. Offer `Prepare synthetic example` only when the presenter explicitly chooses it; this creates validated fixtures in the local working copy. Never silently manufacture missing records during a presentation.

The Studio must expose all eight journeys. Existing `gra-executive`, `bog-executive`, etc. continue to resolve. Map legacy architecture to its relevant J2/J3 scenario; legacy transformation to J7 or a read-only J7 variant with validated existing records.

Presenter notes default to hidden. Put them in a separate panel/window that can be kept off the shared screen. Presentation mode itself must not reveal the notes.

### 4.2 Guided bar

Show: journey title, step X/Y, business question, short presenter instruction, expected visible result and progress. Controls: Back, Next, Retry, Exit and Restart journey. Skip is allowed for optional exploration; skipping a required action produces an `Incomplete` run and cannot silently satisfy dependent steps.

Entering a step applies its route, tab, filters, selection, graph context and optional Ask command. It never automatically approves a decision, verifies evidence, creates a recommendation, imports data or creates an initiative. Those steps wait for a visible human action and a state predicate before enabling Next.

Back only revisits screens. It never reverses a recorded decision or creates a duplicate object. Retry reapplies UI context and reruns read-only queries; it does not repeat writes. Exit retains completed work in that run. Restart requires the existing reset confirmation when it discards local changes, restores the captured journey baseline, clears that run's Ask state and starts at step one.

Keep `Restart journey`, `Reset workspace` and `Delete local workspace` separate. The latter two require confirmation. A reset affects only the active workspace. Runtime-workspace reset restores the last explicitly accepted baseline/import snapshot; resetting a synthetic seed restores that seed. Do not use onboarding or journey restart to delete unrelated imports.

### 4.3 UI targeting

Use stable `data-demo-target` and `data-entity-id` attributes, plus explicit tab IDs. Do not target “the first heat cell/card”. A target must point at the specified row or its opened detail. Routes and target IDs are centrally registered.

Route → apply screen state → select/open record → wait for actual mount → highlight → run requested read-only Ask operation → mark Ready. Use cancellation tokens for lazy mounts and workspace switches. A missing runtime target pauses with `Retry`, `Return to Studio` and a readable error; it must never continue by highlighting an unrelated record.

Use a central navigation helper shared by tours, evidence links, AI actions and reports. Preserve selected records deliberately; avoid competing hash-change effects that clear them. Include graph direction, depth and semantic relationship handling in the contract.

### 4.4 Dates and financial values

Introduce one `demoAsOfDate` shared by evidence freshness, overdue decisions, technology support horizons, imports, AI calculations and reports. Default existing seed demos to their documented snapshot date, `2026-09-07`, until a newer coherent fixture baseline is provided. Display `Data as of …` so September data is not presented as a current October assessment. A presenter can change it; recalculation must remain consistent.

Use recorded cost/benefit bands and currency. Display missing values as unknown. No invented savings, current outages, actual customer facts or live model execution. Recording an approval does not improve measured availability, reduce observed risk or deliver a KPI target automatically.

## 5. Scenario bindings and demo data

### 5.1 Verified GRA anchors

These IDs were found in source. At implementation time, validate against the fully enriched pack, not individual seed files alone.

| Story | Existing anchors | Important state/relationship caveat |
| --- | --- | --- |
| Identity / executive | `scenario-identity`, `cap-gra-02`, `app-gra-08`, `app-gra-13`, `find-gra-02`, `rec-gra-02`, `dec-gra-04`, `init-gra-02`, `ev-gra-02`, `ev-gra-07` | `rec-gra-02` is Under Review; `dec-gra-04` is Pending. `init-gra-02` has outstanding governance. Do not call it fully approved/funded. |
| Taxpayer data | `data-gra-01`, `data-gra-02`, `find-gra-01`, `rec-gra-01`, `dec-gra-01`, `init-gra-01`, `POL-DATA-004`, `STD-DATA-001` | Taxpayer Data has multiple sources, personal data and conditional AI readiness. `rec-gra-01` is already Converted to Initiative. |
| Payments | `scenario-payment`, `int-gra-05` / `PaymentAdviceAPI`, `int-gra-29`, `app-gra-05`, `app-gra-01`, `data-gra-04` | Existing scenario `findingId` is `find-gra-03`; resilience enrichment separately adds `find-gra-10`. Bind the explicit resilience chain below rather than pretending they are the same finding. |
| Payment resilience workflow | `find-gra-10`, `ev-gra-10`, `ev-gra-11`, `rec-gra-08`, `dec-gra-02`, `init-gra-06`, `kpi-gra-07`, `kpi-gra-08` | `dec-gra-02` is already Approved with Conditions; `init-gra-06` already exists. Use as the read-only example, not a fresh approval demonstration. |
| Technology containment | `tech-gra-03`, `app-gra-02`, `app-gra-15`, `find-gra-04`, `init-gra-04`, `EXC-TECH-001` | Support date and lifecycle are illustrative. Resolve the initiative-linked exception through its actual catalogue/embedded record. |
| Agent permissions | `ai-gra-02`, `find-gra-ai-003`, `int-gra-27`, `int-gra-29`, `data-gra-01`, `data-gra-04`, `data-gra-08`, `CTL-AI-003`, `POL-AI-002` | Fraud Investigation Agent has READ/WRITE/EXECUTE metadata and partial permission/guardrail controls. Described permissions are not executed by this prototype. Existing evidence suitability must be assessed. |
| Model and measurable AI benefit | `aim-gra-01`, `ai-gra-01`, `find-gra-ai-011`, `kpi-gra-ai-01` | Query handling KPI is 11 baseline / 8 current / 6 target minutes in source. Do not imply the fraud agent owns this copilot KPI. |
| Missing-evidence example | `find-gra-ai-007` | Source has an empty evidence list. Use to demonstrate a limitation, not a successful verified recommendation draft. |

Verify display names from the repository; IDs are internal bindings, not labels to show audiences.

### 5.2 Other tenants and runtime prospects

Reuse current scenario roots:

| Tenant | Scenarios available in current demo definitions |
| --- | --- |
| BOG | `scenario-bog-payments`, `scenario-bog-lineage`, `scenario-bog-governance` |
| FIDELITY | `scenario-fid-customer360`, `scenario-fid-api`, `scenario-fid-lending` |
| GENERIC | `scenario-gen-cx`, `scenario-gen-simplify`, `scenario-gen-data` |

Create explicit `JourneyScenarioBinding` records per workspace/sector pack. No ID-prefix replacement to guess equivalents. A journey may reuse a scenario only where the necessary applications, data, evidence and governance chain actually exist.

GRA is the initial full-product acceptance workspace. J1, J2/J3 and J7 must also have working relevant paths for the three other existing tenants. Supply the complete J1–J8 demonstration set through each sector starter pack before advertising full-product readiness for newly created prospects. Until a pack has a validated J4/J5/J6 supplement, mark the affected journey unavailable with its reason; do not borrow GRA assets.

For new demo-only data, add versioned fixture builders under `src/data/demo/`. Apply them to a clone of the active working pack after explicit preparation. Never mutate imported seed module objects. Include tenant ID on every generated record, provenance `synthetic-demo-fixture`, scenario binding, evidence, owner, objective, KPI and required relationships. Add schema-supported metadata rather than weakening Zod validation.

J7 needs a fresh, coherent payment-resilience practice scenario: clone relevant business context into new demo records with a finding Under Review, a verified evidence item plus an unverified item, and no recommendation/decision/initiative yet. Suggested **new IDs**, not existing ones: `demo-<workspaceId>-payment-finding`, `demo-<workspaceId>-payment-evidence-verified`, `demo-<workspaceId>-payment-evidence-review`. Generated objects are captured into run slots after actual creation; never reuse the already approved `dec-gra-02` for a new approval.

J6's successful draft path needs relevant verified permission/guardrail evidence. If the existing broad architecture evidence does not substantiate the agent claim, add an explicitly synthetic permission review fixture, not an unrelated citation. Link any resulting remediation recommendation/decision/initiative to this agent and finding. Do not repurpose the copilot handling-time KPI as an agent-control metric.

## 6. Detailed journeys

In the tables, `Qxx` refers to the testable question catalogue in section 8. `NEW` identifies proposed routes; existing route IDs are preserved. Each step's required record, tab, graph mode and expected result must be encoded in the journey configuration, not left as presenter memory.

### J1 — Executive decision and briefing

**Promise:** “See the enterprise position, understand one material exposure and leave with a clear decision.”  
**Default:** GRA / identity / executive audience. All four tenants require equivalent bindings.  
**Starting state:** Existing seed baseline; no writes needed. Ask history empty for a fresh run.

| Step | Screen and presenter action | Required visible result | Ask/action |
| --- | --- | --- | --- |
| J1.1 | Demo Studio: select tenant, Executive journey and role; Start | Branded title card, active organisation, illustrative label, decision-focused outcome | Preflight passes before entering cockpit |
| J1.2 | `executive`: select enterprise-health Explain | Health, maturity, priority risks and pending decisions use the same workspace snapshot; formula/input explanation available | Q01: top risks; Q02: health explanation |
| J1.3 | `findings`: open bound material risk, GRA `find-gra-02` | Business impact, severity, owner, source evidence and review state; selected record visibly opens | Q03: explain this finding |
| J1.4 | `capabilities`: open Taxpayer Registration, risk heatmap | Affected capability, supported applications and business meaning match that finding | Open supporting application or process from real links |
| J1.5 | `recommendations`: open `rec-gra-02`; then `decisions`: `dec-gra-04` | Response option, pending authority, evidence and decision deadline; Pending is clearly distinct from Approved | Q04: what awaits decision? |
| J1.6 | `initiatives` / `roadmap`: open `init-gra-02` | Proposed delivery, owner, dependencies and outstanding decisions; do not call it funded without funding evidence | Show linked KPI target as intended outcome |
| J1.7 | Ask EA360 → Briefing: Generate for selected audience | Actual generated briefing: position, top risks, decision needed, delivery outlook, limitations and next action | Q05; generation is executed, not just tab opening |
| J1.8 | `reports`: preview and Print / Save as PDF | Same facts, workspace, as-of date, Kulana identity, source references and synthetic disclaimer | Copy briefing works; print layout is readable |

**Completion:** A presenter can point to one named decision, accountable authority, supporting evidence and linked delivery outcome. All evidence/source links open the intended record. Generating the briefing again produces the same substantive facts for the same snapshot.

### J2 — Capability impact and application rationalisation

**Promise:** “Simplify applications while protecting the capabilities and processes they serve.”  
**Default:** GRA identity overlap using `app-gra-08` / `app-gra-13`; Fidelity Customer 360 is a second useful binding.  
**Starting state:** Read-only example of an existing rationalisation chain. Do not try to create another initiative from an already Converted recommendation.

| Step | Screen and presenter action | Required visible result | Ask/action |
| --- | --- | --- | --- |
| J2.1 | `assessment`: choose relevant architecture domain | Workspace-derived maturity/current/target, evidence coverage and gap; no static tenant-independent totals | Explain calculation and scope |
| J2.2 | `capabilities`: choose Registration; toggle maturity/risk | Same capability stays selected; current/target gap, importance, owner and related objectives visible | Q06: largest maturity gaps |
| J2.3 | Capability detail → supporting processes and applications | Actual process names and supported applications; a process opens a detail panel or a useful `processes` view if implemented | Q07: apps supporting the selected capability |
| J2.4 | `applications`: filter overlap cluster; select primary app | TIME class, business value, health, cost band, lifecycle, owner, duplicated capability coverage | Q08: migration/elimination candidates |
| J2.5 | Compare the two bound applications | Side-by-side capability coverage, technology, integration, data and owner differences; missing values labelled unknown | Do not equate duplicate capability coverage with interchangeable systems |
| J2.6 | `explorer`: root at selected application; show impact | Linked capabilities, consumers, APIs, data and technology; directional traversal explains what retirement could affect | Q09: retirement impact |
| J2.7 | `findings` → `evidence` → `recommendations`: follow bound chain | Relevant duplication finding and source records; existing recommendation state and real decision/initiative | Open applicable standard; no invented remediation link |
| J2.8 | `roadmap`: open linked rationalisation initiative; export filtered app portfolio | Sequenced migration, dependencies, remaining governance and intended KPI; CSV contains only filtered workspace rows | Close: candidate for governed consolidation, not automatic retirement |

**Completion:** Application candidates and dependencies agree across the table, comparison, graph and Ask answer. The presenter can distinguish a TIME recommendation from an approved retirement decision. Process exposure is demonstrated through real entities, without adding an empty route.

### J3 — Integration and payment resilience

**Promise:** “Reveal the business exposure of a critical interface and trace a practical resilience response.”  
**Default:** GRA `PaymentAdviceAPI` / `int-gra-05`, with `scenario-payment`. Use the payment-resilience enrichment chain explicitly.  
**Starting state:** Read-only inspection of the existing conditionally approved resilience change.

| Step | Screen and presenter action | Required visible result | Ask/action |
| --- | --- | --- | --- |
| J3.1 | `integrations`: filter critical payment interfaces | Asset type, owner, source/target, monitoring, reuse and criticality; counts match visible scope | Q10: P2P concentration |
| J3.2 | Open `int-gra-05` | PaymentAdviceAPI name, endpoints/applications, related data and monitoring gaps from metadata | Q11: what depends on PaymentAdviceAPI? |
| J3.3 | `explorer`: integration root; scenario context; impact mode | Payment channels/gateway, tax core, events, data and impacted business capabilities | Display dependency direction and path labels |
| J3.4 | Ask “What happens if PaymentAdviceAPI is unavailable?” | Potential exposure based on recorded dependencies; no claim a live outage occurred | Q12; `Show affected objects` and `Open graph` work |
| J3.5 | `findings`: open `find-gra-10`; evidence `ev-gra-10` / `ev-gra-11` | Outage/monitoring evidence metadata, freshness, verification and resilience finding | Q13: which evidence supports this risk? |
| J3.6 | `recommendations`: `rec-gra-08`; `standards`: linked integration rules | Event delivery/retry/DLQ/monitoring response and applicable standards; proposed patterns labelled as recommendations | Q14: explain the response options |
| J3.7 | `decisions`: `dec-gra-02` | Approved with Conditions; runbook/on-call and UAT lag conditions; exception expiry visible | AI never represents conditional approval as unconditional clearance |
| J3.8 | `initiatives` / `roadmap`: `init-gra-06`; open KPIs | Availability KPI 99.2 baseline / 99.5 current / 99.9 target; lag 55 / 42 / 15 minutes, from current seed | Q15: delivery/KPI summary; filtered integration CSV |

**Completion:** The same interface anchors table, graph, risk, decision and initiative. Impact analysis does not calculate a predicted outage duration or financial loss from graph reachability alone. Use J7 to demonstrate creating a new decision.

### J4 — Data trust, lineage and AI readiness

**Promise:** “Identify the source of truth and the conditions required before data can support AI.”  
**Default:** GRA `data-gra-01` Taxpayer Data; BoG regulatory-lineage scenario when equivalent bindings exist.  
**Starting state:** Read-only assessment. No external data is fetched or cleansed.

| Step | Screen and presenter action | Required visible result | Ask/action |
| --- | --- | --- | --- |
| J4.1 | `data-information`: filter critical/sensitive data | Data domain, classification, owner, stewardship, quality, authoritative-source status | Q16: critical data governance gaps |
| J4.2 | Open Taxpayer Data overview | Multiple Sources, personal/restricted data, owner/steward/custodian, source/consumer apps and recorded residency status | Unknown fields remain unknown |
| J4.3 | Open lineage tab/detail; `explorer`: data root | Registered source → interface → data → consumer paths; metadata links and inferred links visibly distinguished | Q17: source and consumers |
| J4.4 | Ask “Is Taxpayer Data ready for AI use?” | Conditional readiness; quality/consent/source conflicts and personal-data constraints supported by the record | Q18; answer is not a regulatory approval |
| J4.5 | `ai-data-governance`: Data tab; selected data context | Ownership, quality, residency, access and evidence gaps; switch to Policies to inspect `POL-DATA-004` and `STD-DATA-001` | Policy references resolve within this workspace |
| J4.6 | Governance Approvals & Exceptions tab | Relevant pending/conditional items, authority, owner and expiry; explicitly say when none is recorded | Q19: which reviews/controls are missing? |
| J4.7 | `findings` → linked recommendation/initiative; return to Data | Existing taxpayer-data consolidation chain, remediation owner and intended data outcome | Filtered data portfolio CSV; no claimed automatic quality improvement |

**Completion:** Data classification, stewardship and readiness agree between Data, Governance and Ask. A lineage gap is shown as a gap; an orphaned link is never presented as an authoritative flow. Policy objects open a proper policy detail, even when they are outside the graph schema.

### J5 — Technology lifecycle and resilience

**Promise:** “Prioritise obsolete technology by business impact and govern the transition.”  
**Default:** `tech-gra-03` Legacy Customs COBOL Stack, finding `find-gra-04`, initiative `init-gra-04`.  
**Starting state:** Read-only example. Dates are synthetic and interpreted against the visible as-of date.

| Step | Screen and presenter action | Required visible result | Ask/action |
| --- | --- | --- | --- |
| J5.1 | `technology-infrastructure`: filter expired/retire/high risk | Support status, lifecycle, standard status, application exposure and resilience | Q20: EOS technology risks |
| J5.2 | Open `tech-gra-03` | Support date 2025-06-30, target lifecycle, owner, affected apps, HA/DR gap and exception | Clarify these are seed metadata, not independently verified vendor dates |
| J5.3 | `explorer`: technology root; impact mode | Customs apps/capabilities and related dependencies from registered links | Q21: what services depend on it? |
| J5.4 | `standards`: inspect applicable standard and `EXC-TECH-001` | Approved/tolerated/exception context, exception owner, review date and containment conditions | Missing standard/exception detail blocks the journey at preflight |
| J5.5 | `findings`: open linked EOS/resilience risk and evidence | Technology risk tied to business service exposure, with evidence completeness | Q22: why prioritise this technology? |
| J5.6 | `initiatives` / `roadmap`: open `init-gra-04` | Containment/migration plan, dependencies and intended outcome; do not invent a recommendation/decision if none is linked | Identify any outstanding governance explicitly |
| J5.7 | Ask for a CTO summary; export filtered technology rows | Evidence-grounded support exposure, proposed action and decision required | Q23; no claim support or resilience is fixed by viewing the roadmap |

**Completion:** EOS answers use enriched technology fields such as `supportEndDate` as well as applicable legacy fields, with an explicit shared horizon. Portfolio status, graph impact and Ask ranking use the same normalized model.

### J6 — Governed AI, models and agents

**Promise:** “Show what an agent can access and influence, then govern its permissions and oversight.”  
**Default:** GRA `ai-gra-02` Fraud Investigation Agent / `find-gra-ai-003`.  
**Starting state:** Prepared, relevant synthetic permission evidence; the standard portfolio remains descriptive. A separate negative path uses `find-gra-ai-007` with missing evidence.

| Step | Screen and presenter action | Required visible result | Ask/action |
| --- | --- | --- | --- |
| J6.1 | `ai-automation`: select high-risk AI/agent portfolio segment | Lifecycle, risk/autonomy, ownership, governance coverage and outcome coverage | Q24: AI use cases needing governance |
| J6.2 | Open Fraud Investigation Agent | Business purpose, criticality, autonomy level, accountable owner, human oversight and model dependencies | Q25: explain this agent and its risks |
| J6.3 | Inspect tool permissions and data access | Actual READ/WRITE/EXECUTE metadata with linked APIs, personal/sensitive data and guardrails | Q26: allowed actions and missing controls |
| J6.4 | `explorer`: root at agent; inspect model and dependencies | Real model, data, application, technology and tool links; relationships synthesized from declared metadata must be labelled | Q27: model/agent dependency impact |
| J6.5 | `ai-data-governance`: AI tab → Policies → Approvals & Exceptions | Permission gap, `CTL-AI-003`, human oversight policy, actual authority/status and review information | `Open policy`, `Open finding` work |
| J6.6 | `findings`: select `find-gra-ai-003`; Ask Draft recommendation | A grounded, editable draft proposes least privilege, explicit action boundaries, human checkpoints and monitoring; facts and proposed controls separated | Q28; Save for review saves a Draft, with a visible review inbox link |
| J6.7 | Ask “Approve this agent for production” | Explain human approval requirement; open the relevant governance record/review form | Q29; no status, permission or lifecycle changes |
| J6.8 | Review remediation tracking and outcome measurement | Display an agent-control KPI if present, otherwise a clearly proposed metric and measurement owner; open the linked human review | Q30; no invented measured benefit |

**Additional reliability demonstration:** Select `find-gra-ai-007`, request a recommendation draft and show an explicit missing-evidence response with `Review evidence gaps`. It must not silently use another critical finding.

**Model concentration mini-demo:** Select `aim-gra-01`; show dependent copilots and `find-gra-ai-011`. Separately open `ai-gra-01` and its genuine handling-time KPI if discussing measured AI service benefit. Never conflate that copilot with the fraud agent.

**Completion:** Ask understands AI and model entities by name, ID, selected context and follow-up. Citations and action targets resolve. The prototype never invokes the recorded WRITE/EXECUTE tools; any tool-execution mock has a visible simulation label and produces no enterprise action.

### J7 — Evidence to human decision, delivery and KPI

**Promise:** “Turn one observed problem into a reviewed change with clear authority, delivery ownership and measurement.”  
**Default:** Prepared fresh payment-resilience practice scenario from section 5. This is the main interactive workflow demo.  
**Starting state:** Finding Under Review, relevant verified evidence plus a second unverified item, no recommendation/decision/initiative for this practice scenario. Capture a baseline before starting.

| Step | Screen and required human action | Required visible result / completion predicate | Ask/action |
| --- | --- | --- | --- |
| J7.1 | `findings`: open practice finding | Problem, impact, owner, risk score and Under Review; source evidence exists | Q03; title identifies synthetic practice scenario |
| J7.2 | `evidence`: inspect source preview, reference and capture date; human verifies second item with comment | Verified record updates, confidence recalculates and audit entry records actor role, time and before/after | Q13; repeat query reflects changed evidence |
| J7.3 | Finding: human validates, then accepts using allowed transitions | State moves Under Review → Validated → Accepted; audit trail and UI agree | Next waits for Accepted |
| J7.4 | Ask Draft recommendation; human reviews/edits and clicks Save for review | AI-assisted review draft saved once with evidence, assumptions, options and proposed action | Q28; saving alone grants no approval |
| J7.5 | Human opens draft review, clicks `Create recommendation draft`, completes required fields, then `Submit for review` | Actual Recommendation entity created, then submitted to ARB using existing transition logic; Pending decision generated and IDs stored in run slots | Visible recommendation/decision links; repeated clicks are idempotent |
| J7.6 | `reviews`: open generated ARB queue item | Recommendation, evidence, options, required reviewers, rationale and conditions form; applicable standards displayed | Q04; Q14 compares options |
| J7.7 | Human records `Approved with Conditions` with rationale and explicit conditions | Decision becomes Approved with Conditions; related recommendation follows allowed domain transition; conditions and audit visible | Asking Q29 first demonstrates refusal; human UI remains available |
| J7.8 | Human clicks `Create initiative`, completes owner, objective/capability, intended outcome, KPI and period | Initiative created through validated domain action; finding → recommendation → decision → initiative links preserved | Generated initiative ID captured; duplicate creation blocked |
| J7.9 | `roadmap`: human positions Now/Next/Later and target quarter, chooses dependency | Initiative placement persists; dependency warnings and outstanding conditions visible; no auto-waiver | Q15: ownership, dependencies and KPI |
| J7.10 | `kpis`: open linked metric; `reports`: generate updated briefing/report | Baseline/current/target, unit, frequency, measurement owner and source; new decision/initiative reflected in briefing and audit | Q31: what changed? Q05: updated briefing |

Create the proposed availability/lag KPI records for this practice scenario before run start, using explicit synthetic values and objectives, but do not improve their current values merely because a decision is approved. A KPI may be linked or defined through the creation form, subject to schema validation.

**Completion:** All legal transitions occur through real store/domain actions. The generated chain is navigable in both directions; the human decision and changes are auditable. Restart restores the practice baseline; running twice does not accumulate duplicate recommendations, decisions or initiatives. Rejected/deferred alternatives are optional secondary branches with their own expected outcomes and no initiative creation when prohibited.

### J8 — New customer onboarding and data ingestion

**Promise:** “Create an illustrative organisation, validate its data and reach the first useful decision.”  
**Default:** New `Prospect Bank Demo` from Commercial Bank starter; all values synthetic.  
**Starting state:** A new runtime workspace ID, separate from the four seed IDs. J8 runs at Studio/global scope until that workspace is created.

| Step | Screen and presenter action | Required visible result / completion predicate | Ask/action |
| --- | --- | --- | --- |
| J8.1 | NEW `onboarding`: customer profile | Name/code, sector, country, currency, timezone and approved branding; public-prototype synthetic flag required | Validate unique code; no seed overwritten |
| J8.2 | Starter selection: Central Bank / Revenue Authority / Commercial Bank / Generic | Preview record counts and supported journeys; clone preview is not committed yet | Show sector-specific story |
| J8.3 | Data-source step: use sample, upload JSON/CSV, manual addition, connector catalogue | Sample path can finish quickly; connectors say Preview / Not connected; no fake sync | Draft profile persists during wizard |
| J8.4 | NEW `data-ingestion`: upload provided synthetic CSV sample with one invalid reference | Parse and column-map preview; row-level errors, valid/warning counts; commit disabled | Q32: explain validation issues, grounded in validation result |
| J8.5 | Correct mapping/reference or choose provided clean sample; Preview changes | Valid new/updated/unchanged records and relationships; source/target identity maintained; blocking errors zero | No partial commit or silent record discard |
| J8.6 | Human clicks Generate workspace / Commit | IndexedDB atomic commit creates profile, pack, import audit and readiness report; all internal tenant references remapped | Idempotent import; counts reconcile |
| J8.7 | Readiness summary → Start Executive journey | Portfolio counts, relationship/evidence coverage, warnings, first material finding and available journeys; regenerated bindings pass preflight | Q33: first priorities and readiness explanation |
| J8.8 | Workspace Settings: export JSON; switch to a seed tenant and return | Versioned export can re-import; newly created prospect, imports, Ask history and generated actions remain isolated | Same generic Ask question returns current tenant-specific records |

**Manual-entry branch:** In the same ingestion UI, create one synthetic application, link it to an existing capability, validate and save. Demonstrate that it appears in Applications and the readiness counts. All supported manual forms use the existing entity schema.

**Sample-mode timing:** For the five-minute path, show a prepared validation preview and choose the clean sample. The full CSV-error-correction path is approximately eight minutes. Do not claim ingestion validation happened if the sample path bypassed it.

**Completion:** Refresh restores the prospect; the immutable starter remains unchanged. Broken references/duplicate IDs cannot be committed. Storage failures retain a recoverable draft and show a truthful error. Switch-away clears mounted Ask/briefing inputs; switching back can restore only that workspace's own saved history.

## 7. Ask EA360 — functional prototype contract

### 7.1 Four useful modes

| Mode | Required behaviour |
| --- | --- |
| Ask | Questions about active workspace, filtered portfolio or selected object; contextual suggested prompts and short follow-ups. |
| Explain | Explain a selected metric, finding, TIME class, data readiness or AI governance gap using the same selectors/formulas as the screen. |
| Draft recommendation | Build an editable proposal for an explicitly selected eligible finding. Save for architect review; human action converts it into a real Draft recommendation. |
| Executive briefing | Generate from current scoped records; audience/emphasis changes narrative ordering/detail, not source facts. Copy, report handoff and print work. |

Keep the existing Ask/Briefing tab structure if useful; Explain and Draft can be contextual actions within Ask rather than extra top-level tabs.

### 7.2 Context and resolution

Every request needs canonical workspace ID, role, current view, scenario/journey/step, explicit selected record, optional graph root, selected scope, filters, demo as-of date and dataset revision. Extend existing request types additively and migrate persisted state as required.

Entity resolution order:

1. Resolve a specific entity named or identified in the current question. An explicit valid name overrides an older selected entity. If it conflicts with selection, disclose the new context.
2. If no explicit entity exists, use a valid current selected entity for “this/it”.
3. Otherwise use the same-workspace prior subject for a supported follow-up.
4. Otherwise use the valid graph root if the question is about dependency/impact.
5. Otherwise, for a portfolio-wide intent, use the selected portfolio/workspace scope. For an entity-required question, ask the user to choose an object.

Ambiguous matches produce selectable named objects and retain the pending question. Selecting a candidate reruns that question once against the selected object. An unknown explicit name must not silently fall back to the first record, selected record or top critical risk.

Recognize display names, exact IDs and approved aliases, including `PaymentAdviceAPI`, `payment advice API`, `Taxpayer Data`, `Fraud Investigation Agent` and model names. Add process, finding, evidence, recommendation, decision, initiative and KPI matching as needed. Policies/standards/approvals/exceptions use their own scoped registry/resolver; their internal types must not be misrepresented as application or evidence IDs.

Follow-ups to support: `Why?`, `Show the evidence`, `Show dependencies`, `What should we do?`, `Who owns it?`, `Draft a recommendation`, `Open the decision`. Keep subject, intent and pending selection per workspace/thread. Tenant switching cancels pending requests and clears transient inputs/draft/preview/subject. No prior tenant subject can be reused.

### 7.3 Intent and safety order

Apply this order for both typed input and suggested chips:

1. Verify request workspace equals repository workspace; validate all passed context IDs/types in that workspace.
2. Detect requests to access another workspace or execute approval/tool actions; handle those explicitly before honoring an explicit intent.
3. Resolve the question's explicit subject/context and detect ambiguity.
4. Dispatch a registered supported question/intent, then free-text aliases/paraphrases.
5. If unsupported, return a helpful supported alternative and contextual question chips.

Do not accept an arbitrary caller-supplied explicit intent as a bypass. Distinguish `Approve this recommendation` from `Who can approve this recommendation?` and `Which recommendations are approved?`. Informational approval questions must work. Unknown runtime workspace names/IDs must be covered by the tenant guard, not only four hardcoded institution regexes. Shared policy IDs are scoped by `(workspaceId, type, id)`.

“Approved”, “verified” and “monitored” in answers always describe the recorded status. They are not confirmations of real institutional controls. Do not add live connector claims, execute agent permissions, guarantee ROI, or invent facts to make a presentation smoother.

### 7.4 Deterministic response generation

Reuse `getEA360AIService`, `buildAIContext`, the repository, domain metrics and existing confidence/grounding helpers. Add missing intent handlers for data governance/readiness, technology impact, AI/agent controls/model dependency, recommendation options, initiative/KPI summary, approvals/conditions and import/readiness analysis.

Use one shared selector/normalization layer for each feature and Ask. Specifically:

- TIME answer and Applications view use the same classification and candidate ordering.
- Technology answer handles enriched support dates, lifecycle, HA/DR and linked applications; distinguish expired support from approaching support and unknown dates.
- Data answer uses actual source-of-truth, classification, quality, residency, stewardship and readiness fields.
- AI answer uses models, data domains, permissions, guardrail coverage, autonomy and human oversight. Declared dependencies are not runtime telemetry.
- Impact answer traverses only dependency-relevant relationships with their documented direction. Do not traverse an undirected graph indiscriminately through evidence/governance edges and label every reachable node affected.
- Declared metadata links can be rendered as derived graph edges through a shared graph adapter, with provenance; preserve whether they were declared, inferred or evidenced. Tests must distinguish technical dependencies from administrative links.
- Evidence and confidence use the shared as-of date. A collection-wide “high confidence” flag cannot override unverified or unrelated evidence.
- Briefings actually apply supported domain/objective/period filters before calculation. Period means recorded applicability/snapshot, not an invented historical trend. If the dataset cannot support a requested time comparison, state that limitation.

Derive answers from the current working pack each time. After evidence verification, decision updates or imports, increment a workspace data revision, invalidate answer caches and regenerate relevant answers. Old answers retain their original snapshot/revision and show `Data changed — refresh answer`. An active old response is not presented as current merely because the panel remains open.

Use stable sort tie-breakers and the configured as-of date for repeatability. Response IDs/timestamps can differ; facts, rankings, reference sets and substantive narrative must be reproducible for the same snapshot.

### 7.5 Response layout and grounding

Default answer: short direct answer, why it matters, three to five key facts, assumptions/limitations, evidence/confidence and two or three useful actions. Expandable details can contain the full explanation. Avoid long generic paragraphs that obscure the decision.

Every factual answer includes:

- Workspace name, scope and as-of date.
- Correct entity names and current workflow states.
- Clickable record references and linked evidence where evidence exists.
- Clear separation of recorded facts, computed results and proposed/inferred actions.
- Confidence with a reason based on completeness, freshness and verification.
- A truthful missing-evidence/unknown-data message where needed.

Extend the response model with structured claims if needed, such as `text`, `kind: recorded|computed|inference|proposal`, source references and optional calculation. Existing `facts`, `inferences`, `calculations`, `entityRefs` and `evidenceIds` can remain for compatibility. ID existence alone is not adequate grounding: a statement must use the cited object's relevant fields or a documented derived calculation.

Examples of proper limits:

- Valid: “The portfolio records a WRITE permission to the case API; the permission control is Partial. Tighten action boundaries before expanding scope.”
- Invalid: “The agent has been safely executing updates with zero incidents,” when no execution/incident data exists.
- Valid: “Recorded availability is 99.5%; target is 99.9%. This is a target, not a measured result of this decision.”
- Invalid: “Approving this initiative has increased availability to 99.9%.”

Reference validation must cover entity refs, evidence IDs, policy/exception links, suggested action targets, claim sources, calculation inputs and the response tenant. Remove unsafe actions and withhold ungrounded factual text. A grounded metadata answer may have no verified evidence but must say so and lower confidence. Governance refusal/unsupported responses do not need fabricated citations or an evidence-backed confidence score.

### 7.6 Suggested questions and action buttons

Replace raw question strings with validated `QuestionDefinition` objects: ID, label, intent, required context type, scenario binding key, supported scopes and expected response kind. Existing tenant-config string questions can be migrated through a compatibility resolver and must pass the same contract tests.

Show four to six relevant chips based on view/selected record/journey step. Display names come from the active workspace. A question for a missing record is omitted or disabled with explanation. Free typing supports documented synonyms; passing chip tests alone is insufficient.

Actions must actually work:

| Action | Required result |
| --- | --- |
| Open entity / evidence / policy | Navigate to the correct view, select the exact record and open the relevant detail; AI panel closes/minimizes if it obscures the source. |
| Show affected objects | Apply a visible, clearable ID filter to the relevant portfolio. |
| Open graph | Set root, scenario, semantic direction/depth and impact mode; reveal the intended neighborhood. |
| Draft recommendation | Resolve a specific finding; use shared eligibility/evidence gate; produce a proposal or a clear limitation. |
| Save for review | Save once as a review draft; return a working `Open saved draft` link. This does not submit/approve. |
| Create recommendation draft | After human review/edit, create a schema-valid Recommendation with evidence/source-response trace; status Draft. |
| Open decision / Review Board | Select exact decision/queue item; preserve rationale/conditions. AI does not press approval controls. |
| Generate briefing | Produce and render a new current-snapshot response in the same Briefing preview state. |
| Copy | Copy displayed content; confirm success, expose selectable text if clipboard permission fails. |
| Print / Open report | Use the actual report/print view with the selected answer, sources, workspace and disclaimer. |

Do not expose `noop` actions as useful buttons. Gate draft eligibility consistently in UI and service; a selected missing/Resolved/Rejected finding cannot be replaced with another one to force success. Draft or Under Review findings require explicit shared eligibility rules and clear provisional status; the J7 successful drafting path uses an Accepted, adequately evidenced finding.

### 7.7 UI states and responsiveness

Provide ready, running, clarification, answered, insufficient-evidence and error states. Disable duplicate submission while the current request is running; support Enter/keyboard submission without disrupting multiline input. No artificial long “thinking” delay; the local engine should feel immediate. Performance target: supported query under one second on the agreed demo laptop for seed packs, measured during QA rather than assumed.

Handle thrown errors with a recoverable retry and retain the typed question. Cancellation/workspace revision tokens must prevent a late response from appearing in another tenant. Closing/reopening Ask must not lose a saved draft; a workspace reset clears that workspace's transient and saved demo AI state according to the reset contract.

## 8. Supported question catalogue and expected answers

These are minimum contracts. Braces are filled from the current binding/selection. Tests verify semantic fields, sources, status and actions, not exact prose. All Q01–Q33 must be implemented, or a journey that depends on an unavailable intent must remain blocked before presentation.

| ID | Presenter question / chip | Required answer content and working next action |
| --- | --- | --- |
| Q01 | What are our most critical enterprise risks? | Ranked open critical/high findings in scope, recorded impact and owners; rank rule disclosed. Open each finding. |
| Q02 | How is enterprise health calculated? | Screen's formula, component values, missing-input limitations and as-of date. Open contributing records. |
| Q03 | Explain this finding. | Selected finding's problem, severity/risk calculation, impact, owner, state and evidence confidence. Open evidence. |
| Q04 | Which recommendations are awaiting decisions? | Under-review recommendations and linked Pending/Deferred decisions, authority, due date and blockers. Open exact review item. |
| Q05 | Generate an executive briefing. | Current scoped posture, risks, changes, decisions, delivery, evidence limitations and next actions. Copy and open report. |
| Q06 | Which capabilities have the largest maturity gaps? | Target minus current, importance/risk context, same values as heatmap. Open capability. |
| Q07 | Which applications support {capability}? | Actual supported-capability/relationship links; selected process context if applicable. Open filtered Applications. |
| Q08 | Which applications should be migrated or eliminated? | Shared TIME candidates, health/value rationale, dependencies and limits. Open comparison/filter. |
| Q09 | What is the impact of retiring {application}? | Direct and supported transitive dependents, capabilities/data/interfaces, path provenance and unknowns. Open impact graph. |
| Q10 | Where are point-to-point integrations concentrated? | Recorded P2P counts/concentration and contributing interfaces, same portfolio scope. Open filtered Integrations. |
| Q11 | What depends on PaymentAdviceAPI? | Selected integration's actual consumers/dependent paths, direction and source references. Open graph. |
| Q12 | What happens if PaymentAdviceAPI is unavailable? | Potential service/process/data exposure and supported remediation; no invented outage duration. Open related resilience finding. |
| Q13 | Which evidence supports this risk? | Only linked/relevant evidence with verification, freshness, source preview and gaps. Open specific evidence record. |
| Q14 | What are the response options for this recommendation? | Recorded options, preferred option/rationale, evidence and dependencies; generated options clearly marked proposals. Open recommendation/decision. |
| Q15 | Summarise this initiative and its KPIs. | Owner, linked objective, decision status, conditions, dependencies, period, KPI baseline/current/target/unit. Open Roadmap or KPI. |
| Q16 | Which critical data domains have governance gaps? | Data ownership/quality/source/residency/control gaps based on recorded fields. Open filtered Data Governance. |
| Q17 | What are the source and consumers of {data domain}? | Source-of-record, source/consumer applications/interfaces and lineage completeness. Open lineage view. |
| Q18 | Is {data domain} ready for AI use? | Recorded readiness with reasons, sensitivity, quality, source conflicts and approvals; no invented legal determination. Open gaps. |
| Q19 | Which reviews or controls are missing for this data? | Relevant applicable standards/policies, review/approval/exception statuses and unknown coverage. Open actual catalogue entry. |
| Q20 | Which technologies are at or approaching end of support? | Normalized support dates, expired/within configured horizon, risk and affected apps; show unknown dates separately. Open technology. |
| Q21 | What services depend on {technology}? | Supported apps/integrations/data and business capabilities based on declared dependencies. Open impact graph. |
| Q22 | Why should we prioritise this technology? | Lifecycle/support, critical service exposure, resilience, exception and evidence. Proposed priority distinguished from recorded severity. |
| Q23 | Summarise this technology risk for the CTO. | Concise business exposure, support/DR facts, containment/migration and decision required; useful source links. |
| Q24 | Which AI use cases need governance attention? | Ranked risk/control-gap cases; missing owner/oversight, excessive permissions, fallback/monitoring gaps. Open filtered AI portfolio. |
| Q25 | Explain {agent} and its risks. | Purpose, autonomy, business owner, models, data sensitivity, permissions, oversight and governance gaps. Open agent detail. |
| Q26 | What can this agent do, and which controls are missing? | Exact recorded READ/WRITE/EXECUTE permissions and partial/missing guardrails; approval/oversight status. Open control/finding. |
| Q27 | What depends on this AI model, or what does this agent depend on? | Direction-specific recorded dependency list; distinguish model dependents from agent dependencies. Open correctly rooted graph. |
| Q28 | Draft a recommendation for this finding. | Eligible selected finding, problem/outcome/options, proposed response, evidence, assumptions, confidence and human-validation label. Save for review or show specific gap. |
| Q29 | Approve this recommendation / agent for production. | Human decision required; open applicable governance review. Absolutely no approval, lifecycle, permission or initiative mutation. |
| Q30 | How will we measure this agent's improvement? | Linked agent-specific KPI if present; otherwise propose a metric with owner/baseline needed. Do not borrow unrelated copilot KPIs. |
| Q31 | What changed during this demo? | Current run/workspace audit delta, actors/roles, affected objects and before/after states. Exclude other workspaces and runs. |
| Q32 | Why did this import fail validation? | Row/field/reference errors from the current staged validation result; show what correction is needed. Open exact error row. |
| Q33 | Is this workspace ready, and what should I review first? | Counts, schema/reference status, relationship/evidence coverage, warnings and actual material findings; if none, state that and recommend a data-readiness action. Start valid journey. |

For Q32, use a staged ingestion context distinct from the not-yet-created pack. It has a unique draft ID and can only be read while the active onboarding draft owns it. Do not set an uncommitted customer ID as a real current tenant. Q33 requires a committed workspace snapshot.

Minimum free-typing paraphrases: `top risks` / `biggest enterprise risks`; `retire this app` / `impact of retiring this application`; `who uses PaymentAdviceAPI` / `consumers of payment advice API`; `EOS technologies` / `unsupported technology`; `agent guardrail gaps` / `what permissions does this agent have`; `board summary` / `executive briefing`. Cover plural, case, punctuation and minor spelling variation through bounded matching, not arbitrary intent guessing.

Additional trust cases: `Who can approve this?` answers the recorded authority; `Which items are approved?` lists recorded approved states. `Compare with another tenant`, foreign context IDs, unknown entities, guaranteed savings, unsupported forecasts and missing evidence receive explicit limitations with relevant next steps. A request such as `What changed?` with no changes says that truthfully.

## 9. Implementation contracts

### 9.1 Typed journey configuration

Replace `Record<string, unknown>` step payloads with a discriminated route-specific contract. The following is a design sketch, not a declaration that these types already exist. Use the repository's real EntityType/domain types and a central route registry in the implementation.

```ts
type EntityBinding =
  | { kind: 'fixed'; type: EntityType; id: string }
  | { kind: 'run-slot'; type: EntityType; slot: string };

type DemoStepV2 = {
  id: string;
  title: string;
  businessQuestion: string;
  presenterNote: string;
  expectedResult: string;
  route: RouteId;
  screenState?: ScreenStateForRoute; // discriminated union, not free-form keys
  selection?: EntityBinding;
  graph?: {
    root: EntityBinding;
    direction: 'upstream' | 'downstream' | 'both';
    depth: number;
    impactMode: boolean;
  };
  target: { name: RegisteredDemoTarget; entity?: EntityBinding };
  ask?: {
    mode: 'ask' | 'explain' | 'draft' | 'briefing';
    questionId: RegisteredQuestionId;
    context?: EntityBinding[];
    executeOnEnter: boolean; // permitted only for read-only generation
  };
  requires?: RegisteredPredicate[];
  completesWhen?: RegisteredPredicate[];
  captures?: { slot: string; fromEvent: RegisteredDomainEvent }[];
  optional?: boolean;
};
```

Screen contracts need explicit tab state and filter state for Findings, Evidence, Recommendations, Governance, each portfolio, Roadmap/Initiatives, AI & Data Governance, reports and ingestion. Move required component-local tab/filter state into a controlled interface or expose a validated navigation context that the screen consumes. Scope this refactor to journey needs; do not rewrite the entire app.

Run state includes run ID, workspace ID, data revision, baseline reference, journey/version, step index, retry nonce, generated-ID slots, completion predicates, question history and action idempotency keys. Persist only what can be restored coherently. New entity IDs are workspace-neutral opaque IDs; remove `dec-gra-${Date.now()}` style assumptions when creating records for other tenants.

Question definitions and journey steps refer to shared scenario bindings. For example, the payment question uses `binding.paymentIntegrationId` and resolves the label through the pack. Do not hardcode a different payment API name in the UI, AI and graph.

### 9.2 Preflight has two layers

**Static readiness before Start:**

1. Required feature routes and question handlers are registered.
2. All fixed IDs exist in the selected workspace with the expected type.
3. Relevant relationships/foreign keys are valid and form the intended story.
4. Required evidence, policies/standards and selected tabs are resolvable.
5. Initial workflow states permit the planned actions; prerequisites are achievable.
6. Fixed journey Ask questions yield the intended response kind and valid sources/actions without recording chat history or changing pack state.
7. Future generated-record steps use declared run slots with a reachable creator step; they do not demand nonexistent IDs at preflight.
8. Baseline/reset is available; unsupported scenarios cannot show Ready.

**Runtime readiness at each step:**

1. Resolved generated slot exists, is in this workspace and has expected state.
2. Route component mounts, required tab opens and exact target is visible.
3. Required action completes through the store and its predicate evaluates true.
4. Read-only Ask operation finishes against current revision; stale results cannot enable Next.

Static target registration cannot prove DOM visibility before a lazy screen mounts. Validate target contracts in component/browser tests and pause on unexpected runtime failure. Do not promise that preflight can eliminate all browser/runtime failures.

### 9.3 Runtime workspace and ingestion detail

Keep immutable starter factories, persisted working packs and demo-run baselines separate. Use IndexedDB for runtime workspace profiles, packs, staged drafts, import audit and accepted baselines. Keep the existing localStorage seed-session migration working; either migrate coherently or define a clear boundary with tests.

Clone with an explicit old→new mapping of entity, relationship, scenario and workspace identifiers; rewrite all schema-defined references, including nested AI permissions, models, controls, initiatives, KPIs, catalogue links and demo bindings. Do not broadly string-replace tenant code inside arbitrary source text. Tenant-owned catalogues and labels must be cloned/resolved too. Validate the entire resulting pack before making it active.

JSON import/export envelope: schema version, workspace profile, dataset version/as-of date, pack, scoped governance catalogue, scenario bindings and source provenance. Exclude unneeded transient UI state. Exported packs must round-trip through validation. An import cannot change the active workspace by silently trusting its tenant ID.

CSV templates adapt external columns such as `owner` to internal fields such as `ownerId` through explicit mapping. Include entity-specific required columns; do not require fictitious `status`/`owner` fields on a relationship schema that does not have them. Validate cross-file references after normalization, then show a staged diff. New IDs, updates, duplicate IDs and invalid relationship types are distinct outcomes.

Provide versioned synthetic clean/error fixtures and downloadable CSV templates for capabilities, processes, applications, integrations/APIs, data objects, technology, AI models/solutions, relationships, evidence and findings. Add forms for small manual corrections. JSON is the complete pack exchange; CSV is schema-mapped entity import, not a competing data model.

Commit is one IndexedDB transaction for profile/pack/import metadata. Parse/schema/reference errors leave the previous accepted pack untouched. Keep staged data for correction. Document replace/update/merge rules; default to previewed merge by ID, reject ambiguous duplicates, and require explicit user confirmation for any replace operation. No partial silent import.

Readiness separates schema validity, relationship coverage, evidence coverage, freshness and journey availability. A score cannot substitute for blocking validation. If a composite readiness score is shown, define its formula, denominator and unknown handling; otherwise present the component measures without an invented percentage.

### 9.4 Small workspace-backed screens needed for complete demonstrations

| Screen | Minimum useful behaviour |
| --- | --- |
| Architecture Health (`assessment`) | Shared workspace metrics with current/target, evidence completeness, gaps and direct drill-through. |
| Standards & Principles (`standards`) | Tenant-scoped applicable rules, linked assets/findings/decisions and exceptions. Reuse existing catalogues; add a thin standards schema only where needed. |
| Review Board (`reviews`) | Repository-derived Pending/Deferred queue, review detail, rationale/conditions and exact decision navigation. |
| KPIs (`kpis`) | Tenant records with baseline/current/target, unit, direction, owner, period/frequency, objective/initiative links and measurement source. |
| Reports (`reports`) | Preserve existing Executive Report; add a working navigation entry and accept current briefing/context. Portfolio reports may be filtered CSV, with no empty hub. |
| Workspace Settings (`workspace-settings`, NEW) | Workspace profile, as-of date, export, reset baseline and delete-local-workspace actions. |

Add Capabilities and Relationship Explorer to visible navigation even though their feature routes already exist. Processes can remain a real capability-linked detail rather than a new top-level route. Update any static sidebar capability index to match the active workspace or label it appropriately; it must not contradict cockpit/Ask values.

## 10. File-level work map and implementation order

Existing files to inspect/change as required:

| Files / area | Required change |
| --- | --- |
| `src/App.jsx`, `src/data.js`, `src/components/Sidebar.jsx` | Central route/navigation contracts, real legacy-screen replacements, Demo Studio/onboarding/ingestion/settings entries, stable selection. |
| `src/features/demo/demoJourneys.ts`, `applyDemoStep.js`, `GuidedDemoBar.jsx`, `DemoLanding.jsx` | Eight journeys, bindings, controlled step execution, retry, predicates, checkpoints and old-ID compatibility. |
| `src/state/prototypeStore.ts` | Run state, transient reset/workspace revision, draft lifecycle, generated IDs, scoped audit and consistent workflow actions. |
| `src/data/repositories/tenantRepository.ts`, tenant registry/config and `src/domain/schemas/index.ts` | Runtime workspace support, normalized resolver, scoped catalogue access, validated import envelopes. |
| `src/lib/ai/types.ts`, `index.ts`, `contextBuilder.ts`, `queryParser.ts`, `intents.ts` | Context, supported questions, name/ID resolution, follow-up, typed dispatch and guard order. |
| `src/lib/ai/deterministicAdapter.ts`, `groundingValidator.ts`, `confidence.ts`, `responseComposer.ts` | Missing handlers, current-snapshot generation, relevant source validation, shared date and truthful confidence. |
| `src/features/ai-assist/*` | Context chips, run states, working actions, shared briefing preview, draft review/conversion and tenant-local component state. |
| Portfolio `portfolioModel.ts` files and `src/features/ai-data-governance/governanceModel.ts` | Shared normalized selectors used by screens and Ask; workspace-scoped policies/approvals/exceptions. |
| `src/features/explorer/*`, `src/components/enterprise/EntityDrawer.jsx` | AI/model/data/technology roots, exact targeting, semantic impact paths and source provenance. |
| `src/features/reports/ExecutiveReport.jsx` | Same-snapshot briefing/report content and print/copy verification. |
| `src/domain/workflow/*` and store workflow actions | Shared eligibility, legal transitions, idempotent entity creation and audit preservation. |

Suggested new modules, adapting names to existing conventions:

```text
src/config/routes.ts
src/config/navigation.ts
src/domain/demo/demoClock.ts
src/features/demo/DemoStudio.jsx
src/features/demo/scenarioPreflight.ts
src/features/demo/journeyRunner.ts
src/features/demo/journeyBindings.ts
src/features/demo/demoTargets.ts
src/data/demo/fixtureBuilders.ts
src/lib/ai/questionCatalog.ts
src/lib/ai/contextResolver.ts
src/lib/ai/scopedSelectors.ts
src/features/ai-assist/RecommendationDraftReview.jsx
src/features/onboarding/CustomerOnboardingWizard.jsx
src/features/data-ingestion/DataIngestionCenter.jsx
src/features/data-ingestion/importers/
src/features/data-ingestion/mappers/
src/data/runtime/runtimeTenantRegistry.ts
src/services/storage/indexedDbTenantStore.ts
src/services/import/validateImportedPack.ts
src/data/templates/
src/features/settings/WorkspaceSettings.jsx
```

Keep existing brand assets if already approved and available locally. This is a journey/AI readiness task; do not block it on a redesign or redraw the Kulana logo. Make narrow style changes for legibility, focused highlights and presentation controls.

| Phase | Work | Exit gate |
| --- | --- | --- |
| P0 | Inspect current branch; install with lockfile; establish baseline validation/tests/build; record pre-existing failures | Known baseline, exact affected files and runtime version. No unrelated cleanup/rewrite. |
| P1 | Shared date, request tenant guard, entity resolution/grounding, question catalogue and working Ask actions | Q01–Q33 contracts implemented in their supported contexts; core AI tests pass, including negative cases. |
| P2 | Studio, typed runner, preflight, exact record targeting, preserved selection, generated-slot support | J1 and J3 complete from reset; errors/retry and briefing generation work. |
| P3 | J2/J4/J5/J6/J7; fixture preparation; draft-to-recommendation bridge; real reviews/standards/KPI/assessment views | Entire GRA product demonstration passes, including human workflow and AI evidence-limit path. |
| P4 | Runtime registry, sector packs, onboarding, JSON exchange, CSV mapping/validation and J8 | Prospect creation/import survives refresh; seed/session isolation and JSON round-trip pass. |
| P5 | Bind remaining tenants, playlists, reporting/export, presentation QA and runbook | All advertised combinations pass acceptance; unavailable combinations are clearly explained. |

Implement phases sequentially with focused commits. Continue to the next phase once its gate passes; fix a failure before building on it. Do not declare P1 fully passed because some new-context handlers await later screens: service fixtures can test them before those screens ship. Separate source/handler readiness from full UI journey readiness.

Use a compatible pinned runtime for the actual Vite version. Run `npm ci`, `npm run validate:tenants`, `npm test` and `npm run build` at baseline and after changes affecting their inputs. Add meaningful tests for the new behaviours below, not tests that merely restate configuration values. Do not run broad checks repeatedly after unchanged inputs pass.

## 11. Acceptance tests and release gate

### 11.1 Automated checks

| ID | Check | Pass condition |
| --- | --- | --- |
| AT01 | Journey/static binding validation | Every advertised journey has registered routes, question handlers, fixed records and valid future slots; missing fixture blocks Start with specific reason. |
| AT02 | Navigation integration | Navigate + lazy mount + selection + highlight opens the exact entity; hash effects do not clear selection. |
| AT03 | Retry/back/skip | Retry reruns read-only step even at same index; Back does not undo/duplicate writes; skipped prerequisites cannot count as Complete. |
| AT04 | Question contracts | Q01–Q33 return expected kind, scoped records, meaningful sources and valid actions on their prepared fixtures. |
| AT05 | Free typing and precedence | Documented paraphrases work; explicit named object overrides old selection; unknown/ambiguous subject does not pick arbitrary first record. |
| AT06 | Guardrail bypass | Foreign request/context IDs, runtime tenant names and explicit intent overrides cannot leak data or execute approval. Informational approval questions still work. |
| AT07 | AI/model/catalogue sources | AI/model names/IDs resolve; grounding accepts valid scoped sources and rejects unknown, wrong-type, unrelated claim and foreign references/actions. |
| AT08 | Fact consistency | Ask values/rankings match shared portfolio/cockpit/KPI selectors; financial claims stay indicative; metadata is not mislabelled as measured telemetry. |
| AT09 | Scope/time | Domain/objective/as-of changes apply consistently; unsupported historical comparisons return limitation; expired/approaching/unknown support dates differ. |
| AT10 | Follow-up | `Why?`, evidence, dependencies and draft follow-ups keep correct same-workspace subject; switch/reset clears subject. |
| AT11 | Evidence gate | Missing/unverified/disputed/stale evidence is handled by shared rules; no unrelated-finding fallback; verification updates confidence and answers. |
| AT12 | Draft lifecycle | Save for review is idempotent and accessible; human conversion creates Draft; AI acceptance does not approve recommendation or decision. |
| AT13 | J7 workflow | Required transitions, rationale/conditions, initiative validation, links and audit are correct; Pending/Rejected/Deferred does not permit prohibited creation. |
| AT14 | Snapshot/reset | Changes invalidate stale answers; old response remains labelled with original revision; restart restores baseline and generated slots without duplicate entities. |
| AT15 | Workspace isolation | Pack, AI history, selected record, local prompt, saved draft, briefing preview, graph, filters, audit and import draft remain scoped, including mounted components. |
| AT16 | Import atomicity | Bad schema/duplicate/broken reference leaves old accepted pack unchanged; partial commit impossible; storage failure is recoverable. |
| AT17 | Runtime cloning/export | All nested references and tenant-owned catalogues remapped; no old institution in labels; export/re-import retains valid relationships and scenario bindings. |
| AT18 | Graph meaning | Dependency direction yields correct affected services; administrative/evidence links do not inflate impact; derived edges retain provenance. |
| AT19 | Readiness | Component measures/counts agree with actual committed/staged records; no findings produces truthful first-data action, not a fabricated critical risk. |
| AT20 | Briefing entry/action | Journey `briefing` command generates and renders current response; Copy/report actions use that response; late results cannot cross tenants. |

Use existing Vitest/domain tests and component integration tests. Test AI handler behaviour with prepared packs, not hardcoded answer snapshots. Browser-test the user paths using the project's available browser tooling; do not add an unrelated automation stack just to claim coverage.

### 11.2 Presenter/browser checklist

- Run all eight GRA journeys twice from their baselines at 1440×900, and core paths at 1280×800 / 1024×768. Navigation and panels remain usable on narrower layouts.
- Run J1, relevant J2/J3 and J7 for BOG, FIDELITY and GENERIC. Run every additional advertised journey/sector supplement; unavailable paths show a reason before Start.
- Create a new synthetic customer from each sector starter; refresh it; run the advertised demo and type contextual Ask questions.
- Click every displayed question chip in each demo context and free-type the documented paraphrases.
- Open every source/action link shown during the journeys; confirm exact record/tab/root, with no hidden drawer behind Ask.
- Use the missing-evidence, unknown-object, ambiguous-object, unsupported-query and approval-request cases in front of the UI.
- Change a record through a permitted local action, regenerate Ask and confirm updated facts. Confirm observed KPI current values do not improve after approval alone.
- Verify local draft review, submission, conditional approval, initiative creation and audit through J7; run twice after reset.
- Import clean/error samples, correct references, export JSON, re-import, and verify counts/relationships and tenant isolation.
- Print an Executive Report and AI briefing to PDF for visual inspection; no clipped charts, missing labels or mismatched workspace. Verify clipboard fallback.
- Test direct hash navigation, refresh under `/app/`, reload/reset recovery, no blank routes, no dead CTA and no uncaught console errors on the supported paths.
- Confirm no API key/network dependency for Ask, no live-connector claims, no production agent execution and no external LLM request.

Report browser checks as performed/not performed with the environment and observed result. Do not substitute a successful build for browser QA.

### 11.3 Definition of done

The release is ready when validation, relevant tests and build pass; every advertised journey completes repeatedly; required Ask questions, follow-ups and source actions work; workflow/import changes persist and reset correctly; the presenter can reproduce the stories from the runbook; and no data appears under the wrong workspace.

Deliver code, `DEMO_JOURNEYS.md`, `ASK_EA360_DEMO_QUESTIONS.md`, an updated `DEMO_RUNBOOK.md`, synthetic import samples/templates, and a concise validation report. Report actual blockers and unsupported combinations explicitly. Deployment is a separate instruction.

## 12. Copy-paste Cursor master prompt

Place this file at the repository root as `EA360_CURSOR_JOURNEYS_AND_ASK_AI.md`, then paste:

```text
Implement EA360_CURSOR_JOURNEYS_AND_ASK_AI.md in the existing Kulana EA360 React/Vite repo.

First inspect the current branch, README.txt, package.json, src/App.jsx,
src/state/prototypeStore.ts, src/data/repositories/tenantRepository.ts,
src/domain/schemas/index.ts, existing demo components, all src/lib/ai modules,
AI-assist UI, portfolio models and workflow logic. Reconcile differences from
the inspected commit in the brief before changing code.

Build the eight journeys J1–J8 and the complete Ask EA360 prototype described
in the file. Work sequentially through P0–P5 and continue after each gate
passes. Amend the existing app; do not scaffold a replacement. Preserve working
features, tenant isolation, seed packs, domain validation and existing URLs.

Priorities:
1. Ask must answer real active-workspace questions from current browser-held
   data, including AI/agents, data governance and technology. Implement Q01–Q33,
   contextual chips, supported typed paraphrases/follow-ups, relevant sources,
   truthful limits, working navigation, draft review and actual briefing generation.
2. Fix selection loss, ignored filters, briefing commands, retry and tenant-local
   component state. Use typed route/tab/selection/graph contracts and exact targets.
3. Separate read-only scenarios from J7's real human workflow. Do not reapprove
   existing decisions, silently mutate statuses, execute agent tools or claim
   KPI targets have been achieved by approving a change.
4. Add Demo Studio, binding preflight, runtime readiness, run checkpoints,
   idempotency and reset. Missing prerequisites must block before presentation.
5. Implement browser-only runtime prospects with IndexedDB, validated JSON/CSV
   import/export, mapping, atomic commit, readiness and all required source remapping.

Keep Ask deterministic and local; no external LLM/API key/backend is needed.
Keep all demo content synthetic and clearly labelled. Use the same normalized
selectors, evidence rules and as-of date in UI, Ask and reports. Never invent
financial outcomes, sources, entities or live integration behaviour.

Add meaningful contract/integration tests from AT01–AT20. Run tenant validation,
tests and production build; fix regressions. Perform the browser/presentation
checks where tooling is available, and report verification limits honestly.
Provide the requested runbooks, question catalogue, synthetic import fixtures,
changed-file summary and test results. Do not deploy or change site audience.
```