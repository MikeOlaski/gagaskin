import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { SiteShell } from "@/components/site/SiteShell";
import { recordValidationEvent } from "@/lib/validation";
import type { OfferId, OfferRoute } from "@/lib/offers";

type PlanKey = "ai_helper_monthly" | "custom_skin";

interface Tier {
  offer: OfferId;
  route: OfferRoute;
  tone: "assist" | "human" | "build";
  name: string;
  levelOfHelp: string;
  price: string;
  unit: string;
  note: string;
  blurb: string;
  includes: readonly string[];
  cta: string;
  /** Payment catalogue key. Absent for the free tier. */
  plan?: PlanKey;
}

/** Prices come from docs/PRICING_RESEARCH.md. Paid tiers go through checkout;
 *  see docs/MONETISATION.md. */
const TIERS: readonly Tier[] = [
  {
    offer: "build",
    route: "/build",
    tone: "build",
    name: "Awesome Editor",
    levelOfHelp: "Let me do it",
    price: "Free",
    unit: "forever",
    note: "No ads. No redirects.",
    blurb:
      "The whole editor, every face of the model, every tool. Free because painting pixels should be.",
    includes: [
      "Every face of the model laid out flat",
      "Pencil, eraser, fill, eyedropper, undo",
      "Independent left and right arms and legs",
      "Import and export a clean 64×64 skin",
      "Live 2D and 3D preview",
      "Save your projects to your account",
    ],
    cta: "Start painting",
  },
  {
    offer: "ai-helper",
    route: "/ai-helper",
    tone: "assist",
    name: "AI Helper",
    levelOfHelp: "Help me do it",
    price: "$5",
    unit: "per month",
    note: "or $40 a year",
    blurb:
      "Bring a picture and get a starting point across every face — then change any pixel of it.",
    includes: [
      "Everything in Awesome Editor",
      "Palette pulled out of your reference",
      "A full starting plan across the model",
      "Fit a reference onto any single face",
      "Re-roll a plan as often as you like",
      "All of it ordinary editable pixels",
    ],
    cta: "Try the AI Helper",
    plan: "ai_helper_monthly",
  },
  {
    offer: "custom",
    route: "/custom",
    tone: "human",
    name: "Human Creator Custom Orders",
    levelOfHelp: "Do it for me",
    price: "$18",
    unit: "per skin",
    note: "Artists commonly charge $12–$19",
    blurb:
      "Describe the character and Grace makes it by hand, pixel by pixel. A person, not a generator.",
    includes: [
      "Made by hand from your brief",
      "Add a reference picture if you have one",
      "Read by her dad before she starts",
      "One round of changes included",
      "Delivered into your account, ready to wear",
      "Java and Bedrock",
    ],
    cta: "Start an order",
    plan: "custom_skin",
  },
];

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — GagaSkin" },
      {
        name: "description",
        content:
          "The editor is free. AI Helper is $5 a month. A hand-made custom skin from Grace is $18. No ads, ever.",
      },
      { property: "og:title", content: "Pricing — GagaSkin" },
      {
        property: "og:description",
        content:
          "Free editor, $5/month AI Helper, $18 hand-made custom skins. No ads, no redirects.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <SiteShell view="pricing">
      <section className="gs-section">
        <div className="gs-section__head">
          <span className="gs-rule" aria-hidden="true" />
          <p className="gs-pixel">Pricing</p>
          <h1>Three ways in. One of them is free.</h1>
          <p className="gs-lead">
            You are not buying software here so much as choosing how much of the work you
            want to do yourself.
          </p>
        </div>

        <div className="gs-tiers">
          {TIERS.map((tier) => (
            <article key={tier.offer} className={`gs-tier gs-tier--${tier.tone}`}>
              <span className="gs-pixel">{tier.levelOfHelp}</span>
              <h2>{tier.name}</h2>
              <p className="gs-tier__price">
                <strong>{tier.price}</strong> <span>{tier.unit}</span>
              </p>
              <p className="gs-hint">{tier.note}</p>
              <p className="gs-tier__blurb">{tier.blurb}</p>
              <ul className="gs-tier__list">
                {tier.includes.map((line) => (
                  <li key={line}>
                    <Check size={15} aria-hidden="true" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
              <Link
                to={tier.route}
                className="gs-cta"
                onClick={() =>
                  recordValidationEvent("offer_path_started", {
                    offer: tier.offer,
                    location: "pricing",
                  })
                }
              >
                {tier.cta} <ArrowRight size={18} className="gs-cta__arrow" aria-hidden="true" />
              </Link>
              {tier.plan && (
                <p className="gs-tier__pay">
                  <Link to="/checkout" search={{ plan: tier.plan }} className="gs-pixel">
                    Pay now
                  </Link>
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="gs-section" aria-labelledby="pricing-honesty">
        <div className="gs-card">
          <p className="gs-pixel">Straight answers</p>
          <h2 id="pricing-honesty">What we are not doing.</h2>
          <ul className="gs-tier__list">
            <li>
              <Check size={15} aria-hidden="true" />
              <span>
                <strong>Payments are in test mode for now.</strong> Checkout works end to
                end, but no card is charged until the account finishes verification.
              </span>
            </li>
            <li>
              <Check size={15} aria-hidden="true" />
              <span>
                <strong>No ads and no redirects.</strong> The free editor stays free without
                selling your attention to anybody.
              </span>
            </li>
            <li>
              <Check size={15} aria-hidden="true" />
              <span>
                <strong>Your skin is yours.</strong> Export the PNG whenever you like, on any
                tier, and take it wherever you want.
              </span>
            </li>
          </ul>
        </div>
      </section>
    </SiteShell>
  );
}
