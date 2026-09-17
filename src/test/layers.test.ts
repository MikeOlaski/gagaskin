import { describe, expect, it } from "vitest";

import {
  ALL_FACES,
  FACES,
  faceAtAtlas,
  getFace,
  OUTER_FACES,
  SKIN_SIZE,
} from "@/domain/skin/faceRegistry";

describe("inner & outer layers", () => {
  it("registers 36 inner and 36 outer faces", () => {
    expect(FACES).toHaveLength(36);
    expect(OUTER_FACES).toHaveLength(36);
    expect(ALL_FACES).toHaveLength(72);
  });

  it("places overlay blocks at the vanilla origins", () => {
    expect(getFace("HEAD", "TOP", "outer").atlas).toEqual({ x: 40, y: 0, w: 8, h: 8 });
    expect(getFace("TORSO", "FRONT", "outer").atlas).toEqual({ x: 20, y: 36, w: 8, h: 12 });
    expect(getFace("RIGHT_ARM", "FRONT", "outer").atlas).toEqual({ x: 44, y: 36, w: 4, h: 12 });
    expect(getFace("LEFT_ARM", "FRONT", "outer").atlas).toEqual({ x: 52, y: 52, w: 4, h: 12 });
    expect(getFace("RIGHT_LEG", "FRONT", "outer").atlas).toEqual({ x: 4, y: 36, w: 4, h: 12 });
    expect(getFace("LEFT_LEG", "FRONT", "outer").atlas).toEqual({ x: 4, y: 52, w: 4, h: 12 });
  });

  it("keeps every face inside the 64x64 atlas and never overlaps another", () => {
    const owner = new Map<number, string>();
    for (const face of ALL_FACES) {
      const { x, y, w, h } = face.atlas;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(x + w).toBeLessThanOrEqual(SKIN_SIZE);
      expect(y + h).toBeLessThanOrEqual(SKIN_SIZE);
      for (let ty = y; ty < y + h; ty++) {
        for (let tx = x; tx < x + w; tx++) {
          const key = ty * SKIN_SIZE + tx;
          expect(owner.get(key)).toBeUndefined();
          owner.set(key, face.id);
        }
      }
    }
  });

  it("resolves overlay texels back to the overlay face", () => {
    const found = faceAtAtlas(20, 36);
    expect(found?.face.id).toBe("torso.front.outer");
    expect(found?.face.layer).toBe("outer");
    expect(faceAtAtlas(20, 20)?.face.layer).toBe("inner");
  });
});
