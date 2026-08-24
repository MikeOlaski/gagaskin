# Public front end, gate and multi-user — design

Date: 2026-08-24
Status: approved in brainstorm, pending spec review
Repository: `/Users/mikeolaski/Workspaces/GagaSkin.com` (authoritative)

## 1. Decision this serves

Mike needs to learn which positioning converts a stranger into a registered creator, and
whether a done-for-you custom skin offer has demand. The editor already works and is not
in question. What is missing is a front door, a gate that produces a countable commitment,
and a fulfilment loop for the human offer.

Grace (12) is both **Client Zero** — the person the editor is for — and **Creator Zero** —
the person who fulfils custom orders and produces the gallery. Mike is her parent and
guardian, and the only other user in this round.

## 2. Product spine

One story, three levels of help:

> "I have a vision. I want it expressed in a skin. Help me do it really well."

| Offer | Route | Level of help | Destination |
| --- | --- | --- | --- |
| AI Helper | `/ai-helper` | Help me do it | Editor, assist-forward |
| Human Creator Custom Orders | `/custom` | Do it for me | Order form → Grace |
| Awesome Editor | `/build` | Let me do it | Editor, paint-first |

AI Helper and Awesome Editor are **two pitches for one product**. This is deliberate: it is
a live positioning A/B on the single largest strategic uncertainty in the research, which
holds that AI-forward positioning repels core skin creators while blank-canvas beginners
may need exactly that promise. Both names ship. Traffic decides.

### Proof unit

The hero and the gallery are **before → after pairs**: the inspiration source beside a real
in-game screenshot of the finished skin. No competitor shows a skin in a world; they show a
64 × 64 PNG or a T-posed model. This answers the question a buyer actually has — *will this
feel like me while I am playing?*

Rules for pairs:

- Screenshots are **real gameplay**, never simulated or composited.
- Every pair is labelled with the path that produced it — *made with AI Helper*, *made by
  Grace*, *made in the editor*. An unlabelled pair implies an outcome-fidelity claim the
  product has not validated.
- Labels make the gallery the **primary offer chooser**: pick a result you want, land on the
  path that made it.
- "Before" material is Grace's own — her drawings, references and outfit ideas. No
  third-party character art on commercial pages.

## 3. Information architecture

```
/                    Home. Hero pair, trust line, scroll band, curated gallery, three portals
/skins               The directory. Every skin Grace has published
/ai-helper           Landing A — leads with the translation sequence
/build               Landing B — leads with the tool itself, no mention of AI
/custom              Landing C — leads with Grace and her finished work
/join                The gate. One screen, all three offers funnel here
/editor              The existing app. Behind the gate. Unchanged internally
/orders              Creator inbox (Grace). Released orders only
/auth                Existing sign-in, folded into /join
```

Home is the more experimental page. The three landing pages share the design system but
vary structure — each makes a different argument.

### /skins — the directory

**Public, in front of the gate.** It is the proof surface and the only page worth linking
to from outside — Grace's other listings, her profile on other skin sites, anywhere she
already has an audience.

Same simple shell as home, no separate chrome. A grid of before → after pairs, each
labelled with the path that made it, each linking to the offer that produced it. Home shows
a curated handful; `/skins` shows everything. Newest first, no filtering, no search, no
pagination until there are enough entries to need it.

Per-skin detail pages (`/skins/:slug`) are **out of this round**. They are the obvious next
step for SEO and sharing, and the data model below supports them without change, but the
directory does not need them to be useful at 8–12 entries.

**Grace publishes them herself.** A `gallery_skins` table — title, inspiration image,
in-game screenshot, skin PNG, path label, published flag, sort order — readable by anyone,
writable only by the `creator` role. She publishes from a minimal form in her creator area,
alongside `/orders`. Hard-coding the gallery in the repo would be faster, but it would make
every update depend on Mike and a deploy, which defeats the point of Creator Zero.

The app route stays `/editor` to avoid churn against Lovable. `/build` carries the Awesome
Editor pitch.

## 4. The gate

**Hard gate.** No editor access without an account. The editor is invisible to prospects,
so the landing pages carry the proof.

**The gate must earn itself before it appears.** The loudest signal in the research is
hostility to friction — ads, interstitials, fake download buttons, sketchy redirects. A
signup wall is friction too, and a first-time visitor cannot tell honest friction from
predatory friction. So above the fold, plainly: no ads, no redirects, nothing sold, your
skin is yours. The gate becomes the proof rather than the tax.

**Offer attribution.** `/join?from=ai-helper|build|custom`. The value is written to
`profiles.source_offer` at creation and never overwritten. This is the A/B result.

**Capacity.** A configured cap (default 50) on live registrations. Under the cap, signup
completes normally. At or over the cap, the same form silently becomes a waitlist: the
email is captured with its offer, and the user is told they are in line. Demand that cannot
be served is still measured.

**Adult attestation.** Minecraft skins skew under-13 and the gate collects email. The
signup screen states the account is for 13+, or for a parent/guardian creating it on behalf
of a child. No birthdate collection, no verification theatre. Grace's own account is
guardian-consented by definition.

**Platform question.** One field at signup: Java, Bedrock, or not sure. The research
records a user losing two hours to a 128 × 128 skin Java refused, then quitting to
commission instead. Asking once at registration costs one field and prevents the worst
possible first session. Stored on `profiles.platform`. No editor changes in this round.

## 5. The editor honours its pitch

Same application, two doors, driven by `?start=`:

- `?start=ai-helper` — reference and plan panels open, Smart Assist foregrounded.
- `?start=build` — clean paint-first view, AI affordances absent and unmentioned.

The `/editor?start=` hook already exists in the codebase. This is wiring, not new UI, and
the editor's internals are not touched.

## 6. Multi-user and roles

Two peer accounts today: Mike and Grace. Each has private projects. The existing
`skin_projects` table with `auth.uid() = user_id` for `USING` and `WITH CHECK` already
provides this correctly.

**Roles are server-managed.** A `user_roles` table writable only by `service_role`, read
through a `SECURITY DEFINER` function `has_role(uid, role)`. Roles are `guardian` and
`creator`. Roles must never live in `auth.users.user_metadata`, which the client can edit.

**Outstanding verification, carried from `docs/qa-receipt.md`:** owner isolation has been
proven by static review only. Two live accounts have never been run against the hosted
database. Multi-user is not done until that test executes and is recorded.

## 7. Custom orders and the guardian loop

Public strangers submitting free text and uploaded images, arriving at a 12-year-old, is
the safety surface of this feature. It is handled in the data model rather than by policy.

`skin_orders`:

| Column | Purpose |
| --- | --- |
| `id` | uuid pk |
| `customer_id` | fk `auth.users` |
| `brief` | text |
| `reference_url` | nullable, uploaded source image |
| `platform` | java / bedrock / unsure |
| `price_intent` | selected range; intent only, never a payment |
| `status` | `submitted` → `released` → `in_progress` → `delivered` |
| `released_at`, `released_by` | guardian release |
| `creator_id` | nullable, set on release |
| `delivered_project_id` | fk `skin_projects`, nullable |
| `created_at`, `updated_at` | timestamps |

Flow: customer submits → row created, `status = submitted` → **Mike is notified and is the
only non-service role who can read a `submitted` row** → Mike releases → `status =
released`, `creator_id` set → the row becomes visible to Grace in `/orders` → she builds in
the editor → links the finished project → `status = delivered` → customer sees it.

RLS is two-sided: customers read only their own orders; the guardian reads all; the creator
reads only rows released to her. `/orders` is a list and a detail view. No status dashboard,
no messaging, no turnaround promises — none of that is validated yet.

Payment is out of scope. `price_intent` is a stated range only, and the UI must not imply
otherwise.

## 8. Design system

The existing `docs/design-dna.md` was derived from a Playdate console screenshot and a
photo editor. It is replaced.

**Method.** A competitor visual pass over The Skindex, Planet Minecraft, NameMC, Novaskin,
Blockbench, MCSkinCraft, mcskn.com and minecraft.net, producing `docs/design-system.md`
where every token carries a source column. No token ships without provenance.

**Constraints established in advance of the pass:**

- **Light, warm frame.** Skins are saturated and wildly varied user content. On a dark
  frame arbitrary skin colours fight the background; on a warm near-white they read true.
- **Colour comes from the skins, not the chrome.** Quiet neutral frame, one or two accents.
  If the chrome is as loud as the content, nothing reads.
- **Accents are true primaries.** The research documents a live nostalgia counter-trend
  toward 2011-era skins with strong primary colours and simple shading. That is where the
  retro layer is grounded, and it is a citation rather than a mood.
- **Type.** A modern display face with real character for headlines, a fast neutral for
  body, and pixel type only as an accent — labels, numerals, captions. The category does
  either pixel-everywhere (cliché, poor legibility for parents) or system defaults
  (generic). This is the "ultra-modern with retro throwbacks" brief executed at type level.
- **Generous whitespace, high density of skins.** The competitors are extremely simple,
  arguably to a fault. Match the simplicity, exceed the craft.
- **Speed is a gate, not an aspiration.** No hero video, no font-loading flash, AVIF/WebP
  gallery images, 3D lazy-loaded. Home page LCP under 1.5s. A design choice that breaks the
  budget loses.

Scrollcraft is confined to one band: the inspiration → palette → pixels → in-world
transformation. It animates the pitch itself; nothing else on the page animates.

The editor's visual design is explicitly untouched. A focused dark tool behind a bright
warm front door is a correct split, not an inconsistency.

## 9. Measurement

Traffic will be driven to offer pages from outside, so bounced visitors must be counted
server-side. `localStorage` cannot do this.

| Signal | Source |
| --- | --- |
| Offer page views | Server-side counter per route |
| Signups by offer | `profiles.source_offer` |
| Waitlist by offer | `waitlist.source_offer` |
| Orders submitted | `skin_orders` rows |
| In-app funnel | Existing `localStorage` events in `src/lib/validation.ts` |

Conversion rate per offer is signups ÷ page views. At n=2 users these numbers are not yet
meaningful; the instrumentation exists so that a later cohort produces real ones. Do not
report rates from this round as validation.

## 10. Scope

**In:** home, `/skins` directory, three landing pages, `/join` with cap and waitlist, offer
attribution, adult attestation, platform field, `?start=` pitch honouring, `user_roles`,
`skin_orders` with guardian release, `/orders` creator inbox, `gallery_skins` with a
creator publish form, server-side offer counters, design system document, live two-account
RLS verification, one end-to-end order.

**Out:** payment, analytics SaaS, order messaging or status tracking, turnaround promises,
per-skin detail pages, gallery search/filter/pagination, public gallery submissions,
remixing or attribution lineage, mobile editor work, Java/Bedrock conversion in the editor,
wardrobe/character model, marketplace, additional artists, cohort-readiness hardening.

The out list is drawn from the research's own "what I would not prioritise first."

## 11. Phases

| Phase | Done when |
| --- | --- |
| 0 — Safety net | The 25 loose working-tree files are committed to `checkpoint/codex-validation-shell` |
| 1 — Research | `docs/design-system.md` exists with a sourced token table |
| 2 — Gate & multi-user | `/join` works with cap, waitlist, attribution, platform field; `?start=` honoured; two live accounts verified isolated against the hosted database |
| 3 — Front end | Home, `/skins` and three landing pages built on the design system, gallery populated by Grace through the publish form, LCP budget met |
| 4 — Orders loop | Mike submits an order, releases it, Grace builds and delivers it, Mike receives it — once, end to end |
| 5 — Ship | Build green, QA recorded, merged to `main`, Lovable deploy confirmed |

**Critical path is content, not code.** The gallery needs 8–12 skins with inspiration
sources and real in-game screenshots. Grace should start immediately and in parallel;
otherwise Phase 3 completes and sits empty.

## 12. Repository and delivery

`main` is level with `origin/main`. The 25-file delivery from the prior Codex session is
unversioned and exists only on local disk, in a repository that Antigravity and Lovable also
write to. Committing it is the first action taken.

1. `checkpoint/codex-validation-shell` — commit all 25 files as-is. A save point, not an
   endorsement.
2. `feat/public-front-end` off `main` — the sprint branch.
3. Carried forward: `src/lib/validation.ts`, the `docs/` research set, the `skin_projects`
   migration, the `/editor` route, and the offer-portal structure. Replaced: the marketing
   components and `design-dna.md`.
4. Lovable deploys from `main`, so the branch is invisible until merged and merging is
   shipping. Antigravity and Lovable must be idle against this repository during the sprint.

Never force-push, rebase, amend or squash pushed history — Lovable syncs from it.

## 13. Constraints and open items

- **AI positioning is a known landmine.** `r/minecraftskins` restricts AI-generated skin
  content; commission sellers advertise "NO AI used." The A/B tests this deliberately, but
  no page may describe the product as an AI skin generator, and Smart Assist output must
  always be presented as editable pixels the creator owns.
- **COPPA.** Adult attestation is the chosen control. If a later round opens to a public
  cohort, verifiable parental consent must be revisited before launch.
- **IP.** Gallery "before" material is Grace's own. Fandom and character skins dominate the
  category but are not usable as commercial marketing assets.
- **Unvalidated claims that must not appear on any page:** likeness fidelity, turnaround
  time, price acceptance, user counts, testimonials, or any conversion figure.
- **Open:** the registration cap value (default 50) and the notification channel for order
  release (email assumed) are Mike's to confirm during Phase 2.
