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
npm test         # Vitest (existing domain / tenant / AI suites — not a Phase 6 gate)
npx vite-node scripts/validateTenants.mjs   # pack + relationship validation
```

## Current scope (Phase 6)

- Four synthetic tenants: GRA, Bank of Ghana, Fidelity Bank Ghana, Acme Enterprise Group
- Demo landing, guided executive / architecture / transformation journeys, presentation mode
- Organisation switcher with per-tenant isolated session state (persist key ea360-prototype-v6)
- Executive Report with Print / Save as PDF (browser print)
- Ask EA360 (deterministic, active-tenant grounded); AI suggests → evidence → human validation
- Demo reset with confirmation; Netlify-ready static deploy (`netlify.toml`)

See `DEMO_RUNBOOK.md`, `RELEASE_CHECKLIST.md`, `IMPLEMENTATION_STATUS.md`, `TENANT_MODEL.md`, `DEMO_SCENARIOS.md`, and the other model docs.

No backend, authentication, external LLM, or live institutional data in this prototype.
Do not publish the site publicly without product-owner approval.
