import { describe, expect, it } from "vitest";

import { FACES, getFace, SKIN_SIZE } from "@/domain/skin/faceRegistry";
import {
  BUFFER_LENGTH,
  cloneSkin,
  createBlankSkin,
  fillRect,
  floodFillFace,
  getFacePixels,
  getPixel,
  hexToRgba,
  putFacePixels,
  rgbaToHex,
  setPixel,
  TRANSPARENT,
} from "@/domain/skin/skinBuffer";

const RED = { r: 255, g: 0, b: 0, a: 255 };

describe("canonical buffer", () => {
  it("is 64 x 64 RGBA", () => {
    expect(BUFFER_LENGTH).toBe(16384);
    expect(createBlankSkin()).toHaveLength(16384);
    expect(SKIN_SIZE).toBe(64);
  });

  it("round-trips hex colors", () => {
    expect(rgbaToHex(hexToRgba("#3b82f6"))).toBe("#3b82f6");
    expect(hexToRgba("#ffffff", 128).a).toBe(128);
  });
});

describe("painting", () => {
  it("writes torso.front (0,0) to atlas (20,20) only", () => {
    const skin = createBlankSkin();
    const rect = getFace("TORSO", "FRONT").atlas;
    setPixel(skin, rect.x + 0, rect.y + 0, RED);
    expect(getPixel(skin, 20, 20)).toEqual(RED);
    let painted = 0;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) if (getPixel(skin, x, y).a > 0) painted++;
    }
    expect(painted).toBe(1);
  });

  it("erases to full transparency", () => {
    const skin = createBlankSkin();
    setPixel(skin, 20, 20, RED);
    setPixel(skin, 20, 20, TRANSPARENT);
    expect(getPixel(skin, 20, 20).a).toBe(0);
  });

  it("isolates every face: filling one face changes only its own texels", () => {
    for (const face of FACES) {
      const skin = createBlankSkin();
      fillRect(skin, face.atlas, RED);
      for (const other of FACES) {
        if (other.id === face.id) continue;
        const pixels = getFacePixels(skin, other.atlas);
        const touched = [...pixels].some((v, i) => i % 4 === 3 && v > 0);
        expect(touched, `${face.id} leaked into ${other.id}`).toBe(false);
      }
      const own = getFacePixels(skin, face.atlas);
      expect(own.filter((_, i) => i % 4 === 3).every((a) => a === 255)).toBe(true);
    }
  });

  it("keeps opposite limbs independent", () => {
    const cases = [
      ["LEFT_LEG", "RIGHT_LEG", "FRONT"],
      ["LEFT_LEG", "RIGHT_LEG", "LEFT"],
      ["LEFT_ARM", "RIGHT_ARM", "FRONT"],
    ] as const;
    for (const [a, b, face] of cases) {
      const skin = createBlankSkin();
      fillRect(skin, getFace(a, face).atlas, RED);
      const other = getFacePixels(skin, getFace(b, face).atlas);
      expect([...other].every((v) => v === 0)).toBe(true);
    }
  });

  it("constrains flood fill to the selected face", () => {
    const skin = createBlankSkin();
    // paint the whole atlas one color so a naive fill would escape the face
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) setPixel(skin, x, y, { r: 10, g: 10, b: 10, a: 255 });
    }
    const face = getFace("LEFT_ARM", "FRONT");
    floodFillFace(skin, face.atlas, 0, 0, RED);
    const own = getFacePixels(skin, face.atlas);
    expect(own).toHaveLength(4 * 12 * 4);
    for (let i = 0; i < own.length; i += 4) expect(own[i]).toBe(255);

    let redOutside = 0;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const inFace =
          x >= face.atlas.x &&
          x < face.atlas.x + face.atlas.w &&
          y >= face.atlas.y &&
          y < face.atlas.y + face.atlas.h;
        if (!inFace && getPixel(skin, x, y).r === 255) redOutside++;
      }
    }
    expect(redOutside).toBe(0);
  });

  it("copies a limb face to the opposite limb only", () => {
    const skin = createBlankSkin();
    const src = getFace("LEFT_LEG", "FRONT");
    const dst = getFace("RIGHT_LEG", "FRONT");
    fillRect(skin, src.atlas, RED);
    const before = cloneSkin(skin);
    putFacePixels(skin, dst.atlas, getFacePixels(skin, src.atlas));
    expect([...getFacePixels(skin, dst.atlas)]).toEqual([...getFacePixels(skin, src.atlas)]);
    let diff = 0;
    for (let i = 0; i < skin.length; i++) if (skin[i] !== before[i]) diff++;
    // only the 4x12 destination face may change
    expect(diff).toBeLessThanOrEqual(4 * 12 * 4);
  });
});
