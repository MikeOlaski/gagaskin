import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { PixelGrid, PixelSkin } from "@/components/site/PixelArt";
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
      <section className="gs-section gs-offer gs-offer--build">
        <div className="gs-offer__copy">
          <span className="gs-rule" aria-hidden="true" />
          <p className="gs-pixel">Let me do it</p>
          <h1>An editor that knows what a Minecraft skin is.</h1>
          <p className="gs-lead">
            Not a general pixel canvas with a Minecraft template bolted on. Every face of the
            model laid out at once, with the boundaries where they actually are.
          </p>

          <ul className="gs-list" style={{ marginTop: "var(--gs-s2)" }}>
            <li><span><strong>See the whole model.</strong> Head, body, arms, legs, both layers.</span></li>
            <li><span><strong>Watch it in 3D.</strong> The model turns as you paint.</span></li>
            <li><span><strong>Undo anything.</strong> Full history, no surprises.</span></li>
            <li><span><strong>Export clean.</strong> A correct 64 × 64 PNG the game accepts.</span></li>
            <li><span><strong>Keep your projects.</strong> Saved to your account, open anywhere.</span></li>
          </ul>

          <p className="gs-trust">No ads. No fake download buttons. No redirects on the way out.</p>

          <Link
            to="/join"
            search={{ from: "build" }}
            className="gs-cta"
            onClick={() =>
              recordValidationEvent("offer_path_started", { offer: "build", location: "landing" })
            }
          >
            Create your account <ArrowRight size={18} className="gs-cta__arrow" aria-hidden="true" />
          </Link>
        </div>

        <aside className="gs-offer__aside">
          <p className="gs-pixel">The canvas</p>
          <div className="gs-step__art"><PixelGrid /></div>
          <p className="gs-hint">Exact faces, exact boundaries — not a guessed template.</p>
          <div className="gs-step__art" style={{ padding: "var(--gs-s2)" }}><PixelSkin animate={false} /></div>
          <p className="gs-hint">And the model it becomes, turning as you work.</p>
        </aside>
      </section>
    </SiteShell>
  );
}
