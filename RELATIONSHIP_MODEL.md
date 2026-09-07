# EA360 Relationship Model

Typed enterprise relationships connect objects in the tenant pack. UI never invents edges — the Relationship Explorer and curated integration topology read `pack.relationships` and integration source/target fields through the repository.

Implementation: `src/domain/relationships/types.ts`, `src/domain/metrics/graph.ts`, `src/data/repositories/tenantRepository.ts`

---

## Relationship record

```ts
EnterpriseRelationship {
  id, tenantId,
  sourceId, sourceType,
  targetId, targetType,
  relationshipType,
  description?, criticality?, evidenceIds
}
```

Edges are directed as stored. Traversal may walk upstream, downstream, or both.

---

## Relationship types

| Type | Typical use |
|---|---|
| `supports` | Integration / app supports a capability |
| `realizes` | Realisation of strategic intent |
| `uses` | Capability or process uses an application |
| `integrates` | Application participates in an integration |
| `exchanges` | Integration / app exchanges a data object |
| `stores` | Application stores a data object |
| `runs-on` | Application runs on technology |
| `evidences` | Evidence linked to a finding or object |
| `addresses` | Recommendation / initiative addresses a finding |
| `implements` | Initiative implements a recommendation |
| `measures` | KPI measures an objective / capability |
| `depends-on` | Hard dependency between objects |
| `owns` | Ownership link |
| `creates-risk-for` | Finding creates risk for an object |
| `delivered-through` | Outcome delivered through an initiative |
| `executes` | Process executes against systems |
| `decides` | Decision records ARB outcome on a recommendation |

---

## Graph construction

### Neighbourhood (`buildNeighbourhoodGraph`)

1. Start at a root entity (`graphRoot` or scenario `startingEntityId`).
2. Expand `depth` hops (1–3 in UI).
3. Apply `direction`: `downstream` follows source→target; `upstream` follows target→source; `both` does either.
4. Optionally filter neighbour **entity types**.
5. Deduplicate relationships before walk; skip duplicate edge keys.
6. Cap visible nodes (`maxNodes`, default 28) to avoid hairballs.

### Impact (`analyseImpact`)

Deterministic BFS from the same root:

| Level | Depth |
|---|---|
| Direct | 1 |
| Indirect | 2 |
| Potential | 3+ (within `maxDepth`) |

Roll-ups: affected capabilities, affected applications, critical/high dependencies, linked finding ids.

### Integration topology (curated)

Scenario `topologyFocusIntegrationIds` drive a simplified landscape: applications as nodes, focus integrations as edges (P2P styled distinctly). This is narrative-curated, not a full hairball of all 32 interfaces.

---

## Repository resolution

`resolveGraphNode(id)` maps any known entity id to `{ id, type, name, criticality?, status? }` for capabilities, applications, integrations, processes, data objects, technologies, findings, evidence, recommendations, **decisions**, initiatives, KPIs, and strategic objectives.

`relationshipsFor(entityId)` returns incident edges for the side panel.

---

## Scenarios

`GraphScenario` records (GRA pack) provide:

- Starting entity for the explorer
- Visible entity set (demo narrative scope)
- Topology focus integration ids
- Summary, key risk, recommended action
- Linked finding / evidence / capability context

Default demo scenario: `scenario-identity`.

Phase 3 also seeds governed journey scenarios (Unified Taxpayer View, Payment Confirmation Resilience, Revenue Assurance Automation) via findings → recommendations → decisions → initiatives → KPIs. See `WORKFLOW_MODEL.md`.

---

## Integrity rules

- Every `sourceId` / `targetId` must resolve to a known pack entity (validated at seed load), including **decisions**.
- Duplicate logical edges are collapsed before metrics and UI traversal.
- Phase 3 may mutate working-pack entities (workflow status, initiatives) via Zustand; seed relationships remain curated. Demo reset restores the enriched seed.
