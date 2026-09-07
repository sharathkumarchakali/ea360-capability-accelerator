# EA360 Tenant Model

**Product:** EA360 — Enterprise Intelligence and Transformation Governance  
**Phase:** 6 — Demo readiness (model established in Phase 5)  
**Source of truth:** `src/domain/tenants/config.ts`, `src/data/tenants/*`, `src/state/prototypeStore.ts`  
**Last updated:** 7 September 2026  

---

## Purpose

EA360 runs **one product engine** for all organisations. Tenant differences live in:

1. **`TenantConfig`** — presentation metadata (roles, terminology, default scenario, disclaimer, accent)  
2. **`TenantPack`** — synthetic entity seed (capabilities through initiatives, scenarios, audit history), validated by Zod + reference checks  

Configs are separate from packs (`src/domain/tenants/config.ts` vs `src/data/tenants/*/pack.ts`). Feature components are never forked per tenant.

---

## Registered tenants

| Code | Display name | Short | Lettermark | Tenant id | Default scenario | Accent |
|---|---|---|---|---|---|---|
| `GRA` | Ghana Revenue Authority | GRA | GR | `tenant-gra` | `scenario-identity` | `#0e7c66` |
| `BOG` | Bank of Ghana | BoG | BG | `tenant-bog` | `scenario-bog-payments` | `#1a4a66` |
| `FIDELITY` | Fidelity Bank Ghana | Fidelity | FB | `tenant-fid` | `scenario-fid-customer360` | `#c41e3a` |
| `GENERIC` | Acme Enterprise Group | Acme | AE | `tenant-gen` | `scenario-gen-cx` | `#2d5a87` |

Only codes with both a config and a registered seed pack appear in `listAvailableTenants()` / `listValidatedTenantCodes()`.

Entity id prefixes stay tenant-local (`*-gra-*`, `*-bog-*`, `*-fid-*`, `*-gen-*`). **No cross-tenant data leakage is allowed** — entity ids, findings, evidence, mutations, AI history, and UI slices must not mix across tenants.

---

## `TenantConfig`

Defined in `src/domain/tenants/config.ts` and instantiated per tenant under `src/data/tenants/{gra,bog,fidelity,generic}/config.ts`.

| Field | Role |
|---|---|
| `code` | `TenantCode`: `'GRA' \| 'BOG' \| 'FIDELITY' \| 'GENERIC'` |
| `tenantId` | Stable pack tenant id (e.g. `tenant-gra`) |
| `displayName` / `shortName` / `lettermark` | UI branding |
| `tenantType` / `description` / `geographicContext` / `industry` / `currency` | Context copy |
| `primaryExecutiveRole` / `roleLabels` | Demo role switcher options |
| `businessTerminology` | Domain vocabulary labels |
| `capabilityDomainLabels` | Capability map domain list |
| `defaultScenarioId` | Initial Relationship Explorer scenario |
| `defaultReportingPeriod` | Cockpit / report period label |
| `enabledFeatures` | Feature flags for the shell |
| `syntheticDisclaimer` | Banner text (always show) |
| `accentColor` | CSS accent (`--tenant-accent`) |
| `storyline` | Narrative for demos |
| `suggestedQuestions` | Ask EA360 prompt chips |

`DEFAULT_SYNTHETIC_DISCLAIMER` (domain default):

> Synthetic demonstration data - not supplied or validated by the named institution.

Each tenant overrides with institution-specific wording via `syntheticDisclaimer`. Packs also set `tenant.synthetic: true` in the Zod `tenantSchema`.

---

## `TenantPack` isolation

`TenantPack` (`src/domain/schemas`) is the full synthetic graph: tenant metadata, strategic objectives, capabilities, processes, applications, integrations, data objects, technologies, evidence, findings, recommendations, decisions, initiatives, KPIs, relationships, scenarios, and audit history.

| Path | Role |
|---|---|
| `src/data/tenants/registry.ts` | Maps each `TenantCode` → config + pack module |
| `src/data/tenants/{gra,bog,fidelity,generic}/` | `config.ts`, `pack.ts`, `scenarios.ts`, integrations, governance enrichment |
| `src/data/repositories/tenantRepository.ts` | Seed factories, enrichment, cache, `loadTenantPack`, `createTenantRepository` |
| `src/data/validators/validateTenant.ts` | `validateTenantPack` gate |

Isolation rules:

1. Repositories and Ask EA360 read **only the active tenant working pack**.  
2. Switching tenants must change organisation structure, terminology, capabilities, applications, findings, recommendations, KPIs, charts, and narrative — not merely logo/name.  
3. AI refuses queries that compare or name another registered tenant while one is active (`cross_tenant_refused`), with an exception when the named tenant **is** the active one.  
4. Seed packs must not share entity ids across tenants; every entity’s `tenantId` matches its pack.

---

## Persistence — `ea360-prototype-v5`

Zustand store: `src/state/prototypeStore.ts`, middleware persist name:

```text
ea360-prototype-v5
```

Persisted (via `partialize`):

- `tenantCode`
- `workingPacks` — per-code mutated packs
- `tenantSlices` — per-code UI slices (filters, mutations, scenario, AI history, etc.), including the active slice at hydrate time
- Active flattened UI fields (`view`, `role`, `filters`, `workingPack`, scenario/graph settings, AI drafts, …)

Use a new persist key when the persisted shape is intentionally incompatible with prior demos.

---

## Store actions

### `switchTenant(code)`

1. No-op if `code` equals the active `tenantCode`.  
2. Capture the current UI slice; stash the current `workingPack` into `workingPacks[active]`.  
3. Load `workingPacks[code]` or seed via `loadTenantPack(code, { bypassCache: true })`.  
4. Restore that tenant’s `tenantSlices[code]` or build defaults from `TenantConfig`.  
5. Clear `selectedEntity`, close Ask, and avoid carrying graph root / nav context across tenants.

Prior-tenant mutations remain in that tenant’s slice/pack and are restored on switch-back.

### `resetDemo()`

- Reseeds **only the active tenant** from seed (`loadTenantPack` + default slice).  
- Removes that code’s entry from `tenantSlices`.  
- Leaves other tenants’ `workingPacks` / slices intact.  
- Returns view to Executive Cockpit.

### `resetAllTenants()`

- Clears tenant cache, **all** `tenantSlices`, and non-active working packs.  
- Reloads **GRA** as the active tenant with a fresh seed pack.  
- Use between audiences when a full clean slate is required.

---

## Synthetic disclaimer

- Always visible in the shell (`SyntheticBanner` / equivalent).  
- Copy comes from `TenantConfig.syntheticDisclaimer` (per-tenant).  
- Do **not** imply that GRA, BoG, Fidelity Bank Ghana, or Acme supplied or validated the data.  
- Pack-level `tenant.synthetic` is literally `true` and enforced by schema.

---

## UI wiring (config-driven)

- **Topbar** — tenant selector (confirm when mutations exist), role picker, reset demo / reset all.  
- **SyntheticBanner** — disclaimer + lettermark.  
- **App** — accent from `accentColor`.  
- **Suggested questions / storyline** — from active `TenantConfig`.  
- **Scenarios** — from active pack (`DEMO_SCENARIOS.md`).

---

## Extending with a new tenant

1. Add the code to `TenantCode` in `src/domain/tenants/config.ts`.  
2. Create `src/data/tenants/<slug>/` with `config.ts`, `pack.ts`, scenarios, tests.  
3. Register in `registry.ts` and the repository seed factory.  
4. Extend AI tenant-mention patterns so cross-tenant refusal covers the new aliases.  
5. Document scenarios in `DEMO_SCENARIOS.md`.

---

## Verification

- `src/data/tenants/tenantIsolation.test.ts` — switch, restore, `resetDemo`, `resetAllTenants`, AI refusal, prefix hygiene  
- Per-tenant `*Pack.test.ts` — Zod + volume / scenario id expectations  
- Persist key and isolation behaviour documented above must hold for customer demos  

**Hard rule:** no cross-tenant data leakage — not in UI selection, not in working packs, not in AI evidence ids, not in persisted slices.
