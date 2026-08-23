import { useEffect, useRef } from "react";

import { getFace, type BodyPart } from "@/domain/skin/faceRegistry";
import { useSkinCanvas } from "@/hooks/useSkinCanvas";
import { useEditorStore } from "@/store/editorStore";

/** Front view, drawn as the viewer sees the character (character left = screen right). */
const PANELS: Array<{ part: BodyPart; x: number; y: number }> = [
  { part: "HEAD", x: 4, y: 0 },
  { part: "TORSO", x: 4, y: 8 },
  { part: "RIGHT_ARM", x: 0, y: 8 },
  { part: "LEFT_ARM", x: 12, y: 8 },
  { part: "RIGHT_LEG", x: 4, y: 20 },
  { part: "LEFT_LEG", x: 8, y: 20 },
];

const CELL = 8;
const W = 16 * CELL;
const H = 32 * CELL;

export function FrontPreview2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const source = useSkinCanvas();
  const version = useEditorStore((s) => s.version);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;

    for (const panel of PANELS) {
      const { atlas } = getFace(panel.part, "FRONT");
      ctx.drawImage(
        source,
        atlas.x,
        atlas.y,
        atlas.w,
        atlas.h,
        panel.x * CELL,
        panel.y * CELL,
        atlas.w * CELL,
        atlas.h * CELL,
      );
    }

    // seam between the two legs so they stay visually distinct
    ctx.fillStyle = "rgba(107,114,128,0.55)";
    ctx.fillRect(8 * CELL - 1, 20 * CELL, 2, 12 * CELL);
  }, [source, version]);

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <header className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">2D front preview</h2>
      </header>
      <div className="flex justify-center bg-checker p-4">
        <canvas ref={canvasRef} data-testid="front-preview-canvas" />
      </div>
    </section>
  );
}
