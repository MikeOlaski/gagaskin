import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { OfferPortals } from "@/components/site/OfferPortals";
import { SiteShell } from "@/components/site/SiteShell";
import { SkinGrid } from "@/components/site/SkinGrid";
import { fetchPublishedSkins, publicImageUrl, type GallerySkin } from "@/lib/gallery";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GagaSkin — the Minecraft skin you have in your head" },
      {
        name: "description",
        content:
          "Bring an idea, and get a Minecraft skin that still feels like it. Help me do it, do it for me, or let me do it.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [skins, setSkins] = useState<GallerySkin[]>([]);

  useEffect(() => {
    fetchPublishedSkins()
      .then(setSkins)
      .catch(() => setSkins([]));
  }, []);

  const hero = skins[0];

  return (
    <SiteShell view="home">
      <section className="gs-section gs-hero">
        <h1>I have a vision. Help me express it in a skin.</h1>
        <p className="gs-lead">
          Bring an idea — a drawing, a character, an outfit you have pictured — and end up
          with a Minecraft skin that still feels like it once it is 64 pixels wide.
        </p>
        <p className="gs-trust gs-pixel">
          No ads. No redirects. Nothing sold. Every skin is yours to keep.
        </p>
        {hero && (
          <figure className="gs-pair gs-hero__pair">
            <div className="gs-pair__images">
              <img
                src={publicImageUrl(hero.inspirationPath)}
                alt={`Inspiration for ${hero.title}`}
                width={512}
                height={512}
                fetchPriority="high"
                decoding="async"
              />
              <img
                src={publicImageUrl(hero.ingamePath)}
                alt={`${hero.title} worn in Minecraft`}
                width={512}
                height={512}
                fetchPriority="high"
                decoding="async"
              />
            </div>
            <figcaption className="gs-pair__caption gs-pixel">
              The idea, and the skin in the game.
            </figcaption>
          </figure>
        )}
      </section>

      <section className="gs-section gs-translate" aria-labelledby="translate-heading">
        <h2 id="translate-heading">How an idea becomes a skin.</h2>
        <ol className="gs-steps">
          <li><strong>The idea.</strong> A picture, a character, a description.</li>
          <li><strong>The colours.</strong> Pulled out and made Minecraft-ready.</li>
          <li><strong>The pixels.</strong> Every face of the model, yours to change.</li>
          <li><strong>In the game.</strong> Exported and worn.</li>
        </ol>
      </section>

      <section className="gs-section" aria-labelledby="gallery-heading">
        <h2 id="gallery-heading">Skins Grace has made.</h2>
        <SkinGrid skins={skins.slice(0, 6)} />
        <Link to="/skins" className="gs-pixel gs-more">See every skin</Link>
      </section>

      <section className="gs-section" aria-labelledby="choose-heading">
        <h2 id="choose-heading">Three ways to get there.</h2>
        <OfferPortals location="home" />
      </section>
    </SiteShell>
  );
}
