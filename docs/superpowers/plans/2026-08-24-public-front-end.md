# Public Front End, Gate & Multi-User Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing GagaSkin editor in a validation-first public front end — home, a skins directory, three offer landing pages, a hard registration gate with capacity waitlist, and a guardian-mediated custom order loop.

**Architecture:** New public routes sit in front of the existing `/editor`, which is not modified internally. A single offer registry drives routing, attribution and copy. All database access goes through thin, testable modules in `src/lib/`; all schema is authored here but applied by Mike through the Lovable UI. Pure logic is unit-tested in vitest; flows are verified in a browser and recorded in a QA receipt.

**Tech Stack:** TanStack Start 1.168 + TanStack Router 1.170, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (Radix), Supabase (auth + Postgres + Storage), Zustand, vitest 4.

**Spec:** `docs/superpowers/specs/2026-08-24-public-front-end-design.md`

## Global Constraints

- **No agent applies SQL to the hosted database.** Not via Supabase CLI, `db push`, or any migration runner. Mike pastes SQL into the Lovable UI. Committed migration files are a record, never a mechanism.
- **The editor's internals are untouched.** `src/components/skin/**` and `src/store/editorStore.ts` are read-only for this plan. The only permitted editor change is reading the `?start=` search param in `src/routes/editor.tsx`.
- **Never force-push, rebase, amend or squash pushed history.** Lovable syncs from `main`.
- **`git pull origin main` before every session.** ChatGPT, Antigravity and Lovable all write to this repo.
- **`src/routeTree.gen.ts` is generated.** Regenerate by running `npm run dev` or `npm run build`; never hand-edit or hand-merge it.
- **Offer names are exact:** `AI Helper`, `Human Creator Custom Orders`, `Awesome Editor`. Never `Genious`.
- **Never describe the product as an AI skin generator.** Smart Assist output is always presented as editable pixels the creator owns.
- **Forbidden on every public page:** likeness-fidelity claims, turnaround times, price acceptance, user counts, testimonials, conversion figures, star ratings. Enforced by a test in Task 5.
- **Light, warm frame.** No dark public pages. The editor stays dark.
- **Home page LCP budget: under 1.5s.** No hero video, no render-blocking webfonts, AVIF/WebP gallery images.
- **Branch:** all work lands on `feat/public-front-end`, cut from `main`.

---

## File Structure

**Created:**

| File | Responsibility |
| --- | --- |
| `src/lib/offers.ts` | The offer registry. Single source of truth for id, route, name, pitch, editor start mode |
| `src/lib/gate.ts` | Pure gate logic: capacity decision, offer param validation, attestation validation |
| `src/lib/gallery.ts` | `gallery_skins` reads and the creator publish write |
| `src/lib/orders.ts` | `skin_orders` reads/writes and status transition rules |
| `src/lib/roles.ts` | Role lookup via `has_role` |
| `src/components/site/SiteShell.tsx` | Shared public chrome: header, footer, skip link |
| `src/components/site/BeforeAfter.tsx` | One inspiration → in-game proof pair with its path label |
| `src/components/site/SkinGrid.tsx` | Responsive grid of `BeforeAfter` |
| `src/components/site/OfferPortals.tsx` | The three-portal block |
| `src/site.css` | Public-surface design tokens and layout. Imported by `styles.css` |
| `src/routes/skins.tsx` | `/skins` directory |
| `src/routes/custom.tsx` | `/custom` landing + order form |
| `src/routes/join.tsx` | `/join` gate |
| `src/routes/orders.tsx` | `/orders` creator inbox + publish form |
| `supabase/migrations/20260824000000_public_front_end.sql` | Record of the SQL Mike applied |
| `docs/design-system.md` | Sourced token table from the competitor pass |
| `src/test/offers.test.ts`, `gate.test.ts`, `orders.test.ts`, `copy.test.ts` | Unit tests |

**Modified:**

| File | Change |
| --- | --- |
| `src/routes/index.tsx` | Currently **is the editor**. Task 1.5 moves it to `editor.tsx`; Task 11 rebuilds it as the home page |
| `src/routes/ai-helper.tsx` | Created fresh in Task 12 (the checkpoint copy is not reused) |
| `src/routes/build.tsx` | Created fresh in Task 12 (the checkpoint copy is not reused) |
| `src/routes/editor.tsx` | Created by the Task 1.5 move. Then: read `?start=`; gate on session |
| `src/routes/auth.tsx` | Redirect to `/join` |
| `src/styles.css` | Import `site.css` |
| `src/lib/validation.ts` | Add the new event names |

**Deleted:** none. `docs/design-dna.md` is superseded but stays as a record.

---

## Task 1: Branch and design system research

**Files:**
- Create: `docs/design-system.md`

**Interfaces:**
- Produces: the token table every later visual task reads. Token names are CSS custom properties in the form `--gs-<role>`.

- [ ] **Step 1: Pull, branch**

```bash
git pull origin main
git checkout -b feat/public-front-end
```

- [ ] **Step 2: Run the competitor visual pass**

Visit and record, for each of: `minecraft.net`, `minecraftskins.com` (The Skindex), `planetminecraft.com/skins`, `namemc.com/minecraft-skins`, `novaskin.me`, `blockbench.net`, `mcskincraft.com`, `mcskn.com`.

For each site capture: background colour, primary text colour, accent/CTA colour, headline typeface classification, body typeface classification, gallery tile size and gutter, tiles per row at 1280px, and whether skins are shown as PNG, 3D model, or in-world.

- [ ] **Step 3: Write `docs/design-system.md`**

The document must contain, in order:

1. **Findings table** — one row per site, columns as captured in Step 2.
2. **Category conclusions** — at least four, each citing which sites support it.
3. **Token table** — every row `| Token | Value | Source |`, where Source names a site from the findings table or a specific line in `docs/voice-of-customer.md`. Tokens required: `--gs-canvas`, `--gs-surface`, `--gs-ink`, `--gs-ink-muted`, `--gs-line`, `--gs-accent`, `--gs-accent-ink`, `--gs-signal-assist`, `--gs-signal-human`, `--gs-signal-build`, `--gs-radius`, `--gs-gutter`, `--gs-font-display`, `--gs-font-body`, `--gs-font-pixel`.
4. **Type scale** — six sizes with line heights.
5. **Anti-patterns** — carried forward from `docs/design-dna.md` §Anti-reference.

Constraints from the spec that the tokens must satisfy: `--gs-canvas` is a warm near-white, never dark. Accents are true primaries, justified by the 2011-era nostalgia finding in the ChatGPT research. `--gs-font-pixel` is used only for labels, numerals and captions.

- [ ] **Step 4: Verify no token is unsourced**

Run: `grep -c '^| --gs-' docs/design-system.md` and `grep '^| --gs-' docs/design-system.md | grep -c '|.*|.*|.*|'`

Expected: both numbers equal, and equal to 15. Every token row has a source cell.

- [ ] **Step 5: Commit**

```bash
git add docs/design-system.md
git commit -m "Add sourced design system from competitor visual pass"
```

---

## Task 1.5: Reconcile the checkpoint branch

**Files:**
- Rename: `src/routes/index.tsx` → `src/routes/editor.tsx`
- Restore from `checkpoint/codex-validation-shell`: `src/lib/validation.ts`, `docs/voice-of-customer.md`, `docs/validation-funnel.md`, `docs/program-map.md`

**Interfaces:**
- Produces: the `/editor` route, and `recordValidationEvent` from `@/lib/validation`. Tasks 6, 7, 10, 11, 12, 14 and 15 all import one or the other; none of them can run until this task completes.

**Why this exists:** on `main` today the editor is served at `/`, not `/editor` — `src/routes/index.tsx` *is* the editor. The public shell needs `/` for the home page. `src/lib/validation.ts` and the research docs live only on the checkpoint branch. This task moves the editor out of the way and brings the reusable pieces across, without disturbing the editor's contents.

- [ ] **Step 1: Confirm the starting state**

Run: `ls src/routes/` and `head -5 src/routes/index.tsx`
Expected: routes are `__root.tsx`, `auth.tsx`, `index.tsx`, `README.md`, and `index.tsx` imports from `@/components/skin/`. If `editor.tsx` already exists, this task has already run — skip it.

- [ ] **Step 2: Move the editor to its own route**

Use `main`'s copy, not the checkpoint's. `main` has Antigravity's newer canvas panning, tool fixes and shortcuts drawer; the checkpoint's copy is a slightly older fork of the same file.

```bash
git mv src/routes/index.tsx src/routes/editor.tsx
```

Then change the route id on the first `createFileRoute` call in `src/routes/editor.tsx`:

```tsx
export const Route = createFileRoute("/editor")({
```

Change nothing else in the file. The editor's internals are out of scope.

- [ ] **Step 3: Restore the reusable pieces**

```bash
git checkout checkpoint/codex-validation-shell -- \
  src/lib/validation.ts \
  docs/voice-of-customer.md \
  docs/validation-funnel.md \
  docs/program-map.md
```

Do **not** restore `docs/design-dna.md` (superseded by Task 1), `src/components/marketing/` (replaced by Task 6), or `src/routes/{ai-helper,build,personal}.tsx` (rewritten in Tasks 12 and 14). Task 12 creates `ai-helper.tsx` and `build.tsx` from scratch.

- [ ] **Step 4: Add a placeholder home route**

`/` must resolve to something while Tasks 6–11 are built, or the site 404s at its root.

```tsx
// src/routes/index.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

// Temporary. Task 11 replaces this with the real home page.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/editor" });
  },
});
```

- [ ] **Step 5: Verify the editor still works**

Run: `npm run build`
Expected: `built in`, and `src/routeTree.gen.ts` now lists both `/` and `/editor`.

Run: `npm run dev`, open `/editor` in a browser.
Expected: the editor loads exactly as it did at `/` — tools, UV grid, 3D preview, no new console errors.

- [ ] **Step 6: Commit**

```bash
git add -A src/routes src/lib/validation.ts docs/ src/routeTree.gen.ts
git commit -m "Move editor to /editor and restore validation lib and research docs"
```

---

## Task 2: Author the consolidated schema script

**Files:**
- Create: `supabase/migrations/20260824000000_public_front_end.sql`

**Interfaces:**
- Produces: tables `profiles`, `waitlist`, `user_roles`, `skin_orders`, `gallery_skins`, `offer_views`, `app_settings`; functions `has_role(uuid, text)`, `registration_open()`, `record_offer_view(text)`, `handle_new_user()`; storage buckets `gallery`, `order-refs`. Every later task consumes these names exactly.

**This task writes SQL. It does not run it.** Task 3 is Mike applying it.

- [ ] **Step 1: Write the migration file**

```sql
-- Public front end: profiles, gate capacity, roles, orders, gallery, offer counters.
-- APPLIED BY HAND THROUGH THE LOVABLE UI. This file is a record, not a mechanism.

-- ---------- settings ----------
CREATE TABLE public.app_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  registration_cap INT NOT NULL DEFAULT 50
);
INSERT INTO public.app_settings (id, registration_cap) VALUES (1, 50);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
-- No policies: readable only through SECURITY DEFINER functions below.

-- ---------- profiles ----------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  source_offer TEXT NOT NULL DEFAULT 'unknown'
    CHECK (source_offer IN ('ai-helper','build','custom','unknown')),
  platform TEXT NOT NULL DEFAULT 'unsure'
    CHECK (platform IN ('java','bedrock','unsure')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

CREATE POLICY "Users read their own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ---------- roles ----------
CREATE TYPE public.app_role AS ENUM ('guardian','creator');

CREATE TABLE public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  PRIMARY KEY (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

-- Deliberately no INSERT/UPDATE/DELETE policy for authenticated.
-- Roles are assigned only by service_role or through the Lovable SQL UI.
CREATE POLICY "Users read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- SECURITY DEFINER so policies can call it without recursing through RLS.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
) $$;

-- ---------- capacity ----------
CREATE OR REPLACE FUNCTION public.registration_open()
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT (SELECT count(*) FROM public.profiles)
            < (SELECT registration_cap FROM public.app_settings WHERE id = 1) $$;

GRANT EXECUTE ON FUNCTION public.registration_open() TO anon, authenticated;

-- Creates the profile and enforces the cap for real. A client that skips the
-- registration_open() check still cannot get past this.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.registration_open() THEN
    RAISE EXCEPTION 'registration_closed';
  END IF;
  INSERT INTO public.profiles (id, source_offer, platform)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'source_offer', 'unknown'),
    COALESCE(NEW.raw_user_meta_data ->> 'platform', 'unsure')
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------- waitlist ----------
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  source_offer TEXT NOT NULL DEFAULT 'unknown'
    CHECK (source_offer IN ('ai-helper','build','custom','unknown')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
GRANT INSERT ON public.waitlist TO anon, authenticated;

-- Insert only. Nobody reads the waitlist through the client; Mike reads it in Lovable.
CREATE POLICY "Anyone may join the waitlist"
ON public.waitlist FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- ---------- orders ----------
CREATE TYPE public.order_status AS ENUM
  ('submitted','released','in_progress','delivered');

CREATE TABLE public.skin_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  brief TEXT NOT NULL,
  reference_path TEXT,
  platform TEXT NOT NULL DEFAULT 'unsure'
    CHECK (platform IN ('java','bedrock','unsure')),
  price_intent TEXT NOT NULL DEFAULT 'exploring',
  status public.order_status NOT NULL DEFAULT 'submitted',
  released_at TIMESTAMPTZ,
  released_by UUID REFERENCES auth.users,
  creator_id UUID REFERENCES auth.users,
  delivered_project_id UUID REFERENCES public.skin_projects ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.skin_orders ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.skin_orders TO authenticated;

CREATE POLICY "Customers manage their own orders"
ON public.skin_orders FOR SELECT TO authenticated
USING (auth.uid() = customer_id);

CREATE POLICY "Customers create their own orders"
ON public.skin_orders FOR INSERT TO authenticated
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Guardian reads every order"
ON public.skin_orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'guardian'));

CREATE POLICY "Guardian updates every order"
ON public.skin_orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'guardian'))
WITH CHECK (public.has_role(auth.uid(), 'guardian'));

-- The creator sees an order only once the guardian has released it to her.
CREATE POLICY "Creator reads released orders"
ON public.skin_orders FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'creator')
       AND status <> 'submitted' AND creator_id = auth.uid());

CREATE POLICY "Creator updates released orders"
ON public.skin_orders FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'creator')
       AND status <> 'submitted' AND creator_id = auth.uid())
WITH CHECK (public.has_role(auth.uid(), 'creator') AND creator_id = auth.uid());

CREATE INDEX skin_orders_status_idx ON public.skin_orders (status, created_at DESC);

CREATE TRIGGER skin_orders_set_updated_at
BEFORE UPDATE ON public.skin_orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- gallery ----------
CREATE TABLE public.gallery_skins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  inspiration_path TEXT NOT NULL,
  ingame_path TEXT NOT NULL,
  skin_png_path TEXT,
  made_with TEXT NOT NULL CHECK (made_with IN ('ai-helper','build','custom')),
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_skins ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.gallery_skins TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.gallery_skins TO authenticated;

CREATE POLICY "Anyone reads published skins"
ON public.gallery_skins FOR SELECT TO anon, authenticated
USING (published = true);

CREATE POLICY "Creator reads every skin"
ON public.gallery_skins FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Creator writes the gallery"
ON public.gallery_skins FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'creator'))
WITH CHECK (public.has_role(auth.uid(), 'creator'));

CREATE INDEX gallery_skins_published_idx
ON public.gallery_skins (published, sort_order, created_at DESC);

-- ---------- offer view counters ----------
CREATE TABLE public.offer_views (
  offer TEXT PRIMARY KEY
    CHECK (offer IN ('home','ai-helper','build','custom','skins')),
  views BIGINT NOT NULL DEFAULT 0
);
INSERT INTO public.offer_views (offer) VALUES
  ('home'),('ai-helper'),('build'),('custom'),('skins');
ALTER TABLE public.offer_views ENABLE ROW LEVEL SECURITY;
-- No policies. Written only through the SECURITY DEFINER function, read in Lovable.

CREATE OR REPLACE FUNCTION public.record_offer_view(_offer TEXT)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.offer_views SET views = views + 1 WHERE offer = _offer;
END; $$;

GRANT EXECUTE ON FUNCTION public.record_offer_view(TEXT) TO anon, authenticated;

-- ---------- storage ----------
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery','gallery', true), ('order-refs','order-refs', false);

CREATE POLICY "Anyone reads gallery images"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'gallery');

CREATE POLICY "Creator writes gallery images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'gallery' AND public.has_role(auth.uid(), 'creator'));

CREATE POLICY "Customers upload their own order refs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'order-refs' AND owner = auth.uid());

CREATE POLICY "Guardian and creator read order refs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'order-refs'
       AND (owner = auth.uid()
            OR public.has_role(auth.uid(), 'guardian')
            OR public.has_role(auth.uid(), 'creator')));
```

- [ ] **Step 2: Verify the script references only things that exist**

`set_updated_at()` and `public.skin_projects` are created by the existing migration `20260823234329_f2fd9dbb-0ea4-47d7-beba-534996ed4a16.sql`. Confirm:

Run: `grep -c "set_updated_at\|skin_projects" supabase/migrations/20260823234329_*.sql`
Expected: a number greater than 0.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260824000000_public_front_end.sql
git commit -m "Add consolidated schema script for public front end (record only)"
```

---

## Task 3: Mike applies the schema

**Files:** none. This task is performed by Mike, not by an agent.

**Interfaces:**
- Consumes: `supabase/migrations/20260824000000_public_front_end.sql` from Task 2.
- Produces: the live schema. Every task from Task 6 onward is blocked until this completes.

- [ ] **Step 1: Hand the script to Mike**

Tell Mike: paste the full contents of `supabase/migrations/20260824000000_public_front_end.sql` into the Lovable SQL UI and run it. Report any error verbatim rather than editing the script in the UI — a fix belongs in the file so the repo and database stay in step.

- [ ] **Step 2: Mike assigns the two roles**

After the script succeeds, Mike runs this separately, substituting the real user ids from the Lovable auth table:

```sql
INSERT INTO public.user_roles (user_id, role) VALUES
  ('<mike-user-id>', 'guardian'),
  ('<grace-user-id>', 'creator');
```

Both accounts must be created through `/join` first. If they do not exist yet, this step moves to the end of Task 8.

- [ ] **Step 3: Confirm**

Mike confirms in Lovable that these exist: tables `profiles`, `waitlist`, `user_roles`, `skin_orders`, `gallery_skins`, `offer_views`, `app_settings`; functions `has_role`, `registration_open`, `record_offer_view`, `handle_new_user`; buckets `gallery`, `order-refs`.

Do not proceed past Task 5 without this confirmation.

---

## Task 4: The offer registry

**Files:**
- Create: `src/lib/offers.ts`
- Test: `src/test/offers.test.ts`

**Interfaces:**
- Produces: `OfferId`, `OFFERS`, `getOffer(id)`, `isOfferId(value)`. Every route, the gate, and the gallery consume these.

- [ ] **Step 1: Write the failing test**

```typescript
// src/test/offers.test.ts
import { describe, expect, it } from "vitest";

import { OFFERS, getOffer, isOfferId, type OfferId } from "@/lib/offers";

describe("offer registry", () => {
  it("holds exactly the three offers", () => {
    expect(OFFERS.map((o) => o.id)).toEqual(["ai-helper", "custom", "build"]);
  });

  it("gives every offer a unique route", () => {
    const routes = OFFERS.map((o) => o.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("uses the approved offer names", () => {
    expect(OFFERS.map((o) => o.name)).toEqual([
      "AI Helper",
      "Human Creator Custom Orders",
      "Awesome Editor",
    ]);
  });

  it("never spells genius wrong", () => {
    expect(JSON.stringify(OFFERS)).not.toMatch(/genious/i);
  });

  it("sends the two editor offers to the editor and custom orders elsewhere", () => {
    expect(getOffer("ai-helper").editorStart).toBe("ai-helper");
    expect(getOffer("build").editorStart).toBe("build");
    expect(getOffer("custom").editorStart).toBeNull();
  });

  it("recognises only real offer ids", () => {
    expect(isOfferId("ai-helper")).toBe(true);
    expect(isOfferId("build")).toBe(true);
    expect(isOfferId("custom")).toBe(true);
    expect(isOfferId("personal")).toBe(false);
    expect(isOfferId("")).toBe(false);
    expect(isOfferId("../../etc/passwd")).toBe(false);
  });

  it("keeps OfferId assignable from the registry", () => {
    const id: OfferId = OFFERS[0]!.id;
    expect(id).toBe("ai-helper");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/test/offers.test.ts`
Expected: FAIL — cannot resolve `@/lib/offers`.

- [ ] **Step 3: Write the registry**

```typescript
// src/lib/offers.ts

/** The three public offers. AI Helper and Awesome Editor are two pitches for
 *  one product; which one converts better is the experiment this shell runs. */
export type OfferId = "ai-helper" | "custom" | "build";
export type EditorStart = "ai-helper" | "build";

export interface Offer {
  id: OfferId;
  route: `/${string}`;
  name: string;
  levelOfHelp: string;
  /** Which editor entry mode this offer sold. Null when it does not lead to the editor. */
  editorStart: EditorStart | null;
  tone: "assist" | "human" | "build";
}

export const OFFERS: readonly Offer[] = [
  {
    id: "ai-helper",
    route: "/ai-helper",
    name: "AI Helper",
    levelOfHelp: "Help me do it",
    editorStart: "ai-helper",
    tone: "assist",
  },
  {
    id: "custom",
    route: "/custom",
    name: "Human Creator Custom Orders",
    levelOfHelp: "Do it for me",
    editorStart: null,
    tone: "human",
  },
  {
    id: "build",
    route: "/build",
    name: "Awesome Editor",
    levelOfHelp: "Let me do it",
    editorStart: "build",
    tone: "build",
  },
] as const;

export function isOfferId(value: unknown): value is OfferId {
  return typeof value === "string" && OFFERS.some((o) => o.id === value);
}

export function getOffer(id: OfferId): Offer {
  const offer = OFFERS.find((o) => o.id === id);
  if (!offer) throw new Error(`Unknown offer: ${id}`);
  return offer;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/test/offers.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/offers.ts src/test/offers.test.ts
git commit -m "Add offer registry as single source of truth for the three offers"
```

---

## Task 5: Gate logic and the copy guardrail

**Files:**
- Create: `src/lib/gate.ts`
- Test: `src/test/gate.test.ts`, `src/test/copy.test.ts`

**Interfaces:**
- Consumes: `isOfferId` from Task 4.
- Produces: `GateMode`, `resolveGateMode(open)`, `parseOfferParam(raw)`, `parsePlatform(raw)`, `signupMetadata(offer, platform)`.

- [ ] **Step 1: Write the failing gate test**

```typescript
// src/test/gate.test.ts
import { describe, expect, it } from "vitest";

import {
  parseOfferParam,
  parsePlatform,
  resolveGateMode,
  signupMetadata,
} from "@/lib/gate";

describe("gate mode", () => {
  it("opens registration when capacity remains", () => {
    expect(resolveGateMode(true)).toBe("register");
  });

  it("falls back to the waitlist when full", () => {
    expect(resolveGateMode(false)).toBe("waitlist");
  });

  it("falls back to the waitlist when capacity is unknown", () => {
    expect(resolveGateMode(null)).toBe("waitlist");
  });
});

describe("offer attribution", () => {
  it("keeps a real offer id", () => {
    expect(parseOfferParam("custom")).toBe("custom");
  });

  it("degrades anything else to unknown rather than throwing", () => {
    expect(parseOfferParam("personal")).toBe("unknown");
    expect(parseOfferParam(undefined)).toBe("unknown");
    expect(parseOfferParam("")).toBe("unknown");
    expect(parseOfferParam("<script>")).toBe("unknown");
  });
});

describe("platform", () => {
  it("accepts the three known values", () => {
    expect(parsePlatform("java")).toBe("java");
    expect(parsePlatform("bedrock")).toBe("bedrock");
    expect(parsePlatform("unsure")).toBe("unsure");
  });

  it("degrades anything else to unsure", () => {
    expect(parsePlatform("switch")).toBe("unsure");
    expect(parsePlatform(null)).toBe("unsure");
  });
});

describe("signup metadata", () => {
  it("carries offer and platform through to the auth trigger", () => {
    expect(signupMetadata("build", "java")).toEqual({
      source_offer: "build",
      platform: "java",
    });
  });

  it("never emits keys the profiles CHECK constraint would reject", () => {
    const meta = signupMetadata("nonsense" as never, "nonsense" as never);
    expect(meta.source_offer).toBe("unknown");
    expect(meta.platform).toBe("unsure");
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/test/gate.test.ts`
Expected: FAIL — cannot resolve `@/lib/gate`.

- [ ] **Step 3: Write the gate logic**

```typescript
// src/lib/gate.ts
import { isOfferId, type OfferId } from "@/lib/offers";

export type GateMode = "register" | "waitlist";
export type SourceOffer = OfferId | "unknown";
export type Platform = "java" | "bedrock" | "unsure";

const PLATFORMS: readonly Platform[] = ["java", "bedrock", "unsure"];

/** Capacity is decided server-side by registration_open(). A null means the
 *  check failed; a full waitlist is the safe direction to fail in, because the
 *  handle_new_user trigger would reject the signup anyway. */
export function resolveGateMode(open: boolean | null): GateMode {
  return open === true ? "register" : "waitlist";
}

export function parseOfferParam(raw: unknown): SourceOffer {
  return isOfferId(raw) ? raw : "unknown";
}

export function parsePlatform(raw: unknown): Platform {
  return PLATFORMS.includes(raw as Platform) ? (raw as Platform) : "unsure";
}

/** Shape passed as supabase.auth.signUp options.data, read by handle_new_user(). */
export function signupMetadata(offer: unknown, platform: unknown) {
  return {
    source_offer: parseOfferParam(offer),
    platform: parsePlatform(platform),
  };
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/test/gate.test.ts`
Expected: PASS, 9 tests.

- [ ] **Step 5: Write the copy guardrail test**

This enforces the spec's forbidden-claims list against every public route. Three agents write to this repo; this is what stops a well-meaning one from adding a fake testimonial.

```typescript
// src/test/copy.test.ts
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PUBLIC_ROUTES = ["index.tsx", "skins.tsx", "ai-helper.tsx", "build.tsx", "custom.tsx", "join.tsx"];
const SITE_DIR = "src/components/site";

function publicSource(): string {
  const routes = PUBLIC_ROUTES.map((f) => {
    try {
      return readFileSync(join("src/routes", f), "utf8");
    } catch {
      return "";
    }
  });
  let components: string[] = [];
  try {
    components = readdirSync(SITE_DIR)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => readFileSync(join(SITE_DIR, f), "utf8"));
  } catch {
    components = [];
  }
  return [...routes, ...components].join("\n");
}

describe("public copy compliance", () => {
  const source = publicSource();

  it("never positions the product as an AI skin generator", () => {
    expect(source).not.toMatch(/ai (skin )?generator/i);
    expect(source).not.toMatch(/generate your skin/i);
  });

  it("never misspells genius", () => {
    expect(source).not.toMatch(/genious/i);
  });

  it("makes no turnaround promise", () => {
    expect(source).not.toMatch(/\b(24|48|72)[- ]hour/i);
    expect(source).not.toMatch(/same[- ]day|next[- ]day|delivered in \d/i);
  });

  it("claims no user counts or ratings", () => {
    expect(source).not.toMatch(/\d[\d,.]*\+? (users|creators|customers|players) /i);
    expect(source).not.toMatch(/\d(\.\d)? out of 5|★|⭐/);
  });

  it("carries no testimonials", () => {
    expect(source).not.toMatch(/testimonial/i);
  });

  it("claims no likeness fidelity", () => {
    expect(source).not.toMatch(/exact likeness|photo[- ]realistic|guaranteed likeness/i);
  });
});
```

- [ ] **Step 6: Run the guardrail**

Run: `npx vitest run src/test/copy.test.ts`
Expected: PASS, 6 tests. It passes on an empty codebase and keeps passing as pages are added — that is the point.

- [ ] **Step 7: Commit**

```bash
git add src/lib/gate.ts src/test/gate.test.ts src/test/copy.test.ts
git commit -m "Add gate capacity logic and public copy compliance guardrail"
```

---

## Task 6: Design tokens and the site shell

**Files:**
- Create: `src/site.css`, `src/components/site/SiteShell.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: the token table from `docs/design-system.md` (Task 1); `OFFERS` from Task 4.
- Produces: `<SiteShell>` wrapping every public page; CSS custom properties `--gs-*` on `.gs`.

- [ ] **Step 1: Write `src/site.css`**

Scope every token under `.gs` so the editor's existing dark theme is untouched. Fill each value from the Task 1 token table — the placeholders below marked `/* from design-system.md */` must be replaced with the sourced values, not invented here.

```css
/* Public surface only. The editor keeps its own theme; nothing here leaks into it. */
.gs {
  --gs-canvas: /* from design-system.md */;
  --gs-surface: /* from design-system.md */;
  --gs-ink: /* from design-system.md */;
  --gs-ink-muted: /* from design-system.md */;
  --gs-line: /* from design-system.md */;
  --gs-accent: /* from design-system.md */;
  --gs-accent-ink: /* from design-system.md */;
  --gs-signal-assist: /* from design-system.md */;
  --gs-signal-human: /* from design-system.md */;
  --gs-signal-build: /* from design-system.md */;
  --gs-radius: /* from design-system.md */;
  --gs-gutter: /* from design-system.md */;
  --gs-font-display: /* from design-system.md */;
  --gs-font-body: /* from design-system.md */;
  --gs-font-pixel: /* from design-system.md */;

  background: var(--gs-canvas);
  color: var(--gs-ink);
  font-family: var(--gs-font-body);
  min-height: 100vh;
}

.gs h1, .gs h2, .gs h3 { font-family: var(--gs-font-display); }
.gs .gs-pixel { font-family: var(--gs-font-pixel); }

.gs a:focus-visible,
.gs button:focus-visible {
  outline: 3px solid var(--gs-ink);
  outline-offset: 2px;
}

.gs-skip {
  position: absolute;
  left: -9999px;
}
.gs-skip:focus {
  left: var(--gs-gutter);
  top: var(--gs-gutter);
  z-index: 50;
  background: var(--gs-surface);
  padding: 0.5rem 0.75rem;
}

@media (prefers-reduced-motion: reduce) {
  .gs *, .gs *::before, .gs *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 2: Import it**

Add to the top of `src/styles.css`, after the existing Tailwind import line:

```css
@import "./site.css";
```

- [ ] **Step 3: Write the shell**

```tsx
// src/components/site/SiteShell.tsx
import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { recordValidationEvent } from "@/lib/validation";
import { supabase } from "@/integrations/supabase/client";

type ViewName = "home" | "skins" | "ai-helper" | "build" | "custom";

/** Server-side view counting. Traffic is driven from outside, so a visitor who
 *  bounces must still be counted; localStorage cannot see them. Failure here is
 *  never allowed to affect the page. */
function recordView(view: ViewName) {
  void supabase.rpc("record_offer_view", { _offer: view }).catch(() => {});
}

export function SiteShell({ view, children }: { view: ViewName; children: ReactNode }) {
  useEffect(() => {
    recordView(view);
    recordValidationEvent("landing_viewed", { route: view });
  }, [view]);

  return (
    <div className="gs">
      <a className="gs-skip" href="#main">Skip to content</a>
      <header className="gs-header">
        <Link to="/" aria-label="GagaSkin home">GagaSkin</Link>
        <nav aria-label="Primary">
          <Link to="/skins">Skins</Link>
          <Link to="/custom">Custom orders</Link>
          <Link to="/join">Sign in</Link>
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="gs-footer">
        <p className="gs-pixel">No ads. No redirects. Your skin is yours.</p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: Verify tokens resolved**

Run: `grep -c "from design-system.md" src/site.css`
Expected: `0`. A non-zero result means a token was left unsourced.

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: completes with `built in`.

- [ ] **Step 6: Commit**

```bash
git add src/site.css src/styles.css src/components/site/SiteShell.tsx
git commit -m "Add public design tokens and site shell"
```

---

## Task 7: The gate page

**Files:**
- Create: `src/routes/join.tsx`
- Modify: `src/routes/auth.tsx`

**Interfaces:**
- Consumes: `resolveGateMode`, `parseOfferParam`, `parsePlatform`, `signupMetadata` (Task 5); `SiteShell` (Task 6); `registration_open` RPC (Task 3).
- Produces: the `/join` route. `/auth` becomes a redirect.

- [ ] **Step 1: Write the route**

```tsx
// src/routes/join.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import {
  parseOfferParam,
  parsePlatform,
  resolveGateMode,
  signupMetadata,
  type GateMode,
  type Platform,
} from "@/lib/gate";
import { recordValidationEvent } from "@/lib/validation";

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: parseOfferParam(search["from"]),
  }),
  head: () => ({
    meta: [
      { title: "Create your account — GagaSkin" },
      {
        name: "description",
        content:
          "Create a GagaSkin account to use the Minecraft skin editor and order a custom skin.",
      },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { from } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const [mode, setMode] = useState<GateMode | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [platform, setPlatform] = useState<Platform>("unsure");
  const [attested, setAttested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/editor", replace: true });
  }, [user, navigate]);

  useEffect(() => {
    supabase
      .rpc("registration_open")
      .then(({ data, error }) => setMode(resolveGateMode(error ? null : (data as boolean))))
      .catch(() => setMode(resolveGateMode(null)));
  }, []);

  const register = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: signupMetadata(from, platform),
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      recordValidationEvent("account_created", { offer: from, platform });
      setJoined(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign-up failed.";
      // The handle_new_user trigger rejects over-cap signups even if the client missed it.
      if (message.includes("registration_closed")) {
        setMode("waitlist");
        toast.error("Registration just filled up. Join the waitlist instead.");
      } else {
        toast.error(message);
      }
    } finally {
      setBusy(false);
    }
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Sign-in failed.");
    } finally {
      setBusy(false);
    }
  };

  const joinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase
        .from("waitlist")
        .insert({ email, source_offer: from });
      if (error && !error.message.includes("duplicate")) throw error;
      recordValidationEvent("waitlist_joined", { offer: from });
      setJoined(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not join the waitlist.");
    } finally {
      setBusy(false);
    }
  };

  if (joined) {
    return (
      <SiteShell view="home">
        <section className="gs-join">
          <h1>{mode === "waitlist" ? "You are on the list." : "Check your email."}</h1>
          <p>
            {mode === "waitlist"
              ? "We will email you as soon as a place opens up."
              : "Confirm your address, then sign in and start building."}
          </p>
        </section>
      </SiteShell>
    );
  }

  return (
    <SiteShell view="home">
      <section className="gs-join">
        <h1>{signingIn ? "Sign in" : "Create your account"}</h1>
        <p className="gs-trust">
          No ads. No redirects. Nothing sold. Every skin you make is yours to download and
          keep.
        </p>

        {mode === null && <p>Checking availability…</p>}

        {mode === "waitlist" && !signingIn && (
          <form onSubmit={joinWaitlist}>
            <p>
              We are keeping the group small while we build. Leave your email and we will
              open a place for you.
            </p>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" disabled={busy}>Join the waitlist</Button>
          </form>
        )}

        {mode === "register" && !signingIn && (
          <form onSubmit={register}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <fieldset>
              <legend>Where do you play?</legend>
              {(["java", "bedrock", "unsure"] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="platform"
                    value={value}
                    checked={platform === value}
                    onChange={() => setPlatform(value)}
                  />
                  {value === "java" ? "Java" : value === "bedrock" ? "Bedrock" : "Not sure yet"}
                </label>
              ))}
              <p className="gs-hint">
                Java and Bedrock accept different skin files. We use this so you do not build
                something your game will not take.
              </p>
            </fieldset>

            <label className="gs-attest">
              <input
                type="checkbox"
                required
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
              />
              I am 13 or older, or I am a parent or guardian creating this account for my
              child.
            </label>

            <Button type="submit" disabled={busy || !attested}>Create account</Button>
          </form>
        )}

        {signingIn && (
          <form onSubmit={signIn}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button type="submit" disabled={busy}>Sign in</Button>
          </form>
        )}

        <button type="button" onClick={() => setSigningIn(!signingIn)}>
          {signingIn ? "Need an account?" : "Already have an account? Sign in"}
        </button>
      </section>
    </SiteShell>
  );
}
```

- [ ] **Step 2: Add the new event names**

In `src/lib/validation.ts`, extend the `VALIDATION_EVENTS` array with `"account_created"`, `"waitlist_joined"`, `"order_submitted"`, `"order_released"`, `"order_delivered"`, `"gallery_skin_published"`. Keep the existing entries.

- [ ] **Step 3: Redirect `/auth` to `/join`**

Replace the body of `src/routes/auth.tsx` with a redirect so old links and Lovable's OAuth callback still land somewhere real:

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  beforeLoad: () => {
    throw redirect({ to: "/join", search: { from: "unknown" } });
  },
});
```

- [ ] **Step 4: Verify**

Run: `npm run build`
Expected: `built in`, and `src/routeTree.gen.ts` now lists `/join`.

Run: `npx vitest run`
Expected: all tests pass, including `copy.test.ts` against the new `join.tsx`.

- [ ] **Step 5: Commit**

```bash
git add src/routes/join.tsx src/routes/auth.tsx src/lib/validation.ts src/routeTree.gen.ts
git commit -m "Add /join gate with capacity waitlist, attestation and platform capture"
```

---

## Task 8: Gate the editor and honour the pitch

**Files:**
- Modify: `src/routes/editor.tsx`

**Interfaces:**
- Consumes: `useSession`; `OFFERS` (Task 4).
- Produces: `/editor?start=ai-helper|build`, redirecting anonymous visitors to `/join`.

- [ ] **Step 1: Add search validation and the session gate**

In `src/routes/editor.tsx`, add to the `createFileRoute("/editor")` options:

```tsx
validateSearch: (search: Record<string, unknown>) => ({
  start: search["start"] === "ai-helper" || search["start"] === "build"
    ? (search["start"] as "ai-helper" | "build")
    : undefined,
}),
```

Inside the editor component, add the redirect. Place it with the existing hooks, before any early return:

```tsx
const { user, loading } = useSession();
const navigate = useNavigate();
const { start } = Route.useSearch();

useEffect(() => {
  if (!loading && !user) {
    void navigate({ to: "/join", search: { from: start === "custom" ? "custom" : start ?? "unknown" }, replace: true });
  }
}, [loading, user, start, navigate]);
```

Import `useNavigate` from `@tanstack/react-router` and `useSession` from `@/hooks/useSession` if not already imported.

- [ ] **Step 2: Honour the pitch**

The editor already renders `AutoDesignPanel` and `ReferencePanel`. Drive their initial open state from `start` rather than adding new UI:

```tsx
const assistOpen = start !== "build";
```

Pass `assistOpen` to whichever prop controls the initial visibility of `AutoDesignPanel` and `ReferencePanel`. If those components do not accept such a prop, wrap them instead:

```tsx
{assistOpen && <AutoDesignPanel />}
{assistOpen && <ReferencePanel />}
```

Do not modify the panel components themselves — the editor's internals are out of scope.

- [ ] **Step 3: Verify both doors**

Run: `npm run dev`, then in a browser:
- Visit `/editor` signed out → lands on `/join`.
- Sign in, visit `/editor?start=build` → no reference or auto-design panel visible, no occurrence of the word "AI" on screen.
- Visit `/editor?start=ai-helper` → both panels visible.

- [ ] **Step 4: Commit**

```bash
git add src/routes/editor.tsx src/routeTree.gen.ts
git commit -m "Gate the editor behind /join and honour the pitch it was sold under"
```

---

## Task 9: Gallery data access

**Files:**
- Create: `src/lib/gallery.ts`
- Test: `src/test/gallery.test.ts`

**Interfaces:**
- Consumes: `OfferId` (Task 4); `gallery_skins` table and `gallery` bucket (Task 3).
- Produces: `GallerySkin`, `sortGallery(skins)`, `publicImageUrl(path)`, `fetchPublishedSkins()`, `publishSkin(input)`.

- [ ] **Step 1: Write the failing test**

Only the pure parts are unit-tested; the Supabase calls are verified in the browser in Task 10.

```typescript
// src/test/gallery.test.ts
import { describe, expect, it } from "vitest";

import { sortGallery, type GallerySkin } from "@/lib/gallery";

function skin(over: Partial<GallerySkin>): GallerySkin {
  return {
    id: "a",
    title: "t",
    inspirationPath: "i.png",
    ingamePath: "g.png",
    skinPngPath: null,
    madeWith: "custom",
    published: true,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("gallery ordering", () => {
  it("puts lower sort_order first", () => {
    const out = sortGallery([
      skin({ id: "b", sortOrder: 2 }),
      skin({ id: "a", sortOrder: 1 }),
    ]);
    expect(out.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("breaks ties with newest first", () => {
    const out = sortGallery([
      skin({ id: "old", sortOrder: 0, createdAt: "2026-01-01T00:00:00Z" }),
      skin({ id: "new", sortOrder: 0, createdAt: "2026-06-01T00:00:00Z" }),
    ]);
    expect(out.map((s) => s.id)).toEqual(["new", "old"]);
  });

  it("does not mutate its input", () => {
    const input = [skin({ id: "b", sortOrder: 2 }), skin({ id: "a", sortOrder: 1 })];
    sortGallery(input);
    expect(input.map((s) => s.id)).toEqual(["b", "a"]);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/test/gallery.test.ts`
Expected: FAIL — cannot resolve `@/lib/gallery`.

- [ ] **Step 3: Write the module**

```typescript
// src/lib/gallery.ts
import { supabase } from "@/integrations/supabase/client";
import type { OfferId } from "@/lib/offers";

export interface GallerySkin {
  id: string;
  title: string;
  inspirationPath: string;
  ingamePath: string;
  skinPngPath: string | null;
  madeWith: OfferId;
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PublishSkinInput {
  title: string;
  inspirationPath: string;
  ingamePath: string;
  skinPngPath: string | null;
  madeWith: OfferId;
  sortOrder: number;
}

export function sortGallery(skins: readonly GallerySkin[]): GallerySkin[] {
  return [...skins].sort(
    (a, b) =>
      a.sortOrder - b.sortOrder || Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function publicImageUrl(path: string): string {
  return supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl;
}

function fromRow(row: Record<string, unknown>): GallerySkin {
  return {
    id: row["id"] as string,
    title: row["title"] as string,
    inspirationPath: row["inspiration_path"] as string,
    ingamePath: row["ingame_path"] as string,
    skinPngPath: (row["skin_png_path"] as string | null) ?? null,
    madeWith: row["made_with"] as OfferId,
    published: row["published"] as boolean,
    sortOrder: row["sort_order"] as number,
    createdAt: row["created_at"] as string,
  };
}

export async function fetchPublishedSkins(): Promise<GallerySkin[]> {
  const { data, error } = await supabase
    .from("gallery_skins")
    .select("*")
    .eq("published", true);
  if (error) throw error;
  return sortGallery((data ?? []).map(fromRow));
}

/** Creator-only. RLS rejects this for anyone without the creator role. */
export async function publishSkin(input: PublishSkinInput): Promise<void> {
  const { error } = await supabase.from("gallery_skins").insert({
    title: input.title,
    inspiration_path: input.inspirationPath,
    ingame_path: input.ingamePath,
    skin_png_path: input.skinPngPath,
    made_with: input.madeWith,
    sort_order: input.sortOrder,
    published: true,
  });
  if (error) throw error;
}

export async function uploadGalleryImage(file: File, prefix: string): Promise<string> {
  const path = `${prefix}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("gallery").upload(path, file);
  if (error) throw error;
  return path;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/test/gallery.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/gallery.ts src/test/gallery.test.ts
git commit -m "Add gallery data access with deterministic ordering"
```

---

## Task 10: BeforeAfter, SkinGrid and /skins

**Files:**
- Create: `src/components/site/BeforeAfter.tsx`, `src/components/site/SkinGrid.tsx`, `src/routes/skins.tsx`

**Interfaces:**
- Consumes: `GallerySkin`, `fetchPublishedSkins`, `publicImageUrl` (Task 9); `getOffer`, `OFFERS` (Task 4); `SiteShell` (Task 6).
- Produces: `<BeforeAfter skin={...} />`, `<SkinGrid skins={...} />`, the `/skins` route.

- [ ] **Step 1: Write BeforeAfter**

Every pair carries the path that made it. An unlabelled pair implies an outcome-fidelity claim the product has not validated.

```tsx
// src/components/site/BeforeAfter.tsx
import { Link } from "@tanstack/react-router";

import { publicImageUrl, type GallerySkin } from "@/lib/gallery";
import { getOffer } from "@/lib/offers";
import { recordValidationEvent } from "@/lib/validation";

const MADE_WITH_LABEL: Record<GallerySkin["madeWith"], string> = {
  "ai-helper": "Made with AI Helper",
  custom: "Made by Grace",
  build: "Made in the editor",
};

export function BeforeAfter({ skin }: { skin: GallerySkin }) {
  const offer = getOffer(skin.madeWith);
  return (
    <figure className={`gs-pair gs-pair--${offer.tone}`}>
      <div className="gs-pair__images">
        <img
          src={publicImageUrl(skin.inspirationPath)}
          alt={`Inspiration for ${skin.title}`}
          loading="lazy"
          decoding="async"
        />
        <img
          src={publicImageUrl(skin.ingamePath)}
          alt={`${skin.title} worn in Minecraft`}
          loading="lazy"
          decoding="async"
        />
      </div>
      <figcaption>
        <strong>{skin.title}</strong>
        <Link
          to={offer.route}
          className="gs-pixel gs-pair__path"
          onClick={() =>
            recordValidationEvent("offer_path_started", {
              offer: skin.madeWith,
              location: "gallery",
            })
          }
        >
          {MADE_WITH_LABEL[skin.madeWith]}
        </Link>
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 2: Write SkinGrid**

```tsx
// src/components/site/SkinGrid.tsx
import { BeforeAfter } from "@/components/site/BeforeAfter";
import type { GallerySkin } from "@/lib/gallery";

export function SkinGrid({ skins }: { skins: readonly GallerySkin[] }) {
  if (skins.length === 0) {
    return <p className="gs-empty">Grace is making the first ones now.</p>;
  }
  return (
    <div className="gs-grid">
      {skins.map((skin) => (
        <BeforeAfter key={skin.id} skin={skin} />
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write /skins**

```tsx
// src/routes/skins.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/site/SiteShell";
import { SkinGrid } from "@/components/site/SkinGrid";
import { fetchPublishedSkins, type GallerySkin } from "@/lib/gallery";

export const Route = createFileRoute("/skins")({
  head: () => ({
    meta: [
      { title: "Skins — GagaSkin" },
      {
        name: "description",
        content:
          "Every Minecraft skin Grace has published, shown beside the idea it started from.",
      },
    ],
  }),
  component: SkinsPage,
});

function SkinsPage() {
  const [skins, setSkins] = useState<GallerySkin[] | null>(null);

  useEffect(() => {
    fetchPublishedSkins()
      .then(setSkins)
      .catch(() => setSkins([]));
  }, []);

  return (
    <SiteShell view="skins">
      <section className="gs-skins">
        <h1>Every skin, and the idea it came from.</h1>
        <p>
          Each one is shown twice: what it started as, and what it looks like in the game.
        </p>
        {skins === null ? <p>Loading…</p> : <SkinGrid skins={skins} />}
      </section>
    </SiteShell>
  );
}
```

- [ ] **Step 4: Add grid styles to `src/site.css`**

```css
.gs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--gs-gutter);
}
.gs-pair__images { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; }
.gs-pair__images img { width: 100%; height: auto; display: block; image-rendering: pixelated; }
```

- [ ] **Step 5: Verify**

Run: `npm run build` → `built in`.
Run: `npx vitest run` → all pass.
Browser: `/skins` renders, shows the empty state with no console errors, and the page does not scroll horizontally at 390px width.

- [ ] **Step 6: Commit**

```bash
git add src/components/site/BeforeAfter.tsx src/components/site/SkinGrid.tsx src/routes/skins.tsx src/site.css src/routeTree.gen.ts
git commit -m "Add /skins directory with labelled before/after proof pairs"
```

---

## Task 11: Home page

**Files:**
- Create: `src/components/site/OfferPortals.tsx`
- Modify: `src/routes/index.tsx`

**Interfaces:**
- Consumes: `OFFERS` (Task 4); `SiteShell` (Task 6); `SkinGrid`, `fetchPublishedSkins` (Tasks 9–10).
- Produces: `<OfferPortals />`, the home route.

- [ ] **Step 1: Write OfferPortals**

```tsx
// src/components/site/OfferPortals.tsx
import { Link } from "@tanstack/react-router";

import { OFFERS } from "@/lib/offers";
import { recordValidationEvent } from "@/lib/validation";

export function OfferPortals({ location }: { location: string }) {
  return (
    <div className="gs-portals">
      {OFFERS.map((offer) => (
        <Link
          key={offer.id}
          to={offer.route}
          className={`gs-portal gs-portal--${offer.tone}`}
          onClick={() =>
            recordValidationEvent("offer_path_started", { offer: offer.id, location })
          }
        >
          <span className="gs-pixel">{offer.levelOfHelp}</span>
          <strong>{offer.name}</strong>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write the home page**

The hero pair is the first published skin and is the LCP element, so it is eager-loaded and given explicit dimensions. Everything below it lazy-loads.

```tsx
// src/routes/index.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { OfferPortals } from "@/components/site/OfferPortals";
import { SiteShell } from "@/components/site/SiteShell";
import { SkinGrid } from "@/components/site/SkinGrid";
import { fetchPublishedSkins, publicImageUrl, type GallerySkin } from "@/lib/gallery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GagaSkin — the Minecraft skin you have in your head" },
      {
        name: "description",
        content:
          "Bring an idea, and get a Minecraft skin that still feels like it. Help me do it, do it for me, or let me do it.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [skins, setSkins] = useState<GallerySkin[]>([]);

  useEffect(() => {
    fetchPublishedSkins()
      .then(setSkins)
      .catch(() => setSkins([]));
  }, []);

  const hero = skins[0];

  return (
    <SiteShell view="home">
      <section className="gs-hero">
        <h1>I have a vision. Help me express it in a skin.</h1>
        <p className="gs-hero__lead">
          Bring an idea — a drawing, a character, an outfit you have pictured — and end up
          with a Minecraft skin that still feels like it once it is 64 pixels wide.
        </p>
        <p className="gs-trust gs-pixel">
          No ads. No redirects. Nothing sold. Every skin is yours to keep.
        </p>
        {hero && (
          <figure className="gs-hero__pair">
            <img
              src={publicImageUrl(hero.inspirationPath)}
              alt={`Inspiration for ${hero.title}`}
              width={512}
              height={512}
              fetchPriority="high"
              decoding="async"
            />
            <img
              src={publicImageUrl(hero.ingamePath)}
              alt={`${hero.title} worn in Minecraft`}
              width={512}
              height={512}
              fetchPriority="high"
              decoding="async"
            />
            <figcaption className="gs-pixel">The idea, and the skin in the game.</figcaption>
          </figure>
        )}
      </section>

      <section className="gs-translate" aria-labelledby="translate-heading">
        <h2 id="translate-heading">How an idea becomes a skin.</h2>
        <ol className="gs-steps">
          <li><strong>The idea.</strong> A picture, a character, a description.</li>
          <li><strong>The colours.</strong> Pulled out and made Minecraft-ready.</li>
          <li><strong>The pixels.</strong> Every face of the model, yours to change.</li>
          <li><strong>In the game.</strong> Exported and worn.</li>
        </ol>
      </section>

      <section className="gs-gallery-preview" aria-labelledby="gallery-heading">
        <h2 id="gallery-heading">Skins Grace has made.</h2>
        <SkinGrid skins={skins.slice(0, 6)} />
        <Link to="/skins" className="gs-pixel">See every skin</Link>
      </section>

      <section className="gs-choose" aria-labelledby="choose-heading">
        <h2 id="choose-heading">Three ways to get there.</h2>
        <OfferPortals location="home" />
      </section>
    </SiteShell>
  );
}
```

- [ ] **Step 3: Verify the copy guardrail still passes**

Run: `npx vitest run src/test/copy.test.ts`
Expected: PASS. If it fails, the home copy has crossed a line in the spec — fix the copy, not the test.

- [ ] **Step 4: Verify the LCP budget**

Run `npm run build && npm run preview`, then in the browser open the home page and read the LCP from the performance panel or run:

```js
new PerformanceObserver((l) => console.log("LCP", l.getEntries().at(-1).startTime)).observe({ type: "largest-contentful-paint", buffered: true });
```

Expected: under 1500ms. If it is over, the hero images are the cause — convert them to WebP before anything else.

- [ ] **Step 5: Commit**

```bash
git add src/components/site/OfferPortals.tsx src/routes/index.tsx
git commit -m "Add home page built on the vision-to-skin spine"
```

---

## Task 12: The two editor landing pages

**Files:**
- Modify: `src/routes/ai-helper.tsx`, `src/routes/build.tsx`

**Interfaces:**
- Consumes: `SiteShell` (Task 6); `getOffer` (Task 4).
- Produces: `/ai-helper` and `/build`, both linking to `/join?from=<id>`.

These are the two pitches for one product. They must argue differently. `/build` must contain no reference to AI at all.

- [ ] **Step 1: Write /ai-helper**

```tsx
// src/routes/ai-helper.tsx
import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/site/SiteShell";
import { recordValidationEvent } from "@/lib/validation";

export const Route = createFileRoute("/ai-helper")({
  head: () => ({
    meta: [
      { title: "AI Helper — GagaSkin" },
      {
        name: "description",
        content:
          "Bring a reference and get a starting plan you can change pixel by pixel. Smart Assist proposes; you decide.",
      },
    ],
  }),
  component: AiHelperPage,
});

function AiHelperPage() {
  return (
    <SiteShell view="ai-helper">
      <section className="gs-offer gs-offer--assist">
        <p className="gs-pixel">Help me do it</p>
        <h1>Never start from an empty grid again.</h1>
        <p>
          Drop in the picture you have been staring at. GagaSkin pulls its colours, works out
          which part of the image belongs on which face of the model, and lays down a
          starting point.
        </p>
        <h2>It proposes. You decide.</h2>
        <p>
          Everything it puts down is ordinary editable pixels. Change any one of them, undo
          any of it, or paint straight over the lot. There is no locked layer and nothing you
          cannot take apart.
        </p>
        <ol className="gs-steps">
          <li>Bring a reference image.</li>
          <li>Get its palette, made Minecraft-ready.</li>
          <li>Get a starting plan across every face.</li>
          <li>Change whatever you want.</li>
        </ol>
        <Link
          to="/join"
          search={{ from: "ai-helper" }}
          className="gs-cta"
          onClick={() =>
            recordValidationEvent("offer_path_started", {
              offer: "ai-helper",
              location: "landing",
            })
          }
        >
          Create your account
        </Link>
      </section>
    </SiteShell>
  );
}
```

- [ ] **Step 2: Write /build**

```tsx
// src/routes/build.tsx
import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/site/SiteShell";
import { recordValidationEvent } from "@/lib/validation";

export const Route = createFileRoute("/build")({
  head: () => ({
    meta: [
      { title: "Awesome Editor — GagaSkin" },
      {
        name: "description",
        content:
          "A Minecraft skin editor built for Minecraft. Every face at once, exact pixels, live 3D, clean 64 x 64 export.",
      },
    ],
  }),
  component: BuildPage,
});

function BuildPage() {
  return (
    <SiteShell view="build">
      <section className="gs-offer gs-offer--build">
        <p className="gs-pixel">Let me do it</p>
        <h1>An editor that knows what a Minecraft skin is.</h1>
        <p>
          Not a general pixel canvas with a Minecraft template bolted on. Every face of the
          model laid out at once, with the boundaries where they actually are.
        </p>
        <ul className="gs-features">
          <li><strong>See the whole model.</strong> Head, body, arms, legs, both layers.</li>
          <li><strong>Watch it in 3D.</strong> The model turns as you paint.</li>
          <li><strong>Undo anything.</strong> Full history, no surprises.</li>
          <li><strong>Export clean.</strong> A correct 64 x 64 PNG the game accepts.</li>
          <li><strong>Keep your projects.</strong> Saved to your account, open anywhere.</li>
        </ul>
        <p className="gs-trust">
          No ads. No fake download buttons. No redirects on the way out.
        </p>
        <Link
          to="/join"
          search={{ from: "build" }}
          className="gs-cta"
          onClick={() =>
            recordValidationEvent("offer_path_started", {
              offer: "build",
              location: "landing",
            })
          }
        >
          Create your account
        </Link>
      </section>
    </SiteShell>
  );
}
```

- [ ] **Step 3: Verify the pitches stay separate**

Run: `grep -ci "\bai\b\|smart assist\|artificial" src/routes/build.tsx`
Expected: `0`. The Awesome Editor pitch never mentions AI.

Run: `npx vitest run src/test/copy.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/routes/ai-helper.tsx src/routes/build.tsx
git commit -m "Rebuild the two editor landing pages as distinct pitches"
```

---

## Task 13: Orders data access

**Files:**
- Create: `src/lib/orders.ts`, `src/lib/roles.ts`
- Test: `src/test/orders.test.ts`

**Interfaces:**
- Consumes: `skin_orders`, `has_role` (Task 3); `Platform` (Task 5).
- Produces: `OrderStatus`, `SkinOrder`, `nextStatus(current, actor)`, `submitOrder`, `fetchOrdersFor`, `releaseOrder`, `deliverOrder`, `useRole`.

- [ ] **Step 1: Write the failing test**

The status machine is the part worth testing: it encodes who may move an order where, and it is the safety rule that keeps a submitted order away from Grace.

```typescript
// src/test/orders.test.ts
import { describe, expect, it } from "vitest";

import { nextStatus } from "@/lib/orders";

describe("order status transitions", () => {
  it("lets the guardian release a submitted order", () => {
    expect(nextStatus("submitted", "guardian")).toBe("released");
  });

  it("does not let the creator touch a submitted order", () => {
    expect(nextStatus("submitted", "creator")).toBeNull();
  });

  it("lets the creator start a released order", () => {
    expect(nextStatus("released", "creator")).toBe("in_progress");
  });

  it("lets the creator deliver an order in progress", () => {
    expect(nextStatus("in_progress", "creator")).toBe("delivered");
  });

  it("ends at delivered", () => {
    expect(nextStatus("delivered", "creator")).toBeNull();
    expect(nextStatus("delivered", "guardian")).toBeNull();
  });

  it("gives a customer no transitions at all", () => {
    expect(nextStatus("submitted", "customer")).toBeNull();
    expect(nextStatus("released", "customer")).toBeNull();
    expect(nextStatus("in_progress", "customer")).toBeNull();
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run src/test/orders.test.ts`
Expected: FAIL — cannot resolve `@/lib/orders`.

- [ ] **Step 3: Write the modules**

```typescript
// src/lib/roles.ts
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export type AppRole = "guardian" | "creator";

export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", {
    _user_id: userId,
    _role: role,
  });
  if (error) return false;
  return data === true;
}

export function useRole(userId: string | undefined, role: AppRole) {
  const [granted, setGranted] = useState<boolean | null>(null);
  useEffect(() => {
    if (!userId) {
      setGranted(false);
      return;
    }
    void hasRole(userId, role).then(setGranted);
  }, [userId, role]);
  return granted;
}
```

```typescript
// src/lib/orders.ts
import { supabase } from "@/integrations/supabase/client";
import type { Platform } from "@/lib/gate";

export type OrderStatus = "submitted" | "released" | "in_progress" | "delivered";
export type Actor = "customer" | "guardian" | "creator";

export interface SkinOrder {
  id: string;
  customerId: string;
  brief: string;
  referencePath: string | null;
  platform: Platform;
  priceIntent: string;
  status: OrderStatus;
  creatorId: string | null;
  deliveredProjectId: string | null;
  createdAt: string;
}

/** Who may move an order where. A submitted order is invisible to the creator
 *  until the guardian has released it; that is enforced in RLS too, and this is
 *  the client-side mirror of the same rule. */
export function nextStatus(current: OrderStatus, actor: Actor): OrderStatus | null {
  if (actor === "guardian") return current === "submitted" ? "released" : null;
  if (actor === "creator") {
    if (current === "released") return "in_progress";
    if (current === "in_progress") return "delivered";
  }
  return null;
}

function fromRow(row: Record<string, unknown>): SkinOrder {
  return {
    id: row["id"] as string,
    customerId: row["customer_id"] as string,
    brief: row["brief"] as string,
    referencePath: (row["reference_path"] as string | null) ?? null,
    platform: row["platform"] as Platform,
    priceIntent: row["price_intent"] as string,
    status: row["status"] as OrderStatus,
    creatorId: (row["creator_id"] as string | null) ?? null,
    deliveredProjectId: (row["delivered_project_id"] as string | null) ?? null,
    createdAt: row["created_at"] as string,
  };
}

export async function submitOrder(input: {
  customerId: string;
  brief: string;
  referencePath: string | null;
  platform: Platform;
  priceIntent: string;
}): Promise<void> {
  const { error } = await supabase.from("skin_orders").insert({
    customer_id: input.customerId,
    brief: input.brief,
    reference_path: input.referencePath,
    platform: input.platform,
    price_intent: input.priceIntent,
  });
  if (error) throw error;
}

/** RLS decides what comes back: customers see their own, the guardian sees all,
 *  the creator sees only what was released to her. No client-side filter needed. */
export async function fetchOrders(): Promise<SkinOrder[]> {
  const { data, error } = await supabase
    .from("skin_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(fromRow);
}

export async function releaseOrder(orderId: string, creatorId: string, guardianId: string) {
  const { error } = await supabase
    .from("skin_orders")
    .update({
      status: "released",
      creator_id: creatorId,
      released_at: new Date().toISOString(),
      released_by: guardianId,
    })
    .eq("id", orderId);
  if (error) throw error;
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await supabase.from("skin_orders").update({ status }).eq("id", orderId);
  if (error) throw error;
}

export async function deliverOrder(orderId: string, projectId: string) {
  const { error } = await supabase
    .from("skin_orders")
    .update({ status: "delivered", delivered_project_id: projectId })
    .eq("id", orderId);
  if (error) throw error;
}
```

- [ ] **Step 4: Run it and watch it pass**

Run: `npx vitest run src/test/orders.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/orders.ts src/lib/roles.ts src/test/orders.test.ts
git commit -m "Add order data access and guardian-first status machine"
```

---

## Task 14: /custom landing and order form

**Files:**
- Create: `src/routes/custom.tsx`

**Interfaces:**
- Consumes: `submitOrder` (Task 13); `SiteShell` (Task 6); `useSession`; `fetchPublishedSkins` (Task 9).
- Produces: the `/custom` route — public pitch above, order form for signed-in users below.

- [ ] **Step 1: Write the route**

```tsx
// src/routes/custom.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/SiteShell";
import { SkinGrid } from "@/components/site/SkinGrid";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { fetchPublishedSkins, type GallerySkin } from "@/lib/gallery";
import type { Platform } from "@/lib/gate";
import { submitOrder } from "@/lib/orders";
import { recordValidationEvent } from "@/lib/validation";

const PRICE_INTENTS = [
  { value: "exploring", label: "Just exploring" },
  { value: "5-10", label: "$5 – $10" },
  { value: "10-20", label: "$10 – $20" },
  { value: "20-plus", label: "$20 or more" },
] as const;

export const Route = createFileRoute("/custom")({
  head: () => ({
    meta: [
      { title: "Human Creator Custom Orders — GagaSkin" },
      {
        name: "description",
        content:
          "Describe the skin you want and Grace makes it by hand. A person, not a generator.",
      },
    ],
  }),
  component: CustomPage,
});

function CustomPage() {
  const { user } = useSession();
  const [skins, setSkins] = useState<GallerySkin[]>([]);
  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState<Platform>("unsure");
  const [priceIntent, setPriceIntent] = useState<string>("exploring");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetchPublishedSkins()
      .then((all) => setSkins(all.filter((s) => s.madeWith === "custom")))
      .catch(() => setSkins([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    try {
      let referencePath: string | null = null;
      if (file) {
        const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
        const { error } = await supabase.storage.from("order-refs").upload(path, file);
        if (error) throw error;
        referencePath = path;
      }
      await submitOrder({
        customerId: user.id,
        brief,
        referencePath,
        platform,
        priceIntent,
      });
      recordValidationEvent("order_submitted", { platform, price_intent: priceIntent });
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send your order.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SiteShell view="custom">
      <section className="gs-offer gs-offer--human">
        <p className="gs-pixel">Do it for me</p>
        <h1>Tell Grace what you want. She makes it by hand.</h1>
        <p>
          Grace is twelve, she has been making Minecraft skins for years, and she does this
          the slow way — pixel by pixel, reading what you wrote, until it looks like the
          thing you described.
        </p>
        <p>No generator. No template with your colours swapped in. A person.</p>
      </section>

      <section aria-labelledby="her-work">
        <h2 id="her-work">Skins she has made.</h2>
        <SkinGrid skins={skins} />
      </section>

      <section className="gs-order" aria-labelledby="order-heading">
        <h2 id="order-heading">Start an order</h2>

        {sent ? (
          <p className="gs-sent">
            Your order is in. We read every one before Grace starts, so give us a little
            time and we will come back to you by email.
          </p>
        ) : !user ? (
          <>
            <p>You will need an account so we can send the finished skin back to you.</p>
            <Link
              to="/join"
              search={{ from: "custom" }}
              className="gs-cta"
              onClick={() =>
                recordValidationEvent("offer_path_started", {
                  offer: "custom",
                  location: "landing",
                })
              }
            >
              Create your account
            </Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <label htmlFor="brief">What do you want it to be?</label>
            <textarea
              id="brief"
              required
              minLength={20}
              rows={6}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="The character, the outfit, the colours, and the one detail that matters most."
            />

            <label htmlFor="ref">A picture to work from (optional)</label>
            <input
              id="ref"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <p className="gs-hint">
              Use your own drawing or an image you have the right to share. Please do not
              upload photographs of children.
            </p>

            <fieldset>
              <legend>Where do you play?</legend>
              {(["java", "bedrock", "unsure"] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="platform"
                    value={value}
                    checked={platform === value}
                    onChange={() => setPlatform(value)}
                  />
                  {value === "java" ? "Java" : value === "bedrock" ? "Bedrock" : "Not sure"}
                </label>
              ))}
            </fieldset>

            <fieldset>
              <legend>What were you thinking of paying?</legend>
              {PRICE_INTENTS.map((option) => (
                <label key={option.value}>
                  <input
                    type="radio"
                    name="price"
                    value={option.value}
                    checked={priceIntent === option.value}
                    onChange={() => setPriceIntent(option.value)}
                  />
                  {option.label}
                </label>
              ))}
              <p className="gs-hint">
                Nothing is charged here and this does not agree a price. We are working out
                what is fair.
              </p>
            </fieldset>

            <Button type="submit" disabled={busy}>Send my order</Button>
          </form>
        )}
      </section>
    </SiteShell>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx vitest run src/test/copy.test.ts` → PASS.
Run: `npm run build` → `built in`.

- [ ] **Step 3: Commit**

```bash
git add src/routes/custom.tsx src/routeTree.gen.ts
git commit -m "Add /custom landing with order form and price-intent capture"
```

---

## Task 15: /orders — guardian release and creator inbox

**Files:**
- Create: `src/routes/orders.tsx`

**Interfaces:**
- Consumes: `fetchOrders`, `releaseOrder`, `setOrderStatus`, `deliverOrder`, `nextStatus` (Task 13); `useRole` (Task 13); `publishSkin`, `uploadGalleryImage` (Task 9).
- Produces: the `/orders` route, serving both roles from one page.

- [ ] **Step 1: Write the route**

```tsx
// src/routes/orders.tsx
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { publishSkin, uploadGalleryImage } from "@/lib/gallery";
import type { OfferId } from "@/lib/offers";
import {
  deliverOrder,
  fetchOrders,
  nextStatus,
  releaseOrder,
  setOrderStatus,
  type SkinOrder,
} from "@/lib/orders";
import { useRole } from "@/lib/roles";
import { recordValidationEvent } from "@/lib/validation";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "Orders — GagaSkin" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const isGuardian = useRole(user?.id, "guardian");
  const isCreator = useRole(user?.id, "creator");
  const [orders, setOrders] = useState<SkinOrder[]>([]);
  const [creatorId, setCreatorId] = useState("");

  const refresh = useCallback(() => {
    fetchOrders().then(setOrders).catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/join", search: { from: "unknown" }, replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  const release = async (order: SkinOrder) => {
    if (!user || !creatorId) {
      toast.error("Enter the creator's user id first.");
      return;
    }
    try {
      await releaseOrder(order.id, creatorId, user.id);
      recordValidationEvent("order_released", {});
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Release failed.");
    }
  };

  const advance = async (order: SkinOrder) => {
    const target = nextStatus(order.status, "creator");
    if (!target) return;
    try {
      await setOrderStatus(order.id, target);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed.");
    }
  };

  const deliver = async (order: SkinOrder, projectId: string) => {
    try {
      await deliverOrder(order.id, projectId);
      recordValidationEvent("order_delivered", {});
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delivery failed.");
    }
  };

  if (loading || isGuardian === null || isCreator === null) {
    return <SiteShell view="home"><p>Loading…</p></SiteShell>;
  }

  if (!isGuardian && !isCreator) {
    return (
      <SiteShell view="home">
        <section><h1>Nothing here for this account.</h1></section>
      </SiteShell>
    );
  }

  return (
    <SiteShell view="home">
      <section className="gs-orders">
        <h1>{isGuardian ? "All orders" : "Your orders"}</h1>

        {isGuardian && (
          <label className="gs-hint">
            Creator user id
            <input value={creatorId} onChange={(e) => setCreatorId(e.target.value)} />
          </label>
        )}

        {orders.length === 0 && <p>No orders yet.</p>}

        <ul className="gs-order-list">
          {orders.map((order) => (
            <li key={order.id}>
              <p className="gs-pixel">{order.status} · {order.platform} · {order.priceIntent}</p>
              <p>{order.brief}</p>
              {isGuardian && order.status === "submitted" && (
                <Button onClick={() => void release(order)}>Release to Grace</Button>
              )}
              {isCreator && nextStatus(order.status, "creator") && (
                <Button onClick={() => void advance(order)}>
                  {order.status === "released" ? "Start this" : "Mark delivered"}
                </Button>
              )}
              {isCreator && order.status === "in_progress" && (
                <DeliverForm onDeliver={(projectId) => void deliver(order, projectId)} />
              )}
            </li>
          ))}
        </ul>

        {isCreator && <PublishForm onPublished={refresh} />}
      </section>
    </SiteShell>
  );
}

function DeliverForm({ onDeliver }: { onDeliver: (projectId: string) => void }) {
  const [projectId, setProjectId] = useState("");
  return (
    <div>
      <label className="gs-hint">
        Saved project id
        <input value={projectId} onChange={(e) => setProjectId(e.target.value)} />
      </label>
      <Button onClick={() => onDeliver(projectId)} disabled={!projectId}>Deliver</Button>
    </div>
  );
}

function PublishForm({ onPublished }: { onPublished: () => void }) {
  const [title, setTitle] = useState("");
  const [madeWith, setMadeWith] = useState<OfferId>("custom");
  const [inspiration, setInspiration] = useState<File | null>(null);
  const [ingame, setIngame] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspiration || !ingame) return;
    setBusy(true);
    try {
      const inspirationPath = await uploadGalleryImage(inspiration, "inspiration");
      const ingamePath = await uploadGalleryImage(ingame, "ingame");
      await publishSkin({
        title,
        inspirationPath,
        ingamePath,
        skinPngPath: null,
        madeWith,
        sortOrder: 0,
      });
      recordValidationEvent("gallery_skin_published", { made_with: madeWith });
      setTitle("");
      setInspiration(null);
      setIngame(null);
      onPublished();
      toast.success("Published.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Publish failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={publish} className="gs-publish">
      <h2>Publish a skin to the gallery</h2>
      <label htmlFor="title">Title</label>
      <input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />

      <label htmlFor="made-with">How was it made?</label>
      <select
        id="made-with"
        value={madeWith}
        onChange={(e) => setMadeWith(e.target.value as OfferId)}
      >
        <option value="custom">By hand (Grace)</option>
        <option value="ai-helper">With AI Helper</option>
        <option value="build">In the editor</option>
      </select>

      <label htmlFor="inspiration">The idea it started from</label>
      <input
        id="inspiration"
        type="file"
        accept="image/*"
        required
        onChange={(e) => setInspiration(e.target.files?.[0] ?? null)}
      />

      <label htmlFor="ingame">A screenshot of it in the game</label>
      <input
        id="ingame"
        type="file"
        accept="image/*"
        required
        onChange={(e) => setIngame(e.target.files?.[0] ?? null)}
      />

      <Button type="submit" disabled={busy}>Publish</Button>
    </form>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run build` → `built in`.
Run: `npx vitest run` → all pass.

- [ ] **Step 3: Commit**

```bash
git add src/routes/orders.tsx src/routeTree.gen.ts
git commit -m "Add /orders with guardian release and creator publish"
```

---

## Task 16: Live verification — two accounts, one order

**Files:**
- Create: `docs/qa-receipt-front-end.md`

**Interfaces:**
- Consumes: everything. This is the target-B proof.

This is the task that closes the outstanding verification carried from `docs/qa-receipt.md`. It is performed in a real browser against the hosted database, not simulated.

- [ ] **Step 1: Create both accounts**

Through `/join`: Mike's account from `/join?from=build`, Grace's from `/join?from=custom`. Confirm both emails.

- [ ] **Step 2: Assign roles**

Mike runs Task 3 Step 2's SQL in the Lovable UI with the two real user ids.

- [ ] **Step 3: Prove owner isolation**

Signed in as Mike, save a project in `/editor`. Sign out, sign in as Grace, open `/editor`.

Expected: Grace's project list does not contain Mike's project. Record the two project ids and both list contents.

Then, in the browser console as Grace, attempt a direct read:

```js
const { data, error } = await window.supabase.from("skin_projects").select("id");
console.log(data, error);
```

Expected: only Grace's own rows. This is the live RLS evidence.

- [ ] **Step 4: Prove the gate**

Sign out. Visit `/editor` directly.
Expected: redirect to `/join`.

- [ ] **Step 5: Run the order loop end to end**

1. As Mike, `/custom` → submit an order with a brief and a reference image.
2. As Grace, `/orders` → confirm the order is **not** visible (status `submitted`).
3. As Mike, `/orders` → confirm it is visible; release it to Grace's user id.
4. As Grace, `/orders` → the order now appears. Start it, build a skin in `/editor`, save it, deliver it with the saved project id.
5. As Mike, confirm the order shows `delivered`.

- [ ] **Step 6: Prove the waitlist**

In the Lovable UI, temporarily set the cap below the current profile count:

```sql
UPDATE public.app_settings SET registration_cap = 1 WHERE id = 1;
```

Visit `/join` signed out. Expected: the waitlist form, not the registration form. Submit an email and confirm a row lands in `waitlist`. Then restore the cap:

```sql
UPDATE public.app_settings SET registration_cap = 50 WHERE id = 1;
```

- [ ] **Step 7: Check the front end at 390px**

For `/`, `/skins`, `/ai-helper`, `/build`, `/custom`, `/join`, in a 390 x 844 viewport:

```js
console.log(document.documentElement.scrollWidth, document.documentElement.clientWidth);
```

Expected: equal on every page. Also confirm zero console errors and that the first Tab press reaches the skip link.

- [ ] **Step 8: Write the receipt**

Write `docs/qa-receipt-front-end.md` recording, for each of Steps 3–7: what was run, what was observed, pass or fail. Record the LCP figure from Task 11. Record any failure honestly rather than omitting it.

- [ ] **Step 9: Commit**

```bash
git add docs/qa-receipt-front-end.md
git commit -m "Record live QA: two-account isolation, gate, order loop, waitlist, mobile"
```

---

## Task 17: Ship

**Files:** none new.

- [ ] **Step 1: Full verification**

```bash
npm run build
npx vitest run
```

Expected: build reports `built in`; every test passes.

- [ ] **Step 2: Confirm the record matches reality**

Confirm `supabase/migrations/20260824000000_public_front_end.sql` matches what Mike actually applied, including any fix made during Task 3. If they differ, update the file — a lying migration record is worse than none.

- [ ] **Step 3: Pull, then merge**

```bash
git checkout main
git pull origin main
git merge feat/public-front-end
```

If `src/routeTree.gen.ts` conflicts, do not resolve it by hand:

```bash
git checkout --ours src/routeTree.gen.ts
npm run build
git add src/routeTree.gen.ts
```

- [ ] **Step 4: Push**

```bash
git push origin main
```

- [ ] **Step 5: Confirm the deploy**

Wait for Lovable to build from `main`, then load the live site. Confirm `/`, `/skins` and `/join` render and that `/editor` redirects when signed out.

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
| --- | --- |
| §2 Product spine, offer names | 4, 11 |
| §2 Proof unit, path labels | 10 |
| §3 IA, all routes | 7, 10, 11, 12, 14, 15 |
| §3 /skins directory, creator publishes | 10, 15 |
| §4 Hard gate, trust line | 7, 8 |
| §4 Offer attribution | 4, 5, 7 |
| §4 Capacity + waitlist | 2, 5, 7, 16 |
| §4 Adult attestation | 7 |
| §4 Platform question | 2, 7 |
| §5 `?start=` honouring | 8 |
| §6 Peer accounts, server-managed roles | 2, 13 |
| §6 Live two-account RLS verification | 16 |
| §7 Orders, guardian loop, two-sided RLS | 2, 13, 14, 15 |
| §8 Design system with sources | 1, 6 |
| §9 Server-side offer counters | 2, 6 |
| §11 Phases | 1–17 |
| §12 Lovable UI schema constraint | 2, 3, 17 |
| §13 Forbidden claims | 5 (enforced by test) |

No spec section is unimplemented.

**Placeholder scan:** The only intentional placeholders are the `/* from design-system.md */` token values in Task 6 Step 1, which Task 6 Step 4 verifies are all replaced. Task 3 Step 2 carries `<mike-user-id>` and `<grace-user-id>`, which cannot be known until the accounts exist and are supplied in Task 16 Step 2.

**Type consistency:** `OfferId` (Task 4) is used unchanged in Tasks 5, 9, 10, 15. `Platform` is defined once in Task 5 and imported by Tasks 13 and 14. `GallerySkin` field names match `fromRow` and the SQL columns. `nextStatus` signature matches its use in Task 15. `record_offer_view` takes `_offer` in both the SQL and the `SiteShell` RPC call. `has_role` takes `_user_id` and `_role` in both.

**Repository reality check (added after the plan was first written):** `main` serves the
editor at `/`, not `/editor`, and `src/lib/validation.ts` plus three research docs exist
only on `checkpoint/codex-validation-shell`. Task 1.5 reconciles both before any task
depends on them. Verified with `git ls-tree -r --name-only checkpoint/codex-validation-shell`
against the working tree.

**Known gap carried deliberately:** the order-release notification to Mike is not implemented — the spec leaves the channel open, and Task 15 gives him a working `/orders` view to check instead. Wire an email trigger once the channel is decided.
