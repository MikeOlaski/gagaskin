import { Link } from "@tanstack/react-router";

import { SkinDownloadButton } from "@/components/site/SkinDownloadButton";
import type { GalleryView } from "@/domain/skin/poseRender";
import { galleryViewPath, publicImageUrl, type GallerySkin } from "@/lib/gallery";
import { getOffer } from "@/lib/offers";
import { recordValidationEvent } from "@/lib/validation";

/** Every card names the path that produced it. An unlabelled card would imply an
 *  outcome-fidelity claim the product has not validated. */
const MADE_WITH_LABEL: Record<GallerySkin["madeWith"], string> = {
  "ai-helper": "Made with AI Helper",
  custom: "Made by Grace",
  build: "Made in the editor",
};

export function BeforeAfter({ skin, view }: { skin: GallerySkin; view: GalleryView }) {
  const offer = getOffer(skin.madeWith);
  return (
    <figure className={`gs-pair gs-pair--${offer.tone}`}>
      <div className="gs-pair__stage">
        <img
          src={publicImageUrl(galleryViewPath(skin, view))}
          alt={`${skin.title} rendered in Minecraft`}
          loading="lazy"
          decoding="async"
        />
      </div>
      <figcaption className="gs-pair__caption">
        <strong>{skin.title}</strong>
        {skin.authorHandle && (
          <span className="gs-pixel gs-pair__handle">@{skin.authorHandle}</span>
        )}
        <Link
          to={offer.route}
          className="gs-pixel gs-pair__path"
          onClick={() =>
            recordValidationEvent("offer_path_started", {
              offer: skin.madeWith,
              location: "gallery",
            })
          }
        >
          {MADE_WITH_LABEL[skin.madeWith]}
        </Link>
        <SkinDownloadButton skin={skin} />
      </figcaption>
    </figure>
  );
}
