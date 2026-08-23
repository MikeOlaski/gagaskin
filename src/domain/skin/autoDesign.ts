import { FACE_BY_ID, FACES, PART_LABELS, type BodyPart, type FaceName } from "./faceRegistry";
import { fillRect, hexToRgba, putFacePixels, type SkinBuffer } from "./skinBuffer";

/**
 * A "paint plan" describes, per skin face, where its pixels come from:
 * either a normalized crop of the reference image, or a flat color.
 * Plans are data only — applying one is a single undoable mutation.
 */
export interface PlanRegion {
  /** normalized 0..1 rect in reference-image space */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FacePlan {
  faceId: string;
  /** crop of the reference image, when present */
  source?: PlanRegion;
  /** flat fill color (hex), used when `source` is absent */
  color?: string;
  /** multiplier applied to RGB, for shading sides/back (default 1) */
  brightness?: number;
  /** short human-readable rationale */
  note?: string;
}

export type PlanOrigin = "deterministic" | "ai";

export interface SkinPlan {
  title: string;
  summary: string;
  origin: PlanOrigin;
  palette: string[];
  faces: FacePlan[];
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function region(x: number, y: number, w: number, h: number): PlanRegion {
  return { x: clamp01(x), y: clamp01(y), w: clamp01(w), h: clamp01(h) };
}

/* ------------------------------------------------------------------ */
/* Deterministic planner                                              */
/* ------------------------------------------------------------------ */

/**
 * Geometric heuristic: treat the reference as a front-facing subject and
 * slice it into head / torso / arm / leg bands, then derive side + back
 * faces from those bands with shading so the model reads as a solid figure.
 */
export function buildDeterministicPlan(palette: string[]): SkinPlan {
  const p = (i: number, fallback: string) => palette[i] ?? fallback;
  const skinTone = p(0, "#c68642");
  const accent = p(1, "#3b82f6");
  const dark = p(2, "#2f3542");

  const bands: Record<BodyPart, PlanRegion> = {
    HEAD: region(0.3, 0.0, 0.4, 0.28),
    TORSO: region(0.28, 0.28, 0.44, 0.34),
    LEFT_ARM: region(0.72, 0.28, 0.16, 0.34),
    RIGHT_ARM: region(0.12, 0.28, 0.16, 0.34),
    LEFT_LEG: region(0.5, 0.62, 0.2, 0.38),
    RIGHT_LEG: region(0.3, 0.62, 0.2, 0.38),
  };

  const shade: Record<FaceName, number> = {
    FRONT: 1,
    BACK: 0.82,
    LEFT: 0.9,
    RIGHT: 0.9,
    TOP: 1.05,
    BOTTOM: 0.7,
  };

  const faces: FacePlan[] = FACES.map((f) => {
    const band = bands[f.part];
    // TOP / BOTTOM caps read better as flat tones sampled from the palette
    if (f.face === "TOP" || f.face === "BOTTOM") {
      const flat = f.part === "HEAD" ? skinTone : f.part === "TORSO" ? accent : dark;
      return {
        faceId: f.id,
        color: flat,
        brightness: shade[f.face],
        note: `${PART_LABELS[f.part]} cap from palette`,
      };
    }
    // side faces sample a narrow slice of the band so wrapping stays continuous
    const src =
      f.face === "FRONT" || f.face === "BACK"
        ? band
        : region(f.face === "LEFT" ? band.x + band.w * 0.6 : band.x, band.y, band.w * 0.4, band.h);
    return {
      faceId: f.id,
      source: src,
      brightness: shade[f.face],
      note: `${PART_LABELS[f.part]} ${f.face.toLowerCase()} from reference band`,
    };
  });

  return {
    title: "Geometric auto-map",
    summary:
      "Reference sliced into head, torso, arm and leg bands; side and back faces derived from the same bands with directional shading. Fully offline and deterministic.",
    origin: "deterministic",
    palette,
    faces,
  };
}

/* ------------------------------------------------------------------ */
/* Validation (AI output is untrusted)                                */
/* ------------------------------------------------------------------ */

const HEX = /^#[0-9a-fA-F]{6}$/;

export function normalizePlan(raw: unknown, palette: string[], origin: PlanOrigin): SkinPlan | null {
  if (typeof raw !== "object" || raw === null) return null;
  const obj = raw as Record<string, unknown>;
  const rawFaces = Array.isArray(obj.faces) ? obj.faces : [];
  const seen = new Set<string>();
  const faces: FacePlan[] = [];

  for (const entry of rawFaces) {
    if (typeof entry !== "object" || entry === null) continue;
    const e = entry as Record<string, unknown>;
    const faceId = typeof e.faceId === "string" ? e.faceId : "";
    if (!FACE_BY_ID[faceId] || seen.has(faceId)) continue;

    const brightness =
      typeof e.brightness === "number" && Number.isFinite(e.brightness)
        ? Math.min(2, Math.max(0.2, e.brightness))
        : 1;
    const color = typeof e.color === "string" && HEX.test(e.color) ? e.color : undefined;
    const s = typeof e.source === "object" && e.source !== null ? (e.source as Record<string, unknown>) : null;
    let source: PlanRegion | undefined;
    if (s && ["x", "y", "w", "h"].every((k) => typeof s[k] === "number")) {
      const r = region(s.x as number, s.y as number, s.w as number, s.h as number);
      if (r.w > 0.01 && r.h > 0.01) source = r;
    }
    if (!source && !color) continue;

    seen.add(faceId);
    faces.push({
      faceId,
      source,
      color,
      brightness,
      note: typeof e.note === "string" ? e.note.slice(0, 120) : undefined,
    });
  }

  if (faces.length === 0) return null;

  return {
    title: typeof obj.title === "string" && obj.title ? obj.title.slice(0, 80) : "AI paint plan",
    summary: typeof obj.summary === "string" ? obj.summary.slice(0, 400) : "",
    origin,
    palette,
    faces,
  };
}

/* ------------------------------------------------------------------ */
/* Application                                                        */
/* ------------------------------------------------------------------ */

function shadePixels(data: Uint8ClampedArray, brightness: number) {
  if (brightness === 1) return;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.round(data[i]! * brightness));
    data[i + 1] = Math.min(255, Math.round(data[i + 1]! * brightness));
    data[i + 2] = Math.min(255, Math.round(data[i + 2]! * brightness));
  }
}

/**
 * Apply a plan to the canonical 64x64 buffer. Never touches any visible
 * canvas — the caller owns snapshot/undo bookkeeping.
 */
export function applyPlan(
  skin: SkinBuffer,
  plan: SkinPlan,
  source: CanvasImageSource | null,
  sourceWidth = 0,
  sourceHeight = 0,
): void {
  for (const fp of plan.faces) {
    const face = FACE_BY_ID[fp.faceId];
    if (!face) continue;
    const rect = face.atlas;
    const brightness = fp.brightness ?? 1;

    if (!fp.source || !source || sourceWidth <= 0 || sourceHeight <= 0) {
      const hex = fp.color ?? plan.palette[0] ?? "#888888";
      const rgba = hexToRgba(hex, 255);
      fillRect(skin, rect, {
        r: Math.min(255, Math.round(rgba.r * brightness)),
        g: Math.min(255, Math.round(rgba.g * brightness)),
        b: Math.min(255, Math.round(rgba.b * brightness)),
        a: 255,
      });
      continue;
    }

    const canvas = document.createElement("canvas");
    canvas.width = rect.w;
    canvas.height = rect.h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) continue;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, rect.w, rect.h);

    const sx = fp.source.x * sourceWidth;
    const sy = fp.source.y * sourceHeight;
    const sw = Math.max(1, fp.source.w * sourceWidth);
    const sh = Math.max(1, fp.source.h * sourceHeight);
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, rect.w, rect.h);

    const { data } = ctx.getImageData(0, 0, rect.w, rect.h);
    shadePixels(data, brightness);
    // plans produce an opaque skin; drop stray alpha from the reference
    for (let i = 3; i < data.length; i += 4) if (data[i]! > 8) data[i] = 255;
    putFacePixels(skin, rect, data);
  }
}
