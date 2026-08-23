import { getFace, type BodyPart, type FaceName } from "./faceRegistry";
import {
  createBlankSkin,
  fillRect,
  hexToRgba,
  setPixel,
  type SkinBuffer,
} from "./skinBuffer";

const SKIN_TONE = "#c98f68";
const SKIN_SHADE = "#b57f5b";
const HAIR = "#3b2717";
const SHIRT = "#2f8f8a";
const SHIRT_SHADE = "#26746f";
const PANTS = "#3a4a86";
const PANTS_SHADE = "#313f72";
const SHOES = "#4a4a52";
const EYE_WHITE = "#e8e8e8";
const EYE_IRIS = "#2f4f8f";

function fill(skin: SkinBuffer, part: BodyPart, face: FaceName, hex: string) {
  fillRect(skin, getFace(part, face).atlas, hexToRgba(hex));
}

function dot(skin: SkinBuffer, part: BodyPart, face: FaceName, lx: number, ly: number, hex: string) {
  const { atlas } = getFace(part, face);
  setPixel(skin, atlas.x + lx, atlas.y + ly, hexToRgba(hex));
}

/** A simple, fully opaque starter skin so users never open an empty canvas. */
export function createDemoSkin(): SkinBuffer {
  const skin = createBlankSkin();

  // Head
  fill(skin, "HEAD", "FRONT", SKIN_TONE);
  fill(skin, "HEAD", "LEFT", SKIN_SHADE);
  fill(skin, "HEAD", "RIGHT", SKIN_SHADE);
  fill(skin, "HEAD", "TOP", HAIR);
  fill(skin, "HEAD", "BACK", HAIR);
  fill(skin, "HEAD", "BOTTOM", SKIN_SHADE);
  for (let x = 0; x < 8; x++) {
    dot(skin, "HEAD", "FRONT", x, 0, HAIR);
    dot(skin, "HEAD", "FRONT", x, 1, HAIR);
    dot(skin, "HEAD", "LEFT", x, 0, HAIR);
    dot(skin, "HEAD", "RIGHT", x, 0, HAIR);
  }
  // eyes
  dot(skin, "HEAD", "FRONT", 1, 4, EYE_WHITE);
  dot(skin, "HEAD", "FRONT", 2, 4, EYE_IRIS);
  dot(skin, "HEAD", "FRONT", 5, 4, EYE_IRIS);
  dot(skin, "HEAD", "FRONT", 6, 4, EYE_WHITE);
  // mouth
  dot(skin, "HEAD", "FRONT", 3, 6, SKIN_SHADE);
  dot(skin, "HEAD", "FRONT", 4, 6, SKIN_SHADE);

  // Torso
  fill(skin, "TORSO", "FRONT", SHIRT);
  fill(skin, "TORSO", "BACK", SHIRT);
  fill(skin, "TORSO", "LEFT", SHIRT_SHADE);
  fill(skin, "TORSO", "RIGHT", SHIRT_SHADE);
  fill(skin, "TORSO", "TOP", SHIRT);
  fill(skin, "TORSO", "BOTTOM", PANTS);

  // Arms
  for (const part of ["LEFT_ARM", "RIGHT_ARM"] as BodyPart[]) {
    fill(skin, part, "FRONT", SHIRT);
    fill(skin, part, "BACK", SHIRT);
    fill(skin, part, "LEFT", SHIRT_SHADE);
    fill(skin, part, "RIGHT", SHIRT_SHADE);
    fill(skin, part, "TOP", SHIRT);
    fill(skin, part, "BOTTOM", SKIN_TONE);
    // forearms / hands
    for (const face of ["FRONT", "BACK", "LEFT", "RIGHT"] as FaceName[]) {
      const tone = face === "FRONT" || face === "BACK" ? SKIN_TONE : SKIN_SHADE;
      for (let y = 8; y < 12; y++) {
        for (let x = 0; x < 4; x++) dot(skin, part, face, x, y, tone);
      }
    }
  }

  // Legs
  for (const part of ["LEFT_LEG", "RIGHT_LEG"] as BodyPart[]) {
    fill(skin, part, "FRONT", PANTS);
    fill(skin, part, "BACK", PANTS);
    fill(skin, part, "LEFT", PANTS_SHADE);
    fill(skin, part, "RIGHT", PANTS_SHADE);
    fill(skin, part, "TOP", PANTS);
    fill(skin, part, "BOTTOM", SHOES);
    for (const face of ["FRONT", "BACK", "LEFT", "RIGHT"] as FaceName[]) {
      for (let y = 10; y < 12; y++) {
        for (let x = 0; x < 4; x++) dot(skin, part, face, x, y, SHOES);
      }
    }
  }

  return skin;
}

/**
 * Orientation diagnostic skin (QA test 11):
 * FRONT red, BACK blue, LEFT green, RIGHT yellow, TOP white, BOTTOM black.
 */
export const DIAGNOSTIC_COLORS: Record<FaceName, string> = {
  FRONT: "#e02020",
  BACK: "#2040e0",
  LEFT: "#20c040",
  RIGHT: "#e8d020",
  TOP: "#ffffff",
  BOTTOM: "#101010",
};

export function createDiagnosticSkin(): SkinBuffer {
  const skin = createBlankSkin();
  const parts: BodyPart[] = ["HEAD", "TORSO", "LEFT_ARM", "RIGHT_ARM", "LEFT_LEG", "RIGHT_LEG"];
  for (const part of parts) {
    for (const face of Object.keys(DIAGNOSTIC_COLORS) as FaceName[]) {
      fill(skin, part, face, DIAGNOSTIC_COLORS[face]);
    }
  }
  return skin;
}
