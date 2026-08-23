import { describe, expect, it } from "vitest";

import {
  FACES,
  FACE_BY_ID,
  SKIN_SIZE,
  getFace,
  oppositeFace,
  type BodyPart,
  type FaceName,
} from "@/domain/skin/faceRegistry";
import {
  EDITOR_GROUPS,
  HEAD_GROUP,
  LEFT_ARM_GROUP,
  LEFT_LEG_GROUP,
  PLACED_FACES,
  RIGHT_ARM_GROUP,
  RIGHT_LEG_GROUP,
  TORSO_GROUP,
  groupBounds,
} from "@/domain/skin/layout";

const EXPECTED: Record<string, [number, number, number, number]> = {
  "head.top": [8, 0, 8, 8],
  "head.bottom": [16, 0, 8, 8],
  "head.right": [0, 8, 8, 8],
  "head.front": [8, 8, 8, 8],
  "head.left": [16, 8, 8, 8],
  "head.back": [24, 8, 8, 8],
  "torso.top": [20, 16, 8, 4],
  "torso.bottom": [28, 16, 8, 4],
  "torso.right": [16, 20, 4, 12],
  "torso.front": [20, 20, 8, 12],
  "torso.left": [28, 20, 4, 12],
  "torso.back": [32, 20, 8, 12],
  "rightArm.top": [44, 16, 4, 4],
  "rightArm.bottom": [48, 16, 4, 4],
  "rightArm.right": [40, 20, 4, 12],
  "rightArm.front": [44, 20, 4, 12],
  "rightArm.left": [48, 20, 4, 12],
  "rightArm.back": [52, 20, 4, 12],
  "rightLeg.top": [4, 16, 4, 4],
  "rightLeg.bottom": [8, 16, 4, 4],
  "rightLeg.right": [0, 20, 4, 12],
  "rightLeg.front": [4, 20, 4, 12],
  "rightLeg.left": [8, 20, 4, 12],
  "rightLeg.back": [12, 20, 4, 12],
  "leftLeg.top": [20, 48, 4, 4],
  "leftLeg.bottom": [24, 48, 4, 4],
  "leftLeg.right": [16, 52, 4, 12],
  "leftLeg.front": [20, 52, 4, 12],
  "leftLeg.left": [24, 52, 4, 12],
  "leftLeg.back": [28, 52, 4, 12],
  "leftArm.top": [36, 48, 4, 4],
  "leftArm.bottom": [40, 48, 4, 4],
  "leftArm.right": [32, 52, 4, 12],
  "leftArm.front": [36, 52, 4, 12],
  "leftArm.left": [40, 52, 4, 12],
  "leftArm.back": [44, 52, 4, 12],
};

describe("UV registry", () => {
  it("registers exactly 36 faces", () => {
    expect(FACES).toHaveLength(36);
  });

  it("matches SKIN_UV_MAPPING_SPEC.md exactly", () => {
    expect(Object.keys(EXPECTED)).toHaveLength(36);
    for (const [id, [x, y, w, h]] of Object.entries(EXPECTED)) {
      const face = FACE_BY_ID[id];
      expect(face, id).toBeDefined();
      expect(face!.atlas, id).toEqual({ x, y, w, h });
    }
  });

  it("keeps every face inside the 64 x 64 texture", () => {
    for (const face of FACES) {
      expect(face.atlas.x).toBeGreaterThanOrEqual(0);
      expect(face.atlas.y).toBeGreaterThanOrEqual(0);
      expect(face.atlas.x + face.atlas.w).toBeLessThanOrEqual(SKIN_SIZE);
      expect(face.atlas.y + face.atlas.h).toBeLessThanOrEqual(SKIN_SIZE);
    }
  });

  it("uses the canonical face dimensions", () => {
    const dims = (part: BodyPart, face: FaceName) => {
      const a = getFace(part, face).atlas;
      return [a.w, a.h];
    };
    for (const face of ["TOP", "BOTTOM", "FRONT", "BACK", "LEFT", "RIGHT"] as FaceName[]) {
      expect(dims("HEAD", face)).toEqual([8, 8]);
    }
    expect(dims("TORSO", "FRONT")).toEqual([8, 12]);
    expect(dims("TORSO", "BACK")).toEqual([8, 12]);
    expect(dims("TORSO", "LEFT")).toEqual([4, 12]);
    expect(dims("TORSO", "RIGHT")).toEqual([4, 12]);
    expect(dims("TORSO", "TOP")).toEqual([8, 4]);
    expect(dims("TORSO", "BOTTOM")).toEqual([8, 4]);
    for (const part of ["LEFT_ARM", "RIGHT_ARM", "LEFT_LEG", "RIGHT_LEG"] as BodyPart[]) {
      for (const face of ["FRONT", "BACK", "LEFT", "RIGHT"] as FaceName[]) {
        expect(dims(part, face), `${part}.${face}`).toEqual([4, 12]);
      }
      expect(dims(part, "TOP")).toEqual([4, 4]);
      expect(dims(part, "BOTTOM")).toEqual([4, 4]);
    }
  });

  it("never overlaps two faces in the atlas", () => {
    const owner = new Map<number, string>();
    for (const face of FACES) {
      for (let y = face.atlas.y; y < face.atlas.y + face.atlas.h; y++) {
        for (let x = face.atlas.x; x < face.atlas.x + face.atlas.w; x++) {
          const key = y * SKIN_SIZE + x;
          expect(owner.get(key), `${face.id} overlaps ${owner.get(key)} at ${x},${y}`).toBeUndefined();
          owner.set(key, face.id);
        }
      }
    }
  });

  it("keeps left and right limbs independent", () => {
    for (const id of ["leftArm.front", "leftLeg.front", "leftLeg.left"]) {
      const face = FACE_BY_ID[id]!;
      const other = oppositeFace(face)!;
      expect(other.atlas).not.toEqual(face.atlas);
    }
    expect(oppositeFace(FACE_BY_ID["head.front"]!)).toBeNull();
    expect(oppositeFace(FACE_BY_ID["torso.front"]!)).toBeNull();
  });
});

describe("exploded editor layout", () => {
  const at = (groupFaces: { faceId: string; x: number; y: number }[], suffix: string) => {
    const found = groupFaces.find((f) => f.faceId.endsWith(`.${suffix}`));
    if (!found) throw new Error(`missing ${suffix}`);
    return found;
  };

  it("places every registered face exactly once", () => {
    expect(PLACED_FACES).toHaveLength(36);
    expect(new Set(PLACED_FACES.map((p) => p.faceId)).size).toBe(36);
  });

  it("stacks head TOP > BACK > BOTTOM > FRONT with LEFT/RIGHT flanking FRONT", () => {
    const g = HEAD_GROUP.faces;
    expect(at(g, "top").y).toBeLessThan(at(g, "back").y);
    expect(at(g, "back").y).toBeLessThan(at(g, "bottom").y);
    expect(at(g, "bottom").y).toBeLessThan(at(g, "front").y);
    expect(at(g, "left").x).toBeLessThan(at(g, "front").x);
    expect(at(g, "front").x).toBeLessThan(at(g, "right").x);
    expect(at(g, "left").y).toBe(at(g, "front").y);
    expect(at(g, "right").y).toBe(at(g, "front").y);
  });

  it("arranges the torso as TOP / LEFT|FRONT|RIGHT / BOTTOM / BACK", () => {
    const g = TORSO_GROUP.faces;
    expect(at(g, "top").y).toBeLessThan(at(g, "front").y);
    expect(at(g, "left").x).toBeLessThan(at(g, "front").x);
    expect(at(g, "front").x).toBeLessThan(at(g, "right").x);
    expect(at(g, "bottom").y).toBeGreaterThan(at(g, "front").y);
    expect(at(g, "back").y).toBeGreaterThan(at(g, "bottom").y);
    // BOTTOM and BACK centered under FRONT
    expect(at(g, "bottom").x).toBe(at(g, "front").x);
    expect(at(g, "back").x).toBe(at(g, "front").x);
  });

  it.each([
    ["left arm", LEFT_ARM_GROUP, ["back", "right", "left", "front"]],
    ["right arm", RIGHT_ARM_GROUP, ["front", "left", "right", "back"]],
    ["left leg", LEFT_LEG_GROUP, ["back", "right", "left", "front"]],
    ["right leg", RIGHT_LEG_GROUP, ["front", "left", "right", "back"]],
  ] as const)("orders %s side panels correctly with TOP/BOTTOM over FRONT", (_n, group, order) => {
    const g = group.faces;
    const xs = order.map((suffix) => at(g, suffix).x);
    expect([...xs].sort((a, b) => a - b)).toEqual(xs);
    const front = at(g, "front");
    expect(at(g, "top").x).toBe(front.x);
    expect(at(g, "bottom").x).toBe(front.x);
    expect(at(g, "top").y).toBeLessThan(front.y);
    expect(at(g, "bottom").y).toBeGreaterThan(front.y);
    // all four side panels share one row
    for (const suffix of order) expect(at(g, suffix).y).toBe(front.y);
  });

  it("keeps whitespace between the leg groups at every zoom level", () => {
    const left = groupBounds(LEFT_LEG_GROUP);
    const right = groupBounds(RIGHT_LEG_GROUP);
    const leftRightEdge = left.x + left.w;
    expect(leftRightEdge).toBeLessThan(right.x);
    for (const cellSize of [6, 12, 22]) {
      expect(leftRightEdge * cellSize).toBeLessThan(right.x * cellSize);
      expect(right.x * cellSize - leftRightEdge * cellSize).toBeGreaterThanOrEqual(4 * cellSize);
    }
  });

  it("never overlaps two rendered panels", () => {
    for (let i = 0; i < PLACED_FACES.length; i++) {
      for (let j = i + 1; j < PLACED_FACES.length; j++) {
        const a = PLACED_FACES[i]!;
        const b = PLACED_FACES[j]!;
        const overlap =
          a.x < b.x + b.face.atlas.w &&
          b.x < a.x + a.face.atlas.w &&
          a.y < b.y + b.face.atlas.h &&
          b.y < a.y + a.face.atlas.h;
        expect(overlap, `${a.faceId} overlaps ${b.faceId}`).toBe(false);
      }
    }
  });

  it("covers all six body groups", () => {
    expect(EDITOR_GROUPS.map((g) => g.part)).toEqual([
      "HEAD",
      "TORSO",
      "LEFT_ARM",
      "RIGHT_ARM",
      "LEFT_LEG",
      "RIGHT_LEG",
    ]);
  });
});
