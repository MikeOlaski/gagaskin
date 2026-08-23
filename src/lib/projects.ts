import { supabase } from "@/integrations/supabase/client";
import type { SkinPlan } from "@/domain/skin/autoDesign";
import { createBlankSkin, type SkinBuffer } from "@/domain/skin/skinBuffer";

export interface SkinProjectRow {
  id: string;
  name: string;
  skin_png: string;
  reference_data_url: string | null;
  palette: string[];
  plan: SkinPlan | null;
  view_state: ProjectViewState;
  updated_at: string;
}

export interface ProjectViewState {
  selectedFaceId?: string | null;
  cellSize?: number;
  color?: string;
  tool?: string;
}

export interface ProjectSnapshot {
  name: string;
  skin: SkinBuffer;
  referenceDataUrl: string | null;
  palette: string[];
  plan: SkinPlan | null;
  viewState: ProjectViewState;
}

/** Raw RGBA bytes -> base64 (lossless, no canvas involved). */
export function encodeSkin(skin: SkinBuffer): string {
  let binary = "";
  for (let i = 0; i < skin.length; i++) binary += String.fromCharCode(skin[i]!);
  return btoa(binary);
}

export function decodeSkin(encoded: string): SkinBuffer {
  const binary = atob(encoded);
  const skin = createBlankSkin();
  const len = Math.min(binary.length, skin.length);
  for (let i = 0; i < len; i++) skin[i] = binary.charCodeAt(i);
  return skin;
}

/** Re-encode any image element as a PNG data URL so it can be persisted. */
export function imageToDataUrl(img: HTMLImageElement): string | null {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

export function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Saved reference image could not be decoded."));
    img.src = dataUrl;
  });
}

/** Supabase generated Json types reject our narrow interfaces; JSONB columns accept them. */
const json = (value: unknown) => value as never;

const COLUMNS = "id, name, skin_png, reference_data_url, palette, plan, view_state, updated_at";

export async function listProjects(): Promise<SkinProjectRow[]> {
  const { data, error } = await supabase
    .from("skin_projects")
    .select(COLUMNS)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as SkinProjectRow[];
}

export async function createProject(snapshot: ProjectSnapshot): Promise<SkinProjectRow> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("You need to be signed in to save projects.");
  const { data, error } = await supabase
    .from("skin_projects")
    .insert({
      user_id: userData.user.id,
      name: snapshot.name,
      skin_png: encodeSkin(snapshot.skin),
      reference_data_url: snapshot.referenceDataUrl,
      palette: json(snapshot.palette),
      plan: json(snapshot.plan),
      view_state: json(snapshot.viewState),
    })
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as SkinProjectRow;
}

export async function updateProject(
  id: string,
  snapshot: ProjectSnapshot,
): Promise<SkinProjectRow> {
  const { data, error } = await supabase
    .from("skin_projects")
    .update({
      name: snapshot.name,
      skin_png: encodeSkin(snapshot.skin),
      reference_data_url: snapshot.referenceDataUrl,
      palette: json(snapshot.palette),
      plan: json(snapshot.plan),
      view_state: json(snapshot.viewState),
    })
    .eq("id", id)
    .select(COLUMNS)
    .single();
  if (error) throw error;
  return data as unknown as SkinProjectRow;
}

export async function renameProject(id: string, name: string): Promise<void> {
  const { error } = await supabase.from("skin_projects").update({ name }).eq("id", id);
  if (error) throw error;
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from("skin_projects").delete().eq("id", id);
  if (error) throw error;
}
