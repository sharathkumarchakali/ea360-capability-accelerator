# EA360 Metric Definitions

All dashboard metrics are derived from tenant records. Values must never be hard-coded in UI components.

Implementation: `src/domain/metrics/index.ts`, `src/domain/metrics/portfolio.ts`

---

## Phase 1A executive metrics

### Enterprise health (0–100)

Weighted blend:

| Factor | Weight | Source |
|---|---:|---|
| Architecture maturity | 40% | Mean capability maturity scaled 1–5 → 0–100 |
| Inverse critical-risk pressure | 30% | `1 - min(1, criticalFindings / totalFindings)` → 0–100 |
| Application health | 20% | Mean application technical health scaled 1–5 → 0–100 |
| Transformation progress | 10% | Mean initiative progress % |

### Strategic alignment (0–100)

Average of KPI attainment ratios:

- Higher-better: `current / target` (clamped 0–1)
- Lower-better: `target / current` (clamped 0–1)

### Architecture maturity (1–5)

Mean of `capability.maturityCurrent`.

### Critical-risk count

Count of findings where `severity === 'critical'` and status is `open`, `in_progress`, or `accepted`.

### Application health (1–5)

Mean of `application.technicalHealth` for applications with `status === 'active'`.

### Transformation progress (0–100)

Mean of `initiative.progressPercent`.

---

## Phase 1B capability heatmap

Mode value for each capability (shown with text band Strong/Moderate/Weak or High/Medium/Low):

| Mode | Formula |
|---|---|
| Current maturity | `capability.maturityCurrent` (1–5) |
| Risk exposure | `capability.riskScore` (0–5) |
| Strategic importance | `capability.strategicImportance` (1–5) |
| Application support | Mean `technicalHealth` of applications where `supportedCapabilityIds` includes the capability; **1** if none |
| Investment priority | `capability.investmentPriority` (1–5) |

Current vs target maturity is shown as `maturityCurrent → maturityTarget` on each cell.

---

## Phase 1B TIME classification

`classifyTIME(application, ctx)` — **first matching rule wins**:

1. **Eliminate** if:
   - `lifecycle === 'eliminate'`, OR
   - `businessValue <= 2.5` AND `technicalHealth <= 2.5`, OR
   - `strategicAlignment <= 2` AND `businessValue <= 3` AND `technicalHealth < 3`
2. **Migrate** if:
   - `lifecycle` is `migrate` or `legacy`, OR
   - `endOfSupportDate` within **18 months** of evaluation date, OR
   - `businessValue >= 3.5` AND `technicalHealth < 3`, OR
   - `duplicationClusterId` set AND `technicalHealth < 3.2` AND `businessValue >= 3`, OR
   - point-to-point integration count for the app `>= 3` AND `technicalHealth < 3.2`
3. **Invest** if:
   - `lifecycle` is `invest` or `strategic`, OR
   - `businessValue >= 4` AND `technicalHealth >= 3.2` AND `strategicAlignment >= 3.5`
4. **Tolerate** — default for remaining applications

Point-to-point counts come from integrations with `pattern === 'point-to-point'` touching the application as source or target.

### TIME distribution summary

- Application count per TIME class
- Indicative cost exposure = sum of cost-band weights (`low=1`, `medium=2`, `high=3`, `very-high=4`)
- Critical/high applications listed per class
- Recommended action label derived from TIME class

### Bubble chart encoding

| Visual | Field |
|---|---|
| X | `technicalHealth` (1–5) |
| Y | `businessValue` (1–5) |
| Size | `costBandWeight * 12 + userReach * 4` |
| Colour | Derived TIME class |

---

## Phase 1B portfolio insights

| Insight | Rule |
|---|---|
| Duplication clusters | Applications sharing the same `duplicationClusterId` (size ≥ 2) |
| End-of-support | `endOfSupportDate` within 24 months |
| High-cost / low-value | Cost band `high` or `very-high` AND `businessValue <= 3` |
| Weak critical | Criticality `critical` or `high` AND `technicalHealth < 3` |
| Heavy P2P | ≥ 3 point-to-point integrations |

---

## Phase 2 integration metrics

Implementation: `src/domain/metrics/integration.ts`

### Classification helpers

| Helper | Rule |
|---|---|
| Point-to-point | `pointToPoint === true` **OR** `reusabilityStatus === 'point-to-point'` **OR** `pattern === 'point-to-point'` |
| Reusable API | `reusabilityStatus === 'reusable'` **AND** (`integrationType === 'REST API'` **OR** `pattern === 'api'`) |
| Active integration | `lifecycleStatus` in `Active`, `Restricted` **OR** legacy `status === 'active'` |
| Missing owner | Business or technology owner blank / `unassigned` / `person-unknown` (also checks legacy `ownerId`) |

### Integration risk score (0–100)

Weighted blend (rounded to 1 decimal):

| Factor | Weight | Scale |
|---|---:|---|
| Criticality | 30% | critical=1, high=0.75, medium=0.4, low=0.15 |
| Point-to-point | 20% | 1 if P2P else 0 |
| Documentation gap | 15% | missing=1, partial=0.5, documented=0 |
| Monitoring gap | 15% | unmonitored=1, partial=0.5, monitored=0 |
| Lifecycle pressure | 10% | Deprecated/Retiring=1, Restricted=0.5, else 0 |
| Missing owner | 10% | 1 if ownership gap else 0 |

### Portfolio roll-ups (`deriveIntegrationMetrics`)

| Metric | Formula |
|---|---|
| Total / active | Count of integrations / active subset |
| Reusable API count | Count matching reusable-API helper |
| API reuse rate (%) | `reusable / total × 100` (1 decimal) |
| Point-to-point count / % | Count matching P2P helper / share of total |
| Critical / high | `criticality` in `critical`, `high` |
| Deprecated | `lifecycleStatus` in `Deprecated`, `Retiring` |
| Unmonitored / undocumented | `monitoringStatus === 'unmonitored'` / `documentationStatus === 'missing'` |
| Missing owners | Count with ownership gap |
| High-dependency | `consumerCount >= 3` (default threshold) |
| Average integration risk | Mean of per-interface risk scores |

### Concentration & distribution

- **By application** — source + target incidence per application, sorted desc
- **By capability** — incidence via `supportedCapabilityIds`
- **By protocol / type** — histogram of `protocol` / `integrationType`
- **Criticality × lifecycle** — cross-tab counts

### Insights (`topIntegrationInsights`)

Up to three decision cards with filter payloads when thresholds fire (P2P ≥ 30%, any unmonitored, any deprecated/retiring, reuse &lt; 40%, any missing owner).

---

## Phase 2 graph / impact metrics

Implementation: `src/domain/metrics/graph.ts` · model notes: `RELATIONSHIP_MODEL.md`

| Function | Behaviour |
|---|---|
| `uniqueRelationships` | Deduplicate by `sourceId\|targetId\|relationshipType` |
| `buildNeighbourhoodGraph` | BFS from root for `depth` hops; respects direction and optional entity/relationship type filters; caps at `maxNodes` (default 28) |
| `analyseImpact` | BFS impact: depth 1 = **direct**, depth 2 = **indirect**, deeper = **potential**; returns affected capability/application counts, critical deps, finding ids |
| `shortestRelationshipPath` | Undirected shortest path between two entity ids |
| `validateNoOrphanRelationships` | Relationships whose endpoints are not in the known-id set |

---

## Phase 3 workflow metrics

Implementation: `src/domain/workflow/scoring.ts` · rules: `WORKFLOW_MODEL.md`

| Metric | Formula / rule |
|---|---|
| Finding risk score | `likelihood (1–5) × impactScore (1–5)` → 1–25 |
| Severity from risk | ≥20 critical, ≥12 high, ≥6 medium, else low |
| Evidence item confidence | Base + reliability + freshness + verification adjustments (0–100) |
| Finding confidence | Mean confidence of linked evidence; **15** if none |
| Insufficient evidence | No evidence, or all linked items unverified/stale/disputed/missing |
| Initiative blocked | Any `dependsOnInitiativeIds` incomplete |

Value language: use **indicative bands** (e.g. “GHS 10–20 million, subject to validation”), never guaranteed precision.

---

## Phase 4 AI confidence

Implementation: `src/lib/ai/confidence.ts` · model: `AI_ASSISTANCE_MODEL.md`

Confidence score starts at **50** and adjusts:

| Factor | Adjustment |
|---|---|
| Verified evidence | + up to 25 (≈ +8 each) |
| Disputed evidence | −12 each |
| Stale evidence | −8 each |
| Unverified evidence | −4 each |
| No evidence | −25 |
| High / low data quality | + up to 10 / −5 per low |
| Metric complete / incomplete | +5 / −10 |
| Relationship coverage vs expected | + up to 10 |
| Explicit assumptions | −5 each (cap −20) |
| Conflicting evidence | −15 |

Bands: **high** ≥ 72, **medium** ≥ 45, else **low**.  
Deterministic — never random. Always accompanied by a reason string.
