import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/site/SiteShell";
import { SkinDownloadButton } from "@/components/site/SkinDownloadButton";
import { GALLERY_VIEW_LABEL, type GalleryView } from "@/domain/skin/poseRender";
import {
  fetchSkinById,
  galleryViewPath,
  publicImageUrl,
  type GallerySkin,
} from "@/lib/gallery";
import { getOffer } from "@/lib/offers";

const VIEWS: GalleryView[] = ["iso", "quad", "duo"];
const MADE_WITH_LABEL: Record<GallerySkin["madeWith"], string> = {
  "ai-helper": "Made with AI Helper",
  custom: "Made by Grace",
  build: "Made in the editor",
};

export const Route = createFileRoute("/skin/$id")({
  head: () => ({
    meta: [
      { title: "Skin details — download the 64×64 PNG | GagaSkin" },
      {
        name: "description",
        content:
          "See one Minecraft skin up close: posed renders, the source image it came from, and a free 64×64 PNG download.",
      },
      { property: "og:title", content: "Skin details — download the 64×64 PNG" },
      {
        property: "og:description",
        content: "Posed renders, the source image, and a free 64×64 skin PNG download.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SingleSkinPage,
});

function SingleSkinPage() {
  const { id } = Route.useParams();
  const [skin, setSkin] = useState<GallerySkin | null | undefined>(undefined);
  const [view, setView] = useState<GalleryView>("iso");

  useEffect(() => {
    setSkin(undefined);
    fetchSkinById(id)
      .then(setSkin)
      .catch(() => setSkin(null));
  }, [id]);

  return (
    <SiteShell view="skins">
      <section className="gs-section" style={{ paddingTop: "var(--gs-s5)" }}>
        <Link to="/skins" className="gs-pixel gs-backlink">
          <ArrowLeft size={14} aria-hidden="true" /> All skins
        </Link>

        {skin === undefined ? (
          <p>Loading…</p>
        ) : skin === null ? (
          <>
            <h1>That skin is not here</h1>
            <p className="gs-lead">
              It may have been unpublished. <Link to="/skins" className="gs-pixel">Browse the directory</Link>
            </p>
          </>
        ) : (
          <div className={`gs-single gs-single--${getOffer(skin.madeWith).tone}`}>
            <div className="gs-single__stage">
              <img
                src={publicImageUrl(galleryViewPath(skin, view))}
                alt={`${skin.title} rendered in Minecraft`}
                decoding="async"
              />
            </div>

            <div className="gs-single__side">
              <h1>{skin.title}</h1>
              <p className="gs-hint">
                {MADE_WITH_LABEL[skin.madeWith]}
                {skin.authorHandle ? ` · @${skin.authorHandle}` : ""}
                {skin.downloadCount > 0
                  ? ` · ${skin.downloadCount} download${skin.downloadCount === 1 ? "" : "s"}`
                  : ""}
              </p>

              <div className="gs-views" role="group" aria-label="Render view">
                {VIEWS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    className={`gs-pixel gs-views__btn${v === view ? " is-active" : ""}`}
                    aria-pressed={v === view}
                    onClick={() => setView(v)}
                  >
                    {GALLERY_VIEW_LABEL[v]}
                  </button>
                ))}
              </div>

              <SkinDownloadButton skin={skin} />

              <div className="gs-single__inspo">
                <p className="gs-pixel">Source image</p>
                <img
                  src={publicImageUrl(skin.inspirationPath)}
                  alt={`Source image for ${skin.title}`}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </SiteShell>
  );
}
