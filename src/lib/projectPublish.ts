import { getFace, type BodyPart } from "@/domain/skin/faceRegistry";
import { renderAllGalleryViews } from "@/domain/skin/poseRender";
import { writeSkinToCanvas, type SkinBuffer } from "@/domain/skin/skinBuffer";
import { supabase } from "@/integrations/supabase/client";
import { table } from "@/lib/db";
import type { OfferId } from "@/lib/offers";

export interface ProjectGalleryEntry {
  id: string;
  projectId: string;
  title: string;
  published: boolean;
  madeWith: OfferId;
}

const FRONT_PANELS: Array<{ part: BodyPart; x: number; y: number }> = [
  { part: "HEAD", x: 4, y: 0 },
  { part: "TORSO", x: 4, y: 8 },
  { part: "RIGHT_ARM", x: 0, y: 8 },
  { part: "LEFT_ARM", x: 12, y: 8 },
  { part: "RIGHT_LEG", x: 4, y: 20 },
  { part: "LEFT_LEG", x: 8, y: 20 },
];

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode PNG."))), "image/png");
  });
}

/** 64×64 canonical texture as a PNG blob — never a preview canvas. */
async function skinPngBlob(skin: SkinBuffer): Promise<Blob> {
  const canvas = document.createElement("canvas");
  writeSkinToCanvas(skin, canvas);
  return canvasToBlob(canvas);
}

/** Nearest-neighbour front-view render used as the gallery thumbnail. */
async function frontRenderBlob(skin: SkinBuffer, cell = 16): Promise<Blob> {
  const source = document.createElement("canvas");
  writeSkinToCanvas(skin, source);
  const canvas = document.createElement("canvas");
  canvas.width = 16 * cell;
  canvas.height = 32 * cell;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable.");
  ctx.imageSmoothingEnabled = false;
  for (const panel of FRONT_PANELS) {
    const { atlas } = getFace(panel.part, "FRONT");
    ctx.drawImage(
      source,
      atlas.x,
      atlas.y,
      atlas.w,
      atlas.h,
      panel.x * cell,
      panel.y * cell,
      atlas.w * cell,
      atlas.h * cell,
    );
  }
  return canvasToBlob(canvas);
}

async function upload(blob: Blob, path: string): Promise<string> {
  const { error } = await supabase.storage
    .from("gallery")
    .upload(path, blob, { contentType: "image/png", upsert: true });
  if (error) throw error;
  return path;
}

export async function fetchProjectGalleryEntry(
  projectId: string,
): Promise<ProjectGalleryEntry | null> {
  const { data, error } = await table("gallery_skins")
    .select("id, project_id, title, published, made_with")
    .eq("project_id", projectId);
  if (error) throw new Error(error.message);
  const row = (data ?? [])[0];
  if (!row) return null;
  return {
    id: row["id"] as string,
    projectId,
    title: row["title"] as string,
    published: row["published"] as boolean,
    madeWith: row["made_with"] as OfferId,
  };
}

/**
 * Publish (or refresh) a project in the public gallery. The published images are
 * rendered from the canonical texture, so editor chrome can never leak into them.
 */
export async function publishProject(args: {
  projectId: string;
  title: string;
  skin: SkinBuffer;
  madeWith?: OfferId;
}): Promise<void> {
  const [skinBlob, renderBlob, views] = await Promise.all([
    skinPngBlob(args.skin),
    frontRenderBlob(args.skin),
    renderAllGalleryViews(args.skin),
  ]);
  const base = `projects/${args.projectId}`;
  const stamp = Date.now();
  const [skinPath, ingamePath, isoPath, quadPath, duoPath] = await Promise.all([
    upload(skinBlob, `${base}/skin.png`),
    upload(renderBlob, `${base}/ingame.png`),
    upload(views.iso, `${base}/view-iso-${stamp}.png`),
    upload(views.quad, `${base}/view-quad-${stamp}.png`),
    upload(views.duo, `${base}/view-duo-${stamp}.png`),
  ]);

  const existing = await fetchProjectGalleryEntry(args.projectId);
  const values = {
    title: args.title,
    inspiration_path: ingamePath,
    ingame_path: ingamePath,
    skin_png_path: skinPath,
    render_iso_path: isoPath,
    render_quad_path: quadPath,
    render_duo_path: duoPath,
    made_with: args.madeWith ?? "custom",
    published: true,
  };
  const { error } = existing
    ? await table("gallery_skins").update(values).eq("id", existing.id)
    : await table("gallery_skins").insert({ ...values, project_id: args.projectId });
  if (error) throw new Error(error.message);
}

export async function setProjectPublished(entryId: string, published: boolean): Promise<void> {
  const { error } = await table("gallery_skins").update({ published }).eq("id", entryId);
  if (error) throw new Error(error.message);
}
