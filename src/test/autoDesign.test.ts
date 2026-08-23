import { describe, expect, it } from "vitest";

import { buildDeterministicPlan, normalizePlan } from "@/domain/skin/autoDesign";
import { FACES } from "@/domain/skin/faceRegistry";

describe("deterministic plan", () => {
  const plan = buildDeterministicPlan(["#112233", "#445566", "#778899"]);

  it("covers every face exactly once", () => {
    expect(plan.faces).toHaveLength(FACES.length);
    expect(new Set(plan.faces.map((f) => f.faceId)).size).toBe(FACES.length);
  });

  it("keeps crops inside the 0..1 image space", () => {
    for (const f of plan.faces) {
      if (!f.source) continue;
      expect(f.source.x).toBeGreaterThanOrEqual(0);
      expect(f.source.y).toBeGreaterThanOrEqual(0);
      expect(f.source.x + f.source.w).toBeLessThanOrEqual(1.0001);
      expect(f.source.y + f.source.h).toBeLessThanOrEqual(1.0001);
    }
  });

  it("plans left and right limbs independently", () => {
    const l = plan.faces.find((f) => f.faceId === "leftArm.front")!.source!;
    const r = plan.faces.find((f) => f.faceId === "rightArm.front")!.source!;
    expect(l.x).not.toBe(r.x);
  });
});

describe("plan validation", () => {
  it("rejects unknown faces, bad colors and empty crops", () => {
    const plan = normalizePlan(
      {
        title: "t",
        faces: [
          { faceId: "nope.front", color: "#ffffff" },
          { faceId: "head.front", color: "red" },
          { faceId: "torso.front", source: { x: 0, y: 0, w: 0, h: 0 } },
          { faceId: "head.top", color: "#ABCDEF", brightness: 99 },
        ],
      },
      [],
      "ai",
    );
    expect(plan?.faces.map((f) => f.faceId)).toEqual(["head.top"]);
    expect(plan?.faces[0]?.brightness).toBe(2);
  });

  it("returns null when nothing is usable", () => {
    expect(normalizePlan({ faces: [] }, [], "ai")).toBeNull();
    expect(normalizePlan("garbage", [], "ai")).toBeNull();
  });
});
