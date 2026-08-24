# Architecture

Reconstructed 2026-08-24 from the shipped code. Describes what exists, not
what was originally spec'd.

## Stack

- **Framework**: TanStack Start (file-based routing under `src/routes/`,
  server functions via `createServerFn`), React 19, Vite, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI primitives under
  `src/components/ui/`)
- **State**: Zustand, single store (`src/store/editorStore.ts`) for all editor
  state — no React Context, no Redux
- **3D**: react-three-fiber + drei + three.js
- **Backend**: Supabase — Postgres (RLS), Auth (email link)
- **AI**: Lovable AI Gateway, called from a server function, never from the
  client directly
- **Tests**: Vitest, `src/test/`

## The canonical texture

Everything in the editor exists to mutate one value: a `Uint8ClampedArray` of
length `64 * 64 * 4` (RGBA), created and manipulated in
`src/domain/skin/skinBuffer.ts`. This is the single source of truth. Every
other visual — the exploded UV canvas, the 2D front preview, the 3D model
texture, the exported PNG — is a **derived render** of this buffer, never an
editable surface itself. This is deliberate: it means grid lines, face
borders, selection highlights, and atlas coordinate labels drawn in the UV
editor can never contaminate what gets exported or applied to the 3D model.

Key operations in `skinBuffer.ts`: `getPixel`/`setPixel`, `getFacePixels`/
`putFacePixels` (rectangular block copy in/out, used by mirror/flip/flood
fill/AI-plan application), `flipPixelsHorizontal`/`flipPixelsVertical`,
`floodFillFace` (bounded flood fill, never reads/writes outside a face's own
rect even when adjacent atlas texels match).

## UV mapping

`src/domain/skin/faceRegistry.ts` is the authoritative source for where each
of the 36 faces (6 body parts × TOP/BOTTOM/FRONT/BACK/LEFT/RIGHT) lives in the
64×64 atlas — transcribed from Minecraft's classic skin layout, not
approximated. `src/domain/skin/layout.ts` is a *separate* concern: where each
face is positioned in the **exploded editor's** 2D layout (screen-space cell
coordinates), independent of its atlas position. Never conflate the two — a
face's atlas rect and its exploded-editor position are unrelated numbers that
happen to both live in "cell" units.

## Editor state (`editorStore.ts`)

One Zustand store holds: the canonical skin buffer, a monotonic `version`
counter (bumped on every mutation, used as a dependency to force re-renders/
re-uploads of derived textures), selection state, active tool, color/alpha,
undo/redo stacks (capped at 100), the current reference image, extracted
palette, and the current auto-design plan (if any). Every mutation goes
through a `mutate()` helper that clones the buffer, applies a change, and bumps
`version` — consumers never mutate the buffer array in place.

## Canvas rendering & interaction (`UVEditor.tsx`)

The exploded UV view is a single `<canvas>` element, redrawn imperatively
(not via a scene graph) whenever skin/zoom/selection state changes. It is
**free-floating**: panning is implemented via CSS `transform: translate()` on
the canvas element inside an `overflow-hidden` viewport, not native scroll —
this was a deliberate fix (see git history around "free-floating canvas") for
the failure mode where native-scroll panning becomes a no-op once the content
fits inside the viewport (which it usually does on a wide screen). Zoom is
cursor-anchored: a wheel-zoom event stores the cell-space point under the
cursor, changes `cellSize`, then a follow-up effect recomputes pan so that
point stays fixed on screen.

Hit-testing (which face/pixel a click lands on) uses
`canvas.getBoundingClientRect()`, which already reflects the CSS transform —
no separate coordinate-transform math needed for pan/zoom.

## 3D preview (`ModelPreview3D.tsx`)

A react-three-fiber `<Canvas>` renders six boxes (head/torso/arms/legs) with
UV coordinates mapped per-face from `faceRegistry.ts`. The skin texture is a
`THREE.CanvasTexture` wrapping an **offscreen** canvas
(`useSkinCanvas.ts`) that mirrors the canonical buffer — again, never the
visible/decorated UV editor canvas. `NearestFilter` on both mag/min filters
keeps texture sampling crisp (no blur) at Minecraft's native low resolution.
A second, larger `<Canvas>` instance (sharing the same scene component) backs
the fullscreen preview modal.

## Auto-design (`autoDesign.ts` + `skinPlan.functions.ts`)

A "plan" (`SkinPlan`) is pure data — per face, either a normalized crop of the
reference image or a flat color, plus a brightness multiplier and a note.
Plans are produced by one of two paths (deterministic geometric heuristic, or
an LLM call through a server function) and applied by one shared function
(`applyPlan`) as a single undoable mutation. AI-produced JSON is treated as
untrusted input and passed through `normalizePlan` before it can touch
anything — invalid face ids are dropped, colors must match a strict hex
regex, brightness is clamped, strings are length-capped. See
`docs/AI_PLAN_NOTES.md` for the AI path in detail.

## Projects & persistence

`src/lib/projects.ts` (not read in depth for this doc, but the surface used
by `ProjectsPanel.tsx`) wraps CRUD against Supabase's `skin_projects` table —
one row per saved project, RLS-scoped to `user_id = auth.uid()`. A project
snapshot is the skin PNG (base64), the reference image (as a data URL, if
any), extracted palette, current AI plan (if any), and a small `view_state`
JSON blob (selected face, zoom, color, tool). There is currently no
project-level versioning beyond in-session undo/redo — saving overwrites.

## Routing & layout

Single primary route (`src/routes/index.tsx`) renders the whole editor;
`/auth` handles sign-in. Layout has two modes, both owned by the same page
component: normal (three-column grid — tools/reference/auto-design/shortcuts/
projects sidebar, canvas, previews sidebar) and **focus mode** (canvas fills
the viewport edge-to-edge, side panels hidden, Tools becomes a floating
draggable palette via `FloatingPanel.tsx`). Global keyboard shortcuts
(tool hotkeys, undo/redo, Escape-to-exit-focus-mode) are wired at the page
level; canvas-view shortcuts (pan/zoom/center) are wired inside `UVEditor.tsx`
since only it owns the pan/zoom state.
