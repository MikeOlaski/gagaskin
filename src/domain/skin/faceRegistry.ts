export type FaceName = "TOP" | "BOTTOM" | "FRONT" | "BACK" | "LEFT" | "RIGHT";

export type BodyPart = "HEAD" | "TORSO" | "LEFT_ARM" | "RIGHT_ARM" | "LEFT_LEG" | "RIGHT_LEG";

export interface AtlasRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Minecraft skins carry two layers per body part: the opaque inner (body) shell
 * and a slightly larger outer (overlay) shell where hair, hats, jackets, sleeves
 * and trouser legs live. Both live in the same 64×64 buffer.
 */
export type SkinLayer = "inner" | "outer";

export interface SkinFace {
  id: string;
  part: BodyPart;
  face: FaceName;
  front: boolean;
  layer: SkinLayer;
  atlas: AtlasRect;
}

export const SKIN_SIZE = 64;

export const PART_LABELS: Record<BodyPart, string> = {
  HEAD: "Head",
  TORSO: "Torso",
  LEFT_ARM: "Left arm",
  RIGHT_ARM: "Right arm",
  LEFT_LEG: "Left leg",
  RIGHT_LEG: "Right leg",
};

/**
 * Authoritative UV registry — values transcribed from docs/SKIN_UV_MAPPING_SPEC.md.
 * Origin top-left, x right, y down, texel units. Contains no UI positions.
 */
const RAW: Record<BodyPart, Record<FaceName, AtlasRect>> = {
  HEAD: {
    TOP: { x: 8, y: 0, w: 8, h: 8 },
    BOTTOM: { x: 16, y: 0, w: 8, h: 8 },
    RIGHT: { x: 0, y: 8, w: 8, h: 8 },
    FRONT: { x: 8, y: 8, w: 8, h: 8 },
    LEFT: { x: 16, y: 8, w: 8, h: 8 },
    BACK: { x: 24, y: 8, w: 8, h: 8 },
  },
  TORSO: {
    TOP: { x: 20, y: 16, w: 8, h: 4 },
    BOTTOM: { x: 28, y: 16, w: 8, h: 4 },
    RIGHT: { x: 16, y: 20, w: 4, h: 12 },
    FRONT: { x: 20, y: 20, w: 8, h: 12 },
    LEFT: { x: 28, y: 20, w: 4, h: 12 },
    BACK: { x: 32, y: 20, w: 8, h: 12 },
  },
  RIGHT_ARM: {
    TOP: { x: 44, y: 16, w: 4, h: 4 },
    BOTTOM: { x: 48, y: 16, w: 4, h: 4 },
    RIGHT: { x: 40, y: 20, w: 4, h: 12 },
    FRONT: { x: 44, y: 20, w: 4, h: 12 },
    LEFT: { x: 48, y: 20, w: 4, h: 12 },
    BACK: { x: 52, y: 20, w: 4, h: 12 },
  },
  RIGHT_LEG: {
    TOP: { x: 4, y: 16, w: 4, h: 4 },
    BOTTOM: { x: 8, y: 16, w: 4, h: 4 },
    RIGHT: { x: 0, y: 20, w: 4, h: 12 },
    FRONT: { x: 4, y: 20, w: 4, h: 12 },
    LEFT: { x: 8, y: 20, w: 4, h: 12 },
    BACK: { x: 12, y: 20, w: 4, h: 12 },
  },
  LEFT_LEG: {
    TOP: { x: 20, y: 48, w: 4, h: 4 },
    BOTTOM: { x: 24, y: 48, w: 4, h: 4 },
    RIGHT: { x: 16, y: 52, w: 4, h: 12 },
    FRONT: { x: 20, y: 52, w: 4, h: 12 },
    LEFT: { x: 24, y: 52, w: 4, h: 12 },
    BACK: { x: 28, y: 52, w: 4, h: 12 },
  },
  LEFT_ARM: {
    TOP: { x: 36, y: 48, w: 4, h: 4 },
    BOTTOM: { x: 40, y: 48, w: 4, h: 4 },
    RIGHT: { x: 32, y: 52, w: 4, h: 12 },
    FRONT: { x: 36, y: 52, w: 4, h: 12 },
    LEFT: { x: 40, y: 52, w: 4, h: 12 },
    BACK: { x: 44, y: 52, w: 4, h: 12 },
  },
};

const PART_ID: Record<BodyPart, string> = {
  HEAD: "head",
  TORSO: "torso",
  LEFT_ARM: "leftArm",
  RIGHT_ARM: "rightArm",
  LEFT_LEG: "leftLeg",
  RIGHT_LEG: "rightLeg",
};

export const FACE_ORDER: FaceName[] = ["TOP", "BOTTOM", "FRONT", "BACK", "LEFT", "RIGHT"];
export const PART_ORDER: BodyPart[] = [
  "HEAD",
  "TORSO",
  "LEFT_ARM",
  "RIGHT_ARM",
  "LEFT_LEG",
  "RIGHT_LEG",
];

/**
 * Overlay block origin minus inner block origin, in texels (from the vanilla
 * 64×64 layout): head 0,0→32,0 · torso 16,16→16,32 · right arm 40,16→40,32 ·
 * left arm 32,48→48,48 · right leg 0,16→0,32 · left leg 16,48→0,48.
 */
const OUTER_DELTA: Record<BodyPart, { dx: number; dy: number }> = {
  HEAD: { dx: 32, dy: 0 },
  TORSO: { dx: 0, dy: 16 },
  RIGHT_ARM: { dx: 0, dy: 16 },
  LEFT_ARM: { dx: 16, dy: 0 },
  RIGHT_LEG: { dx: 0, dy: 16 },
  LEFT_LEG: { dx: -16, dy: 0 },
};

export function faceId(part: BodyPart, face: FaceName, layer: SkinLayer = "inner"): string {
  const base = `${PART_ID[part]}.${face.toLowerCase()}`;
  return layer === "outer" ? `${base}.outer` : base;
}

function buildFaces(layer: SkinLayer): SkinFace[] {
  return PART_ORDER.flatMap((part) =>
    FACE_ORDER.map((face) => {
      const base = RAW[part][face];
      const d = OUTER_DELTA[part];
      return {
        id: faceId(part, face, layer),
        part,
        face,
        front: face === "FRONT",
        layer,
        atlas:
          layer === "inner"
            ? base
            : { x: base.x + d.dx, y: base.y + d.dy, w: base.w, h: base.h },
      };
    }),
  );
}

/** Inner (body) layer faces — the historical registry. */
export const FACES: SkinFace[] = buildFaces("inner");
/** Outer (overlay) layer faces — hair, hats, jackets, sleeves, boots. */
export const OUTER_FACES: SkinFace[] = buildFaces("outer");
export const ALL_FACES: SkinFace[] = [...FACES, ...OUTER_FACES];

export const FACE_BY_ID: Record<string, SkinFace> = Object.fromEntries(
  ALL_FACES.map((f) => [f.id, f]),
);

export function getFace(part: BodyPart, face: FaceName, layer: SkinLayer = "inner"): SkinFace {
  return FACE_BY_ID[faceId(part, face, layer)]!;
}

export function facesForLayer(layer: SkinLayer): SkinFace[] {
  return layer === "inner" ? FACES : OUTER_FACES;
}

/**
 * Reverse lookup: which registered face owns an atlas texel, plus that texel's
 * coordinates inside the face. Used by 3D painting, where a ray hit yields an
 * atlas UV rather than a face id.
 */
export function faceAtAtlas(
  atlasX: number,
  atlasY: number,
): { face: SkinFace; localX: number; localY: number } | null {
  for (const face of ALL_FACES) {
    const { x, y, w, h } = face.atlas;
    if (atlasX >= x && atlasX < x + w && atlasY >= y && atlasY < y + h) {
      return { face, localX: atlasX - x, localY: atlasY - y };
    }
  }
  return null;
}

export const ARM_PARTS: BodyPart[] = ["LEFT_ARM", "RIGHT_ARM"];

/**
 * Slim ("Alex") model: arms are 3 texels wide instead of 4. Minecraft keeps the
 * side faces 4 wide and shifts everything right of the front face left by one,
 * so the same 64×64 atlas serves both models.
 */
export function slimAtlas(face: SkinFace): AtlasRect {
  if (!ARM_PARTS.includes(face.part)) return face.atlas;
  const { x, y, w, h } = face.atlas;
  switch (face.face) {
    case "TOP":
      return { x, y, w: 3, h };
    case "BOTTOM":
      return { x: x - 1, y, w: 3, h };
    case "FRONT":
      return { x, y, w: 3, h };
    case "LEFT":
      return { x: x - 1, y, w, h };
    case "BACK":
      return { x: x - 1, y, w: 3, h };
    default:
      return face.atlas;
  }
}

export const OPPOSITE_PART: Partial<Record<BodyPart, BodyPart>> = {
  LEFT_ARM: "RIGHT_ARM",
  RIGHT_ARM: "LEFT_ARM",
  LEFT_LEG: "RIGHT_LEG",
  RIGHT_LEG: "LEFT_LEG",
};

/** Opposite-limb counterpart of a face, or null for head/torso. */
export function oppositeFace(face: SkinFace): SkinFace | null {
  const part = OPPOSITE_PART[face.part];
  if (!part) return null;
  return getFace(part, face.face);
}
