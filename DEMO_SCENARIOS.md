# EA360 Demo Scenarios

**Product:** EA360 — Enterprise Intelligence and Transformation Governance  
**Phase:** 6 — Demo readiness  
**Source of truth:** `src/data/tenants/*/scenarios.ts` + `src/data/tenants/*/config.ts`  
**Last updated:** 7 September 2026  

Each registered tenant ships **three** graph scenarios for Relationship Explorer and narrative demos. Scenario ids below match the codebase exactly.

## Demo journeys (blueprint §16)

| Journey | Duration | Focus |
|---|---|---|
| **Executive** | ~5 min | Enterprise health, top risks, priority insight, value vs decision, executive briefing |
| **Architecture** | ~10 min | Capability heatmap, high-risk capability, apps/APIs/data/tech trace, finding + evidence, recommendation for decision |
| **Transformation** | ~10 min | Approved recommendation → initiative, dependencies/objectives, roadmap placement, KPI / risk reduction |

Scenarios mark which journeys they best support. Most chains can serve all three if time allows; the tags below are the intended demo emphasis.

**Always state the synthetic disclaimer** before diving into named-institution themes (`TenantConfig.syntheticDisclaimer`).

---

## GRA — Ghana Revenue Authority

| Field | Value |
|---|---|
| Code | `GRA` |
| Tenant id | `tenant-gra` |
| Default scenario | `scenario-identity` |
| Storyline | Improve revenue assurance, taxpayer experience and interoperability across tax and customs services |

### `scenario-identity` — Taxpayer Identity Fragmentation

| | |
|---|---|
| **Key risk** | Divergent taxpayer masters and cascading channel outages when any P2P identity path fails. |
| **Summary** | Taxpayer identity is exchanged through multiple inconsistent interfaces across portal, contact centre, customs and overlapping TIN stores. |
| **Finding / action** | `find-gra-02` → Consolidate identity access onto TaxpayerIdentityAPI via the Integration Hub. |
| **Journeys** | Executive · Architecture · Transformation |

**Talking points**

- Start on Executive Cockpit: fragmented identity shows up as concentrated channel / interoperability risk.
- In Relationship Explorer, walk portal → contact centre → customs identity paths and overlapping TIN stores.
- Emphasise reusable **TaxpayerIdentityAPI** via the hub versus brittle point-to-point links.
- Close with Ask EA360 on identity risk, then an executive briefing that cites evidence (`ev-gra-01`, `ev-gra-02`, `ev-gra-05`).

### `scenario-payment` — Payment Confirmation Dependency

| | |
|---|---|
| **Key risk** | Failure of PaymentAdviceAPI or the confirmation event bus delays posting and assurance visibility. |
| **Summary** | Payment confirmation depends on a critical chain from channels through the payments gateway into Domestic Tax Core and event subscribers. |
| **Finding / action** | `find-gra-03` → Protect PaymentAdviceAPI SLO and expand reusable payment confirmation consumers via the hub. |
| **Journeys** | Executive · Architecture |

**Talking points**

- Show payment confirmation as a single critical dependency chain (channels → gateway → Domestic Tax Core → events).
- Architecture beat: topology focus on `PaymentAdviceAPI` and confirmation bus integrations.
- Link delayed posting to revenue-assurance visibility for the executive audience.
- Ask: what fails if PaymentAdviceAPI or the event bus drops during peak filing?

### `scenario-assurance` — Revenue Assurance Reconciliation

| | |
|---|---|
| **Key risk** | Multi-day leakage detection lag and unmonitored extracts create audit exposure. |
| **Summary** | Revenue-assurance reconciliation still relies on batch and manual extracts into spreadsheet workbenches. |
| **Finding / action** | `find-gra-03` → Replace spreadsheet extracts with automated matching subscribed to payment confirmation events. |
| **Journeys** | Executive · Transformation |

**Talking points**

- Contrast spreadsheet workbenches with event-subscribed automated matching.
- Transformation beat: recommendation → initiative on the roadmap with KPI / leakage lag reduction.
- Tie assurance lag to audit exposure and incomplete evidence on critical findings.
- Good close for “Understand → Diagnose → Decide → Transform → Measure.”

---

## BoG — Bank of Ghana

| Field | Value |
|---|---|
| Code | `BOG` |
| Tenant id | `tenant-bog` |
| Default scenario | `scenario-bog-payments` |
| Storyline | Strengthen regulatory oversight, operational resilience, data governance and EA operationalisation |

### `scenario-bog-lineage` — Regulatory Data Lineage

| | |
|---|---|
| **Key risk** | Conflicting regulatory metrics and delayed supervisory interventions when lineage breaks across Legacy Returns Intake, Off-site Returns Engine and shadow BI. |
| **Summary** | Supervisory and statistical returns arrive through overlapping intake channels with inconsistent definitions, incomplete lineage into the data lake, and parallel analytics products. |
| **Finding / action** | `find-bog-01` → Establish a governed regulatory data product catalogue with mandatory lineage from intake through certified supervisory datasets. |
| **Journeys** | Executive · Architecture · Transformation |

**Talking points**

- Overlapping returns intake + shadow BI → conflicting supervisory metrics.
- Architecture: lineage break across Legacy Returns Intake, Off-site Returns Engine, and the lake.
- Transformation: governed data-product catalogue with mandatory lineage to certified datasets.
- Suggested Ask: “Where is regulatory reporting data lineage incomplete?”

### `scenario-bog-payments` — Payment-System Resilience *(default)*

| | |
|---|---|
| **Key risk** | Prolonged settlement halt or opaque recovery if RTGS Core, SWIFT Gateway or unmonitored P2P settlement advice paths fail during peak windows. |
| **Summary** | RTGS settlement, SWIFT messaging and retail-payments oversight form a critical dependency chain with limited failover monitoring and aging middleware. |
| **Finding / action** | `find-bog-04` → Harden RTGS and SWIFT settlement paths with monitored failover, dead-letter handling and Architecture Review Board resilience gates. |
| **Journeys** | Executive · Architecture |

**Talking points**

- Lead with settlement halt / opaque recovery as the executive scare story.
- Trace RTGS Core → SWIFT Gateway → unmonitored P2P settlement advice.
- Call out aging middleware and missing failover monitoring.
- Architecture Review Board resilience gates as the governance punchline.

### `scenario-bog-governance` — Architecture Governance Operationalisation

| | |
|---|---|
| **Key risk** | Unreviewed architecture decisions lock in brittle integrations and extend exposure on Legacy Returns Intake and aging RTGS middleware. |
| **Summary** | Major change programmes reach implementation before Architecture Review Board engagement; end-of-support stacks and weak repository coverage undermine design assurance. |
| **Finding / action** | `find-bog-07` → Mandate early ARB gates for critical programmes, link every initiative to capabilities, and retire or wrap end-of-support platforms on a governed roadmap. |
| **Journeys** | Architecture · Transformation |

**Talking points**

- Late ARB engagement = brittle integrations locked in before design assurance.
- Show Architecture Repository / Transformation Portfolio Tracker gaps and EOS stacks.
- Transformation: early ARB gates + mandatory initiative–capability linkage on funding.
- Suggested Ask: “How many architecture reviews occurred after delivery started?”

---

## Fidelity — Fidelity Bank Ghana

| Field | Value |
|---|---|
| Code | `FIDELITY` |
| Tenant id | `tenant-fid` |
| Default scenario | `scenario-fid-customer360` |
| Storyline | Digital customer growth, API-led channels, simplified lending across retail and SME |

### `scenario-fid-customer360` — Customer 360 & Digital Onboarding Duplication *(default)*

| | |
|---|---|
| **Key risk** | Regulatory KYC gaps and poor cross-sell insight when Branch Onboarding Suite, Digital Onboarding Portal and legacy CRM each create independent CIF numbers. |
| **Summary** | Retail and digital onboarding channels maintain parallel customer profiles without a governed golden record, causing KYC rework and inconsistent party identifiers across CRM, core banking and mobile wallet enrolment. |
| **Finding / action** | `find-fid-01` → Establish a governed Customer 360 golden record with mandatory match-and-merge before account opening across branch and digital channels. |
| **Journeys** | Executive · Architecture · Transformation |

**Talking points**

- Parallel CIFs across branch, digital portal, and legacy CRM = KYC rework and weak cross-sell.
- Architecture: party identifiers diverge across CRM, core banking, and wallet enrolment.
- Transformation: golden record with mandatory match-and-merge before account opening.
- Suggested Ask: “Where do branch and digital onboarding create duplicate customer records?”

### `scenario-fid-api` — API-Led Channel Modernisation

| | |
|---|---|
| **Key risk** | Channel outages and slow feature delivery when Mobile Banking App, USSD Gateway and Agency POS each maintain bespoke core integrations without monitoring or reuse. |
| **Summary** | Mobile banking, USSD gateway and agency banking interfaces connect to core banking through overlapping point-to-point paths while the Enterprise API Hub facades remain Planned. |
| **Finding / action** | `find-fid-04` → Prioritise hub-mediated account and payment APIs with monitoring, throttling and a staged retirement of critical P2P channel integrations. |
| **Journeys** | Architecture · Transformation · Executive |

**Talking points**

- Mobile / USSD / agency each own bespoke core links while the API Hub is still Planned.
- Architecture: P2P sprawl vs monitored, throttled hub-mediated account and payment APIs.
- Executive: channel outages and slow feature delivery from unreused integrations.
- Suggested Ask: “Which mobile and USSD integrations bypass the API hub?”

### `scenario-fid-lending` — Lending Process Simplification

| | |
|---|---|
| **Key risk** | Extended time-to-yes and policy breaches when credit analysts re-key facility terms and collateral data across Origination Portal, Core Lending and offline approval packs. |
| **Summary** | Retail and SME lending journeys span Loan Origination Portal, Credit Workbench and spreadsheet trackers with manual document handoffs and duplicated credit policy checks. |
| **Finding / action** | `find-fid-07` → Consolidate lending origination onto a single workflow with embedded policy rules, digital document vault handoffs and straight-through booking to core lending. |
| **Journeys** | Transformation · Executive |

**Talking points**

- Manual handoffs and spreadsheet trackers stretch SME time-to-yes beyond policy targets.
- Transformation: single origination workflow, embedded policy, straight-through booking.
- Executive: policy-breach risk from re-keyed facility and collateral data.
- Suggested Ask: “What lending handoffs extend SME credit turnaround beyond policy targets?”

---

## Generic — Acme Enterprise Group

| Field | Value |
|---|---|
| Code | `GENERIC` |
| Tenant id | `tenant-gen` |
| Default scenario | `scenario-gen-cx` |
| Storyline | Multi-division CX unification, portfolio simplification, and data-platform consolidation |

### `scenario-gen-cx` — Customer Experience Fragmentation *(default)*

| | |
|---|---|
| **Key risk** | Conflicting customer metrics and degraded service when profile data diverges across Customer Portal, Contact Centre CRM, Mobile Backend, and legacy intake paths. |
| **Summary** | Customer profiles and service interactions arrive through overlapping web, mobile, contact-centre, and partner channels with inconsistent definitions and incomplete lineage into the enterprise data lake. |
| **Finding / action** | `find-gen-01` → Establish a governed customer data product catalogue with mandatory lineage from channel intake through certified enterprise datasets. |
| **Journeys** | Executive · Architecture · Transformation |

**Talking points**

- Industry-neutral opener: multi-channel profile divergence without accusing a real brand.
- Architecture: incomplete lineage from channel intake into the enterprise lake.
- Executive: conflicting customer metrics and degraded service quality.
- Suggested Ask: “Where does customer profile data diverge across channels?”

### `scenario-gen-simplify` — Application Portfolio Simplification

| | |
|---|---|
| **Key risk** | Sustained duplication spend and brittle change paths if Contact Centre CRM, Service Desk Platform, and Spreadsheet Analytics remain unconsolidated. |
| **Summary** | Overlapping CRM, service-desk, and marketing platforms duplicate capability coverage while legacy intake and unmediated point-to-point integrations increase change cost. |
| **Finding / action** | `find-gen-04` → Rationalise overlapping customer-service and analytics applications with a governed retire/migrate plan and hub-mediated interfaces. |
| **Journeys** | Architecture · Transformation · Executive |

**Talking points**

- Overlapping CRM / service-desk / marketing = duplication spend and brittle change.
- Architecture: unmediated P2P and legacy intake on critical paths.
- Transformation: retire/migrate plan with hub-mediated interfaces.
- Suggested Ask: “Which CRM and service-desk applications overlap in capability coverage?”

### `scenario-gen-data` — Data Platform & Analytics Fragmentation

| | |
|---|---|
| **Key risk** | Executive decisions based on conflicting revenue and customer metrics when Spreadsheet Analytics and lake bypass paths publish parallel KPIs. |
| **Summary** | Enterprise analytics consumers pull from certified lake products, shadow spreadsheet tools, and ungoverned bypass loads — weakening a single source of truth for group KPIs. |
| **Finding / action** | `find-gen-07` → Mandate certified data products for group KPIs, retire shadow analytics extracts, and block ungoverned lake bypass loads. |
| **Journeys** | Executive · Architecture · Transformation |

**Talking points**

- Spreadsheet Analytics + lake bypass = parallel KPIs and no single source of truth.
- Executive: decisions on conflicting revenue and customer metrics.
- Transformation: certified data products; block ungoverned bypass loads.
- Suggested Ask: “How many analytics platforms publish the same revenue KPIs?”

---

## Suggested fifteen-minute multi-tenant path

1. **GRA / `scenario-identity`** — Executive Cockpit → critical finding → evidence → Ask EA360 briefing (**executive**).
2. Switch to **BoG / `scenario-bog-payments`** — confirm disclaimer, lettermark, and accent change; RTGS/SWIFT dependency (**architecture**).
3. Switch to **Fidelity / `scenario-fid-customer360`** — golden-record / KYC story; note prior-tenant mutations remain isolated.
4. Switch to **Acme / `scenario-gen-simplify`** — portfolio rationalisation (**transformation** beat if time).
5. **`resetDemo()`** on the active tenant (or **`resetAllTenants()`** → GRA) before the next audience.

See `TENANT_MODEL.md` for isolation, persistence (`ea360-prototype-v5`), and reset semantics.
