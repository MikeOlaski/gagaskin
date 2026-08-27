import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { OfferPortals } from "@/components/site/OfferPortals";
import { PixelSkin } from "@/components/site/PixelArt";
import { SiteShell } from "@/components/site/SiteShell";
import { SkinGrid } from "@/components/site/SkinGrid";
import { TransformBand } from "@/components/site/TransformBand";
import {
  fetchPublishedSkins,
  galleryViewPath,
  publicImageUrl,
  type GallerySkin,
} from "@/lib/gallery";

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

  const hero = skins.find((s) => s.featured) ?? skins[0];

  return (
    <SiteShell view="home">
      <section className="gs-section gs-hero">
        <div className="gs-hero__copy">
          <p className="gs-pixel">Minecraft skins</p>
          <h1>I have a vision. Help me express it in a skin.</h1>
          <p className="gs-lead">
            Bring an idea — a drawing, a character, an outfit you have pictured — and end up
            with a Minecraft skin that still feels like it once it is 64 pixels wide.
          </p>
          <Link to="/join" search={{ from: "unknown" }} className="gs-cta">
            Start yours <ArrowRight size={18} className="gs-cta__arrow" aria-hidden="true" />
          </Link>
          <p className="gs-trust">No ads. No redirects. Nothing sold. Every skin is yours to keep.</p>
        </div>

        <div className="gs-hero__stage">
          {hero ? (
            <figure className="gs-hero__pair">
              <div className="gs-hero__side">
                <span className="gs-pixel gs-hero__sidelabel">The idea</span>
                <img
                  src={publicImageUrl(hero.inspirationPath)}
                  alt={`The reference image behind ${hero.title}`}
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
              <div className="gs-hero__side">
                <span className="gs-pixel gs-hero__sidelabel">In game</span>
                <img
                  src={publicImageUrl(galleryViewPath(hero, "iso"))}
                  alt={`${hero.title} rendered in Minecraft`}
                  width={576}
                  height={1024}
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
              <figcaption className="gs-pair__caption gs-pixel">{hero.title}</figcaption>
            </figure>
          ) : (
            <PixelSkin />
          )}
        </div>
      </section>


      <section className="gs-section" aria-labelledby="translate-heading">
        <div className="gs-section__head">
          <p className="gs-pixel">The work</p>
          <h2 id="translate-heading">How an idea becomes a skin.</h2>
        </div>
        <TransformBand />
      </section>

      <section className="gs-section" aria-labelledby="gallery-heading">
        <div className="gs-section__head">
          <p className="gs-pixel">Proof</p>
          <h2 id="gallery-heading">Skins Grace has made.</h2>
        </div>
        <SkinGrid skins={skins.slice(0, 6)} />
        {skins.length > 0 && (
          <p style={{ marginTop: "var(--gs-s3)" }}>
            <Link to="/skins" className="gs-pixel">See every skin</Link>
          </p>
        )}
      </section>

      <section className="gs-section" aria-labelledby="choose-heading">
        <div className="gs-section__head">
          <p className="gs-pixel">Choose your path</p>
          <h2 id="choose-heading">Three ways to get there.</h2>
        </div>
        <OfferPortals location="home" />
      </section>
    </SiteShell>
  );
}
