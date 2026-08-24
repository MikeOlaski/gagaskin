import { ClientOnly } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Maximize2, Minimize2 } from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

import { AtlasPreview } from "@/components/skin/AtlasPreview";
import { FrontPreview2D } from "@/components/skin/FrontPreview2D";
import { AutoDesignPanel } from "@/components/skin/AutoDesignPanel";
import { FloatingPanel } from "@/components/skin/FloatingPanel";
import { ProjectsPanel } from "@/components/skin/ProjectsPanel";
import { ReferencePanel } from "@/components/skin/ReferencePanel";
import { SkinFileBar } from "@/components/skin/SkinFileBar";
import { ToolPanel } from "@/components/skin/ToolPanel";
import { UVEditor } from "@/components/skin/UVEditor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
    if (!focusMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFocusMode(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusMode]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-4 px-4 py-3 lg:px-6">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              Minecraft Skin Painter
            </h1>
            {!focusMode && (
              <p className="text-xs text-muted-foreground">
                Exact 64 × 64 classic skin editor · everything stays in your browser
              </p>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!focusMode && <SkinFileBar />}
            <Button
              variant={focusMode ? "default" : "outline"}
              size="sm"
              onClick={() => setFocusMode((v) => !v)}
              title={focusMode ? "Exit focus mode (Esc)" : "Hide panels and paint full screen"}
            >
              {focusMode ? (
                <Minimize2 className="mr-1 size-3.5" />
              ) : (
                <Maximize2 className="mr-1 size-3.5" />
              )}
              {focusMode ? "Exit focus mode" : "Focus mode"}
            </Button>
          </div>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto gap-4 overflow-x-hidden px-4 py-4 lg:px-6",
          focusMode
            ? "flex min-h-0 flex-1"
            : "grid max-w-[1800px] xl:grid-cols-[300px_minmax(0,1fr)_360px]",
        )}
      >
        {!focusMode && (
          <div className="flex min-w-0 flex-col gap-4">
            <div className="sticky top-4 z-10">
              <ToolPanel />
            </div>
            <ReferencePanel />
            <AutoDesignPanel />
            <div className="sticky bottom-4 z-10 mt-auto">
              <ProjectsPanel />
            </div>
          </div>
        )}

        <UVEditor />

        {!focusMode && (
          <div className="flex min-w-0 flex-col gap-4">
            <ClientOnly fallback={<PreviewFallback label="Loading 3D preview…" />}>
              <Suspense fallback={<PreviewFallback label="Loading 3D preview…" />}>
                <ModelPreview3D />
              </Suspense>
            </ClientOnly>
            <FrontPreview2D />
            <AtlasPreview />
          </div>
        )}
      </main>

      {focusMode && (
        <FloatingPanel title="Tools" onClose={() => setFocusMode(false)}>
          <ToolPanel bare />
        </FloatingPanel>
      )}
    </div>
  );
}
