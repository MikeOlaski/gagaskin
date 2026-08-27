import {
  GripVertical,
  ImagePlus,
  Maximize,
  Minus,
  Palette,
  Pipette,
  Plus,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { loadImageFromFile } from "@/domain/skin/importExport";
import { extractPalette } from "@/domain/skin/palette";
import { rgbaToHex } from "@/domain/skin/skinBuffer";
import { useEditorStore } from "@/store/editorStore";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 24;
const DEFAULT_SIZE = { w: 420, h: 380 };
const DEFAULT_POS = { x: 380, y: 96 };

interface SourceImagePanelProps {
  onClose: () => void;
}

/**
 * Floating source-image inspector: zoom, pan, eyedropper and palette
 * extraction for the uploaded reference, layered above the editor canvas.
 */
export function SourceImagePanel({ onClose }: SourceImagePanelProps) {
  const reference = useEditorStore((s) => s.reference);
  const setReference = useEditorStore((s) => s.setReference);
  const setColor = useEditorStore((s) => s.setColor);
  const setPalette = useEditorStore((s) => s.setPalette);
  const palette = useEditorStore((s) => s.palette);

  const fileRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [pos, setPos] = useState(DEFAULT_POS);
  const [size, setSize] = useState(DEFAULT_SIZE);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(1);
  const [picking, setPicking] = useState(true);
  const [hoverHex, setHoverHex] = useState<string | null>(null);

  const dragRef = useRef<{ mode: "move" | "resize" | "pan"; x: number; y: number; a: number; b: number } | null>(
    null,
  );
  const stateRef = useRef({ zoom, offset });
  stateRef.current = { zoom, offset };

  /** Fit the reference into the current viewport, centered. */
  const fitToView = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp || !reference) return;
    const k = Math.min(vp.clientWidth / reference.width, vp.clientHeight / reference.height) * 0.95;
    setZoom(k);
    setOffset({
      x: (vp.clientWidth - reference.width * k) / 2,
      y: (vp.clientHeight - reference.height * k) / 2,
    });
  }, [reference]);

  useEffect(() => {
    fitToView();
  }, [fitToView, size.w, size.h]);

  // Native, non-passive wheel listener so preventDefault actually works and the
  // page behind the panel never scrolls.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom: z, offset: off } = stateRef.current;
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const next = Math.min(Math.max(z * Math.exp(-dy * 0.0015), MIN_ZOOM), MAX_ZOOM);
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const k = next / z;
      setZoom(next);
      setOffset({ x: px - (px - off.x) * k, y: py - (py - off.y) * k });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomAtCenter = (factor: number) => {
    const el = viewportRef.current;
    const { zoom: z, offset: off } = stateRef.current;
    const next = Math.min(Math.max(z * factor, MIN_ZOOM), MAX_ZOOM);
    const px = (el?.clientWidth ?? 0) / 2;
    const py = (el?.clientHeight ?? 0) / 2;
    const k = next / z;
    setZoom(next);
    setOffset({ x: px - (px - off.x) * k, y: py - (py - off.y) * k });
  };

  const startDrag =
    (mode: "move" | "resize" | "pan") => (e: React.PointerEvent<HTMLElement>) => {
      if (mode === "pan" && picking && e.button === 0 && !e.altKey) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        mode,
        x: e.clientX,
        y: e.clientY,
        a: mode === "move" ? pos.x : mode === "resize" ? size.w : offset.x,
        b: mode === "move" ? pos.y : mode === "resize" ? size.h : offset.y,
      };
    };

  const onDragMove = (e: React.PointerEvent<HTMLElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (d.mode === "move") {
      const w = panelRef.current?.offsetWidth ?? size.w;
      const h = panelRef.current?.offsetHeight ?? size.h;
      setPos({
        x: Math.min(Math.max(d.a + dx, 0), Math.max(0, window.innerWidth - w)),
        y: Math.min(Math.max(d.b + dy, 0), Math.max(0, window.innerHeight - h)),
      });
    } else if (d.mode === "resize") {
      setSize({
        w: Math.min(Math.max(d.a + dx, 280), window.innerWidth - 40),
        h: Math.min(Math.max(d.b + dy, 240), window.innerHeight - 40),
      });
    } else {
      setOffset({ x: d.a + dx, y: d.b + dy });
    }
  };

  const endDrag = () => {
    dragRef.current = null;
  };

  /** Read the reference pixel under the pointer, in image space. */
  const pixelAt = (clientX: number, clientY: number) => {
    if (!reference) return null;
    const el = viewportRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const { zoom: z, offset: off } = stateRef.current;
    const ix = Math.floor((clientX - rect.left - off.x) / z);
    const iy = Math.floor((clientY - rect.top - off.y) / z);
    if (ix < 0 || iy < 0 || ix >= reference.width || iy >= reference.height) return null;
    let canvas = sampleCanvasRef.current;
    if (!canvas || canvas.width !== reference.width || canvas.height !== reference.height) {
      canvas = document.createElement("canvas");
      canvas.width = reference.width;
      canvas.height = reference.height;
      const c = canvas.getContext("2d", { willReadFrequently: true });
      c?.drawImage(reference.element, 0, 0);
      sampleCanvasRef.current = canvas;
    }
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const d = ctx.getImageData(ix, iy, 1, 1).data;
    return rgbaToHex({ r: d[0]!, g: d[1]!, b: d[2]!, a: 255 });
  };

  useEffect(() => {
    sampleCanvasRef.current = null;
  }, [reference]);

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      setReference({ url: img.src, width: img.naturalWidth, height: img.naturalHeight, element: img });
      toast.success("Source image loaded");
    } catch {
      toast.error("That file could not be read as an image.");
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed z-50 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
    >
      <div
        className="flex shrink-0 touch-none cursor-grab items-center gap-2 border-b border-border bg-muted/50 px-3 py-2 active:cursor-grabbing"
        onPointerDown={startDrag("move")}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <GripVertical className="size-4 shrink-0 text-muted-foreground" />
        <span className="text-xs font-semibold text-foreground">Source image</span>
        <span className="font-mono text-[11px] text-muted-foreground">
          {reference ? `${reference.width}×${reference.height} · ${Math.round(zoom * 100)}%` : "none"}
        </span>
        <button
          type="button"
          aria-label="Close source image panel"
          title="Close"
          onClick={onClose}
          className="ml-auto shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-border px-2 py-1.5">
        <Button
          size="icon"
          variant={picking ? "default" : "outline"}
          className="size-7"
          title="Eyedropper — click the image to set the paint color"
          aria-label="Eyedropper"
          aria-pressed={picking}
          onClick={() => setPicking((v) => !v)}
        >
          <Pipette className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="size-7"
          title="Zoom out"
          aria-label="Zoom out"
          onClick={() => zoomAtCenter(1 / 1.3)}
        >
          <Minus className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="size-7"
          title="Zoom in"
          aria-label="Zoom in"
          onClick={() => zoomAtCenter(1.3)}
        >
          <Plus className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="size-7"
          title="Fit to panel"
          aria-label="Fit to panel"
          onClick={fitToView}
        >
          <Maximize className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="size-7"
          title="Extract palette from this image"
          aria-label="Extract palette"
          onClick={() => {
            if (!reference) return;
            const colors = extractPalette(reference.element, 12);
            setPalette(colors);
            if (colors.length === 0) toast.error("No opaque colors found in that image.");
            else toast.success(`${colors.length} colors extracted`);
          }}
        >
          <Palette className="size-3.5" />
        </Button>
        <Button
          size="icon"
          variant="outline"
          className="size-7"
          title="Upload a source image"
          aria-label="Upload source image"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="size-3.5" />
        </Button>
        <label className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
          Opacity
          <input
            type="range"
            min={20}
            max={100}
            value={Math.round(opacity * 100)}
            onChange={(e) => setOpacity(Number(e.target.value) / 100)}
            className="w-16 accent-primary"
            aria-label="Panel opacity"
          />
        </label>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          void onUpload(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 touch-none overflow-hidden bg-checker"
        style={{ opacity, cursor: picking ? "crosshair" : "grab" }}
        onPointerDown={startDrag("pan")}
        onPointerMove={(e) => {
          onDragMove(e);
          if (picking && !dragRef.current) setHoverHex(pixelAt(e.clientX, e.clientY));
        }}
        onPointerLeave={() => setHoverHex(null)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={(e) => {
          if (!picking) return;
          const hex = pixelAt(e.clientX, e.clientY);
          if (hex) {
            setColor(hex);
            toast.success(`Picked ${hex}`);
          }
        }}
      >
        {reference ? (
          <img
            src={reference.url}
            alt="Source reference"
            draggable={false}
            className="absolute left-0 top-0 origin-top-left select-none"
            style={{
              width: reference.width,
              height: reference.height,
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              transformOrigin: "0 0",
              imageRendering: zoom >= 3 ? "pixelated" : "auto",
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
            Upload a source image to zoom in and pick colors from it.
          </div>
        )}

        {hoverHex ? (
          <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md border border-border bg-card/90 px-2 py-1 font-mono text-[11px] text-foreground">
            <span
              className="size-3 rounded-sm border border-border"
              style={{ backgroundColor: hoverHex }}
            />
            {hoverHex}
          </div>
        ) : null}
      </div>

      {palette.length > 0 ? (
        <div className="flex shrink-0 gap-1 border-t border-border px-2 py-1.5">
          {palette.slice(0, 14).map((hex) => (
            <button
              key={hex}
              type="button"
              title={hex}
              aria-label={`Use ${hex}`}
              onClick={() => setColor(hex)}
              className="size-5 rounded border border-border transition-transform hover:scale-110"
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      ) : null}

      <div
        role="presentation"
        title="Resize"
        className="absolute bottom-0 right-0 size-4 cursor-nwse-resize touch-none"
        onPointerDown={startDrag("resize")}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <span className="absolute bottom-1 right-1 block size-2 border-b-2 border-r-2 border-muted-foreground/60" />
      </div>
    </div>
  );
}
