ALTER TABLE public.gallery_skins
  ADD COLUMN IF NOT EXISTS render_iso_path text,
  ADD COLUMN IF NOT EXISTS render_quad_path text,
  ADD COLUMN IF NOT EXISTS render_duo_path text;