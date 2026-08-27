import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SiteShell } from "@/components/site/SiteShell";
import { SkinDirectory } from "@/components/site/SkinDirectory";
import { fetchPublishedSkins, type GallerySkin } from "@/lib/gallery";

export const Route = createFileRoute("/skins")({
  head: () => ({
    meta: [
      { title: "Skins directory — browse and download | GagaSkin" },
      {
        name: "description",
        content:
          "Browse every published Minecraft skin, sort by newest or most downloaded, and download the 64×64 PNG free.",
      },
      { property: "og:title", content: "Skins directory — browse and download" },
      {
        property: "og:description",
        content: "Sort by newest or most downloaded, then download the 64×64 skin PNG free.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
          <h1>Browse every skin. Download any of them.</h1>
          <p className="gs-lead">
            Every skin here is a clean 64×64 PNG, free to download and wear in Java or
            Bedrock. No ads, no redirects.
          </p>
        </div>
        {skins === null ? <p>Loading…</p> : <SkinDirectory skins={skins} />}
      </section>
    </SiteShell>
  );
}
