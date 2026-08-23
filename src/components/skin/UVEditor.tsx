import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";

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
import {
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

export function UVEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
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

  const pad = LAYOUT_PADDING;
  const width = (LAYOUT_CELLS_W + pad * 2) * cellSize;
  const height = (LAYOUT_CELLS_H + pad * 2) * cellSize + 18;

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
    const oy = pad * cellSize + 12;

    // group labels
    ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
    ctx.textBaseline = "alphabetic";
    for (const group of EDITOR_GROUPS) {
      const b = groupBounds(group);
      ctx.fillStyle = COLOR_GROUP_LABEL;
      ctx.fillText(
        PART_LABELS[group.part].toUpperCase(),
        ox + b.x * cellSize,
        oy + b.y * cellSize - 4,
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
        ctx.strokeRect(Math.round(px) - 1, Math.round(py) - 1, Math.round(w) + 2, Math.round(h) + 2);
      }

      // selection accent: inner outline, can coexist with FRONT
      if (face.id === selectedFaceId) {
        ctx.strokeStyle = COLOR_SELECTED;
        ctx.lineWidth = 2;
        ctx.strokeRect(Math.round(px) + 2, Math.round(py) + 2, Math.round(w) - 4, Math.round(h) - 4);
      }

      // technical labels
      if (cellSize >= 8) {
        ctx.font = "500 9px ui-sans-serif, system-ui, sans-serif";
        ctx.fillStyle = COLOR_LABEL;
        ctx.fillText(face.face, px, py - 2);
        const meta = showCoords
          ? `${face.atlas.w}x${face.atlas.h} @${face.atlas.x},${face.atlas.y}`
          : `${face.atlas.w}x${face.atlas.h}`;
        ctx.fillText(meta, px, py + h + 9);
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
      const oy = pad * cellSize + 12;
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

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const target = hit(e.clientX, e.clientY);
    if (!target) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    selectFace(target.faceId);
    if (tool !== "eyedropper") beginStroke();
    applyToolAt(target.faceId, target.localX, target.localY);
    drawingRef.current = tool === "pencil" || tool === "eraser";
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const target = hit(e.clientX, e.clientY);
    if (!target || target.faceId !== useEditorStore.getState().selectedFaceId) return;
    applyToolAt(target.faceId, target.localX, target.localY);
  };

  const endStroke = () => {
    drawingRef.current = false;
  };

  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-border bg-card shadow-sm">
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
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <canvas
          ref={canvasRef}
          data-testid="uv-editor-canvas"
          className="touch-none select-none"
          style={{ cursor: tool === "eyedropper" ? "crosshair" : "cell" }}
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
