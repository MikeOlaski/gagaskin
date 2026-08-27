# Roadmap

Reconstructed 2026-08-24. Reflects what's actually shipped vs. what's been
discussed but not built, not an original product plan. Update this as
priorities change — it decays fast otherwise.

## Shipped (V1)

Exploded UV editor with all 36 faces, full paint tool set (select/pencil/
eraser/fill/eyedropper/hand), undo/redo, mirror + flip, free-floating pan/zoom,
reference image import + palette extraction + fit-to-face, deterministic
auto-map, AI plan (Lovable AI Gateway), PNG import/export, live 2D + 3D
previews (3D with fullscreen), Supabase-backed projects with auth, focus mode,
tool keyboard shortcuts, full-bleed responsive layout.

## Next up

Roughly in priority order — nothing here is committed/scheduled, this is a
backlog ordered by best current guess at impact vs. effort.

1. **Canvas view keyboard shortcuts** — center view, zoom to 100%, zoom to
   fit, keyboard zoom in/out. (In progress as of this doc's creation.)
2. **AI plan: custom instructions** — append/override toggle on the system
   prompt, persisted globally. Fully scoped in `docs/AI_PLAN_NOTES.md`,
   not yet built.
3. **AI plan quality investigation** — input image resolution/format,
   structured-output support, few-shot examples, deterministic symmetry
   post-pass. See `docs/AI_PLAN_NOTES.md` "What might improve results."
4. **Payments** — no provider is connected today. Prices are published on
   `/pricing` (see `docs/PRICING_RESEARCH.md`) but nothing charges. Sequence
   and requirements are in `docs/MONETISATION.md`; needs a Pro plan and an
   entitlements table before the AI plan can be gated.
5. **Per-face AI regeneration** — fix one bad face without re-rolling the
   whole plan.

## Later / under-considered

Real gaps, not yet prioritized:

- **Alex (slim-arm) skin variant support** — the app currently hardcodes
  classic 4px arms. Slim-arm (3px) skins are common enough that this is a
  real gap, not a nice-to-have; would touch `faceRegistry.ts`,
  `ModelPreview3D.tsx` geometry, and export.
- **Brush size / shape tools** — currently strictly 1px pencil/eraser; no
  line, rectangle, or circle tool, no adjustable brush size.
- **Rectangular/marquee pixel selection** — "Select" currently selects a
  whole face; a sub-face region selection would enable copy/paste and
  scoped fills within a face.
- **Cape editor** — related asset type, same UV-atlas-editing pattern,
  currently entirely out of scope.
- **Project version history** — saves overwrite; no "restore an earlier
  save" beyond in-session undo/redo.
- **Model selection for AI plan** — is flash-tier good enough, or does a
  stronger model materially improve crop precision? Needs measurement
  before a UI decision.
- **Touch/mobile refinement** — layout is responsive but the pan/zoom/paint
  interaction model is mouse-first; touch gestures haven't been
  purpose-built.
- **Sharing/collaboration** — no shareable project links, no multi-user
  editing.

## Explicitly not planned

Called out in `docs/PRD.md` as non-goals — listed here too so "why isn't X on
the roadmap" has one answer: general-purpose pixel-art editor features
(layers, arbitrary canvas size), real-time collaborative editing.
