# PRD — Minecraft Skin Painter (GagaSkin)

Reconstructed 2026-08-24 from the shipped app. The project's original handoff
bundle (PRD, tech spec, UV mapping spec, UX requirements, QA plan) referenced
in `README.md` isn't present in this repo — this document, the roadmap, and
the architecture doc replace it, written from what's actually built rather
than what was originally proposed.

## What it is

A browser-based, pixel-exact editor for classic 64×64 Minecraft skins. Paint
on an "exploded" UV layout (every face of every body part laid flat and
visible at once, instead of a wrapped 3D-only view), with a live 3D preview of
the result. Everything runs client-side against a single canonical 64×64 RGBA
texture; nothing about the editor UI (grids, labels, selection borders) can
ever leak into the exported PNG.

**Live**: https://gagaskin.lovable.app · deploys automatically from `main` via
Lovable.

## Who it's for

Minecraft players and skin creators who want pixel-level control (not a
generic avatar-maker) but don't want to fight a general-purpose pixel editor's
lack of Minecraft-specific UV awareness — independent left/right limbs, exact
face boundaries, correct wrapping.

## Core value proposition

1. **Exact, not approximate.** UV coordinates are transcribed from the
   authoritative Minecraft skin layout (`src/domain/skin/faceRegistry.ts`),
   not eyeballed.
2. **See every face at once.** The exploded layout means you're never
   guessing what's on the back of an arm while looking at the front.
3. **Canonical texture discipline.** The 64×64 buffer is the single source of
   truth; every preview (2D front, 3D model, atlas) is a derived render, never
   the editable surface itself.
4. **Fast paths to a finished skin.** Reference-image import, palette
   extraction, deterministic auto-mapping, and AI-assisted mapping all exist
   alongside manual pixel painting — a user can go from photo to skin in one
   click and then refine by hand, or paint from scratch.

## Feature inventory (as shipped)

### Canvas & painting
- Exploded UV editor, all 36 faces (6 body parts × 6 faces) rendered at once
- Tools: Select, Pencil, Eraser, Fill (flood fill within a face), Picker
  (eyedropper), Hand (pan)
- Color picker + alpha channel
- Undo/redo, up to 100 steps
- Copy-to-opposite-limb (mirror a face onto its left/right counterpart)
- Flip horizontal / flip vertical (per selected face)
- Clear selected face
- Free-floating pan (space+drag, Hand tool, middle-click, scroll) and zoom
  (⌘/Ctrl+scroll, +/− buttons and slider), independent of browser zoom
- Keyboard shortcuts for every tool, undo/redo, and (planned, see roadmap)
  view navigation

### Reference & auto-design
- Reference image upload
- Client-side palette extraction (top 12 colors by frequency)
- Fit reference image onto a selected face (`contain` or `cover`)
- **Auto-map**: deterministic, offline, geometric heuristic — no AI, no
  network call
- **AI plan**: LLM-generated full-skin mapping via Lovable's AI Gateway (see
  `docs/AI_PLAN_NOTES.md` for how it works and what's planned)

### Import/export & previews
- Import an existing 64×64 PNG skin
- Export a clean 64×64 PNG (canonical buffer only)
- Live 2D front preview
- Live interactive 3D model preview (orbit/zoom, nearest-neighbor filtering,
  fullscreen modal)
- Demo skin and orientation-test skin for onboarding/QA

### Projects & accounts
- Supabase-backed auth (email link, `/auth` route)
- Save / save-as-new / open / rename / delete named projects
  (`skin_projects` table: skin PNG, reference image, palette, AI plan, view
  state — RLS-scoped to the owning user)
- Header user menu (avatar, sign out)

### Workspace
- Full-bleed responsive layout, no artificial max-width
- **Focus mode**: hide every side panel, canvas fills the screen, Tools
  becomes a floating draggable palette with its own keyboard-shortcuts drawer

## Explicit non-goals (today)

- Not a general-purpose pixel-art editor (no layers, no arbitrary canvas size)
- No Alex/slim-arm (3px) skin variant — classic 4px arms only
- No cape editor
- No collaborative/multi-user editing
- No mobile-first design target (responsive, but not touch-optimized)

## Tech stack

TanStack Start (React 19, file-based routing) · Vite · TypeScript ·
Tailwind CSS · shadcn/ui (Radix primitives) · Zustand (editor state) ·
react-three-fiber + drei + three.js (3D preview) · Supabase (auth + Postgres,
RLS) · Lovable AI Gateway (AI plan) · Vitest (tests) · deployed via Lovable.

See `docs/ARCHITECTURE.md` for how these fit together.
