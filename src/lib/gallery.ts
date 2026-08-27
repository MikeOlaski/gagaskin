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
  authorHandle: string | null;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  downloadCount: number;
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
    authorHandle: (row["author_handle"] as string | null) ?? null,
    published: row["published"] as boolean,
    featured: (row["featured"] as boolean | null) ?? false,
    sortOrder: row["sort_order"] as number,
    downloadCount: (row["download_count"] as number | null) ?? 0,
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

/** Handles of makers who have at least one published skin, in gallery order. */
export function makerHandles(skins: readonly GallerySkin[]): string[] {
  const seen: string[] = [];
  for (const s of skins) {
    if (s.authorHandle && !seen.includes(s.authorHandle)) seen.push(s.authorHandle);
  }
  return seen;
}
