# EA360 Prototype Blueprint

**Product:** EA360  
**Tagline:** Know Your Enterprise. Shape What’s Next.  
**Purpose:** Cursor-ready source of truth for building a premium, end-to-end product prototype  
**Primary market:** Ghana, followed by Africa and other growth markets  
**Prototype tenants:** Ghana Revenue Authority, Bank of Ghana, Fidelity Bank Ghana and a Generic Enterprise  

---

## 1. Product North Star

EA360 is an **Enterprise Intelligence and Transformation Governance platform**. It connects strategy, business capabilities, processes, applications, integrations, data, technology, risks, investments and initiatives into one trusted enterprise view.

EA360 must help leaders answer five questions:

1. What does our enterprise depend on?
2. Where are the most important gaps, risks and duplications?
3. Which changes will create the greatest business value?
4. What will be affected by each decision?
5. Are transformation investments delivering the intended outcomes?

### Positioning rule

Do not present EA360 as merely an EA repository, diagramming tool or AI chatbot.

> Traditional EA tools document the enterprise. EA360 helps leaders understand it, govern it and transform it.

AI is embedded selectively to accelerate discovery, analysis and reporting. It never replaces evidence, architecture governance or accountable human decisions.

---

## 2. Prototype Goal

Build a visually compelling, fully navigable prototype that feels like a real institutional SaaS product and allows Kulana to:

- Demonstrate business value to executives, architects and transformation leaders.
- Showcase credible, customer-specific environments using synthetic data.
- Validate demand, priority use cases, willingness to pilot and buying ownership.
- Convert demonstrations into paid discovery engagements or pilots.
- Establish the product experience before investing in production engineering.

### Prototype success moment

Within two minutes, an executive should be able to see enterprise health, value at risk, priority decisions and the transformation initiatives requiring attention.

Within fifteen minutes, an architect should be able to trace an enterprise dependency, investigate a finding, review evidence, approve a recommendation and place an initiative on the roadmap.

---

## 3. Scope Guardrails

### Included

- Multi-tenant demonstration experience.
- Executive and architecture intelligence dashboards.
- Connected enterprise object model.
- Interactive heatmaps, portfolio charts and dependency views.
- Findings, evidence, recommendations and roadmap workflow.
- Selective AI-assisted experiences grounded in tenant data.
- Browser persistence and one-click demo reset.
- Responsive desktop, tablet and mobile layouts.
- Executive report preview and PDF-friendly export.

### Excluded from the prototype

- Real institutional or confidential data.
- Production-grade identity, tenancy, billing or permissions.
- Live integrations with customer systems.
- Full ArchiMate modelling or diagram authoring.
- Autonomous AI decisions or automatic repository updates.
- Complex workflow designer and configurable rules engine.
- Production LLM, vector database or knowledge-graph infrastructure unless added later behind interfaces.

Do not expand these boundaries without updating this blueprint first.

---

## 4. Target Users

| Persona | Primary need | EA360 outcome |
|---|---|---|
| Executive leader | Know exposure, value and decisions required | Concise executive cockpit and decision briefing |
| CIO / CTO / CDO | Align technology and transformation investment | Portfolio health, dependencies and priorities |
| Enterprise architect | Maintain connected enterprise knowledge | Traceability, findings, standards and roadmaps |
| Domain architect | Analyse a business or technology domain | Filtered domain views and impact analysis |
| Transformation leader | Govern initiatives and benefits | Roadmap, dependencies, value and risk reduction |
| Risk / compliance leader | Understand operational and regulatory exposure | Evidence-backed risks, controls and ownership |

For the prototype, provide a visible role switcher. It changes emphasis and default views, not real permissions.

---

## 5. Demonstration Tenants

All screens must show **“Synthetic demonstration data”** unobtrusively but clearly. Do not imply that any named institution supplied or validated the data.

### Ghana Revenue Authority (GRA)

**Story:** Improve revenue assurance, taxpayer experience and interoperability across tax and customs services.

Synthetic themes:

- Fragmented taxpayer information across platforms.
- Duplicate point-to-point integrations.
- Manual reconciliation affecting revenue assurance.
- Legacy customs or tax components approaching end of support.
- Opportunity for a unified taxpayer view and reusable API layer.

### Bank of Ghana (BoG)

**Story:** Strengthen regulatory oversight, operational resilience, data governance and EA operationalisation.

Synthetic themes:

- Multiple regulatory reporting channels.
- Inconsistent data ownership and lineage.
- Critical payment-system dependencies.
- Architecture reviews occurring too late in delivery.
- Opportunity for regulatory data architecture and governed design assurance.

### Fidelity Bank Ghana

**Story:** Accelerate digital banking while simplifying the application and integration estate.

Synthetic themes:

- Duplicate customer onboarding capabilities.
- Legacy core-banking dependencies slowing digital releases.
- Point-to-point integrations across channels.
- Overlapping customer-facing applications.
- Opportunity for customer-domain modernisation and API-led integration.

### Generic Enterprise

**Story:** A neutral prospect environment covering strategy, operations, customer, finance, risk and technology.

### Tenant integrity rule

Switching tenants must change the organisation structure, terminology, capabilities, applications, findings, recommendations, KPIs, charts and narrative. Changing only the logo and organisation name is unacceptable.

---

## 6. Core Product Journey

**Understand → Diagnose → Decide → Transform → Measure**

1. **Understand:** Explore strategy, capabilities and enterprise dependencies.
2. **Diagnose:** Identify gaps, duplication, obsolescence and risk concentrations.
3. **Decide:** Review evidence, impact, options, value and confidence.
4. **Transform:** Convert approved recommendations into owned roadmap initiatives.
5. **Measure:** Track maturity, benefits, risk reduction and governance progress.

### Signature traceability experience

Users must be able to trace:

**Strategic Objective → Capability → Process → Application → API/Integration → Data → Technology → Finding/Risk → Recommendation → Initiative → KPI**

Selecting any object opens a contextual detail panel and highlights connected objects. The user can continue drilling down without losing context.

---

## 7. Information Architecture

### Primary navigation

1. Executive Cockpit
2. Strategy & Outcomes
3. Capabilities
4. Application Portfolio
5. Integration & APIs
6. Data & Technology
7. Relationship Explorer
8. Findings & Risks
9. Recommendations
10. Transformation Roadmap
11. Governance & Decisions
12. KPIs & Value
13. Executive Report
14. Organisation & Settings

### Global product controls

- Tenant selector.
- Role selector.
- Global search / command palette.
- Period and business-unit filters.
- Notifications and decision inbox.
- Help and guided-demo launcher.
- Synthetic-data indicator.
- Demo reset control.

No navigation item may lead to a dead or placeholder screen.

---

## 8. Priority Screen Requirements

### 8.1 Executive Cockpit

Display:

- Enterprise health score with explainable contributing factors.
- Strategic alignment and architecture maturity.
- Critical risks and value at risk.
- Application health and technology obsolescence.
- Transformation value and initiative progress.
- Decisions requiring executive attention.
- Three narrative insights: what changed, why it matters and what action is required.

Every KPI card must open the relevant detailed view with the same filter context.

### 8.2 Capability Intelligence

Provide:

- Level 1–3 hierarchical capability map.
- Heatmap modes: maturity, strategic importance, risk, investment and application support.
- Current versus target maturity.
- Business-unit and strategy filters.
- Capability detail panel showing owner, outcomes, processes, applications, findings and initiatives.

### 8.3 Application Portfolio

Provide:

- TIME classification: Tolerate, Invest, Migrate, Eliminate.
- Business value versus technical health bubble chart.
- Cost, lifecycle, criticality and ownership views.
- Duplicate application clusters.
- Technology-obsolescence exposure.
- Application detail with capabilities, integrations, data, risks and roadmap actions.

### 8.4 Integration & API Landscape

Provide:

- Integration topology and flow direction.
- API reuse, duplication and criticality indicators.
- Point-to-point concentration.
- Dependency and failure-impact view.
- Filters by domain, protocol, lifecycle and criticality.

### 8.5 Relationship Explorer

Use an interactive graph with:

- Expand/collapse by relationship type.
- Search, filters, zoom, fit and reset.
- Shortest-path or dependency-path highlighting.
- Upstream and downstream impact modes.
- Contextual side panel with evidence and actions.
- Clear legend and accessible colour usage.

Keep the default graph curated and readable. Do not render the entire tenant dataset at once.

### 8.6 Findings & Risks

Each finding must contain:

- Title, category, severity and status.
- Clear problem statement and root cause.
- Business impact and urgency.
- Linked enterprise objects.
- Evidence and source freshness.
- Owner and target date.
- Recommended action and decision status.

### 8.7 Recommendations

Each recommendation must show:

- Intended business outcome.
- Supporting findings and evidence.
- Affected capabilities and systems.
- Options considered.
- Expected value and risk reduction.
- Indicative effort and dependencies.
- Confidence and assumptions.
- Review, approve, reject or request-revision actions.

An approved recommendation can create a roadmap initiative with pre-populated fields.

### 8.8 Transformation Roadmap

Provide:

- Now / Next / Later and quarterly views.
- Initiative dependencies and decision gates.
- Expected value, cost band and risk reduction.
- Status, owner and affected capabilities.
- Scenario filtering by strategic objective or business unit.

### 8.9 Governance & Decisions

Provide:

- Architecture Review Board queue.
- Decision records with evidence and rationale.
- Standards and exception status.
- Ageing and turnaround indicators.
- Audit-style history of key prototype actions.

### 8.10 Executive Report

Generate a polished report view containing:

- Executive summary.
- Enterprise health and strategic alignment.
- Top risks and value at stake.
- Priority recommendations.
- Roadmap and decisions required.
- Clear synthetic-data statement.

The report must print cleanly to PDF using browser print styles.

---

## 9. Selective AI Experience

### Product principle

**AI under the hood; evidence and outcomes on the surface.**

Do not label ordinary filters, search or rules as AI. Do not place a chatbot on every screen.

### Prototype AI capabilities

1. **Ask EA360:** Answer natural-language questions using only the active tenant dataset.
2. **Insight explanation:** Explain why a score, finding or risk matters.
3. **Change-impact analysis:** Show what is affected if an application, API or technology changes.
4. **Duplication detection:** Highlight likely overlaps and show the supporting relationships.
5. **Recommendation drafting:** Produce a structured, evidence-linked recommendation.
6. **Executive briefing:** Assemble a concise, role-specific decision summary.

### Trust model

Every AI-assisted result must show:

- Evidence links.
- Affected enterprise objects.
- Assumptions.
- Confidence label: High, Medium or Low.
- “AI-assisted” status.
- Human review state.
- Feedback or correction action.

Use this workflow:

**AI suggests → Evidence is shown → Architect validates → Authority approves → EA360 records**

### Prototype implementation

Use deterministic, tenant-grounded response templates and data-driven calculations behind an AI service interface. This creates reliable demonstrations now and allows a real LLM/RAG implementation later without redesigning the UI.

AI must never invent an entity, metric or relationship that is not present in the active tenant dataset.

---

## 10. Enterprise Information Model

### Core entities

- Tenant
- Organisation Unit
- Person / Role
- Strategic Objective
- Business Outcome
- Capability
- Process
- Application
- API / Integration
- Data Domain / Data Object
- Technology Component
- Standard
- Evidence Item
- Finding
- Risk
- Recommendation
- Decision
- Initiative
- KPI

### Required common fields

Every entity must include:

- `id`
- `tenantId`
- `name`
- `description`
- `status`
- `ownerId`
- `createdAt`
- `updatedAt`
- `dataQuality`
- `sourceRefs`
- `tags`

### Relationship model

Use a generic typed relationship object:

```ts
type EnterpriseRelationship = {
  id: string;
  tenantId: string;
  sourceId: string;
  sourceType: EntityType;
  targetId: string;
  targetType: EntityType;
  relationshipType: RelationshipType;
  description?: string;
  criticality?: 'low' | 'medium' | 'high' | 'critical';
  evidenceIds: string[];
};
```

All dashboard metrics and AI-assisted insights must be derived from these entities and relationships, not separately hard-coded.

---

## 11. Synthetic Data Standard

Minimum target per named tenant:

| Data object | Target quantity |
|---|---:|
| Strategic objectives | 6–10 |
| Capabilities | 45–70 |
| Processes | 25–40 |
| Applications | 35–60 |
| APIs / integrations | 40–80 |
| Data domains / objects | 20–35 |
| Technology components | 25–50 |
| Findings / risks | 15–22 |
| Recommendations | 10–16 |
| Initiatives | 8–12 |
| KPIs | 10–16 |
| Evidence items | 15–25 |

### Data quality rules

- Use realistic Ghanaian institutional terminology without claiming factual accuracy.
- Make metrics internally consistent across summary and detail screens.
- Give every critical finding evidence and an affected enterprise object.
- Give every initiative at least one objective, capability and recommendation link.
- Avoid random names, lorem ipsum, impossible dates and arbitrary percentages.
- Use stable seeded generation so the demo is reproducible.
- Validate references at startup and fail visibly in development if an ID is broken.

---

## 12. Experience and Visual Direction

EA360 should feel like a premium institutional intelligence product: calm, confident, modern and information-rich without becoming crowded.

### Design principles

- Use Kulana brand colours through central design tokens.
- Use white or near-white content surfaces with restrained brand accents.
- Maintain strong typography, spacing and hierarchy.
- Use colour semantically and consistently.
- Prefer charts, heatmaps and relationship views where they improve decisions.
- Avoid excessive gradients, glass effects, oversized cards and decorative dashboards.
- Use progressive disclosure: summary first, detail on demand.
- Provide helpful loading, empty, error and no-result states.
- Meet accessible contrast and keyboard-navigation expectations.
- Design mobile views intentionally; do not merely compress desktop layouts.

### Chart rule

Every chart must have a decision purpose, clear title, unit, legend, filter behaviour and click-through destination. Decorative charts are prohibited.

---

## 13. Recommended Technical Architecture

### Stack

- Next.js with TypeScript.
- Tailwind CSS and shadcn/ui.
- Apache ECharts or Recharts for analytical visualisations.
- React Flow for relationship and impact exploration.
- TanStack Table for portfolio views.
- Zustand for prototype state.
- Zod for runtime validation.
- Local TypeScript/JSON seed packs behind repository interfaces.
- Supabase-ready data-access boundary for future persistence.
- Vitest for unit tests and Playwright for journey tests.

### Architecture boundaries

```text
UI components
  -> feature services
    -> domain services and derived metrics
      -> repository interfaces
        -> local synthetic-data adapter (prototype)
        -> future API/Supabase adapter

AI UI
  -> AI orchestration interface
    -> deterministic tenant-grounded adapter (prototype)
    -> future governed LLM/RAG adapter
```

Components must not import tenant seed files directly. All access goes through repository and selector functions.

### Suggested repository structure

```text
src/
  app/
  components/
    ui/
    charts/
    enterprise/
  features/
    executive/
    capabilities/
    applications/
    integrations/
    explorer/
    findings/
    recommendations/
    roadmap/
    governance/
    reports/
    ai-assist/
  domain/
    entities/
    relationships/
    metrics/
    schemas/
  data/
    tenants/
      gra/
      bog/
      fidelity-bank/
      generic/
    repositories/
    validators/
  state/
  lib/
  tests/
```

---

## 14. Cursor Execution Rules

Cursor must follow these rules throughout implementation:

1. Treat this document as the product source of truth.
2. Build vertical, demonstrable journeys rather than isolated components.
3. Complete GRA as the reference tenant before cloning the structure to others.
4. Reuse components and domain logic; never fork the application per tenant.
5. Keep TypeScript strict and avoid `any` unless documented and unavoidable.
6. Validate all seed data with Zod and verify every relationship reference.
7. Derive metrics from records; never duplicate KPI values in page components.
8. Do not add placeholder navigation, non-functional buttons or fake controls.
9. Every interactive element must work or be removed.
10. Preserve responsive behaviour and accessibility during every phase.
11. Add tests alongside each completed vertical slice.
12. Maintain `IMPLEMENTATION_STATUS.md` with completed, current, blocked and next items.
13. Do not introduce a real backend or LLM before the prototype experience is complete.
14. Do not change scope silently; document proposed deviations first.

---

## 15. Build Plan and Quality Gates

### Phase 1 — Foundation

- Establish Next.js project, tokens, shell and navigation.
- Define domain types, Zod schemas, repositories and tenant configuration.
- Implement tenant/role switching, global filters and demo reset.

**Gate:** Application shell is responsive, every route loads and no tenant data leaks across environments.

### Phase 2 — GRA Reference Journey

- Create the connected GRA synthetic dataset.
- Build Executive Cockpit, Capability Intelligence and Application Portfolio.
- Implement consistent drill-down and filtering.

**Gate:** Dashboard metrics reconcile with underlying GRA records and the two-minute executive journey works end to end.

### Phase 3 — Intelligence and Governance

- Build Integration Landscape and Relationship Explorer.
- Build Findings, Evidence, Recommendations and Decisions.
- Enable recommendation-to-initiative workflow.

**Gate:** A user can trace a dependency, validate a finding and create a governed roadmap initiative.

### Phase 4 — Selective AI

- Implement Ask EA360, explanations, impact analysis and executive briefing.
- Ground every result in the active tenant and show evidence/confidence.

**Gate:** No AI-assisted answer introduces unsupported data; all outputs are reviewable and explainable.

### Phase 5 — Additional Tenants

- Create BoG, Fidelity Bank and Generic Enterprise data packs.
- Tune narratives, KPIs, findings and terminology per tenant.

**Gate:** Each tenant tells a materially different story using the same product engine.

### Phase 6 — Demo Readiness

- Complete mobile/tablet layouts, print styles and executive report.
- Add guided tours, reset, loading/error states and interaction polish.
- Run unit, journey, responsive and visual QA.

**Gate:** The fifteen-minute demo completes without broken interactions, unexplained placeholders or manual data correction.

---

## 16. Required Demonstration Journeys

### Executive journey — 5 minutes

1. Select a tenant.
2. Review enterprise health and top risks.
3. Open a priority insight and inspect affected capabilities.
4. Compare value, risk and required decisions.
5. Generate the executive briefing.

### Architect journey — 10 minutes

1. Open the capability heatmap.
2. Select a high-risk capability.
3. Trace supporting applications, APIs, data and technology.
4. Review a finding and its evidence.
5. Validate a recommendation and submit it for decision.

### Transformation journey — 10 minutes

1. Open an approved recommendation.
2. Create a pre-populated initiative.
3. Review dependencies and affected objectives.
4. Position the initiative on the roadmap.
5. Show expected value, KPI linkage and risk reduction.

---

## 17. Definition of Done

The prototype is ready for customer demonstrations only when:

- All named tenants contain distinct, coherent and labelled synthetic data.
- An executive understands health, exposure and required decisions within two minutes.
- Users can trace connected enterprise relationships without encountering dead ends.
- Findings connect to evidence, recommendations, decisions and initiatives.
- AI-assisted results are grounded, explainable and human-controlled.
- Metrics reconcile between dashboards and detailed records.
- All navigation, filters, buttons, drawers and dialogs work.
- Desktop, tablet and mobile layouts have been verified.
- The executive report prints cleanly to PDF.
- Demo reset restores the original seeded state.
- Automated tests cover the three required demonstration journeys.
- No screen contains lorem ipsum, arbitrary charts, broken references or unfinished placeholders.

---

## 18. Commercial Validation Built into the Prototype

After every demonstration, capture:

- Which problem was most relevant?
- How is it handled today?
- What does the problem cost in time, money, risk or delayed change?
- Who owns the problem and budget?
- Which data sources could support a pilot?
- What outcome would justify action this quarter?
- Would the institution sponsor a time-boxed paid discovery or pilot?

Prototype learning is more important than feature volume. Prioritise evidence of demand, urgency and willingness to pay before expanding EA360 into a production platform.

---

## Final Product Rule

> EA360 must make complex enterprise relationships understandable, important decisions defensible and transformation progress measurable.

If a proposed feature does not improve one of those outcomes, it should not enter the prototype.
