import { rgbaToHex } from "./skinBuffer";

/**
 * V1 palette extraction: downscale to 64x64, drop transparent texels,
 * quantize RGB channels, frequency count, return the top N colors.
 */
export function extractPalette(source: CanvasImageSource, count = 12): string[] {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(source, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const buckets = new Map<number, { n: number; r: number; g: number; b: number }>();
  const step = 24; // quantization bucket width

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]!;
    if (a < 16) continue;
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const key =
      Math.round(r / step) * 65536 + Math.round(g / step) * 256 + Math.round(b / step);
    const bucket = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
    bucket.n += 1;
    bucket.r += r;
    bucket.g += g;
    bucket.b += b;
    buckets.set(key, bucket);
  }

  return [...buckets.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, count)
    .map((bucket) =>
      rgbaToHex({
        r: Math.round(bucket.r / bucket.n),
        g: Math.round(bucket.g / bucket.n),
        b: Math.round(bucket.b / bucket.n),
        a: 255,
      }),
    );
}
