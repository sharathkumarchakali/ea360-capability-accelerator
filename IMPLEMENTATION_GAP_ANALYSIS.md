# EA360 Implementation Gap Analysis

**Product:** EA360 — Enterprise Intelligence and Transformation Governance  
**Source of truth:** `EA360_PROTOTYPE_BLUEPRINT.md`  
**Codebase inspected:** React + Vite application at repository root  
**Assessment date:** 7 September 2026  
**Assessor role:** Lead Product Engineer / Product Architect  

**Explicit constraints for this evolution (supersede blueprint stack where they conflict):**

- Do **not** create a new project.
- Do **not** migrate to Next.js.
- Continue on the existing **React + Vite** application.
- One product engine for all tenants (no forked GRA / BoG / Fidelity apps).
- Derive dashboard metrics from tenant records.
- No real backend or LLM in the prototype phase.
- No placeholder pages or non-functional controls.
- Preserve useful existing work.

---

## 1. What already works and should be preserved

| Area | Current asset | Why keep it |
|---|---|---|
| **Runtime stack** | Vite 7 + React 19 SPA | Fast local loop, static deploy (`dist`), already buildable |
| **App shell** | Topbar + Sidebar + Main + mobile overlay | Correct institutional SaaS chrome pattern |
| **Hash navigation** | `App.jsx` view state + `location.hash` | Works without a router; can be upgraded later without redesign |
| **Responsive shell** | CSS breakpoints for tablet/mobile sidebar drawer | Blueprint requires responsive behaviour; foundation exists |
| **Kulana design tokens** | `src/index.css` `:root` tokens (cyan/mint/teal/aqua, Sora/Inter) | Aligns with blueprint visual direction; reuse and extend |
| **Premium visual direction** | White surfaces, teal hierarchy, restrained gradient usage | Matches “premium institutional intelligence” intent |
| **Module layout patterns** | `ModuleView` header + KPI strip + content | Good skeleton for feature screens once data-driven |
| **Reusable primitives** | `ui.jsx` Tag / DataTable / ItemCards | Starting point for shared enterprise UI |
| **Search overlay UX** | Modal search with keyboard Escape handling | Can become command palette over entity search |
| **Toast / popover patterns** | Lightweight feedback UI | Useful for demo actions and AI review feedback |
| **Overview composition** | Executive band, maturity gauge, signals, domain tiles, journey | Visual language for Executive Cockpit (must become data-driven) |
| **Deploy config** | Vite build + `.openai/hosting.json` static `dist` | Keeps demo hosting path intact |
| **Prototype positioning** | No backend, illustrative-data mindset | Matches blueprint guardrails |

**Preserve principle:** keep shell, tokens, interaction chrome and layout patterns; replace the static content/data layer with a connected enterprise model.

---

## 2. What can be improved in place

These do not require a rewrite; evolve within the current app:

1. **Information architecture** — remap sidebar from capability-accelerator modules to blueprint primary nav (Executive Cockpit → Organisation & Settings).
2. **Overview → Executive Cockpit** — keep layout; bind cards, scores and narratives to derived tenant metrics; make cards clickable into filtered detail views.
3. **Organisation selector** — upgrade from label-only switch to true tenant context that reloads entities, relationships, KPIs and narratives.
4. **Search** — expand from module names to tenant entity search (capabilities, applications, findings, initiatives).
5. **Module screens** — replace static `moduleData` tables/cards with feature views over repositories (findings, recommendations, roadmap, governance, KPIs, report).
6. **CSS system** — promote tokens into a clearer design-system layer (semantic chart colours, states, print styles) without abandoning Kulana CSS.
7. **State** — introduce a single client store (Zustand recommended) for tenant, role, filters, selection and demo-reset; keep React local UI state for overlays.
8. **Charts** — replace decorative CSS donuts/bars with purposeful chart components (Recharts or ECharts) that drill through.
9. **Accessibility** — strengthen focus management, contrast checks, legend text, reduced-motion (already partially present).
10. **TypeScript migration** — gradual `.jsx` → `.tsx` on domain/data first, then features (allowed without leaving Vite).

---

## 3. Weak or legacy-looking experiences

| Experience | Issue relative to blueprint |
|---|---|
| **Product framing** | Still reads as “Capability Accelerator / assessment tool,” not Enterprise Intelligence & Transformation Governance |
| **Tenant switch** | Only changes Overview kicker text; data, charts and tables stay National Digital Bank narrative |
| **Hardcoded KPIs** | Scores (`2.3`, `78%`, `5 critical`) duplicated in Overview, Sidebar and module metrics — not derived |
| **Static tables** | Few illustrative rows; no detail drawers, no object links, no evidence chain |
| **Non-functional actions** | Export / Create show toasts deferring to “next product phase” — violates blueprint rule #8/#9 |
| **Decorative charts** | CSS conic-gradient risk donut and mini-bars lack units, filters, click-through purpose |
| **Nav taxonomy** | Assess / Improve / Govern / Admin groups do not match Understand → Diagnose → Decide → Transform → Measure |
| **Tagline drift** | Topbar says “by Kulana”; blueprint tagline is “Know Your Enterprise. Shape What’s Next.” |
| **Synthetic-data labelling** | No persistent “Synthetic demonstration data” indicator |
| **Role experience** | No role switcher; one undifferentiated demo persona |
| **Report** | Card gallery only; no print/PDF stylesheet or briefing assembly |
| **Empty/loading/error** | Missing progressive states required by blueprint experience rules |

---

## 4. Missing blueprint capabilities

### Navigation / screens (absent or only loosely approximated)

| Blueprint screen | Current equivalent | Gap |
|---|---|---|
| Executive Cockpit | Overview | Partial visual only; no explainable factors, click-through, decision inbox |
| Strategy & Outcomes | None | Missing |
| Capabilities (L1–L3 heatmap) | Domain tiles / assessment cards | Not hierarchical; no heatmap modes / filters / detail panel |
| Application Portfolio | None | Missing TIME, bubble chart, duplicates, obsolescence |
| Integration & APIs | Mentions in tables | No topology / reuse / P2P concentration view |
| Data & Technology | None | Missing |
| Relationship Explorer | None | Missing (React Flow planned) |
| Findings & Risks | Findings table | Incomplete finding model (no evidence links, root cause, linked objects) |
| Recommendations | Recommendation cards | No approve/reject/revise or initiative creation |
| Transformation Roadmap | Roadmap table | No Now/Next/Later, dependencies, scenario filters |
| Governance & Decisions | Reviews / Decisions / Exceptions / Standards | Static; no ARB queue ageing or audit history |
| KPIs & Value | KPIs table | Not derived; no benefit tracking |
| Executive Report | Report cards | No printable briefing |
| Organisation & Settings | Organisation / Settings / Assessment Model | Cosmetic content |

### Global controls missing

- Role selector  
- Period / business-unit filters  
- Decision inbox (beyond empty notifications copy)  
- Help / guided-demo launcher  
- Synthetic-data indicator  
- Demo reset  

### Platform capabilities missing

- Connected enterprise object model + typed relationships  
- Traceability journey (Objective → … → KPI)  
- Deterministic AI service interface (Ask EA360, impact, duplication, briefing)  
- Browser persistence + one-click reset  
- Zod validation of seed data  
- Repository boundary (UI must not import seed packs directly)  
- Vitest / Playwright coverage of the three demo journeys  

---

## 5. Broken or non-functional interactions

| Interaction | Behaviour today | Blueprint requirement |
|---|---|---|
| **Create / Add** | Toast: “ready for next product phase” | Must work or be removed |
| **Export** | Toast: “available in enterprise-enabled phase” | Report/PDF export must work for demo |
| **Org / tenant change** | Cosmetic label only | Full tenant dataset swap |
| **KPI / signal cards** | Not clickable | Open detailed view with filter context |
| **Domain tiles** | Display only | Drill to capability/domain detail |
| **Table rows** | Display only | Open detail panel with linked objects |
| **Recommendation cards** | Display only | Review / approve / reject / revise |
| **Profile → Settings** | Navigates to Settings static page | Acceptable only if Settings is functional |
| **Notifications** | Empty demo message | Decision inbox with actionable items |
| **Search results** | Navigate to module only | Open specific entities where applicable |
| **Hash deep links** | Work for existing module IDs | Must map to new IA routes |

**Risk:** leaving toast-stubbed controls in a customer demo fails Definition of Done (“all buttons work”).

---

## 6. Code-structure and maintainability risks

| Risk | Detail | Impact |
|---|---|---|
| **Monolithic static data** | Almost all content in `src/data.js` as arrays/HTML-like structures | Blocks multi-tenant integrity and derived metrics |
| **View-coupled content** | `ModuleView` renders by `type` flags (`table`, `cards`) not domain features | Hard to add heatmap, graph, workflow |
| **No domain layer** | No entities, schemas, repositories, selectors | Metrics will continue to drift |
| **No TypeScript / Zod** | JS-only; no runtime validation of relationships | Broken IDs will ship silently |
| **CSS megapage** | Single large `index.css` (~1.5k lines) | Token reuse ok, but feature isolation weak |
| **State in App only** | Tenant/view/UI toggles local; no persistence | Demo reset / filters / selection not scalable |
| **No tests** | Zero unit or journey tests | Regression risk as vertical slices land |
| **Blueprint stack mismatch** | Blueprint §13 recommends Next.js/Tailwind/shadcn | **Constrained:** stay on Vite; adopt equivalent architecture patterns without migration |
| **Product naming** | package/README still “capability-accelerator” | Confuses commercial narrative |

**Maintainability verdict:** safe to evolve **if** a domain + repository layer is introduced before more screens are added. Continuing to add static screens on `moduleData` will create irreversible demo debt.

---

## 7. Synthetic-data and tenant-model gaps

### Current tenant behaviour

- Organisations listed: National Digital Bank, GRA, BoG, Development Bank Ghana, Consolidated Bank Ghana, Fidelity Bank Ghana.
- Blueprint tenants: **GRA, BoG, Fidelity Bank Ghana, Generic Enterprise**.
- Extra banks are present but not distinct datasets.
- Switching tenants does **not** change capabilities, applications, findings, recommendations, KPIs or narratives.

### Model gaps vs blueprint §10–11

| Requirement | Status |
|---|---|
| Core entities (19 types) | Absent |
| Common fields (`id`, `tenantId`, `ownerId`, `dataQuality`, …) | Absent |
| Typed `EnterpriseRelationship` | Absent |
| Metrics derived from records | Absent (hardcoded) |
| Seeded, reproducible generation | Absent |
| Startup reference validation | Absent |
| Min volumes per named tenant (e.g. 45–70 capabilities) | Far below (illustrative handful of rows) |
| Ghanaian institutional terminology per story | Partially in copy only; not structured |
| Critical findings always linked to evidence + objects | Not modelled |
| Initiatives linked to objectives/capabilities/recommendations | Not modelled |

### Required data packs (single engine)

```text
src/data/tenants/gra/
src/data/tenants/bog/
src/data/tenants/fidelity-bank/
src/data/tenants/generic/
```

Accessed only via repositories — never imported by feature components.

---

## 8. Recommended reusable component structure

Adapt blueprint §13 structure to **Vite + React** (no `app/` router directory):

```text
src/
  main.jsx
  App.jsx                          # shell only: providers + layout + route map
  components/
    shell/                         # Topbar, Sidebar, AppShell, SyntheticBanner
    ui/                            # buttons, cards, tags, drawers, dialogs, empty states
    charts/                        # KPI spark, heatmap, bubble, topology wrappers
    enterprise/                    # EntityDetailPanel, RelationshipChips, EvidenceList
  features/
    executive/                     # Executive Cockpit
    strategy/
    capabilities/
    applications/
    integrations/
    data-technology/
    explorer/                      # Relationship Explorer (React Flow)
    findings/
    recommendations/
    roadmap/
    governance/
    kpis/
    reports/
    ai-assist/                     # Ask EA360 panel, briefing, impact
  domain/
    entities/
    relationships/
    metrics/                       # pure functions: healthScore, TIME, VaR, etc.
    schemas/                       # Zod
  data/
    tenants/{gra,bog,fidelity-bank,generic}/
    repositories/
    validators/
  state/                           # Zustand stores: tenant, role, filters, selection, demo
  lib/                             # ai adapter interface + deterministic adapter
  styles/                          # tokens.css, base, print.css
  tests/
    unit/
    journeys/
```

**Reuse map from current files**

| Current | Future home |
|---|---|
| `Topbar.jsx` / `Sidebar.jsx` | `components/shell/` |
| `Overview.jsx` | `features/executive/` (refactored) |
| `ModuleView.jsx` | Retire as generic host; replace with feature screens |
| `ui.jsx` | `components/ui/` |
| `SearchOverlay.jsx` | `components/shell/CommandPalette.jsx` |
| `data.js` | Split → domain seeds + retire static `moduleData` |
| `index.css` | Split tokens / shell / features / print |

---

## 9. P0, P1 and P2 backlog

### P0 — Must have for a credible prototype foundation

1. Domain types + Zod schemas + repository interfaces.  
2. GRA reference tenant seed pack at blueprint minimum volumes.  
3. Tenant context store + true tenant switching (no data leakage).  
4. Remapped navigation to blueprint IA; remove dead/stub controls.  
5. Executive Cockpit with **derived** KPIs and click-through.  
6. Findings + Evidence detail with linked objects.  
7. Synthetic-data banner + demo reset (local persistence of prototype mutations).  
8. Kill or implement Export/Create (no toast stubs).  

### P1 — Required for architect / transformation journeys

1. Capability Intelligence (hierarchy + heatmap modes + detail panel).  
2. Application Portfolio (TIME + value/health chart + detail).  
3. Integration & API landscape.  
4. Relationship Explorer (curated graph).  
5. Recommendations workflow → initiative creation.  
6. Transformation Roadmap (Now/Next/Later, dependencies).  
7. Governance & Decisions (ARB queue, decision records).  
8. Role switcher (emphasis only).  
9. Deterministic AI interface: Ask EA360 + insight explain + impact.  
10. Unit tests for metrics + reference validation.  

### P2 — Demo polish and commercial readiness

1. BoG, Fidelity, Generic tenant packs with distinct stories.  
2. Strategy & Outcomes, Data & Technology screens.  
3. Executive Report + print/PDF styles.  
4. Guided demo launcher.  
5. Period / BU filters globally.  
6. Playwright journeys (executive / architect / transformation).  
7. Mobile/tablet intentional layouts for new screens.  
8. Commercial validation capture form (post-demo questions).  
9. Gradual TypeScript conversion of domain + features.  
10. Chart accessibility / keyboard improvements.  

---

## 10. Exact files expected to be created or modified

### Create (expected)

```text
IMPLEMENTATION_STATUS.md                          # living status (created with this assessment)
src/domain/entities/*.ts
src/domain/relationships/types.ts
src/domain/metrics/*.ts
src/domain/schemas/*.ts
src/data/tenants/gra/**/*
src/data/tenants/bog/**/*                         # later phase
src/data/tenants/fidelity-bank/**/*               # later phase
src/data/tenants/generic/**/*                     # later phase
src/data/repositories/*.ts
src/data/validators/validateTenant.ts
src/state/tenantStore.ts
src/state/uiStore.ts
src/state/demoStore.ts
src/lib/ai/types.ts
src/lib/ai/deterministicAdapter.ts
src/components/shell/*
src/components/ui/*
src/components/charts/*
src/components/enterprise/*
src/features/executive/*
src/features/capabilities/*
src/features/applications/*
src/features/integrations/*
src/features/explorer/*
src/features/findings/*
src/features/recommendations/*
src/features/roadmap/*
src/features/governance/*
src/features/reports/*
src/features/ai-assist/*
src/styles/tokens.css
src/styles/print.css
src/tests/**/*
```

### Modify (expected)

```text
package.json                 # add zustand, zod, recharts|echarts, @xyflow/react, vitest, playwright, typescript
vite.config.js               # aliases, test config as needed
index.html                   # title/tagline, fonts retained
src/main.jsx                 # providers
src/App.jsx                  # route map to features; shell wiring
src/index.css                # slim to imports / leftovers or replace with styles/*
src/components/Topbar.jsx    # tenant, role, synthetic banner, reset, command palette
src/components/Sidebar.jsx   # blueprint IA
src/components/Overview.jsx  # migrate into features/executive then delete/redirect
src/components/ModuleView.jsx# retire
src/components/SearchOverlay.jsx # entity command palette
src/components/ui.jsx        # split into components/ui
src/data.js                  # delete after migration
README.txt                   # product positioning update
```

### Do not create

- Separate apps per tenant  
- Next.js project  
- Real API / Supabase / LLM wiring (interfaces only)  
- Placeholder routes  

---

## 11. Phased implementation plan

> Stack note: Blueprint Phase 1 says “Establish Next.js…”. Under current constraints, Phase 1 means **establish the same architecture on Vite + React**, not a framework migration.

### Phase 0 — Alignment (pre-build)

- Approve this gap analysis and stack adaptation (Vite vs Next.js).  
- Freeze tenant list: GRA, BoG, Fidelity, Generic (remove or demote extra banks).  
- Freeze IA labels and role list.

### Phase 1 — Foundation (Vite)

- Domain schemas, repositories, tenant config.  
- Zustand tenant/role/filter/demo state.  
- Shell remapped to blueprint nav; synthetic banner; demo reset.  
- GRA empty-safe shell loads with validated seed.  

**Gate:** Responsive shell; every route loads a real screen; no cross-tenant leakage.

### Phase 2 — GRA reference journey

- Full GRA seed at volume targets.  
- Executive Cockpit, Capability Intelligence, Application Portfolio.  
- Drill-down + filters; metrics reconcile with records.  

**Gate:** Two-minute executive journey works on GRA.

### Phase 3 — Intelligence and governance

- Integration landscape, Relationship Explorer.  
- Findings, Evidence, Recommendations, Decisions, Roadmap workflow.  

**Gate:** Trace dependency → finding → recommendation → initiative.

### Phase 4 — Selective AI (deterministic)

- Ask EA360, explanations, impact analysis, briefing.  
- Evidence, confidence, human review states.  

**Gate:** No unsupported entities in AI outputs.

### Phase 5 — Additional tenants

- BoG, Fidelity, Generic packs; terminology and story differentiation.  

**Gate:** Each tenant tells a materially different story on one engine.

### Phase 6 — Demo readiness

- Report/print, guided tour, polish, Playwright journeys, mobile QA.  

**Gate:** Fifteen-minute demo with no stubs, no broken controls.

---

## 12. Acceptance criteria for each phase

### Phase 0

- [ ] Gap analysis approved in writing.  
- [ ] Confirmed: stay on Vite; no Next.js migration.  
- [ ] Tenant set and IA approved.

### Phase 1

- [ ] Zod validates GRA seed at startup (dev fail-visible on broken refs).  
- [ ] Switching tenant clears selection and loads only that tenant’s IDs.  
- [ ] All nav items open non-placeholder screens.  
- [ ] No Export/Create toast stubs remain.  
- [ ] Synthetic-data indicator always visible.  
- [ ] Demo reset restores seed.  
- [ ] Desktop + mobile shell verified.

### Phase 2

- [ ] Health score and KPIs match underlying GRA calculations.  
- [ ] KPI card click opens correct filtered detail.  
- [ ] Capability heatmap supports ≥2 modes with detail panel.  
- [ ] Application TIME view present with detail links.  
- [ ] Executive 2-minute path completable without coaching workarounds.

### Phase 3

- [ ] User can select Application → see APIs/data/tech via explorer or panels.  
- [ ] Finding shows evidence + linked objects + owner/date.  
- [ ] Recommendation approve creates initiative with pre-populated fields.  
- [ ] Roadmap shows initiative with value/risk/dependency fields.

### Phase 4

- [ ] Ask EA360 answers only from active tenant.  
- [ ] Every AI result shows evidence, objects, assumptions, confidence, review state.  
- [ ] Impact analysis highlights real relationships only.

### Phase 5

- [ ] GRA ≠ BoG ≠ Fidelity ≠ Generic on findings, apps, narratives, KPIs.  
- [ ] Same components render all tenants without forks.

### Phase 6

- [ ] Executive report prints cleanly.  
- [ ] Three blueprint journeys covered by automated tests.  
- [ ] No lorem, decorative charts, or non-functional controls.  
- [ ] Definition of Done (§17) checklist signed off.

---

## 13. Is continuing with this codebase unsafe or inefficient?

### Verdict: **Safe and efficient to continue — with conditions.**

**Not unsafe.** The repository is a small, working Vite React SPA with a modern Kulana visual shell, responsive navigation and deployable static output. There is no toxic architecture lock-in that forces a rewrite.

**Not inefficient — if** implementation immediately introduces:

1. Domain model + repositories before more static screens.  
2. True multi-tenant seed packs (starting with GRA).  
3. Derived metrics and removal of stubbed controls.  
4. Feature-based folder structure on Vite (blueprint patterns without Next.js).

**Would become inefficient if** the team:

- Keeps extending `moduleData` static pages.  
- Forks UI per tenant.  
- Migrates to Next.js mid-flight despite the working Vite base (duplicate cost, no prototype benefit).  
- Adds decorative charts without drill-through.

**Recommendation:** Treat the current app as the **presentation chassis**. Rebuild the **product engine** (domain, data, metrics, workflows, AI adapter) underneath it in phases 1–3. Preserve shell, tokens and interaction patterns. Do not greenfield.

---

## Decisions required before coding (approval gate)

1. Confirm Vite-first adaptation of blueprint §13 (reject Next.js migration for this prototype).  
2. Confirm tenant set: GRA, BoG, Fidelity, Generic only (drop or fold extra bank entries).  
3. Confirm chart stack preference: Recharts vs Apache ECharts; React Flow for explorer.  
4. Confirm TypeScript now (phase 1) vs gradual after GRA JS vertical slice.  
5. Approve P0 scope and Phase 1 start.

---

*End of gap analysis. No application code was modified in this assessment.*
