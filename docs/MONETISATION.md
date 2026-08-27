# Monetisation

Status as of 2026-08-27.

## Is payment wired up?

**No.** There is no payment provider connected to this project — no Stripe,
no Paddle, no Shopify, no payment secrets, no checkout code. Nothing on the
site charges anybody, and `/custom` says so explicitly ("Nothing is charged
on this site and no price is agreed here").

`/pricing` publishes the intended prices (see `PRICING_RESEARCH.md`) but
every button on it leads to signup or the order form, not a checkout.

## What "turning payments on" requires

1. Enable a payment provider on the project. Lovable has built-in Stripe and
   Paddle integrations; neither needs the user's own provider account to
   start, and both create a test environment first. Requires a Pro plan.
2. Create the products/prices with the provider:
   - `ai-helper-monthly` — recurring, $5/month
   - `ai-helper-yearly` — recurring, $40/year
   - `custom-skin` — one-time, $18
3. Persist entitlements in the database (Cloud is already on): a
   `subscriptions` table for AI Helper access, and a payment reference plus
   `paid_at` on `skin_orders` for custom orders.
4. Gate the AI plan server function (`src/lib/skinPlan.functions.ts`) on an
   active subscription. Everything else in the editor stays free.
5. Take the custom-order payment *after* the guardian releases the order,
   not at submission — the guardian reviews the brief first, and charging
   before that means refunding rejected briefs.
6. Webhook handler under `src/routes/api/public/` to keep entitlements in
   sync, with provider signature verification.

## Order of operations

Do not gate anything before payments exist. Until then, `/pricing` is a
price-validation surface: it states the prices, and `/custom`'s price-intent
question measures whether $18 is defensible.

## Explicit decisions

- **No ads, ever.** Free competitors monetise with ads; this project does
  not. It is stated in the site footer and is not up for revisiting.
- **The editor stays free.** Charging for pixel painting loses to Nova Skin
  and The Skindex on day one.
- **Only inference and human labour get charged for** — the two things that
  actually cost money per use.
