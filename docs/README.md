# Docs

Reconstructed 2026-08-24 by reverse-engineering the shipped app — the
original project handoff bundle referenced in the root `README.md` (PRD, tech
spec, UV mapping spec, UX requirements, QA plan) isn't present in this repo.

- **[PRD.md](./PRD.md)** — what the product is, who it's for, full feature
  inventory as shipped, explicit non-goals
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — how the code is put together:
  the canonical-texture discipline, UV mapping, state, canvas rendering, 3D
  preview, auto-design, persistence
- **[ROADMAP.md](./ROADMAP.md)** — shipped vs. next vs. backlog, kept honest
  about what's actually committed vs. just discussed
- **[AI_PLAN_NOTES.md](./AI_PLAN_NOTES.md)** — deep dive on the AI Plan
  feature specifically: current implementation, ideas for improving result
  quality, and the custom-instructions plan agreed with Mike but not yet built

These are living docs, not a frozen spec — update them as decisions get made
instead of letting them drift out of sync with the code.
