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
      <section className="gs-section gs-offer gs-offer--build">
        <p className="gs-pixel">Let me do it</p>
        <h1>An editor that knows what a Minecraft skin is.</h1>
        <p className="gs-lead">
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
            recordValidationEvent("offer_path_started", { offer: "build", location: "landing" })
          }
        >
          Create your account
        </Link>
      </section>
    </SiteShell>
  );
}
