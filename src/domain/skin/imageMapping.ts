import type { AtlasRect } from "./faceRegistry";
import { putFacePixels, type SkinBuffer } from "./skinBuffer";

export type FitMode = "contain" | "cover";

/**
 * Render `source` into a tiny offscreen canvas sized exactly to the target
 * face and write the result into that face rectangle only.
 */
export function fitImageToFace(
  skin: SkinBuffer,
  rect: AtlasRect,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  mode: FitMode = "cover",
): void {
  const canvas = document.createElement("canvas");
  canvas.width = rect.w;
  canvas.height = rect.h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;
  ctx.clearRect(0, 0, rect.w, rect.h);

  if (mode === "cover") {
    // crop the source to the face aspect ratio, then downscale
    const scale = Math.max(rect.w / sourceWidth, rect.h / sourceHeight);
    const sw = rect.w / scale;
    const sh = rect.h / scale;
    const sx = (sourceWidth - sw) / 2;
    const sy = (sourceHeight - sh) / 2;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, rect.w, rect.h);
  } else {
    const scale = Math.min(rect.w / sourceWidth, rect.h / sourceHeight);
    const dw = Math.max(1, Math.round(sourceWidth * scale));
    const dh = Math.max(1, Math.round(sourceHeight * scale));
    const dx = Math.floor((rect.w - dw) / 2);
    const dy = Math.floor((rect.h - dh) / 2);
    ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, dx, dy, dw, dh);
  }

  const { data } = ctx.getImageData(0, 0, rect.w, rect.h);
  putFacePixels(skin, rect, data);
}
