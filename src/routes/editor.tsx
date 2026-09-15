import { ClientOnly, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Box,
  ChevronDown,
  Grid2x2,
  Image as ImageIcon,
  Keyboard,
  Maximize2,
  Minimize2,
  PersonStanding,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";

import { AtlasPreview } from "@/components/skin/AtlasPreview";
import { BodySegmentPanel } from "@/components/skin/BodySegmentPanel";
import { FrontPreview2D } from "@/components/skin/FrontPreview2D";
import { AutoDesignPanel } from "@/components/skin/AutoDesignPanel";
import { FloatingPanel } from "@/components/skin/FloatingPanel";
import { KeyboardShortcutsPanel, ShortcutsList } from "@/components/skin/KeyboardShortcutsPanel";
import { ProjectsPanel } from "@/components/skin/ProjectsPanel";
import { ReferencePanel } from "@/components/skin/ReferencePanel";
import { SkinFileBar } from "@/components/skin/SkinFileBar";
import { SourceImagePanel } from "@/components/skin/SourceImagePanel";
import { ToolPanel, TOOLS } from "@/components/skin/ToolPanel";
import { UserMenu } from "@/components/skin/UserMenu";
import { UVEditor } from "@/components/skin/UVEditor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/useSession";
import { useEditorStore, type Tool } from "@/store/editorStore";

const ModelPreview3D = lazy(() => import("@/components/skin/ModelPreview3D"));
const ModelEditor3D = lazy(() => import("@/components/skin/ModelEditor3D"));

type EditMode = "flat" | "model";

const SHORTCUT_TOOL: Record<string, Tool> = Object.fromEntries(
  TOOLS.map((t) => [t.shortcut.toLowerCase(), t.id]),
);

export const Route = createFileRoute("/editor")({
  // exactOptionalPropertyTypes is on, so the key is omitted rather than set to
  // undefined — that keeps `search` optional when navigating to /editor.
  validateSearch: (search: Record<string, unknown>): { start?: "ai-helper" | "build" } => {
    const raw = search["start"];
    return raw === "ai-helper" || raw === "build" ? { start: raw } : {};
  },
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
  const [sourceOpen, setSourceOpen] = useState(false);
  const [partsOpen, setPartsOpen] = useState(false);
  const [editMode, setEditMode] = useState<EditMode>("flat");
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const { start } = Route.useSearch();

  // Hard gate: the editor is not reachable without an account.
  useEffect(() => {
    if (!loading && !user) {
      void navigate({
        to: "/join",
        search: { from: start === "ai-helper" ? "ai-helper" : start === "build" ? "build" : "unknown" },
        replace: true,
      });
    }
  }, [loading, user, start, navigate]);

  // The editor honours the pitch it was sold under. Arriving via Awesome Editor
  // means a paint-first view with no assist chrome and no mention of AI.
  const assistOpen = start !== "build";

  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      const tag = (el as HTMLElement | null)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusMode) {
        setFocusMode(false);
        return;
      }
      if (isEditable(document.activeElement)) return;
      const store = useEditorStore.getState();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) store.redo();
        else store.undo();
        return;
      }
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const tool = SHORTCUT_TOOL[e.key.toLowerCase()];
        if (tool) store.setTool(tool);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusMode]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-card">
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 lg:px-6">
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
            <div className="flex items-center rounded-md border border-border p-0.5">
              <Button
                variant={editMode === "flat" ? "default" : "ghost"}
                size="sm"
                aria-pressed={editMode === "flat"}
                onClick={() => setEditMode("flat")}
                title="Paint on the flat exploded layout"
              >
                <Grid2x2 className="mr-1 size-3.5" />
                Flat edit
              </Button>
              <Button
                variant={editMode === "model" ? "default" : "ghost"}
                size="sm"
                aria-pressed={editMode === "model"}
                onClick={() => setEditMode("model")}
                title="Fold the skin onto the 3D model and paint on it directly"
              >
                <Box className="mr-1 size-3.5" />
                3D edit mode
              </Button>
            </div>
            {editMode === "model" && (
              <Button
                variant={partsOpen ? "default" : "outline"}
                size="sm"
                onClick={() => setPartsOpen((v) => !v)}
                aria-pressed={partsOpen}
                title="Show, hide and isolate body parts"
              >
                <PersonStanding className="mr-1 size-3.5" />
                Body parts
              </Button>
            )}
            {!focusMode && <SkinFileBar />}
            <Button
              variant={sourceOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setSourceOpen((v) => !v)}
              aria-pressed={sourceOpen}
              title="Float the source image above the canvas with zoom and color picking"
            >
              <ImageIcon className="mr-1 size-3.5" />
              Source view
            </Button>
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
            {!focusMode && <UserMenu />}
          </div>
        </div>
      </header>

      {focusMode ? (
        <main className="flex min-h-0 flex-1">
          {editMode === "model" ? (
            <div className="min-h-0 flex-1 p-4">
              <ClientOnly fallback={<PreviewFallback label="Loading 3D edit mode…" />}>
                <Suspense fallback={<PreviewFallback label="Loading 3D edit mode…" />}>
                  <ModelEditor3D />
                </Suspense>
              </ClientOnly>
            </div>
          ) : (
            <UVEditor fullBleed />
          )}
        </main>
      ) : (
        <main className="grid gap-4 overflow-x-hidden px-4 py-4 lg:px-6 xl:grid-cols-[300px_minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-4">
            <div className="sticky top-0 z-10">
              <ToolPanel />
            </div>
            {assistOpen && <ReferencePanel />}
            {assistOpen && <AutoDesignPanel />}
            <KeyboardShortcutsPanel />
            <div className="mt-auto">
              <ProjectsPanel />
            </div>
          </div>

          {editMode === "model" ? (
            <ClientOnly fallback={<PreviewFallback label="Loading 3D edit mode…" />}>
              <Suspense fallback={<PreviewFallback label="Loading 3D edit mode…" />}>
                <ModelEditor3D />
              </Suspense>
            </ClientOnly>
          ) : (
            <UVEditor />
          )}

          <div className="flex min-w-0 flex-col gap-4">
            {editMode === "flat" && (
              <ClientOnly fallback={<PreviewFallback label="Loading 3D preview…" />}>
                <Suspense fallback={<PreviewFallback label="Loading 3D preview…" />}>
                  <ModelPreview3D />
                </Suspense>
              </ClientOnly>
            )}
            <FrontPreview2D />
            <AtlasPreview />
          </div>
        </main>
      )}

      {sourceOpen && <SourceImagePanel onClose={() => setSourceOpen(false)} />}

      {focusMode && (
        <FloatingPanel title="Tools" onClose={() => setFocusMode(false)}>
          <ToolPanel bare />
          <details className="group border-t border-border">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-accent">
              <Keyboard className="size-3.5 text-muted-foreground" />
              Keyboard shortcuts
              <ChevronDown className="ml-auto size-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-4 pb-4">
              <ShortcutsList />
            </div>
          </details>
        </FloatingPanel>
      )}
    </div>
  );
}
