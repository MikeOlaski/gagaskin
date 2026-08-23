import { SKIN_SIZE } from "./faceRegistry";
import { createBlankSkin, writeSkinToCanvas, type SkinBuffer } from "./skinBuffer";

export class SkinImportError extends Error {}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new SkinImportError("That file could not be read as an image."));
    };
    img.src = url;
  });
}

/** Decode a 64x64 PNG skin into a canonical buffer. Rejects other sizes. */
export function imageToSkinBuffer(img: HTMLImageElement): SkinBuffer {
  if (img.naturalWidth !== SKIN_SIZE || img.naturalHeight !== SKIN_SIZE) {
    throw new SkinImportError(
      `Skin must be exactly 64 x 64 pixels. This file is ${img.naturalWidth} x ${img.naturalHeight}.`,
    );
  }
  const canvas = document.createElement("canvas");
  canvas.width = SKIN_SIZE;
  canvas.height = SKIN_SIZE;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new SkinImportError("Canvas is unavailable in this browser.");
  ctx.clearRect(0, 0, SKIN_SIZE, SKIN_SIZE);
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, SKIN_SIZE, SKIN_SIZE);
  const skin = createBlankSkin();
  skin.set(data);
  return skin;
}

/** Export the canonical texture only — never a preview or editor canvas. */
export function exportSkinPng(skin: SkinBuffer, filename = "minecraft-skin.png"): void {
  const canvas = document.createElement("canvas");
  writeSkinToCanvas(skin, canvas);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
