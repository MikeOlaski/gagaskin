import { Link } from "@tanstack/react-router";

import { OFFERS } from "@/lib/offers";
import { recordValidationEvent } from "@/lib/validation";

export function OfferPortals({ location }: { location: string }) {
  return (
    <div className="gs-portals">
      {OFFERS.map((offer) => (
        <Link
          key={offer.id}
          to={offer.route}
          className={`gs-portal gs-portal--${offer.tone}`}
          onClick={() =>
            recordValidationEvent("offer_path_started", { offer: offer.id, location })
          }
        >
          <span className="gs-pixel">{offer.levelOfHelp}</span>
          <strong>{offer.name}</strong>
        </Link>
      ))}
    </div>
  );
}
