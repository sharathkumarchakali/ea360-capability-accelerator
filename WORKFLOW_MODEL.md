# EA360 Workflow Model (Phase 3)

Governed transformation journey for the synthetic prototype:

**Finding → Evidence → Recommendation → Architecture Review → Decision → Initiative → Roadmap → KPI**

Implementation: `src/domain/workflow/*`, `src/state/prototypeStore.ts`

---

## Finding status transitions

| From | Allowed to |
|---|---|
| Draft | Under Review, Rejected |
| Under Review | Validated, Rejected, Draft |
| Validated | Accepted, Rejected |
| Accepted | Remediation Planned, Resolved |
| Remediation Planned | Resolved, Accepted |
| Resolved | _(terminal)_ |
| Rejected | Draft |

Invalid transitions throw and do not mutate state.

`EntityBase.status` is kept loosely synced for legacy filters (`draft`, `open`, `accepted`, `in_progress`, `mitigated`, `rejected`).

---

## Evidence verification states

| Status | Meaning |
|---|---|
| unverified | Captured but not confirmed |
| verified | Reviewer accepted reliability |
| disputed | Contested; lowers finding confidence |
| stale | Freshness aged out (or marked stale) |
| missing | Explicit gap |

Freshness bands: `fresh` (≤90 days), `aging` (≤270), `stale` (>270) relative to demo as-of date `2026-09-07`.

Finding confidence (0–100) blends reliability, freshness and verification of linked evidence. Findings with no usable evidence are treated as insufficiently evidenced in the UI.

---

## Recommendation transitions

| From | Allowed to |
|---|---|
| Draft | Ready for Review |
| Ready for Review | Under Review, Draft |
| Under Review | Approved, Rejected, Revision Requested |
| Approved | Converted to Initiative |
| Rejected | Draft |
| Revision Requested | Draft, Ready for Review |
| Converted to Initiative | _(terminal)_ |

**Rule:** An initiative cannot be created from a recommendation unless it is **Approved** (or already Converted). Creating an initiative from an **approved decision** may promote Under Review → Approved → Converted in the same mutation when the decision gate passes.

---

## Decision states

| From | Allowed to |
|---|---|
| Pending | Approved, Approved with Conditions, Rejected, Deferred |
| Approved | Superseded |
| Approved with Conditions | Superseded, Approved |
| Rejected | _(terminal)_ |
| Deferred | Pending, Approved, Approved with Conditions, Rejected |
| Superseded | _(terminal)_ |

Consequential actions use confirmation dialogs in the Governance UI.

**Initiative gate:** Decision must be **Approved** or **Approved with Conditions**.

---

## Initiative creation rules

Required:

1. Approved (or conditionally approved) decision
2. Owner
3. Intended outcome / title
4. At least one objective **or** capability
5. At least one KPI (auto-linked from objectives when omitted by the form)
6. Target period / horizon / quarter

On save:

- Recommendation → Converted to Initiative
- Decision.initiativeId linked
- Initiative added to roadmap horizon
- KPI `linkedInitiativeIds` updated
- Audit event `initiative_created`

---

## Roadmap placement

Horizons: `now` | `next` | `later`  
Optional `targetQuarter` (e.g. `2026-Q4`).

Blocked detection: initiative A is blocked when any `dependsOnInitiativeIds` entry is incomplete (`progressPercent < 100` and status ≠ `completed`).

---

## Audit-event types

| Action | Typical trigger |
|---|---|
| `finding_submitted` / `finding_validated` / `finding_rejected` / `finding_remediation_planned` / `finding_resolved` | Finding workflow |
| `finding_owner_changed` / `finding_target_date_changed` | Finding edits |
| `evidence_verified` / `evidence_disputed` / `evidence_note_added` | Evidence trust |
| `recommendation_submitted` / `recommendation_approved` / `recommendation_rejected` / `recommendation_revision_requested` / `recommendation_comment_added` / `recommendation_sent_to_arb` | Recommendation / ARB |
| `decision_recorded` / `decision_deferred` | ARB decision |
| `initiative_created` | Initiative save |
| `roadmap_placement_changed` | Horizon / quarter move |
| `kpi_progress_updated` | KPI mutation (reserved) |

Each audit record: `action`, `actorRole`, `timestamp`, `entityId`, `entityType`, optional `previousState` / `newState` / `comment`.

---

## Prototype role assumptions

Demo roles (`executive`, `cio`, `enterprise-architect`, `transformation-leader`, `risk-leader`) are **not** enforced as permissions. Any role may execute workflow actions. Actor role is recorded on audit events only.

---

## Invalid transitions

Prevented in pure workflow helpers (`assert*Transition`) and store mutations. UI surfaces `{ ok: false, error }` results; silent status changes are not allowed for consequential decision actions.

---

## Reset behaviour

`resetDemo()`:

- Clears tenant cache
- Reloads Phase 3–enriched GRA seed into `workingPack`
- Clears mutations, selection, filters, explorer prefs
- Restores original findings, evidence, recommendations, decisions, initiatives, KPIs, audit history

Persist key: `ea360-prototype-v3` (includes `workingPack`).
