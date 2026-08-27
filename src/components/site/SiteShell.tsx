import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { rpc } from "@/lib/db";
import { recordValidationEvent } from "@/lib/validation";

type ViewName = "home" | "skins" | "ai-helper" | "build" | "custom";

/** Server-side view counting. Traffic is driven from outside, so a visitor who
 *  bounces must still be counted; localStorage cannot see them. Failure here is
 *  never allowed to affect the page. */
function recordView(view: ViewName) {
  void Promise.resolve(rpc("record_offer_view", { _offer: view })).catch(() => {});
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
        <Link to="/" className="gs-brand" aria-label="GagaSkin home">
          <span className="gs-brand__mark" aria-hidden="true" />
          GagaSkin
        </Link>
        <nav aria-label="Primary">
          <Link to="/skins">Skins</Link>
          <Link to="/custom">Custom orders</Link>
          <Link to="/join" search={{ from: "unknown" }}>Sign in</Link>
        </nav>
      </header>
      <main id="main">{children}</main>
      <footer className="gs-footer">
        <p className="gs-pixel">No ads. No redirects. Your skin is yours.</p>
        <p className="gs-hint">Made by Grace, who is twelve, and her dad.</p>
      </footer>
    </div>
  );
}
