import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { BeforeAfter } from "@/components/site/BeforeAfter";
import { PixelSkin } from "@/components/site/PixelArt";
import { GALLERY_VIEW_LABEL, type GalleryView } from "@/domain/skin/poseRender";
import { makerHandles, type GallerySkin } from "@/lib/gallery";

/** The empty state is designed, not defaulted. Until Grace publishes, this is
 *  what most visitors will see, so it has to hold the page on its own. */
function EmptyGallery() {
  return (
    <div className="gs-empty">
      <div className="gs-empty__ghosts">
        {[0, 1, 2].map((i) => (
          <div className="gs-ghost" key={i} aria-hidden="true">
            {i === 0 && <div style={{ width: "42%", opacity: 0.5 }}><PixelSkin animate={false} /></div>}
          </div>
        ))}
      </div>
      <p className="gs-empty__note">
        Grace is making the first ones now. Each will show the skin rendered on the model, from
        every side.
      </p>
      <Link to="/custom" className="gs-pixel">Order one from her</Link>
    </div>
  );
}

const VIEWS: GalleryView[] = ["iso", "quad", "duo"];

export function SkinGrid({ skins }: { skins: readonly GallerySkin[] }) {
  const [view, setView] = useState<GalleryView>("iso");
  const [maker, setMaker] = useState<string | null>(null);
  if (skins.length === 0) return <EmptyGallery />;

  const makers = makerHandles(skins);
  const shown = maker ? skins.filter((s) => s.authorHandle === maker) : skins;

  return (
    <>
      <div className="gs-filters">
        <div className="gs-views" role="group" aria-label="Gallery view">
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
        {makers.length > 1 && (
          <div className="gs-views" role="group" aria-label="Filter by maker">
            <button
              type="button"
              className={`gs-pixel gs-views__btn${maker === null ? " is-active" : ""}`}
              aria-pressed={maker === null}
              onClick={() => setMaker(null)}
            >
              Everyone
            </button>
            {makers.map((h) => (
              <button
                key={h}
                type="button"
                className={`gs-pixel gs-views__btn gs-views__btn--maker${maker === h ? " is-active" : ""}`}
                aria-pressed={maker === h}
                onClick={() => setMaker(h)}
              >
                @{h}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="gs-grid">
        {shown.map((skin) => (
          <BeforeAfter key={skin.id} skin={skin} view={view} />
        ))}
      </div>
    </>
  );
}
