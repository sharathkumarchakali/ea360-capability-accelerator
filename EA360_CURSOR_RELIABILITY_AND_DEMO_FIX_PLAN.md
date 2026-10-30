# EA360 — Cursor Reliability, Product and Demo Improvement Plan

**Owner:** Sharath Kumar Chakali / Kulana  
**Prepared:** 29 October 2026  
**Live prototype reviewed:** https://ea360.netlify.app/  
**Source repository:** https://github.com/sharathkumarchakali/ea360-capability-accelerator  
**Purpose:** Fix demonstrated failures, make the product internally consistent, and prepare a dependable prospect presentation.

**Updated user direction — 29 October 2026:** Repeated Ask EA360 opening on Next is interrupting the demonstration. The supplied screenshot also shows a crowded, stretched tour toolbar. Implement FIX-00 first. Ask is user-initiated throughout the demo; this supersedes any earlier instruction to auto-open or auto-generate Ask on step entry.

**Visual direction update — 29 October 2026:** The user considers the current application look and feel too legacy. Implement DESIGN-01 as a coherent modern workspace refresh, beginning with the supplied governance screen and carrying the design system through the product. Small colour/button adjustments alone do not meet this requirement. Retain FIX-00's uninterrupted journey and on-demand Ask behaviour.

## 1. Cursor: start here

Implement this plan in the existing EA360 application. Inspect the current checkout and live behaviour before editing. Do not scaffold a replacement or restart the earlier build programme.

The live application already exposes eight journeys, Demo Studio, onboarding, ingestion, portfolio views, governance and reports. Preserve these features. This is a focused improvement release with reliability fixes first, followed by presentation and product improvements.

The release principle is:

> One enterprise record must tell the same story in its portfolio, graph, Ask answer, governance workflow and executive report.

Use this document as the primary remediation specification. If `EA360_CURSOR_JOURNEYS_AND_ASK_AI.md` is present, retain its journey/question coverage as the broader functional contract. Do not reimplement working features merely because that older plan described them as missing. If instructions differ, preserve working functionality and use this document for the reviewed defects and their acceptance gates.

In particular, retain the earlier plan's contextual questions and answer quality requirements, but replace its automatic assistant-opening/generation behaviour with the explicit on-demand policy in FIX-00. Do not keep both behaviours behind competing defaults.

**Execution:** Inspect → reproduce → fix → add targeted regression coverage → verify in the browser → document results. Complete phases A–E in order, continuing after each gate passes. Do not stop at a plan or declare completion from a successful build alone.

**Scope boundaries:**

- Retain React/Vite, the existing repository, working routes, domain validation and tenant isolation.
- Keep Ask EA360 functional through the local deterministic engine. An external LLM, backend or API key is not required for this release.
- Keep approved local Kulana brand assets and clearly identified synthetic data.
- Preserve existing user-created workspaces and accepted imports. Do not reset local data globally to conceal a defect.
- Human users record approvals. AI responses, feedback acceptance and generated drafts never approve a change or execute agent permissions.
- Do not publish, deploy, change hosting/access controls or modify the production site as part of this task. Deliver reviewable changes and verification evidence.

## 2. Review evidence and its limits

This plan is based on direct browser interaction with the live site on 29 October 2026. The review included the GRA executive journey through its report step, Ask queries and follow-ups, GRA agent details, switching to BoG, the BoG RTGS graph, creating a browser-local synthetic prospect from the Central Bank starter, and staging/validating an applications CSV with errors.

The review did not establish the deployment commit, audit every route, complete all eight journeys, test all workflow mutations, verify refresh persistence or inspect printed PDF output. Treat architectural root causes below as implementation hypotheses until the current source and reproduction confirm them. Do not claim that an untested function is absent or broken.

The synthetic workspace named `EA360 Review Demo` was a local review example. Use isolated disposable fixtures for automated/browser tests; do not assume this workspace exists for other users or delete their workspaces.

### Priority summary

| ID | Priority | Reviewed issue / requirement |
| --- | --- | --- |
| FIX-00 | P0 | Next repeatedly opens Ask and interrupts the demo; replace the crowded toolbar with compact presentation controls. |
| DESIGN-01 | P1 | Replace the legacy application composition with a modern, restrained workspace design across the shell and demo screens. |
| FIX-01 | P0 | Explicit contextual Ask requests must wait for valid selected-record context. |
| FIX-02 | P0 | AI agent explanation disagreed with detail fields and lost the meaning of a follow-up. |
| FIX-03 | P0 | Agent approval-authority question returned unrelated decisions. |
| FIX-04 | P0 | Old initiative drawer obscured subsequent briefing/report steps. |
| FIX-05 | P0 | BoG graph connections were not readable in the inspected view. |
| FIX-06 | P0 | Counts, lifecycle labels and workflow labels differed across surfaces without a clear scope explanation. |
| FIX-07 | P1 | Typed questions, including an advertised prompt, failed while question chips worked. |
| FIX-08 | P1 | Active BoG/prospect assistant fallback still referred to GRA records. |
| FIX-09 | P1 | Executive report contained blank derived fields and unitless KPI rows. |
| FIX-10 | P1 | Executive scenario, cockpit highlights and delivery action were not one coherent story. |
| FIX-11 | P1 | Demo setup, preparation and reset semantics need explicit validation. |
| IMP-01–07 | P2 | Presentation, navigation, branding, landing page, onboarding and ingestion improvements. |

P0 means fix before an unscripted prospect demonstration. P1 means fix before presenting the affected feature. P2 improvements follow once the affected reliability gates pass.

## 3. Detailed fixes

### FIX-00 — Make Next uninterrupted and redesign the tour toolbar

**User-reported behaviour:** Clicking Next repeatedly opens Ask EA360 and interrupts the product walkthrough. The attached screenshot shows a full-width pale-teal bar with four competing groups: journey pill/progress, step title, two lines labelled `Business question` / `Expect to see`, and six always-visible buttons: Back, Next, Retry, Skip, Restart journey and Exit. The screenshot itself establishes the toolbar layout; repeated assistant opening is the user's report and was also observed at multiple AI-enabled steps in the earlier live review.

#### A. Interaction policy — mandatory

**Next advances the product journey. It does not launch an assistant conversation.**

| User action | Expected behaviour |
| --- | --- |
| Start journey | Show the first product screen and compact progress toolbar. Ask stays closed. |
| Next / Back / jump to step | Navigate, apply the correct scenario/filter/selection and highlight the relevant content. Close the previous temporary overlay; do not open Ask, generate an answer or append chat history. |
| Retry step | Reapply route/context/highlight or recover the failed screen. Do not reopen Ask or repeat an AI request. A failed Ask response has its own explicit retry control inside Ask. |
| Click the global Ask EA360 button | Open Ask with current validated workspace/record context; wait for a question or an explicit suggested-question click. |
| Click Explain / Ask about this / Draft recommendation | Explicitly open Ask and run only the requested read-only generation against the resolved subject. Saving/submitting still requires its existing human action. |
| Enter an AI-focused step | Show the relevant product record and an inline `Ask about this agent` / `Explain this risk` action. Opening it is the presenter's choice. |
| Enter a briefing/report step | Show the report or a non-modal briefing placeholder/preview with `Generate briefing`. Generate only when clicked; never open a drawer just because Next was pressed. |
| Close Ask, then Next | Ask remains closed. An effect, old command or late response must not reopen it. |
| Finish / Exit | Leave a clean product screen or completion summary; no unsolicited assistant panel. |

This applies to all eight journeys and both playlists. Do not make routine navigation depend on opening AI at every step. Where a dedicated AI demonstration is required for completion, let the presenter explicitly run it and evaluate that action's predicate; optional AI questions never block ordinary navigation. Skipped required actions remain honestly incomplete under the existing completion rules.

Preserve assistant availability and all its useful responses, evidence links, drafts and briefings. The change is who decides when it opens. Do not merely shrink, delay, hide via CSS or silently regenerate the same automatic panel. No automatic query should run in the background on every Next either.

#### B. Implementation boundary

- Inspect the step runner, step schemas, `applyDemoStep`, effects and Ask/briefing state actions for `openAsk`, `openBriefing`, `executeOnEnter`, `autoExecute`, `setAskOpen(true)` or equivalent. These are inspection targets, not proof of current names.
- Separate `applyStepContext` from `openAssistant` / `submitAssistantQuestion`. Navigation prepares context; only a deliberate user action dispatches an assistant command.
- Migrate old journey configurations so previously stored auto-open flags cannot revive this behaviour. Preserve supported questions as offered actions instead.
- Keep selected-record context independent of modal visibility. Selecting a subject does not imply an open entity drawer or Ask overlay.
- Use inline detail/highlighting for ordinary steps. Open a modal detail only when explicitly requested; avoid automatically piling a detail drawer behind an assistant panel.
- Cancel pending open/submit commands when navigating, closing the panel, exiting or switching workspace. A late result may update its originating stored answer if appropriate, but cannot reopen a panel or switch the user's current screen.
- Avoid an `askOpen`/selected-entity effect that interprets a new selection as permission to open the assistant.
- If a current version already has a user-selected presentation setting, use `Manual / on demand` as the default and respect the user's explicit close. Do not introduce a new auto-open option as necessary scope for this fix.

#### C. Toolbar layout — replace the screenshot's bar

Build one compact, neutral sticky bar inside the main content column, aligned with the product page. Keep it below the existing app header without covering page titles, graph controls or dialogs. Account for its actual height using layout flow or a reserved offset.

| Region | Desktop content | Visual treatment |
| --- | --- | --- |
| Journey / progress | Short journey name, `6 of 9`, small progress indicator | Secondary text with a subtle accent; no dominant long pill. |
| Current step | `Decision awaiting authority` | One readable title, limited wrapping/ellipsis with full accessible text. |
| Primary navigation | Back, Next | Next is the only prominent filled primary action; Back is secondary. |
| Secondary controls | More menu | Step details, Restart walkthrough, optional Skip and End demo; Retry appears when a recoverable error exists. |

Use a target height of approximately 56–72 px at desktop widths where the content fits. Use a white/neutral surface, a light divider and restrained teal accents. Keep spacing and button heights consistent with the app. Avoid large blank gaps on wide screens and cramped multi-column copy on tablet.

Move the full `Business question`, `Expect to see` and presenter instructions into optional `Step details` / `Presenter notes`. They are collapsed by default and do not auto-expand on Next. Provide a single short audience-facing caption only where it adds necessary context. Presenter notes remain hidden in presentation mode unless deliberately shown in a suitable separate presenter surface.

On tablet, allow two purposeful rows, targeting roughly 96–112 px rather than horizontal overflow. On mobile, preserve the current step/count and Back/Next; put nonessential labels/controls under More. Use accessible names for icon-only controls, adequate hit areas, visible focus and an actual progress indicator. Do not shrink labels into unreadable text to force one row.

Do not show Retry as a normal sixth navigation control on every successful step. Restart and End demo must remain discoverable through More; confirm before any action that discards local changes. Use the existing distinction between restarting navigation and restoring a data baseline.

**Acceptance:** In all eight journeys and both playlists, pressing Next/Back/Retry never opens Ask or runs an AI question. Explicit Ask/Explain/Draft/Generate controls still work with correct context. Closing Ask is respected through later navigation and delayed work. The toolbar is visually checked at approximately 1908 px (the supplied screenshot width), 1440, 1280, 1024, 768 and 390 px: no overlap, horizontal page scroll, clipped primary controls or expanded instruction block. Default successful state prominently exposes only Back and Next plus a compact More control. No application code change is considered verified merely by updating this document.

### FIX-01 — Wait for valid context when the user requests Ask

**Observed reproduction:**

1. Open `/app/`, choose GRA and Start Executive Demo.
2. Move through the Studio/cockpit steps to step 3, `Open the material risk`.
3. The finding `Duplicate point-to-point identity lookups` visibly opens. Ask displays context `finding find-gra-02`.
4. The automatically generated answer nevertheless says `Select a finding (or name one in the question) to continue.`
5. Clicking `Explain this finding.` again returns an explanation of the correct record.

**Required implementation:**

- Inspect the sequencing between navigation, store updates, component mounting, selection and request construction. Do not assume a fixed delay solves the issue.
- Resolve the step's canonical workspace, subject and screen state into one immutable execution context.
- Apply the route/tab/filter state and selected record, then confirm the expected state before offering contextual Ask actions. Issue an Ask command only after the user explicitly chooses one, per FIX-00.
- Build the request from that resolved context; avoid a captured stale React/store value.
- Associate work with a run ID, step execution ID, workspace ID and dataset revision. Discard superseded results after rapid navigation or a workspace switch.
- Disable Next while required state is preparing, or clearly block advancement until a validated readiness predicate passes. Retry must execute even when the step index is unchanged.
- Do not mark a required AI demonstration complete when its explicitly requested contextual answer is insufficient-evidence solely because its context was lost. Optional Ask use is not a navigation prerequisite.

**Acceptance:** On fresh load, repeated run and intentionally delayed lazy mount, the finding step keeps Ask closed. One explicit click on `Explain this finding` explains `find-gra-02` without another selection/click. Step Retry remains navigation-only. Rapid Next/Back cannot attach an answer to the wrong step or workspace or reopen a closed panel.

### FIX-02 — Use accurate agent fields and meaningful follow-ups

**Observed reproduction:**

1. GRA → AI & Automation → Fraud Investigation Agent.
2. Detail shows business owner `Compliance Operations Director`, technical owner `Assurance Architect`, AI owner `AI Enablement Lead`, approval requirement `Every Action`, human role `Fraud Analyst` and escalation owner `Fraud Operations Manager`.
3. Ask `What can this agent do, and which controls are missing?` correctly describes four permissions, two WRITE/EXECUTE permissions and four missing/partial guardrails.
4. Click `Why?`.
5. Ask returns a general explanation with `Owner: person-chief-architect` and `Human oversight: unknown`, despite the fields above being present.

**Required implementation:**

- Create/reuse a normalized AI solution view model consumed by the detail panel, governance, Ask and reporting. Inspect the actual schema field names.
- Keep business owner, technical owner, AI owner and architecture owner distinct. Do not substitute a generic `ownerId` for every business ownership question.
- Normalize human oversight type, human role, escalation owner, override availability, autonomy, tool permissions and guardrail states.
- Use the same person/role display-name resolver across screens. Preserve IDs internally but avoid displaying IDs as the main human-readable answer.
- `Why?` must explain the preceding conclusion. After a control-gap answer, explain which recorded permissions and partial controls justify the concern and what remains uncertain. A general overview should be a separate action.
- A missing field must be reported as unknown only after checking its authoritative normalized source. Never fill it from unrelated records.
- If two source fields truly conflict, disclose the conflict and recommend review instead of picking whichever field produces a smoother answer.

**Acceptance:** The agent's names, owner roles, oversight and permissions agree across detail, Ask, governance and exports. Follow-up retains the same agent and explains the prior answer. Include a fixture with genuinely missing oversight to verify honest unknown handling.

### FIX-03 — Resolve approval authority for the selected subject

**Observed reproduction:** With Fraud Investigation Agent selected, asking `Who can approve this agent?` returned authority information for pending identity-access, taxpayer-system-of-record and revenue-assurance decisions. These did not establish the approval authority for this agent.

**Required implementation:**

- Distinguish approval information from a request to execute an approval.
- Resolve authority through the selected record's real approval/decision links and the active workspace's applicable approval catalogue.
- Distinguish approval authority from operational human oversight. `Fraud Analyst` approving each action does not automatically mean that role can approve production deployment.
- If no deployment approval authority is linked, answer: `No production approval authority is recorded for this agent.` Offer the relevant governance review, not unrelated decisions.
- Workspace-wide pending decisions belong in an explicitly workspace-wide answer.
- Guardrails run before explicit-intent dispatch. Chips cannot bypass the human-approval boundary or workspace validation.
- Suggested actions must carry the exact valid subject and selected approval/decision ID when one exists.

**Acceptance:** Test linked approval, no linked approval, multiple applicable approvals, informational `Who can approve this?`, recorded `Which items are approved?`, and execution `Approve this agent for production`. The execution request makes no workflow, lifecycle, permission or initiative changes.

### FIX-04 — Control drawer, assistant and journey layout together

**Observed reproduction:** In the GRA executive journey, the initiative drawer for `API-led integration wave 1` remained open after advancing to Executive briefing and Report and print. On the report step it obscured the report and configuration. Narrow cards inside it split `Chief Architect` and dates awkwardly.

**Required implementation:**

- Give each journey step an explicit main-screen/inline-detail state and a separate user-controlled panel state. Ask and modal details open through deliberate actions under FIX-00; a step's Ask/briefing suggestion is not an auto-open command.
- Close obsolete entity details before entering a new full-page destination. Preserve entity context separately when needed by Ask.
- Avoid stacking two modal backdrops/drawers that hide each other's primary action. Prefer one side panel with controlled modes or an explicit switch/back action.
- Opening a source from Ask must reveal the source, with a clear way back to the answer.
- Render initiative detail in usable tabs/sections instead of a very long wall of small cards. Maintain minimum widths and natural word/date wrapping.
- Close/focus/Escape semantics must be predictable and accessible.

**Acceptance:** Run executive steps 3–9 forward and backward. Only the intended panel is open. Report/print controls are reachable. Source inspection and return work. No obsolete panel blocks Finish. Check at 1440×900, 1280×800 and 1024×768.

### FIX-05 — Make relationship paths visible and impact understandable

**Observed reproduction:** BoG → Relationship Explorer → Payment-System Resilience / RTGS Core. Capability, application, integration and technology nodes were visible, but their connecting paths were not readable in the inspected screenshots. Fit view did not make the relationships apparent. Impact summary reported seven affected objects while the visible initial graph showed a smaller neighbourhood.

**Required implementation:**

- Reproduce before attributing a cause. Inspect edge path generation, node/handle positions, dimensions, SVG styles, opacity, z-order, clipping, viewport and vendor CSS overrides.
- Repair actual rendering/visibility; do not replace the graph with static screenshot imagery or merely change a count.
- Give edges readable contrast, direction/meaning and useful labels. An audience should be able to follow a path on a shared screen without hovering.
- Frame the selected root and relevant neighbourhood on entry, avoiding excess empty canvas. Preserve deliberate user pan/zoom until a new root/scenario is selected.
- Explain graph scope: `Showing X of Y affected objects`, with `Show all affected` / list access when impact extends beyond the displayed depth or filters.
- Separate `depends on` from `affected if unavailable`. Do not treat every bidirectional graph neighbour as downstream business exposure.
- In the inspected BoG view, the side panel initially said `Evidence and recommendations: None linked`, yet `Open linked recommendation` navigated to a recommendation. Reconcile the selector/scope, or explain the difference between direct and indirect links.
- Retain list view and keyboard-accessible alternatives; do not rely on colour alone.

**Acceptance:** Nodes and connecting paths are visibly readable after initial mount, Fit view, depth/filter changes, impact analysis, workspace switch and viewport changes. BoG RTGS and GRA payment/agent roots have correct semantic paths. The affected list reconciles with the displayed impact scope.

### FIX-06 — Reconcile counts and lifecycle/workflow states

**Observed:** GRA cockpit/report showed 10 open findings, while the Findings register showed 13. The same identity finding appeared as Open in the register and Accepted in Ask/report. The cockpit's `Decisions requiring attention` value was 10 while Ask listed three pending decisions; different meanings may be intended, but the scope was not clear. A recommendation displayed `completed` while its initiative remained at 5% completion.

**Required implementation:**

- Trace each metric and status to its source field, selectors, filters and inclusion rules. Do not make the UI agree by hardcoding the observed numbers.
- Define shared selectors for findings by workflow state, open/active risk, pending/deferred decisions, recommendations awaiting review, approved work awaiting delivery and initiative progress.
- Where Draft findings are intentionally excluded from executive exposure, show an explicit label such as `10 reviewed/open findings; 3 drafts` if the actual data confirms that interpretation.
- Decide whether a status badge represents record lifecycle or governance workflow. Where both matter, show separately, for example `Record: Active · Review: Accepted`.
- Translate internal states such as `in_progress` and `Converted to Initiative` into consistent audience-facing labels without losing the real transition meaning.
- A recommendation being converted into an initiative is not completion of implementation or benefit realisation. Label these separately.
- Give each KPI/summary metric a definition, denominator, active scope and as-of date. Decision counts must be decision counts; a combined attention queue needs its own explicit label and breakdown.
- Use identical selectors in the cockpit, register, Ask, reports, exports and sidebar summaries.

**Acceptance:** Cross-surface tests compute expected values from records, including Draft, Accepted, Remediation Planned, Resolved and Rejected findings and Pending/Deferred/Approved decisions. The same scope always produces the same count. Differing scopes are visible and explained.

### FIX-07 — Make typed Ask questions as dependable as chips

**Observed:** `What should the CIO do first, and why?` returned unsupported. The ingestion page explicitly suggested `What is blocking this data import?`; typing it returned unsupported, while clicking `Why did this import fail validation?` correctly explained three staged errors.

**Required implementation:**

- Route registered questions, displayed example text, chips and typed paraphrases through one supported-question catalogue.
- Normalize punctuation, whitespace, case and common domain synonyms. Add bounded intent matching/paraphrase families; do not map arbitrary unknown questions to the top risk.
- `What should the CIO do first, and why?` should produce scoped priorities with reasoning, owners and linked decisions, using the executive-review/readiness selectors.
- The advertised import question must use the active staged validation draft. Do not answer from an old import or an unrelated committed pack.
- Follow subject resolution: explicit named subject first; then valid selection; then same-workspace follow-up subject; then applicable graph/workspace scope. Unknown named subjects produce clarification, never a silent fallback.
- Unsupported questions should offer three relevant alternatives and preserve the question for editing. Replace implementation jargon such as `unsupported deterministic intents` with plain customer-facing language.
- No external LLM is required. Keep the adapter interface clean for optional future providers, without keys or hidden network dependencies in the demo.

**Acceptance:** Every displayed question works when typed, as well as clicked. Each journey-critical question has at least three common typed variants. Unsupported, unknown, ambiguous, missing-evidence and cross-workspace cases are tested independently.

### FIX-08 — Use current workspace terminology everywhere

**Observed:** After switching to BoG, old Ask history cleared. However, an unsupported answer still described its sources as `grounded in GRA records`. The same stale wording appeared in the newly created prospect.

**Required implementation:**

- Remove institutional names from generic response/fallback templates. Resolve active workspace name, labels, terminology, currency and disclaimer from validated metadata.
- Audit chip labels, errors, briefing assumptions, draft text, report cover, exports, scenario bindings and source link targets for stale source-tenant wording.
- Keep canonical IDs distinct from display names. Scope any shared policy/standard ID by workspace and type.
- Cancel pending work on switch; clear mounted component prompt, selection, preview and transient subject state. Restore only that workspace's own persisted history when appropriate.
- Do not claim a copied source name inside an imported synthetic record is automatically a leak: preserve meaningful provenance and identify starter data clearly. Generic product text and active-context labels must nevertheless be correct.

**Acceptance:** Run equivalent queries in GRA, BoG, Fidelity, Generic and a newly created prospect. No generic response mentions the wrong organisation. A question about another workspace is refused/clarified rather than borrowing its records.

### FIX-09 — Produce a complete executive report from the same snapshot

**Observed:** The Executive Report displayed blank capability Maturity and application TIME-class values, despite useful detail elsewhere. KPI rows contained values such as 99.5/99.9 and 42/15 without their units. The report was reached with an old drawer still open; printed PDF output was not tested.

**Required implementation:**

- Derive report fields from normalized portfolio models and metric selectors, not nonexistent/raw field names.
- Show maturity current/target and TIME class wherever known. Show `Not recorded` for genuinely absent values; never invent or display zero as a default.
- Include KPI unit, direction, baseline, current, target, measurement date/frequency and accountable owner where recorded.
- Apply the selected domain/objective/period consistently before generating narrative and tables. Do not imply historical filtering is available when only one snapshot exists.
- Carry workspace, role, selected scenario/scope, snapshot revision, generated date, as-of date, Kulana branding, synthetic disclaimer and meaningful source references into output.
- Default executive output to a concise decision brief, with optional detailed appendix. Retain the detailed report configuration for architects.
- Use explicit page-break rules and print styles; exclude navigation, drawers, question inputs and action buttons from print.
- Copy must confirm success or provide selectable text when clipboard permission is unavailable.

**Acceptance:** Compare cockpit/Ask/report facts for the same snapshot and filters. Inspect generated PDF pages for clipping, missing rows, units, stale panels, orphaned headings and correct branding. Test at least GRA, BoG and a prospect; do not claim PDF verification from HTML inspection alone.

### FIX-10 — Keep the executive demonstration on one connected story

**Observed:** The executive journey focused on taxpayer identity, while the cockpit's connected value chain and action brief highlighted revenue assurance. The action `Advance ... into the active wave` referred to work with an existing initiative and recorded progress.

**Required implementation:**

- Introduce one validated scenario focus shared by journey, cockpit highlights, Ask context, graph, recommendation, decision, initiative and report.
- Keep overall enterprise metrics visible and explicitly distinguish them from the selected scenario. Do not relabel global figures as scenario-specific figures.
- For the GRA identity path, use the verified current identity chain and its pending authority decision. For payment resilience, use its actual conditional decision and linked delivery chain.
- Generate the next-action statement from current state: missing evidence → review evidence; pending decision → named authority/gate; approved without initiative → create delivery vehicle; existing initiative → resolve a specific condition/dependency or review measured delivery.
- Display one primary decision with authority, deadline, evidence and consequence of delay. Remove generic recommendations to do work that is already underway.
- Keep intended benefit, current measurement, approval status and delivery completion distinct.

**Acceptance:** A presenter can follow one scenario from first screen to report without mentally switching business problems. Every highlighted action is valid for the current record state and opens the exact destination.

### FIX-11 — Prepare and reset demos predictably

**Observed:** Demo Studio exposed all eight journeys. GRA J6 and J7 needed explicit fixture preparation, blocking the full-product and 15-minute playlists. This is useful gating, but a presenter needs a dependable preparation workflow. Reset/restart recovery was not exhaustively tested.

**Required implementation:**

- Preserve readiness checks and readable setup failures. Add a presenter-only `Prepare selected demo` workflow that previews and validates required synthetic fixtures before writing them to the local working copy.
- Do not silently prepare data when a prospect presses Start. Run preparation before the meeting and show a clear ready-to-present summary.
- Validate source records, routes, targets, question handlers and allowed initial workflow states. Validate future generated-record slots through their creator steps rather than demanding nonexistent records before Start.
- Retry only reapplies UI/read-only work. Back does not reverse decisions or create duplicates. Dependent action steps wait for actual completion predicates.
- Separate `Restart walkthrough` (navigation/history scope), `Restore journey baseline` (discard that run's changes after confirmation) and `Reset workspace` (explicitly scoped, confirmed reset). Label their real behaviour accurately.
- Preserve imported/user-created data outside the chosen reset scope. Prevent duplicate fixtures and repeated submission effects through idempotency.
- Add a final completion screen with demonstrated decision, delivery link, report and next action. Do not display Complete for a run that skipped required actions.

**Acceptance:** The 15-minute playlist is Ready after one explicit preparation operation. Run it twice from baseline without missing context, targets or duplicate records. Independently exercise J7's real human approval/initiative chain. A missing prerequisite blocks before presentation and a runtime failure pauses with recovery.

## 4. Product and presentation improvements

Implement these after the relevant P0/P1 gates pass. Keep changes focused; avoid a full CSS rewrite or expanding into production infrastructure.

### DESIGN-01 — Modernise the product workspace, starting with governance

**Evidence:** The second user screenshot shows the active `Decision Register` navigation item with a page titled `Architecture Review Board`, a large dark sidebar, a full-width instructional tour bar, an oversized outlined header, four similarly boxed metrics, large filter controls, a heavily divided table and a separate large review card. The user explicitly describes this look and feel as legacy. This is a visual and interaction design requirement, not evidence that the underlying review workflow is missing.

#### 1. Intended visual character

Create a calm, contemporary enterprise workspace with clear hierarchy, compact navigation and useful information density. Keep Kulana's identity through the approved logo, restrained teal accents and consistent typography. Use neutral surfaces, precise spacing and subtle separators. Put the decision and its next action ahead of decorative containers.

This requires layout, navigation, content hierarchy, component treatment and tour-highlight changes. Recolouring the current screen, increasing corner radii or adding gradients does not satisfy it. Avoid decorative glows, glass effects, excessive shadows and oversized statistic cards. Preserve useful enterprise detail without showing every possible field at once.

#### 2. Recompose the screenshot's governance screen

| Element | Required replacement |
| --- | --- |
| Global header | Compact product identity, workspace switcher, search and restrained Ask entry. Keep global actions subordinate to the page's current work. |
| Sidebar | Default to a light/neutral rail around 224–240 px wide, with concise groups, consistent icons and a subtle teal selected state. Support a compact collapsed rail. Replace the large uninterrupted dark slab unless an approved brand constraint requires it. |
| Guided tour | Use FIX-00's compact row inside the main content column. No automatic assistant, no expanded instructions, and no competing row of six prominent buttons. |
| Page header | Short title such as `Decisions`, approximately 28–32 px at desktop, one concise supporting line and one contextual primary action. Remove the large bordered header container. |
| Governance navigation | Make view identity clear. Decision Register and Review Board must have distinct titles/content, or a deliberate shared Governance page with clear tabs. Do not highlight one route while presenting the other's title without explanation. |
| Summary measures | Use a compact horizontal summary strip or small low-chrome cells. Put labels beside readable values; minimise enclosing boxes. Include meaningful counts such as awaiting review/overdue/conditions only when supported by real data. |
| Search and filters | One compact toolbar: search, status, additional filters. Avoid spreading two large form fields across a whole row for a single-item queue. Show active filter chips and a clear reset. |
| Decision queue | Clean list/table with subtle horizontal rules, sensible row height and sufficient whitespace. Remove spreadsheet-like vertical gridlines and repeated tinted cells. |
| Decision identity | Use the actual decision title, for example `API-led identity access wave`, with status as a separate badge. Avoid repeating `Pending` in the title and status and description. Do not silently change domain states to simplify the display. |
| Selection | Use a soft row tint and/or a narrow leading accent. Show which decision is selected without outlining the entire page. |
| Review detail | Use a purposeful split view with a readable detail width. Lead with decision/status, business reason, authority and deadline; group Evidence, Options, Conditions and Activity into tabs or sections. Keep a clear `Review decision` / appropriate workflow action. |
| Workflow form | Show rationale/conditions inputs when the user deliberately enters review mode. Do not let a large empty form dominate the initial browse state. Preserve validation and legal transitions. |

For a wide desktop, use the decision list as the primary surface and a roughly 360–440 px detail column as space permits. Avoid squeezing both into unreadable fixed widths. At narrower widths, move detail below the list, use a full detail page, or use an explicitly opened detail sheet; ordinary Next must not launch a modal. Preserve the selected record and the way back.

The main page should have three clear levels: page identity/action, decision navigation/list, and selected-record detail. The current combination of oversized header, tour instructions, KPI cards and form controls must no longer compete equally for attention.

#### 3. Shared design tokens

Use existing token infrastructure where available and consolidate conflicting overrides in the components being changed. These are implementation defaults; check contrast in actual rendered states:

```css
:root {
  --ea-canvas: #f7f9fb;
  --ea-surface: #ffffff;
  --ea-ink: #102a35;
  --ea-text: #334155;
  --ea-muted: #64748b;
  --ea-border: #e2e8f0;
  --ea-brand: #006b73;
  --ea-brand-soft: #eaf8f5;
  --ea-radius-control: 8px;
  --ea-radius-panel: 12px;
}
```

- Use Inter or the existing approved modern sans-serif consistently. Body/table text around 14 px with comfortable line height; supporting labels around 12–13 px; meaningful page titles around 28–32 px. Avoid uppercase labelling on every field or excessively bold body text.
- Work from a consistent spacing scale such as 4, 8, 12, 16, 24 and 32 px.
- Standard desktop controls around 36–40 px high; provide adequate touch targets in touch layouts. Keep buttons and fields aligned rather than mixing arbitrary heights.
- Use borders to separate meaningful regions; do not put a visible border and shadow on every nested group. Shadows are reserved for floating layers or a subtle elevated surface.
- Give pending, approved, conditional, rejected and overdue states distinct accessible treatments; do not use teal for every state. Status text must remain understandable without colour.
- Keep content width controlled on very wide displays, around 1440–1520 px maximum within the main workspace when appropriate. Use the available width for legibility, not stretched descriptions and giant blank gaps.

#### 4. Modern tour highlighting

The screenshot's large double-looking green rectangle around the entire heading is specifically undesirable. Replace it with precise, quiet focus on the relevant row, KPI or action:

- Do not frame the whole page header when the point of the step is a specific decision.
- Use a soft selected-row background or restrained 2 px outline around the actual target, optionally with one short callout. No flashing or persistent glow.
- Remove prior tour highlights on step change, retry and exit. Reposition after lazy mount/resize without layout shift.
- Keep keyboard focus styles intact; the tour's decorative emphasis must not replace or suppress accessibility focus.
- If a target is not ready, show a compact loading/recovery state rather than falling back to outlining the entire screen.

#### 5. Apply consistently across EA360

Implement the governance screen as the representative design, then propagate shared components/tokens to Executive, Applications, Integrations, Data, Technology, AI, Findings, Roadmap, Demo Studio and onboarding. Preserve useful view-specific charts and workflows. A modern shell around unchanged bulky legacy components is incomplete; avoid rebuilding the feature logic while updating presentation.

Keep Ask as an optional, user-opened companion with a concise answer-first layout under IMP-01. Keep the important product screen visible when practical. Make presentation mode reduce distracting chrome while maintaining readable data and clear navigation.

**Acceptance:** Provide before/after visual checks using equivalent synthetic state for governance, executive and one portfolio screen at 1440, 1280 and 1024 px; test the main shell at approximately 1908 px and narrow/mobile width. The governance screen has a compact header and navigation, readable list/detail, restrained measures and filters, clear view identity, subtle exact-target highlighting and no intrusive assistant. Verify contrast, keyboard/focus, overflow and all retained review actions. Report any untested view rather than declaring the entire redesign visually verified.

### IMP-01 — Clear, concise Ask presentation

Use this default answer structure:

1. **Answer:** one or two direct sentences.
2. **Business implication:** why the answer matters to the selected audience.
3. **Next action:** one primary action and up to two secondary actions.
4. **Sources and limitations:** compact source/evidence status with expandable details.

Move raw intent names, object IDs, `field=value` facts, formulas and lengthy diagnostic lists into an optional details area. They remain useful for architects and QA but should not dominate the prospect view.

For the inspected agent, a suitable opening is:

> The Fraud Investigation Agent has two elevated tool permissions and four incomplete guardrails. Review its action boundaries, escalation and monitoring before expanding its scope.

Actions: `Review controls`, `Inspect permissions`, `Open related finding`. Derive this wording and counts from current data; do not hardcode the example.

Replace the ambiguous single Grounded/High treatment with distinct signals where appropriate:

- `Sources resolved`: referenced workspace records exist and match the claim.
- `Evidence status`: verified, unverified, disputed, stale or metadata-only.
- `Answer confidence`: confidence in the specific calculation/interpretation, with a short reason.

A metadata-only permissions answer can confidently read the catalogue while explicitly saying it does not verify runtime enforcement. An unsupported/refusal answer should not wear a misleading evidence-grounded success badge.

**Acceptance:** An executive sees the useful answer and next action without scrolling through implementation metadata. Source detail remains accessible. Every visible source/action button works and has a valid target.

### IMP-02 — Audience-aware navigation and readable detail views

- Provide a compact audience/focus selector that changes navigation emphasis: Executive, Architecture, Governance/Transformation and Full workspace.
- This is presentation/navigation personalisation, not authentication or access control. Keep existing demo roles honestly described.
- Executive emphasis: cockpit, priority decisions, selected roadmap and report. Architecture emphasis: portfolios, capabilities, explorer and findings. Governance emphasis: reviews, evidence, decisions, initiatives and KPIs.
- Keep full functionality reachable through `All modules`; do not hide a required journey destination because of the audience setting.
- Use a consistent portfolio pattern: short title/description → three to six useful measures → one material insight with action → charts/filterable register → exact detail.
- Put long detail into stable tabs such as Overview, Dependencies, Risk & Evidence, Governance and Outcomes. Preserve deep-link/step targeting of the chosen tab.
- Correct typography, spacing, empty/loading/error states and narrow-card wrapping. Keep major action controls visible on shared-screen sizes.

**Acceptance:** A first-time executive can find the pending decision/report without scanning the entire sidebar. A guided step can still open an architect detail deliberately. Keyboard focus and tab semantics remain accessible.

### IMP-03 — Consistent Kulana identity and language

- Use the approved local Kulana logo plus EA360 in the landing, app header, demo title card and reports. Preserve a compact app variant where space is limited; do not approximate the logo.
- Keep the synthetic/illustrative indicator visible, with a concise explanation available. Avoid repeating long disclaimers above every chart while retaining clear context and complete export disclaimers.
- Standardise `CIO`, `CTO`, title case, workflow labels, dates, percentages and units.
- Fix corrupted text such as the observed roadmap phase `Wave 1 â Integration platform`. Repair encoding at its source, not with a global character replacement that damages valid content.
- Human-readable owner names/roles are primary; IDs remain available in details.
- Remove redundant singular/plural artefacts such as `finding(s)` in audience-facing prose.
- Review the Netlify badge's overlap with lower-right controls. Do not remove required provider attribution or violate the hosting plan; make app controls accessible around it.

**Acceptance:** Consistent branding and legible language at desktop/tablet widths and in exported output. No broken punctuation, raw status constants or clipped primary actions in the demo paths.

### IMP-04 — Stronger landing page and honest conversion paths

Retain a broad enterprise proposition; use sector/regional stories as examples. Do not imply the named synthetic institutions are customers or endorsers.

Suggested structure and copy direction:

1. **Hero headline:** `Know your enterprise. Shape what’s next.`
2. **Supporting statement:** `Connect enterprise dependencies, risks and decisions to accountable delivery and measurable outcomes.`
3. **Primary CTA:** `Explore the interactive demo`, opening a curated demo entry rather than dropping into an unexplained inventory.
4. **Secondary CTA:** `See the decision-to-delivery walkthrough`, linking to a real short guided sequence or an actual available video. Do not create a pretend video play control.
5. **Product proof:** a readable screenshot from the current product or a precise interactive sequence: risk → dependency → evidence → decision → initiative → KPI. Label synthetic content clearly.
6. **Three buyer outcomes:** prioritise transformation investment; understand dependency exposure; govern enterprise and AI change.
7. **Focused use cases:** application simplification, API/payment resilience, data trust and AI/agent governance.
8. **How onboarding works:** starter example or guided capture → validate/link evidence → establish baseline → act on priorities.
9. **Trust/FAQ:** prototype scope, local demonstration data, human approval, supported imports and current connector/AI boundaries.
10. **Commercial next step:** a real discovery/demo contact path only if a verified contact or working endpoint already exists. Otherwise use a clear in-app discovery-preparation action and document the missing destination. No invented email address or dead form.

Replace `4 tenant packs / 12 portfolio domains / 360° relationship explorer` as the main proof with visible product behaviour. Counts can remain supporting demo context; they do not establish business value. Use `sample organisations` and `workspace-grounded answers` in customer-facing copy. Keep technical deterministic-engine details in the FAQ when relevant.

Make geographical language configurable. If positioning beyond Ghana/Africa, move that context into the relevant sector examples. Do not remove a purposeful regional strategy without documenting the choice.

**Acceptance:** Every CTA has a real destination. At a glance, visitors can explain the target problem, resulting decision and what they can try. No fabricated outcomes, logos, testimonials, customer claims, connector capability or video assets.

### IMP-05 — Complete the customer-onboarding handoff

The inspected flow captured a profile, previewed a sector starter and created a synthetic workspace successfully. It then opened the cockpit directly. Add a useful readiness handoff before the first demo:

- Customer/workspace name, sector, currency, timezone and synthetic status.
- What was cloned, what is example data and what has been imported.
- Counts by actual entity type, schema/reference validation, relationship coverage, evidence completeness/freshness and unresolved warnings.
- Available journeys and precise reasons for unavailable ones.
- One actionable first priority from the committed workspace, with `Start executive demo`, `Review data gaps`, `Import inventory` and `Capture first records`.

Keep readiness dimensions separate. If a composite score is used, document its formula/denominator and missing-data behaviour. A starter's synthetic risk findings are illustrative priorities, not a discovery assessment of the prospect.

Support prospects with no Excel/CSV inventory through a small guided-capture path:

1. Capture organisation goal or decision/problem.
2. Add a few important capabilities and critical applications.
3. Assign named roles/owners and mark unknowns explicitly.
4. Record the interfaces/data/dependencies the user actually knows.
5. Add evidence notes/source references and a review status.
6. Validate and show a deliberately incomplete baseline with the next data gaps.

Use existing manual-entry components where possible. Do not auto-discover unknown infrastructure or present invented assets to make an empty customer workspace appear complete. Keep `Explore a synthetic example` separate from `Capture my organisation`.

**Acceptance:** Both starter and minimal/manual entry reach an honest readiness summary and a useful next action. Refresh/persistence and workspace isolation are verified; unknown records and incomplete coverage remain visibly unknown.

### IMP-06 — Clarify ingestion scope and safe normalization

The reviewed applications CSV correctly blocked an unknown capability reference, missing name and duplicate ID. Preserve this behaviour. The reviewed UI exposed an applications CSV path; do not claim every other import type is absent without inspecting current source/settings.

- Label the actual supported formats/entity types. Existing broader JSON exchange must remain available wherever already implemented.
- Keep upload → map → normalize → validate → preview changes → explicit commit → audit.
- Ensure the validation result is invalidated after editing CSV/mapping or changing workspace; stale validation cannot authorize a different payload.
- Explain normalization, including the observed unrecognised `urgent` criticality being mapped to medium. Require an explicit mapped choice for decision-critical ambiguity rather than quietly reducing severity; document which normalizations are warnings and which block.
- Fix the advertised Ask import question under FIX-07 and make its `Open validation errors` action reach the actual staged issue rows.
- Show import diff and source provenance, with new/updated/unchanged counts. Prevent partial commit, duplicate creation on retry and hidden overwrite rules.
- Add required portfolio templates incrementally using the existing schema. Prioritise capabilities, applications, integrations, relationships and evidence, then data/technology/AI records. Advertise a template only when its parser/mapping/reference validation and sample are functional.
- Preserve a complete versioned JSON export/import path if present; otherwise implement and test one explicitly, with all references and scoped metadata round-tripping.

**Acceptance:** Clean/error files, remapped columns, changed payload after validation, duplicate retry, storage failure and foreign references produce correct outcomes. Committed data appears consistently in portfolios, graph, readiness and Ask. Never claim full multi-format onboarding from one CSV demonstration.

### IMP-07 — Make a 15-minute prospect story easy to present

Provide this curated sequence, using the existing journeys and actual current bindings:

| Segment | Target time | Presenter proof |
| --- | ---: | --- |
| Business decision | 2 min | One named material exposure, accountable authority and decision deadline. |
| Dependency impact | 3 min | A critical service/API path with readable connections and a clear affected scope. |
| Governed AI | 3 min | One agent's real catalogue permissions, oversight and partial guardrails; Ask explains the gap accurately. |
| Human decision to delivery | 4 min | Prepared practice finding → reviewed draft → human decision → initiative/KPI. Use legal transitions and actual actions. |
| Executive handoff | 2 min | Same-snapshot brief/report, owner and next step. |
| Transitions | 1 min | Prepared state and stable navigation; no setup chores during the shared demo. |

Treat timings as targets to rehearse. If the real J7 human sequence cannot fit without hiding important actions, use a clearly labelled inspected decision/delivery chain in the 15-minute version and retain the full interactive J7 separately. Do not silently pre-approve records or show skipped actions as completed.

Add a pre-demo checklist and a recovery card: return to Studio, restore exact prepared baseline, clear transient panels, check context and rerun the failed read-only step. Avoid broad workspace resets during a meeting.

## 5. Technical implementation guidance

### 5.1 Inspect the current source before deciding edits

These are known areas from the existing repository structure, not confirmation of the deployed commit. Locate current equivalents where files have moved:

| Area | Inspect first |
| --- | --- |
| Navigation and panels | `src/App.jsx`, `src/components/enterprise/EntityDrawer.jsx`, shell/Sidebar components and route configuration. |
| Guided flow | `src/features/demo/demoJourneys.ts`, `applyDemoStep.js`, `GuidedDemoBar.jsx`, Demo Studio, preflight, binding and runner modules. |
| State and mutation | `src/state/prototypeStore.ts`, runtime registry/storage, workspace snapshots, draft/import context and audit. |
| Ask engine | `src/lib/ai/types.ts`, `index.ts`, `contextBuilder.ts`, `queryParser.ts`, `intents.ts`, deterministic adapter, confidence, grounding and question catalogue. |
| Ask UI | `src/features/ai-assist/*`, including response actions, RecommendationDraft and ExecutiveBriefing. |
| Shared portfolio data | AI/data/technology/application `portfolioModel.ts` files, governance model, tenant repository and domain metric selectors. |
| Dependency graph | `src/features/explorer/*`, graph metrics, relationship types/semantics, layout helpers and CSS. |
| Reports | `src/features/reports/ExecutiveReport.jsx`, report adapters and print styles. |
| Customer journey | Onboarding, Data Ingestion, Workspace Settings, schemas, CSV/JSON pipelines and IndexedDB repository. |
| Branding/landing | Existing landing HTML/JS/CSS, local approved assets, theme tokens and app header. |

### 5.2 Shared context and selectors

Prefer small typed interfaces and existing extension points over a new competing state/data model. A request/execution context should include:

```ts
// Illustrative design; adapt to existing project types.
type DemoAnswerContext = {
  workspaceId: string;
  datasetRevision: string | number;
  asOfDate: string;
  role: string;
  view: RouteId;
  scenarioId?: string;
  subject?: { type: EntityType; id: string };
  scope: 'workspace' | 'scenario' | 'selection' | 'filtered-portfolio';
  filters: SupportedFilters;
  runId?: string;
  stepExecutionId?: string;
  importDraftId?: string;
};
```

Resolve this once per request. Validate subject type/ID and tenant membership at the service boundary. Carry supported filters explicitly; an unsupported filter must be surfaced, not ignored. An onboarding draft has a separate identity until the workspace is committed.

Reusable selectors should cover metric scope, workflow/lifecycle status, distinct owner roles, normalized AI oversight, graph neighbours/impact semantics, relevant approval authority, report fields and staged validation results. Rendering, narrative and export consume the same normalized result where they describe the same concept.

### 5.3 Snapshot consistency and evidence

- Keep a shared visible as-of date for evidence age, overdue items, technology support horizon and reports. Generated-at timestamp and data-as-of timestamp mean different things.
- A complete answer records its workspace, dataset revision, scope and as-of date. Data changes mark old answers stale and allow refresh.
- Validate references and claim relevance, not ID existence alone. Every suggested action target must resolve in the active workspace.
- Keep recorded facts, calculations, proposed actions and inference distinguishable. Graph reachability does not predict outage duration or monetary loss.
- Never change measured KPI current values merely because a decision was approved or an initiative created.
- An AI draft remains draft until explicit human conversion/review. Accepting answer feedback is not a governance transition.

## 6. Required regression and browser checks

Use existing test tools and meaningful focused tests. Test observable behaviour and domain outcomes rather than duplicating configuration literals.

| Test | Minimum pass condition |
| --- | --- |
| R01 Context sequencing | Step navigation keeps Ask closed; one explicit Explain action uses the exact finding under cold/slow mounts; stale work cannot overwrite context or reopen a panel. |
| R02 Agent consistency | Ownership roles, oversight, autonomy, permissions and guardrails agree across UI/Ask/export; missing fields remain honest unknowns. |
| R03 Follow-up | `Why?` explains prior answer and retains subject; subject resets correctly on workspace change. |
| R04 Approval relevance | Linked/no-link/multiple-approval cases resolve appropriately; agent query never substitutes unrelated decisions. |
| R05 Human boundary | Informational approval questions work; approval execution requests and AI feedback create no approval/tool mutation. |
| R06 Panel lifecycle | Journey and source actions leave only intended panel state; report is unobscured; Back/Retry/Finish remain usable. |
| R07 Graph rendering | Visible edges, direction/labels, fit and root context survive viewport/filter changes; impact scope reconciles with list. |
| R08 Count definitions | Shared fixture produces matching counts/status across register, cockpit, Ask and report or an explicit labelled scope difference. |
| R09 Typed question parity | Every displayed example/chip works when typed; critical paraphrases and negative/ambiguous cases behave predictably. |
| R10 Workspace labels | GRA/BoG/Fidelity/Generic/prospect responses and generic templates never use the wrong institution; valid per-tenant history stays isolated. |
| R11 Report completeness | Derived fields populated where known, correct units/labels/scope, no fake zero, same-snapshot facts and visually inspected PDF. |
| R12 Scenario continuity | Selected journey's highlighted chain/decision/action/report stay on the same story while global metrics remain labelled global. |
| R13 Fixture/reset | Preparation is explicit and idempotent; restart/baseline/reset scopes are accurate and preserve unrelated imports. |
| R14 Import validity | Bad references/schema/duplicates block; payload/mapping change invalidates validation; commit atomic and retry-safe. |
| R15 Customer handoff | Starter/manual paths show truthful readiness, available journeys and next action; refresh persistence verified. |
| R16 Landing/presentation | Real CTAs, approved brand assets, readable controls/text, no broken encoding, no fake proof or customer claims. |
| R17 Non-interrupting navigation | Next/Back/step Retry across all journeys/playlists do not open Ask, submit AI questions or append history. Explicit Ask/Explain/Draft/Generate actions work; closing Ask defeats pending open effects. |
| R18 Compact tour controls | Default toolbar shows concise progress/title and Back/Next/More; expanded instructions stay collapsed; wide/tablet/mobile layouts have no overlap or horizontal page scroll; secondary actions remain keyboard-accessible. |
| R19 Modern workspace design | Governance, executive and a portfolio use the shared modern system; no oversized outlined header, heavy gridlines or conflicting route identity; list/detail, tour focus and controls remain readable at required widths with all behaviour retained. |

Minimum typed-query cases, using active context appropriately:

```text
What are our most critical enterprise risks?
What should the CIO do first, and why?
Explain this finding.
Why?
Show the evidence.
What can this agent do, and which controls are missing?
Explain this agent and its risks.
Who can approve this agent?
Approve this agent for production.
What is blocking this data import?
Why did this import fail validation?
Is this workspace ready, and what should I review first?
What depends on PaymentAdviceAPI?
Who uses the payment advice API?
What happens if PaymentAdviceAPI is unavailable?
Which technologies are approaching end of support?
Generate an executive briefing.
```

PaymentAdviceAPI questions require GRA or an explicit equivalent binding; do not silently substitute it into a different tenant. Add unknown explicit entity, ambiguous entity, no evidence, no approval authority, wrong workspace/context ID and unsupported historical/financial forecast cases.

### Journey smoke coverage

Preserve all eight existing journeys and their purpose:

| Journey | Smoke verification |
| --- | --- |
| J1 Executive | Entire path, correct scenario context, on-demand contextual answers and briefing generation, exact decision, unobscured report. |
| J2 Rationalisation | Capability/process/application links, TIME classification, comparison and retirement impact. |
| J3 Integration resilience | Interface/graph/finding/evidence/conditional decision/initiative/KPI chain agrees. |
| J4 Data trust | Ownership, lineage, classification, readiness and approval limits match Data/Governance/Ask. |
| J5 Technology | Support date/horizon, resilience, affected services, exception and delivery context are consistent. |
| J6 Governed AI | Explicit prepared evidence, agent permissions/oversight, draft limits and approval authority are accurate. |
| J7 Transformation | Real human workflow, evidence change, saved/reviewed draft, legal decision, initiative and KPI links/audit; no duplicate writes. |
| J8 Customer onboarding | Profile/starter/manual path, readiness, invalid/clean import, scoped persistence and first useful journey. |

Run GRA full coverage; repeat representative executive/integration/transformation paths in BoG and the other advertised supported tenants. Unavailable pack/journey combinations must explain why before Start. Do not show universal readiness by borrowing GRA assets.

Browser coverage: desktop 1440×900 and 1280×800; tablet 1024×768; narrow/mobile basic navigation and dialogs. Verify keyboard access and no trapped focus. Inspect console/runtime errors for the tested paths. Verify direct `/app/` hash routes and refresh, not only in-app navigation.

## 7. Implementation phases and exit gates

| Phase | Scope | Exit gate |
| --- | --- | --- |
| A — Baseline and reproduction | Inspect branch, existing documentation/tests, supported runtime and current source; reproduce FIX-00–11 and capture confirmed/no-longer-reproducible status. | A concise baseline log with source commit and actual failures. Existing unrelated test failures separately identified. |
| B — P0 correctness | FIX-00 first: non-interrupting Next and compact toolbar. Then context sequencing, normalized agent fields, subject-specific approval, panel lifecycle, visible graph and consistent metric/status scope. | R01–R08 and R17–R18 pass; executive flow, toolbar at required widths and BoG graph verified in browser. |
| C — P1 demo confidence | Typed-query matching, workspace wording, complete report, scenario continuity, safe preparation and reset. | R09–R13 pass; 15-minute playlist ready after explicit preparation; PDF visually inspected. |
| D — Product presentation | DESIGN-01 modern workspace system and governance composition, then Ask layout, focused navigation, Kulana identity, landing, onboarding readiness/manual capture and ingestion clarity. | Relevant R14–R16, R19 and journey smoke checks pass; all visible CTAs work; before/after views visually inspected. |
| E — Rehearsal and handoff | Repeat journeys/tenant checks, refresh, responsive review, report inspection, runbooks and final status. | No unresolved P0/P1 in advertised demo paths; honest remaining-limits report. |

Use the repository's package manager/lockfile and compatible pinned runtime. For the known npm scripts, run the appropriate gates:

```bash
npm ci
npm run validate:tenants
npm test
npm run build
```

Inspect `package.json` first and adapt commands only if the current project intentionally changed them. Add focused tests alongside each behaviour fix. Do not update/delete meaningful assertions just to make an inconsistent implementation pass. Repeat a check when changed inputs or failures justify it; do not substitute repeated build output for browser verification.

Implement in focused commits if Git is available. Do not auto-push or deploy. Preserve unrelated work. Continue until the requested scope is complete; a blocker in an optional enhancement must not prevent finishing independent P0 fixes.

## 8. Required handoff

Deliver:

1. Working implementation, with an exact changed-file summary and why each material change was needed.
2. `DEMO_FIX_VALIDATION.md`: issue-by-issue result, source commit, tests/browser checks performed, viewport/tenant used, remaining risks and unverified areas.
3. Updated `DEMO_RUNBOOK.md`: preparation, 15-minute narrative, safe questions, expected decisions, recovery and reset scope.
4. Updated Ask question catalogue/tests, retaining compatibility with existing supported questions.
5. Synthetic fixtures/import examples required by the supported demos, with provenance and validation.
6. Visually verified report/print output from test fixtures, with correct units/branding/as-of date.

Completion report must distinguish `Implemented`, `Automated checks passed`, `Browser verified`, `PDF inspected` and `Not verified`. Do not describe all eight journeys as tested unless each was actually exercised. Clearly disclose any production feature that remains prototype-only.

## 9. Copy-paste Cursor prompt

Save this file at the repository root as `EA360_CURSOR_RELIABILITY_AND_DEMO_FIX_PLAN.md`. Open the existing EA360 project in Cursor Agent and paste:

```text
Implement EA360_CURSOR_RELIABILITY_AND_DEMO_FIX_PLAN.md in this existing EA360 repository.

Read the entire file, inspect the current branch and source, then reproduce the reviewed
issues before editing. The live app already contains eight journeys, Demo Studio,
onboarding and ingestion. Preserve working features; do not recreate the project.

Work through phases A–E and continue after each gate passes. Fix P0 reliability first:
implement FIX-00 first: Next/Back/Retry must never open Ask or auto-submit questions.
Replace the screenshot's crowded bar with concise progress/title, Back, Next and More;
put instructions/secondary controls behind explicit expansion. Ask/Explain/Draft/
Generate briefing run only when the user chooses them. This overrides older auto-open
journey instructions. Then fix contextual Ask sequencing, agent owners/oversight, subject-specific
approval answers, drawer lifecycle, readable graph edges and consistent count/status
definitions. Then fix typed-question/chip parity, stale tenant wording, report fields,
scenario continuity, preparation/reset, and the specified presentation improvements.

Implement DESIGN-01 as a real modern workspace refresh, starting with governance:
light compact navigation, restrained surfaces, smaller clear headings, subtle metrics,
clean decision list/detail, compact filters and precise tour highlights. Preserve Kulana
branding and every working review action. Cosmetic recolouring alone is insufficient.

Ask EA360 must work from current active-workspace data through the existing local
deterministic engine. No external LLM/API key/backend is required. Use shared normalized
selectors in screens, Ask, graph and reports. Show truthful evidence/confidence and
limitations. AI never approves a decision or executes catalogue tool permissions.

Preserve all eight journeys, tenant isolation, existing user workspaces/imports,
domain validation and approved Kulana branding. Do not hide inconsistencies by
hardcoding counts, changing measured KPI values or globally resetting local data.

Add focused regression coverage R01–R19, run tenant validation/tests/build and perform
the specified browser and PDF checks where tooling is available. Fix regressions.
Report actual verification limits rather than claiming that a build proves the demo.

Deliver the code, DEMO_FIX_VALIDATION.md, updated DEMO_RUNBOOK.md, question catalogue
and required synthetic fixtures. Do not deploy, change site access or auto-push.
Do the implementation, not only a proposal.
```
