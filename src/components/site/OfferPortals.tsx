import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

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
          <span className="gs-portal__chip" aria-hidden="true"><span /></span>
          <span className="gs-pixel">{offer.levelOfHelp}</span>
          <span className="gs-portal__name">{offer.name}</span>
          <span className="gs-portal__go">
            Open this path <ArrowRight size={16} aria-hidden="true" />
          </span>
        </Link>
      ))}
    </div>
  );
}
