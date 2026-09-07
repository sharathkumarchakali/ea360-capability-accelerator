EA360 — Enterprise Intelligence and Transformation Governance
==============================================================

Kulana synthetic demonstration prototype (React + Vite).
Tagline: Know Your Enterprise. Shape What's Next.

## Scripts

```bash
npm install
npm run dev      # local development
npm run build    # production build to dist/
npm run preview  # preview production build
npm test         # Vitest (domain + Phase 1A–5 tenants / AI)
```

## Current scope (Phase 5)

- Four synthetic tenants on one product engine: GRA, Bank of Ghana, Fidelity Bank Ghana, Acme Enterprise Group
- Organisation switcher with per-tenant isolated session state (persist key ea360-prototype-v5)
- Executive Cockpit through Relationship Explorer and governed transformation journey
- Ask EA360 (deterministic, active-tenant grounded, explainable; cross-tenant refused)
- Explain selected insights; impact narratives; AI-assisted recommendation drafts; executive briefing
- AI suggests → Evidence shown → Architect validates → Authority approves → EA360 records
- Reset demo restores the active tenant seed; reset-all clears every tenant and reloads GRA

See `IMPLEMENTATION_STATUS.md`, `TENANT_MODEL.md`, `DEMO_SCENARIOS.md`, `METRIC_DEFINITIONS.md`, `RELATIONSHIP_MODEL.md`, `WORKFLOW_MODEL.md`, and `AI_ASSISTANCE_MODEL.md`.

No backend, authentication, external LLM, or live AI in this prototype.