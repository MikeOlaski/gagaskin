# GagaSkin Design System

Sourced from a live competitor visual pass run 2026-08-24. Every value below was read out of
a real rendered page at a 1280 × 900 viewport using computed styles, or is explicitly marked
as reasoned. **No hex in this document was invented.** Where a token departs from an observed
value the departure is stated in the source cell and the reason is given.

Supersedes `docs/design-dna.md`, which was derived from a Playdate console screenshot and a
photo editor rather than from this category.

Method: Chromium at 1280 × 900, `getComputedStyle` over the live DOM (shadow roots pierced on
novaskin.me), consent dialogs declined before measuring. Font licences verified against
`google/fonts` `METADATA.pb`, not from memory.

> `docs/voice-of-customer.md` is not present on `main`. Line numbers cited below refer to the
> copy on `checkpoint/codex-validation-shell`, read with
> `git show checkpoint/codex-validation-shell:docs/voice-of-customer.md`. Task 1.5 of the plan
> restores that file to `docs/`; the line numbers hold.

---

## 1. Findings

All eight sites were reachable. Nothing in this table is "not obtained" except the cells noted.

| Site | Background | Primary text | Accent / CTA | Headline typeface | Body typeface | Tile size + gutter | Tiles per row @1280 | Skin display mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **minecraft.net** | `#171615` (dark); secondary band `#262423` | `#313131` on light cards, `#FFFFFF` on dark | Green `#3C8527` (14 buttons); yellow `#FFC42B` (5) | Proprietary pixel display — `MinecraftTen` @56/72px, `MinecraftSixteen` @80px | `Noto Sans` (humanist sans); `MinecraftSeven` @14px for nav labels (297 nodes) | 280 × 280, gutter 24px, radius 0 | 4 visible (horizontal carousel, 19 tiles total) | Marketing art / in-world screenshots. No skin gallery |
| **minecraftskins.com** (Skindex) | Content canvas `#FFFFFF`; tile surface `#F5F5F5`; pixel-art sky header | `#3C3C3B` | Green `#3AAA35`; orange `#E94E1B` (also the h2 colour); blue `#0F82B4` | `Open Sans` 28px/400 — no display face at all | `Open Sans` (humanist sans) | img 155 × 145 in a 162 × 155 card, gutter 34px, radius 0 | 5 | Flat orthographic front+back full-body PNG on a light grey plate. Not interactive |
| **planetminecraft.com/skins** | `#000000`; card surface `#2F2F31`, panel `#212121` | `#AAAAAA` body, `#FFFFFF` headings | Blue `#3366CC` (radius 5px); yellow `#FBF254` on `#8A6F30` | `Roboto` 34px/700 (neutral grotesque) | `Roboto` | preview 372 × 210 in a 372 × 376 card, gutter 12px, radius 5px | 3 | Author-uploaded scene render (JPG) — usually a posed multi-angle body over a chosen backdrop |
| **namemc.com/minecraft-skins** | `#EEF0F2` (light, cool); card surface `#FFFFFF` | `#212529` | Blue `#236DAD` | `Nunito` 48px/600 (rounded humanist) | `Roboto` | tile 153 × 296, gutter 10px, card radius 6px | 6 | Server-rendered 3D isometric body PNG (`/3d/skin/body.png?…&width=384`) |
| **novaskin.me** | `#242424` (dark) | `#FFFFFF` | Orange `#E87020`; olive `#829900`; teal `#2D9B80`; green `#82CA58` | `Oswald` (condensed sans) | `Verdana` | rail thumb 67 × 105, gutter 5px | 3 across a ~180px rail — no page-wide gallery; this is an editor, not a directory | Live WebGL 3D model composited into an in-world screenshot background; rail thumbs are 3D-rendered PNGs |
| **blockbench.net** | `#FFFFFF`; hero band `#1D2125`; secondary surface `#EDF0F4` | `#404552` | Blue `#1E93D9`, radius 7px | `Nunito Sans` 30.4px/400 | `Nunito Sans` | No gallery grid on the front page. Logo wall ≈230 × 60, gutter ≈60px | Not applicable | Not applicable — models and app screenshots, no skin gallery |
| **mcskincraft.com** | `#1F1D24` (dark); tile surface `#2D2A34` | `#ECE8DC` (warm off-white); muted `#9A94A8` | Green `#5FA64E`, radius 4px | **`Jersey 10`** — a Google Fonts pixel face — 60px h1, 36px h2 | `Inter` | card 158–235 wide on a ~174px pitch, gutter 0 (tiles butt together) | 6 | Posed 3D character render (PNG) on a saturated per-tile gradient plate |
| **mcskn.com** | `#FFFFFF` (light); card surface `#F7F7F8`; hairline `#E1E1E5` | `#16161A`; muted `#6B6B76` | Indigo `#4F46E5`, radius 6px (dominant radius: 6px across 167 nodes) | `Inter` 48px/600 | `Inter` | img 294 × 224 in a 296 × 315 card, gutter 18px, radius 8px | 4 | 3D-rendered posed character on a **dark** per-tile plate, inside light page chrome |

---

## 2. Category conclusions

**C1 — The category is dark, and the two sites that broke ranks are the two newest.**
Five of eight are dark: minecraft.net `#171615`, planetminecraft `#000000`, novaskin `#242424`,
mcskincraft `#1F1D24`, and Skindex's chrome. Three are light: namemc `#EEF0F2`, blockbench
`#FFFFFF`, mcskn `#FFFFFF`. mcskn.com and namemc.com are the most recently built of the eight
and both chose light. **This validates the spec's light-frame constraint against the category
rather than in defiance of it** — but note that no competitor's light canvas is *warm*. All
three light backgrounds are neutral or cool. The warm shift is ours, and is marked as such in
the token table.

**C2 — Every site that has to show many arbitrary skins puts each skin on its own plate.**
Skindex `#F5F5F5`, planetminecraft `#2F2F31`, mcskincraft a per-tile gradient, mcskn a dark
per-tile plate inside light chrome, namemc a white card. Not one of them lets a skin sit
directly on the page background. mcskn.com is the sharpest case: light page, **dark** tiles —
they inverted specifically so that saturated user content reads. This is the mechanism behind
the spec's "colour comes from the skins, not the chrome": the plate is what isolates the skin,
and it is a separate token from the page.

**C3 — Flat PNG is gone; 3D render is the category default.**
Only Skindex still ships a flat orthographic PNG. namemc, mcskincraft, mcskn and novaskin all
render the skin as a posed or isometric 3D body; planetminecraft shows an author-authored
in-world scene; novaskin composites a live WebGL model into an in-world screenshot. Five of
eight display in 3D. A flat 64 × 64 PNG grid would read as dated. This is the observed backing
for the spec's inspiration → in-world proof pair, and for lazy-loading 3D rather than dropping it.

**C4 — Pixel type is a label face, not a body face — and where it is a headline face, it hurts.**
minecraft.net owns the definitive pixel faces and uses them with discipline: `MinecraftSeven`
at 14px on 297 nav/label nodes and 16px on 60 more, `MinecraftTen` at 56–72px on a handful of
display moments — and `Noto Sans` for every word of running copy. mcskincraft.com is the
counter-example: `Jersey 10` at 60px and 36px for all headings, which is exactly the
"pixel-everywhere" cliché the spec warns about, and it is the least legible headline set of the
eight. Skindex has no display face at all and reads as a 2010 forum. The disciplined split —
pixel for labels and numerals, a real display face for headlines — is minecraft.net's, and it
is the one we copy.

**C5 — Headline sizing has converged on 48px, and the CTA hue has converged on green.**
namemc `48px/600` and mcskn `48px/600` land on the identical h1 spec independently. Three of
eight — minecraft.net `#3C8527`, Skindex `#3AAA35`, mcskincraft `#5FA64E` — use a saturated
grass green as the primary button fill with white text. Green is the category's "go" colour and
carries Minecraft's own equity; the blues (namemc, blockbench, planetminecraft, mcskn) are
generic SaaS-default and carry none.

**C6 — Radius and gutter are tight and unopinionated; nobody is spending craft here.**
Radii: 0 (Skindex, minecraft.net), 4px (mcskincraft), 5px (planetminecraft), 6px (namemc,
mcskn — 167 nodes), 7px (blockbench), 8px (mcskn card). Gutters: 0, 5, 10, 12, 18, 24, 34px.
Median radius 6px, and the generous end of the gutter range is minecraft.net's 24px. The spec's
"match the simplicity, exceed the craft" cashes out here: take the category's restrained radius,
take the *top* of its gutter range.

---

## 3. Tokens

Colour tokens are `#RRGGBB`. Every row names either a site from §1 or a line of
`docs/voice-of-customer.md`.

| Token | Value | Source |
| --- | --- | --- |
| --gs-canvas | #FAF7F2 | namemc.com light canvas `#EEF0F2` and mcskn.com `#FFFFFF` (conclusion C1), warm-shifted. **Reasoned, not observed:** no competitor light canvas is warm. Spec §8 requires a warm near-white so arbitrary skin colours read true |
| --gs-surface | #FFFFFF | minecraftskins.com content surface `rgb(255,255,255)`; namemc.com card surface `#FFFFFF`. The plate that isolates each skin (conclusion C2) |
| --gs-ink | #1C1A17 | mcskn.com body ink `#16161A`, warmed to match `--gs-canvas`. **16.25:1 on `--gs-canvas`** — WCAG AA (4.5:1) and AAA (7:1) both cleared |
| --gs-ink-muted | #6B6560 | mcskn.com muted text `#6B6B76` (533 nodes), warmed to the same hue family. 5.38:1 on `--gs-canvas` — clears AA for body text, not only for large text |
| --gs-line | #E6E0D8 | mcskn.com hairline `#E1E1E5` (223 bordered nodes), warmed. Non-text hairline: 1.23:1 on canvas, so it must never carry meaning on its own |
| --gs-accent | #3C8527 | minecraft.net primary button fill `rgb(60,133,39)`, used unmodified. Corroborated by minecraftskins.com `#3AAA35` and mcskincraft.com `#5FA64E` (conclusion C5). **Fill only — 4.29:1 as text on canvas, so never use it for text or links** |
| --gs-accent-ink | #FFFFFF | minecraft.net, minecraftskins.com and mcskincraft.com all set white text on the green fill. **4.59:1 on `--gs-accent`** — clears AA at any size |
| --gs-signal-assist | #3366CC | Hex is planetminecraft.com's button blue `rgb(51,102,204)`, a true RGB primary. Role from voice-of-customer.md line 16 (Smart Assist hypothesis) — the AI Helper path |
| --gs-signal-human | #C43C10 | minecraftskins.com's orange-red `#E94E1B` darkened to clear AA (observed value is 3.77:1 on white and fails). At `#C43C10`: 5.25:1 with white, 4.91:1 on canvas. Role from voice-of-customer.md line 17 (human artist brief) — Human Creator Custom Orders |
| --gs-signal-build | #FFC42B | minecraft.net secondary button `rgb(255,196,43)`, used unmodified. Fill only — 1.49:1 on canvas; pair with `--gs-ink` at 10.90:1. Role from voice-of-customer.md line 18 (existing skin-making habit) — Awesome Editor |
| --gs-radius | 6px | mcskn.com dominant radius, 167 nodes. Corroborated by namemc.com card `6px` and blockbench.net `7px`; category median per conclusion C6 |
| --gs-gutter | 24px | minecraft.net card gutter `24px` — the generous end of the observed 0–34px range (conclusion C6). Corroborated by mcskn.com `18px` |
| --gs-font-display | "Nunito", ui-rounded, system-ui, sans-serif | namemc.com h1 is `Nunito` 48px/600, the only competitor headline face with real character. **SIL OFL 1.1**, designers Vernon Adams / Cyreal / Jacques Le Bailly, variable `wght` 200–1000 (verified in `google/fonts` METADATA.pb). Rounded terminals also serve voice-of-customer.md line 32, "keep kid/teen/parent language literal and calm" |
| --gs-font-body | "Inter", system-ui, -apple-system, sans-serif | mcskn.com and mcskincraft.com both use `Inter` for body. **SIL OFL 1.1**, designer Rasmus Andersson, variable `opsz` 14–32 / `wght` 100–900 (verified in `google/fonts` METADATA.pb) |
| --gs-font-pixel | "Jersey 10", "Courier New", monospace | mcskincraft.com's headline face, **repurposed to label scale only** per conclusion C4 and minecraft.net's own 14px `MinecraftSeven` label discipline. **SIL OFL 1.1**, designer Sarah Cadigan-Fried (verified in `google/fonts` METADATA.pb). Labels, numerals and captions only — never body text, never a headline |

### Token rules that the values above depend on

- **`--gs-canvas` is never dark.** Public pages are light. The editor stays dark and is out of
  scope for this document.
- **`--gs-accent` and `--gs-signal-build` are fills, not text colours.** Both fail AA as text on
  `--gs-canvas` (4.29:1 and 1.49:1). Green takes `--gs-accent-ink`; yellow takes `--gs-ink`.
- **Why the accents are primaries.** The spec grounds the retro layer in a documented nostalgia
  counter-trend toward 2011-era Minecraft skins: strong primary colours, simple flat shading, no
  gradients or soft light. Those skins were built from a small saturated palette, which is why
  the token set is green / blue / red / yellow — additive RGB primaries plus yellow — rather
  than a tinted brand ramp. minecraft.net's own live palette is the same palette (`#3C8527`
  green, `#FFC42B` yellow), which is what makes this a citation and not a mood. A pastel or
  desaturated accent set would read as a 2026 SaaS product and lose the reference entirely.
- **All three fonts are SIL OFL 1.1 and variable, so all three must be self-hosted** as
  subset `woff2` with `font-display: swap` and a `<link rel="preload">` on the display face
  only. No Google Fonts CDN link, no `@import`. The home page LCP budget is under 1.5s and a
  third-party font request is a render-blocking round trip against it.
- **Three signal colours, one accent.** `--gs-accent` is the site's single CTA colour. The three
  `--gs-signal-*` tokens identify offers — they belong on the portal tiles, offer-page eyebrows
  and route labels. They are never a second CTA colour on the same button.

---

## 4. Type scale

Six sizes. `--gs-font-body` at every size except the label row, which is `--gs-font-pixel`.
Sizes 48 / 36 / 24 / 18 / 16 / 14 are all observed values, not a generated ratio.

| Role | Size | Line height | Ratio | Source |
| --- | --- | --- | --- | --- |
| Display | 48px | 52px | 1.08 | namemc.com h1 `48px/600` and mcskn.com h1 `48px/600` — the two sites converge exactly. mcskn sets `48/48`; opened to 52 so a two-line headline does not collide |
| Section | 36px | 42px | 1.17 | mcskincraft.com h2 `36px`. Lead interpolated on the mcskn.com ramp |
| Subsection | 24px | 32px | 1.33 | minecraft.net h2 `24px`. Lead interpolated on the mcskn.com ramp |
| Card title | 18px | 28px | 1.56 | mcskn.com `18px/28px` observed exactly; namemc.com section headings also `18px/600` |
| Body | 16px | 24px | 1.50 | mcskn.com `16px/24px` observed exactly, 183 nodes |
| Label / numeral | 14px | 20px | 1.43 | mcskn.com `14px/20px` observed exactly, 122 nodes. Also minecraft.net's pixel-label size — `MinecraftSeven` at 14px across 297 nodes. **This is the only row that uses `--gs-font-pixel`** |

Weights: display and section at 700–800 on the `wght` axis, subsection and card title at 600,
body at 400, label at 400 with `letter-spacing: 0.02em`. `--gs-font-pixel` is rendered with
`font-smooth: never` / `-webkit-font-smoothing: none` so the pixel grid stays crisp.

---

## 5. Anti-patterns

Carried forward from `docs/design-dna.md` §Anti-reference, plus what the pass turned up.

**Carried forward — do not ship:**

- Stock testimonials, invented metrics, invented social proof, star ratings, user counts.
- Glass panels and purple AI gradients.
- Abstract mascots.
- An "AI versus human" contest framing. The offers are three doors, not a fight.
- Repeated bento cards.
- Examples that are generic avatars rather than Minecraft-specific output.

**Added by this pass:**

- **Pixel type for headlines or body copy.** mcskincraft.com's `Jersey 10` at 60px is the least
  legible headline set of the eight sites, and parents are part of this audience.
  `--gs-font-pixel` is capped at the 14px label row.
- **A dark public page.** Category default, explicitly rejected: on a dark frame arbitrary skin
  colours fight the background. The two newest competitors already moved off it (C1).
- **Skins placed directly on the page background.** Zero of eight competitors do this. Every
  skin gets a `--gs-surface` plate (C2).
- **A flat 64 × 64 PNG grid.** Five of eight render in 3D; only Skindex still ships flat
  orthographic PNGs and it reads as a 2010 forum (C3).
- **Chrome as loud as the content.** mcskincraft's per-tile saturated gradients compete with the
  skins sitting on them. One accent, three offer signals, neutral everything else.
- **Zero-gutter tile grids.** mcskincraft butts tiles edge to edge and the skins bleed into each
  other. `--gs-gutter` is 24px.
- **A Google Fonts CDN `<link>` or `@import`.** Self-host all three faces or the 1.5s LCP budget
  is gone before the first byte of content.
- **Hero video, and any animation outside the one scrollcraft band.** The inspiration → palette
  → pixels → in-world transformation animates the pitch. Nothing else on the page moves.
- **Likeness-fidelity claims, turnaround times, price acceptance.** Not a visual rule, but it is
  enforced by the copy test in Task 5 and no design element may imply them — no countdown, no
  progress meter, no "delivered in" badge.
