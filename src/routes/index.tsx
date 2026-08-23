import { ClientOnly } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import { AtlasPreview } from "@/components/skin/AtlasPreview";
import { FrontPreview2D } from "@/components/skin/FrontPreview2D";
import { AutoDesignPanel } from "@/components/skin/AutoDesignPanel";
import { ReferencePanel } from "@/components/skin/ReferencePanel";
import { SkinFileBar } from "@/components/skin/SkinFileBar";
import { ToolPanel } from "@/components/skin/ToolPanel";
import { UVEditor } from "@/components/skin/UVEditor";

const ModelPreview3D = lazy(() => import("@/components/skin/ModelPreview3D"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Minecraft Skin Painter — Exploded UV Skin Editor" },
      {
        name: "description",
        content:
          "Paint Minecraft skins on an exploded, body-oriented UV map with a live 3D preview. Import 64×64 skins, use reference images, export clean PNGs.",
      },
      { property: "og:title", content: "Minecraft Skin Painter — Exploded UV Skin Editor" },
      {
        property: "og:description",
        content:
          "Pixel-exact Minecraft skin editor with exploded UV layout, live 3D model preview and clean 64×64 PNG export.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SkinPainterPage,
});

function PreviewFallback({ label }: { label: string }) {
  return (
    <div className="flex h-[340px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground shadow-sm">
      {label}
    </div>
  );
}

function SkinPainterPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-4 px-4 py-3 lg:px-6">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              Minecraft Skin Painter
            </h1>
            <p className="text-xs text-muted-foreground">
              Exact 64 × 64 classic skin editor · everything stays in your browser
            </p>
          </div>
          <div className="ml-auto">
            <SkinFileBar />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1800px] gap-4 overflow-x-hidden px-4 py-4 lg:px-6 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-4">
          <ReferencePanel />
          <AutoDesignPanel />
          <ToolPanel />
        </div>

        <UVEditor />

        <div className="flex min-w-0 flex-col gap-4">
          <ClientOnly fallback={<PreviewFallback label="Loading 3D preview…" />}>
            <Suspense fallback={<PreviewFallback label="Loading 3D preview…" />}>
              <ModelPreview3D />
            </Suspense>
          </ClientOnly>
          <FrontPreview2D />
          <AtlasPreview />
        </div>
      </main>
    </div>
  );
}
