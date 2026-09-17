# Inner & Outer Layers — plan

## Background (Minecraft research)

A classic 64×64 skin has **two layers** for every body part:

- **Inner (body) layer** — the solid skin. Alpha is ignored in game; anything
  transparent renders as opaque black-ish, so inner faces should always be fully
  opaque.
- **Outer (overlay) layer** — a second, slightly larger shell (+0.5 texel on each
  side) drawn on top of the inner layer. Alpha *is* respected, so this is where
  hair, hats, jackets, sleeves, trouser legs, gloves and boots live.

Atlas positions of the overlay regions (origin top-left, texels):

| Part | Inner origin | Outer origin |
| --- | --- | --- |
| Head | 0, 0 | 32, 0 |
| Torso | 16, 16 | 16, 32 |
| Right arm | 40, 16 | 40, 32 |
| Left arm | 32, 48 | 48, 48 |
| Right leg | 0, 16 | 0, 32 |
| Left leg | 16, 48 | 0, 48 |

Each overlay block repeats the same 6-face layout as its inner block, so the
existing face registry shape can be reused with an origin offset.

Appendage width: the **classic** model has 4-texel arms; the **slim** ("Alex")
model has 3-texel arms. Minecraft keeps the side faces 4 wide and shifts every
column right of the front face one texel left — already implemented in
`slimAtlas()` in `src/domain/skin/faceRegistry.ts`. Legs are 4 wide on both
models.

## Planned work

1. **Registry** — extend `SkinFace` with `layer: "inner" | "outer"`, generate the
   overlay faces from the table above, and give them ids like
   `head.front.outer`. `faceAtAtlas()` returns whichever layer owns the texel.
2. **Store** — add `activeLayer` ("inner" | "outer") and `outerVisible`. Painting
   maps a hit to the active layer's face; the flat editor shows both layer blocks.
3. **3D editor** — render a second, slightly scaled shell per visible part using
   the overlay UVs, with `transparent: true` and no `alphaTest` clipping. Hide it
   when `outerVisible` is off; when the active layer is "outer", the inner shell
   stops receiving ray hits so strokes cannot land on the wrong layer.
4. **Tools** — per-layer clear, copy inner→outer, and an "erase overlay" helper.
   Keep the inner layer fully opaque on export (guard in `importExport.ts`).
5. **Gallery renders** — `poseRender.ts` draws the overlay shell so hair and
   jackets appear in the 9:16 posed renders.

Everything stays keyed to the canonical 64×64 buffer — layers are just extra
regions of the same texture, never a separate source of truth.

## Status: built (V1)

Implemented:
- `faceRegistry.ts` — `SkinLayer`, `layer` on every face, `getFace(part, face, layer)`,
  `OUTER_FACES`, `ALL_FACES` (72 faces), `facesForLayer`, `faceAtAtlas` layer-aware.
- `layout.ts` — `placedFacesForLayer(layer)` for the exploded sheet.
- `editorStore.ts` — `activeLayer`, `outerVisible`, `setActiveLayer`, `toggleOuterVisible`,
  `clearLayer`, `copyInnerToOuter`.
- Flat editor draws the active layer's sheet; Tools panel has Body / Overlay,
  show-overlay, Body → overlay, Clear overlay.
- 3D editor and 3D preview render an overlay shell one texel larger per side;
  raycasting targets the active layer only.
- `poseRender.ts` renders both shells, so published gallery renders show hair,
  hats, jackets and sleeves.
- Export is unchanged: the single 64x64 buffer already holds both layers.

Verified by `src/test/layers.test.ts`: exact vanilla overlay origins, no atlas
overlap between any two of the 72 faces, and layer-correct reverse lookup.
