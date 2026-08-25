import { Link } from "@tanstack/react-router";

import { publicImageUrl, type GallerySkin } from "@/lib/gallery";
import { getOffer } from "@/lib/offers";
import { recordValidationEvent } from "@/lib/validation";

/** Every pair names the path that produced it. An unlabelled pair would imply an
 *  outcome-fidelity claim the product has not validated. */
const MADE_WITH_LABEL: Record<GallerySkin["madeWith"], string> = {
  "ai-helper": "Made with AI Helper",
  custom: "Made by Grace",
  build: "Made in the editor",
};

export function BeforeAfter({ skin }: { skin: GallerySkin }) {
  const offer = getOffer(skin.madeWith);
  return (
    <figure className={`gs-pair gs-pair--${offer.tone}`}>
      <div className="gs-pair__images">
        <img
          src={publicImageUrl(skin.inspirationPath)}
          alt={`Inspiration for ${skin.title}`}
          loading="lazy"
          decoding="async"
        />
        <img
          src={publicImageUrl(skin.ingamePath)}
          alt={`${skin.title} worn in Minecraft`}
          loading="lazy"
          decoding="async"
        />
      </div>
      <figcaption className="gs-pair__caption">
        <strong>{skin.title}</strong>
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
      </figcaption>
    </figure>
  );
}
