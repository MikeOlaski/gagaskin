# Pricing research — GagaSkin

Compiled 2026-08-27 from public commission pages and competitor tooling.
Sources are public price lists, not survey data; treat the numbers as the
observed market range, not a demand curve.

## 1. Hand-made custom skins (competes with `/custom`)

Individual skin artists take commissions publicly, almost all in the
$10–$20 band for a single custom skin:

| Source | Offer | Price |
| --- | --- | --- |
| [Kurfi](https://kurfi.carrd.co/) | 1 custom skin, standard shading | $12 |
| [Kurfi](https://kurfi.carrd.co/) | 1 custom skin, complex shading | $15 |
| [Kurfi](https://kurfi.carrd.co/) | Outfit change on existing skin | $12 |
| [ProbablyLilika](https://msc-homepage.carrd.co/) | 1 custom skin, ≤2 week turnaround | $12 |
| [Toise](https://toise.online/commissions) | 1 custom skin, base cost | £15 (~$19) |
| [Maskyzee](https://maskyzee-commissions.carrd.co/) | 1 custom skin, EUR pricing, pay after first revision | ~€10–15 |

Observations:

- **$12 is the anchor.** It appears independently on multiple artist pages
  as the plain "one skin" price.
- **Complexity surcharge is normal** — +$3 for heavy shading or an extra
  outfit is accepted practice.
- **Revisions are priced into the base**, usually one or two rounds.
- Payment is nearly always manual (PayPal / Ko-fi) and after a first draft.
  A site that takes the payment and delivers the file into the buyer's
  account is a genuine improvement on the category, which supports pricing
  at the top of the band rather than the bottom.

Conclusion: **$18 per custom skin** — above the $12 hobby anchor because
delivery, brief handling, guardian review and revision are handled, and
still under the £15/~$19 upper observed price.

## 2. Editors and assisted tooling (competes with `/build` and `/ai-helper`)

- **Nova Skin** (novaskin.me / novaskin.app) — free, ad-supported, no paid
  tier. The dominant free web editor.
- **The Skindex** — free, ad-supported gallery + editor.
- **Blockbench** — free and open source, no paid tier; a general low-poly
  model editor, not skin-specific.

Implication: **charging for the plain editor is not viable.** Every serious
competitor is free at the point of use, and the free competitors monetise
through ads — which this project explicitly refuses ("No ads. No
redirects.").

The only defensible paid line in the tooling half of the product is the part
that costs money to run: AI-assisted mapping (model inference per plan).
Comparable consumer AI-credit products land at $4–$8/month for a light
usage tier.

Conclusion:

- **Awesome Editor: free.** Matches the category, no ads, and it is the top
  of the funnel for the other two offers.
- **AI Helper: $5/month** (or $40/year, ~33% off), covering a generous but
  finite number of AI plans per month. Cheapest credible price point that
  covers inference and still reads as "pocket money", which matters for
  this audience.

## 3. Chosen pricing

| Offer | Price | Rationale |
| --- | --- | --- |
| Awesome Editor | Free, forever | Category is free; no ads by principle; feeds the other two |
| AI Helper | $5 / month, $40 / year | Covers inference; under the $4–$8 consumer-AI band's midpoint |
| Human Creator Custom Orders | $18 / skin | Above the $12 commission anchor, under the ~$19 top, justified by delivery + review |

## 4. What we still do not know

- Willingness to pay is untested — `/custom` collects a price-intent answer
  (`exploring`, `$5–10`, `$10–20`, `$20+`) on every order. Read that
  distribution before locking $18.
- Whether AI Helper converts better as a subscription or as one-off credit
  packs. Not measurable until payments are live.
- Whether a multi-skin custom bundle (the artists all discount 2–3 skins)
  is worth offering.

Re-run this research when order volume makes the price-intent data
meaningful.
