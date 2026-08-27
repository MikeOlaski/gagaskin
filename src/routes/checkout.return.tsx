import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/site/SiteShell";

export const Route = createFileRoute("/checkout/return")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    ...(typeof search.session_id === "string" && { session_id: search.session_id }),
  }),
  head: () => ({
    meta: [
      { title: "Payment complete — GagaSkin" },
      { name: "description", content: "Your GagaSkin payment is complete." },
      { property: "og:title", content: "Payment complete — GagaSkin" },
      { property: "og:description", content: "Your GagaSkin payment is complete." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id: sessionId } = Route.useSearch();

  return (
    <SiteShell view="checkout">
      <section className="gs-section">
        <div className="gs-section__head">
          <p className="gs-pixel">Thank you</p>
          <h1>{sessionId ? "That went through." : "Nothing to show."}</h1>
          <p className="gs-lead">
            {sessionId
              ? "Your payment is complete. Head into the editor, or start an order brief for a hand-made skin."
              : "We could not find a payment for this link. Nothing has been charged."}
          </p>
        </div>
        <div className="gs-card">
          <p>
            <Link to="/build" className="gs-pixel">
              Open the editor
            </Link>
            {" · "}
            <Link to="/custom" className="gs-pixel">
              Start a custom order
            </Link>
            {" · "}
            <Link to="/pricing" className="gs-pixel">
              Back to pricing
            </Link>
          </p>
        </div>
      </section>
    </SiteShell>
  );
}
