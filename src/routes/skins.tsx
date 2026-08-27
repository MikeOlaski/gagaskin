import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/site/SiteShell";
import { SkinGrid } from "@/components/site/SkinGrid";
import { fetchPublishedSkins, type GallerySkin } from "@/lib/gallery";

export const Route = createFileRoute("/skins")({
  head: () => ({
    meta: [
      { title: "Skins — GagaSkin" },
      {
        name: "description",
        content:
          "Every Minecraft skin Grace has published, shown beside the idea it started from.",
      },
    ],
  }),
  component: SkinsPage,
});

function SkinsPage() {
  const [skins, setSkins] = useState<GallerySkin[] | null>(null);

  useEffect(() => {
    fetchPublishedSkins()
      .then(setSkins)
      .catch(() => setSkins([]));
  }, []);

  return (
    <SiteShell view="skins">
      <section className="gs-section" style={{ paddingTop: "var(--gs-s5)" }}>
        <div className="gs-section__head">
          <p className="gs-pixel">The directory</p>
          <h1>Every skin, and the idea it came from.</h1>
          <p className="gs-lead">
            Each one is shown twice: what it started as, and what it looks like in the game.
          </p>
        </div>
        {skins === null ? <p>Loading…</p> : <SkinGrid skins={skins} />}
      </section>
    </SiteShell>
  );
}
