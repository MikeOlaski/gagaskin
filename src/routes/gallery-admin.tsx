import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { fetchPublishedSkins, publicImageUrl, galleryViewPath, type GallerySkin } from "@/lib/gallery";
import { rerenderGalleryEntry } from "@/lib/galleryAdmin";
import { setFeaturedEntry } from "@/lib/projectPublish";

export const Route = createFileRoute("/gallery-admin")({
  head: () => ({
    meta: [
      { title: "Gallery admin — GagaSkin" },
      { name: "description", content: "Re-render posed gallery views and pick the featured skin." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: GalleryAdminPage,
});

function GalleryAdminPage() {
  const { user } = useSession();
  const [skins, setSkins] = useState<GallerySkin[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    fetchPublishedSkins()
      .then(setSkins)
      .catch(() => setSkins([]));
  }, []);

  useEffect(load, [load]);

  const rerenderAll = async () => {
    for (const skin of skins) {
      setBusy(skin.id);
      try {
        await rerenderGalleryEntry(skin);
      } catch (error) {
        toast.error(`${skin.title}: ${error instanceof Error ? error.message : "failed"}`);
      }
    }
    setBusy(null);
    load();
    toast.success("Posed views re-rendered");
  };

  return (
    <SiteShell view="skins">
      <section className="gs-section" style={{ paddingTop: "var(--gs-s5)" }}>
        <div className="gs-section__head">
          <p className="gs-pixel">Grace only</p>
          <h1>Gallery admin</h1>
          <p className="gs-lead">
            Re-render the Iso / 4 up / 2 up views from each stored 64×64 skin, and choose which
            skin the homepage features.
          </p>
        </div>
        {!user ? (
          <p>Sign in first.</p>
        ) : (
          <>
            <Button onClick={() => void rerenderAll()} disabled={busy !== null}>
              {busy ? "Re-rendering…" : "Re-render all posed views"}
            </Button>
            <div className="gs-grid" style={{ marginTop: "var(--gs-s3)" }}>
              {skins.map((skin) => (
                <figure key={skin.id} className="gs-pair">
                  <div className="gs-pair__stage">
                    <img src={publicImageUrl(galleryViewPath(skin, "iso"))} alt={skin.title} />
                  </div>
                  <figcaption className="gs-pair__caption">
                    <strong>{skin.title}</strong>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={skin.featured || busy !== null}
                      onClick={() =>
                        void setFeaturedEntry(skin.id)
                          .then(() => {
                            toast.success(`${skin.title} is featured`);
                            load();
                          })
                          .catch((e: unknown) =>
                            toast.error(e instanceof Error ? e.message : "Could not feature"),
                          )
                      }
                    >
                      {skin.featured ? "Featured" : "Feature on homepage"}
                    </Button>
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        )}
      </section>
    </SiteShell>
  );
}
