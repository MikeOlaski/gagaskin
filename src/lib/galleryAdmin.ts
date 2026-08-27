import { imageToSkinBuffer } from "@/domain/skin/importExport";
import { renderAllGalleryViews } from "@/domain/skin/poseRender";
import type { SkinBuffer } from "@/domain/skin/skinBuffer";
import { supabase } from "@/integrations/supabase/client";
import { table } from "@/lib/db";
import { publicImageUrl, type GallerySkin } from "@/lib/gallery";

/**
 * Re-renders a gallery entry's posed views from its stored canonical 64x64 PNG.
 * Entries published before posed rendering existed have no Iso / 4 up / 2 up
 * images, so every view falls back to the old square render.
 */
async function loadSkinFromUrl(url: string): Promise<SkinBuffer> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.crossOrigin = "anonymous";
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(`Could not load ${url}`));
    el.src = url;
  });
  return imageToSkinBuffer(img);
}

export async function rerenderGalleryEntry(skin: GallerySkin): Promise<void> {
  if (!skin.skinPngPath) throw new Error(`${skin.title} has no stored skin PNG.`);
  const buffer = await loadSkinFromUrl(publicImageUrl(skin.skinPngPath));
  const views = await renderAllGalleryViews(buffer);
  const stamp = Date.now();
  const base = `gallery/${skin.id}`;
  const paths: Record<string, string> = {};
  for (const [view, blob] of Object.entries(views)) {
    const path = `${base}/view-${view}-${stamp}.png`;
    const { error } = await supabase.storage
      .from("gallery")
      .upload(path, blob, { contentType: "image/png", upsert: true });
    if (error) throw error;
    paths[view] = path;
  }
  const { error } = await table("gallery_skins")
    .update({
      render_iso_path: paths["iso"],
      render_quad_path: paths["quad"],
      render_duo_path: paths["duo"],
    })
    .eq("id", skin.id);
  if (error) throw new Error(error.message);
}
