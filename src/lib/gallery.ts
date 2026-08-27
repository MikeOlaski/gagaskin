import { supabase } from "@/integrations/supabase/client";
import { table } from "@/lib/db";
import type { GalleryView } from "@/domain/skin/poseRender";
import type { OfferId } from "@/lib/offers";

export interface GallerySkin {
  id: string;
  title: string;
  inspirationPath: string;
  ingamePath: string;
  skinPngPath: string | null;
  renderIsoPath: string | null;
  renderQuadPath: string | null;
  renderDuoPath: string | null;
  madeWith: OfferId;
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface PublishSkinInput {
  title: string;
  inspirationPath: string;
  ingamePath: string;
  skinPngPath: string | null;
  madeWith: OfferId;
  sortOrder: number;
}

export function sortGallery(skins: readonly GallerySkin[]): GallerySkin[] {
  return [...skins].sort(
    (a, b) => a.sortOrder - b.sortOrder || Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function publicImageUrl(path: string): string {
  return supabase.storage.from("gallery").getPublicUrl(path).data.publicUrl;
}

/**
 * The gallery shows a posed render only. Entries published before posed
 * rendering existed fall back to their stored in-game render.
 */
export function galleryViewPath(skin: GallerySkin, view: GalleryView): string {
  const byView =
    view === "iso" ? skin.renderIsoPath : view === "quad" ? skin.renderQuadPath : skin.renderDuoPath;
  return byView ?? skin.renderIsoPath ?? skin.ingamePath;
}

function fromRow(row: Record<string, unknown>): GallerySkin {
  return {
    id: row["id"] as string,
    title: row["title"] as string,
    inspirationPath: row["inspiration_path"] as string,
    ingamePath: row["ingame_path"] as string,
    skinPngPath: (row["skin_png_path"] as string | null) ?? null,
    renderIsoPath: (row["render_iso_path"] as string | null) ?? null,
    renderQuadPath: (row["render_quad_path"] as string | null) ?? null,
    renderDuoPath: (row["render_duo_path"] as string | null) ?? null,
    madeWith: row["made_with"] as OfferId,
    published: row["published"] as boolean,
    sortOrder: row["sort_order"] as number,
    createdAt: row["created_at"] as string,
  };
}

export async function fetchPublishedSkins(): Promise<GallerySkin[]> {
  const { data, error } = await table("gallery_skins").select("*").eq("published", true);
  if (error) throw new Error(error.message);
  return sortGallery((data ?? []).map(fromRow));
}

/** Creator-only. RLS rejects this for anyone without the creator role. */
export async function publishSkin(input: PublishSkinInput): Promise<void> {
  const { error } = await table("gallery_skins").insert({
    title: input.title,
    inspiration_path: input.inspirationPath,
    ingame_path: input.ingamePath,
    skin_png_path: input.skinPngPath,
    made_with: input.madeWith,
    sort_order: input.sortOrder,
    published: true,
  });
  if (error) throw new Error(error.message);
}

export async function uploadGalleryImage(file: File, prefix: string): Promise<string> {
  const path = `${prefix}/${crypto.randomUUID()}-${file.name}`;
  const { error } = await supabase.storage.from("gallery").upload(path, file);
  if (error) throw error;
  return path;
}
