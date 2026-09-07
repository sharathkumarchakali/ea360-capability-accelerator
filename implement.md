# EA360 — Product Implementation Plan

**Purpose:** turn the current EA360 front-end prototype into a credible, next-generation Enterprise Architecture Capability & Transformation Intelligence demonstration without prematurely building enterprise infrastructure.

**Audience:** Cursor / coding agent + EA360 product team.

**Working principle:** **Think big. Build narrow. Validate fast. Scale deliberately.**

---

## 0. Product mission for this implementation

EA360 must stop feeling like a collection of attractive static EA screens and start behaving like **one connected operating system for understanding, prioritising, governing and improving Enterprise Architecture**.

Every important user journey must answer five questions:

1. **What did we find?**
2. **Why does it matter?**
3. **What can we do quickly?**
4. **What should we do next?**
5. **How will we know it improved?**

The next iteration should optimise for a management demo where a CIO/CTO/Head of EA can understand the organisation's architecture condition in under 60 seconds, drill into evidence, trace a problem to an action, and see how EA360 supports governance and measurable improvement.

Do **not** attempt to build the full long-term EA360 vision in one pass.

---

# 1. Current-state assessment

The repository currently provides a clean React + Vite front-end prototype with:

- executive overview
- 12-domain maturity model
- findings and risk register
- evidence
- recommendations
- roadmap
- architecture reviews
- decisions
- exceptions
- standards
- people & skills
- KPIs
- executive report
- organisation switcher
- search overlay
- responsive navigation

This is a useful visual foundation, but product behaviour is still primarily **static/demo-shell behaviour**.

## 1.1 Critical product gaps to fix

### A. Organisation switching changes the label, not the organisation story

Today the organisation selector changes the displayed organisation name while most metrics, findings, maturity scores, risks, actions and tables remain shared.

This breaks demo credibility immediately.

**Required outcome:** each synthetic organisation must have its own coherent seed pack containing maturity, evidence confidence, findings, quick wins, recommendations, roadmap, KPIs and landscape context. Switching organisation must refresh the complete experience.

### B. Modules look too similar and behave like generic tables/cards

The current generic `ModuleView` is efficient engineering, but it makes Evidence, Findings, Recommendations, Governance, Standards and KPIs feel like variants of the same page.

**Required outcome:** retain shared layout primitives, but introduce purpose-built experiences for the highest-value modules.

### C. Findings are not yet actionable enough

The Findings page currently shows a risk distribution and register. It does not yet make the complete management chain visible:

**Evidence → Finding → Business Impact → Risk → Quick Win → Recommendation → Owner → Due Date → KPI / Outcome**

**Required outcome:** Findings becomes the operational heart of the prototype.

### D. Quick Wins are missing as a first-class product concept

Quick Wins are one of EA360's strongest differentiators because they convert assessment into visible action within 30/60/90 days.

**Required outcome:** add a dedicated Quick Wins experience and expose it prominently from Overview, Findings and Roadmap.

### E. Buttons currently communicate future functionality rather than doing useful prototype work

`Create / Add` and `Export` currently return prototype toasts.

For a management demo this creates the impression of a mock-up rather than a working product.

**Required outcome:** implement a narrow but real interaction:

- Create/Add opens a contextual form/modal and creates an in-memory demo record.
- Export downloads useful CSV/JSON for tables; Executive Report supports browser print / PDF-friendly rendering.
- Reset reloads seeded data.

Do not build a backend yet unless separately approved.

### F. Search is navigation-oriented rather than enterprise intelligence-oriented

Search should eventually feel like the entry point into enterprise context, not just a route launcher.

**Required outcome for prototype:** search records across findings, evidence, standards, decisions, recommendations and landscape items; show result type, organisation, related domain and one useful context line.

### G. There is no connected enterprise landscape yet

The next-generation EA360 story depends on relationships, not just assessment records.

**Required outcome:** introduce a deliberately small **Enterprise Landscape / Context** module showing a connected synthetic chain such as:

`Business Capability → Application → API → Data → Technology → Risk → Transformation Initiative`

Do not introduce a graph database. Use seed JSON/JS data and deterministic relationship traversal.

### H. Evidence confidence and assessment completion are sometimes blended conceptually

These are different executive signals.

- Assessment completion = how much of the assessment has been completed.
- Evidence confidence = how strongly the result is substantiated.

**Required outcome:** show them separately everywhere.

### I. Current tests do not reflect the React implementation reliably

The existing `tests/interaction.mjs` appears aligned to an older DOM/static implementation and the package does not currently expose a proper test script for the React application.

**Required outcome:** establish a small, real testing baseline for the current React code before adding more interactions.

---

# 2. Product North Star for this build

The prototype should communicate this loop:

**ASSESS → UNDERSTAND → PRIORITISE → QUICK WINS → OPERATIONALISE → GOVERN → MEASURE → REASSESS**

And hint at the long-term EA360 evolution:

**SENSE → UNDERSTAND → SIMULATE → DECIDE → GOVERN → EXECUTE → MEASURE → LEARN**

The prototype must remain credible even with no AI or backend.

---

# 3. Target demo experience

A CEO/CIO/Head of EA should be able to perform this journey in 5–7 minutes:

1. Select a synthetic organisation.
2. Understand architecture health in under 60 seconds.
3. See the top 3–5 problems that materially constrain transformation.
4. Open a critical finding.
5. See the evidence supporting it.
6. Understand business impact and affected architecture.
7. See a 30/60/90-day Quick Win.
8. See the longer-term recommendation and roadmap placement.
9. See who owns the action and how success will be measured.
10. Open the Enterprise Landscape and understand one cross-layer dependency.
11. Run one controlled `What If?` scenario.
12. See one synthetic architecture drift alert.
13. Return to the Value Dashboard and see baseline → current → target.

If this journey works convincingly, the prototype is far more valuable than adding many more static screens.

---

# 4. Priority model

## P0 — Must implement for next management-quality prototype

1. Organisation-specific synthetic seed packs
2. Executive Overview v2
3. Findings v2 + finding detail drawer
4. Quick Wins module
5. Assessment domain drill-down
6. Evidence traceability
7. Recommendations traceability
8. Roadmap visualisation
9. Real create/add demo interactions
10. Real table export
11. Enterprise Landscape / Context module
12. Controlled Ask EA360 experience
13. One What-If scenario
14. One Architecture Drift scenario
15. Demo Data reset / synthetic-data safety
16. Real React test baseline
17. Responsive/mobile hardening
18. Accessibility and keyboard interaction pass

## P1 — Implement after the P0 demo journey is stable

1. Architecture Review workflow detail
2. Architecture Decision detail / ADR IDs
3. Exception expiry / remediation tracking
4. Standards lifecycle / technology radar-style view
5. KPI history / trends
6. Executive report printable layout
7. role-aware views
8. user-created demo records persisted to localStorage
9. richer enterprise relationship traversal
10. sector packs / configurable assessment content

## P2 — Do not build until prototype validation justifies it

1. backend/database
2. authentication/RBAC
3. OIDC/SSO
4. real evidence file storage
5. connectors
6. automated discovery
7. graph database
8. multi-tenancy
9. AI agents
10. policy engine
11. live architecture drift detection
12. enterprise deployment automation

---

# 5. Navigation and information architecture

The current navigation is functionally complete but feels like a traditional EA administration menu.

For the next prototype, reorganise conceptually around the user's job-to-be-done while preserving existing routes where practical.

Recommended navigation:

## Home
- Executive Overview

## Assess
- Assessment
- Findings
- Evidence

## Act
- Quick Wins **NEW**
- Recommendations
- Roadmap

## Explore **NEW**
- Enterprise Landscape
- Ask EA360
- Scenarios

## Govern
- Architecture Reviews
- Decisions
- Exceptions
- Standards
- Drift **NEW / demo**

## Capability
- People & Skills

## Measure
- Value Dashboard / KPIs
- Executive Report

## Admin
- Organisation
- Assessment Model
- Demo Data Lab
- Settings

Do not expose future empty sections. Every visible navigation item must have a meaningful prototype experience.

---

# 6. Executive Overview v2

## Goal

The executive should understand the architecture condition and immediate management agenda within 60 seconds.

### 6.1 Executive verdict

Keep the strong narrative headline pattern, but make it organisation-specific.

Example:

> **Transformation is moving faster than architecture control.**
>
> Governance, API ownership and AI governance are the three constraints most likely to increase delivery risk over the next 12 months.

The statement must be generated from each organisation's seed pack, not hard-coded globally.

### 6.2 Primary health metrics

Show separately:

- Overall maturity: current / target
- Evidence confidence
- Assessment completion
- Critical risks
- Quick Wins identified
- Quick Wins completed

### 6.3 Top management priorities

Show only the top 3–5.

Each must include:

- priority
- issue
- business impact
- horizon
- owner

Clicking opens the underlying finding/recommendation.

### 6.4 Domain maturity heatmap

Use current + target, not current alone.

Each domain row/tile should show:

- current
- target
- gap
- confidence
- risk state

Clicking a domain opens domain drill-down.

### 6.5 Architecture value trajectory

Replace a purely maturity-focused 12-month trajectory with a more credible mixed outcome trajectory.

Example:

- Today — baseline established
- 90 days — control and ownership gaps addressed
- 6 months — governance adopted across programmes
- 12 months — measurable compliance / reuse / resilience outcomes

Maturity can remain one indicator, not the only outcome.

---

# 7. Findings v2 — highest-priority redesign

The Findings page should feel like an executive risk and action cockpit, not a static register.

## 7.1 Summary strip

Show:

- Open findings
- Critical
- High
- Overdue
- Unassigned
- Low-confidence findings

## 7.2 Filters

Add real filters:

- severity
- domain
- status
- owner
- evidence confidence
- time horizon
- overdue only

Add search by title/description.

Filters must update both the register and summary counts where sensible.

## 7.3 Finding register

Recommended columns:

- Finding
- Domain
- Severity
- Business Impact
- Evidence Confidence
- Owner
- Due / Horizon
- Status

Make the entire row clickable.

## 7.4 Finding detail drawer / modal

Clicking a finding opens a right-side detail drawer.

Required sections:

### Finding
- title
- concise description
- domain
- capability
- severity
- status

### Why it matters
- business impact
- risk if not addressed
- affected transformation / capability

### Evidence
- evidence items
- confidence
- last validated
- source type

### Immediate action
- Quick Win
- effort
- horizon
- owner

### Strategic action
- linked recommendation
- dependency
- roadmap phase

### Measure
- KPI
- baseline
- target

### Traceability
Show visually:

`Evidence → Finding → Quick Win → Recommendation → Roadmap → KPI`

Every linked item should be clickable.

## 7.5 Finding quality rule

No finding may exist in demo seed data unless it has at least:

- business impact
- severity
- owner or explicitly `Unassigned`
- evidence confidence
- linked quick win or recommendation

---

# 8. Quick Wins — new first-class module

## Goal

Make EA feel actionable and demonstrate value within 90 days.

## Required views

### Summary
- Identified
- In progress
- Completed
- Overdue

### Filters
- 30 days
- 60 days
- 90 days
- domain
- owner
- value category
- effort
- status

### Value vs Effort matrix

Use a simple 2x2:

- high value / low effort — do now
- high value / high effort — plan
- lower value / low effort — opportunistic
- lower value / high effort — reconsider

### Quick Win fields

- title
- underlying problem/finding
- domain
- value category
- value statement
- effort
- owner
- recommended completion horizon
- status
- evidence of completion
- linked KPI

Value categories:

- Risk Reduction
- Cost Avoidance
- Reuse
- Governance
- Operational Resilience
- Delivery Acceleration
- Security
- Skills
- Visibility

Do not invent monetary value.

---

# 9. Assessment v2

The existing maturity cards are a good index, but users need to understand what the number means.

## Domain index

Each domain should show:

- current maturity
- target maturity
- gap
- evidence confidence
- number of critical/high findings
- assessment completion

Sort by priority / gap option.

## Domain drill-down

Clicking a domain opens a dedicated detail page or drawer.

Required content:

- Domain verdict
- Current / Target / Gap
- Why it matters
- capability / criterion list
- evidence panel
- linked findings
- top Quick Win
- top recommendation
- roadmap placement

Each criterion shows:

- question
- current maturity
- target
- confidence
- evidence status
- notes
- linked findings

No maturity score should appear without explanation and evidence confidence.

---

# 10. Evidence v2

Each evidence item should have:

- title
- domain
- type
- source
- owner
- confidence
- verification status
- last validated date
- linked assessment criteria
- linked findings

Statuses:

- Verified
- Needs review
- Missing
- Superseded

For the prototype, evidence files can remain metadata-only. Do not build storage/upload infrastructure unless separately approved.

---

# 11. Recommendations v2

Every recommendation must answer:

- What?
- Why?
- Business outcome
- Owner
- Dependencies
- Effort
- Priority
- Timeline
- Status
- Linked findings
- Success measure

Provide filters for priority, status, owner and horizon.

Clicking a recommendation opens detail and traceability.

---

# 12. Roadmap v2

Replace the table-only feel with a visual roadmap.

## Required time horizons

- 0–30 days
- 31–90 days
- 3–6 months
- 6–12 months

## Workstreams

- Governance
- Business Architecture
- Data
- Applications
- Integration & APIs
- Security
- Infrastructure & Cloud
- Resilience
- Technology Standards
- AI Governance
- People & Capability

Use horizontal swimlanes or grouped timeline cards.

Each roadmap initiative should show:

- title
- owner
- priority
- status
- dependencies
- linked recommendation

Avoid building a complex Gantt engine.

---

# 13. Governance improvements

## Architecture Reviews
Add queue states:
- pending review
- due soon
- waiting for evidence
- approved
- approved with conditions
- rework

Review detail should show project/programme, decision required, affected domains, evidence, standards checked, open exceptions, decision/conditions, owner and due date.

## Architecture Decisions
Use stable ADR-like IDs, e.g. `ADR-042`.

Fields:
- question / decision
- context
- options considered
- chosen option
- rationale
- decision owner
- date
- status
- affected systems
- risks accepted
- review date

## Exceptions
Add owner, risk acceptance owner, expiry date, days to expiry, remediation, linked standard and status.

## Standards
Add lifecycle state:
- Strategic
- Approved
- Tolerated
- Deprecated
- Retire

Also show owner, approved use, review date, known exceptions and dependent applications count.

---

# 14. Enterprise Landscape / Context — new P0 module

## Goal

Demonstrate that EA360 understands connected architecture, not just maturity assessment.

Use a small deterministic relationship model.

Suggested entity types:

- Strategic Objective
- Business Capability
- Application
- API
- Data Domain
- Technology
- Transformation Initiative
- Risk

Example seed chain:

`Digital Customer Experience`
→ `Customer Onboarding`
→ `Mobile Banking`
→ `Customer API`
→ `Customer Master Data`
→ `PostgreSQL`
→ `Digital Banking Modernisation`

Attach one risk and one architecture standard.

## UI

Provide:

- entity search
- node/relationship exploration
- selected entity side panel
- first/second-level dependency expansion
- relationship labels

Use React/SVG or CSS. Do not add a heavy graph library unless clearly justified.

---

# 15. Ask EA360 — controlled prototype

Do not add an LLM dependency yet.

Build a controlled deterministic experience using the synthetic dataset.

Suggested prompt chips:

- What are our top 5 architecture risks?
- Which applications support Customer Onboarding?
- Which APIs have no documented owner?
- Which technologies create lifecycle risk?
- Which findings need executive ownership?

The response should show:

- concise answer
- evidence / source records
- confidence
- relevant links/actions

Clearly label the prototype as deterministic/demo intelligence if needed.

---

# 16. What-If scenario — controlled P0 experience

Implement exactly one high-quality scenario before building a generic simulator.

Example:

> **What happens if Integration Platform X is retired?**

Display affected:

- business capabilities
- applications
- APIs
- programmes
- risks
- owners

Then show 2–3 response options such as:

- retain temporarily
- migrate integrations
- modernise affected applications

For each option show qualitative dimensions:

- risk
- effort
- time
- strategic alignment
- technical debt

All values must be labelled **Illustrative Demo Scenario**.

---

# 17. Architecture Drift — controlled P0 experience

Implement one synthetic drift alert.

### Approved
`Digital Channel → API Gateway → Integration Layer → Core Banking`

### Observed
`Digital Channel → Direct Database Connection → Core Banking`

Show:

- severity
- policy violated
- affected capability/application
- why it matters
- detected date
- recommended action

Actions:

- Investigate
- Accept Temporary Exception
- Create Remediation

These can modify local/in-memory status only.

Label clearly as synthetic.

---

# 18. Organisation-specific synthetic data architecture

Replace the current global/shared dataset with explicit seed packs.

Recommended shape:

```js
const organisations = {
  orgId: {
    id,
    name,
    type,
    country,
    isSynthetic: true,
    seedPackId,
    seedPackVersion,
    narrative,
    maturity,
    assessments,
    findings,
    evidence,
    quickWins,
    recommendations,
    roadmap,
    reviews,
    decisions,
    exceptions,
    standards,
    people,
    kpis,
    landscape,
    scenarios,
    driftSignals,
  }
}
```

Every record should have stable IDs. Do not use record names as identifiers.

Suggested IDs:

- `FND-001`
- `EVD-001`
- `QW-001`
- `REC-001`
- `ADR-001`
- `STD-001`
- `EXC-001`
- `APP-001`
- `API-001`

Traceability must use IDs.

If real institution names such as Bank of Ghana or Ghana Revenue Authority are retained in demo selectors, display a persistent disclosure that all shown records are **SYNTHETIC DEMO DATA** and do not represent the institution's real architecture condition.

Do not display invented weaknesses as if they are factual claims about a real institution.

---

# 19. Demo Data Lab

Add an admin-only Demo Data Lab visible in demo mode.

Functions:

- Load All Demo Organisations
- Reset Selected Demo Organisation
- Reset All Synthetic Demo Data
- Empty Demo Workspace

For the front-end prototype this can reset application/localStorage state from seed constants.

Every destructive action requires confirmation.

---

# 20. Interaction standards

## Tables
- sortable columns where useful
- filter controls
- search
- clickable rows
- empty state
- count of filtered results
- horizontal responsiveness

## Drawers
Use right-side drawers for fast record inspection. Drawers should preserve user context and support linked navigation.

## Create / Add
Replace placeholder toast with contextual modal. For prototype, create records in memory/localStorage with validation and success feedback.

## Export
Implement useful exports:
- table CSV
- JSON where useful
- Executive Report print stylesheet / browser PDF

---

# 21. Visual/product design improvements

## Brand
Use Kulana mint/aqua/cyan as primary product accents.

Semantic colours may still be used for risk/status because removing red/amber would reduce usability, but they must be restrained and should not become the main brand palette.

## Visual hierarchy
Every page should follow:

1. Page purpose / narrative
2. Key decisions or metrics
3. Visual insight
4. Actionable register/content

Avoid stacking too many equal-weight cards.

## Executive language
Prefer:

> 5 architecture risks require executive ownership

instead of:

> 5 critical findings

when speaking to management.

## Progressive disclosure
Keep executive screens simple. Put architecture detail in drill-downs/drawers.

## Icons
Replace text-symbol icons (`⌘`, `▣`, `⚑`, etc.) with one consistent icon set only if this does not add unnecessary dependency weight. Otherwise use clean inline SVGs.

## Responsive behaviour
On smaller screens:

- tables convert to horizontal scroll or stacked record cards
- metric grids reduce gracefully
- drawers become full-screen sheets
- filters collapse into a filter panel
- no text should clip

---

# 22. Product copy improvements

Use consistent terminology:

- **Evidence Confidence** — not confidence/completion combined
- **Quick Win** — under 90-day actionable improvement
- **Recommendation** — strategic intervention
- **Roadmap Initiative** — sequenced implementation item
- **Architecture Risk** — risk derived from architecture condition
- **Architecture Decision** — approved decision with rationale
- **Exception** — approved temporary deviation from standard

Avoid jargon-first copy. TOGAF can inform the model but should remain behind the interface.

---

# 23. Testing strategy

The current prototype needs a real React-oriented verification baseline.

## P0 testing setup
Add:
- Vitest
- React Testing Library
- `npm test`

Optionally add Playwright only if it remains lightweight and reliable.

## Required tests

### Organisation switching
- changes overview narrative
- changes maturity values
- changes findings
- changes KPIs

### Findings
- filter by severity/domain/status
- row opens detail
- linked evidence appears
- linked Quick Win appears

### Quick Wins
- filter by horizon
- open detail

### Navigation
- every visible menu item opens a valid experience

### Create/Add
- modal opens
- validation works
- record appears after save

### Export
- CSV generation returns expected columns/rows

### Demo reset
- restores seed data
- does not create malformed state

### Accessibility basics
- modals/drawers have labels
- Escape closes overlays
- focus returns to trigger
- keyboard navigation works

Do not keep tests that only validate an obsolete static DOM implementation.

---

# 24. Engineering structure

The current small codebase can remain React + Vite.

Do not introduce a framework migration for the prototype.

Suggested structure:

```text
src/
  app/
    App.jsx
    routes.js
  components/
    layout/
    shared/
    tables/
    drawers/
  features/
    overview/
    assessment/
    findings/
    evidence/
    quick-wins/
    recommendations/
    roadmap/
    governance/
    landscape/
    ask-ea360/
    scenarios/
    drift/
    value/
  data/
    seed-packs/
    selectors.js
    relationships.js
  hooks/
  utils/
  styles/
```

Do not refactor everything before delivering user value. Refactor incrementally while implementing each vertical slice.

---

# 25. Recommended implementation sequence for Cursor

Do not implement all items in one giant pass.

## Issue 01 — Data foundation + organisation switching
- introduce stable IDs
- create organisation-specific seed packs
- create selectors
- ensure every screen uses selected organisation data
- add synthetic-data banner

**Acceptance:** switching organisations visibly changes the complete story, not just the name.

## Issue 02 — Test foundation
- add Vitest + React Testing Library
- replace/retire obsolete interaction test
- test organisation switching and navigation

**Acceptance:** `npm test` and `npm run build` pass.

## Issue 03 — Executive Overview v2
- organisation-specific verdict
- current vs target
- separate evidence confidence and assessment completion
- top management priorities
- Quick Win counts
- clickable domain tiles and priorities

**Acceptance:** executive can navigate from overview to the underlying record/domain.

## Issue 04 — Findings v2 vertical slice
- filters
- search
- clickable register
- detail drawer
- evidence / Quick Win / recommendation / KPI traceability

**Acceptance:** one critical finding can be traced end-to-end.

## Issue 05 — Quick Wins
- nav/module
- filters
- value vs effort
- detail
- links to findings and KPIs

**Acceptance:** user can identify what to do in 30/60/90 days.

## Issue 06 — Assessment domain drill-down
- current / target / gap / confidence
- criteria
- evidence status
- linked findings/actions

**Acceptance:** maturity score becomes explainable and actionable.

## Issue 07 — Evidence + Recommendations traceability
- evidence detail
- recommendation detail
- bidirectional linked navigation

**Acceptance:** records no longer feel isolated.

## Issue 08 — Roadmap v2
- timeline/swimlane
- time horizons
- workstreams
- linked recommendations
- owner/status

**Acceptance:** roadmap communicates a manageable transformation sequence.

## Issue 09 — Real prototype interactions
- Create/Add modal
- local state/localStorage
- CSV export
- print-ready executive report

**Acceptance:** no core visible CTA responds only with “future phase” messaging.

## Issue 10 — Enterprise Landscape
- entity model
- relationship model
- search
- dependency exploration
- detail panel

**Acceptance:** user can visually trace at least one business-to-technology dependency chain.

## Issue 11 — Ask EA360 controlled experience
- prompt chips
- deterministic query handlers
- evidence-linked answers

**Acceptance:** demo shows the future AI experience without an LLM dependency.

## Issue 12 — What-If + Drift demos
- one scenario
- one drift signal
- affected entities
- actions
- clear synthetic labelling

**Acceptance:** two next-generation WOW moments work end-to-end.

## Issue 13 — Governance detail
- reviews
- decisions / ADR IDs
- exceptions
- standards

**Acceptance:** governance feels operational, not archival.

## Issue 14 — Value Dashboard + Executive Report
- baseline/current/target
- trend interpretation
- report narrative
- printable view

**Acceptance:** management can see whether EA is creating measurable improvement.

## Issue 15 — Demo hardening
- mobile/tablet pass
- keyboard/accessibility pass
- empty states
- error boundaries
- no dead controls
- synthetic disclosures
- build/test verification

**Acceptance:** ready for customer/design-partner demonstration.

---

# 26. P0 acceptance criteria for the next EA360 demo

- [ ] organisation switching changes the complete synthetic dataset
- [ ] all real institution demo data is explicitly marked synthetic
- [ ] Overview communicates condition, risk, action and target within 60 seconds
- [ ] maturity shows current + target + confidence
- [ ] Findings can be filtered and opened
- [ ] one finding traces to evidence, Quick Win, recommendation, roadmap and KPI
- [ ] Quick Wins exist as a first-class module
- [ ] Assessment supports domain drill-down
- [ ] Evidence shows provenance/verification/confidence
- [ ] Recommendations show business outcome, owner and success measure
- [ ] Roadmap is visually sequenced by time horizon
- [ ] Create/Add performs a real prototype action
- [ ] Export downloads useful data
- [ ] Enterprise Landscape shows connected architecture
- [ ] Ask EA360 has a credible controlled demonstration
- [ ] one What-If scenario works
- [ ] one Architecture Drift scenario works
- [ ] visible core controls are not dead
- [ ] desktop is polished
- [ ] tablet is usable
- [ ] mobile is usable
- [ ] keyboard interaction works for overlays/drawers
- [ ] `npm run build` passes
- [ ] `npm test` passes

---

# 27. Explicit non-goals

Do not introduce the following merely to make the prototype appear more enterprise-grade:

- microservices
- Kafka
- Kubernetes
- Redis
- backend database
- graph database
- SSO
- real multi-tenancy
- real CMDB integrations
- AI/LLM service dependency
- workflow engine
- BPMN modelling
- complete ArchiMate modeller
- enterprise document management
- billing

These belong after customer validation or when a specific MVP requirement demands them.

---

# 28. Product benchmark principles to protect

Modern EA platforms are moving toward connected architecture data, automated data quality, relationship exploration, AI-assisted analysis and transformation collaboration. EA360 should not try to win by merely presenting prettier maturity dashboards.

EA360's prototype differentiation should be visible through:

1. **Evidence-backed maturity**
2. **Finding-to-action traceability**
3. **Quick Wins under 90 days**
4. **Connected business-to-technology context**
5. **Continuous governance concepts**
6. **Controlled scenario/impact reasoning**
7. **Management-visible value measurement**
8. **Sovereign/customer-hosted future positioning**

The moat is not “AI”.

The long-term moat is:

**Enterprise Context + Evidence + Decisions + Transformation History + Outcomes**

---

# 29. Cursor operating instructions

Before implementing each issue:

1. Read this file.
2. Inspect the current implementation.
3. Preserve working behaviour unless the issue requires change.
4. State assumptions.
5. Implement one focused vertical slice.
6. Use the simplest maintainable approach.
7. Avoid unnecessary dependencies.
8. Add/update tests for the slice.
9. Run `npm test`.
10. Run `npm run build`.
11. Verify responsive behaviour for affected screens.
12. Do not claim completion for controls that remain placeholders.
13. Capture unrelated ideas in a backlog rather than expanding scope.

At the end of each issue, report:

- files changed
- user-visible behaviour added
- tests added/run
- build status
- known gaps
- recommended next issue

---

# 30. Final product standard

EA360 should not become the place where architects spend all day maintaining diagrams.

The product should become the place where an organisation can:

> **Know the enterprise. Understand what matters. Act on architecture risk. Govern transformation. Measure improvement. Shape what comes next.**

For the next prototype, prioritise **coherent product behaviour and credible decision support** over feature count.
