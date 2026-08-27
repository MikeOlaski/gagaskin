ALTER TABLE public.gallery_skins
  ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.skin_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skin_id uuid NOT NULL REFERENCES public.gallery_skins(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skin_downloads_skin ON public.skin_downloads(skin_id);

GRANT ALL ON public.skin_downloads TO service_role;

ALTER TABLE public.skin_downloads ENABLE ROW LEVEL SECURITY;

-- Reads are for the skin's owner (their own stats) and guardians. Writes only
-- ever happen through record_skin_download(), which is security definer.
CREATE POLICY "Owners read downloads of their skins"
  ON public.skin_downloads FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.gallery_skins g
    JOIN public.skin_projects p ON p.id = g.project_id
    WHERE g.id = skin_downloads.skin_id AND p.user_id = auth.uid()
  ));

CREATE POLICY "Guardian reads every download"
  ON public.skin_downloads FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'guardian'));

GRANT SELECT ON public.skin_downloads TO authenticated;

CREATE OR REPLACE FUNCTION public.record_skin_download(_skin uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only published skins can be counted; anything else is silently ignored.
  UPDATE public.gallery_skins
     SET download_count = download_count + 1
   WHERE id = _skin AND published = true;

  IF FOUND THEN
    INSERT INTO public.skin_downloads (skin_id, user_id) VALUES (_skin, auth.uid());
  END IF;
END; $$;

REVOKE EXECUTE ON FUNCTION public.record_skin_download(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.record_skin_download(uuid) TO anon, authenticated;