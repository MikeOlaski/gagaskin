import { Link } from "@tanstack/react-router";
import { LayoutGrid, Rows3 } from "lucide-react";
import { useMemo, useState } from "react";

import { SkinDownloadButton } from "@/components/site/SkinDownloadButton";
import { GALLERY_VIEW_LABEL, type GalleryView } from "@/domain/skin/poseRender";
import {
  DIRECTORY_SORT_LABEL,
  galleryViewPath,
  makerHandles,
  publicImageUrl,
  sortDirectory,
  type DirectorySort,
  type GallerySkin,
} from "@/lib/gallery";
import { getOffer } from "@/lib/offers";

const SORTS: DirectorySort[] = ["newest", "downloads", "featured", "title"];

/** "Inspo" is a directory-only view: it pairs the source image the skin was
 *  made from with the posed render, so the leap is visible on one card. */
type DirectoryView = GalleryView | "inspo";
const VIEWS: DirectoryView[] = ["iso", "quad", "duo", "inspo"];
const VIEW_LABEL: Record<DirectoryView, string> = { ...GALLERY_VIEW_LABEL, inspo: "Inspo" };
const MADE_WITH_LABEL: Record<GallerySkin["madeWith"], string> = {
  "ai-helper": "Made with AI Helper",
  custom: "Made by Grace",
  build: "Made in the editor",
};

/** Elegant by subtraction: one row of controls, then the skins. Nothing hides
 *  behind a menu, and nothing appears until there is something to filter. */
export function SkinDirectory({ skins }: { skins: readonly GallerySkin[] }) {
  const [sort, setSort] = useState<DirectorySort>("newest");
  const [view, setView] = useState<DirectoryView>("iso");
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [maker, setMaker] = useState<string | null>(null);
  const renderView: GalleryView = view === "inspo" ? "iso" : view;


  const makers = makerHandles(skins);
  const shown = useMemo(() => {
    const filtered = maker ? skins.filter((s) => s.authorHandle === maker) : skins;
    return sortDirectory(filtered, sort);
  }, [skins, maker, sort]);

  if (skins.length === 0) {
    return (
      <p className="gs-hint">
        Nothing published yet. <Link to="/custom" className="gs-pixel">Order one from Grace</Link>
      </p>
    );
  }

  return (
    <div className="gs-dir">
      <div className="gs-dir__bar">
        <div className="gs-views" role="group" aria-label="Sort skins">
          {SORTS.map((s) => (
            <button
              key={s}
              type="button"
              className={`gs-pixel gs-views__btn${s === sort ? " is-active" : ""}`}
              aria-pressed={s === sort}
              onClick={() => setSort(s)}
            >
              {DIRECTORY_SORT_LABEL[s]}
            </button>
          ))}
        </div>

        <div className="gs-dir__right">
          {makers.length > 1 && (
            <label className="gs-dir__select">
              <span className="gs-pixel">Maker</span>
              <select
                value={maker ?? ""}
                onChange={(e) => setMaker(e.target.value || null)}
                aria-label="Filter by maker"
              >
                <option value="">Everyone</option>
                {makers.map((h) => (
                  <option key={h} value={h}>@{h}</option>
                ))}
              </select>
            </label>
          )}

          <div className="gs-views" role="group" aria-label="Render view">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                className={`gs-pixel gs-views__btn${v === view ? " is-active" : ""}`}
                aria-pressed={v === view}
                onClick={() => setView(v)}
              >
                {VIEW_LABEL[v]}
              </button>
            ))}
          </div>

          <div className="gs-views" role="group" aria-label="Layout">
            <button
              type="button"
              className={`gs-views__btn gs-views__btn--icon${layout === "grid" ? " is-active" : ""}`}
              aria-pressed={layout === "grid"}
              aria-label="Grid layout"
              onClick={() => setLayout("grid")}
            >
              <LayoutGrid size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              className={`gs-views__btn gs-views__btn--icon${layout === "list" ? " is-active" : ""}`}
              aria-pressed={layout === "list"}
              aria-label="List layout"
              onClick={() => setLayout("list")}
            >
              <Rows3 size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <p className="gs-hint gs-dir__count">
        {shown.length} {shown.length === 1 ? "skin" : "skins"}
      </p>

      {layout === "grid" ? (
        <div className="gs-grid">
          {shown.map((skin) => (
            <figure
              key={skin.id}
              className={`gs-pair gs-pair--${getOffer(skin.madeWith).tone}`}
            >
              {view === "inspo" ? (
                <div className="gs-pair__stage gs-pair__stage--split">
                  <img
                    src={publicImageUrl(skin.inspirationPath)}
                    alt={`Source image for ${skin.title}`}
                    loading="lazy"
                    decoding="async"
                  />
                  <img
                    src={publicImageUrl(galleryViewPath(skin, renderView))}
                    alt={`${skin.title} rendered in Minecraft`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ) : (
                <div className="gs-pair__stage">
                  <img
                    src={publicImageUrl(galleryViewPath(skin, renderView))}
                    alt={`${skin.title} rendered in Minecraft`}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}

              <figcaption className="gs-pair__caption">
                <strong>{skin.title}</strong>
                {skin.authorHandle && (
                  <span className="gs-pixel gs-pair__handle">@{skin.authorHandle}</span>
                )}
                <span className="gs-pixel gs-pair__path">{MADE_WITH_LABEL[skin.madeWith]}</span>
                <SkinDownloadButton skin={skin} />
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <ul className="gs-dirlist">
          {shown.map((skin) => (
            <li key={skin.id} className={`gs-dirrow gs-dirrow--${getOffer(skin.madeWith).tone}`}>
              {view === "inspo" && (
                <img
                  className="gs-dirrow__inspo"
                  src={publicImageUrl(skin.inspirationPath)}
                  alt={`Source image for ${skin.title}`}
                  loading="lazy"
                  decoding="async"
                />
              )}
              <img
                src={publicImageUrl(galleryViewPath(skin, renderView))}
                alt={`${skin.title} rendered in Minecraft`}
                loading="lazy"
                decoding="async"
              />

              <div className="gs-dirrow__body">
                <strong>{skin.title}</strong>
                <p className="gs-hint">
                  {MADE_WITH_LABEL[skin.madeWith]}
                  {skin.authorHandle ? ` · @${skin.authorHandle}` : ""}
                  {skin.downloadCount > 0
                    ? ` · ${skin.downloadCount} download${skin.downloadCount === 1 ? "" : "s"}`
                    : ""}
                </p>
              </div>
              <SkinDownloadButton skin={skin} showCount={false} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
