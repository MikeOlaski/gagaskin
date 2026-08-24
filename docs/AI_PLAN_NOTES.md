# AI Plan — how it works, and what could make it better

Status: notes only, nothing here is built yet. See "Open decisions" at the bottom.

## How it works today

Upload a reference image → the app extracts a 12-color palette client-side
(downscale to 64×64, quantize RGB into buckets, keep the top 12 by frequency —
`src/domain/skin/palette.ts`) → click **AI plan** → the reference is downscaled
to a 384px-max-side JPEG data URL (`toDataUrl` in `editorStore.ts`, quality 0.85)
→ sent to the `generateSkinPlan` server function (`src/lib/skinPlan.functions.ts`)
→ which calls an LLM asking it to map every one of the 36 skin faces to either a
crop of the image or a flat color → the response is validated and sanitized
(`normalizePlan` in `src/domain/skin/autoDesign.ts` — untrusted AI JSON never
touches the canvas directly: invalid face ids are dropped, colors must match
`^#[0-9a-fA-F]{6}$`, brightness is clamped to 0.2–2, strings are length-capped)
→ you review the plan (list of 36 faces, color swatch, crop or flat-color
summary, per-face note) → **Apply** stamps it onto the canonical skin buffer as
one undoable action.

There's also a non-AI **Auto-map** button — pure geometric heuristic (slice the
reference into head/torso/arm/leg bands by fixed proportions, no LLM involved).
It's the deterministic fallback and the thing AI plan is implicitly competing
against in quality.

### Model & transport

`google/gemini-3-flash-preview`, called through **Lovable's AI Gateway**
(`https://ai.gateway.lovable.dev/v1/chat/completions`, OpenAI-compatible chat
completions shape), not a direct Anthropic/OpenAI key. Requires a
`LOVABLE_API_KEY` env var — **not present in the local `.env`**, so AI plan
only works on Lovable's deployed hosting today, not `bun run dev` locally.

### Default system prompt (hardcoded, `skinPlan.functions.ts`)

```
You design Minecraft skin paint plans.
The skin is a 64x64 atlas made of 36 faces (6 body parts x 6 faces).
Given a reference image, decide for EVERY face id supplied either:
- "source": a normalized crop {x,y,w,h} (0..1, image space) whose content should be
  scaled into that face, or
- "color": a flat "#rrggbb" fill.
Also give each face a "brightness" multiplier (0.2-2, use ~1 for front faces,
0.8-0.9 for back/side faces, 1.05 for tops, 0.7 for bottoms) and a short "note".
Left and right limbs are independent: plan them separately and mirror crops when
the subject is symmetric. Keep wrapping continuous: a limb's LEFT/RIGHT/BACK crops
should come from near its FRONT crop. Reply with JSON only.
```

There's already a one-off **"Style guidance"** text input in the UI (e.g. "keep
the hoodie, dark denim legs") — appended to the *user* message per request, not
persisted, not part of the system prompt.

### What the generated JSON means, per face

- `source` — a 0–1 normalized crop rect of *your reference image* to sample and
  scale into that face, **or**
- `color` — a flat hex fallback when no sensible crop exists
- `brightness` — 0.2–2 multiplier applied to the sampled/flat RGB, so back and
  side faces read as shaded relative to the front (this is what makes the 3D
  model look like a solid figure instead of a flat decal)
- `note` — the model's short rationale for that face; this is what renders next
  to each row in the plan list (e.g. "flat #2f3542" or "crop 0.12,0.28 0.16×0.34")

## What might improve results

Roughly in order of expected impact-to-effort:

1. **Input image fidelity.** 384px max side + JPEG q0.85 is aggressive
   downscaling/compression for a task that needs *precise* crop coordinates.
   JPEG artifacts near edges (a shirt collar, a hairline) can shift where the
   model thinks a boundary is. Worth testing 512–768px and/or PNG, weighing
   against gateway payload size, latency, and per-request cost.

2. **Structured output enforcement.** Currently uses loose
   `response_format: {type: "json_object"}` (valid JSON, but no schema
   enforcement) rather than a strict JSON Schema / constrained-decoding mode.
   If the gateway/model supports strict schema output, switching would cut
   parse failures and free-form drift (e.g. extra keys, wrong types) — check
   what Lovable's gateway actually supports before assuming OpenAI-style
   `json_schema` mode works identically.

3. **Few-shot examples in the system prompt.** One or two example
   image → plan-JSON pairs (even synthetic/illustrative ones) would anchor
   format and quality far more reliably than prose instructions alone,
   especially for the brightness/shading conventions, which are exactly the
   kind of thing models are inconsistent about from instructions alone.

4. **Deterministic symmetry pass after the AI plan.** The prompt *asks* the
   model to mirror left/right crops when the subject is symmetric, but nothing
   verifies it did. A post-process step could detect near-mirror pairs (or just
   always offer a "make symmetric" action) using the app's existing
   `copyToOppositeLimb` / flip infrastructure — cheap, deterministic, and
   removes a whole class of AI inconsistency instead of prompting around it.

5. **Per-face regeneration.** Today it's all-or-nothing: apply the whole
   36-face plan or discard it. A "regenerate just this face" action (small
   scoped request, or even a local re-crop UI) would make bad individual faces
   fixable without re-rolling everything and losing the faces that were good.

6. **Model choice as a real lever, not a constant.** Flash-tier models are
   fast and cheap but weaker at spatial reasoning (exact crop boxes) than
   frontier-tier ones. Worth measuring whether a stronger model meaningfully
   improves crop precision before deciding whether a quality/speed toggle is
   worth the UI complexity — see "custom instructions" plan below, this is the
   same shape of decision.

7. **Give the model more framing context**, not just the raw image: subject
   bounding box (if a fast local heuristic can find it), aspect ratio, maybe a
   flag for "this looks like a front-facing portrait vs. a full-body shot" so
   it doesn't have to infer framing purely from pixels.

## Custom instructions — the plan we agreed on

Discussed with Mike 2026-08-24. Two independent decisions, both resolved as
**product toggles the app's user controls, not something hardcoded by us**:

- **Merge mode** (Mike's call, explicit): give the user a choice, don't force
  one. Default to **append** (safer — output contract can't break), but let
  the user pick **override** (replaces the design-rules portion of the system
  prompt, but the JSON output-contract instructions stay fixed and
  non-overridable server-side, so a bad custom prompt can degrade the *quality*
  of the plan but never make it unparsable).
- **Persistence scope** (my recommendation, not yet confirmed): global default
  in `localStorage`, applied to every AI plan request across all projects —
  simplest, no schema/DB change. A per-project persisted version (saved into
  `skin_projects.view_state` or a new column) is the natural v2 if global turns
  out to be too coarse in practice.

### Implementation sketch (not built)

- **Server** (`skinPlan.functions.ts`): split `SYSTEM` into `BASE_RULES` +
  `OUTPUT_CONTRACT`. Accept `customInstructions?: string` and
  `instructionsMode?: "append" | "override"` in the input schema.
  - append: `BASE_RULES + "\n\nAdditional user instructions:\n" + customInstructions + OUTPUT_CONTRACT`
  - override: `customInstructions + OUTPUT_CONTRACT`
- **Store** (`editorStore.ts`): add `customInstructions` + `instructionsMode`
  state, loaded/saved to `localStorage`, passed through `requestAiPlan`.
- **UI** (`AutoDesignPanel.tsx`): collapsible "Custom AI instructions" section
  below Style guidance — textarea + append/override toggle, plus a small "ⓘ"
  disclosure showing the model name and the current base rules read-only so
  it's never a black box.

## Open decisions

- [ ] Confirm persistence scope: global `localStorage` vs. per-project. (Leaning
      global for v1 — cheap, no migration — revisit if it turns out people want
      different instructions per skin.)
- [ ] Input image resolution/format — test whether bumping past 384px/JPEG
      q0.85 measurably improves crop precision before spending a prompt-tuning
      cycle on it.
- [ ] Does Lovable's AI Gateway support strict JSON Schema / function-calling
      style structured output, or only the loose `json_object` mode already in
      use? Determines whether item 2 above is even available.
- [ ] Model selection UI — worth it, or premature until we have evidence flash
      vs. a stronger model actually differs on this task?
- [ ] Per-face regeneration — how big a UI/backend lift, and is it worth it
      before the above are addressed?
