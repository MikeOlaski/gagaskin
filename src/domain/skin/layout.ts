import {
  FACE_BY_ID,
  faceId,
  getFace,
  type BodyPart,
  type FaceName,
  type SkinFace,
  type SkinLayer,
} from "./faceRegistry";

/**
 * Exploded editor layout. All positions are expressed in CELL units
 * (1 cell === 1 texel), so the rendered geometry is always
 * `atlas.w * cellSize` x `atlas.h * cellSize` — one global scale, no
 * per-face distortion.
 */
export interface FaceLayout {
  faceId: string;
  /** cell-space position, origin top-left of editor content box */
  x: number;
  y: number;
}

export interface GroupLayout {
  part: BodyPart;
  label: string;
  faces: FaceLayout[];
}

const place = (part: BodyPart, face: FaceName, x: number, y: number): FaceLayout => ({
  faceId: faceId(part, face),
  x,
  y,
});

// ── Horizontal bands ────────────────────────────────────────────────────────
// left arm 0..16 | gap | torso 18..34 | gap | right arm 36..52
const LEFT_ARM_X = 0;
const TORSO_X = 18;
const RIGHT_ARM_X = 36;

const TORSO_FRONT_X = TORSO_X + 4; // 22
const TORSO_CENTER = TORSO_FRONT_X + 4; // 26
const HEAD_ROW_X = TORSO_CENTER - 12; // 14 -> LEFT | FRONT | RIGHT (8 each)

// ── Vertical bands ─────────────────────────────────────────────────────────
const HEAD_TOP_Y = 0;
const HEAD_BACK_Y = 11;
const HEAD_BOTTOM_Y = 22;
const HEAD_ROW_Y = 33;

const TORSO_TOP_Y = 46; // 8x4
const LIMB_ROW_Y = 53; // all 12-tall side panels of torso + arms
const TORSO_BOTTOM_Y = 68; // 8x4
const TORSO_BACK_Y = 75; // 8x12

const LEG_TOP_Y = 92; // 4x4
const LEG_ROW_Y = 99; // 4x12
const LEG_BOTTOM_Y = 114; // 4x4

// legs: left group 8..24, 4 cells of whitespace, right group 28..44
const LEFT_LEG_X = 8;
const RIGHT_LEG_X = 28;

export const HEAD_GROUP: GroupLayout = {
  part: "HEAD",
  label: "Head",
  faces: [
    place("HEAD", "TOP", TORSO_FRONT_X, HEAD_TOP_Y),
    place("HEAD", "BACK", TORSO_FRONT_X, HEAD_BACK_Y),
    place("HEAD", "BOTTOM", TORSO_FRONT_X, HEAD_BOTTOM_Y),
    place("HEAD", "LEFT", HEAD_ROW_X, HEAD_ROW_Y),
    place("HEAD", "FRONT", HEAD_ROW_X + 8, HEAD_ROW_Y),
    place("HEAD", "RIGHT", HEAD_ROW_X + 16, HEAD_ROW_Y),
  ],
};

export const TORSO_GROUP: GroupLayout = {
  part: "TORSO",
  label: "Torso",
  faces: [
    place("TORSO", "TOP", TORSO_FRONT_X, TORSO_TOP_Y),
    place("TORSO", "LEFT", TORSO_X, LIMB_ROW_Y),
    place("TORSO", "FRONT", TORSO_FRONT_X, LIMB_ROW_Y),
    place("TORSO", "RIGHT", TORSO_FRONT_X + 8, LIMB_ROW_Y),
    place("TORSO", "BOTTOM", TORSO_FRONT_X, TORSO_BOTTOM_Y),
    place("TORSO", "BACK", TORSO_FRONT_X, TORSO_BACK_Y),
  ],
};

// LEFT ARM: BACK | RIGHT | LEFT | FRONT  (FRONT nearest torso, i.e. rightmost)
export const LEFT_ARM_GROUP: GroupLayout = {
  part: "LEFT_ARM",
  label: "Left arm",
  faces: [
    place("LEFT_ARM", "BACK", LEFT_ARM_X, LIMB_ROW_Y),
    place("LEFT_ARM", "RIGHT", LEFT_ARM_X + 4, LIMB_ROW_Y),
    place("LEFT_ARM", "LEFT", LEFT_ARM_X + 8, LIMB_ROW_Y),
    place("LEFT_ARM", "FRONT", LEFT_ARM_X + 12, LIMB_ROW_Y),
    place("LEFT_ARM", "TOP", LEFT_ARM_X + 12, TORSO_TOP_Y),
    place("LEFT_ARM", "BOTTOM", LEFT_ARM_X + 12, TORSO_BOTTOM_Y),
  ],
};

// RIGHT ARM: FRONT | LEFT | RIGHT | BACK (FRONT nearest torso, i.e. leftmost)
export const RIGHT_ARM_GROUP: GroupLayout = {
  part: "RIGHT_ARM",
  label: "Right arm",
  faces: [
    place("RIGHT_ARM", "FRONT", RIGHT_ARM_X, LIMB_ROW_Y),
    place("RIGHT_ARM", "LEFT", RIGHT_ARM_X + 4, LIMB_ROW_Y),
    place("RIGHT_ARM", "RIGHT", RIGHT_ARM_X + 8, LIMB_ROW_Y),
    place("RIGHT_ARM", "BACK", RIGHT_ARM_X + 12, LIMB_ROW_Y),
    place("RIGHT_ARM", "TOP", RIGHT_ARM_X, TORSO_TOP_Y),
    place("RIGHT_ARM", "BOTTOM", RIGHT_ARM_X, TORSO_BOTTOM_Y),
  ],
};

// LEFT LEG: BACK | RIGHT | LEFT | FRONT (FRONT nearest body center, rightmost)
export const LEFT_LEG_GROUP: GroupLayout = {
  part: "LEFT_LEG",
  label: "Left leg",
  faces: [
    place("LEFT_LEG", "BACK", LEFT_LEG_X, LEG_ROW_Y),
    place("LEFT_LEG", "RIGHT", LEFT_LEG_X + 4, LEG_ROW_Y),
    place("LEFT_LEG", "LEFT", LEFT_LEG_X + 8, LEG_ROW_Y),
    place("LEFT_LEG", "FRONT", LEFT_LEG_X + 12, LEG_ROW_Y),
    place("LEFT_LEG", "TOP", LEFT_LEG_X + 12, LEG_TOP_Y),
    place("LEFT_LEG", "BOTTOM", LEFT_LEG_X + 12, LEG_BOTTOM_Y),
  ],
};

// RIGHT LEG: FRONT | LEFT | RIGHT | BACK (FRONT nearest body center, leftmost)
export const RIGHT_LEG_GROUP: GroupLayout = {
  part: "RIGHT_LEG",
  label: "Right leg",
  faces: [
    place("RIGHT_LEG", "FRONT", RIGHT_LEG_X, LEG_ROW_Y),
    place("RIGHT_LEG", "LEFT", RIGHT_LEG_X + 4, LEG_ROW_Y),
    place("RIGHT_LEG", "RIGHT", RIGHT_LEG_X + 8, LEG_ROW_Y),
    place("RIGHT_LEG", "BACK", RIGHT_LEG_X + 12, LEG_ROW_Y),
    place("RIGHT_LEG", "TOP", RIGHT_LEG_X, LEG_TOP_Y),
    place("RIGHT_LEG", "BOTTOM", RIGHT_LEG_X, LEG_BOTTOM_Y),
  ],
};

export const EDITOR_GROUPS: GroupLayout[] = [
  HEAD_GROUP,
  TORSO_GROUP,
  LEFT_ARM_GROUP,
  RIGHT_ARM_GROUP,
  LEFT_LEG_GROUP,
  RIGHT_LEG_GROUP,
];

export const EDITOR_LAYOUT: FaceLayout[] = EDITOR_GROUPS.flatMap((g) => g.faces);

export interface PlacedFace extends FaceLayout {
  face: SkinFace;
}

export const PLACED_FACES: PlacedFace[] = EDITOR_LAYOUT.map((l) => ({
  ...l,
  face: FACE_BY_ID[l.faceId]!,
}));

export interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Cell-space bounds of a group (used by the leg-overlap regression test). */
export function groupBounds(group: GroupLayout): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const l of group.faces) {
    const f = FACE_BY_ID[l.faceId]!;
    minX = Math.min(minX, l.x);
    minY = Math.min(minY, l.y);
    maxX = Math.max(maxX, l.x + f.atlas.w);
    maxY = Math.max(maxY, l.y + f.atlas.h);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

export const LAYOUT_CELLS_W = Math.max(
  ...PLACED_FACES.map((p) => p.x + p.face.atlas.w),
);
export const LAYOUT_CELLS_H = Math.max(
  ...PLACED_FACES.map((p) => p.y + p.face.atlas.h),
);

/** Editor padding, in cell units. */
export const LAYOUT_PADDING = 2;
