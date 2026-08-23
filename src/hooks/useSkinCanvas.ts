import { useEffect, useMemo, useState } from "react";

import { writeSkinToCanvas } from "@/domain/skin/skinBuffer";
import { useEditorStore } from "@/store/editorStore";

/**
 * A private, offscreen 64x64 canvas that mirrors the canonical texture.
 * Derived state only — the buffer in the store stays the source of truth and
 * nothing decorative is ever drawn here.
 */
export function useSkinCanvas(): HTMLCanvasElement | null {
  const skin = useEditorStore((s) => s.skin);
  const [ready, setReady] = useState(false);

  const canvas = useMemo(() => {
    if (typeof document === "undefined") return null;
    const c = document.createElement("canvas");
    c.width = 64;
    c.height = 64;
    return c;
  }, []);

  useEffect(() => {
    if (!canvas) return;
    writeSkinToCanvas(skin, canvas);
    setReady(true);
  }, [canvas, skin]);

  return ready ? canvas : canvas;
}
