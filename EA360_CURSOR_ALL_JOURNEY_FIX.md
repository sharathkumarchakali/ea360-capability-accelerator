# EA360 — Fix All Guided Demo Journeys in Cursor

**Priority:** P0 — complete before the next prospect demonstration  
**Repository:** `https://github.com/sharathkumarchakali/ea360-capability-accelerator`  
**Inspected main commit:** `b3790ceb83aac329bb6ce3d21f37f0b61b953937`  
**Observed failure:** `Expected area (“entity-detail”) did not appear. Retry or use Step details.`  
**Affected example:** J4 — `Open the data domain`

## 1. Objective

Make all eight guided journeys and both playlists complete reliably without target errors, incorrect drawers, unsolicited Ask EA360 panels, stale tenant context or broken Next/Back/Retry behaviour.

Do not patch only the reported J4 step. Fix the shared journey runtime and verify J1–J8 end to end.

## 2. Confirmed root cause

The journey runtime in `src/features/demo/GuidedDemoBar.jsx`:

1. applies the route and selection;
2. waits a fixed 120 ms;
3. polls a CSS selector for 2.5 seconds;
4. reports a failed step when the visual highlight target is absent.

The global detail surface in `src/components/enterprise/EntityDrawer.jsx` renders selected entities, including data objects, but its rendered dialog has no `data-demo-target="entity-detail"` marker or selected-entity identity attributes.

This creates a false journey failure: the correct route and record may be selected, while the runner cannot find the expected DOM target.

There are two broader defects:

- business readiness and cosmetic highlighting are treated as the same condition;
- lazy rendering, route changes, store selection and drawer mounting are coordinated using timing rather than an explicit readiness contract.

## 3. Required implementation

### FIX-J01 — Repair the entity-detail contract

Update `src/components/enterprise/EntityDrawer.jsx`.

On the visible drawer element, add stable journey metadata:

```jsx
<aside
  className="entity-drawer"
  data-demo-target="entity-detail"
  data-demo-entity-id={selected.id}
  data-demo-entity-type={selected.type}
  aria-busy={false}
>
```

Use the actual component variables. Keep existing dialog semantics and close behaviour.

The marker must exist only while a valid detail is rendered. If the selected record cannot be resolved, show an honest missing-record state and clear/block the selection; do not render an empty target that makes the journey appear successful.

This must work for every entity type opened by a journey: capability, application, integration, data object, technology, AI solution/agent, finding, evidence, recommendation, decision, initiative and KPI.

### FIX-J02 — Replace timing-based target polling with step readiness

Refactor `src/features/demo/GuidedDemoBar.jsx`. Prefer a small helper such as:

```text
src/features/demo/waitForDemoStepReady.ts
```

The readiness result must distinguish:

```ts
type StepReadiness = {
  routeReady: boolean
  selectionReady: boolean
  targetReady: boolean
  target?: HTMLElement
  blockingReason?: 'route' | 'selection' | 'missing-record'
  highlightWarning?: 'missing-target' | 'hidden-target'
}
```

Required sequence:

1. Create a unique step-execution ID and abort the previous execution.
2. Resolve journey bindings and run-slot values.
3. Apply route, filters, graph context, screen state and selection.
4. Wait until the store reports the expected route.
5. When the step selects an entity, wait until selected ID and type match.
6. Wait until the appropriate rendered element is connected and visible.
7. For `entity-detail`, also match `data-demo-entity-id` and `data-demo-entity-type`.
8. Highlight and scroll only after readiness succeeds.
9. Ignore all results from an aborted or superseded execution.

Use a `MutationObserver` plus store-state checks or an equivalent deterministic mechanism. A bounded timeout is still required for recovery, but do not use a fixed sleep as the synchronization contract. Allow approximately six seconds for lazy route mounting and fail earlier when an authoritative missing-record condition is known.

### FIX-J03 — Separate blocking readiness from highlighting

A missing cosmetic highlight must not falsely state that the product action failed.

Blocking failures:

- invalid/unavailable route;
- unresolved mandatory run slot;
- selected entity does not exist in the active workspace;
- selected entity belongs to another tenant;
- required human completion predicate remains false.

Non-blocking presentation warnings:

- optional highlight target missing after route and record are confirmed;
- target exists but cannot be scrolled/highlighted;
- smooth scrolling is unavailable.

When business state is ready but highlighting is unavailable:

- keep Next available;
- show a subtle `Focus highlight unavailable` note only in Step details;
- do not show the primary error `Expected area did not appear`;
- log a development warning with journey ID, step ID, route and target.

Do not silently allow a missing record or wrong tenant.

### FIX-J04 — Make target contracts explicit

Update `src/features/demo/journeyDefinitions.ts`:

```ts
type DemoTarget = {
  name: string
  entity?: EntityBinding
  requiredForReadiness?: boolean
  highlight?: boolean
}
```

Defaults:

- route/view target: required;
- selected entity existence: required;
- visual highlight: optional unless the step explicitly demonstrates that control;
- `entity-detail`: required when the step promises that a record opens.

Ensure selection steps such as J4.2 declare `entity-detail` when the expected result says the record/domain opens. Do the same for every J1–J8 step whose instruction says `open`, `show detail` or `selected record`.

Do not change targets to `view-root` merely to suppress errors. The target must represent the audience-facing area described by the step.

### FIX-J05 — Audit every declared target

Audit `DEMO_TARGET_SELECTORS` against rendered components.

| Target | Expected owner |
|---|---|
| `executive-health` | Executive Cockpit |
| `findings-register` | Findings & Risks |
| `capability-heatmap` | Capabilities |
| `recommendations-list` | Recommendations |
| `roadmap-board` | Roadmap |
| `governance-decisions` | Decision Register/Governance |
| `evidence-panel` | Evidence |
| `relationship-explorer` | Relationship Explorer |
| `entity-detail` | Global EntityDrawer and explorer detail |
| `application-portfolio` | Applications root/table |
| `integration-topology` | Integrations root/topology/table |
| `architecture-health` | Architecture Health |
| `standards-register` | Standards & Principles |
| `review-board` | Review Board |
| `kpi-register` | KPIs |
| `demo-studio` | Demo Studio |
| `onboarding-wizard` | Customer Onboarding |
| `data-ingestion-center` | Data Ingestion |
| `workspace-settings` | Workspace Settings |
| `view-root` | Visible current route root |

Replace fallback implementation-class selectors such as `.portfolio-table-desktop` with explicit `data-demo-target` markers. Journey contracts must not depend on styling class names.

When duplicate markers exist, resolve within the active visible route and choose the visible element. Never highlight a hidden mobile/desktop duplicate.

### FIX-J06 — Preserve non-interrupting Ask

`applyDemoStep.js` already states navigation must not open Ask. Preserve and verify it.

- Next, Back, Retry and step jump never open Ask.
- They never submit a question or append history.
- Ask/Explain/Draft/Generate runs only from an explicit button.
- Closing Ask remains respected after later navigation and delayed work.
- A stale response cannot change route, selection, tenant or panel state.

Journey definitions still contain `executeOnEnter: true`. Treat these as legacy offer metadata or migrate them to explicit offers. They must not restore automatic execution.

### FIX-J07 — Fix panel lifecycle

Before a new step:

- close the previous transient detail unless the next step intentionally selects a record;
- close Step details and More;
- preserve the user's explicit Ask closed state;
- remove the old highlight;
- cancel the old readiness observer;
- never stack EntityDrawer, Ask and briefing/report automatically.

For report, briefing and route-only steps, clear irrelevant selection. For detail steps, selection must match the bound entity before readiness.

### FIX-J08 — Make Retry real

Retry must:

- increment an execution nonce;
- abort the previous observer/work;
- reapply route, filters, screen state, graph context and selection;
- rerun readiness even when the step index is unchanged;
- never reset the full workspace;
- never open Ask.

If retry still fails, show the exact blocking reason and recovery action. Do not use one generic target message for every failure.

## 4. Journey acceptance matrix

Run each journey from a clean prepared baseline.

| Journey | Mandatory verification |
|---|---|
| J1 Executive | Cockpit → finding detail → capability → recommendation → decision → roadmap → explicit briefing → report. No drawer covers report. |
| J2 Rationalisation | Health → capability → application detail → comparison/dependencies → recommendation/roadmap. Correct application remains selected. |
| J3 Integration resilience | Register → topology/graph → finding/evidence → decision → initiative/KPI. Edges and root remain visible. |
| J4 Data trust | Data portfolio → **data-domain detail** → lineage → AI readiness → data governance. J4.2 must not show `entity-detail` error. |
| J5 Technology | Technology detail → impact → lifecycle/resilience finding → exception/delivery. As-of date stays consistent. |
| J6 Governed AI | Agent detail → permissions/guardrails → evidence → reviewable draft → human approval boundary. No automatic Ask. |
| J7 Transformation | Finding/evidence → saved draft → human review/decision → initiative → KPI/audit. Retry creates no duplicate writes. |
| J8 Onboarding | Profile → starter/manual path → staging → validation → commit → readiness → export/isolation. Human steps gate honestly. |

Run both playlists. A playlist transition must not reuse a highlight, selection or binding from the prior segment.

## 5. Tenant coverage

Run full J1–J8 coverage on GRA where supported. Then run:

- BoG: J1, J3, J4, J6 and both playlists where marked Ready;
- Fidelity: J1, J2, J3 and a governance/AI path where marked Ready;
- Generic/prospect workspace: J8 and the first journey advertised by readiness.

If a tenant lacks a binding, Demo Studio must show `Unavailable` or `Needs setup` before Start. Never borrow GRA data to make another tenant pass.

## 6. Automated and browser checks

Add focused coverage using the existing Vitest setup.

1. Every J1–J8 step resolves to an implemented route.
2. Every target name is registered.
3. Each target owner renders its explicit marker.
4. EntityDrawer exposes selected ID/type and `entity-detail`.
5. Readiness waits for delayed lazy mount.
6. Readiness rejects wrong ID, wrong type, wrong tenant and missing record.
7. Missing optional highlight does not block Next.
8. Missing mandatory route/record blocks Next.
9. Retry re-executes and cancels stale work.
10. Rapid Next/Back cannot apply an earlier result.
11. Next/Back/Retry never open Ask or generate a response.
12. Playlist transition clears old target/selection.

Browser smoke checks:

- 1440×900 and 1280×800 for all journeys;
- 1024×768 for the compact guided bar;
- 390 px for navigation, Next/Back/More and drawers;
- refresh/deep link under `/app/`;
- no console errors;
- no `Expected area ... did not appear` message in a valid prepared journey.

## 7. Implementation order

1. Reproduce J4.2 and record the current main SHA.
2. Add the EntityDrawer target/identity contract.
3. Implement deterministic, abortable readiness.
4. Separate blocking readiness from highlighting.
5. Audit all markers and remove styling-class fallbacks.
6. Correct J1–J8 target declarations.
7. Add focused regression coverage.
8. Run all journeys and playlists.
9. Run tenant validation, tests and production build.
10. Produce the validation report; do not deploy or push automatically.

```bash
git status
git switch main
git pull --ff-only origin main
git switch -c fix/all-demo-journeys
npm ci
npm run validate:tenants
npm test
npm run build
```

## 8. Required handoff

Create or update:

- `DEMO_FIX_VALIDATION.md` — each journey/step, tenant, viewport and result;
- `DEMO_RUNBOOK.md` — preparation, 15-minute sequence, recovery and reset;
- journey target/readiness tests;
- concise changed-file summary.

Report separately: Implemented, automated checks passed, browser verified, not verified and remaining prototype limitations.

Do not claim all journeys are fixed from a successful build alone.

## 9. Copy-paste Cursor prompt

```text
Fix all EA360 guided demo journeys using EA360_CURSOR_ALL_JOURNEY_FIX.md.

Read the entire file and inspect the current branch before editing. Reproduce the
reported J4 “Open the data domain” failure first:
Expected area (“entity-detail”) did not appear.

The inspected source shows a concrete contract gap: EntityDrawer renders selected
records but does not expose the stable entity-detail demo target/selected ID/type.
GuidedDemoBar also mixes business readiness with cosmetic highlighting and coordinates
lazy rendering using a short fixed delay/poll.

Implement the shared fix, not a J4-only workaround:
- add entity-detail and selected entity identity to EntityDrawer;
- create deterministic, abortable readiness for route, selection and visible target;
- distinguish blocking route/record failures from non-blocking highlight warnings;
- audit every DEMO_TARGET_SELECTORS entry and use explicit data-demo-target markers;
- remove dependencies on styling classes such as .portfolio-table-desktop;
- correct target declarations across J1–J8;
- ensure Retry truly re-executes the current step;
- preserve that Next/Back/Retry never open Ask or run a question;
- prevent stale observers/results across navigation, tenant changes and playlists.

Run every J1–J8 journey and both playlists using the acceptance matrix. Verify GRA
fully and the specified BoG, Fidelity and prospect paths. Add focused regression
coverage, run validate:tenants, tests and build, and perform browser checks.

Deliver code plus DEMO_FIX_VALIDATION.md and updated DEMO_RUNBOOK.md. Do not deploy,
push, hide failures with view-root, remove meaningful tests, hardcode tenant records
or claim completion from build success alone. Continue until all supported prepared
journeys complete without target errors, or explain an exact remaining blocker.
```

