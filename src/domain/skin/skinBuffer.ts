import { SKIN_SIZE, type AtlasRect } from "./faceRegistry";

export type SkinBuffer = Uint8ClampedArray;

export const BUFFER_LENGTH = SKIN_SIZE * SKIN_SIZE * 4;

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export function createBlankSkin(): SkinBuffer {
  return new Uint8ClampedArray(BUFFER_LENGTH);
}

export function cloneSkin(skin: SkinBuffer): SkinBuffer {
  return new Uint8ClampedArray(skin);
}

export function indexOf(x: number, y: number): number {
  return (y * SKIN_SIZE + x) * 4;
}

export function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < SKIN_SIZE && y < SKIN_SIZE;
}

export function getPixel(skin: SkinBuffer, x: number, y: number): RGBA {
  const i = indexOf(x, y);
  return { r: skin[i]!, g: skin[i + 1]!, b: skin[i + 2]!, a: skin[i + 3]! };
}

export function setPixel(skin: SkinBuffer, x: number, y: number, c: RGBA): void {
  if (!inBounds(x, y)) return;
  const i = indexOf(x, y);
  skin[i] = c.r;
  skin[i + 1] = c.g;
  skin[i + 2] = c.b;
  skin[i + 3] = c.a;
}

export function samePixel(a: RGBA, b: RGBA): boolean {
  if (a.a === 0 && b.a === 0) return true;
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

export const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

export function hexToRgba(hex: string, alpha = 255): RGBA {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = Number.parseInt(full.slice(0, 6), 16);
  return {
    r: (n >> 16) & 255,
    g: (n >> 8) & 255,
    b: n & 255,
    a: alpha,
  };
}

export function rgbaToHex(c: RGBA): string {
  const h = (v: number) => v.toString(16).padStart(2, "0");
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

/** Copy a face rectangle out of the canonical buffer. */
export function getFacePixels(skin: SkinBuffer, rect: AtlasRect): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rect.w * rect.h * 4);
  for (let y = 0; y < rect.h; y++) {
    for (let x = 0; x < rect.w; x++) {
      const src = indexOf(rect.x + x, rect.y + y);
      const dst = (y * rect.w + x) * 4;
      out[dst] = skin[src]!;
      out[dst + 1] = skin[src + 1]!;
      out[dst + 2] = skin[src + 2]!;
      out[dst + 3] = skin[src + 3]!;
    }
  }
  return out;
}

/** Write a face-sized RGBA block into the canonical buffer, clipped to the rect. */
export function putFacePixels(
  skin: SkinBuffer,
  rect: AtlasRect,
  pixels: Uint8ClampedArray,
): void {
  for (let y = 0; y < rect.h; y++) {
    for (let x = 0; x < rect.w; x++) {
      const src = (y * rect.w + x) * 4;
      const dst = indexOf(rect.x + x, rect.y + y);
      skin[dst] = pixels[src]!;
      skin[dst + 1] = pixels[src + 1]!;
      skin[dst + 2] = pixels[src + 2]!;
      skin[dst + 3] = pixels[src + 3]!;
    }
  }
}

/** Mirror a face-sized RGBA block left-to-right. */
export function flipPixelsHorizontal(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = (y * w + (w - 1 - x)) * 4;
      const dst = (y * w + x) * 4;
      out[dst] = pixels[src]!;
      out[dst + 1] = pixels[src + 1]!;
      out[dst + 2] = pixels[src + 2]!;
      out[dst + 3] = pixels[src + 3]!;
    }
  }
  return out;
}

/** Mirror a face-sized RGBA block top-to-bottom. */
export function flipPixelsVertical(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
): Uint8ClampedArray {
  const out = new Uint8ClampedArray(pixels.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const src = ((h - 1 - y) * w + x) * 4;
      const dst = (y * w + x) * 4;
      out[dst] = pixels[src]!;
      out[dst + 1] = pixels[src + 1]!;
      out[dst + 2] = pixels[src + 2]!;
      out[dst + 3] = pixels[src + 3]!;
    }
  }
  return out;
}

export function fillRect(skin: SkinBuffer, rect: AtlasRect, color: RGBA): void {
  for (let y = 0; y < rect.h; y++) {
    for (let x = 0; x < rect.w; x++) {
      setPixel(skin, rect.x + x, rect.y + y, color);
    }
  }
}

/**
 * Flood fill constrained to a single face rectangle. Never reads or writes
 * texels outside `rect`, even when neighbouring atlas texels match.
 */
export function floodFillFace(
  skin: SkinBuffer,
  rect: AtlasRect,
  localX: number,
  localY: number,
  color: RGBA,
): void {
  if (localX < 0 || localY < 0 || localX >= rect.w || localY >= rect.h) return;
  const target = getPixel(skin, rect.x + localX, rect.y + localY);
  if (samePixel(target, color)) return;

  const stack: Array<[number, number]> = [[localX, localY]];
  const seen = new Set<number>();

  while (stack.length) {
    const [lx, ly] = stack.pop()!;
    if (lx < 0 || ly < 0 || lx >= rect.w || ly >= rect.h) continue;
    const key = ly * rect.w + lx;
    if (seen.has(key)) continue;
    seen.add(key);

    const px = getPixel(skin, rect.x + lx, rect.y + ly);
    if (!samePixel(px, target)) continue;

    setPixel(skin, rect.x + lx, rect.y + ly, color);
    stack.push([lx + 1, ly], [lx - 1, ly], [lx, ly + 1], [lx, ly - 1]);
  }
}

export function skinToImageData(skin: SkinBuffer): ImageData {
  return new ImageData(new Uint8ClampedArray(skin), SKIN_SIZE, SKIN_SIZE);
}

/** Blit the canonical buffer to a 64x64 canvas (used for previews, 3D, export). */
export function writeSkinToCanvas(skin: SkinBuffer, canvas: HTMLCanvasElement): void {
  if (canvas.width !== SKIN_SIZE) canvas.width = SKIN_SIZE;
  if (canvas.height !== SKIN_SIZE) canvas.height = SKIN_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.clearRect(0, 0, SKIN_SIZE, SKIN_SIZE);
  ctx.putImageData(skinToImageData(skin), 0, 0);
}
