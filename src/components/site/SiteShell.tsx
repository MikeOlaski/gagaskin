import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { recordValidationEvent } from "@/lib/validation";

type ViewName = "home" | "skins" | "ai-helper" | "build" | "custom";

/** Server-side view counting. Traffic is driven from outside, so a visitor who
 *  bounces must still be counted; localStorage cannot see them. Failure here is
 *  never allowed to affect the page.
 *
 *  The generated Supabase types do not yet name this function — they regenerate
 *  once the schema script is applied through Lovable. Cast narrowly here rather
 *  than widening the client's types everywhere. */
function recordView(view: ViewName) {
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, string>,
  ) => PromiseLike<unknown>;
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
        <Link to="/" aria-label="GagaSkin home">GagaSkin</Link>
        {/* Nav entries are added by the task that creates each route: /join in
            Task 7, /skins in Task 10, /custom in Task 14. A typed Link to a
            route that does not exist yet fails the typecheck, so they land
            with their routes rather than ahead of them. */}
        <nav aria-label="Primary" />
      </header>
      <main id="main">{children}</main>
      <footer className="gs-footer">
        <p className="gs-pixel">No ads. No redirects. Your skin is yours.</p>
      </footer>
    </div>
  );
}
