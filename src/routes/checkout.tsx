import { createFileRoute, Link } from "@tanstack/react-router";

import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { SiteShell } from "@/components/site/SiteShell";
import { useSession } from "@/hooks/useSession";
import { paymentsConfigured } from "@/lib/stripe";

/** Human-readable price ids created in the payments catalogue. Kept as a literal
 *  map so a bad ?plan= value can never reach the checkout call. */
const PLANS = {
  ai_helper_monthly: { label: "AI Helper — $5 a month", priceId: "ai_helper_monthly" },
  ai_helper_yearly: { label: "AI Helper — $40 a year", priceId: "ai_helper_yearly" },
  custom_skin: { label: "Custom skin by hand — $18", priceId: "custom_skin_onetime" },
} as const;

type PlanKey = keyof typeof PLANS;

function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === "string" && Object.hasOwn(PLANS, value);
}

export const Route = createFileRoute("/checkout")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { plan: PlanKey } => ({
    plan: isPlanKey(search.plan) ? search.plan : "ai_helper_monthly",
  }),
  head: () => ({
    meta: [
      { title: "Checkout — GagaSkin" },
      {
        name: "description",
        content: "Pay for AI Helper or a hand-made custom skin. No ads, no redirects.",
      },
      { property: "og:title", content: "Checkout — GagaSkin" },
      {
        property: "og:description",
        content: "Pay for AI Helper or a hand-made custom skin from Grace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { plan } = Route.useSearch();
  const { user, loading } = useSession();
  const chosen = PLANS[plan];

  return (
    <SiteShell view="checkout">
      <PaymentTestModeBanner />
      <section className="gs-section">
        <div className="gs-section__head">
          <p className="gs-pixel">Checkout</p>
          <h1>{chosen.label}</h1>
        </div>

        {!paymentsConfigured() ? (
          <div className="gs-card">
            <p>Payments are not switched on for this build yet. Nothing can be charged.</p>
          </div>
        ) : loading ? (
          <div className="gs-card">
            <p>Checking your account…</p>
          </div>
        ) : !user ? (
          <div className="gs-card">
            <p>
              Sign in first so what you buy lands in your account.{" "}
              <Link to="/join" search={{ from: "unknown" }} className="gs-pixel">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <StripeEmbeddedCheckout
            priceId={chosen.priceId}
            userId={user.id}
            customerEmail={user.email ?? undefined}
            returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
          />
        )}
      </section>
    </SiteShell>
  );
}
