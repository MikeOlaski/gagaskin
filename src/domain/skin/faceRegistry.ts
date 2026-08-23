export type FaceName = "TOP" | "BOTTOM" | "FRONT" | "BACK" | "LEFT" | "RIGHT";

export type BodyPart = "HEAD" | "TORSO" | "LEFT_ARM" | "RIGHT_ARM" | "LEFT_LEG" | "RIGHT_LEG";

export interface AtlasRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SkinFace {
  id: string;
  part: BodyPart;
  face: FaceName;
  front: boolean;
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

export const FACES: SkinFace[] = PART_ORDER.flatMap((part) =>
  FACE_ORDER.map((face) => ({
    id: `${PART_ID[part]}.${face.toLowerCase()}`,
    part,
    face,
    front: face === "FRONT",
    atlas: RAW[part][face],
  })),
);

export const FACE_BY_ID: Record<string, SkinFace> = Object.fromEntries(
  FACES.map((f) => [f.id, f]),
);

export function faceId(part: BodyPart, face: FaceName): string {
  return `${PART_ID[part]}.${face.toLowerCase()}`;
}

export function getFace(part: BodyPart, face: FaceName): SkinFace {
  return FACE_BY_ID[faceId(part, face)]!;
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
