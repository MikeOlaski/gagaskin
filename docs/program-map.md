# GagaSkin program map

Updated 2026-08-24. This is the source-of-truth and reuse boundary for the two existing codebases.

## Ownership

| Repository | Role | Authority | Reuse rule |
| --- | --- | --- | --- |
| `/Users/mikeolaski/Workspaces/GagaSkin.com` | Working product and public shell | **Authoritative** | All implementation happens here. It is a Git repo connected to Lovable. |
| `/Users/mikeolaski/Projects/GAGA-Skin` | Older marketing/validation wrapper | Reference only | Do not merge, overwrite, or treat its UI as the editor. It is not currently a Git worktree. |

`GagaSkin.com` is on `main...origin/main`. Lovable syncs pushed history from `main`; never force-push, rebase, amend, or squash pushed history. No deploy, push, Vercel project, or remote mutation was performed in this delivery.

## What exists in the authoritative product

- TanStack Start, Vite, React 19 and TypeScript.
- The real classic 64 × 64 Minecraft UV editor: canonical RGBA buffer, exploded face layout, pixel tools, import/export, live 2D and 3D previews, undo/redo, reference/palette tools, deterministic auto-map and AI plan.
- Supabase Auth plus `skin_projects` with an owner-scoped RLS policy. A saved row can contain the skin bytes, reference image data URL, palette, plan and view state.
- Public routes added in this delivery: `/`, `/ai-helper`, `/personal`, `/build`, `/editor`, and existing `/auth`.

## Safe wrapper reuse

- Validation discipline: count completed downloads and completed request briefs, not CTA clicks.
- Event vocabulary, anonymous local telemetry pattern, privacy cautions, and test thresholds from `VALIDATION.md`.
- Human brief prompts and price-intent framing from `src/components/grace-flow.tsx`, with no copied request-storage implementation or false delivery claim.
- Minecraft-specific design references and the rule that visible examples must be actual Minecraft skin silhouettes, never generic mascots.

## Explicit non-reuse

- No wrapper page/component is imported into this product.
- No claim from its local-only prototype is carried over. Its “no data sent to a backend” boundary does not apply here because signed-in saved projects use Supabase.
- No existing wrapper dashboard, generated sample, analytics export, or Grace request data is migrated.

## Auth and ownership audit

The migration grants CRUD to `authenticated`, enables RLS, and uses `auth.uid() = user_id` for both `USING` and `WITH CHECK`. The client sets `user_id` from `supabase.auth.getUser()` only on creation; update/delete operations are still constrained by RLS.

This is sufficient for Mike and Grace to maintain separate personal editor accounts and isolate their saved projects. No operator/admin role is needed for project ownership. A separate, server-managed operator role is required later only if Grace must receive and manage other people’s human commission requests. Do not use shared credentials or user-editable metadata for that role.

## Verification limit

Static migration and client-flow inspection prove the intended owner-isolation shape. Two live accounts or authenticated Supabase RLS Tester access were not available in this workspace, so a live cross-user query is recorded as an outstanding verification, not claimed as complete.
