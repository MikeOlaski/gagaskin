import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteShell } from "@/components/site/SiteShell";
import { recordValidationEvent } from "@/lib/validation";

export const Route = createFileRoute("/ai-helper")({
  head: () => ({
    meta: [
      { title: "AI Helper — GagaSkin" },
      {
        name: "description",
        content:
          "Bring a reference and get a starting plan you can change pixel by pixel. Smart Assist proposes; you decide.",
      },
    ],
  }),
  component: AiHelperPage,
});

function AiHelperPage() {
  return (
    <SiteShell view="ai-helper">
      <section className="gs-section gs-offer gs-offer--assist">
        <p className="gs-pixel">Help me do it</p>
        <h1>Never start from an empty grid again.</h1>
        <p className="gs-lead">
          Drop in the picture you have been staring at. GagaSkin pulls its colours, works out
          which part of the image belongs on which face of the model, and lays down a
          starting point.
        </p>

        <h2>It proposes. You decide.</h2>
        <p>
          Everything it puts down is ordinary editable pixels. Change any one of them, undo
          any of it, or paint straight over the lot. There is no locked layer and nothing you
          cannot take apart.
        </p>

        <ol className="gs-steps">
          <li><strong>Bring a reference.</strong> A drawing, a character, a photo of an outfit.</li>
          <li><strong>Get its palette.</strong> Pulled out and made Minecraft-ready.</li>
          <li><strong>Get a starting point.</strong> Laid across every face of the model.</li>
          <li><strong>Change whatever you want.</strong> It is your skin from there.</li>
        </ol>

        <Link
          to="/join"
          search={{ from: "ai-helper" }}
          className="gs-cta"
          onClick={() =>
            recordValidationEvent("offer_path_started", { offer: "ai-helper", location: "landing" })
          }
        >
          Create your account
        </Link>
      </section>
    </SiteShell>
  );
}
