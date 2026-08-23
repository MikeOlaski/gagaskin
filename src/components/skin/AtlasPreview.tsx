import { useEffect, useRef } from "react";

import { useSkinCanvas } from "@/hooks/useSkinCanvas";
import { useEditorStore } from "@/store/editorStore";

const SCALE = 4;

/** Display-only view of the canonical texture. Nothing is drawn back into it. */
export function AtlasPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const source = useSkinCanvas();
  const version = useEditorStore((s) => s.version);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !source) return;
    const size = 64 * SCALE;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0, size, size);
  }, [source, version]);

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Canonical 64 × 64 atlas</h2>
        <span className="ml-auto font-mono text-xs text-muted-foreground">read-only</span>
      </header>
      <div className="flex justify-center bg-checker p-4">
        <canvas
          ref={canvasRef}
          data-testid="atlas-canvas"
          className="border border-border"
        />
      </div>
    </section>
  );
}
