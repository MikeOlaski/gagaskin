import { BeforeAfter } from "@/components/site/BeforeAfter";
import type { GallerySkin } from "@/lib/gallery";

export function SkinGrid({ skins }: { skins: readonly GallerySkin[] }) {
  if (skins.length === 0) {
    return <p className="gs-empty">Grace is making the first ones now.</p>;
  }
  return (
    <div className="gs-grid">
      {skins.map((skin) => (
        <BeforeAfter key={skin.id} skin={skin} />
      ))}
    </div>
  );
}
