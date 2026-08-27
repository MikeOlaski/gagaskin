import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PART_LABELS } from "@/domain/skin/faceRegistry";
import {
  EDITOR_GROUPS,
  LAYOUT_CELLS_H,
  LAYOUT_CELLS_W,
  LAYOUT_PADDING,
  PLACED_FACES,
  groupBounds,
} from "@/domain/skin/layout";
import { getPixel } from "@/domain/skin/skinBuffer";
import { cn } from "@/lib/utils";
import {
  DEFAULT_CELL,
  MAX_CELL,
  MIN_CELL,
  useEditorStore,
  useSelectedFace,
} from "@/store/editorStore";

const COLOR_PANEL_BORDER = "#4b5563";
const COLOR_GRID = "#e2e5ea";
const COLOR_FRONT = "#2563eb";
const COLOR_SELECTED = "#ea7317";
const COLOR_LABEL = "#6b7280";
const COLOR_GROUP_LABEL = "#374151";
const CHECKER_A = "#ffffff";
const CHECKER_B = "#f1f2f4";

export function UVEditor({ fullBleed = false }: { fullBleed?: boolean } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const spaceHeldRef = useRef(false);
  const dragOriginRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const zoomAnchorRef = useRef<{
    cellX: number;
    cellY: number;
    clientX: number;
    clientY: number;
  } | null>(null);
  // The canvas is free-floating (like Figma/Photoshop) — panning moves it via
  // CSS transform rather than relying on native scroll, so it's draggable
  // anywhere in the viewport even when it's smaller than the available space.
  const [pan, setPan] = useState({ x: 24, y: 24 });
  const panRef = useRef(pan);
  useEffect(() => {
    panRef.current = pan;
  }, [pan]);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const skin = useEditorStore((s) => s.skin);
  const cellSize = useEditorStore((s) => s.cellSize);
  const setCellSize = useEditorStore((s) => s.setCellSize);
  const showCoords = useEditorStore((s) => s.showCoords);
  const tool = useEditorStore((s) => s.tool);
  const selectedFaceId = useEditorStore((s) => s.selectedFaceId);
  const selectFace = useEditorStore((s) => s.selectFace);
  const applyToolAt = useEditorStore((s) => s.applyToolAt);
  const beginStroke = useEditorStore((s) => s.beginStroke);
  const selected = useSelectedFace();

  // Centers the exploded map (at the given zoom) in whatever space the
  // viewport currently has — shared by first paint and the view shortcuts.
  const centerAt = useCallback((cell: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const contentW = (LAYOUT_CELLS_W + LAYOUT_PADDING * 2) * cell;
    const contentH = (LAYOUT_CELLS_H + LAYOUT_PADDING * 2) * cell + 40;
    setPan({
      x: Math.max(24, (viewport.clientWidth - contentW) / 2),
      y: Math.max(24, (viewport.clientHeight - contentH) / 2),
    });
  }, []);

  // Largest cell size (clamped to [MIN_CELL, MAX_CELL]) that fits the whole
  // exploded map inside the current viewport, on both axes.
  const fitCellSize = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return DEFAULT_CELL;
    const vw = viewport.clientWidth - 48;
    const vh = viewport.clientHeight - 48 - 40;
    const cellsW = LAYOUT_CELLS_W + LAYOUT_PADDING * 2;
    const cellsH = LAYOUT_CELLS_H + LAYOUT_PADDING * 2;
    const byWidth = Math.floor(vw / cellsW);
    const byHeight = Math.floor(vh / cellsH);
    return Math.max(MIN_CELL, Math.min(MAX_CELL, Math.min(byWidth, byHeight)));
  }, []);

  // Fit the exploded map to narrow viewports and center it in the available
  // space on first paint (client only).
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    if (!viewportRef.current) return;
    initialized.current = true;

    const cell = fitCellSize();
    if (cell !== cellSize) setCellSize(cell);
    centerAt(cell);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // View shortcuts: C centers without changing zoom, Shift+0 resets to the
  // default zoom, Shift+1 fits the whole map to the viewport, +/- step zoom —
  // all mirroring conventions from Figma/Photoshop-style canvas apps.
  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      const tag = (el as HTMLElement | null)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isEditable(document.activeElement)) return;
      const state = useEditorStore.getState();
      if (!e.shiftKey && (e.key === "c" || e.key === "C")) {
        centerAt(state.cellSize);
        return;
      }
      // Shift+digit keys report the shifted symbol in e.key (e.g. ")", "!"),
      // not the digit — check the physical key via e.code instead.
      if (e.shiftKey && e.code === "Digit0") {
        e.preventDefault();
        state.setCellSize(DEFAULT_CELL);
        centerAt(DEFAULT_CELL);
        return;
      }
      if (e.shiftKey && e.code === "Digit1") {
        e.preventDefault();
        const cell = fitCellSize();
        state.setCellSize(cell);
        centerAt(cell);
        return;
      }
      if (e.key === "+" || e.key === "=") {
        state.setCellSize(state.cellSize + 2);
        return;
      }
      if (e.key === "-" || e.key === "_") {
        state.setCellSize(state.cellSize - 2);
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [centerAt, fitCellSize]);

  // Hold space for grab-to-pan, like other canvas apps.
  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      const tag = (el as HTMLElement | null)?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || isEditable(document.activeElement)) return;
      spaceHeldRef.current = true;
      setSpaceHeld(true);
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      spaceHeldRef.current = false;
      setSpaceHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // Plain scroll pans the free-floating canvas; Ctrl/Cmd + scroll zooms toward the cursor.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!(e.ctrlKey || e.metaKey)) {
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
        return;
      }
      const rect = viewport.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;
      const state = useEditorStore.getState();
      const currentPan = panRef.current;
      zoomAnchorRef.current = {
        cellX: (clientX - currentPan.x) / state.cellSize,
        cellY: (clientY - currentPan.y) / state.cellSize,
        clientX,
        clientY,
      };
      state.setCellSize(state.cellSize + (e.deltaY > 0 ? -1 : 1));
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, []);

  // Re-anchor pan after a wheel-zoom so the point under the cursor stays put.
  useEffect(() => {
    const anchor = zoomAnchorRef.current;
    if (!anchor) return;
    zoomAnchorRef.current = null;
    setPan({
      x: anchor.clientX - anchor.cellX * cellSize,
      y: anchor.clientY - anchor.cellY * cellSize,
    });
  }, [cellSize]);

  const pad = LAYOUT_PADDING;
  const width = (LAYOUT_CELLS_W + pad * 2) * cellSize;
  const height = (LAYOUT_CELLS_H + pad * 2) * cellSize + 40;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const ox = pad * cellSize;
    const oy = pad * cellSize + 22;

    // group labels
    ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "alphabetic";
    for (const group of EDITOR_GROUPS) {
      const b = groupBounds(group);
      ctx.fillStyle = COLOR_GROUP_LABEL;
      ctx.fillText(
        PART_LABELS[group.part].toUpperCase(),
        ox + b.x * cellSize,
        oy + b.y * cellSize - 17,
      );
    }

    for (const placed of PLACED_FACES) {
      const { face } = placed;
      const px = ox + placed.x * cellSize;
      const py = oy + placed.y * cellSize;
      const w = face.atlas.w * cellSize;
      const h = face.atlas.h * cellSize;

      // texels (checkerboard beneath so transparency is visible)
      for (let ty = 0; ty < face.atlas.h; ty++) {
        for (let tx = 0; tx < face.atlas.w; tx++) {
          const cx = px + tx * cellSize;
          const cy = py + ty * cellSize;
          ctx.fillStyle = (tx + ty) % 2 === 0 ? CHECKER_A : CHECKER_B;
          ctx.fillRect(cx, cy, cellSize, cellSize);
          const c = getPixel(skin, face.atlas.x + tx, face.atlas.y + ty);
          if (c.a > 0) {
            ctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${c.a / 255})`;
            ctx.fillRect(cx, cy, cellSize, cellSize);
          }
        }
      }

      // internal grid
      ctx.strokeStyle = COLOR_GRID;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let tx = 1; tx < face.atlas.w; tx++) {
        const gx = Math.round(px + tx * cellSize) + 0.5;
        ctx.moveTo(gx, py);
        ctx.lineTo(gx, py + h);
      }
      for (let ty = 1; ty < face.atlas.h; ty++) {
        const gy = Math.round(py + ty * cellSize) + 0.5;
        ctx.moveTo(px, gy);
        ctx.lineTo(px + w, gy);
      }
      ctx.stroke();

      // panel boundary
      ctx.strokeStyle = COLOR_PANEL_BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(
        Math.round(px) + 0.5,
        Math.round(py) + 0.5,
        Math.round(w) - 1,
        Math.round(h) - 1,
      );

      // FRONT orientation accent: outline only, never a fill
      if (face.front) {
        ctx.strokeStyle = COLOR_FRONT;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          Math.round(px) - 1,
          Math.round(py) - 1,
          Math.round(w) + 2,
          Math.round(h) + 2,
        );
      }

      // selection accent: inner outline, can coexist with FRONT
      if (face.id === selectedFaceId) {
        ctx.strokeStyle = COLOR_SELECTED;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          Math.round(px) + 2,
          Math.round(py) + 2,
          Math.round(w) - 4,
          Math.round(h) - 4,
        );
      }

      // technical labels — drawn in the gutters, never over texels
      ctx.font = "500 9px ui-sans-serif, system-ui, sans-serif";
      ctx.fillStyle = face.id === selectedFaceId ? COLOR_SELECTED : COLOR_LABEL;
      const nameWidth = ctx.measureText(face.face).width;
      if (nameWidth <= w + 6) ctx.fillText(face.face, px, py - 3);

      if (cellSize >= 10) {
        ctx.font = "500 8px ui-sans-serif, system-ui, sans-serif";
        const dims = `${face.atlas.w}x${face.atlas.h}`;
        ctx.fillText(dims, px, py + h + 9);
        if (showCoords) {
          const coords = `@${face.atlas.x},${face.atlas.y}`;
          if (ctx.measureText(coords).width <= w + 8) {
            ctx.fillText(coords, px, py + h + 18);
          }
        }
      }
    }
  }, [skin, cellSize, selectedFaceId, showCoords, width, height, pad]);

  const hit = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const ox = pad * cellSize;
      const oy = pad * cellSize + 22;
      for (const placed of PLACED_FACES) {
        const fx = ox + placed.x * cellSize;
        const fy = oy + placed.y * cellSize;
        const w = placed.face.atlas.w * cellSize;
        const h = placed.face.atlas.h * cellSize;
        if (px >= fx && px < fx + w && py >= fy && py < fy + h) {
          return {
            faceId: placed.face.id,
            localX: Math.floor((px - fx) / cellSize),
            localY: Math.floor((py - fy) / cellSize),
          };
        }
      }
      return null;
    },
    [cellSize, pad],
  );

  // Capture is best-effort: a failure here (e.g. an already-released pointer)
  // must never block selection/painting/panning from proceeding.
  const capturePointer = (target: Element, pointerId: number) => {
    try {
      (target as Element & { setPointerCapture: (id: number) => void }).setPointerCapture(
        pointerId,
      );
    } catch {
      // ignored
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (spaceHeldRef.current || e.button === 1 || tool === "hand") {
      e.preventDefault();
      capturePointer(e.currentTarget, e.pointerId);
      dragOriginRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: panRef.current.x,
        originY: panRef.current.y,
      };
      setIsPanning(true);
      return;
    }
    if (e.button !== 0) return;
    const target = hit(e.clientX, e.clientY);
    if (!target) return;
    capturePointer(e.currentTarget, e.pointerId);
    selectFace(target.faceId);
    if (tool === "select") return;
    if (tool !== "eyedropper") beginStroke();
    applyToolAt(target.faceId, target.localX, target.localY);
    drawingRef.current = tool === "pencil" || tool === "eraser";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragOriginRef.current) {
      const { startX, startY, originX, originY } = dragOriginRef.current;
      setPan({ x: originX + (e.clientX - startX), y: originY + (e.clientY - startY) });
      return;
    }
    if (!drawingRef.current) return;
    const target = hit(e.clientX, e.clientY);
    if (!target || target.faceId !== useEditorStore.getState().selectedFaceId) return;
    applyToolAt(target.faceId, target.localX, target.localY);
  };

  const endStroke = () => {
    drawingRef.current = false;
    if (dragOriginRef.current) {
      dragOriginRef.current = null;
      setIsPanning(false);
    }
  };

  return (
    <section
      className={cn(
        "flex min-h-0 w-full min-w-0 flex-col bg-card",
        !fullBleed && "rounded-xl border border-border shadow-sm",
      )}
    >
      <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Exploded UV editor</h2>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Zoom out"
            onClick={() => setCellSize(cellSize - 2)}
          >
            <Minus className="size-4" />
          </Button>
          <Slider
            className="w-28"
            aria-label="Editor zoom"
            min={MIN_CELL}
            max={MAX_CELL}
            step={1}
            value={[cellSize]}
            onValueChange={(v) => setCellSize(v[0] ?? cellSize)}
          />
          <Button
            variant="outline"
            size="icon"
            aria-label="Zoom in"
            onClick={() => setCellSize(cellSize + 2)}
          >
            <Plus className="size-4" />
          </Button>
          <span className="rounded-md bg-accent px-2 py-1 font-mono text-xs text-accent-foreground">
            {cellSize}px / texel
          </span>
          <span
            data-testid="selected-face-badge"
            className="rounded-md bg-selected/12 px-2 py-1 text-xs font-medium text-selected"
          >
            {selected
              ? `${PART_LABELS[selected.part]} · ${selected.face} (${selected.atlas.w}x${selected.atlas.h})`
              : "No face selected"}
          </span>
        </div>
      </header>
      <div ref={viewportRef} className="relative min-h-0 flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          data-testid="uv-editor-canvas"
          className="touch-none select-none"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            cursor: isPanning
              ? "grabbing"
              : spaceHeld || tool === "hand"
                ? "grab"
                : tool === "select"
                  ? "default"
                  : tool === "eyedropper"
                    ? "crosshair"
                    : "cell",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
        />
      </div>
    </section>
  );
}
