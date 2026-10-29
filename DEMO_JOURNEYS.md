# EA360 Demo Journeys

All journeys run on **illustrative synthetic data**. No journey presents a named real institution as a customer.
Journeys are defined in `src/features/demo/journeyDefinitions.ts` and bound to real records per workspace in
`src/features/demo/journeyBindings.ts`. Presenters choose them in **Demo Studio**.

## The eight journeys

| Id | Journey | Audience | Length | Steps | Business question |
|---|---|---|---|---|---|
| J1 | Executive decision and briefing | CEO/CIO, sponsor, executive committee | ~5 min | 9 | What requires a decision, and why now? |
| J2 | Capability impact and application rationalisation | Enterprise, business and application architects | ~8 min | 10 | Which overlapping applications can we simplify safely? |
| J3 | Integration and payment resilience | Integration/API architect, operations, CIO | ~8 min | 11 | What depends on this interface, and how do we reduce failure exposure? |
| J4 | Data trust, lineage and AI readiness | CDO, data owner, compliance | ~7 min | 9 | Which data is trustworthy enough to use, share or expose to AI? |
| J5 | Technology lifecycle and resilience | CTO, infrastructure, security | ~7 min | 7 | Where does obsolete technology threaten important services? |
| J6 | Governed AI, models and agents | AI lead, risk, architect, review board | ~8 min | 12 | What can this agent do, and are its controls sufficient? |
| J7 | Evidence to human decision, delivery and KPI | ARB, transformation lead, PMO | ~10 min | 11 | How does an observed risk become an accountable, measurable change? |
| J8 | New customer onboarding and data ingestion | Presenter, prospect architect, workspace admin | ~5 min sample / ~8 min CSV | 8 | How does a new organisation get started and trust its imported baseline? |

Ask EA360 questions used by each journey are listed in [`ASK_EA360_DEMO_QUESTIONS.md`](ASK_EA360_DEMO_QUESTIONS.md).

## Playlists

| Playlist | Content | Length |
|---|---|---|
| Full product walkthrough | J8 + J1 + J2 + J3 + J4 + J5 + J6 + J7 | ~60–70 min |
| 15-minute prospect walkthrough | J1 (J1.2, J1.3, J1.5b, J1.7) + J3 (J3.2, J3.4, J3.7, J3.8b) + J6 (J6.2, J6.3, J6.6, J6.7) + J7 (J7.1, J7.4, J7.10a) | ~15 min |

Playlists reuse the journey definitions; they never copy steps.

## Workspace support

Preflight (`scenarioPreflight.ts`) checks every bound record, route and question before a journey can start.

| Workspace | J1 | J2 | J3 | J4 | J5 | J6 | J7 | J8 |
|---|---|---|---|---|---|---|---|---|
| GRA (Revenue Authority) | Ready | Ready | Ready | Ready | Ready | Needs setup | Needs setup | Ready |
| BOG (Central Bank) | Ready | Ready | Ready | Unavailable | Unavailable | Unavailable | Needs setup | Ready |
| FIDELITY (Commercial Bank) | Ready | Ready | Ready | Unavailable | Unavailable | Unavailable | Needs setup | Ready |
| GENERIC (Generic enterprise) | Ready | Ready | Ready | Unavailable | Unavailable | Unavailable | Needs setup | Ready |

- **Ready** — every bound record, route and question resolves.
- **Needs setup** — the journey needs a synthetic fixture. Use **Prepare synthetic example** in Demo Studio. It is an explicit action, is idempotent, tags every record `synthetic-demo-fixture`, never overwrites a record and never touches the seed pack.
- **Unavailable** — no validated supplement exists for that sector yet. GRA records are never substituted.
- Runtime workspaces created in J8 are clones of a starter; their preflight result follows the starter they were cloned from.

## Preflight notes per journey

- **J1–J3** run as-is on all four seed workspaces.
- **J4, J5, J6** are GRA-only until sector supplements are validated.
- **J6** needs *Prepare synthetic example*: the existing finding cites only a broad integration inventory, so a permission/guardrail review fixture is added. Recorded WRITE/EXECUTE tools are never invoked. Q26 reads the agent's `toolPermissions` and `guardrails` as recorded.
- **J7** always starts from a fresh practice scenario (`demo-<code>-payment-*`) with no recommendation, decision or initiative. A human creates each one. Restart is safe: fixtures are deterministic and "Reset demo" removes them.
- **J8** works on every workspace; the sample path needs no file, the CSV path uses the samples below.

## J7 — the human steps

Each gate is a visible action; **Next** stays disabled until the matching predicate is true.

1. Open the practice finding (read-only).
2. **Verify** the unverified evidence item — predicate `evidence-verified`.
3. **Validate** the finding, then accept it by creating a recommendation — `finding-accepted`.
4. Review Ask's draft and **Save for review** — `draft-saved`. The saved draft converts to a recommendation only by a human click, with status *Draft*; it is never approved.
5. **Create and submit** the recommendation, then send to ARB — `recommendation-submitted`.
6. Review Board queue (read-only).
7. Record **Approved with Conditions** with rationale and conditions — `decision-conditional`.
8. **Create the initiative** from the decision — `initiative-created`.
9. Roadmap, KPI and updated briefing (read-only).

An initiative cannot be created from an unapproved decision, a recommendation cannot be approved from Draft, and nothing can skip a state (see `src/domain/workflow/transitions.ts`).

## J8 — onboarding and ingestion

1. **Customer Onboarding** — enter name, workspace code (2–15 characters, letters/digits/underscore, starting with a letter), sector, country, currency, time zone, and confirm the workspace is synthetic.
2. Choose a starter (Central Bank, Revenue Authority, Commercial Bank or Generic enterprise) and read the clone preview and the journeys it supports.
3. **Create synthetic workspace** — clones the starter with every identifier remapped (`<oldId>-<code>`), saves it under `ea360-runtime-workspaces` in browser storage, registers it and makes it the active workspace. Seed workspaces are never modified.
4. **Data Ingestion** — load or upload an applications CSV, map the columns, **Validate**. Blocking errors list the line, field and message; **Commit import** stays disabled until there are none. Ask Q32 explains the staged result.
5. Commit — all-or-nothing merge into the workspace with an audit entry (`import_committed`); importing the same file again changes nothing.
6. Ask Q33 summarises readiness; Workspace settings shows export and isolation.

Samples: **Load/Download clean sample** and **Load/Download error sample** in the Ingestion Center are generated from the active workspace's own capability ids. Static GRA copies are served from `public/samples/applications-clean.csv` and `applications-errors.csv`.

## Demo controls

- **As-of date** (Demo Studio): drives end-of-support horizons and freshness. Changing it increments the workspace data revision, so earlier Ask answers show a stale banner with an **Ask again** action.
- **Presentation mode** hides presenter notes.
- **Retry** re-applies the current step without moving; **Restart** returns to step one.
- Ask answers carry their as-of date and data revision.

## Limitations

- Persistence is browser `localStorage` only; clearing browser data removes runtime workspaces.
- Ask EA360 is a deterministic, pattern-based prototype assistant answering from the active workspace; it is not a language model.
- A runtime clone of a starter is classified like any other workspace, but free-text tenant-name detection only knows the four seed names.
